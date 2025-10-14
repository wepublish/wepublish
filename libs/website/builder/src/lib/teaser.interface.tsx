import { Teaser, FlexAlignment } from '@wepublish/website/api';

type TeaserTypeProps =
  | {
      blockStyle: string | null | undefined;
      teaser?: Teaser | null | undefined;
      alignment: FlexAlignment;
      numColumns?: never;
      index: number;
    }
  | {
      blockStyle: string | null | undefined;
      teaser: Teaser | null | undefined;
      alignment: FlexAlignment;
      numColumns: number;
      index: number;
    };

export type BuilderTeaserProps = TeaserTypeProps & { className?: string };
