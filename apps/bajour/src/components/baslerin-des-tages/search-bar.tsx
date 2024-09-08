import {IconButton, TextField} from '@mui/material'
import {FormEvent, useState} from 'react'
import {MdSearch} from 'react-icons/md'

interface SearchBarProps {
  onSearch: (query: string) => void
}

export const SearchBar = ({onSearch}: SearchBarProps) => {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSearch(searchQuery)
    setOpen(false)
  }

  if (!open) {
    return <MdSearch onClick={() => setOpen(true)} />
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        <TextField
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search..."
        />
        <IconButton type="submit">
          <MdSearch />
        </IconButton>
      </form>
    </>
  )
}
