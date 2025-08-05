// Shared search and filtering utilities
// Consolidates duplicate logic from UnifiedSearch.svelte and Discover.svelte

/**
 * Filter creators based on search query and filters
 * @param {Array} creators - Array of creator objects
 * @param {string} searchQuery - Search query string
 * @param {string} filterTopic - Topic filter ('all' for no filter)
 * @param {Object} options - Additional options like access control
 * @returns {Array} Filtered creators
 */
export function filterCreators(creators, searchQuery, filterTopic = 'all', options = {}) {
  return creators.filter(creator => {
    // Access control: if user type is provided, apply restrictions
    if (options.currentUserType) {
      // Creators cannot see other creators (collaboration restriction)
      if (options.currentUserType === 'creator') {
        return false;
      }
    }
    
    // Search query filter
    if (searchQuery) {
      const queryLower = searchQuery.toLowerCase();
      const matches = creator.name.toLowerCase().includes(queryLower) ||
                     creator.bio.toLowerCase().includes(queryLower) ||
                     creator.specialization.toLowerCase().includes(queryLower) ||
                     creator.topics.some(topic => topic.toLowerCase().includes(queryLower));
      if (!matches) return false;
    }
    
    // Topic filter
    if (filterTopic !== 'all') {
      const hasMatch = creator.topics.some(topic => 
        topic.toLowerCase().includes(filterTopic.toLowerCase())
      );
      if (!hasMatch) return false;
    }
    
    return true;
  });
}

/**
 * Filter researchers based on search query and filters
 * @param {Array} researchers - Array of researcher objects
 * @param {string} searchQuery - Search query string
 * @param {string} filterField - Field filter ('all' for no filter)
 * @param {Object} options - Additional options like access control
 * @returns {Array} Filtered researchers
 */
export function filterResearchers(researchers, searchQuery, filterField = 'all', options = {}) {
  return researchers.filter(researcher => {
    // Access control: if user type is provided, apply restrictions
    if (options.currentUserType) {
      // Researchers cannot see other researchers (collaboration restriction)
      if (options.currentUserType === 'researcher') {
        return false;
      }
    }
    
    // Search query filter
    if (searchQuery) {
      const queryLower = searchQuery.toLowerCase();
      const matches = researcher.name.toLowerCase().includes(queryLower) ||
                     researcher.bio.toLowerCase().includes(queryLower) ||
                     researcher.expertise.toLowerCase().includes(queryLower) ||
                     researcher.topics.some(topic => topic.toLowerCase().includes(queryLower));
      if (!matches) return false;
    }
    
    // Field filter
    if (filterField !== 'all') {
      if (!researcher.field.toLowerCase().includes(filterField.toLowerCase())) {
        return false;
      }
    }
    
    return true;
  });
}

/**
 * Filter research groups based on search query and filters
 * @param {Array} researchGroups - Array of research group objects
 * @param {string} searchQuery - Search query string
 * @param {string} filterUniversity - University filter ('all' for no filter)
 * @returns {Array} Filtered research groups
 */
export function filterResearchGroups(researchGroups, searchQuery, filterUniversity = 'all') {
  return researchGroups.filter(group => {
    // Search query filter
    if (searchQuery) {
      const queryLower = searchQuery.toLowerCase();
      const matches = group.lab.toLowerCase().includes(queryLower) ||
                     group.university.toLowerCase().includes(queryLower) ||
                     group.department.toLowerCase().includes(queryLower) ||
                     group.labFocus.toLowerCase().includes(queryLower) ||
                     group.labHead.toLowerCase().includes(queryLower) ||
                     group.members.some(member => 
                       member.name.toLowerCase().includes(queryLower) ||
                       member.role.toLowerCase().includes(queryLower)
                     );
      if (!matches) return false;
    }
    
    // University filter
    if (filterUniversity !== 'all') {
      if (group.university !== filterUniversity) {
        return false;
      }
    }
    
    return true;
  });
}

/**
 * Parse audience size string to numerical value for sorting
 * @param {string} audienceSize - Audience size string (e.g., "1.2M", "500K", "1000")
 * @returns {number} Numerical value
 */
export function parseAudienceSize(audienceSize) {
  const match = audienceSize.match(/([0-9.]+)([KM]?)/i);
  if (match) {
    const num = parseFloat(match[1]);
    const unit = match[2]?.toUpperCase();
    return unit === 'M' ? num * 1000000 : unit === 'K' ? num * 1000 : num;
  }
  return 0;
}

