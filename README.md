# Wordle API Service — Senior Engineer Challenge

**Time limit:** 45 minutes

## Overview

You're given a partially implemented Wordle backend service with bugs and missing features. Your task is to fix, extend, and test it.

## Setup

```bash
npm install
npm test        # Run tests (some failing)
npm run demo    # Run demo showing buggy behavior
```

## The Bugs

The current implementation has three issues:

1. **Duplicate letter logic is broken** — When a guess has repeated letters, the coloring is incorrect. For example, guessing "APPLE" when the answer is "PAPER" produces wrong results.

2. **No input validation** — The service accepts any string as a guess, regardless of length or whether it's a real word.

3. **Race condition** — Concurrent requests to the same game can corrupt state due to an async gap between reading and writing game state.

## Your Tasks

1. **Fix the duplicate letter bug** — Implement correct Wordle coloring:
   - Green (0): Correct letter in correct position
   - Yellow (1): Letter exists in answer but wrong position
   - Grey (2): Letter not in answer (or already accounted for)

2. **Add validation** — Reject guesses that are:
   - Wrong length (must match answer length)
   - Not in the dictionary (use provided `DictionaryService`)

3. **Make it thread-safe** — Ensure concurrent requests to the same game don't corrupt state

4. **Write tests** — Add 3-5 tests covering the edge cases you identify

## Duplicate Letter Rules (Wordle Standard)

This is the tricky part. Here's how Wordle handles duplicates:

- **Answer: "PAPER", Guess: "APPLE"**
  - A: Yellow (exists, wrong spot)
  - P: Green (correct spot)
  - P: Grey (only one P in answer, already matched)
  - L: Grey (not in answer)
  - E: Yellow (exists, wrong spot)

- **Answer: "SHEEP", Guess: "CREEP"**
  - C: Grey
  - R: Grey
  - E: Yellow (one E accounted for)
  - E: Green (second E in correct spot)
  - P: Green

**Key insight:** Process greens first, then yellows, tracking which answer letters are "used up."

## Files

```
src/
├── types.ts              # Shared interfaces (don't modify)
├── DictionaryService.ts  # Mock dictionary (working, don't modify)
├── WordleService.ts      # BUGGY — fix this file
└── index.ts              # Demo script

tests/
└── WordleService.test.ts # Add your tests here
```

## Dictionary API

The `DictionaryService` provides:
- `isValidWord(word: string): Promise<boolean>` — checks if word is in dictionary
- `getRandomWord(): string` — returns a random 5-letter word

## Evaluation Criteria

| Criteria | Weight |
|----------|--------|
| Duplicate letter algorithm correctness | 30% |
| Edge cases identified and handled | 25% |
| Thread-safety approach | 20% |
| Test quality and coverage | 15% |
| Code clarity and communication | 10% |

## Tips

- Run `npm run demo` to see the bugs in action
- The test file has hints about edge cases to consider
- Focus on correctness first, optimization later
- Talk through your thinking as you work

## Out of Scope

- Persisting to a database
- HTTP server implementation
- Frontend UI

Good luck!
