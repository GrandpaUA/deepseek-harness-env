# DSH env — стан робіт (оновлюється після кожного завдання)

## Інсталяція
- DSH_HOME = `C:\All\Project\Vibecode\DeepSeek Harness`
- Сервер: `dsh-web.cmd` → http://127.0.0.1:3080
- Репо: **цей каталог = `GrandpaUA/deepseek-harness-env`** (public, main). Історія до 2026-09-07 лишилась у репо перекладу.
- Переклад винесено: **`GrandpaUA/dsh-locale-uk`**, локально `C:\All\Project\Vibecode\repos\dsh-locale-uk`; підключено junction-ом `plugins/dsh-locale-uk` → клон. Канарка PASS після переїзду.
- Конвенція: наступні наші аддони = окремі репо в `..\repos\`, junction у `plugins/`.

## Українська локаль (жива, деталі — в репо перекладу)
- Плагін `@local/dsh-locale-uk` (726 ключів/30 ns): junction вище; dep `workspace:*` у profiles/web/package.json; рядок locale-uk у cordis.patch.yml; `locale.preference: uk` у settings.yaml.
- Патч ядра: `node plugins/dsh-locale-uk/scripts/apply-uk-core-patch.mjs` (з DSH_HOME; після оновлення DSH перезапускати).

## Плагіни встановлено
`dsh plugin` = `node --expose-internals runtime\...\dsh\lib\bin.js plugin --profile web add -w <pkg>`; git-депи потребують `allowBuilds` у pnpm-workspace.yaml:
- dshmarket, dsh-thinking-language, dsh-session-fork, dsh-recall, @dennisrongo/dsh-memory, github:Buyi-wsgzg/dsh-sidechain, dsh-checkpoint-rewind + dsh-checkpoint-diff, deepseek-harness-ultra-slash (/steer /new /skill /docs)

## Черга завдань
- [x] Dev-інстанс DSH-Dev — ГОТОВО (2026-09-07): `C:\All\Project\Vibecode\DSH-Dev`, порт 3081, HTTP 200, свої sessions/storages
  - власний DSH_HOME, спільний runtime через `dsh-web-dev.cmd` (форсує DSH_HOME, --port 3081)
  - `profiles/node_modules` — junction на продовий junction-шар; `plugins/dsh-locale-uk` — junction на репо перекладу
  - `.credentials.yaml` НЕ копійовано (секрети) — якщо dev просить ключі, скопіювати вручну з DSH_HOME
- [x] Мігрувати робочу сесію розробки в dev-інстанс; prod лишається стабільним — ФЛОУ ЗМІНЕНО: робота ведеться з прода (3080), зміни тестуються на dev (3081), промоція через safe-restart
- [x] `scripts/dev-restart.ps1` — рестарт dev з сесії прода (WMI), бойовий тест SUCCESS, прод не зачеплено

## Безпечний дев-цикл (проти дропу сесії) — ГОТОВО, бойовий тест SUCCESS
- Зміни конфігів/плагінів НЕ впливають на запущений сервер (композиція фіксується на boot)
- `scripts/dev-canary.ps1` — перевірка нової конфігурації на порті 3099, основний сервер (3080) не чіпається
- `scripts/safe-restart.ps1` — переключення: git clean → канарка → kill 3080 → старт → health-check → авто-відкат `git checkout -- .`; лог у `notes/last-restart.log`; бойовий тест: SUCCESS, ~17 с
- Запуск safe-restart ТІЛЬКИ через WMI (Start-Process із тул-виклика вбивається по завершенню виклику):
  `Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{CommandLine='powershell.exe -NoProfile -ExecutionPolicy Bypass -File "<DSH_HOME>\scripts\safe-restart.ps1"'; CurrentDirectory='<DSH_HOME>'}`
- Сесії персистують на диску (sessions/, storages/) — після рестарту GUI відновлює сесію (F5)
- УВАГА: тулзи працюють у Windows PowerShell 5.1 (не pwsh 7); скрипти з BOM; в інлайн-командах не вживати «'» — тільки ASCII
- dump-config зі стороннього шела: обов'язково виставити `DSH_HOME`, інакше дампиться дефолтний профіль без наших рядків

## Міграція workflow з консолі VS Code (08.09, триває)
- Аналіз прогалин: `notes/dsh-migration-gaps.md` (що є/чого бракує/план треків A/B/C)
- **Трек A ЗАКРИТО**: скіли `skills/hands-protocol` (порт протоколу жор з hands_strategy.md під DSH-тули: subagent/workflow/ralph/bg-jobs) і `skills/work-conventions` (5 принципів + конвенції коду + стиль спілкування). Hot-reload спрацював — обидва в каталозі скілів без рестарту
- Візуальне порівняння редакторів (делеговано qwen3.8-max через workflow — ключ qwen ЖИВИЙ): `notes/editor-comparison/index.html` — 8 реальних скріншотів з GitHub README, темна сторінка укр. Верифіковано головою (magic bytes + перегляд). У dock і better-sidebar-N23 скріншотів у README нема (чесно зазначено)
- Далі: Трек B (вибір редактора за сторінкою → установка на dev 3081) — чекає рішення користувача
- Трек B підготовка (08.09): пре-рев'ю сирців трьома жорами → `notes/editor-comparison/source-review.md`.
  Вердикти: dsh-classic-coding SAFE WITH NOTES (writeFile поза sandbox, Monaco з CDN без SRI),
  dsh-terminal SAFE WITH NOTES (shell з правами хоста за задумом; node-pty має win32-x64 prebuilds,
  треба allowBuilds). dock-сімейство — рев'ю триває. Обидва вердикти головою спот-перевірено.
- Ранбук установки: `notes/track-b-runbook.md` (команди dev→прод, allowBuilds, відкат)
- **08.09: dsh-terminal@0.1.1 встановлено на DEV 3081** (allowBuilds node-pty@1.1.0, prebuilds
  спрацювали, node-gyp не знадобився; рестарт dev SUCCESS). Непряма верифікація головою:
  рядок `terminal` у dump-config ✓, реєстрація `dsh-terminal` у __DSH_BOOT__ ✓,
  client bundle `/plugins/dsh-terminal/client.js` HTTP 200 (866 KB) ✓. Чекає UX-тест
  користувача у GUI dev (кнопка `>_` у хедері сесії). Після тесту — промоція в прод за ранбуком

## Нюанси
- 2026-09-07/08: **БАГ "prepare" — ЗАКРИТИЙ (RCA доведено)**. Симптом: кожен tool call вбиває хід ("Cannot read properties of undefined (reading 'prepare')" = `ctx.tools[TOOL_RUNTIME_SCHEDULER]` undefined). Причина: **dual-URL module identity** — pnpm тягнув `@deepseek-ai/*` (dsh-tools тощо) як deps плагінів у `profiles/web/node_modules` → Node ESM вантажив ДРУГИЙ інстанс модуля за іншим URL → символи-ключі сервісів (`Symbol("@deepseek-ai/dsh-tools.scheduler")`) роз'їжджались між хостом і бандлами. **Фікс**: видалено всі `@deepseek-ai/*` з `profiles/web/node_modules` обох home; у `profiles/web/.pnpmfile.cjs` (обидва home) хук readPackage зрізає `@deepseek-ai/*` з deps/optionalDeps/peerDeps плагінів — шар НЕ відтворюється при `pnpm install`. **ПРАВИЛО: ніколи не матеріалізувати `@deepseek-ai/*` під `profiles/*/node_modules`** — сторожить .pnpmfile.cjs. Junction-шар `profiles/node_modules/@deepseek-ai/*` → runtime (створюється dsh при бооті, `healProfilesModuleFallback`) — не шкодить, headless-тести зелені з ним
- 2026-09-08: **БАГ "порожній чат / history unavailable ... reading 'parse'" — ЗАКРИТИЙ**. Симптом: ходи серверно виконуються (tool calls, відповіді в session-лозі), але UI порожній, історія падає. Причина: плагін `dsh-checkpoint-rewind` (0.6.4/0.6.5, і на npm 0.6.7 те саме) реєструє проєкцію `checkpoints` за СТАРИМ rc.2-контрактом (`stateSchema` + `wire.viewSchema`, без топ-левел `schema`/`view`); хост rc.6 робить `def.schema.parse(def.view(state))` → undefined.parse → падає ВСЯ session.history (стек: dsh-session-projection/lib/index.js:221 ← detachedProjectionsFor). **Фікс**: `pnpm patch` у обох home — додано топ-левел `schema: checkpointsWireSchemaList` і `view` у `lib/projection.mjs`; патчі в `profiles/web/patches/`, прописані в `pnpm-workspace.yaml` → переживають reinstall. Плагін піднято до 0.6.7 (останній на npm; контракт у апстрімі ДОСІ старий — при майбутніх апдейтах перевіряти `lib/projection.mjs` і переносити патч). Урок: один битий projection-def валить всю історію — хост реєстрацію форму не валідує
- 2026-09-08: **Файли сесій = мультифреймовий zstd**. `zstdDecompressSync` читає лише ПЕРШИЙ фрейм (заголовок). Декодер всіх фреймів: `DSH-Dev\dump-session.cjs` (магія 28 b5 2f fd, друкує записи й error-entries); `DSH-Dev\scan-sessions.cjs <sessions-dir>` — перевіряє, що сесія лежить у бакеті свого cwd (переплутана сесія блокує БУТ web-сервера з "corrupt session log")
- 2026-09-08: **Прод 3080 рестартнуто з усіма фіксами** (safe-restart, канарка PASS, коміт 6b30299). Дев 3081 перевірений користувачем — історія й tool calls живі. УВАГА: старі процеси, стартовані ДО фіксу шару @deepseek-ai, падають з 'prepare' очікувано (старий module graph) — це не регрес
- 2026-09-07: HMR підхоплює cordis.patch.yml наживо (GUI показує ефект без рестарту), але доведено, що рестарт все одно потрібен для повної чистоти. НЕ він винен у багу "prepare" — той старший і переживає рестарти
- 2026-09-07: у корені репо з'явився чужий AGENTS.md (від проєкту YouTube Voice Translator / subtitres) — блокував safe-restart (git не чистий). Перенесено в %TEMP%\AGENTS-from-dsh-repo-backup.md; у репо DSH свого AGENTS.md нема і не треба
- 2026-09-07: **Codex rate limit**: openai-codex/gpt-5.5 вперся в "usage limit reached" (квота Plus на день). Дефолт dev тимчасово → kimi-coding/k3. Урок: перед headless/канарка-тестами перевіряти, що дефолтна модель жива
- 2026-09-07: **Постмортем лавини** (чому все посипалось разом): (1) самохостинг-розробка — ламаємо інструмент, яким лагодимо; (2) settings.yaml/.credentials.yaml пишуть четверо (GUI, sync-скрипт, ручні правки, HMR дивиться все); (3) неявні правила (примарні роути плагінів, каталог vs settings, два Codex-клієнти перезаписують кеш); (4) канарка перевіряла HTTP 200, але не реальний tool call; (5) правка кредешелів без бекапа (втрачено QWEN-ключ). **Правила на майбутнє**: канарка має ганяти реальний headless-хід з tool call; бекап .credentials.yaml перед кожним записом (.bak-<дата>); один писар на файл (ключі=GUI, моделі codex=sync-скрипт, решта=коміти); після cordis.patch.yml — повний рестарт; RCA не закривати без доказу
- settings.yaml хот-релоадиться (dsh-base patch.yml: «settings.yaml, hot-reloaded») — зміни моделей/провайдерів без рестарту
- 2026-09-07: 404 resource_not_found на kimi-coding — ВИРІШЕНО. kimi-coding є каталожним провайдером pi-ai (anthropic-messages, baseUrl https://api.kimi.com/coding, UA KimiCLI/1.5 — усе з каталогу). Наш baseURL з /v1 дублював шлях → /coding/v1/v1/messages → 404. Фікс: у settings.yaml лишено ТІЛЬКИ apiKeyEnv, без baseURL/models. Перевірено прямим POST /v1/messages → 200
- 2026-09-07: **GPT-6 Astra** додано в openai-codex (id `gpt-6-astra`, з ~/.codex/models_cache.json, ctx 272000; pi-ai каталог її ще не знає — протокол успадковується від каталожних сусідів openai-codex-responses). У models роута виписані всі моделі (список models ЗАМІЩУЄ каталог, тому треба перелічувати все)
- 2026-09-07: **Авто-синк моделей**: sync-codex-token.mjs тепер регенерує список openai-codex у settings.yaml обох інстансів з models_cache.json (visibility=list + supported_in_api). Це ОБ'ЄДНАННЯ з поточним settings — моделі, яких у кеші нема, НЕ видаляються (важливо: кеш перезаписують різні клієнти — термінальний codex 0.153.4 бачить astra, а VS Code-розширення openai.chatgpt з codex 0.151.0-alpha НІ, і може перезаписати кеш без неї). Щоб прибрати модель — видалити руками з settings.yaml
- 2026-09-07: **Провайдери-«примари» в GUI**: рядки "DeepSeek" і "DashScope (Qwen)" без кнопки видалення — це НЕ дані, а роути вбудованого плагіна `@deepseek-ai/dsh-llm-deepseek` (registerConfigurableProviders, lib/index.js:947/952; ns `llm-deepseek`/`llm-dashscope`). Вимкнено обидва через `profiles/web/cordis.patch.yml` запис `- id: llm-deepseek / disabled: true` (потрібен рестарт інстанса). Повернути = прибрати запис + рестарт
- 2026-09-07: qwen-token-plan (каталожний pi-ai роут, моделі qwen3.6…qwen3.8) ЗАЛИШАЄТЬСЯ в settings.yaml — це нормальний провайдер, видаляється з GUI. Його apiKeyEnv QWEN_TOKEN_PLAN_API_KEY — ключ задається через Models-сторінку
- 2026-09-07: ChatGPT Plus ($20) в DSH через openai-codex: OAuth-токен з Codex CLI (`~/.codex/auth.json`, логін уже є) → кредешел CODEX_CHATGPT_TOKEN. `scripts/sync-codex-token.mjs` — синк + авто-рефреш (access_token живе ~10 днів; DSH сам НЕ рефрешить); **повішено на планувальник Windows: таск «DSH Codex Token Sync», щодня 09:47**, реєстратор `scripts/register-codex-sync.ps1`, лог `notes/codex-token-sync.log`. settings: блок openai-codex скорочено до apiKeyEnv — каталог pi-ai дає всі 7 моделей (gpt-5.3-codex-spark…gpt-5.6-terra)
- grep/glob інструменти зламані → пошук через pwsh `Select-String`
- web_search без API-ключа → пошук через Invoke-RestMethod (GitHub API, npm registry)
- /compact не викликається агентом; стиснення = авто-чекпоінти харнесу + цей файл
- git у pwsh: push пише в stderr → NativeCommandError, це не помилка
