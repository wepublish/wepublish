import { describeMailchimpError } from './mailchimp-error';

// Bodies as Mailchimp answered on 2026-10-09, with `type` and `instance` left
// out and the email addresses made up.
const answers: [string, object, string][] = [
  [
    'a fake looking email',
    {
      title: 'Invalid Resource',
      status: 400,
      detail:
        'jane.doe@gmail.vom looks fake or invalid, please enter a real email address.',
    },
    'Invalid Resource: jane.doe@gmail.vom looks fake or invalid, please enter a real email address.',
  ],
  [
    'an invalid email',
    {
      title: 'Invalid Resource',
      status: 400,
      detail: 'Please provide a valid email address.',
    },
    'Invalid Resource: Please provide a valid email address.',
  ],
  [
    'a permanently deleted email',
    {
      title: 'Forgotten Email Not Subscribed',
      status: 400,
      detail:
        'jane.doe@example.com was permanently deleted and cannot be re-imported. The contact must re-subscribe to get back on the list.',
    },
    'Forgotten Email Not Subscribed: jane.doe@example.com was permanently deleted and cannot be re-imported. The contact must re-subscribe to get back on the list.',
  ],
  [
    'a missing merge field',
    {
      title: 'Invalid Resource',
      status: 400,
      detail: 'Your merge fields were invalid.',
      errors: [{ field: 'LASTNAME', message: 'Bitte gib einen Wert ein.' }],
    },
    'Invalid Resource: Your merge fields were invalid. (LASTNAME: Bitte gib einen Wert ein.)',
  ],
  [
    'a rename onto an email that is taken',
    {
      title: 'Invalid Resource',
      status: 400,
      detail:
        "The resource submitted could not be validated. For field-specific details, see the 'errors' array.",
      errors: [
        {
          field: 'email address',
          message:
            '"jane.doe@example.com" is already in this list with a status of "Deleted".',
        },
      ],
    },
    `Invalid Resource: The resource submitted could not be validated. For field-specific details, see the 'errors' array. (email address: "jane.doe@example.com" is already in this list with a status of "Deleted".)`,
  ],
];

describe('describeMailchimpError', () => {
  it.each(answers)(
    'reads what Mailchimp answers for %s',
    (_, body, description) => {
      // How the Mailchimp SDK rejects
      const error = Object.assign(new Error('Bad Request'), {
        status: 400,
        response: { body },
      });

      expect(describeMailchimpError(error)).toBe(description);
    }
  );

  it('lists a field error without a field by its message', () => {
    expect(
      describeMailchimpError({
        response: {
          body: {
            title: 'Invalid Resource',
            detail: 'The resource submitted could not be validated.',
            errors: [
              { field: '', message: 'Schema describes object, NULL found' },
            ],
          },
        },
      })
    ).toBe(
      'Invalid Resource: The resource submitted could not be validated. (Schema describes object, NULL found)'
    );
  });

  it('describes anything else like any other error', () => {
    expect(describeMailchimpError(new Error('socket hang up'))).toBe(
      'socket hang up'
    );
  });
});
