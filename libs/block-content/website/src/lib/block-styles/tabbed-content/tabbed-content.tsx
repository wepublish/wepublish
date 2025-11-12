import { hasBlockStyle } from '../../has-blockstyle';
import {
  BuilderBlockStyleProps,
  //useWebsiteBuilder,
} from '@wepublish/website/builder';
import { BlockContent, FlexBlock } from '@wepublish/website/api';
import { allPass } from 'ramda';
import { isFlexBlock } from '../../nested-blocks/flex-block';
import * as React from 'react';
import { Box, Tab as MuiTab, Tabs as MuiTabs } from '@mui/material';
import { Children } from 'react';
import styled from '@emotion/styled';
import {
  TeaserSlotsBlockWrapper,
  TeaserSlotsBlockTeasers,
} from '../../teaser/teaser-slots-block';
import {
  TeaserWrapper,
  TeaserImageWrapper,
  TeaserContentWrapper,
  TeaserPreTitle,
  TeaserTitle,
  TeaserMetadata,
  TeaserTime,
  TeaserAuthors,
  TeaserPreTitleWrapper,
  TeaserLead,
} from 'apps/tsri/src/components/tsri-base-teaser';

export const TabbedContentWrapper = styled('div')`
  width: 100%;
  grid-column: -1/1;
  container: tabbed-content/inline-size;
`;

interface TabPanelBaseProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanelBase = (props: TabPanelBaseProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <TabPanelBox>{children}</TabPanelBox>}
    </div>
  );
};

const TabPanelBox = styled('div')``;

const TabPanel = styled(TabPanelBase)`
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
    aspect-ratio: 2.06;

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
          aspect-ratio: 1.0;
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
        grid-template-rows: 26% 11.6% min-content min-content;
        grid-template-columns: 15.9% 84.1%;
      }

      ${TeaserPreTitle} {
        display: inline-block;
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
  }

  ${TeaserContentWrapper} {
    background-color: #AEB3BE;
  }
}
`;

const Tabs = styled(MuiTabs)`
  display: flex;
  flex-direction: row;
  align-items: stretch;
  min-height: unset;

  & .MuiTabs-indicator {
    display: none;
  }
`;

const Tab = styled(MuiTab)`
  background-color: rgba(0, 0, 0, 1);
  color: rgba(255, 255, 255, 1);
  font-size: 16px;
  font-weight: 700;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  margin-right: 4px;
  padding: 7px 20px 2px 20px;
  text-transform: none;
  flex-grow: 1;
  align-items: flex-start;
  min-height: unset;

  @container tabbed-content (width > 700px) {
    font-size: 1.4cqw;
    line-height: 1.4cqw;
    padding: 0.7cqw 2.8cqw 0.5cqw 2.8cqw;
    margin-right: 0.25cqw;
    border-top-left-radius: 1cqw;
    border-top-right-radius: 1cqw;
  }

  &:last-child {
    margin-right: 0;
  }

  &:hover: {
    //color: '#40a9ff';
    opacity: 1;
  }

  &.Mui-selected {
    background-color: rgb(174, 179, 190);
    color: rgba(255, 255, 255, 1);
  }

  &.mui-focusvisible: {
    backgroundcolor: #d1eaff;
  }

  & > span: {
    display: none;
  }
`;

const a11yProps = (index: number) => {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
};

export const TabbedContent = ({
  className,
  nestedBlocks,
  children = [],
}: BuilderBlockStyleProps['TabbedContent']) => {
  const childrenArray = Children.toArray(children);
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
              label={nestedBlock.block.title || `Tab ${index + 1}`}
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

export const isTabbedContentBlockStyle = (
  block: Pick<BlockContent, '__typename'>
): block is FlexBlock =>
  allPass([hasBlockStyle('TabbedContent'), isFlexBlock])(block);
