import {useEventLazyQuery} from '@wepublish/editor/api'
import {useRouter} from 'next/router'
import {useEffect} from 'react'
import styled from '@emotion/styled'
import {format} from 'date-fns'
import {MdDateRange, MdLocationCity} from 'react-icons/md'
import {Typography} from '@mui/material'
import {RichTextBlock} from '../../src/richTextBlock/richTextBlock'

const Event = styled.div`
  display: grid;
  grid-auto-rows: min-content;
  gap: 8px;
  position: relative;
`

const EventImage = styled.img`
  width: 100%;
  height: 40vh;
  object-fit: cover;
  border-radius: 6px;
  box-shadow: 1px 1px 10px rgba(0, 0, 0, 0.3);
`

const EventMeta = styled.div`
  display: grid;
  grid-template-columns: auto auto;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
`

const MetaWrapper = styled.div`
  display: grid;
  grid-template-columns: auto auto auto;
  gap: 12px;
  justify-content: flex-start;
  align-items: center;
`

const EventStart = styled.div`
  display: grid;
  grid-template-columns: auto auto;
  gap: 8px;
  align-items: center;
`

const AdBadge = styled.div`
  position: absolute;
  border-radius: 8px;
  background-color: rgba(65, 92, 214, 0.5);
  color: #fff;
  top: 12px;
  right: 12px;
  padding: 8px 12px;
  font-size: 0.75em;
`

export function Index() {
  const {
    query: {id}
  } = useRouter()

  const [fetch, {data, loading}] = useEventLazyQuery({
    fetchPolicy: 'no-cache'
  })

  useEffect(() => {
    if (id) {
      fetch({
        variables: {
          id: id as string
        }
      })
    }
  }, [fetch, id])

  const event = data?.event

  const isAd = event?.tags.some(tag => tag.tag === 'Werbung')

  return (
    event && (
      <Event key={event.id}>
        {isAd && <AdBadge>Werbung</AdBadge>}

        <EventImage src={event.image.largeURL} />

        <EventMeta>
          <MetaWrapper>
            <EventStart>
              <MdDateRange />
              {format(new Date(event.startsAt), 'dd.MM.yyyy hh:mm')}
            </EventStart>
            <span>&ndash;</span> {format(new Date(event.endsAt), 'dd.MM.yyyy hh:mm')}
          </MetaWrapper>

          <MetaWrapper>
            <MdLocationCity /> {event.location ?? 'Veranstaltungsort noch nicht bekannt'}
          </MetaWrapper>
        </EventMeta>

        <Typography component="h1" variant="h2" fontWeight={600} sx={{flex: 1}}>
          {event.name}
        </Typography>

        <RichTextBlock displayOnly value={event.description} />
      </Event>
    )
  )
}

export default Index
