/** @type {import('cz-git').UserConfig} */
export default {
  rules: {
    'type-enum': [2, 'always', ['feat', 'fix', 'build', 'chore', 'ci', 'docs', 'revert']],
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
      footer: 'Any ISSUES related to this change:',
    },
    types: [
      { value: 'feat', name: '✨   feat' },
      { value: 'fix', name: '🐛   fix' },
      { value: 'build', name: '📦️   build' },
      { value: 'chore', name: '🔨   chore' },
      { value: 'ci', name: '🎡   ci' },
      { value: 'docs', name: '📝   docs' },
      { value: 'revert', name: '⏪️   revert' },
    ],
    useEmoji: false,
    upperCaseSubject: true,
    skipQuestions: ['body', 'scope', 'breaking', 'footerPrefix', 'confirmCommit'],
  },
};
