function CompatBand(lowPra, highPra, intercept, multiplier = 0, isNDDCost = 1) {
  this.intercept = intercept;
  this.multiplier = multiplier;
  this.isNDDCost = isNDDCost;
  this.lowPra = lowPra;
  this.highPra = highPra;
}

Patient.prototype.compatibleWith = function(donor, intercept = 0, multiplier = 1, isNDDCost = 1) {
  return this.bt.compatibleWith(donor.bt)
        && !this.positiveCrossMatch(intercept, multiplier, isNDDCost);
}
