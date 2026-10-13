import styled from '@emotion/styled';
import {
  BlockList,
  BlockMap,
  BlockValue,
  EditorTemplate,
  NavigationBar,
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
import { Badge, Drawer, IconButton, Loader, Tag as RTag } from 'rsuite';

const FieldSet = styled('fieldset')``;

const Legend = styled.legend`
  width: auto;
  margin: 0px auto;
`;

const Tag = styled(RTag, {
  shouldForwardProp: prop => prop !== 'stateColor',
})<{ stateColor: string }>`
  background-color: ${({ stateColor }) => stateColor};
`;

const RightChildren = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 12px;
`;

const NameInput = styled(TypographicTextArea)``;

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
 * Navigation bar, block list and metadata drawer shared by the article and
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
      <FieldSet>
        <Legend>
          <Tag stateColor={stateColor}>{tagTitle}</Tag>
        </Legend>
        <EditorTemplate
          navigationChildren={
            <NavigationBar
              leftChildren={
                <Link to={backPath}>
                  <IconButton
                    size="lg"
                    icon={<MdKeyboardBackspace />}
                    onClick={e => {
                      if (!unsavedChangesDialog()) e.preventDefault();
                    }}
                  >
                    {t(`${i18nPrefix}.edit.backToList`)}
                  </IconButton>
                </Link>
              }
              centerChildren={
                <NameInput
                  value={name}
                  disabled={disabled}
                  variant="title"
                  align="center"
                  placeholder={t(`${i18nPrefix}.edit.name`)}
                  onChange={e => onNameChange(e?.target?.value)}
                />
              }
              rightChildren={
                <RightChildren>
                  <IconButton
                    size="lg"
                    icon={<MdIntegrationInstructions />}
                    disabled={disabled}
                    onClick={() => setMetaDrawerOpen(true)}
                  >
                    {t(`${i18nPrefix}.edit.metadata`)}
                  </IconButton>
                  {isNew ?
                    <PermissionControl
                      qualifyingPermissions={[permissions.create]}
                    >
                      <IconButton
                        size="lg"
                        icon={<MdSave />}
                        disabled={disabled}
                        onClick={() => onSave()}
                      >
                        {t('create')}
                      </IconButton>
                    </PermissionControl>
                  : <PermissionControl
                      qualifyingPermissions={[permissions.update]}
                    >
                      <Badge className={hasChanged ? 'unsaved' : 'saved'}>
                        <IconButton
                          size="lg"
                          icon={<MdSave />}
                          disabled={disabled}
                          onClick={() => onSave()}
                        >
                          {t('save')}
                        </IconButton>
                      </Badge>
                    </PermissionControl>
                  }
                </RightChildren>
              }
            />
          }
        >
          <BlockList
            itemId={itemId}
            blockMap={BlockMap}
            value={blocks}
            disabled={disabled}
            onChange={onBlocksChange}
          />
        </EditorTemplate>
      </FieldSet>

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
