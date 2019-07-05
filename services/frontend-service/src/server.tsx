import fastify from 'fastify'

const server = fastify()

server.get('*', () => {})
server.listen(3000, '0.0.0.0')
