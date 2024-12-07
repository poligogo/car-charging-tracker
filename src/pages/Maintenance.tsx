import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Calendar, Popup, List, TextArea } from 'antd-mobile';
import { useChargingStore } from '../stores/chargingStore';
import dayjs from 'dayjs';

interface MaintenanceRecord {
  id: string;
  date: string;
  shopName: string;
  mileage: number;
  items: string;
  cost: number;
  notes?: string;
}

const Maintenance: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [form] = Form.useForm();
  const { maintenanceRecords, addMaintenanceRecord, loadMaintenanceRecords } = useChargingStore();

  useEffect(() => {
    loadMaintenanceRecords();
  }, []);

  const handleSelectDate = (val: Date | null) => {
    if (val) {
      form.setFieldsValue({ 
        date: dayjs(val).format('YYYY-MM-DD') 
      });
    }
    setShowDatePicker(false);
  };

  const onFinish = async (values: Omit<MaintenanceRecord, 'id'>) => {
    await addMaintenanceRecord({
      ...values,
      id: Date.now().toString(),
    });
    form.resetFields();
    setShowForm(false);
  };

  return (
    <div className="maintenance-page">
      <div className="maintenance-header">
        <h1>維修紀錄</h1>
        <Button color="primary" onClick={() => setShowForm(true)}>
          新增紀錄
        </Button>
      </div>

      <List>
        {maintenanceRecords?.map(record => (
          <List.Item
            key={record.id}
            title={dayjs(record.date).format('YYYY-MM-DD')}
            description={
              <div className="record-details">
                <div className="record-row">
                  <span>維修廠：{record.shopName}</span>
                  <span>里程數：{record.mileage}km</span>
                </div>
                <div className="record-row">
                  <span>維修項目：{record.items}</span>
                </div>
                <div className="record-row">
                  <span>維修金額：${record.cost}</span>
                </div>
                {record.notes && (
                  <div className="record-notes">
                    備註：{record.notes}
                  </div>
                )}
              </div>
            }
          />
        ))}
      </List>

      <Popup
        visible={showForm}
        onMaskClick={() => setShowForm(false)}
        position="bottom"
        bodyStyle={{ height: '90vh', overflow: 'auto' }}
      >
        <Form
          form={form}
          onFinish={onFinish}
          layout="horizontal"
          footer={
            <Button block type="submit" color="primary">
              儲存
            </Button>
          }
        >
          <Form.Header>基本資訊</Form.Header>
          <Form.Item name="date" label="維修日期" rules={[{ required: true }]}>
            <div className="date-input" onClick={() => setShowDatePicker(true)}>
              <Input
                readOnly
                placeholder="請選擇維修日期"
                value={form.getFieldValue('date')}
              />
            </div>
          </Form.Item>

          <Popup
            visible={showDatePicker}
            onMaskClick={() => setShowDatePicker(false)}
            position="bottom"
          >
            <div className="calendar-container">
              <div className="calendar-header">
                <div className="calendar-title">選擇日期</div>
                <Button
                  size='small'
                  onClick={() => setShowDatePicker(false)}
                >
                  關閉
                </Button>
              </div>
              <Calendar
                selectionMode="single"
                defaultValue={new Date()}
                onChange={handleSelectDate}
              />
            </div>
          </Popup>

          <Form.Item name="shopName" label="維修廠名稱" rules={[{ required: true }]}>
            <Input placeholder="請輸入維修廠名稱" />
          </Form.Item>

          <Form.Item name="mileage" label="進場里程" rules={[{ required: true }]}>
            <Input 
              type="number" 
              placeholder="請輸入進場里程" 
              inputMode="decimal"
              pattern="[0-9]*"
            />
          </Form.Item>

          <Form.Item name="items" label="維修項目" rules={[{ required: true }]}>
            <TextArea 
              placeholder="請輸入維修項目" 
              maxLength={200}
              rows={3}
            />
          </Form.Item>

          <Form.Item name="cost" label="維修金額" rules={[{ required: true }]}>
            <Input 
              type="number" 
              placeholder="請輸入維修金額" 
              inputMode="decimal"
              pattern="[0-9]*"
            />
          </Form.Item>

          <Form.Item name="notes" label="備註">
            <TextArea 
              placeholder="請輸入備註" 
              maxLength={100}
              rows={3}
            />
          </Form.Item>
        </Form>
      </Popup>
    </div>
  );
};

export default Maintenance; 