function BloodType(type) {
  this.type = type;
}
BloodType.prototype.compatibleWith = function(donorType) {
  return donorType.type==="O" ||
    this.type==="AB" ||
    donorType.type===this.type;
}

function BloodTypeDistribution(prO, prA, prB, prAB) {
  this.prO = prO;
  this.prA = prA;
  this.prB = prB;
  this.prAB = prAB;
}
BloodTypeDistribution.prototype.draw = function() {
  var r = Math.random();
  if (r <= this.prO)
    return new BloodType("O");
  if (r <= this.probO + this.probA)
  return new BloodType("A");
  if (r <= this.probO + this.probA + this.probB)
    return new BloodType("B");
  return new BloodType("AB");
}
