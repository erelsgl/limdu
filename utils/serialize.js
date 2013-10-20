/**
 * Static Utilities for serializing classifiers (or other objects) to strings, and vice versa.
 * 
 * @author Erel Segal-Halevi
 * @since 2013-06
 */
 



/**
 * Save a trained classifier to a string.
 * @param trainedClassifier This is the trained classifier itself. It should have "toJSON" and "fromJSON" functions (but if "toJSON" is not present, then the object itself will be saved).
 * @param createNewClassifierFunction [optional] a function for creating a new (untrained) classifier. This function will be saved verbatim in the file, in order to reproduce the exact type of the classifier.
 * @return A nicely-formatted string. Can be saved directly to a file. 
 */
exports.toString = function(trainedClassifier, createNewClassifierFunction) {
	if (!trainedClassifier.fromJSON) 
		throw new Error("trainedClassifier does not have a fromJSON method - you will not be able to restore it");

	// convert the function to a string that can be evaluated later, at load time, to create a new classifier:
	var createNewClassifierString = null;
	if (trainedClassifier.createNewClassifierString)
		createNewClassifierString = trainedClassifier.createNewClassifierString;
	else if (trainedClassifier.createNewClassifierFunction) 
		createNewClassifierString = trainedClassifier.createNewClassifierFunction.toString();
	else if (createNewClassifierFunction)
		createNewClassifierString = createNewClassifierFunction.toString();
	else
		throw new Error("createNewClassifierFunction should be present either as a field of the classifier or as a separate parameter!");

	var trainedClassifierJson;
	if (!trainedClassifier.toJSON) {
		console.warn("trainedClassifier does not have a toJSON method - using the trainedClassifier itself as its JSON representation");
		trainedClassifierJson = trainedClassifier;
	} else {
		trainedClassifierJson = trainedClassifier.toJSON();
	}

	var json = {
		createNewClassifierString: createNewClassifierString,
		trainedClassifier: trainedClassifierJson,
	};
	var string = JSON.stringify(json,null,"\t");
	
	return string;
}

/**
 * Load a trained classifier from a string.
 * @param string a string created by exports.toString.
 * @param contextFolderForFunction  the base folder for the "require" statements in the create-new-classifier function.
 */
exports.fromString = function(string, contextFolderForFunction) {
	var json = JSON.parse(string);
	if (!json.createNewClassifierString) {
		console.dir(json);
		throw new Error("Cannot find createNewClassifierString in string");
	}
	
	// add context to the 'require' statements:
	contextFolderForFunction = contextFolderForFunction.replace(/\\/g, "\\\\");   // for Windows
	var createNewClassifierString = json.createNewClassifierString.replace(/__dirname/g, "'"+contextFolderForFunction+"'");
	createNewClassifierString = "("+createNewClassifierString+")";
	var createNewClassifierFunction = eval(createNewClassifierString);
	try {
		var newClassifier = createNewClassifierFunction();
	} catch (error) {
		console.log("createNewClassifierString: "+createNewClassifierString);
		console.log("contextFolderForFunction: "+contextFolderForFunction);
		throw new Error("Error in creating new classifier from function in string: "+error);
	}
	
	if (!newClassifier) {
		console.dir(json);
		throw new Error("Cannot create new classifier from function in string");
	}
	newClassifier.createNewClassifierString = json.createNewClassifierString;
	newClassifier.createNewClassifierFunction = createNewClassifierFunction;
	newClassifier.fromJSON(json.trainedClassifier);
	return newClassifier;
}


/**
 * Save a trained classifier to a string, then reload the string to a new classifier, and make sure both classifiers return the same results on a test set.
 * @param trainedClassifier This is the trained classifier itself. It should have "toJSON" and "fromJSON" functions (but if "toJSON" is not present, then the object itself will be saved).
 * @param createNewClassifierFunction [optional] a function for creating a new (untrained) classifier. This function will be saved verbatim in the file, in order to reproduce the exact type of the classifier.
 * @param contextFolderForFunction  the base folder for the "require" statements in the create-new-classifier function.
 * @param testSet an array of {input: ... , output: ...} pairs, for testing the classifier before and after reload.
 * @param explain (int) if positive, also compare the explanations.
 * @return A nicely-formatted string. Can be saved directly to a file. 
 */
exports.toStringVerified = function(classifier, createNewClassifierFunction, contextFolderForFunction, testSet, explain) {
	var should = require("should");
	var resultsBeforeReload = [];
	
	for (var i=0; i<testSet.length; ++i) {
		var actualClasses = classifier.classify(testSet[i].input, explain);
		resultsBeforeReload[i] = actualClasses;
	}

	var string = exports.toString(classifier, createNewClassifierFunction);
	
	var classifier2 = exports.fromString(string, contextFolderForFunction);
	
	for (var i=0; i<testSet.length; ++i) {
		var actualClasses = classifier2.classify(testSet[i].input, explain);
		if (explain>0) {
			actualClasses.classes.should.eql(resultsBeforeReload[i].classes);
			actualClasses.explanation.should.eql(resultsBeforeReload[i].explanation);
		} else {
			actualClasses.should.eql(resultsBeforeReload[i]);
		}
	}
	
	return string;
}
