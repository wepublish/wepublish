import { FocusEvent, useState } from 'react';

export const useFocusWithin = () => {
  const [focused, setFocused] = useState(false);

  return {
    focused,
    focusProps: {
      onFocus: () => setFocused(true),
      onBlur: (event: FocusEvent<HTMLElement>) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setFocused(false);
        }
      },
    },
  };
};
