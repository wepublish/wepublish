import { createWebsiteTokenHandler } from '@wepublish/utils/website';
import getConfig from 'next/config';

const { publicRuntimeConfig } = getConfig();
const apiUrl =
  publicRuntimeConfig?.env?.API_URL ||
  process.env.API_URL ||
  'http://localhost:4000';

export default createWebsiteTokenHandler(apiUrl);
