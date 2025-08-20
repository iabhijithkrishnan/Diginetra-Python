const { exec } = require('child_process');
const path = require('path');
require('dotenv').config();

const scriptPath = path.resolve(__dirname, '..', process.env.PYTHON_SCRIPT);

function runPythonDetection() {
  return new Promise((resolve, reject) => {
    exec(`python "${scriptPath}"`, (err, stdout, stderr) => {
      if (err) return reject(err);
      resolve(stdout || stderr);
    });
  });
}

module.exports = { runPythonDetection };
