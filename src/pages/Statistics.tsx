import React, { useEffect, useState } from 'react';
import { Tabs } from 'antd-mobile';
import * as echarts from 'echarts';
import { useChargingStore } from '../stores/chargingStore';
import type { ChargingRecord } from '../types';

const Statistics: React.FC = () => {
  const { records, loadRecords } = useChargingStore();
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    loadRecords();
  }, []);

  useEffect(() => {
    if (records.length > 0) {
      initCharts();
    }
  }, [records, currentMonth]);

  const initCharts = () => {
    const monthlyRecords = records.filter(r => r.date.startsWith(currentMonth));
    
    // 支出趨勢圖
    renderCostChart(monthlyRecords);
    // 充電度數統計
    renderPowerChart(monthlyRecords);
    // 充電時長分析
    renderDurationChart(monthlyRecords);
    // 常用充電站 TOP5
    renderStationChart(monthlyRecords);
  };

  const renderCostChart = (data: ChargingRecord[]) => {
    const chart = echarts.init(document.getElementById('costChart'));
    
    const dailyData = data.reduce((acc, record) => {
      const day = record.date.slice(8, 10);
      acc[day] = (acc[day] || 0) + record.chargingFee + record.parkingFee;
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
    const chart = echarts.init(document.getElementById('powerChart'));
    
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
    const chart = echarts.init(document.getElementById('durationChart'));
    
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
    const chart = echarts.init(document.getElementById('stationChart'));
    
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
      <Tabs>
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