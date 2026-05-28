/**
 * Update Plan Generator for API Analysis
 * Feature: api-routes-complete-analysis
 * 
 * Generates an actionable update plan from analysis results:
 * - Organizes fixes into logical phases (routes, interfaces, hooks, components)
 * - Creates task definitions with dependencies
 * - Calculates estimated effort for each task
 * - Determines risk level for each phase
 * - Provides validation tests for each phase
 */

import {
  AnalysisReport,
  UpdatePlan,
  UpdatePhase,
  UpdateTask,
  Dependency,
  ValidationTest,
  RouteIssue,
  TypeIssue,
  HookIssue,
  ClientIssue,
  IssuePriority,
} from '../../types/core';

/**
 * Generate a complete update plan from analysis report
 */
export function generateUpdatePlan(report: AnalysisReport): UpdatePlan {
  // Create phases for different types of updates
  const phases: UpdatePhase[] = [];
  
  // Phase 1: Routes (foundation)
  const routePhase = createRoutePhase(report.routeIssues);
  if (routePhase.tasks.length > 0) {
    phases.push(routePhase);
  }
  
  // Phase 2: Interfaces (depends on routes)
  const interfacePhase = createInterfacePhase(report.typeIssues);
  if (interfacePhase.tasks.length > 0) {
    phases.push(interfacePhase);
  }
  
  // Phase 3: Hooks (depends on routes and interfaces)
  const hookPhase = createHookPhase(report.hookIssues);
  if (hookPhase.tasks.length > 0) {
    phases.push(hookPhase);
  }
  
  // Phase 4: Client configuration
  const clientPhase = createClientPhase(report.clientIssues);
  if (clientPhase.tasks.length > 0) {
    phases.push(clientPhase);
  }
  
  // Phase 5: Component migration (depends on hooks and interfaces)
  const componentPhase = createComponentMigrationPhase(report, phases);
  if (componentPhase.tasks.length > 0) {
    phases.push(componentPhase);
  }
  
  // Calculate dependencies between tasks
  const dependencies = calculateDependencies(phases);
  
  // Generate validation tests
  const validationTests = generateValidationTests(phases);
  
  // Calculate metadata
  const metadata = calculateMetadata(phases, report);
  
  return {
    metadata,
    phases,
    dependencies,
    validationTests,
  };
}

/**
 * Create phase for route updates
 */
function createRoutePhase(routeIssues: RouteIssue[]): UpdatePhase {
  const tasks: UpdateTask[] = [];
  let taskCounter = 1;
  
  // Group issues by type
  const missingRoutes = routeIssues.filter(i => i.type === 'MISSING_ROUTE');
  const incorrectPaths = routeIssues.filter(i => i.type === 'INCORRECT_PATH');
  const deprecatedRoutes = routeIssues.filter(i => i.type === 'DEPRECATED_ROUTE');
  
  // Create tasks for missing routes
  for (const issue of missingRoutes) {
    const constantName = generateConstantName(issue.route.endpoint);
    const hasPathParams = issue.route.endpoint.includes(':');
    
    // Generate utility method if route has path parameters
    const utilityMethod = hasPathParams ? generateUtilityMethod(issue.route, constantName) : '';
    
    tasks.push({
      id: `ROUTE-${String(taskCounter).padStart(3, '0')}`,
      title: `Add missing route: ${constantName}`,
      description: `Add route constant for ${issue.route.method} ${issue.route.endpoint}. ${issue.route.description || ''}`,
      file: 'src/services/api/routes.ts',
      type: 'ADD',
      codeExample: {
        after: generateRouteConstantCode(issue.route, constantName) + (utilityMethod ? '\n\n' + utilityMethod : ''),
      },
      affectedComponents: [],
      testingNotes: `1. Verify ${constantName} constant is accessible\n2. Test that the endpoint path is correct: ${issue.route.endpoint}\n3. ${hasPathParams ? 'Test utility method with sample parameters' : 'Test with ApiRoutes.getFullUrl()'}`,
    });
    taskCounter++;
  }
  
  // Create tasks for incorrect paths
  for (const issue of incorrectPaths) {
    const constantName = generateConstantName(issue.route.endpoint);
    const affectedHooks = findAffectedHooks(constantName);
    
    tasks.push({
      id: `ROUTE-${String(taskCounter).padStart(3, '0')}`,
      title: `Fix incorrect path: ${constantName}`,
      description: `Update route constant to match documented path: ${issue.route.endpoint}. Current path "${issue.actual}" does not match documentation.`,
      file: 'src/services/api/routes.ts',
      type: 'MODIFY',
      codeExample: {
        before: `  static readonly ${constantName} = '${issue.actual}';`,
        after: `  static readonly ${constantName} = '${issue.route.endpoint}';`,
      },
      affectedComponents: affectedHooks,
      testingNotes: `1. Update the route constant\n2. Test all hooks using this route: ${affectedHooks.join(', ')}\n3. Verify API calls return expected data\n4. Check for any hardcoded URLs in components`,
    });
    taskCounter++;
  }
  
  // Create tasks for deprecated routes
  for (const issue of deprecatedRoutes) {
    if (!issue.suggestion) continue;
    
    const oldConstantName = generateConstantName(issue.route.endpoint);
    const newConstantName = issue.suggestion;
    
    tasks.push({
      id: `ROUTE-${String(taskCounter).padStart(3, '0')}`,
      title: `Migrate from deprecated route: ${oldConstantName}`,
      description: `Replace deprecated route ${oldConstantName} with ${newConstantName}. The old route will be removed in a future version.`,
      file: 'src/services/api/routes.ts',
      type: 'MODIFY',
      codeExample: {
        before: `  static readonly ${oldConstantName} = '${issue.route.endpoint}';`,
        after: `  /**\n   * @deprecated Use ${newConstantName} instead\n   */\n  static readonly ${oldConstantName} = '${issue.route.endpoint}';\n  \n  static readonly ${newConstantName} = '${issue.route.endpoint.replace('/api/public/', '/api/mobile/public/')}';`,
      },
      affectedComponents: findAffectedHooks(oldConstantName),
      testingNotes: `1. Add deprecation warning to old constant\n2. Create new constant with updated path\n3. Update hooks to use new constant\n4. Test that both routes work during transition period`,
    });
    taskCounter++;
  }
  
  // Determine phase priority based on highest issue priority
  const highestPriority = getHighestPriority(routeIssues.map(i => i.priority));
  
  // Calculate estimated time
  const estimatedTime = calculatePhaseTime(tasks.length, 'route');
  
  return {
    phase: 1,
    name: 'API Routes Configuration',
    description: 'Update ApiRoutes class with missing and incorrect route constants. This is the foundation for all other updates.',
    priority: highestPriority,
    estimatedTime,
    tasks,
  };
}

