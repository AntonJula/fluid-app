<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Fluid Local Startup Notes

- The actual app folder is `C:\Users\Asus\Documents\hydration app\fluid`. Run npm commands from this folder, not from the parent `hydration app` folder.
- First check whether the app is already running:
  `Invoke-WebRequest -UseBasicParsing http://localhost:3000/`
- Normal manual start:
  `cd "C:\Users\Asus\Documents\hydration app\fluid"`
  `npm.cmd run dev`
- If Codex needs to keep the app running in the background on Windows, use `cmd /d /k npm.cmd run dev` from the `fluid` folder. If `Start-Process` throws a duplicate `Path`/`PATH` error, reset the process env Path before starting:
  `$pathValue = cmd.exe /d /c echo %Path%`
  `[Environment]::SetEnvironmentVariable('PATH', $null, 'Process')`
  `[Environment]::SetEnvironmentVariable('Path', $pathValue, 'Process')`
- If `localhost:3000` does not respond, inspect the terminal/dev log before changing app code. The issue is often the dev server process, not the app.
- If port `3000` is busy, Next may choose another port. Use the URL printed by `npm.cmd run dev`.

## Graphify Notes

- `graphify-out/` is generated analysis output. It is not part of the app runtime.
- Graphify can be used as a read-only map before coding, but source changes should be based on the real files in `src/`, config files, and tests.
- Do not modify generated Graphify files unless the user explicitly asks to regenerate or update Graphify output.
- Prefer targeted reading with `rg`, relevant file reads, build, lint, and tests. Do not read every file top-to-bottom unless the task truly requires a full audit.

## Fluid Product Notes

- Next session should start with improving the four small Quick Add buttons (`Sip`, `Glass`, `Mug`, `Bottle`) so they look more polished.
- Keep the app installable from the browser/PWA flow.
- Skipped for later research: weekly/monthly progress diagram.
- Still open: workout/sala hydration reminders every 10-15 minutes, lighter background colors, loading polish, security pass before launch, and later subscription/monetization planning.
- Current drink tracking direction: keep ml real by drink type for now instead of hydration percentages. Month view shows a type breakdown.
