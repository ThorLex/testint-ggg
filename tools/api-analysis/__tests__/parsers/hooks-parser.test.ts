/**
 * Unit tests for hooks parser
 * Feature: api-routes-complete-analysis
 */

import { parseApiHooks } from '../../src/parsers/hooks-parser';
import * as path from 'path';
import * as fs from 'fs';

describe('Hooks Parser', () => {
  // Path from tools/api-analysis/__tests__/parsers to project root src/hooks/useApi.ts
  const useApiPath = path.resolve(__dirname, '../../../../src/hooks/useApi.ts');
  
  beforeAll(() => {
    // Verify the file exists
    if (!fs.existsSync(useApiPath)) {
      throw new Error(`useApi.ts not found at ${useApiPath}`);
    }
  });
  
  describe('parseApiHooks', () => {
    it('should parse all hooks from useApi.ts', () => {
      const hooks = parseApiHooks(useApiPath);
      
      expect(hooks).toBeDefined();
      expect(Array.isArray(hooks)).toBe(true);
      expect(hooks.length).toBeGreaterThan(0);
    });
    
    it('should extract hook names correctly', () => {
      const hooks = parseApiHooks(useApiPath);
      const hookNames = hooks.map(h => h.name);
      
      // Verify some expected hooks exist
      expect(hookNames).toContain('useAmodiataires');
      expect(hookNames).toContain('useAmodiataireDetail');
      expect(hookNames).toContain('useProfile');
      expect(hookNames).toContain('useUpdateProfile');
      expect(hookNames).toContain('useUploadMedia');
    });
    
    it('should identify query hooks correctly', () => {
      const hooks = parseApiHooks(useApiPath);
      const useAmodiataires = hooks.find(h => h.name === 'useAmodiataires');
      
      expect(useAmodiataires).toBeDefined();
      expect(useAmodiataires?.type).toBe('query');
    });
    
    it('should identify mutation hooks correctly', () => {
      const hooks = parseApiHooks(useApiPath);
      const useUpdateProfile = hooks.find(h => h.name === 'useUpdateProfile');
      
      expect(useUpdateProfile).toBeDefined();
      expect(useUpdateProfile?.type).toBe('mutation');
    });
    
    it('should extract query keys from query hooks', () => {
      const hooks = parseApiHooks(useApiPath);
      const useAmodiataires = hooks.find(h => h.name === 'useAmodiataires');
      
      expect(useAmodiataires?.queryKey).toBeDefined();
      expect(Array.isArray(useAmodiataires?.queryKey)).toBe(true);
      expect(useAmodiataires?.queryKey).toContain('amodiataires');
      expect(useAmodiataires?.queryKey).toContain('list');
    });
    
    it('should extract route constants from hooks', () => {
      const hooks = parseApiHooks(useApiPath);
      const useAmodiataires = hooks.find(h => h.name === 'useAmodiataires');
      
      expect(useAmodiataires?.endpoint).toBeDefined();
      expect(useAmodiataires?.endpoint).toBe('PUBLIC_AMODIATAIRES_V2');
    });
    
    it('should extract parameters from hooks', () => {
      const hooks = parseApiHooks(useApiPath);
      const useAmodiataires = hooks.find(h => h.name === 'useAmodiataires');
      
      expect(useAmodiataires?.parameters).toBeDefined();
      expect(Array.isArray(useAmodiataires?.parameters)).toBe(true);
      
      if (useAmodiataires?.parameters && useAmodiataires.parameters.length > 0) {
        const param = useAmodiataires.parameters[0];
        expect(param.name).toBe('params');
        expect(param.optional).toBe(true);
      }
    });
    
    it('should extract cache invalidation from mutation hooks', () => {
      const hooks = parseApiHooks(useApiPath);
      const useUpdateProfile = hooks.find(h => h.name === 'useUpdateProfile');
      
      expect(useUpdateProfile?.invalidatesCache).toBeDefined();
      expect(Array.isArray(useUpdateProfile?.invalidatesCache)).toBe(true);
      
      if (useUpdateProfile?.invalidatesCache) {
        expect(useUpdateProfile.invalidatesCache.length).toBeGreaterThan(0);
        const firstInvalidation = useUpdateProfile.invalidatesCache[0];
        expect(firstInvalidation).toContain('profile');
        expect(firstInvalidation).toContain('me');
      }
    });
    
    it('should handle hooks with utility method URLs', () => {
      const hooks = parseApiHooks(useApiPath);
      const useAmodiataireDetail = hooks.find(h => h.name === 'useAmodiataireDetail');
      
      expect(useAmodiataireDetail).toBeDefined();
      expect(useAmodiataireDetail?.endpoint).toBeDefined();
      expect(useAmodiataireDetail?.endpoint).toBe('getAmodiataireDetailsUrl');
    });
    
    it('should extract multiple cache invalidations from a single hook', () => {
      const hooks = parseApiHooks(useApiPath);
      const useSubmitMediaValidation = hooks.find(h => h.name === 'useSubmitMediaValidation');
      
      expect(useSubmitMediaValidation?.invalidatesCache).toBeDefined();
      
      if (useSubmitMediaValidation?.invalidatesCache) {
        expect(useSubmitMediaValidation.invalidatesCache.length).toBeGreaterThanOrEqual(2);
        
        // Should invalidate both media list and profile
        const hasMediaInvalidation = useSubmitMediaValidation.invalidatesCache.some(
          key => key.includes('media')
        );
        const hasProfileInvalidation = useSubmitMediaValidation.invalidatesCache.some(
          key => key.includes('profile')
        );
        
        expect(hasMediaInvalidation).toBe(true);
        expect(hasProfileInvalidation).toBe(true);
      }
    });
    
    it('should handle hooks with complex parameters', () => {
      const hooks = parseApiHooks(useApiPath);
      const useAmodiataireAnnouncements = hooks.find(h => h.name === 'useAmodiataireAnnouncements');
      
      expect(useAmodiataireAnnouncements?.parameters).toBeDefined();
      expect(useAmodiataireAnnouncements?.parameters?.length).toBeGreaterThanOrEqual(1);
      
      if (useAmodiataireAnnouncements?.parameters) {
        const idParam = useAmodiataireAnnouncements.parameters.find(p => p.name === 'id');
        expect(idParam).toBeDefined();
        expect(idParam?.type).toBe('string');
        expect(idParam?.optional).toBe(false);
      }
    });
  });
  
  describe('Hook Coverage', () => {
    it('should parse all expected public route hooks', () => {
      const hooks = parseApiHooks(useApiPath);
      const hookNames = hooks.map(h => h.name);
      
      const expectedPublicHooks = [
        'useAmodiataires',
        'useAmodiataireDetail',
        'useNearbyAmodiataires',
        'useAmodiataireAnnouncements',
        'useAmodiataireMedia',
      ];
      
      for (const expectedHook of expectedPublicHooks) {
        expect(hookNames).toContain(expectedHook);
      }
    });
    
    it('should parse all expected authenticated route hooks', () => {
      const hooks = parseApiHooks(useApiPath);
      const hookNames = hooks.map(h => h.name);
      
      const expectedAuthHooks = [
        'useProfile',
        'useUpdateProfile',
        'useMediaList',
        'useDeleteMedia',
        'useSubmitMediaValidation',
        'useCreateAnnouncement',
        'useAnnouncementsList',
      ];
      
      for (const expectedHook of expectedAuthHooks) {
        expect(hookNames).toContain(expectedHook);
      }
    });
  });
});
