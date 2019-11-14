import React from 'react'

import {Typography, Box, Spacing, Divider, Icon, IconScale} from '@karma.run/ui'
import {RouteLinkButton, ArticleCreateRoute, Link, ArticleEditRoute} from '../route'
import {useListArticlesQuery} from '../api/article'
import {MaterialIconQueryBuilder, MaterialIconUpdate} from '@karma.run/icons'

export function PageList() {
  const {data} = useListArticlesQuery({fetchPolicy: 'no-cache'})

  return (
    <>
      <Box marginBottom={Spacing.Large} flexDirection="row" flex>
        <Typography variant="h1">Pages</Typography>
        <Box flexGrow={1} />
        <RouteLinkButton color="primary" label="New Page" route={ArticleCreateRoute.create({})} />
      </Box>
      <Box>
        {data?.articles.nodes
          .sort((a: any, b: any) => {
            const dateA = new Date(a.updatedAt)
            const dateB = new Date(b.updatedAt)

            return dateA > dateB ? -1 : 1
          })
          .map(({id, createdAt, updatedAt, latest: {title}}: any) => (
            <Box key={id} marginBottom={Spacing.Small}>
              <Box marginBottom={Spacing.ExtraSmall}>
                <Link route={ArticleEditRoute.create({id})}>
                  <Typography variant="h3" color={title ? 'dark' : 'gray'}>
                    {title || 'Untitled'}
                  </Typography>
                </Link>
              </Box>
              <Box marginBottom={Spacing.ExtraSmall} flexDirection="row" alignItems="center" flex>
                <Typography element="div" variant="body1" color="grayDark">
                  <Box
                    marginRight={Spacing.ExtraSmall}
                    flexDirection="row"
                    alignItems="center"
                    flex>
                    <Box marginRight={Spacing.Tiny}>
                      <Icon element={MaterialIconQueryBuilder} scale={IconScale.Larger} />
                    </Box>
                    {new Date(createdAt).toLocaleString()}
                  </Box>
                </Typography>
                <Typography element="div" variant="body1" color="grayDark">
                  <Box marginRight={Spacing.Small} flexDirection="row" alignItems="center" flex>
                    <Box marginRight={Spacing.Tiny}>
                      <Icon element={MaterialIconUpdate} scale={IconScale.Larger} />
                    </Box>
                    {new Date(updatedAt).toLocaleString()}
                  </Box>
                </Typography>
              </Box>
              <Divider />
            </Box>
          ))}
      </Box>
    </>
  )
}
