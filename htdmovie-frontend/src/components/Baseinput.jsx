import React from 'react';

const BaseInput = ({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  className = '',
  inputClassName = ''
}) => {
  return (
    <div className={`input-group ${className}`.trim()}>
      {label && <label>{label}</label>}

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={inputClassName}
      />
    </div>
  );
};

export default BaseInput;
