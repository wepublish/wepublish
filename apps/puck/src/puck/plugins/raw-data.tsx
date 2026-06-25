import styled from '@emotion/styled';
import { createUsePuck, Plugin } from '@puckeditor/core';

import { UserConfig } from '../types';

const RawDataPre = styled.pre`
  margin: 12px;
  padding: 12px;
  border-radius: 4px;
  background: #1a1a1a;
  color: #f2f2f2;
  font-size: 12px;
  line-height: 1.5;
  overflow: auto;
  max-height: 400px;
  white-space: pre-wrap;
  word-break: break-word;
`;

const usePuck = createUsePuck<UserConfig>();

const RawDataView = () => {
  const selectedItem = usePuck(state => state.selectedItem);
  const appState = usePuck(state => state.appState);

  const data = selectedItem ?? appState.data;

  return <RawDataPre>{JSON.stringify(data, null, 2)}</RawDataPre>;
};

export const RawDataPlugin: Plugin<UserConfig> = {
  name: 'raw-data',
  label: 'Raw Data',
  render: () => <RawDataView />,
};
