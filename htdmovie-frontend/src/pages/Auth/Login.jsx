import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import BaseInput from '../../components/Baseinput';
import BaseButton from '../../components/BaseButton';
import AuthLayout from '../../components/AuthLayout';
import AuthStatusBanner from '../../components/AuthStatusBanner';
import { API_BASE_URL } from '../../config/api';

const Login = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.username || !formData.password) {
      setSuccessMsg('');
      setErrorMsg('Vui long nhap day du tai khoan va mat khau!');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      setSuccessMsg('');

      const response = await axios.post(`${API_BASE_URL}/auth/login`, formData);
      const token = response.data.accessToken;
      const currentUser = response.data.user;

      if (token && currentUser) {
        localStorage.setItem('accessToken', token);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        setSuccessMsg('Dang nhap thanh cong! He thong dang chuyen huong...');

        window.setTimeout(() => {
          if (currentUser.role === 'admin') {
            navigate('/admin');
          } else if (currentUser.role === 'staff') {
            navigate('/staff');
          } else {
            navigate('/home');
          }
        }, 900);
      } else {
        setErrorMsg('Khong nhan duoc thong tin phien dang nhap tu server!');
      }
    } catch (error) {
      console.error('Loi goi API:', error);
      const serverMessage =
        error.response?.data?.message || 'Dang nhap that bai. Vui long thu lai!';
      setSuccessMsg('');
      setErrorMsg(serverMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Cinema Access"
      title="Dang nhap de bat dau hanh trinh dien anh"
      subtitle="Khong gian rap chieu duoc dua vao ngay tu man hinh dau tien, giup trai nghiem HTDMOVIE giu dung chat toi, sang va tap trung vao hanh dong dat ve."
      footer={
        <div className="auth-links">
          <Link to="/register" className="auth-links__muted">
            Chua co tai khoan?
          </Link>
          <Link to="/forgot-password" className="auth-links__primary">
            Quen mat khau?
          </Link>
        </div>
      }
    >
      <div className="auth-card__header">
        <h2>Dang nhap</h2>
        <p>Mo cua rap va tiep tuc chon bo phim ban muon xem.</p>
      </div>

      <AuthStatusBanner show={!!errorMsg} type="error" message={errorMsg} />
      <AuthStatusBanner show={!!successMsg} type="success" message={successMsg} />

      <form className="auth-form" onSubmit={handleSubmit}>
        <BaseInput
          label="Ten dang nhap"
          name="username"
          value={formData.username}
          onChange={handleChange}
          placeholder="Nhap username"
        />

        <BaseInput
          label="Mat khau"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Nhap mat khau"
        />

        <BaseButton
          text={isSubmitting ? 'Dang xu ly...' : 'Dang nhap'}
          type="submit"
          className={isSubmitting ? 'opacity-70' : ''}
        />
      </form>
    </AuthLayout>
  );
};

export default Login;
