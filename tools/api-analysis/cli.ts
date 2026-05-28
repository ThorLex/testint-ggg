#!/usr/bin/env ts-node
/**
 * CLI Interface for API Analysis Tool
 * Feature: api-routes-complete-analysis
 * Task: 15.1 Implement command-line interface
 * 
 * Provides a user-friendly command-line interface for running API analysis
 * with various output formats and options.
 */

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { analyzeAPI } from './src/index';
import { generateAnalysisReport } from './src/generators/report-generator';
import { generateUpdatePlan } from './src/generators/update-plan-generator';
import type { AnalysisReport } from './types/core';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Output format options
 */
type OutputFormat = 'markdown' | 'json' | 'html';

/**
 * CLI options interface
 */
interface CLIOptions {
  format?: OutputFormat;
  output?: string;
  reportOnly?: boolean;
  updatePlanOnly?: boolean;
  verbose?: boolean;
}

/**
 * Generate markdown report
 */
function generateMarkdownReport(report: AnalysisReport): string {
  const lines: string[] = [];
  
  lines.push('# API Analysis Report - Navipad');
  lines.push('');
  lines.push(`**Generated:** ${report.timestamp}`);
  lines.push('');
  
  // Summary section
  lines.push('## Executive Summary');
  lines.push('');
  lines.push(`- **Total Routes Documented:** ${report.summary.totalRoutes}`);
  lines.push(`- **Total Interfaces Documented:** ${report.summary.totalInterfaces}`);
  lines.push(`- **Total Hooks Implemented:** ${report.summary.totalHooks}`);
  lines.push(`- **Total Issues Found:** ${report.summary.totalIssues}`);
  lines.push('');
  
  // Issues by priority
  lines.push('### Issues by Priority');
  lines.push('');
  lines.push(`- 🔴 **Critical:** ${report.summary.issuesByPriority.critical}`);
  lines.push(`- 🟠 **High:** ${report.summary.issuesByPriority.high}`);
  lines.push(`- 🟡 **Medium:** ${report.summary.issuesByPriority.medium}`);
  lines.push(`- 🟢 **Low:** ${report.summary.issuesByPriority.low}`);
  lines.push('');
  
  // Route issues
  if (report.routeIssues.length > 0) {
    lines.push('## Route Issues');
    lines.push('');
    report.routeIssues.forEach((issue, index) => {
      const priorityIcon = 
        issue.priority === 'CRITICAL' ? '🔴' :
        issue.priority === 'HIGH' ? '🟠' :
        issue.priority === 'MEDIUM' ? '🟡' : '🟢';
      
      lines.push(`### ${index + 1}. ${priorityIcon} ${issue.type}`);
      lines.push('');
      lines.push(`**Route:** \`${issue.route.method} ${issue.route.endpoint}\``);
      lines.push(`**Priority:** ${issue.priority}`);
      
      if (issue.actual) {
        lines.push(`**Current Value:** \`${issue.actual}\``);
      }
      
      if (issue.suggestion) {
        lines.push('');
        lines.push(`**Suggestion:** ${issue.suggestion}`);
      }
      
      lines.push('');
    });
  }
  
  // Type issues
  if (report.typeIssues.length > 0) {
    lines.push('## TypeScript Interface Issues');
    lines.push('');
    report.typeIssues.forEach((issue, index) => {
      const priorityIcon = 
        issue.priority === 'CRITICAL' ? '🔴' :
        issue.priority === 'HIGH' ? '🟠' :
        issue.priority === 'MEDIUM' ? '🟡' : '🟢';
      
      lines.push(`### ${index + 1}. ${priorityIcon} ${issue.type}`);
      lines.push('');
      lines.push(`**Interface:** \`${issue.interface}\``);
      
      if (issue.property) {
        lines.push(`**Property:** \`${issue.property}\``);
      }
      
      if (issue.expected) {
        lines.push(`**Expected:** \`${JSON.stringify(issue.expected)}\``);
      }
      
      if (issue.actual) {
        lines.push(`**Actual:** \`${JSON.stringify(issue.actual)}\``);
      }
      
      lines.push('');
    });
  }
  
  // Hook issues
  if (report.hookIssues.length > 0) {
    lines.push('## React Query Hook Issues');
    lines.push('');
    report.hookIssues.forEach((issue, index) => {
      const priorityIcon = 
        issue.priority === 'CRITICAL' ? '🔴' :
        issue.priority === 'HIGH' ? '🟠' :
        issue.priority === 'MEDIUM' ? '🟡' : '🟢';
      
      lines.push(`### ${index + 1}. ${priorityIcon} ${issue.type}`);
      lines.push('');
      
      if (issue.hook) {
        lines.push(`**Hook:** \`${issue.hook}\``);
      }
      
      if (issue.route) {
        lines.push(`**Route:** \`${issue.route.method} ${issue.route.endpoint}\``);
      }
      
      if (issue.expected) {
        lines.push(`**Expected:** \`${JSON.stringify(issue.expected)}\``);
      }
      
      if (issue.actual) {
        lines.push(`**Actual:** \`${JSON.stringify(issue.actual)}\``);
      }
      
      lines.push('');
    });
  }
  
  // Recommendations
  if (report.recommendations.length > 0) {
    lines.push('## Recommendations');
    lines.push('');
    report.recommendations.forEach((rec, index) => {
      const priorityIcon = 
        rec.priority === 'CRITICAL' ? '🔴' :
        rec.priority === 'HIGH' ? '🟠' :
        rec.priority === 'MEDIUM' ? '🟡' : '🟢';
      
      lines.push(`### ${index + 1}. ${priorityIcon} ${rec.title}`);
      lines.push('');
      lines.push(`**Category:** ${rec.category}`);
      lines.push(`**Priority:** ${rec.priority}`);
      lines.push('');
      lines.push(rec.description);
      lines.push('');
      lines.push(`**Affected Files:**`);
      rec.affectedFiles.forEach(file => {
        lines.push(`- \`${file}\``);
      });
      
      if (rec.codeExamples) {
        if (rec.codeExamples.before) {
          lines.push('');
          lines.push('**Before:**');
          lines.push('```typescript');
          lines.push(rec.codeExamples.before);
          lines.push('```');
        }
        
        if (rec.codeExamples.after) {
          lines.push('');
          lines.push('**After:**');
          lines.push('```typescript');
          lines.push(rec.codeExamples.after);
          lines.push('```');
        }
      }
      
      lines.push('');
    });
  }
  
  return lines.join('\n');
}

