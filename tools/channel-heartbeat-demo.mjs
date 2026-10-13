/**
 * Local end-to-end test of the CMS -> One secure channel.
 *
 *   node channel-heartbeat-demo.mjs            # happy path
 *   node channel-heartbeat-demo.mjs --bad-aud  # wrong audience  -> must 403
 *   node channel-heartbeat-demo.mjs --bad-iss  # unknown issuer  -> must 403
 *   node channel-heartbeat-demo.mjs --bad-key  # forged signature-> must 403
 *
 * Stands in for a medium's CMS: serves its JWKS on :4000 and posts a signed
 * heartbeat to One on :8055. Run from the wepublish repo so `jose` resolves.
 */
import { createServer } from 'node:http'
import { createHash, createPublicKey, generateKeyPairSync } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { SignJWT, importPKCS8 } from 'jose'

const MODE = process.argv[2] ?? ''
const CMS_ORIGIN = 'http://localhost:4000'
const ONE_URL = 'http://localhost:8055'

const env = Object.fromEntries(
  readFileSync('.env', 'utf8')
    .split('\n')
    .filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => {
      const i = l.indexOf('=')
      return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, '').replace(/\\n/g, '\n')]
    })
)

let privatePem = env.JWT_PRIVATE_KEY
let publicPem = env.JWT_PUBLIC_KEY

if (MODE === '--bad-key') {
  const forged = generateKeyPairSync('ed25519', {
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  })
  privatePem = forged.privateKey
}

function computeKid(jwk) {
  const members =
    jwk.kty === 'OKP'
      ? { crv: jwk.crv, kty: jwk.kty, x: jwk.x }
      : { crv: jwk.crv, kty: jwk.kty, x: jwk.x, y: jwk.y }
  return createHash('sha256').update(JSON.stringify(members)).digest('base64url')
}

const publicJwk = createPublicKey({ key: publicPem, format: 'pem' }).export({ format: 'jwk' })
const kid = computeKid(publicJwk)

const server = createServer((req, res) => {
  if (req.url === '/.well-known/jwks.json') {
    res.writeHead(200, { 'content-type': 'application/json' })
    res.end(JSON.stringify({ keys: [{ ...publicJwk, use: 'sig', alg: 'EdDSA', kid }] }))
    return
  }
  res.writeHead(404).end()
})

await new Promise((r) => server.listen(4000, r))
console.log(`CMS JWKS mock listening on ${CMS_ORIGIN}/.well-known/jwks.json`)

const token = await new SignJWT({ scope: 'write:medium-heartbeat' })
  .setProtectedHeader({ alg: 'EdDSA', kid })
  .setSubject('wepublish-api')
  .setIssuer(MODE === '--bad-iss' ? 'http://localhost:9999' : CMS_ORIGIN)
  .setAudience(MODE === '--bad-aud' ? 'https://someone-else.example' : ONE_URL)
  .setExpirationTime('2m')
  .sign(await importPKCS8(privatePem, 'EdDSA'))

const res = await fetch(`${ONE_URL}/channel/heartbeat`, {
  method: 'POST',
  headers: { 'x-wepublish-channel-token': token, 'content-type': 'application/json' },
  body: JSON.stringify({ version: 'local-demo-abc1234', gitSha: 'abc1234' })
})

const expected = MODE === '' ? 204 : 403
console.log(`mode=${MODE || 'happy-path'}  status=${res.status}  expected=${expected}`)
console.log(res.status === expected ? 'PASS' : 'FAIL')

server.close()
process.exit(res.status === expected ? 0 : 1)
