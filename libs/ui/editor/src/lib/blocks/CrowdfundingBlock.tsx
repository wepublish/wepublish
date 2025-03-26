import {useTranslation} from 'react-i18next'
import {CrowdfundingBlockValue} from '.'
import {BlockProps} from '../atoms/blockList'
import {useEffect, useState} from 'react'
import {Drawer, Panel} from 'rsuite'

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
        <div>Hier kommt was 1</div>
      </Panel>

      <Drawer size="lg" open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
        <div>Hier kommt was 2</div>
      </Drawer>
    </>
  )
}
