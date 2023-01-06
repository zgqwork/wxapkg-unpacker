const { safeColors } = require('../packages/color-logger')
const unPacker = require('../packages/unpacker')
const { buildHelper, parserArgs, registeredArgs, version, banner } = require('./config')
const exit = process.exit.bind(process, 0)
const print = console.log.bind(console)
const bold = safeColors.bold.bind(safeColors)
const blue = safeColors.blue.bind(safeColors)
const green = safeColors.green.bind(safeColors)
const cyan = safeColors.cyan.bind(safeColors)
const printAndExit = (...args) => print(...args) && exit()
const printBanner = () => print(bold(blue(banner)))
const handlerMap = {
  isCleanOld: true,
  help() {
    printAndExit(buildHelper({ subroutineH: cyan, optionsH: green }).toString())
  },
  version() {
    printAndExit(bold(green(version)))
  },
  path(value) {
    unPacker.unpackWxapkg(value, {
      cleanOld: this.isCleanOld,
    })
    return true
  },
  subroutine(value) {
    const argv = process.argv
    argv.splice(argv.indexOf('splitJs'), 1)
    unPacker[value + 'Cmd'](argv)
    return true
  },
  cleanOld(value) {
    this.isCleanOld = value
  },
  loggerLevel(value) {
    global.logger.setLevel(global.logger[value])
  },
}

function bootstrap() {
  printBanner()
  const { sortedArgs } = parserArgs()
  try {
    sortedArgs.forEach(([name, value]) => {
      const current = registeredArgs[name]
      const currentHandler = handlerMap[name]
      if (!current || typeof currentHandler === 'function') return
      if (currentHandler.call(handlerMap, current.type(value))) throw new Error('break')
    })
  } catch (e) {
    if (e.message === 'break') return
    logger.error(e)
  }
}

bootstrap()
