import Dexie, { Table } from 'dexie';
import type { ChargingRecord, Vehicle, ChargingStation, MaintenanceRecord } from '../types';

export class MyDatabase extends Dexie {
  records!: Table<ChargingRecord>;
  stations!: Table<ChargingStation>;
  vehicles!: Table<Vehicle>;
  maintenance!: Table<MaintenanceRecord>;

  constructor() {
    super('ChargingDatabase');
    
    this.version(1).stores({
      records: 'id, date, startTime, endTime',
      stations: 'id, name',
      vehicles: 'id, name, isDefault',
      maintenance: 'id, date, type'
    }).upgrade(tx => {
      console.log('Upgrading database schema...');
    });

    this.open()
      .then(() => {
        console.log('Database is ready');
      })
      .catch(error => {
        console.error('Database error:', error);
        this.handleError(error);
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
        case 'SchemaError':
          console.error('Schema error:', error.message);
          break;
        default:
          console.error('Unknown database error:', error.name);
      }
    }
  }
}

export const db = new MyDatabase();

window.addEventListener('unload', () => {
  db.close();
}); 