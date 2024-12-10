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
  currentMileage: number;
  increasedMileage?: number;
  pricePerUnit?: number;
  pricePerMinute?: number;
  unit?: string;
  note?: string;
}

export interface Vehicle {
  id: string;           // ID（系統生成）
  name: string;         // 汽車名稱（必填）
  licensePlate: string; // 車牌號碼（選填，但型別上必須有值）
  imageUrl?: string;    // 車輛照片（選填）
  purchaseDate?: string;// 購買日期（選填）
  isDefault: boolean;   // 是否為預設車輛
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
