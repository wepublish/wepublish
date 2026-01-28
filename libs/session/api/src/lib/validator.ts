import z from 'zod';

export class Validator {
  static createUser = z.object({
    email: z.string().email(),
    name: z.string().max(50),
    firstName: z.string().max(50).optional(),
    birthday: z.coerce
      .date()
      .refine(data => new Date() > data, {
        path: ['birthday'],
        message: 'Birthday can not be in the future',
      })
      .optional(),
  });

  static login = z.object({
    email: z.string().email(),
  });
}
