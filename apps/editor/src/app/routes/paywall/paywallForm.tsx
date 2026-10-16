import styled from '@emotion/styled';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  IconButton,
  Stack,
  TextField,
} from '@mui/material';
import { FullMemberPlanFragment } from '@wepublish/editor/api';
import {
  IconButtonTooltip,
  InfoTooltip,
  RichTextBlock,
  RichTextBlockValue,
  SelectMemberPlans,
} from '@wepublish/ui/editor';
import QRCodeStyling from 'qr-code-styling';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Controller,
  useFieldArray,
  useFormContext,
  useWatch,
} from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdDelete, MdExpandMore, MdQrCode } from 'react-icons/md';
import { z } from 'zod';

import markUrl from '../../ui/wepublish-mark.png';

export const paywallSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).nullable(),
  description: z.custom<RichTextBlockValue['richText']>().nullish(),
  circumventDescription: z.custom<RichTextBlockValue['richText']>().nullish(),
  upgradeDescription: z.custom<RichTextBlockValue['richText']>().nullish(),
  upgradeCircumventDescription: z
    .custom<RichTextBlockValue['richText']>()
    .nullish(),
  active: z.boolean(),
  anyMemberPlan: z.boolean(),
  memberPlanIds: z.array(z.string()),
  memberPlans: z
    .array(z.custom<Pick<FullMemberPlanFragment, 'id' | 'name'>>())
    .optional(),
  alternativeSubscribeUrl: z.union([z.literal(''), z.string().url()]).nullish(),
  hideContentAfter: z.coerce.number(),
  fadeout: z.boolean(),
  bypasses: z.array(z.object({ id: z.string().optional(), token: z.string() })),
});

export type PaywallFormValues = z.infer<typeof paywallSchema>;

