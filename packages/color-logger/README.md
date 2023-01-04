# Colored logger

> A colored logger

## Install
`npm install color-logger`
or
`yarn add color-logger`

## Instructions

```js
require('color-logger')
logger.debug('hello')
logger.warn('warning')
// or
const { getLogger } = require('color-logger')
const logger = getLogger('scope')
logger.debug('hello')
//...
```
