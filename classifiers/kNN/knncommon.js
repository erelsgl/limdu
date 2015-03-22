/**
 * Utilities common to kNN
 */

var fs   = require('fs')
var _ = require('underscore')._

function euclidean_distance(a, b) {
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

function dot_distance(a, b) {
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

function manhattan_distance(a, b) {
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

function chebyshev_distance(a, b) {
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

// metric measure the same words
function and_distance(a, b) {
  if (!isVectorNumber(a) || !isVectorNumber(b))
    throw new Error("Vectors should be consist of numbers " + JSON.stringify(a) + " " +JSON.stringify(b))

  if (a.length != b.length)
    throw new Error("Vectors should be of the same size " + JSON.stringify(a.length) + " " +JSON.stringify(b.length))

  var sum = 0;
  var n;
    for (n=0; n < a.length; n++) {
      sum += ((a[n] > 0) && (b[n]>0) ? 1 : 0);
    }
    return 1/sum
}

function cosine_distance(a, b) {
  if (!isVectorNumber(a) || !isVectorNumber(b))
    throw new Error("Vectors should be consist of numbers " + JSON.stringify(a) + " " +JSON.stringify(b))

  if (a.length != b.length)
    throw new Error("Vectors should be of the same size " + JSON.stringify(a.length) + " " +JSON.stringify(b.length))

  var norm1 = 0 
  var norm2 = 0 

  for (n=0; n < a.length; n++) {
    norm1 += a[n]*a[n]
    norm2 += b[n]*b[n]
    }
  
    return dot_distance(a,b)/(Math.sqrt(norm1)*Math.sqrt(norm2))
}

function isVectorNumber(a) {
  var n;
  for (n=0; n < a.length; n++) {
   if (isNaN(parseFloat(a[n])) || !isFinite(a[n]))
    return false
  }
  return true
}

module.exports = {
  euclidean_distance:euclidean_distance,
  cosine_distance:cosine_distance,
  and_distance:and_distance,
  chebyshev_distance:chebyshev_distance,
  manhattan_distance:manhattan_distance,
  dot_distance:dot_distance,
  euclidean_distance:euclidean_distance
}
