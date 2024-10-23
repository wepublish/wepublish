import {addSeconds, differenceInSeconds, format, startOfDay} from 'date-fns'
import {ArticleQuery} from '../../api/public'
import {convertHtmlToSlate} from './convert-html-to-slate'
import {Node as SlateNode} from 'slate'

export const hasEmptyBlocks = (article: ArticleQuery['article']) =>
  article &&
  article.blocks.some(b => b.__typename === 'RichTextBlock' && isSlateNodeEmpty(b.richText))

export const isNodeEmpty = (node: any): boolean => {
  if (node?.text === '') {
    return true
  }
  if (node?.type === 'paragraph' && node?.children?.every(isNodeEmpty)) {
    return true
  }
  return false
}

export const isSlateNodeEmpty = (slateNode: any[] | undefined) => {
  if (slateNode === undefined || slateNode.length === 0) {
    return true
  }

  return slateNode.every(isNodeEmpty)
}

export const humanizeObject = (obj: object) =>
  Object.entries(obj)
    .filter(([key, value]) => value)
    .map(keyValue => keyValue.join(': '))
    .join(',')

function formatSeconds(seconds?: number) {
  if (seconds === undefined) {
    return 'unknown'
  }
  const time = addSeconds(startOfDay(new Date()), seconds)
  return format(time, 'HH:mm:ss')
}

export const createTimer = () => {
  const start = new Date()
  let total: number
  let done = 0
  let updateInterval: any
  const onUpdate = (callback: () => void) => {
    if (updateInterval) {
      clearInterval(updateInterval)
    }
    updateInterval = setInterval(callback, 1000)
  }

  const progress = () => (total ? `${done}/${total}` : undefined)
  const secondsElapsed = () => differenceInSeconds(new Date(), start)
  const secondsLeft = () => (done && total ? (secondsElapsed() / done) * total : undefined)

  return {
    updateTotal: (newTotal: number | string) => {
      total = +newTotal
      // onUpdate()
    },
    updateDone: (newDone: number | string) => {
      done = +newDone
      // onUpdate()
    },
    progress,
    minutesElapsed: secondsElapsed,
    minutesLeft: secondsLeft,
    onUpdate,
    message: () =>
      `Running for ${formatSeconds(
        secondsElapsed()
      )}, done ${progress()}, expected: ${formatSeconds(secondsLeft())} left`
  }
}

export function slugify(str: string) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[ÀÁÂÃÅÆĀĂĄẠẢẤẦẨẪẬẮẰẲẴẶ]/gi, 'a')
    .replace(/[Ä]/gi, 'ae')

    .replace(/[ÇĆĈČ]/gi, 'c')
    .replace(/[ÐĎĐÞ]/gi, 'd')
    .replace(/[ÈÉÊËĒĔĖĘĚẸẺẼẾỀỂỄỆ]/gi, 'e')
    .replace(/[ĜĞĢǴ]/gi, 'g')
    .replace(/[ĤḦ]/gi, 'h')
    .replace(/[ÌÍÎÏĨĪĮİỈỊ]/gi, 'i')
    .replace(/[Ĵ]/gi, 'j')
    .replace(/[Ĳ]/gi, 'ij')
    .replace(/[Ķ]/gi, 'k')
    .replace(/[ĹĻĽŁ]/gi, 'l')
    .replace(/[Ḿ]/gi, 'm')
    .replace(/[ÑŃŅŇ]/gi, 'n')
    .replace(/[ÒÓÔÕØŌŎŐỌỎỐỒỔỖỘỚỜỞỠỢǪǬƠ]/gi, 'o')
    .replace(/[ŒÖ]/gi, 'oe')

    .replace(/[ṕ]/gi, 'p')
    .replace(/[ŔŖŘ]/gi, 'r')
    .replace(/[ŚŜŞŠ]/gi, 's')
    .replace(/[ß]/gi, 'ss')
    .replace(/[ŢŤ]/gi, 't')
    .replace(/[ÙÚÛŨŪŬŮŰŲỤỦỨỪỬỮỰƯ]/gi, 'u')
    .replace(/[Ü]/gi, 'ue')

    .replace(/[ẂŴẀẄ]/gi, 'w')
    .replace(/[ẍ]/gi, 'x')
    .replace(/[ÝŶŸỲỴỶỸ]/gi, 'y')
    .replace(/[ŹŻŽ]/gi, 'z')
    .replace(/[·/_,:;\\']/gi, '-')
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '') //eslint-disable-line
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}

const removeLeadingEmptyNodes = (nodes: SlateNode[]) =>
  nodes.reduce<SlateNode[]>(
    (nodes, node) => (nodes.length === 0 && isNodeEmpty(node) ? [] : [...nodes, node]),
    []
  )

const removeTrailingEmptyNodes = (nodes: SlateNode[]) =>
  removeLeadingEmptyNodes(nodes.reverse()).reverse()

const removeSurroundingEmptyNodes = (nodes: SlateNode[]) =>
  removeLeadingEmptyNodes(removeTrailingEmptyNodes(nodes))

export async function transformHtmlToSlate(html: string): Promise<SlateNode[]> {
  const slate = ((await convertHtmlToSlate(html)) as unknown as SlateNode[]) ?? []
  return removeSurroundingEmptyNodes(slate)
}
