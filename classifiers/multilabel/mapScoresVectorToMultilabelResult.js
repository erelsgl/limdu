/**
 * A utility function, used by several multi-label classifiers.
 * 
 * @param scoresVector [[label1,score1],[label2,score2],...]
 * @param explain (int) if >0, return explanation.
 * @param withScores (boolean) if true, return the original scores vector.
 * @param threshold if withScores is false, all labels with scores above this threshold will be returned.
 */
module.exports = function(scoresVector, explain, withScores, threshold) {
	var results;
	if (withScores) {
		results = scoresVector;
	} else {
		results = [];
		scoresVector.forEach(function(pair) {
			if (pair[1]>threshold)
				results.push(pair[0]);
		});
	}
	return explain>0? 	{
		classes: results, 
		explanation: scoresVector.map(function(pair) {return pair[0]+": "+pair[1];})
	}: 
	results; 
}