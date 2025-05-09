import React, { useState, useEffect } from 'react';

function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apiUrl, setApiUrl] = useState('http://localhost:5001/api/v1');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching data from:', apiUrl + '/items');
      
      const response = await fetch(apiUrl + '/items');
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Data received:', data);
      
      if (data && data.data) {
        setItems(data.data);
      } else {
        setError('Unexpected data format received');
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(`${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <header style={{ marginBottom: '20px', padding: '10px 0', borderBottom: '1px solid #eee' }}>
        <h1 style={{ color: '#4a6cf7' }}>Enterprise App</h1>
      </header>
      
      <main>
        <h2>API Data Viewer</h2>
        
        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
          <div style={{ marginBottom: '10px' }}>
            <strong>API URL:</strong> 
            <input 
              type="text" 
              value={apiUrl} 
              onChange={(e) => setApiUrl(e.target.value)}
              style={{ width: '100%', padding: '8px', marginTop: '5px', boxSizing: 'border-box' }}
            />
          </div>
          
          <button 
            onClick={fetchData}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: '#4a6cf7', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer'
            }}
          >
            Fetch Data
          </button>
        </div>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>Loading data...</div>
        ) : error ? (
          <div style={{ 
            padding: '15px', 
            backgroundColor: '#fff8f8', 
            borderLeft: '4px solid #dc3545', 
            marginBottom: '20px',
            borderRadius: '4px'
          }}>
            <h3 style={{ color: '#dc3545', marginTop: 0 }}>Error</h3>
            <p>{error}</p>
            
            <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
              <h4 style={{ marginBottom: '10px' }}>Troubleshooting Tips:</h4>
              <ul>
                <li>Ensure backend server is running on port 5001</li>
                <li>If using GitHub Codespaces, make port 5001 public:
                  <div style={{ 
                    fontFamily: 'monospace', 
                    backgroundColor: '#f5f5f5', 
                    padding: '8px', 
                    marginTop: '5px',
                    borderRadius: '4px'
                  }}>
                    Ports tab → Right-click on port 5001 → Port Visibility → Public
                  </div>
                </li>
                <li>Try alternative API URL formats:
                  <ul style={{ marginTop: '5px' }}>
                    <li>http://localhost:5001/api/v1</li>
                    <li>https://[codespace-name]-5001.preview.app.github.dev/api/v1</li>
                    <li>/api/v1 (relative path if using a proxy)</li>
                  </ul>
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <div>
            <h3>Items Found: {items.length}</h3>
            
            {items.length === 0 ? (
              <p>No items found in the database.</p>
            ) : (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '20px'
              }}>
                {items.map(item => (
                  <div key={item.id} style={{ 
                    border: '1px solid #eee', 
                    borderRadius: '8px', 
                    padding: '15px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    transition: 'transform 0.2s ease',
                    backgroundColor: 'white'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '10px',
                      padding: '0 0 10px 0',
                      borderBottom: '1px solid #eee'
                    }}>
                      <h3 style={{ margin: 0 }}>{item.name}</h3>
                      <span style={{ fontWeight: 'bold', color: '#4a6cf7' }}>${item.price?.toFixed(2)}</span>
                    </div>
                    <p style={{ margin: '10px 0' }}>{item.description || 'No description available'}</p>
                    <p style={{ margin: '10px 0', color: '#6c757d', fontSize: '0.9rem' }}>Category: {item.category}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
