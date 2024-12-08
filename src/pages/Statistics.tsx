import React, { useEffect, useState } from 'react';
import { useChargingStore } from '../stores/chargingStore';
import * as echarts from 'echarts';
import dayjs from 'dayjs';
import { Empty } from 'antd-mobile';
import './Statistics.css';

interface MonthlyData {
  month: string;
  cost: number;
  power: number;
  duration: number;
  count: number;
}

interface StationStats {
  name: string;
  count: number;
  totalPower: number;
  totalCost: number;
}

const Statistics: React.FC = () => {
  const { records } = useChargingStore();
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [stationStats, setStationStats] = useState<StationStats[]>([]);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    // 檢查是否有數據
    if (records.length === 0) {
      setHasData(false);
      return;
    }

    setHasData(true);
    // 計算月度數據
    const monthlyStats = records.reduce((acc, record) => {
      const month = dayjs(record.date).format('YYYY-MM');
      const existingMonth = acc.find(item => item.month === month);
      
      if (existingMonth) {
        existingMonth.cost += record.chargingFee + (record.parkingFee || 0);
        existingMonth.power += record.power;
        existingMonth.duration += record.duration;
        existingMonth.count += 1;
      } else {
        acc.push({
          month,
          cost: record.chargingFee + (record.parkingFee || 0),
          power: record.power,
          duration: record.duration,
          count: 1
        });
      }
      return acc;
    }, [] as MonthlyData[]);

    // 計算站點統計
    const stations = records.reduce((acc, record) => {
      const stationName = `${record.vendor}-${record.stationName}`;
      const existing = acc.find(item => item.name === stationName);
      
      if (existing) {
        existing.count += 1;
        existing.totalPower += record.power;
        existing.totalCost += record.chargingFee;
      } else {
        acc.push({
          name: stationName,
          count: 1,
          totalPower: record.power,
          totalCost: record.chargingFee
        });
      }
      return acc;
    }, [] as StationStats[]);

    // 排序
    monthlyStats.sort((a, b) => a.month.localeCompare(b.month));
    stations.sort((a, b) => b.count - a.count);

    setMonthlyData(monthlyStats);
    setStationStats(stations.slice(0, 5)); // 只取前5名
  }, [records]);

  useEffect(() => {
    if (monthlyData.length === 0) return;

    // 費用趨勢圖
    const costChart = echarts.init(document.getElementById('costChart'));
    costChart.setOption({
      title: { text: '月度費用趨勢', textStyle: { color: '#ffffff' } },
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: monthlyData.map(d => dayjs(d.month).format('MM/YYYY')),
        axisLabel: { color: '#b3b3b3' }
      },
      yAxis: {
        type: 'value',
        name: '費用 ($)',
        nameTextStyle: { color: '#b3b3b3' },
        axisLabel: { color: '#b3b3b3' }
      },
      series: [{
        type: 'line',
        data: monthlyData.map(d => d.cost),
        itemStyle: { color: '#4a90e2' },
        areaStyle: { opacity: 0.2 }
      }],
      backgroundColor: 'transparent'
    });

    // 充電度數圖
    const powerChart = echarts.init(document.getElementById('powerChart'));
    powerChart.setOption({
      title: { text: '月度充電度數', textStyle: { color: '#ffffff' } },
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: monthlyData.map(d => dayjs(d.month).format('MM/YYYY')),
        axisLabel: { color: '#b3b3b3' }
      },
      yAxis: {
        type: 'value',
        name: '度數 (kWh)',
        nameTextStyle: { color: '#b3b3b3' },
        axisLabel: { color: '#b3b3b3' }
      },
      series: [{
        type: 'bar',
        data: monthlyData.map(d => d.power),
        itemStyle: { color: '#50c878' }
      }],
      backgroundColor: 'transparent'
    });

    // 充電時長圖
    const durationChart = echarts.init(document.getElementById('durationChart'));
    durationChart.setOption({
      title: { text: '月度充電時長', textStyle: { color: '#ffffff' } },
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: monthlyData.map(d => dayjs(d.month).format('MM/YYYY')),
        axisLabel: { color: '#b3b3b3' }
      },
      yAxis: {
        type: 'value',
        name: '時長 (分鐘)',
        nameTextStyle: { color: '#b3b3b3' },
        axisLabel: { color: '#b3b3b3' }
      },
      series: [{
        type: 'bar',
        data: monthlyData.map(d => d.duration),
        itemStyle: { color: '#ff6b6b' }
      }],
      backgroundColor: 'transparent'
    });

    // 常用站點圖
    const stationChart = echarts.init(document.getElementById('stationChart'));
    stationChart.setOption({
      title: { text: '常用充電站點', textStyle: { color: '#ffffff' } },
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c}次 ({d}%)'
      },
      series: [{
        type: 'pie',
        radius: '65%',
        data: stationStats.map(s => ({
          name: s.name,
          value: s.count
        })),
        itemStyle: {
          color: (params: any) => {
            const colors = ['#4a90e2', '#50c878', '#ff6b6b', '#ffd700', '#9370db'];
            return colors[params.dataIndex % colors.length];
          }
        },
        label: {
          color: '#ffffff'
        }
      }],
      backgroundColor: 'transparent'
    });

    // 響應式處理
    const handleResize = () => {
      costChart.resize();
      powerChart.resize();
      durationChart.resize();
      stationChart.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      costChart.dispose();
      powerChart.dispose();
      durationChart.dispose();
      stationChart.dispose();
    };
  }, [monthlyData, stationStats]);

  if (!hasData) {
    return (
      <div className="statistics-page">
        <div className="empty-state">
          <Empty
            imageStyle={{ width: 128 }}
            description={
              <div className="empty-description">
                <p>尚無充電記錄</p>
                <p className="empty-hint">新增充電記錄後即可查看統計資訊</p>
              </div>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="statistics-page">
      <div className="charts-grid">
        <div className="chart-container">
          <div id="costChart" style={{ width: '100%', height: '300px' }} />
        </div>
        <div className="chart-container">
          <div id="powerChart" style={{ width: '100%', height: '300px' }} />
        </div>
        <div className="chart-container">
          <div id="durationChart" style={{ width: '100%', height: '300px' }} />
        </div>
        <div className="chart-container">
          <div id="stationChart" style={{ width: '100%', height: '300px' }} />
        </div>
      </div>
    </div>
  );
};

export default Statistics; 