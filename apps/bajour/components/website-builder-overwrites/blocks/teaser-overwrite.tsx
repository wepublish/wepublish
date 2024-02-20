import {
  BuilderTeaserProps,
  selectTeaserAuthors,
  selectTeaserDate,
  selectTeaserImage,
  selectTeaserLead,
  selectTeaserPreTitle,
  selectTeaserTitle,
  selectTeaserUrl,
  useWebsiteBuilder
} from '@wepublish/website'
import {ApiV1} from '@wepublish/website'

import {
  AuthorsAndDate,
  LinkAndGridContainer,
  ReadMoreButton,
  SingleLine,
  TeaserContentStyled,
  TeaserImgStyled,
  TeaserLeadBelow,
  TeaserLeadStyled,
  TeaserPreTitleStyled,
  TeaserTitlesStyled,
  TextLine,
  TitleLine
} from './teaser-overwrite.style'

export function TeaserOverwrite({className, teaser, numColumns}: BuilderTeaserProps) {
  const title = teaser && selectTeaserTitle(teaser)
  const preTitle = teaser && selectTeaserPreTitle(teaser)
  const lead = teaser && selectTeaserLead(teaser)
  const image = teaser && selectTeaserImage(teaser)
  const publishDate = teaser && selectTeaserDate(teaser)
  const authors = teaser && selectTeaserAuthors(teaser)
  const href = teaser && selectTeaserUrl(teaser)

  const {date} = useWebsiteBuilder()

  const isSingleBlock = numColumns === 1

  const isTextTeaser = !isSingleBlock && teaser?.style === ApiV1.TeaserStyle.Text
  const isDefaultTeaser = !isSingleBlock && teaser?.style === ApiV1.TeaserStyle.Default
  const hideTeaser = isTextTeaser
  const hideAuthorAndDate = isTextTeaser
  const applyLeadBelow = !isSingleBlock && teaser?.style === ApiV1.TeaserStyle.Light

  return (
    <LinkAndGridContainer color="inherit" underline="none" href={href ?? ''} className={className}>
      {image && <TeaserImgStyled image={image} />}

      <TeaserContentStyled>
        {!hideTeaser && (
          <TeaserPreTitleStyled>{preTitle && <span>{preTitle}</span>}</TeaserPreTitleStyled>
        )}

        <TeaserTitlesStyled>{title}</TeaserTitlesStyled>

        {(isSingleBlock || isDefaultTeaser) && <TitleLine />}

        {!hideAuthorAndDate && (
          <AuthorsAndDate>
            {authors?.length && <>Von {authors?.join(', ')},</>}
            {publishDate && (
              <time dateTime={publishDate}> {date.format(new Date(publishDate), false)} </time>
            )}
          </AuthorsAndDate>
        )}

        <TeaserLeadStyled>{lead}</TeaserLeadStyled>

        {isSingleBlock && <SingleLine />}

        {isDefaultTeaser && (
          <ReadMoreButton variant="outlined" color="inherit" size="small">
            Weiterlesen
          </ReadMoreButton>
        )}
      </TeaserContentStyled>

      {isTextTeaser && <TextLine />}

      {applyLeadBelow && <TeaserLeadBelow>{lead}</TeaserLeadBelow>}
    </LinkAndGridContainer>
  )
}
