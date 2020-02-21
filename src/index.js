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
      if (error) {
        core.setFailed(error.message)

      } else {
        core.info(`Recommended release type: ${recommendation.releaseType}`)

        try {
          // Bump the version in the package.json
          const jsonPackage = packageJson.bump(
            packageJson.get(),
            recommendation.releaseType,
            packageType,
            tagPrefix
          )

          // Update the package.json file
          packageJson.update(jsonPackage, packageType)
          const app_version = packageJson.version(jsonPackage, packageType)
          core.info(`New version: ${app_version}`)

          // Generate the changelog
          await generateChangelog(tagPrefix, preset, jsonPackage, outputFile, releaseCount)
        } catch (error) {
          core.error(`Handling of ${packageType} failed`)
          core.setFailed(error.message)
        }
        core.info('Push all changes')

        // Add changed files to git
        await git.add('.')
        await git.commit(commitMessage.replace('{version}', `${app_version}`))
        await git.createTag(`${jsonPackage.version}`)
        await git.push()
      }
    })

  } catch (error) {
    core.setFailed(error.message)
  }
}


run()
