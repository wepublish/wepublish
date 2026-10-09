import { useMutation, useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Drawer,
  FormControlLabel,
  Stack,
  Switch,
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
import { slugify } from '@wepublish/utils';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdLink } from 'react-icons/md';
import {
  Form as RForm,
  Input,
  InputGroup as RInputGroup,
  Schema,
} from 'rsuite';
import FormControl from 'rsuite/FormControl';

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
  DrawerHeader,
  DrawerTitle,
} from '../drawer';
import { enqueueSnackbar } from '../snackbar';
import { toggleRequiredLabel } from '../toggleRequiredLabel';
import { generateID, getOperationNameFromDocument } from '../utility';
import { ImageEditPanel } from './imageEditPanel';
import { ImageSelectPanel } from './imageSelectPanel';

const { Label: RLabel, Group, Control } = RForm;

const InputGroup = styled(RInputGroup)`
  width: 230px;
  margin-left: 4px;
`;

const Controls = styled('div')`
  display: flex;
  flex-direction: row;
`;

const Form = styled(RForm)`
  height: 100%;
`;

const Label = styled(RLabel)`
  padding-top: 16px;
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

function AuthorEditPanel({ id, onClose, onSave }: AuthorEditPanelProps) {
  const [name, setName] = useState('');
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [slug, setSlug] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [image, setImage] = useState<Maybe<FullImageFragment>>();
  const [bio, setBio] = useState<RichTextBlockValue['richText']>();
  const [hideOnArticle, setHideOnArticle] = useState<
    boolean | undefined | null
  >(undefined);
  const [hideOnTeaser, setHideOnTeaser] = useState<boolean | undefined | null>(
    undefined
  );
  const [hideOnTeam, setHideOnTeam] = useState<boolean | undefined | null>(
    undefined
  );
  const [links, setLinks] = useState<ListValue<AuthorLink>[]>([
    {
      id: generateID(),
      value: emptyAuthorLink,
    },
  ]);

  const [isChooseModalOpen, setChooseModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);

  const isAuthorized = useAuthorisation('CAN_CREATE_AUTHOR');

  const {
    data,
    loading: isLoading,
    error: loadError,
  } = useQuery(AuthorDocument, {
    variables: { id: id! },
    skip: id === undefined,
  });

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

  const { t } = useTranslation();

  useEffect(() => {
    if (data?.author) {
      setName(data.author.name);
      setTagIds(data.author.tags?.map(tag => tag.id) || []);
      setSlug(data.author.slug);
      setJobTitle(data.author.jobTitle ?? '');
      setImage(data.author.image);
      setBio(data.author.bio);
      setHideOnArticle(data.author.hideOnArticle);
      setHideOnTeam(data.author.hideOnTeam);
      setHideOnTeaser(data.author.hideOnTeaser);
      setLinks(
        data.author.links ?
          data.author.links.map(link => ({
            id: generateID(),
            value: {
              __typename: 'AuthorLink',
              title: link.title,
              url: link.url,
            },
          }))
        : []
      );
    }
  }, [data?.author]);

  useEffect(() => {
    const error =
      loadError?.message ?? createError?.message ?? updateError?.message;
    if (error)
      enqueueSnackbar(error, { variant: 'error', autoHideDuration: null });
  }, [loadError, createError, updateError]);

  function handleImageChange(image: FullImageFragment) {
    setImage(image);
  }

  async function handleSave() {
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

      if (data?.updateAuthor) onSave?.(data.updateAuthor);
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
          hideOnArticle: !!hideOnArticle,
          hideOnTeaser: !!hideOnTeaser,
          hideOnTeam: !!hideOnTeam,
        },
      });

      if (data?.createAuthor) onSave?.(data.createAuthor);
    }
  }

  // Defines field requirements
  const { StringType } = Schema.Types;
  const validationModel = Schema.Model({
    name: StringType().isRequired(t('errorMessages.noNameErrorMessage')),
    link: StringType().isURL(t('errorMessages.invalidUrlErrorMessage')),
  });

  return (
    <>
      <Form
        onSubmit={validationPassed => validationPassed && handleSave()}
        fluid
        model={validationModel}
        formValue={{ name }}
      >
        <DrawerHeader>
          <DrawerTitle>
            {id ?
              t('authors.panels.editAuthor')
            : t('authors.panels.createAuthor')}
          </DrawerTitle>

          <DrawerActions>
            <PermissionControl qualifyingPermissions={['CAN_CREATE_AUTHOR']}>
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
          <Stack spacing={2}>
            <Card variant="outlined">
              <CardContent>
                <Group controlId="name">
                  <Label>{toggleRequiredLabel(t('authors.panels.name'))}</Label>

                  <Control
                    name="name"
                    value={name}
                    disabled={isDisabled}
                    onChange={(value: string) => {
                      setName(value);
                      setSlug(slugify(value));
                    }}
                  />
                </Group>
                <Group controlId="jobTitle">
                  <Label>{t('authors.panels.jobTitle')}</Label>
                  <Control
                    name={t('authors.panels.jobTitle')}
                    value={jobTitle}
                    disabled={isDisabled}
                    onChange={(value: string) => {
                      setJobTitle(value);
                    }}
                  />
                </Group>
              </CardContent>
            </Card>
            <Card variant="outlined">
              <CardHeader title={t('authors.panels.image')} />

              <CardContent>
                <ChooseEditImage
                  image={image}
                  header={''}
                  top={0}
                  left={0}
                  disabled={isLoading}
                  openChooseModalOpen={() => setChooseModalOpen(true)}
                  openEditModalOpen={() => setEditModalOpen(true)}
                  removeImage={() => setImage(undefined)}
                />
              </CardContent>
            </Card>

            <Card variant="outlined">
              <CardHeader title={t('authors.panels.bioInformation')} />

              <CardContent>
                <RichTextBlock
                  disabled={isDisabled}
                  value={bio}
                  onChange={value => setBio(value)}
                />
              </CardContent>
            </Card>

            <Card
              variant="outlined"
              className="authorLinks"
            >
              <CardHeader title={t('authors.panels.links')} />

              <CardContent>
                <ListInput
                  disabled={isDisabled}
                  value={links}
                  onChange={links => {
                    setLinks(links);
                  }}
                  defaultValue={emptyAuthorLink}
                >
                  {({ value, onChange }) => (
                    <Controls>
                      <Control
                        name="title"
                        placeholder={t('authors.panels.title')}
                        value={value.title}
                        onChange={(title: string) =>
                          onChange({ ...value, title })
                        }
                      />
                      <Group>
                        <InputGroup inside>
                          <RInputGroup.Addon>
                            <MdLink />
                          </RInputGroup.Addon>

                          <Control
                            name="link"
                            placeholder={
                              t('authors.panels.link') + ':https//link.com'
                            }
                            value={value.url}
                            onChange={(url: any) => onChange({ ...value, url })}
                            accepter={Input}
                          />
                        </InputGroup>
                      </Group>
                    </Controls>
                  )}
                </ListInput>
              </CardContent>
            </Card>

            <Card variant="outlined">
              <CardHeader title={t('authors.panels.tags')} />

              <CardContent>
                <FormControl
                  name="tagIds"
                  defaultTags={data?.author?.tags ?? []}
                  selectedTags={tagIds}
                  setSelectedTags={(newTagIds: string[]) =>
                    setTagIds(newTagIds)
                  }
                  tagType={TagType.Author}
                  accepter={SelectTags}
                />
              </CardContent>
            </Card>

            {/* hide author in different places */}
            <Card variant="outlined">
              <CardHeader title={t('authorEditPanel.hideAuthor')} />

              <CardContent>
                <Group controlId="hideAuthorToggles">
                  <ToggleList>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={!!hideOnArticle}
                          onChange={(_event, value) => setHideOnArticle(value)}
                        />
                      }
                      label={t('authorEditPanel.hideOnArticle')}
                    />

                    <FormControlLabel
                      control={
                        <Switch
                          checked={!!hideOnTeaser}
                          onChange={(_event, value) => setHideOnTeaser(value)}
                        />
                      }
                      label={t('authorEditPanel.hideOnTeaser')}
                    />

                    <FormControlLabel
                      control={
                        <Switch
                          checked={!!hideOnTeam}
                          onChange={(_event, value) => setHideOnTeam(value)}
                        />
                      }
                      label={t('authorEditPanel.hideOnTeam')}
                    />
                  </ToggleList>
                </Group>
              </CardContent>
            </Card>
          </Stack>
        </DrawerBody>
      </Form>

      <Drawer
        anchor="right"
        slotProps={{
          paper: {
            sx: {
              display: 'flex',
              flexDirection: 'column',
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
            handleImageChange(value);
          }}
        />
      </Drawer>

      <Drawer
        anchor="right"
        slotProps={{
          paper: {
            sx: {
              display: 'flex',
              flexDirection: 'column',
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
  'CAN_GET_AUTHOR',
  'CAN_GET_AUTHORS',
  'CAN_CREATE_AUTHOR',
  'CAN_DELETE_AUTHOR',
])(AuthorEditPanel);
export { CheckedPermissionComponent as AuthorEditPanel };
