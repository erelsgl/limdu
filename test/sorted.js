/**
 * This unit adds a non-intrusive property "sorted" to the Array prototype.
 * 
 * It is used only for testing, when the order of the output array is not important. For example:
 * 
 * classifier.classify("I want aa bb").sorted().should.eql(['A','B']);
 * 
 * @author Erel Segal-Halevi
 * @since 2013-09-09
 */

Object.defineProperty(Array.prototype, 'sorted', {
	value: function() {	this.sort(); return this; }
});
