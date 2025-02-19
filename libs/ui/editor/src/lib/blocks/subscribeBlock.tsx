import styled from '@emotion/styled'
import {useTranslation} from 'react-i18next'
import {Panel as RPanel} from 'rsuite'
import {SubscribeBlockValue} from '.'
import {BlockProps} from '../atoms/blockList'

const Panel = styled(RPanel)`
  display: grid;
  padding: 0;
  overflow: hidden;
  background-color: #f7f9fa;
`

export const SubscribeBlock = (_props: BlockProps<SubscribeBlockValue>) => {
  const {t} = useTranslation()

  return (
    <Panel isEmpty={false} bordered>
      <p>{t('blocks.subscribe.label')}</p>
    </Panel>
  )
}
