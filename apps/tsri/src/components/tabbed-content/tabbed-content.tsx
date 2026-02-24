import styled from '@emotion/styled';
import {
  Box,
  Tab as MuiTab,
  Tabs as MuiTabs,
  Theme,
  useTheme,
} from '@mui/material';
import { isFlexBlock } from '@wepublish/block-content/website';
import { BlockContent, FlexBlock } from '@wepublish/website/api';
import {
  BuilderFlexBlockProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { allPass } from 'ramda';
import * as React from 'react';

export const TabbedContentWrapper = styled('div')`
  width: 100%;
  grid-column: -1/1;
  container: tabbed-content/inline-size;
`;

interface TabPanelBaseProps {
  children?: React.ReactNode;
  index: number;
  value: number;
  id: string;
}

export const TabPanelBase = (props: TabPanelBaseProps) => {
  const { children, value, index, id, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`${id}-simple-tabpanel-${index}`}
      aria-labelledby={`${id}-simple-tab-${index}`}
      {...other}
    >
      {value === index && children}
    </div>
  );
};

export const TabPanel = styled(TabPanelBase, {
  shouldForwardProp: propName => propName !== 'cssByBlockStyle',
})<{
  cssByBlockStyle: string | undefined | null;
}>`
  background: linear-gradient(
    to bottom,
    rgb(174, 179, 190),
    color-mix(in srgb, white 40%, rgb(174, 179, 190))
  );
  position: relative;
  top: -1px;
  z-index: 0;

  padding: 7cqw 1.3cqw 10cqw 5.58cqw;

  ${({ cssByBlockStyle }) => cssByBlockStyle}
`;

export const Tabs = styled(MuiTabs)`
  display: flex;
  flex-direction: row;
  min-height: unset;
  background-color: rgb(174, 179, 190);
  padding: 2cqw 2cqw 0 2cqw;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;

  & .MuiTabs-indicator {
    display: none !important;
  }

  & .MuiTabs-fixed {
    overflow: visible !important;
  }

  & .MuiTabs-flexContainer {
    flex-wrap: wrap !important;
    gap: 0.5cqw !important;
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    align-items: stretch;
    background-color: transparent;
    padding: 0;
    border-top-left-radius: unset;
    border-top-right-radius: unset;

    & .MuiTabs-fixed {
      overflow: hidden !important;
    }

    & .MuiTabs-flexContainer {
      flex-wrap: nowrap !important;
      gap: 0 !important;
    }
  }
`;

export const Tab = styled(MuiTab, {
  shouldForwardProp: propName => propName !== 'cssByBlockStyle',
})<{
  cssByBlockStyle: string | undefined | null;
}>`
  background-color: rgba(0, 0, 0, 1);
  color: rgba(255, 255, 255, 1);
  font-size: 16px;
  font-weight: 700;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  padding: 7px 20px 2px 20px;
  text-transform: none;
  flex-grow: 1;
  align-items: flex-start;
  min-height: unset;

  font-size: 3.8cqw;
  line-height: 3.8cqw;
  padding: 1.6cqw 2.8cqw 1.5cqw 2.8cqw;
  margin-right: 0.25cqw;
  border-top-left-radius: 1cqw;
  border-top-right-radius: 1cqw;

  flex: 1 1 calc((100% - 4 * 0.5cqw) / 3);
  max-width: unset;
  min-width: unset;

  &:last-of-type {
    margin-right: 0;
  }

  &:hover {
    background-color: #f5ff64;
    color: black;
  }

  &.Mui-selected,
  &.Mui-selected:hover {
    background-color: rgb(174, 179, 190);
    color: rgba(255, 255, 255, 1);
  }

  &.Mui-focus-visible {
    background-color: #d1eaff;
  }

  & > span {
    display: none;
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    flex: 1 1 auto;
    font-size: 1.4cqw;
    line-height: 1.4cqw;
    padding: 0.85cqw 2.8cqw 0.7cqw 2.8cqw;
  }

  ${({ cssByBlockStyle }) => cssByBlockStyle}
`;

export const a11yProps = (index: number, id: string) => {
  return {
    id: `${id}-simple-tab-${index}`,
    'aria-controls': `${id}-simple-tabpanel-${index}`,
  };
};

export const TabbedContent = ({
  className,
  blocks,
  blockStyle,
  blockStyleByIndex,
  cssByBlockStyle,
}: BuilderFlexBlockProps & {
  blockStyleByIndex?: (index: number) => string;
  cssByBlockStyle?: (
    index: number,
    theme: Theme,
    blockStyleOverride?: string | undefined | null
  ) => string;
}) => {
  const [value, setValue] = React.useState(0);
  const thisId = `TC-${React.useId()}`;

  const {
    blocks: { Renderer },
  } = useWebsiteBuilder();

  const theme = useTheme();

  const sortedBlocks = [...blocks].sort(
    (a, b) => a.alignment.y - b.alignment.y || a.alignment.x - b.alignment.x
  );

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <TabbedContentWrapper className={className}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="Tabs zur Navigation zwischen verschiedenen Themenbereichen"
        >
          {sortedBlocks.map((nestedBlock, index) => {
            return (
              <Tab
                disableRipple={true}
                key={index}
                label={
                  (nestedBlock.block as { title: string }).title ||
                  `Tab ${index + 1}`
                }
                {...a11yProps(index, thisId)}
                cssByBlockStyle={
                  cssByBlockStyle &&
                  cssByBlockStyle(index, theme, nestedBlock.block?.blockStyle)
                }
              />
            );
          })}
        </Tabs>
      </Box>
      {sortedBlocks.map((nestedBlock, index) => (
        <TabPanel
          value={value}
          index={index}
          key={index}
          id={thisId}
          cssByBlockStyle={
            cssByBlockStyle &&
            cssByBlockStyle(index, theme, nestedBlock.block?.blockStyle)
          }
        >
          <Renderer
            block={
              {
                ...nestedBlock.block,
                blockStyle:
                  nestedBlock.block?.blockStyle ||
                  (blockStyleByIndex && blockStyleByIndex(index)) ||
                  blockStyle,
              } as BlockContent
            }
            type="Article"
            index={index}
            count={sortedBlocks.length}
          />
        </TabPanel>
      ))}
    </TabbedContentWrapper>
  );
};

export const isTabbedContentBlockStyle = (
  block: Pick<BlockContent, '__typename' | 'blockStyle'>
): block is FlexBlock =>
  allPass([
    isFlexBlock,
    <T extends { blockStyle?: string | null }>(block: T) =>
      !!block.blockStyle?.startsWith('TabbedContent'),
  ])(block);
