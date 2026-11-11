import { GoogleAnalytics, GoogleTagManager } from '@next/third-parties/google';
import { WebsiteSettingsFragment } from '@wepublish/website/api';
import Script from 'next/script';

export type ThirdPartyScriptsProps = {
  settings?: WebsiteSettingsFragment;
};

export function ThirdPartyScripts({ settings }: ThirdPartyScriptsProps) {
  return (
    <>
      {settings?.analytics.googleAnalytics.enabled &&
        settings?.analytics.googleAnalytics.key && (
          <GoogleAnalytics gaId={settings.analytics.googleAnalytics.key} />
        )}

      {settings?.analytics.googleTagManager.enabled &&
        settings?.analytics.googleTagManager.key && (
          <GoogleTagManager gtmId={settings.analytics.googleTagManager.key} />
        )}

      {settings?.analytics.piwik.enabled && settings?.analytics.piwik.key && (
        <Script id="piwik-pro">
          {`(function(window, document, dataLayerName, id) { window[dataLayerName]=window[dataLayerName]||[],window[dataLayerName].push({start:(new Date).getTime(),event:"stg.start"});var scripts=document.getElementsByTagName('script')[0],tags=document.createElement('script'); var qP=[];dataLayerName!=="dataLayer"&&qP.push("data_layer_name="+dataLayerName);var qPString=qP.length>0?("?"+qP.join("&")):""; tags.async=!0,tags.src="https://flimmer.containers.piwik.pro/"+id+".js"+qPString,scripts.parentNode.insertBefore(tags,scripts); !function(a,n,i){a[n]=a[n]||{};for(var c=0;c<i.length;c++)!function(i){a[n][i]=a[n][i]||{},a[n][i].api=a[n][i].api||function(){var a=[].slice.call(arguments,0);"string"==typeof a[0]&&window[dataLayerName].push({event:n+"."+i+":"+a[0],parameters:[].slice.call(arguments,1)})}}(i[c])}(window,"ppms",["tm","cm"]); })(window, document, 'dataLayer', '${settings.analytics.piwik.key}');`}
        </Script>
      )}

      {settings?.analytics.umami.enabled && settings?.analytics.umami.key && (
        <Script
          src="https://cloud.umami.is/script.js"
          data-website-id={settings.analytics.umami.key}
          strategy="afterInteractive"
        />
      )}

      {settings?.ads.sparkLoop.enabled && settings?.ads.sparkLoop.key && (
        <Script
          src={`https://script.sparkloop.app/embed.js?publication_id=${settings.ads.sparkLoop.key}.js`}
          strategy="lazyOnload"
          data-sparkloop
        />
      )}
    </>
  );
}
