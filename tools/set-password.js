#!/usr/bin/env node
/**
 * Sets a user's password directly in the local database and disables 2FA,
 * so the user can log in with just the password.
 *
 * Usage: npm run set-password -- <email> <password>
 * Example: npm run set-password -- admin@wepublish.ch 12345678
 */
const { hashSync } = require('@node-rs/argon2');
const { readFileSync } = require('fs');
const { join } = require('path');
const { Client } = require('pg');

const [email, password] = process.argv.slice(2);

if (!email || !password) {
  console.error('Usage: npm run set-password -- <email> <password>');
  process.exit(1);
}

const databaseUrl = (
  process.env.DATABASE_URL ??
  readFileSync(join(__dirname, '..', '.env'), 'utf-8').match(
    /^DATABASE_URL=(.*)$/m
  )?.[1] ??
  ''
).trim();

if (!databaseUrl) {
  console.error('No DATABASE_URL found in the environment or in .env');
  process.exit(1);
}

async function main() {
  // same hashing as UserService.hashPassword() / the prisma seed
  const hash = hashSync(password);
  const client = new Client({ connectionString: databaseUrl });

  await client.connect();

  try {
    // totpExempt keeps the editor from forcing a new 2FA setup on next login
    const { rows } = await client.query(
      `UPDATE users
          SET password = $1,
              "totpSecret" = NULL,
              "totpEnabled" = false,
              "totpExempt" = true,
              "modifiedAt" = now()
        WHERE lower(email) = $2
    RETURNING id, email`,
      [hash, email.toLowerCase()]
    );

    if (!rows.length) {
      console.error(`No user found with email ${email}`);
      process.exitCode = 1;
      return;
    }

    console.log(
      `Updated password of ${rows[0].email} (${rows[0].id}) and disabled 2FA`
    );
  } finally {
    await client.end();
  }
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
