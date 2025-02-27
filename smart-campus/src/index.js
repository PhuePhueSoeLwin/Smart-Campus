import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

ReactDOM.render(
  <React.StrictMode>
    <App />   {/* This is your home page component */}
  </React.StrictMode>,
  document.getElementById('root')  // This loads App.js into the div in index.html
);
