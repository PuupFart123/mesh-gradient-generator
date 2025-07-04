import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    // Force a page reload to get a fresh start
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: '#18181b',
          color: '#fff',
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center'
        }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Something went wrong</h1>
          <p style={{ fontSize: '1.1rem', marginBottom: '2rem', color: '#aaa' }}>
            The application encountered an error. This might be due to WebGL context issues or browser limitations.
          </p>
          
          <div style={{
            background: '#333',
            padding: '1rem',
            borderRadius: '0.5rem',
            marginBottom: '2rem',
            maxWidth: '600px',
            fontSize: '0.9rem',
            textAlign: 'left'
          }}>
            <strong>Error Details:</strong>
            <pre style={{ 
              marginTop: '0.5rem', 
              color: '#ff6b6b',
              overflow: 'auto',
              whiteSpace: 'pre-wrap'
            }}>
              {this.state.error && this.state.error.toString()}
            </pre>
          </div>
          
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Try these solutions:</h3>
            <ul style={{ 
              textAlign: 'left', 
              listStyle: 'disc', 
              paddingLeft: '2rem',
              color: '#aaa'
            }}>
              <li>Refresh the page</li>
              <li>Try a different browser (Chrome, Firefox, Safari)</li>
              <li>Clear your browser cache and cookies</li>
              <li>Restart your browser</li>
              <li>Check if your graphics drivers are up to date</li>
            </ul>
          </div>
          
          <button
            onClick={this.handleRetry}
            style={{
              background: '#007bff',
              color: 'white',
              border: 'none',
              padding: '1rem 2rem',
              borderRadius: '0.5rem',
              fontSize: '1.1rem',
              cursor: 'pointer',
              fontWeight: 600,
              marginRight: '1rem'
            }}
          >
            Reload Page
          </button>
          
          <button
            onClick={() => window.history.back()}
            style={{
              background: '#6c757d',
              color: 'white',
              border: 'none',
              padding: '1rem 2rem',
              borderRadius: '0.5rem',
              fontSize: '1.1rem',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Go Back
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 