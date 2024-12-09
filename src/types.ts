export interface ChargingRecord {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  power: number;
  chargingFee: number;
  parkingFee?: number;
  stationName: string;
  duration: number;
  currentMileage?: number;
  increasedMileage?: number;
  vendor?: string;
  specification?: string;
  unit?: string;
  pricePerUnit?: number;
  pricePerMinute?: number;
  note?: string;
}

export interface Vehicle {
  id: string;
  name: string;
  licensePlate: string;
  brand: string;
  model: string;
  year: number;
  batteryCapacity: number;
  isDefault?: boolean;
  imageUrl?: string;
  purchaseDate?: string;
}

export interface ChargingStation {
  id: string;
  name: string;
  address: string;
  vendor: string;
  pricePerUnit: number;
  pricePerMinute?: number;
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
  type: string;
  description: string;
  cost: number;
  mileage?: number;
  note?: string;
  location?: string;
  totalCost?: number;
  items?: MaintenanceItem[];
}

export interface MaintenanceItem {
  id: string;
  name: string;
  interval: number;
  lastMaintenance?: string;
  nextMaintenance?: string;
  quantity: number;
  price: number;
  total: number;
} 