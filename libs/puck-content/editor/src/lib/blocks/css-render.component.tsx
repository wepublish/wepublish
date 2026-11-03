import { useQuery } from '@apollo/client/react';
import { ClassNames } from '@emotion/react';
import { puckBlockCss, Side } from '@wepublish/puck-content/website';
import { ImageDocument } from '@wepublish/website/api';
import { ReactNode } from 'react';

import { BreakpointStylingValue } from '../styling/styling.field';

const useBackgroundImageUrl = (
  backgroundImageId: string | undefined
): [string, string] | undefined => {
  const { data } = useQuery(ImageDocument, {
    variables: { id: backgroundImageId ?? '' },
    skip: !backgroundImageId,
  });
  const image = backgroundImageId ? data?.image : undefined;

  return backgroundImageId && image ?
      [backgroundImageId, image.xxl ?? image.url]
    : undefined;
};

export type CSSRenderProps = {
  styling: BreakpointStylingValue | undefined;
  marginSides?: Side[];
  className?: string;
  children: (className: string) => ReactNode;
};

export const CSSRender = ({
  styling,
  marginSides,
  className,
  children,
}: CSSRenderProps) => {
  const backgroundImageUrls = Object.fromEntries(
    [
      useBackgroundImageUrl(styling?.xs?.backgroundImage),
      useBackgroundImageUrl(styling?.sm?.backgroundImage),
      useBackgroundImageUrl(styling?.md?.backgroundImage),
      useBackgroundImageUrl(styling?.lg?.backgroundImage),
      useBackgroundImageUrl(styling?.xl?.backgroundImage),
    ].filter(entry => entry !== undefined)
  );

  return (
    <ClassNames>
      {({ css, cx, theme }) =>
        children(
          cx(
            className,
            css(
              puckBlockCss(
                theme,
                { styling },
                { marginSides, backgroundImageUrls }
              )
            )
          )
        )
      }
    </ClassNames>
  );
};
