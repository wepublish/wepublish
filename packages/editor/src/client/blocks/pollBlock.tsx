import styled from '@emotion/styled'
import React, {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {MdEdit} from 'react-icons/md'
import {Drawer, IconButton, Panel} from 'rsuite'

import {BlockProps} from '../atoms/blockList'
import {PlaceholderInput} from '../atoms/placeholderInput'
import {SelectPollPanel} from '../panel/selectPollPanel'
import {PollBlockValue} from './types'

const StyledIconWrapper = styled.div`
  position: absolute;
  z-index: 100;
  height: 100%;
  right: 0;
`

const StyledPoll = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`

const StyledPanel = styled(Panel)`
  height: 200;
  padding: 0;
  overflow: hidden;
  background-color: #f7f9fa;
`

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
      <StyledPanel bodyFill bordered>
        <PlaceholderInput onAddClick={() => setIsDialogOpen(true)}>
          {poll && (
            <StyledPoll>
              <StyledIconWrapper>
                <IconButton size="lg" icon={<MdEdit />} onClick={() => setIsDialogOpen(true)}>
                  {t('blocks.poll.edit')}
                </IconButton>
              </StyledIconWrapper>

              {poll.question}
            </StyledPoll>
          )}
        </PlaceholderInput>
      </StyledPanel>

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
