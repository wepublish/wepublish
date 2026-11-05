import styled from '@emotion/styled';
import {
  Footer,
  FooterCategoryLinks,
  FooterIconsWrapper,
  FooterMainLinks,
  FooterName,
  FooterPaperWrapper,
} from '@wepublish/navigation/website';

import { Tiempos } from '../theme';

export const HauptstadtFooter = styled(Footer)`
  display: grid;
  justify-content: center;
  grid-template-columns: minmax(0, 492px);
  gap: ${({ theme }) => theme.spacing(6)};
  padding-top: ${({ theme }) => theme.spacing(6)};
  padding-bottom: ${({ theme }) => theme.spacing(6)};
  margin-top: ${({ theme }) => theme.spacing(3)};

  ${({ theme }) => theme.breakpoints.up('sm')} {
    margin-top: 0;
    grid-template-columns: minmax(0, 760px);
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    grid-template-columns: minmax(0, 868px);
  }

  ${({ theme }) => theme.breakpoints.up('lg')} {
    grid-template-columns: minmax(0, 1080px);
  }

  ${({ theme }) => theme.breakpoints.up('xl')} {
    grid-template-columns: minmax(0, 1425px);
  }

  ${({ theme }) => theme.breakpoints.up('xxl')} {
    grid-template-columns: minmax(0, 2100px);
    padding-top: ${({ theme }) => theme.spacing(8)};
    padding-bottom: ${({ theme }) => theme.spacing(8)};
  }

  &,
  ${FooterPaperWrapper}, ${FooterIconsWrapper} {
    background-color: ${({ theme }) => theme.palette.secondary.main};
    color: ${({ theme }) => theme.palette.secondary.contrastText};
  }

  ${FooterName} {
    display: none;
  }

  ${FooterCategoryLinks} span {
    font-weight: 400;
  }

  ${FooterMainLinks} {
    gap: 0;
  }

  ${FooterMainLinks} span {
    font-family: ${Tiempos.style.fontFamily};
  }

  ${FooterIconsWrapper} {
    padding-top: ${({ theme }) => theme.spacing(2)};
    padding-bottom: ${({ theme }) => theme.spacing(2)};
  }

  ${FooterIconsWrapper},
  ${FooterPaperWrapper} {
    padding: 0;
    padding-left: ${({ theme }) => theme.spacing(2)};
    padding-right: ${({ theme }) => theme.spacing(2)};

    ${({ theme }) => theme.breakpoints.up('sm')} {
      padding-left: ${({ theme }) => theme.spacing(3)};
      padding-right: ${({ theme }) => theme.spacing(3)};
    }
  }
`;
