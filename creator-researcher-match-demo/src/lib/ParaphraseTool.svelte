<script>
  import { simulateLLMParaphrasing, copyToClipboard, extractTechnicalTerms } from './paraphraseService.js';
  
  export let text = '';
  export let context = 'general'; // 'profile', 'message', 'research', 'general'
  export let onSimplified = null; // callback when text is simplified
  
  let isProcessing = false;
  let simplifiedText = '';
  let showTool = false;
  let complexityLevel = 'medium'; // 'simple', 'medium', 'detailed'
  let targetAudience = 'general'; // 'general', 'students', 'public', 'creators'
  
  const complexityLevels = {
    simple: {
      name: 'Simple (ELI5)',
      description: 'Explain like I\'m 5 years old',
      prompt: 'extremely simple language suitable for a 10-year-old'
    },
    medium: {
      name: 'Clear & Accessible',
      description: 'Clear but comprehensive',
      prompt: 'clear, accessible language while maintaining important details'
    },
    detailed: {
      name: 'Detailed Explanation',
      description: 'Thorough but non-technical',
      prompt: 'thorough explanation using everyday language and analogies'
    }
  };
  
  const audienceTypes = {
    general: 'general public',
    students: 'high school students',
    public: 'science-curious public',
    creators: 'content creators who want to explain science'
  };
  
  // Simulate LLM paraphrasing - in real implementation, this would call an LLM API
  async function paraphraseText() {
    if (!text.trim()) return;
    
    isProcessing = true;
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      // This simulates what an LLM would return
      // In a real implementation, you'd call OpenAI, Claude, or another LLM API
      simplifiedText = await simulateLLMParaphrasing(text, complexityLevel, targetAudience);
      
      if (onSimplified) {
        onSimplified(simplifiedText);
      }
    } catch (error) {
      console.error('Error paraphrasing text:', error);
      simplifiedText = 'Sorry, there was an error simplifying this text. Please try again.';
    } finally {
      isProcessing = false;
    }
  }
  
  async function copyText() {
    const success = await copyToClipboard(simplifiedText);
    if (success) {
      console.log('Copied to clipboard');
    } else {
      console.error('Failed to copy text to clipboard');
    }
  }
  
  function insertSimplified() {
    if (onSimplified) {
      onSimplified(simplifiedText);
    }
  }
</script>

