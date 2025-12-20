import { ApolloError } from '@apollo/client';
import { getApiClientV2, usePaywallListQuery } from '@wepublish/editor/api-v2';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Message, SelectPicker, toaster } from 'rsuite';

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
const showErrors = (error: ApolloError): void => {
  toaster.push(
    <Message
      type="error"
      showIcon
      closable
      duration={3000}
    >
      {error.message}
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

  const client = getApiClientV2();
  const { data: paywallsData } = usePaywallListQuery({
    client,
    fetchPolicy: 'cache-and-network',
    onError: showErrors,
  });

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
