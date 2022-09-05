#!/usr/bin/env node

const {runServer} = require('../lib')
runServer().catch(err => {
  console.error(err)
  process.exit(1)
})
