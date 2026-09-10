import {
  Box,
  Button,
  CircularProgress,
  Link,
  Stack,
  Typography,
} from '@mui/material';
import { useZettelkastenEvidenceQuery } from '@wepublish/editor/api';
import { useTranslation } from 'react-i18next';
import { MdArrowBack, MdOpenInNew } from 'react-icons/md';

import { DossierFact, evidenceOf, quotedPhrase } from './dossier';

/** What quelle_zeigen answers; shown as it is, nothing is computed here. */
type EvidencePayload = {
  beleg: string;
  abruf?: string;
  quelle?: string;
  abgerufen?: string;
  dateien?: { name: string; sha256: string; bytes: number }[];
  hinweise?: Record<string, string>;
  nutzlast_vorhanden?: boolean;
  zitat_geprueft?: {
    zitat: string;
    steht_im_beleg: boolean;
    datei?: string | null;
    hinweis?: string;
  };
};

export type EvidenceViewProps = {
  fact: DossierFact;
  onBack: () => void;
};

/**
 * The raw-store entry behind one fact: when it was fetched, from where, which
 * files with which hashes, and whether a quoted phrase really stands in it.
 * The original document is linked because only the original is authoritative.
 */
export function EvidenceView({ fact, onBack }: EvidenceViewProps) {
  const { t } = useTranslation();
  const evidence = fact.evidence ?? '';
  const quote = quotedPhrase(fact.statement);
  const { data, loading, error } = useZettelkastenEvidenceQuery({
    variables: { evidence: evidenceOf(evidence), quote },
    skip: !evidence,
  });
  const payload = data?.zettelkastenEvidence as EvidencePayload | undefined;

  return (
    <Stack spacing={1.5}>
      <Button
        startIcon={<MdArrowBack />}
        onClick={onBack}
        sx={{ alignSelf: 'flex-start' }}
      >
        {t('zettelkasten.backToDossier')}
      </Button>

      <Typography variant="body2">{fact.statement}</Typography>
      <Typography
        variant="caption"
        color="text.secondary"
      >
        {evidence}
      </Typography>

      {loading && <CircularProgress size={20} />}
      {error && <Typography color="error">{error.message}</Typography>}

      {payload && (
        <Box>
          <Row
            label={t('zettelkasten.evidence.source')}
            value={payload.quelle}
          />
          <Row
            label={t('zettelkasten.evidence.fetchedAt')}
            value={payload.abgerufen}
          />
          <Row
            label={t('zettelkasten.evidence.payload')}
            value={
              payload.nutzlast_vorhanden ?
                t('zettelkasten.evidence.payloadPresent')
              : t('zettelkasten.evidence.payloadGone')
            }
          />
          {payload.zitat_geprueft && (
            <Row
              label={t('zettelkasten.evidence.quote', {
                quote: payload.zitat_geprueft.zitat,
              })}
              value={
                payload.zitat_geprueft.steht_im_beleg ?
                  t('zettelkasten.evidence.quoteFound')
                : t('zettelkasten.evidence.quoteMissing')
              }
            />
          )}
          {payload.dateien && payload.dateien.length > 0 && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="subtitle2">
                {t('zettelkasten.evidence.files', {
                  count: payload.dateien.length,
                })}
              </Typography>
              {payload.dateien.slice(0, 5).map(file => (
                <Typography
                  key={file.sha256}
                  variant="caption"
                  display="block"
                  sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}
                >
                  {file.name} · {file.bytes} B · sha256 {file.sha256}
                </Typography>
              ))}
            </Box>
          )}
          {payload.hinweise && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="subtitle2">
                {t('zettelkasten.evidence.notes')}
              </Typography>
              {Object.entries(payload.hinweise).map(([key, note]) => (
                <Typography
                  key={key}
                  variant="caption"
                  color="text.secondary"
                  display="block"
                  gutterBottom
                >
                  {note}
                </Typography>
              ))}
            </Box>
          )}
        </Box>
      )}

      {fact.original && (
        <Button
          size="small"
          component={Link}
          href={fact.original}
          target="_blank"
          rel="noreferrer"
          endIcon={<MdOpenInNew />}
          sx={{ alignSelf: 'flex-start' }}
        >
          {t('zettelkasten.openOriginal')}
        </Button>
      )}
    </Stack>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) {
    return null;
  }

  return (
    <Typography
      variant="body2"
      display="block"
    >
      <Typography
        component="span"
        variant="body2"
        color="text.secondary"
      >
        {label}:{' '}
      </Typography>
      {value}
    </Typography>
  );
}
