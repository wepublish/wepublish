import styled from '@emotion/styled';
import { ImageContext } from '@wepublish/image/website';
import { BuilderTeaserProps } from '@wepublish/website/builder';

import { TeaserOverwrite } from './teaser-overwrite';
import {
  AuthorsAndDate,
  fluidTypography,
  SingleLine,
  TeaserContentStyled,
  TeaserImgStyled,
  TeaserLeadStyled,
  TeaserPreTitleStyled,
  TeaserTitlesStyled,
} from './teaser-overwrite.style';

const SingleTeaserStyled = styled(TeaserOverwrite)`
  ${TeaserContentStyled} {
    margin-top: calc(-20px - (2 * 2 * 4px));
    padding: ${({ theme }) => theme.spacing(1)};
    background: white;
    grid-column: 2/23;
  }

  ${TeaserPreTitleStyled} {
    font-size: ${fluidTypography(17, 30)};
    font-style: italic;
  }

  ${TeaserTitlesStyled} {
    font-size: ${fluidTypography(23, 44)};
    font-weight: bold;
  }

  ${AuthorsAndDate} {
    font-size: ${fluidTypography(14, 22)};
  }

  ${TeaserLeadStyled} {
    margin-top: ${({ theme }) => theme.spacing(1)};
    margin-bottom: ${({ theme }) => theme.spacing(1)};
    font-style: italic;
    font-weight: 300;
    font-size: ${fluidTypography(15, 32)};
  }

  ${SingleLine} {
    height: ${({ theme }) => theme.spacing(1.5)};
    border-bottom-left-radius: 8px;
    border-bottom-right-radius: 8px;
    margin-left: -${({ theme }) => theme.spacing(1)};
    margin-right: -${({ theme }) => theme.spacing(1)};
  }

  ${({ theme }) => theme.breakpoints.up('sm')} {
    ${TeaserContentStyled} {
      grid-column: 2/11;
      margin-top: calc(-32px - (2 * 2 * 8px));
      padding: ${({ theme }) =>
        `${theme.spacing(2)} ${theme.spacing(1.5)} ${theme.spacing(1.5)}`};
    }

    ${SingleLine} {
      height: ${({ theme }) => theme.spacing(2)};
      margin-left: -${({ theme }) => theme.spacing(1.5)};
      margin-right: -${({ theme }) => theme.spacing(1.5)};
    }
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    ${TeaserContentStyled} {
      grid-column: 3/9;
    }

    ${TeaserImgStyled} {
      aspect-ratio: 5/2;
    }
  }
`;

export const SingleTeaser = (props: BuilderTeaserProps) => {
  return (
    <ImageContext.Provider value={{ maxWidth: 1500 }}>
      <SingleTeaserStyled {...props} />
    </ImageContext.Provider>
  );
};
