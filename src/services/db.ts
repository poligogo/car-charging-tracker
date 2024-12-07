import Dexie, { Table } from 'dexie';
import type { Vehicle, ChargingRecord, ChargingStation, MaintenanceRecord } from '../types';

export class MyDatabase extends Dexie {
  vehicles!: Table<Vehicle>;
  records!: Table<ChargingRecord>;
  stations!: Table<ChargingStation>;
  maintenance!: Table<MaintenanceRecord>;

  constructor() {
    super('MyDatabase');
    
    this.version(1).stores({
      vehicles: '++id',
      records: '++id',
      stations: '++id',
      maintenance: '++id'
    });
  }
}

export const db = new MyDatabase(); 