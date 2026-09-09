import { javascript } from '@codemirror/lang-javascript';
import { EditorView } from '@codemirror/view';
import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { ComponentData, createUsePuck, Data } from '@puckeditor/core';
import CodeMirror from '@uiw/react-codemirror';
import { useEffect, useMemo, useState } from 'react';

const ROOT_ZONE = 'root:default-zone';

const EditorWrapper = styled(Box)`
  margin: ${({ theme }) => theme.spacing(0, 1.5, 1.5)};
  border: 1px solid ${({ theme }) => theme.palette.divider};
  border-radius: 6px;
  overflow: hidden;
  background-color: #fff;

  & .cm-editor.cm-focused {
    outline: none;
  }

  & .cm-scroller {
    font-family:
      'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
    font-size: 12px;
    line-height: 1.5;
  }
`;

const usePuck = createUsePuck();

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const parseComponentData = (
  text: string,
  original: ComponentData
): { data: ComponentData } | { error: string } => {
  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch (e) {
    return { error: (e as Error).message };
  }

  if (!isRecord(parsed)) {
    return { error: 'Component data must be an object.' };
  }

  if (typeof parsed.type !== 'string') {
    return { error: '"type" must be a string.' };
  }

  if (!isRecord(parsed.props)) {
    return { error: '"props" must be an object.' };
  }

  if (parsed.props.id !== original.props.id) {
    return { error: '"props.id" must not be changed.' };
  }

  return { data: parsed as ComponentData };
};

const parseDocumentData = (
  text: string
): { data: Data } | { error: string } => {
  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch (e) {
    return { error: (e as Error).message };
  }

  if (!isRecord(parsed)) {
    return { error: 'Document data must be an object.' };
  }

  if (!isRecord(parsed.root)) {
    return { error: '"root" must be an object.' };
  }

  if (!Array.isArray(parsed.content)) {
    return { error: '"content" must be an array.' };
  }

  if (parsed.zones !== undefined && !isRecord(parsed.zones)) {
    return { error: '"zones" must be an object if provided.' };
  }

  return { data: parsed as Data };
};

export const RawDataView = () => {
  const selectedItem = usePuck(state => state.selectedItem);
  const itemSelector = usePuck(state => state.appState.ui.itemSelector);
  const data = usePuck(state => state.appState.data);
  const dispatch = usePuck(state => state.dispatch);

  const source = useMemo(
    () => JSON.stringify(selectedItem ?? data, null, 2),
    [selectedItem, data]
  );

  const [edited, setEdited] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectionKey = selectedItem?.props.id ?? null;

  useEffect(() => {
    setEdited(null);
    setError(null);
  }, [selectionKey]);

  const extensions = useMemo(() => [javascript(), EditorView.lineWrapping], []);

  const value = edited ?? source;
  const isDirty = edited !== null && edited !== source;

  const handleChange = (next: string) => {
    setEdited(next);
    setError(null);
  };

  const handleReset = () => {
    setEdited(null);
    setError(null);
  };

  const handleApply = () => {
    if (selectedItem) {
      const result = parseComponentData(value, selectedItem);

      if ('error' in result) {
        setError(result.error);
        return;
      }

      dispatch({
        type: 'replace',
        destinationIndex: itemSelector?.index ?? 0,
        destinationZone: itemSelector?.zone ?? ROOT_ZONE,
        data: result.data,
      });
    } else {
      const result = parseDocumentData(value);

      if ('error' in result) {
        setError(result.error);
        return;
      }

      dispatch({
        type: 'setData',
        data: result.data,
      });
    }

    setEdited(null);
    setError(null);
  };

  return (
    <>
      <Box sx={{ p: 2 }}>
        <Typography
          variant="h5"
          component="div"
          fontWeight={600}
        >
          Raw Data
        </Typography>

        <Typography
          variant="body2"
          component="div"
          color="text.secondary"
        >
          {selectedItem ?
            `Editing "${selectedItem.type}"`
          : 'Editing the whole document'}
        </Typography>
      </Box>

      <EditorWrapper>
        <CodeMirror
          value={value}
          maxHeight="400px"
          extensions={extensions}
          onChange={handleChange}
          basicSetup={{
            lineNumbers: true,
            highlightActiveLine: true,
            highlightActiveLineGutter: true,
            foldGutter: true,
          }}
        />
      </EditorWrapper>

      {error && (
        <Alert
          severity="error"
          sx={{ mx: 1.5, mb: 1.5 }}
        >
          {error}
        </Alert>
      )}

      <Stack
        direction="row"
        spacing={1}
        sx={{ px: 1.5, pb: 2 }}
      >
        <Button
          variant="contained"
          size="small"
          disabled={!isDirty}
          onClick={handleApply}
        >
          Apply
        </Button>

        <Button
          variant="outlined"
          size="small"
          disabled={!isDirty}
          onClick={handleReset}
        >
          Reset
        </Button>
      </Stack>
    </>
  );
};
