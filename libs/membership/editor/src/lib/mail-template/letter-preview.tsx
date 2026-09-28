import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export interface LetterPreviewProps {
  /** The rendered letter, base64 encoded, exactly as it would be printed. */
  pdf: string;
  height?: number | string;
}

/**
 * Shows the pdf a letter send would hand to the print vendor. The bytes are
 * turned into an object url rather than a `data:` url: browsers refuse to
 * render a pdf from `data:` in a frame, and a long base64 string in an
 * attribute is slow to parse.
 */
export function LetterPreview({ pdf, height = '100%' }: LetterPreviewProps) {
  const { t } = useTranslation();
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const bytes = Uint8Array.from(atob(pdf), character =>
      character.charCodeAt(0)
    );
    const objectUrl = URL.createObjectURL(
      new Blob([bytes], { type: 'application/pdf' })
    );

    setUrl(objectUrl);

    // Revoked on the next preview, otherwise every re-render leaks a document.
    return () => URL.revokeObjectURL(objectUrl);
  }, [pdf]);

  return (
    <div
      style={{
        height,
        display: 'flex',
        justifyContent: 'center',
        background: '#f4f4f4',
      }}
    >
      {url && (
        <iframe
          title={t('mailSend.preview.letterTitle')}
          src={url}
          style={{
            width: '100%',
            height: '100%',
            border: '1px solid #e5e5ea',
            borderRadius: 6,
            background: '#fff',
          }}
        />
      )}
    </div>
  );
}
