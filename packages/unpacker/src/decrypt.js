const { isWin } = require('./wuLib')
const { isEncrypted, isWxAppid, mkdirSync, listDir, existsSync, getFilenameExt } = require('./utils')
const path = require('path')
const child_process = require('child_process')
const fs = require('fs')
/**
 * @description 解密Windows上的微信小程序包
 * @param {string} options.wxAppid
 * @param {string} options.filePath
 * @param {string} options.savePath
 * @param {(result:boolean|string)=>void} [options.callback]
 * @return void
 * */
function _decryptWxapkg(options) {
  let { wxAppid, filePath, callback, savePath } = options
  if (!isEncrypted(filePath)) {
    logger.error(filePath + ' is decrypted!')
    return callback && callback(false)
  }
  const args = ['-wxid', wxAppid, '-in', filePath, '-out', savePath]
  child_process.execFile(path.resolve(__dirname, './exe/decrypt.exe'), args, (error, stdout, stderr) => {
    stdout = String(stdout).trim()
    if (error || stderr || stdout.length !== 4) {
      logger.error(error || stderr || stdout)
      return callback && callback(false)
    }
    callback && callback(savePath)
  })
}

/**
 * @description 解密Windows上的微信小程序包
 * @param {string} options.wxAppid
 * @param {string} options.filePath
 * @param {(result:false|string[])=>void} [options.callback]
 * @return {string[]|void}
 * */
function decryptWxapkg(options) {
  if (!isWin()) {
    logger.error('Decryptor only supports Windows platform!')
    return callback && callback(false)
  }
  if (!options) throw Error('options is required!')
  const { wxAppid, filePath, callback } = options
  if (!isWxAppid(wxAppid)) {
    logger.error('incorrect wxAppid!')
    return callback && callback(false)
  }
  if (!existsSync(filePath)) throw Error(filePath + 'is not fount!')
  const isDirectory = fs.statSync(filePath).isDirectory()
  const packages = (isDirectory ? listDir(filePath) : [filePath]).filter(p => getFilenameExt(p) === 'wxapkg')
  if (packages.length === 0) {
    logger.warn('No available files found from:', filePath)
    return callback && callback(false)
  }
  const decrypted = 'decrypted'
  const decryptedDir = path.resolve.apply(path, isDirectory ? [filePath, decrypted] : [filePath, '..', decrypted])
  mkdirSync(decryptedDir)
  let result = []
  packages.forEach(p => {
    const savePath = path.resolve(decryptedDir, path.basename(p))
    _decryptWxapkg({
      wxAppid,
      filePath: p,
      savePath,
      callback(val) {
        result.push(val)
      },
    })
  })
  const loading = setInterval(() => {
    if (result.length === packages.length) {
      clearInterval(loading)
      return callback && callback(result.filter(Boolean))
    }
  }, 10)
}

function decryptCmd() {
  const args = process.argv.slice(2)
  if (args.length < 2) {
    logger.debug(`Usage: node ${path.basename(__filename)} -wxid=<wx1111222233334444> <encryptedDIR|encryptedFile>`)
    process.exit(0)
  }
  let [wxAppid, filePath] = args
  wxAppid = wxAppid.replace('-wxid=', '')
  logger.time('Decrypt')
  decryptWxapkg({
    wxAppid,
    filePath,
    callback(result) {
      if (!result) return logger.timeEnd('Decrypt')
      logger.debug('Decrypted successful:')
      logger.debug(result.join('\n'))
      logger.timeEnd('Decrypt')
    },
  })
}

if (require.main === module) {
  decryptCmd()
}

module.exports = {
  decryptCmd,
  decryptWxapkg,
}
