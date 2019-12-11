import React from 'react'

import {Typography, Box, Spacing, Divider, Icon, IconScale} from '@karma.run/ui'
import {RouteLinkButton, Link, PageCreateRoute, PageEditRoute} from '../route'
import {MaterialIconQueryBuilder, MaterialIconUpdate} from '@karma.run/icons'
import {useListPagesQuery} from '../api/page'
import {VersionState} from '../api/common'

export function PageList() {
  const {data} = useListPagesQuery({fetchPolicy: 'no-cache'})

  return (
    <>
      <Box marginBottom={Spacing.Large} flexDirection="row" display="flex">
        <Typography variant="h1">Pages</Typography>
        <Box flexGrow={1} />
        <RouteLinkButton color="primary" label="New Page" route={PageCreateRoute.create({})} />
      </Box>
      <Box>
        {data?.pages.nodes
          .sort((a: any, b: any) => {
            const dateA = new Date(a.updatedAt)
            const dateB = new Date(b.updatedAt)

            return dateA > dateB ? -1 : 1
          })
          .map(({id, createdAt, updatedAt, latest: {title, state}}: any) => (
            <Box key={id} marginBottom={Spacing.Small}>
              <Box marginBottom={Spacing.ExtraSmall}>
                <Link route={PageEditRoute.create({id})}>
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
                    {new Date(updatedAt).toLocaleString()}
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
          ))}
      </Box>
    </>
  )
}
