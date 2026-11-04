import { useMutation } from '@apollo/client/react';
import { Button } from '@mui/material';
import {
  DocumentDocument,
  DocumentListDocument,
  DocumentStorageUsageDocument,
  UpdateDocumentDocument,
  UploadDocumentDocument,
} from '@wepublish/editor/api';
import {
  FormDrawer,
  FormDrawerPanel,
  useCreateForm,
  useEditForm,
  useQueryLoader,
  useRouteDrawer,
} from '@wepublish/form/editor';
import { CanCreateDocument } from '@wepublish/permissions';
import { DocumentUploadPanel } from '@wepublish/ui/editor';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  type DocumentFile,
  fileOfDocument,
  fileOfUpload,
  fromDocument,
  toUpdateDocumentVariables,
  toUploadDocumentVariables,
} from './document.schema';
import { documentRoutes, documentView } from './document.view';
import { DocumentFileContext } from './documentFileDetails';

const writePermissions = [CanCreateDocument.id];

type DocumentUploadFormProps = {
  file: File;
  onReplace: () => void;
};

export function DocumentUploadForm({
  file,
  onReplace,
}: DocumentUploadFormProps) {
  const { t } = useTranslation();
  const [uploadDocument] = useMutation(UploadDocumentDocument, {
    refetchQueries: [DocumentListDocument, DocumentStorageUsageDocument],
  });
  const upload = useCreateForm(documentView, {
    title: 'documents.panels.uploadDocument',
    writePermissions,
    headerActions: (
      <Button
        variant="text"
        onClick={onReplace}
      >
        {t('documents.panels.replaceFile')}
      </Button>
    ),
    save: async values => {
      const { data } = await uploadDocument({
        variables: toUploadDocumentVariables(file, values),
      });

      return data?.uploadDocument.id;
    },
  });

  return (
    <DocumentFileContext.Provider value={fileOfUpload(file)}>
      <FormDrawerPanel controller={upload} />
    </DocumentFileContext.Provider>
  );
}

type DocumentUploadProps = {
  onClose: () => void;
};

export function DocumentUpload({ onClose }: DocumentUploadProps) {
  const [file, setFile] = useState<File | null>(null);

  return file === null ?
      <DocumentUploadPanel
        onClose={onClose}
        onUpload={setFile}
      />
    : <DocumentUploadForm
        file={file}
        onReplace={() => setFile(null)}
      />;
}

type DocumentEditFormProps = {
  documentId: string;
};

export function DocumentEditForm({ documentId }: DocumentEditFormProps) {
  const [stored, setStored] = useState<DocumentFile | null>(null);
  const loadDocument = useQueryLoader(
    DocumentDocument,
    { id: documentId },
    data => data.document
  );
  const [updateDocument] = useMutation(UpdateDocumentDocument);
  const edit = useEditForm(documentView, {
    title: 'documents.panels.editDocument',
    writePermissions,
    load: async () => {
      const loaded = await loadDocument();

      setStored(fileOfDocument(loaded));

      return fromDocument(loaded);
    },
    save: values =>
      updateDocument({
        variables: toUpdateDocumentVariables(documentId, values),
      }),
  });

  return (
    <DocumentFileContext.Provider value={stored}>
      <FormDrawerPanel controller={edit} />
    </DocumentFileContext.Provider>
  );
}

export function DocumentDrawer() {
  const drawer = useRouteDrawer(documentRoutes);

  return (
    <FormDrawer
      open={drawer.open}
      onClose={drawer.close}
      width="md"
    >
      {drawer.mode === 'edit' && drawer.id !== undefined ?
        <DocumentEditForm
          key={drawer.id}
          documentId={drawer.id}
        />
      : <DocumentUpload onClose={drawer.close} />}
    </FormDrawer>
  );
}
