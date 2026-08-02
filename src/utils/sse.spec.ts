import { describe, it, expect } from 'vitest';
import {
  extractFirstJsonObject,
  parseExpiringNotification,
} from './sse';

describe('extractFirstJsonObject', () => {
  it('returns null when no object is present', () => {
    expect(extractFirstJsonObject('not json at all')).toBeNull();
    expect(extractFirstJsonObject('')).toBeNull();
  });

  it('extracts a complete JSON object', () => {
    expect(extractFirstJsonObject('{"a":1}')).toBe('{"a":1}');
  });

  it('ignores a leading prefix', () => {
    expect(extractFirstJsonObject('junk{"a":1}')).toBe('{"a":1}');
  });

  it('stops at the first complete object when payloads are concatenated', () => {
    expect(extractFirstJsonObject('{"a":1}{"b":2}')).toBe('{"a":1}');
  });

  it('handles nested objects and strings containing braces', () => {
    const raw = '{"a":{"b":[1,2,{"c":"}"}]},"d":"{not an object}"}tail';
    expect(extractFirstJsonObject(raw)).toBe(
      '{"a":{"b":[1,2,{"c":"}"}]},"d":"{not an object}"}',
    );
  });
});

describe('parseExpiringNotification', () => {
  const valid = {
    bookingId: 'abc-123',
    roomName: 'Jupiter',
    startTime: '2026-08-02T08:30:00.000Z',
    minutesUntilStart: 5,
  };
  const validJson = JSON.stringify(valid);

  it('parses a well-formed payload', () => {
    expect(parseExpiringNotification(validJson)).toEqual(valid);
  });

  it('tolerates trailing whitespace and newlines', () => {
    expect(parseExpiringNotification(validJson + '\n\n')).toEqual(valid);
    expect(parseExpiringNotification('  ' + validJson + '  ')).toEqual(valid);
  });

  it('tolerates concatenated SSE payloads', () => {
    expect(parseExpiringNotification(validJson + validJson)).toEqual(valid);
    expect(parseExpiringNotification(validJson + '\n' + validJson)).toEqual(
      valid,
    );
  });

  it('returns null for malformed or non-object payloads', () => {
    expect(parseExpiringNotification('not json')).toBeNull();
    expect(parseExpiringNotification('null')).toBeNull();
    expect(parseExpiringNotification('[1,2,3]')).toBeNull();
    expect(parseExpiringNotification('{"a":1}')).toBeNull();
  });
});
