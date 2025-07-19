import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Input: React.FC<InputProps> = ({ label, className = '', ...props }) => (
  <label className="block">
    {label && <span className="block mb-1 text-sm font-medium text-gray-700">{label}</span>}
    <input
      className={`w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
      {...props}
    />
  </label>
);

export default Input; 