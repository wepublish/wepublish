import {styled} from '@mui/material'
import {BuilderListicleBlockProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {Block, ListicleBlock as ListicleBlockType} from '@wepublish/website/api'

export const isListicleBlock = (block: Block): block is ListicleBlockType =>
  block.__typename === 'ListicleBlock'

export const ListicleBlockWrapper = styled('div')`
  display: grid;
  gap: ${({theme}) => theme.spacing(10)};
  grid-template-columns: minmax(min-content, 700px);
  justify-content: center;
`

export const ListicleBlockItem = styled('div')`
  display: grid;
  gap: ${({theme}) => theme.spacing(2)};
  justify-items: center;
`

export const ListicleBlockItemCounter = styled('div')`
  display: grid;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: ${({theme}) => theme.palette.primary.main};
  color: ${({theme}) => theme.palette.primary.contrastText};
  font-size: 1.5em;
  line-height: 1;
  width: 2em;
  height: 2em;
`

export const ListicleBlock = ({items, className}: BuilderListicleBlockProps) => {
  const {
    elements: {H3, Image},
    blocks: {RichText}
  } = useWebsiteBuilder()

  return (
    <ListicleBlockWrapper className={className}>
      {items.map((item, index) => (
        <ListicleBlockItem key={index}>
          <ListicleBlockItemCounter>{index + 1}</ListicleBlockItemCounter>

          <H3>{item.title}</H3>
          {item.image && <Image image={item.image} />}
          <RichText richText={item.richText} />
        </ListicleBlockItem>
      ))}
    </ListicleBlockWrapper>
  )
}
