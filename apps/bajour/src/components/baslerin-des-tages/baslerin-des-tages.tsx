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
  paddingBottom: '0.5em',
  marginLeft: '3em',
  display: 'flex',
  justifyContent: 'space-between',
  [theme.breakpoints.up('lg')]: {
    gridColumnStart: 2,
    paddingBottom: '3em',
    marginLeft: '1em'
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
  marginTop: '1em',
  gridColumn: '2/3',
  [theme.breakpoints.up('lg')]: {
    marginLeft: '1em'
  }
}))

const HeadingLarge = styled(Heading)(({theme}) => ({
  fontSize: '2em',
  lineHeight: '1.3em',
  textTransform: 'uppercase'
}))

const BaslerinDesTagesWrapper = styled('article')(({theme}) => ({
  overflowX: 'hidden',
  [theme.breakpoints.up('lg')]: {
    display: 'grid',
    gridGap: '1em',
    gridTemplateColumns: '1fr 2fr',
    gridTemplateRows: 'minmax(min-content, auto) 1fr'
  }
}))

const OnlyMobile = styled('div')(({theme}) => ({
  display: 'block',
  [theme.breakpoints.up('lg')]: {
    display: 'none'
  }
}))

const OnlyDesktop = styled('div')(({theme}) => ({
  display: 'none',
  [theme.breakpoints.up('lg')]: {
    display: 'block'
  }
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

const ImageWrapperMobile = styled(OnlyMobile)(({theme}) => ({
  display: 'grid',
  gridTemplateColumns: '50vw repeat(6, 25vw)',
  gridTemplateRows: '1fr 1fr',
  gridGap: '0.8em',
  marginTop: '1em',
  marginLeft: '1em'
}))

const ImageWrapperDesktop = styled(OnlyDesktop)(({theme}) => ({
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

export function BaslerinDesTages({slug}: BaslerinDesTagesProps) {
  const {
    elements: {Image}
  } = useWebsiteBuilder()

  const {data, loading, error} = ApiV1.useArticleQuery({
    variables: {
      slug
    }
  })

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
      <OnlyDesktop css={{gridRow: '1/4', marginTop: '3em'}}>
        <Image image={imageBlock.image} square css={{borderRadius: '15%'}} />
      </OnlyDesktop>
      <Headings>
        <div>
          <HeadingLarge>Basler*in</HeadingLarge>
          <Heading>des Tages</Heading>
        </div>
        <OnlyDesktop>
          <DateDisplay>{publicationDate}</DateDisplay>
          <WeekdayDisplay>{publicationDay}</WeekdayDisplay>
        </OnlyDesktop>
      </Headings>

      <ImageWrapperMobile>
        <Image image={imageBlock.image} square css={{borderRadius: '15%', gridRow: '1/3'}} />
        <Image image={imageBlock.image} square css={{borderRadius: '15%'}} />
        <Image image={imageBlock.image} square css={{borderRadius: '15%'}} />
        <Image image={imageBlock.image} square css={{borderRadius: '15%'}} />
        <Image image={imageBlock.image} square css={{borderRadius: '15%'}} />
        <Image image={imageBlock.image} square css={{borderRadius: '15%'}} />
        <Image image={imageBlock.image} square css={{borderRadius: '15%'}} />

        <OnlyMobile css={{gridColumnStart: '2'}}>
          <DateDisplay>{publicationDate}</DateDisplay>
          <WeekdayDisplay>{publicationDay}</WeekdayDisplay>
        </OnlyMobile>
      </ImageWrapperMobile>

      <ImageWrapperDesktop>
        <Image image={imageBlock.image} square css={{borderRadius: '15%'}} />
        <Image image={imageBlock.image} square css={{borderRadius: '15%'}} />
        <Image image={imageBlock.image} square css={{borderRadius: '15%'}} />
        <Image image={imageBlock.image} square css={{borderRadius: '15%'}} />
        <Image image={imageBlock.image} square css={{borderRadius: '15%'}} />
        <Image image={imageBlock.image} square css={{borderRadius: '15%'}} />
      </ImageWrapperDesktop>

      <Content>
        {titleBlock.lead ? (
          <Title>{titleBlock.lead}</Title>
        ) : (
          <>
            <span>ist</span> <Title>{titleBlock.title}</Title>
            <span>, weil ...</span>
          </>
        )}
      </Content>
      <Content>
        <RichTextBlock richText={textBlock.richText} />
      </Content>
    </BaslerinDesTagesWrapper>
  )
}
