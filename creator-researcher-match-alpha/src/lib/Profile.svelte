<script>
  import { onMount } from 'svelte';
  import { saveProfile } from './profileService.js';
  import { currentProfile } from './profileStore.js';
  
  let profile = {};
  let editing = false;
  let tempProfile = {};
  let loading = true;
  let activeTab = 'overview';
  let showPublicationForm = false;
  let newPublication = {
    title: '',
    authors: '',
    journal: '',
    year: new Date().getFullYear(),
    link: ''
  };
  let showCollaborationForm = false;
  let newCollaboration = {
    name: '',
    institution: '',
    project: '',
    year: new Date().getFullYear(),
    outcome: ''
  };
  
  const availablePlatforms = [
    { id: 'youtube', name: 'YouTube', icon: '📺' },
    { id: 'tiktok', name: 'TikTok', icon: '🎵' },
    { id: 'instagram', name: 'Instagram', icon: '📷' },
    { id: 'twitter', name: 'Twitter/X', icon: '🐦' },
    { id: 'podcast', name: 'Podcast', icon: '🎙️' },
    { id: 'blog', name: 'Blog/Website', icon: '✍️' },
    { id: 'linkedin', name: 'LinkedIn', icon: '💼' },
    { id: 'twitch', name: 'Twitch', icon: '🎮' }
  ];
  
  const contentTypes = [
    'Educational Explainers',
    'Interview/Discussion',
    'Documentary Style',
    'Short-form Content',
    'Live Streams',
    'Tutorial/How-to',
    'News/Current Events',
    'Entertainment/Comedy'
  ];
  
  const audienceDemographics = [
    'General Audience',
    'Students (13-18)',
    'Young Adults (18-25)',
    'Professionals (25-40)',
    'Academia/Researchers',
    'Industry Professionals',
    'Parents/Families',
    'Seniors (50+)'
  ];
  
  // React to profile changes
  $: if ($currentProfile) {
    profile = $currentProfile;
    tempProfile = {...profile};
  }

  onMount(() => {
    // Load profile from profileService (includes Dr. Eshin Jolly's demo data)
    profile = $currentProfile;
    tempProfile = {...profile};
    loading = false;
  });
  
  function startEdit() {
    editing = true;
    tempProfile = {...profile};
  }
  
  function handleSaveProfile() {
    // Save using profileService
    const success = saveProfile(tempProfile);
    if (success) {
      profile = {...tempProfile};
      editing = false;
      alert('Profile saved successfully!');
    } else {
      alert('Error saving profile. Please try again.');
    }
  }
  
  function cancelEdit() {
    tempProfile = {...profile};
    editing = false;
  }
  
  function addTopic() {
    const newTopic = prompt('Enter a new topic:');
    if (newTopic && newTopic.trim()) {
      if (!tempProfile.topics) tempProfile.topics = [];
      if (!tempProfile.topics.includes(newTopic.trim())) {
        tempProfile.topics = [...tempProfile.topics, newTopic.trim()];
      }
    }
  }
  
  function removeTopic(topic) {
    if (tempProfile.topics) {
      tempProfile.topics = tempProfile.topics.filter(t => t !== topic);
    }
  }
  
  function addPublication() {
    if (!tempProfile.publications) tempProfile.publications = [];
    tempProfile.publications = [...tempProfile.publications, {...newPublication, id: Date.now()}];
    newPublication = {
      title: '',
      authors: '',
      journal: '',
      year: new Date().getFullYear(),
      link: ''
    };
    showPublicationForm = false;
  }
  
  function removePublication(id) {
    if (tempProfile.publications) {
      tempProfile.publications = tempProfile.publications.filter(p => p.id !== id);
    }
  }
  
  function addCollaboration() {
    if (!tempProfile.collaborations) tempProfile.collaborations = [];
    tempProfile.collaborations = [...tempProfile.collaborations, {...newCollaboration, id: Date.now()}];
    newCollaboration = {
      name: '',
      institution: '',
      project: '',
      year: new Date().getFullYear(),
      outcome: ''
    };
    showCollaborationForm = false;
  }
  
  function removeCollaboration(id) {
    if (tempProfile.collaborations) {
      tempProfile.collaborations = tempProfile.collaborations.filter(c => c.id !== id);
    }
  }
  
  function addSkill() {
    const newSkill = prompt('Enter a new skill:');
    if (newSkill && newSkill.trim()) {
      if (!tempProfile.skills) tempProfile.skills = [];
      if (!tempProfile.skills.includes(newSkill.trim())) {
        tempProfile.skills = [...tempProfile.skills, newSkill.trim()];
      }
    }
  }
  
  function removeSkill(skill) {
    if (tempProfile.skills) {
      tempProfile.skills = tempProfile.skills.filter(s => s !== skill);
    }
  }
  
  function togglePlatformPreference(platformId, level) {
    if (!tempProfile.platformPreferences) {
      tempProfile.platformPreferences = { primary: '', secondary: [], avoid: [] };
    }
    
    const prefs = tempProfile.platformPreferences;
    
    // Remove from all arrays first
    if (prefs.primary === platformId) prefs.primary = '';
    prefs.secondary = prefs.secondary.filter(p => p !== platformId);
    prefs.avoid = prefs.avoid.filter(p => p !== platformId);
    
    // Add to appropriate level
    if (level === 'primary') {
      prefs.primary = platformId;
    } else if (level === 'secondary') {
      prefs.secondary.push(platformId);
    } else if (level === 'avoid') {
      prefs.avoid.push(platformId);
    }
    
    // Trigger reactivity
    tempProfile = { ...tempProfile };
  }
  
  function getPlatformPreference(platformId) {
    if (!tempProfile.platformPreferences) return 'none';
    const prefs = tempProfile.platformPreferences;
    
    if (prefs.primary === platformId) return 'primary';
    if (prefs.secondary?.includes(platformId)) return 'secondary';
    if (prefs.avoid?.includes(platformId)) return 'avoid';
    return 'none';
  }
  
  function toggleContentType(type) {
    if (!tempProfile.preferredContentTypes) tempProfile.preferredContentTypes = [];
    
    if (tempProfile.preferredContentTypes.includes(type)) {
      tempProfile.preferredContentTypes = tempProfile.preferredContentTypes.filter(t => t !== type);
    } else {
      tempProfile.preferredContentTypes = [...tempProfile.preferredContentTypes, type];
    }
  }
  
  function toggleAudienceDemographic(demo) {
    if (!tempProfile.targetAudience) tempProfile.targetAudience = [];
    
    if (tempProfile.targetAudience.includes(demo)) {
      tempProfile.targetAudience = tempProfile.targetAudience.filter(d => d !== demo);
    } else {
      tempProfile.targetAudience = [...tempProfile.targetAudience, demo];
    }
  }
