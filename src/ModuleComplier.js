const path = require('path')
const {
  EventEmitter
} = require('events')
const {
  debounce,
  cloneDeep
} = require('lodash')
const fs = require('fs').promises
const getConfig = require('./webpack.web.config')
const webpack = require('webpack')

class ModuleComplier extends EventEmitter {
  constructor (options) {
    super()
    this.manifest = {}
    this.InputManifest = {}
    this.modulePath = options.modulePath
    this.complier = null
    this.watching = null
    this.memoryfs = options.memoryfs
    this.moduleBase = path.resolve(options.sourcePath, options.modulePath)
    this.manifestFile = path.resolve(options.sourcePath, options.modulePath, 'manifest.json')
    this.entry = null
    this.debounce = debounce(this.readManifest.bind(this), 1000)
    this.debounce()
  }

  async readManifest () {
    var json = await fs.readFile(this.manifestFile, { encoding: 'utf-8' })
    this.InputManifest = JSON.parse(json)
    this.manifest = cloneDeep(this.InputManifest)
    delete this.manifest.$schema
    var entry = {}
    if (typeof this.InputManifest === 'object') {
      if (this.InputManifest.embed) {
        entry.embed = path.resolve(this.moduleBase, this.InputManifest.embed)
        this.manifest.embed = {
          css: `${this.manifest.id}/${this.manifest.id}.embed.css`,
          js: `${this.manifest.id}/${this.manifest.id}.embed.js`
        }
      }
      if (this.InputManifest.externalWindow) {
        entry.externalWindow = path.resolve(this.moduleBase, this.InputManifest.externalWindow)
        this.manifest.externalWindow = {
          css: `${this.manifest.id}/${this.manifest.id}.externalWindow.css`,
          js: `${this.manifest.id}/${this.manifest.id}.externalWindow.js`
        }
      }
      if (this.InputManifest.web) {
        entry.web = path.resolve(this.moduleBase, this.InputManifest.web)
        this.manifest.web = {
          css: `${this.manifest.id}/${this.manifest.id}.web.css`,
          js: `${this.manifest.id}/${this.manifest.id}.web.js`
        }
      }
      this.entry = entry
    }
  }

  async build () {
    if (this.watching !== null) {
      this.watching.close()
    }
    this.complier = webpack(getConfig(this.manifest.id, this.entry, 'production'))
    return new Promise((resolve, reject) => {
      this.complier.run((err, stats) => {
        if (err || stats.hasErrors()) {
          console.log(stats.toString({
            chunks: false,
            colors: true
          }))
          reject(err)
        } else if (stats.hasWarnings()) {
          this.emit('done')
          console.log(stats.toString({
            chunks: false,
            colors: true
          }))
          resolve(stats)
        } else {
          this.emit('done')
          console.info(`Complete ${this.manifest.id}`)
          resolve(stats)
        }
      })
    })
  }

  async watch () {
    if (this.watching !== null) {
      this.watching.close()
    }
    this.complier = webpack(getConfig(this.manifest.id, this.entry, 'development'))
    this.complier.outputFileSystem = this.memoryfs
    this.watching = this.complier.watch({
      aggregateTimeout: 300,
      poll: undefined
    }, (err, stats) => {
      if (err || stats.hasErrors()) {
        console.log(stats.toString({
          chunks: false,
          colors: true
        }))
      } else if (stats.hasWarnings()) {
        this.emit('done')
        console.log(stats.toString({
          chunks: false,
          colors: true
        }))
      } else {
        this.emit('done')
        console.info(`Complete ${this.manifest.id}`)
      }
    })
  }
}
module.exports = {
  ModuleComplier
}
