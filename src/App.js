import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import styled, { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  .leaflet-popup-content-wrapper {
    width: 300px;
    height: auto;
    max-height: 300px;
    padding: 0;
  }
  .leaflet-popup-content {
    margin: 0;
    width: 100% !important;
    height: 100%;
    max-height: 300px;
    overflow-y: auto;
  }
  .leaflet-popup-close-button {
    z-index: 1000;
  }
`;

const StyledPopupContent = styled.div`
  width: 100%;
  padding: 13px;
  box-sizing: border-box;
  
  h3 {
    margin-top: 0;
    margin-bottom: 10px;
  }
  
  ul {
    list-style-type: disc;
    padding-left: 20px;
    margin-bottom: 13px;
    margin-top: 0;
  }
  
  li {
    margin-bottom: 5px;
  }
  
  a {
    color: blue;
    text-decoration: none;
    cursor: pointer;
    
    &:hover {
      text-decoration: underline;
    }
  }

  p {
    margin: 5px 0;
  }
`;

const ArtMap = () => {
  const [artworks, setArtworks] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchArtworks = async () => {
      const apiUrl = process.env.REACT_APP_API_URL;
      if (!apiUrl) {
        setError('API URL is not defined');
        return;
      }

      try {
        const response = await fetch(`${apiUrl}/artworks`);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setArtworks(data);
      } catch (error) {
        setError('Error fetching artwork data');
        console.error('Error fetching artwork data:', error);
      }
    };

    fetchArtworks();
  }, []);

  const groupedArtworks = useMemo(() => {
    return artworks.reduce((acc, artwork) => {
      if (!acc[artwork.station_name]) {
        acc[artwork.station_name] = [];
      }
      acc[artwork.station_name].push(artwork);
      return acc;
    }, {});
  }, [artworks]);

  const SingleArtworkContent = ({ artwork }) => (
    <StyledPopupContent>
      <h3>{artwork.art_title}</h3>
      <p>Artist: {artwork.artist}</p>
      <p>Date: {artwork.art_date}</p>
      <p>Material: {artwork.art_material}</p>
      <p>{artwork.art_description}</p>
      {artwork.art_image_link && artwork.art_image_link.url && (
        <a href={artwork.art_image_link.url} target="_blank" rel="noopener noreferrer">More Info</a>
      )}
    </StyledPopupContent>
  );

  const MultipleArtworkContent = ({ artworks }) => {
    const [selectedArtwork, setSelectedArtwork] = useState(null);

    const handleArtworkClick = (e, artwork) => {
      e.preventDefault();
      e.stopPropagation();
      setSelectedArtwork(artwork);
    };

    if (selectedArtwork) {
      return (
        <StyledPopupContent>
          <a onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setSelectedArtwork(null);
          }}>
            &lt; Back to list
          </a>
          <SingleArtworkContent artwork={selectedArtwork} />
        </StyledPopupContent>
      );
    }

    return (
      <StyledPopupContent>
        <h3>{artworks[0].station_name}</h3>
        <p>Total Artworks: {artworks.length}</p>
        <ul>
          {artworks.map(artwork => (
            <li key={artwork.art_id}>
              <a onClick={(e) => handleArtworkClick(e, artwork)}>
                {artwork.art_title} by {artwork.artist}
              </a>
            </li>
          ))}
        </ul>
      </StyledPopupContent>
    );
  };


  const ArtworkPopup = ({ artworks }) => {
    if (artworks.length === 1) {
      return <SingleArtworkContent artwork={artworks[0]} />;
    }
    return <MultipleArtworkContent artworks={artworks} />;
  };

  if (error) {
    return <div data-testid="error">Error: {error}</div>;
  }

  return (
    <>
      <GlobalStyle />
      <MapContainer center={[40.7128, -74.0060]} zoom={11} style={{ height: '100vh', width: '100%' }} data-testid="map-container">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" data-testid="tile-layer" />
        
        {Object.entries(groupedArtworks).map(([stationName, stationArtworks]) => {
          const center = stationArtworks.reduce(
            (acc, artwork) => {
              acc[0] += artwork.latitude;
              acc[1] += artwork.longitude;
              return acc;
            },
            [0, 0]
          ).map(coord => coord / stationArtworks.length);

          return (
            <CircleMarker
              key={stationName}
              center={center}
              radius={5}
              fillColor="#1e90ff"
              color="#000"
              weight={1}
              opacity={1}
              fillOpacity={0.8}
              data-testid="circle-marker"
            >
              <Popup data-testid="popup">
                <ArtworkPopup artworks={stationArtworks} />
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </>
  );
};

export default ArtMap;