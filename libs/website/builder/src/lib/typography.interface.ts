import { HeadingProps, LinkProps, ParagraphProps } from '@wepublish/ui';
import { RefAttributes } from 'react';

export type BuilderHeadingProps = HeadingProps;
export type BuilderParagraphProps = ParagraphProps;
export type BuilderLinkProps = LinkProps & RefAttributes<HTMLAnchorElement>;
