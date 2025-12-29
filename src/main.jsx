// src/main.jsx
import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

// Function to set the favicon dynamically
function setFavicon(url) {
  let link = document.querySelector("link[rel*='icon']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.getElementsByTagName('head')[0].appendChild(link);
  }
  link.href = url;
}

// Wrapper component to set favicon on mount
function Root() {
  useEffect(() => {
    setFavicon('/favicon.ico'); // Path to your icon in public folder
    document.title = 'Gamefinity'; // Optional: Set tab title
  }, []);

  return <App />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>
);
