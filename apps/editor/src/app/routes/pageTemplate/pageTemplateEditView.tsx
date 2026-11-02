import { useMutation, useQuery } from '@apollo/client/react';
import {
  PageTemplateDocument,
  CreatePageTemplateDocument,
  CreatePageTemplateMutationVariables,
  UpdatePageTemplateDocument,
} from '@wepublish/editor/api';
import {
  CanCreatePageTemplate,
  CanDeletePageTemplate,
  CanUpdatePageTemplate,
} from '@wepublish/permissions';
import {
  createCheckedPermissionComponent,
  enqueueSnackbar,
  mapBlockValueToBlockInput,
  PageMetadataPanel,
  useAuthorisation,
} from '@wepublish/ui/editor';
import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { emptyPageMetadata } from '../pages/pageDefaults';
import {
  pageMetadataToMetadataInput,
  pageTemplateMetadataToPageMetadata,
} from '../pages/pageMapping';
import { TemplateEditorLayout } from '../templates/templateEditorLayout';
import { useTemplateEditor } from '../templates/useTemplateEditor';
import {
  PageTemplatePrefill,
  usePagePrefill,
  usePageTemplatePrefill,
} from './pageTemplatePrefill';

function PageTemplateEditView() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { id } = useParams();
  const isNew = id === undefined;
  const [searchParams] = useSearchParams();
  const copyFromId = isNew ? searchParams.get('copyFrom') : null;
  const fromPageId = isNew ? searchParams.get('fromPage') : null;

  const [
    createPageTemplate,
    { data: createData, loading: isCreating, error: createError },
  ] = useMutation(CreatePageTemplateDocument);
  const [updatePageTemplate, { loading: isUpdating, error: updateError }] =
    useMutation(UpdatePageTemplateDocument);

  const pageTemplateId = (id || createData?.createPageTemplate.id) ?? '';
  const {
    data: pageTemplateData,
    refetch,
    loading: isLoading,
  } = useQuery(PageTemplateDocument, {
    errorPolicy: 'all',
    variables: { id: pageTemplateId },
    skip: !pageTemplateId,
  });

  const {
    name,
    changeName,
    blocks,
    changeBlocks,
    metadata,
    changeMetadata,
    hasChanged,
    setChanged,
    applyPrefill,
  } = useTemplateEditor({
    emptyMetadata: emptyPageMetadata,
    initialBlocks: [],
    template: pageTemplateData?.pageTemplate,
    toMetadata: pageTemplateMetadataToPageMetadata,
  });

  const { loading: isLoadingCopy } = usePageTemplatePrefill(
    copyFromId,
    useCallback(
      (prefill: PageTemplatePrefill) =>
        applyPrefill({
          ...prefill,
          name: t('pageTemplates.edit.copyName', { name: prefill.name }),
        }),
      [applyPrefill, t]
    )
  );
  const { loading: isLoadingPage } = usePagePrefill(fromPageId, applyPrefill);

  useEffect(() => {
    const error = createError?.message ?? updateError?.message;
    if (error) {
      enqueueSnackbar(error, { variant: 'error', autoHideDuration: null });
    }
  }, [createError, updateError]);

  function createInput(): CreatePageTemplateMutationVariables {
    return {
      name,
      blocks: blocks.map(mapBlockValueToBlockInput),
      metadata: pageMetadataToMetadataInput(metadata),
    };
  }

  const canCreate = useAuthorisation(CanCreatePageTemplate.id);
  const canUpdate = useAuthorisation(CanUpdatePageTemplate.id);
  const isAuthorized = pageTemplateId ? canUpdate : canCreate;

  const isNotFound = pageTemplateData && !pageTemplateData.pageTemplate;
  const isDisabled =
    isLoading ||
    isLoadingCopy ||
    isLoadingPage ||
    isCreating ||
    isUpdating ||
    !!isNotFound ||
    !isAuthorized;

  async function handleSave() {
    const input = createInput();

    if (pageTemplateId) {
      await updatePageTemplate({
        variables: { id: pageTemplateId, ...input },
      });

      setChanged(false);
      enqueueSnackbar('', {
        variant: 'success',
        title: t('pageTemplates.edit.saved'),
        autoHideDuration: 2000,
      });
      await refetch({ id: pageTemplateId });
    } else {
      const { data } = await createPageTemplate({ variables: input });

      if (data) {
        navigate(`/pages/templates/edit/${data.createPageTemplate.id}`, {
          replace: true,
        });
      }

      setChanged(false);
      enqueueSnackbar('', {
        variant: 'success',
        title: t('pageTemplates.edit.created'),
        autoHideDuration: 2000,
      });
    }
  }

  return (
    <TemplateEditorLayout
      i18nPrefix="pageTemplates"
      backPath="/pages/templates"
      permissions={{
        create: CanCreatePageTemplate.id,
        update: CanUpdatePageTemplate.id,
      }}
      isNew={isNew && createData == null}
      hasChanged={hasChanged}
      disabled={isDisabled}
      itemId={pageTemplateId}
      name={name}
      onNameChange={changeName}
      blocks={blocks}
      onBlocksChange={changeBlocks}
      onSave={handleSave}
      loadingMessage={
        isLoadingCopy ? t('pageTemplates.edit.loadingTemplate')
        : isLoadingPage ?
          t('pageTemplates.edit.loadingPage')
        : undefined
      }
      metadataDrawerSize="sm"
      renderMetadata={close => (
        <PageMetadataPanel
          value={metadata}
          isTemplate
          onClose={close}
          onChange={changeMetadata}
        />
      )}
    />
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanCreatePageTemplate.id,
  CanUpdatePageTemplate.id,
  CanDeletePageTemplate.id,
])(PageTemplateEditView);

export { CheckedPermissionComponent as PageTemplateEditView };
