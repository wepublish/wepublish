import {BlockInput} from '../../api/private'
import cheerio from 'cheerio'

export function extractEmbed(input: string): BlockInput {
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
    return {facebookPost: {userID, postID}}
  } else if (facebookVideoMatch) {
    const [, userID, videoID] = facebookVideoMatch
    return {facebookVideo: {userID, videoID}}
  } else if (instagramMatch) {
    const [, postID] = instagramMatch
    return {instagramPost: {postID}}
  } else if (instagramReelMatch) {
    const [, postID] = instagramReelMatch
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
  } else if (soundCloudMatch) {
    const [, trackID] = soundCloudMatch
    return {soundCloudTrack: {trackID}}
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
            height: iframe.attr('height') ? parseInt(iframe.attr('height')!) : undefined
          }
        }
      }

      try {
        return {embed: {url: new URL(input).toString()}}
      } catch {
        return {embed: {}}
      }
    } else {
      return {embed: {}}
    }
  }
}
