// Shared paraphrasing and text simplification utilities
// Consolidates duplicate logic from ParaphraseTool.svelte and ParaphraseToolMini.svelte

/**
 * Word replacement dictionary for text simplification
 */
export const REPLACEMENT_DICTIONARY = {
  // Academic jargon to simple terms
  'methodology': 'method',
  'paradigm': 'approach',
  'framework': 'system',
  'substantial': 'big',
  'significant': 'important',
  'comprehensive': 'complete',
  'utilize': 'use',
  'demonstrate': 'show',
  'facilitate': 'help',
  'implement': 'put into practice',
  
  // Technical terms to accessible language
  'neural networks': 'computer systems that learn like brains',
  'machine learning': 'teaching computers to learn patterns',
  'artificial intelligence': 'smart computer systems',
  'computational': 'using computers',
  'interdisciplinary': 'combining different fields'
};

/**
 * Complexity-specific examples for common technical terms
 */
export const COMPLEXITY_EXAMPLES = {
  'neural networks': {
    simple: 'Neural networks are like a computer brain that learns by looking at lots and lots of examples, just like how you learn to recognize cats by seeing many cat pictures.',
    medium: 'Neural networks are computer systems inspired by how our brains work. They learn patterns from data by adjusting connections between artificial neurons, similar to how our brain cells connect and learn.',
    detailed: 'Neural networks are computational models that mimic the structure and function of biological neural networks in the brain. They consist of interconnected nodes (neurons) that process information through weighted connections, learning complex patterns through training on large datasets.'
  },
  'quantum': {
    simple: 'Quantum is about tiny particles that can be in two places at once, which sounds weird but helps computers solve really hard problems super fast.',
    medium: 'Quantum physics deals with the strange behavior of tiny particles that can exist in multiple states simultaneously. This unique property allows quantum computers to process information in revolutionary ways.',
    detailed: 'Quantum mechanics describes the behavior of matter and energy at the atomic and subatomic level, where particles exhibit properties like superposition and entanglement that enable quantum computers to perform certain calculations exponentially faster than classical computers.'
  },
  'machine learning': {
    simple: 'Machine learning is when computers learn to do things by practicing, just like how you get better at riding a bike by trying over and over.',
    medium: 'Machine learning is a type of artificial intelligence where computers learn to make predictions or decisions by finding patterns in data, without being explicitly programmed for each task.',
    detailed: 'Machine learning is a subset of artificial intelligence that enables computers to automatically improve their performance on specific tasks through experience, using algorithms that build mathematical models based on training data.'
  }
};

/**
 * Quick text simplification using word replacements
 * @param {string} originalText - Text to simplify
 * @param {Object} customReplacements - Additional replacement dictionary
 * @returns {string} Simplified text
 */
export function quickSimplifyText(originalText, customReplacements = {}) {
  const allReplacements = { ...REPLACEMENT_DICTIONARY, ...customReplacements };
  let simplified = originalText;
  
  for (const [complex, simple] of Object.entries(allReplacements)) {
    const regex = new RegExp(`\\b${complex}\\b`, 'gi');
    simplified = simplified.replace(regex, simple);
  }
  
  // Clean up spacing
  simplified = simplified.replace(/([.!?])\s+/g, '$1 ');
  
  return simplified;
}

/**
 * Advanced paraphrasing simulation based on complexity and audience
 * @param {string} originalText - Original text to paraphrase
 * @param {string} complexity - Complexity level: 'simple', 'medium', 'detailed'
 * @param {string} audience - Target audience (for future use)
 * @returns {Promise<string>} Paraphrased text
 */
export async function simulateLLMParaphrasing(originalText, complexity = 'medium', audience = 'general') {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const lowerText = originalText.toLowerCase();
  
  // Check for specific technical terms first
  for (const [key, responses] of Object.entries(COMPLEXITY_EXAMPLES)) {
    if (lowerText.includes(key)) {
      return responses[complexity] || responses.medium;
    }
  }
  
  // Generic responses based on complexity
  switch (complexity) {
    case 'simple':
      return generateSimpleParaphrase(originalText);
    case 'detailed':
      return generateDetailedParaphrase(originalText);
    case 'medium':
    default:
      return generateMediumParaphrase(originalText);
  }
}

/**
 * Generate simple paraphrase with basic word replacements
 * @param {string} text - Original text
 * @returns {string} Simplified paraphrase
 */
function generateSimpleParaphrase(text) {
  const simplified = quickSimplifyText(text);
  return `Here's a simpler way to explain this: ${simplified}`;
}

/**
 * Generate medium complexity paraphrase
 * @param {string} text - Original text
 * @returns {string} Medium complexity paraphrase
 */
function generateMediumParaphrase(text) {
  const mediumReplacements = {
    'utilize': 'use',
    'demonstrate': 'show',
    'facilitate': 'help',
    'implement': 'put into practice'
  };
  
  let paraphrased = text;
  for (const [complex, simple] of Object.entries(mediumReplacements)) {
    const regex = new RegExp(`\\b${complex}\\b`, 'gi');
    paraphrased = paraphrased.replace(regex, simple);
  }
  
  return `Here's what this means in clearer terms: ${paraphrased}`;
}

/**
 * Generate detailed paraphrase with expanded explanations
 * @param {string} text - Original text
 * @returns {string} Detailed paraphrase
 */
function generateDetailedParaphrase(text) {
  return `Let me break this down in detail: ${text} This involves systematic investigation using established scientific methods to understand complex phenomena and their implications for the broader field.`;
}

/**
 * Extract key technical terms from text
 * @param {string} text - Text to analyze
 * @returns {string[]} Array of found technical terms
 */
export function extractTechnicalTerms(text) {
  const lowerText = text.toLowerCase();
  const foundTerms = [];
  
  // Check for terms we have examples for
  for (const term of Object.keys(COMPLEXITY_EXAMPLES)) {
    if (lowerText.includes(term)) {
      foundTerms.push(term);
    }
  }
  
  // Check for terms in replacement dictionary
  for (const term of Object.keys(REPLACEMENT_DICTIONARY)) {
    if (lowerText.includes(term) && !foundTerms.includes(term)) {
      foundTerms.push(term);
    }
  }
  
  return foundTerms;
}

/**
 * Get complexity-specific definition for a term
 * @param {string} term - Technical term
 * @param {string} complexity - Complexity level
 * @returns {string|null} Definition or null if not found
 */
export function getTermDefinition(term, complexity = 'medium') {
  const termLower = term.toLowerCase();
  
  if (COMPLEXITY_EXAMPLES[termLower]) {
    return COMPLEXITY_EXAMPLES[termLower][complexity] || COMPLEXITY_EXAMPLES[termLower].medium;
  }
  
  if (REPLACEMENT_DICTIONARY[termLower]) {
    return REPLACEMENT_DICTIONARY[termLower];
  }
  
  return null;
}

/**
 * Batch process multiple texts for paraphrasing
 * @param {string[]} texts - Array of texts to paraphrase
 * @param {string} complexity - Complexity level
 * @param {string} audience - Target audience
 * @returns {Promise<string[]>} Array of paraphrased texts
 */
export async function batchParaphrase(texts, complexity = 'medium', audience = 'general') {
  const promises = texts.map(text => simulateLLMParaphrasing(text, complexity, audience));
  return await Promise.all(promises);
}

/**
 * Copy text to clipboard with error handling
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success status
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy text:', error);
    
    // Fallback method for older browsers
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    } catch (fallbackError) {
      console.error('Fallback copy method also failed:', fallbackError);
      return false;
    }
  }
}