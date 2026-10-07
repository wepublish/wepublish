import styled from '@emotion/styled';
import { Link } from '@wepublish/website/builder';
import { FaFileArrowDown, FaRegEnvelope, FaRegStar } from 'react-icons/fa6';
import { LuMailbox } from 'react-icons/lu';

import { BkaCollapsibleCard } from './bka-collapsible-card';
import { BkaCtaBox } from './bka-cta-box';

export const BkaSidebarWrapper = styled('section')`
  display: grid;
  align-content: start;
  gap: ${({ theme }) => theme.spacing(1.5)};

  ${({ theme }) => theme.breakpoints.up('lg')} {
    gap: ${({ theme }) => theme.spacing(3.5)};
  }
`;

export const BkaSidebarSection = styled(BkaCollapsibleCard)`
  ${({ theme }) => theme.breakpoints.up('lg')} {
    color: ${({ theme }) => theme.palette.grey[600]};

    button {
      color: #989898;
      font-size: ${({ theme }) => theme.typography.h6.fontSize};
      border-bottom: 0;
    }
  }
`;

export const BkaSidebarSectionBody = styled('div')`
  display: grid;
  align-content: start;
  gap: ${({ theme }) => theme.spacing(1)};
  color: ${({ theme }) => theme.palette.text.primary};
`;

export const BkaSidebarDocumentIcon = styled(FaFileArrowDown)`
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  margin-right: ${({ theme }) => theme.spacing(1)};
`;

export const BkaSidebarDocumentLabel = styled('span')`
  text-decoration: underline;
`;

export const BkaSidebarDocumentLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  width: fit-content;
  color: ${({ theme }) => theme.palette.text.primary};
  font-size: ${({ theme }) => theme.typography.body1.fontSize};
  font-weight: 700;
  line-height: ${({ theme }) => theme.typography.body1.lineHeight};
  text-decoration: none;

  &:hover,
  &:focus {
    text-decoration: none;

    ${BkaSidebarDocumentLabel} {
      text-decoration: none;
    }
  }
`;

export type BkaSidebarProps = {
  className?: string;
};

export const BkaSidebar = ({ className }: BkaSidebarProps) => (
  <BkaSidebarWrapper className={className}>
    <BkaCtaBox
      title="Werde Mitglied"
      icon={<FaRegStar size={24} />}
      secondaryLabel="Als Mitglied anmelden"
      secondaryHref="https://admin.bka.ch"
      actionLabel="Mitglied werden"
      actionHref="/join-us"
    >
      <p>
        Mitglieder profitieren von diversen Vorzügen und erscheinen mit ihren
        Events in der Printausgabe der Berner Kulturagenda. Sie erhalten bis zu
        60% Reduktion auf die Print- und 50% Reduktion auf die Online-Werbung.
      </p>
    </BkaCtaBox>

    <BkaCtaBox
      title="BKa Magazin abonnieren"
      icon={<LuMailbox size={22} />}
      actionLabel="Abonnieren"
      actionHref="/magazin-signup"
    >
      <p>
        Sie haben kein Bund oder BZ Abo und möchten trotzdem regelmässig über
        das Geschehen in der Berner Kulturszene informiert sein? Mit ihrem Abo
        erhalten Sie die News direkt in ihren Briefkasten und fördern damit
        zusätzlich das Berner Kulturschaffen.
      </p>
    </BkaCtaBox>

    <BkaCtaBox
      title="Newsletter abonnieren"
      icon={<FaRegEnvelope size={22} />}
      actionLabel="Abonnieren"
      actionHref="/newsletter-signup"
    >
      <p>
        Nie mehr etwas verpassen! Unser Newsletter versorgt Sie mit den
        kulturellen Highlights. Holen Sie sich die von unserer Redaktion
        ausgewählten Tipps in ihre Mailbox.
      </p>
    </BkaCtaBox>

    <BkaSidebarSection
      title="Dokumentationen"
      variant="light"
    >
      <BkaSidebarSectionBody>
        <BkaSidebarDocumentLink
          href="https://cms-bka.formatlabs.ch/files/documents/Statuten%20Verein%20Berner%20Kulturagenda.pdf"
          target="_blank"
          rel="noopener noreferrer"
        >
          <BkaSidebarDocumentIcon />
          <BkaSidebarDocumentLabel>
            Statuten Verein Berner Kulturagenda
          </BkaSidebarDocumentLabel>
        </BkaSidebarDocumentLink>

        <BkaSidebarDocumentLink href="/privacy-policy">
          <BkaSidebarDocumentIcon />
          <BkaSidebarDocumentLabel>
            Datenschutzerklärung
          </BkaSidebarDocumentLabel>
        </BkaSidebarDocumentLink>
      </BkaSidebarSectionBody>
    </BkaSidebarSection>
  </BkaSidebarWrapper>
);
