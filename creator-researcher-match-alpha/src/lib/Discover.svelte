<script>
  import { onMount } from 'svelte';
  import { 
    fetchCreators, 
    fetchResearchers, 
    updateMatchScores,
    getResearchGroupsFlat,
    getUniversityList,
    getFocusAreas
  } from './dataService.js';
  import { 
    filterAndSortCreators as utilsFilterAndSortCreators,
    filterAndSortResearchers as utilsFilterAndSortResearchers,
    filterAndSortResearchGroups as utilsFilterAndSortResearchGroups
  } from './searchUtils.js';
  import { generateMagicMatches, getCompatibilityLevel } from './matchingService.js';
  import UserCard from './UserCard.svelte';
  import { addConnection, isConnected } from './profileService.js';
  import { currentProfile } from './profileStore.js';
  import ParaphraseToolMini from './ParaphraseToolMini.svelte';
  
  export let startConversationWith; // Function to start new conversations
  
  // Add navigation function for magic button
  function navigate(page) {
    // This will be handled by the parent component
    console.log('Navigate to:', page);
  }
  
  let activeTab = 'research-groups'; // Default to research groups, will be updated on mount
  let searchQuery = '';
  let loading = true;
  let viewMode = 'card'; // 'card' or 'compact'
  
  // Data arrays
  let creators = [];
  let researchers = [];
  let researchGroups = [];
  let filteredResults = [];
  
  // Magic button state
  let isGeneratingMatches = false;
  let magicMatches = [];
  let showMagicResults = false;
  
  // Sorting and filtering
  let sortBy = 'match';
  let filterTopic = 'all';
  let filterField = 'all';
  let filterUniversity = 'all';
  let filterFocusArea = 'all';
  
  // Filter options
  let availableTopics = [];
  let availableFields = [];
  let universities = [];
  let focusAreas = [];
  
  // Keyword synonyms and related terms
  const keywordSynonyms = {
    // Science fields
    'ai': ['artificial intelligence', 'machine learning', 'ml', 'deep learning', 'neural networks', 'ai/ml'],
    'artificial intelligence': ['ai', 'machine learning', 'ml', 'deep learning', 'neural networks', 'ai/ml'],
    'ml': ['machine learning', 'ai', 'artificial intelligence', 'deep learning', 'neural networks'],
    'machine learning': ['ml', 'ai', 'artificial intelligence', 'deep learning', 'neural networks'],
    'climate': ['climate change', 'global warming', 'environmental', 'sustainability', 'climate science'],
    'climate change': ['climate', 'global warming', 'environmental', 'sustainability'],
    'bio': ['biology', 'biological', 'life sciences', 'biotechnology'],
    'biology': ['bio', 'biological', 'life sciences', 'biotechnology'],
    'chem': ['chemistry', 'chemical'],
    'chemistry': ['chem', 'chemical'],
    'phys': ['physics', 'physical'],
    'physics': ['phys', 'physical'],
    'cs': ['computer science', 'computing', 'software', 'programming'],
    'computer science': ['cs', 'computing', 'software', 'programming'],
    'math': ['mathematics', 'mathematical', 'maths'],
    'mathematics': ['math', 'mathematical', 'maths'],
    'eng': ['engineering', 'engineer'],
    'engineering': ['eng', 'engineer'],
    'med': ['medicine', 'medical', 'health', 'healthcare'],
    'medicine': ['med', 'medical', 'health', 'healthcare'],
    'health': ['healthcare', 'medical', 'medicine', 'wellness'],
    'healthcare': ['health', 'medical', 'medicine'],
    'neuro': ['neuroscience', 'neurology', 'brain', 'neural'],
    'neuroscience': ['neuro', 'neurology', 'brain', 'neural'],
    'psych': ['psychology', 'psychological'],
    'psychology': ['psych', 'psychological'],
    'astro': ['astronomy', 'astrophysics', 'space', 'cosmic'],
    'astronomy': ['astro', 'astrophysics', 'space', 'cosmic'],
    'space': ['astronomy', 'astrophysics', 'aerospace', 'cosmic'],
    'energy': ['renewable energy', 'power', 'electricity', 'sustainable energy'],
    'renewable': ['renewable energy', 'sustainable', 'green energy', 'clean energy'],
    'quantum': ['quantum physics', 'quantum mechanics', 'quantum computing'],
    'nano': ['nanotechnology', 'nanoscience', 'nanomaterials'],
    'robotics': ['robots', 'automation', 'mechatronics'],
    'genetics': ['genomics', 'dna', 'gene', 'genetic engineering'],
    'ecology': ['environmental', 'ecosystem', 'conservation'],
    'environmental': ['ecology', 'environment', 'sustainability', 'conservation'],
    'data': ['data science', 'analytics', 'big data', 'data analysis'],
    'stats': ['statistics', 'statistical'],
    'statistics': ['stats', 'statistical', 'data analysis']
  };
  
  // Function to get all related keywords
  function getRelatedKeywords(keyword) {
    const lower = keyword.toLowerCase();
    const related = new Set([lower]);
    
    // Add direct synonyms
    if (keywordSynonyms[lower]) {
      keywordSynonyms[lower].forEach(syn => related.add(syn));
    }
    
    // Check if keyword is part of any synonym lists
    Object.entries(keywordSynonyms).forEach(([key, synonyms]) => {
      if (synonyms.includes(lower)) {
        related.add(key);
        synonyms.forEach(syn => related.add(syn));
      }
    });
    
    return Array.from(related);
  }
  
  // Function to calculate similarity between two strings (for fuzzy matching)
  function calculateSimilarity(str1, str2) {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
    
    // If one string contains the other, high similarity
    if (s1.includes(s2) || s2.includes(s1)) {
      return 0.8;
    }
    
    // Check for common prefixes (at least 3 characters)
    const minLength = Math.min(s1.length, s2.length);
    let commonPrefix = 0;
    for (let i = 0; i < minLength; i++) {
      if (s1[i] === s2[i]) {
        commonPrefix++;
      } else {
        break;
      }
    }
    
    if (commonPrefix >= 3) {
      return commonPrefix / Math.max(s1.length, s2.length);
    }
    
    // Simple edit distance approximation
    if (Math.abs(s1.length - s2.length) <= 2) {
      let matches = 0;
      for (let i = 0; i < Math.min(s1.length, s2.length); i++) {
        if (s1[i] === s2[i]) matches++;
      }
      const similarity = matches / Math.max(s1.length, s2.length);
      if (similarity > 0.7) return similarity;
    }
    
    return 0;
  }
  
  // Magic button matching algorithm
  async function generateMagicMatchesFunc() {
    isGeneratingMatches = true;
    showMagicResults = false;
    
    // Simulate processing time for better UX
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      const userProfile = $currentProfile;
      // Filter people based on collaboration restrictions
      let compatiblePeople = [];
      if (userProfile.type === 'researcher') {
        compatiblePeople = [...creators]; // Researchers can only see creators
      } else if (userProfile.type === 'creator') {
        compatiblePeople = [...researchers]; // Creators can only see researchers
      }
      
      // Use shared matching service
      const scoredMatches = generateMagicMatches(userProfile, compatiblePeople);
      
      // Take top 6 matches
      magicMatches = scoredMatches.slice(0, 6);
      
      showMagicResults = true;
    } catch (error) {
      console.error('Error generating magic matches:', error);
    } finally {
      isGeneratingMatches = false;
    }
  }
  
  
  function topicOverlap(topic1, topic2) {
    const t1 = topic1.toLowerCase();
    const t2 = topic2.toLowerCase();
    return t1.includes(t2) || t2.includes(t1) || 
           getRelatedKeywords(t1).some(keyword => t2.includes(keyword));
  }
  
  function closeMagicResults() {
    showMagicResults = false;
    magicMatches = [];
  }
  
  // React to profile changes
  $: if ($currentProfile) {
    updateResults();
  }

  onMount(async () => {
    try {
      const [creatorsData, researchersData, researchGroupsData, universitiesData, focusAreasData] = await Promise.all([
        fetchCreators(),
        fetchResearchers(),
        getResearchGroupsFlat(),
        getUniversityList(),
        getFocusAreas()
      ]);
      
      const currentUserProfile = $currentProfile;
      
      creators = updateMatchScores(creatorsData, currentUserProfile);
      researchers = updateMatchScores(researchersData, currentUserProfile);
      researchGroups = researchGroupsData;
      availableTopics = [...new Set(creators.flatMap(c => c.topics))].sort();
      availableFields = [...new Set(researchers.map(r => r.field))].sort();
      universities = universitiesData;
      focusAreas = focusAreasData;
      
      // Set default tab based on user type
      if (currentUserProfile.type === 'researcher') {
        activeTab = 'creators';
      } else if (currentUserProfile.type === 'creator') {
        activeTab = 'researchers';
      }
      
      updateResults();
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      loading = false;
    }
  });
  
  async function updateResults() {
    if (loading) return;
    
    try {
      const currentUserProfile = $currentProfile;
      const options = { currentUserType: currentUserProfile?.type };
      
      if (activeTab === 'creators') {
        filteredResults = utilsFilterAndSortCreators(creators, searchQuery, filterTopic, sortBy, options);
      } else if (activeTab === 'researchers') {
        filteredResults = utilsFilterAndSortResearchers(researchers, searchQuery, filterField, sortBy, options);
      } else if (activeTab === 'research-groups') {
        filteredResults = utilsFilterAndSortResearchGroups(researchGroups, searchQuery, filterUniversity, sortBy);
      }
    } catch (error) {
      console.error('Error updating results:', error);
      filteredResults = [];
    }
  }
  
  
  function changeTab(tab) {
    activeTab = tab;
    // Reset filters when changing tabs
    if (tab === 'creators') {
      sortBy = 'match';
    } else if (tab === 'researchers') {
      sortBy = 'match';
    } else if (tab === 'research-groups') {
      sortBy = 'name';
    }
    filterTopic = 'all';
    filterField = 'all';
    filterUniversity = 'all';
    filterFocusArea = 'all';
    updateResults();
  }
  
  // Reactive statement to update results when search query or loading state changes
  $: {
    if (!loading) {
      updateResults();
    }
  }
  
  // Also update when searchQuery changes
  $: searchQuery, activeTab, (() => {
    if (!loading) {
      updateResults();
    }
  })();
