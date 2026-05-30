# Active-Tab Task Creation Design

## Summary

New tasks created from the GUI currently default to `#work` when the user does not provide any hashtag. The goal is to make the default tag follow the currently active tab in the GUI:

- `Work` tab -> default to `#work`
- `Personal` tab -> default to `#personal`
- `All` tab -> continue defaulting to `#work`

If the user explicitly includes any hashtag in the task content, the app must preserve that content unchanged.

## Current State

The GUI renderer tracks the active filter in `currentFilter` inside `src/gui/renderer/renderer.js`. Task creation also happens in the renderer through `handleAddTask()`, but that function currently hardcodes `#work` whenever the input contains no hashtag.

The main process and repository simply persist the content they receive. The CLI also defaults untagged tasks to `#work`, but that behavior is separate from this GUI feature and remains unchanged.

## Chosen Approach

Use a renderer-only change.

`handleAddTask()` will derive the default tag from `currentFilter` before calling the existing `create-task` IPC handler. No IPC contract, repository API, database schema, or migration logic changes are required.

This was chosen over moving the behavior into IPC or storage because the requirement is explicitly tied to GUI tab state, and the renderer already owns that state.

## Behavior Rules

When the user clicks `Add` or presses Enter in the task input:

1. Trim the input and reject empty content as today.
2. Check whether the content already contains any hashtag matching the existing tag detection pattern.
3. If at least one hashtag is present, send the content unchanged.
4. If no hashtag is present:
   - append `#personal` when `currentFilter === 'personal'`
   - append `#work` when `currentFilter === 'work'`
   - append `#work` when `currentFilter === 'both'`

## Data Flow

The task creation flow stays the same except for choosing the default tag:

1. The renderer reads the current input value.
2. The renderer derives a default tag from `currentFilter` only when the user did not provide a hashtag.
3. The renderer sends the final content string through the existing `ipcRenderer.invoke('create-task', content)` call.
4. The main process and repository persist the task unchanged.
5. The renderer reloads tasks using the existing filter-specific reload logic.

Because reload already uses `currentFilter`, a task created from the `Personal` tab will immediately remain visible in that tab after creation.

## Testing Strategy

Add or update GUI-focused tests around the renderer add-task workflow.

Coverage should verify:

- plain text entered on `Work` sends content with `#work`
- plain text entered on `Personal` sends content with `#personal`
- plain text entered on `All` sends content with `#work`
- content that already includes a hashtag is not modified

Repository and database tests are not required for this feature because parsing and persistence behavior already exist and are unaffected.

## Error Handling

No new error path is introduced.

Existing task creation errors from IPC or storage continue to surface through the current renderer error handling. The default-tag decision is pure string normalization in the renderer and should not need additional user-facing error states.

## Out of Scope

The following are intentionally excluded from this change:

- changing CLI behavior
- changing database migrations for old tasks
- introducing a dedicated workspace field separate from hashtags
- changing behavior when the user explicitly types a tag that does not match the active tab

## Implementation Notes

Keep the change local to `src/gui/renderer/renderer.js` unless test structure requires a small helper extraction for unit coverage. Prefer preserving the existing hashtag-detection regex to avoid changing tag semantics as part of this feature.
