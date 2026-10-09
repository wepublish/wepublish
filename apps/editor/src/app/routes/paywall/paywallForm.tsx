import styled from '@emotion/styled';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
} from '@mui/material';
import PlusIcon from '@rsuite/icons/Plus';
import TrashIcon from '@rsuite/icons/Trash';
import {
  FullMemberPlanFragment,
  MutationCreatePaywallArgs,
  MutationUpdatePaywallArgs,
} from '@wepublish/editor/api';
import {
  IconButtonTooltip,
  InfoTooltip,
  RichTextBlock,
  RichTextBlockValue,
  SelectMemberPlans,
} from '@wepublish/ui/editor';
import QRCodeStyling from 'qr-code-styling';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdDownload, MdExpandMore, MdQrCode } from 'react-icons/md';
import { Checkbox, Form, Input } from 'rsuite';

import markUrl from '../../ui/wepublish-mark.png';

type PaywallBypass = {
  id?: string;
  token: string;
};

type PaywallFormData = (
  | MutationCreatePaywallArgs
  | MutationUpdatePaywallArgs
) & {
  memberPlans?: Pick<FullMemberPlanFragment, 'id' | 'name'>[];
  bypasses?: PaywallBypass[];
};

type PaywallFormProps = {
  create?: boolean;
  paywall: PaywallFormData;
  onChange: (changes: Partial<PaywallFormData>) => void;
};

const PaywallFormWrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: start;
  gap: 16px;
`;

const PaywallFormSection = styled.div`
  display: grid;
  align-items: start;
  gap: 16px;
`;

const QRCodeContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  max-width: 100%;
  height: auto;
  border: 1px solid var(--rs-border-primary);
  border-radius: var(--rs-radius-md);
  padding: 16px;
  background: #ffffff;

  & > div {
    max-width: 100%;
    height: auto;
  }
`;

const TokenUrl = styled.p`
  font-family: monospace;
  word-break: break-all;
  padding-top: ${({ theme }) => theme.spacing(2)};
`;

const BaseUrlGroup = styled(Form.Group)`
  margin-bottom: ${({ theme }) => theme.spacing(2)};
  text-align: left;
`;

