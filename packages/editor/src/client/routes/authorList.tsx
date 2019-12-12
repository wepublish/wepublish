import React from 'react'
import {Typography, Box, Spacing, Divider, Avatar, ImagePlaceholder} from '@karma.run/ui'

import {RouteLinkButton, ArticleCreateRoute, Link, AuthorEditRoute} from '../route'
import {useListAuthorsQuery} from '../api/author'

export function AuthorList() {
  const {data} = useListAuthorsQuery({
    variables: {
      first: 10
    },
    fetchPolicy: 'no-cache'
  })

  const articles = data?.authors.nodes.map(({id, name, image}) => (
    <Box key={id} display="block" marginBottom={Spacing.ExtraSmall}>
      {props => (
        <Link {...props} route={AuthorEditRoute.create({id})}>
          <Box
            key={id}
            marginBottom={Spacing.ExtraSmall}
            display="flex"
            flexDirection="row"
            alignItems="center">
            <Avatar width={50} height={50} marginRight={Spacing.Small}>
              <ImagePlaceholder width="100%" height="100%" />
            </Avatar>

            <Typography variant="h3" color={name ? 'dark' : 'gray'}>
              {name || 'Untitled'}
            </Typography>
          </Box>
          <Divider />
        </Link>
      )}
    </Box>
  ))

  return (
    <>
      <Box marginBottom={Spacing.Large} flexDirection="row" display="flex">
        <Typography variant="h1">Authors</Typography>
        <Box flexGrow={1} />
        <RouteLinkButton color="primary" label="New Author" route={ArticleCreateRoute.create({})} />
      </Box>
      <Box>{articles}</Box>
    </>
  )
}
