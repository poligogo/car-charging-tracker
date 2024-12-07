import { create } from 'zustand';
import { db } from '../services/db';
import type { ChargingRecord, Vehicle, ChargingStation, MonthlyStats, MaintenanceRecord } from '../types';

interface ChargingState {
  records: ChargingRecord[];
  stations: ChargingStation[];
  vehicles: Vehicle[];
  currentVehicle: Vehicle | null;
  monthlyStats: MonthlyStats;
  maintenanceRecords: MaintenanceRecord[];
  
  // 記錄相關
  addRecord: (record: Omit<ChargingRecord, 'id'>) => Promise<void>;
  updateRecord: (id: string, record: Partial<ChargingRecord>) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  loadRecords: () => Promise<void>;
  
  // 車站相關
  addStation: (station: Omit<ChargingStation, 'id'>) => Promise<void>;
  loadStations: () => Promise<void>;
  
  // 車輛相關
  addVehicle: (vehicle: Omit<Vehicle, 'id'>) => Promise<void>;
  setDefaultVehicle: (id: string) => Promise<void>;
  loadVehicles: () => Promise<void>;
  deleteVehicle: (id: string) => Promise<void>;
  updateVehicle: (id: string, vehicle: Partial<Vehicle>) => Promise<void>;
  
  // 統計相關
  calculateMonthlyStats: (month: string) => Promise<void>;
  
  // 維修記錄相關
  addMaintenanceRecord: (record: MaintenanceRecord) => Promise<void>;
  loadMaintenanceRecords: () => Promise<void>;
}

