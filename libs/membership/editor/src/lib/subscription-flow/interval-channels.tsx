import {
  LetterAddressPosition,
  LetterDeliveryProduct,
  LetterPrintMode,
  LetterPrintSpectrum,
  LetterQrBill,
  MessageChannel,
  SubscriptionIntervalFragment,
} from '@wepublish/editor/api';
import { useAuthorisation } from '@wepublish/ui/editor';
import { useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdMail, MdMarkunreadMailbox, MdOutlineSettings } from 'react-icons/md';
import {
  Button,
  ButtonGroup,
  Form,
  IconButton,
  Modal,
  SelectPicker,
} from 'rsuite';
import { SubscriptionClientContext } from './graphql-client-context';

interface IntervalChannelsProps {
  interval: SubscriptionIntervalFragment;
}

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

/**
 * The channels one flow step goes out through, plus the print options that
 * apply when the letter channel is on. They sit on the step rather than on the
 * template, so the same words can go out as a cheap reminder and as an A-Post
 * final notice.
 */
export function IntervalChannels({ interval }: IntervalChannelsProps) {
  const { t } = useTranslation();
  const canUpdateSubscriptionFlow = useAuthorisation(
    'CAN_UPDATE_SUBSCRIPTION_FLOW'
  );

  const client = useContext(SubscriptionClientContext);
  const [printOpen, setPrintOpen] = useState(false);

  const channels = interval.channels?.length ? interval.channels : [];
  const sendsMail = channels.includes(MessageChannel.Mail);
  const sendsLetter = channels.includes(MessageChannel.Letter);

  const setChannels = (next: MessageChannel[]) =>
    client.updateSubscriptionInterval({
      variables: {
        id: interval.id,
        daysAwayFromEnding: interval.daysAwayFromEnding,
        channels: next,
      },
    });

  const toggle = (channel: MessageChannel) =>
    setChannels(
      channels.includes(channel) ?
        channels.filter(current => current !== channel)
      : [...channels, channel]
    );

  const updatePrint = (
    field:
      | 'addressPosition'
      | 'deliveryProduct'
      | 'printMode'
      | 'printSpectrum'
      | 'qrBill',
    value: string
  ) =>
    client.updateSubscriptionInterval({
      variables: {
        id: interval.id,
        daysAwayFromEnding: interval.daysAwayFromEnding,
        [field]: value,
      },
    });

  const pickerData = <T extends string>(values: T[], prefix: string) =>
    values.map(value => ({ label: t(`${prefix}.${value}`), value }));

  const printOption = (
    field:
      | 'addressPosition'
      | 'deliveryProduct'
      | 'printMode'
      | 'printSpectrum'
      | 'qrBill',
    values: string[],
    prefix: string
  ) => (
    <Form.Group>
      <Form.ControlLabel>{t(`letterPrint.${field}`)}</Form.ControlLabel>
      <SelectPicker
        block
        cleanable={false}
        searchable={false}
        data={pickerData(values, prefix)}
        value={interval[field]}
        disabled={!canUpdateSubscriptionFlow}
        onChange={value => value && updatePrint(field, value as string)}
      />
    </Form.Group>
  );

  return (
    <>
      <ButtonGroup
        size="xs"
        style={{ display: 'flex', marginTop: 3 }}
      >
        <Button
          appearance={sendsMail ? 'primary' : 'ghost'}
          disabled={!canUpdateSubscriptionFlow}
          title={t('letterPrint.sendAsMail')}
          onClick={() => toggle(MessageChannel.Mail)}
          style={{ flex: 1 }}
        >
          <MdMail />
        </Button>
        <Button
          appearance={sendsLetter ? 'primary' : 'ghost'}
          disabled={!canUpdateSubscriptionFlow}
          title={t('letterPrint.sendAsLetter')}
          onClick={() => toggle(MessageChannel.Letter)}
          style={{ flex: 1 }}
        >
          <MdMarkunreadMailbox />
        </Button>
        {sendsLetter && (
          <IconButton
            icon={<MdOutlineSettings />}
            size="xs"
            title={t('letterPrint.title')}
            onClick={() => setPrintOpen(true)}
          />
        )}
      </ButtonGroup>

      <Modal
        open={printOpen}
        onClose={() => setPrintOpen(false)}
      >
        <Modal.Header>
          <Modal.Title>{t('letterPrint.title')}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form fluid>
            {printOption(
              'addressPosition',
              ADDRESS_POSITIONS,
              'letterPrint.addressPositions'
            )}
            {printOption(
              'deliveryProduct',
              DELIVERY_PRODUCTS,
              'letterPrint.deliveryProducts'
            )}
            {printOption('printMode', PRINT_MODES, 'letterPrint.printModes')}
            {printOption(
              'printSpectrum',
              PRINT_SPECTRA,
              'letterPrint.printSpectra'
            )}
            {printOption('qrBill', QR_BILL_MODES, 'letterPrint.qrBills')}
          </Form>
        </Modal.Body>

        <Modal.Footer>
          <Button
            appearance="primary"
            onClick={() => setPrintOpen(false)}
          >
            {t('letterPrint.close')}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
