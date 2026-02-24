import styled from '@emotion/styled';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Typography,
} from '@mui/material';
import { SubscribePage } from '@wepublish/utils/website';
import { ComponentProps } from 'react';
import { MdExpandMore } from 'react-icons/md';

// ─── Hero ────────────────────────────────────────────────────────────────────

const HeroSection = styled('section')`
  background-color: #f5ff64;
  border-radius: 4px;
  padding: ${({ theme }) => theme.spacing(6, 3)};

  ${({ theme }) => theme.breakpoints.up('md')} {
    padding: ${({ theme }) => theme.spacing(8, 6)};
  }
`;

const HeroInner = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(4)};

  ${({ theme }) => theme.breakpoints.up('md')} {
    grid-template-columns: 1fr auto;
    align-items: center;
  }
`;

const HeroTitle = styled(Typography)`
  font-family: 'Euclid', sans-serif;
  font-weight: 700;
  font-size: 2rem;
  line-height: 1.1;
  text-transform: uppercase;

  ${({ theme }) => theme.breakpoints.up('md')} {
    font-size: 3rem;
  }
`;

const HeroBullets = styled('ul')`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: ${({ theme }) => theme.spacing(1.5)};
`;

const HeroBullet = styled('li')`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1.5)};
  font-size: 1.1rem;
  font-weight: 600;

  &::before {
    content: '→';
    font-weight: 700;
    color: #0800ff;
    flex-shrink: 0;
  }
`;

// ─── Form section ────────────────────────────────────────────────────────────

const FormSection = styled('section')`
  padding: ${({ theme }) => theme.spacing(6, 0)};
`;

const FormSectionTitle = styled(Typography)`
  font-family: 'Euclid', sans-serif;
  font-weight: 700;
  font-size: 1.75rem;
  text-transform: uppercase;
  margin-bottom: ${({ theme }) => theme.spacing(4)};
`;

// ─── FAQ ─────────────────────────────────────────────────────────────────────

const FaqSection = styled('section')`
  padding: ${({ theme }) => theme.spacing(6, 0)};
  border-top: 2px solid #0800ff;
`;

const FaqTitle = styled(Typography)`
  font-family: 'Euclid', sans-serif;
  font-weight: 700;
  font-size: 1.75rem;
  text-transform: uppercase;
  margin-bottom: ${({ theme }) => theme.spacing(4)};
`;

const ReflektAccordion = styled(Accordion)`
  box-shadow: none;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 0 !important;

  &::before {
    display: none;
  }

  &.Mui-expanded {
    margin: 0;
  }
`;

const ReflektAccordionSummary = styled(AccordionSummary)`
  padding: 0;
  font-family: 'Euclid', sans-serif;
  font-weight: 700;
  font-size: 1rem;
  text-transform: uppercase;

  & .MuiAccordionSummary-content {
    margin: ${({ theme }) => theme.spacing(2, 0)};
  }
`;

const ReflektAccordionDetails = styled(AccordionDetails)`
  padding: ${({ theme }) => theme.spacing(0, 0, 3)};
  color: #444444;
  line-height: 1.7;
`;

const faqItems = [
  {
    title: 'REFLEKT IST INVESTIGATIV',
    content:
      'Wir graben tief — und veröffentlichen, was andere weglassen. REFLEKT ist das einzige Medium in der Deutschschweiz, das sich ausschliesslich auf investigativen Datenjournalismus spezialisiert hat.',
  },
  {
    title: 'REFLEKT HAT IMPACT',
    content:
      'Unsere Recherchen verändern etwas. Regierungen reagieren, Unternehmen korrigieren Missstände, Menschen erhalten Gerechtigkeit. Impact-Journalismus, der wirkt.',
  },
  {
    title: 'REFLEKT FUNKTIONIERT — DANK DIR',
    content:
      'REFLEKT ist unabhängig, weil ihr uns unterstützt. Keine Verleger, keine Werbeabhängigkeit. Nur deine Mitgliedschaft zählt.',
  },
  {
    title: 'REFLEKT IST UNABHÄNGIG',
    content:
      'Keine Konzerninteressen, keine Rücksicht auf Anzeigenkunden. Wir berichten, was ist — ungeschönt, faktenbasiert, mutig.',
  },
  {
    title: 'REFLEKT HAT REICHWEITE',
    content:
      'Unsere Artikel werden von Entscheidungsträger:innen, Journalist:innen und einem breiten Publikum gelesen. Gemeinsam schaffen wir Öffentlichkeit.',
  },
];

// ─── Page ────────────────────────────────────────────────────────────────────

type MitmachenPageProps = ComponentProps<typeof SubscribePage>;

function MitmachenPage(props: MitmachenPageProps) {
  return (
    <>
      <HeroSection>
        <HeroInner maxWidth="lg">
          <Box>
            <HeroTitle>
              Unterstütze
              <br />
              Reflekt
            </HeroTitle>
            <Box sx={{ mt: 3 }}>
              <HeroBullets>
                <HeroBullet>Investigativ und unabhängig</HeroBullet>
                <HeroBullet>Finanziert durch Mitglieder wie dich</HeroBullet>
                <HeroBullet>Impact-Journalismus, der zählt</HeroBullet>
              </HeroBullets>
            </Box>
          </Box>
        </HeroInner>
      </HeroSection>

      <FormSection>
        <FormSectionTitle>Mitglied werden</FormSectionTitle>
        <SubscribePage {...props} />
      </FormSection>

      <FaqSection>
        <FaqTitle>Warum REFLEKT?</FaqTitle>
        {faqItems.map((item, index) => (
          <ReflektAccordion key={index}>
            <ReflektAccordionSummary expandIcon={<MdExpandMore />}>
              {item.title}
            </ReflektAccordionSummary>
            <ReflektAccordionDetails>{item.content}</ReflektAccordionDetails>
          </ReflektAccordion>
        ))}
      </FaqSection>
    </>
  );
}

MitmachenPage.getInitialProps = SubscribePage.getInitialProps;

export default MitmachenPage;
