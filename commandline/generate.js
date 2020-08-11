'use strict';

const fs = require('fs');

var args = process.argv.slice(2);

var configFile = args[0] || 'saidman-config.json';

var config = JSON.parse(fs.readFileSync(configFile));

config.donorBtDistribution = new BloodTypeDistribution(
    config.donorBtDistribution.probO,
    config.donorBtDistribution.probA,
    config.donorBtDistribution.probB,
    config.donorBtDistribution.probAB);
config.patientBtDistribution = new BloodTypeDistribution(
    config.patientBtDistribution.probO,
    config.patientBtDistribution.probA,
    config.patientBtDistribution.probB,
    config.patientBtDistribution.probAB);

if (config.tuneBts) {
  var tuneIter = config.tuneBts.iters || 50;
  var tuneError = config.tuneBts.error || 0.005;
  var tuneSize = config.tuneBts.size || config.patientsPerInstance;
  config = TuneConfig(config, tuneIter, tuneError, tuneSize);
}

if (config.tuneDonors) {
  var tuneIter = config.tuneDonors.iters || 50;
  var tuneError = config.tuneDonors.error || 0.005;
  var tuneSize = config.tuneDonors.size || config.patientsPerInstance;
  config = TuneDonorConfig(config, tuneIter, tuneError, tuneSize);
}

var gen = new KidneyGenerator(config);

for (var i=0; i < config.numberOfInstances; i++) {
  var generatedDataset = gen.generateDataset(config.patientsPerInstance, config.proportionAltruistic);
  var d = generatedDataset.data;
  if (config.testing) {
    for (var j=0; j<d.length; j++) {
      var val = d[j];
      if ("matches" in val) {
        console.log(val.matches.length);
      } else {
        console.log(0);
      }
    }
  }
  if (! config.testing) {
    var filename = config.outputName || "Generated";
    filename += "_" + config.patientsPerInstance;
    var format = config.outputFormat || "json";
    filename += "_" + i + "." + format;
    var nullfn = function() {};
    if (format == "json") {
      fs.writeFile(filename, generatedDataset.toJsonString(), nullfn);
    } else {
      fs.writeFile(filename, generatedDataset.toXmlString(), nullfn);
    }
  }
}
