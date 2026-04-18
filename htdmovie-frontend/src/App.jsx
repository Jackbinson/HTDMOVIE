import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/Forgotpassword';
import Home from './pages/Customer/Home';
import MovieDetails from './pages/Customer/MovieDetails';
import MyTickets from './pages/Customer/MyTickets';
import AdminDashboard from './pages/Admin/AdminDashboard';
import StaffDashboard from './pages/Staff/StaffDashboard';

const NotFound = () => (
  <h1 style={{ textAlign: 'center', marginTop: '50px', color: '#ff4d4d' }}>
    404 - Khong tim thay trang
  </h1>
);

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/home" element={<Home />} />
      <Route path="/my-tickets" element={<MyTickets />} />
      <Route path="/movie/:movieId" element={<MovieDetails />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/staff" element={<StaffDashboard />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
