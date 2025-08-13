import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'your-api-key-here',
  dangerouslyAllowBrowser: true, // Note: In production, use API routes
});

export interface AIResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export interface ValidationSuggestion {
  field: string;
  currentValue: any;
  suggestedValue: any;
  reason: string;
  confidence: number;
}

export interface RuleSuggestion {
  type: string;
  parameters: Record<string, any>;
  reason: string;
  confidence: number;
}

export interface DataQueryResult {
  query: string;
  results: any[];
  explanation: string;
}

// AI-powered natural language to rule conversion
export async function convertNaturalLanguageToRule(
  input: string,
  context: {
    tasks: any[];
    clients: any[];
    workers: any[];
    existingRules: any[];
  }
): Promise<AIResponse> {
  try {
    const prompt = `
You are an AI assistant that converts natural language descriptions into business rules for a resource allocation system.

Available rule types:
1. coRun - Tasks that must run together
2. slotRestriction - Limit available slots for groups
3. loadLimit - Set maximum load per phase for worker groups
4. phaseWindow - Restrict tasks to specific phases
5. patternMatch - Apply rules based on regex patterns
6. precedenceOverride - Define rule priority order

Context:
- Tasks: ${context.tasks.map(t => `${t.TaskID}: ${t.TaskName}`).join(', ')}
- Client Groups: ${[...new Set(context.clients.map(c => c.GroupTag))].join(', ')}
- Worker Groups: ${[...new Set(context.workers.map(w => w.WorkerGroup))].join(', ')}

User Input: "${input}"

Convert this to a valid rule. Return only valid JSON in this format:
{
  "type": "rule_type",
  "parameters": {...},
  "priority": 1-10,
  "explanation": "Why this rule was created"
}
`;

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a business rules expert. Always return valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from AI');
    }

    // Parse the JSON response
    const ruleData = JSON.parse(response);
    
    return {
      success: true,
      data: ruleData
    };
  } catch (error) {
    console.error('AI rule conversion error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'AI conversion failed'
    };
  }
}

// AI-powered data query using natural language
export async function queryDataWithNaturalLanguage(
  query: string,
  data: {
    clients: any[];
    workers: any[];
    tasks: any[];
  }
): Promise<AIResponse> {
  try {
    const prompt = `
You are an AI assistant that helps users query data using natural language.

Available data:
- Clients: ${data.clients.length} records with fields: ClientID, ClientName, PriorityLevel, RequestedTaskIDs, GroupTag, AttributesJSON
- Workers: ${data.workers.length} records with fields: WorkerID, WorkerName, Skills, AvailableSlots, MaxLoadPerPhase, WorkerGroup, QualificationLevel
- Tasks: ${data.tasks.length} records with fields: TaskID, TaskName, Category, Duration, RequiredSkills, PreferredPhases, MaxConcurrent

User Query: "${query}"

Analyze this query and return:
1. A filter function description
2. The filtered results
3. An explanation of what was found

Return only valid JSON in this format:
{
  "query": "user query",
  "filterDescription": "What the query is looking for",
  "results": [...],
  "explanation": "Explanation of results"
}
`;

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a data analysis expert. Always return valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.2,
      max_tokens: 1000,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from AI');
    }

    const queryResult = JSON.parse(response);
    
    return {
      success: true,
      data: queryResult
    };
  } catch (error) {
    console.error('AI data query error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'AI query failed'
    };
  }
}

