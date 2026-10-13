import { useMutation, useQuery } from '@apollo/client/react';
import {
  ArticleTemplateDocument,
  CreateArticleTemplateDocument,
  CreateArticleTemplateMutationVariables,
  UpdateArticleTemplateDocument,
} from '@wepublish/editor/api';
import {
  CanCreateArticleTemplate,
  CanDeleteArticleTemplate,
  CanUpdateArticleTemplate,
} from '@wepublish/permissions';
import {
  ArticleMetadataPanel,
  createCheckedPermissionComponent,
  mapBlockValueToBlockInput,
  useAuthorisation,
} from '@wepublish/ui/editor';
import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Message, Notification, toaster } from 'rsuite';

import {
  emptyArticleMetadata,
  InitialArticleBlocks,
} from '../articles/articleDefaults';
import {
  articleMetadataToMetadataInput,
  articleTemplateMetadataToArticleMetadata,
} from '../articles/articleMapping';
import { useNewArticleDefaults } from '../articles/useNewArticleDefaults';
import { TemplateEditorLayout } from '../templates/templateEditorLayout';
import { useTemplateEditor } from '../templates/useTemplateEditor';
import {
  ArticleTemplatePrefill,
  useArticlePrefill,
  useArticleTemplatePrefill,
} from './articleTemplatePrefill';

function ArticleTemplateEditView() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { id } = useParams();
  const isNew = id === undefined;
  const [searchParams] = useSearchParams();
  const copyFromId = isNew ? searchParams.get('copyFrom') : null;
  const fromArticleId = isNew ? searchParams.get('fromArticle') : null;

  const [
    createArticleTemplate,
    { data: createData, loading: isCreating, error: createError },
  ] = useMutation(CreateArticleTemplateDocument);
  const [updateArticleTemplate, { loading: isUpdating, error: updateError }] =
    useMutation(UpdateArticleTemplateDocument);

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

  const {
    name,
    changeName,
    blocks,
    changeBlocks,
    metadata,
    setMetadata,
    changeMetadata,
    hasChanged,
    setChanged,
    applyPrefill,
  } = useTemplateEditor({
    emptyMetadata: emptyArticleMetadata,
    initialBlocks: isNew ? InitialArticleBlocks : [],
    template: articleTemplateData?.articleTemplate,
    toMetadata: articleTemplateMetadataToArticleMetadata,
  });

  useNewArticleDefaults(setMetadata, {
    skip: !isNew || !!copyFromId || !!fromArticleId,
  });

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
    !!isNotFound ||
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
    <TemplateEditorLayout
      i18nPrefix="articleTemplates"
      backPath="/articles/templates"
      permissions={{
        create: CanCreateArticleTemplate.id,
        update: CanUpdateArticleTemplate.id,
      }}
      isNew={isNew && createData == null}
      hasChanged={hasChanged}
      disabled={isDisabled}
      itemId={articleTemplateId}
      name={name}
      onNameChange={changeName}
      blocks={blocks}
      onBlocksChange={changeBlocks}
      onSave={handleSave}
      loadingMessage={
        isLoadingCopy ? t('articleTemplates.edit.loadingTemplate')
        : isLoadingArticle ?
          t('articleTemplates.edit.loadingArticle')
        : undefined
      }
      renderMetadata={close => (
        <ArticleMetadataPanel
          articleID={null}
          peerId={null}
          value={metadata}
          infoData={{ charCount: 0 }}
          isTemplate
          onClose={close}
          onChange={changeMetadata}
        />
      )}
    />
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanCreateArticleTemplate.id,
  CanUpdateArticleTemplate.id,
  CanDeleteArticleTemplate.id,
])(ArticleTemplateEditView);

export { CheckedPermissionComponent as ArticleTemplateEditView };
