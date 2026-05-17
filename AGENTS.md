# opencode Agent Instructions — @opensassi/opencode

This project is the **@opensassi/opencode** package itself.

## Local Development Override

All skill files reference `npx @opensassi/opencode` as the published CLI command.
When developing locally in this repo, substitute `npm run opencode --` instead:

| Published CLI | Local equivalent |
|---------------|------------------|
| `npx @opensassi/opencode <skill-name>` | `npm run opencode -- <skill-name>` |
| `npx @opensassi/opencode run <path>` | `npm run opencode -- run <path>` |
| `npx @opensassi/opencode run --skill <name> <path>` | `npm run opencode -- run --skill <name> <path>` |

## Workflow

1. `skill opensassi` — Load the bootstrap skill. It exposes the full skills-index as a reference table.
2. Run `npm run opencode -- <skill-name>` to load any sub-skill. The agent reads the output as the skill's full instructions.
3. Use the skill's commands. Scripts are run via `npm run opencode -- run <path>` or `npm run opencode -- run --skill <name> <path>`.

## Design Constraints

- No commits during development — all changes staged at finish-session time
- Single atomic commit per session
- Full test suite after every rebase
- Session evaluation is read-only (generate) / write-once (export)
- All skills, scripts, and AGENTS.md live in the npm package, not in the project

## MCP Tools

The following MCP servers are configured in `.opencode/opencode.json`:

### Playwright MCP — Headless Browser for Testing

Provides headless browser automation via accessibility snapshots (no vision model needed).

- `browser_navigate` — navigate to a URL
- `browser_snapshot` — capture accessibility tree of the page
- `browser_click` / `browser_type` / `browser_hover` — interact with elements
- `browser_evaluate` — run JS in page context
- `browser_take_screenshot` — capture screenshots
- `browser_console_messages` — read console output
- `browser_network_requests` / `browser_network_request` — inspect network
- `browser_fill_form` — fill multiple form fields at once
- `browser_tabs` — manage tabs
- `browser_wait_for` — wait for text or time
- `browser_drag` / `browser_drop` — drag and drop
- `browser_file_upload` — upload files
- `browser_select_option` — select dropdown options
- `browser_press_key` — press keyboard keys

### GDB Debugger MCP — C/C++ Debugging

Provides process-level debugging for C/C++ applications.

- `gdb_start_session` — start a GDB debugging session
- `gdb_set_breakpoint` — set breakpoints at functions, file:line, or addresses
- `gdb_get_backtrace` — get stack backtrace for a thread
- `gdb_get_variables` — get local variables for a stack frame
- `gdb_evaluate_expression` — evaluate C/C++ expressions
- `gdb_call_function` — call a function in the target process
- `gdb_step` / `gdb_next` — step through code
- `gdb_continue` — continue execution
- `gdb_interrupt` — interrupt a running program
- `gdb_get_registers` — view CPU registers
- `gdb_list_breakpoints` / `gdb_delete_breakpoint` — manage breakpoints
- `gdb_enable_breakpoint` / `gdb_disable_breakpoint` — toggle breakpoints
- `gdb_select_frame` / `gdb_select_thread` — navigate execution context
- `gdb_get_frame_info` — get current frame details
- `gdb_get_threads` — list all threads
- `gdb_get_status` — get session status
- `gdb_execute_command` — execute arbitrary GDB commands
- `gdb_stop_session` — stop a debugging session
