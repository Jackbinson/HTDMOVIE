import React from 'react';
import { Transition } from '@headlessui/react';

const AuthStatusBanner = ({ show, type = 'error', message }) => {
  if (!message) {
    return null;
  }

  return (
    <Transition
      show={show}
      enter="transition ease-out duration-300 transform"
      enterFrom="opacity-0 -translate-y-2"
      enterTo="opacity-100 translate-y-0"
      leave="transition ease-in duration-200 transform"
      leaveFrom="opacity-100 translate-y-0"
      leaveTo="opacity-0 -translate-y-2"
    >
      <div className={`auth-alert auth-alert--${type}`}>{message}</div>
    </Transition>
  );
};

export default AuthStatusBanner;
