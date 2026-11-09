import { useMutation } from '@apollo/client/react';
import {
  Button,
  Drawer,
  FormControl,
  FormLabel,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  CreatePrintIssueDocument,
  PrintIssueInputModel,
  TinyPrintIssueFragment,
  UpdatePrintIssueDocument,
} from '@wepublish/editor/api';
import {
  DRAWER_WIDTHS,
  enqueueSnackbar,
  InfoTooltip,
} from '@wepublish/ui/editor';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdSave } from 'react-icons/md';
import { MUTATION_OPTIONS_WITH_SUCCESS_MESSAGE } from './common';
import { PrintIssueStatusChip } from './print-issue-status';

const thisYear = () => new Date().getFullYear();

/**
 * The issue form over the list: number, year, ship day, note. The options
 * live on the Druckliste; a new issue takes the medium's defaults, an edited
 * one keeps its own (the input leaves them out).
 */
export function PrintIssueDrawer({
  open,
  issue,
  onClose,
}: {
  open: boolean;
  /** none: a new issue */
  issue: TinyPrintIssueFragment | null | undefined;
  onClose: () => void;
}) {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: { sx: { width: DRAWER_WIDTHS.sm, maxWidth: '100vw' } },
      }}
    >
      {/* keyed so that another issue starts from its own values */}
      <PrintIssueForm
        key={issue?.id ?? 'new'}
        issue={issue ?? null}
        onClose={onClose}
      />
    </Drawer>
  );
}

function PrintIssueForm({
  issue,
  onClose,
}: {
  issue: TinyPrintIssueFragment | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [number, setNumber] = useState(issue?.number ?? 1);
  const [year, setYear] = useState(issue?.year ?? thisYear());
  const [issueDate, setIssueDate] = useState(issue?.issueDate ?? '');
  const [note, setNote] = useState(issue?.note ?? '');

  const dirty =
    issue ?
      number !== issue.number ||
      year !== issue.year ||
      issueDate !== issue.issueDate ||
      note !== (issue.note ?? '')
    : !!issueDate;

  const [createIssue, { loading: creating }] = useMutation(
    CreatePrintIssueDocument,
    {
      ...MUTATION_OPTIONS_WITH_SUCCESS_MESSAGE(t('printIssues.saved')),
      refetchQueries: ['PrintIssues'],
    }
  );
  const [updateIssue, { loading: updating }] = useMutation(
    UpdatePrintIssueDocument,
    {
      ...MUTATION_OPTIONS_WITH_SUCCESS_MESSAGE(t('printIssues.saved')),
      refetchQueries: ['PrintIssues', 'PrintIssueById'],
    }
  );

  const input = (): PrintIssueInputModel => ({
    number,
    year,
    issueDate,
    note: note || null,
    // historic issues come from the importer; an edit keeps the stored status
    historic: false,
  });

  const save = async () => {
    if (!issueDate) {
      enqueueSnackbar(t('printIssues.issueDateRequired'), { variant: 'error' });
      return;
    }

    const result =
      issue ?
        await updateIssue({ variables: { id: issue.id, input: input() } })
      : await createIssue({ variables: { input: input() } });

    // with onError set, a refused mutation resolves without data
    if (result.data) {
      onClose();
    }
  };

  return (
    <Stack
      component="section"
      aria-labelledby="print-issue-form-title"
      spacing={3}
      sx={{ p: 3 }}
    >
      <Stack
        direction="row"
        spacing={1.5}
        sx={{ alignItems: 'center' }}
      >
        <Typography
          id="print-issue-form-title"
          variant="h6"
          component="h2"
        >
          {issue ?
            t('printIssues.drawer.editTitle', { label: issue.label })
          : t('printIssues.drawer.createTitle')}
        </Typography>
        {issue && <PrintIssueStatusChip issue={issue} />}
      </Stack>

      <Stack
        direction="row"
        spacing={2}
      >
        <TextField
          label={t('printIssues.fields.number')}
          type="number"
          value={number}
          onChange={event =>
            setNumber(Math.max(1, Number(event.target.value) || 1))
          }
          slotProps={{ htmlInput: { min: 1 } }}
          sx={{ width: 120 }}
        />
        <TextField
          label={t('printIssues.fields.year')}
          type="number"
          value={year}
          onChange={event => setYear(Number(event.target.value) || thisYear())}
          slotProps={{ htmlInput: { min: 2000, max: 2100 } }}
          sx={{ width: 120 }}
        />
      </Stack>

      <FormControl sx={{ width: 220 }}>
        <FormLabel>
          {t('printIssues.fields.issueDate')}{' '}
          <InfoTooltip text={t('printIssues.fields.issueDateHelp')} />
        </FormLabel>
        <TextField
          type="date"
          value={issueDate}
          required
          onChange={event => setIssueDate(event.target.value)}
          slotProps={{
            htmlInput: { 'aria-label': t('printIssues.fields.issueDate') },
          }}
        />
      </FormControl>

      <TextField
        label={t('printIssues.fields.note')}
        value={note}
        multiline
        minRows={2}
        onChange={event => setNote(event.target.value)}
      />

      <Stack
        direction="row"
        spacing={1}
      >
        <Button
          variant="contained"
          startIcon={<MdSave />}
          disabled={creating || updating || !dirty}
          onClick={save}
        >
          {t('save')}
        </Button>
        <Button
          variant="text"
          onClick={onClose}
        >
          {t('cancel')}
        </Button>
      </Stack>
    </Stack>
  );
}
