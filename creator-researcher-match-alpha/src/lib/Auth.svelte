<script>
  import { createEventDispatcher } from 'svelte';
  import { saveProfile } from './profileService.js';
  
  const dispatch = createEventDispatcher();
  
  let showSignUp = false;
  let formData = {
    name: '',
    email: '',
    type: 'researcher', // researcher or creator
    bio: '',
    institution: '',
    field: '',
    platform: '',
    topics: []
  };
  
  let topicInput = '';
  let isSubmitting = false;
  let error = '';
  
  function toggleMode() {
    showSignUp = !showSignUp;
    error = '';
  }
  
  function addTopic() {
    if (topicInput.trim() && !formData.topics.includes(topicInput.trim())) {
      formData.topics = [...formData.topics, topicInput.trim()];
      topicInput = '';
    }
  }
  
  function removeTopic(topic) {
    formData.topics = formData.topics.filter(t => t !== topic);
  }
  
  function handleSubmit() {
    if (!formData.name || !formData.email || !formData.bio) {
      error = 'Please fill in all required fields';
      return;
    }
    
    isSubmitting = true;
    error = '';
    
    // Create profile object
    const profile = {
      id: `user-${Date.now()}`,
      name: formData.name,
      email: formData.email,
      bio: formData.bio,
      type: formData.type,
      institution: formData.institution,
      field: formData.field,
      platform: formData.platform,
      topics: formData.topics,
      availability: 'Open to collaborations',
      profileImage: null,
      created_at: new Date().toISOString(),
      stats: {
        connections: 0,
        collaborations: 0,
        messagesSent: 0
      }
    };
    
    // Add type-specific fields
    if (formData.type === 'researcher') {
      profile.expertise = formData.field;
      profile.h_index = 0;
      profile.citations = 0;
      profile.publications = [];
    } else {
      profile.specialization = formData.field;
      profile.audience_size = '0-1K';
      profile.platforms = formData.platform ? [formData.platform] : [];
    }
    
    // Save profile
    if (saveProfile(profile)) {
      dispatch('authenticated', { profile });
    } else {
      error = 'Failed to create account. Please try again.';
    }
    
    isSubmitting = false;
  }
  
  function handleSignIn() {
    // For now, just show sign up form
    // In a real app, this would handle authentication
    error = 'Sign in functionality requires database setup. Please create a new account.';
  }
</script>