// AI-powered error correction suggestions
export async function suggestErrorCorrections(
  errors: any[],
  data: {
    clients: any[];
    workers: any[];
    tasks: any[];
  }
): Promise<AIResponse> {
  try {
    const prompt = `
You are an AI assistant that suggests corrections for data validation errors.

Current errors:
${errors.map(err => `- ${err.message} (${err.type})`).join('\n')}

Available data:
- Clients: ${data.clients.length} records
- Workers: ${data.workers.length} records  
- Tasks: ${data.tasks.length} records

For each error, suggest specific corrections including:
1. What field to change
2. What the new value should be
3. Why this correction makes sense
4. Confidence level (0-1)

Return only valid JSON in this format:
{
  "suggestions": [
    {
      "errorIndex": 0,
      "field": "field_name",
      "currentValue": "current_value",
      "suggestedValue": "suggested_value",
      "reason": "Why this correction makes sense",
      "confidence": 0.9
    }
  ]
}
`;

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a data validation expert. Always return valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 1000,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from AI');
    }

    const suggestions = JSON.parse(response);
    
    return {
      success: true,
      data: suggestions
    };
  } catch (error) {
    console.error('AI error correction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'AI correction failed'
    };
  }
}

// AI-powered rule recommendations
export async function suggestBusinessRules(
  data: {
    clients: any[];
    workers: any[];
    tasks: any[];
  }
): Promise<AIResponse> {
  try {
    const prompt = `
You are an AI assistant that analyzes resource allocation data and suggests business rules.

Analyze this data and suggest 3-5 business rules that would improve resource allocation:

Clients: ${data.clients.length} records
- Priority levels: ${[...new Set(data.clients.map(c => c.PriorityLevel))].join(', ')}
- Groups: ${[...new Set(data.clients.map(c => c.GroupTag))].join(', ')}

Workers: ${data.workers.length} records
- Groups: ${[...new Set(data.workers.map(w => w.WorkerGroup))].join(', ')}
- Skills: ${[...new Set(data.workers.flatMap(w => w.Skills))].join(', ')}

Tasks: ${data.tasks.length} records
- Categories: ${[...new Set(data.tasks.map(t => t.Category))].join(', ')}
- Durations: ${[...new Set(data.tasks.map(t => t.Duration))].join(', ')}

Suggest rules that would:
1. Improve efficiency
2. Ensure fairness
3. Handle priority conflicts
4. Optimize skill matching
5. Manage resource constraints

Return only valid JSON in this format:
{
  "recommendations": [
    {
      "type": "rule_type",
      "parameters": {...},
      "priority": 1-10,
      "reason": "Why this rule is recommended",
      "expectedImpact": "What this rule will improve"
    }
  ]
}
`;

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a business process optimization expert. Always return valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from AI');
    }

    const recommendations = JSON.parse(response);
    
    return {
      success: true,
      data: recommendations
    };
  } catch (error) {
    console.error('AI rule recommendation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'AI recommendation failed'
    };
  }
}

// Fallback mock functions for when AI is not available
export function mockConvertNaturalLanguageToRule(input: string): AIResponse {
  // Simple pattern matching as fallback
  const lowerInput = input.toLowerCase();
  
  if (lowerInput.includes('run together') && lowerInput.includes('task')) {
    return {
      success: true,
      data: {
        type: 'coRun',
        parameters: { tasks: ['T001', 'T002'] },
        priority: 1,
        explanation: 'Detected co-run requirement from natural language'
      }
    };
  }
  
  return {
    success: false,
    error: 'Mock AI cannot parse this input. Please use manual rule creation.'
  };
}

export function mockQueryDataWithNaturalLanguage(query: string): AIResponse {
  return {
    success: false,
    error: 'Mock AI cannot process natural language queries. Please use manual filtering.'
  };
}

export function mockSuggestErrorCorrections(): AIResponse {
  return {
    success: false,
    error: 'Mock AI cannot suggest corrections. Please fix errors manually.'
  };
}

export function mockSuggestBusinessRules(): AIResponse {
  return {
    success: true,
    data: {
      recommendations: [
        {
          type: 'coRun',
          parameters: { tasks: ['T001', 'T002'] },
          priority: 1,
          reason: 'Tasks T001 and T002 are often requested together',
          expectedImpact: 'Improve task coordination and reduce scheduling conflicts'
        }
      ]
    }
  };
}

