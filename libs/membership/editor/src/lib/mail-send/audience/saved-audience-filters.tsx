import { useMutation, useQuery } from '@apollo/client/react';
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  CreateSavedAudienceFilterDocument,
  DeleteSavedAudienceFilterDocument,
  FullSavedAudienceFilterFragment,
  MailAudienceInput,
  SavedAudienceFiltersDocument,
  UpdateSavedAudienceFilterDocument,
} from '@wepublish/editor/api';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdDelete, MdEdit, MdSave } from 'react-icons/md';
import {
  MUTATION_OPTIONS_WITH_SUCCESS_MESSAGE,
  showErrors,
} from '../../common';
import { useAudienceLookups } from '../../delivery-mode/use-audience-lookups';
import {
  AudienceFilterState,
  DroppedReferences,
  loadSavedAudience,
} from './audience-state';
import { describeAudience } from './audience-summary';

type SavedFilter = FullSavedAudienceFilterFragment;

/** The name-and-description form: a new filter, or one being edited. */
type Draft = {
  /** Null while the current filter is being saved as a new one. */
  id: string | null;
  name: string;
  description: string;
  error: 'nameRequired' | 'nameTaken' | null;
};

type Loaded = { name: string; dropped: DroppedReferences };

export type SavedAudienceFiltersProps = {
  /** The filter as the controls hold it right now: what "save" keeps. */
  audience: MailAudienceInput;
  /** Puts a saved filter into the controls. */
  onLoad: (state: AudienceFilterState) => void;
};

const REFETCH = { refetchQueries: ['SavedAudienceFilters'] };

/** The stored audience arrives as an untyped JSON value. */
const audienceOf = (filter: SavedFilter) =>
  (filter.audience ?? {}) as Record<string, unknown>;

/**
 * The recipient filters kept under a name, next to the filter they are loaded
 * into. The same list serves the manual messages and the manual channel
 * assignment, since both use the same filter.
 */
