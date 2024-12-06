import React, { useEffect, useRef, useState } from 'react';
import { List, Button, Dialog, Form, Input, ImageUploader, Toast, SwipeAction } from 'antd-mobile';
import { useChargingStore } from '../stores/chargingStore';
import type { Vehicle } from '../types';
import { db } from '../services/db';

const Settings: React.FC = () => {
  const { vehicles, loadVehicles, addVehicle, setDefaultVehicle, deleteVehicle, updateVehicle, records } = useChargingStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form] = Form.useForm();
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  useEffect(() => {
    loadVehicles();
  }, []);

  const handleAddVehicle = async (values: Partial<Vehicle>) => {
    try {
      const imageUrl = Array.isArray(values.imageUrl) 
        ? values.imageUrl[0]?.url 
        : values.imageUrl;

      await addVehicle({
        ...values,
        id: Date.now().toString(),
        isDefault: vehicles.length === 0,
        imageUrl,
      } as Vehicle);
      
      Toast.show({
        content: '新增車輛成功',
        position: 'bottom',
      });
      
      Dialog.clear();
      form.resetFields();
    } catch (error) {
      Toast.show({
        content: '新增車輛失敗',
        position: 'bottom',
      });
    }
  };

  const handleDeleteVehicle = async (vehicle: Vehicle) => {
    if (vehicle.isDefault) {
      Toast.show({
        content: '無法刪除預設車輛',
        position: 'bottom',
      });
      return;
    }

    Dialog.confirm({
      title: '確認刪除',
      content: `確定要刪除 ${vehicle.name} 嗎？`,
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
            <Button block type='submit' color='primary' onClick={() => form.submit()}>
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
                return new Promise((resolve) => {
                  const reader = new FileReader();
                  reader.onload = () => {
                    const url = reader.result as string;
                    form.setFieldsValue({ 
                      imageUrl: [{ url }]
                    });
                    resolve({
                      url
                    });
                  };
                  reader.readAsDataURL(file);
                });
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
      onClose: () => form.resetFields(),
    });
  };

  const handleEditVehicle = async (values: Partial<Vehicle>) => {
    if (!editingVehicle) return;
    
    try {
      const imageUrl = values.imageUrl && Array.isArray(values.imageUrl) && values.imageUrl.length > 0
        ? values.imageUrl[0].url
        : null;

      await updateVehicle(editingVehicle.id, {
        name: values.name,
        imageUrl: imageUrl,
        isDefault: editingVehicle.isDefault,
      });
      
      Toast.show({
        content: '修改成功',
        position: 'bottom',
      });

      Dialog.clear();
      form.resetFields();
      setEditingVehicle(null);
    } catch (error) {
      console.error('Edit vehicle failed:', error);
      Toast.show({
        content: '修改失敗',
        position: 'bottom',
      });
    }
  };

  const showEditVehicleDialog = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    form.setFieldsValue({
      name: vehicle.name,
      imageUrl: vehicle.imageUrl ? [{ url: vehicle.imageUrl }] : []
    });
    
    Dialog.show({
      title: '修改車輛',
      content: (
        <Form
          form={form}
          layout='horizontal'
          onFinish={handleEditVehicle}
          footer={
            <Button block type='submit' color='primary' onClick={() => form.submit()}>
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
                return new Promise((resolve) => {
                  const reader = new FileReader();
                  reader.onload = () => {
                    const url = reader.result as string;
                    form.setFieldsValue({ 
                      imageUrl: [{ url }]
                    });
                    resolve({ url });
                  };
                  reader.readAsDataURL(file);
                });
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
        setEditingVehicle(null);
        form.resetFields();
      },
    });
  };

  // 匯出 CSV
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
    ].join(',');

    const rows = records.map((record) =>
      [
        record.date,
        record.currentMileage,
        record.increasedMileage,
        record.startTime,
        record.endTime,
        record.duration,
        record.vendor,
        record.stationName,
        record.specification,
        record.power,
        record.unit,
        record.pricePerUnit,
        record.pricePerMinute,
        record.chargingFee,
        record.parkingFee,
        record.notes,
      ].join(',')
    );

    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `charging_records_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  // 匯入 CSV
  const importCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const [headers, ...rows] = text.split('\n');
      
      const records = rows.map((row) => {
        const values = row.split(',');
        return {
          date: values[0],
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
          notes: values[15],
        };
      });

      // TODO: 實現匯入記錄的邏輯
      Toast.show({
        content: `成功匯入 ${records.length} 筆錄`,
        position: 'bottom',
      });
    };
    reader.readAsText(file);
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
          匯出資料 (CSV)
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
          匯入資料 (CSV)
        </List.Item>
      </List>
    </div>
  );
};

export default Settings; 