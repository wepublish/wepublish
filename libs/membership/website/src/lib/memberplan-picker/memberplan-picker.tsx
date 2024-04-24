import {FormControlLabel, RadioGroup, styled} from '@mui/material'
import {BuilderMemberPlanPickerProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {forwardRef, useEffect} from 'react'

export const MemberPlanPickerWrapper = styled('fieldset')`
  display: grid;
  gap: ${({theme}) => theme.spacing(3)};
  // reset fieldset values
  margin: unset;
  padding: unset;
  border: unset;
`

export const MemberPlanPickerRadios = styled(RadioGroup)`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: ${({theme}) => theme.spacing(2)};

  // hide unwanted label
  label {
    margin: 0;
    display: grid;
    align-items: stretch;

    & > span {
      display: none;
    }
  }
`

export const MemberPlanPicker = forwardRef<HTMLButtonElement, BuilderMemberPlanPickerProps>(
  function MemberPlanPicker({memberPlans, onChange, value, className, name}, ref) {
    const {
      MemberPlanItem,
      elements: {Image},
      blocks: {RichText}
    } = useWebsiteBuilder()

    const showRadioButtons = memberPlans.length > 1
    const selectedMemberPlan = memberPlans.find(({id}) => id === value)

    useEffect(() => {
      if (memberPlans.length && !selectedMemberPlan) {
        onChange(memberPlans[0].id)
      }
    }, [memberPlans, onChange, selectedMemberPlan])

    if (!showRadioButtons) {
      return null
    }

    return (
      <MemberPlanPickerWrapper className={className}>
        <MemberPlanPickerRadios
          name={name}
          onChange={event => onChange(event.target.value)}
          value={value ? value : ''}
          ref={ref}>
          {memberPlans.map(memberPlan => (
            <FormControlLabel
              key={memberPlan.id}
              value={memberPlan.id}
              control={
                <MemberPlanItem
                  key={memberPlan.id}
                  checked={memberPlan.id === value}
                  name={memberPlan.name}
                  amountPerMonthMin={memberPlan.amountPerMonthMin}
                />
              }
              label={memberPlan.name}
            />
          ))}
        </MemberPlanPickerRadios>

        {selectedMemberPlan?.image && <Image image={selectedMemberPlan.image} />}
        {selectedMemberPlan?.description && <RichText richText={selectedMemberPlan.description} />}
      </MemberPlanPickerWrapper>
    )
  }
)
