import {
  createCipheriv,
  createDecipheriv,
  hkdfSync,
  randomBytes,
} from 'crypto';

export type EncryptedPayload = string | null;

export class SecretCrypto {
  // Change these if you want different domain separation
  private static readonly INFO = Buffer.from(
    'api-credential-aes-256-gcm',
    'utf8'
  );
  private static readonly SALT_PREFIX = 'wepublish-credentials-salt';
  private masterSecret: string;
  private keyVersion: number;

  constructor() {
    const secret = process.env['APP_SECRET_KEY'];
    if (!secret || secret.length < 16) {
      throw new Error(
        'APP_SECRET_KEY is missing or too short (must be >= 16 characters)'
      );
    }
    this.masterSecret = secret;

    const parsedVersion = Number.parseInt(
      process.env['APP_SECRET_KEY_VERSION'] ?? '',
      10
    );
    this.keyVersion =
      Number.isInteger(parsedVersion) && parsedVersion > 0 ? parsedVersion : 1;
    if (!Number.isInteger(this.keyVersion) || this.keyVersion <= 0) {
      throw new Error(
        'SecretCrypto.encrypt: keyVersion must be a positive integer'
      );
    }
    if (!this.masterSecret || this.masterSecret.length < 16) {
      throw new Error('SecretCrypto: masterSecret must be >= 16 characters');
    }
  }
  encrypt(plaintext: string): EncryptedPayload {
    if (typeof plaintext !== 'string' || plaintext.length === 0) {
      throw new Error(
        'SecretCrypto.encrypt: plaintext must be a non-empty string'
      );
    }

    const key = this.deriveAesKey(this.keyVersion);
    const iv = randomBytes(12); // 96-bit nonce is recommended for GCM

    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const ciphertext = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag(); // 16 bytes

    return [
      `v${this.keyVersion}`,
      iv.toString('base64'),
      tag.toString('base64'),
      ciphertext.toString('base64'),
    ].join('.');
  }

  decrypt(payload: EncryptedPayload): string {
    if (typeof payload !== 'string' || payload.length === 0) {
      throw new Error(
        'SecretCrypto.decrypt: payload must be a non-empty string'
      );
    }

    const parts = payload.split('.');
    if (parts.length !== 4) {
      throw new Error('SecretCrypto.decrypt: invalid payload format');
    }

    const [versionPart, ivB64, tagB64, ctB64] = parts;

    const match = /^v(\d+)$/.exec(versionPart);
    if (!match) throw new Error('SecretCrypto.decrypt: invalid version prefix');
    const keyVersion = Number(match[1]);
    if (!Number.isInteger(keyVersion) || keyVersion <= 0) {
      throw new Error('SecretCrypto.decrypt: invalid keyVersion');
    }

    const iv = Buffer.from(ivB64, 'base64');
    const tag = Buffer.from(tagB64, 'base64');
    const ciphertext = Buffer.from(ctB64, 'base64');

    if (iv.length !== 12)
      throw new Error('SecretCrypto.decrypt: invalid IV length');
    if (tag.length !== 16)
      throw new Error('SecretCrypto.decrypt: invalid auth tag length');

    const key = this.deriveAesKey(keyVersion);

    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);

    const plaintext = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);

    return plaintext.toString('utf8');
  }

  private deriveAesKey(keyVersion: number): Buffer {
    const salt = Buffer.from(
      `${SecretCrypto.SALT_PREFIX}-v${keyVersion}`,
      'utf8'
    );

    const key = hkdfSync(
      'sha256',
      Buffer.from(this.masterSecret, 'utf8'),
      salt,
      SecretCrypto.INFO,
      32
    );
    return Buffer.isBuffer(key) ? key : Buffer.from(key);
  }

  static getVersion(payload: EncryptedPayload): number {
    if (payload === null) {
      throw new Error('SecretCrypto.getVersion: invalid payload');
    }
    const versionPart = payload.split('.', 1)[0] ?? '';
    const match = /^v(\d+)$/.exec(versionPart);
    if (!match)
      throw new Error('SecretCrypto.getVersion: invalid payload version');
    return Number(match[1]);
  }
}
