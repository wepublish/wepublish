import { useQuery } from '@apollo/client/react';
import { ClassNames } from '@emotion/react';
import { Side } from '@wepublish/puck-content/editor';
import { ImageDocument } from '@wepublish/website/api';
import { ReactNode } from 'react';

import { cssStyles, CSSValue } from './css-styles';

export type CSSRenderProps = {
  styling: CSSValue | undefined;
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
  const backgroundImageId = styling?.backgroundImage;
  const { data } = useQuery(ImageDocument, {
    variables: { id: backgroundImageId ?? '' },
    skip: !backgroundImageId,
  });
  const image = backgroundImageId ? data?.image : undefined;
  const backgroundImageUrl = image ? (image.xxl ?? image.url) : undefined;

  return (
    <ClassNames>
      {({ css, cx, theme }) =>
        children(
          cx(
            className,
            css(cssStyles(theme, styling, marginSides, backgroundImageUrl))
          )
        )
      }
    </ClassNames>
  );
};
