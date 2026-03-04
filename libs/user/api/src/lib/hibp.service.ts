import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { createHash } from 'crypto';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class HibpService {
  private logger = new Logger('HibpService');

  constructor(private httpService: HttpService) {}

  /**
   * Checks if a password has been seen in data breaches using the
   * HIBP k-Anonymity API. Only a 5-char SHA-1 prefix is sent to the API,
   * so the full password never leaves the server.
   *
   * Returns true if the password has been compromised.
   * Falls back to false (allow) if the API is unreachable.
   */
  async isPasswordPwned(password: string): Promise<boolean> {
    const sha1 = createHash('sha1')
      .update(password)
      .digest('hex')
      .toUpperCase();
    const prefix = sha1.substring(0, 5);
    const suffix = sha1.substring(5);

    try {
      const { data } = await firstValueFrom(
        this.httpService.get<string>(
          `https://api.pwnedpasswords.com/range/${prefix}`,
          { timeout: 5000, responseType: 'text' }
        )
      );

      return data.split('\n').some(line => {
        const [hash] = line.split(':');
        return hash.trim() === suffix;
      });
    } catch (error) {
      this.logger.warn(
        'HIBP API unreachable, allowing password without breach check',
        error instanceof Error ? error.message : error
      );
      return false;
    }
  }
}
