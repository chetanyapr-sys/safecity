"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet.heat";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface Incident {
  _id: string;
  title: string;
  category: string;
  severity: string;
  location: {
    coordinates: [number, number];
  };
}

interface IncidentMapProps {
  incidents: Incident[];
}

export default function IncidentMap({ incidents }: IncidentMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const heatLayerRef = useRef<L.Layer | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current).setView([27.1767, 78.0081], 12);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    markersRef.current.forEach((marker) => map.removeLayer(marker));
    markersRef.current = [];

    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }

    if (incidents.length === 0) return;

    const heatPoints: [number, number, number][] = incidents.map(
      (incident) => {
        const [lng, lat] = incident.location.coordinates;
        return [lat, lng, 1];
      }
    );

    // @ts-expect-error - leaflet.heat doesn't have proper TypeScript types
    const heatLayer = L.heatLayer(heatPoints, { radius: 30, blur: 20 }).addTo(
      map
    );
    heatLayerRef.current = heatLayer;

    incidents.forEach((incident) => {
      const [lng, lat] = incident.location.coordinates;
      const marker = L.marker([lat, lng])
        .addTo(map)
        .bindPopup(
          `<div class="safecity-popup"><strong>${incident.title}</strong><br/>${incident.category} - ${incident.severity}</div>`,
          { className: "safecity-popup-wrapper" }
        );
      markersRef.current.push(marker);
    });

    const bounds = L.latLngBounds(
      incidents.map((incident) => {
        const [lng, lat] = incident.location.coordinates;
        return [lat, lng] as [number, number];
      })
    );
    map.fitBounds(bounds, { maxZoom: 13, padding: [50, 50] });
  }, [incidents]);

  return <div ref={mapRef} className="w-full h-full rounded-lg" />;
}