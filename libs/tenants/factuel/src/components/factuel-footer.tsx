import styled from '@emotion/styled';
import { alpha } from '@mui/material';
import {
  Footer,
  FooterCategory,
  FooterCategoryLinks,
  FooterName,
  FooterPaperWrapper,
} from '@wepublish/navigation/website';
import {
  BuilderFooterProps,
  Link,
  useWebsiteBuilder,
} from '@wepublish/website/builder';

export const FactuelFooterContact = styled(FooterCategory)`
  order: -1;
  gap: ${({ theme }) => theme.spacing(2)};

  ${({ theme }) => theme.breakpoints.up('md')} {
    padding-right: ${({ theme }) => theme.spacing(6)};
    border-right: 1px solid
      ${({ theme }) => alpha(theme.palette.common.white, 0.2)};
  }
`;

export const FactuelFooterContactLinks = styled(FooterCategoryLinks)`
  gap: ${({ theme }) => theme.spacing(1)};
  font-weight: ${({ theme }) => theme.typography.fontWeightRegular};
  color: ${({ theme }) => alpha(theme.palette.common.white, 0.8)};

  a {
    transition: color 140ms;
  }

  a:hover {
    color: ${({ theme }) => theme.palette.common.white};
    text-decoration: underline;
  }
`;

export const FactuelFooterBrand = styled(FooterName)`
  font-size: ${({ theme }) => theme.typography.h5.fontSize};
  text-transform: none;
  color: ${({ theme }) => theme.palette.common.white};
`;

const StyledFooter = styled(Footer)`
  ${FooterPaperWrapper} {
    row-gap: ${({ theme }) => theme.spacing(6)};

    ${({ theme }) => theme.breakpoints.up('md')} {
      grid-auto-columns: minmax(max-content, 1fr);
      column-gap: ${({ theme }) => theme.spacing(8)};
      row-gap: ${({ theme }) => theme.spacing(8)};
    }
  }
`;

export const FactuelFooter = (props: BuilderFooterProps) => {
  const {
    elements: { H6 },
  } = useWebsiteBuilder();

  return (
    <StyledFooter {...props}>
      <FactuelFooterContact>
        <FactuelFooterBrand>courant.ch</FactuelFooterBrand>

        <FactuelFooterContactLinks>
          <H6 component="span">
            Association Pour un nouveau journalisme genevois
          </H6>

          <H6 component="span">
            <Link
              href="mailto:contact@courant.ch"
              color="inherit"
              underline="none"
            >
              contact@courant.ch
            </Link>
          </H6>
        </FactuelFooterContactLinks>
      </FactuelFooterContact>
    </StyledFooter>
  );
};
