import { Plugin } from '@puckeditor/core';
import { createElement } from 'react';
import { MdImageSearch } from 'react-icons/md';

import { StockImage } from './stock-image.component';

export const StockImagePlugin: Plugin = {
  icon: createElement(MdImageSearch, { size: 24 }),
  label: 'Stock Image',
  name: 'stock-image',
  render: StockImage,
};
