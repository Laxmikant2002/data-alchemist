import axios from 'axios';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export interface AIResponse {
  content: string;
  source: 'openai' | 'gemini';
}

// Generic AI response function with fallback
export async function getAIResponse(prompt: string): Promise<AIResponse> {
  // Try OpenAI first
  try {
    console.log('Attempting OpenAI request...');
    const openaiRes = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000,
        temperature: 0.7,
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );
    
    const content = openaiRes.data.choices[0]?.message?.content || '';
    return { content, source: 'openai' };
  } catch (openaiError) {
    console.warn('OpenAI request failed, falling back to Gemini:', openaiError);
    
    // Fallback to Gemini if OpenAI fails
    try {
      const geminiRes = await axios.post(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
        {
          contents: [
            {
              parts: [
                { text: prompt }
              ]
            }
          ],
          generationConfig: {
            maxOutputTokens: 1000,
            temperature: 0.7,
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-goog-api-key': GEMINI_API_KEY,
          },
          timeout: 30000,
        }
      );
      
      const content = geminiRes.data.candidates[0]?.content?.parts[0]?.text || '';
      return { content, source: 'gemini' };
    } catch (geminiError) {
      console.error('Both OpenAI and Gemini requests failed:', { openaiError, geminiError });
      throw new Error('Both OpenAI and Gemini requests failed');
    }
  }
}

// Specialized AI functions for Data Alchemist features

export async function validateDataWithAI(data: any[], entityType: string): Promise<string[]> {
  const prompt = `Analyze this ${entityType} data and identify potential issues beyond basic validation:
  
Data: ${JSON.stringify(data.slice(0, 5), null, 2)}

Please identify:
1. Data quality issues
2. Inconsistent patterns
3. Potential missing relationships
4. Anomalies in values

Return a JSON array of validation messages.`;

  try {
    const response = await getAIResponse(prompt);
    const validations = JSON.parse(response.content);
    return Array.isArray(validations) ? validations : [response.content];
  } catch (error) {
    console.error('AI validation failed:', error);
    return ['AI validation service temporarily unavailable'];
  }
}

export async function suggestDataCorrections(data: any[], errors: string[]): Promise<any[]> {
  const prompt = `Given this data with errors, suggest specific corrections:

Data: ${JSON.stringify(data.slice(0, 5), null, 2)}
Errors: ${errors.join(', ')}

Return a JSON array of correction suggestions with format:
[{
  "row": number,
  "field": "fieldName", 
  "currentValue": "current",
  "suggestedValue": "suggested",
  "reason": "explanation"
}]`;

  try {
    const response = await getAIResponse(prompt);
    const suggestions = JSON.parse(response.content);
    return Array.isArray(suggestions) ? suggestions : [];
  } catch (error) {
    console.error('AI correction suggestions failed:', error);
    return [];
  }
}

export async function parseNaturalLanguageQuery(query: string, dataStructure: any): Promise<any> {
  const prompt = `Convert this natural language query to a filter function for data:

Query: "${query}"
Data structure: ${JSON.stringify(dataStructure, null, 2)}

Return a JSON object with filter criteria:
{
  "filters": [
    {
      "field": "fieldName",
      "operator": "equals|contains|greater|less|between",
      "value": "filterValue"
    }
  ],
  "explanation": "human readable explanation of what will be filtered"
}`;

  try {
    const response = await getAIResponse(prompt);
    return JSON.parse(response.content);
  } catch (error) {
    console.error('Natural language parsing failed:', error);
    return { filters: [], explanation: 'Could not parse query' };
  }
}

export async function suggestDataModifications(query: string, data: any[]): Promise<any> {
  const prompt = `User wants to modify data with this request: "${query}"

Current data sample: ${JSON.stringify(data.slice(0, 3), null, 2)}

Return a JSON object with:
{
  "modifications": [
    {
      "action": "update|add|delete",
      "row": number,
      "field": "fieldName",
      "newValue": "value",
      "explanation": "why this change"
    }
  ],
  "summary": "overall description of changes",
  "confidence": "high|medium|low"
}`;

  try {
    const response = await getAIResponse(prompt);
    return JSON.parse(response.content);
  } catch (error) {
    console.error('Data modification suggestions failed:', error);
    return { modifications: [], summary: 'Could not process modification request', confidence: 'low' };
  }
}

export async function generateBusinessRules(description: string, dataContext: any): Promise<any> {
  const prompt = `Convert this business rule description to a structured rule:

Description: "${description}"
Data context: ${JSON.stringify(dataContext, null, 2)}

Return a JSON rule object:
{
  "type": "coRun|slotRestriction|loadLimit|phaseWindow|patternMatch|precedence",
  "parameters": {
    // rule-specific parameters
  },
  "description": "human readable rule description",
  "applicableEntities": ["list of entity IDs this applies to"]
}`;

  try {
    const response = await getAIResponse(prompt);
    return JSON.parse(response.content);
  } catch (error) {
    console.error('Rule generation failed:', error);
    return { 
      type: 'custom', 
      parameters: { description }, 
      description: 'Custom rule (AI processing failed)',
      applicableEntities: []
    };
  }
}

export async function recommendRules(data: { clients: any[], workers: any[], tasks: any[] }): Promise<any[]> {
  const prompt = `Analyze this data and recommend business rules:

Clients: ${JSON.stringify(data.clients.slice(0, 3), null, 2)}
Workers: ${JSON.stringify(data.workers.slice(0, 3), null, 2)}
Tasks: ${JSON.stringify(data.tasks.slice(0, 3), null, 2)}

Look for patterns and suggest rules like:
- Co-run opportunities (tasks that should run together)
- Load limits for overloaded workers
- Skill-based restrictions
- Priority-based rules

Return JSON array of rule recommendations:
[{
  "type": "ruleType",
  "confidence": "high|medium|low",
  "reasoning": "why this rule is suggested",
  "parameters": {},
  "description": "human readable description"
}]`;

  try {
    const response = await getAIResponse(prompt);
    const recommendations = JSON.parse(response.content);
    return Array.isArray(recommendations) ? recommendations : [];
  } catch (error) {
    console.error('Rule recommendations failed:', error);
    return [];
  }
}

// Smart column mapping for file uploads
export async function mapColumnHeaders(detectedHeaders: string[], expectedStructure: any): Promise<any> {
  const prompt = `Map these detected CSV headers to the expected data structure:

Detected headers: ${JSON.stringify(detectedHeaders)}
Expected structure: ${JSON.stringify(expectedStructure)}

Return a JSON mapping object:
{
  "mappings": {
    "detectedHeader": "expectedField"
  },
  "confidence": "high|medium|low",
  "unmappedHeaders": ["list of headers that couldn't be mapped"],
  "missingFields": ["list of expected fields not found"]
}`;

  try {
    const response = await getAIResponse(prompt);
    return JSON.parse(response.content);
  } catch (error) {
    console.error('Column mapping failed:', error);
    return { 
      mappings: {}, 
      confidence: 'low', 
      unmappedHeaders: detectedHeaders, 
      missingFields: Object.keys(expectedStructure) 
    };
  }
}
