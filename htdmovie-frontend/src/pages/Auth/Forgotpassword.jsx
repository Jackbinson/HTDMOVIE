import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import BaseInput from '../../components/Baseinput';
import BaseButton from '../../components/BaseButton';
import AuthLayout from '../../components/AuthLayout';
import AuthStatusBanner from '../../components/AuthStatusBanner';
import { API_BASE_URL } from '../../config/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      setMessage('Vui long nhap email cua ban!');
      setIsError(true);
      return;
    }

    try {
      setIsSubmitting(true);
      setMessage('');

      const response = await axios.post(`${API_BASE_URL}/auth/forgot-password`, {
        email
      });

      setMessage(response.data?.message || 'Yeu cau khoi phuc da duoc gui.');
      setIsError(false);
    } catch (error) {
      setMessage(
        error.response?.data?.message || 'Khong the gui yeu cau khoi phuc luc nay.'
      );
      setIsError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Account Recovery"
      title="Khoi phuc quyen truy cap ma khong cat dut mach trai nghiem"
      subtitle="Trang quen mat khau dung chung bo cuc voi login va register, tao cam giac lien mach nhung van duoc dieu chinh noi dung gon hon de nguoi dung thao tac nhanh."
      footer={
        <div className="auth-links auth-links--single">
          <Link to="/login" className="auth-links__muted">
            Quay lai trang dang nhap
          </Link>
        </div>
      }
    >
      <div className="auth-card__header">
        <h2>Quen mat khau</h2>
        <p>Nhap email da dang ky de nhan huong dan khoi phuc tai khoan.</p>
      </div>

      <AuthStatusBanner
        show={!!message}
        type={isError ? 'error' : 'success'}
        message={message}
      />

      <form className="auth-form" onSubmit={handleSubmit}>
        <BaseInput
          label="Email dang ky"
          name="email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setMessage('');
          }}
          placeholder="Nhap email cua ban"
        />

        <BaseButton
          text={isSubmitting ? 'Dang gui...' : 'Gui yeu cau'}
          type="submit"
          className={isSubmitting ? 'opacity-70' : ''}
        />
      </form>
    </AuthLayout>
  );
};

export default ForgotPassword;
