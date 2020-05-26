import React, {useEffect, useState} from 'react'
import {MaterialIconClose, MaterialIconUpdate, MaterialIconQueryBuilder} from '@karma.run/icons'

import {
  Box,
  NavigationButton,
  Panel,
  PanelHeader,
  PanelSection,
  Toast,
  Spacing,
  Divider,
  Typography,
  Icon,
  IconScale,
  SearchInput
} from '@karma.run/ui'

import {useArticleListQuery, ArticleRefFragment} from '../api'

export interface ArticleChoosePanelProps {
  onClose(): void
  onSelect(article: ArticleRefFragment): void
}

export function ArticleChoosePanel({onClose, onSelect}: ArticleChoosePanelProps) {
  const [isErrorToastOpen, setErrorToastOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [filter, setFilter] = useState('')

  const {data, error, loading} = useArticleListQuery({
    variables: {filter: filter || undefined, first: 50},
    fetchPolicy: 'no-cache'
  })
  const articles = data?.articles.nodes ?? []

  useEffect(() => {
    if (error) {
      setErrorToastOpen(true)
      setErrorMessage(error.message)
    }
  }, [error])

  return (
    <>
      <Panel>
        <PanelHeader
          title="Choose Article"
          leftChildren={
            <NavigationButton
              icon={MaterialIconClose}
              label="Close"
              onClick={() => onClose()}
              disabled={loading}
            />
          }
        />
        <PanelSection>
          <Box marginBottom={Spacing.Medium}>
            <SearchInput
              placeholder="Search"
              value={filter}
              onChange={e => setFilter(e.target.value)}
            />
          </Box>
          {articles.map(article => {
            const states = []

            if (article.draft) states.push('Draft')
            if (article.pending) states.push('Pending')
            if (article.published) states.push('Published')

            return (
              <Box key={article.id} marginBottom={Spacing.Small}>
                <Box marginBottom={Spacing.Tiny}>
                  {props => (
                    // TODO: Clickable
                    <div {...props} style={{cursor: 'pointer'}} onClick={() => onSelect(article)}>
                      <Typography variant="body2" color={article.latest.title ? 'dark' : 'gray'}>
                        {article.latest.title || 'Untitled'}
                      </Typography>
                    </div>
                  )}
                </Box>
                <Box
                  marginBottom={Spacing.ExtraSmall}
                  flexDirection="row"
                  alignItems="center"
                  display="flex">
                  <Typography element="div" variant="subtitle1" color="grayDark">
                    <Box
                      marginRight={Spacing.ExtraSmall}
                      flexDirection="row"
                      alignItems="center"
                      display="flex">
                      <Box marginRight={Spacing.Tiny}>
                        <Icon element={MaterialIconQueryBuilder} scale={IconScale.Larger} />
                      </Box>
                      {new Date(article.createdAt).toLocaleString()}
                    </Box>
                  </Typography>
                  <Typography element="div" variant="subtitle1" color="grayDark">
                    <Box
                      marginRight={Spacing.Small}
                      flexDirection="row"
                      alignItems="center"
                      display="flex">
                      <Box marginRight={Spacing.Tiny}>
                        <Icon element={MaterialIconUpdate} scale={IconScale.Larger} />
                      </Box>
                      {article.latest.updatedAt &&
                        new Date(article.latest.updatedAt).toLocaleString()}
                    </Box>
                  </Typography>
                  <Typography element="div" variant="subtitle1" color="gray">
                    {states.join(' / ')}
                  </Typography>
                </Box>
                <Divider />
              </Box>
            )
          })}
        </PanelSection>
      </Panel>
      <Toast
        type="error"
        open={isErrorToastOpen}
        autoHideDuration={5000}
        onClose={() => setErrorToastOpen(false)}>
        {errorMessage}
      </Toast>
    </>
  )
}
