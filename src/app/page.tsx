"use client";
import React from "react";
import Link from "next/link";
import { useData } from "../lib/DataContext";

export default function HomePage() {
  const { clients, workers, tasks, rules, errors, loadSampleData, clearData } = useData();

  const getDataSummary = () => {
    return {
      totalRecords: clients.length + workers.length + tasks.length,
      hasData: clients.length > 0 || workers.length > 0 || tasks.length > 0,
      hasRules: rules.length > 0,
      hasErrors: errors.length === 0,
      completionStatus: {
        clients: clients.length > 0 ? "complete" : "pending",
        workers: workers.length > 0 ? "complete" : "pending",
        tasks: tasks.length > 0 ? "complete" : "pending",
        rules: rules.length > 0 ? "complete" : "pending",
        validation: errors.length === 0 ? "complete" : "pending",
        aiFeatures: "complete" // AI Features are now implemented
      }
    };
  };

  const summary = getDataSummary();

  const getCompletionPercentage = () => {
    const steps = Object.values(summary.completionStatus);
    const completed = steps.filter(status => status === "complete").length;
    return Math.round((completed / steps.length) * 100);
  };

  const getNextStep = () => {
    if (!summary.hasData) return { href: "/upload", label: "Upload Data", description: "Start by uploading your CSV or Excel files" };
    if (summary.hasErrors) return { href: "/upload", label: "Fix Validation Errors", description: "Resolve data validation issues" };
    if (!summary.hasRules) return { href: "/rules", label: "Configure Business Rules", description: "Set up allocation constraints and preferences" };
    return { href: "/export", label: "Export Configuration", description: "Download your complete configuration package" };
  };

  const nextStep = getNextStep();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="text-center">
            <div className="text-6xl lg:text-8xl mb-6">🔮</div>
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
              Data Alchemist
            </h1>
            <p className="text-xl lg:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Transform messy spreadsheets into clean, validated, and rule-driven data for intelligent resource allocation
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              {!summary.hasData ? (
                <Link
                  href="/upload"
                  className="inline-flex items-center px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
                >
                  <span className="mr-2">🚀</span>
                  Get Started
                </Link>
              ) : (
                <Link
                  href={nextStep.href}
                  className="inline-flex items-center px-8 py-4 bg-green-600 text-white text-lg font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl"
                >
                  <span className="mr-2">⚡</span>
                  Continue Setup
                </Link>
              )}
              
              <button
                onClick={loadSampleData}
                className="inline-flex items-center px-8 py-4 bg-gray-600 text-white text-lg font-semibold rounded-lg hover:bg-gray-700 transition-colors shadow-lg hover:shadow-xl"
              >
                <span className="mr-2">🧪</span>
                Load Sample Data
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Setup Progress</h2>
          
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Overall Progress</span>
              <span className="text-sm font-medium text-gray-700">{getCompletionPercentage()}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${getCompletionPercentage()}%` }}
              ></div>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="grid md:grid-cols-6 gap-6">
            {[
              { 
                name: "Data Upload", 
                status: summary.completionStatus.clients,
                icon: "📤",
                count: summary.totalRecords,
                href: "/upload"
              },
              { 
                name: "Validation", 
                status: summary.completionStatus.validation,
                icon: "✅",
                count: errors.length,
                href: "/upload"
              },
              { 
                name: "Business Rules", 
                status: summary.completionStatus.rules,
                icon: "⚙️",
                count: rules.length,
                href: "/rules"
              },
              { 
                name: "Priorities", 
                status: "pending",
                icon: "⚖️",
                count: 0,
                href: "/priorities"
              },
              { 
                name: "AI Features", 
                status: summary.completionStatus.aiFeatures,
                icon: "🤖",
                count: 0,
                href: "/ai-features"
              },
              { 
                name: "Export", 
                status: summary.hasData && !summary.hasErrors && summary.hasRules ? "complete" : "pending",
                icon: "📥",
                count: 0,
                href: "/export"
              }
            ].map((step, index) => (
              <Link
                key={step.name}
                href={step.href}
                className={`group relative p-6 rounded-xl border-2 transition-all hover:shadow-lg ${
                  step.status === "complete"
                    ? "border-green-200 bg-green-50"
                    : step.status === "pending"
                    ? "border-gray-200 bg-gray-50"
                    : "border-yellow-200 bg-yellow-50"
                }`}
              >
                <div className="text-center">
                  <div className={`text-3xl mb-3 ${step.status === "complete" ? "text-green-600" : "text-gray-400"}`}>
                    {step.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{step.name}</h3>
                  <div className={`text-sm ${
                    step.status === "complete" ? "text-green-600" : "text-gray-500"
                  }`}>
                    {step.status === "complete" ? "Complete" : "Pending"}
                  </div>
                  {step.count > 0 && (
                    <div className="mt-2 text-xs text-gray-500">
                      {step.count} {step.name === "Validation" ? "issues" : step.name === "Business Rules" ? "rules" : "records"}
                    </div>
                  )}
                </div>
                
                {/* Status indicator */}
                <div className={`absolute top-3 right-3 w-3 h-3 rounded-full ${
                  step.status === "complete" ? "bg-green-500" : "bg-gray-300"
                }`}></div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Data Management */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Data Management</h3>
            <p className="text-gray-600 mb-4">
              Upload, validate, and manage your client, worker, and task data with intelligent validation and error correction.
            </p>
            <div className="space-y-2">
              <Link href="/upload" className="block text-blue-600 hover:text-blue-800 font-medium">
                → Upload & Validate Data
              </Link>
              <Link href="/clients" className="block text-blue-600 hover:text-blue-800 font-medium">
                → Manage Clients
              </Link>
              <Link href="/workers" className="block text-blue-600 hover:text-blue-800 font-medium">
                → Manage Workers
              </Link>
              <Link href="/tasks" className="block text-blue-600 hover:text-blue-800 font-medium">
                → Manage Tasks
              </Link>
            </div>
          </div>

          {/* Business Rules */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="text-4xl mb-4">⚙️</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Business Rules</h3>
            <p className="text-gray-600 mb-4">
              Configure intelligent business rules using natural language or structured forms to define allocation constraints.
            </p>
            <div className="space-y-2">
              <Link href="/rules" className="block text-blue-600 hover:text-blue-800 font-medium">
                → Configure Rules
              </Link>
              <Link href="/priorities" className="block text-blue-600 hover:text-blue-800 font-medium">
                → Set Priorities
              </Link>
            </div>
          </div>

          {/* Export & Integration */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Export & Integration</h3>
            <p className="text-gray-600 mb-4">
              Export your complete configuration package for use in downstream resource allocation systems.
            </p>
            <div className="space-y-2">
              <Link href="/export" className="block text-blue-600 hover:text-blue-800 font-medium">
                → Export Configuration
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Data Summary Cards */}
      {summary.hasData && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Current Data Overview</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-blue-50 rounded-xl p-6 text-center">
              <div className="text-3xl mb-2">👥</div>
              <div className="text-2xl font-bold text-blue-600">{clients.length}</div>
              <div className="text-blue-800 font-medium">Clients</div>
              <div className="text-sm text-blue-600 mt-1">Priority levels & task requests</div>
            </div>
            
            <div className="bg-green-50 rounded-xl p-6 text-center">
              <div className="text-3xl mb-2">👷</div>
              <div className="text-2xl font-bold text-green-600">{workers.length}</div>
              <div className="text-green-800 font-medium">Workers</div>
              <div className="text-sm text-green-600 mt-1">Skills & availability</div>
            </div>
            
            <div className="bg-purple-50 rounded-xl p-6 text-center">
              <div className="text-3xl mb-2">📋</div>
              <div className="text-2xl font-bold text-purple-600">{tasks.length}</div>
              <div className="text-purple-800 font-medium">Tasks</div>
              <div className="text-sm text-purple-600 mt-1">Requirements & constraints</div>
            </div>
            
            <div className="bg-orange-50 rounded-xl p-6 text-center">
              <div className="text-3xl mb-2">⚙️</div>
              <div className="text-2xl font-bold text-orange-600">{rules.length}</div>
              <div className="text-orange-800 font-medium">Rules</div>
              <div className="text-sm text-orange-600 mt-1">Business constraints</div>
            </div>
          </div>
        </div>
      )}

      {/* Next Steps */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Ready for the Next Step?</h2>
          <p className="text-xl mb-6 opacity-90">{nextStep.description}</p>
          <Link
            href={nextStep.href}
            className="inline-flex items-center px-8 py-4 bg-white text-blue-600 text-lg font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
          >
            <span className="mr-2">→</span>
            {nextStep.label}
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-2xl mb-4">🔮</div>
          <h3 className="text-xl font-semibold mb-2">Data Alchemist</h3>
          <p className="text-gray-400 mb-6">AI-Powered Resource Allocation Configurator</p>
          <div className="flex justify-center space-x-6 text-sm text-gray-400">
            <button
              onClick={clearData}
              className="hover:text-white transition-colors"
            >
              Clear All Data
            </button>
            <span>•</span>
            <span>Version 1.0.0</span>
            <span>•</span>
            <span>Built with Next.js & AI</span>
          </div>
        </div>
      </div>
    </div>
  );
}
