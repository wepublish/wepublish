import React, {useEffect} from 'react'
import {useTranslation} from 'react-i18next'
import {useNavigate} from 'react-router-dom'
import {FlexboxGrid, Message, toaster} from 'rsuite'

import {usePollsQuery} from '../../api'
import {ModelTitle} from '../../atoms/modelTitle'

export function PollEditView() {
  const navigate = useNavigate()
  const {data, loading, error} = usePollsQuery()
  const {t} = useTranslation()

  /**
   * Handling errors
   */
  useEffect(() => {
    toaster.push(<Message type="error" showIcon closable duration={3000} />)
  }, [error])

  function close(): void {
    navigate('/polls')
  }

  return (
    <>
      <FlexboxGrid>
        <FlexboxGrid.Item colspan={16}>
          <ModelTitle
            loading={loading}
            title={data.polls}
            loadingTitle={t('pollEditView.loadingTitle')}
            saveTitle={t('pollEditView.saveTitle')}
            saveAndCloseTitle={t('pollEditView.saveAndCloseTitle')}
            close={close}
          />
        </FlexboxGrid.Item>
      </FlexboxGrid>
    </>
  )
}
