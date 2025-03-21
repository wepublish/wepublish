import {Element, Node, Text} from 'slate'
import {compose} from 'ramda'

export const isNodeText = (node: Node): node is Text => 'text' in node
export const isNodeElement = (node: Node): node is Element => 'children' in node

export const truncateParagraph =
  (maxLength: number) =>
  (paragraph: Node | undefined): Node | undefined => {
    let textLength = 0

    if (paragraph && !isNodeElement(paragraph)) {
      return
    }

    const truncated = (paragraph?.children as Node[] | undefined)?.reduce(
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

export const findFirstParagraph = (nodes: Node[] | undefined | null) =>
  nodes?.find((node): node is Node => node['type'] === 'paragraph')

export const truncateFirstParagraph = (maxLength: number) =>
  compose(node => (node ? [node] : node), truncateParagraph(maxLength), findFirstParagraph)
