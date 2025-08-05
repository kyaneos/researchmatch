// Database service using Supabase
import { createClient } from '@supabase/supabase-js';

// Environment variables for Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let supabase = null;

// Initialize Supabase client if credentials are provided
if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

// Database tables schema:
// - creators: id, name, specialization, platforms, audience_size, bio, topics, collaboration_notes, created_at
// - researchers: id, name, institution, field, expertise, bio, topics, availability, publications, h_index, recent_work, collaboration_notes, created_at
// - research_groups: id, university, university_location, department, lab, lab_head, lab_focus, members, created_at

export async function fetchCreatorsFromDB() {
  if (!supabase) {
    console.warn('Database not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('creators')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform database data to match app expectations
    return data.map((creator, index) => ({
      id: creator.id || `creator-${index + 1}`,
      name: creator.name,
      type: 'creator',
      specialization: creator.specialization,
      platforms: creator.platforms || [],
      audience_size: creator.audience_size,
      bio: creator.bio,
      topics: creator.topics || [],
      collaboration_notes: creator.collaboration_notes,
      matchScore: 85 // Base score, will be recalculated during search
    }));
  } catch (error) {
    console.error('Error fetching creators from database:', error);
    return [];
  }
}

export async function fetchResearchersFromDB() {
  if (!supabase) {
    console.warn('Database not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('researchers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform database data to match app expectations
    return data.map((researcher, index) => ({
      id: researcher.id || `researcher-${index + 1}`,
      name: researcher.name,
      type: 'researcher',
      institution: researcher.institution,
      field: researcher.field,
      expertise: researcher.expertise,
      bio: researcher.bio,
      topics: researcher.topics || [],
      availability: researcher.availability,
      publications: researcher.publications,
      h_index: researcher.h_index,
      recent_work: researcher.recent_work,
      collaboration_notes: researcher.collaboration_notes,
      matchScore: 90 // Base score, will be recalculated during search
    }));
  } catch (error) {
    console.error('Error fetching researchers from database:', error);
    return [];
  }
}

export async function fetchResearchGroupsFromDB() {
  if (!supabase) {
    console.warn('Database not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('research_groups')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform database data to match app expectations
    return data.map(group => ({
      university: group.university,
      universityLocation: group.university_location,
      department: group.department,
      lab: group.lab,
      labHead: group.lab_head,
      labFocus: group.lab_focus,
      members: group.members || [],
      fullPath: `${group.university} > ${group.department} > ${group.lab}`
    }));
  } catch (error) {
    console.error('Error fetching research groups from database:', error);
    return [];
  }
}

// CRUD operations for creators
export async function createCreator(creatorData) {
  if (!supabase) throw new Error('Database not configured');

  const { data, error } = await supabase
    .from('creators')
    .insert([creatorData])
    .select();

  if (error) throw error;
  return data[0];
}

export async function updateCreator(id, updates) {
  if (!supabase) throw new Error('Database not configured');

  const { data, error } = await supabase
    .from('creators')
    .update(updates)
    .eq('id', id)
    .select();

  if (error) throw error;
  return data[0];
}

export async function deleteCreator(id) {
  if (!supabase) throw new Error('Database not configured');

  const { error } = await supabase
    .from('creators')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// CRUD operations for researchers
export async function createResearcher(researcherData) {
  if (!supabase) throw new Error('Database not configured');

  const { data, error } = await supabase
    .from('researchers')
    .insert([researcherData])
    .select();

  if (error) throw error;
  return data[0];
}

export async function updateResearcher(id, updates) {
  if (!supabase) throw new Error('Database not configured');

  const { data, error } = await supabase
    .from('researchers')
    .update(updates)
    .eq('id', id)
    .select();

  if (error) throw error;
  return data[0];
}

export async function deleteResearcher(id) {
  if (!supabase) throw new Error('Database not configured');

  const { error } = await supabase
    .from('researchers')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// CRUD operations for research groups
export async function createResearchGroup(groupData) {
  if (!supabase) throw new Error('Database not configured');

  const { data, error } = await supabase
    .from('research_groups')
    .insert([groupData])
    .select();

  if (error) throw error;
  return data[0];
}

export async function updateResearchGroup(id, updates) {
  if (!supabase) throw new Error('Database not configured');

  const { data, error } = await supabase
    .from('research_groups')
    .update(updates)
    .eq('id', id)
    .select();

  if (error) throw error;
  return data[0];
}

export async function deleteResearchGroup(id) {
  if (!supabase) throw new Error('Database not configured');

  const { error } = await supabase
    .from('research_groups')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Check if database is configured
export function isDatabaseConfigured() {
  return !!(supabaseUrl && supabaseAnonKey && supabase);
}

// Get database status for admin/debug purposes
export function getDatabaseStatus() {
  return {
    configured: isDatabaseConfigured(),
    url: supabaseUrl ? 'Set' : 'Not set',
    key: supabaseAnonKey ? 'Set' : 'Not set'
  };
}