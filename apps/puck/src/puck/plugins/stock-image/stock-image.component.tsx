import { faker } from '@faker-js/faker';
import {
  alpha,
  Box,
  ImageList,
  ImageListItem,
  NoSsr,
  Paper,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import nanoid from 'nanoid';
import { useState } from 'react';
import styled from '@emotion/styled';

const ImageOverlay = styled(Box)(({ theme }) => ({
  position: 'absolute',
  inset: 0,
  background: `linear-gradient(to top, ${alpha(theme.palette.common.black, 0.7)} 0%, transparent 50%)`,
  opacity: 0,
  transition: 'opacity 0.2s ease',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-end',
  padding: theme.spacing(1),
}));

const ImageCard = styled(Paper)(({ theme }) => ({
  position: 'relative',
  overflow: 'hidden',
  borderRadius: theme.shape.borderRadius * 1.5,
  cursor: 'pointer',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease',
  border: `1px solid ${theme.palette.divider}`,
  '&:hover': {
    transform: 'none',
    boxShadow: 'none',
    [`${ImageOverlay}`]: {
      opacity: 1,
    },
  },
}));

const images = Array.from({ length: 20 }, (_, i) => ({
  id: nanoid(),
  src: faker.image.url(),
  title: faker.commerce.productName(),
}));

export const StockImage = () => {
  const [activeTab, setActiveTab] = useState('unsplash');

  return (
    <NoSsr>
      <Box sx={{ p: 2 }}>
        <Typography
          variant="h5"
          component={'div'}
          fontWeight={600}
        >
          Stock Images
        </Typography>

        <Typography
          variant="body2"
          component={'div'}
          color="text.secondary"
        >
          See how your links appear when shared on different platforms
        </Typography>
      </Box>

      <Tabs
        value={activeTab}
        onChange={(_, newValue) => setActiveTab(newValue)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          '&, .MuiTab-root': {
            minHeight: 'initial',
            textTransform: 'none',
            fontSize: '0.8rem',
          },
        }}
      >
        <Tab
          value={'petarde'}
          label={'Petarde'}
        />
        <Tab
          value={'unsplash'}
          label={'Unsplash'}
        />
        <Tab
          value={'pexels'}
          label={'Pexels'}
        />
      </Tabs>

      <Box sx={{ overflow: 'auto', flex: 1, p: 1.5 }}>
        {images.length ?
          <ImageList
            variant="masonry"
            cols={2}
            gap={8}
          >
            {images.map(image => (
              <ImageListItem key={image.id}>
                <ImageCard elevation={0}>
                  <Box
                    component="img"
                    src={image.src}
                    sx={{
                      width: '100%',
                      objectFit: 'cover',
                      display: 'block',
                      maxHeight: '45lvh',
                      minHeight: '150px',
                    }}
                  />

                  {/* {image.status === "importing" && (
                  <LinearProgress
                    variant="determinate"
                    value={image.progress || 0}
                    sx={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: 3,
                    }}
                  />
                )} */}

                  <ImageOverlay className="image-overlay">
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'common.white',
                        fontWeight: 500,
                        lineHeight: 1.2,
                      }}
                      noWrap
                    >
                      {image.title}
                    </Typography>

                    <Typography
                      variant="caption"
                      sx={{ color: 'grey.400', fontSize: '0.65rem' }}
                    >
                      3000x4000
                    </Typography>
                  </ImageOverlay>
                </ImageCard>
              </ImageListItem>
            ))}
          </ImageList>
        : <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 6,
              color: 'text.secondary',
            }}
          >
            <Typography variant="body2">No images found</Typography>
          </Box>
        }
      </Box>

      {/* <ImageList
        variant="masonry"
        cols={2}
        gap={8}
      >
        {images.map(image => (
          <ImageListItem key={image.id}>
            <img
              src={image.src}
              loading="lazy"
              fetchPriority="low"
              css={{ width: '100%', maxHeight: '500px', objectFit: 'cover' }}
            />
          </ImageListItem>
        ))}
      </ImageList> */}
    </NoSsr>
  );
};
