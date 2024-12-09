import { useEffect } from 'react';
import { useChargingStore } from '../stores/chargingStore';
import dayjs from 'dayjs';
import './Home.css';

const Home = () => {
  const { currentVehicle, monthlyStats, totalStats, calculateMonthlyStats, records } = useChargingStore();

  const calculateDaysWithCar = (purchaseDate?: string) => {
    if (!purchaseDate) return null;
    const days = dayjs().diff(dayjs(purchaseDate), 'day');
    return days >= 365 
      ? `${Math.floor(days / 365)} 年 ${days % 365} 天`
      : `${days} 天`;
  };

  const daysWithCar = currentVehicle?.purchaseDate 
    ? calculateDaysWithCar(currentVehicle.purchaseDate)
    : null;

  useEffect(() => {
    const latestMonth = dayjs(records[records.length - 1]?.date || '').format('YYYY-MM');
    calculateMonthlyStats(latestMonth);
  }, [calculateMonthlyStats, records]);

  return (
    <div className="home-page">
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
              <span className="cake-icon" role="img" aria-label="birthday cake">🎂</span>
              {' '}陪伴的第 {daysWithCar}
            </div>
          )}
        </div>
      </div>

      <div className="stats-cards">
        {/* 本月統計卡片 */}
        <div className="stats-card monthly">
          <div className="stats-card-header">本月統計</div>
          <div className="stats-grid">
            <div className="stats-item">
              <div className="stats-value">${monthlyStats.totalCost.toFixed(2)}</div>
              <div className="stats-label">充電費用</div>
            </div>
            <div className="stats-item">
              <div className="stats-value">{monthlyStats.totalPower.toFixed(2)} kWh</div>
              <div className="stats-label">充電量</div>
            </div>
            <div className="stats-item">
              <div className="stats-value">{monthlyStats.chargingCount}</div>
              <div className="stats-label">充電次數</div>
            </div>
            <div className="stats-item">
              <div className="stats-value">${monthlyStats.averagePrice.toFixed(3)}/kWh</div>
              <div className="stats-label">平均單價</div>
            </div>
          </div>
        </div>

        {/* 總計統計卡片 */}
        <div className="stats-card total">
          <div className="stats-card-header">總計統計</div>
          <div className="stats-grid">
            <div className="stats-item">
              <div className="stats-value">${totalStats.totalCost.toFixed(2)}</div>
              <div className="stats-label">總費用</div>
            </div>
            <div className="stats-item">
              <div className="stats-value">{totalStats.totalPower.toFixed(2)} kWh</div>
              <div className="stats-label">總充電量</div>
            </div>
            <div className="stats-item">
              <div className="stats-value">{totalStats.chargingCount}</div>
              <div className="stats-label">總次數</div>
            </div>
            <div className="stats-item">
              <div className="stats-value">${totalStats.averagePrice.toFixed(3)}/kWh</div>
              <div className="stats-label">平均單價</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home; 