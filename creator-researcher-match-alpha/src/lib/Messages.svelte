<script>
  import { onMount } from 'svelte';
  import { getConnections, addMessage, getConversations } from './profileService.js';
  import { currentProfile } from './profileStore.js';
  
  export let newConversation = null; // { name, avatar, id } - passed from other components
  
  let conversations = [];
  let selectedConversation = null;
  let newMessage = '';
  let showConversations = false; // For mobile view
  let connections = [];
  let showTemplates = false;
  let showStarters = false;
  let showFormatting = false;
  let selectedTemplate = null;
  let attachedFile = null;
  let linkPreview = null;
  let isTyping = false;
  let typingTimeout;
  let showProposalForm = false;
  let proposal = {
    title: '',
    type: 'research',
    duration: '',
    objectives: '',
    deliverables: '',
    timeline: '',
    budget: '',
    notes: ''
  };
  
  let conversationMessages = {};
  let messages = [];
  
  // Dynamic message templates based on current profile
  $: messageTemplates = $currentProfile?.type === 'researcher' ? {
    interview: {
      title: "Podcast Interview Request",
      template: `Hi {name},\n\nI'm ${$currentProfile.name} from ${$currentProfile.institution}, and I host a podcast focused on {topic}. I've been following your work on {research_area}, particularly your recent content on {specific_work}.\n\nI'd love to invite you for a 30-45 minute interview to discuss your content creation approach and how you make complex science accessible to broader audiences. The interview would be conducted via video call at your convenience.\n\nWould you be interested? I'm happy to send more details about the format and potential topics.\n\nBest regards,\n${$currentProfile.name}`
    },
    collaboration: {
      title: "Research Collaboration Proposal",
      template: `Dear {name},\n\nI'm reaching out because I believe our interests align in fascinating ways. Your content on {research_area} complements my current research on {my_project}.\n\nI'm particularly intrigued by your approach to {specific_method} and think there might be opportunities for collaboration. Would you be open to a brief call to explore how we might work together?\n\nLooking forward to hearing from you.\n\nBest,\n${$currentProfile.name}`
    },
    video: {
      title: "Research Consultation Request",
      template: `Hi {name},\n\nI'm a researcher working on {topic} and would love to discuss how to better communicate this research to broader audiences.\n\nYour expertise in science communication would be incredibly valuable. Would you be available for a brief consultation? I can provide more details about the specific questions I have.\n\nWould this be something you're interested in?\n\nThanks,\n${$currentProfile.name}`
    },
    consultation: {
      title: "Expert Consultation Request",
      template: `Dear {name},\n\nI'm working on a research project related to {topic} and your expertise in science communication would be invaluable.\n\nWould you be available for a brief consultation about how to effectively communicate these findings? I'm happy to work around your schedule.\n\nThank you for considering this request.\n\nBest regards,\n${$currentProfile.name}`
    }
  } : {
    interview: {
      title: "Content Collaboration Request",
      template: `Hi {name},\n\nI'm ${$currentProfile?.name}, creator of ${$currentProfile?.platform} content with ${$currentProfile?.subscribers} subscribers. I've been following your research on {research_area}, particularly your recent work on {specific_work}.\n\nI'd love to feature your research in an upcoming video to help make it accessible to my audience. The format would be a conversational interview (15-20 minutes) that we can conduct remotely.\n\nWould you be interested in collaborating?\n\nBest regards,\n${$currentProfile?.name}`
    },
    collaboration: {
      title: "Video Collaboration Proposal",
      template: `Dear Dr. {name},\n\nI'm reaching out because your research on {research_area} would make for incredibly engaging content for my audience of ${$currentProfile?.audienceSize} science enthusiasts.\n\nI'd love to collaborate on a video that explains your work in an accessible way. I handle all production and editing, and you'd have full approval over the final content.\n\nWould you be open to discussing this opportunity?\n\nBest,\n${$currentProfile?.name}`
    },
    video: {
      title: "Educational Video Request",
      template: `Hi Dr. {name},\n\nI create educational content about {topic} and would love to feature your expertise in an upcoming video.\n\nThe format would be a conversational interview where we discuss your research and its real-world applications. I'll handle all the technical aspects and you can review everything before it goes live.\n\nWould this be something you're interested in?\n\nThanks,\n${$currentProfile?.name}`
    },
    consultation: {
      title: "Research Accuracy Review",
      template: `Dear Dr. {name},\n\nI'm working on content related to {topic} and want to ensure complete accuracy. Your expertise in {research_area} would be invaluable for fact-checking.\n\nWould you be available for a brief consultation to review my script/outline? I'm happy to work around your schedule and provide credit in the final content.\n\nThank you for considering this request.\n\nBest regards,\n${$currentProfile?.name}`
    }
  };
  
  // Auto-generated conversation starters based on user type and interests
  function generateConversationStarters(person) {
    const starters = [];
    
    if ($currentProfile?.type === 'researcher') {
      // Researcher talking to creator
      if (person.specialization) {
        starters.push(`I really admire how you make ${person.specialization} accessible to general audiences. What's your secret to simplifying complex concepts?`);
      }
      
      if (person.audience_size) {
        starters.push(`With ${person.audience_size} followers, you have incredible reach! I'd love to discuss how we might collaborate to share research findings.`);
      }
      
      starters.push(`Your content style really resonates with me. How do you decide which scientific topics to cover?`);
      
      if (person.platform) {
        starters.push(`I've been thinking about how researchers can better engage with ${person.platform} creators. Would love your perspective!`);
      }
    } else {
      // Creator talking to researcher
      if (person.recent_work) {
        starters.push(`I saw your recent work on ${person.recent_work}. This could make for incredible content! Would you be interested in collaborating?`);
      }
      
      if (person.research_interests && person.research_interests.length > 0) {
        const interest = person.research_interests[0];
        starters.push(`Your research on ${interest} is exactly what my audience loves to learn about. How can we make this accessible to them?`);
      }
      
      if (person.expertise) {
        starters.push(`I'm always looking for expert perspectives on ${person.expertise.split(',')[0]}. Would you be open to being featured in my content?`);
      }
      
      starters.push(`I'd love to learn more about your research journey. My audience finds scientist origin stories fascinating!`);
    }
    
    if (person.availability?.includes('Open')) {
      starters.push(`I noticed you're ${person.availability}. I have an idea for a collaboration that might interest you...`);
    }
    
    return starters;
  }
  
  onMount(() => {
    connections = getConnections();
    loadConversations();
  });
  
  // React to profile changes and reload conversations
  $: if ($currentProfile) {
    loadConversations();
  }
  
  function loadConversations() {
    const savedConversations = getConversations();
    if (savedConversations.length > 0) {
      conversations = savedConversations.map(conv => ({
        id: conv.id,
        name: conv.name,
        lastMessage: conv.lastMessage,
        timestamp: formatTimestamp(conv.lastActivity),
        unread: conv.unread || 0,
        avatar: conv.avatar,
        person: connections.find(c => c.id === conv.id) || {}
      }));
      
      savedConversations.forEach(conv => {
        conversationMessages[conv.id] = conv.messages || [];
      });
      
      if (conversations.length > 0) {
        selectConversation(conversations[0]);
      }
    } else {
      // Demo conversations based on user type
      if ($currentProfile?.type === 'researcher') {
        // Dr. Eshin Jolly's researcher conversations
        conversations = [
          {
            id: 1,
            name: "Maya (SciShow)",
            lastMessage: "That sounds perfect for our audience!",
            timestamp: "1 day ago",
            unread: 1,
            avatar: "M",
            person: { type: 'creator', platform: 'YouTube', audience_size: '7M+' }
          },
          {
            id: 2,
            name: "Derek (Veritasium)",
            lastMessage: "I'd love to collaborate on this topic",
            timestamp: "2 days ago",
            unread: 1,
            avatar: "D",
            person: { type: 'creator', platform: 'YouTube', audience_size: '18M+' }
          }
        ];
        
        conversationMessages[1] = [
          {
            id: 1,
            sender: "other",
            text: "Hello Dr. Jolly! I've read about your work on social neuroscience—especially your research on modeling gossip and social behavior. Could you tell me in your own words what that study was about?",
            timestamp: "2:15 PM"
          },
          {
            id: 2,
            sender: "me",
            text: "Hi Maya! Thanks for reaching out. The gossip study used video games to understand how people naturally form and spread social information. We found that gossip isn't just idle chatter—it's actually a sophisticated social learning mechanism.",
            timestamp: "2:18 PM"
          },
          {
            id: 3,
            sender: "other",
            text: "That's fascinating! Our audience would love to understand how this applies to social media behavior. Would you be interested in doing a collaboration to explain this research?",
            timestamp: "2:20 PM"
          },
          {
            id: 4,
            sender: "me",
            text: "Absolutely! I think we could create really engaging content about how digital social networks mirror ancient gossip patterns.",
            timestamp: "2:25 PM"
          },
          {
            id: 5,
            sender: "other",
            text: "That sounds perfect for our audience! Let me know your availability for a video call to discuss the format.",
            timestamp: "2:30 PM"
          }
        ];
        
        conversationMessages[2] = [
          {
            id: 1,
            sender: "other",
            text: "Dr. Jolly, I've been following your work on social decision-making. I'm working on a video about how our brains process social information and I'd love your expert perspective.",
            timestamp: "Yesterday 3:20 PM"
          },
          {
            id: 2,
            sender: "me",
            text: "Hi Derek! I'm a big fan of your channel. Your video on the physics of everyday objects was brilliant. I'd be happy to help with the neuroscience side.",
            timestamp: "Yesterday 3:25 PM"
          },
          {
            id: 3,
            sender: "other",
            text: "Thank you! I'm particularly interested in how groups make decisions differently than individuals. Could we explore that in an accessible way?",
            timestamp: "Yesterday 3:30 PM"
          },
          {
            id: 4,
            sender: "me",
            text: "Perfect topic! There's fascinating research on how group dynamics actually change our neural processing. We could demonstrate this with some simple experiments.",
            timestamp: "Yesterday 3:35 PM"
          },
          {
            id: 5,
            sender: "other",
            text: "I'd love to collaborate on this topic. When would be a good time to discuss the concept further?",
            timestamp: "Yesterday 3:40 PM"
          }
        ];
      } else {
        // Derek Muller's creator conversations
        conversations = [
          {
            id: 3,
            name: "Dr. Sean Carroll",
            lastMessage: "Happy to review your script!",
            timestamp: "1 day ago",
            unread: 1,
            avatar: "S",
            person: { type: 'researcher', institution: 'Caltech', field: 'Theoretical Physics' }
          },
          {
            id: 4,
            name: "Dr. Emily Chen",
            lastMessage: "This could make a great series",
            timestamp: "3 days ago",
            unread: 1,
            avatar: "E",
            person: { type: 'researcher', institution: 'MIT', field: 'Climate Science' }
          }
        ];
        
        conversationMessages[3] = [
          {
            id: 1,
            sender: "me",
            text: "Hi Dr. Carroll! I'm Derek from Veritasium. I'm working on a video about spacetime curvature and would love to ensure the physics is completely accurate. Would you be available for a quick fact-check?",
            timestamp: "2:10 PM"
          },
          {
            id: 2,
            sender: "other",
            text: "Hello Derek! I'm familiar with your work - your explanations are always so clear. I'd be happy to help review the content for accuracy.",
            timestamp: "2:15 PM"
          },
          {
            id: 3,
            sender: "me",
            text: "Thank you! I'm trying to visualize how mass curves spacetime using analogies that my viewers can relate to. I want to avoid the common rubber sheet misconception.",
            timestamp: "2:18 PM"
          },
          {
            id: 4,
            sender: "other",
            text: "Excellent approach! The rubber sheet analogy is problematic. Let me suggest some better ways to think about it. Could we schedule a call to discuss?",
            timestamp: "2:22 PM"
          },
          {
            id: 5,
            sender: "me",
            text: "Perfect! I really appreciate researchers like you who are willing to help creators get the science right.",
            timestamp: "2:25 PM"
          },
          {
            id: 6,
            sender: "other",
            text: "Happy to review your script! Science communication is so important, and your platform reaches so many people.",
            timestamp: "2:30 PM"
          }
        ];
        
        conversationMessages[4] = [
          {
            id: 1,
            sender: "me",
            text: "Dr. Chen, I've been reading your recent papers on climate modeling. I'm planning a video series on climate science and would love to feature your research. Would you be interested in collaborating?",
            timestamp: "Monday 10:30 AM"
          },
          {
            id: 2,
            sender: "other",
            text: "Hi Derek! I'm honored you'd consider featuring my work. Climate communication is so crucial right now. What kind of format were you thinking?",
            timestamp: "Monday 11:15 AM"
          },
          {
            id: 3,
            sender: "me",
            text: "I was thinking of a conversational interview where we discuss your latest findings on feedback loops in climate systems. I handle all the production, and you'd have full approval of the final content.",
            timestamp: "Monday 11:20 AM"
          },
          {
            id: 4,
            sender: "other",
            text: "That sounds wonderful! I appreciate that you prioritize accuracy. Climate science has so many misconceptions that need addressing.",
            timestamp: "Monday 11:45 AM"
          },
          {
            id: 5,
            sender: "me",
            text: "Exactly! That's why working with experts like you is so important. We could potentially turn this into a multi-part series.",
            timestamp: "Monday 12:00 PM"
          },
          {
            id: 6,
            sender: "other",
            text: "This could make a great series. There's so much to cover and your audience is perfect for this content.",
            timestamp: "Monday 12:15 PM"
          }
        ];
      }
      
      if (conversations.length > 0) {
        selectConversation(conversations[0]);
      }
    }
  }
  
  function formatTimestamp(timestamp) {
    if (!timestamp) return 'now';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)} days ago`;
    
    return date.toLocaleDateString();
  }
  
  // Handle new conversation from other components
  $: if (newConversation) {
    handleNewConversation(newConversation);
  }
  
  function handleNewConversation(newConv) {
    // Check if conversation already exists
    const existingConv = conversations.find(c => c.id === newConv.id);
    
    if (!existingConv) {
      // Add new conversation to the list
      const conversation = {
        id: newConv.id,
        name: newConv.name,
        lastMessage: "Start a conversation...",
        timestamp: "now",
        unread: 0,
        avatar: newConv.avatar,
        person: newConv.person || {}
      };
      
      conversations = [conversation, ...conversations];
      
      // Initialize empty message array for new conversation
      conversationMessages[newConv.id] = [];
    }
    
    // Select the conversation (existing or new)
    const targetConv = conversations.find(c => c.id === newConv.id);
    selectConversation(targetConv);
  }
  
  function selectConversation(conv) {
    selectedConversation = conv;
    messages = conversationMessages[conv.id] || [];
    showConversations = false; // Hide conversations on mobile after selection
    showStarters = false;
    showTemplates = false;
    
    if (conv.unread > 0) {
      conversations = conversations.map(c => 
        c.id === conv.id ? {...c, unread: 0} : c
      );
    }
  }
  
  function sendMessage() {
    if (newMessage.trim() || attachedFile) {
      const newMsg = {
        id: Date.now(),
        sender: "me",
        text: newMessage,
        timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}),
        attachedFile: attachedFile,
        linkPreview: linkPreview
      };
      
      messages = [...messages, newMsg];
      conversationMessages[selectedConversation.id] = [...messages];
      
      // Save to profile service
      addMessage(selectedConversation.id, {
        text: newMessage,
        sender: 'me',
        recipientName: selectedConversation.name,
        attachedFile: attachedFile,
        linkPreview: linkPreview
      });
      
      // Update conversation in list
      conversations = conversations.map(c => 
        c.id === selectedConversation.id 
          ? {...c, lastMessage: newMessage || 'Sent an attachment', timestamp: 'just now'} 
          : c
      );
      
      // Reset input
      newMessage = '';
      attachedFile = null;
      linkPreview = null;
      showFormatting = false;
      
      // Simulate typing indicator for demo
      setTimeout(() => {
        simulateResponse();
      }, 2000);
    }
  }
  
  function simulateResponse() {
    isTyping = true;
    
    setTimeout(() => {
      isTyping = false;
      const responses = [
        "That's a great question! Let me think about that...",
        "I'd be happy to discuss this further. When would be a good time for you?",
        "Your research sounds fascinating! I'd love to learn more.",
        "Thanks for reaching out! I'm definitely interested in collaborating."
      ];
      
      const response = {
        id: Date.now(),
        sender: "other",
        text: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})
      };
      
      messages = [...messages, response];
      conversationMessages[selectedConversation.id] = [...messages];
      
      // Update conversation in list
      conversations = conversations.map(c => 
        c.id === selectedConversation.id 
          ? {...c, lastMessage: response.text, timestamp: 'just now', unread: 1} 
          : c
      );
    }, 1500);
  }
  
  function useTemplate(template) {
    selectedTemplate = template;
    newMessage = template.template
      .replace('{name}', selectedConversation.name)
      .replace('{topic}', 'neuroscience and social behavior')
      .replace('{research_area}', selectedConversation.person.field || 'your field')
      .replace('{specific_work}', selectedConversation.person.recent_work || 'recent research')
      .replace('{my_project}', 'social neuroscience and computation')
      .replace('{specific_method}', 'computational modeling');
    showTemplates = false;
  }
  
  function useStarter(starter) {
    newMessage = starter;
    showStarters = false;
  }
  
  function handleFileAttachment(event) {
    const file = event.target.files[0];
    if (file) {
      attachedFile = {
        name: file.name,
        size: formatFileSize(file.size),
        type: file.type
      };
    }
  }
  
  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return Math.round(bytes / 1024) + ' KB';
    return Math.round(bytes / 1048576) + ' MB';
  }
  
  function removeAttachment() {
    attachedFile = null;
  }
  
  function detectAndPreviewLink() {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = newMessage.match(urlRegex);
    
    if (urls && urls.length > 0) {
      // Simulate link preview
      linkPreview = {
        url: urls[0],
        title: "Research Paper Title",
        description: "A brief description of the linked content...",
        image: "/api/placeholder/100/100"
      };
    } else {
      linkPreview = null;
    }
  }
  
  function toggleBold() {
    const selection = window.getSelection().toString();
    if (selection) {
      newMessage = newMessage.replace(selection, `**${selection}**`);
    }
  }
  
  function toggleItalic() {
    const selection = window.getSelection().toString();
    if (selection) {
      newMessage = newMessage.replace(selection, `*${selection}*`);
    }
  }
  
  function insertLink() {
    const url = prompt('Enter URL:');
    if (url) {
      const linkText = prompt('Enter link text:') || url;
      newMessage += ` [${linkText}](${url})`;
    }
  }
  
  function createProposal() {
    if (!proposal.title || !proposal.objectives) {
      alert('Please fill in at least the title and objectives');
      return;
    }
    
    const proposalMessage = `
