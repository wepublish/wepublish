import { useQuery } from '@apollo/client/react';
import { Autocomplete, TextField } from '@mui/material';
import {
  GiftCodeOfferListDocument,
  GiftCodeOfferSort,
  SortOrder,
} from '@wepublish/editor/api';
import { ReactNode, useMemo } from 'react';

interface SelectGiftCodeOffersProps {
  className?: string;
  disabled?: boolean;
  label?: ReactNode;
  helperText?: ReactNode;
  selectedOffers: string[];
  setSelectedOffers(offerIds: string[]): void;
}

export function SelectGiftCodeOffers({
  className,
  disabled,
  label,
  helperText,
  selectedOffers,
  setSelectedOffers,
}: SelectGiftCodeOffersProps) {
  const { data } = useQuery(GiftCodeOfferListDocument, {
    variables: {
      filter: { active: true },
      sort: GiftCodeOfferSort.Name,
      order: SortOrder.Ascending,
      take: 100,
    },
  });

  const names = useMemo(
    () =>
      new Map(
        (data?.giftCodeOffers?.nodes ?? []).map(offer => [offer.id, offer.name])
      ),
    [data]
  );

  return (
    <Autocomplete
      multiple
      disableCloseOnSelect
      className={className}
      disabled={disabled}
      options={[
        ...names.keys(),
        ...selectedOffers.filter(id => !names.has(id)),
      ]}
      getOptionLabel={id => names.get(id) ?? id}
      value={selectedOffers}
      onChange={(_event, offerIds) => setSelectedOffers(offerIds)}
      renderInput={params => (
        <TextField
          {...params}
          label={label}
          helperText={helperText}
        />
      )}
      fullWidth
    />
  );
}
