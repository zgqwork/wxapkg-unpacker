const wu = require('./wuLib.js')
const wuJs = require('./wuJs.js')
const wuCfg = require('./wuConfig.js')
const wuMl = require('./wuWxml.js')
const wuSs = require('./wuWxss.js')
const path = require('path')
const fs = require('fs')

const PACKAGE_TYPE = {
  // 微信小游戏
  GAME: 'game.js',
  // 微信小程序插件
  PLUGIN: 'plugin.js',
  // 微信小程序
  APP_SERVICE: 'app-service.js',
}

function header(buf) {
  let firstMark = buf.readUInt8(0)
  logger.debug('firstMark: 0x' + firstMark.toString(16))
  let unknownInfo = buf.readUInt32BE(1)
  logger.debug('unknownInfo: ', unknownInfo)
  let infoListLength = buf.readUInt32BE(5)
  logger.debug('infoListLength: ', infoListLength)
  let dataLength = buf.readUInt32BE(9)
  logger.debug('dataLength: ', dataLength)
  let lastMark = buf.readUInt8(13)
  logger.debug('lastMark: 0x' + lastMark.toString(16))
  if (firstMark !== 0xbe || lastMark !== 0xed) throw Error('Magic number is not correct!')
  return [infoListLength, dataLength]
}

function makeFileList(buf) {
  logger.debug('File list info:')
  let fileCount = buf.readUInt32BE(0)
  let packageType, packageMain
  logger.debug('fileCount: ', fileCount)
  let fileInfo = [],
    off = 4
  for (let i = 0; i < fileCount; i++) {
    let info = {}
    let nameLen = buf.readUInt32BE(off)
    off += 4
    info.name = buf.toString('utf8', off, off + nameLen)
    off += nameLen
    info.off = buf.readUInt32BE(off)
    off += 4
    info.size = buf.readUInt32BE(off)
    off += 4
    fileInfo.push(info)
    !packageType &&
      Object.entries(PACKAGE_TYPE).forEach(([pn, type]) => {
        if (path.basename(info.name) === type) {
          packageType = type
          packageMain = info.name
          logger.debug(`current package type is: [${pn}]`)
        }
      })
  }
  return [fileInfo, packageType, packageMain]
}

function saveFile(dir, buf, list) {
  logger.debug('Saving files...')
  for (let info of list)
    wu.save(path.resolve(dir, (info.name.startsWith('/') ? '.' : '') + info.name), buf.slice(info.off, info.off + info.size))
}

