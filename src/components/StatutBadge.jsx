import React from 'react';
import { CheckCircle, AlertCircle, XCircle } from 'lucide-react';

const StatutBadge = ({ statut }) => {
  const getStatutConfig = (statut) => {
    switch (statut) {
      case 'PAYEE':
        return {
          text: 'Payée',
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          borderColor: 'border-green-200',
          icon: <CheckCircle size={16} className="text-green-600" />
        };
      case 'PARTIELLEMENT_PAYEE':
        return {
          text: 'Partiellement payée',
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          borderColor: 'border-yellow-200',
          icon: <AlertCircle size={16} className="text-yellow-600" />
        };
      case 'IMPAYEE':
        return {
          text: 'Impayée',
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          borderColor: 'border-red-200',
          icon: <XCircle size={16} className="text-red-600" />
        };
      default:
        return {
          text: 'Inconnu',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-200',
          icon: null
        };
    }
  };

  const config = getStatutConfig(statut);

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${config.bgColor} ${config.textColor} ${config.borderColor}`}>
      {config.icon}
      <span className="text-xs font-medium">{config.text}</span>
    </div>
  );
};

export default StatutBadge;