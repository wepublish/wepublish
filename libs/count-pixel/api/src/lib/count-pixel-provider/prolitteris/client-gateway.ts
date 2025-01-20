export class GatewayClient {
  constructor(private memberNr: string, private userName: string, private password: string) {}
  getAuthorizationHeader() {
    return Buffer.from(`${this.memberNr}:${this.userName}:${this.password}`).toString('base64')
  }
}
