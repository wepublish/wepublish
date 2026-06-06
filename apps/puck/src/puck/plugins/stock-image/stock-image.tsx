import { Plugin } from '@puckeditor/core';
import { MdImageSearch } from 'react-icons/md';
import { StockImage } from './stock-image.component';

export const StockImagePlugin: Plugin = {
  icon: <MdImageSearch size={24} />,
  label: 'Stock Image',
  name: 'stock-image',
  render: StockImage,
};
