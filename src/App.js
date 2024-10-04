import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import axios from 'axios';

const API_URL = 'https://artmap-backend-85d5bd8d0796.herokuapp.com/artworks';

function App() {
  const [artworks, setArtworks] = useState([]);

  useEffect(() => {
    const fetchArtworks = async () => {
      try {
        const response = await axios.get(API_URL);
        setArtworks(response.data);
      } catch (error) {
        console.error('Error fetching artworks:', error);
      }
    };

    fetchArtworks();
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
            <br /><br />
            <b>Related Stations:</b><br />
            {artwork.related_stations.map((station, idx) => (
              <span key={idx}>
                {station.station_id}: {station.line} ({station.borough})<br />
              </span>
            ))}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

export default App;