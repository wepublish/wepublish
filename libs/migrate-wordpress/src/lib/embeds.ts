import {BlockInput} from '../api/private'

export function extractEmbed(input: string): BlockInput {
  const facebookPostMatch = input.match(/facebook.com\/(.+)\/posts\/([0-9]+)/)
  const facebookVideoMatch = input.match(/facebook.com\/(.+)\/videos\/([0-9]+)/)
  const instagramMatch = input.match(/instagram.com\/p\/([0-9a-zA-Z-_]+)/)
  const twitterMatch = input.match(/twitter.com\/([0-9a-zA-Z-_]+)\/status\/([0-9]+)/)
  const vimeoMatch = input.match(/vimeo.com\/([0-9]+)/)
  const youTubeMatch = input.match(/youtube.com\/watch\?v=([0-9a-zA-Z-_]+)/)
  const polisMatch = input.match(/pol.is\/([0-9a-zA-Z-_]+)/)
  const tikTokMatch = input.match(/tiktok\.com\/@([0-9a-zA-Z-_.]+)\/video\/([0-9]+)/)
  const bildwurfAdMatch = input.match(/data-zone="([0-9a-zA-Z-_]+)"/)

  if (facebookPostMatch) {
    const [, userID, postID] = facebookPostMatch
    return {facebookPost: {userID, postID}}
  } else if (facebookVideoMatch) {
    const [, userID, videoID] = facebookVideoMatch
    return {facebookVideo: {userID, videoID}}
  } else if (instagramMatch) {
    const [, postID] = instagramMatch
    return {instagramPost: {postID}}
  } else if (twitterMatch) {
    const [, userID, tweetID] = twitterMatch
    return {twitterTweet: {userID, tweetID}}
  } else if (vimeoMatch) {
    const [, videoID] = vimeoMatch
    return {vimeoVideo: {videoID}}
  } else if (youTubeMatch) {
    const [, videoID] = youTubeMatch
    return {youTubeVideo: {videoID}}
  } else if (polisMatch) {
    const [, conversationID] = polisMatch
    return {polisConversation: {conversationID}}
  } else if (tikTokMatch) {
    const [, userID, videoID] = tikTokMatch
    return {tikTokVideo: {userID, videoID}}
  } else if (bildwurfAdMatch) {
    const [, zoneID] = bildwurfAdMatch
    return {bildwurfAd: {zoneID}}
  } else {
    return {embed: {}}
    // if (input) {
    //   const parser = new DOMParser()
    //   const element = parser.parseFromString(input, 'text/html')
    //   const iframe = element.getElementsByTagName('iframe')[0]
    //
    //   if (iframe) {
    //     const soundCloudMatch = iframe.src.match(/api.soundcloud.com\/tracks\/([0-9]+)/)
    //     if (soundCloudMatch) {
    //       const [, trackID] = soundCloudMatch
    //       return {soundCloudTrack: {trackID}}
    //     } else {
    //       // add iframe attributes if set in input
    //       return {
    //         embed: {
    //           url: iframe.src,
    //           title: iframe.title,
    //           width: iframe.width ? parseInt(iframe.width) : undefined,
    //           height: iframe.height ? parseInt(iframe.height) : undefined,
    //           styleCustom: !!iframe.style && !!iframe.style.cssText ? iframe.style.cssText : '',
    //           // sandbox: iframe.sandbox ? flattenDOMTokenList(iframe.sandbox) : undefined
    //         }
    //       }
    //     }
    //   } else {
    //     try {
    //       return {embed: {url: new URL(input).toString()}}
    //     } catch {
    //       return {embed: {}}
    //     }
    //   }
    // } else {
    //   return {embed: {}}
    // }
  }
}
