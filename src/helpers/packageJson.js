const path = require('path')
const fs = require('fs')
// const pomParser = require("pom-parser")
const core = require('@actions/core')
const xml2js = require("xml2js")
var pomParser = require("pom-parser");
// var parser = require('xml2json');

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
      const pomResponse = pomParser.parse({filePath: fpath})
      // , function(err, pomResponse) {
      //   if (err) {
      //     core.error("ERROR: " + err)
      //     // return {}
      //   } else {
      //     // The original pom xml that was loaded is provided.
      //     console.log("XML: " + pomResponse.pomXml);
      //     // The parsed pom pbject.
      //     console.log("OBJECT: " + JSON.stringify(pomResponse.pomObject));
      //     // return pomResponse.pomObject
      //   }
      // })

      // var parser = new xml2js.Parser({trim: true});
      // const myData = fs.readFile(fpath, "utf8", function (err, data) {
      //   core.debug('Inside read xml file function')
      //   if (err) {
      //     core.error(err)
      //     core.setFailed(err.message)
      //   }
      //   core.debug(`Parsing xml data: ${data}`)
      //   const json = parser.parseStringPromise(data).then(function (result) {
      //     return result
      //   }).catch(function (err) {
      //     core.error(err.message)
      //   })
      //   core.debug(`Xml parsed to json: ${JSON.stringify(json)}`)
      //   // The parsed pom pbject.
      //   return json
      // })
      core.debug(`Xml parsed to json: ${JSON.stringify(pomResponse.pomObject)}`)
      return pomResponse.pomObject
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
      core.debug(`version found in package.json is ${'0.0.2'}`)
      return '0.0.2' //packageJson.project.version
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
    if (packageType == "package.json") {
      let [major, minor, patch] = packageJson.version.split('.')
    } else {
      try {
        let [major, minor, patch] = packageJson.project.version.split('.')
      } catch (err) {
        let [major, minor, patch] = "0.0.2".split('.')
      }
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
      //packageJson.project.version = `${tagPrefix}${major}.${minor}.${patch}`
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
        } else {
          console.log("successfully written our update xml to file")
        }

      })
    }
  },

}
