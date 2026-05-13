import React from 'react';
import { FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Frontend Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6 text-center">
          <div className="max-w-md w-full bg-white p-10 rounded-2xl shadow-xl">
            <FiAlertTriangle className="text-red-500 mx-auto mb-4" size={48} />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Something went wrong</h1>
            <p className="text-gray-500 mb-6 italic">We encountered an unexpected error while rendering this page.</p>
            <button 
              onClick={() => window.location.reload()}
              className="flex items-center justify-center w-full px-6 py-3 bg-primary text-white rounded-xl hover:bg-indigo-700 transition-all font-medium"
            >
              <FiRefreshCw className="mr-2" /> Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
