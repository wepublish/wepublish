import React, {useRef} from 'react'
import {Button, IconButton, InputNumber, Popover, Whisper} from 'rsuite'
import {MdAdd} from 'react-icons/md'
import {styled, TableCell} from '@mui/material'
import {useTranslation} from 'react-i18next'
import {PermissionControl} from '@wepublish/ui/editor'

interface CreateDayFormType {
  open: boolean
  dayNumber: string | number
}

interface ActionsHeadProps {
  setNewDay(newDay: number): void
}

export default function ({setNewDay}: ActionsHeadProps) {
  const {t} = useTranslation()
  const createDayFrom = useRef<CreateDayFormType>({
    open: false,
    dayNumber: -3
  })

  // Add a new day to timeline
  const addDayToTimeline = function () {
    if (createDayFrom.current.dayNumber !== null) {
      setNewDay(Number(createDayFrom.current.dayNumber))
    }
  }

  const PopoverBody = styled('div')`
    display: flex;
    min-width: 170px;
    justify-content: center;
    flex-wrap: wrap;
  `
  const FlexContainer = styled('div')`
    display: flex;
  `

  return (
    <PermissionControl qualifyingPermissions={['CAN_UPDATE_SUBSCRIPTION_FLOW']}>
      <TableCell align="center">
        <Whisper
          placement="leftEnd"
          trigger="click"
          speaker={
            <Popover>
              <PopoverBody>
                <h6>New day in timeline</h6>
                <FlexContainer style={{marginTop: '5px'}}>
                  <InputNumber
                    defaultValue={createDayFrom.current.dayNumber}
                    onChange={v => (createDayFrom.current.dayNumber = v)}
                    step={1}
                  />
                  <Button
                    onClick={() => addDayToTimeline()}
                    appearance="primary"
                    style={{marginLeft: '5px'}}>
                    {t('subscriptionFlow.add')}
                  </Button>
                </FlexContainer>
              </PopoverBody>
            </Popover>
          }>
          <IconButton icon={<MdAdd />} color="green" appearance="primary" circle />
        </Whisper>
      </TableCell>
    </PermissionControl>
  )
}
