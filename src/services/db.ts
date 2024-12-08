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

    this.on('error', (err) => {
      console.error('Database error:', err);
    });
  }
}

const db = new MyDatabase();

db.on('ready', () => {
  if (!db.records.schema.indexes.some(idx => idx.name === 'date')) {
    db.close();
    const dbName = 'MyDatabase';
    const req = indexedDB.deleteDatabase(dbName);
    
    req.onsuccess = () => {
      console.log('Database successfully deleted');
      window.location.reload();
    };
    
    req.onerror = () => {
      console.error('Could not delete database');
    };
  }
});

export { db }; 