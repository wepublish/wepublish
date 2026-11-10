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
  FullImageFragment,
  PrintIssueInputModel,
  TinyPrintIssueFragment,
  UpdatePrintIssueDocument,
} from '@wepublish/editor/api';
import {
  ChooseEditImage,
  DRAWER_WIDTHS,
  enqueueSnackbar,
  ImageEditPanel,
  ImageSelectPanel,
  InfoTooltip,
} from '@wepublish/ui/editor';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdSave } from 'react-icons/md';
import { IssueNumber, MUTATION_OPTIONS_WITH_SUCCESS_MESSAGE } from './common';
import { PrintIssueStatusChip } from './print-issue-status';

const thisYear = () => new Date().getFullYear();
const FIRST_ISSUE: IssueNumber = { number: 1, year: thisYear() };

/** How many numbers «number to numberTo» covers: 2 for 3/4. */
const numbersOf = (number: number, numberTo: number | null) =>
  numberTo !== null && numberTo > number ? numberTo - number + 1 : 1;

/**
 * The issue form over the list: number (to number, for a double issue, and what
 * it counts as), year, ship day, topic, note, image. The options
 * live on the Druckliste; a new issue takes the medium's defaults, an edited
 * one keeps its own (the input leaves them out).
 */
export function PrintIssueDrawer({
  open,
  issue,
  next = FIRST_ISSUE,
  onClose,
}: {
  open: boolean;
  /** none: a new issue */
  issue: TinyPrintIssueFragment | null | undefined;
  /** what a new issue is called, see `nextIssue` */
  next?: IssueNumber;
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
      {/* keyed so that another issue, or a suggestion that arrives with the list, starts from its own values */}
      <PrintIssueForm
        key={issue?.id ?? `new-${next.number}-${next.year}`}
        issue={issue ?? null}
        next={next}
        onClose={onClose}
      />
    </Drawer>
  );
}

function PrintIssueForm({
  issue,
  next,
  onClose,
}: {
  issue: TinyPrintIssueFragment | null;
  next: IssueNumber;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [number, setNumber] = useState(issue?.number ?? next.number);
  const [numberTo, setNumberTo] = useState<number | null>(
    issue?.numberTo ?? null
  );
  const [countsAs, setCountsAs] = useState(issue?.countsAs ?? 1);
  const [title, setTitle] = useState(issue?.title ?? '');
  const [year, setYear] = useState(issue?.year ?? next.year);
  const [issueDate, setIssueDate] = useState(issue?.issueDate ?? '');
  const [note, setNote] = useState(issue?.note ?? '');
  const [image, setImage] = useState<FullImageFragment | null>(
    issue?.image ?? null
  );
  const [choosingImage, setChoosingImage] = useState(false);
  const [editingImage, setEditingImage] = useState(false);

  const numbers = numbersOf(number, numberTo);
  const numberToInvalid = numberTo !== null && numberTo <= number;

  // a double issue counts as the numbers it covers until told otherwise
  const changeNumbers = (from: number, to: number | null) => {
    setNumber(from);
    setNumberTo(to);
    setCountsAs(numbersOf(from, to));
  };

  const dirty =
    issue ?
      number !== issue.number ||
      numberTo !== (issue.numberTo ?? null) ||
      countsAs !== issue.countsAs ||
      title !== (issue.title ?? '') ||
      year !== issue.year ||
      issueDate !== issue.issueDate ||
      note !== (issue.note ?? '') ||
      (image?.id ?? null) !== (issue.imageId ?? null)
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
    numberTo: numberTo !== null && numberTo > number ? numberTo : null,
    year,
    countsAs: Math.min(countsAs, numbers),
    title: title.trim() || null,
    issueDate,
    note: note || null,
    imageId: image?.id ?? null,
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
            changeNumbers(
              Math.max(1, Number(event.target.value) || 1),
              numberTo
            )
          }
          slotProps={{ htmlInput: { min: 1 } }}
          sx={{ width: 120 }}
        />
        <TextField
          label={t('printIssues.fields.numberTo')}
          type="number"
          value={numberTo ?? ''}
          onChange={event =>
            changeNumbers(
              number,
              event.target.value === '' ? null : Number(event.target.value)
            )
          }
          error={numberToInvalid}
          helperText={
            numberToInvalid ?
              t('printIssues.fields.numberToInvalid')
            : undefined
          }
          slotProps={{ htmlInput: { min: number + 1 } }}
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

      {numbers > 1 && (
        <FormControl sx={{ width: 220 }}>
          <FormLabel>
            {t('printIssues.fields.countsAs')}{' '}
            <InfoTooltip text={t('printIssues.fields.countsAsHelp')} />
          </FormLabel>
          <TextField
            select
            value={Math.min(countsAs, numbers)}
            onChange={event => setCountsAs(Number(event.target.value))}
            slotProps={{
              select: { native: true },
              htmlInput: { 'aria-label': t('printIssues.fields.countsAs') },
            }}
          >
            {Array.from({ length: numbers }, (_, index) => numbers - index).map(
              count => (
                <option
                  key={count}
                  value={count}
                >
                  {t('printIssues.fields.countsAsOption', { count })}
                </option>
              )
            )}
          </TextField>
        </FormControl>
      )}

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
        label={t('printIssues.fields.title')}
        value={title}
        onChange={event => setTitle(event.target.value)}
      />

      <TextField
        label={t('printIssues.fields.note')}
        value={note}
        multiline
        minRows={2}
        onChange={event => setNote(event.target.value)}
      />

      <FormControl>
        <FormLabel id="print-issue-image-label">
          {t('printIssues.fields.image')}
        </FormLabel>
        <ChooseEditImage
          aria-labelledby="print-issue-image-label"
          image={image}
          disabled={creating || updating}
          maxHeight={240}
          onSelect={selected => setImage(selected)}
          openChooseModalOpen={() => setChoosingImage(true)}
          openEditModalOpen={() => setEditingImage(true)}
          removeImage={() => setImage(null)}
        />
      </FormControl>

      <Drawer
        anchor="right"
        open={choosingImage}
        onClose={() => setChoosingImage(false)}
        slotProps={{
          paper: { sx: { width: DRAWER_WIDTHS.sm, maxWidth: '100vw' } },
        }}
      >
        <ImageSelectPanel
          onClose={() => setChoosingImage(false)}
          onSelect={(selected: FullImageFragment) => {
            setChoosingImage(false);
            setImage(selected);
          }}
        />
      </Drawer>

      {image && (
        <Drawer
          anchor="right"
          open={editingImage}
          onClose={() => setEditingImage(false)}
          slotProps={{
            paper: {
              sx: {
                display: 'flex',
                flexDirection: 'column',
                width: DRAWER_WIDTHS.sm,
                maxWidth: '100vw',
              },
            },
          }}
        >
          <ImageEditPanel
            id={image.id}
            onClose={() => setEditingImage(false)}
            onSave={() => setEditingImage(false)}
          />
        </Drawer>
      )}

      <Stack
        direction="row"
        spacing={1}
      >
        <Button
          variant="contained"
          startIcon={<MdSave />}
          disabled={creating || updating || !dirty || numberToInvalid}
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
