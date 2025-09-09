import React, { useEffect } from 'react';

const Navigation = ({ onGoBack, canGoBack, currentPage }) => {
  // Add keyboard shortcut for back button
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.altKey && event.key === 'ArrowLeft') {
        event.preventDefault();
        onGoBack();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onGoBack]);
  const getPageTitle = () => {
    switch (currentPage) {
      case '/request': return 'Request Builder';
      case '/response': return 'Response Viewer';
      default: return 'Page';
    }
  };

  return (
     <></>
  );
};

export default Navigation;
