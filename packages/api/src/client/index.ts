import axios from 'axios'
import {Article} from '../shared'

const request = axios.create()

export async function query(url: string, query: string, variables: {[key: string]: any}) {}

export async function getArticles(): Promise<Article[]> {
  request.get()
  return []
}
