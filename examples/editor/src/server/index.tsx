#!/usr/bin/env node
import {initServer} from './server'

initServer().catch(err => {
  console.error(err)
  process.exit(1)
})
