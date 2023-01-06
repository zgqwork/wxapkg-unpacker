const { existsSync } = require('fs')
const pkg = require('../package.json')
const banner = `
┬ ┬─┐ ┬┌─┐┌─┐┬┌─┌─┐   ┬ ┬┌┐┌┌─┐┌─┐┌─┐┬┌─┌─┐┬─┐
│││┌┴┬┘├─┤├─┘├┴┐│ ┬───│ ││││├─┘├─┤│  ├┴┐├┤ ├┬┘
└┴┘┴ └─┴ ┴┴  ┴ ┴└─┘   └─┘┘└┘┴  ┴ ┴└─┘┴ ┴└─┘┴└─
                      version v${pkg.version}
                      author @r3x5ur
`
const case2Hyphen = s => s.replace(/\B[A-Z]/g, c => '-' + c).toLowerCase()
const registeredSubroutine = {
  splitJs: 'Run alone Split and beautify weapp js file.',
  splitWxml: 'Run alone Restore wxml files.',
  splitWxss: 'Run alone Restore wxss files.',
  splitConfig: 'Run alone Split and make up weapp app-config.json file.',
  splitWxapkg: 'Run alone Unpack a wxapkg file.',
}
const ArgsSortMap = {
  // 执行并退出
  EXIT: 1,
  // 配置项
  CONF: 2,
  // 子程序
  SUB: 3,
  // 主程序
  MAIN: 4,
}
const registeredArgs = {
  help: {
    alias: 'h',
    type: Boolean,
    message: 'Show this message and exit.',
    sort: ArgsSortMap.EXIT,
  },
  version: {
    alias: 'v',
    type: Boolean,
    message: 'Show version number and exit.',
    sort: ArgsSortMap.EXIT,
  },
  cleanOld: {
    alias: 'co',
    type: Boolean,
    message: 'Clear the previously unpacked before unpacking.',
    default: true,
    sort: ArgsSortMap.CONF,
  },
  loggerLevel: {
    alias: 'll',
    type: String,
    message: 'Set logger level [INFO|DEBUG|WARN|ERROR].',
    default: 'DEBUG',
    sort: ArgsSortMap.CONF,
  },
  path: {
    alias: 'p',
    type: String,
    message: 'Set the path that needs to be unpacked <Directory|*.wxapkg>.',
    sort: ArgsSortMap.MAIN,
  },
  subroutine: {
    type: String,
    alias: '',
    message: '',
    sort: ArgsSortMap.SUB,
  },
}
const args = require('minimist')(process.argv.slice(2))

/**
 * @param {object} [config]
 * @param {function} [config.subroutineH]
 * @param {function} [config.optionsH]
 * */
function buildHelper(config) {
  let subroutine = Object.entries(registeredSubroutine)
    .map(([name, msg]) => name.padEnd(28) + msg)
    .join('\n  ')
  let options = Object.entries(registeredArgs)
    .filter(([_, { message }]) => Boolean(message))
    .map(([name, { alias, message }]) => [`-${alias.padEnd(2)}`, `--${case2Hyphen(name)}`].join(',').padEnd(28) + message)
    .join('\n  ')
  const { subroutineH, optionsH } = config || {}
  subroutineH && (subroutine = subroutineH(subroutine))
  optionsH && (options = optionsH(options))
  const params = { subroutine, options }
  let helper = 'Usage:\n  yarn unpack [path]|[subroutine]|[options]\nSubroutine:\n  {{subroutine}}\nOptions:\n  {{options}}'
  helper = helper.replace(/\{\{([a-z]+)}}/g, (_, key) => params[key])
  return {
    ...params,
    helper,
    toString() {
      return helper
    },
  }
}

function parserArgs() {
  const aliasMap = {}
  const defaultArgs = {}
  Object.entries(registeredArgs).forEach(([name, { alias, default: _default }]) => {
    aliasMap[alias] = name
    if (_default !== void 0) {
      defaultArgs[name] = _default
    }
  })
  const result = defaultArgs
  Object.entries(args).forEach(([name, value]) => {
    if (name === '_' && value.length) {
      if (Object.keys(registeredSubroutine).includes(value[0])) {
        result.subroutine = value[0]
      } else if (existsSync(value[0])) {
        result.path = value[0]
      }
    } else if (Object.keys(aliasMap).includes(name)) {
      result[aliasMap[name]] = value
    } else if (Object.keys(registeredArgs).includes(name)) {
      result[name] = value
    }
  })
  const sortedArgs = Object.keys(result)
    .sort((k1, k2) => registeredArgs[k1].sort - registeredArgs[k2].sort)
    .map(k => [k, result[k]])
  return { result, sortedArgs }
}

module.exports = {
  parserArgs,
  buildHelper,
  case2Hyphen,
  registeredArgs,
  version: pkg.version,
  banner,
}
