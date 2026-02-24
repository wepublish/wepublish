import styled from '@emotion/styled';
import { Button, css, IconButton, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';

const SHOW_AFTER_MS = 15_000; // 15 seconds
const DISMISSED_KEY = 'reflekt_newsletter_dismissed';

const Overlay = styled('div')<{ visible: boolean }>`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1200;
  transform: translateY(${({ visible }) => (visible ? '0' : '100%')});
  transition: transform 400ms ease;

  ${({ theme }) => css`
    ${theme.breakpoints.up('md')} {
      bottom: ${theme.spacing(3)};
      left: auto;
      right: ${theme.spacing(3)};
      max-width: 420px;
    }
  `}
`;

const BannerCard = styled('div')`
  background-color: ${({ theme }) => theme.palette.primary.main};
  color: #fff;
  padding: ${({ theme }) => theme.spacing(3)};
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};
  position: relative;
`;

const CloseButton = styled(IconButton)`
  position: absolute;
  top: ${({ theme }) => theme.spacing(1)};
  right: ${({ theme }) => theme.spacing(1)};
  color: #fff;
  font-size: 1rem;
`;

const BannerTitle = styled(Typography)`
  font-family: 'Euclid', sans-serif;
  font-weight: 700;
  font-size: 1.1rem;
  line-height: 1.3;
  padding-right: ${({ theme }) => theme.spacing(4)};
`;

const BannerForm = styled('form')`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: ${({ theme }) => theme.spacing(1)};
  align-items: center;
`;

const BannerInput = styled(TextField)`
  & .MuiInputBase-root {
    background: #fff;
    border-radius: 0;
  }
  & .MuiOutlinedInput-notchedOutline {
    border: none;
  }
`;

export const ReflektNewsletterBanner = () => {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem(DISMISSED_KEY)) return;

    const timer = setTimeout(() => setVisible(true), SHOW_AFTER_MS);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    setVisible(false);
    sessionStorage.setItem(DISMISSED_KEY, '1');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    // TODO: wire to Mailchimp API endpoint
    setSubmitted(true);
    setTimeout(dismiss, 2000);
  };

  return (
    <Overlay visible={visible}>
      <BannerCard>
        <CloseButton
          onClick={dismiss}
          aria-label="Schliessen"
          size="small"
        >
          ✕
        </CloseButton>

        {submitted ?
          <Typography fontWeight={700}>
            Danke! Du wirst bald von uns hören.
          </Typography>
        : <>
            <BannerTitle>Bleib informiert — kostenlos.</BannerTitle>
            <Typography
              variant="body2"
              sx={{ opacity: 0.9 }}
            >
              Erhalte die wichtigsten REFLEKT-Recherchen direkt in dein
              Postfach.
            </Typography>

            <BannerForm onSubmit={handleSubmit}>
              <BannerInput
                size="small"
                type="email"
                placeholder="Deine E-Mail-Adresse"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              <Button
                type="submit"
                variant="cta-yellow"
                size="small"
                sx={{ whiteSpace: 'nowrap', padding: '8px 16px' }}
              >
                Anmelden
              </Button>
            </BannerForm>
          </>
        }
      </BannerCard>
    </Overlay>
  );
};
