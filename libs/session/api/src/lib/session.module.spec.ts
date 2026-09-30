import { AUDIENCE_JWT_SERVICE } from '@wepublish/authentication/api';
import { SessionModule } from './session.module';
import { JwtService } from './jwt.service';

describe('SessionModule', () => {
  it('provides the jwt service for audience bound tokens', () => {
    const dynamicModule = SessionModule.registerAsync({
      useFactory: () => ({
        sessionTTL: 1,
        jwtPrivateKey: '',
        jwtPublicKey: '',
        hostURL: '',
        websiteURL: '',
      }),
    });

    expect(dynamicModule.providers).toContainEqual({
      provide: AUDIENCE_JWT_SERVICE,
      useExisting: JwtService,
    });
    expect(dynamicModule.exports).toContain(AUDIENCE_JWT_SERVICE);
  });
});
