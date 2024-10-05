import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';

// Mock the leaflet library
jest.mock('leaflet', () => ({
  icon: jest.fn(),
  Marker: { prototype: { options: { icon: {} } } },
}));

// Mock react-leaflet components
jest.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div data-testid="map">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ children }) => <div data-testid="marker">{children}</div>,
  Popup: ({ children }) => <div data-testid="popup">{children}</div>,
}));

// Import App after all mocks are set up
import App from './App';

describe('App Component', () => {
  const mockArtworks = [
    {
      latitude: 40.7128,
      longitude: -74.006,
      art_title: 'Test Artwork',
      artist: 'Test Artist',
      art_date: '2021',
      art_material: 'Test Material',
      station_name: 'Test Station',
      art_description: 'Test Description',
      art_image_link: { url: 'http://example.com' },
    },
  ];

  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.clearAllMocks();
  });

  afterEach(() => {
    console.log.mockRestore();
    console.error.mockRestore();
    jest.resetAllMocks();
  });

  test('renders loading state initially', () => {
    render(<App />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('renders error state when API URL is not defined', async () => {
    delete process.env.REACT_APP_API_URL;
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('API URL is not defined. Check your environment variables.')).toBeInTheDocument();
    });
  });

  test('renders error state when fetch fails', async () => {
    process.env.REACT_APP_API_URL = 'http://example.com';
    global.fetch = jest.fn(() => Promise.reject(new Error('Fetch failed')));

    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Failed to fetch artworks: Fetch failed. Please check the API URL and try again.')).toBeInTheDocument();
    });
  });

  test('renders map and markers when fetch succeeds', async () => {
    process.env.REACT_APP_API_URL = 'http://example.com';
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockArtworks),
      })
    );

    await act(async () => {
      render(<App />);
    });

    expect(screen.getByText('NYC Subway Art Map')).toBeInTheDocument();
    
    // Check if MapContainer was rendered
    expect(screen.getByTestId('map')).toBeInTheDocument();
    
    // Check for the presence of artwork information
    expect(screen.getByText('Test Artwork')).toBeInTheDocument();
    expect(screen.getByText('Artist: Test Artist')).toBeInTheDocument();

    // Check if at least one marker and popup were rendered
    expect(screen.getByTestId('marker')).toBeInTheDocument();
    expect(screen.getByTestId('popup')).toBeInTheDocument();
  });

  test('renders no artworks found message when API returns empty array', async () => {
    process.env.REACT_APP_API_URL = 'http://example.com';
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      })
    );

    await act(async () => {
      render(<App />);
    });

    expect(screen.getByText('No artworks found. The API might be empty or returning an empty array.')).toBeInTheDocument();
  });
});