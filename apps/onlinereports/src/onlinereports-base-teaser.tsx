import {Box, Chip, css, styled, useTheme} from '@mui/material'
import {
  BuilderTeaserProps,
  extractTeaserData,
  TeaserAuthors,
  TeaserImageWrapper,
  TeaserLead,
  TeaserMetadata,
  TeaserPreTitleNoContent,
  TeaserTags,
  TeaserTime,
  TeaserWrapper,
  useWebsiteBuilder
} from '@wepublish/website'
import {useMemo} from 'react'

export const useImageStyles = () => {
  const theme = useTheme()

  return useMemo(
    () => css`
      max-height: 400px;
      width: 100%;
      object-fit: cover;
      grid-column: 1/13;
      transition: transform 0.3s ease-in-out;
      aspect-ratio: 4/3;

      :where(${TeaserWrapper}:hover &) {
        transform: scale(1.1);
      }

      ${theme.breakpoints.up('md')} {
        aspect-ratio: 4/3;
      }
    `,
    [theme]
  )
}
const useLinkStyles = () => {
  const theme = useTheme()

  return useMemo(
    () => css`
      align-content: start;
    `,
    [theme]
  )
}

export const Teaser = ({teaser, alignment, className}: BuilderTeaserProps) => {
  const {title, preTitle, lead, href, image, publishDate, authors, tags} = extractTeaserData(teaser)
  const {
    date,
    elements: {Image, Paragraph, H4, Link}
  } = useWebsiteBuilder()

  const imageStyles = useImageStyles()
  const linkStyles = useLinkStyles()

  return (
    <TeaserWrapper {...alignment}>
      <Link href={href} className={className} css={linkStyles}>
        <TeaserImageWrapper>
          {image && <Image image={image} css={imageStyles} />}
        </TeaserImageWrapper>

        {preTitle && (
          <OnlineReportsTeaserPreTitleWrapper>{preTitle}</OnlineReportsTeaserPreTitleWrapper>
        )}
        {!preTitle && <TeaserPreTitleNoContent />}

        <H4 component={OnlineReportsTeaserTitleWrapper}>{title}</H4>
        {lead && <Paragraph component={TeaserLead}>{lead}</Paragraph>}

        <TeaserMetadata>
          {authors && authors?.length ? (
            <TeaserAuthors>Von {authors?.join(', ')} </TeaserAuthors>
          ) : null}

          {publishDate && (
            <TeaserTime suppressHydrationWarning dateTime={publishDate}>
              {authors && authors?.length ? '| ' : null}
              {date.format(new Date(publishDate), false)}{' '}
            </TeaserTime>
          )}
        </TeaserMetadata>

        {!!tags?.length && (
          <TeaserTags>
            {tags?.slice(0, 5).map(tag => (
              <Chip key={tag.id} label={tag.tag} color="primary" variant="outlined" />
            ))}
          </TeaserTags>
        )}
      </Link>
    </TeaserWrapper>
  )
}

export const OnlineReportsTeaserTitleWrapper = styled('h2')`
  grid-area: title;
  font-size: 24px !important;
`

const OnlineReportsTeaserPreTitleWrapper = styled(Box)`
  color: ${({theme}) => theme.palette.accent.contrastText};
  grid-area: pretitle;
  font-size: 18px !important;
`

export const OnlineReportsBaseTeaser = styled(Teaser)`
  color: inherit;
  text-decoration: none;
  display: grid;

  grid-template-areas:
    'image'
    '.'
    'pretitle'
    'title'
    'lead'
    'tags';
  grid-template-rows: auto 12px auto auto auto auto;

  ${TeaserTags} {
    display: flex;
  }

  ${TeaserMetadata} {
    display: none;
  }

  ${TeaserPreTitleNoContent} {
    display: none;
  }

  .MuiChip-root {
    color: inherit;
    border-color: inherit;
  }
`
