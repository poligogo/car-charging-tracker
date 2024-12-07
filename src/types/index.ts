export interface ChargingRecord {
  id: string;
  date: string;
  currentMileage: number;
  increasedMileage: number;
  startTime: string;
  endTime: string;
  duration: number;
  vendor: string;
  stationName: string;
  specification: string;
  power: number;
  unit: string;
  pricePerUnit: number;
  pricePerMinute: number;
  chargingFee: number;
  parkingFee: number;
  notes?: string;
}

export interface Vehicle {
  id: string;
  name: string;
  imageUrl?: string;
  isDefault: boolean;
}

export interface ChargingStation {
  id: string;
  vendor: string;
  name: string;
  specification: string;
}

export interface MonthlyStats {
  totalCost: number;
  totalPower: number;
  chargingCount: number;
  averagePrice: number;
}

export interface MaintenanceRecord {
  id: string;
  date: string;
  shopName: string;
  mileage: number;
  items: string;
  cost: number;
  notes?: string;
} 