import React from 'react'

import {Typography, Box} from '@karma.run/ui'
import {LinkPrimaryButton, ArticleCreateRoute} from '../route'

export function ArticleList() {
  return (
    <Box flexDirection="row" flex>
      <Typography variant="h1">Articles</Typography>
      <Box flexGrow={1} />
      <LinkPrimaryButton label="New Article" route={ArticleCreateRoute.create({})} />
    </Box>
  )
}
