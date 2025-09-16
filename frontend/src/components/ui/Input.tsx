import { InputHTMLAttributes } from 'react';

const Input = (props: InputHTMLAttributes<HTMLInputElement>) => {
  const { className = '', ...rest } = props;
  return (
    <input
      className={`glass-input w-full px-4 py-3 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 ${className}`}
      {...rest}
    />
  );
};

export default Input;