const path = require('path')
const fs = require('fs')
// const pomParser = require("pom-parser")
const core = require('@actions/core')
const xml2js = require("xml2js")
// var parser = require('xml2json');

module.exports = {

  /**
   * Get's the project package.json
   * @param packageType
   * @return {any}
   */
  get: (packageType) => {
    const fpath = path.resolve('./', packageType)
    core.info(`Package path: ${fpath}`)
    try {
      fs.accessSync(fpath, fs.constants.R_OK | fs.constants.W_OK)
      core.info('can read/write ' + packageType)
    } catch (err) {
      core.error('no access! ' + packageType)
    }
    if (packageType == "package.json") {
      return JSON.parse(fs.readFileSync(fpath, "utf8"))
    } else if (packageType == "pom.xml") {
      return fs.readFileSync(fpath, "utf8", function (err, data) {
        if (err) {
          core.error(err)
          core.setFailed(err.message)
          process.exit(1)
        }
        json = JSON.parse(xml2js.parseString(data, { reversible: true }))
        core.info(`packageJson: ${JSON.stringify(json)}`)
        // The parsed pom pbject.
        return json
      })
    } else {
      core.setFailed("Incorrect package Type")
      process.exit(1)
    }
  },
  /**
   * Return the version
   *
   * @param packageJson
   * @param packageType
   * @return {*}
   */
  version: (packageJson, packageType) => {
    if (packageType == "package.json") {
      // Update the package.json with the new version
      return packageJson.version
    } else {
      return packageJson.project.version
    }
  },

  /**
   * Bumps the version in the package.json
   *
   * @param packageJson
   * @param releaseType
   * @param packageType
   * @param tagPrefix
   * @return {*}
   */
  bump: (packageJson, releaseType, packageType, tagPrefix) => {
    if (packageType == "package.json") {
      let [major, minor, patch] = packageJson.version.split('.')
    } else {
      let [major, minor, patch] = packageJson.project.version.split('.')
    }
    

    switch (releaseType) {
      case 'major':
        major = parseInt(major, 10) + 1
        minor = 0
        patch = 0
        break

      case 'minor':
        minor = parseInt(minor, 10) + 1
        patch = 0
        break

      default:
        patch = parseInt(patch, 10) + 1
    }

    if (packageType == "package.json") {
      // Update the package.json with the new version
      packageJson.version = `${tagPrefix}${major}.${minor}.${patch}`
    } else {
      packageJson.project.version = `${tagPrefix}${major}.${minor}.${patch}`
    }

    return packageJson
  },

  /**
   * Update package.json
   *
   * @param packageJson
   * @param packageType
   * @return {*}
   */
  update: (packageJson, packageType) => {
    if (packageType == "package.json") {
      fs.writeFileSync(path.resolve('./', packageType), JSON.stringify(packageJson, null, 2))
    } else if (packageType == "pom.xml") {
      const builder = new xml2js.Builder()
      const xml = builder.buildObject(packageJson)
      core.info(xml)
      fs.writeFileSync(path.resolve('./', packageType), xml, function (err, data) {
        if (err) {
          core.error(err)
          core.setFailed(err.message)
          process.exit(1)
        }
        console.log("successfully written our update xml to file")

      })
    }
  },

}