export const PaywallForm = ({
  paywall,
  onChange,
  create,
}: PaywallFormProps) => {
  const { t } = useTranslation();
  const [newBypassToken, setNewBypassToken] = useState<string>();
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrBaseUrl, setQrBaseUrl] = useState<string>('https://example.com');
  const [selectedToken, setSelectedToken] = useState('');
  const qrContainerRef = useRef<HTMLDivElement>(null);
  const qrCodeRef = useRef<QRCodeStyling | null>(null);

  const addBypass = () => {
    if (newBypassToken?.trim()) {
      const newBypass: PaywallBypass = {
        token: newBypassToken.trim(),
      };
      const updatedBypasses = [...(paywall.bypasses || []), newBypass];

      onChange({
        bypasses: updatedBypasses,
        bypassTokens: updatedBypasses.map(b => b.token),
      } as Partial<PaywallFormData>);
      setNewBypassToken('');
    }
  };

  const removeBypass = (index: number) => {
    const updatedBypasses = [...(paywall.bypasses || [])];
    updatedBypasses.splice(index, 1);
    onChange({
      bypasses: updatedBypasses,
      bypassTokens: updatedBypasses.map(b => b.token),
    } as Partial<PaywallFormData>);
  };

  const updateBypassToken = (index: number, token: string) => {
    const updatedBypasses = [...(paywall.bypasses || [])];
    updatedBypasses[index] = { ...updatedBypasses[index], token };
    onChange({
      bypasses: updatedBypasses,
      bypassTokens: updatedBypasses.map(b => b.token),
    } as Partial<PaywallFormData>);
  };

  const showQRCode = (token: string) => {
    setSelectedToken(token);
    setShowQRModal(true);
  };

  const downloadQRCode = () => {
    qrCodeRef.current?.download({
      name: `bypass-token-${selectedToken}`,
      extension: 'svg',
    });
  };

  const fullBypassUrl = useMemo<string>(
    () => `${qrBaseUrl}/?key=${selectedToken}`,
    [qrBaseUrl, selectedToken]
  );

  useEffect(() => {
    if (!showQRModal || !fullBypassUrl || !qrContainerRef.current) {
      return;
    }

    const qr = new QRCodeStyling({
      width: 300,
      height: 300,
      type: 'svg',
      data: fullBypassUrl,
      margin: 10,
      image: markUrl,
      qrOptions: { errorCorrectionLevel: 'H' },
      dotsOptions: { type: 'extra-rounded', color: '#000000' },
      cornersSquareOptions: { type: 'extra-rounded', color: '#000000' },
      cornersDotOptions: { type: 'dot', color: '#000000' },
      backgroundOptions: { color: '#ffffff' },
      imageOptions: { margin: 0, imageSize: 0.4, hideBackgroundDots: true },
    });

    qrContainerRef.current.innerHTML = '';
    qr.append(qrContainerRef.current);
    qrCodeRef.current = qr;
  }, [showQRModal, fullBypassUrl]);

  return (
    <PaywallFormWrapper>
      <PaywallFormSection>
        <Card variant="outlined">
          <CardContent>
            <Form.Stack fluid>
              <Form.Group controlId="name">
                <Form.Label>{t('paywall.form.name')}</Form.Label>
                <Form.Control
                  name="name"
                  value={paywall.name ?? ''}
                  onChange={(name: string) => onChange({ name })}
                />
              </Form.Group>

              <Form.Group controlId="description">
                <Form.Label>{t('paywall.form.description')}</Form.Label>

                <Form.Control
                  name="description"
                  value={paywall.description || []}
                  onChange={(description: RichTextBlockValue['richText']) =>
                    onChange({ description })
                  }
                  accepter={RichTextBlock}
                />
              </Form.Group>

              <Form.Group controlId="circumventDescription">
                <Form.Label>
                  {t('paywall.form.circumventDescription')}
                </Form.Label>

                <Form.Control
                  name="circumventDescription"
                  value={paywall.circumventDescription || []}
                  onChange={(
                    circumventDescription: RichTextBlockValue['richText']
                  ) => onChange({ circumventDescription })}
                  accepter={RichTextBlock}
                />
              </Form.Group>
            </Form.Stack>
          </CardContent>
        </Card>

        <Accordion>
          <AccordionSummary expandIcon={<MdExpandMore />}>
            {t('paywall.form.upgrade')}
          </AccordionSummary>

          <AccordionDetails>
            <Form.Stack fluid>
              <Form.Group controlId="upgradeDescription">
                <Form.Label>{t('paywall.form.description')}</Form.Label>

                <Form.Control
                  name="upgradeDescription"
                  value={paywall.upgradeDescription || []}
                  onChange={(
                    upgradeDescription: RichTextBlockValue['richText']
                  ) => onChange({ upgradeDescription })}
                  accepter={RichTextBlock}
                />
              </Form.Group>

              <Form.Group controlId="upgradeCircumventDescription">
                <Form.Label>
                  {t('paywall.form.circumventDescription')}
                </Form.Label>

                <Form.Control
                  name="upgradeCircumventDescription"
                  value={paywall.upgradeCircumventDescription || []}
                  onChange={(
                    upgradeCircumventDescription: RichTextBlockValue['richText']
                  ) => onChange({ upgradeCircumventDescription })}
                  accepter={RichTextBlock}
                />
              </Form.Group>
            </Form.Stack>
          </AccordionDetails>
        </Accordion>
      </PaywallFormSection>

      <PaywallFormSection>
        <Card
          variant="outlined"
          style={{ overflow: 'initial' }}
        >
          <CardContent>
            <Form.Stack fluid>
              <Form.Group controlId="active">
                <Form.Control
                  name="active"
                  checked={!!paywall.active}
                  onChange={() => onChange({ active: !paywall.active })}
                  accepter={Checkbox}
                >
                  {t('paywall.form.active')}
                </Form.Control>

                <Form.Text>{t('paywall.form.activeHelpText')}</Form.Text>
              </Form.Group>

              <Form.Group>
                <Form.Control
                  name="anyMemberPlan"
                  checked={!!paywall.anyMemberPlan}
                  onChange={() =>
                    onChange({ anyMemberPlan: !paywall.anyMemberPlan })
                  }
                  accepter={Checkbox}
                >
                  {t('paywall.form.anyMemberPlan')}
                </Form.Control>
              </Form.Group>

              <Form.Group>
                <Form.Label>{t('paywall.form.memberPlans')}</Form.Label>

                <Form.Control
                  name="memberPlans"
                  disabled={!!paywall.anyMemberPlan}
                  defaultMemberPlans={paywall.memberPlans ?? []}
                  selectedMemberPlans={paywall.memberPlanIds ?? []}
                  setSelectedMemberPlans={(memberPlanIds: string[]) =>
                    onChange({ memberPlanIds })
                  }
                  accepter={SelectMemberPlans}
                />
              </Form.Group>

              <Form.Group controlId="alternativeSubscribeUrl">
                <Form.Label>
                  {t('paywall.form.alternativeSubscribeUrl')}
                </Form.Label>

                <Form.Control
                  name="alternativeSubscribeUrl"
                  value={paywall.alternativeSubscribeUrl ?? ''}
                  onChange={(alternativeSubscribeUrl: string) =>
                    onChange({ alternativeSubscribeUrl })
                  }
                  type="url"
                />

                <Form.Text>
                  {t('paywall.form.alternativeSubscribeUrlHelpText')}
                </Form.Text>
              </Form.Group>
            </Form.Stack>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Form.Group>
              <Form.Label>
                {t('paywall.form.bypasses')}{' '}
                <InfoTooltip text={t('paywall.form.bypassesInfo')} />
              </Form.Label>

              {(paywall.bypasses || []).map((bypass, index) => (
                <Stack
                  direction="row"
                  sx={{ alignItems: 'center' }}
                  key={index}
                  style={{ gap: '8px', marginBottom: '8px' }}
                >
                  <Box style={{ flex: 1 }}>
                    <Input
                      value={bypass.token}
                      onChange={value => updateBypassToken(index, value)}
                      placeholder={t('paywall.form.bypassToken')}
                    />
                  </Box>
                  <Box>
                    <IconButtonTooltip caption={t('paywall.form.showQrCode')}>
                      <IconButton
                        size="small"
                        color="primary"
                        aria-label={t('paywall.form.showQrCode')}
                        onClick={() => showQRCode(bypass.token)}
                        disabled={!bypass.token}
                      >
                        <MdQrCode />
                      </IconButton>
                    </IconButtonTooltip>
                  </Box>
                  <Box>
                    <IconButtonTooltip caption={t('delete')}>
                      <IconButton
                        size="small"
                        color="error"
                        aria-label={t('delete')}
                        onClick={() => removeBypass(index)}
                      >
                        <TrashIcon />
                      </IconButton>
                    </IconButtonTooltip>
                  </Box>
                </Stack>
              ))}

              <Stack
                direction="row"
                sx={{ alignItems: 'center' }}
                style={{ gap: '8px', marginTop: '8px' }}
              >
                <Box style={{ flex: 1 }}>
                  <Input
                    value={newBypassToken}
                    onChange={setNewBypassToken}
                    placeholder={t('paywall.form.newBypassToken')}
                    onPressEnter={addBypass}
                  />
                </Box>

                <Box>
                  <Button
                    variant="contained"
                    startIcon={<PlusIcon />}
                    onClick={addBypass}
                    disabled={!newBypassToken?.trim()}
                  >
                    {t('paywall.form.addBypass')}
                  </Button>
                </Box>
              </Stack>
            </Form.Group>
          </CardContent>
        </Card>

        <Accordion>
          <AccordionSummary expandIcon={<MdExpandMore />}>
            {t('paywall.form.display')}
          </AccordionSummary>

          <AccordionDetails>
            <Form.Stack fluid>
              <Form.Group controlId="hideContentAfter">
                <Form.Label>
                  {t('paywall.form.hideContentAfter')}{' '}
                  <InfoTooltip text={t('paywall.form.hideContentAfterInfo')} />
                </Form.Label>

                <Form.Control
                  name="hideContentAfter"
                  type="number"
                  min={0}
                  value={paywall.hideContentAfter ?? ''}
                  onChange={(hideContentAfter: string) =>
                    onChange({ hideContentAfter: +hideContentAfter })
                  }
                />
              </Form.Group>

              <Form.Group controlId="fadeout">
                <Form.Control
                  name="fadeout"
                  checked={!!paywall.fadeout}
                  onChange={() => onChange({ fadeout: !paywall.fadeout })}
                  accepter={Checkbox}
                >
                  {t('paywall.form.fadeout')}
                </Form.Control>

                <Form.Text>{t('paywall.form.fadeoutHelpText')}</Form.Text>
              </Form.Group>
            </Form.Stack>
          </AccordionDetails>
        </Accordion>
      </PaywallFormSection>

      <Dialog
        fullWidth
        open={showQRModal}
        onClose={() => setShowQRModal(false)}
        maxWidth="sm"
      >
        <DialogTitle>{t('paywall.form.qrCodeTitle')}</DialogTitle>

        <DialogContent style={{ textAlign: 'center' }}>
          <BaseUrlGroup controlId="qrBaseUrl">
            <Form.Label>{t('paywall.form.baseUrl')}</Form.Label>
            <Input
              id="qrBaseUrl"
              value={qrBaseUrl}
              onChange={newUrl => setQrBaseUrl(newUrl)}
              placeholder={t('paywall.form.baseUrl')}
            />
          </BaseUrlGroup>
          <QRCodeContainer>
            <div ref={qrContainerRef} />
          </QRCodeContainer>
          <TokenUrl>{fullBypassUrl}</TokenUrl>
        </DialogContent>

        <DialogActions>
          <Button
            variant="contained"
            onClick={downloadQRCode}
            startIcon={<MdDownload />}
          >
            {t('paywall.form.downloadSvg')}
          </Button>
        </DialogActions>
      </Dialog>
    </PaywallFormWrapper>
  );
};
