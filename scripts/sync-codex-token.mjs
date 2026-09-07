// sync-codex-token.mjs — синхронізує OAuth-токен ChatGPT (Codex CLI) в DSH.
// Читає ~/.codex/auth.json; якщо access_token близько до смерті (<2 днів) —
// рефрешить через auth.openai.com і пише нову пару назад в auth.json
// (refresh-токени ротуються, тому Codex CLI лишається в синхроні).
// Свіжий access_token пише в .credentials.yaml обох інстансів (prod + dev).
// DSH резолвить кредешели на кожен запит — рестарт не потрібен.
// Запуск: node scripts/sync-codex-token.mjs   (або за розкладом)
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const AUTH_JSON = join(homedir(), ".codex", "auth.json");
const CLIENT_ID = "app_EMoamEEZ73f0CkXaXp7hrann"; // публічний client_id Codex CLI
const TOKEN_URL = "https://auth.openai.com/oauth/token";
const CRED_FILES = [
  "C:/All/Project/Vibecode/DeepSeek Harness/.credentials.yaml",
  "C:/All/Project/Vibecode/DSH-Dev/.credentials.yaml",
];

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
console.log("DONE");
