import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import BaseInput from '../../components/Baseinput';
import BaseButton from '../../components/BaseButton';
import AuthLayout from '../../components/AuthLayout';
import AuthStatusBanner from '../../components/AuthStatusBanner';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!email) {
      setMessage('Vui long nhap email cua ban!');
      setIsError(true);
      return;
    }

    setIsSubmitting(true);
    console.log('Se gui yeu cau khoi phuc toi email:', email);

    window.setTimeout(() => {
      setMessage('Yeu cau da gui thanh cong! Vui long kiem tra hop thu email cua ban.');
      setIsError(false);
      setIsSubmitting(false);
    }, 500);
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
