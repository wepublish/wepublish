import styled from '@emotion/styled'
import {useEventListLazyQuery} from '@wepublish/editor/api'
import {useEffect} from 'react'
import {MdDateRange} from 'react-icons/md'
import {format} from 'date-fns'
import {Typography} from '@mui/material'
import {RichTextBlock} from '../src/richTextBlock/richTextBlock'
import {theme} from '../src/theme'
import {TipOfTheDay} from '../src/tip-of-the-day'
import MuiLink from '@mui/material/Link'
import Link from 'next/link'

const EventGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  grid-gap: 24px;

  ${theme.breakpoints.up('sm')} {
    grid-template-columns: 1fr 1fr;
  }

  ${theme.breakpoints.up('md')} {
    grid-template-columns: 1fr 1fr 1fr;
  }
`

const Event = styled.div`
  display: grid;
  grid-auto-rows: min-content;
  gap: 8px;
`

const EventImage = styled.img`
  width: 100%;
  height: 175px;
  object-fit: cover;
  border-radius: 6px;
  box-shadow: 1px 1px 10px rgba(0, 0, 0, 0.3);
`

const EventMeta = styled.div`
  display: grid;
  grid-template-columns: auto auto auto;
  grid-gap: 12px;
  justify-content: flex-start;
  align-items: center;
`

const EventDate = styled.div`
  display: grid;
  grid-template-columns: auto auto;
  grid-gap: 8px;
  align-items: center;
`

const RichText = styled.div`
  max-height: 195px;
  overflow-y: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

export function Index() {
  const [fetch, {data, loading}] = useEventListLazyQuery({
    fetchPolicy: 'no-cache',
    variables: {
      take: 4
    }
  })

  useEffect(() => {
    fetch({})
  }, [fetch])

  const tipOfTheDay = data?.events.nodes.find(event => event.tags.some(tag => tag.tag === 'Tipp'))
  const events = (data?.events.nodes || []).filter(event =>
    event.tags.every(tag => tag.tag !== 'Tipp')
  )

  return (
    <>
      {tipOfTheDay && <TipOfTheDay event={tipOfTheDay} />}

      <EventGrid>
        {events.map(event => (
          <Event key={event.id}>
            <EventImage src={event.image.largeURL} />

            <EventMeta>
              <EventDate>
                <MdDateRange />
                <small>{format(new Date(event.startsAt), 'dd.MM.yyyy hh:mm')}</small>
              </EventDate>
              &ndash; <small>{format(new Date(event.endsAt), 'dd.MM.yyyy hh:mm')}</small>
            </EventMeta>

            <Typography component="h3" variant="h5" sx={{flex: 1}} noWrap>
              {event.name}
            </Typography>

            <RichText>
              <RichTextBlock displayOnly value={event.description} />
            </RichText>

            <MuiLink component={Link} variant="subtitle1" href={`/events/${event.id}`}>
              Read more
            </MuiLink>
          </Event>
        ))}
      </EventGrid>
    </>
  )
}

export default Index
