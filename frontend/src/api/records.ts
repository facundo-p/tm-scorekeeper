import { api } from './client'
import type { GlobalRecordDTO } from '@/types'

export function getGlobalRecords(): Promise<GlobalRecordDTO[]> {
  return api.get<GlobalRecordDTO[]>('/records/')
}
