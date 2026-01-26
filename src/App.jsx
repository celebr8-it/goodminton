import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './lib/AuthContext';
import { ThemeProvider } from './lib/ThemeContext';
import AppRouter from './router';

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
