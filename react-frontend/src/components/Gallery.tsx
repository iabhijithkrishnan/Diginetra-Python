import React, { useEffect, useState } from 'react';

interface EventImage {
  filename: string;
  url: string;
  timestamp: string;
  size: number;
}

const Gallery: React.FC = () => {
  const [images, setImages] = useState<EventImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<EventImage | null>(null);

  const fetchImages = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('http://localhost:5000/api/events');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setImages(data);

    } catch (err) {
      console.error('Error fetching images:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch images');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();

    const interval = setInterval(fetchImages, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatFileSize = (bytes: number) => {
    return (bytes / 1024).toFixed(1) + ' KB';
  };

  const handleImageClick = (img: EventImage) => {
    setSelectedImage(img);
  };

  const handleCloseModal = () => {
    setSelectedImage(null);
  };

  if (loading && images.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>📸 Detection Gallery</h2>
        <p>Loading images...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem' }}>
        <h2>📸 Detection Gallery</h2>
        <div style={{
          backgroundColor: '#ff4444',
          color: 'white',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1rem'
        }}>
          <strong>Error:</strong> {error}
        </div>
        <button
          onClick={fetchImages}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem'
      }}>
        <h2>📸 Detection Gallery ({images.length} images)</h2>
        <button
          onClick={fetchImages}
          disabled={loading}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: loading ? '#ccc' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {images.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          color: '#6c757d'
        }}>
          <p>No detection images found.</p>
          <p>Make sure the detection script is running and saving images to the events folder.</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '1.5rem'
        }}>
          {images.map(img => (
            <div
              key={img.filename}
              onClick={() => handleImageClick(img)}
              style={{
                cursor: 'pointer',
                backgroundColor: '#f8f9fa',
                borderRadius: '12px',
                padding: '1rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <img
                src={`http://localhost:5000${img.url}?t=${Date.now()}`}
                alt={img.filename}
                style={{
                  width: '100%',
                  height: '200px',
                  objectFit: 'cover',
                  borderRadius: '8px',
                  marginBottom: '0.5rem'
                }}
                onError={(e) => {
                  console.error('Failed to load image:', img.url);
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div style={{ fontSize: '0.9rem', color: '#495057' }}>
                <p style={{ margin: '0.25rem 0', fontWeight: 'bold' }}>
                  {img.filename}
                </p>
                <p style={{ margin: '0.25rem 0' }}>
                  📅 {formatTimestamp(img.timestamp)}
                </p>
                <p style={{ margin: '0.25rem 0' }}>
                  📊 {formatFileSize(img.size)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fullscreen modal */}
      {selectedImage && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem'
        }} onClick={handleCloseModal}>
          <div
            style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '12px',
              maxWidth: '90vw',
              maxHeight: '90vh',
              overflow: 'auto',
              position: 'relative'
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={handleCloseModal}
              style={{
                position: 'absolute',
                top: '10px',
                right: '15px',
                fontSize: '1.5rem',
                border: 'none',
                background: 'none',
                cursor: 'pointer'
              }}
            >
              &times;
            </button>
            <img
              src={`http://localhost:5000${selectedImage.url}`}
              alt={selectedImage.filename}
              style={{
                maxWidth: '100%',
                maxHeight: '60vh',
                borderRadius: '8px',
                marginBottom: '1rem'
              }}
            />
            <div>
              <p><strong>🖼 Filename:</strong> {selectedImage.filename}</p>
              <p><strong>📅 Timestamp:</strong> {formatTimestamp(selectedImage.timestamp)}</p>
              <p><strong>📊 Size:</strong> {formatFileSize(selectedImage.size)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gallery;
