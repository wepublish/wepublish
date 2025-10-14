import {
  hasBlockStyle,
  selectTeaserAuthors,
  selectTeaserDate,
  selectTeaserImage,
  selectTeaserLead,
  selectTeaserPreTitle,
  selectTeaserTitle,
  selectTeaserUrl,
} from '@wepublish/block-content/website';
import {
  BuilderTeaserProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';

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
  TitleLine,
} from './teaser-overwrite.style';

export function TeaserOverwrite({
  className,
  teaser,
  numColumns,
  blockStyle,
}: BuilderTeaserProps) {
  const title = teaser && selectTeaserTitle(teaser);
  const preTitle = teaser && selectTeaserPreTitle(teaser);
  const lead = teaser && selectTeaserLead(teaser);
  const image = teaser && selectTeaserImage(teaser);
  const publishDate = teaser && selectTeaserDate(teaser);
  const authors = teaser && selectTeaserAuthors(teaser);
  const href = teaser && selectTeaserUrl(teaser);

  const { date } = useWebsiteBuilder();

  const isSingleBlock = numColumns === 1;

  const isTextTeaser =
    !isSingleBlock && hasBlockStyle('Kleine Teaser')({ blockStyle });
  const isDefaultTeaser = !isSingleBlock && !blockStyle;
  const hideTeaser = isTextTeaser;
  const hideAuthorAndDate = isTextTeaser;
  const applyLeadBelow =
    !isSingleBlock && hasBlockStyle('Breite Teaser')({ blockStyle });

  return (
    <LinkAndGridContainer
      color="inherit"
      underline="none"
      href={href ?? ''}
      className={className}
    >
      {image && <TeaserImgStyled image={image} />}

      <TeaserContentStyled>
        {!hideTeaser && (
          <TeaserPreTitleStyled>
            {preTitle && <span>{preTitle}</span>}
          </TeaserPreTitleStyled>
        )}

        <TeaserTitlesStyled>{title}</TeaserTitlesStyled>

        {(isSingleBlock || isDefaultTeaser) && <TitleLine />}

        {!hideAuthorAndDate && (
          <AuthorsAndDate gutterBottom={false}>
            {authors?.length && <>Von {authors?.join(', ')}, </>}
            {publishDate && (
              <time
                suppressHydrationWarning
                dateTime={publishDate}
              >
                {date.format(new Date(publishDate), false)}{' '}
              </time>
            )}
          </AuthorsAndDate>
        )}

        <TeaserLeadStyled>{lead}</TeaserLeadStyled>

        {isSingleBlock && <SingleLine />}

        {isDefaultTeaser && (
          <ReadMoreButton
            variant="outlined"
            color="inherit"
            size="small"
          >
            Weiterlesen
          </ReadMoreButton>
        )}
      </TeaserContentStyled>

      {isTextTeaser && <TextLine />}

      {applyLeadBelow && <TeaserLeadBelow>{lead}</TeaserLeadBelow>}
    </LinkAndGridContainer>
  );
}
