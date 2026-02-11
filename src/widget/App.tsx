import { useState, useEffect, useCallback, useMemo } from 'react'
import type { WidgetConfig, ServiceTyp, Stuetzpunkt } from './types'
import { I18nContext, detectLanguage, saveLanguage, translate, type Language } from './i18n'
import { LeafletMap } from './components/LeafletMap'
import { SearchBar } from './components/SearchBar'
import { ServiceFilterBar } from './components/ServiceFilterBar'
import { RadiusSelector } from './components/RadiusSelector'
import { GeolocationButton } from './components/GeolocationButton'
import { LocationCard } from './components/LocationCard'
import { LanguageSwitcher } from './components/LanguageSwitcher'

function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

interface AppProps {
  apiBase: string
}

export function App({ apiBase }: AppProps) {
  const [config, setConfig] = useState<WidgetConfig | null>(null)
  const [services, setServices] = useState<ServiceTyp[]>([])
  const [stuetzpunkte, setStuetzpunkte] = useState<Stuetzpunkt[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [lang, setLangState] = useState<Language>('de')
  const [searchText, setSearchText] = useState('')
  const [activeServiceFilters, setActiveServiceFilters] = useState<string[]>([])
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [selectedRadius, setSelectedRadius] = useState(0)
  const [selectedStuetzpunkt, setSelectedStuetzpunkt] = useState<string | null>(null)
  const [hoveredStuetzpunkt, setHoveredStuetzpunkt] = useState<string | null>(null)
  const [visibleCount, setVisibleCount] = useState(20)

  const setLang = useCallback((l: Language) => {
    setLangState(l)
    saveLanguage(l)
  }, [])

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => translate(key, lang, params),
    [lang]
  )

  // Load config + data
  useEffect(() => {
    async function load() {
      try {
        const [configRes, dataRes] = await Promise.all([
          fetch(`${apiBase}/api/widget/config`),
          fetch(`${apiBase}/api/widget/stuetzpunkte?limit=500`),
        ])

        if (configRes.ok) {
          const configData = await configRes.json()
          setConfig(configData.config)
          setServices(configData.services || [])
          setSelectedRadius(configData.config.default_radius_km || 0)
          setLangState(detectLanguage(configData.config.default_language))
        }

        if (dataRes.ok) {
          const stData = await dataRes.json()
          setStuetzpunkte(stData.stuetzpunkte || [])
        }
      } catch (err) {
        console.error('[Heizmann Storefinder] Failed to load data:', err)
      }
      setIsLoading(false)
    }
    load()
  }, [apiBase])

  // Filter logic
  const filteredStuetzpunkte = useMemo(() => {
    let results = stuetzpunkte

    // Text search
    if (searchText.length >= 3) {
      const q = searchText.toLowerCase()
      results = results.filter(
        (sp) =>
          sp.name.toLowerCase().includes(q) ||
          sp.plz.toLowerCase().includes(q) ||
          sp.ort.toLowerCase().includes(q)
      )
    }

    // Service filters (AND)
    if (activeServiceFilters.length > 0) {
      results = results.filter((sp) => {
        const spServiceIds = sp.stuetzpunkt_services?.map((ss) => ss.service_typ_id) || []
        return activeServiceFilters.every((fid) => spServiceIds.includes(fid))
      })
    }

    // Radius filter
    if (userLocation && selectedRadius > 0) {
      results = results.filter(
        (sp) => haversineDistance(userLocation.lat, userLocation.lng, sp.latitude, sp.longitude) <= selectedRadius
      )
      results.sort((a, b) =>
        haversineDistance(userLocation.lat, userLocation.lng, a.latitude, a.longitude) -
        haversineDistance(userLocation.lat, userLocation.lng, b.latitude, b.longitude)
      )
    }

    return results
  }, [stuetzpunkte, searchText, activeServiceFilters, userLocation, selectedRadius])

  const toggleServiceFilter = (id: string) => {
    setActiveServiceFilters((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    )
  }

  const handleGeocode = useCallback(async (text: string) => {
    if (text.length < 3) return
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text)}&limit=1&countrycodes=ch,de,at,fr,it`,
        { headers: { 'User-Agent': 'HeizmannStorefinder/1.0' } }
      )
      if (res.ok) {
        const results = await res.json()
        if (results.length > 0) {
          setUserLocation({
            lat: parseFloat(results[0].lat),
            lng: parseFloat(results[0].lon),
          })
        }
      }
    } catch { /* ignore geocoding errors */ }
  }, [])

  // Geocode when search text looks like a PLZ or town
  useEffect(() => {
    if (searchText.length >= 3) {
      const isPlzOrOrt = /^\d{4,5}$/.test(searchText) || /^[a-zA-ZäöüÄÖÜéèêàâîôùûçñß\s]{3,}$/.test(searchText)
      if (isPlzOrOrt) {
        handleGeocode(searchText)
      }
    } else {
      setUserLocation(null)
    }
  }, [searchText, handleGeocode])

  const handleUserGeolocation = (lat: number, lng: number) => {
    setUserLocation({ lat, lng })
    if (selectedRadius === 0) setSelectedRadius(config?.default_radius_km || 50)
  }

  const handleMarkerClick = useCallback((id: string) => {
    setSelectedStuetzpunkt(id)
    const el = document.getElementById(`hsf-card-${id}`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [])

  const handleCardClick = (id: string) => {
    setSelectedStuetzpunkt(id)
  }

  const primaryColor = config?.primary_color || '#E30613'

  const i18nValue = useMemo(() => ({ lang, t, setLang }), [lang, t, setLang])

  if (isLoading) {
    return (
      <div className="hsf-root" style={{ '--hsf-primary': primaryColor } as React.CSSProperties}>
        <div className="hsf-loading">
          <svg className="hsf-spinner" viewBox="0 0 24 24" width="32" height="32">
            <circle cx="12" cy="12" r="10" stroke={primaryColor} strokeWidth="3" fill="none" strokeDasharray="32" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    )
  }

  const resultCount = filteredStuetzpunkte.length
  const hasActiveFilters = searchText.length > 0 || activeServiceFilters.length > 0

  return (
    <I18nContext.Provider value={i18nValue}>
      <div className="hsf-root" style={{ '--hsf-primary': primaryColor } as React.CSSProperties}>
        {/* Header */}
        <div className="hsf-header">
          <LanguageSwitcher primaryColor={primaryColor} />
        </div>

        {/* Search + Filters */}
        <div className="hsf-toolbar">
          <div className="hsf-toolbar-row">
            <SearchBar value={searchText} onChange={setSearchText} primaryColor={primaryColor} />
            <GeolocationButton onLocation={handleUserGeolocation} />
            <RadiusSelector value={selectedRadius} onChange={setSelectedRadius} />
          </div>
          <ServiceFilterBar
            services={services}
            activeFilters={activeServiceFilters}
            onToggle={toggleServiceFilter}
            onReset={() => setActiveServiceFilters([])}
            primaryColor={primaryColor}
          />
        </div>

        {/* Result count */}
        <div className="hsf-result-count">
          {resultCount === 1
            ? t('results.count.one')
            : t('results.count', { count: resultCount })}
        </div>

        {/* Main content: Map + List */}
        <div className="hsf-content">
          <div className="hsf-map-container">
            <LeafletMap
              stuetzpunkte={filteredStuetzpunkte}
              center={[config?.default_center_lat ?? 46.948, config?.default_center_lng ?? 7.4474]}
              zoom={config?.default_zoom ?? 8}
              primaryColor={primaryColor}
              userLocation={userLocation}
              selectedRadius={selectedRadius}
              selectedStuetzpunkt={selectedStuetzpunkt}
              hoveredStuetzpunkt={hoveredStuetzpunkt}
              onMarkerClick={handleMarkerClick}
            />
          </div>

          <div className="hsf-list-container">
            {resultCount === 0 ? (
              <div className="hsf-empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48" opacity="0.3">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <p className="hsf-empty-title">{t('results.empty')}</p>
                <p className="hsf-empty-hint">{t('results.empty.hint')}</p>
                {hasActiveFilters && (
                  <button
                    type="button"
                    className="hsf-btn hsf-btn-outline"
                    onClick={() => { setSearchText(''); setActiveServiceFilters([]) }}
                  >
                    {t('filter.reset')}
                  </button>
                )}
              </div>
            ) : (
              <>
                {filteredStuetzpunkte.slice(0, visibleCount).map((sp) => (
                  <div key={sp.id} id={`hsf-card-${sp.id}`}>
                    <LocationCard
                      stuetzpunkt={sp}
                      primaryColor={primaryColor}
                      isSelected={sp.id === selectedStuetzpunkt}
                      onClick={() => handleCardClick(sp.id)}
                      onMouseEnter={() => setHoveredStuetzpunkt(sp.id)}
                      onMouseLeave={() => setHoveredStuetzpunkt(null)}
                    />
                  </div>
                ))}
                {visibleCount < resultCount && (
                  <button
                    type="button"
                    className="hsf-load-more"
                    onClick={() => setVisibleCount((v) => v + 20)}
                    style={{ color: primaryColor }}
                  >
                    {t('pagination.loadMore')} ({resultCount - visibleCount})
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </I18nContext.Provider>
  )
}
