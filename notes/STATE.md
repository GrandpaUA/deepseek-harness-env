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

## Нюанси
- settings.yaml хот-релоадиться (dsh-base patch.yml: «settings.yaml, hot-reloaded») — зміни моделей/провайдерів без рестарту
- 2026-09-07: 404 resource_not_found на kimi-coding — ВИРІШЕНО. kimi-coding є каталожним провайдером pi-ai (anthropic-messages, baseUrl https://api.kimi.com/coding, UA KimiCLI/1.5 — усе з каталогу). Наш baseURL з /v1 дублював шлях → /coding/v1/v1/messages → 404. Фікс: у settings.yaml лишено ТІЛЬКИ apiKeyEnv, без baseURL/models. Перевірено прямим POST /v1/messages → 200
- 2026-09-07: **GPT-6 Astra** додано в openai-codex (id `gpt-6-astra`, з ~/.codex/models_cache.json, ctx 272000/max 128000; pi-ai каталог її ще не знає — протокол успадковується від каталожних сусідів openai-codex-responses). У models роута виписані всі 7 каталожних + астра (список models ЗАМІЩУЄ каталог, тому треба перелічувати все)
- 2026-09-07: ChatGPT Plus ($20) в DSH через openai-codex: OAuth-токен з Codex CLI (`~/.codex/auth.json`, логін уже є) → кредешел CODEX_CHATGPT_TOKEN. `scripts/sync-codex-token.mjs` — синк + авто-рефреш (access_token живе ~10 днів; DSH сам НЕ рефрешить); **повішено на планувальник Windows: таск «DSH Codex Token Sync», щодня 09:47**, реєстратор `scripts/register-codex-sync.ps1`, лог `notes/codex-token-sync.log`. settings: блок openai-codex скорочено до apiKeyEnv — каталог pi-ai дає всі 7 моделей (gpt-5.3-codex-spark…gpt-5.6-terra)
- grep/glob інструменти зламані → пошук через pwsh `Select-String`
- web_search без API-ключа → пошук через Invoke-RestMethod (GitHub API, npm registry)
- /compact не викликається агентом; стиснення = авто-чекпоінти харнесу + цей файл
- git у pwsh: push пише в stderr → NativeCommandError, це не помилка
