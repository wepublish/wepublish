import styled from '@emotion/styled';
import { useEffect } from 'react';

import { useScript } from '../../utility';

const Bildwurf = styled.div`
  pointer-events: none;
`;

declare global {
  interface Window {
    _ASO: {
      loadAd(param1: string, param2: string): void;
    };
  }
}

export interface BildwurfAdEmbedProps {
  zoneID: string | null | undefined;
}

export function BildwurfAdEmbed({ zoneID }: BildwurfAdEmbedProps) {
  const { load } = useScript(
    `https://media.online.bildwurf.ch/js/code.min.js`,
    () => !!window._ASO,
    false
  );

  useEffect(() => {
    load();
    try {
      window._ASO.loadAd('bildwurf-injection-wrapper', zoneID ?? '');
    } catch (error) {
      console.warn('could not call _ASO.loadAd()');
    }
  }, []);

  return (
    <Bildwurf id="bildwurf-injection-wrapper">
      <ins
        className="aso-zone"
        data-zone={zoneID}
      ></ins>
    </Bildwurf>
  );
}
