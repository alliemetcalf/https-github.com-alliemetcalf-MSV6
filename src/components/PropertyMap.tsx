import React, { useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';

interface PropertyMapProps {
  address: string;
}

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

let googleMapsPromise: Promise<void> | null = null;

const loadGoogleMapsScript = () => {
  if (googleMapsPromise) return googleMapsPromise;

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  
  googleMapsPromise = new Promise((resolve) => {
    if (window.google?.maps) {
      resolve();
      return;
    }

    window.initMap = () => {
      resolve();
    };

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initMap`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  });

  return googleMapsPromise;
};

export default function PropertyMap({ address }: PropertyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!address) return;

    const initializeMap = async () => {
      try {
        await loadGoogleMapsScript();

        if (!mapRef.current || !window.google?.maps) return;

        const geocoder = new window.google.maps.Geocoder();
        
        geocoder.geocode({ address }, (results: any, status: string) => {
          if (status === 'OK' && results?.[0]?.geometry?.location && mapRef.current) {
            const location = results[0].geometry.location;
            
            const map = new window.google.maps.Map(mapRef.current, {
              center: location,
              zoom: 15,
              mapTypeControl: false,
              streetViewControl: false,
              fullscreenControl: false,
              styles: [
                {
                  featureType: "poi",
                  elementType: "labels",
                  stylers: [{ visibility: "off" }]
                }
              ]
            });

            new window.google.maps.Marker({
              map,
              position: location,
              animation: window.google.maps.Animation.DROP
            });
          }
        });
      } catch (error) {
        console.error('Error loading map:', error);
      }
    };

    initializeMap();
  }, [address]);

  if (!address) {
    return null;
  }

  const getDirectionsUrl = () => {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
  };

  return (
    <div className="space-y-2">
      <div
        ref={mapRef}
        className="w-full h-[300px] rounded-lg overflow-hidden shadow-md bg-gray-100"
      />
      <a
        href={getDirectionsUrl()}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center text-blue-600 hover:text-blue-700 transition"
      >
        <MapPin className="w-4 h-4 mr-1" />
        <span>Get Directions</span>
      </a>
    </div>
  );
}
