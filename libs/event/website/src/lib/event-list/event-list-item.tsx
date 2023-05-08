import {css, styled} from '@mui/material'
import {Event} from '@wepublish/website/api'
import {useWebsiteBuilder} from '@wepublish/website/builder'
import {format} from 'date-fns'
import {MdDateRange} from 'react-icons/md'

export const EventListItemWrapper = styled('article')`
  display: grid;
  gap: ${({theme}) => theme.spacing(2)};
  grid-template-columns: 1fr;

  ${({theme}) => css`
    ${theme.breakpoints.up('md')} {
      grid-template-columns: minmax(30%, 200px) auto;
    }
  `}
`

export const EventListItemContent = styled('div')`
  display: flex;
  flex-flow: column;
  gap: ${({theme}) => theme.spacing(1)};
`

export const EventListItemMeta = styled('div')`
  display: grid;
  grid-template-columns: auto auto auto;
  gap: ${({theme}) => theme.spacing(1)};
  justify-content: flex-start;
  align-items: center;
`

const EventListItemDate = styled('div')`
  display: grid;
  grid-template-columns: auto auto;
  gap: ${({theme}) => theme.spacing(1)};
  align-items: center;
`

export const EventListItem = ({
  description,
  name,
  image,
  startsAt,
  endsAt,
  className
}: Event & {className?: string}) => {
  const {
    elements: {H4},
    blocks: {RichText, Image}
  } = useWebsiteBuilder()

  return (
    <EventListItemWrapper className={className}>
      <Image image={image} />

      <EventListItemContent>
        <EventListItemMeta>
          <EventListItemDate>
            <MdDateRange />
            <span>{format(new Date(startsAt), 'dd.MM.yyyy hh:mm')}</span>
          </EventListItemDate>

          {endsAt && (
            <>
              &ndash; <span>{format(new Date(endsAt), 'dd.MM.yyyy hh:mm')}</span>
            </>
          )}
        </EventListItemMeta>

        <H4 component="h1">{name}</H4>
        <RichText richText={description ?? []} />
      </EventListItemContent>
    </EventListItemWrapper>
  )
}
