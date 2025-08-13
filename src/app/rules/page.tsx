"use client";
import React, { useState } from "react";
import { useData } from "../../lib/DataContext";
import { 
  convertNaturalLanguageToRule, 
  suggestBusinessRules,
  mockConvertNaturalLanguageToRule,
  mockSuggestBusinessRules,
  type AIResponse 
} from "../../lib/ai-service";

// Enhanced rule types with all 6 types
const RULE_TYPES = [
  { value: "coRun", label: "Co-run", description: "Tasks that must run together" },
  { value: "slotRestriction", label: "Slot Restriction", description: "Limit available slots for groups" },
  { value: "loadLimit", label: "Load Limit", description: "Set maximum load per phase for worker groups" },
  { value: "phaseWindow", label: "Phase Window", description: "Restrict tasks to specific phases" },
  { value: "patternMatch", label: "Pattern Match", description: "Apply rules based on regex patterns" },
  { value: "precedenceOverride", label: "Precedence Override", description: "Define rule priority order" },
];

type CoRunRule = { type: "coRun"; tasks: string[]; priority: number };
type SlotRestrictionRule = { type: "slotRestriction"; group: string; minCommonSlots: number; priority: number };
type LoadLimitRule = { type: "loadLimit"; workerGroup: string; maxSlotsPerPhase: number; priority: number };
type PhaseWindowRule = { type: "phaseWindow"; task: string; phases: number[]; priority: number };
type PatternMatchRule = { type: "patternMatch"; regex: string; template: string; parameters: Record<string, any>; priority: number };
type PrecedenceOverrideRule = { type: "precedenceOverride"; ruleId: string; priority: number; global: boolean };

type Rule = CoRunRule | SlotRestrictionRule | LoadLimitRule | PhaseWindowRule | PatternMatchRule | PrecedenceOverrideRule;

