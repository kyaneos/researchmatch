<script>
  export let navigate;
  export let currentPage;
  
  let mobileMenuOpen = false;
  
  function toggleMobileMenu() {
    mobileMenuOpen = !mobileMenuOpen;
  }
  
  function handleNavClick(page) {
    navigate(page);
    mobileMenuOpen = false; // Close mobile menu after navigation
  }
</script>

<nav class="navbar">
  <div class="navbar-container">
    <!-- Logo/Brand -->
    <div class="navbar-brand">
      <button class="brand-button" on:click={() => handleNavClick('home')}>
        ResearchMatch
      </button>
    </div>

    <!-- Mobile menu button -->
    <div class="mobile-menu-button">
      <button class="hamburger" class:active={mobileMenuOpen} on:click={toggleMobileMenu} aria-label={mobileMenuOpen ? 'Close mobile menu' : 'Open mobile menu'}>
        <span></span>
        <span></span>
        <span></span>
      </button>
    </div>

    <!-- Navigation Menu -->
    <div class="nav-menu" class:active={mobileMenuOpen}>
      <button 
        class="nav-item" 
        class:active={currentPage === 'home'}
        on:click={() => handleNavClick('home')}
      >
        Home
      </button>
      <button 
        class="nav-item" 
        class:active={currentPage === 'discover'}
        on:click={() => handleNavClick('discover')}
      >
        Discover
      </button>
      <button 
        class="nav-item" 
        class:active={currentPage === 'analytics'}
        on:click={() => handleNavClick('analytics')}
      >
        Analytics
      </button>
      <button 
        class="nav-item" 
        class:active={currentPage === 'profile'}
        on:click={() => handleNavClick('profile')}
      >
        Profile
      </button>
      <button 
        class="nav-item" 
        class:active={currentPage === 'messages'}
        on:click={() => handleNavClick('messages')}
      >
        Messages
      </button>
    </div>
  </div>
</nav>

<style>
  .navbar {
    background-color: #ffffff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    position: sticky;
    top: 0;
    z-index: 1000;
    width: 100%;
    border-bottom: 1px solid #e5e7eb;
  }

  .navbar-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 1rem;
    max-width: 1200px;
    margin: 0 auto;
    height: 64px;
  }

  .navbar-brand {
    flex-shrink: 0;
  }

  .brand-button {
    background: none;
    border: none;
    font-size: 1.5rem;
    font-weight: 800;
    color: #3b82f6;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 0.5rem;
    transition: all 0.2s ease;
  }

  .brand-button:hover {
    background-color: #f3f4f6;
    color: #2563eb;
  }

  .nav-menu {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .nav-item {
    background: none;
    border: none;
    padding: 0.75rem 1rem;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    color: #6b7280;
    border-radius: 0.5rem;
    transition: all 0.2s ease;
    white-space: nowrap;
  }

  .nav-item:hover {
    background-color: #f3f4f6;
    color: #374151;
  }

  .nav-item.active {
    background-color: #3b82f6;
    color: white;
  }

  .nav-item.active:hover {
    background-color: #2563eb;
  }

  .mobile-menu-button {
    display: none;
  }

  .hamburger {
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    width: 2rem;
    height: 2rem;
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0;
    z-index: 10;
  }

  .hamburger span {
    width: 2rem;
    height: 0.25rem;
    background: #374151;
    border-radius: 10px;
    transition: all 0.3s linear;
    position: relative;
    transform-origin: 1px;
  }

  .hamburger.active span:first-child {
    transform: rotate(45deg);
  }

  .hamburger.active span:nth-child(2) {
    opacity: 0;
  }

  .hamburger.active span:nth-child(3) {
    transform: rotate(-45deg);
  }

  /* Mobile styles */
  @media (max-width: 768px) {
    .mobile-menu-button {
      display: block;
    }

    .nav-menu {
      position: fixed;
      top: 64px;
      left: -100%;
      width: 100%;
      height: calc(100vh - 64px);
      background-color: #ffffff;
      flex-direction: column;
      justify-content: flex-start;
      align-items: stretch;
      transition: left 0.3s ease;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      padding: 1rem;
      gap: 0.5rem;
    }

    .nav-menu.active {
      left: 0;
    }

    .nav-item {
      width: 100%;
      text-align: left;
      padding: 1rem;
      border-radius: 0.5rem;
    }
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .navbar {
      background-color: #1f2937;
      border-bottom: 1px solid #374151;
    }

    .brand-button {
      color: #60a5fa;
    }

    .brand-button:hover {
      background-color: #374151;
      color: #93c5fd;
    }

    .nav-item {
      color: #d1d5db;
    }

    .nav-item:hover {
      background-color: #374151;
      color: #f9fafb;
    }

    .nav-item.active {
      background-color: #3b82f6;
      color: white;
    }

    .hamburger span {
      background: #d1d5db;
    }

    .nav-menu {
      background-color: #1f2937;
    }
  }
</style>

