import Toolbar from '@mui/material/Toolbar'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import {MdSearch} from 'react-icons/md'
import MuiLink from '@mui/material/Link'
import Link from 'next/link'
import styled from '@emotion/styled'
import Container from '@mui/material/Container'

interface HeaderProps {
  sections: ReadonlyArray<{
    title: string
    url: string
  }>
}

const StyledHeader = styled.div`
  background-color: #feddd2;
`

const Logo = styled.div`
  display: flex;
  place-content: center;
  flex: 1;
`

export const Header = (props: HeaderProps) => {
  const {sections} = props

  return (
    <StyledHeader>
      <Container maxWidth="lg">
        <Toolbar sx={{borderBottom: 1, borderColor: 'divider'}}>
          <Button size="small">Subscribe</Button>
          <Logo>
            <svg viewBox="0 0 290 123" width={100} xmlns="http://www.w3.org/2000/svg">
              <path d="M134.272 5.37654C151.082 6.08773 149.832 2.55717 149.558 2.25237C148.435 1.41926 147.129 0.774111 145.656 0.367715C141.191 -0.851471 136.406 1.03319 134.272 5.22414C132.398 1.5361 128.476 -0.363797 124.519 0.0578386L123.503 0.220397C123.299 0.261036 123.091 0.311836 122.888 0.367715C118.951 1.43958 116.228 4.24371 114.979 7.70315C115.116 7.40344 116.848 4.63487 134.272 5.37654Z"></path>
              <path d="M133.466 14.6828C154.091 15.7089 154.34 11.8533 154.34 11.8533C154.284 9.71461 153.735 7.66232 152.734 5.87418C152.836 6.15865 153.898 10.0601 134.289 9.29298C115.422 8.55131 114.249 11.8431 114.213 11.9549C114.188 13.4179 114.391 14.9165 114.838 16.3897C114.99 16.8875 115.183 17.4006 115.407 17.9187L115.422 17.9238C115.422 17.9136 114.503 13.7379 133.466 14.6828Z"></path>
              <path d="M134.321 24.7568C147.046 25.3817 149.733 23.2887 150.201 22.7655C151.857 20.5913 153.096 18.3967 153.711 16.38C153.751 16.253 153.782 16.126 153.818 15.9939C153.609 16.5222 151.593 20.0731 134.829 19.2197C116.47 18.285 117.526 21.5971 117.552 21.6733C118.827 23.5122 120.422 25.3563 122.21 27.0885C122.175 27.0326 120.336 24.071 134.321 24.7568Z"></path>
              <path d="M134.318 29.3844C124.484 28.7545 126.195 30.5224 126.236 30.563C128.837 32.5442 131.616 34.1901 134.273 35.2264C138.128 33.7227 142.233 30.9389 145.702 27.6979C144.895 28.338 142.101 29.8823 134.318 29.3844Z"></path>
              <path d="M113.584 84.2586C112.385 84.411 111.262 85.5032 110.15 85.5032C109.936 85.5032 109.271 85.3914 109.195 84.9291V52.5699C109.195 48.3891 108.585 46.0879 105.293 43.1567C100.782 39.1283 91.9433 38.0616 87.8286 38.0616C81.311 38.0616 71.842 39.6871 66.8941 45.331C63.963 48.6736 62.5711 55.689 64.7555 60.3625C65.2736 61.4598 66.7468 60.7892 66.7468 60.7892L81.0062 56.6796C82.1746 56.0344 81.7225 55.0641 81.7225 55.0641C81.4634 53.6671 81.311 50.8021 81.311 50.8021C81.311 48.3484 82.5556 45.7221 86.1725 45.7221C88.6769 45.7221 89.7742 47.0785 89.891 49.0393V61.9983C83.9373 64.4112 82.0679 65.1885 78.6847 66.7124C73.4879 69.0391 68.7839 71.5638 66.1829 74.246C62.9165 77.5886 61.55 80.728 61.8853 86.3007C62.4339 95.2617 69.9522 98.5078 75.9669 98.5078C85.8829 98.5078 88.9055 93.6463 90.0333 92.93C90.0333 92.93 90.5514 92.2442 90.8816 92.93C93.0558 97.3293 97.4754 98.3808 101.377 98.3808C105.583 98.3808 112.146 96.3539 114.514 92.4373C114.742 92.0512 114.879 91.1927 114.879 91.1927V85.7013C114.874 85.051 114.666 84.1062 113.584 84.2586ZM89.891 82.9429C89.891 82.9429 89.8301 84.6701 87.8692 85.2695C87.8692 85.2695 84.8111 85.9807 82.962 84.858C81.1129 83.7353 80.549 77.741 83.0991 74.7845C84.2878 73.4129 85.0346 72.4731 88.0521 70.8831C88.0521 70.8831 89.891 69.8976 89.891 71.5536V82.9429Z"></path>
              <path d="M144.205 44.1007C144.205 48.3171 144.205 84.7961 144.205 89.2258C144.205 93.6556 142.737 105.619 134.858 111.7C126.197 118.39 114.904 122.113 114.182 122.393C112.598 123.007 109.92 118.822 112.674 116.241C113.817 115.169 119.725 109.403 120.908 107.834C122.092 106.259 124.114 104.181 124.713 99.7261C126.466 86.7062 125.628 65.5431 125.628 64.6948C125.628 63.8464 125.313 62.0685 123.57 61.4792C121.833 60.8899 117.52 60.4988 116.915 60.1178C116.311 59.7317 116.291 55.4239 116.682 54.7838C117.073 54.1488 128.559 42.404 130.464 41.9722C132.343 41.5455 141.568 41.5404 142.249 41.5404C143.707 41.5455 144.205 42.5208 144.205 44.1007Z"></path>
              <path d="M176.656 38.1982C162.904 38.1982 151.754 47.7435 151.754 68.6017C151.754 89.46 162.904 99.0052 176.656 99.0052C190.407 99.0052 201.558 89.46 201.558 68.6017C201.558 47.7435 190.407 38.1982 176.656 38.1982ZM176.656 90.8265C171.5 90.8265 171.667 83.8669 171.667 68.6677C171.667 53.4686 171.251 46.509 176.656 46.509C182.061 46.509 181.644 53.4635 181.644 68.6677C181.644 83.872 181.807 90.8265 176.656 90.8265Z"></path>
              <path d="M37.3737 38.173C34.2749 38.0867 30.1348 39.2703 27.7015 42.2421C27.4576 42.5062 27.0766 42.6891 26.6702 42.6891C25.954 42.6891 25.3647 42.1557 25.3647 41.5004V19.809C25.3647 17.9599 23.7086 16.4613 21.6614 16.4613C19.5024 16.4613 18.4864 16.9642 18.4864 16.9642L2.59638 23.0449C1.06224 23.746 0.000528489 25.1988 0.000528489 26.8955C-0.0299512 28.8564 1.26035 30.2839 3.25169 31.056C6.24378 32.5546 5.57323 34.9523 5.66467 40.078L5.69515 92.6656C5.69515 93.0161 5.9085 93.2549 6.27426 93.519C11.5269 97.6795 21.6005 99.6861 28.5549 99.6861C43.0886 99.6861 58.3488 88.1749 58.3488 67.7231C58.3488 51.1624 51.6178 38.554 37.3737 38.173ZM35.8903 84.1922C34.7981 88.0022 32.7306 91.9391 30.1043 91.9391C25.0599 91.9391 25.4257 84.431 25.4257 77.9541V59.1938C25.4257 57.68 25.4257 55.5667 26.0352 54.2917C26.7668 52.722 28.2247 51.9803 29.3778 51.9803C34.9201 51.9803 37.4143 63.7353 37.4143 71.7921C37.4092 76.0237 36.9825 80.2705 35.8903 84.1922Z"></path>
              <path d="M285.864 40.8746C281.902 37.659 274.643 37.1866 269.39 39.5182C264.137 41.8449 258.163 50.2166 257.635 50.7957C257.051 51.4358 256.101 50.9837 256.101 50.3588L256.081 43.821C256.081 42.744 255.156 41.8195 254.013 41.8449C246.688 42.1954 234.826 42.424 234.826 42.424C233.566 42.6069 232.733 43.379 232.733 44.4966V47.8849C232.733 48.5453 233.069 49.1193 233.597 49.4699C233.597 49.4699 234.521 50.1302 235.106 50.5062C237.991 52.0047 237.895 57.2168 237.971 62.3475L237.585 81.7326C237.585 83.4547 234.298 84.9228 231.529 84.5164C229.416 84.2014 226.876 82.8908 226.876 80.8893L226.856 43.7397C226.856 42.6627 225.931 41.7382 224.773 41.7636C217.463 42.1141 206.241 42.3427 206.241 42.3427C204.982 42.5256 204.148 43.2977 204.148 44.4153V47.8036C204.148 48.464 204.484 49.0381 205.012 49.3886C205.012 49.3886 205.921 50.049 206.506 50.4249C209.391 51.9235 209.294 59.0964 209.381 64.2271L208.868 84.7856C208.868 91.6486 214.786 97.201 222.096 97.201C223.925 97.201 225.276 96.8505 226.871 96.2358C229.67 95.1995 235.167 91.6537 235.167 91.6537C236.492 90.8155 237.707 91.5521 237.707 92.7002V97.1401C237.707 97.8411 238.301 98.4761 239.012 98.3745C244.056 97.6328 253.317 96.7337 258.123 96.4695C259.383 96.3984 260.8 96.4695 260.8 95.6262V92.2684C260.8 90.6581 258.793 90.8562 257.737 90.4498C256.665 90.0332 256.228 89.4439 256.228 86.9954L256.147 63.5565C256.187 59.2741 257.904 56.1043 260.51 53.5237C262.974 51.0802 266.347 48.4894 268.593 51.8727C270.228 54.3364 272.723 60.2851 280.028 60.3105C284.376 60.3257 287.835 56.6783 289.121 52.8937C290.406 49.099 289.827 44.0902 285.864 40.8746Z"></path>
            </svg>
          </Logo>

          <IconButton>
            <MdSearch />
          </IconButton>

          <Button variant="outlined" size="small">
            Sign up
          </Button>
        </Toolbar>

        <Toolbar
          component="nav"
          variant="dense"
          sx={{justifyContent: 'space-around', overflowX: 'auto', marginBottom: '24px'}}>
          {sections.map(section => (
            <MuiLink
              component={Link}
              color="rgb(119, 10, 106)"
              noWrap
              key={section.title}
              variant="body2"
              href={section.url}
              sx={{p: 1, flexShrink: 0}}>
              {section.title}
            </MuiLink>
          ))}
        </Toolbar>
      </Container>
    </StyledHeader>
  )
}
