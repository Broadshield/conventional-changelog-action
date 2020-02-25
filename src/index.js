const core = require('@actions/core')
const conventionalRecommendedBump = require('conventional-recommended-bump')

const git = require('./helpers/git')
const packageJson = require('./helpers/packageJson')
const generateChangelog = require('./helpers/generateChangelog')

async function run() {
  try {
    const commitMessage = core.getInput('git-message')
    const tagPrefix = core.getInput('tag-prefix')
    const preset = core.getInput('preset')
    const outputFile = core.getInput('output-file')
    const releaseCount = core.getInput('changelog-release-count')
    const packageType = core.getInput('package-type')


    core.info(`Using "${preset}" preset`)

    conventionalRecommendedBump({ preset }, async (error, recommendation) => {
      var app_version = ''
      if (error) {
        core.setFailed(error.message)

      } else {
        core.info(`Recommended release type: ${recommendation.releaseType}`)
        core.info(`Package type: ${packageType}`)
        core.info(`Tag prefix: ${tagPrefix}`)

        try {

          var packageData = await packageJson.get(packageType)

          // Bump the version in the package.json
          packageData = await packageJson.bump(
            packageData,
            recommendation.releaseType,
            packageType,
            tagPrefix
          )

          // Update the package.json or pom.xml file
          await packageJson.update(packageData, packageType, function (error) {
            app_version = await packageJson.version(packageData, packageType)
            core.info(`New version: ${app_version}`)
            await generateChangelog(tagPrefix, preset, app_version, outputFile, releaseCount)
            await git.add('.')
            await git.commit(commitMessage.replace('{version}', `${app_version}`))
            await git.createTag(`${app_version}`)
            await git.push()
          })

        } catch (error) {
          core.error(`Handling of ${packageType} failed`)
          core.setFailed(error.message)
        }
      }
    })

  } catch (error) {
    core.setFailed(error.message)
  }
}


run()
