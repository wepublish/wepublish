import { useLazyQuery, useMutation, useQuery } from '@apollo/client/react';
import {
  CreateLetterLayoutDocument,
  FullImageFragment,
  LetterLayoutByIdDocument,
  LetterLayoutInput,
  LetterLayoutPreviewDocument,
  UpdateLetterLayoutDocument,
} from '@wepublish/editor/api';
import {
  createCheckedPermissionComponent,
  DRAWER_WIDTHS,
  enqueueSnackbar,
  ImageSelectPanel,
  InfoTooltip,
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  PageTitle,
  useSeededState,
} from '@wepublish/ui/editor';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdArrowBack, MdImage } from 'react-icons/md';
import { useNavigate, useParams } from 'react-router-dom';
import { MUTATION_OPTIONS_WITH_SUCCESS_MESSAGE } from '../common';
import {
  HtmlSourceEditor,
  HtmlSourceEditorHandle,
} from '../mail-template/html-source-editor';
import { HtmlVisualEditor } from '../mail-template/html-visual-editor';
import { LetterPreview } from '../mail-template/letter-preview';
import { PreviewDialogTitle } from '../mail-template/preview-dialog-title';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Dialog,
  DialogContent,
  Drawer,
  FormControl,
  FormLabel,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';

/** The tallest band the API accepts; mirrors the renderer's cap. */
const BAND_MAX_MM = 40;

/** Height of the header and footer code editors, in px. */
const BAND_EDITOR_HEIGHT = 240;

type Band = 'header' | 'footer';

type BandMode = 'visual' | 'html';

/**
 * The visual editor loads its value into an iframe, so a new value would
 * reload it on every keystroke. It gets the band's html as it was when it
 * mounted; the page remounts it (by key) whenever it has to start over.
 */
function BandVisualEditor({
  value,
  heightMm,
  onChange,
}: {
  value: string;
  heightMm: number;
  onChange: (value: string) => void;
}) {
  const [initial] = useState(value);

  return (
    <HtmlVisualEditor
      value={initial}
      onChange={onChange}
      band={{ heightMm }}
    />
  );
}

