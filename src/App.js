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

const LegendContainer = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: white;
  border-radius: 5px;
  box-shadow: 0 0 10px rgba(0,0,0,0.1);
  z-index: 2000;
  transition: max-height 0.3s ease-out;
  max-height: ${props => props.isExpanded ? '70vh' : '40px'};
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-width: 200px;
  
  /* Ensure container stays above Safari UI */
  -webkit-transform: translateZ(1px);
  transform: translateZ(1px);
`;

const LegendContent = styled.div`
  padding: 10px;
  overflow-y: auto;
  flex-grow: 1;
`;

const LegendHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  cursor: pointer;
  background-color: #f0f0f0;
  border-top-left-radius: 5px;
  border-top-right-radius: 5px;
  position: relative;
  z-index: 2001;
  
  /* Ensure header stays clickable */
  -webkit-transform: translateZ(2px);
  transform: translateZ(2px);
`;

const LegendTitle = styled.span`
  font-weight: bold;
`;

const LegendToggle = styled.button`
background: none;
border: none;
cursor: pointer;
font-size: 18px;
padding: 5px;
margin: -5px;

/* Increase touch target size */
@media (max-width: 768px) {
  padding: 10px;
  margin: -10px;
}
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 5px;
`;

const LegendColor = styled.div`
  width: 20px;
  height: 20px;
  margin-right: 10px;
  border-radius: ${props => props.isCircle ? '50%' : '0'};
`;

const LegendLabel = styled.span`
  font-size: 14px;
`;

const ToggleButton = styled.button`
  position: fixed;
  top: 10px;
  right: 10px;
  z-index: 2000;
  background-color: white;
  border: 2px solid rgba(0,0,0,0.2);
  border-radius: 4px;
  padding: 5px 10px;
  font-size: 14px;
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  
  /* Ensure button stays above Safari UI */
  -webkit-transform: translateZ(1px);
  transform: translateZ(1px);
  
  &:hover {
    background-color: #f4f4f4;
  }
  
  /* Add touch target padding for mobile */
  @media (max-width: 768px) {
    padding: 8px 12px;
  }
`;

const ArtMap = () => {
  const [artworks, setArtworks] = useState([]);
  const [subwayLines, setSubwayLines] = useState([]);
  const [error, setError] = useState(null);
  const [showSubwayLines, setShowSubwayLines] = useState(true);
  const [isLegendExpanded, setIsLegendExpanded] = useState(true);

  const subwayLineColors = {
    'A-C-E': '#0039A6',
    'B-D-F-M': '#FF6319',
    'G': '#6CBE45',
    'J-Z': '#996633',
    'L': '#A7A9AC',
    'N-Q-R-W': '#FCCC0A',
    '1-2-3': '#EE352E',
    '4-5-6': '#00933C',
    '7': '#B933AD',
    'S': '#808183',
  };

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
    const routeSymbol = line.rt_symbol || line.name;
    for (const [group, color] of Object.entries(subwayLineColors)) {
      if (group.includes(routeSymbol)) {
        return color;
      }
    }
    return '#000000'; // default color if no match found
  };

  const SubwayLines = () => {
    if (!showSubwayLines) return null;

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
  
    const getColor = (count) => {
      // Color gradient from light blue to dark blue
      if (count === 1) return '#BBDEFB';
      if (count === 2) return '#64B5F6';
      if (count === 3) return '#2196F3';
      if (count === 4) return '#1976D2';
      return '#0D47A1'; // 5 or more
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
  
          const artworkCount = stationArtworks.length;
          const fillColor = getColor(artworkCount);
  
          return (
            <CircleMarker
              key={stationName}
              center={center}
              radius={10}
              fillColor={fillColor}
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

  const Legend = () => {

    const toggleLegend = () => {
      setIsLegendExpanded(!isLegendExpanded);
    };

    return (
      <LegendContainer isExpanded={isLegendExpanded}>
        <LegendHeader onClick={toggleLegend}>
          <LegendTitle>Legend</LegendTitle>
          <LegendToggle>{isLegendExpanded ? '▼' : '▲'}</LegendToggle>
        </LegendHeader>
        <LegendContent>
        <LegendItem>
          <LegendColor style={{ background: '#0D47A1' }} isCircle />
          <LegendLabel>5 or more</LegendLabel>
        </LegendItem>
        <LegendItem>
          <LegendColor style={{ background: '#1976D2' }} isCircle />
          <LegendLabel>4 artworks</LegendLabel>
        </LegendItem>
        <LegendItem>
          <LegendColor style={{ background: '#2196F3' }} isCircle />
          <LegendLabel>3 artworks</LegendLabel>
        </LegendItem>
        <LegendItem>
          <LegendColor style={{ background: '#64B5F6' }} isCircle />
          <LegendLabel>2 artworks</LegendLabel>
        </LegendItem>
        <LegendItem>
          <LegendColor style={{ background: '#BBDEFB' }} isCircle />
          <LegendLabel>1 artwork</LegendLabel>
        </LegendItem>
          {Object.entries(subwayLineColors).map(([name, color]) => (
            <LegendItem key={name}>
              <LegendColor style={{ background: color }} />
              <LegendLabel>{name}</LegendLabel>
            </LegendItem>
          ))}
        </LegendContent>
      </LegendContainer>
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
        <SubwayLines />
        <MapEventHandler groupedArtworks={groupedArtworks} />
        <Legend />
      </MapContainer>
      <ToggleButton onClick={() => setShowSubwayLines(!showSubwayLines)}>
        {showSubwayLines ? 'Hide Subway Lines' : 'Show Subway Lines'}
      </ToggleButton>
    </>
  );
};

const App = () => <ArtMap />;
export default App;