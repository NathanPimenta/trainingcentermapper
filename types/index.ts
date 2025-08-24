export interface TrainingCenter {
  id: string
  name: string
  category: "blue-collar" | "white-collar" | "other"
  address: string
  phone?: string
  email?: string
  website?: string
  description?: string
  coordinates: {
    lat: number
    lng: number
  }
}

export interface AreaBounds {
  north: number
  south: number
  east: number
  west: number
}
