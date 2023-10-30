import {Radio, css, lighten, styled, useRadioGroup} from '@mui/material'
import {BuilderMemberPlanItemProps} from '@wepublish/website/builder'
import {forwardRef} from 'react'
import {formatChf} from '../formatters/format-currency'

export const MemberPlanItemWrapper = styled('div')<{isChecked: boolean}>`
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  width: 100%;
  padding: ${({theme}) => theme.spacing(2)};
  background-color: ${({theme}) => theme.palette.grey[100]};
  border-radius: ${({theme}) => theme.shape.borderRadius}px;
  border: 1px solid ${({theme}) => theme.palette.divider};

  ${({theme, isChecked}) =>
    isChecked &&
    css`
      border-color: ${theme.palette.primary.main};
      background-color: ${lighten(theme.palette.primary.main, 0.85)};
    `}
`

export const MemberPlanItemContent = styled('div')`
  display: grid;
`

export const MemberPlanItemName = styled('span')`
  font-weight: ${({theme}) => theme.typography.fontWeightMedium};
`

export const MemberPlanItemPrice = styled('small')`
  font-size: 0.75em;
`

export const MemberPlanItem = forwardRef<HTMLButtonElement, BuilderMemberPlanItemProps>(
  ({className, id, name, amountPerMonthMin, ...props}, ref) => {
    const radioGroup = useRadioGroup()
    const isChecked = props.checked ?? radioGroup?.value === id

    return (
      <MemberPlanItemWrapper className={className} isChecked={isChecked}>
        <MemberPlanItemContent>
          <MemberPlanItemName>{name}</MemberPlanItemName>

          <MemberPlanItemPrice>
            Ab {formatChf(amountPerMonthMin / 100)} pro Monat
          </MemberPlanItemPrice>
        </MemberPlanItemContent>

        <Radio ref={ref} name={name} disableRipple={true} {...props} />
      </MemberPlanItemWrapper>
    )
  }
)
