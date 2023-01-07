const utils = require('./utils')
const { splitConfigCmd } = require('./wuConfig')
const { splitJsCmd } = require('./wuJs')
const { splitWxmlCmd } = require('./wuWxml')
const { splitWxssCmd } = require('./wuWxss')
const { splitWxapkgCmd } = require('./wuWxapkg')
const { unpackCmd, unpackWxapkg } = require('./unpack')
const { decryptCmd, decryptWxapkg } = require('./decrypt')

module.exports = {
  ...utils,
  splitConfigCmd,
  splitJsCmd,
  splitWxmlCmd,
  splitWxssCmd,
  splitWxapkgCmd,
  unpackCmd,
  decryptCmd,
  unpackWxapkg,
  decryptWxapkg,
}
