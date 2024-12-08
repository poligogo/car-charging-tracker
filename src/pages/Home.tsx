import React, { useEffect, useState } from 'react';
import { useChargingStore } from '../stores/chargingStore';
import { Collapse } from 'antd-mobile';
import { RightOutline } from 'antd-mobile-icons';
import dayjs from 'dayjs';
import './Home.css';

const Home: React.FC = () => {
  const { currentVehicle, monthlyStats, totalStats, calculateMonthlyStats, records } = useChargingStore();
  const [activeKey, setActiveKey] = useState<string[]>([]);

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

  useEffect(() => {
    const handleRecordsImported = (event: CustomEvent) => {
      const { month } = event.detail;
      calculateMonthlyStats(month);
    };

    window.addEventListener('recordsImported', handleRecordsImported as EventListener);
    return () => window.removeEventListener('recordsImported', handleRecordsImported as EventListener);
  }, [calculateMonthlyStats]);

  // 添加初始加載
  useEffect(() => {
    console.log('Home 頁面初始化');
    // 使用最新記錄的月份，而不是當前月份
    const latestMonth = dayjs(records[records.length - 1]?.date || '').format('YYYY-MM');
    console.log('最新記錄月份:', latestMonth);
    calculateMonthlyStats(latestMonth);
  }, [calculateMonthlyStats, records]);

  useEffect(() => {
    console.log('月度統計更新:', monthlyStats);
  }, [monthlyStats]);

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
              {' '}陪伴你的第 {daysWithCar}
            </div>
          )}
        </div>
      </div>

      <div className="stats-container">
        <Collapse
          activeKey={activeKey}
          onChange={key => setActiveKey(key as string[])}
          className="stats-collapse"
        >
          <Collapse.Panel key="monthly" title="本月統計" arrow={<RightOutline />}>
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
          </Collapse.Panel>

          <Collapse.Panel key="total" title="總計統計" arrow={<RightOutline />}>
            <div className="stats-grid">
              <div className="stats-item">
                <div className="stats-value">${totalStats.totalCost.toFixed(2)}</div>
                <div className="stats-label">總花費</div>
              </div>
              <div className="stats-item">
                <div className="stats-value">{totalStats.totalPower.toFixed(2)} kWh</div>
                <div className="stats-label">總充電量</div>
              </div>
              <div className="stats-item">
                <div className="stats-value">{totalStats.chargingCount}</div>
                <div className="stats-label">總充電次數</div>
              </div>
              <div className="stats-item">
                <div className="stats-value">${totalStats.averagePrice.toFixed(3)}/kWh</div>
                <div className="stats-label">總平均單價</div>
              </div>
            </div>
          </Collapse.Panel>
        </Collapse>
      </div>
    </div>
  );
};

export default Home; 