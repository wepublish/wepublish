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
  IconScale
} from '@karma.run/ui'

import {VersionState} from '../api/common'
import {useListArticlesQuery, ArticleReference} from '../api/article'

export interface ArticleChoosePanelProps {
  onClose(): void
  onSelect(article: ArticleReference): void
}

export function ArticleChoosePanel({onClose, onSelect}: ArticleChoosePanelProps) {
  const [isErrorToastOpen, setErrorToastOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const {data, error, loading} = useListArticlesQuery({fetchPolicy: 'no-cache'})
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
          {articles.map(article => (
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
                    {article.updatedAt && new Date(article.updatedAt).toLocaleString()}
                  </Box>
                </Typography>
                {article.latest.state === VersionState.Draft && (
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