/**
 * Create phase for interface updates
 */
function createInterfacePhase(typeIssues: TypeIssue[]): UpdatePhase {
  const tasks: UpdateTask[] = [];
  let taskCounter = 1;
  
  // Group issues by type
  const missingInterfaces = typeIssues.filter(i => i.type === 'MISSING_INTERFACE');
  const missingProperties = typeIssues.filter(i => i.type === 'MISSING_PROPERTY');
  const typeMismatches = typeIssues.filter(i => i.type === 'TYPE_MISMATCH');
  const optionalityMismatches = typeIssues.filter(i => i.type === 'OPTIONALITY_MISMATCH');
  
  // Create tasks for missing interfaces
  for (const issue of missingInterfaces) {
    const interfaceCode = generateInterfaceCode(issue.interface, issue.jsonStructure);
    const relatedInterfaces = extractRelatedInterfaces(interfaceCode);
    
    tasks.push({
      id: `TYPE-${String(taskCounter).padStart(3, '0')}`,
      title: `Create interface: ${issue.interface}`,
      description: `Create TypeScript interface for ${issue.interface} based on API documentation. This interface represents the response structure for the corresponding API endpoint.`,
      file: 'src/types/api.ts',
      type: 'ADD',
      codeExample: {
        after: interfaceCode,
      },
      affectedComponents: relatedInterfaces.length > 0 ? [`Depends on: ${relatedInterfaces.join(', ')}`] : [],
      testingNotes: `1. Add the interface to src/types/api.ts\n2. Verify TypeScript compilation succeeds\n3. Test with actual API response data\n4. ${relatedInterfaces.length > 0 ? `Ensure related interfaces exist: ${relatedInterfaces.join(', ')}` : 'Verify all property types are correct'}`,
    });
    taskCounter++;
  }
  
  // Create tasks for missing properties
  for (const issue of missingProperties) {
    const propertyType = typeof issue.expected === 'string' ? issue.expected : 'any';
    const isOptional = issue.expected === true;
    const affectedComponents = findComponentsUsingInterface(issue.interface);
    
    tasks.push({
      id: `TYPE-${String(taskCounter).padStart(3, '0')}`,
      title: `Add property: ${issue.interface}.${issue.property}`,
      description: `Add missing property ${issue.property} to ${issue.interface} interface. This property is documented in the API but missing from the TypeScript interface.`,
      file: 'src/types/api.ts',
      type: 'MODIFY',
      codeExample: {
        before: `export interface ${issue.interface} {\n  // ... existing properties\n}`,
        after: `export interface ${issue.interface} {\n  // ... existing properties\n  ${issue.property}${isOptional ? '?' : ''}: ${propertyType};\n}`,
      },
      affectedComponents,
      testingNotes: `1. Add the property to the interface\n2. Update components to use the new property: ${affectedComponents.join(', ')}\n3. Test that the property is correctly populated from API responses\n4. ${isOptional ? 'Handle cases where property may be undefined' : 'Ensure property is always present'}`,
    });
    taskCounter++;
  }
  
  // Create tasks for type mismatches
  for (const issue of typeMismatches) {
    const affectedComponents = findComponentsUsingInterface(issue.interface);
    const impactAnalysis = analyzeTypeMismatchImpact(issue.actual, issue.expected);
    
    tasks.push({
      id: `TYPE-${String(taskCounter).padStart(3, '0')}`,
      title: `Fix type: ${issue.interface}.${issue.property}`,
      description: `Update property type from ${issue.actual} to ${issue.expected}. ${impactAnalysis}`,
      file: 'src/types/api.ts',
      type: 'MODIFY',
      codeExample: {
        before: `  ${issue.property}: ${issue.actual};`,
        after: `  ${issue.property}: ${issue.expected};`,
      },
      affectedComponents,
      testingNotes: `1. Update the property type\n2. Fix TypeScript errors in: ${affectedComponents.join(', ')}\n3. Update any type guards or validation logic\n4. Test with real API data to verify type correctness\n5. ${impactAnalysis.includes('breaking') ? 'BREAKING CHANGE: Review all usages carefully' : 'Non-breaking change'}`,
    });
    taskCounter++;
  }
  
  // Create tasks for optionality mismatches
  for (const issue of optionalityMismatches) {
    const affectedComponents = findComponentsUsingInterface(issue.interface);
    const changingTo = issue.expected ? 'optional' : 'required';
    
    tasks.push({
      id: `TYPE-${String(taskCounter).padStart(3, '0')}`,
      title: `Fix optionality: ${issue.interface}.${issue.property}`,
      description: `Update property ${issue.property} to be ${changingTo} to match API documentation. Currently marked as ${issue.actual ? 'optional' : 'required'}.`,
      file: 'src/types/api.ts',
      type: 'MODIFY',
      codeExample: {
        before: `  ${issue.property}${issue.actual ? '?' : ''}: PropertyType;`,
        after: `  ${issue.property}${issue.expected ? '?' : ''}: PropertyType;`,
      },
      affectedComponents,
      testingNotes: `1. Update the property optionality marker\n2. ${issue.expected ? 'Add null/undefined checks in components' : 'Remove unnecessary null checks'}\n3. Update components: ${affectedComponents.join(', ')}\n4. Test with API responses that may or may not include this property`,
    });
    taskCounter++;
  }
  
  const highestPriority = getHighestPriority(typeIssues.map(i => i.priority));
  const estimatedTime = calculatePhaseTime(tasks.length, 'interface');
  
  return {
    phase: 2,
    name: 'TypeScript Interfaces',
    description: 'Create and update TypeScript interfaces to match API documentation. These interfaces ensure type safety throughout the application.',
    priority: highestPriority,
    estimatedTime,
    tasks,
  };
}

