import React, { useEffect, useState } from 'react';
import { CheckCircle } from 'lucide-react';

const SuccessAlert = ({ message, duration = 5000 }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  if (!visible) return null;

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 animate-fade-in">
      <div className="flex items-center">
        <CheckCircle className="text-green-500 mr-3" size={20} />
        <p className="text-green-800 font-medium">{message}</p>
      </div>
    </div>
  );
};

export default SuccessAlert;