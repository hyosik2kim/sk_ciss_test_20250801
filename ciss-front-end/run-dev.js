// run-dev.js
const { spawn } = require("child_process");
const path = require("path");

const flask = spawn("python", [path.join(__dirname, "src", "pyScript", "SCARAnalysis.py")], {
  stdio: "inherit",
});

const next = spawn("next", ["dev"], {
  stdio: "inherit",
  shell: true,
});
