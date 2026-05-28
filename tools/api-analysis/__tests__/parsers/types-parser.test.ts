/**
 * Unit tests for TypeScript AST parser
 * Feature: api-routes-complete-analysis
 */

import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import {
  parseApiTypes,
  parseApiTypesFromProject,
  findInterface,
  findProperty,
  getInterfacesThatExtend,
  getAllProperties,
} from '../../src/parsers/types-parser';
import { InterfaceDefinition } from '../../types/core';

describe('TypeScript AST Parser', () => {
  let tempDir: string;
  let tempFilePath: string;

  beforeEach(() => {
    // Create a temporary directory for test files
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'types-parser-test-'));
    tempFilePath = path.join(tempDir, 'test-api.ts');
  });

  afterEach(() => {
    // Clean up temporary files
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
    if (fs.existsSync(tempDir)) {
      fs.rmdirSync(tempDir);
    }
  });

  describe('parseApiTypes', () => {
    it('should parse a simple interface with basic types', () => {
      const content = `
        export interface User {
          id: string;
          name: string;
          age: number;
          isActive: boolean;
        }
      `;
      fs.writeFileSync(tempFilePath, content);

      const interfaces = parseApiTypes(tempFilePath);

      expect(interfaces).toHaveLength(1);
      expect(interfaces[0].name).toBe('User');
      expect(interfaces[0].properties).toHaveLength(4);
      
      const idProp = interfaces[0].properties.find(p => p.name === 'id');
      expect(idProp).toBeDefined();
      expect(idProp?.type).toBe('string');
      expect(idProp?.optional).toBe(false);
    });

    it('should correctly identify optional properties', () => {
      const content = `
        export interface Product {
          id: string;
          name: string;
          description?: string;
          price?: number;
        }
      `;
      fs.writeFileSync(tempFilePath, content);

      const interfaces = parseApiTypes(tempFilePath);
      const product = interfaces[0];

      const idProp = findProperty(product, 'id');
      expect(idProp?.optional).toBe(false);

      const descProp = findProperty(product, 'description');
      expect(descProp?.optional).toBe(true);

      const priceProp = findProperty(product, 'price');
      expect(priceProp?.optional).toBe(true);
    });

    it('should handle array types', () => {
      const content = `
        export interface Post {
          id: string;
          tags: string[];
          comments: Comment[];
        }
      `;
      fs.writeFileSync(tempFilePath, content);

      const interfaces = parseApiTypes(tempFilePath);
      const post = interfaces[0];

      const tagsProp = findProperty(post, 'tags');
      expect(tagsProp?.type).toBe('string[]');

      const commentsProp = findProperty(post, 'comments');
      expect(commentsProp?.type).toBe('Comment[]');
    });

    it('should handle union types', () => {
      const content = `
        export interface Response {
          status: 'success' | 'error' | 'pending';
          data: string | number | null;
        }
      `;
      fs.writeFileSync(tempFilePath, content);

      const interfaces = parseApiTypes(tempFilePath);
      const response = interfaces[0];

      const statusProp = findProperty(response, 'status');
      expect(statusProp?.type).toContain('success');
      expect(statusProp?.type).toContain('error');
      expect(statusProp?.type).toContain('pending');

      const dataProp = findProperty(response, 'data');
      expect(dataProp?.type).toContain('string');
      expect(dataProp?.type).toContain('number');
      expect(dataProp?.type).toContain('null');
    });

    it('should handle nested object types', () => {
      const content = `
        export interface User {
          id: string;
          profile: {
            name: string;
            email: string;
          };
        }
      `;
      fs.writeFileSync(tempFilePath, content);

      const interfaces = parseApiTypes(tempFilePath);
      const user = interfaces[0];

      const profileProp = findProperty(user, 'profile');
      expect(profileProp).toBeDefined();
      expect(profileProp?.type).toContain('name');
      expect(profileProp?.type).toContain('email');
    });

    it('should handle generic types', () => {
      const content = `
        export interface ApiResponse<T> {
          success: boolean;
          data: T;
          errors?: Array<string>;
        }
      `;
      fs.writeFileSync(tempFilePath, content);

      const interfaces = parseApiTypes(tempFilePath);
      const apiResponse = interfaces[0];

      expect(apiResponse.name).toBe('ApiResponse');
      
      const dataProp = findProperty(apiResponse, 'data');
      expect(dataProp?.type).toBe('T');

      const errorsProp = findProperty(apiResponse, 'errors');
      expect(errorsProp?.type).toBe('Array<string>');
      expect(errorsProp?.optional).toBe(true);
    });

    it('should extract JSDoc comments', () => {
      const content = `
        /**
         * User interface for authentication
         */
        export interface User {
          /**
           * Unique identifier
           */
          id: string;
          /** User's display name */
          name: string;
        }
      `;
      fs.writeFileSync(tempFilePath, content);

      const interfaces = parseApiTypes(tempFilePath);
      const user = interfaces[0];

      expect(user.comment).toContain('User interface');
      
      const idProp = findProperty(user, 'id');
      expect(idProp?.comment).toContain('Unique identifier');

      const nameProp = findProperty(user, 'name');
      expect(nameProp?.comment).toContain('display name');
    });

    it('should handle interface inheritance', () => {
      const content = `
        export interface BaseEntity {
          id: string;
          createdAt: string;
        }

        export interface User extends BaseEntity {
          name: string;
          email: string;
        }
      `;
      fs.writeFileSync(tempFilePath, content);

      const interfaces = parseApiTypes(tempFilePath);

      const baseEntity = findInterface(interfaces, 'BaseEntity');
      expect(baseEntity).toBeDefined();
      expect(baseEntity?.properties).toHaveLength(2);

      const user = findInterface(interfaces, 'User');
      expect(user).toBeDefined();
      expect(user?.extends).toEqual(['BaseEntity']);
      expect(user?.properties).toHaveLength(2);
    });

    it('should handle multiple interface inheritance', () => {
      const content = `
        export interface Timestamped {
          createdAt: string;
          updatedAt: string;
        }

        export interface Identifiable {
          id: string;
        }

        export interface User extends Identifiable, Timestamped {
          name: string;
        }
      `;
      fs.writeFileSync(tempFilePath, content);

      const interfaces = parseApiTypes(tempFilePath);
      const user = findInterface(interfaces, 'User');

      expect(user?.extends).toEqual(['Identifiable', 'Timestamped']);
    });

    it('should parse multiple interfaces from one file', () => {
      const content = `
        export interface User {
          id: string;
          name: string;
        }

        export interface Post {
          id: string;
          title: string;
          authorId: string;
        }

        export interface Comment {
          id: string;
          postId: string;
          text: string;
        }
      `;
      fs.writeFileSync(tempFilePath, content);

      const interfaces = parseApiTypes(tempFilePath);

      expect(interfaces).toHaveLength(3);
      expect(findInterface(interfaces, 'User')).toBeDefined();
      expect(findInterface(interfaces, 'Post')).toBeDefined();
      expect(findInterface(interfaces, 'Comment')).toBeDefined();
    });

    it('should handle type aliases and literal types', () => {
      const content = `
        export interface Config {
          mode: 'development' | 'production';
          port: number;
          features: {
            auth: boolean;
            api: boolean;
          };
        }
      `;
      fs.writeFileSync(tempFilePath, content);

      const interfaces = parseApiTypes(tempFilePath);
      const config = interfaces[0];

      const modeProp = findProperty(config, 'mode');
      expect(modeProp?.type).toContain('development');
      expect(modeProp?.type).toContain('production');
    });
  });

  describe('findInterface', () => {
    it('should find an interface by name', () => {
      const interfaces: InterfaceDefinition[] = [
        { name: 'User', properties: [] },
        { name: 'Post', properties: [] },
        { name: 'Comment', properties: [] },
      ];

      const user = findInterface(interfaces, 'User');
      expect(user).toBeDefined();
      expect(user?.name).toBe('User');

      const post = findInterface(interfaces, 'Post');
      expect(post).toBeDefined();
      expect(post?.name).toBe('Post');
    });

    it('should return undefined for non-existent interface', () => {
      const interfaces: InterfaceDefinition[] = [
        { name: 'User', properties: [] },
      ];

      const result = findInterface(interfaces, 'NonExistent');
      expect(result).toBeUndefined();
    });
  });

  describe('findProperty', () => {
    it('should find a property by name', () => {
      const interfaceDef: InterfaceDefinition = {
        name: 'User',
        properties: [
          { name: 'id', type: 'string', optional: false },
          { name: 'name', type: 'string', optional: false },
          { name: 'email', type: 'string', optional: true },
        ],
      };

      const idProp = findProperty(interfaceDef, 'id');
      expect(idProp).toBeDefined();
      expect(idProp?.type).toBe('string');

      const emailProp = findProperty(interfaceDef, 'email');
      expect(emailProp).toBeDefined();
      expect(emailProp?.optional).toBe(true);
    });

    it('should return undefined for non-existent property', () => {
      const interfaceDef: InterfaceDefinition = {
        name: 'User',
        properties: [
          { name: 'id', type: 'string', optional: false },
        ],
      };

      const result = findProperty(interfaceDef, 'nonExistent');
      expect(result).toBeUndefined();
    });
  });

  describe('getInterfacesThatExtend', () => {
    it('should find all interfaces that extend a base interface', () => {
      const interfaces: InterfaceDefinition[] = [
        { name: 'BaseEntity', properties: [] },
        { name: 'User', properties: [], extends: ['BaseEntity'] },
        { name: 'Post', properties: [], extends: ['BaseEntity'] },
        { name: 'Comment', properties: [] },
      ];

      const extending = getInterfacesThatExtend(interfaces, 'BaseEntity');
      expect(extending).toHaveLength(2);
      expect(extending.map(i => i.name)).toContain('User');
      expect(extending.map(i => i.name)).toContain('Post');
    });

    it('should return empty array if no interfaces extend the base', () => {
      const interfaces: InterfaceDefinition[] = [
        { name: 'User', properties: [] },
        { name: 'Post', properties: [] },
      ];

      const extending = getInterfacesThatExtend(interfaces, 'BaseEntity');
      expect(extending).toHaveLength(0);
    });
  });

  describe('getAllProperties', () => {
    it('should return all properties including inherited ones', () => {
      const interfaces: InterfaceDefinition[] = [
        {
          name: 'BaseEntity',
          properties: [
            { name: 'id', type: 'string', optional: false },
            { name: 'createdAt', type: 'string', optional: false },
          ],
        },
        {
          name: 'User',
          properties: [
            { name: 'name', type: 'string', optional: false },
            { name: 'email', type: 'string', optional: false },
          ],
          extends: ['BaseEntity'],
        },
      ];

      const allProps = getAllProperties(interfaces, 'User');
      expect(allProps).toHaveLength(4);
      
      const propNames = allProps.map(p => p.name);
      expect(propNames).toContain('id');
      expect(propNames).toContain('createdAt');
      expect(propNames).toContain('name');
      expect(propNames).toContain('email');
    });

    it('should handle multiple levels of inheritance', () => {
      const interfaces: InterfaceDefinition[] = [
        {
          name: 'Base',
          properties: [
            { name: 'id', type: 'string', optional: false },
          ],
        },
        {
          name: 'Middle',
          properties: [
            { name: 'createdAt', type: 'string', optional: false },
          ],
          extends: ['Base'],
        },
        {
          name: 'Final',
          properties: [
            { name: 'name', type: 'string', optional: false },
          ],
          extends: ['Middle'],
        },
      ];

      const allProps = getAllProperties(interfaces, 'Final');
      expect(allProps).toHaveLength(3);
      
      const propNames = allProps.map(p => p.name);
      expect(propNames).toContain('id');
      expect(propNames).toContain('createdAt');
      expect(propNames).toContain('name');
    });

    it('should return empty array for non-existent interface', () => {
      const interfaces: InterfaceDefinition[] = [
        { name: 'User', properties: [] },
      ];

      const allProps = getAllProperties(interfaces, 'NonExistent');
      expect(allProps).toHaveLength(0);
    });
  });

  describe('parseApiTypesFromProject', () => {
    it('should throw error if api.ts file does not exist', () => {
      const nonExistentPath = path.join(tempDir, 'non-existent');
      
      expect(() => {
        parseApiTypesFromProject(nonExistentPath);
      }).toThrow('api.ts file not found');
    });
  });

  describe('Real api.ts parsing', () => {
    it('should parse the actual api.ts file from the project', () => {
      // This test uses the actual api.ts file from the project
      const projectRoot = path.join(__dirname, '..', '..', '..');
      const apiTypesPath = path.join(projectRoot, 'src', 'types', 'api.ts');

      // Skip test if file doesn't exist (e.g., in CI environment)
      if (!fs.existsSync(apiTypesPath)) {
        console.log('Skipping real api.ts test - file not found');
        return;
      }

      const interfaces = parseApiTypes(apiTypesPath);

      // Verify we parsed interfaces
      expect(interfaces.length).toBeGreaterThan(0);

      // Check for some expected interfaces from the actual api.ts
      const coordinates = findInterface(interfaces, 'Coordinates');
      expect(coordinates).toBeDefined();
      expect(findProperty(coordinates!, 'latitude')).toBeDefined();
      expect(findProperty(coordinates!, 'longitude')).toBeDefined();

      const amodiataireDetail = findInterface(interfaces, 'AmodiataireDetail');
      expect(amodiataireDetail).toBeDefined();
      expect(findProperty(amodiataireDetail!, 'id')).toBeDefined();
      expect(findProperty(amodiataireDetail!, 'userId')).toBeDefined();
      expect(findProperty(amodiataireDetail!, 'lot')).toBeDefined();
      expect(findProperty(amodiataireDetail!, 'profile')).toBeDefined();
      expect(findProperty(amodiataireDetail!, 'media')).toBeDefined();

      const mediaDetail = findInterface(interfaces, 'MediaDetail');
      expect(mediaDetail).toBeDefined();
      expect(findProperty(mediaDetail!, 'id')).toBeDefined();
      expect(findProperty(mediaDetail!, 'url')).toBeDefined();
      
      // Check optional properties
      const thumbnailProp = findProperty(mediaDetail!, 'thumbnailUrl');
      expect(thumbnailProp?.optional).toBe(true);
    });
  });
});
