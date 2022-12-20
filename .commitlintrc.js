module.exports = {
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'style', 'build', 'perf', 'chore', 'ci', 'refactor', 'test', 'docs', 'revert'],
    ],
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],
    'scope-case': [2, 'always', 'lower-case'],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'subject-max-length': [2, 'always', 100],
  },
  prompt: {
    messages: {
      type: 'Type of change:',
      subject: 'Commit Message:',
    },
    types: [
      { value: 'feat', name: '✨   feat', emoji: '✨' },
      { value: 'fix', name: '🐛   fix', emoji: '🐛' },
      { value: 'style', name: '💄   style', emoji: '💄' },
      { value: 'build', name: '📦️   build', emoji: '📦️' },
      { value: 'perf', name: '⚡️   perf', emoji: '⚡️' },
      { value: 'chore', name: '🔨   chore', emoji: '🔨' },
      { value: 'ci', name: '🎡   ci', emoji: '🎡' },
      { value: 'refactor', name: '♻️    refactor', emoji: '♻️ ' },
      { value: 'test', name: '🌱   test', emoji: '🌱' },
      { value: 'docs', name: '📝   docs', emoji: '📝' },
      { value: 'revert', name: '⏪️   revert', emoji: '⏪️' },
    ],
    useEmoji: true,
    upperCaseSubject: true,
    customScopesAlias: 'new',
    skipQuestions: ['scope', 'body', 'breaking', 'footerPrefix', 'footer', 'confirmCommit'],
  },
};
