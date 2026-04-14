import styled from '@emotion/styled';
import { useMediaQuery, useTheme } from '@mui/material';
import {
  ImageSlider,
  SliderArrow,
  SliderBall,
  SliderBallContainer,
  SliderBallFill,
  SliderInnerContainer,
  SlidesContainer,
} from '@wepublish/block-content/website';
import {
  ImageBlockInnerWrapper,
  ImageBlockWrapper,
} from '@wepublish/block-content/website';
import { BuilderBlockStyleProps } from '@wepublish/website/builder';

export const ImageSliderBase = ({
  images,
  slidesPerViewConfig = {},
  className,
}: BuilderBlockStyleProps['ImageSlider']) => {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  return (
    <ImageSlider
      images={images}
      slidesPerViewConfig={{
        xs: 1,
        sm: 1,
        md: 'auto',
        lg: 'auto',
        xl: 'auto',
      }}
      className={className}
      slideGap={isDesktop ? 0 : 10}
    />
  );
};

export const TsriImageSlider = styled(ImageSliderBase)`
  margin: 0;
  --sizing-factor: 2.9;

  ${({ theme }) => theme.breakpoints.up('md')} {
    margin: 0 -0.625cqw;
    --sizing-factor: 1;
  }

  ${SliderInnerContainer} {
    row-gap: ${({ theme }) => theme.spacing(2)};

    ${SlidesContainer} {
      container: slidescontainer / inline-size;
      flex-shrink: 0;
      grid-column: -1 / 1;
      grid-row: 1 / 2;
      z-index: 2;
    }

    ${SliderBallContainer} {
      grid-column: -1 / 1;
      grid-row: 1 / 2;
      padding: ${({ theme }) => theme.spacing(0)};
      align-content: end;

      ${({ theme }) => theme.breakpoints.up('md')} {
        margin-left: -${({ theme }) => theme.spacing(6)};
        margin-right: -${({ theme }) => theme.spacing(6)};
      }

      ${SliderArrow} {
        display: none;

        ${({ theme }) => theme.breakpoints.up('md')} {
          display: block;
        }

        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' fill='none'%3E%3Ccircle cx='24' cy='24' r='24' fill='%23000'/%3E%3Cpath stroke='%23fff' stroke-linecap='round' stroke-width='1.5' d='m26 34-9.276-9.276L26 15.45'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: center;
        background-size: contain;
        width: 35px;
        height: 35px;

        top: calc(50% - 17.5px);

        &:hover {
          ${({ theme }) =>
            `background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' fill='none'%3E%3Ccircle cx='24' cy='24' r='24' fill='${encodeURIComponent(theme.palette.primary.light)}'/%3E%3Cpath stroke='%23000' stroke-linecap='round' stroke-width='1.5' d='m26 34-9.276-9.276L26 15.45'/%3E%3C/svg%3E");`}
        }

        & + ${SliderArrow} {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' fill='none'%3E%3Ccircle cx='24' cy='24' r='24' fill='%23000'/%3E%3Cpath stroke='%23fff' stroke-linecap='round' stroke-width='1.5' d='m22 34 9.276-9.276L22 15.45'/%3E%3C/svg%3E");

          &:hover {
            ${({ theme }) =>
              `background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' fill='none'%3E%3Ccircle cx='24' cy='24' r='24' fill='${encodeURIComponent(theme.palette.primary.light)}'/%3E%3Cpath stroke='%23000' stroke-linecap='round' stroke-width='1.5' d='m22 34 9.276-9.276L22 15.45'/%3E%3C/svg%3E");`}
          }
        }
      }

      svg {
        visibility: hidden;
      }
    }

    ${SliderBallFill} {
      background-color: ${({ theme }) => theme.palette.common.black};
    }

    ${SliderBall} {
      margin: ${({ theme }) => theme.spacing(0)};

      &:hover {
        background-color: ${({ theme }) => theme.palette.primary.light};
      }
    }
  }

  .keen-slider__slide {
    padding: 0 0 ${({ theme }) => theme.spacing(3)} 0;

    ${({ theme }) => theme.breakpoints.up('md')} {
      width: 33.33cqw !important;
      flex-shrink: 0;
      padding: 0 calc(var(--sizing-factor) * 0.625cqw)
        ${({ theme }) => theme.spacing(5)} calc(var(--sizing-factor) * 0.625cqw);
    }

    ${ImageBlockWrapper} {
      height: 100%;

      ${ImageBlockInnerWrapper} {
        display: grid;
        grid-template-columns: 1fr;
        grid-template-rows: 300px auto;
        row-gap: ${({ theme }) => theme.spacing(1)};

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          grid-row: 1 / 2;
          grid-column: -1 / 1;
          border-radius: calc(var(--sizing-factor) * 0.6cqw);
        }

        figcaption {
          grid-row: 2 / 3;
          grid-column: -1 / 1;
          font-size: 0.75rem;
          line-height: 1rem;
          font-weight: 700;
          color: ${({ theme }) => theme.palette.common.black};
        }
      }
    }
  }
`;
