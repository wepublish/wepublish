import React, {useState} from 'react'

import {
  MaterialIconQueryBuilder,
  MaterialIconUpdate,
  MaterialIconDeleteOutlined,
  MaterialIconGetAppOutlined,
  MaterialIconClose,
  MaterialIconCheck
} from '@karma.run/icons'

import {
  Typography,
  Box,
  Spacing,
  Divider,
  Icon,
  IconScale,
  SearchInput,
  OptionButton,
  Dialog,
  Panel,
  PanelHeader,
  NavigationButton,
  PanelSection,
  DescriptionList,
  DescriptionListItem
} from '@karma.run/ui'

import {RouteLinkButton, ArticleCreateRoute, Link, ArticleEditRoute} from '../route'
import {
  useListArticlesQuery,
  ArticleReference,
  useUnpublishArticleMutation,
  useDeleteArticleMutation
} from '../api/article'
import {VersionState} from '../api/common'

enum ConfirmAction {
  Delete = 'delete',
  Unpublish = 'unpublish'
}

export function ArticleList() {
  const [filter, setFilter] = useState('')

  const [isConfirmationDialogOpen, setConfirmationDialogOpen] = useState(false)
  const [currentArticle, setCurrentArticle] = useState<ArticleReference>()
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>()

  const [deleteArticle, {loading: isDeleting}] = useDeleteArticleMutation()
  const [unpublishArticle, {loading: isUnpublishing}] = useUnpublishArticleMutation()

  const {data, refetch, loading: isLoading} = useListArticlesQuery({
    variables: {filter: filter || undefined},
    fetchPolicy: 'no-cache'
  })

  const articles = data?.articles.nodes
    .sort((a, b) => {
      const dateA = new Date(a.latest.updatedAt)
      const dateB = new Date(b.latest.updatedAt)

      return dateA > dateB ? -1 : 1
    })
    .map(article => {
      const {
        id,
        createdAt,
        publishedAt,
        latest: {updatedAt, title, state}
      } = article

      return (
        <Box key={id} marginBottom={Spacing.Small}>
          <Box marginBottom={Spacing.ExtraSmall}>
            <Link route={ArticleEditRoute.create({id})}>
              <Typography variant="h3" color={title ? 'dark' : 'gray'}>
                {title || 'Untitled'}
              </Typography>
            </Link>
          </Box>
          <Box
            marginBottom={Spacing.ExtraSmall}
            flexDirection="row"
            alignItems="center"
            display="flex">
            <Typography element="div" variant="body1" color="grayDark">
              <Box
                marginRight={Spacing.ExtraSmall}
                flexDirection="row"
                alignItems="center"
                display="flex">
                <Box marginRight={Spacing.Tiny}>
                  <Icon element={MaterialIconQueryBuilder} scale={IconScale.Larger} />
                </Box>
                {new Date(createdAt).toLocaleString()}
              </Box>
            </Typography>
            <Typography element="div" variant="body1" color="grayDark">
              <Box
                marginRight={Spacing.Small}
                flexDirection="row"
                alignItems="center"
                display="flex">
                <Box marginRight={Spacing.Tiny}>
                  <Icon element={MaterialIconUpdate} scale={IconScale.Larger} />
                </Box>
                {updatedAt && new Date(updatedAt).toLocaleString()}
              </Box>
            </Typography>
            <Typography element="div" variant="subtitle1" color="gray">
              {publishedAt != undefined && 'Published'}
              {publishedAt != undefined && state === VersionState.Draft && ' / '}
              {state === VersionState.Draft && 'Draft'}
            </Typography>
            <Box flexGrow={1} />
            <OptionButton
              position="left"
              menuItems={
                publishedAt // TODO: Allow disabling menu items
                  ? [
                      {
                        id: ConfirmAction.Unpublish,
                        label: 'Unpublish',
                        icon: MaterialIconGetAppOutlined
                      },
                      {id: ConfirmAction.Delete, label: 'Delete', icon: MaterialIconDeleteOutlined}
                    ]
                  : [{id: ConfirmAction.Delete, label: 'Delete', icon: MaterialIconDeleteOutlined}]
              }
              onMenuItemClick={item => {
                setCurrentArticle(article)
                setConfirmationDialogOpen(true)
                setConfirmAction(item.id as ConfirmAction)
              }}
            />
          </Box>
          <Divider />
        </Box>
      )
    })

  return (
    <>
      <Box marginBottom={Spacing.Small} flexDirection="row" display="flex">
        <Typography variant="h1">Articles</Typography>
        <Box flexGrow={1} />
        <RouteLinkButton
          color="primary"
          label="New Article"
          route={ArticleCreateRoute.create({})}
        />
      </Box>
      <Box marginBottom={Spacing.Large}>
        <SearchInput
          placeholder="Search"
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
      </Box>
      <Box>
        {articles?.length ? (
          articles
        ) : !isLoading ? (
          <Typography variant="body1" color="gray" align="center">
            No Articles found
          </Typography>
        ) : null}
      </Box>
      <Dialog open={isConfirmationDialogOpen} width={340}>
        {() => (
          <Panel>
            <PanelHeader
              title={
                confirmAction === ConfirmAction.Unpublish ? 'Unpublish Article?' : 'Delete Article?'
              }
              leftChildren={
                <NavigationButton
                  icon={MaterialIconClose}
                  label="Cancel"
                  onClick={() => setConfirmationDialogOpen(false)}
                />
              }
              rightChildren={
                <NavigationButton
                  icon={MaterialIconCheck}
                  label="Confirm"
                  disabled={isUnpublishing || isDeleting}
                  onClick={async () => {
                    if (!currentArticle) return

                    switch (confirmAction) {
                      case ConfirmAction.Delete:
                        await deleteArticle({
                          variables: {id: currentArticle.id}
                        })
                        break

                      case ConfirmAction.Unpublish:
                        await unpublishArticle({
                          variables: {id: currentArticle.id}
                        })
                        break
                    }

                    setConfirmationDialogOpen(false)
                    refetch()
                  }}
                />
              }
            />
            <PanelSection>
              <DescriptionList>
                <DescriptionListItem label="Title">
                  {currentArticle?.latest.title || 'Untitled'}
                </DescriptionListItem>

                {currentArticle?.latest.lead && (
                  <DescriptionListItem label="Lead">
                    {currentArticle?.latest.lead}
                  </DescriptionListItem>
                )}

                <DescriptionListItem label="Created At">
                  {currentArticle?.createdAt && new Date(currentArticle.createdAt).toLocaleString()}
                </DescriptionListItem>

                <DescriptionListItem label="Updated At">
                  {currentArticle?.createdAt && new Date(currentArticle.createdAt).toLocaleString()}
                </DescriptionListItem>

                {currentArticle?.publishedAt && (
                  <DescriptionListItem label="Published At">
                    {currentArticle?.publishedAt &&
                      new Date(currentArticle.createdAt).toLocaleString()}
                  </DescriptionListItem>
                )}
              </DescriptionList>
            </PanelSection>
          </Panel>
        )}
      </Dialog>
    </>
  )
}
