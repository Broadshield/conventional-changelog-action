const fs = require('fs')
const conventionalChangelog = require('conventional-changelog')

module.exports = (tagPrefix, preset, app_version, fileName, releaseCount) => new Promise((resolve) => {
  const changelogStream = conventionalChangelog({
      preset,
      releaseCount,
    },
    {
      version: app_version,
      currentTag: `${app_version}`,
      tagPrefix,
    },
  )

  changelogStream
    .pipe(fs.createWriteStream(fileName))
    .on('finish', resolve)
})
