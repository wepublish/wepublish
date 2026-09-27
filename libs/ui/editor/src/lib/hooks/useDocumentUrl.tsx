import { createContext, ReactNode, useContext } from 'react';

const DocumentUrlContext = createContext<string | null | undefined>(undefined);

export interface DocumentUrlProviderProps {
  documentUrl?: string | null;
  children: ReactNode;
}

export function DocumentUrlProvider({
  documentUrl,
  children,
}: DocumentUrlProviderProps) {
  return (
    <DocumentUrlContext.Provider value={documentUrl}>
      {children}
    </DocumentUrlContext.Provider>
  );
}

export function useDocumentUrl(): string | null | undefined {
  return useContext(DocumentUrlContext);
}
