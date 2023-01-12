import { Context } from '../../context';
import { PrismaClient, Prisma } from '@prisma/client';
export declare const deleteNavigationById: (id: string, authenticate: Context['authenticate'], navigation: PrismaClient['navigation']) => Prisma.Prisma__NavigationClient<import(".prisma/client").Navigation & {
    links: import(".prisma/client").NavigationLink[];
}>;
declare type CreateNavigationInput = Omit<Prisma.NavigationUncheckedCreateInput, 'links' | 'modifiedAt'> & {
    links: Prisma.NavigationLinkUncheckedCreateWithoutNavigationInput[];
};
export declare const createNavigation: ({ links, ...input }: CreateNavigationInput, authenticate: Context['authenticate'], navigation: PrismaClient['navigation']) => Prisma.Prisma__NavigationClient<import(".prisma/client").Navigation & {
    links: import(".prisma/client").NavigationLink[];
}>;
declare type UpdateNavigationInput = Omit<Prisma.NavigationUncheckedUpdateInput, 'links' | 'modifiedAt' | 'createdAt'> & {
    links: Prisma.NavigationLinkUncheckedCreateWithoutNavigationInput[];
};
export declare const updateNavigation: (id: string, { links, ...input }: UpdateNavigationInput, authenticate: Context['authenticate'], navigation: PrismaClient['navigation']) => Promise<import(".prisma/client").Navigation & {
    links: import(".prisma/client").NavigationLink[];
}>;
export {};
//# sourceMappingURL=navigation.private-mutation.d.ts.map