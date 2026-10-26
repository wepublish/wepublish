import { useApolloClient, useMutation, useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Badge,
  Drawer,
  IconButton,
  TextField,
  Typography,
} from '@mui/material';
import {
  CreateEventDocument,
  DuplicateEventDocument,
  EditorEventDocument,
  EditorEventFragment,
  EventScheduleType,
  PublishEventDocument,
  RequestEventReviewDocument,
  UnpublishEditorEventDocument,
  UpdateEventContentDocument,
  UpdateEventDocument,
  UpdateEventImageAltTextDocument,
  WithdrawEventReviewDocument,
} from '@wepublish/editor/api';
import {
  characterCount,
  EVENT_DESCRIPTION_MAX_LENGTH,
  EVENT_NAME_MAX_LENGTH,
} from '@wepublish/event/schedule';
import { CanCreateEvent, CanGetEvent } from '@wepublish/permissions';
import {
  BlockList,
  BlockMap,
  BlockValue,
  createCheckedPermissionComponent,
  DRAWER_WIDTHS,
  EditorHeader,
  EditorHeaderButton,
  EditorTemplate,
  enqueueSnackbar,
  humanizeError,
  PermissionControl,
  useUnsavedChangesDialog,
} from '@wepublish/ui/editor';
import { useEffect, useState } from 'react';
import {
  FieldErrors,
  FormProvider,
  useForm,
  Controller,
} from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  MdContentCopy,
  MdIntegrationInstructions,
  MdKeyboardBackspace,
  MdSave,
} from 'react-icons/md';
import {
  Link as RouterLink,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';

import {
  emptyEventForm,
  eventDescriptionLength,
  EventFormValues,
  eventFormSchema,
} from '../event-form-schema';
import {
  formatEventDateTime,
  formatEventNumber,
} from '../event-list/event-format';
import { eventEditPath } from '../event-list/event-paths';
import { translateFormError } from '../form-error';
import { VisuallyHidden } from '../visually-hidden';
import { eventFormFromEvent } from './event-form-mapping';
import {
  EventMetadataPanel,
  EventMetadataTab,
  isEventMetadataTab,
  METADATA_TITLE_ID,
} from './event-metadata-panel';
import {
  eventEditorState,
  EventPublicationControl,
} from './event-publication-control';
import {
  defaultsAfterSave,
  EventSaveFailure,
  EventSaveGroup,
  saveEvent,
} from './event-save';

const FIELD_TABS: Record<keyof EventFormValues, EventMetadataTab | null> = {
  name: null,
  blocks: null,
  printDescription: 'general',
  images: 'general',
  status: 'general',
  place: 'general',
  tagIds: 'general',
  audienceId: 'general',
  organization: 'general',
  owner: 'general',
  showInPrint: 'general',
  schedule: 'dates',
  rates: 'pricing',
  specialRate: 'pricing',
  ticketingUrl: 'pricing',
  slug: 'social',
  seoTitle: 'social',
  seoDescription: 'social',
  socialMediaTitle: 'social',
  socialMediaDescription: 'social',
  socialMediaImage: 'social',
};

const lastSavedAt = (event: EditorEventFragment) =>
  [event.modifiedAt, event.latest?.createdAt]
    .filter((date): date is string => !!date)
    .reduce((latest, date) =>
      new Date(date) > new Date(latest) ? date : latest
    );

const firstProblem = (errors: FieldErrors<EventFormValues>) =>
  (Object.keys(FIELD_TABS) as (keyof EventFormValues)[]).find(
    field => errors[field]
  );

const Canvas = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing(3)};
  width: 100%;
`;

const NameField = styled(TextField)`
  .MuiInputBase-input {
    font-size: 1.75rem;
    font-weight: 600;
    line-height: 1.3;
  }
