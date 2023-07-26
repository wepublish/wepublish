import {Meta} from '@storybook/react'
import {EmbedBlock} from './embed-block'

export default {
  component: EmbedBlock,
  title: 'Blocks/Embed'
} as Meta

export const Default = {
  args: {
    value: {
      type: 'other',
      url: 'http://www.example.com/',
      title: '',
      width: 400,
      height: 300,
      styleCustom: '',
      sandbox: ''
    }
  }
}

export const WidhtClassName = {
  args: {
    value: {
      type: 'other',
      url: 'http://www.example.com/',
      title: '',
      width: 400,
      height: 300,
      styleCustom: '',
      sandbox: ''
    },
    className: 'extra-classname'
  }
}

export const YouTube = {
  args: {
    value: {
      type: 'youTubeVideo',
      videoID: 'CCOdQsZa15o'
    }
  }
}

export const Soundcloud = {
  args: {
    value: {type: 'soundCloudTrack', trackID: '744469711'}
  }
}

export const Vimeo = {
  args: {
    value: {type: 'vimeoVideo', videoID: '104626862'}
  }
}

export const TikTok = {
  args: {
    value: {type: 'tikTokVideo', userID: 'scout2015', videoID: '6718335390845095173'}
  }
}

// todo: fix instagram embeds
// export const Instagram = {
//   args: {
//     value: {type: 'instagramPost', postID: 'CuCWElcohPP', userID: '17841406338772956'}
//   }
// }

export const Other = {
  args: {
    value: {
      type: 'other',
      url: 'https://www.facebook.com/plugins/post.php?href=https%3A%2F%2Fwww.facebook.com%2Fladolcekita%2Fposts%2Fpfbid02JcJeoMg7KasRL8dNjgRJJDFiU8YzeBzEeGeXtqpsE2bnTmeH2y6LRsu7RnmhkPxel&show_text=true&width=500',
      title: '',
      width: 500,
      height: 570,
      styleCustom: 'border: none; overflow: hidden;',
      sandbox: ''
    }
  }
}

export const Facebook = {
  args: {
    value: {
      type: 'facebookPost',
      userID: 'ladolcekita',
      postID: 'pfbid02JcJeoMg7KasRL8dNjgRJJDFiU8YzeBzEeGeXtqpsE2bnTmeH2y6LRsu7RnmhkPxel'
    }
  }
}

// export const Bildwurf = {
//   args: {
//     value: {type: 'bildwurfAd', zoneID: '12345'}
//   }
// }
