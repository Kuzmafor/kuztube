import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Feature: kuztube-video-platform
 * Property 10: Reaction State Machine
 * Validates: Requirements 5.4, 5.5, 5.6, 5.7, 5.8
 */

type ReactionType = 'like' | 'dislike' | null;

interface ReactionState {
  likes: number;
  dislikes: number;
  userReaction: ReactionType;
}

function applyReaction(state: ReactionState, action: 'like' | 'dislike'): ReactionState {
  const { likes, dislikes, userReaction } = state;

  if (userReaction === action) {
    // Remove reaction (toggle off)
    return {
      likes: action === 'like' ? likes - 1 : likes,
      dislikes: action === 'dislike' ? dislikes - 1 : dislikes,
      userReaction: null,
    };
  } else if (userReaction === null) {
    // Add new reaction
    return {
      likes: action === 'like' ? likes + 1 : likes,
      dislikes: action === 'dislike' ? dislikes + 1 : dislikes,
      userReaction: action,
    };
  } else {
    // Switch reaction
    return {
      likes: action === 'like' ? likes + 1 : likes - 1,
      dislikes: action === 'dislike' ? dislikes + 1 : dislikes - 1,
      userReaction: action,
    };
  }
}

describe('Property 10: Reaction State Machine', () => {
  it('clicking like when no reaction exists should add a like (+1 likes)', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 10000 }),
        fc.nat({ max: 10000 }),
        (likes, dislikes) => {
          const initialState: ReactionState = { likes, dislikes, userReaction: null };
          const newState = applyReaction(initialState, 'like');

          expect(newState.likes).toBe(likes + 1);
          expect(newState.dislikes).toBe(dislikes);
          expect(newState.userReaction).toBe('like');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('clicking dislike when no reaction exists should add a dislike (+1 dislikes)', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 10000 }),
        fc.nat({ max: 10000 }),
        (likes, dislikes) => {
          const initialState: ReactionState = { likes, dislikes, userReaction: null };
          const newState = applyReaction(initialState, 'dislike');

          expect(newState.likes).toBe(likes);
          expect(newState.dislikes).toBe(dislikes + 1);
          expect(newState.userReaction).toBe('dislike');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('clicking like when already liked should remove the like (-1 likes)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10000 }),
        fc.nat({ max: 10000 }),
        (likes, dislikes) => {
          const initialState: ReactionState = { likes, dislikes, userReaction: 'like' };
          const newState = applyReaction(initialState, 'like');

          expect(newState.likes).toBe(likes - 1);
          expect(newState.dislikes).toBe(dislikes);
          expect(newState.userReaction).toBe(null);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('clicking dislike when already disliked should remove the dislike (-1 dislikes)', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 10000 }),
        fc.integer({ min: 1, max: 10000 }),
        (likes, dislikes) => {
          const initialState: ReactionState = { likes, dislikes, userReaction: 'dislike' };
          const newState = applyReaction(initialState, 'dislike');

          expect(newState.likes).toBe(likes);
          expect(newState.dislikes).toBe(dislikes - 1);
          expect(newState.userReaction).toBe(null);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('switching from like to dislike should update both counts (-1 likes, +1 dislikes)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10000 }),
        fc.nat({ max: 10000 }),
        (likes, dislikes) => {
          const initialState: ReactionState = { likes, dislikes, userReaction: 'like' };
          const newState = applyReaction(initialState, 'dislike');

          expect(newState.likes).toBe(likes - 1);
          expect(newState.dislikes).toBe(dislikes + 1);
          expect(newState.userReaction).toBe('dislike');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('switching from dislike to like should update both counts (+1 likes, -1 dislikes)', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 10000 }),
        fc.integer({ min: 1, max: 10000 }),
        (likes, dislikes) => {
          const initialState: ReactionState = { likes, dislikes, userReaction: 'dislike' };
          const newState = applyReaction(initialState, 'like');

          expect(newState.likes).toBe(likes + 1);
          expect(newState.dislikes).toBe(dislikes - 1);
          expect(newState.userReaction).toBe('like');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('double toggle should return to original state', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 10000 }),
        fc.nat({ max: 10000 }),
        fc.constantFrom('like', 'dislike') as fc.Arbitrary<'like' | 'dislike'>,
        (likes, dislikes, action) => {
          const initialState: ReactionState = { likes, dislikes, userReaction: null };
          const afterFirst = applyReaction(initialState, action);
          const afterSecond = applyReaction(afterFirst, action);

          expect(afterSecond.likes).toBe(likes);
          expect(afterSecond.dislikes).toBe(dislikes);
          expect(afterSecond.userReaction).toBe(null);
        }
      ),
      { numRuns: 100 }
    );
  });
});
