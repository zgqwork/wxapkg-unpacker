const wu = require('./wuLib.js')
const path = require('path')
const { removeInvalidLineCode } = require('./utils')
const { VM } = require('vm2')

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
          let res = removeInvalidLineCode(code)
          if (typeof res == 'undefined') {
            logger.debug("Fail to delete 'use strict' in \"" + name + '".')
            res = removeInvalidLineCode(bcode)
          }
          needDelList[path.resolve(dir, name)] = -8
          wu.save(path.resolve(dir, name), res)
        },
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

function splitJsCmd(argv) {
  wu.commandExecute(
    splitJs,
    'Split and beautify weapp js file.\n\n<files...>\n\n<files...> js files to split and beautify.',
    argv
  )
}

module.exports = { splitJs, splitJsCmd }
if (require.main === module) {
  splitJsCmd()
}
