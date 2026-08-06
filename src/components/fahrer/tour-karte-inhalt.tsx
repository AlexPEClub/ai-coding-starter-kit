"use client";

import { useEffect, useRef } from "react";
import L, { type LatLngBounds, type LatLng } from "leaflet";
import "leaflet/dist/leaflet.css";
import type { TourKarteDaten, KartenStopp } from "@/lib/actions/tour-karte-helpers";

/**
 * Leaflet-Marker-Icons als DatenURLs (Inline-SVG).
 * So brauchen wir nicht auf externe Dateien zu zählen.
 */

/** Icon für das Depot (ohne Nummer). */
const DEPOT_ICON = L.icon({
  iconUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 40'%3E%3Ccircle cx='15' cy='15' r='10' fill='%234ECDC4'/%3E%3Cpath d='M15 2 L23 12 L23 38 L7 38 L7 12 Z' fill='%234ECDC4' stroke='%23fff' stroke-width='1'/%3E%3C/svg%3E",
  iconSize: [30, 40],
  iconAnchor: [15, 40],
  popupAnchor: [0, -40],
});

/** Funktion, um ein Icon für einen nummerierten Stopp zu erstellen. */
function erstelleStoppIcon(nummer: number, istErledigt: boolean) {
  const bgFarbe = istErledigt ? "%23CCCCCC" : "%23FF6B6D"; // Grau wenn erledigt, sonst Koralle
  const textFarbe = "%23FFFFFF";

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="15" fill="${bgFarbe}" stroke="white" stroke-width="2"/>
      <text x="16" y="22" font-size="16" font-weight="bold" fill="${textFarbe}" text-anchor="middle" font-family="Arial">
        ${nummer}
      </text>
    </svg>
  `;

  return L.icon({
    iconUrl: `data:image/svg+xml,${encodeURIComponent(svg)}`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
}

export interface TourKarteInhaltProps {
  karteDaten: TourKarteDaten;
  onStoppClick?: (stoppId: string) => void;
}

/**
 * Leaflet-Kartenkomponente.
 * PROJ-45 Tech Design:
 * - Depot-Marker (eigenständiger Icon)
 * - Nummierte Stopp-Marker (Position = route_order)
 * - Erledigte Stopps optisch abgeschwächt (Farbe ausgeblichen)
 * - Routenlinie zwischen Depot → Stopps → Depot
 * - Automatischer Zoom auf alle Marker (fit bounds)
 * - Marker-Tap öffnet den Stopp-Detail-Modal (via onStoppClick)
 */
export function TourKarteInhalt({
  karteDaten,
  onStoppClick,
}: TourKarteInhaltProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  useEffect(() => {
    // Nur einmal initialisieren
    if (!mapContainer.current || mapInstance.current) return;

    // Zentrieren auf den ersten Stopp oder das Depot
    const zentrum: LatLng = L.latLng(
      karteDaten.stopps.length > 0 ? karteDaten.stopps[0].breitengrad : karteDaten.depot.breitengrad,
      karteDaten.stopps.length > 0 ? karteDaten.stopps[0].laengengrad : karteDaten.depot.laengengrad
    );

    // Karte erstellen
    const map = L.map(mapContainer.current, {
      center: zentrum,
      zoom: 12,
      attributionControl: true,
    });

    // OpenStreetMap Tiles (PROJ-45 Tech Design, Entscheidung 1)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map);

    // Bounds für Fit-All — initialisiert mit Depot
    const bounds = L.latLngBounds([
      [karteDaten.depot.breitengrad, karteDaten.depot.laengengrad],
    ]);

    // Depot-Marker
    const depotMarker = L.marker(
      [karteDaten.depot.breitengrad, karteDaten.depot.laengengrad],
      { icon: DEPOT_ICON }
    ).bindPopup(`<strong>${karteDaten.depot.name}</strong>`, { autoClose: false });

    depotMarker.addTo(map);

    // Stopp-Marker
    const stoppMarkers: L.Marker[] = [];
    for (const stopp of karteDaten.stopps) {
      const istErledigt = stopp.status === "erledigt";
      const icon = erstelleStoppIcon(stopp.routeOrder, istErledigt);

      const marker = L.marker([stopp.breitengrad, stopp.laengengrad], { icon });

      // Popup mit Stopp-Informationen
      const popup = `
        <div class="text-sm">
          <strong>${stopp.routeOrder}. ${stopp.name}</strong><br/>
          <small>${stopp.adresse}</small><br/>
          <small class="text-muted-foreground">${new Date(stopp.berechneteAnkunftszeit).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin" })} Uhr</small>
        </div>
      `;
      marker.bindPopup(popup, { autoClose: false });

      // Click-Handler
      marker.on("click", () => {
        if (onStoppClick) {
          onStoppClick(stopp.id);
        }
      });

      marker.addTo(map);
      stoppMarkers.push(marker);

      // Zu Bounds hinzufügen
      bounds.extend([stopp.breitengrad, stopp.laengengrad]);
    }

    // Routenlinie (falls vorhanden)
    if (karteDaten.routenGeometrie && karteDaten.routenGeometrie.length > 0) {
      const routeLatLngs: LatLng[] = karteDaten.routenGeometrie.map(([lat, lng]) =>
        L.latLng(lat, lng)
      );

      L.polyline(routeLatLngs, {
        color: "#FF6B6D", // Brand-Koralle
        weight: 3,
        opacity: 0.7,
      }).addTo(map);
    }

    // Fit all markers into view
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }

    mapInstance.current = map;

    // Cleanup
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [karteDaten, onStoppClick]);

  return (
    <div
      ref={mapContainer}
      className="h-96 w-full rounded-xl border border-border shadow-sm"
      aria-label="Karte der Tourenstopps"
    />
  );
}