`;

const messageOf = (error: unknown) =>
  error instanceof Error ? humanizeError(error) : String(error);

type SaveReport = { saved: EventSaveGroup[]; failed: EventSaveFailure[] };

function SaveFailure({ report }: { report: SaveReport }) {
  const { t } = useTranslation();
  const groups = (list: EventSaveGroup[]) =>
    list.map(group => t(`agenda.editor.saveGroups.${group}`)).join(', ');

  return (
    <Alert severity="error">
      {report.saved.length > 0 && (
        <div>
          {t('agenda.editor.saveResult.saved', {
            groups: groups(report.saved),
          })}
        </div>
      )}
      <div>
        {t('agenda.editor.saveResult.notSaved', {
          groups: groups(report.failed.map(({ group }) => group)),
        })}
      </div>
      <ul>
        {report.failed.map(({ group, message }) => (
          <li key={group}>
            {t(`agenda.editor.saveGroups.${group}`)}: {message}
          </li>
        ))}
      </ul>
      <div>{t('agenda.editor.saveResult.kept')}</div>
    </Alert>
  );
}

function EventEditorForm({ id }: { id: string | undefined }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const client = useApolloClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [now] = useState(() => new Date());
  const [loadError, setLoadError] = useState<string>();
  const [report, setReport] = useState<SaveReport | null>(null);
  const [invalid, setInvalid] = useState(false);
  const [busy, setBusy] = useState(false);

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema(now)),
    defaultValues: async () => {
      if (!id) {
        return emptyEventForm();
      }

      try {
        const { data } = await client.query({
          query: EditorEventDocument,
          variables: { id },
        });

        return data?.event ? eventFormFromEvent(data.event) : emptyEventForm();
      } catch (error) {
        setLoadError(messageOf(error));

        return emptyEventForm();
      }
    },
  });
  const { control, formState, getValues, setFocus } = form;
  const { isDirty, isLoading } = formState;

  const { data } = useQuery(EditorEventDocument, {
    variables: { id: id ?? '' },
    skip: !id,
  });
  const event = data?.event ?? undefined;

  const [createEvent] = useMutation(CreateEventDocument);
  const [updateEvent] = useMutation(UpdateEventDocument, {
    refetchQueries: ['EditorEventOccurrences'],
  });
  const [updateEventContent] = useMutation(UpdateEventContentDocument);
  const [updateImageAltText] = useMutation(UpdateEventImageAltTextDocument);
  const [publishEvent] = useMutation(PublishEventDocument);
  const [unpublishEvent] = useMutation(UnpublishEditorEventDocument);
  const [requestEventReview] = useMutation(RequestEventReviewDocument);
  const [withdrawEventReview] = useMutation(WithdrawEventReviewDocument);
  const [duplicateEvent] = useMutation(DuplicateEventDocument);

  const unsavedChangesDialog = useUnsavedChangesDialog(isDirty);

  const tabParam = searchParams.get('tab');
  const tab = isEventMetadataTab(tabParam) ? tabParam : null;
  const focus = searchParams.get('focus');
  const readOnly = event?.viewerCan?.update === false;

  const openTab = (next: EventMetadataTab) =>
    setSearchParams(
      params => {
        params.set('tab', next);
        return params;
      },
      { replace: true }
    );

  const closeDrawer = () =>
    setSearchParams(
      params => {
        params.delete('tab');
        params.delete('focus');
        return params;
      },
      { replace: true }
    );

  useEffect(() => {
    if (isLoading || tab !== 'dates' || focus !== 'dateTo') {
      return;
    }

    const timer = setTimeout(() => {
      const scheduleType = getValues('schedule.scheduleType');

      if (scheduleType === EventScheduleType.Weekly) {
        setFocus('schedule.weekly.dateTo');
      } else if (scheduleType === EventScheduleType.Continuous) {
        setFocus('schedule.continuous.dateTo');
      }
    });

    return () => clearTimeout(timer);
  }, [isLoading, tab, focus, getValues, setFocus]);

  const persist = async (values: EventFormValues) => {
    const defaults = formState.defaultValues as EventFormValues;

    setBusy(true);
    setInvalid(false);

    const result = await saveEvent({
      id,
      defaults,
      values,
      mutations: {
        createEvent: async (input, content) => {
          const { data } = await createEvent({ variables: { input, content } });

          if (!data) {
            throw new Error(t('errors.unexpected'));
          }

          return data.createEvent.id;
        },
        updateEvent: (eventId, input) =>
          updateEvent({ variables: { id: eventId, input } }),
        updateEventContent: (eventId, input) =>
          updateEventContent({ variables: { id: eventId, input } }),
        updateImageAltText: variables => updateImageAltText({ variables }),
      },
    }).finally(() => setBusy(false));

    if (result.saved.length) {
      form.reset(defaultsAfterSave(defaults, values, result.saved), {
        keepValues: true,
      });
    }

    if (!id && result.id) {
      navigate(eventEditPath(result.id), { replace: true });

      if (result.failed.length) {
        enqueueSnackbar(
          t('agenda.editor.createdWithProblems', {
            problems: result.failed.map(({ message }) => message).join(' · '),
          }),
          { variant: 'warning', autoHideDuration: null }
        );
      } else {
        enqueueSnackbar('', {
          variant: 'success',
          title: t('agenda.editor.created'),
          autoHideDuration: 2000,
        });
      }

      return true;
    }

    if (result.failed.length) {
      setReport(result);

      return false;
    }

    setReport(null);
    enqueueSnackbar('', {
      variant: 'success',
      title: t('agenda.editor.saved'),
      autoHideDuration: 2000,
    });

    return true;
  };

  const showProblems = (errors: FieldErrors<EventFormValues>) => {
    const field = firstProblem(errors);
    const problemTab = field ? FIELD_TABS[field] : null;

    setInvalid(true);

    if (problemTab) {
      openTab(problemTab);
    } else {
      closeDrawer();
      setFocus('name');
    }
  };

  const submit = () =>
    new Promise<boolean>(resolve => {
      form.handleSubmit(
        async values => resolve(await persist(values)),
        errors => {
          showProblems(errors);
          resolve(false);
        }
      )();
    });

  const act = async (run: () => Promise<unknown>, success: string) => {
    if (isDirty && !(await submit())) {
      return;
    }

    setBusy(true);

    try {
      await run();
      enqueueSnackbar('', {
        variant: 'success',
        title: t(success),
        autoHideDuration: 2000,
      });
    } catch (error) {
      enqueueSnackbar(messageOf(error), {
        variant: 'error',
        autoHideDuration: null,
      });
    } finally {
      setBusy(false);
    }
  };

  const duplicate = async () => {
    if (!id || !unsavedChangesDialog()) {
      return;
    }

    setBusy(true);

    try {
      const { data } = await duplicateEvent({ variables: { id } });

      if (data?.duplicateEvent) {
        navigate(eventEditPath(data.duplicateEvent.id));
      }
    } catch (error) {
      enqueueSnackbar(messageOf(error), {
        variant: 'error',
        autoHideDuration: null,
      });
    } finally {
      setBusy(false);
    }
  };

  const state = eventEditorState(event, now, t, i18n.language);

  const notice =
    report ? <SaveFailure report={report} />
    : invalid ? <Alert severity="warning">{t('agenda.editor.invalid')}</Alert>
    : null;

  return (
    <FormProvider {...form}>
      <EditorTemplate
        navigationChildren={
          <EditorHeader
            state={state.color}
            stateLabel={state.label}
            meta={
              event &&
              t('agenda.editor.lastChanged', {
                date: formatEventDateTime(lastSavedAt(event), i18n.language),
              })
            }
            back={
              <IconButton
                component={RouterLink}
                to="/events"
                title={t('agenda.editor.back')}
                aria-label={t('agenda.editor.back')}
                onClick={clickEvent => {
                  if (!unsavedChangesDialog()) {
                    clickEvent.preventDefault();
                  }
                }}
              >
                <MdKeyboardBackspace />
              </IconButton>
            }
            secondaryActions={
              <>
                <EditorHeaderButton
                  variant="text"
                  icon={<MdIntegrationInstructions />}
                  label={t('agenda.editor.metadata')}
                  disabled={isLoading}
                  onClick={() => openTab(tab ?? 'general')}
                />

                {event?.viewerCan?.duplicate === true && (
                  <EditorHeaderButton
                    variant="text"
                    icon={<MdContentCopy />}
                    label={t('agenda.editor.duplicate')}
                    disabled={busy}
                    onClick={duplicate}
                  />
                )}
              </>
            }
            primaryActions={
              <>
                {!id && (
                  <PermissionControl
                    qualifyingPermissions={[CanCreateEvent.id]}
                  >
                    <EditorHeaderButton
                      variant="contained"
                      icon={<MdSave />}
                      label={t('create')}
                      collapse={false}
                      disabled={busy || isLoading}
                      onClick={submit}
                    />
                  </PermissionControl>
                )}

                {id && !readOnly && (
                  <Badge
                    variant="dot"
                    color="warning"
                    invisible={!isDirty}
                  >
                    <EditorHeaderButton
                      variant="outlined"
                      icon={<MdSave />}
                      label={t('save')}
                      collapse="sm"
                      disabled={busy || isLoading}
                      onClick={submit}
                    />
                  </Badge>
                )}

                {event && (
                  <EventPublicationControl
                    event={event}
                    now={now}
                    disabled={busy || isLoading}
                    hasChanges={isDirty}
                    onPublish={publishAt =>
                      act(
                        () =>
                          publishEvent({
                            variables: {
                              id: event.id,
                              publishAt: publishAt?.toISOString() ?? null,
                            },
                          }),
                        publishAt ?
                          'agenda.editor.publish.scheduled'
                        : 'agenda.editor.publish.published'
                      )
                    }
                    onUnpublish={() =>
                      act(
                        () => unpublishEvent({ variables: { id: event.id } }),
                        'agenda.editor.unpublish.done'
                      )
                    }
                    onRequestReview={() =>
                      act(
                        () =>
                          requestEventReview({ variables: { id: event.id } }),
                        'agenda.editor.review.requested'
                      )
                    }
                    onWithdrawReview={() =>
                      act(
                        () =>
                          withdrawEventReview({ variables: { id: event.id } }),
                        'agenda.editor.review.withdrawn'
                      )
                    }
                  />
                )}
              </>
            }
          />
        }
      >
        {!isLoading && (
          <Canvas>
            <VisuallyHidden as="h1">
              {event ?
                t('agenda.editor.heading', { name: event.latest?.name ?? '' })
              : t('agenda.editor.headingNew')}
            </VisuallyHidden>

            {loadError && <Alert severity="error">{loadError}</Alert>}

            {readOnly && (
              <Alert severity="info">
                {t('agenda.editor.readOnly', {
                  organization:
                    event?.organization?.name ?? t('agenda.editor.agendaTeam'),
                })}
              </Alert>
            )}

            {notice}

            <Controller
              control={control}
              name="name"
              render={({ field, fieldState }) => (
                <NameField
                  {...field}
                  inputRef={field.ref}
                  label={t('agenda.editor.name')}
                  placeholder={t('agenda.editor.namePlaceholder')}
                  error={!!fieldState.error}
                  helperText={
                    translateFormError(t, fieldState.error?.message) ??
                    t('agenda.editor.nameCount', {
                      current: characterCount(field.value),
                      max: EVENT_NAME_MAX_LENGTH,
                    })
                  }
                  slotProps={{ htmlInput: { readOnly } }}
                  variant="standard"
                  fullWidth
                />
              )}
            />

            <Controller
              control={control}
              name="blocks"
              render={({ field, fieldState }) => {
                const error = translateFormError(t, fieldState.error?.message);

                return (
                  <div>
                    <BlockList<BlockValue>
                      itemId={id}
                      value={field.value}
                      onChange={next =>
                        field.onChange(
                          typeof next === 'function' ?
                            next(getValues('blocks'))
                          : next
                        )
                      }
                      disabled={readOnly || busy}
                      blockMap={BlockMap}
                    />

                    <Typography
                      variant="body2"
                      color={error ? 'error' : 'text.secondary'}
                    >
                      {error ??
                        t('agenda.editor.descriptionCount', {
                          current: formatEventNumber(
                            eventDescriptionLength(field.value),
                            i18n.language
                          ),
                          max: formatEventNumber(
                            EVENT_DESCRIPTION_MAX_LENGTH,
                            i18n.language
                          ),
                        })}
                    </Typography>
                  </div>
                );
              }}
            />
          </Canvas>
        )}
      </EditorTemplate>

      <Drawer
        anchor="right"
        open={!!tab && !isLoading}
        onClose={closeDrawer}
        slotProps={{
          paper: {
            'aria-labelledby': METADATA_TITLE_ID,
            sx: { width: DRAWER_WIDTHS.md, maxWidth: '100vw' },
          },
        }}
      >
        {tab && (
          <EventMetadataPanel
            tab={tab}
            event={event}
            now={now}
            readOnly={readOnly}
            busy={busy}
            notice={notice}
            onTabChange={openTab}
            onSave={submit}
            onSaveAndClose={async () => {
              if (await submit()) {
                closeDrawer();
              }
            }}
            onClose={closeDrawer}
          />
        )}
      </Drawer>
    </FormProvider>
  );
}

function EventEditorRoute() {
  const { id } = useParams();

  return (
    <EventEditorForm
      key={id ?? 'new'}
      id={id}
    />
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanGetEvent.id,
  CanCreateEvent.id,
])(EventEditorRoute);

export { CheckedPermissionComponent as EventEditor };
