import { useQuery } from '@apollo/client/react';
import { PaywallListDocument } from '@wepublish/editor/api';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Message, SelectPicker, toaster } from 'rsuite';
import { humanizeError } from '../../humanizeError';

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
  toaster.push(
    <Message
      type="error"
      showIcon
      closable
      duration={8000}
    >
      {humanizeError(error)}
    </Message>
  );
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

  const { data: paywallsData, error: paywallListError } =
    useQuery(PaywallListDocument);

  useEffect(() => {
    if (paywallListError) {
      showErrors(paywallListError);
    }
  }, [paywallListError]);

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
    <SelectPicker
      block
      placeholder={placeholder}
      disabled={disabled}
      className={className}
      name={name}
      value={selectedPaywall}
      data={availablePaywalls}
      onChange={(value, item) => {
        setSelectedPaywall(value);
      }}
    />
  );
}