/**
 * Create phase for hook updates
 */
function createHookPhase(hookIssues: HookIssue[]): UpdatePhase {
  const tasks: UpdateTask[] = [];
  let taskCounter = 1;
  
  // Group issues by type
  const missingHooks = hookIssues.filter(i => i.type === 'MISSING_HOOK');
  const incorrectRoutes = hookIssues.filter(i => i.type === 'INCORRECT_ROUTE');
  const parameterMismatches = hookIssues.filter(i => i.type === 'PARAMETER_MISMATCH');
  const invalidQueryKeys = hookIssues.filter(i => i.type === 'INVALID_QUERY_KEY');
  const missingCacheInvalidation = hookIssues.filter(i => i.type === 'MISSING_CACHE_INVALIDATION');
  
  // Create tasks for missing hooks
  for (const issue of missingHooks) {
    if (!issue.route) continue;
    const hookName = generateHookName(issue.route.endpoint, issue.route.method);
    const constantName = generateConstantName(issue.route.endpoint);
    const responseType = generateResponseTypeName(issue.route.endpoint);
    const isQuery = issue.route.method === 'GET';
    
    tasks.push({
      id: `HOOK-${String(taskCounter).padStart(3, '0')}`,
      title: `Create hook: ${hookName}`,
      description: `Create React Query ${isQuery ? 'query' : 'mutation'} hook for ${issue.route.method} ${issue.route.endpoint}. ${issue.route.description || ''}`,
      file: 'src/hooks/useApi.ts',
      type: 'ADD',
      codeExample: {
        after: generateHookCode(issue.route, hookName),
      },
      affectedComponents: [],
      testingNotes: `1. Add the hook to src/hooks/useApi.ts\n2. Verify ${constantName} route constant exists\n3. Verify ${responseType} interface exists\n4. Test hook with real API calls\n5. Verify query key is unique: ${JSON.stringify(generateQueryKey(issue.route.endpoint))}\n6. ${isQuery ? 'Test caching behavior and staleTime' : 'Test mutation success and cache invalidation'}\n7. Test error handling scenarios`,
    });
    taskCounter++;
  }
  
  // Create tasks for incorrect routes
  for (const issue of incorrectRoutes) {
    const oldConstant = issue.actual;
    const newConstant = issue.expected;
    const affectedComponents = findComponentsUsingHook(issue.hook || '');
    
    tasks.push({
      id: `HOOK-${String(taskCounter).padStart(3, '0')}`,
      title: `Fix route in hook: ${issue.hook}`,
      description: `Update ${issue.hook} to use correct route constant ${newConstant} instead of ${oldConstant}. This ensures the hook calls the correct API endpoint.`,
      file: 'src/hooks/useApi.ts',
      type: 'MODIFY',
      codeExample: {
        before: `    queryFn: () => get(ApiRoutes.${oldConstant}),`,
        after: `    queryFn: () => get(ApiRoutes.${newConstant}),`,
      },
      affectedComponents,
      testingNotes: `1. Update the route constant in the hook\n2. Verify ${newConstant} exists in ApiRoutes\n3. Test hook returns correct data from updated endpoint\n4. Test in components: ${affectedComponents.join(', ')}\n5. Verify no breaking changes in response structure`,
    });
    taskCounter++;
  }
  
  // Create tasks for parameter mismatches
  for (const issue of parameterMismatches) {
    const expectedParams = Array.isArray(issue.expected) ? issue.expected : [];
    const paramType = generateParamTypeName(expectedParams);
    const affectedComponents = findComponentsUsingHook(issue.hook || '');
    
    tasks.push({
      id: `HOOK-${String(taskCounter).padStart(3, '0')}`,
      title: `Add parameters to hook: ${issue.hook}`,
      description: `Update ${issue.hook} to accept query parameters: ${expectedParams.map((p: any) => p.name).join(', ')}. This enables filtering, pagination, and search functionality.`,
      file: 'src/hooks/useApi.ts',
      type: 'MODIFY',
      codeExample: {
        before: `export function ${issue.hook}() {\n  return useQuery({\n    queryKey: ['data'],\n    queryFn: () => get(ApiRoutes.ROUTE),\n  });\n}`,
        after: `export function ${issue.hook}(params?: ${paramType}) {\n  return useQuery({\n    queryKey: ['data', params],\n    queryFn: () => get(ApiRoutes.getFullUrl(ApiRoutes.ROUTE, params)),\n    staleTime: 5 * 60 * 1000,\n  });\n}`,
      },
      affectedComponents,
      testingNotes: `1. Add params parameter to hook signature\n2. Update query key to include params\n3. Use ApiRoutes.getFullUrl() to append query parameters\n4. Create/verify ${paramType} interface exists\n5. Test with various parameter combinations\n6. Update components to pass parameters: ${affectedComponents.join(', ')}\n7. Test pagination, filtering, and search functionality`,
    });
    taskCounter++;
  }
  
  // Create tasks for invalid query keys
  for (const issue of invalidQueryKeys) {
    const suggestedKey = generateQueryKey(issue.hook || '');
    const affectedComponents = findComponentsUsingHook(issue.hook || '');
    
    tasks.push({
      id: `HOOK-${String(taskCounter).padStart(3, '0')}`,
      title: `Fix query key in hook: ${issue.hook}`,
      description: `Update query key to be unique and include relevant parameters. Current key may cause cache collisions or incorrect data updates.`,
      file: 'src/hooks/useApi.ts',
      type: 'MODIFY',
      codeExample: {
        before: `    queryKey: ['data'],`,
        after: `    queryKey: ${JSON.stringify(suggestedKey)},`,
      },
      affectedComponents,
      testingNotes: `1. Update the query key to be more specific\n2. Include all parameters that differentiate cached data\n3. Test cache invalidation works correctly\n4. Verify no duplicate cache entries\n5. Test in components: ${affectedComponents.join(', ')}\n6. Verify data refreshes when parameters change`,
    });
    taskCounter++;
  }
  
  // Create tasks for missing cache invalidation
  for (const issue of missingCacheInvalidation) {
    const relatedQueryKeys = findRelatedQueryKeys(issue.hook || '');
    const affectedComponents = findComponentsUsingHook(issue.hook || '');
    
    tasks.push({
      id: `HOOK-${String(taskCounter).padStart(3, '0')}`,
      title: `Add cache invalidation to: ${issue.hook}`,
      description: `Add onSuccess callback with cache invalidation to mutation hook. This ensures UI updates automatically after data changes.`,
      file: 'src/hooks/useApi.ts',
      type: 'MODIFY',
      codeExample: {
        before: `export function ${issue.hook}() {\n  return useMutation({\n    mutationFn: (data) => post(ApiRoutes.ROUTE, data),\n  });\n}`,
        after: `export function ${issue.hook}() {\n  const queryClient = useQueryClient();\n  \n  return useMutation({\n    mutationFn: (data) => post(ApiRoutes.ROUTE, data),\n    onSuccess: () => {\n      // Invalidate related queries to refresh data\n      ${relatedQueryKeys.map(key => `queryClient.invalidateQueries({ queryKey: ${JSON.stringify(key)} });`).join('\n      ')}\n    },\n  });\n}`,
      },
      affectedComponents,
      testingNotes: `1. Import useQueryClient from @tanstack/react-query\n2. Add onSuccess callback with invalidateQueries\n3. Identify all related query keys that should be invalidated: ${relatedQueryKeys.map(k => JSON.stringify(k)).join(', ')}\n4. Test that data refreshes automatically after mutation\n5. Test in components: ${affectedComponents.join(', ')}\n6. Verify no unnecessary refetches occur`,
    });
    taskCounter++;
  }
  
  const highestPriority = getHighestPriority(hookIssues.map(i => i.priority));
  const estimatedTime = calculatePhaseTime(tasks.length, 'hook');
  
  return {
    phase: 3,
    name: 'React Query Hooks',
    description: 'Create and update React Query hooks for API endpoints. These hooks provide data fetching, caching, and state management.',
    priority: highestPriority,
    estimatedTime,
    tasks,
  };
}

