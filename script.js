// Initialize the map and set its view to California
const map = L.map('map').setView([37.7749, -122.4194], 7); // Centered near San Francisco

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

const krhvCoords = [37.3326, -121.8192];
let activeLine = null;
let planeMarker = null;
let animationFrame = null;

function loadSavedAirports() {
    fetch('http://localhost:4000/airports')
        .then(response => response.json())
        .then(data => {
            data.forEach(airport => {
                const marker = L.marker([airport.lat, airport.lon]).addTo(map);
                marker.bindPopup(`<b>${airport.name}</b>`);

                // Add click and popup-close behavior for saved airports
                setupMarkerBehavior(marker, airport.lat, airport.lon, airport.name);
            });
        })
        .catch(err => console.error("Error fetching saved airports:", err));
}

function addAirport() {
    const dropdown = document.getElementById('airportDropdown');
    const selectedValue = dropdown.value; // e.g., "37.6213,-122.3790"
    const [lat, lon] = selectedValue.split(',').map(Number);
    const airportName = dropdown.options[dropdown.selectedIndex].text;

    fetch('http://localhost:4000/airports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: airportName, lat, lon })
    })
        .then(response => response.json())
        .then(data => {
            const marker = L.marker([lat, lon]).addTo(map);
            marker.bindPopup(`<b>${airportName}</b>`).openPopup();

            // Add click and popup-close behavior for the new marker
            setupMarkerBehavior(marker, lat, lon, airportName);
        })
        .catch(err => console.error("Error adding airport:", err));
}

function deleteAirport() {
    const dropdown = document.getElementById('airportDropdown');
    const selectedValue = dropdown.value; // e.g., "37.6213,-122.379"
    const [lat, lon] = selectedValue.split(',').map(Number);
    const airportName = dropdown.options[dropdown.selectedIndex].text;

    // Find the airport ID from the backend
    fetch('http://localhost:4000/airports')
        .then(response => response.json())
        .then(airports => {
            // Find the selected airport in the list of saved airports
            const airportToDelete = airports.find(
                airport => airport.name === airportName && airport.lat === lat && airport.lon === lon
            );

            if (!airportToDelete) {
                alert("Error: Airport not found in the database.");
                return;
            }

            // Send a DELETE request to the backend
            fetch(`http://localhost:4000/airports/${airportToDelete._id}`, {
                method: 'DELETE',
            })
                .then(response => {
                    if (response.ok) {
                        alert(`Airport ${airportName} deleted successfully.`);
                        // Remove the marker from the map
                        removeMarker(lat, lon);
                    } else {
                        alert("Error deleting airport.");
                    }
                })
                .catch(err => console.error("Error deleting airport:", err));
        })
        .catch(err => console.error("Error fetching airports:", err));
}

// Helper function to remove a marker by its coordinates
function removeMarker(lat, lon) {
    map.eachLayer(layer => {
        if (layer instanceof L.Marker) {
            const layerLatLng = layer.getLatLng();
            if (layerLatLng.lat === lat && layerLatLng.lng === lon) {
                map.removeLayer(layer);
            }
        }
    });
}


function setupMarkerBehavior(marker, lat, lon, name) {
    marker.on('click', () => {
        console.log(`Clicked on: ${name}`);
        fetchWeather(lat, lon, (weatherInfo) => {
            marker.bindPopup(`<b>${name}</b><br>${weatherInfo}`).openPopup();

            // Remove the previous line and animations
            if (activeLine) map.removeLayer(activeLine);
            if (planeMarker) map.removeLayer(planeMarker);
            if (animationFrame) cancelAnimationFrame(animationFrame);

            const routeCoords = [krhvCoords, [lat, lon]];
            activeLine = L.polyline(routeCoords, {
                color: 'blue',
                weight: 2,
                dashArray: '5, 10',
                className: 'animated-line'
            }).addTo(map);

            animatePlaneSmoothly(routeCoords);
        });
    });

    marker.on('popupclose', () => {
        if (activeLine) map.removeLayer(activeLine);
        if (planeMarker) map.removeLayer(planeMarker);
        if (animationFrame) cancelAnimationFrame(animationFrame);
    });
}

function fetchWeather(lat, lon, callback) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
    fetch(url)
        .then(response => response.json())
        .then(data => {
            const temperatureCelcius = data.current_weather.temperature;
            const temperatureFarenheit = (temperatureCelcius * 1.8) + 32
            const windSpeedkmh = data.current_weather.windspeed;
            const windSpeedmph = windSpeedkmh * 0.621371;
            callback(`Temperature: ${temperatureFarenheit.toFixed(0)}°F<br>Wind Speed: ${windSpeedmph.toFixed(0)} mph`);
        })
        .catch(error => {
            console.error("Error fetching weather data:", error);
            callback("Weather data not available.");
        });
}


 function animatePlaneSmoothly(routeCoords) {
    let progress = 0; // Progress along the line (0 to 1)
    const speed = 0.003; // Adjust speed (lower = slower)

    // Create a plane icon
    const planeIcon = L.divIcon({
        className: 'plane-icon',
        html: '🔴', // Use the red emoji dot
        iconSize: [20, 20] // Size of the icon
    });

    // Add the plane marker to the map if it doesn't already exist
    if (!planeMarker) {
        planeMarker = L.marker(routeCoords[0], { icon: planeIcon }).addTo(map);
    } else {
        planeMarker.setLatLng(routeCoords[0]); // Reset the position to the start
    }
    if (animationFrame) {
        cancelAnimationFrame(animationFrame);
    }
    // Function to interpolate between two points
    function interpolate(start, end, t) {
        return [
            start[0] + (end[0] - start[0]) * t,
            start[1] + (end[1] - start[1]) * t
        ];
    }

    // Animation loop
    function step() {
        if (progress >= 1) {
            progress = 0; // Restart the animation
        } else {
            progress += speed; // Increment progress
        }

        // Calculate the current position of the plane
        const currentPos = interpolate(routeCoords[0], routeCoords[1], progress);
        planeMarker.setLatLng(currentPos); // Update the plane's position

        

        // Request the next animation frame
        animationFrame = requestAnimationFrame(step);
    }

    // Start the animation
    step();
} 

loadSavedAirports();

document.getElementById('addAirportBtn').addEventListener('click', addAirport);
document.getElementById('deleteAirportBtn').addEventListener('click', deleteAirport);
