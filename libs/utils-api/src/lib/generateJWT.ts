import jwt, {SignOptions} from 'jsonwebtoken'

interface GenerateJWTProps {
  issuer: string
  audience: string
  id: string
  expiresInMinutes?: number
}

export const generateJWT = (props: GenerateJWTProps): string => {
  if (!process.env['JWT_SECRET_KEY']) throw new Error('No JWT_SECRET_KEY defined in environment.')
  const jwtOptions: SignOptions = {
    issuer: props.issuer,
    audience: props.audience,
    algorithm: 'HS256',
    expiresIn: `${props.expiresInMinutes || 15}m`
  }
  return jwt.sign({sub: props.id}, process.env['JWT_SECRET_KEY'], jwtOptions)
}
