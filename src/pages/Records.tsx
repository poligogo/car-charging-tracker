import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Calendar, Picker, Popup, List, TextArea, Dropdown, Selector, Toast } from 'antd-mobile';
import { useChargingStore } from '../stores/chargingStore';
import type { ChargingRecord } from '../types';
import dayjs from 'dayjs';

interface FormValues extends Omit<ChargingRecord, 'id' | 'startTime' | 'endTime'> {
  startTime: string | Date;
  endTime: string | Date;
}

const CHARGING_SPECS = [
  { label: '交流慢充 - J1772', value: 'J1772' },
  { label: '交流慢充 - Type 2', value: 'Type 2' },
  { label: '直流快充 - TPC (NACS)', value: 'TPC' },
  { label: '直流快充 - CCS2', value: 'CCS2' },
  { label: '直流快充 - CCS1', value: 'CCS1' },
];

const Records: React.FC = () => {
  const { records, stations, addRecord, loadRecords, loadStations, addStation } = useChargingStore();
  const [showForm, setShowForm] = useState(false);
  const [form] = Form.useForm();
  const [lastMileage, setLastMileage] = useState(0);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customVendor, setCustomVendor] = useState('');
  const [vendorVisible, setVendorVisible] = useState(false);
  const [specVisible, setSpecVisible] = useState(false);
  const [unitVisible, setUnitVisible] = useState(false);
  
  const defaultVendors = [
    'TESLA',
    'UPOWER',
    '特爾',
    'EVOASIS',
    'EVALUE',
    'USPACE',
    'YES!來電',
    'DARA',
    'iCharging'
  ];

  const handleAddVendor = async (newVendor: string) => {
    try {
      await addStation({
        id: Date.now().toString(),
        vendor: newVendor,
        name: ''
      });
      await loadStations();
      setCustomVendor('');
      Toast.show({
        content: '新增店家成功',
        position: 'bottom',
      });
    } catch (error) {
      Toast.show({
        content: '新增店家失敗',
        position: 'bottom',
      });
    }
  };

  const getAvailableVendors = () => {
    const existingVendors = new Set(stations.map(s => s.vendor));
    const allVendors = new Set([...defaultVendors, ...Array.from(existingVendors)]);
    return Array.from(allVendors).sort();
  };

  useEffect(() => {
    loadRecords();
    loadStations();
    if (records.length > 0) {
      setLastMileage(records[records.length - 1].currentMileage);
    }
  }, []);

  const onFinish = async (values: FormValues) => {
    const startTime = dayjs(values.startTime).toISOString();
    const endTime = dayjs(values.endTime).toISOString();
    const duration = dayjs(endTime).diff(dayjs(startTime), 'minute');
    const increasedMileage = values.currentMileage! - lastMileage;
    
    await addRecord({
      ...values,
      id: Date.now().toString(),
      date: dayjs().format('YYYY-MM-DD'),
      startTime,
      endTime,
      duration,
      increasedMileage,
    } as ChargingRecord);
    
    form.resetFields();
    setShowForm(false);
  };

  const calculateChargingFee = () => {
    const values = form.getFieldsValue();
    const { power, pricePerUnit, pricePerMinute, startTime, endTime } = values;
    
    if (power && startTime && endTime) {
      if (pricePerUnit) {
        const fee = power * pricePerUnit;
        form.setFieldsValue({ chargingFee: fee.toFixed(2) });
      } else if (pricePerMinute) {
        const duration = dayjs(endTime).diff(dayjs(startTime), 'minute');
        const fee = duration * pricePerMinute;
        form.setFieldsValue({ chargingFee: fee.toFixed(2) });
      }
    }
  };

  const generateTimeOptions = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
    const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
    return [hours, minutes];
  };

  const handleSelectDate = (val: Date) => {
    form.setFieldsValue({ 
      date: dayjs(val).format('YYYY-MM-DD') 
    });
    setShowDatePicker(false);
  };

  const timeColumns = [
    {
      key: 'hour',
      values: Array.from({ length: 24 }).map((_, i) => ({
        label: i.toString().padStart(2, '0'),
        value: i.toString().padStart(2, '0')
      }))
    },
    {
      key: 'minute',
      values: Array.from({ length: 60 }).map((_, i) => ({
        label: i.toString().padStart(2, '0'),
        value: i.toString().padStart(2, '0')
      }))
    }
  ];

  return (
    <div className="records-page">
      <div className="records-header">
        <h1>充電記錄</h1>
        <Button color="primary" onClick={() => setShowForm(true)}>
          新增記錄
        </Button>
      </div>

      <List>
        {records.map(record => (
          <List.Item
            key={record.id}
            title={dayjs(record.date).format('YYYY-MM-DD')}
            description={
              <div className="record-details">
                <div className="record-row">
                  <span>充電店家：{record.vendor}</span>
                  <span>充電站：{record.stationName}</span>
                </div>
                <div className="record-row">
                  <span>規格：{record.specification}</span>
                  <span>充電量：{record.power}{record.unit}</span>
                </div>
                <div className="record-row">
                  <span>當前里程：{record.currentMileage}km</span>
                  <span>增加里程：{record.increasedMileage}km</span>
                </div>
                <div className="record-row">
                  <span>開始時間：{dayjs(record.startTime).format('HH:mm')}</span>
                  <span>結束時：{dayjs(record.endTime).format('HH:mm')}</span>
                </div>
                <div className="record-row">
                  <span>充時間：{record.duration}分鐘</span>
                  <span>單價：{record.pricePerUnit ? `${record.pricePerUnit}元/${record.unit}` : 
                            `${record.pricePerMinute}元/分鐘`}</span>
                </div>
                <div className="record-row">
                  <span>充電費用：${record.chargingFee}</span>
                  <span>停車費用：${record.parkingFee || 0}</span>
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
          <Form.Item name="date" label="充電日期" rules={[{ required: true }]}>
            <div className="date-input" onClick={() => setShowDatePicker(true)}>
              <Input
                readOnly
                placeholder="請選擇充電日期"
                value={form.getFieldValue('date')}
              />
            </div>
          </Form.Item>

          <Popup
            visible={showDatePicker}
            onMaskClick={() => setShowDatePicker(false)}
            position="bottom"
            bodyStyle={{ height: '400px' }}
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

          <Form.Item name="currentMileage" label="當前里程" rules={[{ required: true }]}>
            <Input 
              type="number" 
              placeholder="請輸入當前里程" 
              inputMode="decimal"
              pattern="[0-9]*"
            />
          </Form.Item>

          <Form.Header>時間資訊</Form.Header>
          <Form.Item name="startTime" label="開始時間" rules={[{ required: true }]}>
            <Input
              type="time"
              placeholder="請選擇開始時間"
              onChange={val => {
                form.setFieldsValue({ startTime: val });
              }}
            />
          </Form.Item>

          <Form.Item name="endTime" label="結束時間" rules={[{ required: true }]}>
            <Input
              type="time"
              placeholder="請選擇結束時間"
              onChange={val => {
                form.setFieldsValue({ endTime: val });
                calculateChargingFee();
              }}
            />
          </Form.Item>

          <Form.Header>充電站資訊</Form.Header>
          <Form.Item name="vendor" label="充電店家" rules={[{ required: true }]}>
            <div className="custom-dropdown">
              <div 
                className="dropdown-title"
                onClick={() => setVendorVisible(!vendorVisible)}
              >
                {form.getFieldValue('vendor') || '請選擇充電店家'}
              </div>
              {vendorVisible && (
                <>
                  <div className="dropdown-mask" onClick={() => setVendorVisible(false)} />
                  <div className="vendor-dropdown">
                    {getAvailableVendors().map(vendor => (
                      <div
                        key={vendor}
                        className="vendor-option"
                        onClick={() => {
                          form.setFieldsValue({ vendor });
                          setVendorVisible(false);
                        }}
                      >
                        {vendor}
                      </div>
                    ))}
                    <div className="add-vendor">
                      <Input
                        placeholder="新增店家"
                        value={customVendor}
                        onChange={val => setCustomVendor(val)}
                        onClick={e => e.stopPropagation()}
                      />
                      <Button
                        size='small'
                        color='primary'
                        disabled={!customVendor.trim()}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddVendor(customVendor.trim());
                        }}
                      >
                        新增
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </Form.Item>

          <Form.Item name="stationName" label="充電站" rules={[{ required: true }]}>
            <Input placeholder="請輸入充電站名稱" />
          </Form.Item>

          <Form.Item name="specification" label="充電規格" rules={[{ required: true }]}>
            <div className="custom-dropdown">
              <div 
                className="dropdown-title"
                onClick={() => setSpecVisible(!specVisible)}
              >
                {CHARGING_SPECS.find(spec => spec.value === form.getFieldValue('specification'))?.label || 
                 '請選擇充電規格'}
              </div>
              {specVisible && (
                <>
                  <div className="dropdown-mask" onClick={() => setSpecVisible(false)} />
                  <div className="spec-dropdown">
                    {CHARGING_SPECS.map(spec => (
                      <div
                        key={spec.value}
                        className="spec-option"
                        onClick={() => {
                          form.setFieldsValue({ specification: spec.value });
                          setSpecVisible(false);
                        }}
                      >
                        {spec.label}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </Form.Item>

          <Form.Header>充電資訊</Form.Header>
          <Form.Item name="power" label="充電電量" rules={[{ required: true }]}>
            <Input 
              type="number" 
              placeholder="請輸入充電電量" 
              onChange={() => calculateChargingFee()} 
              inputMode="decimal"
              pattern="[0-9]*"
            />
          </Form.Item>

          <Form.Item name="unit" label="充電單位" rules={[{ required: true }]}>
            <div className="custom-dropdown">
              <div 
                className="dropdown-title"
                onClick={() => setUnitVisible(!unitVisible)}
              >
                {form.getFieldValue('unit') || '請選擇單位'}
              </div>
              {unitVisible && (
                <>
                  <div className="dropdown-mask" onClick={() => setUnitVisible(false)} />
                  <div className="unit-dropdown">
                    {[
                      { label: '度', value: '度' },
                      { label: 'kWh', value: 'kWh' }
                    ].map(unit => (
                      <div
                        key={unit.value}
                        className="unit-option"
                        onClick={() => {
                          form.setFieldsValue({ unit: unit.value });
                          setUnitVisible(false);
                        }}
                      >
                        {unit.label}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </Form.Item>

          <Form.Header>費率資訊</Form.Header>
          <Form.Item name="pricePerUnit" label="每度電價">
            <Input 
              type="number" 
              placeholder="請輸入每度電價" 
              onChange={() => calculateChargingFee()} 
              inputMode="decimal"
              pattern="[0-9]*"
            />
          </Form.Item>

          <Form.Item name="pricePerMinute" label="每分鐘價格">
            <Input 
              type="number" 
              placeholder="請輸入每分鐘價格" 
              onChange={() => calculateChargingFee()} 
              inputMode="decimal"
              pattern="[0-9]*"
            />
          </Form.Item>

          <Form.Header>費用資訊</Form.Header>
          <Form.Item name="chargingFee" label="充電金額" rules={[{ required: true }]}>
            <Input type="number" placeholder="充電金額將自動計算" readOnly />
          </Form.Item>

          <Form.Item name="parkingFee" label="停車費">
            <Input 
              type="number" 
              placeholder="請輸入停車費" 
              inputMode="decimal"
              pattern="[0-9]*"
            />
          </Form.Item>

          <Form.Header>其他資訊</Form.Header>
          <Form.Item name="notes" label="備註">
            <TextArea placeholder="請輸入備註" maxLength={100} rows={3} />
          </Form.Item>
        </Form>
      </Popup>
    </div>
  );
};

export default Records; 