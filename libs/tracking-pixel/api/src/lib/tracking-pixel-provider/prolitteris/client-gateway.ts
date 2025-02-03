import axios from 'axios'
import {ProLitterisGenerator, ReturnTrackingPixels} from './types'

export class GatewayClient implements ProLitterisGenerator {
  constructor(private memberNr: string, private username: string, private password: string) {}
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

  async getTrackingPixels(internalTrackingId: string): Promise<ReturnTrackingPixels> {
    try {
      const response = await this.httpPostRequest('https://owen.prolitteris.ch/rest/api/1/pixel', {
        amount: 1
      })
      return response.data
    } catch (error) {
      throw new Error(
        `Getting tracking pixel failed with error: ${JSON.stringify(
          error.response?.data || error.message
        )}`
      )
    }
  }
}
