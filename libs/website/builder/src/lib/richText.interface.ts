import { PropsWithChildren } from 'react';
import {
  RichtextJSONDocument,
  RichtextElements,
  RichtextMarks,
} from '@wepublish/richtext';

export type BuilderRenderRichtextProps = {
  document: RichtextJSONDocument | null | undefined;
};

export type BuilderRenderElementProps = {
  element: RichtextElements;
};

export type BuilderRenderLeafProps = PropsWithChildren<{
  mark: RichtextMarks;
}>;