// AI-powered natural language data modification
export async function modifyDataWithNaturalLanguage(
  instruction: string,
  data: {
    clients: any[];
    workers: any[];
    tasks: any[];
  },
  targetEntity?: 'clients' | 'workers' | 'tasks' | 'all'
): Promise<AIResponse> {
  try {
    const prompt = `
You are an AI assistant that modifies data based on natural language instructions.

Available data:
- Clients: ${data.clients.length} records
- Workers: ${data.workers.length} records  
- Tasks: ${data.tasks.length} records

User Instruction: "${instruction}"
Target Entity: ${targetEntity || 'all'}

Analyze the instruction and return specific data modifications including:
1. Which records to modify
2. What fields to change
3. New values for those fields
4. Reason for the modification
5. Confidence level (0-1)

Return only valid JSON in this format:
{
  "modifications": [
    {
      "entityType": "clients|workers|tasks",
      "recordIndex": 0,
      "field": "field_name",
      "oldValue": "current_value",
      "newValue": "new_value",
      "reason": "Why this modification is needed",
      "confidence": 0.9
    }
  ],
  "summary": "Summary of all modifications",
  "validationNotes": "Any validation concerns or warnings"
}
`;

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a data modification expert. Always return valid JSON and ensure data integrity.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.2,
      max_tokens: 1000,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from AI');
    }

    const modifications = JSON.parse(response);
    
    return {
      success: true,
      data: modifications
    };
  } catch (error) {
    console.error('AI data modification error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'AI modification failed'
    };
  }
}

// Advanced AI-based error correction with context awareness
export async function advancedErrorCorrection(
  errors: any[],
  data: {
    clients: any[];
    workers: any[];
    tasks: any[];
  },
  context?: {
    businessRules?: any[];
    priorities?: any[];
    constraints?: any[];
  }
): Promise<AIResponse> {
  try {
    const prompt = `
You are an AI assistant that provides advanced error correction with business context awareness.

Current validation errors:
${errors.map(err => `- ${err.message} (${err.type}) - Row: ${err.rowIndex || 'N/A'}, Column: ${err.columnId || 'N/A'}`).join('\n')}

Available data:
- Clients: ${data.clients.length} records
- Workers: ${data.workers.length} records  
- Tasks: ${data.tasks.length} records

Business Context:
- Business Rules: ${context?.businessRules?.length || 0} rules
- Priorities: ${context?.priorities ? 'Configured' : 'Not configured'}
- Constraints: ${context?.constraints?.length || 0} constraints

Provide advanced correction suggestions considering:
1. Business rule compliance
2. Data consistency across entities
3. Priority and constraint implications
4. Industry best practices
5. Data quality improvements

Return only valid JSON in this format:
{
  "corrections": [
    {
      "errorIndex": 0,
      "entityType": "clients|workers|tasks",
      "recordIndex": 0,
      "field": "field_name",
      "oldValue": "current_value",
      "suggestedValue": "suggested_value",
      "reason": "Why this correction makes sense",
      "confidence": 0.9,
      "impact": "low|medium|high",
      "businessRuleCompliance": "How this affects business rules",
      "alternativeSolutions": ["alternative1", "alternative2"]
    }
  ],
  "dataQualityScore": 0.85,
  "recommendations": ["general improvement 1", "general improvement 2"],
  "validationStrategy": "Suggested validation approach"
}
`;

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an advanced data validation and business process expert. Always return valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 1500,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from AI');
    }

    const corrections = JSON.parse(response);
    
    return {
      success: true,
      data: corrections
    };
  } catch (error) {
    console.error('AI advanced error correction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'AI advanced correction failed'
    };
  }
}

