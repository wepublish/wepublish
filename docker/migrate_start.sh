#!/bin/bash
npx prisma migrate deploy
node dist/api/prisma/run-seed.js