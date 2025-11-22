import styled from '@emotion/styled';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Form, Message as RMessage } from 'rsuite';

import { validateURL } from '../utility';

interface UrlValidationProps {
  placeholder: string;
  name: string;
  value?: string;
  onChange: (url: string) => void;
}

const Message = styled(RMessage)`
  margin-top: 5px;
`;

export function FormControlUrl({
  placeholder,
  name,
  value,
  onChange,
}: UrlValidationProps) {
  const { t } = useTranslation();
  const [invalidInput, setInvalidInput] = useState(false);

  const handleUrlValidation = useCallback(
    (url: string) => {
      const isValidURL = validateURL(url);
      setInvalidInput(!isValidURL);
    },
    [value]
  );

  return (
    <div>
      <Form.Control
        style={invalidInput ? { border: 'thin solid red' } : {}}
        placeholder={placeholder}
        name={name}
        value={value}
        onChange={(url: string) => {
          handleUrlValidation(url);
          onChange(url);
        }}
      />
      {invalidInput && (
        <Message
          showIcon
          type="error"
        >
          {t('peerList.overview.invalidURLTooltip')}
        </Message>
      )}
    </div>
  );
}
