import { FullBlockFragment } from '@wepublish/editor/api';
import { blockForQueryBlock, BlockValue } from '@wepublish/ui/editor';
import {
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import { TemplatePrefill } from './usePrefillOnce';

export type EditableTemplate<TemplateMetadata> = {
  id: string;
  modifiedAt: string;
  blockTemplate: {
    name: string;
    modifiedAt: string;
    blocks: readonly unknown[];
  };
  metadata: TemplateMetadata;
};

type UseTemplateEditorOptions<Metadata, TemplateMetadata> = {
  emptyMetadata: Metadata;
  initialBlocks: BlockValue[];
  /** The queried template; its values replace the state on every new revision. */
  template: EditableTemplate<TemplateMetadata> | null | undefined;
  toMetadata(metadata: TemplateMetadata): Partial<Metadata>;
};

/**
 * State of an article or page template editor: name, blocks and metadata,
 * whether they changed since the last save, and the hydration from the
 * queried template.
 */
export function useTemplateEditor<Metadata, TemplateMetadata>({
  emptyMetadata,
  initialBlocks,
  template,
  toMetadata,
}: UseTemplateEditorOptions<Metadata, TemplateMetadata>) {
  const [hasChanged, setChanged] = useState(false);
  const [name, setName] = useState('');
  const [blocks, setBlocks] = useState<BlockValue[]>(initialBlocks);
  const [metadata, setMetadata] = useState<Metadata>(emptyMetadata);

  const changeName = useCallback((name: string) => {
    setName(name);
    setChanged(true);
  }, []);

  const changeBlocks = useCallback((blocks: SetStateAction<BlockValue[]>) => {
    setBlocks(blocks);
    setChanged(true);
  }, []);

  const changeMetadata = useCallback((metadata: Metadata) => {
    setMetadata(metadata);
    setChanged(true);
  }, []);

  const applyPrefill = useCallback(
    ({ name, blocks, metadata }: TemplatePrefill<Partial<Metadata>>) => {
      setName(name);
      setBlocks(blocks);
      setMetadata(meta => ({ ...meta, ...metadata }));
      setChanged(true);
    },
    []
  );

  const hydratedRevision = useRef<string | null>(null);

  useEffect(() => {
    if (!template) {
      return;
    }

    const revision = `${template.id}:${template.modifiedAt}:${template.blockTemplate.modifiedAt}`;

    if (hydratedRevision.current === revision) {
      return;
    }

    hydratedRevision.current = revision;

    setName(template.blockTemplate.name);
    setBlocks(
      (template.blockTemplate.blocks as FullBlockFragment[]).map(
        blockForQueryBlock
      )
    );
    setMetadata({ ...emptyMetadata, ...toMetadata(template.metadata) });
    // Only a new revision of the template replaces the state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template]);

  return {
    name,
    changeName,
    blocks,
    changeBlocks,
    metadata,
    setMetadata,
    changeMetadata,
    hasChanged,
    setChanged,
    applyPrefill,
  };
}
