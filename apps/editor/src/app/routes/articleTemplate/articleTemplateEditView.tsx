import { useMutation, useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  ArticleTemplateDocument,
  CreateArticleTemplateDocument,
  CreateArticleTemplateMutationVariables,
  FullBlockFragment,
  UpdateArticleTemplateDocument,
} from '@wepublish/editor/api';
import {
  CanCreateArticleTemplate,
  CanDeleteArticleTemplate,
  CanUpdateArticleTemplate,
} from '@wepublish/permissions';
import {
  ArticleMetadata,
  ArticleMetadataPanel,
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
import {
  MdIntegrationInstructions,
  MdKeyboardBackspace,
  MdSave,
} from 'react-icons/md';
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import {
  Badge,
  Drawer,
  IconButton,
  Loader,
  Message,
  Notification,
  Tag as RTag,
  toaster,
} from 'rsuite';

import {
  emptyArticleMetadata,
  InitialArticleBlocks,
} from '../articles/articleDefaults';
import { useNewArticleDefaults } from '../articles/useNewArticleDefaults';
import {
  articleMetadataToMetadataInput,
  articleTemplateMetadataToArticleMetadata,
} from '../articles/articleMapping';
import {
  ArticleTemplatePrefill,
  useArticlePrefill,
  useArticleTemplatePrefill,
} from './articleTemplatePrefill';

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

function ArticleTemplateEditView() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { id } = useParams();
  const isNew = id === undefined;
  const [searchParams] = useSearchParams();
  const copyFromId = isNew ? searchParams.get('copyFrom') : null;
  const fromArticleId = isNew ? searchParams.get('fromArticle') : null;

  const [hasChanged, setChanged] = useState(false);
  const [isMetaDrawerOpen, setMetaDrawerOpen] = useState(false);
  const [name, setName] = useState('');
  const [blocks, setBlocks] = useState<BlockValue[]>(
    isNew ? InitialArticleBlocks : []
  );
  const [metadata, setMetadata] =
    useState<ArticleMetadata>(emptyArticleMetadata);

  useNewArticleDefaults(setMetadata, {
    skip: !isNew || !!copyFromId || !!fromArticleId,
  });

  const applyPrefill = useCallback(
    ({ name, blocks, metadata }: ArticleTemplatePrefill) => {
      setName(name);
      setBlocks(blocks);
      setMetadata(meta => ({ ...meta, ...metadata }));
      setChanged(true);
    },
    []
  );

  const { loading: isLoadingCopy } = useArticleTemplatePrefill(
    copyFromId,
    useCallback(
      (prefill: ArticleTemplatePrefill) =>
        applyPrefill({
          ...prefill,
          name: t('articleTemplates.edit.copyName', { name: prefill.name }),
        }),
      [applyPrefill, t]
    )
  );
  const { loading: isLoadingArticle } = useArticlePrefill(
    fromArticleId,
    applyPrefill
  );

  const [
    createArticleTemplate,
    { data: createData, loading: isCreating, error: createError },
  ] = useMutation(CreateArticleTemplateDocument);
  const [updateArticleTemplate, { loading: isUpdating, error: updateError }] =
    useMutation(UpdateArticleTemplateDocument);

  const unsavedChangesDialog = useUnsavedChangesDialog(hasChanged);

  const articleTemplateId = (id || createData?.createArticleTemplate.id) ?? '';
  const {
    data: articleTemplateData,
    refetch,
    loading: isLoading,
  } = useQuery(ArticleTemplateDocument, {
    errorPolicy: 'all',
    variables: { id: articleTemplateId },
    skip: !articleTemplateId,
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
    const articleTemplate = articleTemplateData?.articleTemplate;

    if (!articleTemplate) {
      return;
    }

    const revision = `${articleTemplate.id}:${articleTemplate.modifiedAt}:${articleTemplate.blockTemplate.modifiedAt}`;

    if (hydratedRevision.current === revision) {
      return;
    }

    hydratedRevision.current = revision;

    setName(articleTemplate.blockTemplate.name);
    setBlocks(
      (articleTemplate.blockTemplate.blocks as FullBlockFragment[]).map(
        blockForQueryBlock
      )
    );
    setMetadata({
      ...emptyArticleMetadata,
      ...articleTemplateMetadataToArticleMetadata(articleTemplate.metadata),
    });
  }, [articleTemplateData]);

  const [tagTitle, stateColor] =
    isNew && !createData ? [t('articleTemplates.edit.new'), StateColor.none]
    : hasChanged ? [t('articleTemplates.edit.editing'), StateColor.draft]
    : [t('articleTemplates.edit.saved'), StateColor.published];

  function createInput(): CreateArticleTemplateMutationVariables {
    return {
      name,
      blocks: blocks.map(mapBlockValueToBlockInput),
      metadata: articleMetadataToMetadataInput(metadata),
    };
  }

  const canCreate = useAuthorisation(CanCreateArticleTemplate.id);
  const canUpdate = useAuthorisation(CanUpdateArticleTemplate.id);
  const isAuthorized = articleTemplateId ? canUpdate : canCreate;

  const isNotFound =
    articleTemplateData && !articleTemplateData.articleTemplate;
  const isDisabled =
    isLoading ||
    isLoadingCopy ||
    isLoadingArticle ||
    isCreating ||
    isUpdating ||
    isNotFound ||
    !isAuthorized;

  async function handleSave() {
    const input = createInput();

    if (articleTemplateId) {
      await updateArticleTemplate({
        variables: { id: articleTemplateId, ...input },
      });

      setChanged(false);
      toaster.push(
        <Notification
          type="success"
          header={t('articleTemplates.edit.saved')}
          duration={2000}
        />,
        { placement: 'bottomEnd' }
      );
      await refetch({ id: articleTemplateId });
    } else {
      const { data } = await createArticleTemplate({ variables: input });

      if (data) {
        navigate(`/articles/templates/edit/${data.createArticleTemplate.id}`, {
          replace: true,
        });
      }

      setChanged(false);
      toaster.push(
        <Notification
          type="success"
          header={t('articleTemplates.edit.created')}
          duration={2000}
        />,
        { placement: 'bottomEnd' }
      );
    }
  }

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
                <Link to="/articles/templates">
                  <IconButton
                    size="lg"
                    icon={<MdKeyboardBackspace />}
                    onClick={e => {
                      if (!unsavedChangesDialog()) e.preventDefault();
                    }}
                  >
                    {t('articleTemplates.edit.backToList')}
                  </IconButton>
                </Link>
              }
              centerChildren={
                <NameInput
                  value={name}
                  disabled={isDisabled}
                  variant="title"
                  align="center"
                  placeholder={t('articleTemplates.edit.name')}
                  onChange={e => {
                    setName(e?.target?.value);
                    setChanged(true);
                  }}
                />
              }
              rightChildren={
                <RightChildren>
                  <IconButton
                    size="lg"
                    icon={<MdIntegrationInstructions />}
                    disabled={isDisabled}
                    onClick={() => setMetaDrawerOpen(true)}
                  >
                    {t('articleTemplates.edit.metadata')}
                  </IconButton>
                  {isNew && createData == null ?
                    <PermissionControl
                      qualifyingPermissions={[CanCreateArticleTemplate.id]}
                    >
                      <IconButton
                        size="lg"
                        icon={<MdSave />}
                        disabled={isDisabled}
                        onClick={() => handleSave()}
                      >
                        {t('create')}
                      </IconButton>
                    </PermissionControl>
                  : <PermissionControl
                      qualifyingPermissions={[CanUpdateArticleTemplate.id]}
                    >
                      <Badge className={hasChanged ? 'unsaved' : 'saved'}>
                        <IconButton
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
                </RightChildren>
              }
            />
          }
        >
          <BlockList
            itemId={articleTemplateId}
            blockMap={BlockMap}
            value={blocks}
            disabled={isDisabled}
            onChange={handleChange}
          />
        </EditorTemplate>
      </FieldSet>

      {(isLoadingCopy || isLoadingArticle) && (
        <Loader
          backdrop
          vertical
          content={
            isLoadingCopy ?
              t('articleTemplates.edit.loadingTemplate')
            : t('articleTemplates.edit.loadingArticle')
          }
        />
      )}

      <Drawer
        open={isMetaDrawerOpen}
        size="md"
        onClose={() => setMetaDrawerOpen(false)}
      >
        <ArticleMetadataPanel
          articleID={null}
          peerId={null}
          value={metadata}
          infoData={{ charCount: 0 }}
          isTemplate
          onClose={() => setMetaDrawerOpen(false)}
          onChange={value => {
            setMetadata(value);
            setChanged(true);
          }}
        />
      </Drawer>
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanCreateArticleTemplate.id,
  CanUpdateArticleTemplate.id,
  CanDeleteArticleTemplate.id,
])(ArticleTemplateEditView);

export { CheckedPermissionComponent as ArticleTemplateEditView };
