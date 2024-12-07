import React, { useEffect, useState } from 'react';
import { useChargingStore } from '../stores/chargingStore';
import { List } from 'antd-mobile';
import dayjs from 'dayjs';

const Statistics: React.FC = () => {
  const { records, calculateMonthlyStats, monthlyStats } = useChargingStore();
  const [currentMonth, setCurrentMonth] = useState(dayjs().format('YYYY-MM'));

  useEffect(() => {
    const loadStats = async () => {
      await calculateMonthlyStats(currentMonth);
    };
    loadStats();
  }, [currentMonth, calculateMonthlyStats]);

  // 計算每個充電站的使用次數
  const getStationStats = () => {
    const stationCounts = records
      .filter(record => record.date.startsWith(currentMonth))
      .reduce((acc, record) => {
        const key = `${record.vendor}-${record.stationName}`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(stationCounts)
      .map(([station, count]) => ({
        station,
        count,
      }))
      .sort((a, b) => b.count - a.count);
  };

  const stationStats = getStationStats();

  return (
    <div className="statistics-page">
      <h1>充電統計</h1>
      
      <List header='本月概覽'>
        <List.Item title="總花費" extra={`$${monthlyStats.totalCost.toFixed(2)}`} />
        <List.Item title="總充電量" extra={`${monthlyStats.totalPower.toFixed(2)} kWh`} />
        <List.Item title="充電次數" extra={`${monthlyStats.chargingCount} 次`} />
        <List.Item title="平均單價" extra={`$${monthlyStats.averagePrice.toFixed(3)}/kWh`} />
      </List>

      <List header='充電站使用統計'>
        {stationStats.map(({ station, count }) => (
          <List.Item
            key={station}
            title={station}
            extra={`${count} 次`}
          />
        ))}
      </List>
    </div>
  );
};

export default Statistics; 