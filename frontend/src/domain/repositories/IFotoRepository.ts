import { Foto } from '../entities/Foto';

export interface IFotoRepository {
  save(foto: Omit<Foto, 'id' | 'sync_status' | 'created_at'>): Promise<number>;
}
