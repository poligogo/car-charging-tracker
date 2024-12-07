import React from 'react';
import { useChargingStore } from '../stores/chargingStore';
import dayjs from 'dayjs';

const Home: React.FC = () => {
  const { currentVehicle, monthlyStats } = useChargingStore();

  const calculateDaysWithCar = (purchaseDate?: string) => {
    if (!purchaseDate) return null;
    const days = dayjs().diff(dayjs(purchaseDate), 'day');
    
    // 優雅的顯示方式
    if (days >= 365) {
      const years = Math.floor(days / 365);
      const remainingDays = days % 365;
      return `${years} 年 ${remainingDays} 天`;
    }
    return `${days} 天`;
  };

  const daysWithCar = currentVehicle?.purchaseDate 
    ? calculateDaysWithCar(currentVehicle.purchaseDate)
    : null;

  return (
    <div className="tesla-home">
      <div className="vehicle-display">
        <div className="vehicle-image-container">
          {currentVehicle?.imageUrl && (
            <img
              src={currentVehicle.imageUrl}
              alt={currentVehicle.name}
              className="vehicle-image"
            />
          )}
        </div>
        <div className="vehicle-info">
          <h1 className="vehicle-name">{currentVehicle?.name || '未設定車輛'}</h1>
          {daysWithCar && (
            <div className="days-with-car">
              陪伴你的第 {daysWithCar}
            </div>
          )}
        </div>
      </div>

      <div className="stats-container">
        <div className="stats-grid">
          <div className="stats-item">
            <div className="stats-value">${monthlyStats.totalCost.toFixed(2)}</div>
            <div className="stats-label">本月花費</div>
          </div>
          <div className="stats-item">
            <div className="stats-value">{monthlyStats.totalPower.toFixed(2)} kWh</div>
            <div className="stats-label">本月充電量</div>
          </div>
          <div className="stats-item">
            <div className="stats-value">{monthlyStats.chargingCount}</div>
            <div className="stats-label">本月充電次數</div>
          </div>
          <div className="stats-item">
            <div className="stats-value">${monthlyStats.averagePrice.toFixed(3)}/kWh</div>
            <div className="stats-label">平均單價</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home; 