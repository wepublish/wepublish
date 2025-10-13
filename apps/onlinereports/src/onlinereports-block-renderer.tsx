import { BlockRenderer } from '@wepublish/block-content/website';
import { BuilderBlockRendererProps } from '@wepublish/website/builder';
import { cond } from 'ramda';
import { useMemo } from 'react';

import {
  AktuelleBild,
  IsAktuelleBildTeasers,
} from './block-styles/aktuelle-bild';
import {
  GelesenUndGedachtBlockStyle,
  isGelesenUndGedacthTeasers,
} from './block-styles/gelesen-und-gedacht';
import {
  HighlightBlockStyle,
  isHighlightTeasers,
} from './block-styles/highlight';
import { isNewsTeasers, NewsBlockStyle } from './block-styles/news';
import {
  isRuckSpiegelTeasers,
  RuckSpiegelBlockStyle,
} from './block-styles/ruck-spiegel';
import { Advertisement } from './components/advertisement';
import { useAdsContext } from './context/ads-context';

export const OnlineReportsBlockRenderer = (
  props: BuilderBlockRendererProps
) => {
  const { adsDisabled } = useAdsContext();
  const extraBlockMap = useMemo(
    () =>
      cond([
        [isHighlightTeasers, block => <HighlightBlockStyle {...block} />],
        [isNewsTeasers, block => <NewsBlockStyle {...block} />],
        [isRuckSpiegelTeasers, block => <RuckSpiegelBlockStyle {...block} />],
        [
          isGelesenUndGedacthTeasers,
          block => <GelesenUndGedachtBlockStyle {...block} />,
        ],
        [IsAktuelleBildTeasers, block => <AktuelleBild {...block} />],
      ]),
    []
  );
  const block = extraBlockMap(props.block) ?? <BlockRenderer {...props} />;

  if (props.type === 'Page') {
    return block;
  }
  const position = props.index + 1;

  return (
    <>
      {block}
      {!adsDisabled && (
        <>
          {position === 6 && <Advertisement type={'half-page'} />}
          {position !== 6 && position % 3 === 0 && (
            <Advertisement type={'small'} />
          )}
        </>
      )}
    </>
  );
};
