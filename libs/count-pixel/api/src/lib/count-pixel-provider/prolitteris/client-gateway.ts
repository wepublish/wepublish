import axios from 'axios'

export type ReturnTrackingPixels = {
  domain: string
  pixelUid: string[]
}

export class GatewayClient {
  constructor(private memberNr: string, private userName: string, private password: string) {}
  getAuthorizationHeader() {
    return Buffer.from(`${this.memberNr}:${this.userName}:${this.password}`).toString('base64')
  }

  async httpPostRequest(url: string, body: any) {
    return await axios.post(url, body, {
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        Authorization: `OWEN ${this.getAuthorizationHeader()}`
      }
    })
  }

  async getTrackingPixels(amount: number): Promise<ReturnTrackingPixels> {
    try {
      const response = await this.httpPostRequest('https://owen.prolitteris.ch/rest/api/1/pixel', {
        amount
      })
      console.log('Server responded with:', response.data)
      return response.data
    } catch (error) {
      console.error('Request failed:', error.response?.data || error.message)
      throw error
    }
  }
}
