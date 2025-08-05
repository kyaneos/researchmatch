// Unified matching service for creator-researcher compatibility scoring
// Consolidates match score calculations from dataService.js and Discover.svelte

/**
 * Calculate compatibility score between two users
 * @param {Object} user1 - First user object
 * @param {Object} user2 - Second user object  
 * @param {string} searchQuery - Optional search query for relevance scoring
 * @returns {number} Match score (0-100)
 */
export function calculateMatchScore(user1, user2, searchQuery = '') {
  let score = 0;
  const maxScore = 100;
  
  // Topic similarity (40% of total score)
  const topicScore = calculateTopicSimilarity(user1.topics || [], user2.topics || []);
  score += topicScore * 0.4;
  
  // Search query relevance (30% of total score)
  if (searchQuery) {
    const queryScore = calculateQueryRelevance(user1, searchQuery) + calculateQueryRelevance(user2, searchQuery);
    score += Math.min(queryScore / 2, 30);
  } else {
    score += 30; // No penalty if no search query
  }
  
  // Collaboration compatibility (20% of total score)
  const collaborationScore = calculateCollaborationCompatibility(user1, user2);
  score += collaborationScore * 0.2;
  
  // Platform/field alignment (10% of total score)
  const alignmentScore = calculatePlatformFieldAlignment(user1, user2);
  score += alignmentScore * 0.1;
  
  return Math.min(Math.round(score), maxScore);
}

/**
 * Calculate topic similarity between two sets of topics
 * @param {string[]} topics1 - First set of topics
 * @param {string[]} topics2 - Second set of topics
 * @returns {number} Similarity score (0-100)
 */
export function calculateTopicSimilarity(topics1, topics2) {
  if (!topics1.length || !topics2.length) return 0;
  
  const intersection = topics1.filter(topic => 
    topics2.some(t => t.toLowerCase().includes(topic.toLowerCase()) || 
                     topic.toLowerCase().includes(t.toLowerCase()))
  );
  
  const similarity = (intersection.length / Math.min(topics1.length, topics2.length)) * 100;
  return Math.min(similarity, 100);
}

/**
 * Calculate relevance of a user to a search query
 * @param {Object} user - User object
 * @param {string} query - Search query
 * @returns {number} Relevance score (0-100)
 */
export function calculateQueryRelevance(user, query) {
  if (!query) return 0;
  
  const searchableText = [
    user.name,
    user.bio,
    user.specialization || user.expertise || '',
    ...(user.topics || [])
  ].join(' ').toLowerCase();
  
  const queryWords = query.toLowerCase().split(' ').filter(word => word.length > 2);
  const matches = queryWords.filter(word => searchableText.includes(word));
  
  return (matches.length / queryWords.length) * 100;
}

/**
 * Calculate collaboration compatibility between two users
 * @param {Object} user1 - First user
 * @param {Object} user2 - Second user
 * @returns {number} Compatibility score (0-100)
 */
export function calculateCollaborationCompatibility(user1, user2) {
  let score = 50; // Base compatibility
  
  // Check availability alignment
  if (user1.availability && user2.availability) {
    const user1Open = user1.availability.toLowerCase().includes('open');
    const user2Open = user2.availability.toLowerCase().includes('open');
    
    if (user1Open && user2Open) score += 30;
    else if (user1Open || user2Open) score += 15;
  }
  
  // Check collaboration experience
  if (user1.collaboration_notes && user2.collaboration_notes) {
    const user1Experienced = user1.collaboration_notes.toLowerCase().includes('experience');
    const user2Experienced = user2.collaboration_notes.toLowerCase().includes('experience');
    
    if (user1Experienced && user2Experienced) score += 20;
    else if (user1Experienced || user2Experienced) score += 10;
  }
  
  return Math.min(score, 100);
}

/**
 * Calculate platform and field alignment between users
 * @param {Object} user1 - First user
 * @param {Object} user2 - Second user
 * @returns {number} Alignment score (0-100)
 */
export function calculatePlatformFieldAlignment(user1, user2) {
  let score = 50; // Base alignment
  
  // If one is creator and one is researcher, check field alignment
  if ((user1.type === 'creator' && user2.type === 'researcher') ||
      (user1.type === 'researcher' && user2.type === 'creator')) {
    
    const creator = user1.type === 'creator' ? user1 : user2;
    const researcher = user1.type === 'researcher' ? user1 : user2;
    
    // Check if creator's content type aligns with researcher's field
    const creatorSpecs = (creator.specialization || '').toLowerCase();
    const researcherField = (researcher.field || '').toLowerCase();
    
    if (creatorSpecs.includes(researcherField) || researcherField.includes(creatorSpecs)) {
      score += 30;
    }
    
    // Bonus for video-friendly researchers and video creators
    if (creator.platforms && creator.platforms.includes('YouTube')) {
      if (researcher.collaboration_notes && 
          researcher.collaboration_notes.toLowerCase().includes('video')) {
        score += 20;
      }
    }
  }
  
  return Math.min(score, 100);
}

/**
 * Advanced magic matching algorithm with platform and content preferences
 * @param {Object} userProfile - Current user profile
 * @param {Object[]} compatiblePeople - Array of potential matches
 * @returns {Object[]} Scored and filtered matches with reasons
 */
