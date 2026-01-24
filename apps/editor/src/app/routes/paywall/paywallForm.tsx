import styled from '@emotion/styled';
import PlusIcon from '@rsuite/icons/Plus';
import TrashIcon from '@rsuite/icons/Trash';
import {
  MemberPlan,
  MutationCreatePaywallArgs,
  MutationUpdatePaywallArgs,
} from '@wepublish/editor/api-v2';
import {
  RichTextBlock,
  RichTextBlockValue,
  SelectMemberPlans,
} from '@wepublish/ui/editor';
import QRCode from 'qrcode';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdDownload, MdQrCode } from 'react-icons/md';
import {
  Button,
  Checkbox,
  FlexboxGrid,
  Form,
  IconButton,
  Input,
  Modal,
  Panel,
} from 'rsuite';

type PaywallBypass = {
  id?: string;
  token: string;
};

type PaywallFormData = (
  | MutationCreatePaywallArgs
  | MutationUpdatePaywallArgs
) & {
  memberPlans?: Pick<MemberPlan, 'id' | 'name'>[];
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
  gap: 12px;
`;

const PaywallFormSection = styled.div`
  display: grid;
  align-items: start;
  gap: 12px;
`;

const QRCodeContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  max-width: 100%;
  height: auto;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 16px;

  canvas {
    max-width: 100%;
    height: auto;
  }
`;

const TokenUrl = styled.p`
  font-family: monospace;
  word-break: break-all;
  padding-top: ${({ theme }) => theme.spacing(2)};
`;

const BaseUrlInput = styled(Input)`
  margin-bottom: ${({ theme }) => theme.spacing(2)};
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
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const [qrSvgString, setQrSvgString] = useState('');

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
    if (qrSvgString) {
      const blob = new Blob([qrSvgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `bypass-token-${selectedToken}.svg`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const fullBypassUrl = useMemo<string>(
    () => `${qrBaseUrl}/?key=${selectedToken}`,
    [qrBaseUrl, selectedToken]
  );

  useEffect(() => {
    if (showQRModal && fullBypassUrl && qrCanvasRef.current) {
      QRCode.toCanvas(qrCanvasRef.current, fullBypassUrl, {
        width: 300,
        margin: 2,
      });

      QRCode.toString(
        fullBypassUrl,
        { type: 'svg', margin: 2 },
        (error, svg) => {
          if (!error) {
            setQrSvgString(svg);
          }
        }
      );

      return () => setQrSvgString('');
    }
  }, [showQRModal, fullBypassUrl]);

  return (
    <PaywallFormWrapper>
      <PaywallFormSection>
        <Panel bordered>
          <Form.Group controlId="name">
            <Form.ControlLabel>{t('paywall.form.name')}</Form.ControlLabel>
            <Form.Control
              name="name"
              value={paywall.name ?? ''}
              onChange={(name: string) => onChange({ name })}
            />
          </Form.Group>

          <Form.Group controlId="description">
            <Form.ControlLabel>
              {t('paywall.form.description')}
            </Form.ControlLabel>
            <Panel bordered>
              <Form.Control
                name="description"
                value={paywall.description || []}
                onChange={(description: RichTextBlockValue['richText']) =>
                  onChange({ description })
                }
                accepter={RichTextBlock}
              />
            </Panel>
          </Form.Group>

          <Form.Group controlId="circumventDescription">
            <Form.ControlLabel>
              {t('paywall.form.circumventDescription')}
            </Form.ControlLabel>
            <Panel bordered>
              <Form.Control
                name="circumventDescription"
                value={paywall.circumventDescription || []}
                onChange={(
                  circumventDescription: RichTextBlockValue['richText']
                ) => onChange({ circumventDescription })}
                accepter={RichTextBlock}
              />
            </Panel>
          </Form.Group>
        </Panel>

        <Panel
          bordered
          collapsible
          header={t('paywall.form.upgrade')}
        >
          <Form.Group controlId="upgradeDescription">
            <Form.ControlLabel>
              {t('paywall.form.description')}
            </Form.ControlLabel>
            <Panel bordered>
              <Form.Control
                name="upgradeDescription"
                value={paywall.upgradeDescription || []}
                onChange={(
                  upgradeDescription: RichTextBlockValue['richText']
                ) => onChange({ upgradeDescription })}
                accepter={RichTextBlock}
              />
            </Panel>
          </Form.Group>

          <Form.Group controlId="upgradeCircumventDescription">
            <Form.ControlLabel>
              {t('paywall.form.circumventDescription')}
            </Form.ControlLabel>
            <Panel bordered>
              <Form.Control
                name="upgradeCircumventDescription"
                value={paywall.upgradeCircumventDescription || []}
                onChange={(
                  upgradeCircumventDescription: RichTextBlockValue['richText']
                ) => onChange({ upgradeCircumventDescription })}
                accepter={RichTextBlock}
              />
            </Panel>
          </Form.Group>
        </Panel>
      </PaywallFormSection>

      <PaywallFormSection>
        <Panel
          bordered
          style={{ overflow: 'initial' }}
        >
          <Form.Group controlId="active">
            <Form.Control
              name="active"
              checked={!!paywall.active}
              onChange={() => onChange({ active: !paywall.active })}
              accepter={Checkbox}
            >
              {t('paywall.form.active')}
            </Form.Control>

            <Form.HelpText>{t('paywall.form.activeHelpText')}</Form.HelpText>
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

            <Form.ControlLabel>
              {t('paywall.form.memberPlans')}
            </Form.ControlLabel>
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

            <Form.Group controlId="alternativeSubscribeUrl">
              <Form.ControlLabel>
                {t('paywall.form.alternativeSubscribeUrl')}
              </Form.ControlLabel>

              <Form.Control
                name="alternativeSubscribeUrl"
                value={paywall.alternativeSubscribeUrl ?? ''}
                onChange={(alternativeSubscribeUrl: string) =>
                  onChange({ alternativeSubscribeUrl })
                }
                type="url"
              />

              <Form.HelpText>
                {t('paywall.form.alternativeSubscribeUrlHelpText')}
              </Form.HelpText>
            </Form.Group>
          </Form.Group>
        </Panel>

        <Panel bordered>
          <Form.Group>
            <Form.ControlLabel>{t('paywall.form.bypasses')}</Form.ControlLabel>

            {(paywall.bypasses || []).map((bypass, index) => (
              <FlexboxGrid
                key={index}
                align="middle"
                style={{ gap: '8px', marginBottom: '8px' }}
              >
                <FlexboxGrid.Item style={{ flex: 1 }}>
                  <Input
                    value={bypass.token}
                    onChange={value => updateBypassToken(index, value)}
                    placeholder={t('paywall.form.bypassToken')}
                  />
                </FlexboxGrid.Item>
                <FlexboxGrid.Item>
                  <IconButton
                    icon={<MdQrCode />}
                    size="sm"
                    color="blue"
                    appearance="ghost"
                    onClick={() => showQRCode(bypass.token)}
                    disabled={!bypass.token}
                  />
                </FlexboxGrid.Item>
                <FlexboxGrid.Item>
                  <IconButton
                    icon={<TrashIcon />}
                    size="sm"
                    color="red"
                    appearance="ghost"
                    onClick={() => removeBypass(index)}
                  />
                </FlexboxGrid.Item>
              </FlexboxGrid>
            ))}

            <FlexboxGrid
              align="middle"
              style={{ gap: '8px', marginTop: '8px' }}
            >
              <FlexboxGrid.Item style={{ flex: 1 }}>
                <Input
                  value={newBypassToken}
                  onChange={setNewBypassToken}
                  placeholder={t('paywall.form.newBypassToken')}
                  onPressEnter={addBypass}
                />
              </FlexboxGrid.Item>
              <FlexboxGrid.Item>
                <Button
                  appearance="primary"
                  startIcon={<PlusIcon />}
                  onClick={addBypass}
                  disabled={!newBypassToken?.trim()}
                >
                  {t('paywall.form.addBypass')}
                </Button>
              </FlexboxGrid.Item>
            </FlexboxGrid>
          </Form.Group>
        </Panel>

        <Panel
          bordered
          collapsible
          header={t('paywall.form.display')}
        >
          <Form.Group controlId="hideContentAfter">
            <Form.ControlLabel>
              {t('paywall.form.hideContentAfter')}
            </Form.ControlLabel>

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

            <Form.HelpText>{t('paywall.form.fadeoutHelpText')}</Form.HelpText>
          </Form.Group>
        </Panel>
      </PaywallFormSection>

      <Modal
        open={showQRModal}
        onClose={() => setShowQRModal(false)}
        size="sm"
      >
        <Modal.Header>
          <Modal.Title>{t('paywall.form.qrCodeTitle')}</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ textAlign: 'center' }}>
          <BaseUrlInput
            value={qrBaseUrl}
            onChange={newUrl => setQrBaseUrl(newUrl)}
            placeholder={t('paywall.form.baseUrl')}
          />
          <QRCodeContainer>
            <canvas ref={qrCanvasRef} />
          </QRCodeContainer>
          <TokenUrl>{fullBypassUrl}</TokenUrl>
        </Modal.Body>
        <Modal.Footer>
          <Button
            onClick={downloadQRCode}
            appearance="primary"
            startIcon={<MdDownload />}
          >
            {t('paywall.form.downloadSvg')}
          </Button>
        </Modal.Footer>
      </Modal>
    </PaywallFormWrapper>
  );
};
