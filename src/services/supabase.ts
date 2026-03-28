import { createClient } from '@supabase/supabase-js';
import type {
  Pathway,
  Molecule,
  RetrosynthesisLog,
  IndicationPricing,
  MCDAWeightProfile,
  DashboardStats,
} from '@/types';

const supabaseUrl = "https://rpwcnjbihzmwpiekxsbl.supabase.co";
const supabaseAnonKey = "sb_publishable_87Vo6o-yR5lAw_IPklNf4Q_hVD-4Vod";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getPathways(): Promise<Pathway[]> {
  const { data, error } = await supabase
    .from('pathway')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as Pathway[]) || [];
}

export async function getPathway(id: string): Promise<Pathway> {
  const { data, error } = await supabase
    .from('pathway')
    .select('*, reaction_step(*, step_molecule_map(*))')
    .eq('pathway_id', id)
    .single();
  if (error) throw error;
  return data as Pathway;
}

export async function getMolecules(): Promise<Molecule[]> {
  const { data, error } = await supabase
    .from('molecule')
    .select('*')
    .order('ingested_at', { ascending: false })
    .limit(20);
  if (error) throw error;
  return (data as Molecule[]) || [];
}

export async function getRetrosynthesisLogs(): Promise<RetrosynthesisLog[]> {
  const { data, error } = await supabase
    .from('retrosynthesis_log')
    .select('*, ai_model(*)')
    .order('log_id', { ascending: false });
  if (error) throw error;
  return (data as RetrosynthesisLog[]) || [];
}

export async function getPricing(): Promise<IndicationPricing[]> {
  const { data, error } = await supabase
    .from('indication_pricing')
    .select('*, molecule(*)')
    .order('evaluated_at', { ascending: false });
  if (error) throw error;
  return (data as IndicationPricing[]) || [];
}

export async function getWeightProfiles(userId: string): Promise<MCDAWeightProfile[]> {
  const { data, error } = await supabase
    .from('mcda_weight_profile')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;
  return (data as MCDAWeightProfile[]) || [];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [pathwayRes, moleculeRes, pendingRes, avgRes] = await Promise.all([
    supabase.from('pathway').select('*', { count: 'exact', head: true }),
    supabase.from('molecule').select('*', { count: 'exact', head: true }),
    supabase.from('retrosynthesis_log').select('*', { count: 'exact', head: true }).eq('human_validated', false),
    supabase.from('pathway').select('final_optimization_score'),
  ]);

  const scores = avgRes.data || [];
  const avgScore = scores.length > 0
    ? scores.reduce((sum: number, p: { final_optimization_score: number }) => sum + p.final_optimization_score, 0) / scores.length
    : 0;

  return {
    totalPathways: pathwayRes.count || 0,
    moleculesAnalyzed: moleculeRes.count || 0,
    pendingValidations: pendingRes.count || 0,
    avgOptimizationScore: Math.round(avgScore * 10) / 10,
  };
}
