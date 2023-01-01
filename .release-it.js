module.exports = {
  git: {
    requireBranch: 'main',
    commitMessage: 'chore: Release v${version}',
    tagName: 'v${version}',
    requireCleanWorkingDir: true,
  },
  github: {
    release: true,
    draft: true,
    commitArgs: ['-S'],
    tagArgs: ['-s'],
    releaseName: '✨ v${version}',
    assets: ['tar/*.tgz'],
  },
  npm: {
    publish: true,
  },
  hooks: {
    'before:init': ['if [ "$(git log $(git describe --tags --abbrev=0)..HEAD)" = "" ]; then exit 1; fi;', 'pnpm lint'],
    'after:bump': 'pnpm build && pnpm tarball',
    'after:release':
      'echo Successfully created a release v${version} for ${repo.repository}. Please add release notes when necessary and publish it!',
  },
};
