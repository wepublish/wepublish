import styled from '@emotion/styled';
import {
  CreatePageMutationVariables,
  getApiClientV2,
  useCreateJwtForWebsiteLoginMutation,
  useCreatePageMutation,
  useMeQuery,
  usePageQuery,
  usePublishPageMutation,
  useUpdatePageMutation,
} from '@wepublish/editor/api-v2';
import { CanPreview } from '@wepublish/permissions';
import {
  blockForQueryBlock,
  BlockList,
  BlockMap,
  BlockValue,
  createCheckedPermissionComponent,
  EditorTemplate,
  mapBlockValueToBlockInput,
  NavigationBar,
  PageMetadata,
  PageMetadataPanel,
  PermissionControl,
  PublishPagePanel,
  StateColor,
  useAuthorisation,
  useUnsavedChangesDialog,
} from '@wepublish/ui/editor';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MdCloudUpload,
  MdIntegrationInstructions,
  MdKeyboardBackspace,
  MdRemoveRedEye,
  MdSave,
} from 'react-icons/md';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Badge,
  Drawer,
  IconButton as RIconButton,
  Message,
  Modal,
  Notification,
  Tag as RTag,
  toaster,
} from 'rsuite';

const IconButtonMargins = styled(RIconButton)`
  margin-top: 4px;
  margin-bottom: 20px;
`;

const IconButtonMTop = styled(RIconButton)`
  margin-top: 4px;
`;

const IconButton = styled(RIconButton)`
  margin-left: 10px;
`;

const CenterChildren = styled.div`
  margin-top: 4px;
`;

const Legend = styled.legend`
  width: auto;
  margin: 0px auto;
`;

const FieldSet = styled('fieldset', {
  shouldForwardProp: prop => prop !== 'stateColor',
})<{ stateColor: string }>`
  border-color: ${({ stateColor }) => stateColor};
`;

const Tag = styled(RTag, {
  shouldForwardProp: prop => prop !== 'stateColor',
})<{ stateColor: string }>`
  background-color: ${({ stateColor }) => stateColor};
`;

