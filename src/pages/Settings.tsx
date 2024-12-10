import React, { useRef } from 'react';
import { List, Button, Toast, Radio } from 'antd-mobile';
import VehicleManagement from '../components/VehicleManagement';
import { useChargingStore } from '../stores/chargingStore';
import { useThemeStore } from '../stores/themeStore';
import { db } from '../services/db';
import dayjs from 'dayjs';
import '../styles/Settings.css';
import '../styles/theme.css';

const Settings: React.FC = () => {
  const { records, maintenanceRecords, loadRecords } = useChargingStore();
  const { theme, setTheme } = useThemeStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        console.log('開始匯入 CSV');
        const text = e.target?.result as string;
        const [headers, ...rows] = text.split('\n');
        console.log('CSV 標題:', headers);
        console.log('CSV 行數:', rows.length);
        
        const records = rows
          .filter(row => row.trim())
          .map((row) => {
            const values = row.split(',');
            const date = dayjs(values[0]).format('YYYY-MM-DD');
            return {
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
              date,
              currentMileage: Number(values[1]),
              increasedMileage: Number(values[2]),
              startTime: values[3],
              endTime: values[4],
              duration: Number(values[5]),
              vendor: values[6],
              stationName: values[7],
              specification: values[8],
              power: Number(values[9]),
              unit: values[10],
              pricePerUnit: Number(values[11]),
              pricePerMinute: Number(values[12]),
              chargingFee: Number(values[13]),
              parkingFee: Number(values[14]),
              note: values[15],
            };
          });

        console.log('處理後的記錄:', records);

        // 先清空現有記錄
        await db.records.clear();
        console.log('已清空現有記錄');
        
        // 批量添加新記錄
        await db.records.bulkAdd(records);
        console.log('已添加新記錄到數據庫');

        // 驗證數據庫中的記錄
        const dbRecords = await db.records.toArray();
        console.log('數據庫中的記錄數:', dbRecords.length);

        // 更新 store 中的記錄
        await loadRecords();
        console.log('Store 中的記錄數:', records.length);

        Toast.show({
          content: `成功匯入 ${records.length} 筆紀錄`,
          position: 'bottom',
        });

        // 清除文件輸入
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

      } catch (error) {
        console.error('匯入失敗:', error);
        Toast.show({
          content: '匯入失敗，請檢查檔案格式',
          position: 'bottom',
        });
      }
    };
    reader.readAsText(file);
  };

  const exportCSV = () => {
    const headers = [
      'date',
      'currentMileage',
      'increasedMileage',
      'startTime',
      'endTime',
      'duration',
      'vendor',
      'stationName',
      'specification',
      'power',
      'unit',
      'pricePerUnit',
      'pricePerMinute',
      'chargingFee',
      'parkingFee',
      'note',
    ];

    const headerRow = headers.join(',');

    const rows = records.map((record) =>
      headers.map(key => {
        const value = record[key as keyof typeof record];
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`;
        }
        return value;
      }).join(',')
    );

    const csv = [headerRow, ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `充電記錄_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const exportMaintenanceCSV = () => {
    const headers = [
      'date',
      'mileage',
      'type',
      'location',
      'cost',
      'description',
      'nextMaintenance',
      'notes'
    ];

    const headerRow = headers.join(',');

    const rows = maintenanceRecords.map((record) =>
      headers.map(key => {
        const value = record[key as keyof typeof record];
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`;
        }
        return value;
      }).join(',')
    );

    const csv = [headerRow, ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `維修記錄_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <div className="settings-page">
      <h1>設定</h1>
      
      <VehicleManagement />

      <List header='外觀設定' style={{ marginTop: 20 }}>
        <List.Item>
          <div className="theme-selector">
            <span>主題模式</span>
            <Radio.Group
              value={theme}
              onChange={value => setTheme(value as 'light' | 'dark' | 'system')}
            >
              <div className="radio-options">
                <Radio value='light'>淺色</Radio>
                <Radio value='dark'>深色</Radio>
                <Radio value='system'>跟隨系統</Radio>
              </div>
            </Radio.Group>
          </div>
        </List.Item>
      </List>

      <List header='資料管理' style={{ marginTop: 20 }}>
        <List.Item
          extra={
            <Button size='small' color='primary' onClick={exportCSV}>
              匯出
            </Button>
          }
        >
          匯出充電記錄
        </List.Item>

        <List.Item
          extra={
            <Button size='small' color='primary'>
              匯出到 Drive
            </Button>
          }
        >
          匯出到 Google Drive
        </List.Item>

        <List.Item
          extra={
            <Button size='small' color='primary' onClick={exportMaintenanceCSV}>
              匯出
            </Button>
          }
        >
          匯出維修記錄
        </List.Item>

        <List.Item
          extra={
            <>
              <input
                type="file"
                accept=".csv"
                style={{ display: 'none' }}
                ref={fileInputRef}
                onChange={handleImport}
              />
              <Button
                size='small'
                color='primary'
                onClick={() => fileInputRef.current?.click()}
              >
                匯入
              </Button>
            </>
          }
        >
          匯入資料
        </List.Item>
      </List>
    </div>
  );
};

export default Settings;
