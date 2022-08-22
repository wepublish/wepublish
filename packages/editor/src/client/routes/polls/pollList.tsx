import React from 'react'
import {useTranslation} from 'react-i18next'
import {FlexboxGrid} from 'rsuite'

import {CreatePollBtn} from '../../atoms/poll/createPollBtn'

export function PollList() {
  const {t} = useTranslation()

  return (
    <>
      <FlexboxGrid>
        {/* title */}
        <FlexboxGrid.Item colspan={16}>
          <h2>{t('pollList.title')}</h2>
        </FlexboxGrid.Item>

        {/* create new poll */}
        <FlexboxGrid.Item colspan={8} style={{textAlign: 'right', alignSelf: 'center'}}>
          <CreatePollBtn />
        </FlexboxGrid.Item>

        {/* table */}
        <FlexboxGrid.Item style={{marginTop: '20px'}} colspan={24}>
          Todo: List all polls in table
        </FlexboxGrid.Item>
      </FlexboxGrid>
    </>
  )
}