export function SavedAudienceFilters({
  audience,
  onLoad,
}: SavedAudienceFiltersProps) {
  const { t } = useTranslation();
  const lookups = useAudienceLookups();
  const { data, error } = useQuery(SavedAudienceFiltersDocument);
  const filters = data?.savedAudienceFilters ?? [];

  const [draft, setDraft] = useState<Draft | null>(null);
  const [toOverwrite, setToOverwrite] = useState<SavedFilter | null>(null);
  const [toDelete, setToDelete] = useState<SavedFilter | null>(null);
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  useEffect(() => {
    if (error) {
      showErrors(error);
    }
  }, [error]);

  const [createFilter] = useMutation(CreateSavedAudienceFilterDocument, {
    ...MUTATION_OPTIONS_WITH_SUCCESS_MESSAGE(t('mailSend.savedFilters.saved')),
    ...REFETCH,
  });
  const [updateFilter] = useMutation(UpdateSavedAudienceFilterDocument, {
    ...MUTATION_OPTIONS_WITH_SUCCESS_MESSAGE(
      t('mailSend.savedFilters.updated')
    ),
    ...REFETCH,
  });
  const [deleteFilter] = useMutation(DeleteSavedAudienceFilterDocument, {
    ...MUTATION_OPTIONS_WITH_SUCCESS_MESSAGE(
      t('mailSend.savedFilters.deleted')
    ),
    ...REFETCH,
  });

  const load = (filter: SavedFilter) => {
    const { state, dropped } = loadSavedAudience(audienceOf(filter), lookups);

    onLoad(state);
    setLoaded({ name: filter.name, dropped });
  };

  const submitDraft = () => {
    if (!draft) {
      return;
    }

    const name = draft.name.trim();
    const description = draft.description.trim();
    const taken = filters.some(
      filter =>
        filter.id !== draft.id &&
        filter.name.trim().toLowerCase() === name.toLowerCase()
    );

    if (!name || taken) {
      setDraft({ ...draft, error: name ? 'nameTaken' : 'nameRequired' });

      return;
    }

    if (draft.id) {
      updateFilter({
        variables: { id: draft.id, input: { name, description } },
      });
    } else {
      createFilter({
        variables: {
          input: { name, description: description || null, audience },
        },
      });
    }

    setDraft(null);
  };

  const droppedNotes =
    loaded ?
      (Object.entries(loaded.dropped) as [keyof DroppedReferences, number][])
        .filter(([, count]) => count > 0)
        .map(([kind, count]) =>
          t(`mailSend.savedFilters.dropped.${kind}`, { count })
        )
    : [];

  return (
    <Card variant="outlined">
      <CardHeader
        title={t('mailSend.savedFilters.title')}
        subheader={t('mailSend.savedFilters.intro')}
        slotProps={{
          title: { variant: 'h6' },
          subheader: { variant: 'body2' },
        }}
        action={
          <Button
            variant="outlined"
            size="small"
            startIcon={<MdAdd />}
            onClick={() =>
              setDraft({ id: null, name: '', description: '', error: null })
            }
          >
            {t('mailSend.savedFilters.save')}
          </Button>
        }
      />

      <CardContent>
        {loaded && (
          <Alert
            severity={droppedNotes.length ? 'warning' : 'success'}
            onClose={() => setLoaded(null)}
            sx={{ marginBottom: 2 }}
          >
            {t('mailSend.savedFilters.loaded', { name: loaded.name })}
            {droppedNotes.length > 0 && (
              <>
                {' '}
                {t('mailSend.savedFilters.droppedIntro')}{' '}
                {droppedNotes.join(', ')}
              </>
            )}
          </Alert>
        )}

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>
                  <strong>{t('mailSend.savedFilters.name')}</strong>
                </TableCell>
                <TableCell>
                  <strong>{t('mailSend.savedFilters.description')}</strong>
                </TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {data && !filters.length && (
                <TableRow>
                  <TableCell colSpan={3}>
                    {t('mailSend.savedFilters.empty')}
                  </TableCell>
                </TableRow>
              )}

              {filters.map(filter => (
                <TableRow
                  key={filter.id}
                  sx={{ verticalAlign: 'top' }}
                >
                  <TableCell
                    component="th"
                    scope="row"
                  >
                    {filter.name}
                  </TableCell>
                  <TableCell>
                    {filter.description && (
                      <Typography
                        variant="body2"
                        sx={{ marginBottom: 0.5 }}
                      >
                        {filter.description}
                      </Typography>
                    )}
                    <Stack
                      direction="row"
                      spacing={0.5}
                      useFlexGap
                      sx={{ flexWrap: 'wrap' }}
                    >
                      {describeAudience(audienceOf(filter), lookups).map(
                        phrase => (
                          <Chip
                            key={phrase}
                            size="small"
                            variant="outlined"
                            label={phrase}
                          />
                        )
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => load(filter)}
                    >
                      {t('mailSend.savedFilters.load')}
                    </Button>
                    <Tooltip title={t('mailSend.savedFilters.overwrite')}>
                      <IconButton
                        size="small"
                        aria-label={t('mailSend.savedFilters.overwrite')}
                        onClick={() => setToOverwrite(filter)}
                      >
                        <MdSave />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t('mailSend.savedFilters.edit')}>
                      <IconButton
                        size="small"
                        aria-label={t('mailSend.savedFilters.edit')}
                        onClick={() =>
                          setDraft({
                            id: filter.id,
                            name: filter.name,
                            description: filter.description ?? '',
                            error: null,
                          })
                        }
                      >
                        <MdEdit />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t('mailSend.savedFilters.delete')}>
                      <IconButton
                        size="small"
                        aria-label={t('mailSend.savedFilters.delete')}
                        onClick={() => setToDelete(filter)}
                      >
                        <MdDelete />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>

      <Dialog
        fullWidth
        maxWidth="xs"
        open={!!draft}
        onClose={() => setDraft(null)}
      >
        <DialogTitle>
          {t(
            draft?.id ?
              'mailSend.savedFilters.editTitle'
            : 'mailSend.savedFilters.saveTitle'
          )}
        </DialogTitle>
        <DialogContent>
          <Stack
            spacing={2}
            sx={{ paddingTop: 1 }}
          >
            <TextField
              autoFocus
              required
              label={t('mailSend.savedFilters.name')}
              value={draft?.name ?? ''}
              onChange={event =>
                draft &&
                setDraft({ ...draft, name: event.target.value, error: null })
              }
              error={!!draft?.error}
              helperText={
                draft?.error ? t(`mailSend.savedFilters.${draft.error}`) : ' '
              }
              slotProps={{
                htmlInput: {
                  'aria-label': t('mailSend.savedFilters.name'),
                  maxLength: 120,
                },
              }}
            />
            <TextField
              multiline
              minRows={2}
              label={t('mailSend.savedFilters.description')}
              value={draft?.description ?? ''}
              onChange={event =>
                draft && setDraft({ ...draft, description: event.target.value })
              }
              slotProps={{
                htmlInput: {
                  'aria-label': t('mailSend.savedFilters.description'),
                  maxLength: 500,
                },
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            onClick={submitDraft}
          >
            {t('mailSend.savedFilters.confirmSave')}
          </Button>
          <Button
            variant="text"
            onClick={() => setDraft(null)}
          >
            {t('cancel')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        fullWidth
        maxWidth="xs"
        open={!!toOverwrite}
        onClose={() => setToOverwrite(null)}
      >
        <DialogTitle>{t('mailSend.savedFilters.overwriteTitle')}</DialogTitle>
        <DialogContent>
          {t('mailSend.savedFilters.overwriteQuestion', {
            name: toOverwrite?.name,
          })}
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            onClick={() => {
              if (toOverwrite) {
                updateFilter({
                  variables: { id: toOverwrite.id, input: { audience } },
                });
              }
              setToOverwrite(null);
            }}
          >
            {t('mailSend.savedFilters.overwriteConfirm')}
          </Button>
          <Button
            variant="text"
            onClick={() => setToOverwrite(null)}
          >
            {t('cancel')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        fullWidth
        maxWidth="xs"
        open={!!toDelete}
        onClose={() => setToDelete(null)}
      >
        <DialogTitle>{t('mailSend.savedFilters.deleteTitle')}</DialogTitle>
        <DialogContent>
          {t('mailSend.savedFilters.deleteQuestion', { name: toDelete?.name })}
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              if (toDelete) {
                deleteFilter({ variables: { id: toDelete.id } });
              }
              setToDelete(null);
            }}
          >
            {t('mailSend.savedFilters.deleteConfirm')}
          </Button>
          <Button
            variant="text"
            onClick={() => setToDelete(null)}
          >
            {t('cancel')}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
