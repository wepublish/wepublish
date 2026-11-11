import { css, Theme } from '@emotion/react';
import {
  SliderArrow,
  SliderBall,
  SliderBallContainer,
} from '@wepublish/block-content/website';

export const reflektSliderControls = (theme: Theme) => css`
  ${SliderBallContainer} {
    margin-left: -${theme.spacing(6)};
    margin-right: -${theme.spacing(6)};
    margin-top: -50%;
    pointer-events: none;

    ${SliderArrow} {
      display: block;
      pointer-events: all;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' fill='none'%3E%3Ccircle cx='24' cy='24' r='23.75' fill='%23fafafa' fill-opacity='.8' stroke='%23000' stroke-width='.5' transform='rotate(-180 24 24)'/%3E%3Cpath stroke='%23000' stroke-linecap='square' stroke-width='3' d='m28 34-9.276-9.276L28 15.45'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: center;
      background-size: contain;
      width: 35px;
      height: 35px;

      &:hover {
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' fill='none'%3E%3Ccircle cx='24' cy='24' r='23.75' fill='%23d8d8d8' fill-opacity='.8' stroke='%23000' stroke-width='.5' transform='rotate(-180 24 24)'/%3E%3Cpath stroke='%23000' stroke-linecap='square' stroke-width='3' d='m28 34-9.276-9.276L28 15.45'/%3E%3C/svg%3E");
      }

      & + ${SliderArrow} {
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' fill='none'%3E%3Ccircle cx='24' cy='24' r='23.75' fill='%23fafafa' fill-opacity='.8' stroke='%23000' stroke-width='.5' transform='rotate(-180 24 24)'/%3E%3Cpath stroke='%23000' stroke-linecap='square' stroke-width='3' d='m20 34 9.276-9.276L20 15.45'/%3E%3C/svg%3E");

        &:hover {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' fill='none'%3E%3Ccircle cx='24' cy='24' r='23.75' fill='%23d8d8d8' fill-opacity='.8' stroke='%23000' stroke-width='.5' transform='rotate(-180 24 24)'/%3E%3Cpath stroke='%23000' stroke-linecap='square' stroke-width='3' d='m20 34 9.276-9.276L20 15.45'/%3E%3C/svg%3E");
        }
      }
    }

    svg {
      visibility: hidden;
    }

    ${SliderBall} {
      display: none;
    }
  }
`;
