import Script from 'next/script';

import { FrontendTrackingProviderConfig } from '../types';

export interface PiwikProLoaderProps {
  config: FrontendTrackingProviderConfig;
}

export function PiwikProLoader({ config }: PiwikProLoaderProps) {
  const { piwik_containerId, piwik_subdomain } = config;

  if (!piwik_containerId || !piwik_subdomain) {
    return null;
  }

  const containerUrl = `https://${piwik_subdomain}.containers.piwik.pro/${piwik_containerId}.js`;

  return (
    <Script
      id="piwik-pro"
      strategy="afterInteractive"
    >
      {`(function(window, document, dataLayerName, id) { window[dataLayerName]=window[dataLayerName]||[],window[dataLayerName].push({start:(new Date).getTime(),event:"stg.start"});var scripts=document.getElementsByTagName('script')[0],tags=document.createElement('script'); var qP=[];dataLayerName!=="dataLayer"&&qP.push("data_layer_name="+dataLayerName);var qPString=qP.length>0?("?"+qP.join("&")):""; tags.async=!0,tags.src="${containerUrl}"+qPString,scripts.parentNode.insertBefore(tags,scripts); !function(a,n,i){a[n]=a[n]||{};for(var c=0;c<i.length;c++)!function(i){a[n][i]=a[n][i]||{},a[n][i].api=a[n][i].api||function(){var a=[].slice.call(arguments,0);"string"==typeof a[0]&&window[dataLayerName].push({event:n+"."+i+":"+a[0],parameters:[].slice.call(arguments,1)})}}(i[c])}(window,"ppms",["tm","cm"]); })(window, document, 'dataLayer', '${piwik_containerId}');`}
    </Script>
  );
}
