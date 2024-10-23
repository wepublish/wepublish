import {BlockInput} from '../../api/private'
import cheerio from 'cheerio'

export function extractEmbed(input: string, blockStyle?: string): BlockInput {
  const facebookPostMatch = input.match(/facebook.com\/(.+)\/posts\/([0-9]+)/)
  const facebookVideoMatch = input.match(/facebook.com\/(.+)\/videos\/([0-9]+)/)
  const instagramMatch = input.match(/instagram.com\/p\/([0-9a-zA-Z-_]+)/)
  const instagramReelMatch = input.match(/instagram.com\/reel\/([0-9a-zA-Z-_]+)/)
  const twitterMatch = input.match(/twitter.com\/([0-9a-zA-Z-_]+)\/status\/([0-9]+)/)
  const vimeoMatch = input.match(/vimeo.com\/([0-9]+)/)
  const youTubeMatch = input.match(/youtube.com\/watch\?v=([0-9a-zA-Z-_]+)/)
  const polisMatch = input.match(/pol.is\/([0-9a-zA-Z-_]+)/)
  const tikTokMatch = input.match(/tiktok\.com\/@([0-9a-zA-Z-_.]+)\/video\/([0-9]+)/)
  const bildwurfAdMatch = input.match(/data-zone="([0-9a-zA-Z-_]+)"/)
  const soundCloudMatch = input.match(/api.soundcloud.com\/tracks\/([0-9]+)/)

  if (facebookPostMatch) {
    const [, userID, postID] = facebookPostMatch
    return {facebookPost: {userID, postID, blockStyle}}
  } else if (facebookVideoMatch) {
    const [, userID, videoID] = facebookVideoMatch
    return {facebookVideo: {userID, videoID, blockStyle}}
  } else if (instagramMatch) {
    const [, postID] = instagramMatch
    return {instagramPost: {postID, blockStyle}}
  } else if (instagramReelMatch) {
    const [, postID] = instagramReelMatch
    return {instagramPost: {postID, blockStyle}}
  } else if (twitterMatch) {
    const [, userID, tweetID] = twitterMatch
    return {twitterTweet: {userID, tweetID, blockStyle}}
  } else if (vimeoMatch) {
    const [, videoID] = vimeoMatch
    return {vimeoVideo: {videoID, blockStyle}}
  } else if (youTubeMatch) {
    const [, videoID] = youTubeMatch
    return {youTubeVideo: {videoID, blockStyle}}
  } else if (polisMatch) {
    const [, conversationID] = polisMatch
    return {polisConversation: {conversationID, blockStyle}}
  } else if (tikTokMatch) {
    const [, userID, videoID] = tikTokMatch
    return {tikTokVideo: {userID, videoID, blockStyle}}
  } else if (bildwurfAdMatch) {
    const [, zoneID] = bildwurfAdMatch
    return {bildwurfAd: {zoneID, blockStyle}}
  } else if (soundCloudMatch) {
    const [, trackID] = soundCloudMatch
    return {soundCloudTrack: {trackID, blockStyle}}
  } else {
    if (input) {
      const $ = cheerio.load(input)
      const iframe = $('iframe')
      if (iframe && iframe.attr('src')) {
        const source = iframe.attr('src')!
        // add iframe attributes if set in input
        return {
          embed: {
            url: source,
            title: iframe.attr('title'),
            width: iframe.attr('width') ? parseInt(iframe.attr('width')!) : undefined,
            height: iframe.attr('height') ? parseInt(iframe.attr('height')!) : undefined,
            blockStyle
          }
        }
      }

      try {
        return {embed: {url: new URL(input).toString(), blockStyle}}
      } catch {
        return {embed: {}}
      }
    } else {
      return {embed: {}}
    }
  }
}
