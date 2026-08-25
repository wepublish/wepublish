import { Typography } from '@mui/material';
import {
  LetterAddressPosition,
  LetterDeliveryProduct,
  LetterPrintMode,
  LetterPrintSpectrum,
  LetterQrBill,
  MailTemplateContext,
  useCreateLetterTemplateMutation,
  useLetterTemplateByIdLazyQuery,
  usePreviewLetterLazyQuery,
  useUpdateLetterTemplateMutation,
} from '@wepublish/editor/api';
import {
  createCheckedPermissionComponent,
  ListViewContainer,
  ListViewHeader,
} from '@wepublish/ui/editor';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdRefresh } from 'react-icons/md';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  ButtonGroup,
  Form,
  Input,
  Message,
  Panel,
  SelectPicker,
  Stack,
  toaster,
} from 'rsuite';
import { DEFAULT_MUTATION_OPTIONS } from '../common';
import { MAIL_PLACEHOLDER_CONTEXTS } from '../mail-template/mail-placeholders';
import {
  HtmlSourceEditor,
  HtmlSourceEditorHandle,
} from '../mail-template/html-source-editor';
import {
  HtmlVisualEditor,
  HtmlVisualEditorHandle,
} from '../mail-template/html-visual-editor';
import { PlaceholderPicker } from '../mail-template/placeholder-picker';
import { createEmptyLetterHtml } from './letter-html';

/** A letter has no clickable link, so the login token has no business on it. */
const HIDDEN_PLACEHOLDERS = ['jwt'];

const ADDRESS_POSITIONS = [
  LetterAddressPosition.Left,
  LetterAddressPosition.Right,
];

const DELIVERY_PRODUCTS = [
  LetterDeliveryProduct.Cheap,
  LetterDeliveryProduct.Fast,
  LetterDeliveryProduct.Premium,
  LetterDeliveryProduct.Registered,
  LetterDeliveryProduct.Bulk,
];

const PRINT_MODES = [LetterPrintMode.Simplex, LetterPrintMode.Duplex];

const PRINT_SPECTRA = [
  LetterPrintSpectrum.Grayscale,
  LetterPrintSpectrum.Color,
];

const QR_BILL_MODES = [LetterQrBill.None, LetterQrBill.LastPage];

