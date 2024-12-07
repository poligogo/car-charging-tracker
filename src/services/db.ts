import Dexie, { Table } from 'dexie';
import type { ChargingRecord, ChargingStation, Vehicle, MaintenanceRecord } from '../types';

export class ChargingDatabase extends Dexie {
  records!: Table<ChargingRecord>;
  stations!: Table<ChargingStation>;
  vehicles!: Table<Vehicle>;
  maintenance!: Table<MaintenanceRecord>;

  constructor() {
    super('ChargingDatabase');
    this.version(1).stores({
      records: '++id',
      stations: '++id',
      vehicles: '++id',
      maintenance: '++id'
    });
  }
}

export const db = new ChargingDatabase(); 