import jwt, {SignOptions} from 'jsonwebtoken'

interface GenerateJWTProps {
  issuer: string
  audience: string
  id: string
  expiresInMinutes?: number
  secret: string
}

export const generateJWT = (props: GenerateJWTProps): string => {
  const jwtOptions: SignOptions = {
    issuer: props.issuer,
    audience: props.audience,
    algorithm: 'HS256',
    expiresIn: `${props.expiresInMinutes || 15}m`
  }
  return jwt.sign({sub: props.id}, props.secret, jwtOptions)
}
