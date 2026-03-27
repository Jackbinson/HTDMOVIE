import React from 'react';

const BaseButton = ({
  text,
  type = 'button',
  onClick,
  style,
  className = ''
}) => {
  return (
    <button
      type={type}
      className={`base-btn ${className}`.trim()}
      onClick={onClick}
      style={style}
    >
      {text}
    </button>
  );
};

export default BaseButton;
