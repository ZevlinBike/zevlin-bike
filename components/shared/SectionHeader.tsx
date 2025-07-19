import React from 'react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle, className = '' }) => (
  <div className={`mb-8 text-center ${className}`}>
    <h2 className="text-3xl font-bold tracking-tight text-gray-900">{title}</h2>
    {subtitle && <p className="mt-2 text-lg text-gray-600">{subtitle}</p>}
  </div>
);

export default SectionHeader; 