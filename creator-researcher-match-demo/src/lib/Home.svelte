<script>
  import { onMount } from 'svelte';
  import { getConnections } from './profileService.js';
  import { currentProfile } from './profileStore.js';
  import { updateMatchScores } from './dataService.js';
  import { creatorsData, researchersData, loadAllData } from './dataStore.js';
  
  export let navigate;
  
  let recommendations = [];
  let trendingTopics = [];
  let recentActivity = [];
  let loading = true;
  
  // React to profile changes
  $: if ($currentProfile) {
    loadRecommendations();
  }
  
  onMount(async () => {
    // Load all data into global store
    await loadAllData();
    await loadRecommendations();
    loading = false;
  });
  
  async function loadRecommendations() {
    try {
      // Filter people based on collaboration restrictions
      let compatiblePeople = [];
      if ($currentProfile?.type === 'researcher') {
        compatiblePeople = [...$creatorsData]; // Researchers can only see creators
      } else if ($currentProfile?.type === 'creator') {
        compatiblePeople = [...$researchersData]; // Creators can only see researchers
      }
      
      // Get personalized recommendations based on user profile
      const scoredPeople = updateMatchScores(compatiblePeople, $currentProfile);
      
      // Get top 6 recommendations
      recommendations = scoredPeople
        .filter(p => p.matchScore > 30) // Lower threshold for demo
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 6);
      
      // Calculate trending topics  
      const topicCounts = {};
      const allPeople = [...creatorsData, ...researchersData];
      allPeople.forEach(person => {
        const topics = person.topics || [];
        topics.forEach(topic => {
          topicCounts[topic] = (topicCounts[topic] || 0) + 1;
        });
      });
      
      trendingTopics = Object.entries(topicCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 8)
        .map(([topic, count]) => ({ topic, count }));
      
      // Simulate recent activity based on user type
      if ($currentProfile?.type === 'researcher') {
        recentActivity = [
          { type: 'connection', name: 'Veritasium (Derek Muller)', field: 'Science Communication', time: '2 hours ago' },
          { type: 'collaboration', name: 'MinutePhysics', project: 'Quantum Mechanics Explainer', time: '5 hours ago' },
          { type: 'message', name: 'SciShow', preview: 'We\'d love to collaborate on that neuroscience topic...', time: '1 day ago' }
        ];
      } else {
        recentActivity = [
          { type: 'connection', name: 'Dr. Sean Carroll', field: 'Theoretical Physics', time: '2 hours ago' },
          { type: 'collaboration', name: 'Dr. Emily Johnson', project: 'Climate Change Documentary', time: '5 hours ago' },
          { type: 'message', name: 'Prof. Michael Rodriguez', preview: 'Your video ideas sound fascinating...', time: '1 day ago' }
        ];
      }
    } catch (error) {
      console.error('Error loading recommendations:', error);
    }
  }
  
  function getMatchBadge(score) {
    if (score >= 80) return { text: 'Excellent Match', color: '#28a745' };
    if (score >= 65) return { text: 'Great Match', color: '#17a2b8' };
    return { text: 'Good Match', color: '#6c757d' };
  }
</script>

