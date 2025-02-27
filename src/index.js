import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

// This will render the App component inside the div with the id of "root"
ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')  // This targets the div with id "root" in index.html
);
