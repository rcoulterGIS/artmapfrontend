import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline, useMap } from 'react-leaflet';
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
    list-style-type: none;
    padding-left: 0;
    margin-bottom: 13px;
    margin-top: 0;
  }
  
  li {
    display: flex;
    align-items: flex-start;
    margin-bottom: 5px;
  }
  
  li::before {
    content: "•";
    display: inline-block;
    width: 1em;
    margin-right: 0.5em;
    flex-shrink: 0;
  }
  
  button {
    background: none;
    border: none;
    color: blue;
    text-decoration: none;
    cursor: pointer;
    padding: 0;
    font: inherit;
    text-align: left;
    
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
  const [subwayLines, setSubwayLines] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const apiUrl = process.env.REACT_APP_API_URL;
      const subwayLinesUrl = 'https://data.cityofnewyork.us/resource/s7zz-qmyz.json';
      
      if (!apiUrl) {
        setError('API URL is not defined');
        return;
      }

      try {
        const [artworksResponse, subwayLinesResponse] = await Promise.all([
          fetch(`${apiUrl}/artworks`),
          fetch(subwayLinesUrl)
        ]);

        if (!artworksResponse.ok || !subwayLinesResponse.ok) {
          throw new Error('One or more network responses were not ok');
        }

        const [artworksData, subwayLinesData] = await Promise.all([
          artworksResponse.json(),
          subwayLinesResponse.json()
        ]);

        setArtworks(artworksData);
        setSubwayLines(subwayLinesData);
      } catch (error) {
        setError('Error fetching data');
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
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
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setSelectedArtwork(null);
            }}
          >
            &lt; Back to list
          </button>
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
              <button onClick={(e) => handleArtworkClick(e, artwork)}>
                {artwork.art_title} by {artwork.artist}
              </button>
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

  
const getSubwayLineColor = (line) => {
  const colorMap = {
    '1': '#EE352E',
    '2': '#EE352E',
    '3': '#EE352E',
    '4': '#00933C',
    '5': '#00933C',
    '6': '#00933C',
    '7': '#B933AD',
    'A': '#0039A6',
    'C': '#0039A6',
    'E': '#0039A6',
    'B': '#FF6319',
    'D': '#FF6319',
    'F': '#FF6319',
    'M': '#FF6319',
    'G': '#6CBE45',
    'J': '#996633',
    'Z': '#996633',
    'L': '#A7A9AC',
    'N': '#FCCC0A',
    'Q': '#FCCC0A',
    'R': '#FCCC0A',
    'S': '#808183',
    'W': '#FCCC0A'
  };

  if (line.color) {
    return line.color;
  }

  const routeSymbol = line.rt_symbol || line.name;
  return colorMap[routeSymbol] || '#000000';
};

const SubwayLines = () => {
  return subwayLines.map((line) => {
    const coordinates = line.the_geom.coordinates.map(coord => [coord[1], coord[0]]);
    const lineColor = getSubwayLineColor(line);
    return (
      <Polyline
        key={line.objectid}
        positions={coordinates}
        color={lineColor}
        weight={3}
      >
        <Popup>
          <StyledPopupContent>
            <h3>Line: {line.name}</h3>
            <p>Route Symbol: {line.rt_symbol}</p>
            <a href={line.url} target="_blank" rel="noopener noreferrer">More Info</a>
          </StyledPopupContent>
        </Popup>
      </Polyline>
    );
  });
};
  const MapEventHandler = ({ groupedArtworks }) => {
    const map = useMap();

    const handleMarkerClick = (center) => {
      map.setView(center, 14, { animate: true });
    };

    return (
      <>
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
              eventHandlers={{
                click: () => handleMarkerClick(center),
              }}
            >
              <Popup>
                <ArtworkPopup artworks={stationArtworks} />
              </Popup>
            </CircleMarker>
          );
        })}
      </>
    );
  };

  if (error) {
    return <div data-testid="error">Error: {error}</div>;
  }

  return (
    <>
      <GlobalStyle />
      <MapContainer center={[40.7128, -74.0060]} zoom={11} style={{ height: '100vh', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <SubwayLines/>
        <MapEventHandler groupedArtworks={groupedArtworks} />
      </MapContainer>
    </>
  );
};

const App = () => <ArtMap />;
export default App;