const os = require('os')
const {exec} = require('child_process')

if (os.platform() === 'darwin' && os.arch() === 'arm64') {
  exec('npm install @img/sharp-darwin-arm64@0.33.4 --no-save', (err, stdout, stderr) => {
    if (err) {
      console.error(`Error: ${stderr}`)
      process.exit(1)
    }
    console.log(stdout)
  })
}

if (os.platform() === 'linux' && os.arch() === 'x64') {
  exec('npm install @img/sharp-linux-x64@0.33.4 --no-save', (err, stdout, stderr) => {
    if (err) {
      console.error(`Error: ${stderr}`)
      process.exit(1)
    }
    console.log(stdout)
  })
}
