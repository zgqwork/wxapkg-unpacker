const { doFile } = require("../lib/wuWxapkg");
const { logger } = require("../lib/wuLib");

const utils = require("../lib/utils");

const packages = ["../pkg3/sub-1.wxapkg"]; //deepListDir('../pkg')

const fs = require("fs");
const path = require("path");


function moveSubPackage(subPackageInfo) {
  if (!subPackageInfo) return;
  const { gameJS, gameJSDir, packageDir } = subPackageInfo;
  const splitedDir = path.resolve(gameJSDir, gameJS.split('/')[0]);
  if (!fs.existsSync(path.resolve(gameJSDir, gameJS))) return;
  logger.debug(subPackageInfo);
  utils.deepListDir(splitedDir).forEach((file) => {
    const oldFile = file
    file = file.replace(gameJSDir, '').slice(1)
    const newFile = path.resolve(packageDir, file);
    removeInvalidLine(oldFile, newFile)
  });
  fs.rmdirSync(splitedDir, { recursive: true });
}

function doNext() {
  const name = packages.pop();
  const oldPackage = utils.cleanAlreadyUnpacked(name);
  oldPackage && logger.debug("already cleaned old package", oldPackage);
  if (!name) return moveSubPackage(global.subPackageInfo);
  if (getFilenameExt(name) !== "wxapkg" || checkIsFramework(name)) return;
  doFile(name, doNext, []);
}

doNext();
