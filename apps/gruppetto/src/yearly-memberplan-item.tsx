import {Radio, useRadioGroup} from '@mui/material'
import {
  formatCurrency,
  MemberPlanItemContent,
  MemberPlanItemName,
  MemberPlanItemPrice,
  MemberPlanItemWrapper
} from '@wepublish/membership/website'
import {BuilderMemberPlanItemProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {forwardRef} from 'react'

export const YearlyMemberPlanItem = forwardRef<HTMLButtonElement, BuilderMemberPlanItemProps>(
  ({className, id, name, currency, amountPerMonthMin, ...props}, ref) => {
    const {
      meta: {locale}
    } = useWebsiteBuilder()
    const radioGroup = useRadioGroup()
    const isChecked = props.checked ?? radioGroup?.value === id

    return (
      <MemberPlanItemWrapper className={className} isChecked={isChecked}>
        <MemberPlanItemContent>
          <MemberPlanItemName>{name}</MemberPlanItemName>

          <MemberPlanItemPrice>
            Ab {formatCurrency(Math.ceil((amountPerMonthMin / 100) * 12), currency, locale)} pro
            Jahr
          </MemberPlanItemPrice>
        </MemberPlanItemContent>

        <Radio ref={ref} name={name} disableRipple={true} {...props} />
      </MemberPlanItemWrapper>
    )
  }
)

YearlyMemberPlanItem.displayName = 'YearlyMemberPlanItem'
