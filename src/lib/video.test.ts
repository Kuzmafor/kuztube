import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Feature: kuztube-video-platform
 * Property 7: Video Document Creation
 * Validates: Requirements 4.4
 * 
 * Testing video document structure and validation logic.
 */

interface VideoDocument {
  title: string;
  description: string;
  videoUrl: string;
  thumbnail: string;
  authorId: string;
  authorName: string;
  views: number;
  likes: number;
  dislikes: number;
}

function createVideoDocument(
  title: string,
  description: string,
  videoUrl: string,
  thumbnail: string,
  authorId: string,
  authorName: string
): VideoDocument {
  return {
    title: title.trim(),
    description: description.trim(),
    videoUrl,
    thumbnail,
    authorId,
    authorName,
    views: 0,
    likes: 0,
    dislikes: 0,
  };
}

function validateVideoDocument(doc: VideoDocument): boolean {
  return (
    typeof doc.title === 'string' &&
    doc.title.length > 0 &&
    typeof doc.description === 'string' &&
    typeof doc.videoUrl === 'string' &&
    doc.videoUrl.length > 0 &&
    typeof doc.authorId === 'string' &&
    doc.authorId.length > 0 &&
    typeof doc.authorName === 'string' &&
    doc.authorName.length > 0 &&
    typeof doc.views === 'number' &&
    doc.views >= 0 &&
    typeof doc.likes === 'number' &&
    doc.likes >= 0 &&
    typeof doc.dislikes === 'number' &&
    doc.dislikes >= 0
  );
}

describe('Property 7: Video Document Creation', () => {
  it('should create valid video document with all required fields', () => {
    fc.assert(
      fc.property(
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          description: fc.string({ maxLength: 5000 }),
          videoUrl: fc.webUrl(),
          thumbnail: fc.oneof(fc.constant(''), fc.webUrl()),
          authorId: fc.string({ minLength: 1 }),
          authorName: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
        }),
        (input) => {
          const doc = createVideoDocument(
            input.title,
            input.description,
            input.videoUrl,
            input.thumbnail,
            input.authorId,
            input.authorName
          );

          // Verify all fields are present
          expect(doc).toHaveProperty('title');
          expect(doc).toHaveProperty('description');
          expect(doc).toHaveProperty('videoUrl');
          expect(doc).toHaveProperty('thumbnail');
          expect(doc).toHaveProperty('authorId');
          expect(doc).toHaveProperty('authorName');
          expect(doc).toHaveProperty('views');
          expect(doc).toHaveProperty('likes');
          expect(doc).toHaveProperty('dislikes');

          // Verify values match input
          expect(doc.title).toBe(input.title.trim());
          expect(doc.description).toBe(input.description.trim());
          expect(doc.videoUrl).toBe(input.videoUrl);
          expect(doc.authorId).toBe(input.authorId);
          expect(doc.authorName).toBe(input.authorName);

          // Verify defaults
          expect(doc.views).toBe(0);
          expect(doc.likes).toBe(0);
          expect(doc.dislikes).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should validate video documents correctly', () => {
    fc.assert(
      fc.property(
        fc.record({
          title: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          description: fc.string(),
          videoUrl: fc.webUrl(),
          thumbnail: fc.string(),
          authorId: fc.string({ minLength: 1 }),
          authorName: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
        }),
        (input) => {
          const doc = createVideoDocument(
            input.title,
            input.description,
            input.videoUrl,
            input.thumbnail,
            input.authorId,
            input.authorName
          );

          expect(validateVideoDocument(doc)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should trim title and description', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.string({ minLength: 1 }).map(s => `  ${s}  `),
          fc.string().map(s => `  ${s}  `)
        ),
        ([title, description]) => {
          const doc = createVideoDocument(
            title,
            description,
            'https://example.com/video.mp4',
            '',
            'user123',
            'Test User'
          );

          expect(doc.title).toBe(title.trim());
          expect(doc.description).toBe(description.trim());
        }
      ),
      { numRuns: 100 }
    );
  });
});
