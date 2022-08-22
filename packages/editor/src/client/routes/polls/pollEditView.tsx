import React, {useEffect} from 'react'
import {useTranslation} from 'react-i18next'
import {useParams} from 'react-router-dom'
import {FlexboxGrid, Message, toaster} from 'rsuite'

import {usePollQuery} from '../../api'
import {ModelTitle} from '../../atoms/modelTitle'

export function PollEditView() {
  const params = useParams()

  const {data, loading, error} = usePollQuery({
    variables: {
      pollId: params.id
    }
  })
  const {t} = useTranslation()

  /**
   * Handling errors
   */
  useEffect(() => {
    if (error?.message) {
      toaster.push(
        <Message type="error" showIcon closable duration={3000}>
          {error.message}
        </Message>
      )
    }
  }, [error])

  return (
    <>
      <FlexboxGrid>
        <FlexboxGrid.Item colspan={24}>
          <ModelTitle
            loading={loading}
            title={data?.poll?.question || t('pollList.noQuestion')}
            loadingTitle={t('pollEditView.loadingTitle')}
            saveTitle={t('pollEditView.saveTitle')}
            saveAndCloseTitle={t('pollEditView.saveAndCloseTitle')}
            closePath="/polls"
          />
        </FlexboxGrid.Item>
      </FlexboxGrid>
    </>
  )
}
