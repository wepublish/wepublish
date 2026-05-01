import styled from '@emotion/styled';
import { Box, Container, Typography } from '@mui/material';

import { eenewsColors } from '../../theme';

const SectionFrame = styled('section')`
  padding: 32px 0 64px;
`;

const Card = styled('div')`
  background: ${eenewsColors.ink};
  color: ${eenewsColors.paper};
  padding: 56px 48px;
  border-radius: 4px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  align-items: center;
  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
    gap: 24px;
    padding: 36px 28px;
  }
`;

const Form = styled('form')`
  display: flex;
  gap: 0;
  border-bottom: 1px solid rgba(245, 240, 230, 0.4);
  padding-bottom: 12px;
`;

const EmailInput = styled('input')`
  flex: 1;
  background: transparent;
  border: 0;
  outline: none;
  color: ${eenewsColors.paper};
  font-family: inherit;
  font-size: 18px;
  padding: 8px 0;
  &::placeholder {
    color: rgba(245, 240, 230, 0.5);
  }
`;

const Submit = styled('button')`
  background: ${eenewsColors.accent};
  color: ${eenewsColors.ink};
  border: 0;
  padding: 10px 20px;
  border-radius: 999px;
  cursor: pointer;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  &:hover {
    background: ${eenewsColors.accentDeep};
  }
`;

/**
 * EE News inline newsletter card — v2 design.
 *
 * Ink bg, paper text, 4px radius, 2-col grid (heading / form).
 * Form action posts to `/newsletter` for now (Q23 — newsletter page is deferred).
 */
export const EenewsNewsletterInline = () => {
  return (
    <SectionFrame>
      <Container>
        <Card>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Typography
              variant="metaEyebrow"
              component="div"
              sx={{ color: eenewsColors.accent }}
            >
              ee·briefing — wöchentlich
            </Typography>
            <Typography
              variant="displayNewsletter"
              component="h3"
              sx={{ margin: 0, color: eenewsColors.paper }}
            >
              Die Energiewende, jeden Donnerstag um 7 Uhr im Postfach.
            </Typography>
          </Box>
          <Form
            action="/newsletter"
            method="get"
          >
            <EmailInput
              type="email"
              name="email"
              placeholder="ihre@email.ch"
              aria-label="E-Mail-Adresse"
            />
            <Submit type="submit">Abonnieren</Submit>
          </Form>
        </Card>
      </Container>
    </SectionFrame>
  );
};
