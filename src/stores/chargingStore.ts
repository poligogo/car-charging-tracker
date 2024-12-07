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

  addRecord: async (record) => {
    const id = await db.records.add(record as ChargingRecord);
    const newRecord = { ...record, id: id.toString() };
    set(state => ({
      records: [...state.records, newRecord]
    }));
    await get().calculateMonthlyStats(new Date().toISOString().slice(0, 7));
  },

  updateRecord: async (id, record) => {
    await db.records.update(id, record);
    set(state => ({
      records: state.records.map(r => 
        r.id === id ? { ...r, ...record } : r
      )
    }));
  },

  deleteRecord: async (id) => {
    await db.records.delete(id);
    set(state => ({
      records: state.records.filter(r => r.id !== id)
    }));
  },

  loadRecords: async () => {
    const records = await db.records.toArray();
    set({ records });
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
      
      // 檢查是否已存在相同名稱的�輛
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

  calculateMonthlyStats: async (month) => {
    const records = await db.records
      .where('date')
      .startsWith(month)
      .toArray();

    const stats: MonthlyStats = {
      totalCost: records.reduce((sum, r) => sum + r.chargingFee + r.parkingFee, 0),
      totalPower: records.reduce((sum, r) => sum + r.power, 0),
      chargingCount: records.length,
      averagePrice: 0
    };

    stats.averagePrice = stats.totalPower ? stats.totalCost / stats.totalPower : 0;

    set({ monthlyStats: stats });
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

  updateVehicle: async (id, vehicle) => {
    await db.vehicles.update(id, vehicle);
    const vehicles = await db.vehicles.toArray();
    const currentVehicle = vehicles.find(v => v.isDefault) || null;
    set({ vehicles, currentVehicle });
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