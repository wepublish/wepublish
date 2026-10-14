import styled from '@emotion/styled';
import {
  BlockList,
  BlockMap,
  BlockValue,
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
import { Link } from 'react-router-dom';
import { Badge, Drawer, IconButton, Loader } from 'rsuite';

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
  renderMetadata(close: () => void): ReactNode;
};

/**
 * Editor header, block list and metadata drawer shared by the article and
 * page template editors.
 */
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
              <Link to={backPath}>
                <IconButton
                  circle
                  appearance="subtle"
                  icon={<MdKeyboardBackspace />}
                  title={t(`${i18nPrefix}.edit.backToList`)}
                  aria-label={t(`${i18nPrefix}.edit.backToList`)}
                  onClick={e => {
                    if (!unsavedChangesDialog()) e.preventDefault();
                  }}
                />
              </Link>
            }
            secondaryActions={
              <EditorHeaderButton
                appearance="subtle"
                icon={<MdIntegrationInstructions />}
                label={t(`${i18nPrefix}.edit.metadata`)}
                disabled={disabled}
                onClick={() => setMetaDrawerOpen(true)}
              />
            }
            primaryActions={
              isNew ?
                <PermissionControl qualifyingPermissions={[permissions.create]}>
                  <EditorHeaderButton
                    appearance="primary"
                    icon={<MdSave />}
                    label={t('create')}
                    collapse={false}
                    disabled={disabled}
                    onClick={() => onSave()}
                  />
                </PermissionControl>
              : <PermissionControl qualifyingPermissions={[permissions.update]}>
                  <Badge className={hasChanged ? 'unsaved' : 'saved'}>
                    <EditorHeaderButton
                      appearance="primary"
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

      {loadingMessage && (
        <Loader
          backdrop
          vertical
          content={loadingMessage}
        />
      )}

      <Drawer
        open={isMetaDrawerOpen}
        size={metadataDrawerSize}
        onClose={() => setMetaDrawerOpen(false)}
      >
        {renderMetadata(() => setMetaDrawerOpen(false))}
      </Drawer>
    </>
  );
}