/**
 * Create phase for client configuration updates
 */
function createClientPhase(clientIssues: ClientIssue[]): UpdatePhase {
  const tasks: UpdateTask[] = [];
  let taskCounter = 1;
  
  for (const issue of clientIssues) {
    tasks.push({
      id: `CLIENT-${String(taskCounter).padStart(3, '0')}`,
      title: `Fix client: ${issue.component}`,
      description: issue.description,
      file: 'src/services/api/client.ts',
      type: 'MODIFY',
      codeExample: {
        before: issue.actual ? String(issue.actual) : undefined,
        after: issue.expected ? String(issue.expected) : '// Fix client configuration as described',
      },
      affectedComponents: [],
      testingNotes: `Test API calls with authentication and error scenarios`,
    });
    taskCounter++;
  }
  
  const highestPriority = getHighestPriority(clientIssues.map(i => i.priority));
  const estimatedTime = calculatePhaseTime(tasks.length, 'client');
  
  return {
    phase: 4,
    name: 'Axios Client Configuration',
    description: 'Update Axios client with proper interceptors and error handling',
    priority: highestPriority,
    estimatedTime,
    tasks,
  };
}

/**
 * Create phase for component migration
 */
function createComponentMigrationPhase(report: AnalysisReport, phases: UpdatePhase[]): UpdatePhase {
  const tasks: UpdateTask[] = [];
  let taskCounter = 1;
  
  // Identify components that need migration based on:
  // 1. New hooks created
  // 2. Interface changes
  // 3. Deprecated route usage
  
  const hookPhase = phases.find(p => p.name === 'React Query Hooks');
  const interfacePhase = phases.find(p => p.name === 'TypeScript Interfaces');
  
  // Common components that typically need updates
  const componentsToMigrate = [
    {
      name: 'AmodiataireDetailsPage',
      file: 'src/components/organisms/AmodiataireDetailsPage.tsx',
      reason: 'Update to use new AmodiataireDetail interface structure',
      oldPattern: 'const { data: amodiataire } = useAmodiataireDetails(id);',
      newPattern: 'const { data } = useAmodiataireDetail(id);\nconst amodiataire = data?.amodiataire;',
      propertyChanges: [
        { old: 'amodiataire.raisonSociale', new: 'amodiataire.lot.raisonSociale' },
        { old: 'amodiataire.adresse', new: 'amodiataire.lot.adresse' },
        { old: 'amodiataire.photos', new: 'amodiataire.media.images' },
      ],
    },
    {
      name: 'MediaGallery',
      file: 'src/components/molecules/MediaGallery.tsx',
      reason: 'Update to use new MediaCollection interface structure',
      oldPattern: 'photos?.map(photo => ...)',
      newPattern: 'media.images.map(image => ...)',
      propertyChanges: [
        { old: 'photo (string URL)', new: 'image.url (MediaDetail object)' },
        { old: 'key={photo}', new: 'key={image.id}' },
      ],
    },
  ];
  
  for (const component of componentsToMigrate) {
    const relatedHookTasks = hookPhase?.tasks.filter(t => 
      component.oldPattern.includes(t.title.split(':')[1]?.trim() || '')
    ) || [];
    
    const relatedInterfaceTasks = interfacePhase?.tasks.filter(t =>
      component.reason.includes(t.title.split(':')[1]?.trim() || '')
    ) || [];
    
    const dependsOn = [
      ...relatedHookTasks.map(t => t.id),
      ...relatedInterfaceTasks.map(t => t.id),
    ];
    
    // Generate before/after code example
    const beforeCode = generateComponentBeforeCode(component);
    const afterCode = generateComponentAfterCode(component);
    
    tasks.push({
      id: `COMP-${String(taskCounter).padStart(3, '0')}`,
      title: `Migrate component: ${component.name}`,
      description: `${component.reason}. Update property access patterns and hook usage to match new API structure.`,
      file: component.file,
      type: 'REFACTOR',
      codeExample: {
        before: beforeCode,
        after: afterCode,
      },
      affectedComponents: dependsOn.length > 0 ? [`Depends on: ${dependsOn.join(', ')}`] : [],
      testingNotes: `1. Update hook usage: ${component.oldPattern} → ${component.newPattern}\n2. Update property access:\n${component.propertyChanges.map(c => `   - ${c.old} → ${c.new}`).join('\n')}\n3. Test component renders correctly\n4. Test all user interactions work\n5. Test loading and error states\n6. Verify no TypeScript errors\n7. Test with real API data\n8. Check for any hardcoded assumptions about data structure`,
    });
    taskCounter++;
  }
  
  // Add task for updating any remaining deprecated hook usages
  if (report.hookIssues.some(i => i.type === 'INCORRECT_ROUTE')) {
    tasks.push({
      id: `COMP-${String(taskCounter).padStart(3, '0')}`,
      title: 'Update components using deprecated hooks',
      description: 'Search codebase for components using deprecated hooks and update them to use the new v2 hooks.',
      file: 'src/components/**/*.tsx',
      type: 'REFACTOR',
      codeExample: {
        before: `// Example: Old hook usage\nconst { data } = useAmodiatairesMinimal();\n\n// Accessing data\ndata?.map(item => ...)`,
        after: `// Example: New hook usage with parameters\nconst { data } = useAmodiataires({ limit: 20, offset: 0 });\n\n// Accessing data from new structure\ndata?.amodiataires.map(item => ...)`,
      },
      affectedComponents: ['All components using deprecated hooks'],
      testingNotes: `1. Search for deprecated hook usage: grep -r "useAmodiatairesMinimal\\|useOldHook" src/\n2. Update each component to use new hooks\n3. Update data access patterns for new response structures\n4. Test each updated component thoroughly\n5. Verify no console warnings about deprecated APIs`,
    });
    taskCounter++;
  }
  
  const highestPriority: IssuePriority = 'MEDIUM'; // Component migration is typically medium priority
  const estimatedTime = calculatePhaseTime(tasks.length * 2, 'hook'); // Components take longer
  
  return {
    phase: 5,
    name: 'Component Migration',
    description: 'Update React components to use new hooks and interfaces. This ensures the UI correctly displays data from the updated API structure.',
    priority: highestPriority,
    estimatedTime,
    tasks,
  };
}

