import {
  Dialog,
  IconButton,
  IconButtonProps,
  Switch,
  Tooltip,
} from '@mui/material';
import { createUsePuck, Data, useGetPuck } from '@puckeditor/core';
import {
  EditorHeader,
  EditorHeaderButton,
  EditorHeaderMenuAction,
  PublishDialogContent,
  useUnsavedChangesDialog,
} from '@wepublish/ui/editor';
import {
  ReactNode,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  MdCloudUpload,
  MdEdit,
  MdKeyboardBackspace,
  MdOpenInNew,
  MdRedo,
  MdRemoveRedEye,
  MdSave,
  MdUndo,
} from 'react-icons/md';
import { Link as RouterLink } from 'react-router-dom';

import {
  PuckDocumentController,
  usePuckDocumentController,
} from './header.context';
import { PuckFrameDocumentContext } from './header.frame';
import {
  toStateColor,
  usePuckAutosave,
  usePuckDocumentDirty,
  useSaveShortcut,
} from './header.helpers';
import { PuckHeaderAutosaveLabel, PuckHeaderBadge } from './header.styles';

const usePuck = createUsePuck();

type HeaderIconActionProps = Omit<IconButtonProps, 'children'> & {
  label: string;
  icon: ReactNode;
};

function HeaderIconAction({ label, icon, ...props }: HeaderIconActionProps) {
  return (
    <Tooltip title={label}>
      <span>
        <IconButton
          color="primary"
          aria-label={label}
          {...props}
        >
          {icon}
        </IconButton>
      </span>
    </Tooltip>
  );
}

export type PuckDocumentHeaderViewProps = {
  controller: PuckDocumentController;
  dirty: boolean;
  saving: boolean;
  canUndo: boolean;
  canRedo: boolean;
  previewMode: 'edit' | 'interactive';
  onUndo: () => void;
  onRedo: () => void;
  onTogglePreview: () => void;
  onSave: () => void;
  onPublish: (publishedAt: Date) => void;
};

export function PuckDocumentHeaderView({
  controller,
  dirty,
  saving,
  canUndo,
  canRedo,
  previewMode,
  onUndo,
  onRedo,
  onTogglePreview,
  onSave,
  onPublish,
}: PuckDocumentHeaderViewProps) {
  const { t } = useTranslation();
  const unsavedId = useId();
  const unpublishedId = useId();
  const [isPublishDialogOpen, setPublishDialogOpen] = useState(false);
  const confirmLeave = useUnsavedChangesDialog(dirty);

  const {
    backTo,
    backLabel,
    status,
    statusLabel,
    lastSavedAt,
    isNew,
    busy,
    canSave,
    canPublish,
    previewUrl,
    publishDialog,
    autosave,
    menuActions = [],
  } = controller;
  const disabled = !!busy || saving;
  const unpublished = controller.hasUnpublishedChanges || status === 'draft';
  const previewing = previewMode === 'interactive';

  const actions: EditorHeaderMenuAction[] = [
    ...(previewUrl ?
      [
        {
          label: t('', 'Open preview'),
          icon: <MdOpenInNew />,
          disabled: dirty,
          onClick: () =>
            window.open(previewUrl, '_blank', 'noopener,noreferrer'),
        },
      ]
    : []),
    ...menuActions,
  ];

  const publish = () => {
    if (publishDialog) {
      setPublishDialogOpen(true);
      return;
    }

    onPublish(new Date());
  };

  return (
    <>
      <EditorHeader
        state={toStateColor(status)}
        stateLabel={statusLabel}
        meta={
          lastSavedAt &&
          t('lastSavedAt', 'Last saved {{date, ccc PP pp}}', {
            date: lastSavedAt,
          })
        }
        back={
          <Tooltip title={backLabel}>
            <IconButton
              component={RouterLink}
              to={backTo}
              aria-label={backLabel}
              onClick={event => {
                if (!confirmLeave()) {
                  event.preventDefault();
                }
              }}
            >
              <MdKeyboardBackspace />
            </IconButton>
          </Tooltip>
        }
        statusAction={
          autosave && (
            <Tooltip
              describeChild
              title={t(
                'autosave.description',
                'Save the draft every 30 seconds while you work'
              )}
            >
              <PuckHeaderAutosaveLabel
                control={
                  <Switch
                    size="small"
                    checked={autosave.enabled}
                    disabled={isNew || disabled}
                    onChange={(_event, checked) => autosave.onToggle(checked)}
                  />
                }
                label={t('autosave.label', 'Autosave')}
              />
            </Tooltip>
          )
        }
        menuActions={actions}
        secondaryActions={
          <>
            <HeaderIconAction
              label={t('', 'Undo')}
              icon={<MdUndo />}
              disabled={!canUndo}
              onClick={onUndo}
            />
            <HeaderIconAction
              label={t('', 'Redo')}
              icon={<MdRedo />}
              disabled={!canRedo}
              onClick={onRedo}
            />
            <EditorHeaderButton
              variant="outlined"
              icon={previewing ? <MdEdit /> : <MdRemoveRedEye />}
              label={
                previewing ?
                  t('preview.backToEditor', 'Editor')
                : t('', 'Preview')
              }
              onClick={onTogglePreview}
            />
          </>
        }
        primaryActions={
          isNew ?
            canSave && (
              <EditorHeaderButton
                variant="contained"
                icon={<MdSave />}
                label={t('create', 'Create')}
                collapse={false}
                disabled={disabled}
                onClick={onSave}
              />
            )
          : <>
              {canSave && (
                <PuckHeaderBadge
                  variant="dot"
                  color="warning"
                  invisible={!dirty}
                >
                  <EditorHeaderButton
                    variant="outlined"
                    icon={<MdSave />}
                    label={t('save', 'Save')}
                    collapse="sm"
                    disabled={disabled}
                    aria-describedby={dirty ? unsavedId : undefined}
                    onClick={onSave}
                  />
                </PuckHeaderBadge>
              )}
              {canPublish && controller.onPublish && (
                <PuckHeaderBadge
                  variant="dot"
                  color="warning"
                  invisible={!unpublished}
                >
                  <EditorHeaderButton
                    variant="contained"
                    icon={<MdCloudUpload />}
                    label={t('publishDialog.publish', 'Publish')}
                    collapse={false}
                    disabled={disabled}
                    aria-describedby={unpublished ? unpublishedId : undefined}
                    onClick={publish}
                  />
                </PuckHeaderBadge>
              )}
              <span
                hidden
                id={unsavedId}
              >
                {t('', 'Unsaved changes')}
              </span>
              <span
                hidden
                id={unpublishedId}
              >
                {t('', 'Unpublished changes')}
              </span>
            </>
        }
      />

      {publishDialog && (
        <Dialog
          fullWidth
          maxWidth="sm"
          open={isPublishDialogOpen}
          onClose={() => setPublishDialogOpen(false)}
        >
          <PublishDialogContent
            title={publishDialog.title}
            url={publishDialog.url}
            publishedAtDate={publishDialog.publishedAt}
            dateLabel={publishDialog.dateLabel}
            dateHelperText={publishDialog.dateHelperText}
            pendingMessage={publishDialog.pendingMessage}
            checks={publishDialog.checks}
            options={publishDialog.options}
            closeLabel={t('close', 'Close')}
            onClose={() => setPublishDialogOpen(false)}
            onConfirm={publishedAt => {
              setPublishDialogOpen(false);
              onPublish(publishedAt);
            }}
          />
        </Dialog>
      )}
    </>
  );
}

