import axios from 'axios';
import { getIdToken } from './firebase';
import type { LipinskiResult, Molecule, User, UserProfile } from '@/types';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  try {
    const token = await getIdToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // proceed without auth header
  }
  return config;
});

export async function analyzeMolecule(smiles: string): Promise<LipinskiResult> {
  const { data } = await api.post<LipinskiResult>('/molecules/analyze', { smiles });
  return data;
}

export async function searchMolecule(query: string): Promise<Molecule[]> {
  const { data } = await api.get<Molecule[]>('/molecules/search', { params: { q: query } });
  return data;
}

export async function createPathway(payload: Record<string, unknown>): Promise<{ pathway_id: string }> {
  const { data } = await api.post<{ pathway_id: string }>('/pathways', payload);
  return data;
}

export async function updateManufacturingScale(id: string, scale: string): Promise<void> {
  await api.patch(`/pathways/${id}/scale`, { manufacturing_scale: scale });
}

export async function validateLog(logId: string, notes: string): Promise<void> {
  await api.patch(`/retrosynthesis/${logId}/validate`, { validation_notes: notes });
}

export async function createPricing(payload: Record<string, unknown>): Promise<void> {
  await api.post('/pricing', payload);
}

export async function createWeightProfile(payload: Record<string, unknown>): Promise<void> {
  await api.post('/mcda/profiles', payload);
}

export async function syncUser(
  firebaseUid: string,
  email: string,
  role: string,
  fullName: string,
  institution: string
): Promise<{ user: User; profile: UserProfile }> {
  const { data } = await api.post<{ user: User; profile: UserProfile }>('/users/sync', {
    firebase_uid: firebaseUid,
    email,
    role,
    full_name: fullName,
    institution,
  });
  return data;
}
