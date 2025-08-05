<script>
  import { onMount, onDestroy } from 'svelte';
  import ParaphraseToolMini from './ParaphraseToolMini.svelte';
  
  let showTool = false;
  let selectedText = '';
  let toolPosition = { x: 0, y: 0 };
  let paraphraseToolRef = null;
  
  function handleTextSelection() {
    const selection = window.getSelection();
    const text = selection.toString().trim();
    
    if (text && text.length > 10) { // Only show for meaningful text selections
      selectedText = text;
      
      // Get selection position
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      toolPosition = {
        x: rect.left + (rect.width / 2),
        y: rect.top - 10 // Position above the selection
      };
      
      showTool = true;
    } else {
      showTool = false;
    }
  }
  
  function handleDocumentClick(event) {
    // Hide tool if clicking outside of it
    if (paraphraseToolRef && !paraphraseToolRef.contains(event.target)) {
      showTool = false;
    }
  }
  
  onMount(() => {
    document.addEventListener('mouseup', handleTextSelection);
    document.addEventListener('click', handleDocumentClick);
  });
  
  onDestroy(() => {
    document.removeEventListener('mouseup', handleTextSelection);
    document.removeEventListener('click', handleDocumentClick);
  });
</script>

{#if showTool}
  <div 
    class="highlight-tool-container"
    style="left: {toolPosition.x}px; top: {toolPosition.y}px;"
    bind:this={paraphraseToolRef}
  >
    <div class="tool-popup">
      <ParaphraseToolMini text={selectedText} context="highlight" />
      <button class="close-btn" on:click={() => showTool = false}>×</button>
    </div>
  </div>
{/if}

<style>
  .highlight-tool-container {
    position: fixed;
    z-index: 9999;
    transform: translateX(-50%);
    pointer-events: none;
  }
  
  .tool-popup {
    position: relative;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    padding: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    pointer-events: auto;
    border: 1px solid #e0e0e0;
  }
  
  .close-btn {
    background: none;
    border: none;
    font-size: 1.2rem;
    color: #666;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 4px;
    line-height: 1;
  }
  
  .close-btn:hover {
    background: #f0f0f0;
    color: #333;
  }
</style>