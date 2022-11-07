#!/usr/bin/env node

const {runServer} = require('../dist')
runServer().catch(err => {
  console.error(err)
  process.exit(1)
})
