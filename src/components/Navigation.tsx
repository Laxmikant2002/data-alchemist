"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useData } from "../lib/DataContext";

export default function Navigation() {
  const pathname = usePathname();
  const { clients, workers, tasks, rules, errors } = useData();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: "Home", href: "/", icon: "🏠", description: "Overview and dashboard" },
    { name: "Upload", href: "/upload", icon: "📤", description: "Upload and validate data files" },
    { name: "Clients", href: "/clients", icon: "👥", description: "Manage client data and priorities" },
    { name: "Workers", href: "/workers", icon: "👷", description: "Manage worker skills and availability" },
    { name: "Tasks", href: "/tasks", icon: "📋", description: "Manage task definitions and requirements" },
    { name: "Rules", href: "/rules", icon: "⚙️", description: "Configure business rules and constraints" },
    { name: "Priorities", href: "/priorities", icon: "⚖️", description: "Set allocation priorities and weights" },
    { name: "AI Features", href: "/ai-features", icon: "🤖", description: "Advanced AI-powered data management" },
    { name: "Export", href: "/export", icon: "📥", description: "Export data and configuration" },
  ];

  const getBreadcrumbs = () => {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length === 0) return [{ name: "Home", href: "/" }];
    
    const breadcrumbs = [{ name: "Home", href: "/" }];
    let currentPath = "";
    
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const navItem = navigation.find(nav => nav.href === currentPath);
      if (navItem) {
        breadcrumbs.push({ name: navItem.name, href: currentPath });
      }
    });
    
    return breadcrumbs;
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
    <>
      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo and brand */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-3">
                <div className="text-2xl">🔮</div>
                <div>
                  <div className="text-xl font-bold text-gray-900">Data Alchemist</div>
                  <div className="text-xs text-gray-500">Resource Allocation Configurator</div>
                </div>
              </Link>
            </div>

            {/* Desktop navigation */}
            <div className="hidden lg:flex lg:items-center lg:space-x-8">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group relative px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? "text-blue-700 bg-blue-50 border border-blue-200"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{item.icon}</span>
                      <span>{item.name}</span>
                    </div>
                    
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                      {item.description}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Data status indicators */}
            <div className="hidden lg:flex lg:items-center lg:space-x-4">
              {summary.hasData && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>{summary.totalRecords} records</span>
                </div>
              )}
              {summary.hasRules && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span>{rules.length} rules</span>
                </div>
              )}
              {summary.hasErrors && (
                <div className="flex items-center space-x-2 text-sm text-red-600">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  <span>{errors.length} errors</span>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="lg:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? (
                  <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`lg:hidden ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
          <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-gray-200">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive
                      ? "text-blue-700 bg-blue-50 border border-blue-200"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{item.icon}</span>
                    <div>
                      <div>{item.name}</div>
                      <div className="text-xs text-gray-500">{item.description}</div>
                    </div>
                  </div>
                </Link>
              );
            })}
            
            {/* Mobile data status */}
            {summary.hasData && (
              <div className="px-3 py-2 text-sm text-gray-600 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span>Data Status:</span>
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center space-x-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      <span>{summary.totalRecords}</span>
                    </span>
                    {summary.hasRules && (
                      <span className="flex items-center space-x-1">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        <span>{rules.length}</span>
                      </span>
                    )}
                    {summary.hasErrors && (
                      <span className="flex items-center space-x-1">
                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                        <span>{errors.length}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Breadcrumbs */}
      {pathname !== "/" && (
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-2 py-3">
              {getBreadcrumbs().map((breadcrumb, index) => (
                <React.Fragment key={breadcrumb.href}>
                  {index > 0 && (
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                  <Link
                    href={breadcrumb.href}
                    className={`text-sm ${
                      index === getBreadcrumbs().length - 1
                        ? "text-gray-900 font-medium"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {breadcrumb.name}
                  </Link>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Progress indicator for multi-step processes */}
      {pathname === "/upload" && (
        <div className="bg-blue-50 border-b border-blue-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-3">
              <div className="flex items-center justify-between text-sm text-blue-800">
                <span className="font-medium">Data Upload Progress</span>
                <div className="flex items-center space-x-4">
                  <span className={`flex items-center space-x-1 ${clients.length > 0 ? 'text-green-600' : ''}`}>
                    <span className="w-2 h-2 rounded-full bg-current"></span>
                    <span>Clients ({clients.length})</span>
                  </span>
                  <span className={`flex items-center space-x-1 ${workers.length > 0 ? 'text-green-600' : ''}`}>
                    <span className="w-2 h-2 rounded-full bg-current"></span>
                    <span>Workers ({workers.length})</span>
                  </span>
                  <span className={`flex items-center space-x-1 ${tasks.length > 0 ? 'text-green-600' : ''}`}>
                    <span className="w-2 h-2 rounded-full bg-current"></span>
                    <span>Tasks ({tasks.length})</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {pathname === "/rules" && rules.length > 0 && (
        <div className="bg-orange-50 border-b border-orange-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-3">
              <div className="flex items-center justify-between text-sm text-orange-800">
                <span className="font-medium">Business Rules Configuration</span>
                <div className="flex items-center space-x-2">
                  <span>{rules.length} rules configured</span>
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
