import { useMutation, useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import { Autocomplete, Button, FormLabel, TextField } from '@mui/material';
import {
  ArticleListDocument,
  CreateNavigationDocument,
  FullNavigationFragment,
  NavigationDocument,
  NavigationLinkInput,
  NavigationLinkType,
  NavigationListDocument,
  PageListDocument,
  UpdateNavigationDocument,
} from '@wepublish/editor/api';
import {
  CanCreateNavigation,
  CanDeleteNavigation,
  CanGetNavigation,
  CanGetNavigations,
} from '@wepublish/permissions';
import { useEffect, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  createCheckedPermissionComponent,
  ListInput,
  ListValue,
  PermissionControl,
  useAuthorisation,
} from '../atoms';
import { InfoTooltip } from '../atoms/infoTooltip';
import {
  DrawerActions,
  DrawerBody,
  FormFields,
  DrawerHeader,
  DrawerTitle,
} from '../drawer';
import { useSeededState } from '../hooks/use-seeded-state';
import { enqueueSnackbar } from '../snackbar';
import { generateID, getOperationNameFromDocument } from '../utility';

const Input = styled(TextField)`
  margin-bottom: 8px;
`;

export interface NavigationEditPanelProps {
  id?: string;

  onClose?(): void;
  onSave?(navigation: FullNavigationFragment): void;
}

export interface NavigationLink {
  label: string;
  type: string;
  articleID?: string | null;
  pageID?: string | null;
  url?: string | null;
}

function NavigationEditPanel({
  id,
  onClose,
  onSave,
}: NavigationEditPanelProps) {
  const isAuthorized = useAuthorisation(CanCreateNavigation.id);
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [navigationLinks, setNavigationLinks] = useState<
    ListValue<NavigationLink>[]
  >([]);

  const { t } = useTranslation();
  const linksLabelId = useId();

  const linkTypes = [
    {
      label: t('navigation.panels.linkTypeArticle'),
      value: 'ArticleNavigationLink',
    },
    { label: t('navigation.panels.linkTypePage'), value: 'PageNavigationLink' },
    {
      label: t('navigation.panels.linkTypeExternal'),
      value: 'ExternalNavigationLink',
    },
  ];

  const {
    data,
    loading: isLoading,
    error: loadError,
  } = useQuery(NavigationDocument, {
    variables: { id: id! },
    skip: id === undefined,
  });

  const {
    data: pageData,
    loading: isLoadingPageData,
    error: pageLoadError,
  } = useQuery(PageListDocument, {
    variables: { take: 50 },
  });

  const pages = pageData?.pages?.nodes ?? [];

  const {
    data: articleData,
    loading: isLoadingArticleData,
    error: articleLoadError,
  } = useQuery(ArticleListDocument, {
    variables: { take: 50 },
  });

  const articles = articleData?.articles?.nodes ?? [];

  const [createNavigation, { loading: isCreating, error: createError }] =
    useMutation(CreateNavigationDocument, {
      refetchQueries: [getOperationNameFromDocument(NavigationListDocument)],
    });

  const [updateNavigation, { loading: isUpdating, error: updateError }] =
    useMutation(UpdateNavigationDocument);

  const isDisabled =
    isLoading ||
    isCreating ||
    isUpdating ||
    isLoadingPageData ||
    loadError !== undefined ||
    pageLoadError !== undefined ||
    isLoadingArticleData ||
    articleLoadError !== undefined ||
    !isAuthorized;

  useSeededState(data?.navigation, navigation => {
    setName(navigation.name);
    setKey(navigation.key);
    setNavigationLinks(
      navigation.links?.map(link => ({
        id: generateID(),
        value: {
          label: link.label,
          type: link.__typename,
          articleID:
            link.__typename === 'ArticleNavigationLink' ?
              link.articleID
            : undefined,
          pageID:
            link.__typename === 'PageNavigationLink' ? link.pageID : undefined,
          url:
            link.__typename === 'ExternalNavigationLink' ? link.url : undefined,
        },
      })) ?? []
    );
  });

  useEffect(() => {
    const error =
      loadError?.message ??
      createError?.message ??
      updateError?.message ??
      pageLoadError?.message ??
      articleLoadError?.message;
    if (error) {
      enqueueSnackbar(error, { variant: 'error', autoHideDuration: null });
    }
  }, [loadError, createError, updateError, articleLoadError, pageLoadError]);

  function unionForNavigationLink(
    item: ListValue<NavigationLink>
  ): NavigationLinkInput {
    const link = item.value;
    switch (link.type) {
      case 'ArticleNavigationLink':
        return {
          type: NavigationLinkType.Article,
          label: link.label,
          articleID: link.articleID!,
        };
      case 'PageNavigationLink':
        return {
          type: NavigationLinkType.Page,
          label: link.label,
          pageID: link.pageID!,
        };
      case 'ExternalNavigationLink':
        return {
          type: NavigationLinkType.External,
          label: link.label,
          url: link.url!,
        };
      default:
        throw new Error('Type does not exist');
    }
  }

  async function handleSave() {
    if (id) {
      const { data } = await updateNavigation({
        variables: {
          id,
          name,
          key,
          links: navigationLinks.map(unionForNavigationLink),
        },
      });

      if (data?.updateNavigation) {
        onSave?.(data.updateNavigation);
      }
    } else {
      const { data } = await createNavigation({
        variables: {
          name,
          key,
          links: navigationLinks.map(unionForNavigationLink),
        },
      });

      if (data?.createNavigation) {
        onSave?.(data.createNavigation);
      }
    }
  }

  return (
    <>
      <DrawerHeader>
        <DrawerTitle>
          {id ?
            t('navigation.panels.editNavigation')
          : t('navigation.panels.createNavigation')}
        </DrawerTitle>

        <DrawerActions>
          <PermissionControl qualifyingPermissions={[CanCreateNavigation.id]}>
            <Button
              variant="contained"
              disabled={isDisabled}
              onClick={() => handleSave()}
            >
              {id ? t('save') : t('create')}
            </Button>
          </PermissionControl>
          <Button
            variant="text"
            onClick={() => onClose?.()}
          >
            {t('navigation.panels.close')}
          </Button>
        </DrawerActions>
      </DrawerHeader>
      <DrawerBody>
        <FormFields>
          <TextField
            label={t('navigation.panels.name')}
            name="name"
            placeholder={t('navigation.panels.name')}
            value={name}
            disabled={isDisabled}
            onChange={event => {
              setName(event.target.value);
            }}
            fullWidth
          />

          <TextField
            label={
              <>
                {t('navigation.panels.key')}{' '}
                <InfoTooltip text={t('navigation.panels.keyInfo')} />
              </>
            }
            name="key"
            placeholder={t('navigation.panels.key')}
            value={key}
            disabled={isDisabled}
            onChange={event => {
              setKey(event.target.value);
            }}
            fullWidth
          />

          <div
            role="group"
            aria-labelledby={linksLabelId}
          >
            <FormLabel id={linksLabelId}>{t('authors.panels.links')}</FormLabel>

            <ListInput
              disabled={isDisabled}
              value={navigationLinks}
              onChange={navigationLinkInput =>
                setNavigationLinks(navigationLinkInput)
              }
              defaultValue={{
                label: '',
                url: '',
                type: 'ExternalNavigationLink',
              }}
            >
              {({ value, onChange }) => (
                <>
                  <TextField
                    label={t('navigation.panels.label')}
                    value={value.label}
                    onChange={event => {
                      onChange({ ...value, label: event.target.value });
                    }}
                  />

                  <Autocomplete
                    options={linkTypes}
                    getOptionLabel={option => option.label}
                    isOptionEqualToValue={(option, selected) =>
                      option.value === selected.value
                    }
                    value={
                      linkTypes.find(option => option.value === value.type) ??
                      null
                    }
                    onChange={(_event, option) => {
                      const type = option?.value ?? null;
                      if (type) {
                        onChange({ ...value, type: type as string });
                      }
                    }}
                    renderInput={params => (
                      <TextField
                        {...params}
                        label={t('navigation.panels.linkType')}
                      />
                    )}
                  />

                  {(
                    value.type === 'PageNavigationLink' ||
                    value.type === 'ArticleNavigationLink'
                  ) ?
                    <Autocomplete
                      options={
                        value.type === 'PageNavigationLink' ?
                          pages.map(page => page.id!)
                        : articles.map(article => article.id!)
                      }
                      getOptionLabel={id =>
                        value.type === 'PageNavigationLink' ?
                          (pages.find(page => page.id === id)?.latest.title ??
                          id)
                        : (articles.find(article => article.id === id)?.latest
                            .title ?? id)
                      }
                      value={
                        (value.type === 'PageNavigationLink' ?
                          value.pageID
                        : value.articleID) ?? null
                      }
                      onChange={(_event, chosenReferenceID) => {
                        if (!chosenReferenceID) {
                          return;
                        }
                        if (value.type === 'PageNavigationLink') {
                          onChange({ ...value, pageID: chosenReferenceID });
                        } else {
                          onChange({ ...value, articleID: chosenReferenceID });
                        }
                      }}
                      renderInput={params => (
                        <TextField
                          {...params}
                          label={
                            value.type === 'PageNavigationLink' ?
                              t('navigation.panels.selectPage')
                            : t('navigation.panels.selectArticle')
                          }
                        />
                      )}
                    />
                  : <TextField
                      label={t('navigation.panels.url')}
                      value={value.url!}
                      onChange={event =>
                        onChange({
                          ...value,
                          url: event.target.value,
                        })
                      }
                    />
                  }
                </>
              )}
            </ListInput>
          </div>
        </FormFields>
      </DrawerBody>
    </>
  );
}
const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanGetNavigations.id,
  CanGetNavigation.id,
  CanCreateNavigation.id,
  CanDeleteNavigation.id,
])(NavigationEditPanel);
export { CheckedPermissionComponent as NavigationEditPanel };