export function generateMagicMatches(userProfile, compatiblePeople) {
  const scoredMatches = compatiblePeople.map(person => {
    let matchScore = 0;
    let reasons = [];
    
    // Topic overlap (40% weight)
    if (person.topics && userProfile.topics) {
      const topicOverlap = person.topics.filter(topic => 
        userProfile.topics.some(userTopic => 
          topicSimilarityCheck(topic, userTopic)
        )
      ).length;
      const topicScore = (topicOverlap / Math.max(person.topics.length, userProfile.topics.length)) * 40;
      matchScore += topicScore;
      if (topicOverlap > 0) {
        reasons.push(`${topicOverlap} shared research interests`);
      }
    }
    
    // Platform compatibility (25% weight)
    if (userProfile.platformPreferences && person.platforms) {
      const prefs = userProfile.platformPreferences;
      const personPlatforms = Array.isArray(person.platforms) ? person.platforms : [person.platforms];
      const personPlatformsLower = personPlatforms.map(p => p.toLowerCase());
      
      if (prefs.primary && personPlatformsLower.some(p => p.includes(prefs.primary.toLowerCase()))) {
        matchScore += 25;
        reasons.push('Perfect platform match');
      } else if (prefs.secondary?.some(s => personPlatformsLower.some(p => p.includes(s.toLowerCase())))) {
        matchScore += 15;
        reasons.push('Compatible platform');
      } else if (!prefs.avoid?.some(a => personPlatformsLower.some(p => p.includes(a.toLowerCase())))) {
        matchScore += 8;
      } else {
        matchScore -= 10; // Penalty for avoided platforms
      }
    }
    
    // Availability (20% weight)
    if (person.availability?.toLowerCase().includes('open')) {
      matchScore += 20;
      reasons.push('Currently available for collaborations');
    } else if (person.availability?.toLowerCase().includes('limited')) {
      matchScore += 10;
    }
    
    // Content type compatibility (10% weight)
    if (userProfile.preferredContentTypes && person.bio) {
      const contentTypeMatches = userProfile.preferredContentTypes.filter(type => 
        person.bio.toLowerCase().includes(type.toLowerCase()) ||
        person.specialization?.toLowerCase().includes(type.toLowerCase())
      ).length;
      if (contentTypeMatches > 0) {
        matchScore += 10;
        reasons.push('Compatible content style');
      }
    }
    
    // Audience alignment (5% weight)
    if (userProfile.targetAudience && person.field) {
      if (userProfile.targetAudience.includes('General Audience') || 
          userProfile.targetAudience.includes('Students (13-18)')) {
        matchScore += 5;
        reasons.push('Great for general audience');
      }
    }
    
    const level = getCompatibilityLevel(matchScore);
    const colorMap = {
      'Excellent': '#28a745',
      'Good': '#17a2b8', 
      'Fair': '#ffc107',
      'Low': '#6c757d'
    };
    
    return {
      ...person,
      magicScore: Math.round(matchScore),
      matchReasons: reasons,
      compatibility: { level, color: colorMap[level] || '#6c757d' }
    };
  });
  
  // Filter and sort matches
  return scoredMatches
    .filter(match => match.magicScore > 30) // Minimum threshold
    .sort((a, b) => b.magicScore - a.magicScore);
}

/**
 * Helper function to check topic similarity
 * @param {string} topic1 
 * @param {string} topic2 
 * @returns {boolean}
 */
function topicSimilarityCheck(topic1, topic2) {
  const t1 = topic1.toLowerCase();
  const t2 = topic2.toLowerCase();
  return t1.includes(t2) || t2.includes(t1);
}

/**
 * Get compatibility level based on score
 * @param {number} score - Match score
 * @returns {string} Compatibility level
 */
export function getCompatibilityLevel(score) {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Low';
}

/**
 * Update match scores for a list of users based on current user profile
 * @param {Object[]} users - Array of users
 * @param {Object} currentUserProfile - Current user's profile
 * @returns {Object[]} Users with updated match scores
 */
export function updateMatchScores(users, currentUserProfile = null) {
  if (!currentUserProfile || !currentUserProfile.name) {
    // If no profile or empty profile, return users with default scores
    return users.map(user => ({
      ...user,
      matchScore: 75 + Math.floor(Math.random() * 20) // Random 75-95 for incomplete profiles
    }));
  }
  
  return users.map(user => {
    const matchScore = calculateMatchScore(user, currentUserProfile, '');
    return { ...user, matchScore };
  });
}

/**
 * Find best matches between creators and researchers
 * @param {Object[]} creators - Array of creators
 * @param {Object[]} researchers - Array of researchers
 * @param {Object} options - Matching options
 * @returns {Object[]} Array of matched pairs with scores
 */
export function findBestMatches(creators, researchers, options = {}) {
  const matches = [];
  const maxMatches = options.maxMatches || 10;
  const minScore = options.minScore || 50;
  
  creators.forEach(creator => {
    researchers.forEach(researcher => {
      const score = calculateMatchScore(creator, researcher);
      if (score >= minScore) {
        matches.push({
          creator,
          researcher,
          matchScore: score,
          compatibility: getCompatibilityLevel(score)
        });
      }
    });
  });
  
  return matches
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, maxMatches);
}

/**
 * Calculate similarity score between two text strings
 * @param {string} text1 
 * @param {string} text2 
 * @returns {number} Similarity score (0-1)
 */
export function calculateTextSimilarity(text1, text2) {
  if (!text1 || !text2) return 0;
  
  const words1 = text1.toLowerCase().split(/\s+/);
  const words2 = text2.toLowerCase().split(/\s+/);
  
  const intersection = words1.filter(word => words2.includes(word));
  const union = [...new Set([...words1, ...words2])];
  
  return intersection.length / union.length;
}