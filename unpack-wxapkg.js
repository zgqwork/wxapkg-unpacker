require("./lib/color-logger");
const path = require("path");
const fs = require("fs");
const utils = require("./lib/utils");
const { doFile } = require("./lib/wuWxapkg");
const seenSet = new Set();

function moveSubPackage() {
  const { subPackageInfo } = global;
  if (!subPackageInfo) return;
  const { gameJS, gameJSDir, packageDir } = subPackageInfo;
  if (seenSet.has(packageDir)) return; // already processed
  const splitedDir = path.resolve(gameJSDir, gameJS.split("/")[0]);
  if (!fs.existsSync(path.resolve(gameJSDir, gameJS))) return;
  utils.deepListDir(splitedDir).forEach((file) => {
    const oldFile = file;
    file = file.replace(gameJSDir, "").slice(1);
    const newFile = path.resolve(packageDir, file);
    utils.removeInvalidLine(oldFile, newFile);
  });
  fs.rmdirSync(splitedDir, { recursive: true });
  utils.beautifyJS(packageDir);
  seenSet.add(packageDir);
}

/**
 * @param {import("fs").PathLike} filePath
 * @param {{
 *  callback?: function,
 *  finished?: function,
 *  cleanOld?: boolean,
 * }} options
 * */
function unpackWxapkg(filePath, options) {
  if (!fs.existsSync(filePath)) throw Error(filePath + " path not found!");
  const packages = !fs.statSync(filePath).isDirectory()
    ? [filePath]
    : utils.listDir(filePath);

  const filteredPackages = packages.filter((name) => {
    return (
      utils.getFilenameExt(name) === "wxapkg" && !utils.checkIsFramework(name)
    );
  });

  let processed = null;
  function doNext() {
    const name = filteredPackages.pop();
    if (!name) return options.finished && options.finished(processed);
    processed && options.callback && options.callback(processed);
    // clean old files
    if (options.cleanOld) {
      const oldPackage = utils.cleanAlreadyUnpacked(name);
      oldPackage && logger.debug("Already cleaned old package", oldPackage);
    }
    processed = name;
    doFile(name, doNext, []);
  }
  doNext();
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (!args.length) {
    logger.info("Usage: node main.js <unpackDir>");
    process.exit(1);
  }
  const processedList = [];
  unpackWxapkg(args[0], {
    callback(processed) {
      if (processed) {
        logger.debug("Already unpacked:", processed);
        processedList.push(processed);
      }
      moveSubPackage();
      const mainPackage = global.mainPackage;
      if (mainPackage) {
        if (seenSet.has(mainPackage)) return;
        utils.beautifyJS(mainPackage);
        seenSet.add(mainPackage);
      }
    },
    finished(processed) {
      this.callback(processed);
      const mainPackage = global.mainPackage;
      if (!mainPackage) return;
      logger.debug("Move subpackage to main package...");
      processedList.forEach((p) => {
        const unpackedDir = p.replace(utils.getFilenameExt(p, false), "");
        if (unpackedDir === mainPackage) return;
        utils.deepListDir(unpackedDir).forEach((file) => {
          let fileShort = file.replace(unpackedDir, "");
          fileShort = fileShort.slice(
            +(fileShort.startsWith("/") || fileShort.startsWith("\\"))
          );
          utils.renameFileSync(file, path.resolve(mainPackage, fileShort));
        });
        fs.rmdirSync(unpackedDir, { recursive: true });
      });
      logger.debug("Moved.");
      if (global.existsPlugin) {
        logger.debug("Plugin detected, Write to main package...");
        const mainPackageGameJS = path.resolve(mainPackage, "game.js");
        const content =
          'require("./plugin");\n' + utils.readFileSync(mainPackageGameJS);
        utils.writeFileSync(mainPackageGameJS, content);
        logger.debug("Done.");
      }
      const configJSON = `{
        "description": "See https://developers.weixin.qq.com/miniprogram/dev/devtools/projectconfig.html",
        "setting": {
          "urlCheck": false
        }
      }`;
      logger.debug("Write project.private.config.json");
      utils.writeFileSync(
        path.resolve(mainPackage, "project.private.config.json"),
        configJSON
      );
    },
    cleanOld: true,
  });
}
