import {styled} from '@mui/material'
import {useState} from 'react'
import {MdSearch, MdClose} from 'react-icons/md'

const SearchWrapper = styled('div')`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-bottom: 1em;
`

const SearchIcon = styled(MdSearch)`
  cursor: pointer;
  font-size: 2em;
`

const CloseIcon = styled(MdClose)`
  cursor: pointer;
  font-size: 2em;
  position: absolute;
  right: 0;
  top: 0;
  transform: translateX(100%);
`

const SearchInput = styled('input')<{expanded: boolean}>`
  position: absolute;
  right: 0;
  top: 0;
  width: ${props => (props.expanded ? '200px' : '0')};
  opacity: ${props => (props.expanded ? '1' : '0')};
  transition: width 0.3s, opacity 0.3s;
  padding: ${props => (props.expanded ? '0.5em' : '0')};
  border: 1px solid #ccc;
  border-radius: 4px;
`

interface SearchBarProps {
  onSearchChange: (query: string | undefined) => void
}

export function SearchBar({onSearchChange}: SearchBarProps) {
  const [expanded, setExpanded] = useState(false)
  const [query, setQuery] = useState('')

  const handleSearchClick = () => {
    setExpanded(prev => !prev)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearchChange(query)
    }
  }

  const handleClearClick = () => {
    setQuery('')
    setExpanded(false)
    onSearchChange(undefined)
  }

  return (
    <SearchWrapper>
      <SearchIcon onClick={handleSearchClick} />
      <SearchInput
        type="text"
        value={query}
        onChange={handleInputChange}
        onKeyPress={handleKeyPress}
        expanded={expanded}
        placeholder="Search..."
      />
      {expanded && <CloseIcon onClick={handleClearClick} />}
    </SearchWrapper>
  )
}
