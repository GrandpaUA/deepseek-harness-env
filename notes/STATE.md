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
- [ ] Мігрувати робочу сесію розробки в dev-інстанс; prod лишається стабільним

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
- grep/glob інструменти зламані → пошук через pwsh `Select-String`
- web_search без API-ключа → пошук через Invoke-RestMethod (GitHub API, npm registry)
- /compact не викликається агентом; стиснення = авто-чекпоінти харнесу + цей файл
- git у pwsh: push пише в stderr → NativeCommandError, це не помилка
