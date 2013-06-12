console.log("Hello world!");

var classifier = require('./classifier');

var bayes = new classifier.Bayesian();

bayes.train("cheap replica watches", 'spam');
bayes.train("I don't know if this works on windows", 'not');

var category = bayes.classify("free watches"); 
console.log(category);  // "spam"
