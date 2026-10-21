import { ReactNode } from 'react';

export type DocumentHeadTagsProps = Record<string, unknown>;

export const DocumentHeadTags = () => null;

export const documentGetInitialProps = async () => ({
  html: '',
  head: [],
  styles: [],
});

export const AppCacheProvider = ({ children }: { children?: ReactNode }) =>
  children;
