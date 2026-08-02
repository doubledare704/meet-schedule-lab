import { describe, it, expect } from 'vitest';
import {
  extractFirstJsonObject,
  parseNotification,
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

describe('parseNotification', () => {
  const valid = {
    id: 'notif-123',
    bookingId: 'abc-123',
    type: 'SLOT_ENDING_SOON',
    message: 'Your booking in Jupiter ends in 5 minutes.',
    createdAt: '2026-08-02T08:30:00.000Z',
  };
  const validJson = JSON.stringify(valid);

  it('parses a well-formed payload', () => {
    expect(parseNotification(validJson)).toEqual(valid);
  });

  it('accepts a null bookingId', () => {
    const payload = { ...valid, bookingId: null };
    expect(parseNotification(JSON.stringify(payload))).toEqual(payload);
  });

  it('tolerates trailing whitespace and newlines', () => {
    expect(parseNotification(validJson + '\n\n')).toEqual(valid);
    expect(parseNotification('  ' + validJson + '  ')).toEqual(valid);
  });

  it('tolerates concatenated SSE payloads', () => {
    expect(parseNotification(validJson + validJson)).toEqual(valid);
    expect(parseNotification(validJson + '\n' + validJson)).toEqual(valid);
  });

  it('returns null for malformed or non-object payloads', () => {
    expect(parseNotification('not json')).toBeNull();
    expect(parseNotification('null')).toBeNull();
    expect(parseNotification('[1,2,3]')).toBeNull();
    expect(parseNotification('{"a":1}')).toBeNull();
  });

  it('returns null for an unknown notification type', () => {
    expect(parseNotification(JSON.stringify({ ...valid, type: 'UNKNOWN' }))).toBeNull();
  });

  it('returns null when required fields are missing', () => {
    expect(parseNotification(JSON.stringify({ id: 'x' }))).toBeNull();
    expect(
      parseNotification(JSON.stringify({ ...valid, message: 42 })),
    ).toBeNull();
  });
});