<div class="auth-container">
  <div class="auth-card">
    <div class="auth-header">
      <h1>Welcome to ResearchMatch</h1>
      <p>Connect researchers with content creators to make science accessible to everyone</p>
    </div>
    
    {#if !showSignUp}
      <!-- Sign In Form -->
      <div class="auth-form">
        <h2>Sign In</h2>
        <form on:submit|preventDefault={handleSignIn}>
          <div class="form-group">
            <label for="signin-email">Email</label>
            <input type="email" id="signin-email" placeholder="Enter your email" />
          </div>
          <div class="form-group">
            <label for="signin-password">Password</label>
            <input type="password" id="signin-password" placeholder="Enter your password" />
          </div>
          <button type="submit" class="auth-button primary">Sign In</button>
        </form>
        
        <div class="auth-divider">
          <span>Don't have an account?</span>
        </div>
        
        <button type="button" class="auth-button secondary" on:click={toggleMode}>
          Create Account
        </button>
      </div>
    {:else}
      <!-- Sign Up Form -->
      <div class="auth-form">
        <h2>Create Account</h2>
        <form on:submit|preventDefault={handleSubmit}>
          <div class="form-group">
            <label for="account-type">I am a:</label>
            <select id="account-type" bind:value={formData.type}>
              <option value="researcher">Researcher</option>
              <option value="creator">Content Creator</option>
            </select>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="name">Full Name *</label>
              <input type="text" id="name" bind:value={formData.name} placeholder="Enter your full name" required />
            </div>
            <div class="form-group">
              <label for="email">Email *</label>
              <input type="email" id="email" bind:value={formData.email} placeholder="Enter your email" required />
            </div>
          </div>
          
          <div class="form-group">
            <label for="bio">Bio *</label>
            <textarea id="bio" bind:value={formData.bio} placeholder="Tell us about yourself and your work" rows="3" required></textarea>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              {#if formData.type === 'researcher'}
                <label for="institution">Institution</label>
                <input 
                  type="text" 
                  id="institution" 
                  bind:value={formData.institution}
                  placeholder="Your university or organization" 
                />
              {:else}
                <label for="platform">Primary Platform</label>
                <input 
                  type="text" 
                  id="platform" 
                  bind:value={formData.platform}
                  placeholder="YouTube, TikTok, Blog, etc." 
                />
              {/if}
            </div>
            <div class="form-group">
              <label for="field">{formData.type === 'researcher' ? 'Field of Study' : 'Content Focus'}</label>
              <input 
                type="text" 
                id="field" 
                bind:value={formData.field}
                placeholder={formData.type === 'researcher' ? 'Physics, Biology, Computer Science, etc.' : 'Science communication, Tech reviews, etc.'} 
              />
            </div>
          </div>
          
          <div class="form-group">
            <label for="topics">Research Topics/Interests</label>
            <div class="topic-input">
              <input 
                type="text" 
                id="topics"
                bind:value={topicInput}
                placeholder="Add a topic and press Enter"
                on:keydown={(e) => e.key === 'Enter' && (e.preventDefault(), addTopic())}
              />
              <button type="button" on:click={addTopic}>Add</button>
            </div>
            <div class="topics-list">
              {#each formData.topics as topic}
                <span class="topic-tag">
                  {topic}
                  <button type="button" on:click={() => removeTopic(topic)}>&times;</button>
                </span>
              {/each}
            </div>
          </div>
          
          {#if error}
            <div class="error-message">{error}</div>
          {/if}
          
          <button type="submit" class="auth-button primary" disabled={isSubmitting}>
            {isSubmitting ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        
        <div class="auth-divider">
          <span>Already have an account?</span>
        </div>
        
        <button type="button" class="auth-button secondary" on:click={toggleMode}>
          Sign In
        </button>
      </div>
    {/if}
  </div>
</div>

<style>
  .auth-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 20px;
  }
  
  .auth-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 20px 40px rgba(0,0,0,0.1);
    padding: 40px;
    width: 100%;
    max-width: 600px;
  }
  
  .auth-header {
    text-align: center;
    margin-bottom: 40px;
  }
  
  .auth-header h1 {
    font-size: 2.5rem;
    color: #333;
    margin-bottom: 10px;
  }
  
  .auth-header p {
    color: #666;
    font-size: 1.1rem;
  }
  
  .auth-form h2 {
    color: #333;
    margin-bottom: 30px;
    text-align: center;
  }
  
  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }
  
  .form-group {
    margin-bottom: 20px;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: 600;
    color: #333;
  }
  
  .form-group input,
  .form-group select,
  .form-group textarea {
    width: 100%;
    padding: 12px;
    border: 2px solid #e1e5e9;
    border-radius: 8px;
    font-size: 16px;
    transition: border-color 0.2s;
  }
  
  .form-group input:focus,
  .form-group select:focus,
  .form-group textarea:focus {
    outline: none;
    border-color: #667eea;
  }
  
  .topic-input {
    display: flex;
    gap: 10px;
  }
  
  .topic-input input {
    flex: 1;
  }
  
  .topic-input button {
    padding: 12px 20px;
    background: #667eea;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
  }
  
  .topics-list {
    margin-top: 10px;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .topic-tag {
    background: #f0f0f0;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .topic-tag button {
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
    color: #666;
  }
  
  .auth-button {
    width: 100%;
    padding: 15px;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .auth-button.primary {
    background: #667eea;
    color: white;
  }
  
  .auth-button.primary:hover:not(:disabled) {
    background: #5a6fd8;
  }
  
  .auth-button.primary:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
  
  .auth-button.secondary {
    background: transparent;
    color: #667eea;
    border: 2px solid #667eea;
  }
  
  .auth-button.secondary:hover {
    background: #667eea;
    color: white;
  }
  
  .auth-divider {
    text-align: center;
    margin: 30px 0;
    color: #666;
  }
  
  .error-message {
    background: #fee;
    color: #c33;
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 20px;
    text-align: center;
  }
  
  @media (max-width: 768px) {
    .auth-card {
      padding: 30px 20px;
    }
    
    .auth-header h1 {
      font-size: 2rem;
    }
    
    .form-row {
      grid-template-columns: 1fr;
    }
  }
</style>