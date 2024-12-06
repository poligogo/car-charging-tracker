import React, { useEffect } from 'react';
import { Card } from 'antd-mobile';
import { useChargingStore } from '../stores/chargingStore';

const Home: React.FC = () => {
  const { monthlyStats, currentVehicle, loadVehicles } = useChargingStore();

  useEffect(() => {
    loadVehicles();
  }, []);

  return (
    <div className="tesla-home">
      <div className="vehicle-display">
        {currentVehicle?.imageUrl ? (
          <img 
            src={currentVehicle.imageUrl} 
            alt={currentVehicle.name}
            className="vehicle-image"
          />
        ) : (
          <div className="no-vehicle">請在設定中新增車輛</div>
        )}
        <h2 className="vehicle-name">{currentVehicle?.name || '未選擇車輛'}</h2>
      </div>

      <div className="stats-container">
        <div className="stats-grid">
          <div className="stats-item">
            <div className="stats-value">${monthlyStats.totalCost}</div>
            <div className="stats-label">本月花費</div>
          </div>
          <div className="stats-item">
            <div className="stats-value">{monthlyStats.totalPower}</div>
            <div className="stats-label">總充電量(度)</div>
          </div>
          <div className="stats-item">
            <div className="stats-value">{monthlyStats.chargingCount}</div>
            <div className="stats-label">充電次數</div>
          </div>
          <div className="stats-item">
            <div className="stats-value">${monthlyStats.averagePrice}</div>
            <div className="stats-label">平均單價</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home; 