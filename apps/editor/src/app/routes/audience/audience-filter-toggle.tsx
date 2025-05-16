import styled from '@emotion/styled'
import {Dispatch, SetStateAction} from 'react'
import {useTranslation} from 'react-i18next'
import {MdInfo} from 'react-icons/md'
import {Form as RForm, Toggle, Tooltip, Whisper} from 'rsuite'

import {AudienceClientFilter} from './audience-dashboard'

const {ControlLabel} = RForm

export const ToggleLable = styled(ControlLabel)`
  padding-left: ${({theme}) => theme.spacing(1)};
`

const Info = styled.div`
  margin-left: ${({theme}) => theme.spacing(1)};
  position: relative;
  display: inline-block;
`

const FilterInfo = ({text}: {text: string}) => (
  <Whisper trigger="hover" speaker={<Tooltip>{text}</Tooltip>} placement="top">
    <Info>
      <MdInfo size={24} />
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
        checked={clientFilter[filterKey as keyof AudienceClientFilter]}
        onChange={(checked: boolean) =>
          setClientFilter({
            ...clientFilter,
            [filterKey]: checked
          })
        }
      />
      <ToggleLable>{t(`audienceFilter.${filterKey}`)}</ToggleLable>
      <FilterInfo text={t(`audienceFilter.${filterKey}Info`)} />
    </>
  )
}