<div class="paraphrase-tool">
  <button 
    class="paraphrase-trigger" 
    on:click={() => showTool = !showTool}
    title="Simplify academic language for content creators"
  >
    🧠 Simplify Text
  </button>
  
  {#if showTool}
    <div class="paraphrase-panel">
      <div class="panel-header">
        <h3>🧠 Research Simplifier</h3>
        <p>Make academic text accessible for content creation</p>
      </div>
      
      <div class="input-section">
        <label for="source-text">Academic text to simplify:</label>
        <textarea 
          id="source-text"
          bind:value={text} 
          placeholder="Paste academic text, research abstracts, or complex explanations here..."
          rows="4"
        ></textarea>
      </div>
      
      <div class="options-section">
        <div class="option-group">
          <label>Complexity Level:</label>
          <div class="radio-buttons">
            {#each Object.entries(complexityLevels) as [key, level]}
              <label class="radio-option">
                <input 
                  type="radio" 
                  bind:group={complexityLevel} 
                  value={key}
                />
                <div class="radio-content">
                  <strong>{level.name}</strong>
                  <span>{level.description}</span>
                </div>
              </label>
            {/each}
          </div>
        </div>
        
        <div class="option-group">
          <label for="audience-select">Target Audience:</label>
          <select id="audience-select" bind:value={targetAudience}>
            {#each Object.entries(audienceTypes) as [key, description]}
              <option value={key}>{description}</option>
            {/each}
          </select>
        </div>
      </div>
      
      <div class="action-section">
        <button 
          class="simplify-btn"
          on:click={paraphraseText}
          disabled={!text.trim() || isProcessing}
        >
          {#if isProcessing}
            <div class="processing-spinner"></div>
            Processing...
          {:else}
            ✨ Simplify Text
          {/if}
        </button>
      </div>
      
      {#if simplifiedText}
        <div class="result-section">
          <div class="result-header">
            <h4>Simplified Version:</h4>
            <div class="result-actions">
              <button class="copy-btn" on:click={copyText} title="Copy to clipboard">
                📋 Copy
              </button>
              {#if onSimplified}
                <button class="insert-btn" on:click={insertSimplified} title="Use this text">
                  ✅ Use This
                </button>
              {/if}
            </div>
          </div>
          <div class="simplified-text">
            {simplifiedText}
          </div>
          
          <div class="comparison">
            <div class="comparison-metrics">
              <span class="metric">
                📏 {Math.round((simplifiedText.length / text.length) * 100)}% of original length
              </span>
              <span class="metric">
                📚 Readability: {complexityLevel === 'simple' ? 'Elementary' : complexityLevel === 'medium' ? 'High School' : 'College'} level
              </span>
            </div>
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .paraphrase-tool {
    position: relative;
  }
  
  .paraphrase-trigger {
    padding: 0.5rem 1rem;
    background: linear-gradient(135deg, #4CAF50, #45a049);
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 500;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .paraphrase-trigger:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
  }
  
  .paraphrase-panel {
    position: absolute;
    top: 100%;
    right: 0;
    width: 500px;
    max-width: 90vw;
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    z-index: 1000;
    padding: 1.5rem;
    margin-top: 0.5rem;
  }
  
  .panel-header {
    margin-bottom: 1.5rem;
  }
  
  .panel-header h3 {
    margin: 0 0 0.5rem;
    color: #333;
    font-size: 1.2rem;
  }
  
  .panel-header p {
    margin: 0;
    color: #666;
    font-size: 0.9rem;
  }
  
  .input-section {
    margin-bottom: 1.5rem;
  }
  
  .input-section label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #555;
  }
  
  .input-section textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 0.9rem;
    font-family: inherit;
    resize: vertical;
    min-height: 100px;
  }
  
  .input-section textarea:focus {
    outline: none;
    border-color: #4CAF50;
  }
  
  .options-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  
  .option-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #555;
    font-size: 0.9rem;
  }
  
  .radio-buttons {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .radio-option {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .radio-option:hover {
    border-color: #4CAF50;
    background-color: #f8fff8;
  }
  
  .radio-option input[type="radio"] {
    margin: 0;
  }
  
  .radio-content {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .radio-content strong {
    color: #333;
    font-size: 0.9rem;
  }
  
  .radio-content span {
    color: #666;
    font-size: 0.8rem;
  }
  
  .option-group select {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 0.9rem;
  }
  
  .option-group select:focus {
    outline: none;
    border-color: #4CAF50;
  }
  
  .action-section {
    margin-bottom: 1.5rem;
  }
  
  .simplify-btn {
    width: 100%;
    padding: 0.75rem;
    background: linear-gradient(135deg, #4CAF50, #45a049);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 600;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }
  
  .simplify-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
  }
  
  .simplify-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
  
  .processing-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  .result-section {
    border-top: 1px solid #e0e0e0;
    padding-top: 1.5rem;
  }
  
  .result-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }
  
  .result-header h4 {
    margin: 0;
    color: #333;
    font-size: 1rem;
  }
  
  .result-actions {
    display: flex;
    gap: 0.5rem;
  }
  
  .copy-btn,
  .insert-btn {
    padding: 0.4rem 0.8rem;
    border: 1px solid #ddd;
    background: white;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.8rem;
    transition: all 0.2s;
  }
  
  .copy-btn:hover {
    border-color: #007bff;
    background-color: #f0f8ff;
  }
  
  .insert-btn {
    background: #4CAF50;
    color: white;
    border-color: #4CAF50;
  }
  
  .insert-btn:hover {
    background: #45a049;
  }
  
  .simplified-text {
    padding: 1rem;
    background: #f8fff8;
    border: 1px solid #d4edda;
    border-radius: 8px;
    margin-bottom: 1rem;
    line-height: 1.6;
    color: #333;
  }
  
  .comparison {
    padding: 0.75rem;
    background: #f8f9fa;
    border-radius: 6px;
  }
  
  .comparison-metrics {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }
  
  .metric {
    font-size: 0.8rem;
    color: #666;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @media (max-width: 600px) {
    .paraphrase-panel {
      width: 90vw;
      right: -50px;
    }
    
    .options-section {
      flex-direction: column;
    }
    
    .comparison-metrics {
      flex-direction: column;
      gap: 0.5rem;
    }
  }
</style>