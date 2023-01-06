const { isWin } = require('./wuLib')
const { isEncrypted, isWxAppid, existsSync } = require('./utils')
const child_process = require('child_process')

/**
 * @description 解密Windows上的微信小程序包
 * @param {string} options.wxAppid
 * @param {import('fs').PathLike} options.filePath
 * @param {import('fs').PathLike} [options.savePath]
 * @param {(result:boolean|string)=>void} [options.callback]
 * @return void
 * */
function decryptWxapkg(options) {
  let { wxAppid, filePath, savePath, callback } = options
  if (!isWin()) {
    logger.error('Decryptor only supports Windows platform!')
    return callback(false)
  }
  if (!isEncrypted(filePath)) {
    logger.error(filePath + ' is decrypted!')
    return callback(false)
  }
  if (!isWxAppid(wxAppid)) {
    logger.error('incorrect wxAppid!')
    return callback(false)
  }
  savePath = savePath || filePath
  if (!existsSync(savePath)) {
    logger.error(filePath + ' is not fount!')
    return callback(false)
  }
  const args = ['-wxid', wxAppid, '-in', filePath, '-out', savePath]
  child_process.execFile('./exe/decrypt.exe', args, (error, stdout, stderr) => {
    if (error || stderr) {
      logger.error(error)
      return callback(false)
    }
    logger.debug(stdout)
    callback(savePath)
  })
}

decryptWxapkg({
  wxAppid: 'wx8c95d5db0fff0bf1',
  filePath: 'E:\\0xNoObWorkspace\\PenetrationTest\\0xWeChat\\wxapkg_decrypt\\boomCat\\_subpackages_Main_.d.wxapkg',
  savePath: 'E:\\0xNoObWorkspace\\PenetrationTest\\0xWeChat\\wxapkg_decrypt\\boomCat\\_subpackages_Main_.d.wxapkg',
  callback(result) {
    console.log(result)
  },
})

module.exports = { decryptWxapkg }
