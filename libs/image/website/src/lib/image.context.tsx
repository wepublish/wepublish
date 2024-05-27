import {BuilderImageProviderProps} from '@wepublish/website/builder'
import {mergeDeepLeft} from 'ramda'
import {createContext, useContext, useMemo} from 'react'

export const ImageContext = createContext<BuilderImageProviderProps>({})

export const useImageProps = (props: BuilderImageProviderProps): BuilderImageProviderProps => {
  const contextProps = useContext(ImageContext)

  return useMemo(
    () =>
      mergeDeepLeft(
        {
          loading: 'lazy',
          fetchPriority: 'low',
          ...props
        },
        contextProps
      ),
    [contextProps, props]
  )
}
