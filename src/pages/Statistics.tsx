import React, { useEffect, useState } from 'react';
import { useChargingStore } from '../stores/chargingStore';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';
import dayjs from 'dayjs';
import { Empty } from 'antd-mobile';
import './Statistics.css';
import '../styles/theme.css';

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
  const [charts, setCharts] = useState<echarts.ECharts[]>([]);

  // 獲取 CSS 變量的值
  const getCssVar = (name: string) => {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  };

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

    const isSmallScreen = window.innerWidth <= 480;

    // 通用圖表配置
    const baseChartConfig: EChartsOption = {
      backgroundColor: getCssVar('--bg-chart'),
      textStyle: {
        color: getCssVar('--chart-text')
      },
      title: {
        textStyle: {
          color: getCssVar('--chart-text'),
          fontSize: isSmallScreen ? 14 : 16
        },
        left: 'center',
        top: '5%'
      },
      tooltip: {
        backgroundColor: getCssVar('--bg-secondary'),
        borderColor: getCssVar('--chart-grid'),
        textStyle: {
          color: getCssVar('--chart-text'),
          fontSize: isSmallScreen ? 12 : 14
        },
        confine: true
      },
      grid: {
        top: '15%',
        left: '10%',
        right: '5%',
        bottom: '12%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        axisLine: {
          lineStyle: {
            color: getCssVar('--chart-axis')
          }
        },
        axisLabel: {
          color: getCssVar('--chart-axis'),
          interval: 0,
          rotate: isSmallScreen ? 45 : 0,
          fontSize: isSmallScreen ? 10 : 12
        },
        splitLine: {
          lineStyle: {
            color: getCssVar('--chart-grid')
          }
        }
      },
      yAxis: {
        type: 'value',
        axisLine: {
          lineStyle: {
            color: getCssVar('--chart-axis')
          }
        },
        axisLabel: {
          color: getCssVar('--chart-axis'),
          fontSize: isSmallScreen ? 10 : 12
        },
        splitLine: {
          lineStyle: {
            color: getCssVar('--chart-grid')
          }
        },
        nameTextStyle: {
          color: getCssVar('--chart-axis'),
          fontSize: isSmallScreen ? 12 : 14,
          padding: [0, 0, 0, isSmallScreen ? 25 : 40]
        }
      }
    };

    // 清除現有圖表
    charts.forEach(chart => chart.dispose());
    const newCharts: echarts.ECharts[] = [];

    // 費用趨勢圖
    const costChart = echarts.init(document.getElementById('costChart'));
    newCharts.push(costChart);
    const costOption: EChartsOption = {
      ...baseChartConfig,
      title: { text: '月度費用趨勢' },
      tooltip: { trigger: 'axis' },
      xAxis: {
        ...baseChartConfig.xAxis,
        data: monthlyData.map(d => dayjs(d.month).format('MM/YYYY'))
      },
      yAxis: {
        ...baseChartConfig.yAxis,
        name: '費用 ($)'
      },
      series: [{
        type: 'line',
        data: monthlyData.map(d => d.cost),
        itemStyle: { color: getCssVar('--chart-line') },
        areaStyle: { 
          color: getCssVar('--chart-line'),
          opacity: 0.2 
        },
        smooth: true,
        symbolSize: isSmallScreen ? 4 : 6
      }]
    };
    costChart.setOption(costOption);

    // 充電度數圖
    const powerChart = echarts.init(document.getElementById('powerChart'));
    newCharts.push(powerChart);
    const powerOption: EChartsOption = {
      ...baseChartConfig,
      title: { text: '月度充電度數' },
      tooltip: { trigger: 'axis' },
      xAxis: {
        ...baseChartConfig.xAxis,
        data: monthlyData.map(d => dayjs(d.month).format('MM/YYYY'))
      },
      yAxis: {
        ...baseChartConfig.yAxis,
        name: '度數 (kWh)'
      },
      series: [{
        type: 'bar',
        data: monthlyData.map(d => d.power),
        itemStyle: { color: getCssVar('--chart-bar1') },
        barMaxWidth: isSmallScreen ? '40%' : '50%'
      }]
    };
    powerChart.setOption(powerOption);

    // 充電時長圖
    const durationChart = echarts.init(document.getElementById('durationChart'));
    newCharts.push(durationChart);
    const durationOption: EChartsOption = {
      ...baseChartConfig,
      title: { text: '月度充電時長' },
      tooltip: { trigger: 'axis' },
      xAxis: {
        ...baseChartConfig.xAxis,
        data: monthlyData.map(d => dayjs(d.month).format('MM/YYYY'))
      },
      yAxis: {
        ...baseChartConfig.yAxis,
        name: '時長 (分鐘)'
      },
      series: [{
        type: 'bar',
        data: monthlyData.map(d => d.duration),
        itemStyle: { color: getCssVar('--chart-bar2') },
        barMaxWidth: isSmallScreen ? '40%' : '50%'
      }]
    };
    durationChart.setOption(durationOption);

    // 常用站點圖
    const stationChart = echarts.init(document.getElementById('stationChart'));
    newCharts.push(stationChart);
    const stationOption: EChartsOption = {
      ...baseChartConfig,
      title: { text: '常用充電站點' },
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c}次 ({d}%)',
        position: function (pos, params, dom, rect, size) {
          // 根據螢幕寬度調整提示框位置
          if (window.innerWidth <= 480) {
            return [pos[0] - size.contentSize[0] / 2, pos[1]];
          }
          return pos;
        }
      },
      series: [{
        type: 'pie',
        radius: isSmallScreen ? ['35%', '65%'] : ['40%', '70%'],
        center: ['50%', '55%'],
        data: stationStats.map(s => ({
          name: s.name,
          value: s.count
        })),
        itemStyle: {
          color: (params: any) => {
            const colors = [
              getCssVar('--chart-pie1'),
              getCssVar('--chart-pie2'),
              getCssVar('--chart-pie3'),
              getCssVar('--chart-pie4'),
              getCssVar('--chart-pie5')
            ];
            return colors[params.dataIndex % colors.length];
          }
        },
        label: {
          show: true,
          color: getCssVar('--chart-text'),
          formatter: isSmallScreen ? '{b}\n{c}次' : '{b}: {c}次 ({d}%)',
          position: isSmallScreen ? 'inner' : 'outside',
          fontSize: isSmallScreen ? 10 : 12,
          lineHeight: isSmallScreen ? 12 : 16
        },
        labelLine: {
          show: !isSmallScreen,
          length: isSmallScreen ? 10 : 15,
          length2: isSmallScreen ? 5 : 10
        }
      }]
    };
    stationChart.setOption(stationOption);

    setCharts(newCharts);

    // 響應式處理
    const handleResize = () => {
      const isSmallScreen = window.innerWidth <= 480;
      
      newCharts.forEach((chart, index) => {
        chart.resize();
        
        // 獲取對應的選項
        const options = [costOption, powerOption, durationOption, stationOption];
        const currentOption = options[index];
        
        if (currentOption) {
          const updatedOption = { ...currentOption };
          
          // 更新標題字體大小
          if (updatedOption.title) {
            (updatedOption.title as any).textStyle = {
              ...(updatedOption.title as any).textStyle,
              fontSize: isSmallScreen ? 14 : 16
            };
          }

          // 更新 X 軸設置
          if (updatedOption.xAxis && typeof updatedOption.xAxis === 'object') {
            (updatedOption.xAxis as any).axisLabel = {
              ...(updatedOption.xAxis as any).axisLabel,
              fontSize: isSmallScreen ? 10 : 12,
              rotate: isSmallScreen ? 45 : 0
            };
          }

          // 更新 Y 軸設置
          if (updatedOption.yAxis && typeof updatedOption.yAxis === 'object') {
            const yAxis = updatedOption.yAxis as any;
            yAxis.axisLabel = {
              ...yAxis.axisLabel,
              fontSize: isSmallScreen ? 10 : 12
            };
            yAxis.nameTextStyle = {
              ...yAxis.nameTextStyle,
              fontSize: isSmallScreen ? 12 : 14,
              padding: [0, 0, 0, isSmallScreen ? 25 : 40]
            };
          }

          // 更新系列設置
          if (updatedOption.series && Array.isArray(updatedOption.series)) {
            const series = updatedOption.series[0] as any;
            if (series) {
              if (series.type === 'pie') {
                series.radius = isSmallScreen ? ['35%', '65%'] : ['40%', '70%'];
                series.label = {
                  ...series.label,
                  position: isSmallScreen ? 'inner' : 'outside',
                  formatter: isSmallScreen ? '{b}\n{c}次' : '{b}: {c}次 ({d}%)',
                  fontSize: isSmallScreen ? 10 : 12,
                  lineHeight: isSmallScreen ? 12 : 16,
                  show: true
                };
                series.labelLine = {
                  show: !isSmallScreen,
                  length: isSmallScreen ? 10 : 15,
                  length2: isSmallScreen ? 5 : 10
                };
              } else if (series.type === 'bar') {
                series.barMaxWidth = isSmallScreen ? '40%' : '50%';
              } else if (series.type === 'line') {
                series.symbolSize = isSmallScreen ? 4 : 6;
              }
            }
          }

          chart.setOption(updatedOption);
        }
      });
    };

    // 監聽系統主題變化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = () => {
      newCharts.forEach(chart => {
        const option = chart.getOption();
        if (option) {
          (option as any).backgroundColor = getCssVar('--bg-chart');
          if ((option as any).textStyle) {
            (option as any).textStyle.color = getCssVar('--chart-text');
          }
          chart.setOption(option);
        }
      });
    };

    window.addEventListener('resize', handleResize);
    mediaQuery.addListener(handleThemeChange);

    // 初始調整大小
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      mediaQuery.removeListener(handleThemeChange);
      newCharts.forEach(chart => chart.dispose());
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
          <div id="costChart" style={{ width: '100%', height: '100%' }} />
        </div>
        <div className="chart-container">
          <div id="powerChart" style={{ width: '100%', height: '100%' }} />
        </div>
        <div className="chart-container">
          <div id="durationChart" style={{ width: '100%', height: '100%' }} />
        </div>
        <div className="chart-container">
          <div id="stationChart" style={{ width: '100%', height: '100%' }} />
        </div>
      </div>
    </div>
  );
};

export default Statistics;
