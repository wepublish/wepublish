import {styled} from '@mui/material'
import {ApiV1, isImageBlock, isRichTextBlock, isTitleBlock, RichTextBlock} from '@wepublish/website'
import {useWebsiteBuilder} from '@wepublish/website'
import {format} from 'date-fns'
import {de} from 'date-fns/locale'

interface BaslerinDesTagesProps {
  slug: string
}

const Headings = styled('div')(({theme}) => ({
  borderBottom: '1em solid #feddd2',
  marginLeft: '3em',
  gridColumn: '1/3',
  [theme.breakpoints.up('lg')]: {
    gridColumnStart: 2,
    paddingBottom: '3em',
    marginLeft: '1em'
  }
}))

const HeadingsInner = styled('div')(({theme}) => ({
  [theme.breakpoints.up('lg')]: {
    display: 'flex',
    justifyContent: 'space-between',
    maxWidth: '500px'
  }
}))

const Heading = styled('h1')(({theme}) => ({
  margin: 0,
  display: 'block',
  fontSize: '1.6em',
  lineHeight: '1.2em',
  fontWeight: 500
}))

const Content = styled('section')(({theme}) => ({
  marginLeft: '3em',
  marginRight: '2em',
  marginTop: '1em',
  gridColumn: '1/3',
  [theme.breakpoints.up('lg')]: {
    marginLeft: '1em',
    gridColumn: '2/3'
  }
}))

const HeadingLarge = styled(Heading)(({theme}) => ({
  fontSize: '2em',
  lineHeight: '1.3em',
  textTransform: 'uppercase'
}))

const BaslerinDesTagesWrapper = styled('article')(({theme}) => ({
  overflowX: 'hidden'
}))

const MobileGrid = styled('div')(({theme}) => ({
  display: 'grid',
  gridTemplateColumns: '50% 50%',
  gridAutoRows: 'max-content',
  gridGap: '1em',
  [theme.breakpoints.up('lg')]: {
    display: 'none'
  }
}))

const DesktopGrid = styled('div')(({theme}) => ({
  display: 'none',
  [theme.breakpoints.up('lg')]: {
    display: 'grid',
    gridTemplateColumns: '33% 67%',
    gridAutoRows: 'max-content',
    gridGap: '1em',
    paddingLeft: '3em'
  }
}))

const DateWeekdayContainer = styled('div')(({theme}) => ({
  display: 'flex',
  flexDirection: 'column'
}))

const DateDisplay = styled('span')(({theme}) => ({
  display: 'block',
  borderBottom: '1px solid black',
  fontSize: '0.8em',
  fontWeight: 500,
  [theme.breakpoints.up('lg')]: {
    fontSize: '1.3em',
    textAlign: 'right'
  }
}))

const WeekdayDisplay = styled(DateDisplay)(({theme}) => ({
  border: 'none'
}))

const Title = styled('span')(({theme}) => ({
  fontSize: '1.3em',
  fontWeight: 700,
  marginBottom: '1em'
}))

const ImageWrapperMobile = styled('div')(({theme}) => ({
  display: 'grid',
  gridTemplateColumns: '50vw repeat(6, 25vw)',
  gridTemplateRows: '1fr 1fr',
  gridGap: '0.8em',
  marginTop: '1em',
  marginLeft: '1em'
}))

const ImageWrapperDesktop = styled('div')(({theme}) => ({
  display: 'none',
  gridTemplateColumns: 'repeat(6, 10vw)',
  gridTemplateRows: '1fr',
  gridGap: '0.8em',
  marginTop: '1em',
  marginLeft: '1em',
  [theme.breakpoints.up('lg')]: {
    display: 'grid'
  }
}))

function ContentBlock(props: {
  titleBlock: ApiV1.TitleBlock
  textBlock: ApiV1.RichTextBlock
}): JSX.Element {
  return (
    <>
      <Content>
        <div style={{marginBottom: '1em'}}>
          {props.titleBlock.lead ? (
            <Title>{props.titleBlock.lead}</Title>
          ) : (
            <>
              <span>ist</span> <Title>{props.titleBlock.title}</Title>
              <span>, weil ...</span>
            </>
          )}
        </div>
        <div style={{maxWidth: '500px'}}>
          <RichTextBlock richText={props.textBlock.richText} />
        </div>
      </Content>
    </>
  )
}

