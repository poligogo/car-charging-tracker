import React, { useEffect, useState, useRef } from 'react';
import { Tabs } from 'antd-mobile';
import * as echarts from 'echarts';
import { useChargingStore } from '../stores/chargingStore';
import type { ChargingRecord } from '../types';
import dayjs from 'dayjs';

const Statistics: React.FC = () => {
  const { records, loadRecords, calculateMonthlyStats } = useChargingStore();
  const [activeKey, setActiveKey] = useState('cost');
  const [currentMonth, setCurrentMonth] = useState(() => {
    const sortedRecords = [...records].sort((a, b) => 
      dayjs(b.date).valueOf() - dayjs(a.date).valueOf()
    );
    return dayjs(sortedRecords[0]?.date || '').format('YYYY-MM');
  });
  
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
      // 獲取最新月份
      const sortedRecords = [...records].sort((a, b) => 
        dayjs(b.date).valueOf() - dayjs(a.date).valueOf()
      );
      const latestMonth = dayjs(sortedRecords[0]?.date || '').format('YYYY-MM');
      setCurrentMonth(latestMonth);
      calculateMonthlyStats(latestMonth);
    };
    initData();
  }, []);

  // 監聽 records 變化，重新渲染圖表
  useEffect(() => {
    console.log('Records updated:', records.length); // 添加日誌
    const monthlyRecords = records.filter(r => r.date.startsWith(currentMonth));
    console.log('Monthly records:', monthlyRecords.length); // 添加日誌
    
    if (monthlyRecords.length > 0) {
      renderCharts(monthlyRecords);
    }
  }, [records, currentMonth, activeKey]);

  // 添加月份選擇器
  const handleMonthChange = (value: string) => {
    setCurrentMonth(value);
    calculateMonthlyStats(value);
  };

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
    
    // 按日期排序並分組數據
    const dailyData = data.reduce((acc, record) => {
      const day = record.date.slice(8, 10);
      const cost = record.chargingFee + (record.parkingFee || 0);
      acc[day] = (acc[day] || 0) + cost;
      return acc;
    }, {} as Record<string, number>);

    // 獲取排序後的日期
    const sortedDays = Object.keys(dailyData).sort((a, b) => Number(a) - Number(b));

    const option = {
      title: {
        text: '月度支出趨勢',
        left: 'center',
        textStyle: {
          color: '#fff'
        }
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const day = params[0].name;
          const value = params[0].value;
          return `${day}日: $${value.toFixed(2)}`;
        }
      },
      xAxis: {
        type: 'category',
        data: sortedDays,
        axisLabel: {
          color: '#fff'
        }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (value: number) => `$${value}`,
          color: '#fff'
        }
      },
      series: [{
        data: sortedDays.map(day => dailyData[day]),
        type: 'line',
        smooth: true,
        lineStyle: {
          color: '#34C759'
        },
        itemStyle: {
          color: '#34C759'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [{
              offset: 0,
              color: 'rgba(52, 199, 89, 0.4)'
            }, {
              offset: 1,
              color: 'rgba(52, 199, 89, 0.1)'
            }]
          }
        }
      }],
      backgroundColor: 'transparent'
    };

    chart.setOption(option);
  };

  const renderPowerChart = (data: ChargingRecord[]) => {
    const chart = initChart('powerChart', 'power');
    if (!chart) return;
    
    // 按日期排序並分組數據
    const dailyData = data.reduce((acc, record) => {
      const day = record.date.slice(8, 10);
      acc[day] = (acc[day] || 0) + record.power;
      return acc;
    }, {} as Record<string, number>);

    const sortedDays = Object.keys(dailyData).sort((a, b) => Number(a) - Number(b));

    const option = {
      title: {
        text: '充電度數統計',
        left: 'center',
        textStyle: {
          color: '#fff'
        }
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const day = params[0].name;
          const value = params[0].value;
          return `${day}日: ${value.toFixed(2)} kWh`;
        }
      },
      xAxis: {
        type: 'category',
        data: sortedDays,
        axisLabel: {
          color: '#fff'
        }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (value: number) => `${value} kWh`,
          color: '#fff'
        }
      },
      series: [{
        data: sortedDays.map(day => dailyData[day]),
        type: 'bar',
        itemStyle: {
          color: '#007AFF'
        }
      }],
      backgroundColor: 'transparent'
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
    
    // 統計每個充電站的使用次數
    const stationCount = data.reduce((acc, record) => {
      const key = `${record.vendor}-${record.stationName}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 排序並取前 5 名
    const sortedStations = Object.entries(stationCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    const option = {
      title: {
        text: '常用充電站 TOP5',
        left: 'center',
        textStyle: {
          color: '#fff'
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} 次 ({d}%)'
      },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          color: '#fff',
          formatter: '{b}\n{c}次'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '16',
            fontWeight: 'bold'
          }
        },
        data: sortedStations.map(([name, value]) => ({
          name,
          value,
          itemStyle: {
            color: `rgba(52, 199, 89, ${0.4 + Math.random() * 0.6})`
          }
        }))
      }],
      backgroundColor: 'transparent'
    };

    chart.setOption(option);
  };

  useEffect(() => {
    const handleRecordsImported = (event: CustomEvent) => {
      const { records: newRecords, month } = event.detail;
      const monthlyRecords = newRecords.filter((r: ChargingRecord) => r.date.startsWith(month));
      if (monthlyRecords.length > 0) {
        setCurrentMonth(month);
        renderCharts(monthlyRecords);
      }
    };

    window.addEventListener('recordsImported', handleRecordsImported as EventListener);
    return () => window.removeEventListener('recordsImported', handleRecordsImported as EventListener);
  }, [renderCharts]);

  return (
    <div className="statistics-page">
      <h1>統計分析</h1>
      
      {/* 添加月份選擇器 */}
      <div className="month-selector">
        <input
          type="month"
          value={currentMonth}
          onChange={(e) => handleMonthChange(e.target.value)}
          className="month-input"
        />
      </div>

      <Tabs
        activeKey={activeKey}
        onChange={key => {
          setActiveKey(key);
          // 切換 tab 時重新渲染圖表
          const monthlyRecords = records.filter(r => r.date.startsWith(currentMonth));
          if (monthlyRecords.length > 0) {
            setTimeout(() => {
              renderCharts(monthlyRecords);
            }, 100); // 添加短暫延遲確保 DOM 已更新
          }
        }}
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