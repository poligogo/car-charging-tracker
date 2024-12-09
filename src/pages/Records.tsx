import React, { useState, useEffect } from 'react';
import { Button, Popup, Form, Toast, Input, TextArea } from 'antd-mobile';
import { useChargingStore } from '../stores/chargingStore';
import type { ChargingRecord } from '../types';
import dayjs from 'dayjs';
import ChargingHistory from '../components/ChargingHistory';
import './Records.css';

const Records: React.FC = () => {
  const { addRecord, loadRecords } = useChargingStore();
  const [showForm, setShowForm] = useState(false);
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadRecords();
  }, []);

  const onFinish = async (values: Partial<ChargingRecord>) => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      
      const record: Omit<ChargingRecord, 'id'> = {
        date: dayjs().format('YYYY-MM-DD'),
        startTime: values.startTime || '',
        endTime: values.endTime || '',
        power: Number(values.power) || 0,
        chargingFee: Number(values.chargingFee) || 0,
        parkingFee: Number(values.parkingFee) || 0,
        stationName: values.stationName || '',
        duration: Number(values.duration) || 0,
        vendor: values.vendor,
        specification: values.specification,
        unit: values.unit,
        note: values.note,
        currentMileage: Number(values.currentMileage) || 0,
        increasedMileage: Number(values.increasedMileage) || 0,
        pricePerUnit: Number(values.pricePerUnit) || 0,
        pricePerMinute: Number(values.pricePerMinute) || 0
      };

      await addRecord(record);
      Toast.show({
        content: '新增記錄成功',
        position: 'bottom',
      });
      
      form.resetFields();
      setShowForm(false);
      await loadRecords();
    } catch (error) {
      console.error('Failed to save record:', error);
      Toast.show({
        content: '新增記錄失敗',
        position: 'bottom',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateDuration = (startTime: string, endTime: string): number => {
    const start = dayjs(`2000-01-01 ${startTime}`);
    let end = dayjs(`2000-01-01 ${endTime}`);
    
    if (end.isBefore(start)) {
      end = end.add(1, 'day');
    }
    
    return end.diff(start, 'minute');
  };

  const calculateFee = () => {
    const values = form.getFieldsValue();
    const { power, pricePerUnit, startTime, endTime, pricePerMinute } = values;

    try {
      let fee = 0;
      let duration = 0;
      let roundedFee = 0;

      if (startTime && endTime) {
        duration = calculateDuration(startTime, endTime);
        form.setFieldValue('duration', duration);
      }

      if (pricePerUnit && power) {
        fee = power * pricePerUnit;
      } else if (pricePerMinute && duration) {
        fee = duration * pricePerMinute;
      }

      if (fee > 0) {
        roundedFee = Math.round(fee * 100) / 100;
        form.setFieldValue('chargingFee', roundedFee.toFixed(2));

        if (power > 0) {
          const avgPrice = roundedFee / power;
          form.setFieldValue('avgPrice', avgPrice.toFixed(3));
        }
      }

      const currentMileage = Number(values.currentMileage);
      const lastRecord = useChargingStore.getState().records[0];
      if (lastRecord && currentMileage) {
        const increasedMileage = currentMileage - (lastRecord.currentMileage || 0);
        if (increasedMileage > 0) {
          form.setFieldValue('increasedMileage', increasedMileage);
          
          if (roundedFee > 0) {
            const costPerKm = roundedFee / increasedMileage;
            form.setFieldValue('costPerKm', costPerKm.toFixed(2));
          }
        }
      }
    } catch (error) {
      console.error('計算費用時發生錯誤:', error);
      Toast.show({
        content: '計算費用時發生錯誤',
        position: 'bottom',
      });
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    form.setFieldValue(field, value);
    
    const triggerFields = ['power', 'pricePerUnit', 'startTime', 'endTime', 'pricePerMinute', 'currentMileage'];
    if (triggerFields.includes(field)) {
      calculateFee();
    }
  };

  return (
    <div className="records-page">
      <div className="records-header">
        <h1>充電記錄</h1>
        <Button color="primary" onClick={() => setShowForm(true)}>
          新增記錄
        </Button>
      </div>

      <ChargingHistory />

      <Popup
        visible={showForm}
        onMaskClick={() => setShowForm(false)}
        position="bottom"
        bodyStyle={{ height: '90vh' }}
      >
        <div className="form-container">
          <div className="form-header">
            <h3>新增充電記錄</h3>
            <Button onClick={() => setShowForm(false)}>關閉</Button>
          </div>
          <Form
            form={form}
            onFinish={onFinish}
            layout="vertical"
            footer={
              <Button block type="submit" color="primary">
                儲存
              </Button>
            }
          >
            <Form.Header>基本資訊</Form.Header>
            <Form.Item name="date" label="充電日期" rules={[{ required: true }]}>
              <Input type="date" placeholder="請選擇充電日期" />
            </Form.Item>

            <Form.Item 
              name="currentMileage" 
              label="當前里程 (km)" 
              rules={[{ required: true }]}
            >
              <Input type="number" placeholder="請輸入當前里程" />
            </Form.Item>

            <Form.Header>充電資訊</Form.Header>
            <Form.Item name="startTime" label="開始時間" rules={[{ required: true }]}>
              <Input type="time" placeholder="請選擇開始時間" onChange={calculateFee} />
            </Form.Item>

            <Form.Item name="endTime" label="結束時間" rules={[{ required: true }]}>
              <Input type="time" placeholder="請選擇結束時間" onChange={calculateFee} />
            </Form.Item>

            <Form.Item 
              name="power" 
              label="充電量 (kWh)" 
              rules={[{ required: true }]}
            >
              <Input 
                type="number" 
                placeholder="請輸入充電量" 
                onChange={value => handleFieldChange('power', value)}
              />
            </Form.Item>

            <Form.Item 
              name="avgPrice" 
              label="平均單價 (元/kWh)"
              disabled
            >
              <Input readOnly />
            </Form.Item>

            <Form.Item 
              name="costPerKm" 
              label="每公里成本 (元/km)"
              disabled
            >
              <Input readOnly />
            </Form.Item>

            <Form.Header>充電站資訊</Form.Header>
            <Form.Item name="vendor" label="充電店家" rules={[{ required: true }]}>
              <Input placeholder="請輸入充電店家" />
            </Form.Item>

            <Form.Item name="stationName" label="充電站" rules={[{ required: true }]}>
              <Input placeholder="請輸入充電站名稱" />
            </Form.Item>

            <Form.Item name="specification" label="充電規格">
              <select className="form-select">
                <option value="">請選擇充電規格</option>
                <option value="J1772">交流慢充 - J1772</option>
                <option value="Type2">交流慢充 - Type 2</option>
                <option value="TPC">直流快充 - TPC (NACS)</option>
                <option value="CCS2">直流快充 - CCS2</option>
                <option value="CCS1">直流快充 - CCS1</option>
              </select>
            </Form.Item>

            <Form.Header>費率資訊</Form.Header>
            <Form.Item 
              name="pricePerUnit" 
              label="每度電價 (元/度)"
              extra="填寫每度電價或每分鐘價格其中一項即可"
            >
              <Input 
                type="number" 
                placeholder="請輸入每度電價" 
                onChange={calculateFee}
              />
            </Form.Item>

            <Form.Item 
              name="pricePerMinute" 
              label="每分鐘價格 (元/分鐘)"
            >
              <Input 
                type="number" 
                placeholder="請輸入每分鐘價格" 
                onChange={calculateFee}
              />
            </Form.Item>

            <Form.Header>費用資訊</Form.Header>
            <Form.Item 
              name="chargingFee" 
              label="充電費用 (元)" 
              rules={[{ required: true }]}
            >
              <Input type="number" placeholder="充電金額將自動計算，也可手動輸入" />
            </Form.Item>

            <Form.Item name="parkingFee" label="停車費 (元)">
              <Input type="number" placeholder="請輸入停車費" />
            </Form.Item>

            <Form.Header>其他資訊</Form.Header>
            <Form.Item name="note" label="備註">
              <TextArea 
                placeholder="請輸入備註"
                maxLength={100}
                rows={3}
              />
            </Form.Item>
          </Form>
        </div>
      </Popup>
    </div>
  );
};

export default Records;