export function BaslerinDesTages({slug}: BaslerinDesTagesProps) {
  const {
    elements: {Image}
  } = useWebsiteBuilder()

  const {data, loading, error} = ApiV1.useArticleQuery({
    variables: {
      slug
    }
  })

  if (loading) {
    return <p>Loading...</p>
  }

  if (error) {
    return <p>Error loading article.</p>
  }

  if (!data) {
    return <></>
  }

  const titleBlock = (data.article?.blocks as ApiV1.Block[]).find(isTitleBlock)
  const imageBlock = (data.article?.blocks as ApiV1.Block[]).find(isImageBlock)
  const textBlock = (data.article?.blocks as ApiV1.Block[]).find(isRichTextBlock)

  const publishedAt = data.article?.publishedAt
  const publicationDate = publishedAt ? format(new Date(publishedAt), 'd. MMM yyyy') : ''
  const publicationDay = publishedAt ? format(new Date(publishedAt), 'eeee', {locale: de}) : ''

  if (
    !imageBlock ||
    !imageBlock.image ||
    !titleBlock ||
    !titleBlock.title ||
    !textBlock ||
    !textBlock.richText
  ) {
    return <></>
  }

  return (
    <BaslerinDesTagesWrapper>
      <DesktopGrid>
        <Image
          style={{gridRow: '1/4'}}
          image={imageBlock.image}
          square
          css={{borderRadius: '15%'}}
        />

        <Headings>
          <HeadingsInner>
            <div>
              <HeadingLarge>Basler*in</HeadingLarge>
              <Heading>des Tages</Heading>
            </div>
            <DateWeekdayContainer>
              <DateDisplay>{publicationDate}</DateDisplay>
              <WeekdayDisplay>{publicationDay}</WeekdayDisplay>
            </DateWeekdayContainer>
          </HeadingsInner>
        </Headings>

        <ImageWrapperDesktop>
          <Image image={imageBlock.image} square css={{borderRadius: '15%'}} />
          <Image image={imageBlock.image} square css={{borderRadius: '15%'}} />
          <Image image={imageBlock.image} square css={{borderRadius: '15%'}} />
          <Image image={imageBlock.image} square css={{borderRadius: '15%'}} />
          <Image image={imageBlock.image} square css={{borderRadius: '15%'}} />
          <Image image={imageBlock.image} square css={{borderRadius: '15%'}} />
        </ImageWrapperDesktop>

        <ContentBlock titleBlock={titleBlock} textBlock={textBlock} />
      </DesktopGrid>

      <MobileGrid>
        <Headings>
          <HeadingsInner>
            <div>
              <HeadingLarge>Basler*in</HeadingLarge>
              <Heading>des Tages</Heading>
            </div>
          </HeadingsInner>
        </Headings>

        <ImageWrapperMobile>
          <Image image={imageBlock.image} square css={{borderRadius: '15%', gridRow: '1/3'}} />
          <Image image={imageBlock.image} square css={{borderRadius: '15%'}} />
          <Image image={imageBlock.image} square css={{borderRadius: '15%'}} />
          <Image image={imageBlock.image} square css={{borderRadius: '15%'}} />
          <Image image={imageBlock.image} square css={{borderRadius: '15%'}} />
          <Image image={imageBlock.image} square css={{borderRadius: '15%'}} />
          <Image image={imageBlock.image} square css={{borderRadius: '15%'}} />

          <DateWeekdayContainer>
            <DateDisplay>{publicationDate}</DateDisplay>
            <WeekdayDisplay>{publicationDay}</WeekdayDisplay>
          </DateWeekdayContainer>
        </ImageWrapperMobile>

        <ContentBlock titleBlock={titleBlock} textBlock={textBlock} />
      </MobileGrid>
    </BaslerinDesTagesWrapper>
  )
}
