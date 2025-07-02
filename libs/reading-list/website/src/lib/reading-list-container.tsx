import {useUser} from '@wepublish/authentication/website'
import {useSaveReadingProgressMutation} from '@wepublish/website/api'
import {findLast, sortBy} from 'ramda'
import {useCallback} from 'react'
import {useDebounceCallback, useEventListener} from 'usehooks-ts'

function isElementAtLeastHalfVisible(el: Element): boolean {
  const rect = el.getBoundingClientRect()
  const vHeight = window.innerHeight || document.documentElement.clientHeight

  const elementHeight = rect.height
  const visibleTop = Math.max(rect.top, 0)
  const visibleBottom = Math.min(rect.bottom, vHeight)
  const visibleHeight = Math.max(0, visibleBottom - visibleTop)

  return visibleHeight >= elementHeight / 2
}

export const ReadingListContainer = ({articleId}: {articleId: string}) => {
  const {hasUser} = useUser()
  const [saveProgress, {data}] = useSaveReadingProgressMutation()

  const onScroll = useCallback(() => {
    const alreadyCompleted = data?.saveReadingListProgress === false

    if (!hasUser || !alreadyCompleted) {
      return
    }

    const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-reading-list-index]'))
    const sortedNodes = sortBy(node => +(node?.dataset.indexNumber ?? 0), nodes)
    const lastVisibleNode = findLast(isElementAtLeastHalfVisible, sortedNodes)

    const completed = sortedNodes.at(-1) === lastVisibleNode

    saveProgress({
      variables: {
        articleId,
        blockIndex: +(lastVisibleNode?.dataset.indexNumber ?? 0),
        completed
      }
    })
  }, [data?.saveReadingListProgress, hasUser, saveProgress, articleId])

  useEventListener('scroll', useDebounceCallback(onScroll, 300))

  return null
}
