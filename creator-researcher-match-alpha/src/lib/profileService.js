// Profile service for managing user data with localStorage persistence

const PROFILE_KEY = 'researchmatch_profile';
const CONNECTIONS_KEY = 'researchmatch_connections';
const MESSAGES_KEY = 'researchmatch_messages';
const DEMO_MODE_KEY = 'researchmatch_demo_mode';

// Demo profiles for switching between researcher and creator
const demoProfiles = {
  researcher: {
    id: 'demo-researcher',
    name: 'Dr. Eshin Jolly',
    email: 'ejolly@ucsd.edu',
    bio: 'Assistant Professor at UC San Diego and founder of the Sciminds Lab. Explores topics in social neuroscience and computation, focusing on how social interactions shape brain function and behavior.',
    type: 'researcher',
    platform: 'YouTube',
    subscribers: '',
    institution: 'UC San Diego',
    field: 'Neuroscience, Cognitive Science, Social Psychology',
    expertise: 'social neuroscience, science tools, social interactions, cognitive neuroscience, machine learning',
    topics: ['Social neuroscience', 'Science tools', 'Social interactions', 'Cognitive neuroscience', 'Machine learning'],
    availability: 'Open to collaborators',
    profileImage: null,
    created_at: new Date().toISOString(),
    h_index: 15,
    citations: 450,
    publications: [
      {
        id: 1,
        title: 'Neural mechanisms of social influence in groups',
        authors: 'Jolly, E., Chang, L.J.',
        journal: 'Nature Neuroscience',
        year: 2023,
        link: 'https://example.com/paper1'
      },
      {
        id: 2,
        title: 'Computational approaches to understanding social behavior',
        authors: 'Jolly, E., Smith, A., Johnson, K.',
        journal: 'Trends in Cognitive Sciences',
        year: 2022,
        link: 'https://example.com/paper2'
      }
    ],
    skills: [
      'fMRI analysis',
      'Machine learning',
      'Python programming',
      'Statistical modeling',
      'Experimental design',
      'Data visualization'
    ],
    collaborations: [
      {
        id: 1,
        name: 'Dr. Luke Chang',
        institution: 'Dartmouth College',
        project: 'Social decision-making in groups',
        year: 2023,
        outcome: 'Published in Nature Neuroscience, presented at SfN 2023'
      },
      {
        id: 2,
        name: 'Dr. Sarah Mitchell',
        institution: 'Stanford University',
        project: 'Climate communication strategies',
        year: 2022,
        outcome: 'Joint grant proposal funded by NSF'
      }
    ],
    platformPreferences: {
      primary: 'youtube',
      secondary: ['podcast', 'blog'],
      avoid: []
    },
    preferredContentTypes: [
      'Educational Explainers',
      'Interview/Discussion',
      'Documentary Style'
    ],
    targetAudience: [
      'General Audience',
      'Students (13-18)',
      'Young Adults (18-25)'
    ],
    audienceSize: '10K-100K',
    stats: {
      connections: 0,
      collaborations: 2,
      messagesSent: 0
    }
  },
  creator: {
    id: 'demo-creator',
    name: 'Derek Muller (Veritasium)',
    email: 'derek@veritasium.com',
    bio: 'Science educator and YouTuber behind Veritasium, one of the largest science channels on YouTube. PhD in Physics Education Research from University of Sydney. Creates engaging videos that explore counterintuitive scientific concepts.',
    type: 'creator',
    platform: 'YouTube',
    subscribers: '18M+',
    institution: '',
    field: 'Science Communication',
    expertise: 'science communication, physics, engineering, misconception research, educational video production',
    topics: ['General science', 'Physics', 'Engineering', 'Debunking misconceptions', 'Science communication'],
    availability: 'Open to collaborators',
    profileImage: null,
    created_at: new Date().toISOString(),
    h_index: 8,
    citations: 125,
    publications: [
      {
        id: 1,
        title: 'The Effectiveness of Interactive Video for Science Education',
        authors: 'Muller, D.A., Bewes, J., Sharma, M.D., Reimann, P.',
        journal: 'Learning and Instruction',
        year: 2008,
        link: 'https://example.com/paper1'
      },
      {
        id: 2,
        title: 'Saying the wrong thing: improving learning with multimedia by including misconceptions',
        authors: 'Muller, D.A., Sharma, M.D., Eklund, J., Reimann, P.',
        journal: 'Journal of Computer Assisted Learning',
        year: 2007,
        link: 'https://example.com/paper2'
      }
    ],
    skills: [
      'Video production',
      'Science communication',
      'Physics education',
      'Misconception research',
      'YouTube strategy',
      'Educational content design'
    ],
    collaborations: [
      {
        id: 1,
        name: 'Dr. Henry Reich (MinutePhysics)',
        institution: 'YouTube',
        project: 'Physics collaboration videos',
        year: 2023,
        outcome: 'Joint video series on quantum mechanics reached 50M+ views'
      },
      {
        id: 2,
        name: 'Dr. Sean Carroll',
        institution: 'Caltech',
        project: 'General relativity explainer',
        year: 2022,
        outcome: 'Educational video explaining spacetime curvature with 12M+ views'
      }
    ],
    platformPreferences: {
      primary: 'youtube',
      secondary: ['podcast', 'twitter'],
      avoid: ['tiktok']
    },
    preferredContentTypes: [
      'Educational Explainers',
      'Documentary Style',
      'Demonstration Videos'
    ],
    targetAudience: [
      'General Audience',
      'Students (13-18)',
      'Young Adults (18-25)',
      'Adults (25-45)'
    ],
    audienceSize: '10M+',
    stats: {
      connections: 0,
      collaborations: 2,
      messagesSent: 0
    }
  }
};

