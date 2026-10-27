import styled from '@emotion/styled';
import { useFullWidthContent } from '@wepublish/content/website';
import { Page } from '@wepublish/page/website';
import { BuilderPageProps } from '@wepublish/website/builder';

import {
  TSRI_TWO_COLUMN_CONTENT_CLASS,
  twoColumnContentStyles,
} from './tsri-two-column-content';

export const getPageProperty = (data: BuilderPageProps['data'], key: string) =>
  data?.page?.latest?.properties?.find(
    property => property.key.trim().toLowerCase() === key
  )?.value;

export const isWideLayoutPage = (data: BuilderPageProps['data']) =>
  ['wide', 'layout-wide'].includes(
    getPageProperty(data, 'pagelayout')?.trim().toLowerCase() ?? ''
  );

const TsriPageStyled = styled(Page)`
  &.${TSRI_TWO_COLUMN_CONTENT_CLASS} {
    ${({ theme }) => twoColumnContentStyles(theme)}
  }
`;

export const TsriPage = (props: BuilderPageProps) => {
  const fullWidth = useFullWidthContent();
  const twoColumn = !fullWidth && !isWideLayoutPage(props.data);

  return (
    <TsriPageStyled
      {...props}
      className={[props.className, twoColumn && TSRI_TWO_COLUMN_CONTENT_CLASS]
        .filter(Boolean)
        .join(' ')}
    />
  );
};
