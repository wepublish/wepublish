import { useApolloClient, useMutation } from '@apollo/client/react';
import styled from '@emotion/styled';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  Drawer,
  FormControlLabel,
  FormLabel,
  InputAdornment,
  Switch,
  TextField,
} from '@mui/material';
import {
  AuthorDocument,
  AuthorLink,
  AuthorListDocument,
  CreateAuthorDocument,
  FullAuthorFragment,
  FullImageFragment,
  Maybe,
  TagType,
  UpdateAuthorDocument,
} from '@wepublish/editor/api';
import {
  CanCreateAuthor,
  CanDeleteAuthor,
  CanGetAuthor,
  CanGetAuthors,
} from '@wepublish/permissions';
import { slugify } from '@wepublish/utils';
import { useEffect, useId, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { MdLink } from 'react-icons/md';
import { z } from 'zod';

import {
  ChooseEditImage,
  createCheckedPermissionComponent,
  ListInput,
  ListValue,
  PermissionControl,
  SelectTags,
  useAuthorisation,
} from '../atoms';
import { RichTextBlock, RichTextBlockValue } from '../blocks';
import {
  DRAWER_WIDTHS,
  DrawerActions,
  DrawerBody,
  DrawerForm,
  DrawerHeader,
  DrawerTitle,
  FormFields,
  FormSectionTitle,
} from '../drawer';
import { enqueueSnackbar } from '../snackbar';
import { generateID, getOperationNameFromDocument } from '../utility';
import { ImageEditPanel } from './imageEditPanel';
import { ImageSelectPanel } from './imageSelectPanel';

const Controls = styled('div')`
  display: flex;
  flex-direction: row;
  gap: 8px;
`;

const ToggleList = styled('div')`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
`;

const emptyAuthorLink: AuthorLink = {
  __typename: 'AuthorLink',
  title: '',
  url: '',
};

export interface AuthorEditPanelProps {
  id?: string;

  onClose?(): void;
  onSave?(author: FullAuthorFragment): void;
}

const EMPTY_AUTHOR = {
  name: '',
  slug: '',
  jobTitle: '',
  image: undefined as Maybe<FullImageFragment> | undefined,
  bio: undefined as RichTextBlockValue['richText'] | undefined,
  tagIds: [] as string[],
  tags: [] as FullAuthorFragment['tags'],
  hideOnArticle: false,
  hideOnTeaser: false,
  hideOnTeam: false,
  links: [
    { id: generateID(), value: emptyAuthorLink },
  ] as ListValue<AuthorLink>[],
};

function AuthorEditPanel({ id, onClose, onSave }: AuthorEditPanelProps) {
  const { t } = useTranslation();
  const bioLabelId = useId();
  const linksLabelId = useId();
  const tagsLabelId = useId();

  const [isChooseModalOpen, setChooseModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [loadError, setLoadError] = useState<Error>();

  const isAuthorized = useAuthorisation(CanCreateAuthor.id);
  const client = useApolloClient();

  const schema = z.object({
    name: z.string().min(1, t('errorMessages.noNameErrorMessage')),
    slug: z.string(),
    jobTitle: z.string(),
    image: z.custom<FullImageFragment>().nullish(),
    bio: z.any(),
    tagIds: z.array(z.string()),
    tags: z.any(),
    hideOnArticle: z.boolean(),
    hideOnTeaser: z.boolean(),
    hideOnTeam: z.boolean(),
    links: z.array(z.custom<ListValue<AuthorLink>>()),
  });

  const {
    control,
    handleSubmit,
    setValue,
    formState: { isLoading },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: async () => {
      if (!id) {
        return EMPTY_AUTHOR;
      }

      try {
        const { data } = await client.query({
          query: AuthorDocument,
          variables: { id },
        });
        const author = data?.author;

        return author ?
            {
              name: author.name,
              slug: author.slug,
              jobTitle: author.jobTitle ?? '',
              image: author.image,
              bio: author.bio,
              tagIds: author.tags?.map(tag => tag.id) ?? [],
              tags: author.tags ?? [],
              hideOnArticle: !!author.hideOnArticle,
              hideOnTeaser: !!author.hideOnTeaser,
              hideOnTeam: !!author.hideOnTeam,
              links:
                author.links?.map(link => ({
                  id: generateID(),
                  value: {
                    __typename: 'AuthorLink' as const,
                    title: link.title,
                    url: link.url,
                  },
                })) ?? [],
            }
          : EMPTY_AUTHOR;
      } catch (error) {
        setLoadError(error as Error);

        return EMPTY_AUTHOR;
      }
    },
  });

  const image = useWatch({ control, name: 'image' });
  const tags = useWatch({ control, name: 'tags' });

  const [createAuthor, { loading: isCreating, error: createError }] =
    useMutation(CreateAuthorDocument, {
      refetchQueries: [getOperationNameFromDocument(AuthorListDocument)],
    });

  const [updateAuthor, { loading: isUpdating, error: updateError }] =
    useMutation(UpdateAuthorDocument, {});

  const isDisabled =
    isLoading ||
    isCreating ||
    isUpdating ||
    loadError !== undefined ||
    !isAuthorized;

  useEffect(() => {
    const error =
      loadError?.message ?? createError?.message ?? updateError?.message;

    if (error) {
      enqueueSnackbar(error, { variant: 'error', autoHideDuration: null });
    }
  }, [loadError, createError, updateError]);

  async function handleSave({
    name,
    slug,
    jobTitle,
    image,
    bio,
    tagIds,
    hideOnArticle,
    hideOnTeaser,
    hideOnTeam,
    links,
  }: z.infer<typeof schema>) {
    if (id) {
      const { data } = await updateAuthor({
        variables: {
          id,
          name,
          slug,
          jobTitle,
          imageID: image?.id || null,
          links: links.map(({ value }) => value),
          bio,
          tagIds,
          hideOnArticle,
          hideOnTeaser,
          hideOnTeam,
        },
      });

      if (data?.updateAuthor) {
        onSave?.(data.updateAuthor);
      }
    } else {
      const { data } = await createAuthor({
        variables: {
          name,
          slug,
          jobTitle,
          imageID: image?.id,
          links: links.map(({ value }) => value),
          bio,
          tagIds,
          hideOnArticle,
          hideOnTeaser,
          hideOnTeam,
        },
      });

      if (data?.createAuthor) {
        onSave?.(data.createAuthor);
      }
    }
  }

  return (
    <>
      <DrawerForm
        noValidate
        onSubmit={handleSubmit(handleSave)}
      >
        <DrawerHeader>
          <DrawerTitle>
            {id ?
              t('authors.panels.editAuthor')
            : t('authors.panels.createAuthor')}
          </DrawerTitle>

          <DrawerActions>
            <PermissionControl qualifyingPermissions={[CanCreateAuthor.id]}>
              <Button
                variant="contained"
                disabled={isDisabled}
                type="submit"
                data-testid="saveButton"
              >
                {id ? t('save') : t('create')}
              </Button>
            </PermissionControl>
            <Button
              variant="text"
              onClick={() => onClose?.()}
            >
              {t('authors.panels.close')}
            </Button>
          </DrawerActions>
        </DrawerHeader>

        <DrawerBody>
          {!isLoading && (
            <FormFields>
              <Controller
                control={control}
                name="name"
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    {...field}
                    label={t('authors.panels.name')}
                    required
                    disabled={isDisabled}
                    onChange={event => {
                      field.onChange(event);
                      setValue('slug', slugify(event.target.value));
                    }}
                    error={Boolean(error)}
                    helperText={error?.message}
                    fullWidth
                  />
                )}
              />

              <Controller
                control={control}
                name="jobTitle"
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    {...field}
                    label={t('authors.panels.jobTitle')}
                    disabled={isDisabled}
                    error={Boolean(error)}
                    helperText={error?.message}
                    fullWidth
                  />
                )}
              />

              <FormLabel>{t('authors.panels.image')}</FormLabel>

              <ChooseEditImage
                onSelect={(value: FullImageFragment) => {
                  setChooseModalOpen(false);
                  setValue('image', value);
                }}
                image={image}
                disabled={isLoading}
                openChooseModalOpen={() => setChooseModalOpen(true)}
                openEditModalOpen={() => setEditModalOpen(true)}
                removeImage={() => setValue('image', undefined)}
              />

              <div>
                <FormLabel id={bioLabelId}>
                  {t('authors.panels.bioInformation')}
                </FormLabel>

                <Controller
                  control={control}
                  name="bio"
                  render={({ field }) => (
                    <RichTextBlock
                      aria-labelledby={bioLabelId}
                      disabled={isDisabled}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>

              <div
                role="group"
                aria-labelledby={linksLabelId}
              >
                <FormLabel id={linksLabelId}>
                  {t('authors.panels.links')}
                </FormLabel>

                <Controller
                  control={control}
                  name="links"
                  render={({ field }) => (
                    <ListInput
                      disabled={isDisabled}
                      value={field.value}
                      onChange={field.onChange}
                      defaultValue={emptyAuthorLink}
                    >
                      {({ value, onChange }) => (
                        <Controls>
                          <TextField
                            name="title"
                            label={t('authors.panels.title')}
                            value={value.title}
                            onChange={event =>
                              onChange({ ...value, title: event.target.value })
                            }
                            fullWidth
                          />

                          <TextField
                            name="link"
                            label={t('authors.panels.link')}
                            placeholder={t('images.panels.urlPlaceholder')}
                            value={value.url}
                            onChange={event =>
                              onChange({ ...value, url: event.target.value })
                            }
                            slotProps={{
                              input: {
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <MdLink />
                                  </InputAdornment>
                                ),
                              },
                            }}
                            fullWidth
                          />
                        </Controls>
                      )}
                    </ListInput>
                  )}
                />
              </div>

              <FormLabel id={tagsLabelId}>{t('authors.panels.tags')}</FormLabel>

              <Controller
                control={control}
                name="tagIds"
                render={({ field }) => (
                  <SelectTags
                    aria-labelledby={tagsLabelId}
                    name={field.name}
                    defaultTags={tags ?? []}
                    selectedTags={field.value}
                    setSelectedTags={field.onChange}
                    tagType={TagType.Author}
                  />
                )}
              />

              <ToggleList>
                <FormSectionTitle>
                  {t('authorEditPanel.hideAuthor')}
                </FormSectionTitle>

                <Controller
                  control={control}
                  name="hideOnArticle"
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Switch
                          {...field}
                          checked={field.value}
                        />
                      }
                      label={t('authorEditPanel.hideOnArticle')}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="hideOnTeaser"
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Switch
                          {...field}
                          checked={field.value}
                        />
                      }
                      label={t('authorEditPanel.hideOnTeaser')}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="hideOnTeam"
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Switch
                          {...field}
                          checked={field.value}
                        />
                      }
                      label={t('authorEditPanel.hideOnTeam')}
                    />
                  )}
                />
              </ToggleList>
            </FormFields>
          )}
        </DrawerBody>
      </DrawerForm>

      <Drawer
        anchor="right"
        slotProps={{
          paper: {
            sx: {
              width: DRAWER_WIDTHS.sm,
              maxWidth: '100vw',
            },
          },
        }}
        open={isChooseModalOpen}
        onClose={() => setChooseModalOpen(false)}
      >
        <ImageSelectPanel
          onClose={() => setChooseModalOpen(false)}
          onSelect={(value: FullImageFragment) => {
            setChooseModalOpen(false);
            setValue('image', value);
          }}
        />
      </Drawer>

      <Drawer
        anchor="right"
        slotProps={{
          paper: {
            sx: {
              width: DRAWER_WIDTHS.sm,
              maxWidth: '100vw',
            },
          },
        }}
        open={isEditModalOpen}
      >
        <ImageEditPanel
          id={image?.id}
          onClose={() => setEditModalOpen(false)}
          onSave={() => setEditModalOpen(false)}
        />
      </Drawer>
    </>
  );
}
const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanGetAuthor.id,
  CanGetAuthors.id,
  CanCreateAuthor.id,
  CanDeleteAuthor.id,
])(AuthorEditPanel);
export { CheckedPermissionComponent as AuthorEditPanel };
