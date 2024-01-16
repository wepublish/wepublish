import {styled} from '@mui/material'
import {useWebsiteBuilder} from '@wepublish/website/builder'

export const StarRatingWrapper = styled('div')`
  display: grid;
  grid-template-columns: auto max-content;
  align-items: center;
  justify-content: end;
  gap: ${({theme}) => theme.spacing(2)};
`

export const StarRatingName = styled('div')`
  font-size: 0.75em;
  font-weight: ${({theme}) => theme.typography.fontWeightBold};
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
  const {
    elements: {Rating}
  } = useWebsiteBuilder()

  return (
    <StarRatingWrapper className={className}>
      {name && <StarRatingName>{name}</StarRatingName>}

      <Rating
        value={rating}
        readOnly={readOnly}
        onChange={(_, newValue) => newValue && onChange?.(newValue)}
        showFilledIcon={hasRated}
      />
    </StarRatingWrapper>
  )
}
