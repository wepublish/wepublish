import styled from '@emotion/styled'
import {useWebsiteBuilder} from '@wepublish/website/builder'

export const StarRatingWrapper = styled('div')`
  display: grid;
  grid-template-columns: 1fr max-content;
  align-items: center;
  justify-content: start;
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
