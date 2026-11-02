import { useMutation, useQuery } from '@apollo/client/react';
import {
  ArticleDocument,
  ArticleTemplateDocument,
  CreateArticleTemplateDocument,
  UpdateArticleTemplateDocument,
} from '@wepublish/editor/api';
import {
  CanCreateArticleTemplate,
  CanDeleteArticleTemplate,
  CanUpdateArticleTemplate,
} from '@wepublish/permissions';
import {
  getPuckConfig,
  PuckData,
  toPuckDocument,
} from '@wepublish/puck-content/editor';
import {
  createCheckedPermissionComponent,
  useHasPermission,
} from '@wepublish/ui/editor';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { PuckDocumentEditor } from './puck-editor';
import { notifyFailure, notifySuccess } from './puck-editor.notify';
import { PuckEditorError, PuckEditorLoading } from './puck-editor-status';
import {
  assertTemplateName,
  puckTemplateController,
} from './puck-template-controller';
import {
  articleTemplateToRootProps,
  articleToTemplateRootProps,
  loadPuckTemplate,
  toCreateArticleTemplateVariables,
  toUpdateArticleTemplateVariables,
} from './puck-template-mapping';

function ArticleTemplateEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const copyFromId = id ? null : searchParams.get('copyFrom');
  const fromArticleId =
    id || copyFromId ? null : searchParams.get('fromArticle');
  const templateId = id ?? copyFromId;

  const canCreate = useHasPermission([CanCreateArticleTemplate.id]);
  const canUpdate = useHasPermission([CanUpdateArticleTemplate.id]);

  const { data, loading, refetch } = useQuery(ArticleTemplateDocument, {
    errorPolicy: 'all',
    variables: { id: templateId ?? '' },
    skip: !templateId,
  });
  const { data: articleData, loading: articleLoading } = useQuery(
    ArticleDocument,
    {
      errorPolicy: 'all',
      variables: { id: fromArticleId ?? '' },
      skip: !fromArticleId,
    }
  );

  const [createTemplate, { loading: creating }] = useMutation(
    CreateArticleTemplateDocument,
    {
      update: (cache, { data: created }) => {
        if (created) {
          cache.writeQuery({
            query: ArticleTemplateDocument,
            variables: { id: created.createArticleTemplate.id },
            data: {
              __typename: 'Query',
              articleTemplate: created.createArticleTemplate,
            },
          });
        }
      },
    }
  );
  const [updateTemplate, { loading: updating }] = useMutation(
    UpdateArticleTemplateDocument
  );

  const template = data?.articleTemplate ?? undefined;
  const sourceArticle = articleData?.article ?? undefined;

  const loaded = useMemo(() => {
    if (template) {
      const { name } = template.blockTemplate;

      return loadPuckTemplate(
        'article',
        {
          ...template.blockTemplate,
          name: id ? name : t('articleTemplates.edit.copyName', { name }),
        },
        articleTemplateToRootProps(template.metadata)
      );
    }

    if (sourceArticle) {
      return loadPuckTemplate(
        'article',
        { ...sourceArticle.latest, name: sourceArticle.latest.title ?? '' },
        articleToTemplateRootProps(sourceArticle)
      );
    }

    return loadPuckTemplate('article', undefined, {});
  }, [id, template, sourceArticle, t]);

  const byline = template?.metadata ?? sourceArticle?.latest;
  const backTo = '/articles/templates';
  const backLabel = t('articleTemplates.edit.backToList');

  if ((templateId && !template) || (fromArticleId && !sourceArticle)) {
    return loading || articleLoading ?
        <PuckEditorLoading />
      : <PuckEditorError
          message={t('puck.templates.notFound')}
          backTo={backTo}
          backLabel={backLabel}
        />;
  }

  const { data: initialData } = loaded;

  if (!initialData) {
    return (
      <PuckEditorError
        message={t('puck.loadFailed')}
        backTo={backTo}
        backLabel={backLabel}
      />
    );
  }

  const save = async (document: PuckData<'article'>) => {
    try {
      const apiDocument = toPuckDocument(
        'article',
        document,
        getPuckConfig('article')
      );

      assertTemplateName(t, apiDocument.rootProps);

      if (!id) {
        const { data: created } = await createTemplate({
          variables: toCreateArticleTemplateVariables(apiDocument, byline),
        });

        notifySuccess(t('articleTemplates.edit.created'));

        if (created) {
          navigate(
            `/puck/templates/articles/edit/${created.createArticleTemplate.id}`,
            { replace: true }
          );
        }

        return;
      }

      await updateTemplate({
        variables: toUpdateArticleTemplateVariables(id, apiDocument, byline),
      });
      notifySuccess(t('articleTemplates.edit.saved'));
    } catch (error) {
      notifyFailure(error);
      throw error;
    }

    await refetch();
  };

  return (
    <PuckDocumentEditor
      key={id ?? 'new'}
      kind="article"
      data={initialData}
      templateNameLabel={t('puck.templates.name')}
      controller={puckTemplateController(t, {
        backTo,
        backLabel,
        lastSavedAt: id && template ? new Date(template.modifiedAt) : undefined,
        isNew: !id,
        busy: loading || articleLoading || creating || updating,
        canSave: id ? canUpdate : canCreate,
        onSave: save,
      })}
    />
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanCreateArticleTemplate.id,
  CanUpdateArticleTemplate.id,
  CanDeleteArticleTemplate.id,
])(ArticleTemplateEditor);

export { CheckedPermissionComponent as PuckArticleTemplateEditor };
