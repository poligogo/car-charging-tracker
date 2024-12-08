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
  }
}

const db = new MyDatabase();

db.on('ready', () => {
  console.log('Database is ready');
}).on('error', (err) => {
  console.error('Database error:', err);
});

db.on('versionchange', () => {
  db.close();
  window.location.reload();
});

export { db }; 