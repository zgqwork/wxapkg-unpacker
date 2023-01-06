const { getLogger } = require('../packages/color-logger')

const logger = getLogger()
logger.debug("I'm a debug message!")
logger.info('OMG! Check this window out!')
logger.warn('Purple Alert! Purple Alert!')
logger.error('HOLY SHI... no carrier.')
logger.trace('Very verbose message that usually is not needed...')
logger.time('A')
setTimeout(() => {
  logger.timeEnd('A')
}, 1e3)
logger.warn('Warning!')
