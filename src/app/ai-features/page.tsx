"use client";
import React, { useState } from "react";
import { useData } from "../../lib/DataContext";
import { 
  modifyDataWithNaturalLanguage,
  advancedErrorCorrection,
  generateIntelligentValidations,
  mockModifyDataWithNaturalLanguage,
  mockAdvancedErrorCorrection,
  mockGenerateIntelligentValidations,
  type AIResponse 
} from "../../lib/ai-service";

export default function AIFeaturesPage() {
  const { clients, workers, tasks, rules, errors, setClients, setWorkers, setTasks } = useData();
  
  // Natural Language Data Modification
  const [modificationInstruction, setModificationInstruction] = useState("");
  const [modificationTarget, setModificationTarget] = useState<'clients' | 'workers' | 'tasks' | 'all'>('all');
  const [modificationResults, setModificationResults] = useState<any>(null);
  const [modificationLoading, setModificationLoading] = useState(false);
  
  // Advanced Error Correction
  const [correctionResults, setCorrectionResults] = useState<any>(null);
  const [correctionLoading, setCorrectionLoading] = useState(false);
  
  // Intelligent Validation Generation
  const [validationResults, setValidationResults] = useState<any>(null);
  const [validationLoading, setValidationLoading] = useState(false);
  
  // General AI state
  const [aiError, setAiError] = useState<string | null>(null);

  // Handle Natural Language Data Modification
  const handleDataModification = async () => {
    if (!modificationInstruction.trim()) return;
    
    setModificationLoading(true);
    setAiError(null);
    setModificationResults(null);
    
    try {
      let aiResponse: AIResponse;
      
      if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-api-key-here') {
        aiResponse = await modifyDataWithNaturalLanguage(
          modificationInstruction,
          { clients, workers, tasks },
          modificationTarget
        );
      } else {
        aiResponse = mockModifyDataWithNaturalLanguage(modificationInstruction);
      }
      
      if (aiResponse.success && aiResponse.data) {
        setModificationResults(aiResponse.data);
      } else {
        setAiError(aiResponse.error || "Could not process modification instruction.");
      }
    } catch (error) {
      setAiError("AI modification failed. Please try again.");
      console.error("AI modification error:", error);
    } finally {
      setModificationLoading(false);
    }
  };

  // Apply AI modifications to data
  const applyModification = (modification: any) => {
    try {
      switch (modification.entityType) {
        case 'clients':
          const updatedClients = [...clients];
          if (updatedClients[modification.recordIndex]) {
            (updatedClients[modification.recordIndex] as any)[modification.field] = modification.newValue;
            setClients(updatedClients);
          }
          break;
        case 'workers':
          const updatedWorkers = [...workers];
          if (updatedWorkers[modification.recordIndex]) {
            (updatedWorkers[modification.recordIndex] as any)[modification.field] = modification.newValue;
            setWorkers(updatedWorkers);
          }
          break;
        case 'tasks':
          const updatedTasks = [...tasks];
          if (updatedTasks[modification.recordIndex]) {
            (updatedTasks[modification.recordIndex] as any)[modification.field] = modification.newValue;
            setTasks(updatedTasks);
          }
          break;
      }
      
      // Show success message
      alert(`Successfully applied modification: ${modification.field} changed from "${modification.oldValue}" to "${modification.newValue}"`);
    } catch (error) {
      setAiError("Failed to apply modification. Please try again.");
    }
  };

  // Handle Advanced Error Correction
  const handleAdvancedErrorCorrection = async () => {
    if (errors.length === 0) {
      setAiError("No validation errors to correct.");
      return;
    }
    
    setCorrectionLoading(true);
    setAiError(null);
    setCorrectionResults(null);
    
    try {
      let aiResponse: AIResponse;
      
      if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-api-key-here') {
        aiResponse = await advancedErrorCorrection(
          errors,
          { clients, workers, tasks },
          { businessRules: rules, priorities: [], constraints: [] }
        );
      } else {
        aiResponse = mockAdvancedErrorCorrection();
      }
      
      if (aiResponse.success && aiResponse.data) {
        setCorrectionResults(aiResponse.data);
      } else {
        setAiError(aiResponse.error || "Could not generate error corrections.");
      }
    } catch (error) {
      setAiError("AI error correction failed. Please try again.");
      console.error("AI error correction error:", error);
    } finally {
      setCorrectionLoading(false);
    }
  };

  // Handle Intelligent Validation Generation
  const handleIntelligentValidation = async () => {
    setValidationLoading(true);
    setAiError(null);
    setValidationResults(null);
    
    try {
      let aiResponse: AIResponse;
      
      if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-api-key-here') {
        aiResponse = await generateIntelligentValidations(
          { clients, workers, tasks },
          [] // existing validations
        );
      } else {
        aiResponse = mockGenerateIntelligentValidations();
      }
      
      if (aiResponse.success && aiResponse.data) {
        setValidationResults(aiResponse.data);
      } else {
        setAiError(aiResponse.error || "Could not generate intelligent validations.");
      }
    } catch (error) {
      setAiError("AI validation generation failed. Please try again.");
      console.error("AI validation generation error:", error);
    } finally {
      setValidationLoading(false);
    }
  };

  const getDataSummary = () => {
    return {
      totalRecords: clients.length + workers.length + tasks.length,
      hasData: clients.length > 0 || workers.length > 0 || tasks.length > 0,
      hasRules: rules.length > 0,
      hasErrors: errors.length > 0
    };
  };

  const summary = getDataSummary();

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🤖 Advanced AI Features</h1>
        <p className="text-gray-600">Experience the power of AI-driven data management and validation</p>
      </div>

      {/* Data Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Data Overview</h2>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{clients.length}</div>
            <div className="text-sm text-blue-600">Clients</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{workers.length}</div>
            <div className="text-sm text-green-600">Workers</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{tasks.length}</div>
            <div className="text-sm text-purple-600">Tasks</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{rules.length}</div>
            <div className="text-sm text-orange-600">Rules</div>
          </div>
        </div>
      </div>

      {/* Natural Language Data Modification */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-sm border border-blue-200 p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">🔧 Natural Language Data Modification</h2>
        <p className="text-gray-600 mb-4">
          Modify your data using plain English instructions. The AI understands context and suggests intelligent changes.
        </p>
        
        <div className="grid md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block font-semibold mb-2">Modification Instruction</label>
            <input
              type="text"
              value={modificationInstruction}
              onChange={(e) => setModificationInstruction(e.target.value)}
              placeholder="e.g., Increase priority of all enterprise clients, Set all senior workers to max load 3"
              className="w-full border px-3 py-2 rounded-lg"
            />
          </div>
          
          <div>
            <label className="block font-semibold mb-2">Target Entity</label>
            <select
              value={modificationTarget}
              onChange={(e) => setModificationTarget(e.target.value as any)}
              className="w-full border px-3 py-2 rounded-lg"
            >
              <option value="all">All Entities</option>
              <option value="clients">Clients Only</option>
              <option value="workers">Workers Only</option>
              <option value="tasks">Tasks Only</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={handleDataModification}
              disabled={modificationLoading || !modificationInstruction.trim() || !summary.hasData}
              className="w-full bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {modificationLoading ? "Processing..." : "Modify Data"}
            </button>
          </div>
        </div>

        {/* Modification Results */}
        {modificationResults && (
          <div className="bg-white p-4 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-800 mb-3">AI Modification Results</h3>
            <div className="mb-3">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Summary:</strong> {modificationResults.summary}
              </p>
              {modificationResults.validationNotes && (
                <p className="text-sm text-yellow-600">
                  <strong>Notes:</strong> {modificationResults.validationNotes}
                </p>
              )}
            </div>
            
            <div className="space-y-3">
              {modificationResults.modifications?.map((mod: any, index: number) => (
                <div key={index} className="bg-blue-50 p-3 rounded border border-blue-200">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        {mod.entityType}
                      </span>
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        Confidence: {Math.round(mod.confidence * 100)}%
                      </span>
                    </div>
                    <button
                      onClick={() => applyModification(mod)}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                  <p className="text-sm text-gray-700 mb-1">{mod.reason}</p>
                  <p className="text-xs text-gray-600">
                    Field: {mod.field} | Current: {mod.oldValue} | New: {mod.newValue}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-sm text-gray-600 mt-3">
          <p className="mb-2">💡 <strong>Example Instructions:</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li>"Increase priority of all enterprise clients by 1"</li>
            <li>"Set all senior workers to maximum load of 3 slots per phase"</li>
            <li>"Change all development tasks to require JavaScript skills"</li>
            <li>"Update all startup clients to priority level 2"</li>
          </ul>
        </div>
      </div>

      {/* Advanced Error Correction */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg shadow-sm border border-green-200 p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">🔍 Advanced AI Error Correction</h2>
        <p className="text-gray-600 mb-4">
          Get intelligent error correction suggestions with business context awareness and alternative solutions.
        </p>
        
        <div className="mb-4">
          <button
            onClick={handleAdvancedErrorCorrection}
            disabled={correctionLoading || !summary.hasErrors}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {correctionLoading ? "Analyzing..." : "Get Advanced Corrections"}
          </button>
        </div>

        {/* Correction Results */}
        {correctionResults && (
          <div className="bg-white p-4 rounded-lg border border-green-200">
            <h3 className="font-semibold text-green-800 mb-3">Advanced Error Correction Results</h3>
            
            <div className="mb-4 p-3 bg-green-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">Data Quality Score:</span>
                <span className="text-2xl font-bold text-green-600">
                  {Math.round((correctionResults.dataQualityScore || 0) * 100)}%
                </span>
              </div>
              <p className="text-sm text-green-700">{correctionResults.validationStrategy}</p>
            </div>

            <div className="space-y-3 mb-4">
              {correctionResults.corrections?.map((correction: any, index: number) => (
                <div key={index} className="bg-green-50 p-3 rounded border border-green-200">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        correction.impact === 'high' ? 'bg-red-100 text-red-800' :
                        correction.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        Impact: {correction.impact}
                      </span>
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        Confidence: {Math.round(correction.confidence * 100)}%
                      </span>
                    </div>
                    <button
                      onClick={() => applyModification(correction)}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                  <p className="text-sm text-gray-700 mb-1">{correction.reason}</p>
                  <p className="text-xs text-gray-600 mb-2">
                    Field: {correction.field} | Current: {correction.oldValue} | Suggested: {correction.suggestedValue}
                  </p>
                  <p className="text-xs text-blue-600 mb-1">
                    <strong>Business Impact:</strong> {correction.businessRuleCompliance}
                  </p>
                  {correction.alternativeSolutions && (
                    <div className="text-xs text-gray-600">
                      <strong>Alternatives:</strong> {correction.alternativeSolutions.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {correctionResults.recommendations && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">General Recommendations</h4>
                <ul className="list-disc pl-5 text-sm text-blue-700">
                  {correctionResults.recommendations.map((rec: string, index: number) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Intelligent Validation Generation */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg shadow-sm border border-purple-200 p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">🧠 Intelligent Validation Generation</h2>
        <p className="text-gray-600 mb-4">
          Let AI analyze your data and generate intelligent validation rules based on patterns and business logic.
        </p>
        
        <div className="mb-4">
          <button
            onClick={handleIntelligentValidation}
            disabled={validationLoading || !summary.hasData}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {validationLoading ? "Generating..." : "Generate Intelligent Validations"}
          </button>
        </div>

        {/* Validation Results */}
        {validationResults && (
          <div className="bg-white p-4 rounded-lg border border-purple-200">
            <h3 className="font-semibold text-purple-800 mb-3">Intelligent Validation Results</h3>
            
            <div className="mb-4 p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">Overall Data Quality Score:</span>
                <span className="text-2xl font-bold text-purple-600">
                  {Math.round((validationResults.dataQualityInsights?.overallScore || 0) * 100)}%
                </span>
              </div>
            </div>

            {/* New Validations */}
            {validationResults.newValidations && (
              <div className="mb-4">
                <h4 className="font-semibold text-purple-800 mb-2">Suggested New Validations</h4>
                <div className="space-y-3">
                  {validationResults.newValidations.map((validation: any, index: number) => (
                    <div key={index} className="bg-purple-50 p-3 rounded border border-purple-200">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          validation.severity === 'error' ? 'bg-red-100 text-red-800' :
                          validation.severity === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {validation.severity}
                        </span>
                        <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                          Priority {validation.priority}
                        </span>
                      </div>
                      <h5 className="font-semibold text-purple-800 mb-1">{validation.name}</h5>
                      <p className="text-sm text-gray-700 mb-2">{validation.description}</p>
                      <p className="text-xs text-gray-600 mb-1">
                        <strong>Applies to:</strong> {validation.appliesTo.join(', ')}
                      </p>
                      <p className="text-xs text-blue-600">
                        <strong>Business Value:</strong> {validation.businessValue}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Data Quality Insights */}
            {validationResults.dataQualityInsights && (
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-green-50 p-3 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">Strengths</h4>
                  <ul className="list-disc pl-5 text-sm text-green-700">
                    {validationResults.dataQualityInsights.strengths?.map((strength: string, index: number) => (
                      <li key={index}>{strength}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <h4 className="font-semibold text-yellow-800 mb-2">Areas for Improvement</h4>
                  <ul className="list-disc pl-5 text-sm text-yellow-700">
                    {validationResults.dataQualityInsights.weaknesses?.map((weakness: string, index: number) => (
                      <li key={index}>{weakness}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {validationResults.dataQualityInsights?.recommendations && (
              <div className="mt-4 bg-blue-50 p-3 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">Recommendations</h4>
                <ul className="list-disc pl-5 text-sm text-blue-700">
                  {validationResults.dataQualityInsights.recommendations.map((rec: string, index: number) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* AI Status */}
      {(!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-api-key-here') && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start">
            <span className="text-yellow-600 text-2xl mr-3">⚠️</span>
            <div>
              <h3 className="font-semibold text-yellow-800 mb-2">OpenAI API Not Configured</h3>
              <p className="text-yellow-700 mb-3">
                To enable real AI features, add your OpenAI API key to the environment variables.
                Currently using mock AI responses for demonstration purposes.
              </p>
              <div className="text-sm text-yellow-600">
                <p><strong>To configure:</strong></p>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>Get an API key from <a href="https://platform.openai.com" target="_blank" rel="noopener noreferrer" className="underline">OpenAI Platform</a></li>
                  <li>Add <code>OPENAI_API_KEY=your-key-here</code> to your environment variables</li>
                  <li>Restart the application</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {aiError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <span className="text-red-600 text-xl mr-2">⚠️</span>
            <span className="text-red-800">{aiError}</span>
          </div>
        </div>
      )}
    </div>
  );
}
