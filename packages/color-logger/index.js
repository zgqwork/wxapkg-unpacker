const Logger = require('js-logger')
const colors = require('colors')
const safeColors = require('colors/safe')
const { basename } = require('path')
colors.setTheme({
  silly: 'rainbow',
  input: 'grey',
  verbose: 'cyan',
  prompt: 'grey',
  info: 'green',
  data: 'grey',
  help: 'cyan',
  warn: 'yellow',
  debug: 'blue',
  error: 'red',
})

const DateTimeFormatOptions = {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
}
const locale = 'zh-CN'

function getTime(locale) {
  return new Date().toLocaleString(locale, DateTimeFormatOptions)
}

function getLogger(name) {
  name = name || (require.main && basename(require.main.filename, '.js'))
  return Logger.get(name)
}

Logger.useDefaults({
  defaultLevel: Logger.TRACE,
})
Logger.setHandler((message, { level, name }) => {
  message = Array.from(message).map(m => (typeof m === 'object' ? JSON.stringify(m) : m))
  name && message.unshift(`${name}`.cyan)
  message.unshift(getTime(locale).grey)
  const levelName = `[${level.name}]  `.slice(0, Logger.DEBUG.name.length + 2)
  message.unshift(levelName)
  // time
  if (level === Logger.TIME) {
    const [label, state] = message.slice(-2)
    const prop = state === 'end' ? 'timeEnd' : 'time'
    return console[prop](levelName + label)
  }
  // normal
  const levelLowerCase = level.name.toLowerCase()
  let msg = message.join(' ')
  switch (level) {
    case Logger.ERROR:
      msg = msg[levelLowerCase].bold
      break
    case Logger.TRACE:
      msg = [levelName, ...message.slice(3)].join(' ').cyan
      break
    default:
      msg = msg[levelLowerCase]
  }
  console[levelLowerCase](msg)
})

if (!global.logger) {
  global.logger = getLogger()
}
module.exports = {
  getLogger,
  safeColors,
}
