<script>
  import Nav from './lib/Nav.svelte';
  import Home from './lib/Home.svelte';
  import Discover from './lib/Discover.svelte';
  import Analytics from './lib/Analytics.svelte';
  import Profile from './lib/Profile.svelte';
  import Messages from './lib/Messages.svelte';
  import TextHighlightHandler from './lib/TextHighlightHandler.svelte';
  import DemoToggle from './lib/DemoToggle.svelte';
  import { toggleDemoMode } from './lib/profileStore.js';
  
  let currentPage = 'home';
  let newConversation = null;
  let demoToggleRef;
  
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
  
  function handleDemoToggle(event) {
    const { newType } = event.detail;
    toggleDemoMode(newType);
    
    // Update the demo toggle component
    if (demoToggleRef) {
      demoToggleRef.updateCurrentProfile();
    }
  }
</script>

<main style="background-color: white; min-height: 100vh;">
  <!-- Demo toggle banner -->
  <DemoToggle bind:this={demoToggleRef} on:toggle={handleDemoToggle} />
  
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
</main>
