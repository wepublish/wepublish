import { useApolloClient } from '@apollo/client/react';
import { PuckBlockData } from '@wepublish/puck-content/website';
import {
  PuckBlocksPreviewDocument,
  PuckBlocksPreviewQuery,
  PuckBlocksPreviewQueryVariables,
} from '@wepublish/website/api';
import { useEffect, useRef, useState } from 'react';

import { PuckBlockDataMap } from './puck-block-data.context';

export const PUCK_BLOCK_DATA_PREVIEW_DELAY = 300;

const noData: PuckBlockDataMap = new Map();

export const toPuckBlockDataMap = ({
  puckBlocksPreview,
}: PuckBlocksPreviewQuery): PuckBlockDataMap =>
  new Map(
    puckBlocksPreview.puckBlocks.map(
      ({ id, data }): [string, PuckBlockData] => [id, data]
    )
  );

export const usePuckBlockDataPreview = (
  variables: PuckBlocksPreviewQueryVariables | null,
  delay = PUCK_BLOCK_DATA_PREVIEW_DELAY
): PuckBlockDataMap => {
  const client = useApolloClient();
  const key = variables ? JSON.stringify(variables) : null;
  const [data, setData] = useState(noData);
  const [focusCount, setFocusCount] = useState(0);
  const latestRequest = useRef(0);

  useEffect(() => {
    const onFocus = () => setFocusCount(count => count + 1);

    window.addEventListener('focus', onFocus);

    return () => window.removeEventListener('focus', onFocus);
  }, []);

  useEffect(() => {
    if (key === null) {
      latestRequest.current++;

      return;
    }

    const timeout = setTimeout(() => {
      const request = ++latestRequest.current;
      const requestVariables: PuckBlocksPreviewQueryVariables = JSON.parse(key);

      client
        .query({
          query: PuckBlocksPreviewDocument,
          variables: requestVariables,
          fetchPolicy: 'no-cache',
        })
        .then(result => {
          if (request === latestRequest.current && result.data) {
            setData(toPuckBlockDataMap(result.data));
          }
        })
        .catch(() => undefined);
    }, delay);

    return () => clearTimeout(timeout);
  }, [client, key, delay, focusCount]);

  useEffect(
    () => () => {
      latestRequest.current++;
    },
    []
  );

  return key === null ? noData : data;
};
