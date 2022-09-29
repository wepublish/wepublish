import PencilIcon from '@rsuite/icons/legacy/Pencil'
import React, {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {Drawer, IconButton, Panel} from 'rsuite'

import {BlockProps} from '../atoms/blockList'
import {PlaceholderInput} from '../atoms/placeholderInput'
import {SelectPollPanel} from '../panel/selectPollPanel'
import {PollBlockValue} from './types'

export const PollBlock = ({value: {poll}, onChange, autofocus}: BlockProps<PollBlockValue>) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const {t} = useTranslation()

  useEffect(() => {
    if (autofocus && !poll) {
      setIsDialogOpen(true)
    }
  }, [])

  return (
    <>
      <Panel
        bodyFill
        bordered
        style={{
          height: 200,
          padding: 0,
          overflow: 'hidden',
          backgroundColor: '#f7f9fa'
        }}>
        <PlaceholderInput onAddClick={() => setIsDialogOpen(true)}>
          {poll && (
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
              <div
                style={{
                  position: 'absolute',
                  zIndex: 100,
                  height: '100%',
                  right: 0
                }}>
                <IconButton size={'lg'} icon={<PencilIcon />} onClick={() => setIsDialogOpen(true)}>
                  {t('blocks.poll.edit')}
                </IconButton>
              </div>

              {poll.question}
            </div>
          )}
        </PlaceholderInput>
      </Panel>

      <Drawer size="lg" open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
        <SelectPollPanel
          selectedPoll={poll}
          onClose={() => setIsDialogOpen(false)}
          onSelect={onNewPoll => {
            setIsDialogOpen(false)
            onChange({poll: onNewPoll})
          }}
        />
      </Drawer>
    </>
  )
}