/**
 * Generate before code for component migration
 */
function generateComponentBeforeCode(component: any): string {
  return `// ${component.name} - Before migration
${component.oldPattern}

// Property access
${component.propertyChanges.slice(0, 2).map((c: any) => `<Text>{${c.old}}</Text>`).join('\n')}`;
}

/**
 * Generate after code for component migration
 */
function generateComponentAfterCode(component: any): string {
  return `// ${component.name} - After migration
${component.newPattern}

// Property access with new structure
${component.propertyChanges.slice(0, 2).map((c: any) => `<Text>{${c.new}}</Text>`).join('\n')}`;
}

/**
 * Calculate dependencies between tasks
 */
function calculateDependencies(phases: UpdatePhase[]): Dependency[] {
  const dependencies: Dependency[] = [];
  
  // Hooks depend on routes and interfaces
  const hookPhase = phases.find(p => p.name === 'React Query Hooks');
  const routePhase = phases.find(p => p.name === 'API Routes Configuration');
  const interfacePhase = phases.find(p => p.name === 'TypeScript Interfaces');
  const componentPhase = phases.find(p => p.name === 'Component Migration');
  
  if (hookPhase && (routePhase || interfacePhase)) {
    for (const hookTask of hookPhase.tasks) {
      const dependsOn: string[] = [];
      
      // Hook depends on route tasks
      if (routePhase) {
        const relatedRouteTasks = routePhase.tasks.filter(t => 
          hookTask.description.includes(t.title.split(':')[1]?.trim() || '') ||
          hookTask.codeExample.after.includes(t.title.split(':')[1]?.trim() || '')
        );
        dependsOn.push(...relatedRouteTasks.map(t => t.id));
      }
      
      // Hook depends on interface tasks
      if (interfacePhase) {
        const relatedInterfaceTasks = interfacePhase.tasks.filter(t =>
          hookTask.codeExample.after.includes(t.title.split(':')[1]?.trim() || '')
        );
        dependsOn.push(...relatedInterfaceTasks.map(t => t.id));
      }
      
      if (dependsOn.length > 0) {
        dependencies.push({
          taskId: hookTask.id,
          dependsOn,
          reason: 'Hook requires route constants and type interfaces to be defined first',
        });
      }
    }
  }
  
  // Components depend on hooks and interfaces
  if (componentPhase && (hookPhase || interfacePhase)) {
    for (const compTask of componentPhase.tasks) {
      const dependsOn: string[] = [];
      
      // Component depends on hook tasks
      if (hookPhase) {
        const relatedHookTasks = hookPhase.tasks.filter(t =>
          compTask.description.includes(t.title.split(':')[1]?.trim() || '') ||
          compTask.codeExample.before?.includes(t.title.split(':')[1]?.trim() || '') ||
          compTask.codeExample.after.includes(t.title.split(':')[1]?.trim() || '')
        );
        dependsOn.push(...relatedHookTasks.map(t => t.id));
      }
      
      // Component depends on interface tasks
      if (interfacePhase) {
        const relatedInterfaceTasks = interfacePhase.tasks.filter(t =>
          compTask.description.includes(t.title.split(':')[1]?.trim() || '')
        );
        dependsOn.push(...relatedInterfaceTasks.map(t => t.id));
      }
      
      if (dependsOn.length > 0) {
        dependencies.push({
          taskId: compTask.id,
          dependsOn,
          reason: 'Component requires updated hooks and interfaces to be available',
        });
      }
    }
  }
  
  // Interfaces with nested types depend on other interfaces
  if (interfacePhase) {
    for (const interfaceTask of interfacePhase.tasks) {
      if (interfaceTask.type === 'ADD' && interfaceTask.affectedComponents.length > 0) {
        const relatedInterfaces = interfaceTask.affectedComponents
          .filter(c => c.startsWith('Depends on:'))
          .flatMap(c => c.replace('Depends on:', '').split(',').map(s => s.trim()));
        
        if (relatedInterfaces.length > 0) {
          const dependsOn = interfacePhase.tasks
            .filter(t => relatedInterfaces.some(ri => t.title.includes(ri)))
            .map(t => t.id);
          
          if (dependsOn.length > 0) {
            dependencies.push({
              taskId: interfaceTask.id,
              dependsOn,
              reason: 'Interface uses other interfaces as property types',
            });
          }
        }
      }
    }
  }
  
  return dependencies;
}

