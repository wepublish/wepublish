import { BuilderImageProviderProps } from '@wepublish/website/builder';
import { mergeDeepRight } from 'ramda';
import { createContext, useContext, useMemo } from 'react';

export const ImageContext = createContext<BuilderImageProviderProps>({});

export const useImageProps = (
  props: BuilderImageProviderProps
): BuilderImageProviderProps => {
  const contextProps = useContext(ImageContext);

  return useMemo(
    () =>
      mergeDeepRight(
        {
          loading: 'lazy',
          fetchPriority: 'low',
          maxWidth: 1200,
          ...props,
        },
        contextProps
      ),
    [contextProps, props]
  );
};
