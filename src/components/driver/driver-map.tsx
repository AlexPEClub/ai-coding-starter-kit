"use client";

import { useEffect, useRef, useState } from "react";
import { DriverTour } from "@/lib/actions/driver-tours";
import { Loader2, MapPin } from "lucide-react";
import "leaflet/dist/leaflet.css";

interface DriverMapProps {
  tours: DriverTour[];
}

export function DriverMap({ tours }: DriverMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  const hasPins = tours.some((t) => t.coordinates !== null);

  useEffect(() => {
    let map: any;

    async function initMap() {
      try {
        if (!mapRef.current) return;

        const L = (await import("leaflet")).default;

        // Deutschland-Zentrum als Default
        map = L.map(mapRef.current).setView([51.1657, 10.4515], 6);

        // OpenStreetMap Tiles
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map);

        const pinnedTours = tours.filter(
          (t): t is DriverTour & { coordinates: { lat: number; lng: number } } =>
            t.coordinates !== null
        );

        if (pinnedTours.length > 0) {
          const markers = pinnedTours.map((tour) => {
            const color = tour.status === "erledigt" ? "#16a34a" : "#FF6B6D";
            const marker = L.circleMarker(
              [tour.coordinates.lat, tour.coordinates.lng],
              {
                radius: 9,
                color: "#ffffff",
                weight: 2,
                fillColor: color,
                fillOpacity: 0.9,
              }
            ).addTo(map);

            marker.bindPopup(
              `<strong>${tour.partner.company_name}</strong><br />${
                tour.partner.street || ""
              }<br />${[tour.partner.zip, tour.partner.city]
                .filter(Boolean)
                .join(" ")}`
            );

            return marker;
          });

          if (markers.length === 1) {
            map.setView(markers[0].getLatLng(), 12);
          } else {
            const bounds = L.latLngBounds(
              markers.map((m) => m.getLatLng())
            );
            map.fitBounds(bounds, { padding: [32, 32] });
          }
        }

        setIsLoading(false);
      } catch (err) {
        console.error("Karten-Fehler:", err);
        setIsLoading(false);
      }
    }

    initMap();

    return () => {
      if (map) {
        map.remove();
      }
    };
  }, [tours]);

  if (tours.length === 0) return null;

  return (
    <div className="mt-6">
      <h2 className="mb-3 text-lg font-semibold text-foreground">Karte</h2>
      <div className="relative h-[400px] w-full overflow-hidden rounded-lg border border-border md:h-[500px]">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-muted">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        <div ref={mapRef} className="h-full w-full" />

        {!isLoading && !hasPins && (
          <div className="absolute bottom-2 left-2 z-[400] rounded-md bg-white/90 px-3 py-2 text-xs shadow-md">
            <MapPin className="mr-1 inline h-3 w-3 text-muted-foreground" />
            Für die heutigen Touren liegen keine Adress-Koordinaten vor
          </div>
        )}
      </div>
    </div>
  );
}
