import axios from 'axios'

const request = axios.create()

export async function query(
  url: string,
  opts: {
    query?: string
    mutation?: string
    variables?: {[key: string]: any}
  }
): Promise<any> {
  const result = await request.post(url, {
    query: opts.query,
    mutation: opts.mutation,
    variables: opts.variables
  })

  return result.data
}
