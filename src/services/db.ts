import Dexie, { Table } from 'dexie';
import type { Vehicle, ChargingRecord, ChargingStation, MaintenanceRecord } from '../types';

export class MyDatabase extends Dexie {
  vehicles!: Table<Vehicle>;
  records!: Table<ChargingRecord>;
  stations!: Table<ChargingStation>;
  maintenance!: Table<MaintenanceRecord>;

  constructor() {
    super('MyDatabase');
    
    this.version(2).stores({
      vehicles: '++id',
      records: '++id, date',
      stations: '++id',
      maintenance: '++id'
    });

    this.on('ready', () => {
      console.log('Database is ready');
    });

    this.on('error', (error: Error) => {
      console.error('Database error:', error);
    });

    this.on('versionchange', () => {
      this.close();
      window.location.reload();
    });
  }
}

export const db = new MyDatabase(); 