function calculateBloodDistributions(dataset) {
  var result = {};
  var donorCounts = {O: 0, A: 0, B: 0, AB: 0};
  var donorTotal = 0;
  var recipCounts = {O: 0, A: 0, B: 0, AB: 0};
  var recipTotal = 0;
  var recipsSeen = {};
  for (var i = 0; i < dataset.getDonorCount() ; ++i) {
    var donor = dataset.getDonorAt(i);
    donorCounts[donor.bt.type] += 1;
    donorTotal += 1;
    for (var p = 0; p < donor.sources.length; ++p) {
      var patient = donor.sources[p];
      // Inspect each patient once
      if (recipsSeen[patient.id]) {
        continue;
      }
      recipCounts[patient.bt.type] += 1;
      recipTotal += 1;
      recipsSeen[patient.id] = true;
    }
  }
  result.donor = {probO: donorCounts.O / donorTotal, probA: donorCounts.A / donorTotal, probB: donorCounts.B / donorTotal, probAB: donorCounts.AB / donorTotal};
  result.recip = {probO: recipCounts.O / recipTotal, probA: recipCounts.A / recipTotal, probB: recipCounts.B / recipTotal, probAB: recipCounts.AB / recipTotal};
  return result;
}

function scaleBt(type, current, actual, target) {
  current[type] *= Math.sqrt(target[type] / actual[type]);
}

function scaleBtDistribution(currentProbs, actualDistribution, targetDistribution) {
  var types = ["probO", "probA", "probB", "probAB"];
  var sum = 0;
  // Multiply each probability by (sqrt( target / current)). This will bring
  // the outputs closer in line with the desired inputs.
  for(var i = 0; i < types.length; ++i) {
    var type = types[i];
    if (actualDistribution[type] == 0) {
      currentProbs[type] += 0.01;
    } else {
      scaleBt(type, currentProbs, actualDistribution, targetDistribution);
    }
    sum += currentProbs[type];
  }
  // We need to rescale back to summing to 1
  for(var i = 0; i < types.length; ++i) {
    var type = types[i];
    currentProbs[type] *= 1/sum;
  }
}

function TuneConfig(targetConfig, maxIter, maxError) {
  var targetDonors = {...targetConfig.donorBtDistribution};
  var targetRecips = {...targetConfig.patientBtDistribution};
  var currentConfig = {...targetConfig};
  var currentIter = 0;
  var biggestError;
  do {
    currentIter += 1;
    var gen = new KidneyGenerator(currentConfig);
    var dataset = gen.generateDataset(targetConfig.patientsPerInstance,
                                      targetConfig.proportionAltruistic);
    var btDistributions = calculateBloodDistributions(dataset);
    var biggestDonorError = Math.max(Math.abs(btDistributions.donor.probO - targetDonors.probO),
                       Math.abs(btDistributions.donor.probA - targetDonors.probA),
                       Math.abs(btDistributions.donor.probB - targetDonors.probB),
                       Math.abs(btDistributions.donor.probAB - targetDonors.probAB));
    var biggestRecipError = Math.max(Math.abs(btDistributions.recip.probO - targetRecips.probO),
                       Math.abs(btDistributions.recip.probA - targetRecips.probA),
                       Math.abs(btDistributions.recip.probB - targetRecips.probB),
                       Math.abs(btDistributions.recip.probAB - targetRecips.probAB));
    scaleBtDistribution(currentConfig.donorBtDistribution, btDistributions.donor,
      targetDonors);
    scaleBtDistribution(currentConfig.patientBtDistribution, btDistributions.recip,
      targetRecips);

    error = Math.max(biggestDonorError, biggestRecipError);
    console.log("Donors  target \t actual\t probs");
    console.log("O:\t" + targetDonors.probO + "\t" + btDistributions.donor.probO + "\t" +currentConfig.donorBtDistribution.probO);
    console.log("A:\t" + targetDonors.probA + "\t" + btDistributions.donor.probA + "\t" + currentConfig.donorBtDistribution.probA);
    console.log("B:\t" + targetDonors.probB + "\t" + btDistributions.donor.probB + "\t" + currentConfig.donorBtDistribution.probB);
    console.log("AB:\t" + targetDonors.probAB + "\t" + btDistributions.donor.probAB + "\t" + currentConfig.donorBtDistribution.probAB);
    console.log("Recips  target \t actual\t probs");
    console.log("O:\t" + targetRecips.probO + "\t" + btDistributions.recip.probO + "\t" + currentConfig.patientBtDistribution.probO);
    console.log("A:\t" + targetRecips.probA + "\t" + btDistributions.recip.probA + "\t" + currentConfig.patientBtDistribution.probA);
    console.log("B:\t" + targetRecips.probB + "\t" + btDistributions.recip.probB + "\t" + currentConfig.patientBtDistribution.probB);
    console.log("AB:\t" + targetRecips.probAB + "\t" + btDistributions.recip.probAB + "\t" + currentConfig.patientBtDistribution.probAB);
    console.log("After "  + currentIter + " iterations, the biggest error is " + error);
  } while (error > maxError && currentIter < maxIter);
  return currentConfig;
}

