import {Theme, css, styled, useTheme} from '@mui/material'
import {Event} from '@wepublish/website/api'
import {useWebsiteBuilder} from '@wepublish/website/builder'
import {MdDateRange} from 'react-icons/md'

export const eventListItemStyles = (theme: Theme) => css`
  display: grid;
  gap: ${theme.spacing(2)};
  grid-template-columns: 1fr;
  align-content: start;
  color: inherit;
  text-decoration: inherit;

  ${theme.breakpoints.up('md')} {
    grid-template-columns: minmax(30%, 200px) auto;
  }
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

const EventListItemImage = styled('div')``

export const EventListItem = ({
  url,
  description,
  name,
  image,
  startsAt,
  endsAt,
  className
}: Event & {className?: string}) => {
  const theme = useTheme()

  const {
    elements: {H4, Link, Image},
    blocks: {RichText},
    date
  } = useWebsiteBuilder()

  return (
    <Link role={'article'} href={url} css={eventListItemStyles(theme)} className={className}>
      <EventListItemImage>{image && <Image image={image} />}</EventListItemImage>

      <EventListItemContent>
        <EventListItemMeta>
          <EventListItemDate>
            <MdDateRange />
            <span>{date.format(new Date(startsAt))}</span>
          </EventListItemDate>

          {endsAt && (
            <>
              &ndash; <span>{date.format(new Date(endsAt))}</span>
            </>
          )}
        </EventListItemMeta>

        <H4 component="h1">{name}</H4>
        <RichText richText={description ?? []} />
      </EventListItemContent>
    </Link>
  )
}
