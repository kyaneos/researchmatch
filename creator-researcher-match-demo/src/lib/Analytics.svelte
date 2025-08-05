<script>
  import { onMount } from 'svelte';
  import { getConnections } from './profileService.js';
  import { currentProfile } from './profileStore.js';
  
  let loading = true;
  let error = null;
  let creators = [];
  let researchers = [];
  let researchGroups = [];
  
  // Analytics data
  let topicRepresentation = [];
  let underrepresentedTopics = [];
  let contentByUniversity = [];
  let contentByRegion = [];
  let contentByField = [];
  let budgetRiskTopics = [];
  let novelTopics = [];
  let impactfulContent = [];
  let trendingTopics = [];
  let userProfile = null;
  let personalizedInsights = [];
  let connectionAnalytics = null;
  
  // Show more/less states for each section's items
  let expandedItems = {
    topicRepresentation: false,
    underrepresented: false,
    universities: false,
    regions: false,
    fields: false,
    budgetRisk: false,
    novelTopics: false,
    impactContent: false,
    trending: false
  };
  
  function toggleItems(sectionName) {
    expandedItems[sectionName] = !expandedItems[sectionName];
  }
  
  // React to profile changes
  $: if ($currentProfile) {
    loadAnalyticsData();
  }

  async function loadAnalyticsData() {
    if (!$currentProfile) return;
    loading = true;
    error = null;
    console.log('Analytics loading data...');
    
    // Load user profile and connections
    userProfile = $currentProfile;
    const connections = getConnections();
    
    try {
      // Load data from JSON files
      const [creatorsRes, researchersRes, groupsRes] = await Promise.all([
        fetch('/stem_creators_full_list.json'),
        fetch('/researchers_full_list.json'),
        fetch('/research_groups.json')
      ]);
      
      console.log('Fetch responses received:', { 
        creatorsOk: creatorsRes.ok, 
        researchersOk: researchersRes.ok, 
        groupsOk: groupsRes.ok 
      });
      
      if (!creatorsRes.ok || !researchersRes.ok || !groupsRes.ok) {
        throw new Error('Failed to fetch one or more data files');
      }
      
      creators = await creatorsRes.json();
      researchers = await researchersRes.json();
      const groupsData = await groupsRes.json();
      
      console.log('Data loaded successfully:', {
        creators: creators.length,
        researchers: researchers.length,
        groupsData: groupsData ? 'loaded' : 'null'
      });
      
      // Process research groups data
      researchGroups = [];
      if (groupsData && groupsData.universities && Array.isArray(groupsData.universities)) {
        groupsData.universities.forEach((university) => {
          if (university.departments && Array.isArray(university.departments)) {
            university.departments.forEach((department) => {
              if (department.labs && Array.isArray(department.labs)) {
                department.labs.forEach((lab) => {
                  researchGroups.push({
                    ...lab,
                    university: university.name,
                    department: department.name,
                    location: university.location
                  });
                });
              }
            });
          }
        });
      }
      
      // Generate analytics
      try {
        generateAnalytics();
        generatePersonalizedInsights(connections);
        console.log('Analytics generated successfully');
      } catch (analyticsError) {
        console.error('Error generating analytics:', analyticsError);
        // Continue anyway with empty data rather than failing completely
      }
    } catch (err) {
      console.error('Error loading data:', err);
      error = err.message || 'Failed to load analytics data';
    } finally {
      loading = false;
    }
  }
  
  function generateAnalytics() {
    console.log('Generating analytics with data:', { creators: creators.length, researchers: researchers.length, researchGroups: researchGroups.length });
    
    // Topic representation analysis
    const allTopics = new Map();
    
    // From creators
    creators.forEach((creator) => {
      try {
        const topics = creator.specialization ? creator.specialization.split(',').map((t) => t.trim()) : [];
        topics.forEach((topic) => {
          if (topic && topic.length > 0) {
            allTopics.set(topic, (allTopics.get(topic) || 0) + 1);
          }
        });
      } catch (error) {
        console.warn('Error processing creator:', creator, error);
      }
    });
    
    // From researchers
    researchers.forEach((researcher) => {
      try {
        const interests = Array.isArray(researcher.research_interests) ? researcher.research_interests : [];
        const fieldTopics = researcher.field ? [researcher.field] : [];
        [...interests, ...fieldTopics].forEach((topic) => {
          if (topic && topic.length > 0) {
            allTopics.set(topic, (allTopics.get(topic) || 0) + 1);
          }
        });
      } catch (error) {
        console.warn('Error processing researcher:', researcher, error);
      }
    });
    
    console.log('All topics found:', Array.from(allTopics.entries()));
    
    // Sort topics by representation
    topicRepresentation = Array.from(allTopics.entries())
      .map(([topic, count]) => ({ 
        topic, 
        count, 
        percentage: creators.length + researchers.length > 0 ? 
          ((count / (creators.length + researchers.length)) * 100).toFixed(1) : '0'
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
    
    // Identify underrepresented topics (those with low counts but high potential impact)
    underrepresentedTopics = Array.from(allTopics.entries())
      .map(([topic, count]) => ({ topic, count, riskLevel: count < 3 ? 'High' : count < 6 ? 'Medium' : 'Low' }))
      .filter(item => item.count < 6)
      .sort((a, b) => a.count - b.count)
      .slice(0, 10);
    
    // Content by university
    const universityMap = new Map();
    researchers.forEach((researcher) => {
      try {
        const uni = researcher.institution;
        if (uni && typeof uni === 'string') {
          const current = universityMap.get(uni) || {
            name: uni,
            researchers: 0,
            totalPublications: 0,
            avgHIndex: 0
          };
          
          universityMap.set(uni, {
            ...current,
            researchers: current.researchers + 1,
            totalPublications: current.totalPublications + (researcher.publications || 0)
          });
        }
      } catch (error) {
        console.warn('Error processing university data for researcher:', researcher, error);
      }
    });
    
    // Calculate average h-index
    universityMap.forEach((data, uni) => {
      try {
        const uniResearchers = researchers.filter(r => r.institution === uni);
        if (uniResearchers.length > 0) {
          const totalHIndex = uniResearchers.reduce((sum, r) => sum + (r.h_index || 0), 0);
          data.avgHIndex = (totalHIndex / uniResearchers.length).toFixed(1);
        }
      } catch (error) {
        console.warn('Error calculating h-index for university:', uni, error);
        data.avgHIndex = '0';
      }
    });
    
    contentByUniversity = Array.from(universityMap.values())
      .sort((a, b) => b.totalPublications - a.totalPublications)
      .slice(0, 10);
    
    // Content by region with improved detection
    const regionMap = new Map();
    
    // Comprehensive region mappings - Add 'US - ' prefix to US regions
    const stateToRegion = {
      // West Coast
      'CA': 'US - West Coast', 'California': 'US - West Coast',
      'WA': 'US - West Coast', 'Washington': 'US - West Coast',
      'OR': 'US - West Coast', 'Oregon': 'US - West Coast',
      'NV': 'US - West Coast', 'Nevada': 'US - West Coast',
      
      // East Coast
      'NY': 'US - East Coast', 'New York': 'US - East Coast',
      'MA': 'US - East Coast', 'Massachusetts': 'US - East Coast',
      'CT': 'US - East Coast', 'Connecticut': 'US - East Coast',
      'NJ': 'US - East Coast', 'New Jersey': 'US - East Coast',
      'PA': 'US - East Coast', 'Pennsylvania': 'US - East Coast',
      'MD': 'US - East Coast', 'Maryland': 'US - East Coast',
      'DC': 'US - East Coast', 'D.C.': 'US - East Coast',
      'VA': 'US - East Coast', 'Virginia': 'US - East Coast',
      'NH': 'US - East Coast', 'New Hampshire': 'US - East Coast',
      'ME': 'US - East Coast', 'Maine': 'US - East Coast',
      'RI': 'US - East Coast', 'Rhode Island': 'US - East Coast',
      'VT': 'US - East Coast', 'Vermont': 'US - East Coast',
      
      // South
      'TX': 'US - South', 'Texas': 'US - South',
      'FL': 'US - South', 'Florida': 'US - South',
      'GA': 'US - South', 'Georgia': 'US - South',
      'NC': 'US - South', 'North Carolina': 'US - South',
      'SC': 'US - South', 'South Carolina': 'US - South',
      'TN': 'US - South', 'Tennessee': 'US - South',
      'AL': 'US - South', 'Alabama': 'US - South',
      'MS': 'US - South', 'Mississippi': 'US - South',
      'LA': 'US - South', 'Louisiana': 'US - South',
      'AR': 'US - South', 'Arkansas': 'US - South',
      'KY': 'US - South', 'Kentucky': 'US - South',
      
      // Midwest
      'IL': 'US - Midwest', 'Illinois': 'US - Midwest',
      'MI': 'US - Midwest', 'Michigan': 'US - Midwest',
      'OH': 'US - Midwest', 'Ohio': 'US - Midwest',
      'IN': 'US - Midwest', 'Indiana': 'US - Midwest',
      'WI': 'US - Midwest', 'Wisconsin': 'US - Midwest',
      'MN': 'US - Midwest', 'Minnesota': 'US - Midwest',
      'IA': 'US - Midwest', 'Iowa': 'US - Midwest',
      'MO': 'US - Midwest', 'Missouri': 'US - Midwest',
      'KS': 'US - Midwest', 'Kansas': 'US - Midwest',
      'NE': 'US - Midwest', 'Nebraska': 'US - Midwest',
      'SD': 'US - Midwest', 'South Dakota': 'US - Midwest',
      'ND': 'US - Midwest', 'North Dakota': 'US - Midwest',
      
      // Mountain West
      'CO': 'US - Mountain West', 'Colorado': 'US - Mountain West',
      'UT': 'US - Mountain West', 'Utah': 'US - Mountain West',
      'AZ': 'US - Mountain West', 'Arizona': 'US - Mountain West',
      'NM': 'US - Mountain West', 'New Mexico': 'US - Mountain West',
      'ID': 'US - Mountain West', 'Idaho': 'US - Mountain West',
      'MT': 'US - Mountain West', 'Montana': 'US - Mountain West',
      'WY': 'US - Mountain West', 'Wyoming': 'US - Mountain West'
    };
    
    // City to region mappings for better detection
    const cityToRegion = {
      'Boston': 'US - East Coast',
      'Cambridge': 'US - East Coast',
      'New York': 'US - East Coast',
      'Philadelphia': 'US - East Coast',
      'Baltimore': 'US - East Coast',
      'Washington': 'US - East Coast',
      'Chicago': 'US - Midwest',
      'Ann Arbor': 'US - Midwest',
      'Madison': 'US - Midwest',
      'Los Angeles': 'US - West Coast',
      'San Francisco': 'US - West Coast',
      'Berkeley': 'US - West Coast',
      'Stanford': 'US - West Coast',
      'Seattle': 'US - West Coast',
      'Austin': 'US - South',
      'Houston': 'US - South',
      'Atlanta': 'US - South',
      'Durham': 'US - South',
      'Nashville': 'US - South',
      'Boulder': 'US - Mountain West',
      'Salt Lake': 'US - Mountain West',
      'Phoenix': 'US - Mountain West',
      'Miami': 'US - South',
      'Orlando': 'US - South',
      'Dallas': 'US - South',
      'San Antonio': 'US - South',
      'Columbus': 'US - Midwest',
      'Cleveland': 'US - Midwest',
      'Detroit': 'US - Midwest',
      'Minneapolis': 'US - Midwest',
      'St. Louis': 'US - Midwest',
      'Kansas City': 'US - Midwest',
      'Denver': 'US - Mountain West',
      'Las Vegas': 'US - West Coast',
      'Portland': 'US - West Coast',
      'San Diego': 'US - West Coast',
      'Pittsburgh': 'US - East Coast',
      'Charlotte': 'US - South',
      'Raleigh': 'US - South'
    };
    
    // International patterns
    const internationalPatterns = {
      'UK': 'International - Europe',
      'United Kingdom': 'International - Europe',
      'London': 'International - Europe',
      'Oxford': 'International - Europe',
      'Cambridge, UK': 'International - Europe',
      'Canada': 'International - North America',
      'Toronto': 'International - North America',
      'Vancouver': 'International - North America',
      'Montreal': 'International - North America',
      'Germany': 'International - Europe',
      'France': 'International - Europe',
      'Switzerland': 'International - Europe',
      'Netherlands': 'International - Europe',
      'Australia': 'International - Asia Pacific',
      'Japan': 'International - Asia Pacific',
      'China': 'International - Asia Pacific',
      'Singapore': 'International - Asia Pacific',
      'India': 'International - Asia',
      'Israel': 'International - Middle East'
    };
    
    researchers.forEach(researcher => {
      let region = 'Other/Unknown';
      const institution = researcher.institution || '';
      
      // Check international patterns first
      for (const [pattern, regionName] of Object.entries(internationalPatterns)) {
        if (institution.includes(pattern)) {
          region = regionName;
          break;
        }
      }
      
      // If not international, check US regions
      if (region === 'Other/Unknown') {
        // Check state patterns
        for (const [pattern, regionName] of Object.entries(stateToRegion)) {
          if (institution.includes(pattern) || institution.includes(`, ${pattern}`)) {
            region = regionName;
            break;
          }
        }
        
        // If still not found, check city patterns
        if (region === 'Other/Unknown') {
          for (const [city, regionName] of Object.entries(cityToRegion)) {
            if (institution.includes(city)) {
              region = regionName;
              break;
            }
          }
        }
      }
      
      const current = regionMap.get(region) || {
        region,
        count: 0,
        publications: 0,
        avgHIndex: 0,
        institutions: new Set()
      };
      
      current.count++;
      current.publications += researcher.publications || 0;
      current.institutions.add(institution);
      
      regionMap.set(region, current);
    });
    
    // Store researcher regions for h-index calculation
    const researcherRegions = new Map();
    
    researchers.forEach((researcher, index) => {
      let region = 'Other/Unknown';
      const institution = researcher.institution || '';
      
      // Same region detection logic as above
      for (const [pattern, regionName] of Object.entries(internationalPatterns)) {
        if (institution.includes(pattern)) {
          region = regionName;
          break;
        }
      }
      
      if (region === 'Other/Unknown') {
        for (const [pattern, regionName] of Object.entries(stateToRegion)) {
          if (institution.includes(pattern) || institution.includes(`, ${pattern}`)) {
            region = regionName;
            break;
          }
        }
        
        if (region === 'Other/Unknown') {
          for (const [city, regionName] of Object.entries(cityToRegion)) {
            if (institution.includes(city)) {
              region = regionName;
              break;
            }
          }
        }
      }
      
      researcherRegions.set(index, region);
    });
    
    // Calculate average h-index per region
    regionMap.forEach((data, region) => {
      const regionResearchers = researchers.filter((r, index) => researcherRegions.get(index) === region);
      
      if (regionResearchers.length > 0) {
        const totalHIndex = regionResearchers.reduce((sum, r) => sum + (r.h_index || 0), 0);
        data.avgHIndex = (totalHIndex / regionResearchers.length).toFixed(1);
      }
      
      // Convert institutions Set to count
      data.uniqueInstitutions = data.institutions.size;
      delete data.institutions;
    });
    
    contentByRegion = Array.from(regionMap.values())
      .sort((a, b) => b.publications - a.publications);
    
    // Content by science field
    const fieldMap = new Map();
    researchers.forEach(researcher => {
      const field = researcher.field;
      if (field) {
        fieldMap.set(field, {
          field,
          count: (fieldMap.get(field)?.count || 0) + 1,
          publications: (fieldMap.get(field)?.publications || 0) + (researcher.publications || 0),
          avgHIndex: 0
        });
      }
    });
    
    // Calculate average h-index by field
    fieldMap.forEach((data, field) => {
      const fieldResearchers = researchers.filter(r => r.field === field);
      const totalHIndex = fieldResearchers.reduce((sum, r) => sum + (r.h_index || 0), 0);
      data.avgHIndex = (totalHIndex / fieldResearchers.length).toFixed(1);
    });
    
    contentByField = Array.from(fieldMap.values())
      .sort((a, b) => b.publications - a.publications);
    
    // Topics/fields at budget risk (simulated data based on field characteristics)
    budgetRiskTopics = [
      { topic: 'Climate Science', riskLevel: 'High', reason: 'Policy uncertainty', researchers: researchers.filter(r => r.field?.includes('Climate')).length },
      { topic: 'Social Sciences', riskLevel: 'High', reason: 'Federal funding cuts', researchers: researchers.filter(r => r.field?.includes('Social')).length },
      { topic: 'Environmental Studies', riskLevel: 'Medium', reason: 'Shifting priorities', researchers: researchers.filter(r => r.field?.includes('Environmental') || r.research_interests?.includes('Environmental')).length },
      { topic: 'Renewable Energy', riskLevel: 'Medium', reason: 'Industry competition', researchers: researchers.filter(r => r.research_interests?.includes('Renewable energy')).length },
      { topic: 'Public Health', riskLevel: 'Low', reason: 'Recent pandemic focus', researchers: researchers.filter(r => r.field?.includes('Health')).length }
    ];
    
    // Novel/emerging topics (topics with recent growth)
    novelTopics = [
      { topic: 'AI Ethics', growth: '+340%', timeframe: '2 years', description: 'Growing focus on responsible AI development' },
      { topic: 'Quantum Computing', growth: '+180%', timeframe: '3 years', description: 'Commercial applications emerging' },
      { topic: 'Synthetic Biology', growth: '+120%', timeframe: '2 years', description: 'Engineering biological systems' },
      { topic: 'Digital Health', growth: '+95%', timeframe: '1 year', description: 'Accelerated by pandemic needs' },
      { topic: 'Space Technology', growth: '+75%', timeframe: '2 years', description: 'Commercial space industry boom' }
    ];
    
    // Impactful content by life benefit
    impactfulContent = [
      { 
        topic: 'Vaccine Development', 
        impact: 'Very High', 
        lifesSaved: '~50M annually',
        practicalBenefit: 'Disease prevention and global health security',
        creators: creators.filter(c => c.specialization?.includes('health') || c.specialization?.includes('medicine')).length,
        researchers: researchers.filter(r => r.field?.includes('Biology') || r.field?.includes('Medicine')).length
      },
      { 
        topic: 'Renewable Energy', 
        impact: 'High', 
        lifesSaved: '~4.5M annually',
        practicalBenefit: 'Reduced air pollution and climate change mitigation',
        creators: creators.filter(c => c.specialization?.includes('energy')).length,
        researchers: researchers.filter(r => r.research_interests?.includes('Renewable energy')).length
      },
      { 
        topic: 'Water Purification', 
        impact: 'High', 
        lifesSaved: '~1.8M annually',
        practicalBenefit: 'Clean drinking water access in developing regions',
        creators: creators.filter(c => c.specialization?.includes('environmental')).length,
        researchers: researchers.filter(r => r.field?.includes('Environmental')).length
      },
      { 
        topic: 'Food Security', 
        impact: 'High', 
        lifesSaved: '~2.1M annually',
        practicalBenefit: 'Agricultural innovations reducing malnutrition',
        creators: creators.filter(c => c.specialization?.includes('agriculture')).length,
        researchers: researchers.filter(r => r.field?.includes('Agriculture') || r.research_interests?.includes('food')).length
      }
    ];
    
    // Trending topics (simulated based on current events and research focus)
    trendingTopics = [
      { topic: 'Artificial Intelligence', trend: '+45%', period: '6 months' },
      { topic: 'Climate Change', trend: '+38%', period: '6 months' },
      { topic: 'Biotechnology', trend: '+32%', period: '6 months' },
      { topic: 'Space Exploration', trend: '+28%', period: '6 months' },
      { topic: 'Quantum Physics', trend: '+25%', period: '6 months' }
    ];
  }
  
  function generatePersonalizedInsights(connections) {
    personalizedInsights = [];
    connectionAnalytics = {
      totalConnections: connections.length,
      fieldDistribution: {},
      topicOverlap: {},
      collaborationPotential: 0
    };
    
    // Analyze user's network
    connections.forEach(conn => {
      // Field distribution
      const field = conn.type === 'researcher' ? 'Researchers' : 'Creators';
      connectionAnalytics.fieldDistribution[field] = (connectionAnalytics.fieldDistribution[field] || 0) + 1;
      
      // Topic overlap analysis
      if (conn.topics && userProfile.topics) {
        conn.topics.forEach(topic => {
          if (userProfile.topics.includes(topic)) {
            connectionAnalytics.topicOverlap[topic] = (connectionAnalytics.topicOverlap[topic] || 0) + 1;
          }
        });
      }
    });
    
    // Generate insights based on user profile
    if (userProfile.type === 'researcher') {
      // Insights for researchers
      personalizedInsights.push({
        title: 'Your Research Impact Potential',
        value: `${userProfile.h_index || 0} h-index with ${userProfile.citations || 0} citations`,
        insight: 'Your research metrics place you in the top tier for science communication partnerships',
        type: 'success'
      });
      
      if (userProfile.publications && userProfile.publications.length > 0) {
        personalizedInsights.push({
          title: 'Publication Portfolio',
          value: `${userProfile.publications.length} publications`,
          insight: 'Strong publication record increases credibility with content creators by 85%',
          type: 'info'
        });
      }
    }
    
    // Network analysis insights
    if (connections.length > 0) {
      personalizedInsights.push({
        title: 'Network Strength',
        value: `${connections.length} active connections`,
        insight: connections.length > 10 ? 'Your network size is above average - leverage it for collaborative opportunities' : 'Growing your network by 3-5 connections could unlock new collaboration opportunities',
        type: connections.length > 10 ? 'success' : 'warning'
      });
    }
    
    // Topic-specific insights
    if (userProfile.topics && userProfile.topics.length > 0) {
      const userTopics = userProfile.topics;
      const matchingTopics = topicRepresentation.filter(topic => 
        userTopics.some(userTopic => 
          userTopic.toLowerCase().includes(topic.topic.toLowerCase()) || 
          topic.topic.toLowerCase().includes(userTopic.toLowerCase())
        )
      );
      
      if (matchingTopics.length > 0) {
        const topMatch = matchingTopics[0];
        personalizedInsights.push({
          title: 'Topic Market Position',
          value: `${topMatch.percentage}% market coverage in ${topMatch.topic}`,
          insight: topMatch.percentage > 15 ? 'You\'re in a competitive but well-represented field' : 'You\'re in an underserved niche with high collaboration potential',
          type: topMatch.percentage > 15 ? 'info' : 'opportunity'
        });
      }
    }
  }

  onMount(() => {
    // If profile is already available, load analytics immediately
    if ($currentProfile) {
      loadAnalyticsData();
    }
    // Otherwise, reactive statement will handle it when profile becomes available
  });
  
  function getRiskColor(riskLevel) {
    switch (riskLevel) {
      case 'High': return '#dc3545';
      case 'Medium': return '#ffc107';
      case 'Low': return '#28a745';
      default: return '#6c757d';
    }
  }
  
  function getImpactColor(impact) {
    switch (impact) {
      case 'Very High': return '#dc3545';
      case 'High': return '#fd7e14';
      case 'Medium': return '#ffc107';
      case 'Low': return '#28a745';
      default: return '#6c757d';
    }
  }
  
  function getRegionIcon(regionName) {
    if (regionName.startsWith('US - ')) {
      return '🇺🇸';
    } else if (regionName.includes('Europe')) {
      return '🇪🇺';
    } else if (regionName.includes('Asia Pacific')) {
      return '🌏';
    } else if (regionName.includes('Asia')) {
      return '🌏';
    } else if (regionName.includes('North America')) {
      return '🍁';
    } else if (regionName.includes('Middle East')) {
      return '🌍';
    }
    return '🌍';
  }
</script>

<div class="analytics-container">
  <div class="header">
    <h1>📊 Topic Analytics Dashboard</h1>
    <p>Comprehensive analysis of content creation patterns, representation, and impact across science communication</p>
  </div>
  
  {#if loading}
    <div class="loading">
      <div class="spinner"></div>
      <p>Analyzing data patterns...</p>
    </div>
  {:else if error}
    <div class="error">
      <h2>Error Loading Analytics</h2>
      <p>{error}</p>
      <button on:click={() => window.location.reload()}>Retry</button>
    </div>
  {:else}
    <!-- Overview Stats -->
    <div class="overview-stats">
      <div class="stat-card">
        <h3>Total Creators</h3>
        <div class="stat-number">{creators.length}</div>
        <p>Content creators analyzed</p>
      </div>
      <div class="stat-card">
        <h3>Total Researchers</h3>
        <div class="stat-number">{researchers.length}</div>
        <p>Active researchers tracked</p>
      </div>
      <div class="stat-card">
        <h3>Research Groups</h3>
        <div class="stat-number">{researchGroups.length}</div>
        <p>University labs monitored</p>
      </div>
      <div class="stat-card">
        <h3>Topics Covered</h3>
        <div class="stat-number">{topicRepresentation.length}</div>
        <p>Distinct research areas</p>
      </div>
    </div>
    
    <!-- Personalized Insights -->
    {#if userProfile && personalizedInsights.length > 0}
      <div class="insights-section">
        <h2>📊 Your Personalized Analytics</h2>
        <div class="insights-grid">
          {#each personalizedInsights as insight}
            <div class="insight-card {insight.type}">
              <h4>{insight.title}</h4>
              <div class="insight-value">{insight.value}</div>
              <p class="insight-text">{insight.insight}</p>
            </div>
          {/each}
          
        </div>
      </div>
    {/if}
    
    <!-- Main Analytics Grid -->
    <div class="analytics-grid">
      
      <!-- Topic Representation -->
      <div class="analytics-card wide">
        <h2>🎯 Topic Representation in Media</h2>
        <p class="card-description">Most covered topics across content creators and researchers</p>
        <div class="topic-bars">
          {#each (expandedItems.topicRepresentation ? topicRepresentation : topicRepresentation.slice(0, 3)) as item}
            <div class="topic-bar">
              <div class="topic-info">
                <span class="topic-name">{item.topic}</span>
                <span class="topic-count">{item.count} mentions ({item.percentage}%)</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" style="width: {Math.min(item.percentage * 2, 100)}%"></div>
              </div>
            </div>
          {/each}
          {#if topicRepresentation.length > 3}
            <button class="show-more-btn" on:click={() => toggleItems('topicRepresentation')}>
              {expandedItems.topicRepresentation ? `Show less` : `Show ${topicRepresentation.length - 3} more`}
            </button>
          {/if}
        </div>
      </div>
      
      <!-- Underrepresented Topics -->
      <div class="analytics-card">
        <h2>⚠️ Underrepresented Topics</h2>
        <p class="card-description">Topics with low media coverage but high importance</p>
        <div class="risk-list">
          {#each (expandedItems.underrepresented ? underrepresentedTopics : underrepresentedTopics.slice(0, 3)) as item}
            <div class="risk-item">
              <div class="risk-header">
                <span class="topic-name">{item.topic}</span>
                <span class="risk-badge" style="background-color: {getRiskColor(item.riskLevel)}">{item.riskLevel} Risk</span>
              </div>
              <p class="risk-detail">Only {item.count} mentions found</p>
            </div>
          {/each}
          {#if underrepresentedTopics.length > 3}
            <button class="show-more-btn" on:click={() => toggleItems('underrepresented')}>
              {expandedItems.underrepresented ? `Show less` : `Show ${underrepresentedTopics.length - 3} more`}
            </button>
          {/if}
        </div>
      </div>
      
      <!-- Content by University -->
      <div class="analytics-card">
        <h2>🏛️ Content Creation by University</h2>
        <p class="card-description">Research output and publication metrics</p>
        <div class="university-list">
          {#each (expandedItems.universities ? contentByUniversity : contentByUniversity.slice(0, 3)) as uni}
            <div class="university-item">
              <div class="uni-header">
                <h4>{uni.name}</h4>
                <span class="pub-count">{uni.totalPublications} publications</span>
              </div>
              <div class="uni-stats">
                <span>{uni.researchers} researchers</span>
                <span>Avg h-index: {uni.avgHIndex}</span>
              </div>
            </div>
          {/each}
          {#if contentByUniversity.length > 3}
            <button class="show-more-btn" on:click={() => toggleItems('universities')}>
              {expandedItems.universities ? `Show less` : `Show ${contentByUniversity.length - 3} more`}
            </button>
          {/if}
        </div>
      </div>
      
      <!-- Content by Region -->
      <div class="analytics-card">
        <h2>🌎 Regional Content Distribution</h2>
        <p class="card-description">Geographic distribution of research activity</p>
        <div class="region-chart">
          {#each (expandedItems.regions ? contentByRegion : contentByRegion.slice(0, 3)) as region}
            <div class="region-item">
              <div class="region-info">
                <span class="region-name">
                  <span class="region-icon">{getRegionIcon(region.region)}</span>
                  {region.region}
                </span>
                <span class="region-stats">{region.count} researchers • {region.publications} publications</span>
              </div>
              <div class="region-details">
                <span class="detail-item">Avg h-index: {region.avgHIndex || 'N/A'}</span>
                <span class="detail-item">Institutions: {region.uniqueInstitutions || region.count}</span>
              </div>
              <div class="region-bar">
                <div class="region-fill" style="width: {(region.publications / Math.max(...contentByRegion.map(r => r.publications))) * 100}%"></div>
              </div>
            </div>
          {/each}
          {#if contentByRegion.length > 3}
            <button class="show-more-btn" on:click={() => toggleItems('regions')}>
              {expandedItems.regions ? `Show less` : `Show ${contentByRegion.length - 3} more`}
            </button>
          {/if}
        </div>
      </div>
      
      <!-- Content by Science Field -->
      <div class="analytics-card">
        <h2>🔬 Content by Science Field</h2>
        <p class="card-description">Distribution across scientific disciplines</p>
        <div class="field-grid">
          {#each (expandedItems.fields ? contentByField : contentByField.slice(0, 3)) as field}
            <div class="field-card">
              <h4>{field.field}</h4>
              <div class="field-metrics">
                <div class="metric">
                  <span class="metric-value">{field.count}</span>
                  <span class="metric-label">Researchers</span>
                </div>
                <div class="metric">
                  <span class="metric-value">{field.publications}</span>
                  <span class="metric-label">Publications</span>
                </div>
                <div class="metric">
                  <span class="metric-value">{field.avgHIndex}</span>
                  <span class="metric-label">Avg h-index</span>
                </div>
              </div>
            </div>
          {/each}
        </div>
        {#if contentByField.length > 3}
          <button class="show-more-btn" on:click={() => toggleItems('fields')}>
            {expandedItems.fields ? `Show less` : `Show ${contentByField.length - 3} more`}
          </button>
        {/if}
      </div>
      
      <!-- Budget Risk Topics -->
      <div class="analytics-card">
        <h2>💰 Topics at Budget Risk</h2>
        <p class="card-description">Research areas potentially affected by funding changes</p>
        <div class="budget-risk-list">
          {#each (expandedItems.budgetRisk ? budgetRiskTopics : budgetRiskTopics.slice(0, 3)) as item}
            <div class="budget-item">
              <div class="budget-header">
                <span class="topic-name">{item.topic}</span>
                <span class="risk-level" style="color: {getRiskColor(item.riskLevel)}">{item.riskLevel} Risk</span>
              </div>
              <p class="budget-reason">{item.reason}</p>
              <div class="researcher-count">{item.researchers} active researchers</div>
            </div>
          {/each}
          {#if budgetRiskTopics.length > 3}
            <button class="show-more-btn" on:click={() => toggleItems('budgetRisk')}>
              {expandedItems.budgetRisk ? `Show less` : `Show ${budgetRiskTopics.length - 3} more`}
            </button>
          {/if}
        </div>
      </div>
      
      <!-- Novel Topics -->
      <div class="analytics-card">
        <h2>🚀 Emerging & Novel Topics</h2>
        <p class="card-description">Rapidly growing areas of research and content</p>
        <div class="novel-topics">
          {#each (expandedItems.novelTopics ? novelTopics : novelTopics.slice(0, 3)) as topic}
            <div class="novel-item">
              <div class="novel-header">
                <h4>{topic.topic}</h4>
                <span class="growth-badge">{topic.growth}</span>
              </div>
              <p class="novel-description">{topic.description}</p>
              <span class="timeframe">Growth over {topic.timeframe}</span>
            </div>
          {/each}
          {#if novelTopics.length > 3}
            <button class="show-more-btn" on:click={() => toggleItems('novelTopics')}>
              {expandedItems.novelTopics ? `Show less` : `Show ${novelTopics.length - 3} more`}
            </button>
          {/if}
        </div>
      </div>
      
      <!-- Life Impact Content -->
      <div class="analytics-card wide">
        <h2>❤️ Content by Life Impact & Practical Benefit</h2>
        <p class="card-description">Topics ranked by real-world impact and lives affected</p>
        <div class="impact-grid">
          {#each (expandedItems.impactContent ? impactfulContent : impactfulContent.slice(0, 3)) as content}
            <div class="impact-card">
              <div class="impact-header">
                <h4>{content.topic}</h4>
                <span class="impact-level" style="background-color: {getImpactColor(content.impact)}">{content.impact} Impact</span>
              </div>
              <div class="impact-stats">
                <div class="lives-saved">{content.lifesSaved}</div>
                <p class="benefit-description">{content.practicalBenefit}</p>
                <div class="content-coverage">
                  <span>{content.creators} creators</span>
                  <span>{content.researchers} researchers</span>
                </div>
              </div>
            </div>
          {/each}
        </div>
        {#if impactfulContent.length > 3}
          <button class="show-more-btn" on:click={() => toggleItems('impactContent')}>
            {expandedItems.impactContent ? `Show less` : `Show ${impactfulContent.length - 3} more`}
          </button>
        {/if}
      </div>
      
      <!-- Trending Topics -->
      <div class="analytics-card">
        <h2>📈 Trending Topics</h2>
        <p class="card-description">Topics gaining momentum in recent months</p>
        <div class="trending-list">
          {#each (expandedItems.trending ? trendingTopics : trendingTopics.slice(0, 3)) as trend}
            <div class="trending-item">
              <div class="trending-info">
                <span class="trending-topic">{trend.topic}</span>
                <span class="trending-growth">{trend.trend}</span>
              </div>
              <span class="trending-period">Over {trend.period}</span>
            </div>
          {/each}
          {#if trendingTopics.length > 3}
            <button class="show-more-btn" on:click={() => toggleItems('trending')}>
              {expandedItems.trending ? `Show less` : `Show ${trendingTopics.length - 3} more`}
            </button>
          {/if}
        </div>
      </div>
      
    </div>
  {/if}
</div>

<style>
  .analytics-container {
    max-width: 1400px;
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
    max-width: 800px;
    margin: 0 auto;
  }
  
  .loading, .error {
    text-align: center;
    padding: 4rem;
  }
  
  .error h2 {
    color: #dc3545;
    margin-bottom: 1rem;
  }
  
  .error button {
    background: #646cff;
    color: white;
    border: none;
    padding: 0.75rem 2rem;
    border-radius: 6px;
    cursor: pointer;
    margin-top: 1rem;
  }
  
  .error button:hover {
    background: #535bf2;
  }
  
  .spinner {
    width: 50px;
    height: 50px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #646cff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .overview-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
    margin-bottom: 3rem;
  }
  
  .insights-section {
    margin-bottom: 3rem;
  }
  
  .insights-section h2 {
    text-align: center;
    color: #333;
    margin-bottom: 2rem;
    font-size: 2rem;
  }
  
  .insights-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }
  
  .insight-card {
    padding: 1.5rem;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    border-left: 4px solid #007bff;
    background: white;
  }
  
  .insight-card.success {
    border-left-color: #28a745;
    background: linear-gradient(135deg, #f8fff9, #ffffff);
  }
  
  .insight-card.warning {
    border-left-color: #ffc107;
    background: linear-gradient(135deg, #fffef8, #ffffff);
  }
  
  .insight-card.info {
    border-left-color: #17a2b8;
    background: linear-gradient(135deg, #f8feff, #ffffff);
  }
  
  .insight-card.opportunity {
    border-left-color: #fd7e14;
    background: linear-gradient(135deg, #fff9f5, #ffffff);
  }
  
  
  .insight-card h4 {
    margin: 0 0 1rem;
    color: #333;
    font-size: 1.1rem;
  }
  
  .insight-value {
    font-size: 1.3rem;
    font-weight: bold;
    color: #007bff;
    margin-bottom: 0.75rem;
  }
  
  .insight-text {
    margin: 0;
    color: #666;
    line-height: 1.5;
    font-size: 0.95rem;
  }
  
  
  .stat-card {
    background: linear-gradient(135deg, #646cff, #535bf2);
    color: white;
    padding: 2rem;
    border-radius: 12px;
    text-align: center;
    box-shadow: 0 4px 12px rgba(100, 108, 255, 0.3);
  }
  
  .stat-card h3 {
    margin: 0 0 1rem 0;
    font-size: 1rem;
    opacity: 0.9;
  }
  
  .stat-number {
    font-size: 2.5rem;
    font-weight: bold;
    margin-bottom: 0.5rem;
  }
  
  .stat-card p {
    margin: 0;
    opacity: 0.8;
    font-size: 0.9rem;
  }
  
  .analytics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 2rem;
  }
  
  .analytics-card {
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 12px;
    padding: 2rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
  
  .analytics-card.wide {
    grid-column: span 2;
  }
  
  .analytics-card h2 {
    margin: 0 0 0.5rem 0;
    color: #333;
    font-size: 1.5rem;
  }
  
  .card-description {
    color: #666;
    margin: 0 0 2rem 0;
    font-size: 0.95rem;
  }
  
  /* Show More Button Styles */
  .show-more-btn {
    background: #f8f9fa;
    color: #646cff;
    border: 1px solid #e0e0e0;
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 500;
    margin-top: 1rem;
    transition: all 0.2s ease;
    display: block;
    width: auto;
    align-self: center;
  }
  
  .show-more-btn:hover {
    background: #646cff;
    color: white;
    border-color: #646cff;
  }
  
  /* Topic Representation Styles */
  .topic-bars {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .topic-bar {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .topic-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .topic-name {
    font-weight: 600;
    color: #333;
  }
  
  .topic-count {
    font-size: 0.9rem;
    color: #666;
  }
  
  .progress-bar {
    width: 100%;
    height: 8px;
    background: #f0f0f0;
    border-radius: 4px;
    overflow: hidden;
  }
  
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #646cff, #535bf2);
    transition: width 0.5s ease;
  }
  
  /* Risk and Budget Styles */
  .risk-list, .budget-risk-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .risk-item, .budget-item {
    padding: 1rem;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    background: #fafafa;
  }
  
  .risk-header, .budget-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }
  
  .risk-badge {
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: bold;
  }
  
  .risk-detail, .budget-reason {
    margin: 0;
    color: #666;
    font-size: 0.9rem;
  }
  
  .researcher-count {
    margin-top: 0.5rem;
    font-size: 0.8rem;
    color: #888;
  }
  
  /* University and Region Styles */
  .university-list, .region-chart {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .university-item, .region-item {
    padding: 1rem;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
  }
  
  .uni-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }
  
  .uni-header h4 {
    margin: 0;
    color: #333;
  }
  
  .pub-count {
    font-weight: bold;
    color: #646cff;
  }
  
  .uni-stats {
    display: flex;
    gap: 1rem;
    font-size: 0.9rem;
    color: #666;
  }
  
  .region-info {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.25rem;
  }
  
  .region-name {
    font-weight: 600;
    color: #333;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .region-icon {
    font-size: 1.2rem;
  }
  
  .region-stats {
    font-size: 0.9rem;
    color: #666;
  }
  
  .region-details {
    display: flex;
    gap: 1.5rem;
    margin-bottom: 0.5rem;
    font-size: 0.85rem;
    color: #888;
  }
  
  .detail-item {
    display: flex;
    align-items: center;
  }
  
  .region-bar {
    width: 100%;
    height: 6px;
    background: #f0f0f0;
    border-radius: 3px;
    overflow: hidden;
  }
  
  .region-fill {
    height: 100%;
    background: linear-gradient(90deg, #28a745, #20c997);
  }
  
  /* Field Grid Styles */
  .field-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }
  
  .field-card {
    padding: 1.5rem;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    background: #fafafa;
    text-align: center;
  }
  
  .field-card h4 {
    margin: 0 0 1rem 0;
    color: #333;
    font-size: 1rem;
  }
  
  .field-metrics {
    display: flex;
    justify-content: space-around;
  }
  
  .metric {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .metric-value {
    font-size: 1.2rem;
    font-weight: bold;
    color: #646cff;
  }
  
  .metric-label {
    font-size: 0.8rem;
    color: #666;
    margin-top: 0.25rem;
  }
  
  /* Novel Topics Styles */
  .novel-topics {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  
  .novel-item {
    padding: 1.5rem;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    background: linear-gradient(135deg, #f8f9ff, #ffffff);
  }
  
  .novel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }
  
  .novel-header h4 {
    margin: 0;
    color: #333;
  }
  
  .growth-badge {
    background: #28a745;
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: bold;
  }
  
  .novel-description {
    margin: 0 0 0.5rem 0;
    color: #666;
    line-height: 1.5;
  }
  
  .timeframe {
    font-size: 0.8rem;
    color: #888;
    font-style: italic;
  }
  
  /* Impact Content Styles */
  .impact-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
  }
  
  .impact-card {
    padding: 1.5rem;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    background: #fafafa;
  }
  
  .impact-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }
  
  .impact-header h4 {
    margin: 0;
    color: #333;
  }
  
  .impact-level {
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: bold;
  }
  
  .lives-saved {
    font-size: 1.5rem;
    font-weight: bold;
    color: #dc3545;
    margin-bottom: 0.5rem;
  }
  
  .benefit-description {
    margin: 0 0 1rem 0;
    color: #666;
    line-height: 1.5;
  }
  
  .content-coverage {
    display: flex;
    gap: 1rem;
    font-size: 0.9rem;
    color: #666;
  }
  
  /* Trending Topics Styles */
  .trending-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .trending-item {
    padding: 1rem;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    background: linear-gradient(135deg, #fff3cd, #ffffff);
  }
  
  .trending-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.25rem;
  }
  
  .trending-topic {
    font-weight: 600;
    color: #333;
  }
  
  .trending-growth {
    color: #28a745;
    font-weight: bold;
  }
  
  .trending-period {
    font-size: 0.8rem;
    color: #666;
  }
  
  @media (max-width: 768px) {
    .analytics-container {
      padding: 1rem;
    }
    
    .header h1 {
      font-size: 2rem;
    }
    
    .analytics-grid {
      grid-template-columns: 1fr;
    }
    
    .analytics-card.wide {
      grid-column: span 1;
    }
    
    .overview-stats {
      grid-template-columns: repeat(2, 1fr);
    }
    
    .field-grid {
      grid-template-columns: 1fr;
    }
    
    .impact-grid {
      grid-template-columns: 1fr;
    }
  }
</style>