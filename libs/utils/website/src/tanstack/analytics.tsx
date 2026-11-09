import { WebsiteSettingsFragment } from '@wepublish/website/api';

/**
 * Replacement for `@next/third-parties/google` and `next-plausible`.
 *
 * Both packages are Next-only (`next/script`). React 19 hoists `<script async>`
 * into `<head>` on its own, so plain tags are enough. The inline snippets are
 * byte-for-byte what the Next versions emitted.
 */

const GoogleAnalytics = ({ gaId }: { gaId: string }) => (
  <>
    <script
      async
      src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
    />
    <script
      id="google-analytics"
      dangerouslySetInnerHTML={{
        __html: `window.dataLayer = window.dataLayer || [];
function gtag(){window.dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${gaId}');`,
      }}
    />
  </>
);

const GoogleTagManager = ({ gtmId }: { gtmId: string }) => (
  <script
    id="google-tag-manager"
    dangerouslySetInnerHTML={{
      __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`,
    }}
  />
);

const Plausible = ({ src }: { src: string }) => (
  <>
    <script
      async
      id="plausible-script"
      src={src}
    />
    <script
      id="plausible-init"
      dangerouslySetInnerHTML={{
        __html:
          'window.plausible = window.plausible || function() { (window.plausible.q = window.plausible.q || []).push(arguments) }',
      }}
    />
  </>
);

export const Analytics = ({
  websiteSettings: settings,
}: {
  websiteSettings: WebsiteSettingsFragment | undefined;
}) => (
  <>
    {settings?.analytics.plausible.enabled &&
      !!settings.analytics.plausible.key && (
        <Plausible
          src={`https://plausible.io/js/${settings.analytics.plausible.key}.js`}
        />
      )}

    {settings?.analytics.googleAnalytics.enabled &&
      !!settings.analytics.googleAnalytics.key && (
        <GoogleAnalytics gaId={settings.analytics.googleAnalytics.key} />
      )}

    {settings?.analytics.googleTagManager.enabled &&
      !!settings.analytics.googleTagManager.key && (
        <GoogleTagManager gtmId={settings.analytics.googleTagManager.key} />
      )}

    {settings?.analytics.piwik.enabled && !!settings.analytics.piwik.key && (
      <script
        id="piwik-pro"
        dangerouslySetInnerHTML={{
          __html: `(function(window, document, dataLayerName, id) { window[dataLayerName]=window[dataLayerName]||[],window[dataLayerName].push({start:(new Date).getTime(),event:"stg.start"});var scripts=document.getElementsByTagName('script')[0],tags=document.createElement('script'); var qP=[];dataLayerName!=="dataLayer"&&qP.push("data_layer_name="+dataLayerName);var qPString=qP.length>0?("?"+qP.join("&")):""; tags.async=!0,tags.src="https://flimmer.containers.piwik.pro/"+id+".js"+qPString,scripts.parentNode.insertBefore(tags,scripts); !function(a,n,i){a[n]=a[n]||{};for(var c=0;c<i.length;c++)!function(i){a[n][i]=a[n][i]||{},a[n][i].api=a[n][i].api||function(){var a=[].slice.call(arguments,0);"string"==typeof a[0]&&window[dataLayerName].push({event:n+"."+i+":"+a[0],parameters:[].slice.call(arguments,1)})}}(i[c])}(window,"ppms",["tm","cm"]); })(window, document, 'dataLayer', '${settings.analytics.piwik.key}');`,
        }}
      />
    )}

    {settings?.ads.sparkLoop.enabled && !!settings.ads.sparkLoop.key && (
      <script
        async
        data-sparkloop=""
        src={`https://script.sparkloop.app/embed.js?publication_id=${settings.ads.sparkLoop.key}.js`}
      />
    )}
  </>
);
