const path = require('path')
const fs = require('fs')
const utils = require('./utils')
const { doFile } = require('./wuWxapkg')

/**
 * @param {import('fs').PathLike} filePath
 * @param {object} options
 * @param {boolean} [options.filterableWxFwk=true] - 是否过滤微信运行框架，大概有15M
 * @param {(name)=>string[]|void=} [options.beforeUnpack] - [生命周期钩子] 解包之前
 * @param {(name)=>string|void=} [options.beforeProcessed] - [生命周期钩子] 处理之前
 * @param {(name)=>void=} [options.processed] - [生命周期钩子] 处理结束
 * @param {()=>void=} [options.completed] - [生命周期钩子] 处理完成
 * @return void
 * */
function _unpackWxapkg(filePath, options) {
  if (!fs.existsSync(filePath)) return logger.error(filePath + ' path not found!')
  options = options || {}

  function invokeHook(fn, ...args) {
    if (!fn) return args[0]
    const result = fn.apply(options, args)
    return result ? result : args[0]
  }

  const { filterableWxFwk = true, beforeUnpack, beforeProcessed, completed, processed } = options
  const packages = !fs.statSync(filePath).isDirectory() ? [filePath] : utils.listDir(filePath)
  const filteredPackages = invokeHook(
    beforeUnpack,
    packages.filter(name => {
      if (utils.getFilenameExt(name) === 'wxapkg') return false
      if (!filterableWxFwk) return true
      return !utils.checkIsFramework(name)
    })
  )

  let processedName = null

  function doNext() {
    const name = invokeHook(beforeProcessed, filteredPackages.pop())
    if (!name) {
      invokeHook(processed, processedName)
      return invokeHook(completed)
    }
    processed && invokeHook(processed, processedName)
    processedName = name
    doFile(name, doNext, [])
    console.log('AAA')
  }

  doNext()
}

/**
 * @param {import('fs').PathLike} filePath
 * @param {object?} options
 * @param {boolean} [options.cleanOld=true] - 是否清理已经的打包过的文件
 */
function unpackWxapkg(filePath, options) {
  options = options || {}
  const seenSet = new Set()
  const processedList = []

  /**
   * @description 移动并对齐小游戏的子包
   * @param {object|null} subPackageInfo
   * @param {string} subPackageInfo.gameJS
   * @param {string} subPackageInfo.gameJSDir
   * @param {string} subPackageInfo.packageDir
   * @return {void}
   * */
  function moveSubPackage(subPackageInfo) {
    if (!subPackageInfo) return logger.warn('subPackageInfo not found!')
    const { gameJS, gameJSDir, packageDir } = subPackageInfo
    if (seenSet.has(packageDir)) return logger.warn('already processed: ' + packageDir) // already processed
    const splitedDir = path.resolve(gameJSDir, gameJS.split('/')[0])
    if (!fs.existsSync(path.resolve(gameJSDir, gameJS))) return
    utils.deepListDir(splitedDir).forEach(file => {
      const oldFile = file
      file = file.replace(gameJSDir, '').slice(1)
      const newFile = path.resolve(packageDir, file)
      utils.removeInvalidLine(oldFile, newFile)
    })
    fs.rmdirSync(splitedDir, { recursive: true })
    seenSet.add(packageDir)
  }

  /**
   * @description 处理主包
   * @param {string} mainPackage
   * @return {void}
   * */
  function handleMainPackage(mainPackage) {
    if (!mainPackage) return logger.warn('mainPackage not found!')
    logger.debug('Move subpackage to main package...')
    processedList.forEach(p => {
      const unpackedDir = p.replace(utils.getFilenameExt(p, false), '')
      if (unpackedDir === mainPackage) return
      utils.deepListDir(unpackedDir).forEach(file => {
        let fileShort = file.replace(unpackedDir, '')
        fileShort = fileShort.slice(+(fileShort.startsWith('/') || fileShort.startsWith('\\')))
        utils.renameFileSync(file, path.resolve(mainPackage, fileShort))
      })
      fs.rmdirSync(unpackedDir, { recursive: true })
    })
    logger.debug('Moved.')
  }

  /**
   * @description 写入配置文件
   * @param {string} mainPackage
   * @return {void}
   * */
  function writeConfig(mainPackage) {
    if (!mainPackage) return logger.warn('mainPackage not found!')
    const configJSON = `{
        "description": "See https://developers.weixin.qq.com/miniprogram/dev/devtools/projectconfig.html",
        "setting": {
          "urlCheck": false
        }
      }`
    logger.debug('Write config to project.private.config.json')
    utils.writeFileSync(path.resolve(mainPackage, 'project.private.config.json'), configJSON)
    logger.debug('Done.')
  }

  /**
   * @description 处理插件
   * @param {string} mainPackage
   * @return {void}
   * */
  function handlePlugin(mainPackage) {
    if (!mainPackage) return logger.warn('mainPackage not found!')
    logger.debug('Plugin detected, Write to main package...')
    const mainPackageGameJS = path.resolve(mainPackage, 'game.js')
    const content = 'require("./plugin");\n' + utils.readFileSync(mainPackageGameJS)
    utils.writeFileSync(mainPackageGameJS, content)
    logger.debug('Done.')
  }

  return _unpackWxapkg(filePath, {
    beforeProcessed(name) {
      if (options.cleanOld === false) return
      const oldPackage = utils.cleanAlreadyUnpacked(name)
      oldPackage && logger.debug('Already cleaned old package', oldPackage)
    },
    processed(name) {
      if (name) {
        logger.debug('Already unpacked:', name)
        processedList.push(name)
      }
      const mainPackage = global.mainPackage
      const subPackageInfo = global.subPackageInfo
      if (mainPackage) return !seenSet.has(mainPackage) && seenSet.add(mainPackage)
      if (subPackageInfo) return moveSubPackage(subPackageInfo)
    },
    completed() {
      const mainPackage = global.mainPackage
      const existsPlugin = global.existsPlugin
      if (!mainPackage) return
      handleMainPackage(mainPackage)
      existsPlugin && handlePlugin(mainPackage)
      writeConfig(mainPackage)
    },
  })
}

if (require.main === module) {
  const args = process.argv.slice(2)
  if (!args.length) {
    logger.debug('Usage: yarn unpack <unpackDir>')
    process.exit(0)
  }
  unpackWxapkg(args[0])
}

module.exports = {
  unpackWxapkg,
}
