import { BuilderAuthorChipProps } from '@wepublish/website/builder';

export function HauptstadtAuthorChip({ author, role }: BuilderAuthorChipProps) {
  return role ? `${author.name} (${role})` : author.name;
}
