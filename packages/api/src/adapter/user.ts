export interface User {
  readonly id: string
  readonly email: string
}

export interface Session {
  readonly user: User
  readonly token: string
  readonly expiryDate: Date
}
