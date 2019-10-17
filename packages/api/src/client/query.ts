import axios from 'axios'

const request = axios.create()

export class CancelError extends Error {}

export class CancelToken {
  public source = axios.CancelToken.source()

  cancel() {
    this.source.cancel()
  }
}

export interface RequestOptions {
  cancelToken?: CancelToken
}

export interface QueryOptions {
  query?: string
  variables?: {[key: string]: any}
}

export async function query(
  url: string,
  {query = '', variables}: QueryOptions,
  {cancelToken}: RequestOptions = {}
): Promise<any> {
  try {
    const result = await request.post(
      url,
      {
        query,
        variables
      },
      {
        cancelToken: cancelToken && cancelToken.source.token
      }
    )

    return result.data.data
  } catch (err) {
    if (axios.isCancel(err)) throw new CancelError()
    throw err
  }
}
