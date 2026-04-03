import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import BaseInput from '../../components/Baseinput';
import BaseButton from '../../components/BaseButton';
import AuthLayout from '../../components/AuthLayout';
import AuthStatusBanner from '../../components/AuthStatusBanner';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Register = () => {
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
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

    const payload = {
      username: formData.username.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password
    };

    if (!payload.username || !payload.email || !payload.password) {
      setSuccessMsg('');
      setErrorMsg('Vui long nhap day du thong tin dang ky!');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      setSuccessMsg('');

      const response = await axios.post(`${API_BASE_URL}/auth/register`, payload);
      console.log('Dang ky thanh cong du lieu:', response.data);
      setSuccessMsg('Tao tai khoan thanh cong! He thong se dua ban ve trang dang nhap...');

      window.setTimeout(() => {
        navigate('/login');
      }, 900);
    } catch (error) {
      console.error('Loi goi API dang ky:', error);
      const serverMessage =
        error.response?.data?.message || 'Dang ky that bai. Vui long kiem tra lai!';
      setSuccessMsg('');
      setErrorMsg(serverMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="New Member"
      title="Tao tai khoan va giu cho minh mot cho ngoi dep"
      subtitle="Nen rap chieu giup trang dang ky co chieu sau hon, trong khi khoi form duoc giu gon va sang ro de phu hop voi luong thao tac hien tai."
      footer={
        <div className="auth-links auth-links--single">
          <Link to="/login" className="auth-links__muted">
            Da co tai khoan? Quay lai dang nhap
          </Link>
        </div>
      }
    >
      <div className="auth-card__header">
        <h2>Dang ky</h2>
        <p>Tham gia HTDMOVIE de dat ve nhanh hon va theo doi lich xem cua ban.</p>
      </div>

      <AuthStatusBanner show={!!errorMsg} type="error" message={errorMsg} />
      <AuthStatusBanner show={!!successMsg} type="success" message={successMsg} />

      <form className="auth-form" onSubmit={handleSubmit}>
        <BaseInput
          label="Ten dang nhap"
          name="username"
          value={formData.username}
          onChange={handleChange}
          placeholder="Nhap ten dang nhap"
        />

        <BaseInput
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Nhap email cua ban"
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
          text={isSubmitting ? 'Dang xu ly...' : 'Tao tai khoan'}
          type="submit"
          className={isSubmitting ? 'opacity-70' : ''}
        />
      </form>
    </AuthLayout>
  );
};

export default Register;
