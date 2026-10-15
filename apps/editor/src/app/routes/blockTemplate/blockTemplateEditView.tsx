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
  BlockValue,
  ConfirmActionModal,
  createCheckedPermissionComponent,
  mapBlockValueToBlockInput,
  useAuthorisation,
} from '@wepublish/ui/editor';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { Message, Notification, toaster } from 'rsuite';

import { TemplateEditorLayout } from '../templates/templateEditorLayout';

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
      <TemplateEditorLayout
        i18nPrefix="blockTemplates"
        backPath="/block-content/templates"
        permissions={{
          create: CanCreateBlockTemplate.id,
          update: CanUpdateBlockTemplate.id,
        }}
        isNew={isNew && createData == null}
        hasChanged={hasChanged}
        disabled={isDisabled}
        itemId={blockTemplateId}
        name={name}
        onNameChange={name => {
          setName(name);
          setChanged(true);
        }}
        blocks={blocks}
        onBlocksChange={handleChange}
        onSave={() =>
          blockTemplateId ? setSaveConfirmOpen(true) : handleSave()
        }
      />

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
