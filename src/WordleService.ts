import { v4 as uuidv4 } from 'uuid';
import {
  GameState,
  GameOptions,
  GuessResult,
  LetterCode,
  GameNotFoundError,
  GameOverError,
} from './types';
import { DictionaryService } from './DictionaryService';

/**
 * Wordle Game Service
 * 
 * ⚠️  THIS IMPLEMENTATION HAS BUGS — YOUR TASK IS TO FIX THEM
 * 
 * Known issues:
 * 1. Duplicate letter handling is incorrect
 * 2. No input validation
 * 3. Race condition with concurrent requests
 */
export class WordleService {
  private games: Map<string, GameState> = new Map();
  private dictionary: DictionaryService;

  constructor(dictionary?: DictionaryService) {
    this.dictionary = dictionary ?? new DictionaryService();
  }

  /**
   * Start a new game
   */
  startGame(options: GameOptions = {}): string {
    const id = uuidv4();
    const answer = options.answer?.toUpperCase() ?? this.dictionary.getRandomWord();
    const maxGuesses = options.maxGuesses ?? 6;

    const game: GameState = {
      id,
      answer,
      maxGuesses,
      guesses: [],
      won: false,
      lost: false,
    };

    this.games.set(id, game);
    return id;
  }

  /**
   * Submit a guess for a game
   * 
   * BUG #1: The letter coding logic doesn't handle duplicate letters correctly.
   *         For example, if answer is "PAPER" and guess is "APPLE":
   *         - Current buggy output marks both P's as GREEN
   *         - Correct output: first P is YELLOW, second P is GREEN
   * 
   * BUG #2: No validation is performed on the guess.
   *         - Should reject guesses with wrong length
   *         - Should reject guesses not in dictionary
   * 
   * BUG #3: Race condition between reading and writing game state.
   *         - Multiple concurrent calls can read stale state
   */
  async submitGuess(gameId: string, guess: string): Promise<GuessResult> {
    const game = this.games.get(gameId);
    
    if (!game) {
      throw new GameNotFoundError(gameId);
    }

    if (game.won || game.lost) {
      throw new GameOverError(gameId);
    }

    const normalizedGuess = guess.toUpperCase();

    // BUG #2: No validation here!
    // TODO: Should check:
    // - guess.length === game.answer.length
    // - await this.dictionary.isValidWord(guess)

    // BUG #3: Race condition!
    // There's an async gap here where another request could modify the game
    // Simulate some async work (e.g., validation would be async)
    await this.simulateAsyncWork();

    // BUG #1: Naive implementation that doesn't handle duplicates correctly
    const codes = this.calculateLetterCodes(normalizedGuess, game.answer);

    // Update game state (but another request might have already updated it!)
    game.guesses.push(normalizedGuess);
    
    const won = normalizedGuess === game.answer;
    const lost = !won && game.guesses.length >= game.maxGuesses;
    
    game.won = won;
    game.lost = lost;

    return {
      guess: normalizedGuess,
      codes,
      remainingGuesses: game.maxGuesses - game.guesses.length,
      won,
      lost,
    };
  }

  /**
   * Get current game state (for debugging)
   */
  getGame(gameId: string): GameState | undefined {
    return this.games.get(gameId);
  }

  /**
   * Calculate letter codes for a guess
   * 
   * BUG: This implementation is WRONG for duplicate letters!
   * 
   * Example of the bug:
   *   Answer: "PAPER"
   *   Guess:  "APPLE"
   *   
   *   Current (wrong) output: [YELLOW, GREEN, GREEN, GREY, YELLOW]
   *   Both P's get marked as if they're both valid, but there's only one P in PAPER!
   *   
   *   Correct output: [YELLOW, GREEN, GREY, GREY, YELLOW]
   *   - A: YELLOW (exists in PAPER, wrong position)
   *   - P: GREEN (correct position)
   *   - P: GREY (the P in PAPER is already "used" by the previous P)
   *   - L: GREY (not in answer)
   *   - E: YELLOW (exists in PAPER, wrong position)
   */
  private calculateLetterCodes(guess: string, answer: string): LetterCode[] {
    const codes: LetterCode[] = [];

    for (let i = 0; i < guess.length; i++) {
      const guessLetter = guess[i];
      const answerLetter = answer[i];

      if (guessLetter === answerLetter) {
        // Correct position
        codes.push(LetterCode.GREEN);
      } else if (answer.includes(guessLetter)) {
        // Wrong position but letter exists in answer
        // BUG: This doesn't account for:
        // 1. Letters that are already matched as GREEN elsewhere
        // 2. Multiple occurrences being "used up"
        codes.push(LetterCode.YELLOW);
      } else {
        // Letter not in answer
        codes.push(LetterCode.GREY);
      }
    }

    return codes;
  }

  /**
   * Simulate async work (represents validation, logging, etc.)
   * This creates the window for the race condition bug
   */
  private async simulateAsyncWork(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 10));
  }
}
