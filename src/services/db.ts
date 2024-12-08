import Dexie, { Table, DexieError } from 'dexie';
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

    this.on('error', (e: DexieError) => {
      console.error('Database error:', e);
    });

    this.on('versionchange', () => {
      this.close();
      window.location.reload();
    });
  }

  handleError(error: Error): void {
    console.error('Database operation failed:', error);
    if (error instanceof DexieError) {
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

db.open().catch((err: Error) => {
  console.error('Failed to open database:', err);
}); 