const fs = require('fs')
const path = require('path')
const jsbeautify = require('./jsbeautify.js')

function deepListDir(dirname) {
  const list = []

  function listFile(dir) {
    fs.readdirSync(dir).forEach(function (item) {
      const fullpath = path.join(dir, item)
      const stats = fs.statSync(fullpath)
      stats.isDirectory() ? listFile(fullpath) : list.push(fullpath)
    })
    return list
  }

  listFile(dirname)
  return list
}

function listDir(dirname) {
  return fs.readdirSync(dirname).map(file => path.resolve(dirname, file))
}

function readFileSync(filepath) {
  return fs.readFileSync(filepath, 'utf-8')
}

function writeFileSync(filepath, content) {
  mkdirSync(path.dirname(filepath))
  return fs.writeFileSync(filepath, content, 'utf-8')
}

function getFilenameExt(filepath, withoutDot = true) {
  const ext = path.extname(filepath)
  return withoutDot ? ext.replace('.', '') : ext
}

function mkdirSync(dirname) {
  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname, { recursive: true })
    return true
  }
  return false
}

function checkIsFramework(filepath) {
  try {
    const stats = fs.statSync(filepath)
    return stats.size > 15e6
  } catch (e) {
    return false
  }
}

function copyFileSync(filename, targetPath) {
  mkdirSync(path.dirname(targetPath))
  fs.copyFileSync(filename, targetPath)
}

function renameFileSync(filename, targetPath) {
  mkdirSync(path.dirname(targetPath))
  fs.renameSync(filename, targetPath)
}

function beautify(content) {
  const indent_size = 2
  const tabChar = ' '
  return jsbeautify(content, indent_size, tabChar)
}

function cleanAlreadyUnpacked(name) {
  if (!name) return false
  const alreadyDir = name.replace(getFilenameExt(name, false), '')
  if (fs.existsSync(alreadyDir) && fs.statSync(alreadyDir).isDirectory()) {
    fs.rmdirSync(alreadyDir, { recursive: !0 })
    return alreadyDir
  }
  return false
}

function removeInvalidLine(filename, savePath) {
  savePath = savePath || filename
  const invalidRe = /\s+[a-z] = VM2_INTERNAL_STATE_DO_NOT_USE_OR_PROGRAM_WILL_FAIL\.handleException\([a-z]\);/g
  const fileBuffer = readFileSync(filename, 'utf-8')
  const newBuf = beautify(fileBuffer.replace(invalidRe, ''))
  writeFileSync(savePath, newBuf)
}

function beautifyJS(filePath, beautifiedNS) {
  // beautifiedNS = beautifiedNS || ".beautified";
  if (!fs.existsSync(filePath)) return logger.error(filePath + 'path not found!')
  const isDir = fs.statSync(filePath).isDirectory()
  if (!isDir) return writeFileSync(filePath, beautify(readFileSync(filePath)))
  filePath = path.resolve(filePath)
  const targetPath = beautifiedNS ? path.resolve(filePath, path.basename(filePath) + beautifiedNS) : filePath
  deepListDir(filePath).forEach(file => {
    let fileShort = file.replace(filePath, '')
    fileShort = fileShort.slice(+(fileShort.startsWith('/') || fileShort.startsWith('\\')))
    if (fileShort.startsWith('node_modules') || fileShort.startsWith('@babel')) return // ignore

    const targetFile = path.resolve(targetPath, fileShort)
    if (getFilenameExt(targetFile) !== 'js') return copyFileSync(file, targetFile)
    removeInvalidLine(file, targetFile)
  })
}

function options2list(options) {
  if (!options) return []
  return Object.entries(options)
    .map(([key, val]) => {
      if (typeof val === 'string') return `${key}=${val}`
      if (val === true) return key
    })
    .filter(Boolean)
}

module.exports = {
  deepListDir,
  listDir,
  readFileSync,
  writeFileSync,
  getFilenameExt,
  mkdirSync,
  checkIsFramework,
  copyFileSync,
  renameFileSync,
  beautify,
  cleanAlreadyUnpacked,
  removeInvalidLine,
  beautifyJS,
  options2list,
}
