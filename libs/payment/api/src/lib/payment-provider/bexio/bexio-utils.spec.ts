import { PaymentState, User } from '@prisma/client';
import {
  searchForContact,
  addToStringReplaceMap,
  mapBexioStatusToPaymentStatus,
} from './bexio-utils';
import Bexio from 'bexio';
import { MappedReplacer } from 'mapped-replacer';
import type { Mock } from 'vitest';

vi.mock('mapped-replacer', () => {
  return {
    MappedReplacer: vi.fn().mockImplementation(function () {
      return {
        addRule: vi.fn(),
      };
    }),
  };
});

vi.mock('bexio', () => {
  const ContactsStatic = {
    ContactSearchParameters: {
      mail: 'mockMailParameter',
    },
  };

  const Bexio = vi.fn().mockImplementation(function () {
    return {
      contacts: {
        search: vi.fn(),
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
  pendingEmail: null,
  pendingEmailAt: null,
  pendingEmailTokenHash: null,
  name: 'Test User',
  firstName: 'Test',
  flair: null,
  password: 'password123',
  active: true,
  lastLogin: new Date('2023-01-02T00:00:00.000Z'),
  roleIDs: ['role1', 'role2'],
  userImageID: 'image-1',
  note: null,
  totpSecret: null,
  totpEnabled: false,
  totpExempt: false,
  properties: [],
};

describe('bexio-utils', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('searchForContact', () => {
    it('should search for contact by user email', async () => {
      const mockBexio = new Bexio('12345');

      (mockBexio.contacts.search as Mock).mockResolvedValue([
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
      mockStringReplaceMap.addRule = vi.fn();

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
