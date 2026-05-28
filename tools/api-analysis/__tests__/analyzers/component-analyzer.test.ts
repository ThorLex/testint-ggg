/**
 * Unit tests for Component Analyzer
 * Feature: api-routes-complete-analysis
 * 
 * Tests detection of:
 * - Deprecated hook usage
 * - Obsolete property accesses
 * 
 * Requirements: 9.1-9.5
 */

import { analyzeComponent, analyzeComponents, DEPRECATED_HOOKS, OBSOLETE_PROPERTIES } from '../../src/analyzers/component-analyzer';
import * as fs from 'fs';
import * as path from 'path';

// Mock test component files
const TEST_COMPONENTS_DIR = path.join(__dirname, '../fixtures/components');

describe('Component Analyzer', () => {
  describe('analyzeComponent', () => {
    describe('Deprecated Hook Detection', () => {
      it('should detect usage of useAmodiataireDetails (deprecated hook)', () => {
        // Create a test component that uses deprecated hook
        const testFile = path.join(TEST_COMPONENTS_DIR, 'TestDeprecatedHook.tsx');
        const componentCode = `
import React from 'react';
import { useAmodiataireDetails } from '../hooks/useApi';

export function TestComponent() {
  const { data } = useAmodiataireDetails('123');
  return <div>{data?.name}</div>;
}
`;
        
        // Ensure directory exists
        if (!fs.existsSync(TEST_COMPONENTS_DIR)) {
          fs.mkdirSync(TEST_COMPONENTS_DIR, { recursive: true });
        }
        
        fs.writeFileSync(testFile, componentCode);
        
        const result = analyzeComponent(testFile);
        
        // Should detect the deprecated hook
        expect(result.issues).toHaveLength(1);
        expect(result.issues[0].type).toBe('DEPRECATED_HOOK');
        expect(result.issues[0].hookName).toBe('useAmodiataireDetails');
        expect(result.issues[0].priority).toBe('HIGH');
        expect(result.issues[0].suggestion).toContain('useAmodiataireDetail');
        
        // Statistics should reflect the finding
        expect(result.statistics.deprecatedHooksFound).toBe(1);
        expect(result.statistics.componentsWithIssues).toBe(1);
        
        // Cleanup
        fs.unlinkSync(testFile);
      });

      it('should detect usage of useAmodiatairesMinimal (deprecated hook)', () => {
        const testFile = path.join(TEST_COMPONENTS_DIR, 'TestDeprecatedMinimal.tsx');
        const componentCode = `
import React from 'react';
import { useAmodiatairesMinimal } from '../hooks/useApi';

export function TestComponent() {
  const { data } = useAmodiatairesMinimal();
  return <div>{data?.length}</div>;
}
`;
        
        if (!fs.existsSync(TEST_COMPONENTS_DIR)) {
          fs.mkdirSync(TEST_COMPONENTS_DIR, { recursive: true });
        }
        
        fs.writeFileSync(testFile, componentCode);
        
        const result = analyzeComponent(testFile);
        
        expect(result.issues).toHaveLength(1);
        expect(result.issues[0].type).toBe('DEPRECATED_HOOK');
        expect(result.issues[0].hookName).toBe('useAmodiatairesMinimal');
        expect(result.issues[0].suggestion).toContain('useAmodiataires');
        expect(result.issues[0].suggestion).toContain('PUBLIC_AMODIATAIRES_V2');
        
        // Cleanup
        fs.unlinkSync(testFile);
      });

      it('should detect multiple deprecated hooks in the same component', () => {
        const testFile = path.join(TEST_COMPONENTS_DIR, 'TestMultipleDeprecated.tsx');
        const componentCode = `
import React from 'react';
import { useAmodiataireDetails, useAmodiatairesMinimal } from '../hooks/useApi';

export function TestComponent() {
  const { data: details } = useAmodiataireDetails('123');
  const { data: list } = useAmodiatairesMinimal();
  return <div>{details?.name} - {list?.length}</div>;
}
`;
        
        if (!fs.existsSync(TEST_COMPONENTS_DIR)) {
          fs.mkdirSync(TEST_COMPONENTS_DIR, { recursive: true });
        }
        
        fs.writeFileSync(testFile, componentCode);
        
        const result = analyzeComponent(testFile);
        
        expect(result.issues).toHaveLength(2);
        expect(result.issues.filter(i => i.type === 'DEPRECATED_HOOK')).toHaveLength(2);
        expect(result.statistics.deprecatedHooksFound).toBe(2);
        
        const hookNames = result.issues.map(i => i.hookName);
        expect(hookNames).toContain('useAmodiataireDetails');
        expect(hookNames).toContain('useAmodiatairesMinimal');
        
        // Cleanup
        fs.unlinkSync(testFile);
      });

      it('should not flag non-deprecated hooks', () => {
        const testFile = path.join(TEST_COMPONENTS_DIR, 'TestValidHook.tsx');
        const componentCode = `
import React from 'react';
import { useAmodiataireDetail, useAmodiataires } from '../hooks/useApi';

export function TestComponent() {
  const { data: details } = useAmodiataireDetail('123');
  const { data: list } = useAmodiataires({ limit: 10 });
  return <div>{details?.name} - {list?.length}</div>;
}
`;
        
        if (!fs.existsSync(TEST_COMPONENTS_DIR)) {
          fs.mkdirSync(TEST_COMPONENTS_DIR, { recursive: true });
        }
        
        fs.writeFileSync(testFile, componentCode);
        
        const result = analyzeComponent(testFile);
        
        // Should not detect any deprecated hooks
        const deprecatedHookIssues = result.issues.filter(i => i.type === 'DEPRECATED_HOOK');
        expect(deprecatedHookIssues).toHaveLength(0);
        expect(result.statistics.deprecatedHooksFound).toBe(0);
        
        // Cleanup
        fs.unlinkSync(testFile);
      });
    });

    describe('Obsolete Property Detection', () => {
      it('should detect usage of details.photos (obsolete property)', () => {
        const testFile = path.join(TEST_COMPONENTS_DIR, 'TestObsoletePhotos.tsx');
        const componentCode = `
import React from 'react';

export function TestComponent({ details }: any) {
  const photos = details.photos;
  return <div>{photos?.length}</div>;
}
`;
        
        if (!fs.existsSync(TEST_COMPONENTS_DIR)) {
          fs.mkdirSync(TEST_COMPONENTS_DIR, { recursive: true });
        }
        
        fs.writeFileSync(testFile, componentCode);
        
        const result = analyzeComponent(testFile);
        
        expect(result.issues).toHaveLength(1);
        expect(result.issues[0].type).toBe('OBSOLETE_PROPERTY');
        expect(result.issues[0].propertyPath).toBe('details.photos');
        expect(result.issues[0].priority).toBe('MEDIUM');
        expect(result.issues[0].suggestion).toContain('details.media.images');
        
        expect(result.statistics.obsoletePropertiesFound).toBe(1);
        
        // Cleanup
        fs.unlinkSync(testFile);
      });

      it('should detect usage of details.videos (obsolete property)', () => {
        const testFile = path.join(TEST_COMPONENTS_DIR, 'TestObsoleteVideos.tsx');
        const componentCode = `
import React from 'react';

export function TestComponent({ details }: any) {
  const videos = details.videos;
  return <div>{videos?.length}</div>;
}
`;
        
        if (!fs.existsSync(TEST_COMPONENTS_DIR)) {
          fs.mkdirSync(TEST_COMPONENTS_DIR, { recursive: true });
        }
        
        fs.writeFileSync(testFile, componentCode);
        
        const result = analyzeComponent(testFile);
        
        expect(result.issues).toHaveLength(1);
        expect(result.issues[0].type).toBe('OBSOLETE_PROPERTY');
        expect(result.issues[0].propertyPath).toBe('details.videos');
        expect(result.issues[0].suggestion).toContain('details.media.videos');
        
        // Cleanup
        fs.unlinkSync(testFile);
      });

      it('should detect usage of details.raisonSociale (obsolete property)', () => {
        const testFile = path.join(TEST_COMPONENTS_DIR, 'TestObsoleteRaisonSociale.tsx');
        const componentCode = `
import React from 'react';

export function TestComponent({ details }: any) {
  return <div>{details.raisonSociale}</div>;
}
`;
        
        if (!fs.existsSync(TEST_COMPONENTS_DIR)) {
          fs.mkdirSync(TEST_COMPONENTS_DIR, { recursive: true });
        }
        
        fs.writeFileSync(testFile, componentCode);
        
        const result = analyzeComponent(testFile);
        
        expect(result.issues).toHaveLength(1);
        expect(result.issues[0].type).toBe('OBSOLETE_PROPERTY');
        expect(result.issues[0].propertyPath).toBe('details.raisonSociale');
        expect(result.issues[0].suggestion).toContain('details.lot.raisonSociale');
        
        // Cleanup
        fs.unlinkSync(testFile);
      });

      it('should detect usage of details.description (obsolete property)', () => {
        const testFile = path.join(TEST_COMPONENTS_DIR, 'TestObsoleteDescription.tsx');
        const componentCode = `
import React from 'react';

export function TestComponent({ details }: any) {
  return <div>{details.description}</div>;
}
`;
        
        if (!fs.existsSync(TEST_COMPONENTS_DIR)) {
          fs.mkdirSync(TEST_COMPONENTS_DIR, { recursive: true });
        }
        
        fs.writeFileSync(testFile, componentCode);
        
        const result = analyzeComponent(testFile);
        
        expect(result.issues).toHaveLength(1);
        expect(result.issues[0].type).toBe('OBSOLETE_PROPERTY');
        expect(result.issues[0].propertyPath).toBe('details.description');
        expect(result.issues[0].suggestion).toContain('details.profile.biography');
        
        // Cleanup
        fs.unlinkSync(testFile);
      });

      it('should detect multiple obsolete properties in the same component', () => {
        const testFile = path.join(TEST_COMPONENTS_DIR, 'TestMultipleObsolete.tsx');
        const componentCode = `
import React from 'react';

export function TestComponent({ details }: any) {
  const photos = details.photos;
  const videos = details.videos;
  const name = details.raisonSociale;
  return <div>{photos?.length} - {videos?.length} - {name}</div>;
}
`;
        
        if (!fs.existsSync(TEST_COMPONENTS_DIR)) {
          fs.mkdirSync(TEST_COMPONENTS_DIR, { recursive: true });
        }
        
        fs.writeFileSync(testFile, componentCode);
        
        const result = analyzeComponent(testFile);
        
        expect(result.issues).toHaveLength(3);
        expect(result.issues.filter(i => i.type === 'OBSOLETE_PROPERTY')).toHaveLength(3);
        expect(result.statistics.obsoletePropertiesFound).toBe(3);
        
        const propertyPaths = result.issues.map(i => i.propertyPath);
        expect(propertyPaths).toContain('details.photos');
        expect(propertyPaths).toContain('details.videos');
        expect(propertyPaths).toContain('details.raisonSociale');
        
        // Cleanup
        fs.unlinkSync(testFile);
      });

      it('should not flag non-obsolete properties', () => {
        const testFile = path.join(TEST_COMPONENTS_DIR, 'TestValidProperties.tsx');
        const componentCode = `
import React from 'react';

export function TestComponent({ details }: any) {
  const images = details.media.images;
  const videos = details.media.videos;
  const name = details.lot.raisonSociale;
  const bio = details.profile.biography;
  return <div>{images?.length} - {videos?.length} - {name} - {bio}</div>;
}
`;
        
        if (!fs.existsSync(TEST_COMPONENTS_DIR)) {
          fs.mkdirSync(TEST_COMPONENTS_DIR, { recursive: true });
        }
        
        fs.writeFileSync(testFile, componentCode);
        
        const result = analyzeComponent(testFile);
        
        // Should not detect any obsolete properties
        const obsoletePropertyIssues = result.issues.filter(i => i.type === 'OBSOLETE_PROPERTY');
        expect(obsoletePropertyIssues).toHaveLength(0);
        expect(result.statistics.obsoletePropertiesFound).toBe(0);
        
        // Cleanup
        fs.unlinkSync(testFile);
      });
    });

    describe('Combined Detection', () => {
      it('should detect both deprecated hooks and obsolete properties', () => {
        const testFile = path.join(TEST_COMPONENTS_DIR, 'TestCombined.tsx');
        const componentCode = `
import React from 'react';
import { useAmodiataireDetails } from '../hooks/useApi';

export function TestComponent({ id }: { id: string }) {
  const { data: details } = useAmodiataireDetails(id);
  const photos = details?.photos;
  const name = details?.raisonSociale;
  return <div>{photos?.length} - {name}</div>;
}
`;
        
        if (!fs.existsSync(TEST_COMPONENTS_DIR)) {
          fs.mkdirSync(TEST_COMPONENTS_DIR, { recursive: true });
        }
        
        fs.writeFileSync(testFile, componentCode);
        
        const result = analyzeComponent(testFile);
        
        // Should detect 1 deprecated hook and 2 obsolete properties
        expect(result.issues).toHaveLength(3);
        expect(result.issues.filter(i => i.type === 'DEPRECATED_HOOK')).toHaveLength(1);
        expect(result.issues.filter(i => i.type === 'OBSOLETE_PROPERTY')).toHaveLength(2);
        
        expect(result.statistics.deprecatedHooksFound).toBe(1);
        expect(result.statistics.obsoletePropertiesFound).toBe(2);
        expect(result.statistics.componentsWithIssues).toBe(1);
        
        // Cleanup
        fs.unlinkSync(testFile);
      });
    });

    describe('Edge Cases', () => {
      it('should handle component with no issues', () => {
        const testFile = path.join(TEST_COMPONENTS_DIR, 'TestClean.tsx');
        const componentCode = `
import React from 'react';
import { useAmodiataireDetail } from '../hooks/useApi';

export function TestComponent({ id }: { id: string }) {
  const { data: details } = useAmodiataireDetail(id);
  const images = details?.media.images;
  return <div>{images?.length}</div>;
}
`;
        
        if (!fs.existsSync(TEST_COMPONENTS_DIR)) {
          fs.mkdirSync(TEST_COMPONENTS_DIR, { recursive: true });
        }
        
        fs.writeFileSync(testFile, componentCode);
        
        const result = analyzeComponent(testFile);
        
        expect(result.issues).toHaveLength(0);
        expect(result.statistics.componentsWithIssues).toBe(0);
        expect(result.statistics.deprecatedHooksFound).toBe(0);
        expect(result.statistics.obsoletePropertiesFound).toBe(0);
        
        // Cleanup
        fs.unlinkSync(testFile);
      });

      it('should provide line and column information for issues', () => {
        const testFile = path.join(TEST_COMPONENTS_DIR, 'TestLineInfo.tsx');
        const componentCode = `
import React from 'react';
import { useAmodiataireDetails } from '../hooks/useApi';

export function TestComponent({ id }: { id: string }) {
  const { data: details } = useAmodiataireDetails(id);
  return <div>{details?.photos?.length}</div>;
}
`;
        
        if (!fs.existsSync(TEST_COMPONENTS_DIR)) {
          fs.mkdirSync(TEST_COMPONENTS_DIR, { recursive: true });
        }
        
        fs.writeFileSync(testFile, componentCode);
        
        const result = analyzeComponent(testFile);
        
        expect(result.issues.length).toBeGreaterThan(0);
        
        // All issues should have line and column information
        result.issues.forEach(issue => {
          expect(issue.line).toBeGreaterThan(0);
          expect(issue.column).toBeGreaterThan(0);
          expect(issue.file).toBe(testFile);
        });
        
        // Cleanup
        fs.unlinkSync(testFile);
      });
    });
  });

  describe('analyzeComponents', () => {
    it('should analyze multiple component files', () => {
      const testFile1 = path.join(TEST_COMPONENTS_DIR, 'TestMulti1.tsx');
      const testFile2 = path.join(TEST_COMPONENTS_DIR, 'TestMulti2.tsx');
      
      const componentCode1 = `
import React from 'react';
import { useAmodiataireDetails } from '../hooks/useApi';

export function TestComponent1({ id }: { id: string }) {
  const { data } = useAmodiataireDetails(id);
  return <div>{data?.photos?.length}</div>;
}
`;
      
      const componentCode2 = `
import React from 'react';

export function TestComponent2({ details }: any) {
  return <div>{details.raisonSociale}</div>;
}
`;
      
      if (!fs.existsSync(TEST_COMPONENTS_DIR)) {
        fs.mkdirSync(TEST_COMPONENTS_DIR, { recursive: true });
      }
      
      fs.writeFileSync(testFile1, componentCode1);
      fs.writeFileSync(testFile2, componentCode2);
      
      const result = analyzeComponents([testFile1, testFile2]);
      
      expect(result.statistics.totalComponents).toBe(2);
      expect(result.statistics.componentsWithIssues).toBe(2);
      expect(result.issues.length).toBeGreaterThan(0);
      
      // Cleanup
      fs.unlinkSync(testFile1);
      fs.unlinkSync(testFile2);
    });

    it('should handle non-existent files gracefully', () => {
      const nonExistentFile = path.join(TEST_COMPONENTS_DIR, 'NonExistent.tsx');
      
      const result = analyzeComponents([nonExistentFile]);
      
      expect(result.statistics.totalComponents).toBe(0);
      expect(result.issues).toHaveLength(0);
    });

    it('should aggregate statistics correctly', () => {
      const testFile1 = path.join(TEST_COMPONENTS_DIR, 'TestAgg1.tsx');
      const testFile2 = path.join(TEST_COMPONENTS_DIR, 'TestAgg2.tsx');
      const testFile3 = path.join(TEST_COMPONENTS_DIR, 'TestAgg3.tsx');
      
      const componentCode1 = `
import React from 'react';
import { useAmodiataireDetails } from '../hooks/useApi';

export function TestComponent1() {
  const { data } = useAmodiataireDetails('123');
  return <div>{data?.name}</div>;
}
`;
      
      const componentCode2 = `
import React from 'react';

export function TestComponent2({ details }: any) {
  return <div>{details.photos?.length}</div>;
}
`;
      
      const componentCode3 = `
import React from 'react';

export function TestComponent3({ details }: any) {
  return <div>{details.media.images?.length}</div>;
}
`;
      
      if (!fs.existsSync(TEST_COMPONENTS_DIR)) {
        fs.mkdirSync(TEST_COMPONENTS_DIR, { recursive: true });
      }
      
      fs.writeFileSync(testFile1, componentCode1);
      fs.writeFileSync(testFile2, componentCode2);
      fs.writeFileSync(testFile3, componentCode3);
      
      const result = analyzeComponents([testFile1, testFile2, testFile3]);
      
      expect(result.statistics.totalComponents).toBe(3);
      expect(result.statistics.componentsWithIssues).toBe(2); // testFile1 and testFile2 have issues
      expect(result.statistics.deprecatedHooksFound).toBe(1); // testFile1
      expect(result.statistics.obsoletePropertiesFound).toBe(1); // testFile2
      
      // Cleanup
      fs.unlinkSync(testFile1);
      fs.unlinkSync(testFile2);
      fs.unlinkSync(testFile3);
    });
  });

  describe('Configuration', () => {
    it('should have correct deprecated hooks configuration', () => {
      expect(DEPRECATED_HOOKS).toHaveProperty('useAmodiataireDetails');
      expect(DEPRECATED_HOOKS).toHaveProperty('useAmodiatairesMinimal');
      
      expect(DEPRECATED_HOOKS.useAmodiataireDetails.replacement).toBe('useAmodiataireDetail');
      expect(DEPRECATED_HOOKS.useAmodiatairesMinimal.replacement).toBe('useAmodiataires');
    });

    it('should have correct obsolete properties configuration', () => {
      expect(OBSOLETE_PROPERTIES['details.photos']).toBeDefined();
      expect(OBSOLETE_PROPERTIES['details.videos']).toBeDefined();
      expect(OBSOLETE_PROPERTIES['details.documents']).toBeDefined();
      expect(OBSOLETE_PROPERTIES['details.raisonSociale']).toBeDefined();
      expect(OBSOLETE_PROPERTIES['details.adresse']).toBeDefined();
      expect(OBSOLETE_PROPERTIES['details.numeroLot']).toBeDefined();
      expect(OBSOLETE_PROPERTIES['details.description']).toBeDefined();
      expect(OBSOLETE_PROPERTIES['details.telephone']).toBeDefined();
      expect(OBSOLETE_PROPERTIES['details.email']).toBeDefined();
      
      expect(OBSOLETE_PROPERTIES['details.photos'].newPath).toBe('details.media.images');
      expect(OBSOLETE_PROPERTIES['details.raisonSociale'].newPath).toBe('details.lot.raisonSociale');
      expect(OBSOLETE_PROPERTIES['details.description'].newPath).toBe('details.profile.biography');
    });
  });

  // Cleanup test directory after all tests
  afterAll(() => {
    if (fs.existsSync(TEST_COMPONENTS_DIR)) {
      const files = fs.readdirSync(TEST_COMPONENTS_DIR);
      files.forEach(file => {
        fs.unlinkSync(path.join(TEST_COMPONENTS_DIR, file));
      });
      fs.rmdirSync(TEST_COMPONENTS_DIR);
    }
  });
});