<div class="home-container">
  <div class="hero-section">
    <h1>Welcome back, {$currentProfile?.name || 'Loading...'}!</h1>
    <p>Connect with {$currentProfile?.type === 'researcher' ? 'content creators' : 'researchers'} to make science accessible to everyone.</p>
  </div>
  
  <!-- Quick Stats -->
  <div class="stats-row">
    <div class="stat-card">
      <h4>{$currentProfile?.stats?.connections || 0}</h4>
      <p>Connections</p>
    </div>
    <div class="stat-card">
      <h4>{$currentProfile?.stats?.collaborations || 0}</h4>
      <p>Collaborations</p>
    </div>
    <div class="stat-card">
      <h4>{$currentProfile?.stats?.messagesSent || 0}</h4>
      <p>Messages Sent</p>
    </div>
    <div class="stat-card">
      <h4>{recommendations.length}</h4>
      <p>New Matches</p>
    </div>
  </div>
  
  <!-- Recommendations Section -->
  {#if !loading && recommendations.length > 0}
    <section class="recommendations-section">
      <div class="section-header">
        <h2>Recommended for You</h2>
        <button class="see-all-btn" on:click={() => navigate('discover')}>See All →</button>
      </div>
      
      <div class="recommendations-grid">
        {#each recommendations.slice(0, 6) as person}
          <div class="recommendation-card">
            <div class="match-badge" style="background-color: {getMatchBadge(person.matchScore).color}">
              {getMatchBadge(person.matchScore).text}
            </div>
            
            <div class="person-avatar">{person.name.charAt(0)}</div>
            <h3>{person.name}</h3>
            <p class="person-field">{person.field || person.specialization}</p>
            <p class="person-institution">{person.institution || person.platform}</p>
            
            <div class="match-reasons">
              <p class="reason-title">Why this match?</p>
              <ul>
                {#if person.topics}
                  <li>Shared interest in {person.topics[0]}</li>
                {/if}
                {#if person.availability?.includes('Open')}
                  <li>Available for collaborations</li>
                {/if}
                <li>{person.matchScore}% compatibility score</li>
              </ul>
            </div>
            
            <button class="connect-btn" on:click={() => navigate('discover')}>View Profile</button>
          </div>
        {/each}
      </div>
    </section>
  {/if}
  
  <!-- Trending Topics -->
  <section class="trending-section">
    <h2>Trending Research Topics</h2>
    <div class="topics-cloud">
      {#each trendingTopics as {topic, count}}
        <button class="topic-pill" on:click={() => navigate('discover')}>
          {topic} <span class="count">({count})</span>
        </button>
      {/each}
    </div>
  </section>
  
  <!-- Recent Activity -->
  <section class="activity-section">
    <h2>Recent Activity</h2>
    <div class="activity-list">
      {#each recentActivity as activity}
        <div class="activity-item">
          <div class="activity-icon {activity.type}">
            {#if activity.type === 'connection'}
              🤝
            {:else if activity.type === 'collaboration'}
              💡
            {:else}
              💬
            {/if}
          </div>
          <div class="activity-content">
            {#if activity.type === 'connection'}
              <p>New connection with <strong>{activity.name}</strong></p>
              <p class="activity-detail">{activity.field}</p>
            {:else if activity.type === 'collaboration'}
              <p>Started collaboration: <strong>{activity.project}</strong></p>
              <p class="activity-detail">With {activity.name}</p>
            {:else}
              <p>New message from <strong>{activity.name}</strong></p>
              <p class="activity-detail">"{activity.preview}"</p>
            {/if}
            <span class="activity-time">{activity.time}</span>
          </div>
        </div>
      {/each}
    </div>
  </section>
  
  <!-- Original Features -->
  <div class="features">
    <div class="feature-card">
      <h3>🔍 Discover</h3>
      <p>Find researchers and creators in your field of interest</p>
    </div>
    <div class="feature-card">
      <h3>🤝 Connect</h3>
      <p>Reach out and start meaningful collaborations</p>
    </div>
    <div class="feature-card">
      <h3>📚 Create</h3>
      <p>Work together to create accurate, engaging content</p>
    </div>
  </div>
</div>

<style>
  .home-container {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
    text-align: center;
  }
  
  h1 {
    font-size: 3rem;
    margin-bottom: 1rem;
    color: #333;
  }
  
  .hero-section p {
    font-size: 1.2rem;
    color: #666;
    margin-bottom: 3rem;
  }
  
  .features {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
    margin: 3rem 0;
  }
  
  .feature-card {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    border: 1px solid #eee;
  }
  
  .feature-card h3 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
    color: #333;
  }
  
  .feature-card p {
    color: #666;
    line-height: 1.5;
  }
  
  .hero-section {
    margin-bottom: 3rem;
  }
  
  .stats-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1.5rem;
    margin-bottom: 3rem;
  }
  
  .stat-card {
    background: white;
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    text-align: center;
  }
  
  .stat-card h4 {
    font-size: 2rem;
    color: #007bff;
    margin: 0;
  }
  
  .stat-card p {
    color: #666;
    margin: 0.25rem 0 0;
    font-size: 0.9rem;
  }
  
  .recommendations-section {
    margin-bottom: 3rem;
  }
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }
  
  .section-header h2 {
    margin: 0;
    color: #333;
  }
  
  .see-all-btn {
    background: none;
    border: none;
    color: #007bff;
    cursor: pointer;
    font-size: 1rem;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    transition: background-color 0.2s;
  }
  
  .see-all-btn:hover {
    background-color: #f0f0f0;
  }
  
  .recommendations-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
  }
  
  .recommendation-card {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    border: 1px solid #e0e0e0;
    position: relative;
    text-align: center;
    transition: all 0.3s;
  }
  
  .recommendation-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 20px rgba(0,0,0,0.12);
  }
  
  .match-badge {
    position: absolute;
    top: 1rem;
    right: 1rem;
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    color: white;
    font-size: 0.8rem;
    font-weight: 500;
  }
  
  .person-avatar {
    width: 60px;
    height: 60px;
    background-color: #007bff;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    font-weight: bold;
    margin: 0 auto 1rem;
  }
  
  .recommendation-card h3 {
    margin: 0 0 0.5rem;
    color: #333;
    font-size: 1.2rem;
  }
  
  .person-field {
    color: #666;
    margin: 0 0 0.25rem;
    font-size: 0.9rem;
  }
  
  .person-institution {
    color: #999;
    margin: 0 0 1rem;
    font-size: 0.85rem;
  }
  
  .match-reasons {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 1rem;
    margin: 1rem 0;
    text-align: left;
  }
  
  .reason-title {
    font-weight: 500;
    color: #555;
    margin: 0 0 0.5rem;
    font-size: 0.9rem;
  }
  
  .match-reasons ul {
    margin: 0;
    padding-left: 1.5rem;
  }
  
  .match-reasons li {
    color: #666;
    font-size: 0.85rem;
    margin: 0.25rem 0;
  }
  
  .connect-btn {
    width: 100%;
    padding: 0.75rem;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    transition: background-color 0.2s;
  }
  
  .connect-btn:hover {
    background-color: #0056b3;
  }
  
  .trending-section {
    margin-bottom: 3rem;
    text-align: left;
  }
  
  .trending-section h2 {
    margin-bottom: 1.5rem;
    color: #333;
  }
  
  .topics-cloud {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }
  
  .topic-pill {
    padding: 0.5rem 1rem;
    background: #e3f2fd;
    border: 1px solid #90caf9;
    border-radius: 20px;
    color: #1976d2;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s;
  }
  
  .topic-pill:hover {
    background: #1976d2;
    color: white;
    transform: scale(1.05);
  }
  
  .topic-pill .count {
    opacity: 0.7;
    font-size: 0.85rem;
  }
  
  .activity-section {
    margin-bottom: 3rem;
    text-align: left;
  }
  
  .activity-section h2 {
    margin-bottom: 1.5rem;
    color: #333;
  }
  
  .activity-list {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    overflow: hidden;
  }
  
  .activity-item {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1.5rem;
    border-bottom: 1px solid #f0f0f0;
  }
  
  .activity-item:last-child {
    border-bottom: none;
  }
  
  .activity-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    flex-shrink: 0;
  }
  
  .activity-icon.connection {
    background: #e3f2fd;
  }
  
  .activity-icon.collaboration {
    background: #fff3e0;
  }
  
  .activity-icon.message {
    background: #f3e5f5;
  }
  
  .activity-content {
    flex: 1;
  }
  
  .activity-content p {
    margin: 0;
    color: #333;
  }
  
  .activity-detail {
    color: #666;
    font-size: 0.9rem;
    margin-top: 0.25rem;
  }
  
  .activity-time {
    color: #999;
    font-size: 0.85rem;
    margin-top: 0.5rem;
    display: inline-block;
  }
  
</style>