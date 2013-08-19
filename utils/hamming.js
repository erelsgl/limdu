/** 
 *
 * Calculate Hamming distance between two sets 
 *
 */


/**
 * @param a, b - arrays
 * @return number of elements in a-b plus number of elements in b-a
 */
var hammingDistance = function(a,b) {
	var d = 0;
	for (var i=0; i<a.length; ++i) {
		if (b.indexOf(a[i])<0)
			d++;
	}
	for (var i=0; i<b.length; ++i) {
		if (a.indexOf(b[i])<0)
			d++;
	}
	return d;
};

module.exports = {hammingDistance:  hammingDistance};
