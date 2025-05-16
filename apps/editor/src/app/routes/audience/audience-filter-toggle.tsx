import styled from '@emotion/styled'
import {Dispatch, SetStateAction} from 'react'
import {useTranslation} from 'react-i18next'
import {MdCircle, MdInfo} from 'react-icons/md'
import {Form as RForm, Toggle, Tooltip, Whisper} from 'rsuite'
import {AudienceClientFilter} from './useAudienceFilter'
import {chartColors} from './audience-chart'

const {ControlLabel} = RForm

export const ToggleLable = styled(ControlLabel)`
  padding-left: ${({theme}) => theme.spacing(1)};
`

const Info = styled.div`
  margin-left: ${({theme}) => theme.spacing(1)};
  position: relative;
  display: inline-block;
`

const FilterInfo = ({text, color}: {text: string; color: string | undefined}) => (
  <Whisper trigger="hover" speaker={<Tooltip>{text}</Tooltip>} placement="top">
    <Info>
      <MdInfo size={24} color={color} />
    </Info>
  </Whisper>
)

interface AudienceFilterToggleProps {
  filterKey: keyof AudienceClientFilter
  clientFilter: AudienceClientFilter
  setClientFilter: Dispatch<SetStateAction<AudienceClientFilter>>
}

export function AudienceFilterToggle({
  filterKey,
  clientFilter,
  setClientFilter
}: AudienceFilterToggleProps) {
  const {t} = useTranslation()

  return (
    <>
      <Toggle
        color={chartColors[filterKey]}
        style={{color: chartColors[filterKey]}}
        checked={clientFilter[filterKey as keyof AudienceClientFilter]}
        onChange={(checked: boolean) =>
          setClientFilter({
            ...clientFilter,
            [filterKey]: checked
          })
        }
      />
      <ToggleLable>{t(`audience.legend.${filterKey}`)}</ToggleLable>
      <FilterInfo text={t(`audience.legend.info.${filterKey}`)} color={chartColors[filterKey]} />
    </>
  )
}
