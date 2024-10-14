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

  it('renders the map container and fetches artwork and subway line data', async () => {
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
      expect(screen.getByTestId('tile-layer')).toBeInTheDocument();
      expect(screen.getByTestId('circle-marker')).toBeInTheDocument();
      expect(screen.getAllByTestId('popup')).toHaveLength(3);
      expect(screen.getAllByTestId('polyline')).toHaveLength(2);
    });
  });

  it('displays subway lines with correct colors', async () => {
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
      const polylines = screen.getAllByTestId('polyline');
      expect(polylines[0]).toHaveAttribute('data-color', '#0039A6'); // Color for A line
      expect(polylines[1]).toHaveAttribute('data-color', '#FF6319'); // Color for B line
    });
  });

  it('displays subway line information in popup', async () => {
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
      const popups = screen.getAllByTestId('popup');
      const subwayPopups = popups.filter(popup => within(popup).queryByText(/^Line:/));
      expect(subwayPopups).toHaveLength(2);
      expect(within(subwayPopups[0]).getByText('Line: A')).toBeInTheDocument();
      expect(within(subwayPopups[1]).getByText('Line: B')).toBeInTheDocument();
    });
  });

  it('displays artwork details with styled popup content', async () => {
    const user = userEvent.setup();
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
      const artworkPopup = screen.getAllByTestId('popup').find(popup => within(popup).queryByText('Test Station 1'));
      expect(artworkPopup).toBeInTheDocument();
    });

    const artworkButton = screen.getByText('Artwork 1 by Artist 1');
    await user.click(artworkButton);

    await waitFor(() => {
      const popupContent = screen.getByText('Artwork 1').closest('div');
      expect(popupContent).toHaveClass('sc-blHHSb');
      
      const title = within(popupContent).getByText('Artwork 1');
      expect(title.tagName).toBe('H3');
      
      const moreInfoLink = within(popupContent).getByText('More Info');
      expect(moreInfoLink).toHaveAttribute('href', 'https://example.com/image1.jpg');
    });
  });
});