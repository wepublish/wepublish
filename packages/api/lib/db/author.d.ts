import { RichTextNode } from '../graphql/richText';
export interface AuthorLink {
    title: string;
    url: string;
}
export interface Author {
    id: string;
    createdAt: Date;
    modifiedAt: Date;
    name: string;
    slug: string;
    jobTitle?: string | null;
    imageID?: string | null;
    links: AuthorLink[];
    bio: RichTextNode[];
}
export interface AuthorInput {
    name: string;
    slug: string;
    jobTitle?: string | null;
    imageID?: string | null;
    links: AuthorLink[];
    bio: RichTextNode[];
}
export declare type OptionalAuthor = Author | null;
export declare enum AuthorSort {
    CreatedAt = "createdAt",
    ModifiedAt = "modifiedAt",
    Name = "name"
}
export interface AuthorFilter {
    name?: string;
}
//# sourceMappingURL=author.d.ts.map