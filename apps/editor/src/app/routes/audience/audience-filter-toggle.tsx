import styled from '@emotion/styled'
import {Dispatch, SetStateAction} from 'react'
import {useTranslation} from 'react-i18next'
import {MdInfo} from 'react-icons/md'
import {Form as RForm, Toggle, Tooltip, Whisper} from 'rsuite'

import {ActiveAudienceFilters} from './audience-dashboard'

const {ControlLabel} = RForm

const Label = styled(ControlLabel)`
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
  filterKey: keyof ActiveAudienceFilters
  activeFilters: ActiveAudienceFilters
  setActiveFilters: Dispatch<SetStateAction<ActiveAudienceFilters>>
}

export function AudienceFilterToggle({
  filterKey,
  activeFilters,
  setActiveFilters
}: AudienceFilterToggleProps) {
  const {t} = useTranslation()

  return (
    <>
      <Toggle
        checked={activeFilters[filterKey as keyof ActiveAudienceFilters]}
        onChange={(checked: boolean) =>
          setActiveFilters({
            ...activeFilters,
            [filterKey]: checked
          })
        }
      />
      <Label>{t(`audienceFilter.${filterKey}`)}</Label>
      <FilterInfo text={t(`audienceFilter.${filterKey}Info`)} />
    </>
  )
}