/**
 * Generate validation tests for each phase
 */
function generateValidationTests(phases: UpdatePhase[]): ValidationTest[] {
  const tests: ValidationTest[] = [];
  
  for (const phase of phases) {
    if (phase.name === 'API Routes Configuration') {
      tests.push({
        name: 'Route Constants Validation',
        description: 'Verify all route constants are defined and return correct paths',
        type: 'UNIT',
        file: 'src/services/api/__tests__/routes.test.ts',
        code: `describe('ApiRoutes', () => {
  it('should have all documented routes defined', () => {
    // Test that all route constants exist
    expect(ApiRoutes.PUBLIC_AMODIATAIRES_V2).toBeDefined();
    expect(ApiRoutes.PUBLIC_AMODIATAIRES_V2).toBe('/api/mobile/public/amodiataires');
  });
});`,
      });
    }
    
    if (phase.name === 'TypeScript Interfaces') {
      tests.push({
        name: 'Interface Compilation Test',
        description: 'Verify TypeScript compilation succeeds with updated interfaces',
        type: 'UNIT',
        file: 'src/types/__tests__/api.test.ts',
        code: `describe('API Interfaces', () => {
  it('should compile without errors', () => {
    const response: AmodiataireDetailResponse = {
      success: true,
      amodiataire: {} as AmodiataireDetail,
    };
    expect(response).toBeDefined();
  });
});`,
      });
    }
    
    if (phase.name === 'React Query Hooks') {
      tests.push({
        name: 'Hook Integration Test',
        description: 'Verify hooks work correctly with API',
        type: 'INTEGRATION',
        file: 'src/hooks/__tests__/useApi.integration.test.ts',
        code: `describe('API Hooks', () => {
  it('should fetch data successfully', async () => {
    const { result } = renderHook(() => useAmodiataires());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeDefined();
  });
});`,
      });
    }
    
    if (phase.name === 'Axios Client Configuration') {
      tests.push({
        name: 'Client Configuration Test',
        description: 'Verify client interceptors and error handling work correctly',
        type: 'INTEGRATION',
        file: 'src/services/api/__tests__/client.test.ts',
        code: `describe('Axios Client', () => {
  it('should add API key header', async () => {
    const response = await client.get('/test');
    expect(response.config.headers['X-API-Key']).toBeDefined();
  });
  
  it('should handle 401 errors with token refresh', async () => {
    // Mock 401 response
    // Verify token refresh is attempted
  });
});`,
      });
    }
  }
  
  return tests;
}

