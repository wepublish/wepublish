import crypto from 'crypto';
import qs from 'qs';
import fetch, { Response } from 'node-fetch';

export type PayrexxSuccessResponse<Data = any> = {
  status: 'success';
  data: Data;
};

export type PayrexxErrorResponse = {
  status: 'error';
  message: string;
};

export type PayrexxResponse<Data = any> =
  | PayrexxSuccessResponse<Data>
  | PayrexxErrorResponse;

export class PayrexxClient {
  constructor(
    private baseUrl: string,
    private instance: string,
    private secret: string
  ) {}

  private buildSignedQueryString(queryParams = {}) {
    return qs.stringify({
      ...queryParams,
      ApiSignature: crypto
        .createHmac('sha256', this.secret)
        .update(qs.stringify(queryParams))
        .digest('base64'),
    });
  }

  private buildBaseUrl(path: string) {
    return `${this.baseUrl}${path}?instance=${this.instance}`;
  }

  async get<Data = any>(
    path: string,
    queryParams = {}
  ): Promise<PayrexxResponse<Data>> {
    const method = 'GET',
      queryStrSigned = this.buildSignedQueryString(queryParams),
      baseUrl = `${this.buildBaseUrl(path)}&${queryStrSigned}`;
    const response = await fetch(baseUrl, { method });

    return await this.validateResponse(response);
  }

  async post<Data = any>(
    path: string,
    queryParams = {}
  ): Promise<PayrexxResponse<Data>> {
    const method = 'POST',
      body = this.buildSignedQueryString(queryParams),
      baseUrl = this.buildBaseUrl(path);
    const response = await fetch(baseUrl, { method, body });

    return await this.validateResponse(response);
  }

  private async validateResponse(response: Response) {
    if (response.status !== 200) {
      throw new Error(`Payrexx response is NOK with status ${response.status}`);
    }
    return await response.json();
  }
}
