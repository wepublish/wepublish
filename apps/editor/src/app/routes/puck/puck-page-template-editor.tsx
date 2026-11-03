import { useMutation, useQuery } from '@apollo/client/react';
import {
  PageDocument,
  PageTemplateDocument,
  CreatePageTemplateDocument,
  UpdatePageTemplateDocument,
} from '@wepublish/editor/api';
import {
  CanCreatePageTemplate,
  CanDeletePageTemplate,
  CanUpdatePageTemplate,
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
  pageTemplateToRootProps,
  pageToTemplateRootProps,
  loadPuckTemplate,
  toCreatePageTemplateVariables,
  toUpdatePageTemplateVariables,
} from './puck-template-mapping';

function PageTemplateEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const copyFromId = id ? null : searchParams.get('copyFrom');
  const fromPageId = id || copyFromId ? null : searchParams.get('fromPage');
  const templateId = id ?? copyFromId;

  const canCreate = useHasPermission([CanCreatePageTemplate.id]);
  const canUpdate = useHasPermission([CanUpdatePageTemplate.id]);

  const { data, loading, refetch } = useQuery(PageTemplateDocument, {
    errorPolicy: 'all',
    variables: { id: templateId ?? '' },
    skip: !templateId,
  });
  const { data: pageData, loading: pageLoading } = useQuery(PageDocument, {
    errorPolicy: 'all',
    variables: { id: fromPageId ?? '' },
    skip: !fromPageId,
  });

  const [createTemplate, { loading: creating }] = useMutation(
    CreatePageTemplateDocument,
    {
      update: (cache, { data: created }) => {
        if (created) {
          cache.writeQuery({
            query: PageTemplateDocument,
            variables: { id: created.createPageTemplate.id },
            data: {
              __typename: 'Query',
              pageTemplate: created.createPageTemplate,
            },
          });
        }
      },
    }
  );
  const [updateTemplate, { loading: updating }] = useMutation(
    UpdatePageTemplateDocument
  );

  const template = data?.pageTemplate ?? undefined;
  const sourcePage = pageData?.page ?? undefined;

  const loaded = useMemo(() => {
    if (template) {
      const { name } = template.blockTemplate;

      return loadPuckTemplate(
        'page',
        {
          ...template.blockTemplate,
          name: id ? name : t('pageTemplates.edit.copyName', { name }),
        },
        pageTemplateToRootProps(template.metadata)
      );
    }

    if (sourcePage) {
      return loadPuckTemplate(
        'page',
        { ...sourcePage.latest, name: sourcePage.latest.title ?? '' },
        pageToTemplateRootProps(sourcePage)
      );
    }

    return loadPuckTemplate('page', undefined, {});
  }, [id, template, sourcePage, t]);

  const backTo = '/pages/templates';
  const backLabel = t('pageTemplates.edit.backToList');

  if ((templateId && !template) || (fromPageId && !sourcePage)) {
    return loading || pageLoading ?
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

  const save = async (document: PuckData<'page'>) => {
    try {
      const apiDocument = toPuckDocument(
        'page',
        document,
        getPuckConfig('page')
      );

      assertTemplateName(t, apiDocument.rootProps);

      if (!id) {
        const { data: created } = await createTemplate({
          variables: toCreatePageTemplateVariables(apiDocument),
        });

        notifySuccess(t('pageTemplates.edit.created'));

        if (created) {
          navigate(
            `/puck/templates/pages/edit/${created.createPageTemplate.id}`,
            { replace: true }
          );
        }

        return;
      }

      await updateTemplate({
        variables: toUpdatePageTemplateVariables(id, apiDocument),
      });
      notifySuccess(t('pageTemplates.edit.saved'));
    } catch (error) {
      notifyFailure(error);
      throw error;
    }

    await refetch();
  };

  return (
    <PuckDocumentEditor
      key={id ?? 'new'}
      kind="page"
      data={initialData}
      templateNameLabel={t('puck.templates.name')}
      controller={puckTemplateController(t, {
        backTo,
        backLabel,
        lastSavedAt: id && template ? new Date(template.modifiedAt) : undefined,
        isNew: !id,
        busy: loading || pageLoading || creating || updating,
        canSave: id ? canUpdate : canCreate,
        onSave: save,
      })}
    />
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanCreatePageTemplate.id,
  CanUpdatePageTemplate.id,
  CanDeletePageTemplate.id,
])(PageTemplateEditor);

export { CheckedPermissionComponent as PuckPageTemplateEditor };
