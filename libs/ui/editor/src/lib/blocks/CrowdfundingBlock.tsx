import {useTranslation} from 'react-i18next'
import {BlockProps} from '../atoms/blockList'
import {useEffect, useState} from 'react'
import {Drawer, IconButton, Panel as RPanel} from 'rsuite'
import {PlaceholderInput} from '../atoms'
import {MdEdit} from 'react-icons/md'
import styled from '@emotion/styled'
import {CrowdfundingBlockValue} from '.'
import {SelectCrowdfundingPanel} from '../panel/selectCrowdfundingPanel'

const IconWrapper = styled.div`
  position: absolute;
  z-index: 100;
  height: 100%;
  right: 0;
`

const Poll = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`

const Panel = styled(RPanel)`
  display: grid;
  height: 200px;
  padding: 0;
  overflow: hidden;
  background-color: #f7f9fa;
`

export const CrowdfundingBlock = ({
  value: {crowdfunding},
  onChange,
  autofocus
}: BlockProps<CrowdfundingBlockValue>) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const {t} = useTranslation()

  useEffect(() => {
    if (autofocus && !crowdfunding) {
      setIsDialogOpen(true)
    }
  }, [])

  return (
    <>
      <Panel bodyFill bordered>
        <PlaceholderInput onAddClick={() => setIsDialogOpen(true)}>
          {crowdfunding && (
            <Poll>
              <IconWrapper>
                <IconButton size="lg" icon={<MdEdit />} onClick={() => setIsDialogOpen(true)}>
                  {t('blocks.poll.edit')}
                </IconButton>
              </IconWrapper>

              {crowdfunding.name}
            </Poll>
          )}
        </PlaceholderInput>
      </Panel>

      <Drawer size="lg" open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
        <SelectCrowdfundingPanel
          selectedCrowdfunding={crowdfunding}
          onClose={() => setIsDialogOpen(false)}
          onSelect={onNewCrowdfunding => {
            setIsDialogOpen(false)
            onChange({crowdfunding: onNewCrowdfunding})
          }}
        />
      </Drawer>
    </>
  )
}
