import {createContext, memo, PropsWithChildren, useContext, useMemo} from 'react'
import {ReadingListIdentifier} from '@wepublish/website/builder'

export const ReadingListIndexContext = createContext(0)

export const useReadingList = () => {
  const index = useContext(ReadingListIndexContext)
  const props = useMemo(() => ({'data-reading-list-index': index}), [index])

  return [props, index] as const
}

export const ReadingListProvider = memo<PropsWithChildren<ReadingListIdentifier>>(
  ({children, index}) => {
    return (
      <ReadingListIndexContext.Provider value={index}>{children}</ReadingListIndexContext.Provider>
    )
  }
)
