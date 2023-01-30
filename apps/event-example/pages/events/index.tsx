import styled from '@emotion/styled'
import {Checkbox, FormControlLabel, FormGroup, TextField, Typography} from '@mui/material'
import {DateTimePicker} from '@mui/x-date-pickers'
import {useEventListLazyQuery, useTagListQuery, Tag} from '@wepublish/editor/api'
import {format} from 'date-fns'
import {useEffect, useState} from 'react'
import {MdDateRange} from 'react-icons/md'
import {RichTextBlock} from '../../src/richTextBlock/richTextBlock'
import {theme} from '../../src/theme'
import {ChipSelect} from '../../src/chip-select'
import MuiLink from '@mui/material/Link'
import Link from 'next/link'

const EventGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
`

const Event = styled.div`
  display: grid;
  row-gap: 8px;
  column-gap: 24px;
  grid-template-columns: 1fr;
  grid-template-areas:
    'title'
    'image'
    'date'
    'description';

  ${theme.breakpoints.up('sm')} {
    grid-template-columns: 1fr 1fr 1fr;
    grid-template-areas:
      'image date date'
      'image title title'
      'image description description';
  }
`

const EventImage = styled.img`
  grid-area: image;
  width: 100%;
  height: 175px;
  object-fit: cover;
  border-radius: 6px;
  margin-right: 16px;
  box-shadow: 1px 1px 10px rgba(0, 0, 0, 0.3);
`

const EventMeta = styled.div`
  grid-area: date;
  display: grid;
  grid-template-columns: auto auto auto;
  gap: 12px;
  justify-content: flex-start;
  align-items: center;
`

const EventName = styled(Typography)`
  grid-area: title;
`

const EventDate = styled.div`
  display: grid;
  grid-template-columns: auto auto;
  gap: 8px;
  align-items: center;
`

const RichText = styled.div`
  grid-area: description;
  max-height: 100px;
  overflow-y: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const Filter = styled.div`
  display: grid;
  grid-template-columns: 250px 250px;
  gap: 12px;
  margin-bottom: 24px;

  ${theme.breakpoints.up('md')} {
    grid-template-columns: 250px 250px 250px;
  }
`

export function Index() {
  const [fetch, {data}] = useEventListLazyQuery({
    fetchPolicy: 'no-cache'
  })

  const {data: tags} = useTagListQuery({
    fetchPolicy: 'no-cache'
  })

  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [upcomingOnly, setUpcomingOnly] = useState<boolean>(true)
  const [selectedTags, setSelectedTags] = useState<Tag['id'][]>([])

  useEffect(() => {
    fetch({
      variables: {
        take: 100,
        filter: {
          upcomingOnly,
          from: startDate?.toISOString(),
          to: endDate?.toISOString(),
          tags: selectedTags
        }
      }
    })
  }, [fetch, startDate, endDate, upcomingOnly, selectedTags])

  const events = data?.events.nodes || []

  return (
    <>
      <Filter>
        <DateTimePicker
          label="Von"
          value={startDate}
          onChange={setStartDate}
          renderInput={params => <TextField {...params} />}
        />

        <DateTimePicker
          label="Bis"
          value={endDate}
          onChange={setEndDate}
          renderInput={params => <TextField {...params} />}
        />

        <ChipSelect tags={tags?.tags.nodes} value={selectedTags} onChange={setSelectedTags} />

        <FormGroup>
          <FormControlLabel
            control={
              <Checkbox
                checked={upcomingOnly}
                onChange={(_, checked) => setUpcomingOnly(checked)}
              />
            }
            label="Nur bevorstehende"
          />
        </FormGroup>
      </Filter>

      <EventGrid>
        {events.map(event => (
          <MuiLink
            key={event.id}
            component={Link}
            color="inherit"
            underline="none"
            href={`/events/${event.id}`}>
            <Event>
              <EventImage src={event.image.largeURL} />

              <EventMeta>
                <EventDate>
                  <MdDateRange />
                  <small>{format(new Date(event.startsAt), 'dd.MM.yyyy hh:mm')}</small>
                </EventDate>
                &ndash; <small>{format(new Date(event.endsAt), 'dd.MM.yyyy hh:mm')}</small>
              </EventMeta>

              <EventName variant="h5" sx={{flex: 1}} noWrap>
                {event.name}
              </EventName>

              <RichText>
                <RichTextBlock displayOnly value={event.description} />
              </RichText>
            </Event>
          </MuiLink>
        ))}
      </EventGrid>
    </>
  )
}

export default Index
