import Dexie, { Table } from 'dexie';
import { ChargingRecord, Vehicle, ChargingStation } from '../types';

export class ChargingDatabase extends Dexie {
  records!: Table<ChargingRecord>;
  vehicles!: Table<Vehicle>;
  stations!: Table<ChargingStation>;

  constructor() {
    super('ChargingDB');
    this.version(1).stores({
      records: '++id, date, vendor, stationName',
      vehicles: '++id, name',
      stations: '++id, vendor, name'
    });
  }
}

export const db = new ChargingDatabase(); 