function PageEditor() {
  const navigate = useNavigate();
  const params = useParams();
  const { id } = params;

  const client = getApiClientV2();
  const [
    createPage,
    { data: createData, loading: isCreating, error: createError },
  ] = useCreatePageMutation({ client });
  const [updatePage, { loading: isUpdating, error: updateError }] =
    useUpdatePageMutation({ client });
  const [publishPage, { loading: isPublishing, error: publishError }] =
    usePublishPageMutation({
      client,
    });

  const [isMetaDrawerOpen, setMetaDrawerOpen] = useState(false);
  const [isPublishDialogOpen, setPublishDialogOpen] = useState(false);

  const [publishedAt, setPublishedAt] = useState<Date>();
  const [metadata, setMetadata] = useState<PageMetadata>({
    slug: '',
    title: '',
    description: '',
    tags: [],
    defaultTags: [],
    url: '',
    properties: [],
    hidden: false,
    image: undefined,
    socialMediaTitle: undefined,
    socialMediaDescription: undefined,
    socialMediaImage: undefined,
  });

  const isNew = id === undefined;
  const [blocks, setBlocks] = useState<BlockValue[]>([]);

  const pageID = id || createData?.createPage.id;

  const {
    data: pageData,
    refetch,
    loading: isLoading,
  } = usePageQuery({
    client,
    errorPolicy: 'all',
    fetchPolicy: 'cache-and-network',
    variables: { id: pageID! },
    skip: !pageID,
  });
  const { data: user } = useMeQuery({
    client,
    fetchPolicy: 'cache-only',
  });
  const [createJWT] = useCreateJwtForWebsiteLoginMutation({
    client,
    errorPolicy: 'none',
  });

  const { t } = useTranslation();

  const isNotFound = pageData && !pageData.page;
  const isDisabled =
    isLoading || isCreating || isUpdating || isPublishing || isNotFound;
  const canPreview = Boolean(pageData?.page?.draft);

  const [hasChanged, setChanged] = useState(false);
  const unsavedChangesDialog = useUnsavedChangesDialog(hasChanged);

  const isAuthorized = useAuthorisation('CAN_CREATE_PAGE');

  const handleChange = useCallback(
    (blocks: React.SetStateAction<BlockValue[]>) => {
      setBlocks(blocks);
      setChanged(true);
    },
    []
  );

  useEffect(() => {
    if (pageData?.page) {
      const { latest, tags, hidden, slug, url } = pageData.page;
      const {
        title,
        description,
        image,
        blocks,
        properties,
        socialMediaTitle,
        socialMediaDescription,
        socialMediaImage,
        publishedAt,
      } = latest;

      if (publishedAt) {
        setPublishedAt(new Date(publishedAt));
      }

      setMetadata({
        slug: slug ?? '',
        title: title ?? '',
        description: description ?? '',
        tags: tags.map(({ id }) => id),
        defaultTags: tags,
        url,
        properties,
        hidden,
        image: image || undefined,
        socialMediaTitle: socialMediaTitle || '',
        socialMediaDescription: socialMediaDescription || '',
        socialMediaImage: socialMediaImage || undefined,
      });

      setBlocks(blocks.map(blockForQueryBlock));
    }
  }, [pageData]);

  const [stateColor, setStateColor] = useState<StateColor>(StateColor.none);
  const [tagTitle, setTagTitle] = useState<string>('');

  useEffect(() => {
    if (pageData?.page?.pending) {
      setStateColor(StateColor.pending);
      setTagTitle(
        t('pageEditor.overview.pending', {
          date: new Date(pageData?.page?.pending?.publishedAt ?? ''),
        })
      );
    } else if (pageData?.page?.latest.publishedAt) {
      setStateColor(StateColor.published);
      setTagTitle(
        t('pageEditor.overview.published', {
          date: new Date(pageData?.page?.latest?.publishedAt ?? ''),
        })
      );
    } else {
      setStateColor(StateColor.draft);
      setTagTitle(t('pageEditor.overview.unpublished'));
    }
  }, [pageData, hasChanged, t]);

  useEffect(() => {
    const error =
      createError?.message ?? updateError?.message ?? publishError?.message;
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
  }, [createError, updateError, publishError]);

  function createInput(): CreatePageMutationVariables {
    return {
      slug: metadata.slug ?? '',
      title: metadata.title ?? '',
      description: metadata.description,
      hidden: metadata.hidden ?? false,
      imageID: metadata.image?.id,
      tagIds: metadata.tags,
      properties: metadata.properties,
      socialMediaTitle: metadata.socialMediaTitle || undefined,
      socialMediaDescription: metadata.socialMediaDescription || undefined,
      socialMediaImageID: metadata.socialMediaImage?.id || undefined,
      blocks: blocks.map(mapBlockValueToBlockInput),
    };
  }

  async function handleSave() {
    const input = createInput();

    if (pageID) {
      await updatePage({ variables: { id: pageID, ...input } });

      setChanged(false);
      toaster.push(
        <Notification
          type="success"
          header={t('pageEditor.overview.pageDraftSaved')}
          duration={2000}
        />,
        { placement: 'topEnd' }
      );
      await refetch({ id: pageID });
    } else {
      const { data } = await createPage({ variables: input });

      if (data) {
        navigate(`/pages/edit/${data?.createPage.id}`, { replace: true });
      }
      setChanged(false);
      toaster.push(
        <Notification
          type="success"
          header={t('pageEditor.overview.pageDraftCreated')}
          duration={2000}
        />,
        { placement: 'topEnd' }
      );
    }
  }

  async function handlePublish(publishedAt: Date) {
    if (pageID) {
      const { data } = await updatePage({
        variables: { id: pageID, ...createInput() },
      });

      if (data) {
        const { data: publishData } = await publishPage({
          variables: {
            id: pageID,
            publishedAt: publishedAt.toISOString(),
          },
        });

        if (publishData?.publishPage?.latest?.publishedAt) {
          setPublishedAt(
            new Date(publishData?.publishPage?.latest.publishedAt)
          );
        }
      }
      await refetch({ id: pageID });
    }

    setChanged(false);
    toaster.push(
      <Notification
        type="success"
        header={t(
          publishedAt <= new Date() ?
            'pageEditor.overview.pagePublished'
          : 'pageEditor.overview.pagePending'
        )}
        duration={2000}
      />,
      { placement: 'topEnd' }
    );
  }

  useEffect(() => {
    if (isNotFound) {
      toaster.push(
        <Message
          type="error"
          showIcon
          closable
          duration={0}
        >
          {t('pageEditor.overview.pageNotFound')}
        </Message>
      );
    }
  }, [isNotFound, t]);

  return (
    <>
      <FieldSet stateColor={stateColor}>
        <Legend>
          <Tag stateColor={stateColor}>{tagTitle}</Tag>
        </Legend>

        <EditorTemplate
          navigationChildren={
            <NavigationBar
              leftChildren={
                <Link to="/pages">
                  <IconButtonMargins
                    className="actionButton"
                    size="lg"
                    icon={<MdKeyboardBackspace />}
                    onClick={e => {
                      if (!unsavedChangesDialog()) e.preventDefault();
                    }}
                  >
                    {t('Back')}
                  </IconButtonMargins>
                </Link>
              }
              centerChildren={
                <CenterChildren>
                  <RIconButton
                    icon={<MdIntegrationInstructions />}
                    className="actionButton"
                    size="lg"
                    disabled={isDisabled}
                    onClick={() => setMetaDrawerOpen(true)}
                  >
                    {t('pageEditor.overview.metadata')}
                  </RIconButton>

                  {isNew && createData == null ?
                    <PermissionControl
                      qualifyingPermissions={['CAN_CREATE_PAGE']}
                    >
                      <IconButton
                        className="actionButton"
                        size="lg"
                        icon={<MdSave />}
                        disabled={isDisabled}
                        onClick={handleSave}
                      >
                        {t('create')}
                      </IconButton>
                    </PermissionControl>
                  : <PermissionControl
                      qualifyingPermissions={['CAN_CREATE_PAGE']}
                    >
                      <Badge className={hasChanged ? 'unsaved' : 'saved'}>
                        <IconButton
                          className="actionButton"
                          size="lg"
                          icon={<MdSave />}
                          disabled={isDisabled}
                          onClick={handleSave}
                        >
                          {t('save')}
                        </IconButton>
                      </Badge>
                      <PermissionControl
                        qualifyingPermissions={['CAN_PUBLISH_PAGE']}
                      >
                        <Badge
                          className={
                            (
                              pageData?.page?.draft ||
                              !pageData?.page?.published
                            ) ?
                              'unsaved'
                            : 'saved'
                          }
                        >
                          <IconButton
                            className="actionButton"
                            size="lg"
                            icon={<MdCloudUpload />}
                            disabled={isDisabled}
                            onClick={() => {
                              setPublishDialogOpen(true);
                            }}
                          >
                            {t('pageEditor.overview.publish')}
                          </IconButton>
                        </Badge>
                      </PermissionControl>
                    </PermissionControl>
                  }
                </CenterChildren>
              }
              rightChildren={
                <PermissionControl qualifyingPermissions={[CanPreview.id]}>
                  <IconButtonMTop
                    className="actionButton"
                    disabled={hasChanged || !id || !canPreview}
                    size="lg"
                    icon={<MdRemoveRedEye />}
                    // open via button not link as it contains a JWT
                    // open via button not link as it contains a JWT
                    onClick={async () => {
                      const { data: jwt } = await createJWT();

                      window.open(
                        `${pageData!.page.previewUrl}&jwt=${jwt?.createJWTForWebsiteLogin?.token}`,
                        '_blank'
                      );
                    }}
                  >
                    {t('pageEditor.overview.preview')}
                  </IconButtonMTop>
                </PermissionControl>
              }
            />
          }
        >
          <BlockList
            value={blocks}
            onChange={handleChange}
            disabled={isDisabled || !isAuthorized}
            blockMap={BlockMap}
          />
        </EditorTemplate>
      </FieldSet>

      <Drawer
        open={isMetaDrawerOpen}
        size="sm"
        onClose={() => setMetaDrawerOpen(false)}
      >
        <PageMetadataPanel
          value={metadata}
          onClose={() => {
            handleSave();
            setMetaDrawerOpen(false);
          }}
          onChange={value => {
            setMetadata(value);
            setChanged(true);
          }}
        />
      </Drawer>

      <Modal
        open={isPublishDialogOpen}
        size="sm"
        onClose={() => setPublishDialogOpen(false)}
      >
        <PublishPagePanel
          publishedAtDate={publishedAt}
          metadata={metadata}
          onClose={() => setPublishDialogOpen(false)}
          onConfirm={publishedAt => {
            handlePublish(publishedAt);
            setPublishDialogOpen(false);
          }}
        />
      </Modal>
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_PAGE',
  'CAN_GET_PAGES',
  'CAN_CREATE_PAGE',
  'CAN_PUBLISH_PAGE',
  'CAN_DELETE_PAGE',
  CanPreview.id,
])(PageEditor);
export { CheckedPermissionComponent as PageEditor };
