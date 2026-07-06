import { UGCCreator, DMMessage } from './types';
import Papa from 'papaparse';

export function exportToJSON(data: UGCCreator[] | DMMessage[], filename: string): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportToCSV(data: UGCCreator[] | DMMessage[], filename: string): void {
  const csv = Papa.unparse(data as unknown as Record<string, unknown>[]);
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
