import React from 'react'

import {Typography, Box} from '@karma.run/ui'
import {PrimaryRouteLinkButton, ArticleCreateRoute} from '../route'

export function ArticleList() {
  return (
    <Box flexDirection="row" flex>
      <Typography variant="h1">Articles</Typography>
      <Box flexGrow={1} />
      <PrimaryRouteLinkButton label="New Article" route={ArticleCreateRoute.create({})} />
    </Box>
  )
}
