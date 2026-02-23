import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

const WIDGET_SUPPORTED_LANGS = ['de', 'en', 'fr', 'it'] as const;
type WidgetLang = (typeof WIDGET_SUPPORTED_LANGS)[number];

declare global {
  interface Window {
    WpSupportConfig?: {
      botUrl: string;
      lang: WidgetLang;
      primaryColor: string;
      position: string;
    };
  }
}

export function WpSupportWidget() {
  const { i18n } = useTranslation();
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  const lang: WidgetLang =
    (WIDGET_SUPPORTED_LANGS as readonly string[]).includes(i18n.language) ?
      (i18n.language as WidgetLang)
    : 'de';

  useEffect(() => {
    // Clean up any previous widget DOM elements and script
    document.getElementById('wp-support-btn')?.remove();
    document.getElementById('wp-support-panel')?.remove();
    scriptRef.current?.remove();
    scriptRef.current = null;

    // Set config before the script runs so it picks up the correct language
    window.WpSupportConfig = {
      botUrl: 'https://support-agent-api.wepublish.cloud/api/chat',
      lang,
      primaryColor: '#ea726e',
      position: 'right',
    };

    const script = document.createElement('script');
    script.src = '/assets/wp-support-widget.js';
    script.async = true;
    document.body.appendChild(script);
    scriptRef.current = script;

    return () => {
      document.getElementById('wp-support-btn')?.remove();
      document.getElementById('wp-support-panel')?.remove();
      scriptRef.current?.remove();
      scriptRef.current = null;
    };
  }, [lang]);

  return null;
}