function ConnectedPuckDocumentHeader({
  controller,
}: {
  controller: PuckDocumentController;
}) {
  const getPuck = useGetPuck();
  const dispatch = usePuck(puck => puck.dispatch);
  const canUndo = usePuck(puck => puck.history.hasPast);
  const canRedo = usePuck(puck => puck.history.hasFuture);
  const undo = usePuck(puck => puck.history.back);
  const redo = usePuck(puck => puck.history.forward);
  const previewMode = usePuck(puck => puck.appState.ui.previewMode);
  const { dirty, markSaved } = usePuckDocumentDirty();
  const [saving, setSaving] = useState(false);
  const blocked = saving || !!controller.busy;

  const commit = async (task: (data: Data) => Promise<void>) => {
    const { data } = getPuck().appState;

    setSaving(true);
    await task(data).then(
      () => markSaved(data),
      () => undefined
    );
    setSaving(false);
  };

  const save = async () => {
    if (blocked || !controller.canSave) {
      return;
    }

    await commit(data => controller.onSave(data));
  };

  const publish = async (publishedAt: Date) => {
    const { onPublish } = controller;

    if (blocked || !controller.canPublish || !onPublish) {
      return;
    }

    await commit(data => onPublish(data, publishedAt));
  };

  usePuckAutosave({
    enabled:
      !!controller.autosave?.enabled &&
      !controller.isNew &&
      controller.canSave &&
      !blocked,
    hasChanged: dirty,
    onAutosave: save,
    savedAt: controller.lastSavedAt,
  });

  useSaveShortcut(save);

  return (
    <PuckDocumentHeaderView
      controller={controller}
      dirty={dirty}
      saving={saving}
      canUndo={canUndo}
      canRedo={canRedo}
      previewMode={previewMode}
      onUndo={undo}
      onRedo={redo}
      onTogglePreview={() =>
        dispatch({
          type: 'setUi',
          ui: { previewMode: previewMode === 'edit' ? 'interactive' : 'edit' },
        })
      }
      onSave={save}
      onPublish={publish}
    />
  );
}

export function PuckDocumentHeader() {
  const { t } = useTranslation();
  const controller = usePuckDocumentController();

  return (
    <ConnectedPuckDocumentHeader
      controller={
        controller ?? {
          backTo: '/',
          backLabel: t('', 'Back'),
          status: 'none',
          statusLabel: t('', 'Not saved'),
          isNew: true,
          hasUnpublishedChanges: false,
          canSave: false,
          canPublish: false,
          onSave: async () => undefined,
        }
      }
    />
  );
}

export function PuckFrameDocumentProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [frameDocument, setFrameDocument] = useState<Document | null>(null);
  const value = useMemo(
    () => ({ frameDocument, setFrameDocument }),
    [frameDocument]
  );

  return (
    <PuckFrameDocumentContext.Provider value={value}>
      {children}
    </PuckFrameDocumentContext.Provider>
  );
}

export function PuckFrameDocumentRegistration({
  children,
  document: frameDocument,
}: {
  children: ReactNode;
  document?: Document;
}) {
  const frameDocumentState = useContext(PuckFrameDocumentContext);
  const setFrameDocument = frameDocumentState?.setFrameDocument;

  useEffect(() => {
    if (!setFrameDocument || !frameDocument) {
      return;
    }

    setFrameDocument(frameDocument);

    return () => setFrameDocument(null);
  }, [setFrameDocument, frameDocument]);

  return <>{children}</>;
}