export const useChargingStore = create<ChargingState>((set, get) => ({
  records: [],
  stations: [],
  vehicles: [],
  currentVehicle: null,
  monthlyStats: {
    totalCost: 0,
    totalPower: 0,
    chargingCount: 0,
    averagePrice: 0
  },
  maintenanceRecords: [],

  addRecord: async (record: Omit<ChargingRecord, 'id'>) => {
    try {
      console.log('Adding record to store:', record);
      
      // 確保所有必要欄位都存在
      if (!record.date || !record.startTime || !record.endTime || !record.power) {
        throw new Error('Missing required fields');
      }

      // 添加到數據庫，自動生成 id
      const newRecord: ChargingRecord = {
        ...record,
        id: Date.now().toString()
      };

      const id = await db.records.add(newRecord);
      
      // 更新 state
      set(state => ({
        records: [...state.records, newRecord]
      }));

      // 更新月度統計
      await get().calculateMonthlyStats(record.date.slice(0, 7));

      console.log('Record added successfully:', newRecord);
    } catch (error) {
      console.error('Failed to add record:', error);
      throw error;
    }
  },

  updateRecord: async (id, record) => {
    await db.records.update(id, record);
    set(state => ({
      records: state.records.map(r => 
        r.id === id ? { ...r, ...record } : r
      )
    }));
  },

  deleteRecord: async (id: string) => {
    try {
      await db.records.delete(id);
      
      // 更新 state
      set(state => ({
        records: state.records.filter(r => r.id !== id)
      }));

      // 重新計算當月統計
      const currentMonth = new Date().toISOString().slice(0, 7);
      await get().calculateMonthlyStats(currentMonth);

    } catch (error) {
      console.error('Delete record failed:', error);
      throw error;
    }
  },

  loadRecords: async () => {
    try {
      const records = await db.records.toArray();
      set({ records });

      // 加載記錄後立即更新當月統計
      const currentMonth = new Date().toISOString().slice(0, 7);
      await get().calculateMonthlyStats(currentMonth);
    } catch (error) {
      console.error('Failed to load records:', error);
      throw error;
    }
  },

  addStation: async (station) => {
    const id = await db.stations.add(station as ChargingStation);
    const newStation = { ...station, id: id.toString() };
    set(state => ({
      stations: [...state.stations, newStation]
    }));
  },

  loadStations: async () => {
    const stations = await db.stations.toArray();
    set({ stations });
  },

  addVehicle: async (vehicle: Omit<Vehicle, 'id'>) => {
    try {
      console.log('Adding vehicle:', vehicle);
      
      // 檢查是否已存在相同名稱的車
      const existingVehicle = get().vehicles.find(v => v.name === vehicle.name);
      if (existingVehicle) {
        throw new Error('車輛名稱已存在');
      }

      const newId = Date.now().toString();
      const newVehicle: Vehicle = {
        ...vehicle,
        id: newId,
      };

      console.log('Before DB add');
      await db.vehicles.add(newVehicle);
      console.log('After DB add');

      console.log('Current state:', get().vehicles);
      set(state => {
        console.log('Setting new state with:', newVehicle);
        return {
          vehicles: [...state.vehicles, newVehicle],
          currentVehicle: vehicle.isDefault ? newVehicle : state.currentVehicle
        };
      });
    } catch (error) {
      console.error('Store addVehicle failed:', error);
      throw error;
    }
  },

  setDefaultVehicle: async (id) => {
    // 先將所有車輛設為非預設
    const vehicles = await db.vehicles.toArray();
    for (const vehicle of vehicles) {
      if (vehicle.isDefault) {
        await db.vehicles.update(vehicle.id, { isDefault: false });
      }
    }
    // 設定新的預設車輛
    await db.vehicles.update(id, { isDefault: true });
    const updatedVehicles = await db.vehicles.toArray();
    const currentVehicle = updatedVehicles.find(v => v.id === id) || null;
    set({ vehicles: updatedVehicles, currentVehicle });
  },

  loadVehicles: async () => {
    const vehicles = await db.vehicles.toArray();
    const currentVehicle = vehicles.find(v => v.isDefault) || null;
    set({ vehicles, currentVehicle });
  },

  calculateMonthlyStats: async (month: string) => {
    try {
      console.log('Calculating stats for month:', month);
      
      const records = await db.records
        .where('date')
        .startsWith(month)
        .toArray();

      console.log('Found records:', records);

      if (records.length === 0) {
        console.log('No records found, setting stats to 0');
        set({
          monthlyStats: {
            totalCost: 0,
            totalPower: 0,
            chargingCount: 0,
            averagePrice: 0
          }
        });
        return;
      }

      const totalCost = records.reduce((sum, r) => sum + (r.chargingFee || 0) + (r.parkingFee || 0), 0);
      const totalPower = records.reduce((sum, r) => sum + (r.power || 0), 0);

      console.log('Calculated values:', { totalCost, totalPower, count: records.length });

      const stats: MonthlyStats = {
        totalCost: Math.round(totalCost * 100) / 100,
        totalPower: totalPower,
        chargingCount: records.length,
        averagePrice: totalPower ? Number((totalCost / totalPower).toFixed(3)) : 0
      };

      console.log('Setting new stats:', stats);
      set({ monthlyStats: stats });
    } catch (error) {
      console.error('Calculate monthly stats failed:', error);
      throw error;
    }
  },

  deleteVehicle: async (id: string) => {
    try {
      await db.vehicles.delete(id);
      set(state => ({
        vehicles: state.vehicles.filter(v => v.id !== id),
        currentVehicle: state.currentVehicle?.id === id ? null : state.currentVehicle
      }));
      return true;
    } catch (error) {
      console.error('Delete vehicle failed:', error);
      throw error;
    }
  },

  updateVehicle: async (id: string, vehicle: Partial<Vehicle>) => {
    try {
      console.log('Store - Updating vehicle:', { id, vehicle });

      // 先檢查車輛是否存在
      const existingVehicle = await db.vehicles.get(id);
      console.log('Store - Existing vehicle:', existingVehicle);

      if (!existingVehicle) {
        throw new Error('Vehicle not found');
      }

      // 更新數據庫
      await db.vehicles.update(id, vehicle);
      console.log('Store - Database updated');
      
      // 獲取更新後的車輛列表
      const vehicles = await db.vehicles.toArray();
      console.log('Store - All vehicles after update:', vehicles);
      
      const currentVehicle = vehicles.find(v => v.isDefault) || null;
      console.log('Store - Current vehicle after update:', currentVehicle);
      
      // 更新 state
      set({ 
        vehicles,
        currentVehicle: currentVehicle
      });
      console.log('Store - State updated');

      // 驗證更新
      const updatedVehicle = vehicles.find(v => v.id === id);
      console.log('Store - Updated vehicle verification:', updatedVehicle);

    } catch (error) {
      console.error('Store - Update vehicle failed:', error);
      throw error;
    }
  },

  addMaintenanceRecord: async (record: MaintenanceRecord) => {
    try {
      await db.maintenance.add(record);
      set(state => ({
        maintenanceRecords: [...state.maintenanceRecords, record]
      }));
    } catch (error) {
      console.error('Failed to add maintenance record:', error);
    }
  },

  loadMaintenanceRecords: async () => {
    try {
      const records = await db.maintenance.toArray();
      set({ maintenanceRecords: records });
    } catch (error) {
      console.error('Failed to load maintenance records:', error);
    }
  },
})); 