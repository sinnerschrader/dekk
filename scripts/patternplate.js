const execa = require('execa')

execa('yarn', ['run', 'babel:packages:watch'], {stdio: 'inherit'}).catch(console.error)
execa('yarn', ['run', 'patternplate'], {stdio: 'inherit'}).catch(console.error)