function LetterTemplateEdit() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [context, setContext] = useState<MailTemplateContext | null>(null);
  const [addressPosition, setAddressPosition] = useState(
    LetterAddressPosition.Left
  );
  const [deliveryProduct, setDeliveryProduct] = useState(
    LetterDeliveryProduct.Cheap
  );
  const [printMode, setPrintMode] = useState(LetterPrintMode.Simplex);
  const [printSpectrum, setPrintSpectrum] = useState(
    LetterPrintSpectrum.Grayscale
  );
  const [qrBill, setQrBill] = useState(LetterQrBill.None);
  const [bodyMode, setBodyMode] = useState<'visual' | 'html'>('visual');
  const [editorKey, setEditorKey] = useState(0);

  const [previewPdf, setPreviewPdf] = useState<string | null>(null);
  const [missingPlaceholders, setMissingPlaceholders] = useState<string[]>([]);

  // The canonical html lives in a ref so typing never re-renders the page,
  // which would reset the iframe caret.
  const htmlRef = useRef<string>(createEmptyLetterHtml());
  const visualRef = useRef<HtmlVisualEditorHandle>(null);
  const sourceRef = useRef<HtmlSourceEditorHandle>(null);

  const [loadTemplate] = useLetterTemplateByIdLazyQuery({
    fetchPolicy: 'network-only',
  });
  const [loadPreview, { loading: previewLoading }] = usePreviewLetterLazyQuery({
    fetchPolicy: 'network-only',
  });
  const [createLetterTemplate] = useCreateLetterTemplateMutation(
    DEFAULT_MUTATION_OPTIONS(t)
  );
  const [updateLetterTemplate] = useUpdateLetterTemplateMutation(
    DEFAULT_MUTATION_OPTIONS(t)
  );

  useEffect(() => {
    if (!id) {
      return;
    }

    loadTemplate({ variables: { id } }).then(({ data }) => {
      const template = data?.letterTemplate;

      if (!template) {
        return;
      }

      setName(template.name);
      setDescription(template.description ?? '');
      setContext(template.context ?? null);
      setAddressPosition(template.addressPosition);
      setDeliveryProduct(template.deliveryProduct);
      setPrintMode(template.printMode);
      setPrintSpectrum(template.printSpectrum);
      setQrBill(template.qrBill);
      htmlRef.current = template.htmlContent || createEmptyLetterHtml();
      setEditorKey(key => key + 1);
    });
  }, [id, loadTemplate]);

  const insertToken = (token: string) => {
    if (bodyMode === 'visual') {
      visualRef.current?.insertToken(token);
    } else {
      sourceRef.current?.insertText(token);
    }
  };

  const refreshPreview = async () => {
    const { data } = await loadPreview({
      variables: {
        input: {
          letterTemplateId: id,
          htmlContent: htmlRef.current,
          context,
          addressPosition,
          qrBill,
        },
      },
    });

    if (!data?.previewLetter) {
      return;
    }

    setPreviewPdf(data.previewLetter.pdf);
    setMissingPlaceholders(data.previewLetter.missingPlaceholders);
  };

  const save = async () => {
    const input = {
      name,
      description,
      htmlContent: htmlRef.current,
      context,
      addressPosition,
      deliveryProduct,
      printMode,
      printSpectrum,
      qrBill,
    };

    if (isEdit) {
      await updateLetterTemplate({ variables: { id, input } });
    } else {
      await createLetterTemplate({ variables: { input } });
    }

    toaster.push(
      <Message
        type="success"
        showIcon
      >
        {t('letterTemplates.saved')}
      </Message>
    );

    navigate('/lettertemplates');
  };

  const pickerData = <T extends string>(values: T[], prefix: string) =>
    values.map(value => ({
      label: t(`${prefix}.${value}`),
      value,
    }));

  return (
    <>
      <Stack justifyContent="space-between">
        <ListViewContainer>
          <ListViewHeader>
            <h2>
              {isEdit ?
                t('letterTemplates.editTitle')
              : t('letterTemplates.createTitle')}
            </h2>
          </ListViewHeader>
        </ListViewContainer>

        <ButtonGroup>
          <Button
            appearance="subtle"
            onClick={() => navigate('/lettertemplates')}
          >
            {t('letterTemplates.cancel')}
          </Button>
          <Button
            appearance="primary"
            disabled={!name}
            onClick={save}
          >
            {t('letterTemplates.save')}
          </Button>
        </ButtonGroup>
      </Stack>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 2fr) minmax(260px, 1fr)',
          gap: 16,
          alignItems: 'start',
          marginTop: 16,
        }}
      >
        <div style={{ display: 'grid', gap: 16 }}>
          <Panel
            bordered
            header={t('letterTemplates.settings')}
          >
            <Form fluid>
              <Form.Group>
                <Form.ControlLabel>
                  {t('letterTemplates.name')}
                </Form.ControlLabel>
                <Input
                  value={name}
                  onChange={setName}
                />
              </Form.Group>

              <Form.Group>
                <Form.ControlLabel>
                  {t('letterTemplates.description')}
                </Form.ControlLabel>
                <Input
                  value={description}
                  onChange={setDescription}
                />
              </Form.Group>

              <Form.Group>
                <Form.ControlLabel>
                  {t('letterTemplates.purpose')}
                </Form.ControlLabel>
                <SelectPicker
                  block
                  cleanable
                  data={MAIL_PLACEHOLDER_CONTEXTS.map(mailContext => ({
                    label: t(mailContext.titleKey, mailContext.title),
                    value: mailContext.id,
                  }))}
                  value={context}
                  onChange={value =>
                    setContext((value as MailTemplateContext) ?? null)
                  }
                />
                <Form.HelpText>
                  {t('letterTemplates.purposeHint')}
                </Form.HelpText>
              </Form.Group>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                  gap: 12,
                }}
              >
                <Form.Group>
                  <Form.ControlLabel>
                    {t('letterTemplates.addressPosition')}
                  </Form.ControlLabel>
                  <SelectPicker
                    block
                    cleanable={false}
                    searchable={false}
                    data={pickerData(
                      ADDRESS_POSITIONS,
                      'letterTemplates.addressPositions'
                    )}
                    value={addressPosition}
                    onChange={value =>
                      value &&
                      setAddressPosition(value as LetterAddressPosition)
                    }
                  />
                </Form.Group>

                <Form.Group>
                  <Form.ControlLabel>
                    {t('letterTemplates.deliveryProduct')}
                  </Form.ControlLabel>
                  <SelectPicker
                    block
                    cleanable={false}
                    searchable={false}
                    data={pickerData(
                      DELIVERY_PRODUCTS,
                      'letterTemplates.deliveryProducts'
                    )}
                    value={deliveryProduct}
                    onChange={value =>
                      value &&
                      setDeliveryProduct(value as LetterDeliveryProduct)
                    }
                  />
                </Form.Group>

                <Form.Group>
                  <Form.ControlLabel>
                    {t('letterTemplates.printMode')}
                  </Form.ControlLabel>
                  <SelectPicker
                    block
                    cleanable={false}
                    searchable={false}
                    data={pickerData(PRINT_MODES, 'letterTemplates.printModes')}
                    value={printMode}
                    onChange={value =>
                      value && setPrintMode(value as LetterPrintMode)
                    }
                  />
                </Form.Group>

                <Form.Group>
                  <Form.ControlLabel>
                    {t('letterTemplates.printSpectrum')}
                  </Form.ControlLabel>
                  <SelectPicker
                    block
                    cleanable={false}
                    searchable={false}
                    data={pickerData(
                      PRINT_SPECTRA,
                      'letterTemplates.printSpectra'
                    )}
                    value={printSpectrum}
                    onChange={value =>
                      value && setPrintSpectrum(value as LetterPrintSpectrum)
                    }
                  />
                </Form.Group>
              </div>

              <Form.Group>
                <Form.ControlLabel>
                  {t('letterTemplates.qrBill')}
                </Form.ControlLabel>
                <SelectPicker
                  block
                  cleanable={false}
                  searchable={false}
                  data={pickerData(QR_BILL_MODES, 'letterTemplates.qrBills')}
                  value={qrBill}
                  onChange={value => value && setQrBill(value as LetterQrBill)}
                />
                <Form.HelpText>{t('letterTemplates.qrBillHint')}</Form.HelpText>
              </Form.Group>
            </Form>
          </Panel>

          <Panel
            bordered
            header={
              <Stack justifyContent="space-between">
                <span>{t('letterTemplates.content')}</span>
                <ButtonGroup size="xs">
                  <Button
                    appearance={bodyMode === 'visual' ? 'primary' : 'default'}
                    onClick={() => setBodyMode('visual')}
                  >
                    {t('letterTemplates.visual')}
                  </Button>
                  <Button
                    appearance={bodyMode === 'html' ? 'primary' : 'default'}
                    onClick={() => setBodyMode('html')}
                  >
                    {t('letterTemplates.html')}
                  </Button>
                </ButtonGroup>
              </Stack>
            }
          >
            {bodyMode === 'visual' ?
              <HtmlVisualEditor
                key={`visual-${editorKey}`}
                ref={visualRef}
                value={htmlRef.current}
                onChange={html => {
                  htmlRef.current = html;
                }}
              />
            : <HtmlSourceEditor
                key={`html-${editorKey}`}
                ref={sourceRef}
                value={htmlRef.current}
                onChange={html => {
                  htmlRef.current = html;
                }}
              />
            }
          </Panel>

          <Panel
            bordered
            header={
              <Stack justifyContent="space-between">
                <span>{t('letterTemplates.preview')}</span>
                <Button
                  size="xs"
                  appearance="primary"
                  loading={previewLoading}
                  startIcon={<MdRefresh />}
                  onClick={refreshPreview}
                >
                  {t('letterTemplates.refreshPreview')}
                </Button>
              </Stack>
            }
          >
            {missingPlaceholders.length > 0 && (
              <Message
                type="warning"
                showIcon
                style={{ marginBottom: 12 }}
              >
                {t('letterTemplates.missingPlaceholders', {
                  placeholders: missingPlaceholders.join(', '),
                })}
              </Message>
            )}

            {previewPdf ?
              <object
                data={`data:application/pdf;base64,${previewPdf}`}
                type="application/pdf"
                width="100%"
                height="700"
                aria-label={t('letterTemplates.preview')}
              />
            : <Typography variant="caption">
                {t('letterTemplates.previewHint')}
              </Typography>
            }
          </Panel>
        </div>

        <Panel bordered>
          <PlaceholderPicker
            context={context}
            hiddenKeys={HIDDEN_PLACEHOLDERS}
            onInsert={insertToken}
          />
        </Panel>
      </div>
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_MAIL_TEMPLATES',
  'CAN_CREATE_MAIL_TEMPLATES',
  'CAN_UPDATE_MAIL_TEMPLATES',
])(LetterTemplateEdit);

export { CheckedPermissionComponent as LetterTemplateEdit };
