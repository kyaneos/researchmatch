<script>
  import { quickSimplifyText, copyToClipboard } from './paraphraseService.js';
  
  export let text = '';
  export let context = 'general';
  
  let isProcessing = false;
  let showResult = false;
  let simplifiedText = '';
  
  async function quickSimplify() {
    if (!text.trim()) return;
    
    isProcessing = true;
    showResult = false;
    
    // Simulate quick processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      // Use shared simplification logic
      simplifiedText = quickSimplifyText(text);
      showResult = true;
    } catch (error) {
      console.error('Error simplifying:', error);
      simplifiedText = 'Unable to simplify this text.';
      showResult = true;
    } finally {
      isProcessing = false;
    }
  }
  
  async function copyText() {
    const success = await copyToClipboard(simplifiedText);
    if (!success) {
      // Could show an error message to user here
      console.error('Failed to copy text to clipboard');
    }
  }
</script>

<div class="paraphrase-mini-tool">
  <button 
    class="mini-trigger" 
    on:click={quickSimplify}
    disabled={isProcessing}
    title="Quick simplify for content creators"
  >
    {#if isProcessing}
      <div class="mini-spinner"></div>
    {:else}
      🧠
    {/if}
  </button>
  
  {#if showResult}
    <div class="mini-result">
      <div class="result-text">{simplifiedText}</div>
      <div class="result-actions">
        <button class="copy-mini" on:click={copyText} title="Copy simplified text">📋</button>
        <button class="close-result" on:click={() => showResult = false} title="Close">×</button>
      </div>
    </div>
  {/if}
</div>

<style>
  .paraphrase-mini-tool {
    position: relative;
    display: inline-block;
  }
  
  .mini-trigger {
    width: 24px;
    height: 24px;
    background: linear-gradient(135deg, #4CAF50, #45a049);
    color: white;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    font-size: 0.7rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    box-shadow: 0 2px 4px rgba(76, 175, 80, 0.3);
  }
  
  .mini-trigger:hover:not(:disabled) {
    transform: scale(1.1);
    box-shadow: 0 4px 8px rgba(76, 175, 80, 0.4);
  }
  
  .mini-trigger:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .mini-spinner {
    width: 12px;
    height: 12px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-top: 1px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  .mini-result {
    position: absolute;
    top: 100%;
    right: 0;
    width: 300px;
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 1001;
    margin-top: 5px;
    padding: 0.75rem;
  }
  
  .result-text {
    font-size: 0.85rem;
    line-height: 1.4;
    color: #333;
    margin-bottom: 0.5rem;
    background: #f8fff8;
    padding: 0.5rem;
    border-radius: 4px;
    border: 1px solid #d4edda;
  }
  
  .result-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
  }
  
  .copy-mini,
  .close-result {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 4px;
    font-size: 0.8rem;
    transition: background-color 0.2s;
  }
  
  .copy-mini:hover {
    background-color: #f0f0f0;
  }
  
  .close-result:hover {
    background-color: #fee;
    color: #dc3545;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
</style>