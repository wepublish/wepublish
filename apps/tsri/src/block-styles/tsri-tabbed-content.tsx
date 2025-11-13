import styled from '@emotion/styled';
import { Box } from '@mui/material';
import {
  a11yProps,
  Tab,
  TabbedContentWrapper,
  TabPanel as TabPanelDefault,
  Tabs,
  TeaserSlotsBlockTeasers,
  TeaserSlotsBlockWrapper,
} from '@wepublish/block-content/website';
import { BuilderBlockStyleProps } from '@wepublish/website/builder';
import * as React from 'react';

import {
  TeaserAuthors,
  TeaserContentWrapper,
  TeaserImageWrapper,
  TeaserLead,
  TeaserMetadata,
  TeaserPreTitle,
  TeaserPreTitleWrapper,
  TeaserTime,
  TeaserTitle,
  TeaserWrapper,
} from '../components/tsri-base-teaser';

export const TabPanel = styled(TabPanelDefault)`
  background: linear-gradient(
    to bottom,
    rgb(174, 179, 190),
    rgba(174, 179, 190, 0.4)
  );
  position: relative;
  top: -1px;
  z-index: 0;

  @container tabbed-content (width > 700px) {
    padding: 7cqw 1.3cqw 10cqw 5.58cqw;
  }

  ${TeaserSlotsBlockWrapper} {
    & > h1 {
      display: none;
    }
    position: relative;
  }

  ${TeaserSlotsBlockTeasers} {
    display: grid;

    @container tabbed-content (width > 700px) {
      grid-template-columns: 58.42cqw 32.5cqw !important;
      grid-template-rows: repeat(5, auto) !important;
      column-gap: 2.2cqw;
      row-gap: 1.77cqw;
    }
  }

  ${TeaserWrapper} {
    aspect-ratio: 2.06 !important;

    ${TeaserImageWrapper} {
      display: none;
    }

    &:is(:nth-of-type(1)) {
      container: teaser/normal;
      grid-column: 1 / 2;
      grid-row: -1 / 1;
      aspect-ratio: unset;

      ${TeaserContentWrapper} {
        @container tabbed-content (width > 700px) {
          grid-template-rows: 58.42cqw min-content auto min-content;
          grid-template-columns: 100%;
        }

        & > * {
          grid-column: -1 / 1;
        }
      }

      ${TeaserImageWrapper} {
        display: grid;
        z-index: 1;

        @container tabbed-content (width > 700px) {
          aspect-ratio: 1;
          border-top-left-radius: 1.3cqw;
          border-top-right-radius: 1.3cqw;
          grid-column: 1 / 2;
          grid-row: 1 / 2;

          & img {
            width: auto;
            height: 58.42cqw;
            object-fit: cover;
            max-height: unset;
          }
        }
      }

      ${TeaserPreTitleWrapper} {
        grid-row: 1 / 2;
        z-index: 2;
        align-self: end;
      }

      ${TeaserPreTitle} {
        display: inline-block;
        padding: 0.2cqw 1cqw;
        font-size: 1cqw;
        font-weight: 500;
      }

      ${TeaserTitle} {
        padding: 1.8cqw 1cqw;
        grid-row: 2 / 3;
        font-size: 2cqw;

        white-space: nowrap;
        word-break: normal;
        word-wrap: nowrap;
        text-wrap: wrap;

        white-space: pre-wrap;
        word-break: break-word;
      }

      ${TeaserLead} {
        display: block;
        padding: 0.4cqw 1cqw 2cqw 1cqw;
        grid-row: 3 / 4;
        background-color: white;
        height: 100%;
      }

      ${TeaserMetadata} {
        padding: 0.4cqw 1cqw;
        grid-row: 4 / 5;
      }
    }

    &:is(:nth-of-type(1) ~ *) {
      ${TeaserContentWrapper} {
        grid-template-rows: 26% 7.9% min-content min-content;
        grid-template-columns: 15.9% 84.1%;
      }

      ${TeaserPreTitleWrapper} {
        display: flex;
        flex-direction: row;
        align-items: flex-start;
      }

      ${TeaserPreTitle} {
        padding: 0.65cqw 1.5cqw;
      }

      ${TeaserTitle} {
        padding: 2.2cqw 1.5cqw 4cqw;
      }

      ${TeaserMetadata} {
        padding: 0 1.5cqw;
        color: transparent;
      }

      ${TeaserAuthors} {
        color: black;
      }

      ${TeaserTime} {
        display: none;
      }
    }
    &:is(:nth-of-type(2)) {
      grid-column: 2 / 3;
      grid-row: 1 / 2;
    }
    &:is(:nth-of-type(3)) {
      grid-column: 2 / 3;
      grid-row: 2 / 3;
    }
    &:is(:nth-of-type(4)) {
      grid-column: 2 / 3;
      grid-row: 3 / 4;
    }
    &:is(:nth-of-type(5)) {
      grid-column: 2 / 3;
      grid-row: 4 / 5;
    }
    &:is(:nth-of-type(6)) {
      grid-column: 2 / 3;
      grid-row: 5 / 6;
    }
    &:is(:nth-of-type(7)) {
      position: absolute;
      bottom: -9cqw;
      right: 0;
      z-index: 2;
      background-color: transparent;
      display: block;
      aspect-ratio: auto !important;
      height: auto;
      width: 100%;

      & * {
        background-color: transparent;

        & > * {
          display: none;
        }
      }

      ${TeaserContentWrapper} {
        grid-template-rows: unset;
        grid-template-columns: unset;
        border-radius: unset;
        background-color: transparent;
      }

      & ${TeaserTitle} {
        @container tabbed-content (width > 700px) {
          font-size: 2cqw !important;
        }
        text-align: right;
        display: inline-block;
        padding: 0;

        & > * {
          display: inline;
          text-decoration: underline;

          &:hover {
            background-color: #f5ff64;
            color: black;
          }
        }
      }
    }

    ${TeaserContentWrapper} {
      background-color: #aeb3be;
    }
  }
`;

export const TabbedContent = ({
  className,
  nestedBlocks,
  children = [],
}: BuilderBlockStyleProps['TabbedContent']) => {
  const childrenArray = React.Children.toArray(children);
  const [value, setValue] = React.useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <TabbedContentWrapper className={className}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="basic tabs example"
        >
          {nestedBlocks.map((nestedBlock, index) => (
            <Tab
              disableRipple={true}
              key={index}
              label={
                (nestedBlock.block as { title: string }).title ||
                `Tab ${index + 1}`
              }
              {...a11yProps(index)}
            />
          ))}
        </Tabs>
      </Box>
      {nestedBlocks.map((nestedBlock, index) => (
        <TabPanel
          value={value}
          index={index}
          key={index}
        >
          {childrenArray[index]}
        </TabPanel>
      ))}
    </TabbedContentWrapper>
  );
};
