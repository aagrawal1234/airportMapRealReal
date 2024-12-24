'use client';

import { useState, useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Head from 'next/head';

export default function Page() {
    const [map, setMap] = useState<L.Map | null>(null);
    const [markers, setMarkers] = useState<L.Marker[]>([]);

    useEffect(() => {
        // Initialize the map
        const initMap = L.map('map').setView([37.7749, -122.4194], 7); // Center near San Francisco
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors',
        }).addTo(initMap);
        setMap(initMap);

        return () => {
            // Cleanup the map instance on unmount
            initMap.remove();
        };
    }, []);

    const handleAddAirport = () => {
        const dropdown = document.getElementById('airportDropdown') as HTMLSelectElement;
        if (!map || !dropdown) return;

        const [lat, lon] = dropdown.value.split(',').map(Number);
        const airportName = dropdown.options[dropdown.selectedIndex].text;

        // Add a marker to the map
        const marker = L.marker([lat, lon])
            .addTo(map)
            .bindPopup(`<b>${airportName}</b>`)
            .openPopup();

        setMarkers((prevMarkers) => [...prevMarkers, marker]);
    };

    const handleDeleteAirport = () => {
        const dropdown = document.getElementById('airportDropdown') as HTMLSelectElement;
        if (!map || !dropdown) return;

        const [lat, lon] = dropdown.value.split(',').map(Number);

        const markerToRemove = markers.find(
            (marker) => marker.getLatLng().lat === lat && marker.getLatLng().lng === lon
        );

        if (markerToRemove) {
            map.removeLayer(markerToRemove);
            setMarkers((prevMarkers) => prevMarkers.filter((m) => m !== markerToRemove));
        } else {
            alert('Marker not found for this airport!');
        }
    };

    return (
        <>
            <Head>
                <title>Airport Map</title>
                <link
                    rel="stylesheet"
                    href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
                />
            </Head>
            <main style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
                <div
                    id="map"
                    style={{
                        flexGrow: 1, // Ensures the map takes up remaining space
                        width: '100%',
                    }}
                ></div>
                <div
                    id="controls"
                    style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        zIndex: 1000,
                        background: 'white',
                        padding: '10px',
                        borderRadius: '5px',
                        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
                    }}
                >
                    <label htmlFor="airportDropdown" style={{color: 'black' }}>Choose an airport:</label>
                    <select id="airportDropdown" style={{ marginBottom: '10px', width: '100%', color: 'black'}}>
                        <option value="37.6213,-122.379">KSFO - San Francisco International</option>
                        <option value="33.9428,-118.4081">KLAX - Los Angeles International</option>
                        <option value="38.3768,-121.9586">KSMF - Sacramento International</option>
                        <option value="32.7338,-117.1933">KSAN - San Diego International</option>
                        <option value="37.7213,-122.2214">KOAK - Oakland International</option>
                        {/* Add more options here */}
                    </select>
                    <button
                        id="addAirportBtn"
                        style={{ marginBottom: '5px', width: '100%' }}
                        onClick={handleAddAirport}
                    >
                        Add Airport
                    </button>
                    <button
                        id="deleteAirportBtn"
                        style={{ width: '100%' }}
                        onClick={handleDeleteAirport}
                    >
                        Delete Airport
                    </button>
                </div>
            </main>
        </>
    );
}
