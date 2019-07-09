import fastify from 'fastify'

export interface ServerOptions {
  port?: number
  address?: string

  staticDirPath: string
  clientEntryURL: string
}

export class Server {
  private readonly port: number
  private readonly address: string

  constructor(opts: ServerOptions) {
    this.port = opts.port || 3000
    this.address = opts.address || 'localhost'
  }

  async listen(): Promise<void> {
    const server = fastify()

    server.get('/', async _req => {
      return 'Hello World'
    })

    await server.listen(this.port, this.address)
  }
}
