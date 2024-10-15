import React from 'react';
import { render, screen, waitFor, act, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import App from './App';

const mockSetView = jest.fn();
const mockEventHandlers = {};

jest.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  CircleMarker: ({ children, eventHandlers, center }) => {
    mockEventHandlers.click = eventHandlers.click;
    return (
      <div data-testid="circle-marker" onClick={() => eventHandlers.click()} data-center={JSON.stringify(center)}>
        {children}
      </div>
    );
  },
  Popup: ({ children }) => <div data-testid="popup">{children}</div>,
  useMap: () => ({ setView: mockSetView }),
  Polyline: ({ children, positions, color }) => (
    <div data-testid="polyline" data-positions={JSON.stringify(positions)} data-color={color}>
      {children}
    </div>
  ),
}));

// Mock the fetch function
global.fetch = jest.fn();

const mockArtworks = [
  {
    art_id: '1',
    station_name: 'Test Station 1',
    art_title: 'Artwork 1',
    artist: 'Artist 1',
    art_date: '2021',
    art_material: 'Oil on canvas',
    art_description: 'A beautiful painting',
    art_image_link: { url: 'https://example.com/image1.jpg' },
    latitude: 40.7128,
    longitude: -74.0060,
  },
  {
    art_id: '2',
    station_name: 'Test Station 1',
    art_title: 'Artwork 2',
    artist: 'Artist 2',
    art_date: '2022',
    art_material: 'Sculpture',
    art_description: 'An impressive sculpture',
    art_image_link: { url: 'https://example.com/image2.jpg' },
    latitude: 40.7128,
    longitude: -74.0060,
  },
];

const mockSubwayLines = [
  {
    objectid: '1',
    name: 'A',
    rt_symbol: 'A',
    the_geom: {
      type: 'LineString',
      coordinates: [[-74.0060, 40.7128], [-74.0070, 40.7138]]
    }
  },
  {
    objectid: '2',
    name: 'B',
    rt_symbol: 'B',
    the_geom: {
      type: 'LineString',
      coordinates: [[-73.9960, 40.7228], [-73.9970, 40.7238]]
    }
  },
  {
    objectid: '3',
    name: '1',
    rt_symbol: '1',
    the_geom: {
      type: 'LineString',
      coordinates: [[-73.9860, 40.7328], [-73.9870, 40.7338]]
    }
  }
];

describe('ArtMap Component', () => {
  let originalError;

  beforeEach(() => {
    fetch.mockClear();
    mockSetView.mockClear();
    process.env.REACT_APP_API_URL = 'http://test-api.com';
    originalError = console.error;
    console.error = jest.fn();
  });

  afterEach(() => {
    console.error = originalError;
  });

  const setupTest = async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockArtworks,
    }).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSubwayLines,
    });

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.getByTestId('map-container')).toBeInTheDocument();
    });
  };

  it('renders the map container and fetches artwork and subway line data', async () => {
    await setupTest();
    
    expect(screen.getByTestId('tile-layer')).toBeInTheDocument();
    expect(screen.getByTestId('circle-marker')).toBeInTheDocument();
    expect(screen.getAllByTestId('popup')).toHaveLength(4); // 1 artwork popup + 3 subway line popups
    expect(screen.getAllByTestId('polyline')).toHaveLength(3);
  });

  it('displays subway lines with correct colors', async () => {
    await setupTest();
    
    const polylines = screen.getAllByTestId('polyline');
    expect(polylines[0]).toHaveAttribute('data-color', '#0039A6'); // Color for A-C-E line
    expect(polylines[1]).toHaveAttribute('data-color', '#FF6319'); // Color for B-D-F-M line
    expect(polylines[2]).toHaveAttribute('data-color', '#EE352E'); // Color for 1-2-3 line
  });

  it('displays subway line information in popup', async () => {
    await setupTest();
    
    const popups = screen.getAllByTestId('popup');
    const subwayPopups = popups.filter(popup => within(popup).queryByText(/^Line:/));
    expect(subwayPopups).toHaveLength(3);
    expect(within(subwayPopups[0]).getByText('Line: A')).toBeInTheDocument();
    expect(within(subwayPopups[1]).getByText('Line: B')).toBeInTheDocument();
    expect(within(subwayPopups[2]).getByText('Line: 1')).toBeInTheDocument();
  });

  it('displays artwork details with styled popup content', async () => {
    const user = userEvent.setup();
    await setupTest();
    
    const artworkPopup = screen.getAllByTestId('popup').find(popup => within(popup).queryByText('Test Station 1'));
    expect(artworkPopup).toBeInTheDocument();

    const artworkButton = screen.getByText('Artwork 1 by Artist 1');
    await user.click(artworkButton);

    const popupContent = screen.getByText('Artwork 1').closest('div');
    expect(popupContent).toHaveClass('sc-blHHSb jTCQlW'); 
    
    const title = within(popupContent).getByText('Artwork 1');
    expect(title.tagName).toBe('H3');
    
    const moreInfoLink = within(popupContent).getByText('More Info');
    expect(moreInfoLink).toHaveAttribute('href', 'https://example.com/image1.jpg');
  });

  it('renders the legend', async () => {
    await setupTest();
    
    const legend = screen.getByText('Legend');
    expect(legend).toBeInTheDocument();
  });

  it('displays correct items in the legend', async () => {
    await setupTest();
    
    expect(screen.getByText('Artwork Location')).toBeInTheDocument();
    expect(screen.getByText('A-C-E')).toBeInTheDocument();
    expect(screen.getByText('B-D-F-M')).toBeInTheDocument();
    expect(screen.getByText('1-2-3')).toBeInTheDocument();
  });

  it('collapses and expands the legend', async () => {
    const user = userEvent.setup();
    await setupTest();
    
    const legendToggle = screen.getByText('▼');
    expect(legendToggle).toBeInTheDocument();

    await user.click(legendToggle);
    expect(screen.getByText('▲')).toBeInTheDocument();

    await user.click(screen.getByText('▲'));
    expect(screen.getByText('▼')).toBeInTheDocument();
  });

  it('renders the subway line toggle button', async () => {
    await setupTest();
    
    const toggleButton = screen.getByText('Hide Subway Lines');
    expect(toggleButton).toBeInTheDocument();
  });

  it('toggles subway lines visibility when button is clicked', async () => {
    const user = userEvent.setup();
    await setupTest();
    
    expect(screen.getAllByTestId('polyline')).toHaveLength(3);

    const toggleButton = screen.getByText('Hide Subway Lines');
    await user.click(toggleButton);

    expect(screen.queryAllByTestId('polyline')).toHaveLength(0);
    expect(screen.getByText('Show Subway Lines')).toBeInTheDocument();

    await user.click(screen.getByText('Show Subway Lines'));

    expect(screen.getAllByTestId('polyline')).toHaveLength(3);
    expect(screen.getByText('Hide Subway Lines')).toBeInTheDocument();
  });
});