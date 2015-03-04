/**
 * Utilities common to kNN
 */

var fs   = require('fs')
var _ = require('underscore')._

module.exports.euclidean_distance = function(a, b) {
  if (!isVectorNumber(a) || !isVectorNumber(b))
    throw new Error("Vectors should be consist of numbers " + JSON.stringify(a) + " " +JSON.stringify(b))

  if (a.length != b.length)
    throw new Error("Vectors should be of the same size " + JSON.stringify(a.length) + " " +JSON.stringify(b.length))

	var sum = 0;
	var n;
  	for (n=0; n < a.length; n++) {
   		sum += Math.pow(a[n]-b[n], 2);
  	}
  	return Math.sqrt(sum);
}

module.exports.dot_distance = function(a, b) {
  if (!isVectorNumber(a) || !isVectorNumber(b))
    throw new Error("Vectors should be consist of numbers " + JSON.stringify(a) + " " +JSON.stringify(b))

  if (a.length != b.length)
    throw new Error("Vectors should be of the same size " + JSON.stringify(a.length) + " " +JSON.stringify(b.length))

	var sum = 0;
	var n;
  	for (n=0; n < a.length; n++) {
   		sum += a[n]*b[n]
  	}
  	return sum
}

module.exports.manhattan_distance = function(a, b) {
  if (!isVectorNumber(a) || !isVectorNumber(b))
    throw new Error("Vectors should be consist of numbers " + JSON.stringify(a) + " " +JSON.stringify(b))

  if (a.length != b.length)
    throw new Error("Vectors should be of the same size " + JSON.stringify(a.length) + " " +JSON.stringify(b.length))

	var sum = 0;
	var n;
  	for (n=0; n < a.length; n++) {
   		sum += Math.abs(a[n]-b[n])
  	}
  	return sum
}

module.exports.chebyshev_distance = function(a, b) {
  if (!isVectorNumber(a) || !isVectorNumber(b))
    throw new Error("Vectors should be consist of numbers " + JSON.stringify(a) + " " +JSON.stringify(b))

  if (a.length != b.length)
    throw new Error("Vectors should be of the same size " + JSON.stringify(a.length) + " " +JSON.stringify(b.length))
  
  var sum = 0;
	var n;
	var max = 0
  	for (n=0; n < a.length; n++) {
   		var cur = Math.abs(a[n]-b[n])
   		if (cur > max)
   			max = cur
  	}
  	return max
}

function isVectorNumber(a) {
  var n;
  for (n=0; n < a.length; n++) {
   if (isNaN(parseFloat(a[n])) || !isFinite(a[n]))
    return false
  }
  return true
}
