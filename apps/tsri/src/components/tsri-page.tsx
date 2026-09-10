import styled from '@emotion/styled';
import {
  FlexBlockWrapper,
  ImageBlockCaption,
  ImageBlockImage,
  ImageGalleryBlockWrapper,
  TeaserGridBlockWrapper,
  TeaserGridFlexBlockWrapper,
  TeaserListBlockWrapper,
  TeaserSlotsBlockWrapper,
} from '@wepublish/block-content/website';
import { useFullWidthContent } from '@wepublish/content/website';
import { SubscribeWrapper } from '@wepublish/membership/website';
import { Page } from '@wepublish/page/website';
import { BuilderPageProps } from '@wepublish/website/builder';

import { SidebarContentWrapper } from './break-blocks/tsri-sidebar-content';

export const TSRI_TWO_COLUMN_PAGE_CLASS = 'tsri-two-column-page';

export const WIDE_PAGE_LAYOUT_VALUES = ['wide', 'layout-wide'];

export const getPageProperty = (data: BuilderPageProps['data'], key: string) =>
  data?.page?.latest?.properties?.find(
    property => property.key.trim().toLowerCase() === key
  )?.value;

export const isWideLayoutPage = (data: BuilderPageProps['data']) =>
  WIDE_PAGE_LAYOUT_VALUES.includes(
    getPageProperty(data, 'pagelayout')?.trim().toLowerCase() ?? ''
  );

const TsriPageStyled = styled(Page)`
  /* Deliberately no !important in this file: the marker class provides the
     specificity to beat ContentWrapperStyled, while the sidebar break block
     and the mitmachen grid reset stay able to override these rules. */
  &.${TSRI_TWO_COLUMN_PAGE_CLASS} {
    /* The page wrapper is itself a grid item (MainSpacer is a grid); without
       this, a wide image's min-content blows the article past the container
       because percentage max-widths cannot resolve during intrinsic sizing. */
    min-width: 0;
    grid-template-columns: var(--two-column-grid);
    justify-content: space-between;

    &
      > *:not(
        ${SidebarContentWrapper},
          ${TeaserGridFlexBlockWrapper},
          ${TeaserGridBlockWrapper},
          ${TeaserListBlockWrapper},
          ${TeaserSlotsBlockWrapper},
          ${ImageGalleryBlockWrapper},
          ${SubscribeWrapper},
          ${FlexBlockWrapper}
      ) {
      grid-column: 1 / 2;
    }

    &
      > :is(
        ${TeaserGridFlexBlockWrapper},
          ${TeaserGridBlockWrapper},
          ${TeaserListBlockWrapper},
          ${TeaserSlotsBlockWrapper},
          ${ImageGalleryBlockWrapper},
          ${SubscribeWrapper},
          ${FlexBlockWrapper}
      ) {
      grid-column: -1 / 1;
    }

    ${ImageBlockImage} {
      border-radius: 1rem;
      object-fit: cover;
      object-position: left center;
      max-width: calc(100vw - ${({ theme }) => theme.spacing(4)});

      ${({ theme }) => theme.breakpoints.up('sm')} {
        max-width: calc(100vw - ${({ theme }) => theme.spacing(6)});
      }

      ${({ theme }) => theme.breakpoints.up('md')} {
        max-width: 100%;
      }
    }

    ${ImageBlockCaption} {
      font-size: 0.75rem;
      line-height: 1rem;
      font-weight: 700;
    }

    & :is(${SidebarContentWrapper}) + * {
      margin-top: ${({ theme }) => theme.spacing(-3)};
    }
  }
`;

export const TsriPage = (props: BuilderPageProps) => {
  const fullWidth = useFullWidthContent();
  const twoColumn = !fullWidth && !isWideLayoutPage(props.data);

  return (
    <TsriPageStyled
      {...props}
      className={[props.className, twoColumn && TSRI_TWO_COLUMN_PAGE_CLASS]
        .filter(Boolean)
        .join(' ')}
    />
  );
};
