import { FlexAlignment, FullTeaserFragment } from '@wepublish/website/api';
import { CSSProperties } from 'react';

type TeaserTypeProps =
  | {
      blockStyle: string | null | undefined;
      teaser?: FullTeaserFragment | null | undefined;
      alignment: FlexAlignment;
      numColumns?: never;
      index: number;
    }
  | {
      blockStyle: string | null | undefined;
      teaser: FullTeaserFragment | null | undefined;
      alignment: FlexAlignment;
      numColumns: number;
      index: number;
    };

export type BuilderTeaserProps = TeaserTypeProps & {
  className?: string;
  style?: CSSProperties;
};
