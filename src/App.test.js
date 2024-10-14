import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import App from './App';

// Mock the leaflet library
const mockSetView = jest.fn();
jest.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  CircleMarker: ({ children, eventHandlers, center }) => (
    <div data-testid="circle-marker" onClick={() => eventHandlers.click()} data-center={JSON.stringify(center)}>
      {children}
    </div>
  ),
  Popup: ({ children }) => <div data-testid="popup">{children}</div>,
  useMap: () => ({ setView: mockSetView }),
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

describe('ArtMap Component', () => {
  let originalError;

  beforeEach(() => {
    fetch.mockClear();
    mockSetView.mockClear();
    process.env.REACT_APP_API_URL = 'http://test-api.com';
    // Store the original console.error
    originalError = console.error;
    // Mock console.error to suppress specific messages
    console.error = jest.fn();
  });

  afterEach(() => {
    // Restore the original console.error after each test
    console.error = originalError;
  });

  it('renders the map container and fetches artwork data', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockArtworks,
    });

    await act(async () => {
      render(<App />);
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('map-container')).toBeInTheDocument();
      expect(screen.getByTestId('tile-layer')).toBeInTheDocument();
      expect(screen.getByTestId('circle-marker')).toBeInTheDocument();
      expect(screen.getByTestId('popup')).toBeInTheDocument();
    });
  });

  it('displays an error message when API URL is not defined', async () => {
    delete process.env.REACT_APP_API_URL;

    await act(async () => {
      render(<App />);
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Error: API URL is not defined');
    });
  });

  it('displays an error message when fetch fails', async () => {
    fetch.mockRejectedValueOnce(new Error('Fetch failed'));

    await act(async () => {
      render(<App />);
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Error: Error fetching artwork data');
    });

    // Check if console.error was called with the expected message
    expect(console.error).toHaveBeenCalledWith('Error fetching artwork data:', expect.any(Error));
  });

  it('displays multiple artworks for a station', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockArtworks,
    });

    await act(async () => {
      render(<App />);
    });
    
    await waitFor(() => {
      const popup = screen.getByTestId('popup');
      expect(popup).toHaveTextContent('Test Station 1');
      expect(popup).toHaveTextContent('Total Artworks: 2');
      expect(popup).toHaveTextContent('Artwork 1 by Artist 1');
      expect(popup).toHaveTextContent('Artwork 2 by Artist 2');
    });
  });

  it('allows navigation between artwork list and individual artwork details', async () => {
    const user = userEvent.setup();
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockArtworks,
    });

    await act(async () => {
      render(<App />);
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('popup')).toHaveTextContent('Test Station 1');
    });

    // Click on the first artwork
    await user.click(screen.getByText('Artwork 1 by Artist 1'));

    await waitFor(() => {
      expect(screen.getByText('Artwork 1')).toBeInTheDocument();
      expect(screen.getByText('Artist: Artist 1')).toBeInTheDocument();
      expect(screen.getByText('Date: 2021')).toBeInTheDocument();
      expect(screen.getByText('Material: Oil on canvas')).toBeInTheDocument();
      expect(screen.getByText('A beautiful painting')).toBeInTheDocument();
      expect(screen.getByText('More Info')).toHaveAttribute('href', 'https://example.com/image1.jpg');
    });

    // Go back to the list
    await user.click(screen.getByText('< Back to list'));

    await waitFor(() => {
      expect(screen.getByText('Test Station 1')).toBeInTheDocument();
      expect(screen.getByText('Total Artworks: 2')).toBeInTheDocument();
    });
  });

  it('pans and zooms to the selected marker when clicked', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockArtworks,
    });

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.getByTestId('circle-marker')).toBeInTheDocument();
    });

    // Click on the marker
    await act(async () => {
      userEvent.click(screen.getByTestId('circle-marker'));
    });

    // Wait for any state updates to complete
    await waitFor(() => {
      // Check if setView was called with the correct parameters
      expect(mockSetView).toHaveBeenCalledWith([40.7128, -74.0060], 14, { animate: true });
    });
  });
});