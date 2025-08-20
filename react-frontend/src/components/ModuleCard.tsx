import React from 'react';

interface ModuleCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick?: () => void;
}

const ModuleCard: React.FC<ModuleCardProps> = ({
  title,
  description,
  icon,
  onClick
}) => {
  return (
    <div 
      className="bg-gray-900 border border-gray-800 hover:border-gray-700 transition-colors rounded-sm p-6 flex flex-col items-center cursor-pointer"
      onClick={onClick}
    >
      <div className="text-5xl mb-4 text-blue-400">
        {icon}
      </div>
      <h3 className="text-gray-200 font-medium mb-2">{title}</h3>
      <p className="text-gray-500 text-sm text-center">{description}</p>
    </div>
  );
};

export default ModuleCard;