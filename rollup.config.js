const { nodeResolve } = require('@rollup/plugin-node-resolve')
const commonjs = require('@rollup/plugin-commonjs')
const json = require('@rollup/plugin-json')
const { uglify } = require('rollup-plugin-uglify')

const stripShebang = require('rollup-plugin-strip-shebang')

module.exports = [
  {
    input: {
      index: 'scripts/index.js',
      wxunpacker: 'bin/wxunpacker.js',
    },
    output: {
      dir: 'dist',
      format: 'cjs',
      banner: '#!/usr/bin/env node',
      exports: 'default',
      name: 'wxunpacker',
    },
    plugins: [stripShebang(), nodeResolve(), commonjs(), json(), uglify()],
    strictDeprecations: true,
    treeshake: {
      moduleSideEffects: false,
      propertyReadSideEffects: false,
      tryCatchDeoptimization: false,
    },
  },
]
