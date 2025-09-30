import styled from '@emotion/styled';
import { GlobalStyles, Slider, Stack } from '@mui/material';
import { useLocalStorage } from '@wepublish/ui';
import { Modal } from '@wepublish/website/builder';
import { useWebsiteBuilder } from '@wepublish/website/builder';
import {
  ComponentProps,
  createContext,
  PropsWithChildren,
  useContext,
} from 'react';
import { MdFormatSize, MdRestore } from 'react-icons/md';

const SmallModal = styled(Modal)`
  max-width: 500px;
`;

const FontSizeContext = createContext([
  16 as number,
  (fontSize: number): void => undefined,
] as const);

export const FontSizeProvider = ({ children }: PropsWithChildren) => {
  const [baseFontSize, , setBaseFontSize] = useLocalStorage('baseFontSize', {
    serialize: value => value.toString(),
    deserialize: value => +value,
    defaultValue: 16,
  });

  return (
    <FontSizeContext.Provider value={[baseFontSize ?? 16, setBaseFontSize]}>
      {children}

      {/*
       * If baseFontSize is the default value,
       * then ignore so that browser default is used
       */}
      {baseFontSize !== 16 && (
        <GlobalStyles
          styles={{
            html: {
              fontSize: `${baseFontSize}px !important`,
            },
          }}
        />
      )}
    </FontSizeContext.Provider>
  );
};

export const FontSizePicker = (
  props: Omit<ComponentProps<typeof SmallModal>, 'submitText'>
) => {
  const {
    elements: { H5, IconButton },
  } = useWebsiteBuilder();

  const [baseFontSize, setBaseFontSize] = useContext(FontSizeContext);

  return (
    <SmallModal
      {...props}
      submitText={'Fertig'}
    >
      <H5 component="h1">Schriftgrösse einstellen</H5>

      <Stack
        sx={{ alignItems: 'center' }}
        onClick={() => setBaseFontSize(16)}
      >
        <IconButton>
          <MdRestore size={32} />
        </IconButton>
      </Stack>

      <Stack
        spacing={3}
        direction="row"
        sx={{ alignItems: 'center', mb: 1 }}
      >
        <MdFormatSize
          size={22}
          css={{ width: '48px' }}
        />

        <Slider
          value={baseFontSize}
          onChange={(_, val) => setBaseFontSize(val as number)}
          min={10}
          max={22}
          step={1}
          marks={[{ value: 16, label: 'Standard' }]}
          color="primary"
          size={'small'}
        />

        <MdFormatSize
          size={48}
          css={{ width: '48px' }}
        />
      </Stack>
    </SmallModal>
  );
};
