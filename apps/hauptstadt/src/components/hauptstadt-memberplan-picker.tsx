import styled from '@emotion/styled'
import {
  MemberPlanItem,
  MemberPlanItemDescription,
  MemberPlanPicker,
  MemberPlanPickerRadios
} from '@wepublish/membership/website'

export const HauptstadtMemberPlanItem = styled(MemberPlanItem)`
  ${MemberPlanItemDescription} * {
    font-size: 1rem;
  }
`

export const HauptstadtMemberPlanPicker = styled(MemberPlanPicker)`
  ${MemberPlanPickerRadios} {
    gap: ${({theme}) => theme.spacing(4)};
  }
`
