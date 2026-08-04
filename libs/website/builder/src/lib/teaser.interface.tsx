import {
  FullFlexAlignmentFragment,
  FullTeaserFragment,
} from '@wepublish/website/api';

type TeaserTypeProps =
  | {
      blockStyle: string | null | undefined;
      teaser?: FullTeaserFragment | null | undefined;
      alignment: FullFlexAlignmentFragment;
      numColumns?: never;
      index: number;
    }
  | {
      blockStyle: string | null | undefined;
      teaser: FullTeaserFragment | null | undefined;
      alignment: FullFlexAlignmentFragment;
      numColumns: number;
      index: number;
    };

export type BuilderTeaserProps = TeaserTypeProps & { className?: string };
