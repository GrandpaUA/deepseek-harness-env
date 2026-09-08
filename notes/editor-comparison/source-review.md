# Пре-рев'ю сирців плагінів-кандидатів (2026-09-08)

> Третьосторонній плагін = чужий код з нашими правами і ключами. Рев'ю перед
> установкою — за правилом awesome-списку і принципом 4. Жори клонували репо
> в %TEMP% і читали весь код; голова верифікує вибірково.

## better-er/dsh-classic-coding (Monaco-редактор) — SAFE WITH NOTES

- Коміт: `7d31c1830c33a81949c5a1684acaca266e03f5e5`, npm `dsh-classic-coding@0.1.1`
- Чисто: нуль залежностей, нуль postinstall, без eval/Function, без мережі з host,
  без читання env/кредешелів, без обфускації. Слоти: sidebar.footer.action + shell.overlay.
- ⚠️ HIGH: `handleWriteFile` (lib/index.js:180-184) пише через node:fs/promises
  МИНАЮЧИ ctx.fs sandbox (свідомо, задокументовано ряд. 170-176); `requireAbsolute`
  перевіряє лише абсолютність шляху → RPC `/classic-coding/writeFile` = довільний
  запис на диск з правами процесу DSH для будь-якого скрипта на сторінці.
  Прийнятно, бо наш DSH = localhost-only без зовнішнього доступу; НЕ експонувати
  DSH web без auth.
- ⚠️ MEDIUM: Monaco вантажиться з CDN jsdelivr без SRI-integrity (lib/client.js:243,246,
  monaco-editor@0.52.2) → supply-chain ризик на льоту + не працює офлайн.
  Бажано: завендорити Monaco локально (кандидат на власний патч).
- Після install: звірити diff встановленого з клоном %TEMP%\review-classic-coding.
- ✅ Верифікація головою 08.09: обидві знахідки підтверджено читанням коду з клона
  (коментар автора у handleWriteFile прямо каже "навмисно не йдемо через ctx.fs";
  script.src = cdn.jsdelivr.net без integrity). Коміт-хеш звіту збігається.

## giiiiiithub/terminal (npm `dsh-terminal@0.1.1`) — SAFE WITH NOTES

- Коміт: `c6d0fbfc45f6fc5ccfb4a60c4a1d400ebd177e24` (15.08), MIT, TS-сирці в комплекті.
- Чисто: нуль мережевих викликів, нуль читання файлів/кредешелів, без обфускації/eval,
  без install-скриптів у самому плагіні. Якісний код: zod-валідація дротового контракту,
  ліміти сесій/буферів, обробка крайових випадків ConPTY.
- ⚠️ За задумом: повноцінний shell з правами хост-процесу через веб-UI; shell успадковує
  ВЕСЬ env процесу DSH (включно з API-ключами, якщо вони в env) — src/index.ts:253;
  `shell` у запиті open — довільний рядок (можна запустити будь-який exe). Прийнятно для
  localhost-only, та сама полісі: DSH web не експонувати без auth.
- ⚠️ Крихкість: читає приватне `ctx.remote.namespaces` (src/client/api.ts:135) — апдейт
  ядра може зламати (той самий патерн, що в dsh-git-ui).
- GUI: кнопка `>_` у хедері сесії + панель у input dock; локаль en+zh; стан у localStorage.
- **Установка на Windows**: node-pty 1.1.0 — єдина runtime-залежність, prebuilds
  win32-x64 Є (node-gyp не потрібен), але pnpm ≥10 блокує install-скрипти → додати
  `node-pty` в `allowBuilds` у pnpm-workspace.yaml профілю. Потім
  `dsh plugin --profile web add dsh-terminal` + рестарт. Node ≥20.
- ✅ Верифікація головою 08.09: install-скрипт node-pty підтверджений з npm metadata
  (`node scripts/prebuild.js || node-gyp rebuild`), README плагіна прямо вимагає
  allowBuilds (цитата з raw README). Коміт-хеш звіту збігається.

## AKS1st/dock-сімейство (4 пакети) — SAFE / SAFE WITH NOTES

Коміти: dock=`24924239`, dock-editor=`a94ddc4a`, dock-files=`fd58e18f`, dock-git=`5b0e2895`.
СПІЛЬНЕ: нуль runtime-deps, немає postinstall/нативних збірок (allowBuilds НЕ треба),
без eval/обфускації/телеметрії, trust fence (loopback+trustedHosts+Origin) на всіх
ендпоінтах, повний i18n zh/en (detectLocale з DSH locale service), MIT.