// AI-based validator enhancements with intelligent rule generation
export async function generateIntelligentValidations(
  data: {
    clients: any[];
    workers: any[];
    tasks: any[];
  },
  existingValidations?: any[]
): Promise<AIResponse> {
  try {
    const prompt = `
You are an AI assistant that generates intelligent validation rules based on data patterns and business logic.

Available data:
- Clients: ${data.clients.length} records
- Workers: ${data.workers.length} records  
- Tasks: ${data.tasks.length} records

Existing Validations: ${existingValidations?.length || 0} rules

Analyze the data and generate intelligent validation rules that:
1. Detect data quality issues
2. Identify business logic violations
3. Suggest cross-entity validations
4. Recommend industry-specific checks
5. Optimize validation performance

Return only valid JSON in this format:
{
  "newValidations": [
    {
      "type": "validation_type",
      "name": "Human readable name",
      "description": "What this validation checks",
      "severity": "error|warning|info",
      "rule": "JavaScript validation logic",
      "priority": 1-10,
      "appliesTo": ["clients", "workers", "tasks"],
      "businessValue": "Why this validation is important"
    }
  ],
  "validationOptimizations": [
    {
      "currentRule": "existing_validation_name",
      "optimization": "How to improve this validation",
      "impact": "low|medium|high"
    }
  ],
  "dataQualityInsights": {
    "overallScore": 0.85,
    "strengths": ["strength1", "strength2"],
    "weaknesses": ["weakness1", "weakness2"],
    "recommendations": ["recommendation1", "recommendation2"]
  }
}
`;

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a data validation and business intelligence expert. Always return valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1500,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from AI');
    }

    const validations = JSON.parse(response);
    
    return {
      success: true,
      data: validations
    };
  } catch (error) {
    console.error('AI validation generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'AI validation generation failed'
    };
  }
}

// Enhanced mock functions for new AI features
export function mockModifyDataWithNaturalLanguage(instruction: string): AIResponse {
  const lowerInstruction = instruction.toLowerCase();
  
  if (lowerInstruction.includes('increase priority') && lowerInstruction.includes('client')) {
    return {
      success: true,
      data: {
        modifications: [
          {
            entityType: "clients",
            recordIndex: 0,
            field: "PriorityLevel",
            oldValue: 2,
            newValue: 1,
            reason: "Increasing priority based on natural language instruction",
            confidence: 0.8,
            impact: "medium",
            businessRuleCompliance: "Complies with priority management rules",
            alternativeSolutions: ["Set to priority 2", "Set to priority 3"]
          }
        ],
        summary: "Modified client priority level based on instruction",
        validationNotes: "Ensure new priority level doesn't conflict with existing business rules"
      }
    };
  }
  
  return {
    success: false,
    error: 'Mock AI cannot process this modification instruction. Please use manual editing.'
  };
}

export function mockAdvancedErrorCorrection(): AIResponse {
  return {
    success: true,
    data: {
      corrections: [
        {
          errorIndex: 0,
          entityType: "clients",
          recordIndex: 0,
          field: "PriorityLevel",
          oldValue: 6,
          suggestedValue: 5,
          reason: "Priority level exceeds maximum allowed value of 5",
          confidence: 0.95,
          impact: "high",
          businessRuleCompliance: "Ensures compliance with priority range constraints",
          alternativeSolutions: ["Set to priority 4", "Set to priority 3"]
        }
      ],
      dataQualityScore: 0.92,
      recommendations: ["Implement range validation for PriorityLevel", "Add data type checking"],
      validationStrategy: "Use real-time validation with immediate feedback"
    }
  };
}

export function mockGenerateIntelligentValidations(): AIResponse {
  return {
    success: true,
    data: {
      newValidations: [
        {
          type: "cross_entity",
          name: "Client-Task Skill Coverage",
          description: "Ensures all requested tasks have available workers with required skills",
          severity: "error",
          rule: "function validateSkillCoverage(clients, workers, tasks) { /* validation logic */ }",
          priority: 8,
          appliesTo: ["clients", "workers", "tasks"],
          businessValue: "Prevents allocation failures due to skill mismatches"
        }
      ],
      validationOptimizations: [
        {
          currentRule: "validateUnknownRefs",
          optimization: "Add caching for frequently accessed task IDs",
          impact: "medium"
        }
      ],
      dataQualityInsights: {
        overallScore: 0.88,
        strengths: ["Consistent data structure", "Complete required fields"],
        weaknesses: ["Limited cross-validation", "Missing business rule checks"],
        recommendations: ["Implement real-time validation", "Add business rule validation"]
      }
    }
  };
}
