import {
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import { useWebsiteBuilder } from '@wepublish/website/builder';
import { SyntheticEvent, useCallback, useState } from 'react';
import { Modal } from '@mui/material';
import styled from '@emotion/styled';

export type StripePaymentProps = {
  onClose(success: boolean): void;
};

const StripePaymentModalWrapper = styled('section')`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 95lvw;
  max-width: 800px;
  max-height: 95lvh;
  overflow-y: auto;
  background-color: ${({ theme }) => theme.palette.background.paper};
  box-shadow: ${({ theme }) => theme.shadows[24]};
  padding: ${({ theme }) => theme.spacing(2)};
  display: grid;
  gap: ${({ theme }) => theme.spacing(3)};
`;

const StripePaymentModalContent = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};
  padding: ${({ theme }) => theme.spacing(2)};
  padding-bottom: 0;
`;

const StripePaymentModalActions = styled('div')`
  display: flex;
  justify-content: end;
  gap: ${({ theme }) => theme.spacing(3)};
`;

export function StripePayment({ onClose }: StripePaymentProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [errorMessage, setErrorMessage] = useState<string>();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const {
    elements: { Button },
  } = useWebsiteBuilder();

  const handlePayment = useCallback(
    async (event: SyntheticEvent) => {
      setIsLoading(true);
      event.preventDefault();

      if (!stripe || !elements) {
        return; // TODO: do we need to show an error?
      }

      try {
        const { error } = await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: window.location.href,
          },
          redirect: 'if_required',
        });

        if (error) {
          setErrorMessage(error.message);
        } else {
          onClose(true);
        }
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : (error as string)
        );
        onClose(false);
      }

      setIsLoading(false);
    },
    [elements, onClose, stripe]
  );

  return (
    <Modal
      open={true}
      onClose={() => onClose(false)}
    >
      <form onSubmit={handlePayment}>
        <StripePaymentModalWrapper>
          <StripePaymentModalContent>
            <PaymentElement onReady={() => setIsLoading(false)} />

            {errorMessage && <div>{errorMessage}</div>}
          </StripePaymentModalContent>

          <StripePaymentModalActions>
            <Button
              variant="text"
              color="secondary"
              onClick={() => onClose(false)}
            >
              Abbrechen
            </Button>

            <Button
              type="submit"
              disabled={!stripe || isLoading}
            >
              Bezahlen
            </Button>
          </StripePaymentModalActions>
        </StripePaymentModalWrapper>
      </form>
    </Modal>
  );
}
