import { PaymentState, User } from '@prisma/client';
import {
  searchForContact,
  addToStringReplaceMap,
  mapBexioStatusToPaymentStatus,
} from './bexio-utils';
import Bexio from 'bexio';
import { MappedReplacer } from 'mapped-replacer/dist/types';

jest.mock('mapped-replacer/dist/types', () => {
  return {
    MappedReplacer: jest.fn().mockImplementation(() => {
      return {
        addRule: jest.fn(),
      };
    }),
  };
});

jest.mock('bexio', () => {
  const ContactsStatic = {
    ContactSearchParameters: {
      mail: 'mockMailParameter',
    },
  };

  const Bexio = jest.fn().mockImplementation(() => {
    return {
      contacts: {
        search: jest.fn(),
      },
    };
  });

  return {
    __esModule: true,
    default: Bexio,
    ContactsStatic,
  };
});

const mockUser: User = {
  id: 'user-1',
  createdAt: new Date('2023-01-01T00:00:00.000Z'),
  modifiedAt: new Date('2023-01-01T01:00:00.000Z'),
  birthday: new Date(),
  email: 'test@example.com',
  emailVerifiedAt: new Date('2023-01-01T02:00:00.000Z'),
  name: 'Test User',
  firstName: 'Test',
  flair: null,
  password: 'password123',
  active: true,
  lastLogin: new Date('2023-01-02T00:00:00.000Z'),
  roleIDs: ['role1', 'role2'],
  userImageID: 'image-1',
  note: null,
};

describe('bexio-utils', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('searchForContact', () => {
    it('should search for contact by user email', async () => {
      const mockBexio = new Bexio('12345');

      (mockBexio.contacts.search as jest.Mock).mockResolvedValue([
        { id: 1, name: 'Test User' },
      ]);

      const contact = await searchForContact(mockBexio, mockUser);

      expect(mockBexio.contacts.search).toHaveBeenCalledWith([
        {
          field: expect.anything(),
          value: mockUser.email,
          criteria: '=',
        },
      ]);

      expect(contact).toEqual({ id: 1, name: 'Test User' });
    });
  });

  describe('addToStringReplaceMap', () => {
    it('should add rules to string replace map', () => {
      const mockStringReplaceMap = new MappedReplacer();
      mockStringReplaceMap.addRule = jest.fn();

      const id = 'user';

      addToStringReplaceMap(mockStringReplaceMap, id, mockUser);

      expect(mockStringReplaceMap.addRule).toHaveBeenCalledWith(
        ':user.id:',
        'user-1'
      );
    });
  });

  describe('mapBexioStatusToPaymentStatus', () => {
    it('should correctly map Bexio status to payment status', () => {
      expect(mapBexioStatusToPaymentStatus(31)).toEqual(
        PaymentState.requiresUserAction
      );
      expect(mapBexioStatusToPaymentStatus(16)).toEqual(
        PaymentState.requiresUserAction
      );
      expect(mapBexioStatusToPaymentStatus(7)).toEqual(
        PaymentState.requiresUserAction
      );

      expect(mapBexioStatusToPaymentStatus(8)).toEqual(PaymentState.processing);

      expect(mapBexioStatusToPaymentStatus(9)).toEqual(PaymentState.paid);

      expect(mapBexioStatusToPaymentStatus(19)).toEqual(PaymentState.canceled);

      expect(mapBexioStatusToPaymentStatus(123 as any)).toEqual(null); // An arbitrary value not in the known statuses
    });
  });
});
