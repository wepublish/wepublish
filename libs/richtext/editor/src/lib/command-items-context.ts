import { createContext } from 'react';
import { CommandItem } from './editor/extensions/commands';

/**
 * Slash commands an integration contributes to every richtext editor below
 * the provider. The article editor provides them; RichTextBlock reads them
 * and hands them to RichtextEditor. Default: nothing contributed.
 */
export const RichtextCommandItemsContext = createContext<CommandItem[]>([]);
