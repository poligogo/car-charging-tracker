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

    this.open()
      .then(() => {
        console.log('Database is ready');
      })
      .catch(err => {
        console.error('Failed to open database:', err);
      });
  }

  handleError(error: Error): void {
    console.error('Database operation failed:', error);
    if (error instanceof Dexie.DexieError) {
      switch (error.name) {
        case 'NotFoundError':
          console.error('Data not found');
          break;
        case 'ConstraintError':
          console.error('Data constraint violation');
          break;
        case 'QuotaExceededError':
          console.error('Storage quota exceeded');
          break;
        default:
          console.error('Unknown database error');
      }
    }
  }
}

export const db = new MyDatabase();

db.on('versionchange', () => {
  db.close();
  window.location.reload();
}); 