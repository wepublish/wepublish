import React from 'react'

import {MaterialIconQueryBuilder, MaterialIconUpdate} from '@karma.run/icons'
import {Typography, Box, Spacing, Divider, Icon, IconScale} from '@karma.run/ui'

import {RouteLinkButton, ArticleCreateRoute, Link, ArticleEditRoute} from '../route'
import {useListArticlesQuery} from '../api/article'
import {VersionState} from '../api/common'

export function ArticleList() {
  const {data} = useListArticlesQuery({fetchPolicy: 'no-cache'})
  const articles = data?.articles.nodes
    .sort((a, b) => {
      const dateA = new Date(a.updatedAt)
      const dateB = new Date(b.updatedAt)

      return dateA > dateB ? -1 : 1
    })
    .map(({id, createdAt, updatedAt, latest: {title, state}}) => (
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
            <Box marginRight={Spacing.Small} flexDirection="row" alignItems="center" display="flex">
              <Box marginRight={Spacing.Tiny}>
                <Icon element={MaterialIconUpdate} scale={IconScale.Larger} />
              </Box>
              {updatedAt && new Date(updatedAt).toLocaleString()}
            </Box>
          </Typography>
          {state === VersionState.Draft && (
            <Typography element="div" variant="subtitle1" color="gray">
              <Box
                marginRight={Spacing.Small}
                flexDirection="row"
                alignItems="center"
                display="flex">
                Draft
              </Box>
            </Typography>
          )}
        </Box>
        <Divider />
      </Box>
    ))

  return (
    <>
      <Box marginBottom={Spacing.Large} flexDirection="row" display="flex">
        <Typography variant="h1">Articles</Typography>
        <Box flexGrow={1} />
        <RouteLinkButton
          color="primary"
          label="New Article"
          route={ArticleCreateRoute.create({})}
        />
      </Box>
      <Box>{articles}</Box>
    </>
  )
}
