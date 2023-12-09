

export interface AssetType {
  url: string
  name: string
  label: string
  content_type: string
  state: string
  size: number
  download_count: number
  created_at: string
  updated_at: string
  browser_download_url: string

}


export interface ICache {
  ttl?: number;
  data?: {
    name: string
  }[]
}