</script>

<div class="profile-container">
  <h1>My Profile</h1>
  
  {#if loading}
    <p>Loading...</p>
  {:else if editing}
    <!-- Edit Mode -->
    <form class="profile-form" on:submit|preventDefault={handleSaveProfile}>
      <div class="form-group">
        <label for="name">Name *</label>
        <input id="name" type="text" bind:value={tempProfile.name} required />
      </div>
      
      <div class="form-group">
        <label for="email">Email *</label>
        <input id="email" type="email" bind:value={tempProfile.email} required />
      </div>
      
      <div class="form-group">
        <label for="bio">Bio *</label>
        <textarea id="bio" bind:value={tempProfile.bio} rows="4" required></textarea>
      </div>
      
      <div class="form-group">
        <fieldset>
          <legend>I am a *</legend>
          <div class="user-type-selection">
            <div class="user-type-option">
              <label class="type-card {tempProfile.type === 'creator' ? 'selected' : ''}">
                <input type="radio" bind:group={tempProfile.type} value="creator" name="userType" />
                <div class="type-icon">👥</div>
                <div class="type-info">
                  <h4>Content Creator</h4>
                  <p>I create educational content and want to collaborate with researchers</p>
                  <span class="collaboration-note">You can connect with: Researchers</span>
                </div>
              </label>
            </div>
            <div class="user-type-option">
              <label class="type-card {tempProfile.type === 'researcher' ? 'selected' : ''}">
                <input type="radio" bind:group={tempProfile.type} value="researcher" name="userType" />
                <div class="type-icon">🔬</div>
                <div class="type-info">
                  <h4>Researcher</h4>
                  <p>I conduct research and want to collaborate with content creators</p>
                  <span class="collaboration-note">You can connect with: Content Creators</span>
                </div>
              </label>
            </div>
          </div>
        </fieldset>
      </div>
      
      {#if tempProfile.type === 'creator'}
        <div class="form-group">
          <label for="platform">Primary Platform</label>
          <select id="platform" bind:value={tempProfile.platform}>
            <option value="YouTube">YouTube</option>
            <option value="TikTok">TikTok</option>
            <option value="Instagram">Instagram</option>
            <option value="Twitter">Twitter</option>
            <option value="Podcast">Podcast</option>
            <option value="Blog">Blog</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="subscribers">Subscriber/Follower Count</label>
          <input id="subscribers" type="text" bind:value={tempProfile.subscribers} placeholder="e.g., 10K, 1M, 50K" />
        </div>
      {:else if tempProfile.type === 'researcher'}
        <div class="form-group">
          <label for="institution">Institution</label>
          <input id="institution" type="text" bind:value={tempProfile.institution} placeholder="University or Research Institute" />
        </div>
        
        <div class="form-group">
          <label for="field">Research Field</label>
          <input id="field" type="text" bind:value={tempProfile.field} placeholder="e.g., Computer Science, Biology, Physics" />
        </div>
        
        <div class="form-group">
          <label for="expertise">Expertise</label>
          <input id="expertise" type="text" bind:value={tempProfile.expertise} placeholder="Your specific areas of expertise" />
        </div>
        
        <div class="form-group">
          <label for="h_index">H-Index</label>
          <input id="h_index" type="number" bind:value={tempProfile.h_index} placeholder="Your h-index" />
        </div>
        
        <div class="form-group">
          <label for="citations">Total Citations</label>
          <input id="citations" type="number" bind:value={tempProfile.citations} placeholder="Total number of citations" />
        </div>
        
        <div class="form-group">
          <fieldset>
            <legend>Publications</legend>
            {#if tempProfile.publications && tempProfile.publications.length > 0}
              <div class="items-list">
                {#each tempProfile.publications as pub}
                  <div class="item-card">
                    <h4>{pub.title}</h4>
                    <p>{pub.authors} • {pub.journal} • {pub.year}</p>
                    {#if pub.link}
                      <a href={pub.link} target="_blank">View Publication</a>
                    {/if}
                    <button type="button" class="remove-btn" on:click={() => removePublication(pub.id)}>×</button>
                  </div>
                {/each}
              </div>
            {/if}
            <button type="button" class="add-btn" on:click={() => showPublicationForm = !showPublicationForm}>
              {showPublicationForm ? 'Cancel' : 'Add Publication'}
            </button>
            
            {#if showPublicationForm}
              <div class="sub-form">
                <input type="text" bind:value={newPublication.title} placeholder="Publication Title" required />
                <input type="text" bind:value={newPublication.authors} placeholder="Authors" required />
                <input type="text" bind:value={newPublication.journal} placeholder="Journal/Conference" required />
                <input type="number" bind:value={newPublication.year} placeholder="Year" min="1900" max="2025" />
                <input type="url" bind:value={newPublication.link} placeholder="Link (optional)" />
                <button type="button" on:click={addPublication} disabled={!newPublication.title || !newPublication.authors || !newPublication.journal}>Save Publication</button>
              </div>
            {/if}
          </fieldset>
        </div>
        
        <div class="form-group">
          <fieldset>
            <legend>Skills & Methodologies</legend>
            {#if tempProfile.skills && tempProfile.skills.length > 0}
              <div class="topics-list">
                {#each tempProfile.skills as skill}
                  <span class="topic-tag">
                    {skill}
                    <button type="button" class="remove-topic" on:click={() => removeSkill(skill)}>×</button>
                  </span>
                {/each}
              </div>
            {/if}
            <button type="button" class="add-topic-btn" on:click={addSkill}>Add Skill</button>
          </fieldset>
        </div>
      {/if}
      
      <div class="form-group">
        <label for="availability">Availability</label>
        <select id="availability" bind:value={tempProfile.availability}>
          <option value="Open to collaborations">Open to collaborations</option>
          <option value="Limited availability">Limited availability</option>
          <option value="Not available">Not available</option>
          <option value="Open to media appearances">Open to media appearances</option>
          <option value="Available for interviews">Available for interviews</option>
        </select>
      </div>
      
      <!-- Platform Preferences -->
      <div class="form-group">
        <fieldset>
          <legend>Platform Preferences</legend>
          <p class="platform-help">Select your preferred platforms for collaboration</p>
          
          <div class="platform-grid">
            {#each availablePlatforms as platform}
              <div class="platform-item">
                <div class="platform-header">
                  <span class="platform-icon">{platform.icon}</span>
                  <span class="platform-name">{platform.name}</span>
                </div>
                <div class="platform-buttons">
                  <button 
                    type="button" 
                    class="platform-btn {getPlatformPreference(platform.id) === 'primary' ? 'active primary' : ''}"
                    on:click={() => togglePlatformPreference(platform.id, getPlatformPreference(platform.id) === 'primary' ? 'none' : 'primary')}
                  >
                    Primary
                  </button>
                  <button 
                    type="button" 
                    class="platform-btn {getPlatformPreference(platform.id) === 'secondary' ? 'active secondary' : ''}"
                    on:click={() => togglePlatformPreference(platform.id, getPlatformPreference(platform.id) === 'secondary' ? 'none' : 'secondary')}
                  >
                    Open to
                  </button>
                  <button 
                    type="button" 
                    class="platform-btn {getPlatformPreference(platform.id) === 'avoid' ? 'active avoid' : ''}"
                    on:click={() => togglePlatformPreference(platform.id, getPlatformPreference(platform.id) === 'avoid' ? 'none' : 'avoid')}
                  >
                    Avoid
                  </button>
                </div>
              </div>
            {/each}
          </div>
        </fieldset>
      </div>
      
      <!-- Content Type Preferences -->
      <div class="form-group">
        <fieldset>
          <legend>Preferred Content Types</legend>
          <div class="checkbox-grid">
            {#each contentTypes as type}
              <label class="checkbox-item">
                <input 
                  type="checkbox" 
                  checked={tempProfile.preferredContentTypes?.includes(type) || false}
                  on:change={() => toggleContentType(type)}
                />
                <span>{type}</span>
              </label>
            {/each}
          </div>
        </fieldset>
      </div>
      
      <!-- Target Audience -->
      <div class="form-group">
        <fieldset>
          <legend>Target Audience</legend>
          <div class="checkbox-grid">
            {#each audienceDemographics as demo}
              <label class="checkbox-item">
                <input 
                  type="checkbox" 
                  checked={tempProfile.targetAudience?.includes(demo) || false}
                  on:change={() => toggleAudienceDemographic(demo)}
                />
                <span>{demo}</span>
              </label>
            {/each}
          </div>
        </fieldset>
      </div>
      
      {#if tempProfile.type === 'creator'}
        <div class="form-group">
          <label for="audienceSize">Typical Audience Size</label>
          <select id="audienceSize" bind:value={tempProfile.audienceSize}>
            <option value="<1K">Under 1,000</option>
            <option value="1K-10K">1,000 - 10,000</option>
            <option value="10K-100K">10,000 - 100,000</option>
            <option value="100K-1M">100,000 - 1 Million</option>
            <option value="1M+">Over 1 Million</option>
          </select>
        </div>
      {/if}
      
      <div class="form-group">
        <fieldset>
          <legend>Topics of Interest</legend>
          {#if tempProfile.topics && tempProfile.topics.length > 0}
            <div class="topics-list" role="list" aria-label="Selected topics">
              {#each tempProfile.topics as topic}
                <span class="topic-tag" role="listitem">
                  {topic}
                  <button type="button" class="remove-topic" on:click={() => removeTopic(topic)} aria-label="Remove {topic}">×</button>
                </span>
              {/each}
            </div>
          {/if}
          <button type="button" class="add-topic-btn" on:click={addTopic} aria-label="Add new topic">Add Topic</button>
        </fieldset>
      </div>
      
      <div class="form-group">
        <fieldset>
          <legend>{tempProfile.type === 'researcher' ? 'Collaboration History' : 'Content Collaborations'}</legend>
            {#if tempProfile.collaborations && tempProfile.collaborations.length > 0}
              <div class="items-list">
                {#each tempProfile.collaborations as collab}
                  <div class="item-card">
                    <h4>{collab.project}</h4>
                    <p><strong>{collab.name}</strong> • {collab.institution} • {collab.year}</p>
                    {#if collab.outcome}
                      <p class="outcome">{collab.outcome}</p>
                    {/if}
                    <button type="button" class="remove-btn" on:click={() => removeCollaboration(collab.id)}>×</button>
                  </div>
                {/each}
              </div>
            {/if}
            <button type="button" class="add-btn" on:click={() => showCollaborationForm = !showCollaborationForm}>
              {showCollaborationForm ? 'Cancel' : 'Add Collaboration'}
            </button>
            
            {#if showCollaborationForm}
              <div class="sub-form">
                <input type="text" bind:value={newCollaboration.name} placeholder="Collaborator Name" required />
                <input type="text" bind:value={newCollaboration.institution} placeholder={tempProfile.type === 'researcher' ? 'Institution' : 'Platform/Institution'} required />
                <input type="text" bind:value={newCollaboration.project} placeholder="Project/Topic" required />
                <input type="number" bind:value={newCollaboration.year} placeholder="Year" min="1900" max="2025" />
                <textarea bind:value={newCollaboration.outcome} placeholder={tempProfile.type === 'researcher' ? 'Outcome (publications, presentations, etc.)' : 'Outcome (videos, views, engagement, etc.)'} rows="2"></textarea>
                <button type="button" on:click={addCollaboration} disabled={!newCollaboration.name || !newCollaboration.project}>Save Collaboration</button>
              </div>
            {/if}
          </fieldset>
        </div>
      
      <div class="form-actions">
        <button type="submit" class="save-btn">Save Changes</button>
        <button type="button" class="cancel-btn" on:click={cancelEdit}>Cancel</button>
      </div>
    </form>
  {:else}
    <!-- View Mode -->
    <div class="profile-view">
        <div class="profile-header">
          <div class="avatar">{profile.name.charAt(0)}</div>
          <div class="profile-info">
            <h2>{profile.name}</h2>
            <p class="email">{profile.email}</p>
            <span class="user-type">{profile.type === 'creator' ? '👥 Creator' : '🔬 Researcher'}</span>
            {#if profile.type === 'researcher' && (profile.h_index || profile.citations)}
              <div class="metrics">
                {#if profile.h_index}
                  <span class="metric">H-Index: <strong>{profile.h_index}</strong></span>
                {/if}
                {#if profile.citations}
                  <span class="metric">Citations: <strong>{profile.citations}</strong></span>
                {/if}
              </div>
            {/if}
          </div>
          <button class="edit-btn" on:click={startEdit}>Edit Profile</button>
        </div>
        
        {#if profile.type === 'researcher'}
          <div class="tabs">
            <button class="tab" class:active={activeTab === 'overview'} on:click={() => activeTab = 'overview'}>Overview</button>
            <button class="tab" class:active={activeTab === 'publications'} on:click={() => activeTab = 'publications'}>Publications</button>
            <button class="tab" class:active={activeTab === 'collaborations'} on:click={() => activeTab = 'collaborations'}>Collaborations</button>
            <button class="tab" class:active={activeTab === 'skills'} on:click={() => activeTab = 'skills'}>Skills</button>
          </div>
        {/if}
        
        <div class="profile-content">
          {#if profile.type === 'creator' || activeTab === 'overview'}
            <div class="section">
              <h3>Bio</h3>
              <p>{profile.bio}</p>
            </div>
            
            {#if profile.type === 'creator'}
              <div class="section">
                <h3>Platform</h3>
                <p>{profile.platform}</p>
                {#if profile.subscribers}
                  <p><strong>Followers:</strong> {profile.subscribers}</p>
                {/if}
              </div>
            {:else if profile.type === 'researcher'}
              <div class="section">
                <h3>Institution & Field</h3>
                <p>{profile.institution}</p>
                <p><strong>Field:</strong> {profile.field}</p>
              </div>
              
              {#if profile.expertise}
                <div class="section">
                  <h3>Expertise</h3>
                  <p>{profile.expertise}</p>
                </div>
              {/if}
            {/if}
            
            <div class="section">
              <h3>Availability</h3>
              <span class="availability {profile.availability?.includes('Open') ? 'available' : 'limited'}">{profile.availability}</span>
            </div>
            
            {#if profile.topics && profile.topics.length > 0}
              <div class="section">
                <h3>Topics of Interest</h3>
                <div class="topics-display">
                  {#each profile.topics as topic}
                    <span class="topic-tag">{topic}</span>
                  {/each}
                </div>
              </div>
            {/if}
            
            {#if profile.platformPreferences}
              <div class="section">
                <h3>Platform Preferences</h3>
                <div class="platform-preferences-display">
                  {#if profile.platformPreferences.primary}
                    <div class="preference-group">
                      <h4>Primary Platform:</h4>
                      <span class="platform-badge primary">
                        {availablePlatforms.find(p => p.id === profile.platformPreferences.primary)?.icon} 
                        {availablePlatforms.find(p => p.id === profile.platformPreferences.primary)?.name}
                      </span>
                    </div>
                  {/if}
                  
                  {#if profile.platformPreferences.secondary?.length > 0}
                    <div class="preference-group">
                      <h4>Open to:</h4>
                      <div class="platform-badges">
                        {#each profile.platformPreferences.secondary as platformId}
                          <span class="platform-badge secondary">
                            {availablePlatforms.find(p => p.id === platformId)?.icon} 
                            {availablePlatforms.find(p => p.id === platformId)?.name}
                          </span>
                        {/each}
                      </div>
                    </div>
                  {/if}
                </div>
              </div>
            {/if}
            
            {#if profile.preferredContentTypes?.length > 0}
              <div class="section">
                <h3>Preferred Content Types</h3>
                <div class="content-types-display">
                  {#each profile.preferredContentTypes as type}
                    <span class="content-type-tag">{type}</span>
                  {/each}
                </div>
              </div>
            {/if}
            
            {#if profile.targetAudience?.length > 0}
              <div class="section">
                <h3>Target Audience</h3>
                <div class="audience-display">
                  {#each profile.targetAudience as demo}
                    <span class="audience-tag">{demo}</span>
                  {/each}
                </div>
              </div>
            {/if}
          {/if}
          
          {#if profile.type === 'researcher' && activeTab === 'publications'}
            <div class="section">
              <h3>Publications ({profile.publications?.length || 0})</h3>
              {#if profile.publications && profile.publications.length > 0}
                <div class="publications-list">
                  {#each profile.publications as pub}
                    <div class="publication-item">
                      <h4>{pub.title}</h4>
                      <p class="authors">{pub.authors}</p>
                      <p class="journal">{pub.journal} • {pub.year}</p>
                      {#if pub.link}
                        <a href={pub.link} target="_blank" class="pub-link">View Publication →</a>
                      {/if}
                    </div>
                  {/each}
                </div>
              {:else}
                <p class="empty-state">No publications added yet.</p>
              {/if}
            </div>
          {/if}
          
          {#if activeTab === 'collaborations'}
            <div class="section">
              <h3>{profile.type === 'researcher' ? 'Collaboration History' : 'Content Collaborations'}</h3>
              {#if profile.collaborations && profile.collaborations.length > 0}
                <div class="collaborations-list">
                  {#each profile.collaborations as collab}
                    {#if profile.type === 'researcher'}
                      <div class="collaboration-item">
                        <h4>{collab.project}</h4>
                        <p class="collaborator"><strong>{collab.name}</strong> • {collab.institution}</p>
                        <p class="year">{collab.year}</p>
                        {#if collab.outcome}
                          <p class="outcome">{collab.outcome}</p>
                        {/if}
                      </div>
                    {:else}
                      <!-- Content Creator Layout -->
                      <div class="collaboration-item creator-collab">
                        <div class="collab-header">
                          <h4>📹 {collab.project}</h4>
                          <span class="collab-year">{collab.year}</span>
                        </div>
                        <div class="collab-partner">
                          <span class="partner-icon">🤝</span>
                          <div class="partner-info">
                            <p class="partner-name"><strong>{collab.name}</strong></p>
                            <p class="partner-platform">{collab.institution}</p>
                          </div>
                        </div>
                        {#if collab.outcome}
                          <div class="collab-results">
                            <span class="results-icon">📊</span>
                            <p class="outcome-creator">{collab.outcome}</p>
                          </div>
                        {/if}
                      </div>
                    {/if}
                  {/each}
                </div>
              {:else}
                <p class="empty-state">{profile.type === 'researcher' ? 'No collaborations added yet.' : 'No content collaborations yet. Partner with researchers to create engaging science content!'}</p>
              {/if}
            </div>
          {/if}
          
          {#if profile.type === 'researcher' && activeTab === 'skills'}
            <div class="section">
              <h3>Skills & Methodologies</h3>
              {#if profile.skills && profile.skills.length > 0}
                <div class="skills-grid">
                  {#each profile.skills as skill}
                    <div class="skill-item">{skill}</div>
                  {/each}
                </div>
              {:else}
                <p class="empty-state">No skills added yet.</p>
              {/if}
            </div>
          {/if}
        </div>
      </div>
  {/if}
</div>

<style>
  .profile-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
  }
  
  h1 {
    color: #333;
    margin-bottom: 2rem;
  }
  
  .profile-form {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
  
  .form-group {
    margin-bottom: 1.5rem;
  }
  
  label, legend {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: bold;
    color: #333;
  }
  
  input, textarea, select {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
  }
  
  input:focus, textarea:focus, select:focus {
    outline: none;
    border-color: #646cff;
  }
  
  fieldset {
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 1rem;
    margin: 0;
  }
  
  .user-type-selection {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-top: 0.5rem;
  }
  
  .user-type-option {
    position: relative;
  }
  
  .type-card {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1.5rem;
    border: 2px solid #e0e0e0;
    border-radius: 12px;
    background: #fafafa;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
  }
  
  .type-card:hover {
    border-color: #646cff;
    background: #f8f9ff;
  }
  
  .type-card.selected {
    border-color: #646cff;
    background: #f0f4ff;
    box-shadow: 0 4px 12px rgba(100, 108, 255, 0.2);
  }
  
  .type-card input[type="radio"] {
    position: absolute;
    opacity: 0;
    margin: 0;
  }
  
  .type-icon {
    font-size: 2rem;
    flex-shrink: 0;
  }
  
  .type-info {
    flex: 1;
  }
  
  .type-info h4 {
    margin: 0 0 0.5rem 0;
    color: #333;
    font-size: 1.1rem;
  }
  
  .type-info p {
    margin: 0 0 0.75rem 0;
    color: #666;
    font-size: 0.9rem;
    line-height: 1.4;
  }
  
  .collaboration-note {
    display: inline-block;
    background: #e8f4fd;
    color: #0066cc;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: 500;
  }
  
  .type-card.selected .collaboration-note {
    background: #646cff;
    color: white;
  }
  
  .topics-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
  
  .topic-tag {
    background: #f0f0f0;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.9rem;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .remove-topic {
    background: none;
    border: none;
    color: #999;
    cursor: pointer;
    font-size: 1.2rem;
    padding: 0;
    line-height: 1;
  }
  
  .remove-topic:hover {
    color: #ff4444;
  }
  
  .add-topic-btn {
    background: #646cff;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .add-topic-btn:hover {
    background: #535bf2;
  }
  
  .form-actions {
    display: flex;
    gap: 1rem;
    margin-top: 2rem;
  }
  
  .save-btn {
    background: #646cff;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
  }
  
  .save-btn:hover {
    background: #535bf2;
  }
  
  .cancel-btn {
    background: #f0f0f0;
    color: #333;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
  }
  
  .cancel-btn:hover {
    background: #e0e0e0;
  }
  
  
  .profile-view {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    overflow: hidden;
  }
  
  .profile-header {
    background: #f8f9fa;
    padding: 2rem;
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  
  .avatar {
    width: 80px;
    height: 80px;
    background: #646cff;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    font-weight: bold;
  }
  
  .profile-info {
    flex: 1;
  }
  
  .profile-info h2 {
    margin: 0 0 0.5rem 0;
    color: #333;
  }
  
  .email {
    color: #666;
    margin: 0 0 0.5rem 0;
  }
  
  .user-type {
    background: #646cff;
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.9rem;
  }
  
  .edit-btn {
    background: #646cff;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .edit-btn:hover {
    background: #535bf2;
  }
  
  .profile-content {
    padding: 2rem;
  }
  
  .section {
    margin-bottom: 2rem;
  }
  
  .section h3 {
    color: #333;
    margin-bottom: 0.5rem;
  }
  
  .section p {
    color: #666;
    line-height: 1.5;
    margin: 0.5rem 0;
  }
  
  .availability {
    padding: 0.5rem 1rem;
    border-radius: 4px;
    font-weight: bold;
  }
  
  .availability.available {
    background: #d4edda;
    color: #155724;
  }
  
  .availability.limited {
    background: #fff3cd;
    color: #856404;
  }
  
  .topics-display {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .topics-display .topic-tag {
    background: #f0f0f0;
  }
  
  .metrics {
    display: flex;
    gap: 1rem;
    margin-top: 0.5rem;
  }
  
  .metric {
    font-size: 0.9rem;
    color: #666;
  }
  
  .metric strong {
    color: #007bff;
  }
  
  .tabs {
    display: flex;
    border-bottom: 2px solid #e0e0e0;
    background-color: #fafbfc;
  }
  
  .tab {
    padding: 1rem 2rem;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1rem;
    color: #666;
    border-bottom: 2px solid transparent;
    margin-bottom: -2px;
    transition: all 0.2s;
  }
  
  .tab:hover {
    color: #333;
  }
  
  .tab.active {
    color: #007bff;
    border-bottom-color: #007bff;
  }
  
  .items-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1rem;
  }
  
  .item-card {
    position: relative;
    padding: 1rem;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    background: #fafbfc;
  }
  
  .item-card h4 {
    margin: 0 0 0.5rem;
    color: #333;
  }
  
  .item-card p {
    margin: 0.25rem 0;
    color: #666;
    font-size: 0.9rem;
  }
  
  .item-card a {
    color: #007bff;
    text-decoration: none;
    font-size: 0.9rem;
  }
  
  .item-card a:hover {
    text-decoration: underline;
  }
  
  .remove-btn {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    background: none;
    border: none;
    color: #999;
    font-size: 1.5rem;
    cursor: pointer;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
  }
  
  .remove-btn:hover {
    background: #fee;
    color: #dc3545;
  }
  
  .sub-form {
    margin-top: 1rem;
    padding: 1rem;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    background: #fafbfc;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .sub-form input,
  .sub-form textarea {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 0.9rem;
  }
  
  .sub-form button {
    align-self: flex-start;
    background: #007bff;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
  }
  
  .sub-form button:hover:not(:disabled) {
    background: #0056b3;
  }
  
  .sub-form button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .add-btn {
    background: #f0f0f0;
    color: #333;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
  }
  
  .add-btn:hover {
    background: #e0e0e0;
  }
  
  .publications-list {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  
  .publication-item {
    padding-bottom: 1.5rem;
    border-bottom: 1px solid #e0e0e0;
  }
  
  .publication-item:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
  
  .publication-item h4 {
    margin: 0 0 0.5rem;
    color: #333;
    font-size: 1.1rem;
  }
  
  .authors {
    color: #666;
    font-size: 0.9rem;
    margin: 0.25rem 0;
  }
  
  .journal {
    color: #999;
    font-size: 0.85rem;
    margin: 0.5rem 0;
  }
  
  .pub-link {
    color: #007bff;
    text-decoration: none;
    font-size: 0.9rem;
  }
  
  .pub-link:hover {
    text-decoration: underline;
  }
  
  .collaborations-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
  }
  
  .collaboration-item {
    padding: 1.5rem;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    background: #fafbfc;
  }
  
  .collaboration-item h4 {
    margin: 0 0 0.75rem;
    color: #007bff;
  }
  
  .collaborator {
    color: #333;
    margin: 0.25rem 0;
  }
  
  .year {
    color: #999;
    font-size: 0.9rem;
    margin: 0.25rem 0;
  }
  
  .outcome {
    margin-top: 0.75rem;
    padding-top: 0.75rem;
    border-top: 1px solid #e0e0e0;
    color: #666;
    font-style: italic;
  }

  /* Content Creator Collaboration Styles */
  .creator-collab {
    background: linear-gradient(135deg, #fff5f5, #ffffff);
    border-left: 4px solid #ff6b6b;
  }

  .collab-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .collab-header h4 {
    margin: 0;
    color: #ff6b6b;
    font-size: 1.1rem;
  }

  .collab-year {
    background: #ff6b6b;
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: 500;
  }

  .collab-partner {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .partner-icon {
    font-size: 1.5rem;
    flex-shrink: 0;
  }

  .partner-info {
    flex: 1;
  }

  .partner-name {
    margin: 0;
    color: #333;
    font-weight: 600;
  }

  .partner-platform {
    margin: 0.25rem 0 0;
    color: #666;
    font-size: 0.9rem;
  }

  .collab-results {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #ffe0e0;
  }

  .results-icon {
    font-size: 1.2rem;
    flex-shrink: 0;
    margin-top: 0.1rem;
  }

  .outcome-creator {
    margin: 0;
    color: #333;
    line-height: 1.4;
    background: #f8f9fa;
    padding: 0.75rem;
    border-radius: 6px;
    border-left: 3px solid #28a745;
  }
  
  .skills-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }
  
  .skill-item {
    padding: 0.5rem 1rem;
    background: #e3f2fd;
    color: #1976d2;
    border-radius: 20px;
    font-size: 0.9rem;
    font-weight: 500;
  }
  
  .empty-state {
    color: #999;
    font-style: italic;
    text-align: center;
    padding: 2rem;
  }
  
  /* Platform Preferences Styles */
  .platform-help {
    color: #666;
    font-size: 0.9rem;
    margin: 0 0 1rem;
    font-style: italic;
  }
  
  .platform-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
  }
  
  .platform-item {
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 1rem;
    background: #fafbfc;
  }
  
  .platform-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }
  
  .platform-icon {
    font-size: 1.2rem;
  }
  
  .platform-name {
    font-weight: 500;
    color: #333;
  }
  
  .platform-buttons {
    display: flex;
    gap: 0.5rem;
  }
  
  .platform-btn {
    flex: 1;
    padding: 0.4rem 0.6rem;
    border: 1px solid #ddd;
    background: white;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.8rem;
    transition: all 0.2s;
  }
  
  .platform-btn:hover {
    border-color: #007bff;
  }
  
  .platform-btn.active.primary {
    background: #007bff;
    color: white;
    border-color: #007bff;
  }
  
  .platform-btn.active.secondary {
    background: #28a745;
    color: white;
    border-color: #28a745;
  }
  
  .platform-btn.active.avoid {
    background: #dc3545;
    color: white;
    border-color: #dc3545;
  }
  
  .checkbox-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 0.5rem;
  }
  
  .checkbox-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .checkbox-item:hover {
    background-color: #f0f0f0;
  }
  
  .checkbox-item input[type="checkbox"] {
    width: auto;
    margin: 0;
  }
  
  /* Platform Preferences Display */
  .platform-preferences-display {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .preference-group h4 {
    margin: 0 0 0.5rem;
    color: #555;
    font-size: 0.9rem;
  }
  
  .platform-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .platform-badge {
    padding: 0.3rem 0.6rem;
    border-radius: 15px;
    font-size: 0.8rem;
    font-weight: 500;
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
  }
  
  .platform-badge.primary {
    background: #007bff;
    color: white;
  }
  
  .platform-badge.secondary {
    background: #e3f2fd;
    color: #1976d2;
    border: 1px solid #90caf9;
  }
  
  .content-types-display,
  .audience-display {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .content-type-tag,
  .audience-tag {
    padding: 0.3rem 0.6rem;
    background: #f0f8ff;
    color: #0066cc;
    border: 1px solid #b3d9ff;
    border-radius: 12px;
    font-size: 0.85rem;
  }
  
  @media (max-width: 768px) {
    .profile-container {
      padding: 1rem;
    }
    
    
    .user-type-selection {
      grid-template-columns: 1fr;
      gap: 0.75rem;
    }
    
    .type-card {
      padding: 1rem;
    }
    
    .type-icon {
      font-size: 1.5rem;
    }
    
    .topics-list {
      gap: 0.5rem;
    }
    
    .topic-tag {
      font-size: 0.8rem;
    }
  }
</style>