/*
 REFACTORING

 Module test_utils contains helpful routines for running test of existing classifiers,
 currently both of them are the copy from different modules

*/
var PrecisionRecall = require('../utils/PrecisionRecall');

module.exports = {

test: function(dataset, classifier) {	
	var currentStats = new PrecisionRecall();
	for (var i=0; i<dataset.length; ++i) {
		var expectedClasses = dataset[i].output;
		var actualClasses = classifier.classify(dataset[i].input);
		currentStats.addCasesHash(expectedClasses, actualClasses, true);
	}
	return currentStats
},
	
F1_evaluation: function(stats, type_of_averaging) {
	if (type_of_averaging == 0)
	{
		if ((stats['TP'] == 0) || (stats['TP']+stats['FP'] == 0) || (stats['TP']+stats['FN'] == 0)) return 0

		var precision = stats['TP']/(stats['TP']+stats['FP'])
		var recall = stats['TP']/(stats['TP']+stats['FN'])

		var f1 = (precision*recall)/(precision + recall)
		return f1		
	}
},
}