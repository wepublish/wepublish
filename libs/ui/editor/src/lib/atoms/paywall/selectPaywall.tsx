import { useQuery } from '@apollo/client/react';
import { Autocomplete, TextField } from '@mui/material';
import { PaywallListDocument } from '@wepublish/editor/api';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { humanizeError } from '../../humanizeError';
import { enqueueSnackbar } from '../../snackbar';

interface SelectPaywallsProps {
  className?: string;
  disabled?: boolean;
  name?: string;
  selectedPaywall?: string | null;
  setSelectedPaywall(paywalls: string | null): void;
  placeholder?: string;
}

/**
 * Error handling
 * @param error
 */
const showErrors = (error: Error): void => {
  enqueueSnackbar(humanizeError(error), {
    variant: 'error',
    autoHideDuration: 8000,
  });
};

export function SelectPaywall({
  className,
  disabled,
  name,
  selectedPaywall,
  setSelectedPaywall,
  placeholder,
}: SelectPaywallsProps) {
  const { t } = useTranslation();

  const { data: paywallsData } = useQuery(PaywallListDocument);

  /**
   * Prepare available paywalls
   */
  const availablePaywalls = useMemo(() => {
    if (!paywallsData?.paywalls) {
      return [];
    }

    return paywallsData.paywalls.map(paywall => ({
      label: paywall.name || t('comments.edit.unnamedPaywall'),
      value: paywall.id,
    }));
  }, [paywallsData, t]);

  return (
    <Autocomplete
      disabled={disabled}
      className={className}
      options={availablePaywalls.map(paywall => paywall.value)}
      getOptionLabel={id =>
        availablePaywalls.find(paywall => paywall.value === id)?.label ?? id
      }
      value={selectedPaywall ?? null}
      onChange={(_event, value) => setSelectedPaywall(value)}
      renderInput={params => (
        <TextField
          {...params}
          name={name}
          placeholder={placeholder}
        />
      )}
      fullWidth
    />
  );
}
