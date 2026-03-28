export interface User {
  user_id: string;
  email: string;
  role: 'ADMIN' | 'RESEARCHER';
  is_active: boolean;
  created_at: string;
}

export interface UserProfile {
  profile_id: string;
  user_id: string;
  full_name: string;
  institution: string;
  credential_level: string;
}

export interface AIModel {
  model_id: string;
  model_name: string;
  version: string;
  vendor: string;
  confidence_calibration: number;
}

export interface Molecule {
  molecule_id: string;
  canonical_smiles: string;
  iupac_name: string;
  molecular_weight: number;
  log_p: number;
  tpsa: number;
  lipinski_violations: number;
  pubchem_cid: string;
  ingested_at: string;
}

export interface LipinskiResult {
  molecule: Molecule;
  passes_filter: boolean;
  violations: string[];
  bioavailability_score: number;
  radar_data: { metric: string; value: number; fullMark: number }[];
}

export interface MCDAWeightProfile {
  weight_profile_id: string;
  user_id: string;
  profile_name: string;
  weight_yield: number;
  weight_safety: number;
  weight_economics: number;
  weight_green: number;
  created_at: string;
}

export interface StepMolecule {
  map_id: string;
  molecule_id: string;
  role: 'REACTANT' | 'PRODUCT' | 'CATALYST' | 'SOLVENT';
  quantity_grams: number;
  molecule?: Molecule;
}

export interface ReactionStep {
  step_id: string;
  pathway_id: string;
  step_order: number;
  temperature_celsius: number;
  pressure_bar: number;
  e_factor: number;
  projected_hardware_cost: number;
  solvent: string;
  molecules: StepMolecule[];
}

export interface Pathway {
  pathway_id: string;
  created_by_user_id: string;
  parent_pathway_id?: string;
  version: number;
  total_yield: number;
  final_optimization_score: number;
  manufacturing_scale: 'LAB' | 'PILOT' | 'INDUSTRIAL';
  is_active: boolean;
  created_at: string;
  steps?: ReactionStep[];
  weight_profile?: MCDAWeightProfile;
}

export interface RetrosynthesisLog {
  log_id: string;
  pathway_id: string;
  ai_model_id: string;
  hallucination_risk_score: number;
  risk_threshold: number;
  human_validated: boolean;
  validated_by_user_id?: string;
  validated_at?: string;
  validation_notes?: string;
  ai_model?: AIModel;
}

export interface IndicationPricing {
  pricing_id: string;
  pathway_id: string;
  molecule_id: string;
  indication: string;
  value_based_price: number;
  net_profit_estimate: number;
  manufacturing_scale: 'LAB' | 'PILOT' | 'INDUSTRIAL';
  evaluated_at: string;
  molecule?: Molecule;
}

export interface DashboardStats {
  totalPathways: number;
  moleculesAnalyzed: number;
  pendingValidations: number;
  avgOptimizationScore: number;
}

export interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}
