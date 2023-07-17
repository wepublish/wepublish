import {Theme, css, styled, useTheme} from '@mui/material'
import {BuilderEventProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {MdDateRange, MdLocationCity} from 'react-icons/md'
import {EventSEO} from './event-seo'

export const EventWrapper = styled('article')`
  display: grid;
  gap: ${({theme}) => theme.spacing(1)};
`

const eventImage = (theme: Theme) => css`
  aspect-ratio: 16 / 9;
  object-fit: cover;
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
    elements: {Image},
    blocks: {RichText, Title},
    date
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
              {date.format(new Date(data.event.startsAt))}
            </EventStart>

            {data.event.endsAt && (
              <>
                <span>&ndash;</span> {date.format(new Date(data.event.endsAt))}
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
