// Global data store for caching creators, researchers, and research groups
// Eliminates redundant API calls across components

import { writable, derived, get } from 'svelte/store';

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
    // Import data from JavaScript module instead of fetching JSON to avoid CORS issues
    const { creatorsData: rawData } = await import('../data/creators.js');
    const data = rawData;
    
    // Transform the data to match our app's expected format
    const transformedData = data.map((creator, index) => ({
      id: `creator-${index + 1}`,
      name: creator.name,
      type: 'creator',
      specialization: creator.specialization,
      platforms: creator.platforms,
      audience_size: creator.audience_size,
      bio: `${creator.specialization}. ${creator.example_content}`,
      topics: extractTopicsFromSpecialization(creator.specialization),
      collaboration_notes: creator.collaboration_notes,
      matchScore: 85 // Base score, will be recalculated during search
    }));

    creatorsData.set(transformedData);
    updateAvailableTopics();
    return transformedData;
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
    // Import data from JavaScript module instead of fetching JSON to avoid CORS issues
    const { researchersData: rawData } = await import('../data/researchers.js');
    const data = rawData;
    
    // Transform the data to match our app's expected format
    const transformedData = data.map((researcher, index) => ({
      id: `researcher-${index + 1}`,
      name: researcher.name,
      type: 'researcher',
      institution: researcher.institution,
      field: researcher.field,
      expertise: researcher.expertise,
      bio: researcher.bio,
      topics: researcher.research_interests,
      availability: researcher.availability,
      publications: researcher.publications,
      h_index: researcher.h_index,
      recent_work: researcher.recent_work,
      collaboration_notes: researcher.collaboration_notes,
      matchScore: 90 // Base score, will be recalculated during search
    }));

    researchersData.set(transformedData);
    updateAvailableFields();
    return transformedData;
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
    // Import data from JavaScript module instead of fetching JSON to avoid CORS issues
    const { researchGroupsData: rawData } = await import('../data/researchGroups.js');
    const hierarchicalData = rawData;
    
    // Flatten the hierarchical data
    const flatGroups = [];
    hierarchicalData.universities.forEach(university => {
      university.departments.forEach(department => {
        department.labs.forEach(lab => {
          flatGroups.push({
            university: university.name,
            universityLocation: university.location,
            department: department.name,
            lab: lab.name,
            labHead: lab.head,
            labFocus: lab.focus,
            members: lab.members,
            fullPath: `${university.name} > ${department.name} > ${lab.name}`
          });
        });
      });
    });

    researchGroupsData.set(flatGroups);
    updateUniversitiesAndFocusAreas(hierarchicalData);
    return flatGroups;
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

function updateUniversitiesAndFocusAreas(hierarchicalData) {
  // Extract universities
  const unis = hierarchicalData.universities.map(university => ({
    name: university.name,
    location: university.location
  }));
  universities.set(unis);

  // Extract focus areas
  const focusAreasSet = new Set();
  const currentGroups = get(researchGroupsData);
  
  currentGroups.forEach(group => {
    const focus = group.labFocus.toLowerCase();
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

// Utility function is now imported from svelte/store

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