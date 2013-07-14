/**
 * Static Utilities for serializing classifiers (or other objects) to strings, and vice versa.
 * 
 * @author Erel Segal-Halevi
 * @since 2013-06
 */


/**
 * Save a trained classifier to a string.
 * @param createNewClassifierFunction a function for creating a new (untrained) classifier. This function will be saved verbatim in the file, in order to reproduce the exact type of the classifier.
 * @param trainedClassifier This is the trained classifier itself. It should have "toJSON" and "fromJSON" functions (but if "toJSON" is not present, then the object itself will be saved).
 * @return A nicely-formatted string. Can be saved directly to a file. 
 */
exports.toString = function(createNewClassifierFunction, trainedClassifier) {
	// convert the function to a string that can be evaluated later, at load time, to create a new classifier:
	var createNewClassifierString = createNewClassifierFunction.toString();
	
	if (!trainedClassifier.fromJSON) {
		throw new Error("trainedClassifier does not have a fromJSON method - you will not be able to restore it");
	}

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
 * @param string a string created by serialize.toString.
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
	return newClassifier.fromJSON(json.trainedClassifier);
}
