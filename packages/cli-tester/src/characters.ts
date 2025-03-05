export const ansiPatterns = {
  all: /\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g,

  // Green checkmark ✓ → \x1B[32m✓\x1B[39m
  greenCheckmark: '27,91,51,50,109,226,156,148,27,91,51,57,109',

  // Red error indicator > → \x1B[31m> (error message follows)
  errorMessage: '27,91,51,49,109,62,32', //  \x1B[31m> (red ">" symbol)
}

export const keys = {
  up: '\x1b[A', // Arrow Up
  down: '\x1b[B', // Arrow Down
  enter: '\n', // Enter key
  space: ' ', // Space key
}
