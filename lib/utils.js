const fs = require("fs");
const path = require("path");
const jsbeautify = require("./jsbeautify.js");
const { logger } = require("./wuLib.js");

const utils = {
  deepListDir(dirname) {
    const list = [];
    function listFile(dir) {
      fs.readdirSync(dir).forEach(function (item) {
        const fullpath = path.join(dir, item);
        const stats = fs.statSync(fullpath);
        stats.isDirectory() ? listFile(fullpath) : list.push(fullpath);
      });
      return list;
    }
    listFile(dirname);
    return list;
  },
  listDir(dirname) {
    return fs.readdirSync(dirname).map((file) => path.resolve(dirname, file));
  },
  readFileSync(filepath) {
    return fs.readFileSync(filepath, "utf-8");
  },
  writeFileSync(filepath, content) {
    utils.mkdirSync(path.dirname(filepath));
    return fs.writeFileSync(filepath, content, "utf-8");
  },
  getFilenameExt(filepath, withoutDot = true) {
    const ext = path.extname(filepath);
    return withoutDot ? ext.replace(".", "") : ext;
  },
  mkdirSync(dirname) {
    if (!fs.existsSync(dirname)) {
      fs.mkdirSync(dirname, { recursive: true });
      return true;
    }
    return false;
  },
  checkIsFramework(filepath) {
    try {
      const stats = fs.statSync(filepath);
      return stats.size > 15e6;
    } catch (e) {
      return false;
    }
  },
  copyFileSync(filename, targetPath) {
    utils.mkdirSync(path.dirname(targetPath));
    fs.copyFileSync(filename, targetPath);
  },
  renameFileSync(filename, targetPath) {
    utils.mkdirSync(path.dirname(targetPath));
    fs.renameSync(filename, targetPath);
  },
  beautify(content) {
    const indent_size = 2;
    const tabchar = " ";
    return jsbeautify(content, indent_size, tabchar);
  },
  cleanAlreadyUnpacked(name) {
    if (!name) return false;
    const alreadyDir = name.replace(utils.getFilenameExt(name, false), "");
    if (fs.existsSync(alreadyDir) && fs.statSync(alreadyDir).isDirectory()) {
      fs.rmdirSync(alreadyDir, { recursive: !0 });
      return alreadyDir;
    }
    return false;
  },
  removeInvalidLine(filename, savePath) {
    savePath = savePath || filename;
    const invalidRe =
      /\s+[a-z] = VM2_INTERNAL_STATE_DO_NOT_USE_OR_PROGRAM_WILL_FAIL\.handleException\([a-z]\);/g;
    const fileBuffer = utils.readFileSync(filename, "utf-8");
    const newBuf = utils.beautify(fileBuffer.replace(invalidRe, ""));
    utils.writeFileSync(savePath, newBuf);
  },
  beautifyJS(filePath, beautifiedNS) {
    // beautifiedNS = beautifiedNS || ".beautified";
    if (!fs.existsSync(filePath))
      return logger.error(filePath + "path not found!");
    const isDir = fs.statSync(filePath).isDirectory();
    if (!isDir)
      return writeFileSync(filePath, utils.beautify(readFileSync(filePath)));
    filePath = path.resolve(filePath);
    const targetPath = beautifiedNS
      ? path.resolve(filePath, path.basename(filePath) + beautifiedNS)
      : filePath;
    utils.deepListDir(filePath).forEach((file) => {
      let fileShort = file.replace(filePath, "");
      fileShort = fileShort.slice(
        +(fileShort.startsWith("/") || fileShort.startsWith("\\"))
      );
      if (
        fileShort.startsWith("node_modules") ||
        fileShort.startsWith("@babel")
      )
        return; // ignore

      const targetFile = path.resolve(targetPath, fileShort);
      if (utils.getFilenameExt(targetFile) !== "js")
        return utils.copyFileSync(file, targetFile);
      utils.removeInvalidLine(file, targetFile);
    });
  },
  options2list(options) {
    if (!options) return [];
    return Object.entries(options)
      .map(([key, val]) => {
        if (typeof val === "string") return `${key}=${val}`;
        if (val === true) return key;
      })
      .filter(Boolean);
  },
};

module.exports = utils;