// Demo mode management
export function getDemoMode() {
  try {
    const stored = localStorage.getItem(DEMO_MODE_KEY);
    return stored || 'researcher'; // Default to researcher
  } catch (error) {
    console.error('Error loading demo mode:', error);
    return 'researcher';
  }
}

export function setDemoMode(mode) {
  try {
    localStorage.setItem(DEMO_MODE_KEY, mode);
    // Also update the profile to the new demo profile
    localStorage.setItem(PROFILE_KEY, JSON.stringify(demoProfiles[mode]));
    return true;
  } catch (error) {
    console.error('Error setting demo mode:', error);
    return false;
  }
}

// Profile management
export function getProfile() {
  try {
    const stored = localStorage.getItem(PROFILE_KEY);
    if (stored) {
      const profile = JSON.parse(stored);
      // Check if this is demo data - if so, clear it for alpha version
      if (profile.id && (profile.id === 'demo-researcher' || profile.id === 'demo-creator')) {
        console.log('Clearing demo data from localStorage for alpha version');
        localStorage.removeItem(PROFILE_KEY);
        return null;
      }
      return profile;
    }
  } catch (error) {
    console.error('Error loading profile:', error);
  }
  
  // For alpha version, return null if no profile exists
  // This will trigger the authentication flow
  return null;
}

export function saveProfile(profile) {
  try {
    const profileToSave = {
      ...profile,
      updated_at: new Date().toISOString()
    };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profileToSave));
    return true;
  } catch (error) {
    console.error('Error saving profile:', error);
    return false;
  }
}

export function updateProfileStats(statType, increment = 1) {
  const profile = getProfile();
  if (profile.stats[statType] !== undefined) {
    profile.stats[statType] += increment;
    saveProfile(profile);
  }
}

// Connections management
export function getConnections() {
  try {
    const stored = localStorage.getItem(CONNECTIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading connections:', error);
    return [];
  }
}

export function addConnection(user) {
  try {
    const connections = getConnections();
    const newConnection = {
      id: user.id,
      name: user.name,
      type: user.type,
      bio: user.bio,
      topics: user.topics,
      connectedAt: new Date().toISOString(),
      status: 'connected' // connected, pending, blocked
    };
    
    // Check if connection already exists
    const existingIndex = connections.findIndex(conn => conn.id === user.id);
    if (existingIndex >= 0) {
      connections[existingIndex] = { ...connections[existingIndex], ...newConnection };
    } else {
      connections.push(newConnection);
      updateProfileStats('connections', 1);
    }
    
    localStorage.setItem(CONNECTIONS_KEY, JSON.stringify(connections));
    return true;
  } catch (error) {
    console.error('Error adding connection:', error);
    return false;
  }
}

export function removeConnection(userId) {
  try {
    const connections = getConnections();
    const filtered = connections.filter(conn => conn.id !== userId);
    localStorage.setItem(CONNECTIONS_KEY, JSON.stringify(filtered));
    updateProfileStats('connections', -1);
    return true;
  } catch (error) {
    console.error('Error removing connection:', error);
    return false;  
  }
}

export function isConnected(userId) {
  const connections = getConnections();
  return connections.some(conn => conn.id === userId && conn.status === 'connected');
}

// Messages management
export function getConversations() {
  try {
    const stored = localStorage.getItem(MESSAGES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading conversations:', error);
    return [];
  }
}

export function addMessage(conversationId, message) {
  try {
    const conversations = getConversations();
    const conversationIndex = conversations.findIndex(conv => conv.id === conversationId);
    
    if (conversationIndex >= 0) {
      // Add message to existing conversation
      conversations[conversationIndex].messages.push({
        id: `msg-${Date.now()}`,
        ...message,
        timestamp: new Date().toISOString()
      });
      conversations[conversationIndex].lastMessage = message.text;
      conversations[conversationIndex].lastActivity = new Date().toISOString();
    } else {
      // Create new conversation
      conversations.push({
        id: conversationId,
        name: message.recipientName,
        avatar: message.recipientName.charAt(0),
        messages: [{
          id: `msg-${Date.now()}`,
          ...message,
          timestamp: new Date().toISOString()
        }],
        lastMessage: message.text,
        lastActivity: new Date().toISOString(),
        unread: message.sender === 'other' ? 1 : 0
      });
    }
    
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(conversations));
    if (message.sender === 'me') {
      updateProfileStats('messagesSent', 1);
    }
    return true;
  } catch (error) {
    console.error('Error adding message:', error);
    return false;
  }
}

export function markConversationAsRead(conversationId) {
  try {
    const conversations = getConversations();
    const conversationIndex = conversations.findIndex(conv => conv.id === conversationId);
    
    if (conversationIndex >= 0) {
      conversations[conversationIndex].unread = 0;
      localStorage.setItem(MESSAGES_KEY, JSON.stringify(conversations));
    }
    return true;
  } catch (error) {
    console.error('Error marking conversation as read:', error);
    return false;
  }
}

// Export/Import functionality
export function exportUserData() {
  try {
    const data = {
      profile: getProfile(),
      connections: getConnections(),
      conversations: getConversations(),
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `researchmatch-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Error exporting data:', error);
    return false;
  }
}

export function importUserData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        
        if (data.profile) {
          saveProfile(data.profile);
        }
        if (data.connections) {
          localStorage.setItem(CONNECTIONS_KEY, JSON.stringify(data.connections));
        }
        if (data.conversations) {
          localStorage.setItem(MESSAGES_KEY, JSON.stringify(data.conversations));
        }
        
        resolve(true);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

// Clear all data
export function clearAllData() {
  try {
    localStorage.removeItem(PROFILE_KEY);
    localStorage.removeItem(CONNECTIONS_KEY);
    localStorage.removeItem(MESSAGES_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing data:', error);
    return false;
  }
}