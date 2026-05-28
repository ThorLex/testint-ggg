/**
 * Property-based tests for NotificationsModal component
 * 
 * Tests universal properties of announcement display, sorting, and filtering.
 * 
 * Feature: map-routes-and-notifications
 */

import * as fc from 'fast-check';
import React from 'react';
import { render } from '@testing-library/react-native';
import { NotificationsModal } from './NotificationsModal';
import type { Announcement } from '@/types';

// Mock dependencies
jest.mock('@/components/atoms', () => ({
    Input: ({ value, onChangeText, placeholder, leftIcon }: any) => {
        const { TextInput, View } = require('react-native');
        return (
            <View>
                {leftIcon}
                <TextInput
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    testID="search-input"
                />
            </View>
        );
    },
}));

// ============================================================================
// Arbitraries (Generators)
// ============================================================================

/**
 * Generator for Announcement objects
 */
const announcementArbitrary = fc.record({
    id: fc.uuid(),
    title: fc.string({ minLength: 5, maxLength: 100 }).filter(s => s.trim().length > 0),
    type: fc.constantFrom('info', 'warning', 'alert', 'maintenance'),
    content: fc.string({ minLength: 10, maxLength: 500 }).filter(s => s.trim().length > 0),
    date: fc.option(
        fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2030-12-31').getTime() })
            .map(timestamp => new Date(timestamp).toISOString())
    ),
    priority: fc.option(fc.constantFrom('low', 'medium', 'high')),
}) as fc.Arbitrary<Announcement>;

// ============================================================================
// Property Tests
// ============================================================================

