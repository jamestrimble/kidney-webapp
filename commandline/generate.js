'use strict';

const fs = require('fs');

var args = process.argv.slice(2);

var numPatients = +args[0];
var numInstances = +args[1];

let cfg = JSON.parse(fs.readFileSync('saidman-config.json'));

var saidmanCfg = cfg;
saidmanCfg.donorBtDistribution = new BloodTypeDistribution(
    cfg.donorBtDistribution.probO,
    cfg.donorBtDistribution.probA,
    cfg.donorBtDistribution.probB,
    cfg.donorBtDistribution.probAB);
saidmanCfg.patientBtDistribution = new BloodTypeDistribution(
    cfg.patientBtDistribution.probO,
    cfg.patientBtDistribution.probA,
    cfg.patientBtDistribution.probB,
    cfg.patientBtDistribution.probAB);

var gen = new KidneyGenerator(saidmanCfg);

for (var i=0; i<numInstances; i++) {
  var generatedDataset = gen.generateDataset(numPatients, 0);
  var d = generatedDataset.data;
  for (var j=0; j<d.length; j++) {
    var val = d[j];
    if ("matches" in val) {
      console.log(val.matches.length);
    } else {
      console.log(0);
    }
  }
}
