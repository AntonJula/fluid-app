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
- If Codex needs to keep the app running in the background on Windows, prefer:
  `npm.cmd run dev:background`
- The background helper keeps Next alive through a hidden `cmd /k` window and normalizes Windows `Path`/`PATH` duplicates before launching.
- In Codex sandboxed shell calls, detached dev-server processes can be cleaned up when the command ends. If the app must stay open for the user, run the background start outside the sandbox/escalated so the process survives after the tool call.
- Manual fallback: use `cmd /d /k npm.cmd run dev` from the `fluid` folder. If `Start-Process` throws a duplicate `Path`/`PATH` error, reset the process env Path before starting:
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

- Recently done this session:
  - Improved the four small Quick Add buttons (`Sip`, `Glass`, `Mug`, `Bottle`) with clearer icon/amount layout and subtle icon halos.
  - Added Workout mode sessions with gentle 12-minute hydration checks, separate from the user's normal reminder interval.
  - Added stable Windows/Codex background startup helper: `npm.cmd run dev:background`.
  - Lightened the base theme slightly; user said it is OK for now but may revisit color/design direction.
  - Simplified loading to a clean no-text glass water icon splash.
  - Made Daily Goal selected preset match the active Reminder button style.
  - Added auto-scroll when Settings Advanced opens.
  - Changed Recent `View all` into a lower bottom sheet with locked background scroll and themed internal scrollbar.
  - Raised both Recent `View all` and Stats Month View above the bottom navbar area, even when nav is hidden.
  - Made Recent edit number picker show the current amount (`Edit 250 ml`) and prefill the current value.
  - Animated Stats Tracking History bars when the bar area enters the viewport, without moving the card position.
- Keep the app installable from the browser/PWA flow.
- When the user asks for the final handoff, include a phone testing checklist with all implemented changes and open requests.
- Skipped for later research: weekly/monthly progress diagram.
- Still open: security pass before launch, later subscription/monetization planning, and any follow-up visual tuning after phone testing.
- Current drink tracking direction: keep ml real by drink type for now instead of hydration percentages. Month view shows a type breakdown.

## Collaboration Notes

- User prefers seeing changes directly in the app, then iterating visually.
- Keep explanations practical and concise; name what changed and what to test.
- For UI, prioritize simple, useful, pleasant, non-intrusive, mobile-first behavior.
- Avoid changing liked behavior while polishing nearby details.
- At final handoff, give a phone test checklist covering the full conversation, not only the latest session.
