import { Meta, StoryObj } from '@storybook/nextjs-vite';
import { mockGiftCode, mockInvoice } from '@wepublish/storybook/mocks';
import {
  CheckInvoiceStatusDocument,
  GiftCodeStatus,
  MyGiftCodesDocument,
} from '@wepublish/website/api';
import { GiftCodeListContainer } from './gift-code-list-container';

export default {
  component: GiftCodeListContainer,
  title: 'Container/GiftCodeList',
} as Meta;

const orderedGiftCode = mockGiftCode({
  id: 'gift-ordered',
  status: GiftCodeStatus.Ordered,
  invoiceId: 'invoice-ordered',
});

const issuedGiftCode = mockGiftCode({
  id: 'gift-issued',
  status: GiftCodeStatus.Issued,
  invoiceId: 'invoice-issued',
});

const checkInvoiceStatus = mockInvoice({
  id: 'invoice-ordered',
  subscription: null,
  paidAt: null,
  canceledAt: null,
});

export const Default: StoryObj = {
  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: MyGiftCodesDocument,
          },
          result: {
            data: {
              myGiftCodes: [orderedGiftCode, issuedGiftCode],
            },
          },
          maxUsageCount: 2,
        },
        {
          request: {
            query: CheckInvoiceStatusDocument,
            variables: {
              id: orderedGiftCode.invoiceId,
            },
          },
          result: {
            data: {
              checkInvoiceStatus,
            },
          },
        },
      ],
    },
  },
};

export const Empty: StoryObj = {
  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: MyGiftCodesDocument,
          },
          result: {
            data: {
              myGiftCodes: [],
            },
          },
        },
      ],
    },
  },
};
