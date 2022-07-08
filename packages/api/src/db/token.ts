export interface Token {
  id: string
  name: string
  token: string
  roleIDs: string[]
}

export interface TokenInput {
  name: string
  roleIDs: string[]
}

export interface DBTokenAdapter {
  createToken(input: TokenInput): Promise<Token>
}
