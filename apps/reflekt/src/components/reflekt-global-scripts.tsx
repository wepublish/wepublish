import Script from 'next/script';

export const ReflektGlobalScripts = () => (
  <>
    <Script
      async
      src="https://plausible.io/js/pa-_BtFLOtU8U6XVPta25rUh.js"
      strategy="afterInteractive"
    />
    <Script
      id="plausible-init"
      strategy="afterInteractive"
    >
      {`window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};plausible.init()`}
    </Script>
  </>
);
