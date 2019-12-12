function Patient(id) {
  this.id = id;
}
Patient.prototype.compatibleWith = function(donor) {
  return this.bt.compatibleWith(donor.bt)
        && !this.positiveCrossMatch();
}
Patient.prototype.positiveCrossMatch = function() {
  return Math.random() <= this.crf;
}

function Donor(id, dage, bt, isAltruistic) {
  this.id = id;
  this.dage = dage;
  this.bt = bt;
  this.isAltruistic = isAltruistic;
  this.sources = [];
  this.matches = [];
}
Donor.prototype.addSource = function(source) {
  this.sources.push(source);
}
Donor.prototype.hasSource = function(source) {
  return this.sources.indexOf(source) !== -1;
}
Donor.prototype.addMatch = function(match) {
  this.matches.push(match);
}

function DPPair(id) {
  this.id = id;
}

function PatientLookup() {
  this.lookup = [];
}

PatientLookup.prototype.getOrCreate = function(id) {
  if (this.lookup[id]===undefined) {
    var newPatient = new Patient(id);
    this.lookup[id] = newPatient;
    return newPatient;
  } else {
    return this.lookup[id];
  }
};
