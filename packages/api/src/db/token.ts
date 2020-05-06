export interface Token {
  id: string
  name: string
  token: string
}

export interface TokenInput {
  name: string
}

export interface DBTokenAdapter {
  createToken(input: TokenInput): Promise<Token>
  getTokens(): Promise<Token[]>
  deleteToken(id: string): Promise<string | null>
}
