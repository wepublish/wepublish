import { Injectable } from '@nestjs/common';
import { UserDataloaderService } from '@wepublish/user/api';
import { JwtService } from './jwt.service';

@Injectable()
export class JwtAuthenticationService {
  constructor(
    private jwtService: JwtService,
    private userDataloaderService: UserDataloaderService
  ) {}

  async authenticateUserWithJWT(jwt: string) {
    const userId = await this.jwtService.verifyJWT(jwt);
    return this.userDataloaderService.load(userId);
  }
}
