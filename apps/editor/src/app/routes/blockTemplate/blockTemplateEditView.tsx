import styled from '@emotion/styled';
import { useMutation, useQuery } from '@apollo/client/react';
import {
  BlockTemplateDocument,
  CreateBlockTemplateDocument,
  CreateBlockTemplateMutationVariables,
  FullBlockFragment,
  UpdateBlockTemplateDocument,
} from '@wepublish/editor/api';
import {
  CanCreateBlockTemplate,
  CanDeleteBlockTemplate,
  CanUpdateBlockTemplate,
} from '@wepublish/permissions';
import {
  blockForQueryBlock,
  BlockList,
  BlockMap,
  BlockValue,
  ConfirmActionModal,
  createCheckedPermissionComponent,
  EditorTemplate,
  mapBlockValueToBlockInput,
  EditorHeader,
  EditorHeaderButton,
  PermissionControl,
  StateColor,
  TypographicTextArea,
  useAuthorisation,
  useUnsavedChangesDialog,
} from '@wepublish/ui/editor';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdKeyboardBackspace, MdSave } from 'react-icons/md';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Badge, IconButton, Message, Notification, toaster } from 'rsuite';

const NameInput = styled(TypographicTextArea)``;

const TemplateContent = styled.div`
  display: grid;
  gap: 24px;
  width: 100%;
`;

const initialBlocks: BlockValue[] = [];

function BlockTemplateEditView() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const params = useParams();
  const { id } = params;
  const isNew = id === undefined;

  const [hasChanged, setChanged] = useState(false);
  const [isSaveConfirmOpen, setSaveConfirmOpen] = useState(false);
  const [name, setName] = useState('');
  const [blocks, setBlocks] = useState<BlockValue[]>(
    isNew ? initialBlocks : []
  );

  const [
    createBlockTemplate,
    { data: createData, loading: isCreating, error: createError },
  ] = useMutation(CreateBlockTemplateDocument);
  const [updateBlockTemplate, { loading: isUpdating, error: updateError }] =
    useMutation(UpdateBlockTemplateDocument);

  const unsavedChangesDialog = useUnsavedChangesDialog(hasChanged);

  const blockTemplateId = (id || createData?.createBlockTemplate.id) ?? '';
  const {
    data: blockTemplateData,
    refetch,
    loading: isLoading,
  } = useQuery(BlockTemplateDocument, {
    errorPolicy: 'all',
    variables: { id: blockTemplateId },
    skip: !blockTemplateId,
  });

  const handleChange = useCallback(
    (blocks: React.SetStateAction<BlockValue[]>) => {
      setBlocks(blocks);
      setChanged(true);
    },
    []
  );

  useEffect(() => {
    const error = createError?.message ?? updateError?.message;
    if (error)
      toaster.push(
        <Message
          type="error"
          showIcon
          closable
          duration={0}
        >
          {error}
        </Message>
      );
  }, [createError, updateError]);

  const hydratedRevision = useRef<string | null>(null);

  useEffect(() => {
    const blockTemplate = blockTemplateData?.blockTemplate;

    if (!blockTemplate) {
      return;
    }

    const revision = `${blockTemplate.id}:${blockTemplate.modifiedAt}`;

    if (hydratedRevision.current === revision) {
      return;
    }

    hydratedRevision.current = revision;

    const { name, blocks } = blockTemplate;
    setName(name);
    setBlocks((blocks as FullBlockFragment[]).map(blockForQueryBlock));
  }, [blockTemplateData]);

  const [tagTitle, stateColor] =
    isNew ? [t('blockTemplates.edit.new'), StateColor.none]
    : hasChanged ? [t('blockTemplates.edit.editing'), StateColor.draft]
    : [t('blockTemplates.edit.saved'), StateColor.published];

  function createInput(): CreateBlockTemplateMutationVariables {
    return {
      name,
      blocks: blocks.map(mapBlockValueToBlockInput),
    };
  }
  const isAuthorized = useAuthorisation(CanCreateBlockTemplate.id);

  const isNotFound = blockTemplateData && !blockTemplateData.blockTemplate;
  const isDisabled =
    isLoading || isCreating || isUpdating || isNotFound || !isAuthorized;

  async function handleSave() {
    const input = createInput();

    if (blockTemplateId) {
      await updateBlockTemplate({
        variables: { id: blockTemplateId, ...input },
      });

      setChanged(false);
      toaster.push(
        <Notification
          type="success"
          header={t('blockTemplates.edit.saved')}
          duration={2000}
        />,
        { placement: 'bottomEnd' }
      );
      await refetch({ id: blockTemplateId });
    } else {
      const { data } = await createBlockTemplate({ variables: input });
      if (data) {
        navigate(
          `/block-content/templates/edit/${data?.createBlockTemplate.id}`,
          { replace: true }
        );
      }
      setChanged(false);
      toaster.push(
        <Notification
          type="success"
          header={t('blockTemplates.edit.created')}
          duration={2000}
        />,
        { placement: 'bottomEnd' }
      );
    }
  }

  return (
    <>
      <EditorTemplate
        navigationChildren={
          <EditorHeader
            state={stateColor}
            stateLabel={tagTitle}
            back={
              <Link to="/block-content/templates">
                <IconButton
                  circle
                  appearance="subtle"
                  icon={<MdKeyboardBackspace />}
                  title={t('blockTemplates.edit.backToList')}
                  aria-label={t('blockTemplates.edit.backToList')}
                  onClick={e => {
                    if (!unsavedChangesDialog()) e.preventDefault();
                  }}
                />
              </Link>
            }
            primaryActions={
              isNew && createData == null ?
                <PermissionControl
                  qualifyingPermissions={[CanCreateBlockTemplate.id]}
                >
                  <EditorHeaderButton
                    appearance="primary"
                    icon={<MdSave />}
                    label={t('create')}
                    collapse={false}
                    disabled={isDisabled}
                    onClick={() => handleSave()}
                  />
                </PermissionControl>
              : <PermissionControl
                  qualifyingPermissions={[CanUpdateBlockTemplate.id]}
                >
                  <Badge className={hasChanged ? 'unsaved' : 'saved'}>
                    <EditorHeaderButton
                      appearance="primary"
                      icon={<MdSave />}
                      label={t('save')}
                      collapse={false}
                      disabled={isDisabled}
                      onClick={() => setSaveConfirmOpen(true)}
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
            disabled={isDisabled}
            variant="title"
            align="center"
            placeholder={t('blockTemplates.edit.name')}
            onChange={e => {
              setName(e?.target?.value);
              setChanged(true);
            }}
          />

          <BlockList
            itemId={blockTemplateId}
            blockMap={BlockMap}
            value={blocks}
            disabled={isLoading || isDisabled || !isAuthorized}
            onChange={handleChange}
          />
        </TemplateContent>
      </EditorTemplate>

      {isSaveConfirmOpen && (
        <ConfirmActionModal
          title={t('blockTemplates.edit.saveConfirmTitle')}
          message={t('blockTemplates.edit.saveConfirmMessage')}
          onConfirm={() => {
            setSaveConfirmOpen(false);
            handleSave();
          }}
          onClose={() => setSaveConfirmOpen(false)}
        />
      )}
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanCreateBlockTemplate.id,
  CanUpdateBlockTemplate.id,
  CanDeleteBlockTemplate.id,
])(BlockTemplateEditView);

export { CheckedPermissionComponent as BlockTemplateEditView };
