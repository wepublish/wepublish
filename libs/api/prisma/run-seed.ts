import { PrismaClient } from '@prisma/client';
import { seed as rootSeed } from './seed';
import { hash as argon2Hash } from '@node-rs/argon2';
import { randomBytes } from 'crypto';

const generateSecureRandomPassword = (length: number) => {
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789._-';
  let password = '';
  const characterCount = characters.length;
  const maxValidValue = 256 - (256 % characterCount);

  while (password.length < length) {
    const randomValue = randomBytes(1)[0];
    if (randomValue < maxValidValue) {
      const index = randomValue % characterCount;
      password += characters.charAt(index);
    }
  }
  return password;
};

export async function runSeed() {
  const prisma = new PrismaClient();
  await prisma.$connect();
  const [adminUserRole, editorUserRole] = await rootSeed(prisma);

  if (!adminUserRole || !editorUserRole) {
    throw new Error('@wepublish/api seeding has not been done');
  }

  const ensureAdminUserWithSetPassword = async (password: string) => {
    const id = 'admin';
    const data = {
      email: 'admin@wepublish.ch',
      name: 'WePublish Admin',
      active: true,
      password: await argon2Hash(password),
      roleIDs: [adminUserRole.id],
    };
    console.log('\x1b[31m\x1b[1m%s\x1b[0m', `Ensuring admin user`);
    await prisma.user.upsert({
      where: { id },
      update: {
        ...data,
      },
      create: {
        id,
        emailVerifiedAt: new Date(),
        ...data,
      },
    });
  };

  const ensureAdminUserWithGeneratedPassword = async () => {
    const admin = await prisma.user.findUnique({ where: { id: 'admin' } });
    if (!admin) {
      const password = generateSecureRandomPassword(20);
      await ensureAdminUserWithSetPassword(password);
      console.log(
        '\x1b[31m\x1b[1m%s\x1b[0m',
        `Bootstrapped initial admin user with password: ${password}`
      );
    } else {
      console.log(
        '\x1b[32m\x1b[1m%s\x1b[0m',
        'Skipping bootstrapping of initial admin user because the user already exist...'
      );
    }
  };

  const setAdminPassword = process.env.OVERRIDE_ADMIN_PW;
  if (setAdminPassword) {
    await ensureAdminUserWithSetPassword(setAdminPassword);
  } else {
    await ensureAdminUserWithGeneratedPassword();
  }

  await prisma.$disconnect();
}

runSeed()
  .then(() => {
    console.log('Seeding applied successfully');
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
