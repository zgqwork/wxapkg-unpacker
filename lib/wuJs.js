const wu = require('./wuLib.js')
const path = require('path')
const UglifyJS = require('uglify-es')
const { js_beautify } = require('js-beautify')
const { VM } = require('vm2')

function jsBeautify(code) {
  return UglifyJS.minify(code, {
    mangle: false,
    compress: false,
    output: { beautify: true, comments: true },
  }).code
}

function splitJs(name, cb, mainDir) {
  let isSubPkg = mainDir && mainDir.length > 0
  let dir = path.dirname(name)
  if (isSubPkg) {
    dir = mainDir
  }
  wu.get(name, code => {
    let needDelList = {}
    let vm = new VM({
      sandbox: {
        require() {},
        define(name, func) {
          let code = func.toString()
          code = code.slice(code.indexOf('{') + 1, code.lastIndexOf('}') - 1).trim()
          let bcode = code
          if (code.startsWith('"use strict";') || code.startsWith("'use strict';")) code = code.slice(13)
          else if (
            (code.startsWith('(function(){"use strict";') || code.startsWith("(function(){'use strict';")) &&
            code.endsWith('})();')
          )
            code = code.slice(25, -5)
          let res = jsBeautify(code)
          if (typeof res == 'undefined') {
            logger.debug("Fail to delete 'use strict' in \"" + name + '".')
            res = jsBeautify(bcode)
          }
          needDelList[path.resolve(dir, name)] = -8
          wu.save(path.resolve(dir, name), jsBeautify(res))
        },
        definePlugin() {},
        requirePlugin() {},
      },
    })
    if (isSubPkg) {
      code = code.slice(code.indexOf('define('))
    }
    logger.debug('SplitJs: ' + name)
    vm.run(code)
    logger.debug('SplitJs done.')
    if (!needDelList[name]) needDelList[name] = 8
    cb(needDelList)
  })
}

module.exports = {
  jsBeautify: jsBeautify,
  wxsBeautify: js_beautify,
  splitJs: splitJs,
}
if (require.main === module) {
  wu.commandExecute(splitJs, 'Split and beautify weapp js file.\n\n<files...>\n\n<files...> js files to split and beautify.')
}
