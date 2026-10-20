import { describe, expect, it } from '@jest/globals';
import {
  getNextWeek,
  getPreviousWeek,
  getWeekEnd,
  getWeekStart,
} from '../weeklyCalculationService';

describe('weekly calculation helpers', () => {
  it('starts weeks on Monday and resets the time to midnight', () => {
    const start = getWeekStart(new Date(2026, 9, 18, 15, 42, 10, 250));

    expect(start.getFullYear()).toBe(2026);
    expect(start.getMonth()).toBe(9);
    expect(start.getDate()).toBe(12);
    expect(start.getDay()).toBe(1);
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
    expect(start.getSeconds()).toBe(0);
    expect(start.getMilliseconds()).toBe(0);
  });

  it('treats Sunday as the final day of the preceding Monday-based week', () => {
    const start = getWeekStart(new Date(2026, 9, 18, 12));

    expect(start.getDate()).toBe(12);
    expect(start.getDay()).toBe(1);
  });

  it('returns the final millisecond of the week', () => {
    const end = getWeekEnd(new Date(2026, 9, 12));

    expect(end.getDate()).toBe(18);
    expect(end.getHours()).toBe(23);
    expect(end.getMinutes()).toBe(59);
    expect(end.getSeconds()).toBe(59);
    expect(end.getMilliseconds()).toBe(999);
  });

  it('moves by exactly seven days to the adjacent weeks', () => {
    const start = new Date(2026, 9, 12);

    expect(getNextWeek(start).getDate()).toBe(19);
    expect(getPreviousWeek(start).getDate()).toBe(5);
    expect(start.getDate()).toBe(12);
  });
});
