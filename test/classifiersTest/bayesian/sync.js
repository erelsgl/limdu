var assert = require('should'),
    classifiers = require("../../../classifiers");



var wordcounts = function(sentence) {
	return sentence.split(' ').reduce(function(counts, word) {
	    counts[word] = (counts[word] || 0) + 1;
	    return counts;
	 }, {});
}

function testBasic(createNewClassifierFunction) {
  var bayes = createNewClassifierFunction();
  var spamSamples = ["vicodin pharmacy",
              "all quality replica watches marked down",
              "cheap replica watches",
              "receive more traffic by gaining a higher ranking in search engines",
              "viagra pills",
              "watches chanel tag heuer",
              "watches at low prices"];
  spamSamples.forEach(function(text) {
    bayes.trainOnline(wordcounts(text), 'spam');
  });

  var notSpamSamples = ["unknown command line parameters",
             "I don't know if this works on Windows",
             "recently made changed to terms of service agreement",
             "does anyone know about this",
             "this is a bit out of date",
             "the startup options need linking"];
  notSpamSamples.forEach(function(text) {
    bayes.trainOnline(wordcounts(text), 'notspam');
  });

  assert.equal(bayes.classify(wordcounts("replica watches")),"spam");
  assert.equal(bayes.classify(wordcounts("check out the docs")), "notspam");
  assert.equal(bayes.classify(wordcounts("recently, I've been thinking that I should")), "notspam");
  assert.equal(bayes.classify(wordcounts("come buy these cheap pills")), "spam");
  

  var json = JSON.stringify(bayes.toJSON());
  
  var bayes2 = createNewClassifierFunction();
  bayes2.fromJSON(JSON.parse(json));

  assert.equal(bayes2.classify(wordcounts("replica watches")),"spam");
  assert.equal(bayes2.classify(wordcounts("check out the docs")), "notspam");
  assert.equal(bayes2.classify(wordcounts("recently, I've been thinking that I should")), "notspam");
  assert.equal(bayes2.classify(wordcounts("come buy these cheap pills")), "spam");
}


describe('synchronous backends', function() {
  it('classify with in-memory backend', function() {
    testBasic(function() { return new classifiers.Bayesian()});
  })

  it('classify with localStorage backend', function() {
    testBasic(function() { return new classifiers.Bayesian({
      backend : {
        type: 'localStorage',
        options: {
          name: 'testnamespace',
          testing: true
        }
      }
    })})
  })
})
