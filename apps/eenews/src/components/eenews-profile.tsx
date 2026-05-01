import styled from '@emotion/styled';
import {
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material';
import { useUser } from '@wepublish/authentication/website';
import {
  InvoiceListContainer,
  SubscriptionListContainer,
  useHasUnpaidInvoices,
} from '@wepublish/membership/website';
import {
  PersonalDataFormContainer,
  TotpSetupContainer,
} from '@wepublish/user/website';
import {
  FullInvoiceFragment,
  useInvoicesQuery,
  useRequestEmailChangeMutation,
  useSubscriptionsQuery,
  useUpdatePasswordMutation,
} from '@wepublish/website/api';
import Link from 'next/link';
import { useState } from 'react';

import { eenewsColors } from '../theme';

const PageWrap = styled('div')`
  padding: 48px 0 96px;
`;

const Crumb = styled(Link)`
  display: inline-block;
  margin-bottom: 28px;
  color: ${eenewsColors.inkSoft};
  text-decoration: none;
  font-family: inherit;
  font-size: 13px;
  letter-spacing: 0.04em;

  &:hover {
    color: ${eenewsColors.ink};
  }
`;

const TitleRow = styled('div')`
  margin-bottom: 12px;
`;

const Lede = styled('p')`
  max-width: 64ch;
  margin: 0 0 48px;
  color: ${eenewsColors.inkSoft};
`;

const Card = styled('section')<{ alert?: boolean }>`
  margin-bottom: 32px;
  border: 1px solid
    ${({ alert }) => (alert ? eenewsColors.alert : eenewsColors.rule)};
  background: ${({ alert }) =>
    alert ? eenewsColors.alertSoft : eenewsColors.paper};
`;

const CardHead = styled('div')<{ alert?: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  padding: 22px 28px;
  border-bottom: 1px solid
    ${({ alert }) => (alert ? eenewsColors.alert : eenewsColors.rule)};
`;

const CardBody = styled('div')<{ tight?: boolean }>`
  padding: ${({ tight }) => (tight ? '0' : '24px 28px')};
`;

const SecondaryLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: ${eenewsColors.ink};
  text-decoration: none;
  font-family: inherit;
  font-size: 14px;

  &:hover {
    text-decoration: underline;
  }
`;

const SecondaryButton = styled('button')`
  appearance: none;
  background: none;
  border: 0;
  padding: 0;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: ${eenewsColors.ink};
  text-decoration: none;
  font-family: inherit;
  font-size: 14px;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const CancelledRow = styled('div')`
  margin: -8px 0 56px;
`;

const SecurityRow = styled('div')`
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr) auto;
  gap: 24px;
  align-items: center;
  padding: 18px 28px;
  border-bottom: 1px solid ${eenewsColors.rule};

  &:last-of-type {
    border-bottom: none;
  }

  @media (max-width: 700px) {
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas:
      'label  action'
      'value  value';
    row-gap: 6px;

    & > :nth-of-type(1) {
      grid-area: label;
    }
    & > :nth-of-type(2) {
      grid-area: value;
    }
    & > :nth-of-type(3) {
      grid-area: action;
      justify-self: end;
    }
  }
`;

const Label = styled('span')`
  display: block;
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${eenewsColors.inkSoft};
  margin-bottom: 4px;
`;

const Value = styled('span')<{ muted?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: inherit;
  font-weight: 500;
  font-size: 15px;
  color: ${({ muted }) => (muted ? eenewsColors.inkSoft : eenewsColors.ink)};
`;

const Dot = styled('span')<{ enabled?: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ enabled }) =>
    enabled ? eenewsColors.accentDeep : eenewsColors.ruleStrong};
`;

const FooterRow = styled('div')`
  display: flex;
  gap: 32px;
  flex-wrap: wrap;
  padding-top: 24px;
  border-top: 1px solid ${eenewsColors.rule};
