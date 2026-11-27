const text = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

const record = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' && !Array.isArray(value) ?
    (value as Record<string, unknown>)
  : null;

/**
 * What the provider said about a mail that did not get through, read from
 * the payload kept in `mailData`: Mandrill's bounce description and the
 * receiving server's answer, or Mailgun's delivery status. Null when the
 * payload says nothing of the kind. The log's state alone cannot tell a full
 * mailbox from one that does not exist.
 */
export const bounceReasonOf = (
  mailData: string | null | undefined
): string | null => {
  if (!mailData) {
    return null;
  }

  let payload: Record<string, unknown> | null;

  try {
    payload = record(JSON.parse(mailData));
  } catch {
    return null;
  }

  if (!payload) {
    return null;
  }

  // A Mandrill webhook event wraps the message; a polled one is the message.
  const message = record(payload['msg']) ?? payload;
  const mandrill = [
    text(message['bounce_description']),
    text(message['diag']),
  ].filter(Boolean);

  if (mandrill.length) {
    return mandrill.join(': ');
  }

  const deliveryStatus = record(payload['delivery-status']);

  return (
    text(deliveryStatus?.['description']) ??
    text(deliveryStatus?.['message']) ??
    text(payload['reason'])
  );
};