export default function RulesPage() {
  const { tasks, clients, workers, rules, setRules } = useData();
  const [nlInput, setNlInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Form state for all rule types
  const [type, setType] = useState("coRun");
  const [coRunTasks, setCoRunTasks] = useState<string[]>([]);
  const [slotGroup, setSlotGroup] = useState("");
  const [minCommonSlots, setMinCommonSlots] = useState(1);
  const [loadWorkerGroup, setLoadWorkerGroup] = useState("");
  const [maxSlotsPerPhase, setMaxSlotsPerPhase] = useState(1);
  const [phaseTask, setPhaseTask] = useState("");
  const [phaseStart, setPhaseStart] = useState(1);
  const [phaseEnd, setPhaseEnd] = useState(1);
  const [patternRegex, setPatternRegex] = useState("");
  const [patternTemplate, setPatternTemplate] = useState("");
  const [patternParameters, setPatternParameters] = useState("");
  const [precedenceRuleId, setPrecedenceRuleId] = useState("");
  const [precedenceGlobal, setPrecedenceGlobal] = useState(false);
  const [rulePriority, setRulePriority] = useState(1);

  // Get available groups and IDs
  const clientGroups = [...new Set(clients.map(c => c.GroupTag))];
  const workerGroups = [...new Set(workers.map(w => w.WorkerGroup))];
  const taskIDs = tasks.map(t => t.TaskID);

  // Add rule with all types
  const handleAddRule = () => {
    let newRule: Rule;
    
    switch (type) {
      case "coRun":
        newRule = { type: "coRun", tasks: coRunTasks, priority: rulePriority };
        setCoRunTasks([]);
        break;
      case "slotRestriction":
        newRule = { type: "slotRestriction", group: slotGroup, minCommonSlots, priority: rulePriority };
        setSlotGroup("");
        setMinCommonSlots(1);
        break;
      case "loadLimit":
        newRule = { type: "loadLimit", workerGroup: loadWorkerGroup, maxSlotsPerPhase, priority: rulePriority };
        setLoadWorkerGroup("");
        setMaxSlotsPerPhase(1);
        break;
      case "phaseWindow":
        const phases = [];
        for (let i = phaseStart; i <= phaseEnd; i++) phases.push(i);
        newRule = { type: "phaseWindow", task: phaseTask, phases, priority: rulePriority };
        setPhaseTask("");
        setPhaseStart(1);
        setPhaseEnd(1);
        break;
      case "patternMatch":
        let parameters = {};
        try {
          if (patternParameters.trim()) {
            parameters = JSON.parse(patternParameters);
          }
        } catch (e) {
          // If JSON parsing fails, create a simple parameter object
          parameters = { pattern: patternParameters };
        }
        newRule = { type: "patternMatch", regex: patternRegex, template: patternTemplate, parameters, priority: rulePriority };
        setPatternRegex("");
        setPatternTemplate("");
        setPatternParameters("");
        break;
      case "precedenceOverride":
        newRule = { type: "precedenceOverride", ruleId: precedenceRuleId, priority: rulePriority, global: precedenceGlobal };
        setPrecedenceRuleId("");
        setPrecedenceGlobal(false);
        break;
      default:
        return;
    }
    
    setRules([...rules, newRule]);
    setRulePriority(1);
  };

  // AI Convert natural language to rule
  const handleAIConvert = async () => {
    setAiLoading(true);
    setAiError(null);
    
    try {
      let aiResponse: AIResponse;
      
      if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-api-key-here') {
        aiResponse = await convertNaturalLanguageToRule(nlInput, {
          tasks,
          clients,
          workers,
          existingRules: rules
        });
      } else {
        aiResponse = mockConvertNaturalLanguageToRule(nlInput);
      }
      
      if (aiResponse.success && aiResponse.data) {
        const aiRule = aiResponse.data;
        let newRule: Rule;
        
        switch (aiRule.type) {
          case 'coRun':
            newRule = { 
              type: 'coRun', 
              tasks: aiRule.parameters.tasks || [], 
              priority: aiRule.priority || 1 
            };
            break;
          case 'slotRestriction':
            newRule = { 
              type: 'slotRestriction', 
              group: aiRule.parameters.group || '', 
              minCommonSlots: aiRule.parameters.minCommonSlots || 1, 
              priority: aiRule.priority || 1 
            };
            break;
          case 'loadLimit':
            newRule = { 
              type: 'loadLimit', 
              workerGroup: aiRule.parameters.workerGroup || '', 
              maxSlotsPerPhase: aiRule.parameters.maxSlotsPerPhase || 1, 
              priority: aiRule.priority || 1 
            };
            break;
          case 'phaseWindow':
            newRule = { 
              type: 'phaseWindow', 
              task: aiRule.parameters.task || '', 
              phases: aiRule.parameters.phases || [], 
              priority: aiRule.priority || 1 
            };
            break;
          case 'patternMatch':
            newRule = { 
              type: 'patternMatch', 
              regex: aiRule.parameters.regex || '', 
              template: aiRule.parameters.template || '', 
              parameters: aiRule.parameters.parameters || {}, 
              priority: aiRule.priority || 1 
            };
            break;
          case 'precedenceOverride':
            newRule = { 
              type: 'precedenceOverride', 
              ruleId: aiRule.parameters.ruleId || '', 
              priority: aiRule.priority || 1, 
              global: aiRule.parameters.global || false 
            };
            break;
          default:
            throw new Error(`Unsupported rule type: ${aiRule.type}`);
        }
        
        setRules([...rules, newRule]);
        setNlInput("");
        
        if (aiRule.explanation) {
          alert(`AI Rule Created: ${aiRule.explanation}`);
        }
      } else {
        setAiError(aiResponse.error || "Could not parse rule from input. Try being more specific about the rule type and entities.");
      }
    } catch (err: any) {
      setAiError("AI conversion failed. Please try again.");
      console.error("AI conversion error:", err);
    } finally {
      setAiLoading(false);
    }
  };

  // Get AI rule recommendations
  const handleGetAIRecommendations = async () => {
    setAiLoading(true);
    setAiError(null);
    
    try {
      let aiResponse: AIResponse;
      
      if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-api-key-here') {
        aiResponse = await suggestBusinessRules({ tasks, clients, workers });
      } else {
        aiResponse = mockSuggestBusinessRules();
      }
      
      if (aiResponse.success && aiResponse.data?.recommendations) {
        setAiSuggestions(aiResponse.data.recommendations);
        setShowSuggestions(true);
      } else {
        setAiError(aiResponse.error || "Could not get AI recommendations.");
      }
    } catch (err: any) {
      setAiError("AI recommendations failed. Please try again.");
      console.error("AI recommendations error:", err);
    } finally {
      setAiLoading(false);
    }
  };

  // Apply AI recommendation
  const applyAIRecommendation = (recommendation: any) => {
    let newRule: Rule;
    
    switch (recommendation.type) {
      case 'coRun':
        newRule = { 
          type: 'coRun', 
          tasks: recommendation.parameters.tasks || [], 
          priority: recommendation.priority || 1 
        };
        break;
      case 'slotRestriction':
        newRule = { 
          type: 'slotRestriction', 
          group: recommendation.parameters.group || '', 
          minCommonSlots: recommendation.parameters.minCommonSlots || 1, 
          priority: recommendation.priority || 1 
        };
        break;
      case 'loadLimit':
        newRule = { 
          type: 'loadLimit', 
          workerGroup: recommendation.parameters.workerGroup || '', 
          maxSlotsPerPhase: recommendation.parameters.maxSlotsPerPhase || 1, 
          priority: recommendation.priority || 1 
        };
        break;
      case 'phaseWindow':
        newRule = { 
          type: 'phaseWindow', 
          task: recommendation.parameters.task || '', 
          phases: recommendation.parameters.phases || [], 
          priority: recommendation.priority || 1 
        };
        break;
      case 'patternMatch':
        newRule = { 
          type: 'patternMatch', 
          regex: recommendation.parameters.regex || '', 
          template: recommendation.parameters.template || '', 
          parameters: recommendation.parameters.parameters || {}, 
          priority: recommendation.priority || 1 
        };
        break;
      case 'precedenceOverride':
        newRule = { 
          type: 'precedenceOverride', 
          ruleId: recommendation.parameters.ruleId || '', 
          priority: recommendation.priority || 1, 
          global: recommendation.parameters.global || false 
        };
        break;
      default:
        return;
    }
    
    setRules([...rules, newRule]);
    setShowSuggestions(false);
    setAiSuggestions([]);
  };

  // Remove rule
  const removeRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  // Download rules.json
  const handleDownload = () => {
    const rulesConfig = {
      rules: rules.sort((a, b) => a.priority - b.priority),
      metadata: {
        generatedAt: new Date().toISOString(),
        totalRules: rules.length,
        ruleTypes: [...new Set(rules.map(r => r.type))],
        validationStatus: "validated",
        version: "1.0.0"
      }
    };
    
    const blob = new Blob([JSON.stringify(rulesConfig, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rules.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Business Rules Engine</h1>
        <p className="text-gray-600">Create and manage business rules for your resource allocation system</p>
      </div>

      {/* AI Rule Recommendations */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg shadow-sm border border-purple-200 p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">🤖 AI Rule Recommendations</h2>
        <p className="text-gray-600 mb-4">
          Let AI analyze your data and suggest business rules that could improve resource allocation efficiency.
        </p>
        <button
          onClick={handleGetAIRecommendations}
          disabled={aiLoading || (tasks.length === 0 && clients.length === 0 && workers.length === 0)}
          className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
        >
          {aiLoading ? "Analyzing..." : "Get AI Recommendations"}
        </button>
        
        {aiSuggestions.length > 0 && showSuggestions && (
          <div className="mt-6">
            <h3 className="font-semibold mb-3">AI Suggestions</h3>
            <div className="space-y-3">
              {aiSuggestions.map((suggestion, index) => (
                <div key={index} className="bg-white p-4 rounded-lg border border-purple-200">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                        {suggestion.type}
                      </span>
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        Priority {suggestion.priority}
                      </span>
                    </div>
                    <button
                      onClick={() => applyAIRecommendation(suggestion)}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{suggestion.reason}</p>
                  <p className="text-xs text-gray-600">Expected Impact: {suggestion.expectedImpact}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Natural Language Input */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">AI-Powered Rule Creation</h2>
        <div className="mb-4">
          <label className="block font-semibold mb-2">Describe your rule in plain English</label>
          <div className="flex gap-2 mb-2">
            <input
              className="border px-3 py-2 rounded-lg w-full"
              placeholder="e.g., Make tasks T001 and T002 run together, or Set load limit for Senior workers to 2 slots per phase"
              value={nlInput}
              onChange={e => setNlInput(e.target.value)}
            />
            <button
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              type="button"
              onClick={handleAIConvert}
              disabled={aiLoading || !nlInput.trim()}
            >
              {aiLoading ? "Converting..." : "AI Convert"}
            </button>
          </div>
          {aiError && <div className="text-red-500 text-sm">{aiError}</div>}
        </div>
        
        <div className="text-sm text-gray-600">
          <p className="mb-2">💡 <strong>Examples:</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li>"Tasks T001 and T002 must run together"</li>
            <li>"Limit Senior workers to maximum 2 slots per phase"</li>
            <li>"Restrict Enterprise clients to minimum 3 common slots"</li>
            <li>"Task T003 can only run in phases 1-3"</li>
            <li>"Apply co-run rule to all tasks matching pattern T00[1-3]"</li>
            <li>"Override precedence for rule R001 with global priority"</li>
          </ul>
          {(!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-api-key-here') && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">
                <strong>Note:</strong> OpenAI API key not configured. Using mock AI responses for demonstration.
                To enable real AI features, add your OpenAI API key to the environment variables.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Manual Rule Creation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Manual Rule Creation</h2>
        
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block font-semibold mb-2">Rule Type</label>
            <select 
              value={type} 
              onChange={e => setType(e.target.value)} 
              className="border px-3 py-2 rounded-lg w-full"
            >
              {RULE_TYPES.map(rt => (
                <option key={rt.value} value={rt.value}>
                  {rt.label} - {rt.description}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block font-semibold mb-2">Priority (1 = highest)</label>
            <input
              type="number"
              min="1"
              max="10"
              value={rulePriority}
              onChange={e => setRulePriority(Number(e.target.value))}
              className="border px-3 py-2 rounded-lg w-full"
            />
          </div>
        </div>

        {/* Rule-specific form fields */}
        {type === "coRun" && (
          <div className="mb-4">
            <label className="block font-semibold mb-2">Co-run Task IDs</label>
            <select
              multiple
              value={coRunTasks}
              onChange={e => setCoRunTasks(Array.from(e.target.selectedOptions, option => option.value))}
              className="border px-3 py-2 rounded-lg w-full h-24"
            >
              {taskIDs.map(id => (
                <option key={id} value={id}>{id}</option>
              ))}
            </select>
            <p className="text-sm text-gray-600 mt-1">Hold Ctrl/Cmd to select multiple tasks</p>
          </div>
        )}

        {type === "slotRestriction" && (
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block font-semibold mb-2">Group</label>
              <select
                value={slotGroup}
                onChange={e => setSlotGroup(e.target.value)}
                className="border px-3 py-2 rounded-lg w-full"
              >
                <option value="">Select a group</option>
                {clientGroups.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
                {workerGroups.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-2">Minimum Common Slots</label>
              <input
                type="number"
                min="1"
                value={minCommonSlots}
                onChange={e => setMinCommonSlots(Number(e.target.value))}
                className="border px-3 py-2 rounded-lg w-full"
              />
            </div>
          </div>
        )}

        {type === "loadLimit" && (
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block font-semibold mb-2">Worker Group</label>
              <select
                value={loadWorkerGroup}
                onChange={e => setLoadWorkerGroup(e.target.value)}
                className="border px-3 py-2 rounded-lg w-full"
              >
                <option value="">Select a worker group</option>
                {workerGroups.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-2">Max Slots Per Phase</label>
              <input
                type="number"
                min="1"
                value={maxSlotsPerPhase}
                onChange={e => setMaxSlotsPerPhase(Number(e.target.value))}
                className="border px-3 py-2 rounded-lg w-full"
              />
            </div>
          </div>
        )}

        {type === "phaseWindow" && (
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block font-semibold mb-2">Task ID</label>
              <select
                value={phaseTask}
                onChange={e => setPhaseTask(e.target.value)}
                className="border px-3 py-2 rounded-lg w-full"
              >
                <option value="">Select a task</option>
                {taskIDs.map(id => (
                  <option key={id} value={id}>{id}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-2">Phase Range Start</label>
              <input
                type="number"
                min="1"
                value={phaseStart}
                onChange={e => setPhaseStart(Number(e.target.value))}
                className="border px-3 py-2 rounded-lg w-full"
              />
            </div>
            <div>
              <label className="block font-semibold mb-2">Phase Range End</label>
              <input
                type="number"
                min={phaseStart}
                value={phaseEnd}
                onChange={e => setPhaseEnd(Number(e.target.value))}
                className="border px-3 py-2 rounded-lg w-full"
              />
            </div>
          </div>
        )}

        {type === "patternMatch" && (
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block font-semibold mb-2">Regex Pattern</label>
              <input
                type="text"
                value={patternRegex}
                onChange={e => setPatternRegex(e.target.value)}
                placeholder="e.g., T00[1-3]"
                className="border px-3 py-2 rounded-lg w-full"
              />
            </div>
            <div>
              <label className="block font-semibold mb-2">Rule Template</label>
              <input
                type="text"
                value={patternTemplate}
                onChange={e => setPatternTemplate(e.target.value)}
                placeholder="e.g., coRun"
                className="border px-3 py-2 rounded-lg w-full"
              />
            </div>
            <div>
              <label className="block font-semibold mb-2">Parameters (JSON)</label>
              <input
                type="text"
                value={patternParameters}
                onChange={e => setPatternParameters(e.target.value)}
                placeholder='{"key": "value"}'
                className="border px-3 py-2 rounded-lg w-full"
              />
            </div>
          </div>
        )}

        {type === "precedenceOverride" && (
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block font-semibold mb-2">Rule ID to Override</label>
              <input
                type="text"
                value={precedenceRuleId}
                onChange={e => setPrecedenceRuleId(e.target.value)}
                placeholder="e.g., rule_001"
                className="border px-3 py-2 rounded-lg w-full"
              />
            </div>
            <div>
              <label className="block font-semibold mb-2">Global Override</label>
              <div className="flex items-center mt-2">
                <input
                  type="checkbox"
                  checked={precedenceGlobal}
                  onChange={e => setPrecedenceGlobal(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-600">Apply globally across all rules</span>
              </div>
            </div>
          </div>
        )}

        <button 
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors" 
          onClick={handleAddRule} 
          type="button"
        >
          Add Rule
        </button>
      </div>

      {/* Current Rules Display */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Current Rules ({rules.length})</h2>
          <button 
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors" 
            onClick={handleDownload} 
            type="button"
          >
            Download rules.json
          </button>
        </div>
        
        {rules.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📝</div>
            <p>No rules created yet. Use the AI converter or manual form above to create your first rule.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rules
              .sort((a, b) => a.priority - b.priority)
              .map((rule, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        Priority {rule.priority}
                      </span>
                      <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                        {rule.type}
                      </span>
                    </div>
                    <pre className="text-sm bg-white p-2 rounded border overflow-x-auto">
                      {JSON.stringify(rule, null, 2)}
                    </pre>
                  </div>
                  <button
                    onClick={() => removeRule(index)}
                    className="ml-4 text-red-600 hover:text-red-800 p-2"
                  >
                    🗑️
                  </button>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