/**
 * Calculate metadata for the update plan
 */
function calculateMetadata(phases: UpdatePhase[], report: AnalysisReport): {
  createdDate: string;
  estimatedEffort: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
} {
  const createdDate = new Date().toISOString();
  
  // Calculate total estimated time
  let totalMinutes = 0;
  for (const phase of phases) {
    const match = phase.estimatedTime.match(/(\d+)\s*(hour|minute)/i);
    if (match) {
      const value = parseInt(match[1]);
      const unit = match[2].toLowerCase();
      totalMinutes += unit.startsWith('hour') ? value * 60 : value;
    }
  }
  
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const estimatedEffort = hours > 0 
    ? `${hours} hour${hours > 1 ? 's' : ''}${minutes > 0 ? ` ${minutes} minutes` : ''}`
    : `${minutes} minutes`;
  
  // Determine risk level based on issue priorities
  const { critical, high } = report.summary.issuesByPriority;
  const riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 
    critical > 0 ? 'HIGH' :
    high > 3 ? 'HIGH' :
    high > 0 ? 'MEDIUM' :
    'LOW';
  
  return {
    createdDate,
    estimatedEffort,
    riskLevel,
  };
}

/**
 * Get highest priority from a list of priorities
 */
function getHighestPriority(priorities: IssuePriority[]): IssuePriority {
  if (priorities.includes('CRITICAL')) return 'CRITICAL';
  if (priorities.includes('HIGH')) return 'HIGH';
  if (priorities.includes('MEDIUM')) return 'MEDIUM';
  return 'LOW';
}

/**
 * Calculate estimated time for a phase based on task count and type
 */
function calculatePhaseTime(taskCount: number, type: 'route' | 'interface' | 'hook' | 'client'): string {
  const timePerTask = {
    route: 15,      // 15 minutes per route
    interface: 20,  // 20 minutes per interface
    hook: 30,       // 30 minutes per hook
    client: 45,     // 45 minutes per client config
  };
  
  const totalMinutes = taskCount * timePerTask[type];
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  if (hours > 0) {
    return minutes > 0 
      ? `${hours} hour${hours > 1 ? 's' : ''} ${minutes} minutes`
      : `${hours} hour${hours > 1 ? 's' : ''}`;
  }
  
  return `${minutes} minutes`;
}

/**
 * Generate a constant name from an endpoint
 */
function generateConstantName(endpoint: string): string {
  const parts = endpoint
    .split('/')
    .filter(part => part && !part.startsWith(':'))
    .slice(1);

  if (parts.includes('public')) {
    const relevantParts = parts.slice(parts.indexOf('public'));
    return relevantParts.map(part => part.toUpperCase()).join('_');
  }

  if (parts.includes('mobile')) {
    const relevantParts = parts.slice(parts.indexOf('mobile') + 1);
    return relevantParts.map(part => part.toUpperCase()).join('_');
  }

  return parts.map(part => part.toUpperCase()).join('_');
}

/**
 * Generate code for a route constant
 */
function generateRouteConstantCode(route: any, constantName: string): string {
  const comment = route.description 
    ? `  /**\n   * ${route.description}\n   * ${route.method} ${route.endpoint}\n   */\n`
    : `  /**\n   * ${route.method} ${route.endpoint}\n   */\n`;
  return `${comment}  static readonly ${constantName} = '${route.endpoint}';`;
}

/**
 * Generate code for an interface
 */
function generateInterfaceCode(interfaceName: string, jsonStructure: any): string {
  if (!jsonStructure || jsonStructure.type !== 'object' || !jsonStructure.properties) {
    return `export interface ${interfaceName} {\n  // TODO: Define properties based on API documentation\n}`;
  }

  let code = `export interface ${interfaceName} {\n`;
  
  for (const [propName, propDef] of Object.entries(jsonStructure.properties)) {
    const prop = propDef as any;
    const optional = prop.optional ? '?' : '';
    const type = prop.type || 'any';
    const comment = prop.description ? `  /** ${prop.description} */\n` : '';
    code += `${comment}  ${propName}${optional}: ${type};\n`;
  }
  
  code += '}';
  return code;
}

/**
 * Generate code for a hook
 */
function generateHookCode(route: any, hookName: string): string {
  const isQuery = route.method === 'GET';
  const constantName = generateConstantName(route.endpoint);
  const queryKey = generateQueryKey(route.endpoint);

  if (isQuery) {
    return `/**
 * Hook for ${route.description || route.endpoint}
 * ${route.method} ${route.endpoint}
 */
export function ${hookName}(params?: QueryParams) {
  return useQuery({
    queryKey: ${JSON.stringify(queryKey)},
    queryFn: () => get(ApiRoutes.getFullUrl(ApiRoutes.${constantName}, params)),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}`;
  } else {
    return `/**
 * Hook for ${route.description || route.endpoint}
 * ${route.method} ${route.endpoint}
 */
export function ${hookName}() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: RequestType) =>
      ${route.method.toLowerCase()}(ApiRoutes.${constantName}, data),
    onSuccess: () => {
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ${JSON.stringify(queryKey.slice(0, 2))} });
    },
  });
}`;
  }
}

/**
 * Generate a hook name from an endpoint and method
 */
function generateHookName(endpoint: string, method: string): string {
  const parts = endpoint
    .split('/')
    .filter(part => part && !part.startsWith(':'))
    .slice(-2);

  const baseName = parts
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

  const prefix = method === 'GET' ? 'use' : 
                 method === 'POST' ? 'useCreate' :
                 method === 'PUT' ? 'useUpdate' :
                 method === 'DELETE' ? 'useDelete' : 'use';

  return `${prefix}${baseName}`;
}

