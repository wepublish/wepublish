import { hasBlockStyle } from '../../has-blockstyle';
import {
  BuilderBlockStyleProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { BlockContent, FlexBlock } from '@wepublish/website/api';
import { allPass } from 'ramda';
import { isFlexBlock } from '../../nested-blocks/flex-block';
import * as React from 'react';
import { Box, Tab as MuiTab, Tabs as MuiTabs } from '@mui/material';
import styled from '@emotion/styled';

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

export const TabPanelBase = (props: TabPanelBaseProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && children}
    </div>
  );
};

export const TabPanel = styled(TabPanelBase)`
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
`;

export const Tabs = styled(MuiTabs)`
  display: flex;
  flex-direction: row;
  align-items: stretch;
  min-height: unset;

  & .MuiTabs-indicator {
    display: none;
  }
`;

export const Tab = styled(MuiTab)`
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

  @container tabbed-content (width > 200px) {
    font-size: 1.4cqw;
    line-height: 1.4cqw;
    padding: 0.7cqw 2.8cqw 0.5cqw 2.8cqw;
    margin-right: 0.25cqw;
    border-top-left-radius: 1cqw;
    border-top-right-radius: 1cqw;
  }

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

  &.mui-focusvisible: {
    backgroundcolor: #d1eaff;
  }

  & > span: {
    display: none;
  }
`;

export const a11yProps = (index: number) => {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
};

export const TabbedContent = ({
  className,
  nestedBlocks,
  blockStyle,
}: BuilderBlockStyleProps['TabbedContent']) => {
  const [value, setValue] = React.useState(0);

  const {
    blocks: { Renderer },
  } = useWebsiteBuilder();

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
          {nestedBlocks.map((nestedBlock, index) => {
            return (
              <Tab
                disableRipple={true}
                key={index}
                label={
                  (nestedBlock.block as { title: string }).title ||
                  `Tab ${index + 1}`
                }
                {...a11yProps(index)}
              />
            );
          })}
        </Tabs>
      </Box>
      {nestedBlocks.map((nestedBlock, index) => (
        <TabPanel
          value={value}
          index={index}
          key={index}
        >
          <Renderer
            block={
              {
                ...nestedBlock.block,
                blockStyle:
                  nestedBlock.block?.blockStyle ||
                  TabbedContent['subBlockStyles']?.[index] ||
                  blockStyle,
              } as BlockContent
            }
            type="Article"
            index={index}
            count={nestedBlocks.length}
          />
        </TabPanel>
      ))}
    </TabbedContentWrapper>
  );
};

TabbedContent['subBlockStyles'] =
  [] as BuilderBlockStyleProps['TabbedContent']['subBlockStyles'];

export const isTabbedContentBlockStyle = (
  block: Pick<BlockContent, '__typename'>
): block is FlexBlock =>
  allPass([hasBlockStyle('TabbedContent'), isFlexBlock])(block);
