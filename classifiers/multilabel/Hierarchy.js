/**
 * A utility function for Homer.
 */
var _ = require("underscore")._;

/**
 * @param json a JSON object, such as: {Offer: {Salary: 20000}}
 * @param depth an integer >= 1.
 * @return a view of the top-level parts of the json object.
 * -- For example, for depth=1: "Offer". For depth=2: "{Offer: Salary}". For depth=3: "{Offer: {Salary: 20000}}", etc.
 */
function shallowJson(json, depth) {
	if (!_.isObject(json))
		return json;
	var firstKey = Object.keys(json)[0];
	if (depth<=1) {
		return firstKey;
	} else {
		var shallow = {};
		shallow[firstKey] = shallowJson(json[firstKey], depth-1);
		return shallow;
	}
}


module.exports = {
	shallowJson: shallowJson,
}

