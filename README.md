# DeepSeek Harness — середовище

Наша інсталяція [DeepSeek Harness](https://github.com/deepseek-ai/DeepSeek-Harness) (DSH) під git: конфігурація профілю, інструменти дев-циклу, робочі нотатки. Точка відкату для `safe-restart`.

## Структура репо

```
profiles/web/       — конфігурація веб-профілю (package.json, pnpm-workspace.yaml,
                      cordis.patch.yml — усе під git)
scripts/            — інструменти дев-циклу: канарка, безпечний рестарт
notes/              — робочі матеріали, STATE.md (якір стану розробки)
plugins/            — НЕ в репо: тут лише junction-и на окремі репо плагінів
  dsh-locale-uk     → C:\All\Project\Vibecode\repos\dsh-locale-uk
                      (github.com/GrandpaUA/dsh-locale-uk — український переклад)
```

**Конвенція для доповнень:** кожен наш аддон — окремий репо (пакет з `package.json`, `index.js`, за потреби `client.js`), підключений у DSH_HOME через junction у `plugins/`. `profiles/web/pnpm-workspace.yaml` уже містить glob `../../plugins/*`; лишається dep `"<ім'я>": "workspace:*"` у `profiles/web/package.json`, `pnpm install` і рядок у `cordis.patch.yml` (або декларація `dsh.bundle.patch` у самому пакеті).

## 🇺🇦 Українська мова інтерфейсу

Окремий репо: [GrandpaUA/dsh-locale-uk](https://github.com/GrandpaUA/dsh-locale-uk) (726 ключів / 30 ns).
Тут лежить лише активація: рядок `locale-uk` у `profiles/web/cordis.patch.yml`, dep у `profiles/web/package.json`, `locale.preference: uk` у `settings.yaml` (не в репо). Патч ядра — `node plugins/dsh-locale-uk/scripts/apply-uk-core-patch.mjs` (запускати з DSH_HOME; ідемпотентний; перезапускати після оновлення DSH).

## Сторонні плагіни (встановлені в нашій інсталяції)

Ставляться через `dsh plugin --profile web add -w <пакет>` (потрібен pnpm — `corepack enable`):

| Плагін | Дає |
|---|---|
| dshmarket | маркет плагінів у Налаштуваннях |
| dsh-thinking-language | `/thinking-language` — мова думок моделі |
| dsh-session-fork | `/branch` — гілкування сесій |
| dsh-recall | пошук по минулих сесіях |
| @dennisrongo/dsh-memory | `/remember` — факти в ієрархію інструкцій (AGENTS.md) |
| github:Buyi-wsgzg/dsh-sidechain | `/side`, `/btw` — побічні сесії (git-деп, потребує `allowBuilds`) |
| dsh-checkpoint-rewind + dsh-checkpoint-diff | знімки змін воркспейсу, кнопка Diff, `/diff`, `/rollback` |
| deepseek-harness-ultra-slash | `/steer` (вказівка агенту на льоту), `/new`, `/skill`, `/docs` |

## Безпечний дев-цикл (ми працюємо всередині самого DSH)

Зміни конфігів не впливають на запущений сервер — композиція фіксується при старті. Тому:

1. **Розробка** — спокійно змінюємо конфіги/плагіни, сесія не дропає.
2. **Канарка** — `scripts\dev-canary.ps1`: dump-config + тестовий старт на 3099; основний сервер (3080) не чіпає. Не пройшла — сесія жива, правимо далі.
3. **Переключення** — `scripts\safe-restart.ps1` (лише після CANARY PASS): git clean → канарка → kill 3080 → старт → health-check; якщо не стартує — авто-відкат `git checkout -- .` і підйом старої конфігурації. Лог: `notes/last-restart.log`. Перерва сесії ~17 с, потім F5.
   Запуск **тільки через WMI** (відокремлений процес):
   ```powershell
   Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{
     CommandLine = 'powershell.exe -NoProfile -ExecutionPolicy Bypass -File "<DSH_HOME>\scripts\safe-restart.ps1"';
     CurrentDirectory = '<DSH_HOME>' }
   ```

⚠️ `safe-restart` вимагає чистий git — комітимо зміни перед перемиканням.

## Матеріали для розробки (`notes/`)

- `STATE.md` — поточний стан робіт (якір після стиснень контексту).
- `dsh-extension-mechanisms.md` — як у DSH влаштовані плагіни, локалі, композиція.
- `awesome-dsh-plugin.md` — каталог сторонніх плагінів.
