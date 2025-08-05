// Data service for fetching and managing creator and researcher data
import { calculateMatchScore, updateMatchScores as utilsUpdateMatchScores } from './matchingService.js';
import { loadCreators, loadResearchers, loadResearchGroups } from './dataStore.js';

export async function fetchCreators() {
  return await loadCreators();
}

export async function fetchResearchers() {
  return await loadResearchers();
}

// Search function with intelligent matching
export async function searchUsers(query, filters = {}) {
  const [creators, researchers] = await Promise.all([
    fetchCreators(),
    fetchResearchers()
  ]);
  
  let allUsers = [...creators, ...researchers];
  
  // Apply type filter
  if (filters.type && filters.type !== 'all') {
    allUsers = allUsers.filter(user => user.type === filters.type);
  }
  
  // Apply topic filter
  if (filters.topic && filters.topic !== 'all') {
    allUsers = allUsers.filter(user => 
      user.topics.some(topic => 
        topic.toLowerCase().includes(filters.topic.toLowerCase())
      )
    );
  }
  
  // Apply search query filter
  if (query) {
    const queryLower = query.toLowerCase();
    allUsers = allUsers.filter(user => 
      user.name.toLowerCase().includes(queryLower) ||
      user.bio.toLowerCase().includes(queryLower) ||
      (user.specialization && user.specialization.toLowerCase().includes(queryLower)) ||
      (user.expertise && user.expertise.toLowerCase().includes(queryLower)) ||
      user.topics.some(topic => topic.toLowerCase().includes(queryLower))
    );
  }
  
  // Calculate match scores based on a sample user profile or search context
  allUsers = allUsers.map(user => {
    // For demonstration, create a sample searching user profile
    // In a real app, this would come from the logged-in user's profile
    const searchingUser = createSampleUserProfile(query, filters);
    
    const matchScore = calculateMatchScore(user, searchingUser, query);
    return { ...user, matchScore };
  });
  
  // Sort by match score
  allUsers.sort((a, b) => b.matchScore - a.matchScore);
  
  return allUsers;
}

// Helper function to create a sample user profile for matching
function createSampleUserProfile(query, filters) {
  const topics = [];
  
  // Extract topics from query
  if (query) {
    const queryWords = query.toLowerCase().split(' ');
    queryWords.forEach(word => {
      if (word.includes('climate')) topics.push('Climate Science');
      if (word.includes('physics')) topics.push('Physics');
      if (word.includes('biology')) topics.push('Biology');
      if (word.includes('chemistry')) topics.push('Chemistry');
      if (word.includes('ai') || word.includes('artificial')) topics.push('Artificial Intelligence');
      if (word.includes('neuro')) topics.push('Neuroscience');
      if (word.includes('space')) topics.push('Space Science');
      if (word.includes('engineering')) topics.push('Engineering');
    });
  }
  
  // Add topic from filter
  if (filters.topic && filters.topic !== 'all') {
    topics.push(filters.topic);
  }
  
  // Default topics if none found
  if (topics.length === 0) {
    topics.push('Science', 'Education');
  }
  
  return {
    id: 'searching-user',
    name: 'Current User',
    type: filters.type === 'researchers' ? 'creator' : 'researcher', // Opposite type for cross-matching
    topics: [...new Set(topics)], // Remove duplicates
    availability: 'Open to collaborations',
    collaboration_notes: 'Looking for collaboration opportunities',
    bio: `Searching for: ${query || 'collaboration opportunities'}`
  };
}

// Function to recalculate match scores for users based on current user profile
export function updateMatchScores(users, currentUserProfile = null) {
  return utilsUpdateMatchScores(users, currentUserProfile);
}

// Research Groups Functions using global data store
export async function getResearchGroupsFlat() {
  return await loadResearchGroups();
}

// Search research groups by various criteria
export async function searchResearchGroups(query = '', filters = {}) {
  const flatGroups = await getResearchGroupsFlat();
  
  let filteredGroups = flatGroups;
  
  // Apply search query
  if (query) {
    const queryLower = query.toLowerCase();
    filteredGroups = filteredGroups.filter(group => 
      group.university.toLowerCase().includes(queryLower) ||
      group.department.toLowerCase().includes(queryLower) ||
      group.lab.toLowerCase().includes(queryLower) ||
      group.labFocus.toLowerCase().includes(queryLower) ||
      group.members.some(member => 
        member.name.toLowerCase().includes(queryLower) ||
        member.role.toLowerCase().includes(queryLower)
      )
    );
  }
  
  // Apply university filter
  if (filters.university && filters.university !== 'all') {
    filteredGroups = filteredGroups.filter(group => 
      group.university === filters.university
    );
  }
  
  // Apply focus area filter
  if (filters.focusArea && filters.focusArea !== 'all') {
    filteredGroups = filteredGroups.filter(group => 
      group.labFocus.toLowerCase().includes(filters.focusArea.toLowerCase())
    );
  }
  
  return filteredGroups;
}

// Get metadata from global data store
import { universities as universitiesStore, focusAreas as focusAreasStore } from './dataStore.js';

let universitiesValue, focusAreasValue;

// Subscribe to store updates
universitiesStore.subscribe(value => universitiesValue = value);
focusAreasStore.subscribe(value => focusAreasValue = value);

export async function getUniversityList() {
  // Ensure data is loaded
  await loadResearchGroups();
  return universitiesValue || [];
}

export async function getFocusAreas() {
  // Ensure data is loaded
  await loadResearchGroups();
  return focusAreasValue || [];
}