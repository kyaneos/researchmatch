<script>
  import { onMount } from 'svelte';
  import { 
    fetchCreators, 
    fetchResearchers, 
    updateMatchScores,
    searchResearchGroups,
    getResearchGroupsFlat,
    getUniversityList,
    getFocusAreas
  } from './dataService.js';
  import { 
    filterAndSortCreators as utilsFilterAndSortCreators,
    filterAndSortResearchers as utilsFilterAndSortResearchers,
    filterAndSortResearchGroups as utilsFilterAndSortResearchGroups
  } from './searchUtils.js';
  import UserCard from './UserCard.svelte';
  import { addConnection, isConnected, getProfile } from './profileService.js';
  
  export let navigate; // External reference for future use
  export let startConversationWith; // Function to start new conversations
  
  // Main state
  let searchQuery = '';
  let contentType = 'creators'; // 'creators', 'researchers', 'research-groups'
  let viewMode = 'card'; // 'card', 'compact', 'tree'
  let loading = true;
  
  // Data
  let creators = [];
  let researchers = [];
  let researchGroups = [];
  let filteredResults = [];
  
  // Filters
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
  
  onMount(async () => {
    try {
      const [creatorsData, researchersData, researchGroupsData, universitiesData, focusAreasData] = await Promise.all([
        fetchCreators(),
        fetchResearchers(),
        getResearchGroupsFlat(),
        getUniversityList(),
        getFocusAreas()
      ]);
      
      const currentUserProfile = getProfile();
      
      creators = updateMatchScores(creatorsData, currentUserProfile);
      researchers = updateMatchScores(researchersData, currentUserProfile);
      researchGroups = researchGroupsData;
      availableTopics = [...new Set(creators.flatMap(c => c.topics))].sort();
      availableFields = [...new Set(researchers.map(r => r.field))].sort();
      universities = universitiesData;
      focusAreas = focusAreasData;
      
      await updateResults();
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      loading = false;
    }
  });
  
  async function updateResults() {
    if (loading) return;
    
    try {
      if (contentType === 'creators') {
        filteredResults = utilsFilterAndSortCreators(creators, searchQuery, filterTopic, sortBy);
      } else if (contentType === 'researchers') {
        filteredResults = utilsFilterAndSortResearchers(researchers, searchQuery, filterField, sortBy);
      } else if (contentType === 'research-groups') {
        filteredResults = utilsFilterAndSortResearchGroups(researchGroups, searchQuery, filterUniversity, sortBy);
      }
    } catch (error) {
      console.error('Error updating results:', error);
      filteredResults = [];
    }
  }
  
  
  function changeContentType(type) {
    contentType = type;
    searchQuery = '';
    // Set appropriate default sort for each content type
    if (type === 'creators') {
      sortBy = 'match';
    } else if (type === 'researchers') {
      sortBy = 'match';
    } else if (type === 'research-groups') {
      sortBy = 'name';
    }
    filterTopic = 'all';
    filterField = 'all';
    filterUniversity = 'all';
    filterFocusArea = 'all';
    viewMode = 'card';
    updateResults();
  }
  
  function handleConnect(item) {
    const success = addConnection(item);
    if (success) {
      // Start a new conversation with this person
      if (startConversationWith) {
        startConversationWith(item);
      } else {
        alert(`Connected with ${item.name}!`);
      }
      
      if (contentType === 'creators') {
        creators = [...creators];
      } else if (contentType === 'researchers') {
        researchers = [...researchers];
      }
    } else {
      alert('Failed to connect. Please try again.');
    }
  }
  
  function handleViewProfile(item) {
    alert(`View profile for ${item.name} - This would open a detailed profile modal/page.`);
  }
  
  function handleEmailContact(item) {
    alert(`Contact ${item.name} - This would open an email composer or messaging system.`);
  }
  
  function handleMemberClick(member) {
    alert(`Contact ${member.name} (${member.role}) - This would open a detailed researcher profile or contact form.`);
  }
  
  // Reactive updates
  $: {
    if (!loading) {
      updateResults();
    }
  }
</script>

