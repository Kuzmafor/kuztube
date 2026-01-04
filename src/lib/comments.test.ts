import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Feature: kuztube-video-platform
 * Property 11: Comment Persistence
 * Property 12: Comment Deletion
 * Property 13: Pinned Comment Ordering
 * Property 14: Comment Metadata Display
 * Validates: Requirements 6.2, 6.3, 6.4, 6.6
 */

interface Comment {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  isPinned: boolean;
  createdAt: Date;
}

function createComment(
  id: string,
  text: string,
  authorId: string,
  authorName: string
): Comment {
  return {
    id,
    text: text.trim(),
    authorId,
    authorName,
    isPinned: false,
    createdAt: new Date(),
  };
}

function sortComments(comments: Comment[]): Comment[] {
  return [...comments].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });
}

function deleteComment(comments: Comment[], commentId: string): Comment[] {
  return comments.filter((c) => c.id !== commentId);
}

function pinComment(comments: Comment[], commentId: string): Comment[] {
  return comments.map((c) =>
    c.id === commentId ? { ...c, isPinned: !c.isPinned } : c
  );
}

describe('Property 11: Comment Persistence', () => {
  it('for any valid comment text, it should be persisted with matching values', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.string({ minLength: 1 }),
          text: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
          authorId: fc.string({ minLength: 1 }),
          authorName: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        }),
        (input) => {
          const comment = createComment(
            input.id,
            input.text,
            input.authorId,
            input.authorName
          );

          expect(comment.id).toBe(input.id);
          expect(comment.text).toBe(input.text.trim());
          expect(comment.authorId).toBe(input.authorId);
          expect(comment.authorName).toBe(input.authorName);
          expect(comment.isPinned).toBe(false);
          expect(comment.createdAt).toBeInstanceOf(Date);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 12: Comment Deletion', () => {
  it('for any comment deleted, it should no longer appear in the list', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1 }),
            text: fc.string({ minLength: 1 }),
            authorId: fc.string({ minLength: 1 }),
            authorName: fc.string({ minLength: 1 }),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        fc.nat(),
        (commentInputs, indexSeed) => {
          const comments = commentInputs.map((input, i) =>
            createComment(`id_${i}`, input.text, input.authorId, input.authorName)
          );

          const indexToDelete = indexSeed % comments.length;
          const commentToDelete = comments[indexToDelete];
          const afterDelete = deleteComment(comments, commentToDelete.id);

          expect(afterDelete.length).toBe(comments.length - 1);
          expect(afterDelete.find((c) => c.id === commentToDelete.id)).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 13: Pinned Comment Ordering', () => {
  it('for any pinned comment, it should appear before all non-pinned comments', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1 }),
            text: fc.string({ minLength: 1 }),
            authorId: fc.string({ minLength: 1 }),
            authorName: fc.string({ minLength: 1 }),
            isPinned: fc.boolean(),
          }),
          { minLength: 2, maxLength: 20 }
        ),
        (commentInputs) => {
          const comments: Comment[] = commentInputs.map((input, i) => ({
            id: `id_${i}`,
            text: input.text,
            authorId: input.authorId,
            authorName: input.authorName,
            isPinned: input.isPinned,
            createdAt: new Date(Date.now() - i * 1000),
          }));

          const sorted = sortComments(comments);

          // Find first non-pinned index
          const firstNonPinnedIndex = sorted.findIndex((c) => !c.isPinned);

          if (firstNonPinnedIndex > 0) {
            // All comments before first non-pinned should be pinned
            for (let i = 0; i < firstNonPinnedIndex; i++) {
              expect(sorted[i].isPinned).toBe(true);
            }
          }

          // All comments after first non-pinned should be non-pinned
          if (firstNonPinnedIndex >= 0) {
            for (let i = firstNonPinnedIndex; i < sorted.length; i++) {
              expect(sorted[i].isPinned).toBe(false);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 14: Comment Metadata Display', () => {
  it('for any comment, author name and timestamp should be present', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.string({ minLength: 1 }),
          text: fc.string({ minLength: 1 }),
          authorId: fc.string({ minLength: 1 }),
          authorName: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        }),
        (input) => {
          const comment = createComment(
            input.id,
            input.text,
            input.authorId,
            input.authorName
          );

          // Verify metadata is present
          expect(comment.authorName).toBeTruthy();
          expect(comment.authorName.length).toBeGreaterThan(0);
          expect(comment.createdAt).toBeInstanceOf(Date);
          expect(comment.createdAt.getTime()).toBeLessThanOrEqual(Date.now());
        }
      ),
      { numRuns: 100 }
    );
  });
});
