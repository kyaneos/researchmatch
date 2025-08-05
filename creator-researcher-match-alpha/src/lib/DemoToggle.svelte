<script>
  import { createEventDispatcher } from 'svelte';
  import { currentProfile } from './profileStore.js';
  
  const dispatch = createEventDispatcher();
  
  function toggleDemo() {
    const newType = $currentProfile.type === 'researcher' ? 'creator' : 'researcher';
    dispatch('toggle', { newType });
  }
  
  // Update current profile when it changes (for backward compatibility)
  export function updateCurrentProfile() {
    // This is now handled automatically by the store
  }
</script>

<div class="demo-banner">
  <div class="demo-content">
    <div class="demo-info">
      <span class="demo-label">🎬 DEMO MODE</span>
      <span class="current-user">
        Currently viewing as: 
        <strong>{$currentProfile?.name || 'Loading...'}</strong> 
        ({$currentProfile?.type === 'researcher' ? '🔬 Researcher' : '👥 Content Creator'})
      </span>
    </div>
    
    <button class="toggle-btn" on:click={toggleDemo}>
      Switch to {$currentProfile?.type === 'researcher' ? 'Content Creator' : 'Researcher'} View
      <span class="toggle-icon">⇄</span>
    </button>
  </div>
</div>

<style>
  .demo-banner {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 0.75rem 1rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    position: sticky;
    top: 0;
    z-index: 100;
    border-bottom: 3px solid rgba(255,255,255,0.2);
  }
  
  .demo-content {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }
  
  .demo-info {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex: 1;
  }
  
  .demo-label {
    background: rgba(255,255,255,0.2);
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: bold;
    letter-spacing: 0.5px;
  }
  
  .current-user {
    font-size: 0.9rem;
    opacity: 0.95;
  }
  
  .current-user strong {
    color: #fff;
    font-weight: 600;
  }
  
  .toggle-btn {
    background: rgba(255,255,255,0.15);
    color: white;
    border: 2px solid rgba(255,255,255,0.3);
    padding: 0.5rem 1.25rem;
    border-radius: 25px;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 500;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    white-space: nowrap;
  }
  
  .toggle-btn:hover {
    background: rgba(255,255,255,0.25);
    border-color: rgba(255,255,255,0.5);
    transform: translateY(-1px);
  }
  
  .toggle-btn:active {
    transform: translateY(0);
  }
  
  .toggle-icon {
    font-size: 1.1rem;
    transition: transform 0.3s ease;
  }
  
  .toggle-btn:hover .toggle-icon {
    transform: rotate(180deg);
  }
  
  @media (max-width: 768px) {
    .demo-content {
      flex-direction: column;
      gap: 0.75rem;
      align-items: stretch;
    }
    
    .demo-info {
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      text-align: center;
    }
    
    .toggle-btn {
      justify-content: center;
    }
    
    .current-user {
      font-size: 0.85rem;
    }
  }
  
  @media (max-width: 480px) {
    .demo-banner {
      padding: 0.5rem;
    }
    
    .demo-label {
      font-size: 0.7rem;
      padding: 0.2rem 0.5rem;
    }
    
    .current-user {
      font-size: 0.8rem;
    }
    
    .toggle-btn {
      font-size: 0.8rem;
      padding: 0.4rem 1rem;
    }
  }
</style>