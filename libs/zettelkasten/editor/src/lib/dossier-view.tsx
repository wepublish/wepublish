import {
  Box,
  Button,
  Chip,
  Link,
  List,
  ListItem,
  Stack,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { MdOpenInNew, MdVerified } from 'react-icons/md';

import { Dossier, DossierFact } from './dossier';

export type DossierViewProps = {
  dossier: Dossier;
  /** The evidence path of the page itself, shown on top. */
  beleg: string;
  onShowEvidence: (fact: DossierFact) => void;
};

/**
 * A dossier page as facts, not as markdown: every statement with its two
 * times, its source and a way to the evidence. Invalidated facts stay
 * visible, greyed, because the history is the point of the format.
 */
export function DossierView({
  dossier,
  beleg,
  onShowEvidence,
}: DossierViewProps) {
  const { t } = useTranslation();
  const { meta, sections } = dossier;

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="h6">{meta.name ?? beleg}</Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          display="block"
        >
          {beleg}
        </Typography>
        {meta.zuletzt_geprueft && (
          <Typography
            variant="caption"
            color="text.secondary"
          >
            {t('zettelkasten.lastChecked', { date: meta.zuletzt_geprueft })}
          </Typography>
        )}
      </Box>

      {sections.map(section => (
        <Box key={section.title}>
          <Typography
            variant="subtitle2"
            gutterBottom
          >
            {section.title}
          </Typography>
          {section.notes.map(note => (
            <Typography
              key={note}
              variant="body2"
              color="text.secondary"
              gutterBottom
            >
              {note}
            </Typography>
          ))}
          {section.facts.length === 0 && (
            <Typography
              variant="body2"
              color="text.secondary"
            >
              {t('zettelkasten.noFacts')}
            </Typography>
          )}
          <List
            dense
            disablePadding
          >
            {section.facts.map((fact, index) => (
              <ListItem
                key={`${fact.statement}-${index}`}
                disableGutters
                sx={{ display: 'block', opacity: fact.valid ? 1 : 0.6 }}
              >
                <Typography
                  variant="body2"
                  sx={{ textDecoration: fact.valid ? 'none' : 'line-through' }}
                >
                  {fact.statement}
                </Typography>
                <Stack
                  direction="row"
                  flexWrap="wrap"
                  gap={0.5}
                  alignItems="center"
                  sx={{ my: 0.5 }}
                >
                  {fact.validFrom && (
                    <Chip
                      size="small"
                      variant="outlined"
                      label={t('zettelkasten.valid', {
                        from: fact.validFrom,
                        to: fact.validTo,
                      })}
                    />
                  )}
                  {fact.learnedAt && (
                    <Chip
                      size="small"
                      variant="outlined"
                      label={t('zettelkasten.learned', {
                        date: fact.learnedAt,
                      })}
                    />
                  )}
                  {fact.origin && (
                    <Chip
                      size="small"
                      color="warning"
                      variant="outlined"
                      label={t(
                        `zettelkasten.origin.${fact.origin}`,
                        fact.origin
                      )}
                    />
                  )}
                  {!fact.valid && fact.status && (
                    <Chip
                      size="small"
                      variant="outlined"
                      label={fact.status}
                    />
                  )}
                </Stack>
                {fact.source && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                  >
                    {t('zettelkasten.source')}: {fact.source}
                  </Typography>
                )}
                <Stack
                  direction="row"
                  gap={1}
                >
                  {fact.evidence && (
                    <Button
                      size="small"
                      startIcon={<MdVerified />}
                      onClick={() => onShowEvidence(fact)}
                    >
                      {t('zettelkasten.showEvidence')}
                    </Button>
                  )}
                  {fact.original && (
                    <Button
                      size="small"
                      component={Link}
                      href={fact.original}
                      target="_blank"
                      rel="noreferrer"
                      endIcon={<MdOpenInNew />}
                    >
                      {t('zettelkasten.openOriginal')}
                    </Button>
                  )}
                </Stack>
              </ListItem>
            ))}
          </List>
        </Box>
      ))}
    </Stack>
  );
}
