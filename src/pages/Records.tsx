import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Calendar, Popup, List, TextArea, Toast, SwipeAction, Dialog } from 'antd-mobile';
import { useChargingStore } from '../stores/chargingStore';
import type { ChargingRecord, ChargingStation } from '../types';
import dayjs from 'dayjs';
import ChargingHistory from '../components/ChargingHistory';

interface FormValues {
  date: string;
  startTime: string | Date;
  endTime: string | Date;
  power: number;
  chargingFee: number;
  parkingFee?: number;
  stationName: string;
  currentMileage?: number;
  vendor?: string;
  specification?: string;
  unit?: string;
  pricePerUnit?: number;
  pricePerMinute?: number;
  note?: string;
}

const CHARGING_SPECS = [
  { label: '交流慢充 - J1772', value: 'J1772' },
  { label: '交流慢充 - Type 2', value: 'Type 2' },
  { label: '直流快充 - TPC (NACS)', value: 'TPC' },
  { label: '直流快充 - CCS2', value: 'CCS2' },
  { label: '直流快充 - CCS1', value: 'CCS1' },
];

const Records: React.FC = () => {
  const { records, stations, addRecord, loadRecords, loadStations, addStation, updateRecord, deleteRecord } = useChargingStore();
  const [showForm, setShowForm] = useState(false);
  const [form] = Form.useForm();
  const [lastMileage, setLastMileage] = useState(0);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customVendor, setCustomVendor] = useState('');
  const [vendorVisible, setVendorVisible] = useState(false);
  const [specVisible, setSpecVisible] = useState(false);
  const [unitVisible, setUnitVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ChargingRecord | null>(null);

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
      const newStation: Omit<ChargingStation, 'id'> = {
        vendor: newVendor,
        name: '',
        address: '',
        pricePerUnit: 0
      };
      await addStation(newStation);
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
      const lastRecord = records[records.length - 1];
      const mileage = lastRecord.currentMileage;
      if (typeof mileage === 'number') {
        setLastMileage(mileage);
      } else {
        setLastMileage(0);
      }
    }
  }, []);

  const onFinish = async (values: FormValues) => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      const today = dayjs().format('YYYY-MM-DD');
      const startTime = dayjs(`${today} ${values.startTime}`).toISOString();
      const endTime = dayjs(`${today} ${values.endTime}`).toISOString();
      
      let duration: number;
      if (dayjs(endTime).isBefore(dayjs(startTime))) {
        const nextDay = dayjs(`${today} ${values.endTime}`).add(1, 'day');
        duration = nextDay.diff(dayjs(`${today} ${values.startTime}`), 'minute');
      } else {
        duration = dayjs(endTime).diff(dayjs(startTime), 'minute');
      }

      const numericValues = {
        currentMileage: Number(values.currentMileage || 0),
        power: Number(values.power || 0),
        pricePerUnit: Number(values.pricePerUnit || 0),
        pricePerMinute: Number(values.pricePerMinute || 0),
        chargingFee: Number(values.chargingFee || 0),
        parkingFee: Number(values.parkingFee || 0),
      };

      const increasedMileage = numericValues.currentMileage - lastMileage;
      
      const record: Omit<ChargingRecord, 'id'> = {
        date: dayjs().format('YYYY-MM-DD'),
        startTime,
        endTime,
        duration,
        increasedMileage,
        vendor: values.vendor || '',
        stationName: values.stationName || '',
        specification: values.specification || '',
        unit: values.unit || '',
        note: values.note || '',
        ...numericValues
      };

      console.log('Saving record:', record);

      if (editingRecord) {
        await updateRecord(editingRecord.id, {
          ...record,
          id: editingRecord.id
        });
        Toast.show({
          content: '修改記錄成功',
          position: 'bottom',
        });
      } else {
        await addRecord(record);
        Toast.show({
          content: '新增記錄成功',
          position: 'bottom',
        });
      }
      
      form.resetFields();
      setShowForm(false);
      setEditingRecord(null);
      await loadRecords();
    } catch (error) {
      console.error('Failed to save record:', error);
      Toast.show({
        content: editingRecord ? '修改記錄失敗' : '新增記錄失敗',
        position: 'bottom',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateChargingFee = () => {
    const values = form.getFieldsValue();
    const { power, pricePerUnit, pricePerMinute, startTime, endTime } = values;
    
    if (power && startTime && endTime) {
      if (pricePerUnit) {
        const fee = Math.round(power * pricePerUnit * 100) / 100;
        form.setFieldsValue({ chargingFee: fee.toFixed(2) });
      } else if (pricePerMinute) {
        const duration = dayjs(endTime).diff(dayjs(startTime), 'minute');
        const fee = Math.round(duration * pricePerMinute * 100) / 100;
        form.setFieldsValue({ chargingFee: fee.toFixed(2) });
      }
    }
  };

  const handleSelectDate = (val: Date | null) => {
    if (val) {
      form.setFieldsValue({ 
        date: dayjs(val).format('YYYY-MM-DD') 
      });
      setShowDatePicker(false);
    }
  };

  const showEditForm = (record: ChargingRecord) => {
    setEditingRecord(record);
    form.setFieldsValue({
      ...record,
      startTime: dayjs(record.startTime).format('HH:mm'),
      endTime: dayjs(record.endTime).format('HH:mm')
    });
    setShowForm(true);
  };

  const handleDeleteRecord = async (id: string) => {
    Dialog.confirm({
      title: '確認刪除',
      content: '確定要刪除此充電記錄嗎？',
      onConfirm: async () => {
        try {
          await deleteRecord(id);
          await loadRecords();
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

  return (
    <div className="records-page">
      <ChargingHistory />
    </div>
  );
};

export default Records; 