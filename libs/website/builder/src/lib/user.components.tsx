import {
  BuilderImageUploadProps,
  BuilderPersonalDataFormProps,
  BuilderUserFormProps,
} from './user.interface';
import { useWebsiteBuilder } from './website-builder.context';

export const PersonalDataForm = (props: BuilderPersonalDataFormProps) => {
  const { PersonalDataForm } = useWebsiteBuilder();

  return <PersonalDataForm {...props} />;
};

export const UserForm = (props: BuilderUserFormProps) => {
  const { UserForm } = useWebsiteBuilder();

  return <UserForm {...props} />;
};

export const ImageUpload = (props: BuilderImageUploadProps) => {
  const {
    elements: { ImageUpload },
  } = useWebsiteBuilder();

  return <ImageUpload {...props} />;
};