- **dock-base@0.1.2 — SAFE.** Хост пустий, клієнт — чистий React-shell + localStorage.
- **dock-editor@0.2.1 — SAFE WITH NOTES.** ⚠️ Це **CodeMirror 6, НЕ Monaco**.
  N1: `/desk-editor/fs.read` читає БУДЬ-ЯКИЙ абсолютний шлях хоста (навмисна фіча,
  src/index.ts:116-125) — через довірену сесію читабельний навіть settings.yaml з ключами.
  Запис обмежений. N2: fallback на process.cwd() при проблемах сесії.
  Анти-трункація 256KiB на write — добре.
- **dock-files@0.2.1 — SAFE WITH NOTES.** Path traversal закритий (realpath containment),
  записи ніколи не перезаповнюють (flag wx), magic-byte check зображень. N3: мутаційні
  ендпоінти мають fallback на process.cwd() при невалідному sessionId. N4: /wb-files/probe —
  stat довільного шляху (задокументовано). Видалення рекурсивне без кошика, але з UI-confirm.
  N5: частина тултіпів захардкоджена zh.
- **dock-git@0.3.3 — SAFE WITH NOTES, найзріліший.** spawn('git') без shell, env-санітизація,
  repoRoot обмежений workspace, БЕЗ cwd-fallback (409). Force — лише --force-with-lease;
  reset --hard/-D — через UI-confirm. Відкидає ext:: remote-helper URL.
  N6: ⚠️ commit/merge з `--no-verify` (git-ops.ts:325-327) — обходить git-хуки
  (у нас хуків нема, але знати треба).

**Установка**: `dsh plugin --profile web add dock-base` → `dock-files` → `dock-editor` →
`dock-git` (порядок формально неважливий; dock-editor вимагає dock+dock-files, dock-git
незалежний; можна ставити не всі). Усе на npm, allowBuilds не потрібен.

---

## ФІНАЛЬНИЙ СИНТЕЗ (голова, 08.09)

Усі три кандидати чисті від шкідливої поведінки. Спільна ціна — кожен дає веб-UI
доступ до хоста (shell / довільний read|write) з правами процесу DSH. Це прийнятно
тільки за полісі **localhost-only, ніколи не експонувати без auth** — наш дефолт.

| | classic-coding | dock-сімейство | terminal |
|---|---|---|---|
| Редактор | Monaco (CDN!) | CodeMirror 6 | — |
| Дерево файлів | базове | повне (мутації) | — |
| Git UI | — | git-граф+stage+push | — |
| Термінал | — | — | PTY повний |
| npm | ✓ | ✓ (4 пакети) | ✓ |
| allowBuilds | ні | ні | node-pty@1.1.0 |
| Ризики | writeFile поза sandbox | fs.read довільного шляху | shell з правами хоста |

Рекомендація голови: **terminal + dock-base/dock-files/dock-git (+dock-editor)** —
повна заміна VS Code-консолі без CDN-залежності; classic-coding як альтернатива,
якщо хочеться саме Monaco. Остаточний вибір — за користувачем (візуали:
index.html).

✅ Верифікація головою 08.09 (клони %TEMP%\review-dock): --no-verify у dock-git
підтверджено — ЦЕ НАВМИСНИЙ захист (хук із ворожого репо не виконається при коміті
з браузерного API; коментар у git-ops.ts), побічка — наші легітимні хуки теж
мінятимуться (у env-репо хуків нема). fs.read dock-editor підтверджено — read
будь-де, write тільки workspace (resolveWorkspacePath). Хеш dock-git збігається.

## npm/GitHub розвідка (голова, 08.09)

| Плагін | npm | GitHub активність |
|---|---|---|
| dsh-classic-coding | ✓ 0.1.1 (01.09) | 5★, pushed 01.09 |
| giiiiiithub/terminal | імовірно `dsh-terminal@0.1.1` (15.08) | 1★, pushed 15.08 |
| AKS1st/dock* | перевіряється | 4–7★, dock-files/dock-git pushed 08.09 (сьогодні) |
| All3nCN/dsh-better-sidebar-N23 | ? | 0★, pushed 03.09 |
| a903067276-rgb/dsh-file-mentions | ✗ npm (git-деп → allowBuilds) | 12★, pushed 02.09 |
| better-er/dsh-edit-diff | ✓ 0.2.1 (07.09) | 6★, pushed 07.09 |
| GeekRicardo/dsh-balance | ✓ 0.2.5 (28.08) | 3★, pushed 28.08 |
