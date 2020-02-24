const path = require('path')
const fs = require('fs')
const core = require('@actions/core')

module.exports = {

  /**
   * Get's the project package.json
   * @param packageType
   * @return {any}
   */
  get: (packageType) => {
    const fpath = path.resolve('./', packageType)
    core.debug('Starting get function')
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
      let raw = fs.readFileSync(fpath, "utf8")
      let oParser = new DOMParser()
      let xml = oParser.parseFromString(raw.toString(), "application/xml")
      return xml
    } else {
      core.setFailed("Incorrect package Type")
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
    core.debug('Starting version function')
    if (packageType == "package.json") {
      core.debug(`version found in package.json is ${packageJson.version}`)
      // Update the package.json with the new version
      return packageJson.version
    } else {
      let xpath = "/project/version"
      let app_version = xmlDoc.evaluate(xpath, packageJson, null, XPathResult.ANY_TYPE, null)
      core.debug(`version found in pom.xml is ${app_version}`)
      return app_version
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
    core.debug('Starting bump function')
    let app_version = module.exports.version(packageJson,PackageType)
      let [major, minor, patch] = app_version.split('.')

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
      let xpath = "/project/version"
      let node = xmlDoc.evaluate(xpath, packageJson, null, XPathResult.ANY_TYPE, null)
      let version = node.iterateNext()
      version.textContent = `${tagPrefix}${major}.${minor}.${patch}`
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
      var oSerializer = new XMLSerializer()
      var xml = oSerializer.serializeToString(packageJson)
      fs.writeFileSync(path.resolve('./', packageType), xml, function (err, data) {
        if (err) {
          core.error(err)
          core.setFailed(err.message)
        } else {
          console.log("successfully written our update xml to file")
        }

      })
    }
  },

}
