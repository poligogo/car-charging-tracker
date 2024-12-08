import React, { useEffect, useRef } from 'react';
import { List, Button, Dialog, Form, Input, ImageUploader, Toast, SwipeAction } from 'antd-mobile';
import { useChargingStore } from '../stores/chargingStore';
import type { Vehicle } from '../types';
import { db } from '../services/db';
import dayjs from 'dayjs';
import { GoogleDriveService } from '../services/googleDrive';
import '../styles/Settings.css';

const Settings: React.FC = () => {
  const { vehicles, loadVehicles, addVehicle, setDefaultVehicle, deleteVehicle, updateVehicle, records, maintenanceRecords } = useChargingStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form] = Form.useForm();
  const editingVehicleRef = useRef<Vehicle | null>(null);

  useEffect(() => {
    loadVehicles();
  }, []);

  const handleAddVehicle = async (values: Partial<Vehicle>) => {
    try {
      if (!values.name) {
        Toast.show({
          content: '請輸入車輛名稱',
          position: 'bottom',
        });
        return;
      }

      const vehicleData: Omit<Vehicle, 'id'> = {
        name: values.name,
        imageUrl: Array.isArray(values.imageUrl) && values.imageUrl.length > 0
          ? values.imageUrl[0].url 
          : undefined,
        purchaseDate: values.purchaseDate || dayjs().format('YYYY-MM-DD'),
        isDefault: false
      };

      await addVehicle(vehicleData);

      Toast.show({
        content: '新增車輛成功',
        position: 'bottom',
      });
      
      form.resetFields();
      Dialog.clear();
    } catch (error) {
      console.error('Add vehicle failed:', error);
      Toast.show({
        content: '新增車輛失敗',
        position: 'bottom',
      });
    }
  };

  const handleDeleteVehicle = async (vehicle: Vehicle) => {
    Dialog.confirm({
      title: '確認？',
      content: vehicle.isDefault 
        ? `此車輛為預設車輛，刪除後將需要重新設定預設車輛。確定要刪除 ${vehicle.name} 嗎？`
        : `確定要刪除 ${vehicle.name} 嗎？`,
      onConfirm: async () => {
        try {
          await deleteVehicle(vehicle.id);
          await loadVehicles();
          Toast.show({
            content: '刪除成功',
            position: 'bottom',
          });
        } catch (error) {
          Toast.show({
            content: '刪除失敗',
            position: 'bottom',
          });
        }
      },
    });
  };

  const showAddVehicleDialog = () => {
    form.resetFields();
    Dialog.show({
      title: '新增車輛',
      content: (
        <Form
          form={form}
          layout='horizontal'
          onFinish={handleAddVehicle}
          footer={
            <Button block type='submit' color='primary'>
              確認
            </Button>
          }
        >
          <Form.Item name='name' label='車輛名稱' rules={[{ required: true }]}>
            <Input placeholder='請輸入車輛名稱' />
          </Form.Item>
          
          <Form.Item name='purchaseDate' label='購買日期' rules={[{ required: true }]}>
            <Input 
              type="date" 
              placeholder="購買日"
              defaultValue={dayjs().format('YYYY-MM-DD')}
            />
          </Form.Item>

          <Form.Item name='imageUrl' label='車輛照片'>
            <ImageUploader
              maxCount={1}
              value={form.getFieldValue('imageUrl') || []}
              upload={async (file: File) => {
                try {
                  const resizedImageUrl = await resizeImage(file);
                  form.setFieldsValue({ 
                    imageUrl: [{ url: resizedImageUrl }]
                  });
                  return { url: resizedImageUrl };
                } catch (error) {
                  console.error('Image resize failed:', error);
                  Toast.show({
                    content: '圖片處理失敗',
                    position: 'bottom',
                  });
                  throw error;
                }
              }}
              onDelete={() => {
                form.setFieldsValue({ imageUrl: [] });
                return true;
              }}
            />
          </Form.Item>
        </Form>
      ),
      closeOnAction: true,
      closeOnMaskClick: true,
      onClose: () => {
        form.resetFields();
      },
    });
  };

  const showEditVehicleDialog = (vehicle: Vehicle) => {
    console.log('Opening edit dialog for vehicle:', vehicle);
    
    editingVehicleRef.current = vehicle;
    
    form.setFieldsValue({
      name: vehicle.name,
      imageUrl: vehicle.imageUrl ? [{ url: vehicle.imageUrl }] : [],
      purchaseDate: vehicle.purchaseDate
    });
    
    Dialog.show({
      title: '修改車輛',
      content: (
        <Form
          form={form}
          layout='horizontal'
          onFinish={handleEditVehicle}
          initialValues={{
            name: vehicle.name,
            imageUrl: vehicle.imageUrl ? [{ url: vehicle.imageUrl }] : [],
            purchaseDate: vehicle.purchaseDate
          }}
          footer={
            <Button block type='submit' color='primary'>
              確認
            </Button>
          }
        >
          <Form.Item name='name' label='車輛名稱' rules={[{ required: true }]}>
            <Input placeholder='請輸入車輛名稱' />
          </Form.Item>
          <Form.Item name='imageUrl' label='車輛照片'>
            <ImageUploader
              maxCount={1}
              value={form.getFieldValue('imageUrl') || []}
              upload={async (file: File) => {
                try {
                  const resizedImageUrl = await resizeImage(file);
                  form.setFieldsValue({ 
                    imageUrl: [{ url: resizedImageUrl }]
                  });
                  return { url: resizedImageUrl };
                } catch (error) {
                  console.error('Image resize failed:', error);
                  Toast.show({
                    content: '圖片處理失敗',
                    position: 'bottom',
                  });
                  throw error;
                }
              }}
              onDelete={() => {
                form.setFieldsValue({ imageUrl: [] });
                return true;
              }}
            />
          </Form.Item>
        </Form>
      ),
      closeOnAction: true,
      closeOnMaskClick: true,
      onClose: () => {
        form.resetFields();
      },
    });
  };

  const handleEditVehicle = async (values: Partial<Vehicle>) => {
    console.log('Starting edit vehicle with values:', values);
    const currentEditingVehicle = editingVehicleRef.current;
    console.log('Current editing vehicle:', currentEditingVehicle);
    
    if (!currentEditingVehicle) {
      console.log('No editing vehicle found');
      return;
    }
    
    try {
      console.log('Editing vehicle - Original:', currentEditingVehicle);
      console.log('Editing vehicle - New values:', values);

      if (!values.name) {
        Toast.show({
          content: '請輸入車輛名稱',
          position: 'bottom',
        });
        return;
      }

      const imageUrl = values.imageUrl && Array.isArray(values.imageUrl) && values.imageUrl.length > 0
        ? values.imageUrl[0].url
        : currentEditingVehicle.imageUrl;

      console.log('Processed imageUrl:', imageUrl);

      const updatedVehicle: Partial<Vehicle> = {
        name: values.name,
        imageUrl: imageUrl,
        purchaseDate: values.purchaseDate,
        isDefault: currentEditingVehicle.isDefault,
      };

      console.log('Updating vehicle with:', updatedVehicle);

      await updateVehicle(currentEditingVehicle.id, updatedVehicle);
      
      console.log('Update completed');

      Toast.show({
        content: '修改成功',
        position: 'bottom',
      });

      await loadVehicles();
      console.log('Vehicles reloaded');
      
      Dialog.clear();
      form.resetFields();
      editingVehicleRef.current = null;
    } catch (error) {
      console.error('Edit vehicle failed:', error);
      Toast.show({
        content: '修改失敗',
        position: 'bottom',
      });
    }
  };

  // 定義欄映射
  const CSV_HEADERS = {
    date: '日期',
    currentMileage: '當前里程',
    increasedMileage: '增加里程',
    startTime: '開始時間',
    endTime: '結束時間',
    duration: '充電時長',
    vendor: '充電店家',
    stationName: '充電站',
    specification: '充電規格',
    power: '電量',
    unit: '單位',
    pricePerUnit: '每度電價',
    pricePerMinute: '每分鐘價格',
    chargingFee: '充電費用',
    parkingFee: '停車費用',
    notes: '備註'
  };

  // 添加時間格式處理的輔助函數
  const formatTimeForDB = (timeStr: string) => {
    // 如果時間格式是 HH:mm，轉換為完整的 ISO 格式
    if (timeStr.length === 5) { // 格式 "HH:mm"
      const today = dayjs().format('YYYY-MM-DD');
      return dayjs(`${today} ${timeStr}`).toISOString();
    }
    // 如果已經是 ISO 格式，直接返回
    return timeStr;
  };

  const formatTimeForCSV = (isoTime: string) => {
    return dayjs(isoTime).format('HH:mm');
  };

  // 修改匯入函數
  const importCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
              startTime: formatTimeForDB(values[3]),
              endTime: formatTimeForDB(values[4]),
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
              notes: values[15],
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
        const store = useChargingStore.getState();
        await store.loadRecords();
        console.log('Store 中的記錄數:', store.records.length);

        // 驗證月度統計
        const currentMonth = dayjs().format('YYYY-MM');
        console.log('當前月份:', currentMonth);
        await store.calculateMonthlyStats(currentMonth);
        console.log('更新後的月度統計:', store.monthlyStats);

        Toast.show({
          content: `成功匯入 ${records.length} 筆紀錄`,
          position: 'bottom',
        });

        // 清除文件輸入
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

        // 延遲重新加載頁面
        console.log('準備重新加載頁面...');
        setTimeout(() => {
          window.location.reload();
        }, 1000);

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

  // 修改匯出函數
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
      'notes',
    ];

    const headerRow = headers.map(key => CSV_HEADERS[key as keyof typeof CSV_HEADERS]).join(',');

    const rows = records.map((record) =>
      headers.map(key => {
        const value = record[key as keyof typeof record];
        
        // 處理時間格式
        if (key === 'startTime' || key === 'endTime') {
          return formatTimeForCSV(value as string);
        }
        
        // 處理可能包含逗號的字值
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

  // 添加維修記錄的欄位映射
  const MAINTENANCE_CSV_HEADERS = {
    date: '日期',
    mileage: '里程',
    type: '維修類型',
    location: '維修地點',
    cost: '維修費用',
    description: '維修內容',
    nextMaintenance: '下次保養里程',
    notes: '備註'
  };

  // 添加維修記錄的匯出函數
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

    const headerRow = headers.map(key => MAINTENANCE_CSV_HEADERS[key as keyof typeof MAINTENANCE_CSV_HEADERS]).join(',');

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

  // 添加 Google Drive 匯出函數
  const exportToGoogleDrive = async () => {
    try {
      Toast.show({
        content: '準備匯出��� Google Drive...',
        position: 'bottom',
      });

      const driveService = GoogleDriveService.getInstance();
      const { status, error } = driveService.getInitializationStatus();

      console.log('[Google Drive 匯出] 檢查 API 狀態:', status);

      if (status === 'failed') {
        throw new Error(`Google API 初始化失敗: ${error?.message || '未知錯誤'}`);
      }

      if (status !== 'completed') {
        console.log('[Google Drive 匯出] API 尚未初始化，嘗試初始化');
        await driveService.init();
      }

      // 添加日誌
      console.log('開始準備 CSV 內容');
      
      // 生成 CSV 內容（使用與一般匯出相同的邏輯）
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
        'notes',
      ];

      const headerRow = headers.map(key => CSV_HEADERS[key as keyof typeof CSV_HEADERS]).join(',');
      const rows = records.map(record =>
        headers.map(key => {
          const value = record[key as keyof typeof record];
          if (key === 'startTime' || key === 'endTime') {
            return formatTimeForCSV(value as string);
          }
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value}"`;
          }
          return value;
        }).join(',')
      );

      const csv = [headerRow, ...rows].join('\n');
      const filename = `充電記錄_${dayjs().format('YYYY-MM-DD')}.csv`;

      console.log('CSV 內容準備完成，開始上傳');
      
      // 上傳到 Google Drive
      try {
        const fileId = await driveService.uploadToDrive(csv, filename);
        console.log('上傳成功，文件 ID:', fileId);
        
        Toast.show({
          content: '成功匯出到 Google Drive',
          position: 'bottom',
        });
      } catch (uploadError) {
        console.error('上傳過程中發生錯誤:', uploadError);
        throw uploadError;
      }
    } catch (error) {
      console.error('[Google Drive 匯出] 失敗:', error);
      Toast.show({
        content: error instanceof Error 
          ? `匯出失敗: ${error.message}` 
          : '匯出失敗，請檢查網路連線並重新整理頁面',
        position: 'bottom',
      });
    }
  };

  // 添加圖片處理函數
  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          // 計算縮放比例
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          
          // 使用 2d context with alpha
          const ctx = canvas.getContext('2d', {
            alpha: true,
            willReadFrequently: true
          });
          
          if (ctx) {
            // 確保畫布是完全透明的
            ctx.clearRect(0, 0, width, height);
            
            // 設置合成模式以保持透明度
            ctx.globalCompositeOperation = 'source-over';
            
            // 繪製圖片
            ctx.drawImage(img, 0, 0, width, height);

            // 檢查是否為 PNG 並保持透明度
            if (file.type === 'image/png') {
              // 使用 PNG 格式並保持完全品質
              const dataUrl = canvas.toDataURL('image/png', 1.0);
              resolve(dataUrl);
            } else {
              // 對於非 PNG 圖片，轉換為 JPEG
              const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
              resolve(dataUrl);
            }
          }
        };
        
        // 設置圖片的跨域屬性
        img.crossOrigin = 'anonymous';
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="settings-page">
      <h1>設定</h1>
      
      <List header='車輛管理'>
        {vehicles.map((vehicle) => (
          <SwipeAction
            key={vehicle.id}
            rightActions={[
              {
                key: 'edit',
                text: '修改',
                color: 'primary',
                onClick: () => showEditVehicleDialog(vehicle),
              },
              {
                key: 'delete',
                text: '刪除',
                color: 'danger',
                onClick: () => handleDeleteVehicle(vehicle),
              },
            ]}
          >
            <List.Item
              prefix={
                vehicle.imageUrl ? (
                  <div className="vehicle-image">
                    <img
                      src={vehicle.imageUrl}
                      alt={vehicle.name}
                    />
                  </div>
                ) : null
              }
              extra={
                <Button
                  size='small'
                  color={vehicle.isDefault ? 'default' : 'primary'}
                  onClick={() => setDefaultVehicle(vehicle.id)}
                >
                  {vehicle.isDefault ? '預設車輛' : '設為預設'}
                </Button>
              }
            >
              {vehicle.name}
            </List.Item>
          </SwipeAction>
        ))}
        <List.Item>
          <Button block onClick={showAddVehicleDialog}>
            新增車輛
          </Button>
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
            <Button size='small' color='primary' onClick={exportToGoogleDrive}>
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
                onChange={importCSV}
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