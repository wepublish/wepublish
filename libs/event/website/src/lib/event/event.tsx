import {styled, css, Theme, useTheme} from '@mui/material'
import {BuilderEventProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {MdDateRange, MdLocationCity} from 'react-icons/md'
import {format} from 'date-fns'
import {EventSEO} from './event-seo'

export const EventWrapper = styled('div')`
  display: grid;
  gap: ${({theme}) => theme.spacing(1)};
`

const eventImage = (theme: Theme) => css`
  img {
    width: 100%;
    aspect-ratio: 16 / 9;
    object-fit: cover;
  }
`

export const EventMeta = styled('div')`
  display: grid;
  grid-template-columns: auto auto;
  justify-content: space-between;
  align-items: center;
  gap: ${({theme}) => theme.spacing(2)};
`

const MetaWrapper = styled('div')`
  display: grid;
  grid-template-columns: auto auto auto;
  gap: ${({theme}) => theme.spacing(2)};
  justify-content: flex-start;
  align-items: center;
`

const EventStart = styled('div')`
  display: grid;
  grid-template-columns: auto auto;
  gap: ${({theme}) => theme.spacing(1)};
  align-items: center;
`

export const Event = ({data, loading, error, className}: BuilderEventProps) => {
  const theme = useTheme()

  const {
    blocks: {Image, RichText, Title}
  } = useWebsiteBuilder()

  return (
    <EventWrapper className={className}>
      {data?.event && <EventSEO event={data.event} />}
      {data?.event.image && <Image css={eventImage(theme)} image={data.event.image} />}

      {data?.event && (
        <EventMeta>
          <MetaWrapper>
            <EventStart>
              <MdDateRange />
              {format(new Date(data.event.startsAt), 'dd.MM.yyyy hh:mm')}
            </EventStart>

            {data.event.endsAt && (
              <>
                <span>&ndash;</span> {format(new Date(data.event.endsAt), 'dd.MM.yyyy hh:mm')}
              </>
            )}
          </MetaWrapper>

          <MetaWrapper>
            <MdLocationCity /> {data.event.location ?? 'Veranstaltungsort noch nicht bekannt'}
          </MetaWrapper>
        </EventMeta>
      )}

      <Title title={data?.event.name} />

      <RichText richText={data?.event.description ?? []} />
    </EventWrapper>
  )
}
