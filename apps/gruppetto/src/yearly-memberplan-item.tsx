import {Radio, useRadioGroup} from '@mui/material'
import {
  BuilderMemberPlanItemProps,
  formatChf,
  MemberPlanItemWrapper,
  MemberPlanItemContent,
  MemberPlanItemName,
  MemberPlanItemPrice
} from '@wepublish/website'
import {forwardRef} from 'react'

export const YearlyMemberPlanItem = forwardRef<HTMLButtonElement, BuilderMemberPlanItemProps>(
  ({className, id, name, amountPerMonthMin, ...props}, ref) => {
    const radioGroup = useRadioGroup()
    const isChecked = props.checked ?? radioGroup?.value === id

    return (
      <MemberPlanItemWrapper className={className} isChecked={isChecked}>
        <MemberPlanItemContent>
          <MemberPlanItemName>{name}</MemberPlanItemName>

          <MemberPlanItemPrice>
            Ab {formatChf(Math.ceil((amountPerMonthMin / 100) * 12))} pro Jahr
          </MemberPlanItemPrice>
        </MemberPlanItemContent>

        <Radio ref={ref} name={name} disableRipple={true} {...props} />
      </MemberPlanItemWrapper>
    )
  }
)
