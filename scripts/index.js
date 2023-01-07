const path = require('path')
const safeColors = require('colors/safe')
require('../packages/color-logger')
const unPacker = require('../packages/unpacker')
const { buildHelper, parserArgs, registeredArgs, banner, version, name } = require('./config')
const exit = () => logger.timeEnd(name) || process.exit(0)
const print = console.log.bind(console)
const bold = safeColors.bold.bind(safeColors)
const blue = safeColors.blue.bind(safeColors)
const green = safeColors.green.bind(safeColors)
const cyan = safeColors.cyan.bind(safeColors)
const printAndExit = (...args) => print(...args) && exit()
const printBanner = () => print(bold(blue(banner)))
const handlerMap = {
  wxAppid: '',
  decrypt: false,
  cleanOld: true,
  help() {
    printAndExit(buildHelper({ subroutineH: cyan, optionsH: green }).toString())
  },
  version() {
    printAndExit(bold(green(version)))
  },
  path(value) {
    const { wxAppid, decrypt } = this
    const unpack = filePath => {
      unPacker.unpackWxapkg(filePath, {
        cleanOld: this.cleanOld === true,
        callback: exit,
      })
    }
    if (wxAppid && decrypt === true) {
      logger.debug(`Enabled decrypt mode. wxAppid: ${wxAppid}`)
      unPacker.decryptWxapkg({
        wxAppid,
        filePath: value,
        callback(result) {
          if (!result || result.length === 0) exit()
          const resultDir = path.dirname(result[0])
          logger.debug('Decrypted successful save in', resultDir)
          unpack(resultDir)
        },
      })
    } else {
      unpack(value)
    }
    return true
  },
  subroutine(value) {
    const argv = process.argv
    argv.splice(argv.indexOf('splitJs'), 1)
    unPacker[value + 'Cmd'](argv)
    return true
  },
  loggerLevel(value) {
    if (!'INFO|DEBUG|WARN|ERROR'.split('|').includes(value)) {
      return logger.warn('logger level set fail! invalid value:', value)
    }
    global.logger.setLevel(global.logger[value])
  },
}

function bootstrap() {
  logger.time(name)
  printBanner()
  const { sortedArgs, result } = parserArgs()
  try {
    sortedArgs.forEach(([name, value]) => {
      const current = registeredArgs[name]
      const currentHandler = handlerMap[name]
      if (!current) return
      if (typeof currentHandler === 'function') {
        if (currentHandler.call(handlerMap, current.type(value), result)) throw new Error('break')
      } else if (handlerMap.hasOwnProperty(name)) {
        handlerMap[name] = current.type(value)
      }
    })
  } catch (e) {
    if (e.message === 'break') return
    logger.error(e)
  }
  logger.timeEnd(name)
}

module.exports = {
  bootstrap,
  ...unPacker,
}
