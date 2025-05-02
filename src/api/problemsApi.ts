import { supabase } from '@shared/config/supabase';
// import { Problem, Difficulty } from '@/problems/problemTypes'; // Remove Difficulty
import { Problem } from '@/problems/problemTypes'; // Keep Problem

export const fetchProblems = async (): Promise<Problem[]> => {
  const { data, error } = await supabase
    .from('problems')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const fetchProblemById = async (id: string): Promise<Problem> => {
  const { data, error } = await supabase
    .from('problems')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

// Remove the entire fetchProblemsByDifficulty function
/*
export const fetchProblemsByDifficulty = async (difficulty: Difficulty): Promise<Problem[]> => {
  const { data, error } = await supabase
    .from('problems')
    .select('*')
    .eq('difficulty', difficulty)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};
*/

export const createProblem = async (problem: Omit<Problem, 'id'>): Promise<Problem> => {
  const { data, error } = await supabase
    .from('problems')
    .insert([problem])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateProblem = async (id: string, updates: Partial<Problem>): Promise<Problem> => {
  const { data, error } = await supabase
    .from('problems')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteProblem = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('problems')
    .delete()
    .eq('id', id);

  if (error) throw error;
}; 