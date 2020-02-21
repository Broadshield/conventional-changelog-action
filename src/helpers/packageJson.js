const path = require('path')
const fs = require('fs')
const pomParser = require("pom-parser")
const core = require('@actions/core')
const xml2js = require("xml2js")

module.exports = {

  /**
   * Get's the project package.json
   * @param packageType
   * @return {any}
   */
  get: (packageType) => {
    core.info(path.resolve('./', packageType))
    if (packageType == "package.json") {
      return JSON.parse(fs.readFileSync(path.resolve('./', packageType)))
    }
    if (packageType == "pom.xml") {
      fs.readFileSync(path.resolve('./', packageType), function(err, data) {
        var json = JSON.parse(parser.toJson(data, {reversible: true}));
        // The parsed pom pbject.
        core.info("OBJECT: " + JSON.stringify(json))
        return json
      })

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
    let [major, minor, patch] = packageJson.version.split('.')

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
