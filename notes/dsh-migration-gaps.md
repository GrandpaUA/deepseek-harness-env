# Міграція з консолі VS Code у DSH — аналіз прогалин (2026-09-08)

> Мета: повний переїзд робочого workflow (youtube-translator, CraftSort, binance-p2p-bot)
> з Qwen Code CLI у VS Code на DSH Web (3080). Документ — основа для допилювання.

## Зіставлення: що було → що тут

| Що було в консолі VS Code | Статус у DSH | Як закриваємо |
|---|---|---|
| Термінал: pytest, server.py, dotnet build, git | ✅ нативно: pwsh-тул + background jobs (job_output/job_kill) | нічого; інтерактивний PTY в GUI — плагін `giiiiiithub/terminal` |
| Редактор коду (подивитись/підправити руками) | ❌ немає в GUI | `better-er/dsh-classic-coding` (Monaco + дерево) або `chengzhi43/dsh-file` |
| Файлове дерево проєкту | ❌ | входить у ті ж плагіни / `AKS1st/dock-files` |
| Git (граф, stage, blame) | ⚠️ команди через pwsh працюють, UI немає | `AKS1st/dock-git` або `All3nCN/dsh-better-sidebar-N23` (explorer+editor+terminal+git+browser) |
| «Жори»: hands.sh, Qwen headless --yolo, патруль, шаблон ТЗ, уроки | ✅ Нативні subagent/workflow/ralph ПОТУЖНІШІ (звіти, нотифікації, schema-валідація). ⚠️ Не перенесений САМ ПРОТОКОЛ (hands_strategy.md розд. 8: шаблон ТЗ, правила нагляду, уроки №1–12) | скіл `hands-protocol` (markdown, hot-reload, без рестарту) |
| AGENTS.md / QWEN.md / SESSION_HANDOFF.md | ✅ працює як є — це файли; DSH читає AGENTS.md нативно; є `/remember` (dsh-memory) | нічого |
| Мультипроєктність (кілька репо паралельно) | ✅ воркспейси нативні: сесія = cwd проєкту; сесії не залежать від DSH_HOME | нічого; опційно `1070296335-create/dph-taskboard` (канбан сесій) |
| pytest після кожної зміни | ✅ той самий pytest через pwsh-тула | нічого |
| Довгі процеси (RunPod job, сервер, вотчери) | ✅ background jobs + нотифікації про завершення | нічого |
| Облік витрат (DeepSeek $, RunPod $) | ⚠️ частково (usage у settings) | `GeekRicardo/dsh-balance` (DeepSeek/Kimi/Codex баланси в композері) |
| Статус git/моделі/скілів на очах | ❌ | `a903067276-rgb/dsh-hud` (floating panel) |
| Клікабельні шляхи файлів у відповідях | ❌ | `a903067276-rgb/dsh-file-mentions` |
| Дифи edit/write карток читабельні | ❌ | `better-er/dsh-edit-diff` |

## Що в DSH вже КРАЩЕ, ніж було в консолі

- Чекпоінти + `/diff` + `/rollback` (у Qwen CLI цього не було — лише git)
- recall по всіх минулих сесіях (у Qwen — лише поточна сесія + ручні handoff-файли)
- `/branch` — гілкування сесії перед ризиковим експериментом
- `/steer` — вказівка агенту на льоту (у консолі — тільки Ctrl+C і перезапуск)
- Goals — довгі задачі переживають стиснення контексту автоматично
- Українська локаль, мова думок, dshmarket

## Прогалини, які треба ЗАКРИТИ (план)

### Трек A — нульовий ризик, без рестарту (скіли, markdown)
- [x] `skills/hands-protocol/SKILL.md` — ГОТОВО 08.09: порт протоколу делегації (шаблон ТЗ,
  класифікація задач, верифікація-гейт, правила паралельності, 8 уроків жор) адаптовано
  під subagent/workflow/ralph/background-jobs. Hot-reload підтверджений (з'явився в каталозі).
- [x] `skills/work-conventions/SKILL.md` — ГОТОВО 08.09: 5 принципів з інцидентів +
  конвенції коду + правила тестів + стиль спілкування (пояснення шарами).

### Трек B — готові плагіни (dev 3081 → тест → прод)
- Рішення про редактора: див. `notes/editor-comparison/index.html` (зібрав qwen3.8-max 08.09)

### Трек B — готові плагіни (dev 3081 → тест → прод)
- [ ] Термінал: `giiiiiithub/terminal` (PTY, xterm.js, cmd.exe, мультитаби)
- [ ] Редактор: `better-er/dsh-classic-coding` (Monaco + дерево в розмові) — АБО повний
  workbench `AKS1st/dock`+`dock-editor`+`dock-files`+`dock-git` (важче, але VS Code-подібне)
- [ ] `a903067276-rgb/dsh-file-mentions` — клікабельні шляхи (щоденний комфорт)
- [ ] `better-er/dsh-edit-diff` — читабельні дифи в картках edit/write
- [ ] `GeekRicardo/dsh-balance` — баланси провайдерів (твій облік витрат)

### Трек C — кастомна розробка (якщо B не закриє)
- [ ] Власний плагін за конвенцією: окремий репо в `..\repos\` + junction у `plugins/`

## Правила виконання (з STATE.md/HANDOFF.md)
- Плагіни ставимо ТІЛЬКИ через dev 3081 → рестарт dev (WMI) → тест → коміт → safe-restart прода
- Третьосторонні плагіни = чужий код з нашими правами: перед установкою — перегляд сирців (awesome-list сам про це попереджає)
- Після кожного етапу: оновити STATE.md + цей файл, коміт, пуш