function packDone(dir, cb, order, packageType, packageMain) {
  logger.debug('Unpack done.')
  let weappEvent = new wu.CntEvent(),
    needDelete = {}
  weappEvent.encount(4)
  weappEvent.add(() => {
    wu.addIO(() => {
      logger.debug('Split and make up done.')
      if (!order.includes('d')) {
        logger.debug('Delete files...')
        wu.addIO(() => logger.debug('Deleted. File done.'))
        for (let name in needDelete) if (needDelete[name] >= 8) wu.del(name)
      }
      cb()
    })
  })

  function doBack(deletable) {
    for (let key in deletable) {
      if (!needDelete[key]) needDelete[key] = 0
      needDelete[key] += deletable[key] //all file have score bigger than 8 will be delete.
    }
    weappEvent.decount()
    if (weappEvent.cnt === 0) cb()
  }

  function dealThreeThings(dir, mainDir, nowDir) {
    logger.debug('Split app-service.js and make up configs & wxss & wxml & wxs...')

    //deal config
    if (fs.existsSync(path.resolve(dir, 'app-config.json'))) {
      wuCfg.doConfig(path.resolve(dir, 'app-config.json'), doBack)
      logger.debug('deal config ok')
    }
    //deal js
    if (fs.existsSync(path.resolve(dir, 'app-service.js'))) {
      wuJs.splitJs(path.resolve(dir, 'app-service.js'), doBack, mainDir)
      logger.debug('deal js ok')
    }
    if (fs.existsSync(path.resolve(dir, 'workers.js'))) {
      wuJs.splitJs(path.resolve(dir, 'workers.js'), doBack, mainDir)
      logger.debug('deal js2 ok')
    }
    //deal html
    if (mainDir) {
      if (fs.existsSync(path.resolve(dir, 'page-frame.js'))) {
        wuMl.doFrame(path.resolve(dir, 'page-frame.js'), doBack, order, mainDir)
        logger.debug('deal sub html ok')
      }
      wuSs.doWxss(dir, doBack, mainDir, nowDir)
    } else {
      if (fs.existsSync(path.resolve(dir, 'page-frame.html'))) {
        wuMl.doFrame(path.resolve(dir, 'page-frame.html'), doBack, order, mainDir)
        logger.debug('deal html ok')
      } else if (fs.existsSync(path.resolve(dir, 'app-wxss.js'))) {
        wuMl.doFrame(path.resolve(dir, 'app-wxss.js'), doBack, order, mainDir)
        if (!needDelete[path.resolve(dir, 'page-frame.js')]) {
          needDelete[path.resolve(dir, 'page-frame.js')] = 8
        }
        logger.debug('deal wxss.js ok')
      } else {
        throw Error('page-frame-like file is not found in the package by auto.')
      }
      //Force it run at last, becuase lots of error occured in this part
      wuSs.doWxss(dir, doBack)

      logger.debug('deal css ok')
    }
  }

  //This will be the only func running this time, so async is needless.
  if (fs.existsSync(path.resolve(dir, 'app-service.js'))) {
    //weapp
    dealThreeThings(dir)
  } else if (fs.existsSync(path.resolve(dir, 'game.js'))) {
    //wegame
    logger.debug('Split game.js and rewrite game.json...')
    let gameCfg = path.resolve(dir, 'app-config.json')
    wu.get(gameCfg, cfgPlain => {
      let cfg = JSON.parse(cfgPlain)
      if (cfg.subContext) {
        logger.debug('Found subContext, splitting it...')
        delete cfg.subContext
        let contextPath = path.resolve(dir, 'subContext.js')
        wuJs.splitJs(contextPath, () => wu.del(contextPath))
      }
      wu.save(path.resolve(dir, 'game.json'), JSON.stringify(cfg, null, 4))
      wu.del(gameCfg)
    })
    wuJs.splitJs(path.resolve(dir, 'game.js'), () => {
      wu.addIO(() => {
        global.mainPackage = dir
        logger.debug('Split and rewrite done.')
        cb()
      })
    })
  } else if (packageType === PACKAGE_TYPE.GAME && packageMain) {
    // wegame subpackge
    const gameJS = packageMain.startsWith('/') ? packageMain.slice(1) : packageMain
    const gmPath = path.resolve(dir, gameJS)
    wuJs.splitJs(gmPath, () => {
      wu.addIO(() => {
        global.subPackageInfo = {
          gameJS,
          gameJSDir: path.dirname(gmPath),
          packageDir: dir,
        }
        logger.debug('Split and rewrite done.')
        cb()
      })
    })
  } else if (packageType === PACKAGE_TYPE.PLUGIN) {
    // wegame plugin
    global.existsPlugin = true
    logger.debug('Plugin ins do not need to be split')
    cb()
  } else {
    //分包
    let doSubPkg = false
    for (const orderElement of order) {
      if (orderElement.indexOf('s=') !== -1) {
        let mainDir = orderElement.substring(2, orderElement.length)
        logger.debug('Now dir: ' + dir)
        logger.debug('Param of mainDir: ' + mainDir)
        let findDir = function (dir, oldDir) {
          if (!fs.statSync(dir).isDirectory()) return
          let files = fs.readdirSync(dir)
          for (const file of files) {
            let workDir = path.join(dir, file)
            if (fs.existsSync(path.resolve(workDir, 'app-service.js'))) {
              logger.debug('Sub package word dir: ' + workDir)
              mainDir = path.resolve(oldDir, mainDir)
              logger.debug('Real mainDir: ' + mainDir)
              dealThreeThings(workDir, mainDir, oldDir)
              doSubPkg = true
              return true
            } else {
              findDir(workDir, oldDir)
            }
          }
        }
        findDir(dir, dir)
      }
    }
    if (!doSubPkg) {
      logger.error(
        '检测到此包是分包后的子包, 请通过 -s 参数指定存放路径后重试, 如 node wuWxapkg.js -s=/xxx/xxx ./testpkg/test-pkg-sub.wxapkg'
      )
    }
  }
}

function doFile(name, cb, order) {
  for (let ord of order) if (ord.startsWith('s=')) global.subPack = ord.slice(3)
  logger.debug('Start unpack')
  logger.debug('Unpack file ' + name)
  let dir = path.resolve(name, '..', path.basename(name, '.wxapkg'))
  logger.debug('Target Dir:', dir)
  logger.debug('Options:', order.toString())
  wu.get(
    name,
    buf => {
      let [infoListLength, dataLength] = header(buf.slice(0, 14))
      const [fileList, packageType, packageMain] = makeFileList(buf.slice(14, infoListLength + 14))
      order.includes('o')
        ? wu.addIO(logger.debug.bind(logger), 'Unpack done.')
        : wu.addIO(packDone, dir, cb, order, packageType, packageMain)
      saveFile(dir, buf, fileList)
    },
    {}
  )
}

function splitWxapkgCmd(argv) {
  wu.commandExecute(
    doFile,
    'Unpack a wxapkg file.\n\n[-o] [-d] [-s=<Main Dir>] <files...>\n\n-d Do not delete transformed unpacked files.\n-o Do not execute any operation after unpack.\n-s=<Main Dir> Regard all packages provided as subPackages and\n              regard <Main Dir> as the directory of sources of the main package.\n<files...> wxapkg files to unpack',
    argv
  )
}

module.exports = { doFile, splitWxapkgCmd }
if (require.main === module) {
  splitWxapkgCmd()
}
