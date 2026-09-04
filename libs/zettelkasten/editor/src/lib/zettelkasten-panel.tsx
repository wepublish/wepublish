import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  useZettelkastenAnchorsQuery,
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
import { formatFactCitation } from './fact-citation';
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
/**
 * The payloads travel as JSON and are cast, not validated; the fields are
 * therefore all optional and every access is guarded. A door that renames a
 * field must not throw during rendering: the editor has no error boundary, so
 * an exception here would take the open, unsaved article with it.
 */
type SearchPayload = { gesamt?: number; treffer?: Hit[] };
type PagePayload = { titel: string; beleg: string; inhalt: string };
/** One answer of archiv_suche: how much the medium has, and the first hits. */
type ArchivePayload = {
  gesamt?: number;
  treffer_je_quelle?: { archiv?: number; newsletter?: number };
  treffer?: Hit[];
};
/**
 * One answer of zettelkastenAnchors: how many dossier hits each anchor has.
 * `hits` is null when the door did not answer for that anchor.
 */
type AnchorsPayload = {
  anchors?: { anchor: string; hits: number | null }[];
};

export type ZettelkastenPanelProps = {
  /** Capitalised word pairs from the open article; each one is a suggested search. */
  anchors: string[];
  /** Filled by the /fact slash command with the selected text. */
  initialQuery?: string;
  /** Set when an editor waits for the fact; without it nothing is written back. */
  onInsertFact?: (text: string) => void;
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
  onInsertFact,
  onClose,
}: ZettelkastenPanelProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState(initialQuery ?? '');
  const [openPage, setOpenPage] = useState<string | null>(null);
  const [openFact, setOpenFact] = useState<DossierFact | null>(null);
  const [search, { data, loading, error }] = useZettelkastenSearchLazyQuery();
  const [loadPage, { data: pageData, loading: pageLoading, error: pageError }] =
    useZettelkastenPageLazyQuery();
  const [
    searchArchive,
    { data: archiveData, loading: archiveLoading, error: archiveError },
  ] = useZettelkastenArchiveLazyQuery();
  const { data: anchorsData, error: anchorsError } =
    useZettelkastenAnchorsQuery({
      variables: { anchors: anchors.slice(0, 20) },
      skip: anchors.length === 0,
    });

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
  const wikiHits = Array.isArray(payload?.treffer) ? payload.treffer : [];
  const archiveHits = Array.isArray(archive?.treffer) ? archive.treffer : [];
  const anchorCounts = (
    anchorsData?.zettelkastenAnchors as AnchorsPayload | undefined
  )?.anchors;
  const hitsByAnchor = new Map(
    (Array.isArray(anchorCounts) ? anchorCounts : []).map(entry => [
      entry.anchor,
      entry.hits,
    ])
  );

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
            {anchors.map(anchor => {
              const hits = hitsByAnchor.get(anchor);
              const missing = hits === 0;
              // null: the door did not answer for this one. It is neither a
              // hit nor an absence, and the chip says so instead of looking
              // like an anchor without a dossier.
              const unchecked = hits === null;

              return (
                <Chip
                  key={anchor}
                  label={anchor}
                  onClick={() => runSearch(anchor)}
                  color={hits && hits > 0 ? 'primary' : 'default'}
                  variant={
                    anchor === query || (hits && hits > 0) ?
                      'filled'
                    : 'outlined'
                  }
                  title={
                    missing ? t('zettelkasten.anchorMissing')
                    : unchecked ?
                      t('zettelkasten.anchorUnchecked')
                    : undefined
                  }
                  sx={missing ? { opacity: 0.6 } : undefined}
                />
              );
            })}
          </Stack>
          {anchorsError && (
            <Typography color="error">{anchorsError.message}</Typography>
          )}
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
              onInsert={
                onInsertFact ?
                  fact =>
                    onInsertFact(
                      formatFactCitation(fact, {
                        source: t('zettelkasten.source'),
                        asOf: t('zettelkasten.citation.asOf'),
                      })
                    )
                : undefined
              }
            />
          )}
        </Stack>
      )}

      {!openPage && (
        <Box sx={{ overflow: 'auto' }}>
          {loading && <CircularProgress size={20} />}
          {error && <Typography color="error">{error.message}</Typography>}
          {payload && wikiHits.length === 0 && (
            <Typography>{t('zettelkasten.noHits')}</Typography>
          )}
          {payload && (
            <List dense>
              {wikiHits.map(hit => (
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

          {(payload || archive || archiveLoading || archiveError) && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="overline">
                {t('zettelkasten.archive.title')}
              </Typography>
              {archiveLoading && <CircularProgress size={16} />}
              {archiveError && (
                <Typography color="error">{archiveError.message}</Typography>
              )}
              {archive && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  {t('zettelkasten.archive.counts', {
                    articles: archive.treffer_je_quelle?.archiv ?? 0,
                    newsletters: archive.treffer_je_quelle?.newsletter ?? 0,
                  })}
                </Typography>
              )}
              {archive && archiveHits.length === 0 && (
                <Typography>{t('zettelkasten.noHits')}</Typography>
              )}
              {archive && (
                <List dense>
                  {archiveHits.map(hit => (
                    <ListItem
                      key={`${hit.beleg}-${hit.stelle}`}
                      alignItems="flex-start"
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
                              {t(`zettelkasten.archive.source.${hit.quelle}`)} ·{' '}
                              {hit.beleg}
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
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
