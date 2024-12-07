import React, { useEffect, useState, useRef } from 'react';
import { Tabs } from 'antd-mobile';
import * as echarts from 'echarts';
import { useChargingStore } from '../stores/chargingStore';
import type { ChargingRecord } from '../types';
import dayjs from 'dayjs';

const Statistics: React.FC = () => {
  const { records, loadRecords, calculateMonthlyStats } = useChargingStore();
  const [activeKey, setActiveKey] = useState('cost');
  const [currentMonth, setCurrentMonth] = useState(dayjs().format('YYYY-MM'));
  
  // 使用 ref 來保存圖表實例
  const chartRefs = useRef<{[key: string]: echarts.ECharts | null}>({
    cost: null,
    power: null,
    duration: null,
    station: null
  });

  // 初始加載數據
  useEffect(() => {
    const initData = async () => {
      await loadRecords();
      await calculateMonthlyStats(currentMonth);
    };
    initData();
  }, []);

  // 監聽 records 變化，重新渲染圖表
  useEffect(() => {
    if (records.length > 0) {
      const monthlyRecords = records.filter(r => r.date.startsWith(currentMonth));
      renderCharts(monthlyRecords);
    }
  }, [records, currentMonth, activeKey]);

  // 處理視窗大小變化
  useEffect(() => {
    const handleResize = () => {
      Object.values(chartRefs.current).forEach(chart => {
        chart?.resize();
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 清理圖表實例
  useEffect(() => {
    return () => {
      Object.values(chartRefs.current).forEach(chart => {
        chart?.dispose();
      });
    };
  }, []);

  const renderCharts = (monthlyRecords: ChargingRecord[]) => {
    switch (activeKey) {
      case 'cost':
        renderCostChart(monthlyRecords);
        break;
      case 'power':
        renderPowerChart(monthlyRecords);
        break;
      case 'duration':
        renderDurationChart(monthlyRecords);
        break;
      case 'station':
        renderStationChart(monthlyRecords);
        break;
    }
  };

  const initChart = (domId: string, chartKey: string) => {
    const chartDom = document.getElementById(domId);
    if (!chartDom) return null;
    
    if (chartRefs.current[chartKey]) {
      chartRefs.current[chartKey]?.dispose();
    }
    
    const chart = echarts.init(chartDom);
    chartRefs.current[chartKey] = chart;
    return chart;
  };

  const renderCostChart = (data: ChargingRecord[]) => {
    const chart = initChart('costChart', 'cost');
    if (!chart) return;
    
    const dailyData = data.reduce((acc, record) => {
      const day = record.date.slice(8, 10);
      acc[day] = (acc[day] || 0) + record.chargingFee + (record.parkingFee || 0);
      return acc;
    }, {} as Record<string, number>);

    const option = {
      title: { text: '月度支出趨勢' },
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: Object.keys(dailyData).sort()
      },
      yAxis: { type: 'value' },
      series: [{
        data: Object.keys(dailyData).sort().map(key => dailyData[key]),
        type: 'line',
        smooth: true
      }]
    };

    chart.setOption(option);
  };

  const renderPowerChart = (data: ChargingRecord[]) => {
    const chart = initChart('powerChart', 'power');
    if (!chart) return;
    
    const dailyData = data.reduce((acc, record) => {
      const day = record.date.slice(8, 10);
      acc[day] = (acc[day] || 0) + record.power;
      return acc;
    }, {} as Record<string, number>);

    const option = {
      title: { text: '充電度數統計' },
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: Object.keys(dailyData).sort()
      },
      yAxis: { type: 'value' },
      series: [{
        data: Object.keys(dailyData).sort().map(key => dailyData[key]),
        type: 'bar'
      }]
    };

    chart.setOption(option);
  };

  const renderDurationChart = (data: ChargingRecord[]) => {
    const chart = initChart('durationChart', 'duration');
    if (!chart) return;
    
    const durationRanges = {
      '0-30分鐘': 0,
      '30-60分鐘': 0,
      '1-2小時': 0,
      '2小時以上': 0
    };

    data.forEach(record => {
      if (record.duration <= 30) durationRanges['0-30分鐘']++;
      else if (record.duration <= 60) durationRanges['30-60分鐘']++;
      else if (record.duration <= 120) durationRanges['1-2小時']++;
      else durationRanges['2小時以上']++;
    });

    const option = {
      title: { text: '充電時長分析' },
      tooltip: { trigger: 'item' },
      series: [{
        type: 'pie',
        radius: '50%',
        data: Object.entries(durationRanges).map(([name, value]) => ({
          name,
          value
        }))
      }]
    };

    chart.setOption(option);
  };

  const renderStationChart = (data: ChargingRecord[]) => {
    const chart = initChart('stationChart', 'station');
    if (!chart) return;
    
    const stationCount = data.reduce((acc, record) => {
      const key = `${record.vendor}-${record.stationName}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const sortedStations = Object.entries(stationCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    const option = {
      title: { text: '常用充電站 TOP5' },
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: sortedStations.map(([name]) => name)
      },
      yAxis: { type: 'value' },
      series: [{
        data: sortedStations.map(([, value]) => value),
        type: 'bar'
      }]
    };

    chart.setOption(option);
  };

  return (
    <div className="statistics-page">
      <h1>統計分析</h1>
      <Tabs
        activeKey={activeKey}
        onChange={key => setActiveKey(key)}
      >
        <Tabs.Tab title="支出趨勢" key="cost">
          <div id="costChart" className="chart-container" />
        </Tabs.Tab>
        <Tabs.Tab title="充電度數" key="power">
          <div id="powerChart" className="chart-container" />
        </Tabs.Tab>
        <Tabs.Tab title="充電時長" key="duration">
          <div id="durationChart" className="chart-container" />
        </Tabs.Tab>
        <Tabs.Tab title="常用站點" key="station">
          <div id="stationChart" className="chart-container" />
        </Tabs.Tab>
      </Tabs>
    </div>
  );
};

export default Statistics; 