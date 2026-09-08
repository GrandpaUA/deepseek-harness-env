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
| Облік витрат (DeepSeek $, RunPod $) | ⚠️ частково (usage у settings) | `@francescoli/dsh-quota` (14+ провайдерів, цикли скидання лімітів — Codex/Kimi/Qwen/DeepSeek) |
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
- Рев'ю сирців: `notes/editor-comparison/source-review.md` — усі кандидати SAFE/SAFE WITH NOTES
- Візуали: `notes/editor-comparison/index.html`; ранбук: `notes/track-b-runbook.md`
- [x] `dsh-terminal@0.1.1` на dev 3081 — встановлено, верифіковано непрямо (08.09)
- [x] `dock-base`+`dock-files`+`dock-editor`+`dock-git` на dev 3081 — встановлено (08.09)
- [x] `dsh-classic-coding@0.1.1` на dev 3081 — встановлено (08.09), живе порівняння з dock
- [x] UX-тест користувачем на dev — ПРОЙДЕНО 08.09 (термінал працює, дерево файлів, git-граф)
- [x] Вибір редактора — рішення користувача 08.09: лишаємо ОБИДВА (dock + classic-coding), остаточно — після живого використання
- [x] Промоція в прод — ЗРОБЛЕНО 08.09: прод-профіль + 6 бандлів, канарка PASS, safe-restart SUCCESS (PID 26836), коміти 4d7c603/ae39c04/d052a88 запушені; верифікація: 6 рядків у dump-config, 6 client-бандлів HTTP 200 на 3080
- [ ] (опційно, не замовлено) `dsh-file-mentions` (git-деп, allowBuilds) — клікабельні шляхи
- [ ] (опційно, не замовлено) `dsh-edit-diff@0.2.1` — читабельні дифи карток edit/write
- [ ] Квоти/ліміти підпискових планів — кандидат №1: `@francescoli/dsh-quota@0.2.2` (14+ провайдерів: Codex/ChatGPT, Kimi, Qwen, DeepSeek; цикли скидання, HUD, agent-tool get_quota_status). Чекає згоди на dev-цикл (рев'ю → 3081 → прод)

### Трек C — кастомна розробка (якщо B не закриє)
- [ ] Власний плагін за конвенцією: окремий репо в `..\repos\` + junction у `plugins/`

## Правила виконання (з STATE.md/HANDOFF.md)
- Плагіни ставимо ТІЛЬКИ через dev 3081 → рестарт dev (WMI) → тест → коміт → safe-restart прода
- Третьосторонні плагіни = чужий код з нашими правами: перед установкою — перегляд сирців (awesome-list сам про це попереджає)
- Після кожного етапу: оновити STATE.md + цей файл, коміт, пуш
