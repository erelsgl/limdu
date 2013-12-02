/**
 * Simple calculation of word-counts in a sentence. 
 * @param sentence
 * @return a hash {word1: count1, word2: count2,...}
 * words are separated by spaces.
 */
module.exports = function(sentence) {
		return sentence.split(' ').reduce(function(counts, word) {
		    counts[word] = (counts[word] || 0) + 1;
		    return counts;
		 }, {});
}
