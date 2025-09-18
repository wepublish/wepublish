import { AuthGuard } from '@nestjs/passport';

export class TokenAuthGuard extends AuthGuard('token') {}
