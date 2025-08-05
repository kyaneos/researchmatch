<script>
  import ParaphraseToolMini from './ParaphraseToolMini.svelte';
  import { addConnection, isConnected } from './profileService.js';
  
  export let user;
  export let variant = 'full'; // 'full', 'compact', 'magic'
  export let showActions = true;
  export let showMatchScore = true;
  export let onConnect = null;
  export let onViewProfile = null;
  export let onStartConversation = null;
  
  // Determine user type and extract relevant data
  $: userType = user.type || (user.platforms ? 'creator' : 'researcher');
  $: isCreator = userType === 'creator';
  $: isResearcher = userType === 'researcher';
  $: isResearchGroup = user.lab && user.university; // Research group detection
  
  // Avatar logic
  $: avatarText = isResearchGroup ? '🏛️' : user.name?.charAt(0) || '?';
  
  // Subtitle logic
  $: subtitle = (() => {
    if (isResearchGroup) return user.university;
    if (isCreator) return `${user.platforms?.join(', ') || ''} • ${user.audience_size || ''}`;
    if (isResearcher) return `${user.institution || ''} • ${user.field || ''}`;
    return '';
  })();
  
  // Topics/interests
  $: topics = user.topics || user.research_interests || [];
  
  // Connect handler
  async function handleConnect() {
    if (onConnect) {
      onConnect(user);
    } else if (onStartConversation) {
      onStartConversation(user);
    } else {
      // Default connect behavior
      await addConnection(user.id, user.name);
    }
  }
  
  // View profile handler
  function handleViewProfile() {
    if (onViewProfile) {
      onViewProfile(user);
    } else {
      // Default view profile behavior
      console.log('View profile for:', user.name);
    }
  }
  
  // Get compatibility display for magic matches
  $: compatibilityDisplay = user.compatibility || (user.magicScore ? {
    level: user.magicScore >= 80 ? 'Excellent' : user.magicScore >= 60 ? 'Good' : 'Fair',
    color: user.magicScore >= 80 ? '#28a745' : user.magicScore >= 60 ? '#17a2b8' : '#ffc107'
  } : null);
</script>

