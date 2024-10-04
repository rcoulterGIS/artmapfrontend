import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Import the marker icon images
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Create a custom icon
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Set the custom icon as the default icon for all markers
L.Marker.prototype.options.icon = DefaultIcon;

function App() {
  const [artworks, setArtworks] = useState([]);

  useEffect(() => {
    // Fetch artworks data from your API
    fetch('https://artmap-backend-85d5bd8d0796.herokuapp.com/artworks')
      .then(response => response.json())
      .then(data => setArtworks(data))
      .catch(error => console.error('Error fetching artworks:', error));
  }, []);

  return (
    <MapContainer center={[40.7128, -74.0060]} zoom={11} style={{ height: '100vh', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {artworks.map((artwork, index) => (
        <Marker key={index} position={[artwork.latitude, artwork.longitude]}>
          <Popup>
            <b>{artwork.station_name}</b><br />
            <b>Art Installation:</b><br />
            Title: {artwork.art_title}<br />
            Artist: {artwork.artist}<br />
            Date: {artwork.art_date}<br />
            Material: {artwork.art_material}<br />
            {artwork.art_image_link && artwork.art_image_link.url && (
              <a href={artwork.art_image_link.url} target="_blank" rel="noopener noreferrer">More Information</a>
            )}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

export default App;