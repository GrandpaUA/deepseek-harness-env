// sync-codex-token.mjs — синхронізує OAuth-токен ChatGPT (Codex CLI) в DSH.
// Читає ~/.codex/auth.json; якщо access_token близько до смерті (<2 днів) —
// рефрешить через auth.openai.com і пише нову пару назад в auth.json
// (refresh-токени ротуються, тому Codex CLI лишається в синхроні).
// Свіжий access_token пише в .credentials.yaml обох інстансів (prod + dev).
// Додатково перегенеровує список моделей openai-codex в settings.yaml
// обох інстансів з ~/.codex/models_cache.json (видимі + supported_in_api) —
// нові моделі Codex підтягуються самі, ручні правки не потрібні.
// DSH резолвить кредешели на кожен запит і хот-релоадить settings — рестарт не потрібен.
// Запуск: node scripts/sync-codex-token.mjs   (або за розкладом)
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const AUTH_JSON = join(homedir(), ".codex", "auth.json");
const MODELS_CACHE = join(homedir(), ".codex", "models_cache.json");
const CLIENT_ID = "app_EMoamEEZ73f0CkXaXp7hrann"; // публічний client_id Codex CLI
const TOKEN_URL = "https://auth.openai.com/oauth/token";
const HOMES = [
  "C:/All/Project/Vibecode/DeepSeek Harness",
  "C:/All/Project/Vibecode/DSH-Dev",
];
const CRED_FILES = HOMES.map((h) => `${h}/.credentials.yaml`);
const SETTINGS_FILES = HOMES.map((h) => `${h}/settings.yaml`);

function jwtExp(token) {
  return JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString()).exp;
}

if (!existsSync(AUTH_JSON)) {
  console.error("немає", AUTH_JSON, "— спочатку залогінься: codex login");
  process.exit(1);
}
const auth = JSON.parse(readFileSync(AUTH_JSON, "utf8"));
if (!auth.tokens?.access_token || !auth.tokens?.refresh_token) {
  console.error("auth.json без tokens — зроби codex login заново");
  process.exit(1);
}

let { access_token, refresh_token } = auth.tokens;
const exp = jwtExp(access_token);
const daysLeft = (exp * 1000 - Date.now()) / 86400000;
console.log(`access_token: живий ще ${daysLeft.toFixed(1)} дн`);

if (daysLeft < 2) {
  console.log("рефрешу...");
  const r = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: CLIENT_ID, grant_type: "refresh_token", refresh_token }),
  });
  const json = await r.json();
  if (!r.ok || !json.access_token || !json.refresh_token) {
    console.error("refresh FAIL:", r.status, JSON.stringify(json).slice(0, 300));
    process.exit(1);
  }
  access_token = json.access_token;
  refresh_token = json.refresh_token;
  auth.tokens = { ...auth.tokens, access_token, refresh_token };
  auth.last_refresh = new Date().toISOString();
  writeFileSync(AUTH_JSON, JSON.stringify(auth, null, 2), "utf8");
  console.log(`refresh OK: новий токен до ${new Date(jwtExp(access_token) * 1000).toISOString()}`);
}

for (const file of CRED_FILES) {
  if (!existsSync(file)) { console.log("skip (немає файла):", file); continue; }
  let text = readFileSync(file, "utf8");
  if (/^CODEX_CHATGPT_TOKEN:.*$/m.test(text)) {
    text = text.replace(/^CODEX_CHATGPT_TOKEN:.*$/m, `CODEX_CHATGPT_TOKEN: ${access_token}`);
  } else {
    text += `\nCODEX_CHATGPT_TOKEN: ${access_token}\n`;
  }
  writeFileSync(file, text, "utf8");
  console.log("записано:", file);
}

// --- Моделі openai-codex: регенерація з models_cache.json ---
// Кеш оновлює Codex CLI при запуску; якщо він старий — попереджаємо.
// ВАЖЛИВО: кеш перезаписують РІЗНІ клієнти (термінальний codex 0.153.x і
// VS Code-розширення openai.chatgpt з codex 0.151.x-alpha), і старі клієнти
// не бачать нові моделі (gpt-6-astra). Тому список — ОБ'ЄДНАННЯ кеша і
// поточного settings.yaml: кеш оновлює назви/контекст, а моделі, яких у кеші
// нема, НЕ видаляються. Щоб прибрати модель назавжди — видали її руками
// з settings.yaml обох інстансів.
function prettyName(display) {
  // "GPT-6-Astra" -> "GPT-6 Astra", "GPT-5.6-Sol" -> "GPT-5.6 Sol"
  return display.replace(/(\d(?:\.\d+)?)-(?=[A-Za-z])/, "$1 ");
}

function parseExistingModels(text) {
  const m = text.match(/    openai-codex:\n(?:      .*\n)*?      models:\n((?:        .*\n)+)/);
  const out = new Map();
  if (!m) return out;
  const entryRe = /        - id: (\S+)\n((?:          .*\n?)*)/g;
  let e;
  while ((e = entryRe.exec(m[1]))) {
    const name = e[2].match(/          name: (.*)/)?.[1];
    const ctx = e[2].match(/          contextWindow: (\d+)/)?.[1];
    out.set(e[1], { name, contextWindow: ctx ? Number(ctx) : undefined });
  }
  return out;
}

if (!existsSync(MODELS_CACHE)) {
  console.log("немає", MODELS_CACHE, "— список моделей лишаю як є");
} else {
  const cache = JSON.parse(readFileSync(MODELS_CACHE, "utf8"));
  const ageDays = (Date.now() - new Date(cache.fetched_at).getTime()) / 86400000;
  if (ageDays > 30) {
    console.log(`УВАГА: models_cache.json старий (${ageDays.toFixed(0)} дн) — запусти codex CLI, щоб оновити`);
  }
  const fromCache = cache.models.filter((m) => m.visibility === "list" && m.supported_in_api);
  for (const file of SETTINGS_FILES) {
    if (!existsSync(file)) { console.log("skip (немає файла):", file); continue; }
    const text = readFileSync(file, "utf8");
    const re = /(    openai-codex:\n      apiKeyEnv: CODEX_CHATGPT_TOKEN\n)(?:      models:\n(?:        .*\n)+)?/;
    if (!re.test(text)) { console.log("skip (не знайшов блок openai-codex):", file); continue; }
    // об'єднання: спочатку кеш (порядок сервера), потім наявні, яких у кеші нема
    const merged = new Map();
    for (const m of fromCache) {
      merged.set(m.slug, { name: prettyName(m.display_name), contextWindow: m.context_window });
    }
    for (const [slug, m] of parseExistingModels(text)) {
      if (!merged.has(slug)) merged.set(slug, m);
    }
    const block = ["      models:"];
    for (const [slug, m] of merged) {
      block.push(`        - id: ${slug}`);
      if (m.name) block.push(`          name: ${m.name}`);
      if (m.contextWindow) block.push(`          contextWindow: ${m.contextWindow}`);
    }
    const modelsYaml = block.join("\n") + "\n";
    writeFileSync(file, text.replace(re, `$1${modelsYaml}`), "utf8");
    console.log("моделі оновлено:", file, `(кеш ${fromCache.length}, разом ${merged.size})`);
  }
}
console.log("DONE");
