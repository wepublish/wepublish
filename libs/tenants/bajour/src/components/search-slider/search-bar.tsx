import styled from '@emotion/styled';
import { useRef, useState } from 'react';
import { MdClose, MdSearch } from 'react-icons/md';

const SearchWrapper = styled('div')`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: flex-end;
`;

const SearchIcon = styled(MdSearch)`
  cursor: pointer;
  font-size: 2em;
`;

const CloseIcon = styled(MdClose)`
  cursor: pointer;
  font-size: 2em;
  position: absolute;
  right: 0;
  top: 0;
  transform: translateX(100%);
`;

const SearchInput = styled('input')<{ expanded: boolean }>`
  position: absolute;
  right: 0;
  top: 0;
  width: ${({ expanded }) => (expanded ? '200px' : '0')};
  opacity: ${({ expanded }) => (expanded ? '1' : '0')};
  padding: 0.5em;
  pointer-events: ${({ expanded }) => (expanded ? 'initial' : 'none')};
  border: 1px solid #ccc;
  border-radius: 4px;
  transition:
    width 0.3s,
    opacity 0.3s;
`;

interface SearchBarProps {
  onSearchChange: (query: string | null) => void;
}

export function SearchBar({ onSearchChange }: SearchBarProps) {
  const searchRef = useRef<HTMLInputElement>(null);
  const [expanded, setExpanded] = useState(false);

  return (
    <SearchWrapper>
      <SearchIcon
        onClick={() => {
          setExpanded(prev => !prev);

          if (!expanded) {
            searchRef.current?.focus();
          }
        }}
      />

      <SearchInput
        ref={searchRef}
        type="text"
        onChange={e => onSearchChange(e.target.value)}
        expanded={expanded}
        placeholder="Suche..."
      />

      {expanded && (
        <CloseIcon
          onClick={() => {
            setExpanded(false);

            if (searchRef.current?.value) {
              searchRef.current.value = '';
              onSearchChange(null);
            }
          }}
        />
      )}
    </SearchWrapper>
  );
}
