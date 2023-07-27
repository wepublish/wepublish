import {Meta} from '@storybook/react'
import {EmbedBlock} from './embed-block'

export default {
  component: EmbedBlock,
  title: 'Blocks/Embed'
} as Meta

export const Default = {
  args: {
    type: 'other',
    url: 'https://www.facebook.com/plugins/video.php?height=314&href=https%3A%2F%2Fwww.facebook.com%2Fchangeclean%2Fvideos%2F3136062856696319%2F&show_text=false&width=560&t=0',
    title: '',
    width: 560,
    height: 314,
    styleCustom: 'border: none; overflow: hidden;',
    sandbox: ''
  }
}

export const WithClassName = {
  args: {
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

export const YouTube = {
  args: {
    type: 'youTubeVideo',
    videoID: 'CCOdQsZa15o'
  }
}

export const Soundcloud = {
  args: {
    type: 'soundCloudTrack',
    trackID: '744469711'
  }
}

export const Vimeo = {
  args: {
    type: 'vimeoVideo',
    videoID: '104626862'
  }
}

export const TikTok = {
  args: {
    type: 'tikTokVideo',
    userID: 'scout2015',
    videoID: '6718335390845095173'
  }
}

// todo: fix Instagram embeds
// export const Instagram = {
//   args: {
//     value: {type: 'instagramPost', postID: 'CvACOxxIqT2'}
//   }
// }

// todo: fix FacebookPost embeds
// export const FacebookPost = {
//   args: {
//     value: {
//       type: 'facebookPost',
//       userID: 'ladolcekita',
//       postID: 'pfbid02JcJeoMg7KasRL8dNjgRJJDFiU8YzeBzEeGeXtqpsE2bnTmeH2y6LRsu7RnmhkPxel'
//     }
//   }
// }

// todo: fix FacebookVideo embeds
// export const FacebookVideo = {
//   args: {
//     value: {
//       type: 'facebookVideo',
//       userID: 'ladolcekita',
//       videoID: '1190669514972266'
//     }
//   }
// }

export const Bildwurf = {
  args: {
    type: 'bildwurfAd',
    zoneID: '77348'
  }
}

export const Twitter = {
  args: {
    type: 'twitterTweet',
    userID: 'MrBeast',
    tweetID: '1683176302503772161'
  }
}
