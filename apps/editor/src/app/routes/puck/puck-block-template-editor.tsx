import { useMutation, useQuery } from '@apollo/client/react';
import {
  CreatePuckBlockTemplateDocument,
  PuckBlockTemplateDocument,
  PuckBlockTemplateListDocument,
  UpdatePuckBlockTemplateDocument,
} from '@wepublish/editor/api';
import {
  CanCreateBlockTemplate,
  CanDeleteBlockTemplate,
  CanUpdateBlockTemplate,
} from '@wepublish/permissions';
import {
  EditedBlockTemplateContext,
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
import { loadPuckTemplate, templateNameOf } from './puck-template-mapping';

function BlockTemplateEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const templateId = id ?? searchParams.get('copyFrom');

  const canCreate = useHasPermission([CanCreateBlockTemplate.id]);
  const canUpdate = useHasPermission([CanUpdateBlockTemplate.id]);

  const { data, loading, refetch } = useQuery(PuckBlockTemplateDocument, {
    errorPolicy: 'all',
    variables: { id: templateId ?? '' },
    skip: !templateId,
  });

  const [createTemplate, { loading: creating }] = useMutation(
    CreatePuckBlockTemplateDocument,
    {
      refetchQueries: [PuckBlockTemplateListDocument],
      update: (cache, { data: created }) => {
        if (created) {
          cache.writeQuery({
            query: PuckBlockTemplateDocument,
            variables: { id: created.createBlockTemplate.id },
            data: {
              __typename: 'Query',
              blockTemplate: created.createBlockTemplate,
            },
          });
        }
      },
    }
  );
  const [updateTemplate, { loading: updating }] = useMutation(
    UpdatePuckBlockTemplateDocument,
    { refetchQueries: [PuckBlockTemplateListDocument] }
  );

  const template = data?.blockTemplate ?? undefined;

  const loaded = useMemo(
    () =>
      loadPuckTemplate(
        'page',
        template && {
          ...template,
          name:
            id ?
              template.name
            : t('blockTemplates.edit.copyName', { name: template.name }),
        },
        {}
      ),
    [id, template, t]
  );

  const backTo = '/block-content/templates';
  const backLabel = t('blockTemplates.list.title');

  if (templateId && !template) {
    return loading ?
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
      const { puckBlocks, puckRegistry, rootProps } = toPuckDocument(
        'page',
        document,
        getPuckConfig('page')
      );

      assertTemplateName(t, rootProps);

      const variables = {
        name: templateNameOf(rootProps),
        puckBlocks,
        puckRegistry,
      };

      if (!id) {
        const { data: created } = await createTemplate({ variables });

        notifySuccess(t('puck.templates.created'));

        if (created) {
          navigate(
            `/puck/templates/blocks/edit/${created.createBlockTemplate.id}`,
            { replace: true }
          );
        }

        return;
      }

      await updateTemplate({ variables: { id, ...variables } });
      notifySuccess(t('puck.templates.saved'));
    } catch (error) {
      notifyFailure(error, t);
      throw error;
    }

    await refetch();
  };

  return (
    <EditedBlockTemplateContext.Provider value={id ?? null}>
      <PuckDocumentEditor
        key={id ?? 'new'}
        kind="page"
        data={initialData}
        blockTemplate
        templateNameLabel={t('puck.templates.name')}
        controller={puckTemplateController(t, {
          backTo,
          backLabel,
          lastSavedAt:
            id && template ? new Date(template.modifiedAt) : undefined,
          isNew: !id,
          busy: loading || creating || updating,
          canSave: id ? canUpdate : canCreate,
          onSave: save,
        })}
      />
    </EditedBlockTemplateContext.Provider>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanCreateBlockTemplate.id,
  CanUpdateBlockTemplate.id,
  CanDeleteBlockTemplate.id,
])(BlockTemplateEditor);

export { CheckedPermissionComponent as PuckBlockTemplateEditor };
