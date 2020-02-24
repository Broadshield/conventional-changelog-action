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
        core.startGroup('Update Version')
        try {
          
          const packageData = packageJson.get(packageType)
          
          // Bump the version in the package.json
          const jsonPackage = packageJson.bump(
            packageData,
            recommendation.releaseType,
            packageType,
            tagPrefix
          )
          
          // Update the package.json file
          packageJson.update(jsonPackage, packageType)
          app_version = packageJson.version(jsonPackage, packageType)
          core.info(`New version: ${app_version}`)

          // Generate the changelog
          await generateChangelog(tagPrefix, preset, app_version, outputFile, releaseCount)
        } catch (error) {
          core.error(`Handling of ${packageType} failed`)
          core.setFailed(error.message)
        }
        core.endGroup()
        await core.startGroup('Git Handling', async () => {
        await git.add('.')
        await git.commit(commitMessage.replace('{version}', `${app_version}`))
        await git.createTag(`${app_version}`)
        await git.push()
        }
      }
    })

  } catch (error) {
    core.setFailed(error.message)
  }
}


run()
