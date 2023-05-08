import {styled} from '@mui/material'
import {BuilderEventListProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {compose} from 'ramda'
import {useMemo} from 'react'
import {Element, Node, Text} from 'slate'

const MAX_LENGTH = 225

const isNodeText = (node: Node): node is Text => 'text' in node

const truncateParagraph =
  (maxLength: number) =>
  (paragraph: Element | undefined): Node | undefined => {
    let textLength = 0

    const truncated = paragraph?.children.reduce(
      (acc: Element, curr) => {
        if (!isNodeText(curr)) {
          return acc
        }

        let newText = curr.text

        if (textLength + curr.text.length > maxLength) {
          newText = curr.text.substring(0, Math.max(0, maxLength - textLength))
        }

        acc.children.push({
          ...curr,
          text: newText
        })
        textLength += newText.length

        return acc
      },
      {...paragraph, children: []}
    )

    return truncated
  }

const findFirstParagraph = (nodes: Node[] | undefined | null) =>
  nodes?.find((node): node is Element => node.type === 'paragraph')

const truncateSlate = (maxLength: number) =>
  compose(node => (node ? [node] : node), truncateParagraph(maxLength), findFirstParagraph)

export const EventListWrapper = styled('div')`
  display: grid;
  gap: ${({theme}) => theme.spacing(4)};
  justify-items: center;
`

export const EventList = ({data, className}: BuilderEventListProps) => {
  const {EventListItem} = useWebsiteBuilder()

  const truncate = useMemo(() => truncateSlate(MAX_LENGTH), [])

  return (
    <EventListWrapper className={className}>
      {data?.events?.nodes.map(event => (
        <EventListItem key={event.id} {...event} description={truncate(event.description)} />
      ))}
    </EventListWrapper>
  )
}
