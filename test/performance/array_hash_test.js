/**
 * Test performance of adding sparse arrays vs. sparse hashes.
 * See also  http://jsperf.com/adding-sparse-feature-vectors
 *
 * @author Erel Segal-Halevi
 *
 * @since 2013-07
 */

var MAX_FEATURE_COUNT=10000000;

function createRandomHash(size, totalSize) {
	var h = {};
	for (var i=0; i<size; ++i) {
		var feature = parseInt(totalSize*Math.random(),10);
		h[feature]=1;
	}
	return h;
}

function createRandomArray(size, totalSize) {
	var a = [];
	for (var i=0; i<totalSize; i++)
		a[i]=0;
	for (var i=0; i<size; ++i) {
		var feature = parseInt(totalSize*Math.random(),10);
		a[feature]=1;
	}
	return a;
}

var hash_add  = function(target, source) {
	for (var feature in source) {
		if (!(feature in target))
			target[feature]=0;
		target[feature] += source[feature];
	}
}

var array_add = function(target, source) {
	var length = Math.min(target.length,source.length);
	for (var i=0; i<length; ++i)
		target[i]+=source[i];
}

var array_add_sparse = function(target, source) {
	for (var feature in source) 
		target[feature] += source[feature];
}

for (var totalFeatureCount=10; totalFeatureCount<=MAX_FEATURE_COUNT; totalFeatureCount*=10) {
	for (var featureCount=1; featureCount<=totalFeatureCount;  featureCount*=10) {
		console.log(totalFeatureCount+" features, "+featureCount+" active:");
	
		var h1=createRandomHash(featureCount, totalFeatureCount);
		var h2=createRandomHash(featureCount, totalFeatureCount);
		
		//console.dir(h1);
		//console.dir(h2);
		var before=new Date();
		hash_add(h1,h2);
		//console.dir(h1);
		console.log("\thashes: "+(new Date()-before));
		
		var a1=createRandomArray(featureCount, totalFeatureCount);
		var a2=createRandomArray(featureCount, totalFeatureCount);

		//console.dir(a1);
		//console.dir(a2);
		var before=new Date();
		array_add(a1,a2);
		//console.dir(a1);
		console.log("\tarrays: "+(new Date()-before));

		var a1=createRandomArray(featureCount, totalFeatureCount);
		var a2=createRandomArray(featureCount, totalFeatureCount);
	}
}



