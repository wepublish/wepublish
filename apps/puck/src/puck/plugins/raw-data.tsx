import { Plugin, usePuck } from '@puckeditor/core';

import { UserConfig } from '../types';

const RawDataView = () => {
  const { selectedItem, appState } = usePuck<UserConfig>();
  const data = selectedItem ?? appState.data;

  return (
    <pre
      css={{
        margin: 12,
        padding: 12,
        borderRadius: 4,
        background: '#1a1a1a',
        color: '#f2f2f2',
        fontSize: 12,
        lineHeight: 1.5,
        overflow: 'auto',
        maxHeight: 400,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}
    >
      {JSON.stringify(data, null, 2)}
    </pre>
  );
};

export const rawDataPlugin: Plugin<UserConfig> = {
  name: 'raw-data',
  label: 'Raw Data',
  render: () => <RawDataView />,
};
