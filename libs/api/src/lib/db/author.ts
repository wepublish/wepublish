import { RichtextJSONDocument } from '@wepublish/richtext';

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
  bio: RichtextJSONDocument;
  peerId?: string | null;
}

export interface AuthorInput {
  name: string;
  slug: string;
  jobTitle?: string | null;
  imageID?: string | null;
  links: AuthorLink[];
  bio: RichtextJSONDocument;
}

export type OptionalAuthor = Author | null;

export enum AuthorSort {
  CreatedAt = 'CreatedAt',
  ModifiedAt = 'ModifiedAt',
  Name = 'Name',
}

export interface AuthorFilter {
  name?: string;
  tagIds?: string[];
  hideOnTeam?: boolean;
}
