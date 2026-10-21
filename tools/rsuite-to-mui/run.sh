#!/usr/bin/env bash
#
# Re-apply the rsuite -> MUI codemods.
#
#   tools/rsuite-to-mui/run.sh                 # every file that still imports rsuite
#   tools/rsuite-to-mui/run.sh path/a.tsx ...  # just these files
#
# Safe to run more than once: each step keys off what is still imported from
# 'rsuite', so a file already migrated is skipped.
#
# Run from the workspace root. Afterwards:
#   pnpm nx typecheck editor
#   pnpm nx run-many -t test lint -p ui-editor editor ...
set -euo pipefail

cd "$(dirname "$0")/../.."
CM="tools/rsuite-to-mui/codemods"

if [ "$#" -gt 0 ]; then
  FILES=("$@")
else
  # Every file importing anything from rsuite.
  # (read -r in a loop rather than mapfile: macOS ships bash 3.2)
  FILES=()
  while IFS= read -r line; do
    [ -n "$line" ] && FILES+=("$line")
  done < <(node "$CM/rsuite-files.mjs" \
    Button IconButton Modal Message Notification toaster \
    Stack ButtonToolbar ButtonGroup Divider Panel PanelGroup Drawer \
    Loader Toggle Tag Avatar Badge Progress Radio RadioGroup)
fi

if [ "${#FILES[@]}" -eq 0 ]; then
  echo "nothing to do"
  exit 0
fi

echo "running on ${#FILES[@]} files"

# 1. Notifications: toaster/Message -> enqueueSnackbar / Alert.
node "$CM/toaster-to-snackbar.mjs" "${FILES[@]}"
node "$CM/message-to-alert.mjs" "${FILES[@]}"
node "$CM/fix-snackbar-imports.mjs" "${FILES[@]}"

# 2. Button.
node "$CM/jsx-attrs.mjs" "$CM/button-rules.json" "${FILES[@]}"
node "$CM/move-imports.mjs" '{"Button":"@mui/material"}' "${FILES[@]}"

# 3. Modal -> Dialog.
node "$CM/jsx-attrs.mjs" "$CM/modal-rules.json" "${FILES[@]}"
node "$CM/flatten-dialog-title.mjs" "${FILES[@]}"
node "$CM/swap-import.mjs" '["Modal"]' \
  '["Dialog","DialogTitle","DialogContent","DialogActions"]' "${FILES[@]}"

# 4. IconButton -> IconButton (icon only) / Button + startIcon (icon + label).
#    Second argument lists local styled() wrappers whose names must survive.
node "$CM/icon-button.mjs" \
  '["IconButton","RIconButton","GridIcon","HideToggle","LeftArrow","RightArrow","ToolbarButton"]' \
  '["GridIcon","HideToggle","LeftArrow","RightArrow","ToolbarButton"]' "${FILES[@]}"

# 5. Layout odds and ends.
node "$CM/jsx-attrs.mjs" "$CM/simple-rules.json" "${FILES[@]}"
node "$CM/stack.mjs" "${FILES[@]}"

# 6. Panels, drawers, loaders, chips, switches, radios.
node "$CM/panel.mjs" "${FILES[@]}"
node "$CM/jsx-attrs.mjs" "$CM/drawer-rules.json" "${FILES[@]}"
node "$CM/loader.mjs" "${FILES[@]}"
node "$CM/jsx-attrs.mjs" "$CM/chip-rules.json" "${FILES[@]}"
node "$CM/chip-label.mjs" "${FILES[@]}"
node "$CM/toggle.mjs" "${FILES[@]}"
node "$CM/radio.mjs" "${FILES[@]}"

# 7. Imports: move what moved, add what is now used, drop duplicates.
node "$CM/swap-import.mjs" \
  '["IconButton","Stack","ButtonToolbar","ButtonGroup","Divider","Panel","PanelGroup","Drawer","Loader","Toggle","Tag","Avatar","Badge","Progress","Radio","RadioGroup"]' \
  '["IconButton","Button","Stack","Box","ButtonGroup","Divider","Card","CardContent","CardHeader","Accordion","AccordionSummary","AccordionDetails","Drawer","CircularProgress","Switch","FormControlLabel","Chip","Avatar","Badge","LinearProgress","Radio","RadioGroup"]' "${FILES[@]}"
node "$CM/styled-rebase.mjs" \
  '{"RPanel":"Card","Panel":"Card","PanelGroup":"Card","RLoader":"CircularProgress","Loader":"CircularProgress","RToggle":"Switch","Toggle":"Switch","RDivider":"Divider","RAvatar":"Avatar","RTag":"Chip","RBadge":"Badge","RIconButton":"IconButton","RButton":"Button","RButtonToolbar":"Stack","ButtonToolbar":"Stack","Radio":"Radio","Progress":"LinearProgress"}' \
  "${FILES[@]}"
node "$CM/editor-imports.mjs" "${FILES[@]}"
node "$CM/dedupe-imports.mjs" "${FILES[@]}"

# 8. `block` is a rsuite prop; only MUI buttons must lose it.
node "$CM/restore-block.mjs" "${FILES[@]}"

# 9. Forms. Aliases first: `const {Group, Label} = Form` hides the shape from
#    every codemod below it. Then inside-out — controls, then the groups that
#    held them, then the wrapper.
python3 "$CM/normalize-aliases.py" "${FILES[@]}"
node "$CM/form-styled.mjs" "${FILES[@]}"
node "$CM/form-control.mjs" "${FILES[@]}"
node "$CM/form-accepter.mjs" "${FILES[@]}"
node "$CM/form-group-layout.mjs" "${FILES[@]}"
node "$CM/form-stack.mjs" "${FILES[@]}"
node "$CM/form-bare.mjs" "${FILES[@]}"
# A `<Form model=…>` needs a hand-written zod schema; see form-wrappers.py.

# 10. Inputs, pickers, dates, checkboxes.
node "$CM/input.mjs" "${FILES[@]}"
node "$CM/picker-select.mjs" "${FILES[@]}"
node "$CM/picker-multi.mjs" "${FILES[@]}"
node "$CM/picker.mjs" "${FILES[@]}"
node "$CM/date-picker.mjs" "${FILES[@]}"
node "$CM/checkbox.mjs" "${FILES[@]}"

# 11. The rsuite CSS variables, which outlive every component.
node "$CM/rs-vars.mjs" "${FILES[@]}"
node "$CM/rs-vars-sx.mjs" "${FILES[@]}"

# 12. Whatever the steps above started using.
node "$CM/add-mui-import.mjs" \
  Autocomplete Box Checkbox FormControl FormControlLabel FormHelperText \
  FormLabel InputAdornment MenuItem Stack TextField \
  -- "${FILES[@]}"
node "$CM/dedupe-imports.mjs" "${FILES[@]}"

# 13. The conventions that came after the migration: a panel's own <form>
# breaks the drawer's scroll chain, and the rest are reported rather than
# rewritten because each needs a name or a judgement.
node "$CM/drawer-form.mjs" "${FILES[@]}"

echo
node "$CM/editor-conventions.mjs" "${FILES[@]}"

echo
echo "done — now run:"
echo "  pnpm nx typecheck editor"
echo "  pnpm nx run-many -t test lint -p ui-editor editor membership-editor settings-editor"
