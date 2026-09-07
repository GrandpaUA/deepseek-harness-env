# HANDOFF — передача естафети в DSH-сесію (3080)

Цей файл написаний зовнішньою сесією Kimi Code CLI 2026-09-07. Мета: перенести
всю подальшу розробку DSH всередину самого DSH (веб-сесія на 3080). Якщо ти —
агент у DSH і тобі сказали прочитати цей файл: прочитай спочатку
`notes/STATE.md` (головний якір стану), потім повернись сюди.

## Хто ти і де ти

Ти працюєш у прод-інстансі DSH (порт 3080), DSH_HOME = корінь цього репо
(`C:\All\Project\Vibecode\DeepSeek Harness`, репо `GrandpaUA/deepseek-harness-env`).
Паралельно живе dev-інстанс на 3081 (DSH_HOME `C:\All\Project\Vibecode\DSH-Dev`,
не в гіті) — це твій полігон: усі зміни спочатку туди, перевірка, потім промоція
в прод (коміт + пуш + safe-restart).

## Стан на момент передачі

- Обидва репо чисті, все запушено (останній коміт `1c1bac4`).
- Плагін `@deepseek-ai/dsh-llm-deepseek` вимкнено через `profiles/web/cordis.patch.yml`
  (`- id: llm-deepseek / disabled: true`) — прибрано примарні рядки "DeepSeek" і
  "DashScope (Qwen)" з Models-сторінки. Зміна вже запушена і є в обох інстансах.
- Провайдери в `settings.yaml`: `openai-codex` (ChatGPT Plus через OAuth Codex CLI;
  моделі gpt-6-astra, gpt-5.6-sol/terra/luna, gpt-5.5, gpt-5.4-mini),
  `qwen-token-plan` (qwen3.6–qwen3.8), `kimi-coding` (план Allegretto, 4 моделі).
- `scripts/sync-codex-token.mjs` (планувальник, щодня 09:47): рефрешить OAuth-токен
  Codex і регенерує список моделей openai-codex з `~/.codex/models_cache.json`
  (ОБ'ЄДНАННЯ з наявним списком — моделі самі не зникають; порядок зберігається,
  нові з кеша йдуть у кінець).

## Відкриті питання (перевір/закрий)

1. **Models-сторінка на 3080**: рядки "DeepSeek" і "DashScope (Qwen)" мають бути
   відсутні. Якщо ще висять — потрібен рестарт прода (safe-restart через WMI, див.
   STATE.md), користувач перед рестартом має підтвердити.
2. **QWEN_TOKEN_PLAN_API_KEY**: ключ було втрачено при чистці кредешелів;
   користувач мав ввести його заново через Models-сторінку (рядок qwen-token-plan).
   Перевір, що qwen-модель реально відповідає.
3. **GPT-6 Astra на 3080**: обрати в picker, надіслати тестове повідомлення.
   Якщо помилка — див. свіжий `sessions/*/session.jsonl.zstd` (декодування —
   node-скрипт по магічним байтам 0x28B52FFD, тимчасові файли в %TEMP%).
4. Дефолтна модель dev-інстанса зараз `openai-codex/gpt-5.5` (раніше була
   qwen3.8-max; повернути, якщо користувач хоче, після введення QWEN-ключа).

## Правила виживання (критично)

- **Ніколи не вбивай процес, який слухає 3080, напряму** — ти в ньому живеш.
  Рестарт прода ТІЛЬКИ через WMI + `scripts/safe-restart.ps1` (канарка+відкат),
  команда в STATE.md. Сесія переживає рестарт (F5), але непередбачуваний
  вбитий прод = користувач лишається без інструмента.
- Спочатку dev (3081, `scripts/dev-restart.ps1` через WMI), потім прод.
- Не читай `.credentials.yaml` у чат — тільки masked-діагностика скриптами
  (імена ключів без значень).
- PowerShell 5.1, ps1-скрипти з BOM, інлайн-команди — тільки ASCII.
- git push пише прогрес у stderr — це не помилка. LF→CRLF warnings — норм.
- Після будь-якої змістовної зміни: онови `notes/STATE.md`, коміт, пуш.

## Куди рухатись далі

Репо перекладу: `GrandpaUA/dsh-locale-uk` (локально `C:\All\Project\Vibecode\repos\dsh-locale-uk`,
підключено junction у `plugins/dsh-locale-uk`). Нотатки про механізми розширення:
`notes/dsh-extension-mechanisms.md`, `notes/awesome-dsh-plugin.md`.
Далі — за вказівками користувача.
