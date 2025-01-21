import axios from 'axios'

export type ReturnTrackingPixels = {
  domain: string
  pixelUid: string[]
}

export class GatewayClient {
  constructor(
    private memberNr: string,
    private username: string,
    private password: string,
    private id: string
  ) {}
  getAuthorizationHeader() {
    return Buffer.from(`${this.memberNr}:${this.username}:${this.password}`).toString('base64')
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
    return {
      domain: 'pl01.owen.prolitteris.ch',
      pixelUid: ['plzm.79c9e1ac-96f1-11e5-85a6-000c29f1f6c4']
    }
    /**
    try {
      const response = await this.httpPostRequest('https://owen.prolitteris.ch/rest/api/1/pixel', {
        amount
      })
      console.log('Server responded with:', response.data)
      return response.data
    } catch (error) {
      throw new Error(`Getting tracking pixel from ${this.id} faild with error ${JSON.stringify(error.response?.data || error.message)}`)
    }**/
  }
}
