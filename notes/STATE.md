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
- 2026-09-07: **БАГ "prepare" (НЕ закритий)**: кожен tool call (read/pwsh/будь-який) вбиває хід з "Cannot read properties of undefined (reading 'prepare')" = `ctx.tools[TOOL_RUNTIME_SCHEDULER]` undefined (dsh-agent-loop/lib/index.js:193). Текстові ходи без інструментів працюють. Таймлайн: перший раз 04.09 22:20 (разово), потім інструменти працювали 06.09, знову померли 07.09 11:01 UTC — одразу після редагування ключів у GUI (серія 401 о 10:58). Рестарти (11:03, 13:19, 19:51 UTC) НЕ лікують. Headless-профіль (dsh-base + dsh-headless, чистий процес, нова сесія) — інструменти ПРАЦЮЮТЬ. Гіпотези: (а) кляті відновлені сесії, (б) стан web-профілю. Тест-роздільник: НОВИЙ чат на 3080/3081 з tool call. Наступний крок якщо (б): бісект плагін-бандлів у headless-профілі DSH-Dev (profiles/headless, створено 07.09)
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