/**
 * Generate a query key from an endpoint
 */
function generateQueryKey(endpoint: string): string[] {
  const parts = endpoint
    .split('/')
    .filter(part => part && !part.startsWith(':'))
    .slice(-2);

  return parts.map(part => part.toLowerCase());
}

/**
 * Generate utility method for routes with path parameters
 */
function generateUtilityMethod(route: any, constantName: string): string {
  const pathParams = route.endpoint.match(/:(\w+)/g);
  if (!pathParams) return '';
  
  const params = pathParams.map((p: string) => p.slice(1));
  const methodName = `get${constantName.split('_').map((p: string) => p.charAt(0) + p.slice(1).toLowerCase()).join('')}Url`;
  
  const paramList = params.map((p: string) => `${p}: string`).join(', ');
  const queryParamsPart = route.queryParams && route.queryParams.length > 0 ? ', params?: QueryParams' : '';
  
  let urlConstruction = `this.${constantName}`;
  for (const param of params) {
    urlConstruction = urlConstruction.replace(`:${param}`, `\${${param}}`);
  }
  
  return `  /**
   * Generate URL for ${route.description || route.endpoint}
   * @param ${params.join(' - Parameter\n   * @param ')} - Parameter
   ${route.queryParams && route.queryParams.length > 0 ? '* @param params - Optional query parameters' : ''}
   * @returns Full URL with parameters
   */
  static ${methodName}(${paramList}${queryParamsPart}): string {
    const url = \`\${this.BASE_URL}${urlConstruction}\`;
    ${route.queryParams && route.queryParams.length > 0 ? 'return params ? this.getFullUrl(url, params) : url;' : 'return url;'}
  }`;
}

/**
 * Find hooks that use a specific route constant
 */
function findAffectedHooks(constantName: string): string[] {
  // This would ideally parse the actual hooks file
  // For now, return a placeholder that indicates analysis is needed
  return [`Hooks using ${constantName} (analyze useApi.ts)`];
}

/**
 * Find components that use a specific interface
 */
function findComponentsUsingInterface(interfaceName: string): string[] {
  // This would ideally parse component files
  // For now, return a placeholder
  return [`Components using ${interfaceName} (analyze component files)`];
}

/**
 * Find components that use a specific hook
 */
function findComponentsUsingHook(hookName: string): string[] {
  // This would ideally parse component files
  // For now, return a placeholder
  return [`Components using ${hookName} (analyze component files)`];
}

/**
 * Extract related interfaces from interface code
 */
function extractRelatedInterfaces(interfaceCode: string): string[] {
  const matches = interfaceCode.match(/:\s*([A-Z][a-zA-Z0-9]*)/g);
  if (!matches) return [];
  
  return [...new Set(matches.map(m => m.slice(2)))].filter(name => 
    !['String', 'Number', 'Boolean', 'Date', 'Array'].includes(name)
  );
}

/**
 * Analyze the impact of a type mismatch
 */
function analyzeTypeMismatchImpact(actualType: any, expectedType: any): string {
  const actual = String(actualType);
  const expected = String(expectedType);
  
  // Check for breaking changes
  if (actual === 'string' && expected === 'number') {
    return 'BREAKING: Components expecting string will need to handle number type. Update parsing logic.';
  }
  if (actual === 'number' && expected === 'string') {
    return 'BREAKING: Components expecting number will need to handle string type. Update formatting logic.';
  }
  if (actual.includes('[]') && !expected.includes('[]')) {
    return 'BREAKING: Changing from array to single value. Update iteration logic.';
  }
  if (!actual.includes('[]') && expected.includes('[]')) {
    return 'BREAKING: Changing from single value to array. Update access patterns.';
  }
  if (actual.includes('|') || expected.includes('|')) {
    return 'Type union change. Review all code paths handling this property.';
  }
  
  return 'Type refinement. Verify components handle the new type correctly.';
}

/**
 * Generate parameter type name from expected parameters
 */
function generateParamTypeName(expectedParams: any[]): string {
  if (!expectedParams || expectedParams.length === 0) return 'QueryParams';
  
  // Try to infer a meaningful name from parameter names
  const paramNames = expectedParams.map((p: any) => p.name || '').filter(Boolean);
  if (paramNames.includes('lat') && paramNames.includes('lng')) return 'NearbyParams';
  if (paramNames.includes('search')) return 'SearchParams';
  if (paramNames.includes('category')) return 'AnnouncementQueryParams';
  if (paramNames.includes('type') && paramNames.some((n: string) => n.includes('media'))) return 'MediaQueryParams';
  
  return 'QueryParams';
}

/**
 * Generate response type name from endpoint
 */
function generateResponseTypeName(endpoint: string): string {
  const parts = endpoint.split('/').filter(p => p && !p.startsWith(':'));
  const lastPart = parts[parts.length - 1];
  const baseName = lastPart.charAt(0).toUpperCase() + lastPart.slice(1);
  
  if (endpoint.includes('/:')) {
    return `${baseName}DetailResponse`;
  }
  
  return `${baseName}ListResponse`;
}

/**
 * Find related query keys that should be invalidated
 */
function findRelatedQueryKeys(hookName: string): string[][] {
  // Extract the base entity from hook name
  const match = hookName.match(/use(Create|Update|Delete)?(.+)/);
  if (!match) return [['data']];
  
  const entity = match[2].toLowerCase();
  
  // Return common query keys that might need invalidation
  return [
    [entity, 'list'],
    [entity, 'detail'],
  ];
}
