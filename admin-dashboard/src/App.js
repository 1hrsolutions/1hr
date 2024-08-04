import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Layout><Dashboard /></Layout>} />
      </Routes>
    </Router>
  );
}

export default App;