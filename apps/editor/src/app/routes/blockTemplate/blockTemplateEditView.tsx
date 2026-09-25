import styled from '@emotion/styled';
import {
  CreateBlockTemplateMutationVariables,
  FullBlockFragment,
  useBlockTemplateQuery,
  useCreateBlockTemplateMutation,
  useUpdateBlockTemplateMutation,
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
  createCheckedPermissionComponent,
  EditorTemplate,
  mapBlockValueToBlockInput,
  NavigationBar,
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
import {
  Badge,
  IconButton as RIconButton,
  Message,
  Notification,
  Tag as RTag,
  toaster,
} from 'rsuite';

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

const IconButton = styled(RIconButton)`
  margin-left: 10px;
`;

const NameInput = styled(TypographicTextArea)``;

const initialBlocks: BlockValue[] = [];

function BlockTemplateEditView() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const params = useParams();
  const { id } = params;
  const isNew = id === undefined;

  const [hasChanged, setChanged] = useState(false);
  const [name, setName] = useState('');
  const [blocks, setBlocks] = useState<BlockValue[]>(
    isNew ? initialBlocks : []
  );
  const [tagTitle, setTagTitle] = useState(
    isNew ? t('blockTemplates.edit.new') : t('blockTemplates.edit.editing')
  );
  const [stateColor, setStateColor] = useState<StateColor>(StateColor.none);

  const [
    createBlockTemplate,
    { data: createData, loading: isCreating, error: createError },
  ] = useCreateBlockTemplateMutation();
  const [updateBlockTemplate, { loading: isUpdating, error: updateError }] =
    useUpdateBlockTemplateMutation();

  const unsavedChangesDialog = useUnsavedChangesDialog(hasChanged);

  const blockTemplateId = (id || createData?.createBlockTemplate.id) ?? '';
  const {
    data: blockTemplateData,
    refetch,
    loading: isLoading,
  } = useBlockTemplateQuery({
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

  useEffect(() => {
    if (isNew) {
      setTagTitle(t('blockTemplates.edit.new'));
      setStateColor(StateColor.none);
    } else if (hasChanged) {
      setTagTitle(t('blockTemplates.edit.editing'));
      setStateColor(StateColor.draft);
    } else {
      setTagTitle(t('blockTemplates.edit.saved'));
      setStateColor(StateColor.published);
    }
  }, [isNew, t, hasChanged]);

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
      await Promise.all([refetch({ id: blockTemplateId })]);
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
    <FieldSet>
      <Legend>
        <Tag stateColor={stateColor}>{tagTitle}</Tag>
      </Legend>
      <EditorTemplate
        navigationChildren={
          <NavigationBar
            leftChildren={
              <Link to="/block-content/templates">
                <RIconButton
                  size="lg"
                  icon={<MdKeyboardBackspace />}
                  onClick={e => {
                    if (!unsavedChangesDialog()) e.preventDefault();
                  }}
                >
                  {t('blockTemplates.edit.backToList')}
                </RIconButton>
              </Link>
            }
            centerChildren={
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
            }
            rightChildren={
              isNew && createData == null ?
                <PermissionControl
                  qualifyingPermissions={[CanCreateBlockTemplate.id]}
                >
                  <IconButton
                    className="actionButton"
                    size="lg"
                    icon={<MdSave />}
                    disabled={isDisabled}
                    onClick={() => handleSave()}
                  >
                    {t('create')}
                  </IconButton>
                </PermissionControl>
              : <PermissionControl
                  qualifyingPermissions={[CanUpdateBlockTemplate.id]}
                >
                  <Badge className={hasChanged ? 'unsaved' : 'saved'}>
                    <IconButton
                      className="actionButton"
                      size="lg"
                      icon={<MdSave />}
                      disabled={isDisabled}
                      onClick={() => handleSave()}
                    >
                      {t('save')}
                    </IconButton>
                  </Badge>
                </PermissionControl>
            }
          ></NavigationBar>
        }
      >
        <BlockList
          itemId={blockTemplateId}
          blockMap={BlockMap}
          value={blocks}
          disabled={isLoading || isDisabled || !isAuthorized}
          onChange={handleChange}
        />
      </EditorTemplate>
    </FieldSet>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanCreateBlockTemplate.id,
  CanUpdateBlockTemplate.id,
  CanDeleteBlockTemplate.id,
])(BlockTemplateEditView);

export { CheckedPermissionComponent as BlockTemplateEditView };
