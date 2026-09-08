# Трек B — ранбук установки плагінів (2026-09-08)

> Порядок: dev 3081 → рестарт dev (WMI) → тест у GUI → коміт (env-репо) →
> safe-restart прода. Плагіни третьосторонні — перед установкою див.
> `editor-comparison/source-review.md` (вердикти рев'ю сирців).

## Підготовка (один раз)

- dev і прод профілі синхронні (deps + pnpm-workspace.yaml) — перевірено 08.09.
- allowBuilds формат ключа: `"<pkg>@<точний-спек>": true` (приклад: sidechain з git-хешем).
- ⚠️ ПРАВИЛО з RCA бага prepare: ніколи не матеріалізувати `@deepseek-ai/*` під
  `profiles/*/node_modules` — .pnpmfile.cjs сторожить, не ламати.
- ⚠️ Канарка має ганяти реальний tool call, не лише HTTP 200 (урок лавини 07.09).

## Плагіни і команди

### 1. Термінал — npm `dsh-terminal@0.1.1` (рев'ю: SAFE WITH NOTES)
```powershell
# 1) дозволити нативну збірку node-pty (install-скрипт prebuild.js)
#    у DSH-Dev\profiles\web\pnpm-workspace.yaml → allowBuilds:
#      "node-pty@1.1.0": true
# 2) установка (з каталогу DSH-Dev):
node "C:\All\Project\Vibecode\DeepSeek Harness\runtime\node_modules\@deepseek-ai\dsh\lib\bin.js" plugin --profile web add dsh-terminal
#    (важливо: запускати з DSH_HOME=DSH-Dev або з каталогу DSH-Dev — інакше пише в прод!)
```
- Рестарт dev → refresh → кнопка `>_` у хедері сесії + панель у input dock.
- Тест: відкрити таб, `pwd`, `git status`, запустити щось довге і закрити таб
  (перевірити taskkill дерева). Мова UI: en+zh (кнопка буде ">_ 终端" або en).
- Відома крихкість: читає приватне ctx.remote.namespaces — при апдейті DSH перевіряти.

### 2. Редактор — npm `dsh-classic-coding@0.1.1` (рев'ю: SAFE WITH NOTES)
```
node ...\bin.js plugin --profile web add dsh-classic-coding
```
- Тест: відкрити файл workspace, змінити, Ctrl+S, перевірити на диску.
- Примітки: writeFile поза sandbox (localhost-only полісі!); Monaco з CDN →
  офлайн не працює; кандидат на власний патч — завендорити Monaco.
- АЛЬТЕРНАТИВА: AKS1st/dock-сімейство (чекає вердикт рев'ю + вибір користувача
  за editor-comparison/index.html).

### 3. Дрібний комфорт (за бажанням, той самий цикл)
- `dsh-edit-diff@0.2.1` (npm) — читабельні дифи карток edit/write.
- `dsh-balance@0.2.5` (npm) — баланси провайдерів у композері.
- `dsh-file-mentions` — НЕМА на npm → git-деп `github:a903067276-rgb/dsh-file-mentions`,
  потребує allowBuilds-запису з git-хешем (як sidechain).

## Промоція в прод (лише після успішного тесту на dev)

1. Повторити ті самі зміни в DSH_HOME прода (package.json/pnpm-workspace.yaml патч-шар).
2. Коміт env-репо (він і є точка відкату).
3. `scripts\dev-canary.ps1` → PASS.
4. safe-restart ТІЛЬКИ через WMI (команда в STATE.md/README).
5. F5 у браузері, тест у проді, оновити STATE.md, пуш.

## Відкат
- git checkout -- . + safe-restart (ранбук у README), або /rollback у сесії для файлів.
- Видалення плагіна: `dsh plugin --profile web remove <pkg>` + прибрати allowBuilds-запис.
