export interface ChargingRecord {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  vendor: string;
  stationName: string;
  specification: string;
  power: number;
  duration: number;
  chargingFee: number;
  parkingFee?: number;
}

export interface Vehicle {
  id: string;
  name: string;
  imageUrl?: string;
  isDefault: boolean;
  purchaseDate?: string;
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

export interface MaintenanceItem {
  id: string;
  name: string;      // 項目名稱
  quantity: number;  // 數量
  price: number;     // 單價
  total: number;     // 小計
}

export interface MaintenanceRecord {
  id: string;
  date: string;
  type: string;
  mileage: number;
  location: string;
  items: MaintenanceItem[];  // 維修項目列表
  totalCost: number;         // 總費用
  nextMaintenance?: number;
  notes?: string;
} 