{#if variant === 'compact'}
  <!-- Compact variant for list views -->
  <div class="user-card compact">
    <div class="compact-content">
      <div class="compact-header">
        <div class="avatar-sm">
          <span>{avatarText}</span>
        </div>
        <div class="compact-info">
          <h4 class="compact-name">{isResearchGroup ? user.lab : user.name}</h4>
          <p class="compact-subtitle">{subtitle}</p>
        </div>
        {#if showMatchScore && (user.matchScore || user.magicScore)}
          <div class="match-score-sm">
            {user.matchScore || user.magicScore}%
          </div>
        {/if}
      </div>
      
      {#if showActions}
        <div class="compact-actions">
          <button class="action-btn primary" on:click={handleConnect}>
            Connect
          </button>
          <button class="action-btn secondary" on:click={handleViewProfile}>
            View
          </button>
        </div>
      {/if}
    </div>
  </div>

{:else if variant === 'magic'}
  <!-- Magic match variant with reasons and compatibility -->
  <div class="user-card magic-match">
    <div class="magic-header">
      <div class="avatar">
        <span>{avatarText}</span>
      </div>
      <div class="magic-info">
        <h3 class="magic-name">{user.name}</h3>
        <p class="magic-subtitle">{subtitle}</p>
        {#if compatibilityDisplay}
          <div class="compatibility-badge" style="background-color: {compatibilityDisplay.color}">
            {compatibilityDisplay.level}
          </div>
        {/if}
      </div>
      <div class="magic-score">
        {user.magicScore || user.matchScore}%
      </div>
    </div>
    
    <div class="magic-content">
      {#if user.matchReasons && user.matchReasons.length > 0}
        <div class="match-reasons">
          {#each user.matchReasons as reason}
            <span class="reason-tag">✓ {reason}</span>
          {/each}
        </div>
      {/if}
      
      {#if isCreator && user.specialization}
        <p class="specialization">{user.specialization}</p>
      {:else if isResearcher && user.expertise}
        <p class="expertise">{user.expertise}</p>
      {/if}
    </div>
    
    {#if showActions}
      <div class="magic-actions">
        <button class="connect-btn magic" on:click={handleConnect}>
          🤝 Connect Now
        </button>
      </div>
    {/if}
  </div>

{:else}
  <!-- Full variant for card grids -->
  <div class="user-card full">
    <div class="card-header">
      <div class="avatar">
        <span>{avatarText}</span>
      </div>
      <div class="user-info">
        <h3 class="user-name">{isResearchGroup ? user.lab : user.name}</h3>
        <p class="user-subtitle">{subtitle}</p>
      </div>
      {#if showMatchScore && (user.matchScore || user.magicScore)}
        <div class="match-score">
          {user.matchScore || user.magicScore}%
        </div>
      {/if}
    </div>
    
    <div class="card-content">
      {#if isCreator}
        <p class="bio">{user.bio}</p>
        {#if user.collaboration_notes}
          <p class="notes"><strong>Notes:</strong> {user.collaboration_notes}</p>
        {/if}
      {:else if isResearcher}
        <div class="field-section">
          <p class="field"><strong>Field:</strong> {user.field}</p>
        </div>
        
        {#if user.expertise}
          <div class="expertise-section">
            <p class="expertise"><strong>Expertise:</strong> {user.expertise}</p>
            <div class="paraphrase-mini">
              <ParaphraseToolMini 
                text={user.expertise} 
                context="profile"
              />
            </div>
          </div>
        {/if}
        
        {#if user.bio}
          <div class="bio-section">
            <p class="bio">{user.bio}</p>
            <div class="paraphrase-mini">
              <ParaphraseToolMini 
                text={user.bio} 
                context="profile"
              />
            </div>
          </div>
        {/if}
        
        {#if user.publications || user.h_index}
          <div class="metrics">
            {#if user.publications}
              <span class="metric">📄 {user.publications} papers</span>
            {/if}
            {#if user.h_index}
              <span class="metric">📊 h-index: {user.h_index}</span>
            {/if}
          </div>
        {/if}
        
        {#if user.availability}
          <p class="availability">
            <strong>Availability:</strong> 
            <span class="status {user.availability.toLowerCase().includes('open') ? 'open' : 'limited'}">
              {user.availability}
            </span>
          </p>
        {/if}
      {:else if isResearchGroup}
        <p class="lab-focus">{user.labFocus}</p>
        <p class="lab-head"><strong>Head:</strong> {user.labHead}</p>
        {#if user.members}
          <p class="members"><strong>Members:</strong> {user.members.length}</p>
        {/if}
      {/if}
      
      <!-- Topics/interests -->
      {#if topics.length > 0}
        <div class="topics">
          {#each topics.slice(0, 4) as topic}
            <span class="topic-tag">{topic}</span>
          {/each}
          {#if topics.length > 4}
            <span class="topic-tag more">+{topics.length - 4}</span>
          {/if}
        </div>
      {/if}
    </div>
    
    {#if showActions}
      <div class="card-actions">
        <button class="connect-btn" on:click={handleConnect}>
          Connect
        </button>
        <button class="view-profile-btn" on:click={handleViewProfile}>
          View Profile
        </button>
      </div>
    {/if}
  </div>
{/if}

<style>
  .user-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: all 0.2s ease;
    overflow: hidden;
  }
  
  .user-card:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }
  
  /* Full variant styles */
  .user-card.full {
    padding: 24px;
    min-height: 300px;
  }
  
  .card-header {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 20px;
  }
  
  .avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 600;
    font-size: 18px;
    flex-shrink: 0;
  }
  
  .user-info {
    flex: 1;
    min-width: 0;
  }
  
  .user-name {
    font-size: 18px;
    font-weight: 600;
    color: #1a1a1a;
    margin: 0 0 4px 0;
    line-height: 1.3;
  }
  
  .user-subtitle {
    font-size: 14px;
    color: #666;
    margin: 0;
    line-height: 1.4;
  }
  
  .match-score {
    background: #10b981;
    color: white;
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    flex-shrink: 0;
  }
  
  .card-content {
    margin-bottom: 20px;
  }
  
  .bio, .expertise, .field, .lab-focus {
    font-size: 14px;
    line-height: 1.5;
    color: #444;
    margin-bottom: 12px;
  }
  
  .expertise-section, .bio-section {
    margin-bottom: 16px;
  }
  
  .paraphrase-mini {
    margin-top: 8px;
  }
  
  .metrics {
    display: flex;
    gap: 16px;
    margin: 12px 0;
  }
  
  .metric {
    font-size: 12px;
    color: #666;
    background: #f8f9fa;
    padding: 4px 8px;
    border-radius: 4px;
  }
  
  .availability {
    font-size: 14px;
    margin: 12px 0;
  }
  
  .status.open {
    color: #10b981;
    font-weight: 600;
  }
  
  .status.limited {
    color: #f59e0b;
    font-weight: 600;
  }
  
  .topics {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 16px;
  }
  
  .topic-tag {
    background: #e5e7eb;
    color: #374151;
    font-size: 12px;
    padding: 4px 8px;
    border-radius: 12px;
    border: 1px solid #d1d5db;
  }
  
  .topic-tag.more {
    background: #f3f4f6;
    color: #6b7280;
  }
  
  .card-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }
  
  .connect-btn, .view-profile-btn {
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
  }
  
  .connect-btn {
    background: #3b82f6;
    color: white;
  }
  
  .connect-btn:hover {
    background: #2563eb;
  }
  
  .view-profile-btn {
    background: #f8f9fa;
    color: #374151;
    border: 1px solid #d1d5db;
  }
  
  .view-profile-btn:hover {
    background: #e5e7eb;
  }
  
  /* Compact variant styles */
  .user-card.compact {
    padding: 16px;
  }
  
  .compact-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }
  
  .compact-header {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    min-width: 0;
  }
  
  .avatar-sm {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 600;
    font-size: 14px;
    flex-shrink: 0;
  }
  
  .compact-info {
    flex: 1;
    min-width: 0;
  }
  
  .compact-name {
    font-size: 16px;
    font-weight: 600;
    margin: 0 0 2px 0;
    color: #1a1a1a;
  }
  
  .compact-subtitle {
    font-size: 13px;
    color: #666;
    margin: 0;
  }
  
  .match-score-sm {
    background: #10b981;
    color: white;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
  }
  
  .compact-actions {
    display: flex;
    gap: 8px;
  }
  
  .action-btn {
    padding: 6px 12px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    border: none;
    transition: all 0.2s ease;
  }
  
  .action-btn.primary {
    background: #3b82f6;
    color: white;
  }
  
  .action-btn.secondary {
    background: #f8f9fa;
    color: #374151;
    border: 1px solid #d1d5db;
  }
  
  /* Magic match variant styles */
  .user-card.magic-match {
    padding: 20px;
    border: 2px solid #fbbf24;
    background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
  }
  
  .magic-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 16px;
  }
  
  .magic-info {
    flex: 1;
  }
  
  .magic-name {
    font-size: 18px;
    font-weight: 700;
    margin: 0 0 4px 0;
    color: #92400e;
  }
  
  .magic-subtitle {
    font-size: 14px;
    color: #a16207;
    margin: 0 0 8px 0;
  }
  
  .compatibility-badge {
    display: inline-block;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
    color: white;
    text-transform: uppercase;
  }
  
  .magic-score {
    background: #f59e0b;
    color: white;
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 700;
  }
  
  .match-reasons {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px;
  }
  
  .reason-tag {
    background: #dcfce7;
    color: #166534;
    font-size: 12px;
    padding: 4px 8px;
    border-radius: 6px;
    border: 1px solid #bbf7d0;
  }
  
  .specialization, .expertise {
    font-size: 14px;
    color: #a16207;
    margin-bottom: 16px;
    font-style: italic;
  }
  
  .magic-actions {
    text-align: center;
  }
  
  .connect-btn.magic {
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .connect-btn.magic:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
  }
</style>