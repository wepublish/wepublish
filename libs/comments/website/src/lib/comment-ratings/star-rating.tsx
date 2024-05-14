import {Snackbar, styled} from '@mui/material'
import {useWebsiteBuilder} from '@wepublish/website/builder'
import {useState} from 'react'

export const StarRatingWrapper = styled('div')`
  display: grid;
  grid-template-columns: auto max-content;
  align-items: center;
  justify-content: end;
  gap: ${({theme}) => theme.spacing(1)};
`

export const StarRatingName = styled('div')`
  font-size: 0.75em;
  font-weight: ${({theme}) => theme.typography.fontWeightBold};
  text-transform: uppercase;
`

export type StarRatingProps = {
  className?: string
  rating?: number
  name?: string | null
  hasRated?: boolean
  readOnly?: boolean
  onChange?: (rating: number) => void
}

export const StarRating = ({
  className,
  hasRated,
  rating = 0,
  readOnly,
  name,
  onChange
}: StarRatingProps) => {
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const {
    elements: {Rating}
  } = useWebsiteBuilder()

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false)
  }

  return (
    <StarRatingWrapper className={className}>
      {name && <StarRatingName>{name}</StarRatingName>}

      <Rating
        value={rating}
        readOnly={readOnly}
        onChange={(_, newValue) =>
          newValue && (hasRated ? setSnackbarOpen(true) : onChange?.(newValue))
        }
        showFilledIcon={hasRated}
      />
      <Snackbar
        open={snackbarOpen}
        anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message="Du hast bereits abgestimmt."
      />
    </StarRatingWrapper>
  )
}