/**
 * Generate HTML report
 */
function generateHTMLReport(report: AnalysisReport): string {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Analysis Report - Navipad</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
      padding: 20px;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    h1 {
      color: #2c3e50;
      margin-bottom: 10px;
      font-size: 2.5em;
    }
    
    h2 {
      color: #34495e;
      margin-top: 40px;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #ecf0f1;
    }
    
    h3 {
      color: #7f8c8d;
      margin-top: 30px;
      margin-bottom: 15px;
    }
    
    .timestamp {
      color: #7f8c8d;
      font-size: 0.9em;
      margin-bottom: 30px;
    }
    
    .summary {
      background: #ecf0f1;
      padding: 20px;
      border-radius: 5px;
      margin: 20px 0;
    }
    
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-top: 15px;
    }
    
    .summary-item {
      background: white;
      padding: 15px;
      border-radius: 5px;
      text-align: center;
    }
    
    .summary-item strong {
      display: block;
      font-size: 2em;
      color: #3498db;
      margin-bottom: 5px;
    }
    
    .priority-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin: 20px 0;
    }
    
    .priority-item {
      padding: 15px;
      border-radius: 5px;
      text-align: center;
      color: white;
    }
    
    .priority-critical {
      background: #e74c3c;
    }
    
    .priority-high {
      background: #e67e22;
    }
    
    .priority-medium {
      background: #f39c12;
    }
    
    .priority-low {
      background: #27ae60;
    }
    
    .issue {
      background: #f8f9fa;
      padding: 20px;
      margin: 15px 0;
      border-left: 4px solid #3498db;
      border-radius: 4px;
    }
    
    .issue.critical {
      border-left-color: #e74c3c;
    }
    
    .issue.high {
      border-left-color: #e67e22;
    }
    
    .issue.medium {
      border-left-color: #f39c12;
    }
    
    .issue.low {
      border-left-color: #27ae60;
    }
    
    .issue-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
    }
    
    .issue-type {
      font-weight: bold;
      color: #2c3e50;
    }
    
    .badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 3px;
      font-size: 0.85em;
      font-weight: bold;
      color: white;
    }
    
    .badge-critical {
      background: #e74c3c;
    }
    
    .badge-high {
      background: #e67e22;
    }
    
    .badge-medium {
      background: #f39c12;
    }
    
    .badge-low {
      background: #27ae60;
    }
    
    code {
      background: #f4f4f4;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
    }
    
    pre {
      background: #2c3e50;
      color: #ecf0f1;
      padding: 15px;
      border-radius: 5px;
      overflow-x: auto;
      margin: 10px 0;
    }
    
    pre code {
      background: none;
      color: inherit;
      padding: 0;
    }
    
    .recommendation {
      background: #e8f4f8;
      padding: 20px;
      margin: 15px 0;
      border-left: 4px solid #3498db;
      border-radius: 4px;
    }
    
    .file-list {
      list-style: none;
      margin: 10px 0;
    }
    
    .file-list li {
      padding: 5px 0;
      padding-left: 20px;
      position: relative;
    }
    
    .file-list li:before {
      content: "📄";
      position: absolute;
      left: 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>API Analysis Report</h1>
    <div class="timestamp">Generated: ${report.timestamp}</div>
    
    <div class="summary">
      <h2>Executive Summary</h2>
      <div class="summary-grid">
        <div class="summary-item">
          <strong>${report.summary.totalRoutes}</strong>
          <div>Routes Documented</div>
        </div>
        <div class="summary-item">
          <strong>${report.summary.totalInterfaces}</strong>
          <div>Interfaces Documented</div>
        </div>
        <div class="summary-item">
          <strong>${report.summary.totalHooks}</strong>
          <div>Hooks Implemented</div>
        </div>
        <div class="summary-item">
          <strong>${report.summary.totalIssues}</strong>
          <div>Issues Found</div>
        </div>
      </div>
      
      <h3>Issues by Priority</h3>
      <div class="priority-grid">
        <div class="priority-item priority-critical">
          <strong>${report.summary.issuesByPriority.critical}</strong>
          <div>Critical</div>
        </div>
        <div class="priority-item priority-high">
          <strong>${report.summary.issuesByPriority.high}</strong>
          <div>High</div>
        </div>
        <div class="priority-item priority-medium">
          <strong>${report.summary.issuesByPriority.medium}</strong>
          <div>Medium</div>
        </div>
        <div class="priority-item priority-low">
          <strong>${report.summary.issuesByPriority.low}</strong>
          <div>Low</div>
        </div>
      </div>
    </div>
    
    ${report.routeIssues.length > 0 ? `
    <h2>Route Issues</h2>
    ${report.routeIssues.map((issue, index) => `
      <div class="issue ${issue.priority.toLowerCase()}">
        <div class="issue-header">
          <span class="issue-type">${index + 1}. ${issue.type}</span>
          <span class="badge badge-${issue.priority.toLowerCase()}">${issue.priority}</span>
        </div>
        <div><strong>Route:</strong> <code>${issue.route.method} ${issue.route.endpoint}</code></div>
        ${issue.actual ? `<div><strong>Current Value:</strong> <code>${issue.actual}</code></div>` : ''}
        ${issue.suggestion ? `<div><strong>Suggestion:</strong> ${issue.suggestion}</div>` : ''}
      </div>
    `).join('')}
    ` : ''}
    
    ${report.typeIssues.length > 0 ? `
    <h2>TypeScript Interface Issues</h2>
    ${report.typeIssues.map((issue, index) => `
      <div class="issue ${issue.priority.toLowerCase()}">
        <div class="issue-header">
          <span class="issue-type">${index + 1}. ${issue.type}</span>
          <span class="badge badge-${issue.priority.toLowerCase()}">${issue.priority}</span>
        </div>
        <div><strong>Interface:</strong> <code>${issue.interface}</code></div>
        ${issue.property ? `<div><strong>Property:</strong> <code>${issue.property}</code></div>` : ''}
        ${issue.expected ? `<div><strong>Expected:</strong> <code>${JSON.stringify(issue.expected)}</code></div>` : ''}
        ${issue.actual ? `<div><strong>Actual:</strong> <code>${JSON.stringify(issue.actual)}</code></div>` : ''}
      </div>
    `).join('')}
    ` : ''}
    
    ${report.hookIssues.length > 0 ? `
    <h2>React Query Hook Issues</h2>
    ${report.hookIssues.map((issue, index) => `
      <div class="issue ${issue.priority.toLowerCase()}">
        <div class="issue-header">
          <span class="issue-type">${index + 1}. ${issue.type}</span>
          <span class="badge badge-${issue.priority.toLowerCase()}">${issue.priority}</span>
        </div>
        ${issue.hook ? `<div><strong>Hook:</strong> <code>${issue.hook}</code></div>` : ''}
        ${issue.route ? `<div><strong>Route:</strong> <code>${issue.route.method} ${issue.route.endpoint}</code></div>` : ''}
        ${issue.expected ? `<div><strong>Expected:</strong> <code>${JSON.stringify(issue.expected)}</code></div>` : ''}
        ${issue.actual ? `<div><strong>Actual:</strong> <code>${JSON.stringify(issue.actual)}</code></div>` : ''}
      </div>
    `).join('')}
    ` : ''}
    
    ${report.recommendations.length > 0 ? `
    <h2>Recommendations</h2>
    ${report.recommendations.map((rec, index) => `
      <div class="recommendation">
        <div class="issue-header">
          <span class="issue-type">${index + 1}. ${rec.title}</span>
          <span class="badge badge-${rec.priority.toLowerCase()}">${rec.priority}</span>
        </div>
        <div><strong>Category:</strong> ${rec.category}</div>
        <div style="margin: 10px 0;">${rec.description}</div>
        <div><strong>Affected Files:</strong></div>
        <ul class="file-list">
          ${rec.affectedFiles.map(file => `<li><code>${file}</code></li>`).join('')}
        </ul>
        ${rec.codeExamples?.before ? `
          <div><strong>Before:</strong></div>
          <pre><code>${rec.codeExamples.before}</code></pre>
        ` : ''}
        ${rec.codeExamples?.after ? `
          <div><strong>After:</strong></div>
          <pre><code>${rec.codeExamples.after}</code></pre>
        ` : ''}
      </div>
    `).join('')}
    ` : ''}
  </div>
</body>
</html>
  `.trim();
  
  return html;
}

/**
 * Save report to file
 */
function saveReport(content: string, outputPath: string, format: OutputFormat): void {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(outputPath, content, 'utf-8');
  console.log(`\n✅ Report saved to: ${outputPath}`);
}

/**
 * Main CLI function
 */
async function main() {
  const argv = await yargs(hideBin(process.argv))
    .scriptName('api-analysis')
    .usage('$0 [options]', 'Analyze API routes against documentation')
    .option('format', {
      alias: 'f',
      type: 'string',
      choices: ['markdown', 'json', 'html'] as const,
      default: 'markdown' as const,
      description: 'Output format for the report',
    })
    .option('output', {
      alias: 'o',
      type: 'string',
      description: 'Output file path (default: analysis-report.<format>)',
    })
    .option('report-only', {
      type: 'boolean',
      default: false,
      description: 'Generate report only (skip update plan)',
    })
    .option('update-plan-only', {
      type: 'boolean',
      default: false,
      description: 'Generate update plan only (skip detailed report)',
    })
    .option('verbose', {
      alias: 'v',
      type: 'boolean',
      default: false,
      description: 'Show verbose output during analysis',
    })
    .example('$0', 'Run full analysis with markdown report')
    .example('$0 --format json --output report.json', 'Generate JSON report')
    .example('$0 --format html --output report.html', 'Generate HTML report')
    .example('$0 --report-only', 'Generate report without update plan')
    .example('$0 --update-plan-only', 'Generate update plan only')
    .help()
    .alias('help', 'h')
    .version('1.0.0')
    .alias('version', 'V')
    .parse();

  const options: CLIOptions = {
    format: argv.format as OutputFormat,
    output: argv.output as string | undefined,
    reportOnly: argv['report-only'] as boolean,
    updatePlanOnly: argv['update-plan-only'] as boolean,
    verbose: argv.verbose as boolean,
  };

  try {
    console.log('🚀 Starting API Analysis Tool');
    console.log('━'.repeat(80));
    
    if (!options.verbose) {
      // Suppress detailed console output from analyzeAPI
      const originalLog = console.log;
      console.log = () => {};
      
      const report = await analyzeAPI();
      
      // Restore console.log
      console.log = originalLog;
      
      // Show summary
      console.log('\n📊 Analysis Complete');
      console.log('━'.repeat(80));
      console.log(`Total Issues: ${report.summary.totalIssues}`);
      console.log(`  🔴 Critical: ${report.summary.issuesByPriority.critical}`);
      console.log(`  🟠 High:     ${report.summary.issuesByPriority.high}`);
      console.log(`  🟡 Medium:   ${report.summary.issuesByPriority.medium}`);
      console.log(`  🟢 Low:      ${report.summary.issuesByPriority.low}`);
      
      // Generate and save report
      if (!options.updatePlanOnly) {
        const format = options.format || 'markdown';
        const defaultOutput = `analysis-report.${format}`;
        const outputPath = options.output || defaultOutput;
        
        let content: string;
        switch (format) {
          case 'json':
            content = JSON.stringify(report, null, 2);
            break;
          case 'html':
            content = generateHTMLReport(report);
            break;
          case 'markdown':
          default:
            content = generateMarkdownReport(report);
            break;
        }
        
        saveReport(content, outputPath, format);
      }
      
      // Generate update plan if requested
      if (!options.reportOnly) {
        const updatePlan = generateUpdatePlan(report);
        const planPath = options.output 
          ? options.output.replace(/\.[^.]+$/, '-update-plan.json')
          : 'update-plan.json';
        
        fs.writeFileSync(planPath, JSON.stringify(updatePlan, null, 2), 'utf-8');
        console.log(`✅ Update plan saved to: ${planPath}`);
      }
      
      console.log('━'.repeat(80));
      
      // Exit with error code if critical issues found
      if (report.summary.issuesByPriority.critical > 0) {
        console.log('\n⚠️  Critical issues detected. Please address them before proceeding.');
        process.exit(1);
      }
      
      console.log('\n✨ Analysis completed successfully!');
      process.exit(0);
    } else {
      // Verbose mode - show all output
      const report = await analyzeAPI();
      
      // Generate and save report
      if (!options.updatePlanOnly) {
        const format = options.format || 'markdown';
        const defaultOutput = `analysis-report.${format}`;
        const outputPath = options.output || defaultOutput;
        
        let content: string;
        switch (format) {
          case 'json':
            content = JSON.stringify(report, null, 2);
            break;
          case 'html':
            content = generateHTMLReport(report);
            break;
          case 'markdown':
          default:
            content = generateMarkdownReport(report);
            break;
        }
        
        saveReport(content, outputPath, format);
      }
      
      // Generate update plan if requested
      if (!options.reportOnly) {
        const updatePlan = generateUpdatePlan(report);
        const planPath = options.output 
          ? options.output.replace(/\.[^.]+$/, '-update-plan.json')
          : 'update-plan.json';
        
        fs.writeFileSync(planPath, JSON.stringify(updatePlan, null, 2), 'utf-8');
        console.log(`✅ Update plan saved to: ${planPath}`);
      }
      
      // Exit with error code if critical issues found
      if (report.summary.issuesByPriority.critical > 0) {
        process.exit(1);
      }
      
      process.exit(0);
    }
  } catch (error) {
    console.error('\n❌ Analysis failed');
    console.error('━'.repeat(80));
    console.error(error instanceof Error ? error.message : String(error));
    
    if (options.verbose && error instanceof Error && error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    
    console.error('━'.repeat(80));
    process.exit(1);
  }
}

// Run CLI
main();