</script>

<div class="discover-container">
  <div class="header">
    <h1>Discover & Connect</h1>
    <p>Find creators, researchers, and research groups to collaborate with</p>
  </div>
  
  <!-- Search Bar -->
  <div class="search-section">
    <div class="search-row">
      <div class="search-box">
        <input 
          type="text" 
          placeholder="Search by name, expertise, field, or keyword..."
          bind:value={searchQuery}
          on:keypress={(e) => {
            if (e.key === 'Enter') {
              updateResults();
            }
          }}
          class="search-input"
        />
        <button class="search-button" on:click={updateResults} aria-label="Search for users">
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/>
          </svg>
        </button>
      </div>
      
      <button 
        class="magic-button {isGeneratingMatches ? 'generating' : ''}" 
        on:click={generateMagicMatchesFunc}
        disabled={isGeneratingMatches}
        title="Find perfect matches based on your preferences"
      >
        {#if isGeneratingMatches}
          <div class="magic-spinner"></div>
          <span>Finding Matches...</span>
        {:else}
          ✨ Magic Match
        {/if}
      </button>
    </div>
  </div>
  
  <!-- Tabs and View Controls -->
  <div class="controls-section">
    <div class="tabs">
      {#if $currentProfile?.type === 'researcher'}
        <button 
          class="tab" 
          class:active={activeTab === 'creators'}
          on:click={() => changeTab('creators')}
        >
          <span class="tab-icon">👥</span>
          Content Creators ({creators.length})
        </button>
      {/if}
      {#if $currentProfile?.type === 'creator'}
        <button 
          class="tab" 
          class:active={activeTab === 'researchers'}
          on:click={() => changeTab('researchers')}
        >
          <span class="tab-icon">🔬</span>
          Researchers ({researchers.length})
        </button>
      {/if}
      <button 
        class="tab" 
        class:active={activeTab === 'research-groups'}
        on:click={() => changeTab('research-groups')}
      >
        <span class="tab-icon">🏛️</span>
        Research Groups ({researchGroups.length})
      </button>
    </div>
    
    <!-- View Mode Toggle -->
    <div class="view-toggle">
      <button 
        class="view-btn" 
        class:active={viewMode === 'card'}
        on:click={() => viewMode = 'card'}
        title="Card view"
        aria-label="Switch to card view"
      >
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
          <path d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
        </svg>
      </button>
      <button 
        class="view-btn" 
        class:active={viewMode === 'compact'}
        on:click={() => viewMode = 'compact'}
        title="Compact view"
        aria-label="Switch to compact view"
      >
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
          <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
    </div>
  </div>
  
  <!-- Sorting and Filtering Controls -->
  <div class="filters-section">
    <div class="filters-container">
      {#if activeTab === 'creators'}
        <div class="filter-group">
          <label for="creators-sort-select">Sort by:</label>
          <select id="creators-sort-select" bind:value={sortBy} on:change={updateResults}>
            <option value="match">Best Match</option>
            <option value="audience">Audience Size</option>
            <option value="name">Name (A-Z)</option>
            <option value="platform">Platform</option>
            <option value="specialization">Specialization</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label for="creators-topic-filter">Filter by topic:</label>
          <select id="creators-topic-filter" bind:value={filterTopic} on:change={updateResults}>
            <option value="all">All Topics</option>
            {#each availableTopics as topic}
              <option value={topic}>{topic}</option>
            {/each}
          </select>
        </div>
      {:else if activeTab === 'researchers'}
        <div class="filter-group">
          <label for="researchers-sort-select">Sort by:</label>
          <select id="researchers-sort-select" bind:value={sortBy} on:change={updateResults}>
            <option value="match">Best Match</option>
            <option value="publications">Publications (High to Low)</option>
            <option value="h_index">H-Index (High to Low)</option>
            <option value="name">Name (A-Z)</option>
            <option value="institution">Institution (A-Z)</option>
            <option value="field">Field (A-Z)</option>
            <option value="availability">Availability</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label for="researchers-field-filter">Filter by field:</label>
          <select id="researchers-field-filter" bind:value={filterField} on:change={updateResults}>
            <option value="all">All Fields</option>
            {#each availableFields as field}
              <option value={field}>{field}</option>
            {/each}
          </select>
        </div>
      {:else if activeTab === 'research-groups'}
        <div class="filter-group">
          <label for="groups-sort-select">Sort by:</label>
          <select id="groups-sort-select" bind:value={sortBy} on:change={updateResults}>
            <option value="name">Lab Name</option>
            <option value="university">University</option>
            <option value="head">Lab Head</option>
            <option value="members">Team Size</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label for="groups-university-filter">Filter by university:</label>
          <select id="groups-university-filter" bind:value={filterUniversity} on:change={updateResults}>
            <option value="all">All Universities</option>
            {#each universities as university}
              <option value={university.name}>{university.name}</option>
            {/each}
          </select>
        </div>
        
        <div class="filter-group">
          <label for="groups-focus-filter">Filter by focus area:</label>
          <select id="groups-focus-filter" bind:value={filterFocusArea} on:change={updateResults}>
            <option value="all">All Areas</option>
            {#each focusAreas as area}
              <option value={area}>{area}</option>
            {/each}
          </select>
        </div>
      {/if}
    </div>
  </div>
  
  <!-- Results -->
  <div class="results-section">
    {#if loading}
      <div class="loading">Loading...</div>
    {:else if filteredResults.length === 0}
      <div class="no-results">
        <h3>No {activeTab.replace('-', ' ')} found</h3>
        <p>Try adjusting your search terms or browse all available {activeTab.replace('-', ' ')}.</p>
      </div>
    {:else}
      {#if viewMode === 'card'}
        <div class="results-grid">
          {#each filteredResults as item}
            <div class="result-card">
              {#if activeTab === 'creators'}
                <div class="card-header">
                  <h3>{item.name}</h3>
                  <div class="platforms">
                    {#each item.platforms as platform}
                      <span class="platform-tag">{platform}</span>
                    {/each}
                  </div>
                </div>
                <div class="card-content">
                  <p class="audience">👥 {item.audience_size}</p>
                  <p class="specialization">{item.specialization}</p>
                  {#if item.example_content}
                    <p class="example"><strong>Example:</strong> {item.example_content}</p>
                  {/if}
                  {#if item.collaboration_notes}
                    <p class="notes"><strong>Notes:</strong> {item.collaboration_notes}</p>
                  {/if}
                </div>
                <div class="card-actions">
                  <button class="connect-btn" on:click={() => startConversationWith(item)}>Connect</button>
                  <button class="view-profile-btn">View Profile</button>
                </div>
              {:else if activeTab === 'researchers'}
                <div class="card-header">
                  <h3>{item.name}</h3>
                  <p class="institution">{item.institution}</p>
                </div>
                <div class="card-content">
                  <p class="field"><strong>Field:</strong> {item.field}</p>
                  <div class="expertise-section">
                    <p class="expertise"><strong>Expertise:</strong> {item.expertise}</p>
                    <div class="paraphrase-mini">
                      <ParaphraseToolMini 
                        text={item.expertise} 
                        context="profile"
                      />
                    </div>
                  </div>
                  {#if item.bio}
                    <div class="bio-section">
                      <p class="bio">{item.bio}</p>
                      <div class="paraphrase-mini">
                        <ParaphraseToolMini 
                          text={item.bio} 
                          context="profile"
                        />
                      </div>
                    </div>
                  {/if}
                  <div class="stats">
                    <span class="stat">📄 {item.publications} publications</span>
                    <span class="stat">📊 h-index: {item.h_index}</span>
                  </div>
                  <div class="availability {item.availability?.toLowerCase().includes('open') ? 'available' : 'limited'}">
                    {item.availability}
                  </div>
                  {#if item.research_interests}
                    <div class="interests">
                      {#each item.research_interests.slice(0, 3) as interest}
                        <span class="interest-tag">{interest}</span>
                      {/each}
                      {#if item.research_interests.length > 3}
                        <span class="interest-tag more">+{item.research_interests.length - 3} more</span>
                      {/if}
                    </div>
                  {/if}
                </div>
                <div class="card-actions">
                  <button class="connect-btn" on:click={() => startConversationWith(item)}>Connect</button>
                  <button class="view-profile-btn">View Profile</button>
                </div>
              {:else if activeTab === 'research-groups'}
                <div class="card-header">
                  <h3>{item.name}</h3>
                  <p class="institution">{item.university}</p>
                </div>
                <div class="card-content">
                  <p class="department"><strong>Department:</strong> {item.department}</p>
                  <p class="head"><strong>Head:</strong> {item.head}</p>
                  <p class="focus"><strong>Focus:</strong> {item.focus}</p>
                  {#if item.location}
                    <p class="location">📍 {item.location}</p>
                  {/if}
                  {#if item.members}
                    <p class="members">👥 {item.members.length} members</p>
                  {/if}
                </div>
                <div class="card-actions">
                  <button class="connect-btn">Contact Lab</button>
                  <button class="view-profile-btn">View Details</button>
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {:else}
        <!-- Compact View -->
        <div class="compact-list">
          {#each filteredResults as item}
            <div class="compact-item">
              <div class="compact-content">
                <div class="compact-header">
                  <h4 class="compact-name">{item.name}</h4>
                  {#if activeTab === 'creators'}
                    <div class="compact-info">
                      <span class="compact-platforms">{item.platforms.join(', ')}</span>
                      <span class="compact-audience">👥 {item.audience_size}</span>
                    </div>
                  {:else if activeTab === 'researchers'}
                    <div class="compact-info">
                      <span class="compact-institution">{item.institution}</span>
                      <span class="compact-field">{item.field}</span>
                    </div>
                  {:else if activeTab === 'research-groups'}
                    <div class="compact-info">
                      <span class="compact-institution">{item.university}</span>
                      <span class="compact-department">{item.department}</span>
                    </div>
                  {/if}
                </div>
                <div class="compact-details">
                  {#if activeTab === 'creators'}
                    <p class="compact-specialization">{item.specialization}</p>
                  {:else if activeTab === 'researchers'}
                    <p class="compact-expertise">{item.expertise}</p>
                    <div class="compact-stats">
                      📄 {item.publications} • 📊 h-index: {item.h_index}
                    </div>
                  {:else if activeTab === 'research-groups'}
                    <p class="compact-focus">{item.focus}</p>
                  {/if}
                </div>
              </div>
              <div class="compact-actions">
                <button class="compact-connect-btn" on:click={() => activeTab !== 'research-groups' && startConversationWith(item)}>
                  {activeTab === 'research-groups' ? 'Contact' : 'Connect'}
                </button>
                <button class="compact-view-btn">View</button>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    {/if}
  </div>
  
  <!-- Magic Matches Modal -->
  {#if showMagicResults}
    <div class="magic-modal-overlay" on:click={closeMagicResults} on:keydown={(e) => e.key === 'Escape' && closeMagicResults()} role="dialog" aria-modal="true" aria-labelledby="magic-modal-title" tabindex="-1">
      <div class="magic-modal" on:click|stopPropagation on:keydown|stopPropagation role="document">
        <div class="magic-header">
          <h2 id="magic-modal-title">✨ Your Perfect Matches</h2>
          <button class="close-btn" on:click={closeMagicResults}>×</button>
        </div>
        
        {#if magicMatches.length > 0}
          <div class="magic-results">
            {#each magicMatches as match}
              <UserCard 
                user={match} 
                variant="magic"
                showMatchScore={true}
                onConnect={(user) => { startConversationWith(user); closeMagicResults(); }}
              />
            {/each}
          </div>
        {:else}
          <div class="no-magic-matches">
            <div class="no-matches-icon">🔍</div>
            <h3>No perfect matches found</h3>
            <p>Try updating your platform preferences or expanding your research interests to find more compatible matches.</p>
            <button class="update-profile-btn" on:click={() => navigate('profile')}>Update Profile</button>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .discover-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
    background: white;
  }
  
  .header {
    text-align: center;
    margin-bottom: 3rem;
  }
  
  .header h1 {
    font-size: 3rem;
    color: #333;
    margin-bottom: 1rem;
  }
  
  .header p {
    font-size: 1.2rem;
    color: #666;
  }
  
  .search-section {
    margin-bottom: 2rem;
  }
  
  .search-row {
    display: flex;
    gap: 1rem;
    align-items: center;
    max-width: 800px;
    margin: 0 auto;
  }
  
  .search-box {
    flex: 1;
    display: flex;
    border: 2px solid #e0e0e0;
    border-radius: 25px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
  
  .magic-button {
    padding: 1rem 2rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 25px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-width: 160px;
    justify-content: center;
  }
  
  .magic-button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
  }
  
  .magic-button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }
  
  .magic-button.generating {
    background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  }
  
  .magic-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .search-input {
    flex: 1;
    padding: 1rem 1.5rem;
    border: none;
    font-size: 1rem;
    outline: none;
  }
  
  .search-button {
    background: #646cff;
    color: white;
    border: none;
    padding: 1rem 1.5rem;
    cursor: pointer;
    transition: background 0.3s ease;
  }
  
  .search-button:hover {
    background: #535bf2;
  }
  
  .controls-section {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 2rem;
    gap: 2rem;
  }
  
  .tabs {
    display: flex;
    flex: 1;
    justify-content: center;
    border-bottom: 2px solid #f0f0f0;
  }
  
  .view-toggle {
    display: flex;
    background: #f8f9fa;
    border-radius: 8px;
    padding: 4px;
    border: 1px solid #e0e0e0;
  }
  
  .view-btn {
    background: none;
    border: none;
    padding: 8px 12px;
    cursor: pointer;
    border-radius: 6px;
    color: #666;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .view-btn:hover {
    background: #e9ecef;
    color: #333;
  }
  
  .view-btn.active {
    background: #646cff;
    color: white;
    box-shadow: 0 2px 4px rgba(100, 108, 255, 0.3);
  }
  
  .tab {
    background: none;
    border: none;
    padding: 1rem 2rem;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 500;
    color: #666;
    border-bottom: 3px solid transparent;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .tab:hover {
    color: #333;
    background: #f8f9fa;
  }
  
  .tab.active {
    color: #646cff;
    border-bottom-color: #646cff;
    background: #f8f9ff;
  }
  
  .tab-icon {
    font-size: 1.2rem;
  }
  
  .loading, .no-results {
    text-align: center;
    padding: 3rem;
    color: #666;
  }
  
  .no-results h3 {
    color: #333;
    margin-bottom: 1rem;
  }
  
  .results-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 2rem;
  }
  
  .result-card {
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  
  .result-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0,0,0,0.15);
  }
  
  .card-header h3 {
    margin: 0 0 0.5rem 0;
    color: #333;
    font-size: 1.2rem;
  }
  
  .institution {
    color: #666;
    margin: 0 0 1rem 0;
    font-weight: 500;
  }
  
  .platforms {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
  
  .platform-tag {
    background: #646cff;
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.8rem;
  }
  
  .card-content {
    margin: 1rem 0;
  }
  
  .card-content p {
    margin: 0.5rem 0;
    color: #666;
    line-height: 1.5;
  }
  
  .audience, .field, .expertise, .department, .head, .focus, .location, .members {
    font-size: 0.9rem;
  }
  
  .bio {
    font-style: italic;
    background: #f8f9fa;
    padding: 0.75rem;
    border-radius: 6px;
    border-left: 3px solid #646cff;
  }
  
  .stats {
    display: flex;
    gap: 1rem;
    margin: 0.75rem 0;
  }
  
  .stat {
    font-size: 0.85rem;
    color: #666;
  }
  
  .availability {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.85rem;
    font-weight: 500;
    margin: 0.5rem 0;
  }
  
  .availability.available {
    background: #d4edda;
    color: #155724;
  }
  
  .availability.limited {
    background: #fff3cd;
    color: #856404;
  }
  
  .interests {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.75rem;
  }
  
  .interest-tag {
    background: #f0f0f0;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.8rem;
    color: #555;
  }
  
  .interest-tag.more {
    background: #e8e8e8;
    font-style: italic;
  }
  
  .card-actions {
    display: flex;
    gap: 0.75rem;
    margin-top: 1.5rem;
    padding-top: 1rem;
    border-top: 1px solid #f0f0f0;
  }
  
  .connect-btn {
    background: #646cff;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: background 0.3s ease;
  }
  
  .connect-btn:hover {
    background: #535bf2;
  }
  
  .view-profile-btn {
    background: transparent;
    color: #646cff;
    border: 1px solid #646cff;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.3s ease;
  }
  
  .view-profile-btn:hover {
    background: #646cff;
    color: white;
  }
  
  /* Compact View Styles */
  .compact-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .compact-item {
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 1rem 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  
  .compact-item:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }
  
  .compact-content {
    flex: 1;
    min-width: 0;
  }
  
  .compact-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 0.5rem;
    gap: 1rem;
  }
  
  .compact-name {
    font-size: 1.1rem;
    font-weight: 600;
    color: #333;
    margin: 0;
    flex-shrink: 0;
  }
  
  .compact-info {
    display: flex;
    gap: 1rem;
    font-size: 0.9rem;
    color: #666;
    flex-wrap: wrap;
  }
  
  .compact-platforms,
  .compact-audience,
  .compact-institution,
  .compact-field,
  .compact-department {
    font-weight: 500;
  }
  
  .compact-details {
    font-size: 0.9rem;
    color: #666;
    margin-top: 0.25rem;
  }
  
  .compact-specialization,
  .compact-expertise,
  .compact-focus {
    margin: 0;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .compact-stats {
    font-size: 0.8rem;
    color: #888;
    margin-top: 0.25rem;
  }
  
  .compact-actions {
    display: flex;
    gap: 0.5rem;
    flex-shrink: 0;
    margin-left: 1rem;
  }
  
  .compact-connect-btn,
  .compact-view-btn {
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
  }
  
  .compact-connect-btn {
    background: #646cff;
    color: white;
    border: none;
  }
  
  .compact-connect-btn:hover {
    background: #535bf2;
  }
  
  .compact-view-btn {
    background: transparent;
    color: #646cff;
    border: 1px solid #646cff;
  }
  
  .compact-view-btn:hover {
    background: #646cff;
    color: white;
  }
  
  /* Filters Section Styles */
  .filters-section {
    margin: 2rem 0;
    background: #f8f9fa;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 1.5rem;
  }
  
  .filters-container {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
    align-items: end;
  }
  
  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-width: 150px;
  }
  
  .filter-group label {
    font-size: 0.9rem;
    font-weight: 600;
    color: #333;
  }
  
  .filter-group select {
    padding: 0.5rem 0.75rem;
    border: 1px solid #ddd;
    border-radius: 6px;
    background: white;
    font-size: 0.9rem;
    cursor: pointer;
    transition: border-color 0.2s ease;
  }
  
  .filter-group select:focus {
    outline: none;
    border-color: #646cff;
    box-shadow: 0 0 0 2px rgba(100, 108, 255, 0.1);
  }
  
  .filter-group select:hover {
    border-color: #bbb;
  }
  
  @media (max-width: 768px) {
    .discover-container {
      padding: 1rem;
    }
    
    .header h1 {
      font-size: 2rem;
    }
    
    .controls-section {
      flex-direction: column;
      gap: 1rem;
      align-items: stretch;
    }
    
    .tabs {
      flex-direction: column;
      align-items: stretch;
    }
    
    .tab {
      text-align: center;
      border-bottom: 1px solid #e0e0e0;
      border-radius: 0;
    }
    
    .tab.active {
      border-bottom-color: #646cff;
    }
    
    .view-toggle {
      align-self: center;
    }
    
    .results-grid {
      grid-template-columns: 1fr;
    }
    
    .compact-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }
    
    .compact-actions {
      margin-left: 0;
      margin-top: 0.5rem;
    }
    
    .compact-item {
      flex-direction: column;
      align-items: flex-start;
    }
    
    .filters-container {
      flex-direction: column;
      gap: 1rem;
    }
    
    .filter-group {
      min-width: 100%;
    }
  }
  
  /* Magic Modal Styles */
  .magic-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(5px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 2rem;
  }
  
  .magic-modal {
    background: white;
    border-radius: 16px;
    max-width: 900px;
    width: 100%;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  }
  
  .magic-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 2rem;
    border-bottom: 1px solid #e0e0e0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 16px 16px 0 0;
  }
  
  .magic-header h2 {
    margin: 0;
    font-size: 1.5rem;
  }
  
  .close-btn {
    background: none;
    border: none;
    color: white;
    font-size: 2rem;
    cursor: pointer;
    padding: 0;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background-color 0.2s;
  }
  
  .close-btn:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
  
  .magic-results {
    padding: 2rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  
  .no-magic-matches {
    text-align: center;
    padding: 3rem 2rem;
  }
  
  .no-matches-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
  }
  
  .no-magic-matches h3 {
    color: #333;
    margin: 0 0 1rem;
  }
  
  .no-magic-matches p {
    color: #666;
    margin: 0 0 2rem;
    max-width: 400px;
    margin-left: auto;
    margin-right: auto;
  }
  
  .update-profile-btn {
    padding: 0.75rem 2rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .update-profile-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }
  
  /* Paraphrasing Tool Integration */
  .expertise-section,
  .bio-section {
    position: relative;
    margin-bottom: 1rem;
  }
  
  .paraphrase-mini {
    position: absolute;
    top: 5px;
    right: 5px;
    opacity: 0;
    transition: opacity 0.2s;
  }
  
  .expertise-section:hover .paraphrase-mini,
  .bio-section:hover .paraphrase-mini {
    opacity: 1;
  }
  
</style>