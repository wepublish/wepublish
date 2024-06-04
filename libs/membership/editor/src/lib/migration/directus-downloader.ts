import axios from 'axios'
import {PersonOfTheDay} from './person-of-the-day-importer'

export enum DirectusSyncStatus {
  Pending = 0,
  ImageDownloaded = 25,
  ImageUploaded = 50,
  ArticleCreated = 75,
  ArticlePublished = 100
}

export interface ImageInfo {
  id: string
  filename_download: string
  type: string
}

export class DirectusDownloader {
  private directusBaseUrl = 'https://cms.wepublish.cloud'

  /**
   * Download all items of the specified collection. If the resource spans across pages, the
   * client loads them all and calls the `progressCallback` for each page. The user is
   * responsible for storing the intermediate results.
   * @param itemName the name of the resource
   * @param fields fields to request from the API (https://docs.directus.io/reference/query.html#fields)
   * @param progressCallback a callback where chunks of the response will be provided
   */
  async getResource<T>(
    itemName: string,
    fields: string = '*',
    progressCallback: (items: T[]) => void
  ): Promise<void> {
    let offset = 0
    let newItems: T[] = []
    do {
      newItems = await this.getSinglePage(itemName, fields, offset)
      progressCallback(newItems)
      offset += 100
    } while (newItems.length === 100)
  }

  private async getSinglePage<T>(
    itemName: string,
    fields: string = '*',
    offset: number = 0
  ): Promise<T[]> {
    console.log(`Getting items from ${offset + 1} to ${offset + 100}...`)
    const {
      data: {data: items}
    } = await axios.request({
      url: `${this.directusBaseUrl}/items/${itemName}?fields=*,image.*&limit=100&offset=${offset}&sort[]=id`,
      method: 'GET',
      headers: await this.authHeader()
    })
    return items
  }

  async downloadImage(info: ImageInfo): Promise<File> {
    const url = `${this.directusBaseUrl}/assets/${info.id}?download`
    const response = await axios.get(url, {
      responseType: 'arraybuffer'
    })
    const arrayBuffer = response.data

    return new File([arrayBuffer], info.filename_download, {type: info.type})
  }

  private async authHeader() {
    return {
      Authorization: `Bearer ${await this.accessToken()}`
    }
  }

  private async accessToken(): Promise<string> {
    const {
      data: {
        data: {access_token}
      }
    } = await axios.request({
      url: `${this.directusBaseUrl}/auth/login`,
      method: 'POST',
      data: {
        email: 'dev@wepublish.ch',
        password: /*'?zl@Yf<@j8b%wBaX%}iX7+#5j+)RpaXh1)jsl2cb$d'*/ 'qhc8cfy@JAG_yhx6kxm'
      }
    })
    return access_token
  }
}
