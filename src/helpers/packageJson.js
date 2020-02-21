const path = require('path')
const fs = require('fs')
const pomParser = require("pom-parser")
const core = require('@actions/core')

const packageJsonLoc = path.resolve('./', 'package.json')
const pomXmlLoc = path.resolve('./', 'pom.xml')
const xml2js = require("xml2js")

const opts = {
  filePath: pomXmlLoc, // The path to a pom file
}

module.exports = {

  /**
   * Get's the project package.json
   * @param packageType
   * @return {any}
   */
  get: (packageType) => {
    if (packageType == "package.json") {
      return JSON.parse(fs.readFileSync(packageJsonLoc))
    }
    if (packageType == "pom.xml") {
      err, pomResponse = pomParser(opts)
      if (err) {
        core.error(err)
        core.setFailed(err.message)
        process.exit(1)
      }
      return pomResponse.pomObject
    }
  },
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
      fs.writeFileSync(packageJsonLoc, JSON.stringify(packageJson, null, 2))
    } else if (packageType == "pom.xml") {
      const builder = new xml2js.Builder()
      const xml = builder.buildObject(packageJson)
      core.info(xml)
      fs.writeFileSync(pomXmlLoc, xml, function (err, data) {
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
