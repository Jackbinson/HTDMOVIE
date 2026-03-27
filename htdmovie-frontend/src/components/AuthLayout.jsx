import React from 'react';

const AuthLayout = ({ eyebrow, title, subtitle, children, footer }) => {
  return (
    <div className="auth-screen">
      <div className="auth-screen__background" />
      <div className="auth-screen__overlay" />
      <div className="auth-screen__glow auth-screen__glow--left" />
      <div className="auth-screen__glow auth-screen__glow--right" />

      <div className="auth-shell">
        <section className="auth-shell__hero">
          <span className="auth-shell__eyebrow">{eyebrow}</span>
          <h1 className="auth-shell__brand">
            HTD<span>MOVIE</span>
          </h1>
          <p className="auth-shell__tagline">{title}</p>
          <p className="auth-shell__copy">
            {subtitle}
          </p>
        </section>

        <section className="auth-card">
          {children}
          {footer && <div className="auth-card__footer">{footer}</div>}
        </section>
      </div>
    </div>
  );
};

export default AuthLayout;