`;

const DeleteLink = styled('a')`
  margin-left: auto;
  font-family: inherit;
  font-size: 14px;
  color: ${eenewsColors.alertDeep};
  text-decoration: none;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`;

const isUnpaid = (inv: FullInvoiceFragment) =>
  !!inv.subscription && !inv.canceledAt && !inv.paidAt;

export function EenewsProfile() {
  const { user } = useUser();
  const hasUnpaidInvoices = useHasUnpaidInvoices();

  // Email + password change dialogs.
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailDraft, setEmailDraft] = useState('');
  const [emailMessage, setEmailMessage] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [requestEmailChange, { loading: emailLoading }] =
    useRequestEmailChangeMutation();

  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [pwDraft, setPwDraft] = useState('');
  const [pwRepeatDraft, setPwRepeatDraft] = useState('');
  const [pwMessage, setPwMessage] = useState<string | null>(null);
  const [pwError, setPwError] = useState<string | null>(null);
  const [updatePassword, { loading: pwLoading }] = useUpdatePasswordMutation();

  const openEmailDialog = () => {
    setEmailDraft(user?.email ?? '');
    setEmailMessage(null);
    setEmailError(null);
    setEmailDialogOpen(true);
  };

  const handleEmailSubmit = async () => {
    setEmailError(null);
    setEmailMessage(null);
    try {
      await requestEmailChange({ variables: { newEmail: emailDraft } });
      setEmailMessage(
        `Bestätigungs-E-Mail wurde an ${emailDraft} versendet. Bitte über den Link in der Mail bestätigen.`
      );
    } catch (err) {
      setEmailError((err as Error).message);
    }
  };

  const openPasswordDialog = () => {
    setPwDraft('');
    setPwRepeatDraft('');
    setPwMessage(null);
    setPwError(null);
    setPasswordDialogOpen(true);
  };

  const handlePasswordSubmit = async () => {
    setPwError(null);
    setPwMessage(null);
    if (pwDraft.length < 8) {
      setPwError('Das Passwort muss mindestens 8 Zeichen lang sein.');
      return;
    }
    if (pwDraft !== pwRepeatDraft) {
      setPwError('Die beiden Passwörter stimmen nicht überein.');
      return;
    }
    try {
      await updatePassword({
        variables: { password: pwDraft, passwordRepeated: pwRepeatDraft },
      });
      setPwMessage('Passwort wurde aktualisiert.');
      setPwDraft('');
      setPwRepeatDraft('');
    } catch (err) {
      setPwError((err as Error).message);
    }
  };

  // Self-deletion isn't supported on the website API (`deleteUser` is admin-
  // gated via `@Permissions(CanDeleteUser)`), so route the request to support
  // via mailto. The user pastes/edits and sends from their mail client.
  const accountDeleteMailto = (() => {
    const subject = 'Konto-Löschung anfordern';
    const body = [
      'Hallo ee·news-Team,',
      '',
      'Bitte löscht mein Konto und alle damit verbundenen Daten gemäss DSGVO / DSG.',
      '',
      `E-Mail: ${user?.email ?? ''}`,
      `Name: ${user?.firstName ?? ''} ${user?.name ?? ''}`,
      '',
      'Vielen Dank.',
    ].join('\n');
    return `mailto:datenschutz@eenews.ch?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
  })();

  // Counts for the section badges + cancelled-link tail
  const { data: invoicesData } = useInvoicesQuery();
  const { data: subscriptionsData } = useSubscriptionsQuery();
  const unpaidCount = (invoicesData?.userInvoices ?? []).filter(
    isUnpaid
  ).length;
  const cancelledCount = (subscriptionsData?.userSubscriptions ?? []).filter(
    sub => !!sub.deactivation
  ).length;

  const memberSinceLabel = (() => {
    const subs = subscriptionsData?.userSubscriptions ?? [];
    if (subs.length === 0) {
      return null;
    }
    const earliest = subs.reduce<Date | null>((acc, s) => {
      const d = new Date(s.startsAt);
      if (!acc || d < acc) {
        return d;
      }
      return acc;
    }, null);
    if (!earliest) {
      return null;
    }
    return earliest.toLocaleDateString('de-CH', {
      month: 'long',
      year: 'numeric',
    });
  })();

  return (
    <Container>
      <PageWrap>
        <Crumb href="/">← Zurück zur Startseite</Crumb>

        <TitleRow>
          <Typography
            variant="displayMitmachenH1"
            component="h1"
            sx={{ margin: 0, color: eenewsColors.ink }}
          >
            Mein Konto
            <Typography
              component="em"
              sx={{
                fontStyle: 'italic',
                fontWeight: 300,
                color: eenewsColors.inkSoft,
              }}
            >
              .
            </Typography>
          </Typography>
        </TitleRow>
        <Lede>
          <Typography
            variant="bodyLeadXl"
            component="span"
            sx={{ fontWeight: 300 }}
          >
            Verwalte deine aktiven Mitgliedschaften und Spenden, deine
            Rechnungen und deine persönlichen Daten.
            {memberSinceLabel ?
              ` Du bist seit ${memberSinceLabel} Mitglied bei ee·news — danke.`
            : null}
          </Typography>
        </Lede>

        {hasUnpaidInvoices ?
          <Card
            alert
            id="offene-rechnungen"
          >
            <CardHead alert>
              <Typography
                variant="displayTeaserMd"
                component="h2"
                sx={{ margin: 0, color: eenewsColors.alertDeep }}
              >
                ⚠ Offene Rechnungen
                <Typography
                  component="span"
                  sx={{
                    marginLeft: 1,
                    fontFamily: 'inherit',
                    fontSize: 13,
                    letterSpacing: '0.06em',
                    fontWeight: 400,
                    color: eenewsColors.alertDeep,
                  }}
                >
                  {unpaidCount} ausstehend
                </Typography>
              </Typography>
              <Typography
                variant="metaInline"
                component="span"
                sx={{ color: eenewsColors.alertDeep }}
              >
                Bitte begleichen
              </Typography>
            </CardHead>
            <CardBody tight>
              <InvoiceListContainer
                filter={invoices => invoices.filter(isUnpaid)}
              />
            </CardBody>
          </Card>
        : null}

        <Card>
          <CardHead>
            <Typography
              variant="displayTeaserMd"
              component="h2"
              sx={{ margin: 0, color: eenewsColors.ink }}
            >
              Aktive Abos &amp; Spenden
            </Typography>
            <SecondaryLink href="/mitmachen">+ Andere Abos lösen</SecondaryLink>
          </CardHead>
          <CardBody tight>
            <SubscriptionListContainer
              filter={subscriptions =>
                subscriptions.filter(s => !s.deactivation)
              }
            />
          </CardBody>
        </Card>

        {cancelledCount > 0 ?
          <CancelledRow>
            <SecondaryLink href="/profile/subscription/deactivated">
              Gekündigte Abos &amp; Inaktive Spenden anzeigen
              <Typography
                component="span"
                sx={{
                  fontFamily: 'inherit',
                  fontSize: 11,
                  color: eenewsColors.inkSoft,
                }}
              >
                → {cancelledCount}
              </Typography>
            </SecondaryLink>
          </CancelledRow>
        : null}

        <Card>
          <CardHead>
            <Typography
              variant="displayTeaserMd"
              component="h2"
              sx={{ margin: 0, color: eenewsColors.ink }}
            >
              Persönliche Daten
            </Typography>
            <Typography
              variant="metaInline"
              component="span"
              sx={{ color: eenewsColors.inkSoft }}
            >
              Wird nur für Rechnungen verwendet
            </Typography>
          </CardHead>
          <CardBody>
            <PersonalDataFormContainer />
          </CardBody>
        </Card>

        <Card>
          <CardHead>
            <Typography
              variant="displayTeaserMd"
              component="h2"
              sx={{ margin: 0, color: eenewsColors.ink }}
            >
              Konto &amp; Sicherheit
            </Typography>
            <Typography
              variant="metaInline"
              component="span"
              sx={{ color: eenewsColors.inkSoft }}
            >
              E-Mail, Passwort, Zwei-Faktor-Auth.
            </Typography>
          </CardHead>
          <CardBody tight>
            <SecurityRow>
              <Label>E-Mail-Adresse</Label>
              <Value>{user?.email ?? '—'}</Value>
              <SecondaryButton
                type="button"
                onClick={openEmailDialog}
              >
                E-Mail ändern
              </SecondaryButton>
            </SecurityRow>
            <SecurityRow>
              <Label>Passwort</Label>
              <Value muted>•••••••••••</Value>
              <SecondaryButton
                type="button"
                onClick={openPasswordDialog}
              >
                Passwort ändern
              </SecondaryButton>
            </SecurityRow>
            <SecurityRow>
              <Label>Zwei-Faktor-Authentifizierung</Label>
              <Value>
                <Dot enabled={user?.totpEnabled ?? false} />
                {user?.totpEnabled ?
                  'Aktiviert · Authenticator-App'
                : 'Nicht aktiviert'}
              </Value>
              <TotpSetupContainer />
            </SecurityRow>
          </CardBody>
        </Card>

        <FooterRow>
          <DeleteLink
            href={accountDeleteMailto}
            title="Öffnet eine vorbereitete E-Mail an datenschutz@eenews.ch — wir bearbeiten die Löschung manuell."
          >
            Konto löschen anfordern →
          </DeleteLink>
        </FooterRow>
      </PageWrap>

      <Dialog
        open={emailDialogOpen}
        onClose={() => setEmailDialogOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>E-Mail-Adresse ändern</DialogTitle>
        <DialogContent>
          <Typography
            variant="bodyTeaserStandard"
            component="p"
            sx={{ marginBottom: 2, color: eenewsColors.inkSoft }}
          >
            Wir senden einen Bestätigungslink an deine neue Adresse. Erst nach
            dem Klick auf den Link wird die Adresse umgestellt.
          </Typography>
          <TextField
            type="email"
            label="Neue E-Mail-Adresse"
            value={emailDraft}
            onChange={e => setEmailDraft(e.target.value)}
            fullWidth
            autoFocus
            size="small"
          />
          {emailMessage ?
            <Typography
              variant="metaInline"
              component="p"
              sx={{
                marginTop: 2,
                color: eenewsColors.accentDeep,
              }}
            >
              {emailMessage}
            </Typography>
          : null}
          {emailError ?
            <Typography
              variant="metaInline"
              component="p"
              sx={{ marginTop: 2, color: eenewsColors.alertDeep }}
            >
              {emailError}
            </Typography>
          : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEmailDialogOpen(false)}>Schliessen</Button>
          <Button
            onClick={handleEmailSubmit}
            disabled={emailLoading || !emailDraft || emailDraft === user?.email}
            variant="contained"
          >
            Bestätigung senden
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={passwordDialogOpen}
        onClose={() => setPasswordDialogOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Passwort ändern</DialogTitle>
        <DialogContent
          sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
        >
          <TextField
            type="password"
            label="Neues Passwort"
            value={pwDraft}
            onChange={e => setPwDraft(e.target.value)}
            fullWidth
            autoFocus
            size="small"
            autoComplete="new-password"
          />
          <TextField
            type="password"
            label="Neues Passwort wiederholen"
            value={pwRepeatDraft}
            onChange={e => setPwRepeatDraft(e.target.value)}
            fullWidth
            size="small"
            autoComplete="new-password"
          />
          {pwMessage ?
            <Typography
              variant="metaInline"
              component="p"
              sx={{ color: eenewsColors.accentDeep }}
            >
              {pwMessage}
            </Typography>
          : null}
          {pwError ?
            <Typography
              variant="metaInline"
              component="p"
              sx={{ color: eenewsColors.alertDeep }}
            >
              {pwError}
            </Typography>
          : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialogOpen(false)}>
            Schliessen
          </Button>
          <Button
            onClick={handlePasswordSubmit}
            disabled={pwLoading || !pwDraft || !pwRepeatDraft}
            variant="contained"
          >
            Speichern
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
