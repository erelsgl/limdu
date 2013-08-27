var assert = require('should'),
     classifiers = require("../../../classifiers");

var wordcounts = function(sentence) {
	return sentence.split(' ').reduce(function(counts, word) {
	    counts[word] = (counts[word] || 0) + 1;
	    return counts;
	 }, {});
}

describe('thresholds', function() {
  var bayes = new classifiers.Bayesian({
    thresholds: {
      spam: 3,
      notspam: 1
    }
  });

  var spam = ["a c", "b a", "c e", "c a"];
  spam.forEach(function(text) {
    bayes.trainOnline(wordcounts(text), 'spam');
  });

  var not = ["d e", "e f", "f b", "b f"];
  not.forEach(function(text) {
    bayes.trainOnline(wordcounts(text), 'notspam');
  });

  it('categorize with default thresholds', function() {
    assert.equal(bayes.classify(wordcounts("a")), "spam");
    assert.equal(bayes.classify(wordcounts("b")), "notspam");
    assert.equal(bayes.classify(wordcounts("c")), "spam");
    assert.equal(bayes.classify(wordcounts("d")), "notspam");
    assert.equal(bayes.classify(wordcounts("e")), "notspam");
  })

  it('categorize with really high thresholds', function() {
    bayes.setThresholds({spam: 9, notspam: 9});

    assert.equal(bayes.classify(wordcounts("a")), "unclassified");
    assert.equal(bayes.classify(wordcounts("b")), "unclassified");
    assert.equal(bayes.classify(wordcounts("c")), "unclassified");
    assert.equal(bayes.classify(wordcounts("d")), "unclassified");
    assert.equal(bayes.classify(wordcounts("e")), "unclassified");
  })
})
