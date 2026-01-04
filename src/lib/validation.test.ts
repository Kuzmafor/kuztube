import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { validateEmail, validatePassword } from './validation';

/**
 * Feature: kuztube-video-platform
 * Property 1: Email Validation Rejects Invalid Formats
 * Validates: Requirements 1.2
 */
describe('Property 1: Email Validation Rejects Invalid Formats', () => {
  it('should reject emails without @ symbol', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => !s.includes('@') && s.length > 0),
        (invalidEmail) => {
          const result = validateEmail(invalidEmail);
          expect(result.valid).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject emails without domain', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => s.length > 0 && !s.includes('@')),
        (localPart) => {
          const emailWithoutDomain = `${localPart}@`;
          const result = validateEmail(emailWithoutDomain);
          expect(result.valid).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject empty emails', () => {
    fc.assert(
      fc.property(
        fc.constant(''),
        (emptyEmail) => {
          const result = validateEmail(emptyEmail);
          expect(result.valid).toBe(false);
        }
      ),
      { numRuns: 1 }
    );
  });

  it('should reject whitespace-only emails', () => {
    fc.assert(
      fc.property(
        fc.stringOf(fc.constant(' ')).filter(s => s.length > 0),
        (whitespaceEmail) => {
          const result = validateEmail(whitespaceEmail);
          expect(result.valid).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should accept valid email formats', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789')).filter(s => s.length > 0),
          fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789')).filter(s => s.length > 0),
          fc.constantFrom('com', 'org', 'net', 'ru', 'io')
        ),
        ([localPart, domain, tld]) => {
          const validEmail = `${localPart}@${domain}.${tld}`;
          const result = validateEmail(validEmail);
          expect(result.valid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: kuztube-video-platform
 * Property 2: Password Length Validation
 * Validates: Requirements 1.3
 */
describe('Property 2: Password Length Validation', () => {
  it('should reject passwords shorter than 6 characters', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 5 }),
        (shortPassword) => {
          const result = validatePassword(shortPassword);
          expect(result.valid).toBe(false);
          expect(result.error).toBe('Пароль должен быть не менее 6 символов');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should accept passwords with 6 or more characters', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 6, maxLength: 100 }),
        (validPassword) => {
          const result = validatePassword(validPassword);
          expect(result.valid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject empty passwords', () => {
    const result = validatePassword('');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Пароль обязателен');
  });
});