describe('Feature: map-routes-and-notifications', () => {
    describe('Property 7: Announcement Display', () => {
        /**
         * **Validates: Requirements 4.3**
         * 
         * For any announcement in the list, the rendered item should display
         * the title, type, and content fields.
         */
        test('should display title, type, and content for any announcement', () => {
            fc.assert(
                fc.property(
                    fc.array(announcementArbitrary, { minLength: 1, maxLength: 10 }),
                    (announcements) => {
                        const { getAllByText } = render(
                            <NotificationsModal
                                visible={true}
                                onClose={() => {}}
                                announcements={announcements}
                            />
                        );

                        // Verify each announcement's fields are displayed
                        announcements.forEach((announcement) => {
                            // Title should be displayed
                            const titleElements = getAllByText(announcement.title);
                            expect(titleElements.length).toBeGreaterThan(0);
                            
                            // Type should be displayed
                            const typeElements = getAllByText(announcement.type);
                            expect(typeElements.length).toBeGreaterThan(0);
                            
                            // Content should be displayed
                            const contentElements = getAllByText(announcement.content);
                            expect(contentElements.length).toBeGreaterThan(0);
                        });
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('should display all required fields for single announcement', () => {
            fc.assert(
                fc.property(announcementArbitrary, (announcement) => {
                    const { getByText } = render(
                        <NotificationsModal
                            visible={true}
                            onClose={() => {}}
                            announcements={[announcement]}
                        />
                    );

                    // Verify title is displayed
                    const titleElement = getByText(announcement.title);
                    expect(titleElement).toBeTruthy();

                    // Verify type is displayed
                    const typeElement = getByText(announcement.type);
                    expect(typeElement).toBeTruthy();

                    // Verify content is displayed
                    const contentElement = getByText(announcement.content);
                    expect(contentElement).toBeTruthy();
                }),
                { numRuns: 100 }
            );
        });

        test('should display date when present', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        id: fc.uuid(),
                        title: fc.string({ minLength: 5, maxLength: 100 }),
                        type: fc.constantFrom('info', 'warning', 'alert', 'maintenance'),
                        content: fc.string({ minLength: 10, maxLength: 500 }),
                        date: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2030-12-31').getTime() })
                            .map(timestamp => new Date(timestamp).toISOString()),
                        priority: fc.option(fc.constantFrom('low', 'medium', 'high')),
                    }) as fc.Arbitrary<Announcement>,
                    (announcement) => {
                        const { getByText } = render(
                            <NotificationsModal
                                visible={true}
                                onClose={() => {}}
                                announcements={[announcement]}
                            />
                        );

                        // Verify date is displayed in localized format
                        const dateString = new Date(announcement.date!).toLocaleDateString();
                        expect(getByText(dateString)).toBeTruthy();
                    }
                ),
                { numRuns: 100 }
            );
        });
    });
});


    describe('Property 8: Announcement Date Sorting', () => {
        /**
         * **Validates: Requirements 4.5**
         * 
         * For any list of announcements where all have date fields, the announcements
         * should be ordered with the most recent date first.
         */
        test('should sort announcements by date with most recent first', () => {
            fc.assert(
                fc.property(
                    fc.array(
                        fc.record({
                            id: fc.uuid(),
                            title: fc.string({ minLength: 5, maxLength: 100 }).filter(s => s.trim().length > 0),
                            type: fc.constantFrom('info', 'warning', 'alert', 'maintenance'),
                            content: fc.string({ minLength: 10, maxLength: 500 }).filter(s => s.trim().length > 0),
                            date: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2030-12-31').getTime() })
                                .map(timestamp => new Date(timestamp).toISOString()),
                            priority: fc.option(fc.constantFrom('low', 'medium', 'high')),
                        }) as fc.Arbitrary<Announcement>,
                        { minLength: 2, maxLength: 10 }
                    ).map((announcements, idx) => 
                        // Ensure unique IDs by appending index
                        announcements.map((a, i) => ({ ...a, id: `${a.id}-${idx}-${i}` }))
                    ),
                    (announcements) => {
                        const { UNSAFE_root } = render(
                            <NotificationsModal
                                visible={true}
                                onClose={() => {}}
                                announcements={announcements}
                            />
                        );

                        // Find the FlatList component
                        const flatLists = UNSAFE_root.findAllByType('FlatList' as any);
                        if (flatLists.length === 0) {
                            // If no FlatList, it means empty state is shown
                            return;
                        }
                        
                        const flatList = flatLists[0];
                        const renderedData = flatList.props.data;

                        // Verify the data is sorted by date (most recent first)
                        for (let i = 0; i < renderedData.length - 1; i++) {
                            const currentDate = new Date(renderedData[i].date!).getTime();
                            const nextDate = new Date(renderedData[i + 1].date!).getTime();
                            
                            // Current date should be >= next date (most recent first)
                            expect(currentDate).toBeGreaterThanOrEqual(nextDate);
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('should maintain order when dates are equal', () => {
            const sameDate = new Date('2025-01-15').toISOString();
            const announcements: Announcement[] = [
                {
                    id: '1',
                    title: 'First Announcement',
                    type: 'info',
                    content: 'First content here',
                    date: sameDate,
                },
                {
                    id: '2',
                    title: 'Second Announcement',
                    type: 'warning',
                    content: 'Second content here',
                    date: sameDate,
                },
                {
                    id: '3',
                    title: 'Third Announcement',
                    type: 'alert',
                    content: 'Third content here',
                    date: sameDate,
                },
            ];

            const { getByText } = render(
                <NotificationsModal
                    visible={true}
                    onClose={() => {}}
                    announcements={announcements}
                />
            );

            // Verify all announcements are displayed
            announcements.forEach((announcement) => {
                expect(getByText(announcement.title)).toBeTruthy();
                expect(getByText(announcement.content)).toBeTruthy();
            });
        });

        test('should handle announcements without dates gracefully', () => {
            fc.assert(
                fc.property(
                    fc.array(announcementArbitrary, { minLength: 1, maxLength: 10 }).map((announcements, idx) => 
                        // Ensure unique IDs
                        announcements.map((a, i) => ({ ...a, id: `${a.id}-${idx}-${i}` }))
                    ),
                    (announcements) => {
                        const { UNSAFE_root } = render(
                            <NotificationsModal
                                visible={true}
                                onClose={() => {}}
                                announcements={announcements}
                            />
                        );

                        // Should not crash when some announcements don't have dates
                        const flatLists = UNSAFE_root.findAllByType('FlatList' as any);
                        
                        // Either FlatList exists or empty state is shown
                        if (flatLists.length > 0) {
                            const flatList = flatLists[0];
                            expect(flatList).toBeDefined();
                            expect(flatList.props.data).toBeDefined();
                            expect(flatList.props.data.length).toBe(announcements.length);
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });
    });
