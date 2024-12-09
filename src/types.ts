export interface ChargingRecord {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  power: number;
  chargingFee: number;
  parkingFee?: number;
  stationName: string;
  duration: number;  // 以分鐘為單位
  note?: string;
} 