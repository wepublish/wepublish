import jwt, {SignOptions} from 'jsonwebtoken'
import {GenerateJWTProps} from '@wepublish/api'

export function utils(): string {
  return 'utils'
}

// https://gist.github.com/mathewbyrne/1280286#gistcomment-2588056
export function slugify(str: string) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[ÀÁÂÃÄÅÆĀĂĄẠẢẤẦẨẪẬẮẰẲẴẶ]/gi, 'a')
    .replace(/[ÇĆĈČ]/gi, 'c')
    .replace(/[ÐĎĐÞ]/gi, 'd')
    .replace(/[ÈÉÊËĒĔĖĘĚẸẺẼẾỀỂỄỆ]/gi, 'e')
    .replace(/[ĜĞĢǴ]/gi, 'g')
    .replace(/[ĤḦ]/gi, 'h')
    .replace(/[ÌÍÎÏĨĪĮİỈỊ]/gi, 'i')
    .replace(/[Ĵ]/gi, 'j')
    .replace(/[Ĳ]/gi, 'ij')
    .replace(/[Ķ]/gi, 'k')
    .replace(/[ĹĻĽŁ]/gi, 'l')
    .replace(/[Ḿ]/gi, 'm')
    .replace(/[ÑŃŅŇ]/gi, 'n')
    .replace(/[ÒÓÔÕÖØŌŎŐỌỎỐỒỔỖỘỚỜỞỠỢǪǬƠ]/gi, 'o')
    .replace(/[Œ]/gi, 'oe')
    .replace(/[ṕ]/gi, 'p')
    .replace(/[ŔŖŘ]/gi, 'r')
    .replace(/[ßŚŜŞŠ]/gi, 's')
    .replace(/[ŢŤ]/gi, 't')
    .replace(/[ÙÚÛÜŨŪŬŮŰŲỤỦỨỪỬỮỰƯ]/gi, 'u')
    .replace(/[ẂŴẀẄ]/gi, 'w')
    .replace(/[ẍ]/gi, 'x')
    .replace(/[ÝŶŸỲỴỶỸ]/gi, 'y')
    .replace(/[ŹŻŽ]/gi, 'z')
    .replace(/[·/_,:;\\']/gi, '-')
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}

export function generateJWT(props: GenerateJWTProps): string {
  if (!process.env['JWT_SECRET_KEY']) throw new Error('No JWT_SECRET_KEY defined in environment.')
  const jwtOptions: SignOptions = {
    issuer: props.hostURL,
    audience: props.audience,
    algorithm: 'HS256',
    expiresIn: `${props.expiresInMinutes || 15}m`
  }
  return jwt.sign({sub: props.id}, process.env['JWT_SECRET_KEY'], jwtOptions)
}