function LetterLayoutEdit() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [name, setName] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [headerHtml, setHeaderHtml] = useState('');
  const [footerHtml, setFooterHtml] = useState('');
  const [headerHeightMm, setHeaderHeightMm] = useState(30);
  const [footerHeightMm, setFooterHeightMm] = useState(20);
  const [imageTarget, setImageTarget] = useState<Band | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [modes, setModes] = useState<Record<Band, BandMode>>({
    header: 'visual',
    footer: 'visual',
  });
  // Bumped when the stored stationery arrives, so the visual editors start
  // over with it.
  const [loaded, setLoaded] = useState(0);

  const headerRef = useRef<HtmlSourceEditorHandle>(null);
  const footerRef = useRef<HtmlSourceEditorHandle>(null);

  const { data } = useQuery(LetterLayoutByIdDocument, {
    variables: { id: id ?? '' },
    skip: !isEdit,
  });

  // Takes the loaded stationery over once; the fields are edited from then on.
  useSeededState(data?.letterLayout, layout => {
    setName(layout.name);
    setIsDefault(layout.isDefault);
    setHeaderHtml(layout.headerHtml);
    setFooterHtml(layout.footerHtml);
    setHeaderHeightMm(layout.headerHeightMm);
    setFooterHeightMm(layout.footerHeightMm);
    setLoaded(count => count + 1);
  });

  const [createLayout, { loading: creating }] = useMutation(
    CreateLetterLayoutDocument,
    MUTATION_OPTIONS_WITH_SUCCESS_MESSAGE(t('letterLayouts.saved'))
  );
  const [updateLayout, { loading: updating }] = useMutation(
    UpdateLetterLayoutDocument,
    MUTATION_OPTIONS_WITH_SUCCESS_MESSAGE(t('letterLayouts.saved'))
  );
  const [preview, { data: previewData, loading: previewLoading }] =
    useLazyQuery(LetterLayoutPreviewDocument, { fetchPolicy: 'no-cache' });

  const buildInput = (): LetterLayoutInput => ({
    name,
    isDefault,
    headerHtml,
    footerHtml,
    headerHeightMm,
    footerHeightMm,
  });

  const save = async (close: boolean) => {
    if (!name.trim()) {
      enqueueSnackbar(t('letterLayouts.nameRequired'), { variant: 'error' });
      return;
    }

    if (isEdit) {
      await updateLayout({ variables: { id: id!, input: buildInput() } });
    } else {
      const result = await createLayout({
        variables: { input: buildInput() },
      });
      const newId = result.data?.createLetterLayout.id;

      if (newId && !close) {
        navigate(`/letterlayouts/edit/${newId}`);
        return;
      }
    }

    if (close) {
      navigate('/letterlayouts');
    }
  };

  const showPreview = () => {
    setPreviewOpen(true);
    preview({
      variables: {
        input: { headerHtml, footerHtml, headerHeightMm, footerHeightMm },
      },
    });
  };

  const insertImage = (image: FullImageFragment) => {
    const ref = imageTarget === 'footer' ? footerRef : headerRef;
    const src = image.largeURL ?? image.url;
    // A fixed height keeps the logo inside its band whatever its pixel size.
    const tag = `<img src="${src}" alt="${image.title ?? ''}" style="height: 12mm; width: auto">`;

    if (ref.current) {
      ref.current.insertText(tag);
    } else if (imageTarget === 'footer') {
      setFooterHtml(html => html + tag);
    } else {
      setHeaderHtml(html => html + tag);
    }

    setImageTarget(null);
  };

  const saving = creating || updating;

  const heightField = (
    label: string,
    hint: string,
    value: number,
    onChange: (value: number) => void
  ) => (
    <FormControl
      style={{ marginBottom: 0 }}
      fullWidth
      sx={{ marginBottom: 3 }}
    >
      <FormLabel>
        {label} <InfoTooltip text={hint} />
      </FormLabel>
      <TextField
        type="number"
        value={value}
        onChange={event =>
          onChange(
            Math.min(BAND_MAX_MM, Math.max(0, Number(event.target.value) || 0))
          )
        }
        slotProps={{ htmlInput: { min: 0, max: BAND_MAX_MM } }}
        sx={{ width: 120 }}
      />
    </FormControl>
  );

  const bandPanel = (
    band: Band,
    html: string,
    onChange: (value: string) => void,
    ref: typeof headerRef,
    heightMm: number
  ) => (
    <Card
      variant="outlined"
      sx={{ bgcolor: 'background.paper' }}
    >
      <CardHeader
        title={
          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: 'center', flexWrap: 'wrap' }}
          >
            <span style={{ flex: 1 }}>
              {t(`letterLayouts.${band}`)}{' '}
              <InfoTooltip text={t('letterLayouts.htmlHint')} />
            </span>
            {modes[band] === 'html' && (
              <Button
                variant="text"
                size="small"
                startIcon={<MdImage />}
                onClick={() => setImageTarget(band)}
              >
                {t('letterLayouts.insertImage')}
              </Button>
            )}
            <ToggleButtonGroup
              size="small"
              exclusive
              value={modes[band]}
              onChange={(_event, mode: BandMode | null) =>
                mode && setModes(current => ({ ...current, [band]: mode }))
              }
            >
              <ToggleButton value="visual">
                {t('mailTemplates.wysiwyg')}
              </ToggleButton>
              <ToggleButton value="html">
                {t('mailTemplates.rawHtml')}
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        }
      />

      <CardContent>
        {modes[band] === 'visual' ?
          <BandVisualEditor
            // Starts over with the current html when the band height changes
            // or the stored stationery arrives.
            key={`${heightMm}-${loaded}`}
            value={html}
            heightMm={heightMm}
            onChange={onChange}
          />
        : <div style={{ height: BAND_EDITOR_HEIGHT }}>
            <HtmlSourceEditor
              ref={ref}
              value={html}
              onChange={onChange}
              minHeight={BAND_EDITOR_HEIGHT}
            />
          </div>
        }
      </CardContent>
    </Card>
  );

  return (
    <div>
      <ListViewContainer>
        <ListViewHeader>
          <PageTitle>
            {isEdit ?
              t('letterLayouts.editHeader')
            : t('letterLayouts.createHeader')}
          </PageTitle>
        </ListViewHeader>
        <ListViewActions>
          <Button
            variant="text"
            startIcon={<MdArrowBack />}
            onClick={() => navigate('/letterlayouts')}
          >
            {t('letterLayouts.back')}
          </Button>
          <Button
            variant="outlined"
            loading={previewLoading}
            onClick={showPreview}
          >
            {t('letterLayouts.preview')}
          </Button>
          <Button
            variant="contained"
            loading={saving}
            onClick={() => save(false)}
          >
            {t('save')}
          </Button>
          <Button
            variant="contained"
            loading={saving}
            onClick={() => save(true)}
          >
            {t('saveAndClose')}
          </Button>
        </ListViewActions>
      </ListViewContainer>

      <Card
        variant="outlined"
        sx={{ marginTop: 2.5, bgcolor: 'background.paper' }}
      >
        <CardContent>
          <Stack
            spacing={3}
            sx={{ width: '100%' }}
          >
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <FormControl
                style={{ flex: 2, minWidth: 240, marginBottom: 0 }}
                fullWidth
                sx={{ marginBottom: 3 }}
              >
                <FormLabel htmlFor="letter-layout-name">
                  {t('letterLayouts.name')} *
                </FormLabel>
                <TextField
                  id="letter-layout-name"
                  value={name}
                  onChange={event => setName(event.target.value)}
                  slotProps={{
                    htmlInput: { 'aria-label': t('letterLayouts.name') },
                  }}
                />
              </FormControl>
              {heightField(
                t('letterLayouts.headerHeight'),
                t('letterLayouts.headerHeightHint'),
                headerHeightMm,
                setHeaderHeightMm
              )}
              {heightField(
                t('letterLayouts.footerHeight'),
                t('letterLayouts.footerHeightHint'),
                footerHeightMm,
                setFooterHeightMm
              )}
              <FormControl
                style={{ marginBottom: 0 }}
                fullWidth
                sx={{ marginBottom: 3 }}
              >
                <FormLabel>
                  {t('letterLayouts.isDefault')}{' '}
                  <InfoTooltip text={t('letterLayouts.isDefaultHelp')} />
                </FormLabel>
                <Switch
                  checked={isDefault}
                  onChange={(_event, checked) => setIsDefault(checked)}
                />
              </FormControl>
            </div>
          </Stack>
        </CardContent>
      </Card>

      {/* One above the other: a band is drawn as wide as the A4 sheet. */}
      <Stack
        spacing={2}
        sx={{ marginTop: 2 }}
      >
        {bandPanel(
          'header',
          headerHtml,
          setHeaderHtml,
          headerRef,
          headerHeightMm
        )}
        {bandPanel(
          'footer',
          footerHtml,
          setFooterHtml,
          footerRef,
          footerHeightMm
        )}
      </Stack>

      <Drawer
        anchor="right"
        slotProps={{
          paper: {
            sx: {
              display: 'flex',
              flexDirection: 'column',
              width: DRAWER_WIDTHS.sm,
              maxWidth: '100vw',
            },
          },
        }}
        open={imageTarget !== null}
        onClose={() => setImageTarget(null)}
      >
        <ImageSelectPanel
          onClose={() => setImageTarget(null)}
          onSelect={insertImage}
        />
      </Drawer>

      <Dialog
        fullWidth
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="lg"
      >
        <PreviewDialogTitle onClose={() => setPreviewOpen(false)}>
          {t('letterLayouts.previewTitle')}
        </PreviewDialogTitle>
        <DialogContent style={{ height: '80vh' }}>
          {previewData?.letterLayoutPreview.pdf && (
            <LetterPreview pdf={previewData.letterLayoutPreview.pdf} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_MAIL-TEMPLATES',
  'CAN_UPDATE_MAIL-TEMPLATES',
])(LetterLayoutEdit);
export { CheckedPermissionComponent as LetterLayoutEdit };
