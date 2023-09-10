import {Menu, MenuItem, css, styled} from '@mui/material'
import {useUser, useWebsiteBuilder} from '@wepublish/website'
import {useState} from 'react'
import {MdAccountCircle} from 'react-icons/md'

const NavBarProfileWrapper = styled('div')`
  display: flex;
  align-items: center;
  justify-self: end;
  gap: ${({theme}) => theme.spacing(2)};
`

const SignupWrapper = styled('div')`
  display: none;

  ${({theme}) => theme.breakpoints.up('md')} {
    display: unset;
  }
`

const Name = styled('div')``

const avataStyles = css`
  width: 40px;
  border-radius: 100%;
`

export const NavBarProfile = () => {
  const {
    elements: {Button, IconButton, Link, Image}
  } = useWebsiteBuilder()
  const {hasUser, logout, user} = useUser()
  const [anchorEl, setAnchorEl] = useState<HTMLElement>()
  const isMenuOpen = Boolean(anchorEl)
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }
  const handleClose = () => {
    setAnchorEl(undefined)
  }

  return (
    <NavBarProfileWrapper>
      {!hasUser && (
        <Link href="/login" aria-label="Login">
          <IconButton sx={{fontSize: '2em'}} color="secondary">
            <MdAccountCircle />
          </IconButton>
        </Link>
      )}

      {hasUser && (
        <>
          <Name>
            {user?.firstName} {user?.name}
          </Name>

          <IconButton
            id="basic-button"
            sx={{fontSize: '2em'}}
            color="secondary"
            aria-label="Benutzer Menu"
            aria-controls={isMenuOpen ? 'basic-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={isMenuOpen ? 'true' : undefined}
            onClick={handleClick}>
            {!user?.image && <MdAccountCircle />}
            {user?.image && <Image css={avataStyles} image={user.image} square />}
          </IconButton>

          <Menu
            id="basic-menu"
            anchorEl={anchorEl}
            open={isMenuOpen}
            onClose={handleClose}
            MenuListProps={{
              'aria-labelledby': 'basic-button'
            }}>
            <MenuItem onClick={handleClose}>Profile</MenuItem>
            <MenuItem onClick={handleClose}>My account</MenuItem>
            <MenuItem
              onClick={() => {
                handleClose()
                logout()
              }}>
              Logout
            </MenuItem>
          </Menu>
        </>
      )}

      <SignupWrapper>
        {!hasUser && (
          <Button LinkComponent={Link} href="/signup">
            Werde WP Member
          </Button>
        )}
      </SignupWrapper>
    </NavBarProfileWrapper>
  )
}
