const path = require('path')
const fs = require('fs')
const core = require('@actions/core')
const dom = require('xmldom').DOMParser
const XMLSerializer = require('xmldom').XMLSerializer
const xpath = require('xpath')
var select = xpath.useNamespaces({"pom": "http://maven.apache.org/POM/4.0.0"})

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
      core.debug('Ending get function')
      return JSON.parse(fs.readFileSync(fpath, "utf8"))
    } else if (packageType == "pom.xml") {
      let raw = fs.readFileSync(fpath, "utf8")
      var xml = new dom().parseFromString(raw, 'text/xml')
      core.debug('Ending get function')
      return xml
    } else {
      core.debug('Ending get function')
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
      core.debug('Ending version function')
      return packageJson.version
    } else {
      var app_version = select(`/pom:project/pom:version/text()`, packageJson)[0].nodeValue
      core.debug(`version found in pom.xml is ${app_version}`)
      core.debug('Ending version function')
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
    let app_version = module.exports.version(packageJson, packageType)
    let [major, minor, patch] = app_version.split('.')

    core.debug(`Version currently at: ${app_version}`)
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
      var node = select(`/pom:project/pom:version/`, packageJson, true)
      // var node  = result.first()

      core.debug("Result NodeValue: " + node.nodeValue)
      core.debug("Result NodeValue: " + node.data)
      node.data = `${tagPrefix}${major}.${minor}.${patch}`
    }
    core.debug(`Version updated to: ${tagPrefix}${major}.${minor}.${patch}`)
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
