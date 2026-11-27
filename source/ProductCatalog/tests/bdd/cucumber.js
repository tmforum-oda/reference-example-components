// Cucumber.js profiles. Run one with: npx cucumber-js --profile <name>
//
// Tags used in the feature files:
//   @smoke   connectivity checks for both API versions
//   @v4 @v5  CRUD scenarios for one API version (on the Examples rows)
//   @cross   cross-version interoperability (TMF620-F006)
//   @compat  compatibility boundaries (TMF620-F007)
//   @crud    CRUD and lifecycle per resource (TMF620-F001 to F005)
//   @e2e     end-to-end telco catalogue (TMF620-F008)
//   @SkipTest  not run

const fs = require('fs');
const path = require('path');

// Cucumber does not create the folder for the JSON report
fs.mkdirSync(path.join(__dirname, 'reports'), { recursive: true });

const common = [
  '--require support/**/*.js',
  '--require features/step-definition/**/*.js',
  '--format progress',
  '--format json:reports/cucumber.json',
  '--publish-quiet'
].join(' ');

const withTags = (expression) => `${common} --tags "(${expression}) and not @SkipTest"`;

module.exports = {
  default: withTags('not @SkipTest'),
  all: withTags('not @SkipTest'),
  smoke: withTags('@smoke'),
  v4: withTags('@v4'),
  v5: withTags('@v5'),
  cross: withTags('@cross'),
  compat: withTags('@compat'),
  crud: withTags('@crud'),
  e2e: withTags('@e2e')
};
