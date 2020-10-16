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

import {useTranslation} from 'react-i18next'

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

  const {t} = useTranslation()

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
          title={t('articleEditor.panels.chooseArticle')}
          leftChildren={
            <NavigationButton
              icon={MaterialIconClose}
              label={t('articleEditor.panels.close')}
              onClick={() => onClose()}
              disabled={loading}
            />
          }
        />
        <PanelSection>
          <Box marginBottom={Spacing.Medium}>
            <SearchInput
              placeholder={t('articleEditor.panels.search')}
              value={filter}
              onChange={e => setFilter(e.target.value)}
            />
          </Box>
          {articles.map(article => {
            const states = []

            if (article.draft) states.push('articleEditor.panels.draft')
            if (article.pending) states.push('articleEditor.panels.pending')
            if (article.published) states.push('articleEditor.panels.published')

            return (
              <Box key={article.id} marginBottom={Spacing.Small}>
                <Box marginBottom={Spacing.Tiny}>
                  {props => (
                    // TODO: Clickable
                    <div {...props} style={{cursor: 'pointer'}} onClick={() => onSelect(article)}>
                      <Typography variant="body2" color={article.latest.title ? 'dark' : 'gray'}>
                        {article.latest.title || 'articleEditor.panels.untitled'}
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
