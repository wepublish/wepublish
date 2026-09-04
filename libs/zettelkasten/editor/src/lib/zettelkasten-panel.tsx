import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  useZettelkastenArchiveLazyQuery,
  useZettelkastenPageLazyQuery,
  useZettelkastenSearchLazyQuery,
} from '@wepublish/editor/api';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdArrowBack, MdClose, MdSearch } from 'react-icons/md';

import { DossierFact, parseDossier } from './dossier';
import { DossierView } from './dossier-view';
import { EvidenceView } from './evidence-view';
import { pageIdFromEvidence } from './page-id';

/** One hit of wiki_suche, as the door delivers it. */
type Hit = {
  titel: string;
  quelle: string;
  datum: string;
  reihe: string;
  beleg: string;
  stelle: string;
};
type SearchPayload = { gesamt: number; treffer: Hit[] };
type PagePayload = { titel: string; beleg: string; inhalt: string };
/** One answer of archiv_suche: how much the medium has, and the first hits. */
type ArchivePayload = {
  gesamt: number;
  treffer_je_quelle: { archiv: number; newsletter: number };
  treffer: Hit[];
};

export type ZettelkastenPanelProps = {
  /** Capitalised word pairs from the open article; each one is a suggested search. */
  anchors: string[];
  /** Filled by the /fact slash command with the selected text. */
  initialQuery?: string;
  onClose: () => void;
};

/**
 * The knowledge base beside the article: search, hits with their evidence,
 * and a dossier page in full. Nothing here is written back into the article;
 * the writer reads and decides.
 */
export function ZettelkastenPanel({
  anchors,
  initialQuery,
  onClose,
}: ZettelkastenPanelProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState(initialQuery ?? '');
  const [openPage, setOpenPage] = useState<string | null>(null);
  const [openFact, setOpenFact] = useState<DossierFact | null>(null);
  const [search, { data, loading, error }] = useZettelkastenSearchLazyQuery();
  const [loadPage, { data: pageData, loading: pageLoading, error: pageError }] =
    useZettelkastenPageLazyQuery();
  const [searchArchive, { data: archiveData, loading: archiveLoading }] =
    useZettelkastenArchiveLazyQuery();

  const runSearch = (value: string) => {
    setQuery(value);
    setOpenPage(null);
    setOpenFact(null);

    if (value.trim()) {
      search({ variables: { query: value.trim(), limit: 20, offset: 0 } });
      searchArchive({
        variables: {
          query: value.trim(),
          source: 'beides',
          limit: 5,
          offset: 0,
        },
      });
    }
  };

  useEffect(() => {
    if (initialQuery) {
      runSearch(initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  const payload = data?.zettelkastenSearch as SearchPayload | undefined;
  const page = pageData?.zettelkastenPage as PagePayload | undefined;
  const archive = archiveData?.zettelkastenArchive as
    | ArchivePayload
    | undefined;

  return (
    <Stack
      spacing={2}
      sx={{ p: 2, height: '100%' }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
      >
        <Typography variant="h6">{t('zettelkasten.title')}</Typography>
        <IconButton
          aria-label={t('zettelkasten.close')}
          onClick={onClose}
        >
          <MdClose />
        </IconButton>
      </Stack>

      <form
        onSubmit={event => {
          event.preventDefault();
          runSearch(query);
        }}
      >
        <TextField
          fullWidth
          size="small"
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder={t('zettelkasten.searchPlaceholder')}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  type="submit"
                  aria-label={t('zettelkasten.search')}
                >
                  <MdSearch />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </form>

      {anchors.length > 0 && (
        <Box>
          <Typography variant="overline">
            {t('zettelkasten.anchors')}
          </Typography>
          <Stack
            direction="row"
            flexWrap="wrap"
            gap={1}
          >
            {anchors.map(anchor => (
              <Chip
                key={anchor}
                label={anchor}
                onClick={() => runSearch(anchor)}
                variant={anchor === query ? 'filled' : 'outlined'}
              />
            ))}
          </Stack>
        </Box>
      )}

      <Divider />

      {openPage && (
        <Stack
          spacing={1}
          sx={{ overflow: 'auto' }}
        >
          <Button
            startIcon={<MdArrowBack />}
            onClick={() => {
              setOpenPage(null);
              setOpenFact(null);
            }}
            sx={{ alignSelf: 'flex-start' }}
          >
            {t('zettelkasten.backToHits')}
          </Button>
          {pageLoading && <CircularProgress size={20} />}
          {pageError && (
            <Typography color="error">{pageError.message}</Typography>
          )}
          {page && openFact && (
            <EvidenceView
              fact={openFact}
              onBack={() => setOpenFact(null)}
            />
          )}
          {page && !openFact && (
            <DossierView
              dossier={parseDossier(page.inhalt)}
              beleg={page.beleg}
              onShowEvidence={setOpenFact}
            />
          )}
        </Stack>
      )}

      {!openPage && (
        <Box sx={{ overflow: 'auto' }}>
          {loading && <CircularProgress size={20} />}
          {error && <Typography color="error">{error.message}</Typography>}
          {payload && payload.treffer.length === 0 && (
            <Typography>{t('zettelkasten.noHits')}</Typography>
          )}
          {payload && (
            <List dense>
              {payload.treffer.map(hit => (
                <ListItemButton
                  key={`${hit.beleg}-${hit.stelle}`}
                  alignItems="flex-start"
                  onClick={() => {
                    setOpenPage(hit.beleg);
                    loadPage({
                      variables: { page: pageIdFromEvidence(hit.beleg) },
                    });
                  }}
                >
                  <ListItemText
                    primary={
                      hit.datum ? `${hit.titel} · ${hit.datum}` : hit.titel
                    }
                    secondary={
                      <>
                        <Typography
                          component="span"
                          variant="body2"
                          display="block"
                        >
                          {hit.stelle}
                        </Typography>
                        <Typography
                          component="span"
                          variant="caption"
                          color="text.secondary"
                          display="block"
                        >
                          {hit.quelle}
                        </Typography>
                        <Typography
                          component="span"
                          variant="caption"
                          color="text.secondary"
                          display="block"
                        >
                          {hit.beleg}
                        </Typography>
                      </>
                    }
                  />
                </ListItemButton>
              ))}
            </List>
          )}

          {payload && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="overline">
                {t('zettelkasten.archive.title')}
              </Typography>
              {archiveLoading && <CircularProgress size={16} />}
              {archive && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  {t('zettelkasten.archive.counts', {
                    articles: archive.treffer_je_quelle.archiv,
                    newsletters: archive.treffer_je_quelle.newsletter,
                  })}
                </Typography>
              )}
              {archive && archive.treffer.length === 0 && (
                <Typography>{t('zettelkasten.noHits')}</Typography>
              )}
              {archive && (
                <List dense>
                  {archive.treffer.map(hit => (
                    <ListItemText
                      key={`${hit.beleg}-${hit.stelle}`}
                      primary={
                        hit.datum ? `${hit.titel} · ${hit.datum}` : hit.titel
                      }
                      secondary={
                        <>
                          <Typography
                            component="span"
                            variant="body2"
                            display="block"
                          >
                            {hit.stelle}
                          </Typography>
                          <Typography
                            component="span"
                            variant="caption"
                            color="text.secondary"
                            display="block"
                          >
                            {t(`zettelkasten.archive.source.${hit.quelle}`)} ·{' '}
                            {hit.beleg}
                          </Typography>
                        </>
                      }
                    />
                  ))}
                </List>
              )}
            </Box>
          )}
        </Box>
      )}
    </Stack>
  );
}
