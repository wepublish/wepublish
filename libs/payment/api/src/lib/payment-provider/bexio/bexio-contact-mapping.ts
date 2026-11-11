import { User, UserAddress } from '@prisma/client';
import { ContactsStatic } from 'bexio';

export type ContactUser = User & { address: UserAddress | null };

/**
 * The contact fields We.Publish is the source of. Everything else on the
 * contact (groups, phone, second mail, owner) belongs to bexio and is left
 * alone, which is why this is sent with bexio's partial edit. Missing address
 * parts are sent empty, so an address removed here is removed there.
 */
export function bexioContactFields(
  user: ContactUser,
  countryId: number
): Partial<ContactsStatic.ContactOverwrite> {
  const address = user.address;
  const company = address?.company?.trim();

  return {
    name_1: company || user.name,
    name_2: company ? '' : (user.firstName ?? ''),
    contact_type_id: company ? 1 : 2, // 1: company, 2: person
    mail: user.email,
    street_name: address?.streetAddress ?? '',
    house_number: address?.streetAddressNumber ?? '',
    address_addition: [address?.streetAddress2, address?.streetAddress2Number]
      .map(part => part?.trim())
      .filter(Boolean)
      .join(' '),
    postcode: address?.zipCode ?? '',
    city: address?.city ?? '',
    country_id: countryId,
  };
}
