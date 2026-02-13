import { WordleService } from '../src/WordleService';
import { DictionaryService } from '../src/DictionaryService';
import { LetterCode, ValidationError, GameNotFoundError, GameOverError } from '../src/types';

describe('WordleService', () => {
  let service: WordleService;

  beforeEach(() => {
    service = new WordleService();
  });

  describe('startGame', () => {
    it('should create a new game with default options', () => {
      const gameId = service.startGame();
      const game = service.getGame(gameId);
      
      expect(game).toBeDefined();
      expect(game?.maxGuesses).toBe(6);
      expect(game?.guesses).toHaveLength(0);
      expect(game?.won).toBe(false);
      expect(game?.lost).toBe(false);
    });

    it('should allow custom answer and max guesses', () => {
      const gameId = service.startGame({ answer: 'TESTS', maxGuesses: 3 });
      const game = service.getGame(gameId);
      
      expect(game?.answer).toBe('TESTS');
      expect(game?.maxGuesses).toBe(3);
    });
  });

  describe('submitGuess - basic functionality', () => {
    it('should return correct codes for exact match', async () => {
      const gameId = service.startGame({ answer: 'REACT' });
      const result = await service.submitGuess(gameId, 'REACT');
      
      expect(result.codes).toEqual([
        LetterCode.GREEN,
        LetterCode.GREEN,
        LetterCode.GREEN,
        LetterCode.GREEN,
        LetterCode.GREEN,
      ]);
      expect(result.won).toBe(true);
    });

    it('should return GREY for letters not in answer', async () => {
      const gameId = service.startGame({ answer: 'REACT' });
      const result = await service.submitGuess(gameId, 'WOUND');
      
      expect(result.codes).toEqual([
        LetterCode.GREY,
        LetterCode.GREY,
        LetterCode.GREY,
        LetterCode.GREY,
        LetterCode.GREY,
      ]);
    });

    it('should throw GameNotFoundError for invalid game ID', async () => {
      await expect(service.submitGuess('invalid-id', 'REACT'))
        .rejects.toThrow(GameNotFoundError);
    });
  });

  /**
   * ============================================================
   * DUPLICATE LETTER TESTS
   * 
   * TODO: These tests currently FAIL because of Bug #1
   * Fix the calculateLetterCodes method to make them pass
   * ============================================================
   */
  describe('submitGuess - duplicate letters (BUG #1)', () => {
    it('should handle APPLE vs PAPER correctly', async () => {
      // Answer: PAPER, Guess: APPLE
      // A: Yellow (exists, wrong spot)
      // P: Green (position 1 matches position 2 of PAPER... wait, let me recalculate)
      // 
      // PAPER = P(0) A(1) P(2) E(3) R(4)
      // APPLE = A(0) P(1) P(2) L(3) E(4)
      //
      // A(0): Not at position 0 in PAPER, but A exists at position 1 → YELLOW
      // P(1): Position 1 in PAPER is 'A', not 'P'. But P exists at 0,2 → YELLOW
      // P(2): Position 2 in PAPER is 'P' → GREEN
      // L(3): L not in PAPER → GREY
      // E(4): Position 4 in PAPER is 'R', but E exists at position 3 → YELLOW
      
      const gameId = service.startGame({ answer: 'PAPER' });
      const result = await service.submitGuess(gameId, 'APPLE');
      
      expect(result.codes).toEqual([
        LetterCode.YELLOW,  // A - exists in PAPER
        LetterCode.YELLOW,  // P - exists but wrong position
        LetterCode.GREEN,   // P - correct position
        LetterCode.GREY,    // L - not in answer
        LetterCode.YELLOW,  // E - exists in PAPER
      ]);
    });

    it('should handle SHEEP vs CREEP correctly', async () => {
      // Answer: SHEEP = S(0) H(1) E(2) E(3) P(4)
      // Guess:  CREEP = C(0) R(1) E(2) E(3) P(4)
      //
      // C(0): Not in SHEEP → GREY
      // R(1): Not in SHEEP → GREY
      // E(2): Position 2 in SHEEP is 'E' → GREEN
      // E(3): Position 3 in SHEEP is 'E' → GREEN
      // P(4): Position 4 in SHEEP is 'P' → GREEN
      
      const gameId = service.startGame({ answer: 'SHEEP' });
      const result = await service.submitGuess(gameId, 'CREEP');
      
      expect(result.codes).toEqual([
        LetterCode.GREY,    // C
        LetterCode.GREY,    // R
        LetterCode.GREEN,   // E - correct position
        LetterCode.GREEN,   // E - correct position
        LetterCode.GREEN,   // P - correct position
      ]);
    });

    it('should handle excess duplicate letters as GREY', async () => {
      // Answer: CRANE (one A)
      // Guess:  ABATE (three A's)
      // 
      // CRANE = C(0) R(1) A(2) N(3) E(4)
      // ABATE = A(0) B(1) A(2) T(3) E(4)
      //
      // A(0): Not at 0, but A exists at 2 → YELLOW (uses up the one A)
      // B(1): Not in CRANE → GREY
      // A(2): Correct position → GREEN... but wait, we already used the A?
      //       Actually GREEN should take priority! Process GREENs first.
      // T(3): Not in CRANE → GREY
      // E(4): Correct position → GREEN
      //
      // Correct approach: Process GREENs first, then YELLOWs
      // A(2) → GREEN (uses the A)
      // A(0) → GREY (no more A's available)
      // E(4) → GREEN
      
      const gameId = service.startGame({ answer: 'CRANE' });
      const result = await service.submitGuess(gameId, 'ABATE');
      
      expect(result.codes).toEqual([
        LetterCode.GREY,    // A - the only A is used by position 2
        LetterCode.GREY,    // B
        LetterCode.GREEN,   // A - correct position
        LetterCode.GREY,    // T
        LetterCode.GREEN,   // E - correct position
      ]);
    });

    // TODO: Add more edge cases you identify
    // Hint: What about when answer has duplicates but guess doesn't?
    // Hint: What about triple letters?
  });

  /**
   * ============================================================
   * VALIDATION TESTS
   * 
   * TODO: These tests currently FAIL because of Bug #2
   * Add validation to submitGuess to make them pass
   * ============================================================
   */
  describe('submitGuess - validation (BUG #2)', () => {
    it('should reject guess with wrong length', async () => {
      const gameId = service.startGame({ answer: 'REACT' });
      
      await expect(service.submitGuess(gameId, 'HI'))
        .rejects.toThrow(ValidationError);
      
      await expect(service.submitGuess(gameId, 'TOOLONG'))
        .rejects.toThrow(ValidationError);
    });

    it('should reject guess not in dictionary', async () => {
      const gameId = service.startGame({ answer: 'REACT' });
      
      await expect(service.submitGuess(gameId, 'XXXXX'))
        .rejects.toThrow(ValidationError);
    });

    it('should accept valid dictionary words', async () => {
      const gameId = service.startGame({ answer: 'REACT' });
      
      // APPLE is in our dictionary
      const result = await service.submitGuess(gameId, 'APPLE');
      expect(result.guess).toBe('APPLE');
    });

    // TODO: What about empty string? Null? Numbers?
  });

  /**
   * ============================================================
   * CONCURRENCY TESTS
   * 
   * TODO: These tests currently FAIL because of Bug #3
   * Make the service thread-safe to fix them
   * ============================================================
   */
  describe('submitGuess - concurrency (BUG #3)', () => {
    it('should not allow more guesses than maxGuesses with concurrent requests', async () => {
      const gameId = service.startGame({ answer: 'REACT', maxGuesses: 2 });
      
      // Submit 5 guesses concurrently
      const promises = [
        service.submitGuess(gameId, 'APPLE'),
        service.submitGuess(gameId, 'BRAVE'),
        service.submitGuess(gameId, 'CRANE'),
        service.submitGuess(gameId, 'DREAM'),
        service.submitGuess(gameId, 'EIGHT'),
      ];
      
      const results = await Promise.allSettled(promises);
      
      // Count successful submissions
      const successes = results.filter(r => r.status === 'fulfilled').length;
      
      // Should only allow 2 guesses maximum
      expect(successes).toBeLessThanOrEqual(2);
      
      // Verify game state
      const game = service.getGame(gameId);
      expect(game?.guesses.length).toBeLessThanOrEqual(2);
    });

    it('should handle concurrent requests to different games independently', async () => {
      const game1 = service.startGame({ answer: 'REACT' });
      const game2 = service.startGame({ answer: 'CRANE' });
      
      // Concurrent guesses to different games should all succeed
      const [result1, result2] = await Promise.all([
        service.submitGuess(game1, 'APPLE'),
        service.submitGuess(game2, 'BRAVE'),
      ]);
      
      expect(result1.guess).toBe('APPLE');
      expect(result2.guess).toBe('BRAVE');
    });
  });

  /**
   * ============================================================
   * GAME FLOW TESTS
   * ============================================================
   */
  describe('game flow', () => {
    it('should track remaining guesses correctly', async () => {
      const gameId = service.startGame({ answer: 'REACT', maxGuesses: 3 });
      
      let result = await service.submitGuess(gameId, 'APPLE');
      expect(result.remainingGuesses).toBe(2);
      
      result = await service.submitGuess(gameId, 'BRAVE');
      expect(result.remainingGuesses).toBe(1);
      
      result = await service.submitGuess(gameId, 'CRANE');
      expect(result.remainingGuesses).toBe(0);
      expect(result.lost).toBe(true);
    });

    it('should throw GameOverError after game is won', async () => {
      const gameId = service.startGame({ answer: 'REACT' });
      
      await service.submitGuess(gameId, 'REACT');
      
      await expect(service.submitGuess(gameId, 'APPLE'))
        .rejects.toThrow(GameOverError);
    });

    it('should throw GameOverError after game is lost', async () => {
      const gameId = service.startGame({ answer: 'REACT', maxGuesses: 1 });
      
      await service.submitGuess(gameId, 'APPLE');
      
      await expect(service.submitGuess(gameId, 'BRAVE'))
        .rejects.toThrow(GameOverError);
    });
  });
});
