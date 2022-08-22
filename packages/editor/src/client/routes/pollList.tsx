import PlusIcon from '@rsuite/icons/legacy/Plus'
import React from 'react'
import {useTranslation} from 'react-i18next'
import {Link} from 'react-router-dom'
import {Button, FlexboxGrid, Table} from 'rsuite'

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
          <Link to="polls/create">
            <Button appearance="primary" color="green" size="lg">
              <PlusIcon style={{marginRight: '5px'}} />
              {t('pollList.createNew')}
            </Button>
          </Link>
        </FlexboxGrid.Item>

        {/* table */}
        <FlexboxGrid.Item style={{marginTop: '20px'}} colspan={24}>
          Todo: List all polls in table
        </FlexboxGrid.Item>
      </FlexboxGrid>
    </>
  )
}
