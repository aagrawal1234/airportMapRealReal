'use client';

import { useState, useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import Head from 'next/head';

L.Icon.Default.mergeOptions({
    iconUrl: markerIcon.src,
    iconRetinaUrl: markerIcon2x.src,
    shadowUrl: markerShadow.src,
});

export default function Page() {
    const [map, setMap] = useState<L.Map | null>(null);
    const [markers, setMarkers] = useState<L.Marker[]>([]);
    let activeLine: L.Polyline | null = null;

    const krhvCoords: L.LatLngTuple = [37.3326, -121.8192];

    useEffect(() => {
        const initMap = L.map('map').setView([37.7749, -122.4194], 7); // Center near San Francisco
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors',
        }).addTo(initMap);
        setMap(initMap);

        return () => {
            initMap.remove();
        };
    }, []);

    const fetchWeather = async (lat: number, lon: number): Promise<string> => {
        try {
            const response = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
            );
            const data = await response.json();
            const temperatureCelcius = data.current_weather.temperature;
            const temperatureFahrenheit = (temperatureCelcius * 1.8) + 32;
            const windSpeedKmh = data.current_weather.windspeed;
            const windSpeedMph = windSpeedKmh * 0.621371;

            return `Temperature: ${temperatureFahrenheit.toFixed(0)}°F<br>Wind Speed: ${windSpeedMph.toFixed(0)} mph`;
        } catch (error) {
            console.error('Error fetching weather data:', error);
            return 'Weather data not available.';
        }
    };

    const handleAddAirport = () => {
        const dropdown = document.getElementById('airportDropdown') as HTMLSelectElement;
        if (!map || !dropdown) return;

        const [lat, lon] = dropdown.value.split(',').map(Number);
        const airportName = dropdown.options[dropdown.selectedIndex].text;

        const existingMarker = markers.find(
            (marker) => marker.getLatLng().lat === lat && marker.getLatLng().lng === lon
        );

        if (existingMarker) {
            alert('Airport already exists on the map!');
            return;
        }

        const marker = L.marker([lat, lon])
            .addTo(map)
            .bindPopup(`<b>${airportName}</b>`)
            .on('click', () => handleMarkerClick(lat, lon, marker, airportName))
            .on('popupclose', handlePopupClose);

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

            // Remove the line if it corresponds to the deleted airport
            if (activeLine) {
                map.removeLayer(activeLine);
                activeLine = null;
            }
        } else {
            alert('Marker not found for this airport!');
        }
    };

    const handleMarkerClick = async (lat: number, lon: number, marker: L.Marker, name: string) => {
        if (!map) return;

        // Fetch and display weather info
        const weatherInfo = await fetchWeather(lat, lon);
        marker.bindPopup(`<b>${name}</b><br>${weatherInfo}`).openPopup();

        // Remove existing line
        if (activeLine) {
            map.removeLayer(activeLine);
            activeLine = null;
        }

        const routeCoords: L.LatLngExpression[] = [
            krhvCoords,
            [lat, lon],
        ];

        // Create and add the new line
        activeLine = L.polyline(routeCoords, {
            color: 'blue',
            weight: 2,
            dashArray: '5, 10',
            className: 'animated-line',
        }).addTo(map);
    };

    const handlePopupClose = () => {
        if (!map) return;

        // Remove the active line
        if (activeLine) {
            map.removeLayer(activeLine);
            activeLine = null;
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
                        flexGrow: 1,
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
                    <label htmlFor="airportDropdown" style={{ color: 'black' }}>Choose an airport:</label>
                    <select id="airportDropdown" style={{ marginBottom: '10px', width: '100%', color: 'black' }}>
                        {/* Class B Airports */}
                        <optgroup label="Class B">
                            <option value="37.6213,-122.379">KSFO - San Francisco International</option>
                            <option value="33.9428,-118.4081">KLAX - Los Angeles International</option>
                            <option value="32.7338,-117.1933">KSAN - San Diego International</option>
                            <option value="37.7213,-122.2214">KOAK - Oakland International</option>
                            <option value="37.3626,-121.929">KSJC - San Jose International</option>
                            <option value="38.6953,-121.5908">KSMF - Sacramento International</option>
                        </optgroup>

                        {/* Class C Airports */}
                        <optgroup label="Class C">
                            <option value="36.5870,-121.8430">KMRY - Monterey Regional</option>
                            <option value="35.0403,-118.5709">KBFL - Meadows Field (Bakersfield)</option>
                            <option value="34.2008,-118.3590">KBUR - Hollywood Burbank</option>
                            <option value="33.6757,-117.8682">KSNA - John Wayne (Orange County)</option>
                            <option value="34.4262,-119.8408">KSBA - Santa Barbara Municipal</option>
                            <option value="33.8272,-118.1517">KLGB - Long Beach Airport</option>
                        </optgroup>

                        {/* Class D Airports */}
                        <optgroup label="Class D">
                            <option value="37.3326,-121.8192">KRHV - Reid-Hillview</option>
                            <option value="37.5133,-122.5008">KHAF - Half Moon Bay</option>
                            <option value="38.5125,-121.4925">KSAC - Sacramento Executive</option>
                            <option value="35.6883,-121.1839">KPRB - Paso Robles Municipal</option>
                            <option value="33.1282,-117.2808">KCRQ - McClellan-Palomar</option>
                            <option value="34.5128,-120.5025">L52 - Oceano County</option>
                            <option value="34.5975,-120.0222">KSBP - San Luis Obispo</option>
                            <option value="34.2003,-118.4934">KVNY - Van Nuys</option>
                            <option value="34.0853,-117.1461">KONT - Ontario International</option>
                            <option value="37.6598,-120.9574">KMOD - Modesto City-County</option>
                            <option value="38.2658,-121.2973">KTCY - Tracy Municipal</option>
                            <option value="35.3851,-119.0573">L45 - Taft-Kern County</option>
                        </optgroup>

                        {/* Class G Airports */}
                        <optgroup label="Class G">
                            <option value="37.7421,-122.1362">KCCR - Concord Buchanan Field</option>
                            <option value="37.2388,-120.945">KMER - Castle Airport</option>
                            <option value="38.2230,-120.5638">KCPU - Calaveras County</option>
                            <option value="39.2627,-121.3588">KMYV - Marysville Yuba County</option>
                            <option value="36.7311,-119.8196">KFCH - Fresno Chandler Executive</option>
                            <option value="36.7761,-119.7191">E79 - Sierra Sky Park</option>
                            <option value="38.1931,-122.2515">KDVO - Gnoss Field</option>
                            <option value="38.7808,-121.3216">KAUN - Auburn Municipal</option>
                            <option value="35.9798,-120.5317">KPRB - Paso Robles Municipal</option>
                            <option value="36.6566,-121.6107">KSNS - Salinas Municipal</option>
                            <option value="34.4261,-117.3112">KVCV - Southern California Logistics</option>
                            <option value="35.6468,-117.6686">KNID - China Lake Naval Air</option>
                            <option value="34.085,-117.1456">KRAL - Riverside Municipal</option>
                            <option value="33.2375,-117.0486">KOKB - Oceanside Municipal</option>
                            <option value="34.0522,-117.3264">KSBD - San Bernardino International</option>
                            <option value="35.7858,-120.7278">KL52 - San Miguel Ranch</option>
                            <option value="35.3850,-119.0573">L45 - Taft Kern County</option>
                            <option value="38.9170,-120.0036">KTVL - Lake Tahoe Airport</option>
                            <option value="33.6742,-116.2318">KTRM - Jacqueline Cochran Regional</option>
                            <option value="39.2758,-120.7061">KTRK - Truckee Tahoe</option>
                            <option value="39.5868,-122.2769">KRDD - Redding Municipal</option>
                            <option value="34.1192,-119.1200">KSZT - Camarillo Airport</option>
                            <option value="33.7983,-116.5066">KPSP - Palm Springs International</option>
                            <option value="35.3852,-118.9966">MEV - Minden-Tahoe</option>
                        </optgroup>
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
