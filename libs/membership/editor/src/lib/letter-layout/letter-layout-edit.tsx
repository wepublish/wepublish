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
  ImageSelectPanel,
  InfoTooltip,
  ListViewContainer,
  ListViewHeader,
} from '@wepublish/ui/editor';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdImage } from 'react-icons/md';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Drawer,
  Form,
  Input,
  InputNumber,
  Message,
  Modal,
  Panel,
  Stack,
  toaster,
  Toggle,
} from 'rsuite';
import { MUTATION_OPTIONS_WITH_SUCCESS_MESSAGE, showErrors } from '../common';
import {
  HtmlSourceEditor,
  HtmlSourceEditorHandle,
} from '../mail-template/html-source-editor';
import { LetterPreview } from '../mail-template/letter-preview';

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

  const { data, error } = useQuery(LetterLayoutByIdDocument, {
    variables: { id: id ?? '' },
    skip: !isEdit,
  });

  useEffect(() => {
    if (error) {
      showErrors(error);
    }
  }, [error]);

  useEffect(() => {
    const layout = data?.letterLayout;

    if (!layout) {
      return;
    }

    setName(layout.name);
    setIsDefault(layout.isDefault);
    setHeaderHtml(layout.headerHtml);
    setFooterHtml(layout.footerHtml);
    setHeaderHeightMm(layout.headerHeightMm);
    setFooterHeightMm(layout.footerHeightMm);
  }, [data]);

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
      toaster.push(
        <Message type="error">{t('letterLayouts.nameRequired')}</Message>
      );
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
    <Form.Group style={{ marginBottom: 0 }}>
      <Form.ControlLabel>
        {label} <InfoTooltip text={hint} />
      </Form.ControlLabel>
      <InputNumber
        min={0}
        max={BAND_MAX_MM}
        value={value}
        onChange={next => onChange(Math.max(0, Number(next) || 0))}
        style={{ width: 120 }}
      />
    </Form.Group>
  );

  const bandPanel = (
    band: Band,
    html: string,
    onChange: (value: string) => void,
    ref: typeof headerRef
  ) => (
    <Panel
      bordered
      header={
        <Stack
          justifyContent="space-between"
          alignItems="center"
        >
          <span>
            {t(`letterLayouts.${band}`)}{' '}
            <InfoTooltip text={t('letterLayouts.htmlHint')} />
          </span>
          <Button
            size="sm"
            appearance="subtle"
            startIcon={<MdImage />}
            onClick={() => setImageTarget(band)}
          >
            {t('letterLayouts.insertImage')}
          </Button>
        </Stack>
      }
      style={{ flex: 1, minWidth: 360, background: 'var(--rs-bg-card)' }}
    >
      <div style={{ height: BAND_EDITOR_HEIGHT }}>
        <HtmlSourceEditor
          ref={ref}
          value={html}
          onChange={onChange}
          minHeight={BAND_EDITOR_HEIGHT}
        />
      </div>
    </Panel>
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
        <Stack spacing={8}>
          <Button
            appearance="ghost"
            loading={previewLoading}
            onClick={showPreview}
          >
            {t('letterLayouts.preview')}
          </Button>
          <Button
            appearance="primary"
            loading={saving}
            onClick={() => save(false)}
          >
            {t('save')}
          </Button>
          <Button
            appearance="primary"
            loading={saving}
            onClick={() => save(true)}
          >
            {t('saveAndClose')}
          </Button>
        </Stack>
      </ListViewContainer>

      <Panel
        bordered
        style={{ marginTop: 20, background: 'var(--rs-bg-card)' }}
      >
        <Form fluid>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <Form.Group style={{ flex: 2, minWidth: 240, marginBottom: 0 }}>
              <Form.ControlLabel htmlFor="letter-layout-name">
                {t('letterLayouts.name')} *
              </Form.ControlLabel>
              <Input
                id="letter-layout-name"
                aria-label={t('letterLayouts.name')}
                value={name}
                onChange={value => setName(value)}
              />
            </Form.Group>
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
            <Form.Group style={{ marginBottom: 0 }}>
              <Form.ControlLabel>
                {t('letterLayouts.isDefault')}{' '}
                <InfoTooltip text={t('letterLayouts.isDefaultHelp')} />
              </Form.ControlLabel>
              <Toggle
                checked={isDefault}
                onChange={setIsDefault}
              />
            </Form.Group>
          </div>
        </Form>
      </Panel>

      <div
        style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 16 }}
      >
        {bandPanel('header', headerHtml, setHeaderHtml, headerRef)}
        {bandPanel('footer', footerHtml, setFooterHtml, footerRef)}
      </div>

      <Drawer
        open={imageTarget !== null}
        size="sm"
        onClose={() => setImageTarget(null)}
      >
        <ImageSelectPanel
          onClose={() => setImageTarget(null)}
          onSelect={insertImage}
        />
      </Drawer>

      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        size="full"
      >
        <Modal.Header>
          <Modal.Title>{t('letterLayouts.previewTitle')}</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ height: '80vh' }}>
          {previewData?.letterLayoutPreview.pdf && (
            <LetterPreview pdf={previewData.letterLayoutPreview.pdf} />
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_MAIL-TEMPLATES',
  'CAN_UPDATE_MAIL-TEMPLATES',
])(LetterLayoutEdit);
export { CheckedPermissionComponent as LetterLayoutEdit };
