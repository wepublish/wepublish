import { Prisma, PrismaClient, UserEvent } from '@prisma/client';
import { hashPassword } from '../../db/user';
import { unselectPassword } from '@wepublish/authentication/api';
import { Context } from '../../context';
import { Validator } from '../../validator';
import { mailLogType } from '@wepublish/mail/api';

export type CreateUserInput = Prisma.UserUncheckedCreateInput &
  Partial<{
    properties: Prisma.MetadataPropertyUncheckedCreateWithoutUserInput[];
    address: Prisma.UserAddressUncheckedCreateWithoutUserInput | null;
  }>;

export const createUser = async (
  { properties, address, password, ...input }: CreateUserInput,
  hashCostFactor: Context['hashCostFactor'],
  prisma: PrismaClient,
  mailContext: Context['mailContext']
) => {
  const hashedPassword = await hashPassword(password, hashCostFactor);
  input.email = input.email.toLowerCase();
  await Validator.createUser.parse(input);
  await Validator.createAddress.parse(address);

  const recipient = await prisma.user.create({
    data: {
      ...input,
      password: hashedPassword,
      properties: {
        createMany: {
          data: properties ?? [],
        },
      },
      address: {
        create: address ?? {},
      },
    },
    select: unselectPassword,
  });

  // send register mail
  const externalMailTemplateId = await mailContext.getUserTemplateName(
    UserEvent.ACCOUNT_CREATION,
    false
  );

  await mailContext.sendMail({
    externalMailTemplateId,
    recipient,
    optionalData: {},
    mailType: mailLogType.SystemMail,
  });

  return recipient;
};