📋 **Project Proposal: ${proposal.title}**

**Type:** ${proposal.type === 'research' ? 'Research Collaboration' : proposal.type === 'content' ? 'Content Creation' : 'Consultation'}
${proposal.duration ? `**Duration:** ${proposal.duration}\n` : ''}

**Objectives:**
${proposal.objectives}
${proposal.deliverables ? `\n**Deliverables:**\n${proposal.deliverables}` : ''}
${proposal.timeline ? `\n**Timeline:**\n${proposal.timeline}` : ''}
${proposal.budget ? `\n**Budget/Resources:**\n${proposal.budget}` : ''}
${proposal.notes ? `\n**Additional Notes:**\n${proposal.notes}` : ''}

*This is a formal collaboration proposal. Please review and let me know if you're interested in discussing further.*
    `.trim();
    
    newMessage = proposalMessage;
    showProposalForm = false;
    proposal = {
      title: '',
      type: 'research',
      duration: '',
      objectives: '',
      deliverables: '',
      timeline: '',
      budget: '',
      notes: ''
    };
  }
</script>

<div class="messages-wrapper">
<div class="messages-container">
  <div class="conversations-list" class:mobile-show={showConversations}>
    <div class="conversations-header">
      <h2>Messages</h2>
      <button class="new-conversation-btn" title="Start new conversation" aria-label="Start new conversation">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M10 5v10m5-5H5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
    </div>
    
    <div class="search-box">
      <input type="text" placeholder="Search conversations..." />
    </div>
    
    <div class="conversations">
      {#each conversations as conv}
        <button 
          class="conversation-item"
          class:active={selectedConversation?.id === conv.id}
          on:click={() => selectConversation(conv)}
        >
          <div class="conversation-avatar">{conv.avatar}</div>
          <div class="conversation-info">
            <div class="conversation-header">
              <h4>{conv.name}</h4>
              <span class="timestamp">{conv.timestamp}</span>
            </div>
            <p class="last-message">{conv.lastMessage}</p>
          </div>
          {#if conv.unread > 0}
            <div class="unread-badge">{conv.unread}</div>
          {/if}
        </button>
      {/each}
    </div>
  </div>
  
  {#if selectedConversation}
  <div class="chat-area">
    <div class="mobile-nav">
      <button class="mobile-back-btn" on:click={() => showConversations = true}>← Messages</button>
    </div>
    <div class="chat-header">
      <div class="chat-avatar">{selectedConversation.avatar}</div>
      <div class="chat-info">
        <h3>{selectedConversation.name}</h3>
        <p>{selectedConversation.person?.field || 'Active 30 minutes ago'}</p>
      </div>
      <div class="chat-actions">
        <button class="action-btn" title="View profile" aria-label="View profile">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="1.5"/>
            <path d="M10 11.5V10M10 8.5V8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    </div>
    
    <div class="messages-area">
      <div class="messages-list">
        {#if showStarters && messages.length === 0}
          <div class="conversation-starters">
            <h4>Suggested conversation starters:</h4>
            {#each generateConversationStarters(selectedConversation.person) as starter}
              <button class="starter-btn" on:click={() => useStarter(starter)}>
                {starter}
              </button>
            {/each}
          </div>
        {/if}
        
        {#each messages as message}
          <div class="message {message.sender}">
            <div class="message-bubble">
              <p>{@html message.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>').replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')}</p>
              
              {#if message.attachedFile}
                <div class="attachment">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h4.5L14 4.5z"/>
                  </svg>
                  <span>{message.attachedFile.name} ({message.attachedFile.size})</span>
                </div>
              {/if}
              
              {#if message.linkPreview}
                <div class="link-preview">
                  <img src={message.linkPreview.image} alt="Preview" />
                  <div class="link-info">
                    <h5>{message.linkPreview.title}</h5>
                    <p>{message.linkPreview.description}</p>
                    <a href={message.linkPreview.url} target="_blank">{message.linkPreview.url}</a>
                  </div>
                </div>
              {/if}
              
              <span class="message-time">{message.timestamp}</span>
            </div>
          </div>
        {/each}
        
        {#if isTyping}
          <div class="message other">
            <div class="message-bubble typing">
              <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        {/if}
      </div>
    </div>
    
    <div class="message-input-container">
      {#if attachedFile}
        <div class="attachment-preview">
          <div class="attachment-info">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h4.5L14 4.5z"/>
            </svg>
            <span>{attachedFile.name} ({attachedFile.size})</span>
          </div>
          <button class="remove-btn" on:click={removeAttachment}>×</button>
        </div>
      {/if}
      
      {#if linkPreview}
        <div class="link-preview-input">
          <img src={linkPreview.image} alt="Preview" />
          <div class="link-info">
            <h5>{linkPreview.title}</h5>
            <p>{linkPreview.url}</p>
          </div>
        </div>
      {/if}
      
      <div class="input-toolbar">
        <button class="toolbar-btn" on:click={() => showTemplates = !showTemplates} title="Message templates" aria-label="Message templates">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M3 2h10a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zm0 4v8h10V6H3z"/>
          </svg>
        </button>
        
        <button class="toolbar-btn" on:click={() => {showStarters = !showStarters; messages.length === 0 && (showStarters = true);}} title="Conversation starters" aria-label="Conversation starters">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0-2.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm1.5-5.5a1.5 1.5 0 1 1-3 0V5.5a1.5 1.5 0 0 1 3 0V7z"/>
          </svg>
        </button>
        
        <button class="toolbar-btn" on:click={() => showProposalForm = !showProposalForm} title="Create project proposal" aria-label="Create project proposal">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
            <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
            <path d="M4 7h8v1H4zm0 3h8v1H4zm0 3h5v1H4z"/>
          </svg>
        </button>
        
        <div class="toolbar-separator"></div>
        
        <button class="toolbar-btn" on:click={() => showFormatting = !showFormatting} title="Formatting" aria-label="Formatting options">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4.5 3h7a.5.5 0 0 1 0 1h-3v8.5a.5.5 0 0 1-1 0V4h-3a.5.5 0 0 1 0-1z"/>
          </svg>
        </button>
        
        <label class="toolbar-btn" title="Attach file">
          <input type="file" on:change={handleFileAttachment} style="display: none;" />
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M7.5 1a.5.5 0 0 1 .5.5v11.793l3.146-3.147a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 .708-.708L7 13.293V1.5a.5.5 0 0 1 .5-.5z"/>
          </svg>
        </label>
        
        <div class="toolbar-separator"></div>
      </div>
      
      {#if showTemplates}
        <div class="templates-dropdown">
          <h4>Message Templates</h4>
          {#each Object.entries(messageTemplates) as [key, template]}
            <button class="template-option" on:click={() => useTemplate(template)}>
              <strong>{template.title}</strong>
            </button>
          {/each}
        </div>
      {/if}
      
      {#if showFormatting}
        <div class="formatting-toolbar">
          <button class="format-btn" on:click={toggleBold} title="Bold">B</button>
          <button class="format-btn italic" on:click={toggleItalic} title="Italic">I</button>
          <button class="format-btn" on:click={insertLink} title="Insert link">🔗</button>
        </div>
      {/if}
      
      {#if showProposalForm}
        <div class="proposal-form">
          <h4>Create Project Proposal</h4>
          <div class="proposal-field">
            <label for="proposal-title">Project Title *</label>
            <input type="text" id="proposal-title" bind:value={proposal.title} placeholder="Enter project title" />
          </div>
          
          <div class="proposal-field">
            <label for="proposal-type">Collaboration Type</label>
            <select id="proposal-type" bind:value={proposal.type}>
              <option value="research">Research Collaboration</option>
              <option value="content">Content Creation</option>
              <option value="consultation">Consultation</option>
              <option value="interview">Interview/Podcast</option>
            </select>
          </div>
          
          <div class="proposal-field">
            <label for="proposal-duration">Duration</label>
            <input type="text" id="proposal-duration" bind:value={proposal.duration} placeholder="e.g., 3 months, ongoing" />
          </div>
          
          <div class="proposal-field">
            <label for="proposal-objectives">Objectives *</label>
            <textarea id="proposal-objectives" bind:value={proposal.objectives} placeholder="What do you hope to achieve?" rows="3"></textarea>
          </div>
          
          <div class="proposal-field">
            <label for="proposal-deliverables">Deliverables</label>
            <textarea id="proposal-deliverables" bind:value={proposal.deliverables} placeholder="Expected outcomes (papers, videos, talks)" rows="2"></textarea>
          </div>
          
          <div class="proposal-field">
            <label for="proposal-timeline">Timeline</label>
            <textarea id="proposal-timeline" bind:value={proposal.timeline} placeholder="Key milestones and dates" rows="2"></textarea>
          </div>
          
          <div class="proposal-field">
            <label for="proposal-budget">Budget/Resources</label>
            <input type="text" id="proposal-budget" bind:value={proposal.budget} placeholder="Required funding or resources" />
          </div>
          
          <div class="proposal-field">
            <label for="proposal-notes">Additional Notes</label>
            <textarea id="proposal-notes" bind:value={proposal.notes} placeholder="Any other relevant information" rows="2"></textarea>
          </div>
          
          <div class="proposal-actions">
            <button class="create-btn" on:click={createProposal}>Create Proposal</button>
            <button class="cancel-btn" on:click={() => showProposalForm = false}>Cancel</button>
          </div>
        </div>
      {/if}
      
      <div class="message-input">
        <textarea 
          placeholder="Type a message..."
          bind:value={newMessage}
          on:input={detectAndPreviewLink}
          on:keypress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          rows="1"
        ></textarea>
        <button class="send-btn" on:click={sendMessage} disabled={!newMessage.trim() && !attachedFile} aria-label="Send message">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M2 10l15-7.5L10 10l7.5 7.5L2 10zm8 0v7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
  {:else}
    <div class="no-conversation">
      <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
        <circle cx="40" cy="40" r="30" stroke="#e0e0e0" stroke-width="2"/>
        <path d="M30 35h20M30 45h20" stroke="#e0e0e0" stroke-width="2" stroke-linecap="round"/>
      </svg>
      <h3>Select a conversation</h3>
      <p>Choose a conversation from the list or start a new one</p>
    </div>
  {/if}
</div>
</div>

<style>
  .messages-wrapper {
    padding: 2rem;
    min-height: calc(100vh - 64px);
    background-color: #f8f9fa;
  }

  .messages-container {
    display: grid;
    grid-template-columns: 350px 1fr;
    gap: 0;
    background-color: white;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    height: 85vh;
    max-height: 800px;
    overflow: hidden;
    margin: 0 auto;
    max-width: 1400px;
  }
  
  .conversations-list {
    border-right: 1px solid #e0e0e0;
    display: flex;
    flex-direction: column;
    background-color: #fafbfc;
  }
  
  .conversations-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid #e0e0e0;
  }
  
  .conversations-header h2 {
    margin: 0;
    color: #333;
    font-size: 1.25rem;
  }
  
  .new-conversation-btn {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: none;
    background-color: #007bff;
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }
  
  .new-conversation-btn:hover {
    background-color: #0056b3;
    transform: scale(1.05);
  }
  
  .search-box {
    padding: 1rem;
    border-bottom: 1px solid #e0e0e0;
  }
  
  .search-box input {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    font-size: 0.9rem;
    transition: border-color 0.2s;
  }
  
  .search-box input:focus {
    outline: none;
    border-color: #007bff;
  }
  
  .conversations {
    flex: 1;
    overflow-y: auto;
  }
  
  .conversation-item {
    width: 100%;
    padding: 1rem 1.5rem;
    background: none;
    border: none;
    border-bottom: 1px solid #f0f0f0;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 1rem;
    text-align: left;
    transition: background-color 0.2s ease;
    position: relative;
  }
  
  .conversation-item:hover {
    background-color: #f8f9fa;
  }
  
  .conversation-item.active {
    background-color: #e3f2fd;
  }
  
  .conversation-avatar {
    width: 50px;
    height: 50px;
    background-color: #007bff;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    flex-shrink: 0;
  }
  
  .conversation-info {
    flex: 1;
    min-width: 0;
  }
  
  .conversation-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.25rem;
  }
  
  .conversation-info h4 {
    margin: 0;
    color: #333;
    font-size: 1rem;
  }
  
  .timestamp {
    color: #999;
    font-size: 0.8rem;
  }
  
  .last-message {
    margin: 0;
    color: #666;
    font-size: 0.9rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .unread-badge {
    position: absolute;
    top: 50%;
    right: 1.5rem;
    transform: translateY(-50%);
    background-color: #dc3545;
    color: white;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    font-weight: bold;
  }
  
  .mobile-nav {
    display: none;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #e0e0e0;
    background-color: #f8f9fa;
    flex-shrink: 0;
  }

  .mobile-back-btn {
    background: none;
    border: none;
    color: #007bff;
    font-size: 1rem;
    cursor: pointer;
    padding: 0;
  }

  .chat-area {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }
  
  .chat-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem;
    border-bottom: 1px solid #e0e0e0;
    flex-shrink: 0;
  }
  
  .chat-avatar {
    width: 40px;
    height: 40px;
    background-color: #007bff;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
  }
  
  .chat-info {
    flex: 1;
  }
  
  .chat-info h3 {
    margin: 0 0 0.25rem 0;
    color: #333;
    font-size: 1.1rem;
  }
  
  .chat-info p {
    margin: 0;
    color: #999;
    font-size: 0.9rem;
  }
  
  .chat-actions {
    display: flex;
    gap: 0.5rem;
  }
  
  .action-btn {
    background: none;
    border: none;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #666;
    transition: all 0.2s;
  }
  
  .action-btn:hover {
    background-color: #f0f0f0;
    color: #007bff;
  }
  
  .messages-area {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .messages-list {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .message {
    display: flex;
  }
  
  .message.me {
    justify-content: flex-end;
  }
  
  .message.other {
    justify-content: flex-start;
  }
  
  .message-bubble {
    max-width: 70%;
    padding: 0.75rem 1rem;
    border-radius: 18px;
    position: relative;
    word-wrap: break-word;
    overflow-wrap: break-word;
    hyphens: auto;
  }
  
  .message.me .message-bubble {
    background-color: #007bff;
    color: white;
  }
  
  .message.other .message-bubble {
    background-color: #f0f0f0;
    color: #333;
  }
  
  .message-bubble p {
    margin: 0 0 0.25rem 0;
    word-wrap: break-word;
    overflow-wrap: break-word;
    line-height: 1.4;
  }
  
  .message-time {
    font-size: 0.75rem;
    opacity: 0.7;
  }
  
  .message-input-container {
    border-top: 1px solid #e0e0e0;
    background-color: #f8f9fa;
    flex-shrink: 0;
    position: relative;
  }
  
  .input-toolbar {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    border-bottom: 1px solid #e0e0e0;
  }
  
  .toolbar-btn {
    background: none;
    border: none;
    width: 32px;
    height: 32px;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #666;
    transition: all 0.2s;
  }
  
  .toolbar-btn:hover {
    background-color: #e0e0e0;
    color: #333;
  }
  
  .toolbar-separator {
    width: 1px;
    height: 20px;
    background-color: #e0e0e0;
    margin: 0 0.5rem;
  }
  
  .templates-dropdown {
    position: absolute;
    bottom: 100%;
    left: 1.5rem;
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    padding: 1rem;
    margin-bottom: 0.5rem;
    min-width: 300px;
    z-index: 10;
  }
  
  .templates-dropdown h4 {
    margin: 0 0 0.75rem;
    color: #333;
    font-size: 0.9rem;
  }
  
  .template-option {
    display: block;
    width: 100%;
    text-align: left;
    padding: 0.75rem;
    border: none;
    background: none;
    cursor: pointer;
    border-radius: 6px;
    transition: background-color 0.2s;
  }
  
  .template-option:hover {
    background-color: #f0f0f0;
  }
  
  .formatting-toolbar {
    position: absolute;
    bottom: 100%;
    right: 1.5rem;
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    padding: 0.5rem;
    margin-bottom: 0.5rem;
    display: flex;
    gap: 0.25rem;
    z-index: 10;
  }
  
  .format-btn {
    width: 32px;
    height: 32px;
    border: none;
    background: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: bold;
    transition: all 0.2s;
  }
  
  .format-btn:hover {
    background-color: #f0f0f0;
  }
  
  .format-btn.italic {
    font-style: italic;
  }
  
  .message-input {
    display: flex;
    gap: 1rem;
    padding: 1rem 1.5rem;
    align-items: flex-end;
  }
  
  .message-input textarea {
    flex: 1;
    padding: 0.75rem 1rem;
    border: 1px solid #e0e0e0;
    border-radius: 20px;
    font-size: 1rem;
    resize: none;
    min-height: 44px;
    max-height: 120px;
    font-family: inherit;
    line-height: 1.4;
    transition: border-color 0.2s;
  }
  
  .message-input textarea:focus {
    outline: none;
    border-color: #007bff;
  }
  
  .send-btn {
    width: 44px;
    height: 44px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }
  
  .send-btn:hover:not(:disabled) {
    background-color: #0056b3;
    transform: scale(1.05);
  }
  
  .send-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .conversation-starters {
    padding: 2rem;
    text-align: center;
  }
  
  .conversation-starters h4 {
    color: #666;
    margin-bottom: 1.5rem;
    font-weight: normal;
  }
  
  .starter-btn {
    display: block;
    width: 100%;
    text-align: left;
    padding: 1rem;
    margin-bottom: 0.75rem;
    border: 1px solid #e0e0e0;
    border-radius: 12px;
    background: white;
    cursor: pointer;
    transition: all 0.2s;
    color: #333;
    font-size: 0.95rem;
  }
  
  .starter-btn:hover {
    border-color: #007bff;
    background-color: #f8f9fa;
  }
  
  .attachment {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.5rem;
    padding: 0.5rem;
    background-color: rgba(0,0,0,0.05);
    border-radius: 8px;
    font-size: 0.85rem;
  }
  
  .message.me .attachment {
    background-color: rgba(255,255,255,0.1);
  }
  
  .link-preview {
    margin-top: 0.75rem;
    border: 1px solid rgba(0,0,0,0.1);
    border-radius: 8px;
    overflow: hidden;
  }
  
  .link-preview img {
    width: 100%;
    height: 120px;
    object-fit: cover;
  }
  
  .link-info {
    padding: 0.75rem;
  }
  
  .link-info h5 {
    margin: 0 0 0.25rem;
    font-size: 0.9rem;
  }
  
  .link-info p {
    margin: 0 0 0.5rem;
    font-size: 0.8rem;
    opacity: 0.8;
  }
  
  .link-info a {
    font-size: 0.75rem;
    color: inherit;
    opacity: 0.6;
  }
  
  .attachment-preview {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #e0e0e0;
    background-color: #e8f4f8;
  }
  
  .attachment-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #0066cc;
  }
  
  .remove-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #666;
    padding: 0 0.5rem;
  }
  
  .link-preview-input {
    display: flex;
    gap: 1rem;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #e0e0e0;
    background-color: #f8f9fa;
  }
  
  .link-preview-input img {
    width: 60px;
    height: 60px;
    object-fit: cover;
    border-radius: 8px;
  }
  
  .typing-indicator {
    display: flex;
    gap: 4px;
    padding: 0.5rem 0;
  }
  
  .typing-indicator span {
    width: 8px;
    height: 8px;
    background-color: #999;
    border-radius: 50%;
    animation: typing 1.4s infinite;
  }
  
  .typing-indicator span:nth-child(2) {
    animation-delay: 0.2s;
  }
  
  .typing-indicator span:nth-child(3) {
    animation-delay: 0.4s;
  }
  
  @keyframes typing {
    0%, 60%, 100% {
      opacity: 0.3;
      transform: translateY(0);
    }
    30% {
      opacity: 1;
      transform: translateY(-10px);
    }
  }
  
  .no-conversation {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #999;
  }
  
  .no-conversation h3 {
    margin: 1rem 0 0.5rem;
    color: #666;
  }
  
  .no-conversation p {
    margin: 0;
    font-size: 0.9rem;
  }
  
  .proposal-form {
    position: absolute;
    bottom: 100%;
    left: 1.5rem;
    right: 1.5rem;
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    padding: 1.5rem;
    margin-bottom: 0.5rem;
    max-height: 70vh;
    overflow-y: auto;
    z-index: 10;
  }
  
  .proposal-form h4 {
    margin: 0 0 1rem;
    color: #333;
  }
  
  .proposal-field {
    margin-bottom: 1rem;
  }
  
  .proposal-field label {
    display: block;
    margin-bottom: 0.25rem;
    font-weight: 500;
    color: #555;
    font-size: 0.9rem;
  }
  
  .proposal-field input,
  .proposal-field select,
  .proposal-field textarea {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 0.9rem;
    font-family: inherit;
  }
  
  .proposal-field input:focus,
  .proposal-field select:focus,
  .proposal-field textarea:focus {
    outline: none;
    border-color: #007bff;
  }
  
  .proposal-actions {
    display: flex;
    gap: 0.75rem;
    margin-top: 1.5rem;
  }
  
  .create-btn {
    flex: 1;
    padding: 0.75rem;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
  }
  
  .create-btn:hover {
    background-color: #0056b3;
  }
  
  .cancel-btn {
    flex: 1;
    padding: 0.75rem;
    background-color: #f0f0f0;
    color: #333;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
  }
  
  .cancel-btn:hover {
    background-color: #e0e0e0;
  }

  /* Mobile and tablet responsiveness */
  @media (max-width: 768px) {
    .messages-wrapper {
      padding: 1rem;
    }
    
    .messages-container {
      grid-template-columns: 1fr;
      height: calc(100vh - 120px);
      margin: 0;
      border-radius: 8px;
    }
    
    .conversations-list {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100vh;
      z-index: 1000;
      background-color: white;
    }
    
    .conversations-list.mobile-show {
      display: flex;
    }
    
    .mobile-nav {
      display: block;
    }
    
    .chat-area {
      border-left: none;
      height: 100vh;
    }
    
    .message-bubble {
      max-width: 85%;
    }
  }

  @media (max-width: 1024px) {
    .messages-container {
      grid-template-columns: 280px 1fr;
      margin: 1rem;
    }
  }
</style>