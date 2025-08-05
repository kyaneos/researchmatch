// Global data store for caching creators, researchers, and research groups
// Uses database integration instead of JSON files for alpha version

import { writable, derived } from 'svelte/store';
import { fetchCreatorsFromDB, fetchResearchersFromDB, fetchResearchGroupsFromDB, isDatabaseConfigured } from './database.js';

// Raw data stores
export const creatorsData = writable([]);
export const researchersData = writable([]);
export const researchGroupsData = writable([]);

// Loading states
export const loadingStates = writable({
  creators: false,
  researchers: false,
  researchGroups: false
});

// Error states
export const errorStates = writable({
  creators: null,
  researchers: null,
  researchGroups: null
});

// Metadata stores
export const availableTopics = writable([]);
export const availableFields = writable([]);
export const universities = writable([]);
export const focusAreas = writable([]);

// Derived stores for filtered and processed data
export const allUsers = derived(
  [creatorsData, researchersData],
  ([$creators, $researchers]) => [...$creators, ...$researchers]
);

export const totalUsersCount = derived(
  allUsers,
  ($allUsers) => $allUsers.length
);

// Data fetching functions
export async function loadCreators() {
  const currentData = get(creatorsData);
  if (currentData.length > 0) {
    return currentData; // Return cached data
  }

  loadingStates.update(state => ({ ...state, creators: true }));
  errorStates.update(state => ({ ...state, creators: null }));

  try {
    if (!isDatabaseConfigured()) {
      console.warn('Database not configured. No creators data available.');
      return [];
    }

    const data = await fetchCreatorsFromDB();
    
    creatorsData.set(data);
    updateAvailableTopics();
    return data;
  } catch (error) {
    console.error('Error fetching creators:', error);
    errorStates.update(state => ({ ...state, creators: error.message }));
    return [];
  } finally {
    loadingStates.update(state => ({ ...state, creators: false }));
  }
}

export async function loadResearchers() {
  const currentData = get(researchersData);
  if (currentData.length > 0) {
    return currentData; // Return cached data
  }

  loadingStates.update(state => ({ ...state, researchers: true }));
  errorStates.update(state => ({ ...state, researchers: null }));

  try {
    if (!isDatabaseConfigured()) {
      console.warn('Database not configured. No researchers data available.');
      return [];
    }

    const data = await fetchResearchersFromDB();
    
    researchersData.set(data);
    updateAvailableFields();
    return data;
  } catch (error) {
    console.error('Error fetching researchers:', error);
    errorStates.update(state => ({ ...state, researchers: error.message }));
    return [];
  } finally {
    loadingStates.update(state => ({ ...state, researchers: false }));
  }
}

export async function loadResearchGroups() {
  const currentData = get(researchGroupsData);
  if (currentData.length > 0) {
    return currentData; // Return cached data
  }

  loadingStates.update(state => ({ ...state, researchGroups: true }));
  errorStates.update(state => ({ ...state, researchGroups: null }));

  try {
    if (!isDatabaseConfigured()) {
      console.warn('Database not configured. No research groups data available.');
      return [];
    }

    const data = await fetchResearchGroupsFromDB();
    
    researchGroupsData.set(data);
    updateUniversitiesAndFocusAreasFromFlat(data);
    return data;
  } catch (error) {
    console.error('Error fetching research groups:', error);
    errorStates.update(state => ({ ...state, researchGroups: error.message }));
    return [];
  } finally {
    loadingStates.update(state => ({ ...state, researchGroups: false }));
  }
}

// Helper functions for topic extraction and metadata updates
function extractTopicsFromSpecialization(specialization) {
  const topicsMap = {
    'physics': ['Physics'],
    'engineering': ['Engineering'],
    'technology': ['Technology'],
    'science': ['Science'],
    'space': ['Space'],
    'astronomy': ['Astronomy'],
    'biology': ['Biology'],
    'chemistry': ['Chemistry'],
    'medicine': ['Medicine'],
    'computer': ['Computer Science'],
    'math': ['Mathematics'],
    'education': ['Education'],
    'climate': ['Climate Science'],
    'neuroscience': ['Neuroscience']
  };
  
  const topics = [];
  const specLower = specialization.toLowerCase();
  
  for (const [keyword, topic] of Object.entries(topicsMap)) {
    if (specLower.includes(keyword)) {
      topics.push(topic[0]);
    }
  }
  
  // Default topics if none found
  if (topics.length === 0) {
    topics.push('STEM', 'Education');
  }
  
  return topics;
}

function updateAvailableTopics() {
  const currentCreators = get(creatorsData);
  const topics = [...new Set(currentCreators.flatMap(c => c.topics))].sort();
  availableTopics.set(topics);
}

function updateAvailableFields() {
  const currentResearchers = get(researchersData);
  const fields = [...new Set(currentResearchers.map(r => r.field))].sort();
  availableFields.set(fields);
}