<div class="min-h-screen bg-base-100">
  <!-- Header -->
  <div class="hero bg-gradient-to-r from-primary to-secondary text-primary-content py-12">
    <div class="hero-content text-center">
      <div class="max-w-md">
        <h1 class="text-5xl font-bold">Discover & Connect</h1>
        <p class="py-6">Find creators, researchers, and research groups to collaborate with</p>
      </div>
    </div>
  </div>
  
  <!-- Content Type Tabs -->
  <div class="container mx-auto px-4 -mt-8">
    <div class="tabs tabs-boxed bg-white shadow-lg justify-center">
      <button 
        class="tab tab-lg" 
        class:tab-active={contentType === 'creators'}
        on:click={() => changeContentType('creators')}
      >
        <span class="mr-2">👥</span>
        Content Creators ({creators.length})
      </button>
      <button 
        class="tab tab-lg" 
        class:tab-active={contentType === 'researchers'}
        on:click={() => changeContentType('researchers')}
      >
        <span class="mr-2">🔬</span>
        Researchers ({researchers.length})
      </button>
      <button 
        class="tab tab-lg" 
        class:tab-active={contentType === 'research-groups'}
        on:click={() => changeContentType('research-groups')}
      >
        <span class="mr-2">🏛️</span>
        Research Groups ({researchGroups.length})
      </button>
    </div>
  </div>
  
  <!-- Search and Filters -->
  <div class="container mx-auto px-4 mt-8">
    <div class="card bg-white shadow-lg">
      <div class="card-body">
        <div class="flex flex-wrap gap-4 items-center">
          <!-- Search Input -->
          <div class="flex-1 min-w-80">
            <div class="form-control">
              <div class="input-group">
                <span class="bg-base-200">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
                  </svg>
                </span>
                <input 
                  type="text" 
                  placeholder={contentType === 'creators' ? 'Search creators...' : 
                              contentType === 'researchers' ? 'Search researchers...' : 
                              'Search research groups...'} 
                  bind:value={searchQuery}
                  class="input input-bordered flex-1"
                />
              </div>
            </div>
          </div>
          
          <!-- Filters -->
          {#if contentType === 'creators'}
            <select class="select select-bordered" bind:value={sortBy}>
              <option value="match">Best Match</option>
              <option value="audience">Audience Size</option>
              <option value="name">Name (A-Z)</option>
              <option value="platform">Platform</option>
              <option value="specialization">Specialization</option>
            </select>
            
            <select class="select select-bordered" bind:value={filterTopic}>
              <option value="all">All Topics</option>
              {#each availableTopics as topic}
                <option value={topic}>{topic}</option>
              {/each}
            </select>
          {:else if contentType === 'researchers'}
            <select class="select select-bordered" bind:value={sortBy}>
              <option value="match">Best Match</option>
              <option value="publications">Publications (High to Low)</option>
              <option value="h_index">H-Index (High to Low)</option>
              <option value="name">Name (A-Z)</option>
              <option value="institution">Institution (A-Z)</option>
              <option value="field">Field (A-Z)</option>
              <option value="availability">Availability</option>
            </select>
            
            <select class="select select-bordered" bind:value={filterField}>
              <option value="all">All Fields</option>
              {#each availableFields as field}
                <option value={field}>{field}</option>
              {/each}
            </select>
          {:else if contentType === 'research-groups'}
            <select class="select select-bordered" bind:value={sortBy}>
              <option value="name">Lab Name</option>
              <option value="university">University</option>
              <option value="head">Lab Head</option>
              <option value="members">Team Size</option>
            </select>
            
            <select class="select select-bordered" bind:value={filterUniversity}>
              <option value="all">All Universities</option>
              {#each universities as university}
                <option value={university.name}>{university.name}</option>
              {/each}
            </select>
            
            <select class="select select-bordered" bind:value={filterFocusArea}>
              <option value="all">All Areas</option>
              {#each focusAreas as area}
                <option value={area}>{area}</option>
              {/each}
            </select>
          {/if}
          
          <!-- View Toggle -->
          <div class="join">
            <button 
              class="join-item btn btn-sm" 
              class:bg-primary={viewMode === 'card'}
              class:text-primary-content={viewMode === 'card'}
              on:click={() => viewMode = 'card'}
              aria-label="Card view"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button 
              class="join-item btn btn-sm" 
              class:bg-primary={viewMode === 'compact'}
              class:text-primary-content={viewMode === 'compact'}
              on:click={() => viewMode = 'compact'}
              aria-label="Compact view"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Results -->
  <div class="container mx-auto px-4 mt-8 pb-12">
    {#if loading}
      <div class="flex justify-center items-center py-12">
        <div class="loading loading-spinner loading-lg"></div>
        <span class="ml-4 text-lg">Loading {contentType}...</span>
      </div>
    {:else if filteredResults.length === 0}
      <div class="text-center py-12">
        <div class="text-6xl mb-4">🔍</div>
        <h3 class="text-2xl font-bold mb-2">No {contentType.replace('-', ' ')} found</h3>
        <p class="text-base-content/70">Try adjusting your search terms or filters</p>
      </div>
    {:else}
      <!-- Results Header -->
      <div class="mb-6">
        <h3 class="text-xl font-semibold">
          {filteredResults.length} {contentType === 'creators' ? 'Content Creator' : 
                                   contentType === 'researchers' ? 'Researcher' : 
                                   'Research Group'}{filteredResults.length !== 1 ? 's' : ''}
        </h3>
      </div>
      
      <!-- Results Grid -->
      {#if viewMode === 'card'}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {#each filteredResults as item}
            <UserCard 
              user={item} 
              variant="full"
              showMatchScore={contentType !== 'research-groups'}
              onConnect={handleConnect}
              onStartConversation={startConversationWith}
            />
          {/each}
        </div>
      {:else}
        <!-- Compact View -->
        <div class="space-y-2">
          {#each filteredResults as item}
            <UserCard 
              user={item} 
              variant="compact"
              showMatchScore={contentType !== 'research-groups'}
              onConnect={handleConnect}
              onViewProfile={handleViewProfile}
            />
          {/each}
        </div>
      {/if}
    {/if}
  </div>
</div>