type PaywallFormProps = {
  create?: boolean;
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
  border: 1px solid ${({ theme }) => theme.vars.palette.divider};
  border-radius: ${({ theme }) => `calc(${theme.shape.borderRadius}px * 0.75)`};
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

const BaseUrlGroup = styled(Box)`
  margin-bottom: ${({ theme }) => theme.spacing(2)};
  text-align: left;
`;

export const PaywallForm = ({ create }: PaywallFormProps) => {
  const { t } = useTranslation();
  const { control } = useFormContext<PaywallFormValues>();
  const anyMemberPlan = useWatch({ control, name: 'anyMemberPlan' });
  const memberPlans = useWatch({ control, name: 'memberPlans' });
  const bypassValues = useWatch({ control, name: 'bypasses' });
  const hideContentAfter = useWatch({ control, name: 'hideContentAfter' });
  const {
    fields: bypasses,
    append,
    remove,
  } = useFieldArray({ control, name: 'bypasses' });
  const [newBypassToken, setNewBypassToken] = useState<string>();
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrBaseUrl, setQrBaseUrl] = useState<string>('https://example.com');
  const [selectedToken, setSelectedToken] = useState('');
  const qrContainerRef = useRef<HTMLDivElement>(null);
  const qrCodeRef = useRef<QRCodeStyling | null>(null);

  const addBypass = () => {
    if (newBypassToken?.trim()) {
      append({ token: newBypassToken.trim() });
      setNewBypassToken('');
    }
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
        <Card>
          <CardContent>
            <Stack
              spacing={3}
              sx={{ width: '100%' }}
            >
              <Controller
                control={control}
                name="name"
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    {...field}
                    value={field.value ?? ''}
                    label={t('paywall.form.name')}
                    error={Boolean(error)}
                    helperText={error?.message}
                    fullWidth
                  />
                )}
              />

              <FormControl fullWidth>
                <FormLabel>{t('paywall.form.description')}</FormLabel>

                <Controller
                  control={control}
                  name="description"
                  render={({ field }) => (
                    <RichTextBlock
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </FormControl>

              <FormControl fullWidth>
                <FormLabel>{t('paywall.form.circumventDescription')}</FormLabel>

                <Controller
                  control={control}
                  name="circumventDescription"
                  render={({ field }) => (
                    <RichTextBlock
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </FormControl>
            </Stack>
          </CardContent>
        </Card>

        <Accordion>
          <AccordionSummary expandIcon={<MdExpandMore />}>
            {t('paywall.form.upgrade')}
          </AccordionSummary>

          <AccordionDetails>
            <Stack
              spacing={3}
              sx={{ width: '100%' }}
            >
              <FormControl fullWidth>
                <FormLabel>{t('paywall.form.description')}</FormLabel>

                <Controller
                  control={control}
                  name="upgradeDescription"
                  render={({ field }) => (
                    <RichTextBlock
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </FormControl>

              <FormControl fullWidth>
                <FormLabel>{t('paywall.form.circumventDescription')}</FormLabel>

                <Controller
                  control={control}
                  name="upgradeCircumventDescription"
                  render={({ field }) => (
                    <RichTextBlock
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </FormControl>
            </Stack>
          </AccordionDetails>
        </Accordion>
      </PaywallFormSection>

      <PaywallFormSection>
        <Card
          variant="outlined"
          style={{ overflow: 'initial' }}
        >
          <CardContent>
            <Stack
              spacing={3}
              sx={{ width: '100%' }}
            >
              <Box>
                <Controller
                  control={control}
                  name="active"
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={Boolean(field.value)}
                          onChange={(_event, checked) =>
                            field.onChange(checked)
                          }
                        />
                      }
                      label={t('paywall.form.active')}
                    />
                  )}
                />

                <FormHelperText>
                  {t('paywall.form.activeHelpText')}
                </FormHelperText>
              </Box>

              <Box>
                <Controller
                  control={control}
                  name="anyMemberPlan"
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={Boolean(field.value)}
                          onChange={(_event, checked) =>
                            field.onChange(checked)
                          }
                        />
                      }
                      label={t('paywall.form.anyMemberPlan')}
                    />
                  )}
                />
              </Box>

              <FormControl fullWidth>
                <FormLabel>{t('paywall.form.memberPlans')}</FormLabel>

                <Controller
                  control={control}
                  name="memberPlanIds"
                  render={({ field }) => (
                    <SelectMemberPlans
                      disabled={Boolean(anyMemberPlan)}
                      defaultMemberPlans={memberPlans ?? []}
                      selectedMemberPlans={field.value ?? []}
                      setSelectedMemberPlans={field.onChange}
                    />
                  )}
                />
              </FormControl>

              <Controller
                control={control}
                name="alternativeSubscribeUrl"
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    {...field}
                    value={field.value ?? ''}
                    label={t('paywall.form.alternativeSubscribeUrl')}
                    type="url"
                    error={Boolean(error)}
                    helperText={error?.message}
                    fullWidth
                  />
                )}
              />
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <FormControl
              fullWidth
              sx={{ marginBottom: 3 }}
            >
              <FormLabel>
                {t('paywall.form.bypasses')}{' '}
                <InfoTooltip text={t('paywall.form.bypassesInfo')} />
              </FormLabel>

              {bypasses.map((bypass, index) => (
                <Stack
                  direction="row"
                  sx={{ alignItems: 'center' }}
                  key={bypass.id}
                  style={{ gap: '8px', marginBottom: '8px' }}
                >
                  <Box style={{ flex: 1 }}>
                    <Controller
                      control={control}
                      name={`bypasses.${index}.token`}
                      render={({ field, fieldState: { error } }) => (
                        <TextField
                          {...field}
                          placeholder={t('paywall.form.bypassToken')}
                          error={Boolean(error)}
                          helperText={error?.message}
                        />
                      )}
                    />
                  </Box>
                  <Box>
                    <IconButtonTooltip caption={t('paywall.form.showQrCode')}>
                      <IconButton
                        size="small"
                        color="primary"
                        aria-label={t('paywall.form.showQrCode')}
                        onClick={() =>
                          showQRCode(bypassValues?.[index]?.token ?? '')
                        }
                        disabled={!bypassValues?.[index]?.token}
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
                        onClick={() => remove(index)}
                      >
                        <MdDelete />
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
                  <TextField
                    value={newBypassToken}
                    onChange={event => setNewBypassToken(event.target.value)}
                    placeholder={t('paywall.form.newBypassToken')}
                    onKeyDown={event => {
                      if (event.key === 'Enter') {
                        addBypass();
                      }
                    }}
                  />
                </Box>

                <Box>
                  <Button
                    variant="contained"
                    startIcon={<MdAdd />}
                    onClick={addBypass}
                    disabled={!newBypassToken?.trim()}
                  >
                    {t('paywall.form.addBypass')}
                  </Button>
                </Box>
              </Stack>
            </FormControl>
          </CardContent>
        </Card>

        <Accordion>
          <AccordionSummary expandIcon={<MdExpandMore />}>
            {t('paywall.form.display')}
          </AccordionSummary>

          <AccordionDetails>
            <Stack
              spacing={3}
              sx={{ width: '100%' }}
            >
              <TextField
                label={
                  <>
                    {t('paywall.form.hideContentAfter')}{' '}
                    <InfoTooltip
                      text={t('paywall.form.hideContentAfterInfo')}
                    />
                  </>
                }
                name="hideContentAfter"
                type="number"
                slotProps={{ htmlInput: { min: 0 } }}
                value={hideContentAfter ?? ''}
                fullWidth
              />

              <Box>
                <Controller
                  control={control}
                  name="fadeout"
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={Boolean(field.value)}
                          onChange={(_event, checked) =>
                            field.onChange(checked)
                          }
                        />
                      }
                      label={t('paywall.form.fadeout')}
                    />
                  )}
                />

                <FormHelperText>
                  {t('paywall.form.fadeoutHelpText')}
                </FormHelperText>
              </Box>
            </Stack>
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
          <BaseUrlGroup>
            <FormLabel>{t('paywall.form.baseUrl')}</FormLabel>
            <TextField
              id="qrBaseUrl"
              value={qrBaseUrl}
              onChange={event => setQrBaseUrl(event.target.value)}
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
          >
            {t('paywall.form.downloadSvg')}
          </Button>
        </DialogActions>
      </Dialog>
    </PaywallFormWrapper>
  );
};