function updateUniversitiesAndFocusAreasFromFlat(flatGroups) {
  // Extract universities from flat data
  const universitiesSet = new Set();
  flatGroups.forEach(group => {
    if (group.university && group.universityLocation) {
      universitiesSet.add(JSON.stringify({ name: group.university, location: group.universityLocation }));
    }
  });
  const unis = Array.from(universitiesSet).map(str => JSON.parse(str));
  universities.set(unis);

  // Extract focus areas
  const focusAreasSet = new Set();
  
  flatGroups.forEach(group => {
    const focus = (group.labFocus || '').toLowerCase();
    if (focus.includes('ai') || focus.includes('artificial intelligence')) focusAreasSet.add('Artificial Intelligence');
    if (focus.includes('climate') || focus.includes('environment')) focusAreasSet.add('Climate Science');
    if (focus.includes('collective intelligence')) focusAreasSet.add('Collective Intelligence');
    if (focus.includes('crowdsourcing')) focusAreasSet.add('Crowdsourcing');
    if (focus.includes('robot') || focus.includes('autonomous')) focusAreasSet.add('Robotics');
    if (focus.includes('neuro') || focus.includes('brain')) focusAreasSet.add('Neuroscience');
    if (focus.includes('energy') || focus.includes('renewable')) focusAreasSet.add('Energy');
    if (focus.includes('space') || focus.includes('planetary')) focusAreasSet.add('Space Science');
    if (focus.includes('bio') || focus.includes('medical')) focusAreasSet.add('Biology/Medicine');
    if (focus.includes('chemistry') || focus.includes('materials')) focusAreasSet.add('Chemistry');
    if (focus.includes('physics') || focus.includes('quantum')) focusAreasSet.add('Physics');
    if (focus.includes('computer') || focus.includes('computing')) focusAreasSet.add('Computer Science');
  });
  
  focusAreas.set(Array.from(focusAreasSet).sort());
}

// Utility to get current value from store (for use in regular functions)
function get(store) {
  let value;
  store.subscribe(v => value = v)();
  return value;
}

// Load all data function for initialization
export async function loadAllData() {
  const promises = [
    loadCreators(),
    loadResearchers(),
    loadResearchGroups()
  ];
  
  try {
    const results = await Promise.allSettled(promises);
    const [creatorsResult, researchersResult, groupsResult] = results;
    
    return {
      creators: creatorsResult.status === 'fulfilled' ? creatorsResult.value : [],
      researchers: researchersResult.status === 'fulfilled' ? researchersResult.value : [],
      researchGroups: groupsResult.status === 'fulfilled' ? groupsResult.value : [],
      errors: {
        creators: creatorsResult.status === 'rejected' ? creatorsResult.reason : null,
        researchers: researchersResult.status === 'rejected' ? researchersResult.reason : null,
        researchGroups: groupsResult.status === 'rejected' ? groupsResult.reason : null
      }
    };
  } catch (error) {
    console.error('Error loading data:', error);
    throw error;
  }
}

// Cache invalidation functions
export function invalidateCreatorsCache() {
  creatorsData.set([]);
}

export function invalidateResearchersCache() {
  researchersData.set([]);
}

export function invalidateResearchGroupsCache() {
  researchGroupsData.set([]);
}

export function invalidateAllCaches() {
  creatorsData.set([]);
  researchersData.set([]);
  researchGroupsData.set([]);
}

// Search and filter functionality using cached data
export function searchInCachedCreators(query, filters = {}) {
  const creators = get(creatorsData);
  return creators.filter(creator => {
    if (query) {
      const queryLower = query.toLowerCase();
      const matches = creator.name.toLowerCase().includes(queryLower) ||
                     creator.bio.toLowerCase().includes(queryLower) ||
                     creator.specialization.toLowerCase().includes(queryLower) ||
                     creator.topics.some(topic => topic.toLowerCase().includes(queryLower));
      if (!matches) return false;
    }
    
    if (filters.topic && filters.topic !== 'all') {
      const hasMatch = creator.topics.some(topic => 
        topic.toLowerCase().includes(filters.topic.toLowerCase())
      );
      if (!hasMatch) return false;
    }
    
    return true;
  });
}

export function searchInCachedResearchers(query, filters = {}) {
  const researchers = get(researchersData);
  return researchers.filter(researcher => {
    if (query) {
      const queryLower = query.toLowerCase();
      const matches = researcher.name.toLowerCase().includes(queryLower) ||
                     researcher.bio.toLowerCase().includes(queryLower) ||
                     researcher.expertise.toLowerCase().includes(queryLower) ||
                     researcher.topics.some(topic => topic.toLowerCase().includes(queryLower));
      if (!matches) return false;
    }
    
    if (filters.field && filters.field !== 'all') {
      if (!researcher.field.toLowerCase().includes(filters.field.toLowerCase())) {
        return false;
      }
    }
    
    return true;
  });
}