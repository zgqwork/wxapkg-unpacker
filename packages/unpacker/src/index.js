const utils = require('./utils')
const { splitConfigCmd } = require('./wuConfig')
const { splitJsCmd } = require('./wuJs')
const { splitWxmlCmd } = require('./wuWxml')
const { splitWxssCmd } = require('./wuWxss')
const { splitWxapkgCmd } = require('./wuWxapkg')
const { unpackWxapkg } = require('./unpackWxapkg')

module.exports = {
  ...utils,
  splitConfigCmd,
  splitJsCmd,
  splitWxmlCmd,
  splitWxssCmd,
  splitWxapkgCmd,
  unpackWxapkg,
}
