import styled from '@emotion/styled';
import {
  BreakBlock,
  BreakBlockHeading,
  hasBlockStyle,
  isBreakBlock,
} from '@wepublish/block-content/website';
import {
  BlockContent,
  BreakBlock as BreakBlockType,
} from '@wepublish/website/api';
import { allPass, anyPass } from 'ramda';

// Main
export const isPrimaryBreakBlock = (
  block: Pick<BlockContent, '__typename'>
): block is BreakBlockType =>
  allPass([
    anyPass([hasBlockStyle('Primary Bg'), hasBlockStyle('Schwarz Bg')]),
    isBreakBlock,
  ])(block);

export const isSecondaryBreakBlock = (
  block: Pick<BlockContent, '__typename'>
): block is BreakBlockType =>
  allPass([
    anyPass([hasBlockStyle('Secondary Bg'), hasBlockStyle('Pink Bg')]),
    isBreakBlock,
  ])(block);

export const isAccentBreakBlock = (
  block: Pick<BlockContent, '__typename'>
): block is BreakBlockType =>
  allPass([
    anyPass([hasBlockStyle('Accent Bg'), hasBlockStyle('Türkis Bg')]),
    isBreakBlock,
  ])(block);

export const isLightAccentBreakBlock = (
  block: Pick<BlockContent, '__typename'>
): block is BreakBlockType =>
  allPass([
    anyPass([hasBlockStyle('Light Accent Bg'), hasBlockStyle('Gelb Bg')]),
    isBreakBlock,
  ])(block);

// Sub
export const isVioletBreakBlock = (
  block: Pick<BlockContent, '__typename'>
): block is BreakBlockType =>
  allPass([hasBlockStyle('Violett Bg'), isBreakBlock])(block);

export const isPurpleBreakBlock = (
  block: Pick<BlockContent, '__typename'>
): block is BreakBlockType =>
  allPass([hasBlockStyle('Lila Bg'), isBreakBlock])(block);

export const isWarningBreakBlock = (
  block: Pick<BlockContent, '__typename'>
): block is BreakBlockType =>
  allPass([
    anyPass([hasBlockStyle('Warning Bg'), hasBlockStyle('Orange Bg')]),
    isBreakBlock,
  ])(block);

export const isErrorBreakBlock = (
  block: Pick<BlockContent, '__typename'>
): block is BreakBlockType =>
  allPass([
    anyPass([hasBlockStyle('Error Bg'), hasBlockStyle('Rot Bg')]),
    isBreakBlock,
  ])(block);

export const isSuccessBreakBlock = (
  block: Pick<BlockContent, '__typename'>
): block is BreakBlockType =>
  allPass([
    anyPass([hasBlockStyle('Success Bg'), hasBlockStyle('Grün Bg')]),
    isBreakBlock,
  ])(block);

export const isInfoBreakBlock = (
  block: Pick<BlockContent, '__typename'>
): block is BreakBlockType =>
  allPass([
    anyPass([hasBlockStyle('Info Bg'), hasBlockStyle('Blau Bg')]),
    isBreakBlock,
  ])(block);

export const MannschaftBreakBlock = styled(BreakBlock)`
  ${({ theme }) => theme.breakpoints.up('md')} {
    grid-template-columns: 1fr max-content;
    gap: ${({ theme }) => theme.spacing(4)};
  }

  ${BreakBlockHeading} {
    font-size: ${({ theme }) => theme.typography.h3.fontSize};
  }
`;
