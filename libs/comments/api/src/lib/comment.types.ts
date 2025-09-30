import { Comment, CommentsRevisions, Tag } from '@prisma/client';
import { CalculatedRating } from '@wepublish/api';

export interface CommentWithTags extends Comment {
  tags: { tag: Tag }[];
  calculatedRatings: CalculatedRating[];
  title: string | null;
  lead: string | null;
  text: string | null;
  revisions: CommentsRevisions[];
}
