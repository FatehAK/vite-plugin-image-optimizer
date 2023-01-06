// refer: https://github.com/release-it/release-it/tree/master/docs
module.exports = {
  git: {
    requireBranch: 'main',
    commitMessage: 'chore: Release v${version}',
    tagName: 'v${version}',
    requireCommits: true, // require commits since last tag
    requireCleanWorkingDir: true, // exits if local not upto date with remote or if workdir is unclean
  },
  github: {
    release: true, // creates a github release
    draft: true, // github releases are only drafted, confirm the draft in github releases page to publish it
    commitArgs: ['-S'], // creates gpg signed commits
    tagArgs: ['-s'], // creates gpg signed tags
    releaseName: '✨ v${version}',
    assets: ['tar/*.tgz'],
  },
  npm: {
    publish: true,
  },
  hooks: {
    // runs lint before releasing
    'before:init': ['pnpm lint'],
    // build the package and generate a tarball for use in github releases
    'after:bump': 'pnpm build && pnpm tarball',
    'after:release': 'echo Successfully created a release v${version} for ${repo.repository}. Please add release notes and publish it!',
  },
};
