import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import RequestBuilder from './components/RequestBuilder';
import ResponseViewer from './components/ResponseViewer';
import Navigation from './components/Navigation';
import './App.css';

function AppContent() {
  const [currentRequest, setCurrentRequest] = useState(null);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [previousPage, setPreviousPage] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Track previous page
  useEffect(() => {
    const currentPath = location.pathname;
    if (currentPath !== previousPage) {
      setPreviousPage(currentPath);
    }
  }, [location.pathname, previousPage]);

  const goBack = () => {
    // Use browser's back functionality for true previous page
    window.history.back();
  };

  const handleRequest = (requestData) => {
    setCurrentRequest(requestData);
    // Don't navigate to response page - show response on same page
  };

  const handleResponse = (responseData, errorData) => {
    setResponse(responseData);
    setError(errorData);
  };

  return (
    <div className="App">
      <div className="container">
        <Routes>
          <Route 
            path="/" 
            element={
              <Dashboard 
                onRequest={handleRequest}
                onNavigate={navigate}
              />
            } 
          />
          <Route 
            path="/request" 
            element={
              <RequestBuilder 
                initialRequest={currentRequest}
                onRequest={handleRequest}
                onResponse={handleResponse}
                onNavigate={navigate}
              />
            } 
          />
          <Route 
            path="/response" 
            element={
              <ResponseViewer 
                request={currentRequest}
                response={response}
                error={error}
                onNavigate={navigate}
              />
            } 
          />
        </Routes>
        
        {location.pathname !== '/' && (
          <Navigation 
            onGoBack={goBack}
            canGoBack={true}
            currentPage={location.pathname}
          />
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
