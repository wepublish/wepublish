import { hasBlockStyle } from '../../has-blockstyle';
import {
  BuilderBlockStyleProps,
  //useWebsiteBuilder,
} from '@wepublish/website/builder';
import { BlockContent, FlexBlock } from '@wepublish/website/api';
import { allPass } from 'ramda';
import { isFlexBlock } from '../../nested-blocks/flex-block';
import * as React from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import { Children } from 'react';
import type {} from '@mui/lab/themeAugmentation';

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
    <Box
      sx={{ width: '100%', gridColumn: '-1/1' }}
      className={className}
    >
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="basic tabs example"
        >
          {nestedBlocks.map((nestedBlock, index) => (
            <Tab
              key={index}
              label={nestedBlock.block.title || `Tab ${index + 1}`}
              {...a11yProps(index)}
            />
          ))}
        </Tabs>
      </Box>
      {nestedBlocks.map((nestedBlock, index) => (
        <CustomTabPanel
          value={value}
          index={index}
          key={index}
        >
          {childrenArray[index]}
        </CustomTabPanel>
      ))}
    </Box>
  );
};

export const isTabbedContentBlockStyle = (
  block: Pick<BlockContent, '__typename'>
): block is FlexBlock =>
  allPass([hasBlockStyle('TabbedContent'), isFlexBlock])(block);
