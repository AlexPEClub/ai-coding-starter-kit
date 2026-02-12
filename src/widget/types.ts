export interface ServiceTyp {
  id: string
  name: string
  icon: string
}

export interface StuetzpunktService {
  service_typ_id: string
  service_typen: ServiceTyp
}

export interface Stuetzpunkt {
  id: string
  name: string
  strasse: string
  hausnummer: string
  plz: string
  ort: string
  land: string
  telefon: string
  email: string | null
  website: string | null
  bild_url: string | null
  latitude: number
  longitude: number
  status: 'aktiv' | 'temporaer_geschlossen'
  oeffnungszeiten_typ: 'tagsueber' | '24h'
  oeffnungszeiten_von: string | null
  oeffnungszeiten_bis: string | null
  stuetzpunkt_services: StuetzpunktService[]
}

export interface WidgetConfig {
  map_provider: 'openstreetmap' | 'google_maps'
  default_language: 'de' | 'fr' | 'it'
  primary_color: string
  default_radius_km: number
  default_center_lat: number
  default_center_lng: number
  default_zoom: number
}

export interface RouteData {
  geometry: [number, number][]
  distance: number // km
  duration: number // minutes
  target: Stuetzpunkt
}

export interface WidgetState {
  config: WidgetConfig | null
  services: ServiceTyp[]
  stuetzpunkte: Stuetzpunkt[]
  filteredStuetzpunkte: Stuetzpunkt[]
  searchText: string
  activeServiceFilters: string[]
  userLocation: { lat: number; lng: number } | null
  selectedRadius: number
  selectedStuetzpunkt: string | null
  hoveredStuetzpunkt: string | null
  isLoading: boolean
  visibleCount: number
}
