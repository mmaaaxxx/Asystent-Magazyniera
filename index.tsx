import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Constants for splash screen timing
const SPLASH_MIN_DISPLAY_TIME = 2000; // 2 seconds minimum
const FADE_OUT_DURATION = 500; // 0.5 seconds fade
const appStartTime = Date.now();

/**
 * Ensures the splash screen stays for at least 2 seconds before fading out.
 */
const hideSplashScreen = () => {
  const splash = document.getElementById('splash-screen');
  if (!splash) return;

  const currentTime = Date.now();
  const timeElapsed = currentTime - appStartTime;
  const timeRemaining = Math.max(0, SPLASH_MIN_DISPLAY_TIME - timeElapsed);

  // Wait for the remaining time to reach the 2s mark
  setTimeout(() => {
    splash.style.opacity = '0';
    
    // Completely remove the element after the CSS transition finishes
    setTimeout(() => {
      splash.style.display = 'none';
      splash.remove();
    }, FADE_OUT_DURATION);
  }, timeRemaining);
};

// Initiate splash screen removal sequence
if (document.readyState === 'complete') {
  hideSplashScreen();
} else {
  window.addEventListener('load', hideSplashScreen);
}
