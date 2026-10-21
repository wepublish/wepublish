import styled from '@emotion/styled';
import { Badge, Drawer, IconButton } from '@mui/material';
import {
  BlockList,
  BlockMap,
  BlockValue,
  DRAWER_WIDTHS,
  EditorHeader,
  EditorHeaderButton,
  EditorTemplate,
  PermissionControl,
  StateColor,
  TypographicTextArea,
  useUnsavedChangesDialog,
} from '@wepublish/ui/editor';
import { ReactNode, SetStateAction, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MdIntegrationInstructions,
  MdKeyboardBackspace,
  MdSave,
} from 'react-icons/md';
import { Link as RouterLink } from 'react-router-dom';

import { TemplateLoadingBackdrop } from './templateLoadingBackdrop';

const NameInput = styled(TypographicTextArea)``;

const TemplateContent = styled.div`
  display: grid;
  gap: 24px;
  width: 100%;
`;

type TemplateEditorLayoutProps = {
  /** Translation namespace with the `edit.*` keys. */
  i18nPrefix: string;
  backPath: string;
  permissions: { create: string; update: string };
  /** Whether the template has not been created yet. */
  isNew: boolean;
  hasChanged: boolean;
  disabled: boolean;
  itemId: string;
  name: string;
  onNameChange(name: string): void;
  blocks: BlockValue[];
  onBlocksChange(blocks: SetStateAction<BlockValue[]>): void;
  onSave(): void;
  /** Shown above the editor while something it depends on loads. */
  loadingMessage?: string;
  metadataDrawerSize?: 'sm' | 'md';
  renderMetadata?(close: () => void): ReactNode;
};

export function TemplateEditorLayout({
  i18nPrefix,
  backPath,
  permissions,
  isNew,
  hasChanged,
  disabled,
  itemId,
  name,
  onNameChange,
  blocks,
  onBlocksChange,
  onSave,
  loadingMessage,
  metadataDrawerSize = 'md',
  renderMetadata,
}: TemplateEditorLayoutProps) {
  const { t } = useTranslation();
  const [isMetaDrawerOpen, setMetaDrawerOpen] = useState(false);
  const unsavedChangesDialog = useUnsavedChangesDialog(hasChanged);

  const [tagTitle, stateColor] =
    isNew ? [t(`${i18nPrefix}.edit.new`), StateColor.none]
    : hasChanged ? [t(`${i18nPrefix}.edit.editing`), StateColor.draft]
    : [t(`${i18nPrefix}.edit.saved`), StateColor.published];

  return (
    <>
      <EditorTemplate
        navigationChildren={
          <EditorHeader
            state={stateColor}
            stateLabel={tagTitle}
            back={
              <IconButton
                component={RouterLink}
                to={backPath}
                title={t(`${i18nPrefix}.edit.backToList`)}
                aria-label={t(`${i18nPrefix}.edit.backToList`)}
                onClick={e => {
                  if (!unsavedChangesDialog()) {
                    e.preventDefault();
                  }
                }}
              >
                <MdKeyboardBackspace />
              </IconButton>
            }
            secondaryActions={
              renderMetadata && (
                <EditorHeaderButton
                  variant="text"
                  icon={<MdIntegrationInstructions />}
                  label={t(`${i18nPrefix}.edit.metadata`)}
                  disabled={disabled}
                  onClick={() => setMetaDrawerOpen(true)}
                />
              )
            }
            primaryActions={
              isNew ?
                <PermissionControl qualifyingPermissions={[permissions.create]}>
                  <EditorHeaderButton
                    variant="contained"
                    icon={<MdSave />}
                    label={t('create')}
                    collapse={false}
                    disabled={disabled}
                    onClick={() => onSave()}
                  />
                </PermissionControl>
              : <PermissionControl qualifyingPermissions={[permissions.update]}>
                  <Badge
                    variant="dot"
                    color="warning"
                    invisible={!hasChanged}
                  >
                    <EditorHeaderButton
                      variant="contained"
                      icon={<MdSave />}
                      label={t('save')}
                      collapse={false}
                      disabled={disabled}
                      onClick={() => onSave()}
                    />
                  </Badge>
                </PermissionControl>
            }
          />
        }
      >
        <TemplateContent>
          <NameInput
            value={name}
            disabled={disabled}
            variant="title"
            align="center"
            placeholder={t(`${i18nPrefix}.edit.name`)}
            onChange={e => onNameChange(e?.target?.value)}
          />

          <BlockList
            itemId={itemId}
            blockMap={BlockMap}
            value={blocks}
            disabled={disabled}
            onChange={onBlocksChange}
          />
        </TemplateContent>
      </EditorTemplate>

      <TemplateLoadingBackdrop
        open={!!loadingMessage}
        label={loadingMessage ?? ''}
      />

      {renderMetadata && (
        <Drawer
          anchor="right"
          slotProps={{
            paper: {
              sx: {
                width: DRAWER_WIDTHS[metadataDrawerSize],
                maxWidth: '100vw',
              },
            },
          }}
          open={isMetaDrawerOpen}
          onClose={() => setMetaDrawerOpen(false)}
        >
          {renderMetadata(() => setMetaDrawerOpen(false))}
        </Drawer>
      )}
    </>
  );
}
