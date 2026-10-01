// The anonymous signup of the we.publish website, as used by
// abos.neuewege.ch/mitmachen (libs/block-content/website/src/lib/subscribe/
// subscribe-block.tsx and libs/payment/website/src/lib/handle-payment.tsx):
// register the member (captcha required), then create the subscription with
// the new session and follow the returned payment.
import { gql } from '@apollo/client';

import { wepublishQuery } from './client';

// The form's configuration: the SubscribeBlock and its member plans as one
// JSON leaf. Answered by the we.publish link (resolvers.js), so SSR prefetches
// it like every other query of the page.
export const SubscribeBlockQuery = gql`
  query SubscribeBlockQuery($ref: String!) {
    subscribeBlock(ref: $ref) {
      ref
      config
    }
  }
`;

export const CHALLENGE = `query Challenge { challenge { type challengeID validUntil } }`;

const REGISTER = `
  mutation Register($name: String!, $firstName: String, $email: String!, $password: String,
    $birthday: DateTime, $address: UserAddressInput, $challengeAnswer: ChallengeInput!) {
    registerMember(name: $name, firstName: $firstName, email: $email, password: $password,
      birthday: $birthday, address: $address, challengeAnswer: $challengeAnswer) {
      session { token }
    }
  }
`;

const SUBSCRIBE = `
  mutation Subscribe($memberPlanId: String, $paymentMethodId: String, $paymentPeriodicity: PaymentPeriodicity!,
    $monthlyAmount: Float!, $autoRenew: Boolean!, $goodieId: String, $discountCode: String,
    $successURL: String, $failureURL: String) {
    createUserSubscription(memberPlanID: $memberPlanId, paymentMethodID: $paymentMethodId,
      paymentPeriodicity: $paymentPeriodicity, monthlyAmount: $monthlyAmount, autoRenew: $autoRenew,
      goodieId: $goodieId, discountCode: $discountCode, successURL: $successURL, failureURL: $failureURL) {
      id state intentSecret
    }
  }
`;

export const fetchChallenge = async () =>
  (await wepublishQuery(CHALLENGE))?.challenge ?? null;

// handle-payment.tsx `relativeToAbsolute`: payment providers need absolute
// return URLs; they point back into the clone, which renders the plan's
// success/fail page of we.publish in its overlay
const pageUrl = page =>
  page?.slug ? `${window.location.origin}/${page.slug}` : null;

// → { type: 'redirect', url } | { type: 'done', url } (url may be null)
export async function subscribe({ plan, register, subscription }) {
  const registration = await wepublishQuery(REGISTER, register);
  const token = registration?.registerMember?.session?.token;
  if (!token) throw new Error('registerMember returned no session');

  const successURL = pageUrl(plan.successPage);
  const failureURL = pageUrl(plan.failPage);
  const data = await wepublishQuery(
    SUBSCRIBE,
    { ...subscription, successURL, failureURL },
    { token }
  );
  const payment = data?.createUserSubscription;

  // handle-payment.tsx `handlePayment`: no payment → error; paid or no intent
  // secret (invoice) → success; an http intent secret (Payrexx & co.) → the
  // provider's payment page. Stripe's inline card form is not ported.
  if (!payment) throw new Error('createUserSubscription returned no payment');
  if (payment.state !== 'paid' && payment.intentSecret?.startsWith('http')) {
    return { type: 'redirect', url: payment.intentSecret };
  }
  return { type: 'done', url: successURL };
}

export const isEmailInUse = error =>
  /already in use/i.test(error?.message || '');
