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
import { TeaserSlotsBlockWrapper } from '../../teaser/teaser-slots-block';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const CustomTabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const CustomTabPanelStyled = styled(CustomTabPanel)`
  background: linear-gradient(
    to bottom,
    rgb(174, 179, 190),
    rgba(174, 179, 190, 0.4)
  );
  position: relative;
  top: -1px;

  ${TeaserSlotsBlockWrapper} {
    & > h1 {
      display: none;
    }
  }
`;

const Tabs = styled(MuiTabs)`
  display: flex;
  flex-direction: row;
  align-items: stretch;

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

export const TabbedContentWrapper = styled('div')`
  width: 100%;
  grid-column: -1/1;
`;

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
        <CustomTabPanelStyled
          value={value}
          index={index}
          key={index}
        >
          {childrenArray[index]}
        </CustomTabPanelStyled>
      ))}
    </TabbedContentWrapper>
  );
};

export const isTabbedContentBlockStyle = (
  block: Pick<BlockContent, '__typename'>
): block is FlexBlock =>
  allPass([hasBlockStyle('TabbedContent'), isFlexBlock])(block);
