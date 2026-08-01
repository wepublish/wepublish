import styled from '@emotion/styled';
import {
  MemberPlanItem,
  MemberPlanItemContent,
  MemberPlanItemDescription,
  MemberPlanItemFreeInputSpinner,
  MemberPlanItemName,
  MemberPlanItemPicker,
  MemberPlanItemPrice,
} from '@wepublish/membership/website';

import { euclidCircularB, robotoMono } from '../theme';

export const ReflektMemberPlanItem = styled(MemberPlanItem)`
  container-type: inline-size;

  ${MemberPlanItemDescription} {
    display: none;
  }

  ${MemberPlanItemPicker} {
    aspect-ratio: 1 / 1;
    display: grid;
    grid-template-columns: 1fr;
    align-items: stretch;
    width: 100%;
    height: auto;
    padding: ${({ theme }) => theme.spacing(2)};
    background-color: ${({ theme }) => theme.palette.common.black};
    color: ${({ theme }) => theme.palette.common.white};
    border: none;
    border-radius: 0;
    position: relative;
    overflow: hidden;

    &:has(.Mui-checked) {
      background-color: ${({ theme }) => theme.palette.common.white};
      color: ${({ theme }) => theme.palette.common.black};
    }

    .MuiRadio-root {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      opacity: 0;
      cursor: pointer;
    }
  }

  ${MemberPlanItemContent} {
    display: grid;
    grid-template-rows: 1fr 1fr;
    height: 100%;
    text-align: center;
  }

  ${MemberPlanItemPrice} {
    grid-row: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: ${[euclidCircularB.style.fontFamily, 'sans-serif'].join(',')};
    font-weight: 500;
    font-size: clamp(3.25rem, 42cqi, 8.5rem);
    line-height: 1;
  }

  ${MemberPlanItemFreeInputSpinner} {
    position: relative;
    z-index: 1;
    justify-self: center;
  }

  ${MemberPlanItemName} {
    grid-row: 2;
    display: grid;
    align-content: space-between;
    justify-items: center;
    padding-block: ${({ theme }) => theme.spacing(1)}
      ${({ theme }) => theme.spacing(2)};
    font-family: ${[euclidCircularB.style.fontFamily, 'sans-serif'].join(',')};
    font-weight: 500;
    font-size: clamp(0.875rem, 8cqi, 1.75rem);
    line-height: 1.1;
    text-transform: uppercase;
    white-space: nowrap;

    &::before {
      content: 'CHF PRO JAHR';
      font-family: ${[robotoMono.style.fontFamily, 'sans-serif'].join(',')};
      font-weight: 400;
      font-size: clamp(0.65rem, 4.5cqi, 1.1rem);
      letter-spacing: 0.05em;
    }
  }
`;
