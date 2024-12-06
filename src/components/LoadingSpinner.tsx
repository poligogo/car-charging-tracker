import React from 'react';
import { SpinLoading } from 'antd-mobile';

const LoadingSpinner: React.FC = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh' 
  }}>
    <SpinLoading />
  </div>
);

export default LoadingSpinner; 