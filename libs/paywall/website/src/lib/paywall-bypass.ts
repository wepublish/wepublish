const BYPASS_STORAGE_KEY = 'paywall_bypass_token'
const BYPASS_EXPIRY_HOURS = 4

interface BypassTokenData {
  token: string
  expiresAt: number
}

export class PaywallBypassService {
  private static getStoredToken(): BypassTokenData | null {
    try {
      const stored = localStorage.getItem(BYPASS_STORAGE_KEY)
      if (!stored) {
        return null
      }

      const tokenData: BypassTokenData = JSON.parse(stored)

      if (tokenData.expiresAt <= Date.now()) {
        localStorage.removeItem(BYPASS_STORAGE_KEY)
        return null
      }

      return tokenData
    } catch {
      localStorage.removeItem(BYPASS_STORAGE_KEY)
      return null
    }
  }

  static storeBypassToken(token: string): void {
    const expiresAt = Date.now() + BYPASS_EXPIRY_HOURS * 60 * 60 * 1000
    const tokenData: BypassTokenData = {token, expiresAt}

    localStorage.setItem(BYPASS_STORAGE_KEY, JSON.stringify(tokenData))
  }

  static hasValidBypass(validTokens: string[]): boolean {
    const tokenData = this.getStoredToken()
    return tokenData?.token ? validTokens.includes(tokenData.token) : false
  }
}
