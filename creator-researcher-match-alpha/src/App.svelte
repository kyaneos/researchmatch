<script>
  import Nav from './lib/Nav.svelte';
  import Home from './lib/Home.svelte';
  import Discover from './lib/Discover.svelte';
  import Analytics from './lib/Analytics.svelte';
  import Profile from './lib/Profile.svelte';
  import Messages from './lib/Messages.svelte';
  import TextHighlightHandler from './lib/TextHighlightHandler.svelte';
  import Auth from './lib/Auth.svelte';
  import { currentProfile, updateProfile } from './lib/profileStore.js';
  
  let currentPage = 'home';
  let newConversation = null;
  let isAuthenticated = false;
  
  // Check authentication status on component initialization
  $: isAuthenticated = $currentProfile !== null;
  
  function navigate(page) {
    currentPage = page;
  }
  
  function startConversationWith(person) {
    // Create conversation object with unique ID and full person data
    newConversation = {
      id: person.id || `person-${Date.now()}`,
      name: person.name,
      avatar: person.name.charAt(0).toUpperCase(),
      person: person // Pass full person data for context
    };
    
    // Navigate to messages page
    navigate('messages');
    
    // Reset after a short delay to allow the Messages component to process
    setTimeout(() => {
      newConversation = null;
    }, 100);
  }
  
  function handleAuthenticated(event) {
    const { profile } = event.detail;
    updateProfile(); // This will update the currentProfile store
    currentPage = 'home'; // Navigate to home after successful authentication
  }
</script>

<main style="background-color: white; min-height: 100vh;">
  {#if !isAuthenticated}
    <!-- Show authentication screen -->
    <Auth on:authenticated={handleAuthenticated} />
  {:else}
    <!-- Show main application -->
    <Nav {navigate} {currentPage} />
    
    {#if currentPage === 'home'}
      <Home {navigate} />
    {:else if currentPage === 'discover'}
      <Discover {startConversationWith} />
    {:else if currentPage === 'analytics'}
      <Analytics />
    {:else if currentPage === 'profile'}
      <Profile />
    {:else if currentPage === 'messages'}
      <Messages {newConversation} />
    {/if}
    
    <!-- Global text highlight handler for AI rephrase tool -->
    <TextHighlightHandler />
  {/if}
</main>
