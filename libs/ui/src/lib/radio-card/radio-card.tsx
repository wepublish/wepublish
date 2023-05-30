import {
  Box,
  css,
  Radio as MuiRadio,
  RadioProps,
  styled,
  Typography,
  useRadioGroup
} from '@mui/material'
import {ReactNode, forwardRef, PropsWithChildren} from 'react'

const Card = styled('div')<{isChecked: boolean}>`
  display: grid;
  grid-template-areas:
    'title radio'
    'children children';
  grid-template-columns: auto min-content;
  align-items: start;
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

const CardTitleWrapper = styled('div')`
  display: grid;
  align-items: start;
  grid-area: title;
`

const CardSubLabel = styled('span')`
  opacity: 0.75;
`

const Radio = styled(MuiRadio)`
  padding: 0;
  grid-area: radio;
`

export type RadioCardProps = PropsWithChildren<
  RadioProps & {label: ReactNode; subLabel?: ReactNode; className?: string}
>

export const RadioCard = forwardRef<HTMLButtonElement, RadioCardProps>(
  ({label, subLabel, children, className, ...props}, ref) => {
    const radioGroup = useRadioGroup()
    const isChecked = props.checked ?? radioGroup?.value === props.value

    return (
      <Card isChecked={isChecked} className={className}>
        <CardTitleWrapper>
          <Typography variant="h6" component="span">
            {label}
          </Typography>

          <Typography variant="body1" component={CardSubLabel}>
            {subLabel}
          </Typography>
        </CardTitleWrapper>

        <Radio {...props} ref={ref} disableRipple={true} sx={{padding: 0}} />

        <Box gridArea="children">{children}</Box>
      </Card>
    )
  }
)

RadioCard.displayName = 'RadioCard'
