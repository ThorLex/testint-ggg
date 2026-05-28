/**
 * Basic setup test to verify the testing framework is working
 * Feature: api-routes-complete-analysis
 */

import { createMockRoute, createMockInterface } from './utils/test-helpers';

describe('API Analysis Tool Setup', () => {
  it('should create mock routes', () => {
    const route = createMockRoute({
      endpoint: '/api/test',
      method: 'GET',
    });

    expect(route).toBeDefined();
    expect(route.endpoint).toBe('/api/test');
    expect(route.method).toBe('GET');
  });

  it('should create mock interfaces', () => {
    const mockInterface = createMockInterface({
      name: 'TestInterface',
      properties: [
        {
          name: 'id',
          type: 'string',
          optional: false,
        },
      ],
    });

    expect(mockInterface).toBeDefined();
    expect(mockInterface.name).toBe('TestInterface');
    expect(mockInterface.properties).toHaveLength(1);
    expect(mockInterface.properties[0].name).toBe('id');
  });

  it('should verify fast-check is available', () => {
    const fc = require('fast-check');
    expect(fc).toBeDefined();
    expect(fc.assert).toBeDefined();
    expect(fc.property).toBeDefined();
  });
});
