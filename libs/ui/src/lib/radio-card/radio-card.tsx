import {css, Radio, RadioProps, styled, Typography, useRadioGroup} from '@mui/material'
import {ReactNode, forwardRef, PropsWithChildren} from 'react'

const Card = styled('div')<{isChecked: boolean}>`
  display: grid;
  width: 100%;
  height: 100%;
  border: 1px solid ${({theme}) => theme.palette.grey[400]};
  border-radius: ${({theme}) => theme.shape.borderRadius}px;
  padding: ${({theme}) => theme.spacing(2)};
  gap: ${({theme}) => theme.spacing(2)};

  ${({isChecked, theme}) =>
    isChecked &&
    css`
      color: ${theme.palette.primary.main};
      border-width: 2px;
      border-color: currentColor;
    `}
`

const CardRadioWrapper = styled('div')`
  display: grid;
  grid-template-columns: auto min-content;
  align-items: start;
`

const CardTitleWrapper = styled('div')`
  display: grid;
  align-items: start;
`

const CardSubLabel = styled(Typography)`
  opacity: 0.75;
`

export type RadioCardProps = PropsWithChildren<
  RadioProps & {label: ReactNode; subLabel?: ReactNode}
>

export const RadioCard = forwardRef<HTMLButtonElement, RadioCardProps>(
  ({label, subLabel, children, ...props}, ref) => {
    const radioGroup = useRadioGroup()
    const isChecked = props.checked ?? radioGroup?.value === props.value

    return (
      <Card isChecked={isChecked}>
        <CardRadioWrapper>
          <CardTitleWrapper>
            <Typography variant="h6" component="span">
              {label}
            </Typography>

            <CardSubLabel variant="body1">{subLabel}</CardSubLabel>
          </CardTitleWrapper>

          <Radio {...props} ref={ref} disableRipple={true} sx={{padding: 0}} />
        </CardRadioWrapper>

        {children}
      </Card>
    )
  }
)

RadioCard.displayName = 'RadioCard'
