function KidneyGenerator(genConfig) {
  this.genConfig = genConfig; 
  this.praBands = this.parsePraBands(genConfig.praBandsString);
  console.log("Constructed a KidneyGenerator");
}

KidneyGenerator.prototype.parsePraBands = function(s) {
  var bandStrings = s.split(/\r\n|\r|\n/g);
  var retVal = [];
  ////console.log(bandStrings);
  for (var i=0; i<bandStrings.length; i++) {
    var bandString = bandStrings[i];
    if (bandString) {
      var tokens = bandString.split(/ +/);
      ////console.log(tokens);
      if (!tokens[2]) tokens[2] = tokens[1];
      retVal.push(new PraBand(+tokens[0], +tokens[1], +tokens[2]));
    }
  }
  return retVal;
}

KidneyGenerator.prototype.generateDataset = function(
    numGroupsToGenerate, proportionOfDonorsAltruistic) {
  
  var generatedDataset = new GeneratedDataset();
  
  // this.incompatiblePairs = [];
  // this.compatiblePairs = [];
  patientList = [];

  var patientId = 0;
  var donorId = 0;
  
  var nGroupsGenerated = 0;
  while (nGroupsGenerated < numGroupsToGenerate) {
    ////console.log([nGroupsGenerated, numGroupsToGenerate]);
    var nDonors = this.generateNumberOfDonors();
    ////console.log(nDonors)
    var donors = [];
    var patient = new Patient(patientId++);
    patient.bt = this.genConfig.patientBtDistribution.draw();
    ////console.log("patient bt");
    ////console.log(patient.bt);
    
    for (var i=0; i<nDonors; i++) {
      donors[i] = new Donor(
        donorId++,
        this.drawDage(),
        this.genConfig.donorBtDistribution.draw(),
        false
      );
    }
    
    patient.isWife = this.drawIsWife();
    patient.crf = this.drawCrf(patient.isWife);
    
    // foundAMatch tell us whether there are any
    // donor-patient matches within this group consisting of
    // a patient and his or her paired donors
    var foundAMatch = false;
    
    for (var i = 0; i < nDonors; i++) {
      var donor = donors[i];
      foundAMatch = foundAMatch || patient.compatibleWith(donor);
      donor.addSource(patient);
    }
    
    if (!foundAMatch) {
      ////console.log("incrementing nGroupsGenerated");
      nGroupsGenerated++;
      for (var i = 0; i < nDonors; i++) {
        generatedDataset.addDonor(donors[i]);
      }
      patientList.push(patient);
    }
  }

  for (var i=0; i<patientList.length; i++) {
    var patient = patientList[i];
    for (var j=0; j<generatedDataset.getDonorCount(); j++) {
      var donor = generatedDataset.getDonorAt(j);
      if (!donor.hasSource(patient) && patient.compatibleWith(donor)) {
        donor.addMatch({recipient: patient, score: this.drawScore()});
      }
    }
  }
    
  var nAltruisticGenerated = 0;
  var nAltruisticToGenerate = Math.round(generatedDataset.getDonorCount()
      * proportionOfDonorsAltruistic
      / (1 - proportionOfDonorsAltruistic));
  
  //console.log([nAltruisticGenerated, nAltruisticToGenerate]);
  
  while (nAltruisticGenerated < nAltruisticToGenerate) {
    //console.log([nAltruisticGenerated, nAltruisticToGenerate]);
    var altruisticDonor = new Donor(
      donorId,
      this.drawDage(),
      this.genConfig.donorBtDistribution.draw(),
      true
    );
    var atLeastOneMatchFound = false;
    for (var i=0; i<patientList.length; i++) {
      var patient = patientList[i];
      if (patient.compatibleWith(altruisticDonor)) {
        atLeastOneMatchFound = true;
        altruisticDonor.addMatch(
            {recipient: patient, score: this.drawScore()});
      }
    }
    if (atLeastOneMatchFound) {
      generatedDataset.addDonor(altruisticDonor);
      nAltruisticGenerated++;
      donorId++;
    }
  }
  return generatedDataset;
};

KidneyGenerator.prototype.drawDage = function() {
  return 18 + (Math.floor(Math.random() * 51));
};

KidneyGenerator.prototype.drawScore = function() {
  return Math.floor(Math.random() * 90);
};

KidneyGenerator.prototype.drawIsWife = function() {
  var probFemale = this.genConfig.probFemale;
  var probSpousalDonor = this.genConfig.probSpousal;
  return (Math.random() <= probFemale && Math.random() <= probSpousalDonor);
};

KidneyGenerator.prototype.drawCrf = function(isWife) {
  var crf = -1;
  var r = Math.random();
  var cumulativePraProb = 0;

  // Check if r is less than the cumulative probability of
  // PRA values 0,...,i.
  for (var i = 0; i < this.praBands.length; i++) {
    var praBand = this.praBands[i];
    ////console.log(praBand);
    cumulativePraProb += praBand.prob;
    if (r <= cumulativePraProb || (i === this.praBands.length - 1)) {
      if (praBand.minPra === praBand.maxPra) {
        crf = praBand.minPra;
      } else {
        var r2 = Math.random();
        crf = praBand.minPra + r2 * (praBand.maxPra - praBand.minPra);
      }
      break;
    }
  }

  ////console.log("crf")
  ////console.log(crf)
  
  if (!isWife) {
    return crf;
  } else {
    return 1 - this.genConfig.probSpousalPraCompatibility * (1 - crf);
  }
};

KidneyGenerator.prototype.generateNumberOfDonors = function() {
  if (this.genConfig.donorCountProbabilities[0] === 1) {
    return 1;
  }
  var cumulativeProb = 0;
  var r = Math.random();
  for (var i = 0; i < this.genConfig.donorCountProbabilities.length; i++) {
    cumulativeProb += this.genConfig.donorCountProbabilities[i];
    if (r <= cumulativeProb) {
      return i + 1;
    }
  }
  ////console.log("This line shouldn't normally be reached  " + r);
    
  // This shouldn't be reached, except in the case of a
  // floating-point arithmetic imprecision
  return this.genConfig.donorCountProbabilities.length;
};
