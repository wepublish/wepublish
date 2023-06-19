import z from 'zod'

export class Validator {
  static createUser() {
    return z.object({
      email: z.string().email(),
      name: z.string().max(50),
      firstName: z.string().max(50).optional(),
      preferredName: z.string().max(50).optional()
    })
  }

  static login() {
    return z.object({
      email: z.string().email()
    })
  }
}
