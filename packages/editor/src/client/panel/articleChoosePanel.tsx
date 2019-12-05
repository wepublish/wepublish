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

import {ArticleReference, VersionState} from '../api/types'
import {useListArticlesQuery} from '../api/article'

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
          {articles.map(({id, createdAt, updatedAt, latest: {title, state, image}}: any) => (
            <Box key={id} marginBottom={Spacing.Small}>
              <Box marginBottom={Spacing.Tiny}>
                {props => (
                  // TODO: Clickable
                  <div
                    {...props}
                    style={{cursor: 'pointer'}}
                    onClick={() =>
                      onSelect({
                        id,
                        title,
                        image: image && {
                          id: image.id,
                          width: image.width,
                          height: image.height,
                          url: image.transform[0]
                        }
                      })
                    }>
                    <Typography variant="body2" color={title ? 'dark' : 'gray'}>
                      {title || 'Untitled'}
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
                    {new Date(createdAt).toLocaleString()}
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
