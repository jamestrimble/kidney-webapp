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

function TuneConfig(targetConfig, maxIter, maxError, tuneSize) {
  var targetDonors = {...targetConfig.donorBtDistribution};
  var targetRecips = {...targetConfig.patientBtDistribution};
  var currentConfig = {...targetConfig};
  var currentIter = 0;
  var biggestError;
  do {
    currentIter += 1;
    var gen = new KidneyGenerator(currentConfig);
    var dataset = gen.generateDataset(tuneSize,
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
  } while (error > maxError && currentIter < maxIter);
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
  console.log("After "  + currentIter + " iterations, the biggest error is " +error);
  return currentConfig;
}


function calculateDonorCountDistributions(dataset, maxDonors) {
  var recipTotal = 0;
  var recips = {};
  var recipIds = [];
  var recipSeens = {};
  for (var i = 0; i < dataset.getDonorCount() ; ++i) {
    var donor = dataset.getDonorAt(i);
    for (var p = 0; p < donor.sources.length; ++p) {
      var patient = donor.sources[p];
      // create if not found
      if (! recips.hasOwnProperty(patient.id)) {
        recips[patient.id] = 0;
        recipIds.push(patient.id);
      }
      recips[patient.id] += 1;
    }
  }
  var counts = [];
  for(var  i = 0 ; i < maxDonors; i += 1) {
    counts[i] = 0;
  }
  for (var id in recips) {
    counts[ recips[id] - 1] += 1;
  }
  // Turn back into probabilities
  for(var  i = 0 ; i < maxDonors; i += 1) {
    counts[i] = counts[i] / recipIds.length;
  }
  return counts;
}

function scaleDonors(index, current, actual, target) {
  current[index] *= Math.sqrt(target[index] / actual[index]);
}

function scaleDonorCountDistribution(currentProbs, actualDistribution, targetDistribution, maxDonors) {
  var sum = 0;
  // Multiply each probability by (sqrt( target / current)). This will bring
  // the outputs closer in line with the desired inputs.
  for(var i = 0; i < maxDonors; ++i) {
    if (actualDistribution[i] == 0) {
      currentProbs[i] += 0.01;
    } else {
      scaleDonors(i, currentProbs, actualDistribution, targetDistribution);
    }
    sum += currentProbs[i];
  }
  // We need to rescale back to summing to 1
  for(var i = 0; i < maxDonors; ++i) {
    currentProbs[i] *= 1/sum;
  }
}


function TuneDonorConfig(targetConfig, maxIter, maxError, tuneSize) {
  var targetProbabilities = {...targetConfig.donorCountProbabilities};
  var maxDonors = 0;
  for (var i in targetProbabilities) {
    maxDonors += 1;
  }
  var currentConfig = {...targetConfig};
  var currentIter = 0;
  var biggestError;
  do {
    currentIter += 1;
    var gen = new KidneyGenerator(currentConfig);
    var dataset = gen.generateDataset(tuneSize,
                                      targetConfig.proportionAltruistic);
    var countDistributions = calculateDonorCountDistributions(dataset, maxDonors);
    var biggestError = 0;
    for(var i = 0; i < maxDonors; i += 1) {
      var err = Math.abs(countDistributions[i] - targetProbabilities[i]);
      biggestError = Math.max(biggestError, err);
    }
    scaleDonorCountDistribution(currentConfig.donorCountProbabilities, countDistributions,
      targetProbabilities, maxDonors);

  } while (biggestError > maxError && currentIter < maxIter);
  console.log("count \t target \t actual \t   probs");
  for (var i = 0; i < maxDonors; i += 1) {
      console.log("" + (i+1) + "\t  " + targetProbabilities[i] + "   \t  " + countDistributions[i] +  "   \t    " + currentConfig.donorCountProbabilities[i]);
  }
  console.log("After "  + currentIter + " iterations, the biggest error is " + biggestError);
  return currentConfig;
}