/**
 * Sort creators based on specified criteria
 * @param {Array} creators - Array of creator objects
 * @param {string} sortBy - Sort criteria
 * @returns {Array} Sorted creators
 */
export function sortCreators(creators, sortBy = 'matchScore') {
  return [...creators].sort((a, b) => {
    switch (sortBy) {
      case 'name': 
        return a.name.localeCompare(b.name);
      case 'audience':
        return parseAudienceSize(b.audience_size) - parseAudienceSize(a.audience_size);
      case 'platform': 
        return (a.platforms[0] || '').localeCompare(b.platforms[0] || '');
      case 'specialization': 
        return (a.specialization || '').localeCompare(b.specialization || '');
      default: 
        return (b.matchScore || 0) - (a.matchScore || 0);
    }
  });
}

/**
 * Sort researchers based on specified criteria
 * @param {Array} researchers - Array of researcher objects
 * @param {string} sortBy - Sort criteria
 * @returns {Array} Sorted researchers
 */
export function sortResearchers(researchers, sortBy = 'matchScore') {
  return [...researchers].sort((a, b) => {
    switch (sortBy) {
      case 'name': 
        return a.name.localeCompare(b.name);
      case 'publications': 
        return (b.publications || 0) - (a.publications || 0);
      case 'h_index': 
        return (b.h_index || 0) - (a.h_index || 0);
      case 'institution': 
        return a.institution.localeCompare(b.institution);
      case 'field': 
        return (a.field || '').localeCompare(b.field || '');
      case 'availability': 
        // Sort by availability status: "Open" first, then alphabetically
        const aOpen = (a.availability || '').toLowerCase().includes('open');
        const bOpen = (b.availability || '').toLowerCase().includes('open');
        if (aOpen && !bOpen) return -1;
        if (!aOpen && bOpen) return 1;
        return (a.availability || '').localeCompare(b.availability || '');
      default: 
        return (b.matchScore || 0) - (a.matchScore || 0);
    }
  });
}

/**
 * Sort research groups based on specified criteria
 * @param {Array} researchGroups - Array of research group objects
 * @param {string} sortBy - Sort criteria
 * @returns {Array} Sorted research groups
 */
export function sortResearchGroups(researchGroups, sortBy = 'university') {
  return [...researchGroups].sort((a, b) => {
    switch (sortBy) {
      case 'university': 
        return a.university.localeCompare(b.university);
      case 'department': 
        return a.department.localeCompare(b.department);
      case 'lab': 
        return a.lab.localeCompare(b.lab);
      case 'members':
        return (b.members?.length || 0) - (a.members?.length || 0);
      default: 
        return a.university.localeCompare(b.university);
    }
  });
}

/**
 * Combined filter and sort function for creators
 * @param {Array} creators - Array of creator objects
 * @param {string} searchQuery - Search query string
 * @param {string} filterTopic - Topic filter
 * @param {string} sortBy - Sort criteria
 * @param {Object} options - Additional options
 * @returns {Array} Filtered and sorted creators
 */
export function filterAndSortCreators(creators, searchQuery, filterTopic, sortBy, options = {}) {
  const filtered = filterCreators(creators, searchQuery, filterTopic, options);
  return sortCreators(filtered, sortBy);
}

/**
 * Combined filter and sort function for researchers
 * @param {Array} researchers - Array of researcher objects
 * @param {string} searchQuery - Search query string
 * @param {string} filterField - Field filter
 * @param {string} sortBy - Sort criteria
 * @param {Object} options - Additional options
 * @returns {Array} Filtered and sorted researchers
 */
export function filterAndSortResearchers(researchers, searchQuery, filterField, sortBy, options = {}) {
  const filtered = filterResearchers(researchers, searchQuery, filterField, options);
  return sortResearchers(filtered, sortBy);
}

/**
 * Combined filter and sort function for research groups
 * @param {Array} researchGroups - Array of research group objects
 * @param {string} searchQuery - Search query string
 * @param {string} filterUniversity - University filter
 * @param {string} sortBy - Sort criteria
 * @returns {Array} Filtered and sorted research groups
 */
export function filterAndSortResearchGroups(researchGroups, searchQuery, filterUniversity, sortBy) {
  const filtered = filterResearchGroups(researchGroups, searchQuery, filterUniversity);
  return sortResearchGroups(filtered, sortBy);
}