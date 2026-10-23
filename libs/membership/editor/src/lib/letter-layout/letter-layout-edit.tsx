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
  ListViewContainer,
  ListViewHeader,
  useSeededState,
} from '@wepublish/ui/editor';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdImage } from 'react-icons/md';
import { useNavigate, useParams } from 'react-router-dom';
import { MUTATION_OPTIONS_WITH_SUCCESS_MESSAGE } from '../common';
import {
  HtmlSourceEditor,
  HtmlSourceEditorHandle,
} from '../mail-template/html-source-editor';
import { LetterPreview } from '../mail-template/letter-preview';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Dialog,
  DialogContent,
  DialogTitle,
  Drawer,
  FormControl,
  FormLabel,
  Stack,
  Switch,
  TextField,
} from '@mui/material';

/** The tallest band the API accepts; mirrors the renderer's cap. */
const BAND_MAX_MM = 40;

/** Height of the header and footer code editors, in px. */
const BAND_EDITOR_HEIGHT = 240;

type Band = 'header' | 'footer';

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
    ref: typeof headerRef
  ) => (
    <Card
      variant="outlined"
      sx={{ flex: 1, minWidth: 360, bgcolor: 'background.paper' }}
    >
      <CardHeader
        title={
          <Stack
            direction="row"
            sx={{ alignItems: 'center', justifyContent: 'space-between' }}
          >
            <span>
              {t(`letterLayouts.${band}`)}{' '}
              <InfoTooltip text={t('letterLayouts.htmlHint')} />
            </span>
            <Button
              variant="text"
              size="small"
              startIcon={<MdImage />}
              onClick={() => setImageTarget(band)}
            >
              {t('letterLayouts.insertImage')}
            </Button>
          </Stack>
        }
      />

      <CardContent>
        <div style={{ height: BAND_EDITOR_HEIGHT }}>
          <HtmlSourceEditor
            ref={ref}
            value={html}
            onChange={onChange}
            minHeight={BAND_EDITOR_HEIGHT}
          />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div>
      <ListViewContainer>
        <ListViewHeader>
          <h2>
            {isEdit ?
              t('letterLayouts.editHeader')
            : t('letterLayouts.createHeader')}
          </h2>
        </ListViewHeader>
        <Stack
          direction="row"
          spacing={1}
        >
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
        </Stack>
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

      <div
        style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 16 }}
      >
        {bandPanel('header', headerHtml, setHeaderHtml, headerRef)}
        {bandPanel('footer', footerHtml, setFooterHtml, footerRef)}
      </div>

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
        <DialogTitle>{t('letterLayouts.previewTitle')}</DialogTitle>
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
