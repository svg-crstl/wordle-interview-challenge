import { WordleService } from './WordleService';
import { LetterCode } from './types';

/**
 * Demo script showing the bugs in the WordleService
 * 
 * Run with: npm run demo
 */

function codeToEmoji(code: LetterCode): string {
  switch (code) {
    case LetterCode.GREEN: return '🟩';
    case LetterCode.YELLOW: return '🟨';
    case LetterCode.GREY: return '⬜';
  }
}

function formatResult(guess: string, codes: LetterCode[]): string {
  const letters = guess.split('').map((l, i) => `${l}:${codeToEmoji(codes[i])}`).join(' ');
  return letters;
}

async function demonstrateDuplicateLetterBug() {
  console.log('='.repeat(60));
  console.log('BUG #1: Duplicate Letter Handling');
  console.log('='.repeat(60));
  
  const service = new WordleService();
  
  // Test case: Answer is PAPER, guess is APPLE
  const gameId = service.startGame({ answer: 'PAPER' });
  const result = await service.submitGuess(gameId, 'APPLE');
  
  console.log('\nAnswer: PAPER');
  console.log('Guess:  APPLE');
  console.log('\nCurrent (buggy) result:');
  console.log(formatResult(result.guess, result.codes));
  
  console.log('\nExpected correct result:');
  console.log('A:🟨 P:🟩 P:⬜ L:⬜ E:🟨');
  console.log('\nExplanation:');
  console.log('- A: Yellow (exists in PAPER, wrong spot)');
  console.log('- P: Green (correct spot)');
  console.log('- P: Grey (only one P in PAPER, already used)');
  console.log('- L: Grey (not in answer)');
  console.log('- E: Yellow (exists in PAPER, wrong spot)');
  
  // Another test case
  console.log('\n' + '-'.repeat(40));
  
  const gameId2 = service.startGame({ answer: 'SHEEP' });
  const result2 = await service.submitGuess(gameId2, 'CREEP');
  
  console.log('\nAnswer: SHEEP');
  console.log('Guess:  CREEP');
  console.log('\nCurrent (buggy) result:');
  console.log(formatResult(result2.guess, result2.codes));
  
  console.log('\nExpected correct result:');
  console.log('C:⬜ R:⬜ E:🟨 E:🟩 P:🟩');
}

async function demonstrateValidationBug() {
  console.log('\n' + '='.repeat(60));
  console.log('BUG #2: Missing Validation');
  console.log('='.repeat(60));
  
  const service = new WordleService();
  const gameId = service.startGame({ answer: 'REACT' });
  
  console.log('\nAnswer: REACT (5 letters)');
  
  // Wrong length - should be rejected
  console.log('\nSubmitting "HI" (wrong length)...');
  try {
    const result = await service.submitGuess(gameId, 'HI');
    console.log('❌ BUG: Accepted invalid guess!');
    console.log(formatResult(result.guess, result.codes));
  } catch (e) {
    console.log('✅ Correctly rejected');
  }
  
  // Not a word - should be rejected
  console.log('\nSubmitting "XXXXX" (not a word)...');
  try {
    const result = await service.submitGuess(gameId, 'XXXXX');
    console.log('❌ BUG: Accepted non-dictionary word!');
    console.log(formatResult(result.guess, result.codes));
  } catch (e) {
    console.log('✅ Correctly rejected');
  }
}

async function demonstrateRaceCondition() {
  console.log('\n' + '='.repeat(60));
  console.log('BUG #3: Race Condition');
  console.log('='.repeat(60));
  
  const service = new WordleService();
  const gameId = service.startGame({ answer: 'REACT', maxGuesses: 2 });
  
  console.log('\nAnswer: REACT');
  console.log('Max guesses: 2');
  console.log('\nSubmitting 3 guesses concurrently...');
  
  // Submit 3 guesses at the same time
  const promises = [
    service.submitGuess(gameId, 'APPLE'),
    service.submitGuess(gameId, 'BRAVE'),
    service.submitGuess(gameId, 'CRANE'),
  ];
  
  try {
    const results = await Promise.all(promises);
    console.log('\n❌ BUG: All 3 guesses accepted! Should only allow 2.');
    results.forEach((r, i) => {
      console.log(`Guess ${i + 1}: ${r.guess} - Remaining: ${r.remainingGuesses}`);
    });
    
    const game = service.getGame(gameId);
    console.log(`\nGame state shows ${game?.guesses.length} guesses stored.`);
  } catch (e) {
    console.log('✅ Correctly rejected excess guess');
  }
}

async function main() {
  console.log('🎮 Wordle Service Bug Demonstration\n');
  
  await demonstrateDuplicateLetterBug();
  await demonstrateValidationBug();
  await demonstrateRaceCondition();
  
  console.log('\n' + '='.repeat(60));
  console.log('Your task: Fix all three bugs in WordleService.ts');
  console.log('='.repeat(60));
}

main().catch(console.error);
