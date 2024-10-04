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

// Styles for the scrollable popup content
const popupContentStyle = {
  maxHeight: '500px', // Set your desired maximum height here
  overflowY: 'auto',
  padding: '10px'
};

function App() {
  const [artworks, setArtworks] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const apiUrl = process.env.REACT_APP_API_URL;
    console.log('API URL:', apiUrl);

    if (!apiUrl) {
      setError('API URL is not defined. Check your environment variables.');
      setIsLoading(false);
      return;
    }

    fetch(`${apiUrl}/artworks`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('Fetched data:', data);
        setArtworks(data);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error fetching artworks:', error);
        setError(`Failed to fetch artworks: ${error.message}. Please check the API URL and try again.`);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return (
      <div>
        <h1>Error</h1>
        <p>{error}</p>
        <p>Current API URL: {process.env.REACT_APP_API_URL}</p>
        <p>If this URL is incorrect, please update your environment variables.</p>
      </div>
    );
  }

  return (
    <div>
      <h1>NYC Subway Art Map</h1>
      {artworks.length === 0 ? (
        <p>No artworks found. The API might be empty or returning an empty array.</p>
      ) : (
        <MapContainer center={[40.7128, -74.0060]} zoom={11} style={{ height: '90vh', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {artworks.map((artwork, index) => (
            <Marker key={index} position={[artwork.latitude, artwork.longitude]}>
              <Popup>
                <div style={popupContentStyle}>
                  <h3 style={{ fontWeight: 'bold' }}>{artwork.art_title}</h3>
                  <p>Artist: {artwork.artist}</p>
                  <p>Year: {artwork.art_date}</p>
                  <p>Material: {artwork.art_material}</p>
                  <p>Station: {artwork.station_name}</p>
                  <p>Description: {artwork.art_description}</p>
                  {artwork.art_image_link && artwork.art_image_link.url && (
                    <p><a href={artwork.art_image_link.url} target="_blank" rel="noopener noreferrer">More Information</a></p>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      )}
    </div>
  );
}

export default App;