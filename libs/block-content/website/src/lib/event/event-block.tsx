import {styled} from '@mui/material'
import {truncateFirstParagraph} from '@wepublish/richtext'
import {Block, EventBlock as EventBlockType} from '@wepublish/website/api'
import {BuilderEventBlockProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {EventListItemWrapper} from '@wepublish/event/website'

export const isEventBlock = (block: Block): block is EventBlockType =>
  block.__typename === 'EventBlock'

export const EventBlockWrapper = styled('aside')`
  display: grid;
  gap: ${({theme}) => theme.spacing(4)};
  grid-template-columns: repeat(auto-fit, minmax(325px, 1fr));
  justify-items: center;

  ${EventListItemWrapper} {
    grid-template-columns: 1fr;
  }
`

const truncate = truncateFirstParagraph(255)

export const EventBlock = ({events, className}: BuilderEventBlockProps) => {
  const {EventListItem} = useWebsiteBuilder()

  return (
    <EventBlockWrapper className={className}>
      {events.map(event => (
        <EventListItem key={event.id} {...event} description={truncate(event.description)} />
      ))}
    </EventBlockWrapper>
  )
}
