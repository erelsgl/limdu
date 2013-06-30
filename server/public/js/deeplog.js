/* utility functions for displaying a deep log - 
   logs of functions are embedded in logs of calling functions, etc.
 */
 
Array.prototype.top = function() {
	return this[this.length-1];
}

DeepLog = function(root) {
	this.root = root;
	this.stack = new Array();
	this.stack.push({div: root, depth: 0});
	this.levelMap = new CyclicMap(8);
}

DeepLog.prototype.clear = function() {
	this.root.html("");
}

DeepLog.prototype.goToDepth = function(depth) {
	while (this.stack.top().depth > depth || this.stack.top().sealed)
		this.stack.pop();
	if (!this.stack.length)
		throw "internal error - stack is empty although depth is positive - "+depth;
}

DeepLog.prototype.add = function(depth, content) {
	if (depth<=0)
		throw "expected positive depth but got "+depth;
	this.goToDepth(depth-1);
	var level = this.levelMap.get(depth);
	var newDiv = $("<li class='log level"+level+"'><div><span class='content'>"+content+"</span> <span class='show'><span class='showmore'>(+)</span> <span class='showless'>(-)</span></span></div><ul class='subdivs'></ul></li>");
	//this.stack.top().div.append(newDiv);	
	newDiv.appendTo(this.stack.top().div);
	if (this.stack.top().show) this.stack.top().show.show();

	var div = newDiv.children("div");
	var content = div.children(".content");
	var show = div.children(".show");
	var showmore = show.children(".showmore");
	var showless = show.children(".showless");
	var subdivs = newDiv.children(".subdivs");

	subdivs.hide();
	show.hide();
	showmore.show();
	showless.hide();
	div.click(function() {
		if (show.is(":visible")) {
			subdivs.toggle();
			showmore.toggle();
			showless.toggle();
		}
	});
	this.stack.push({div: subdivs, content: content, show: show, depth: depth});
}

DeepLog.prototype.replace = function(depth, content) {
	if (depth<=0)
		throw "expected positive depth but got "+depth;
	this.goToDepth(depth);
	if (this.stack.top().depth == depth) {
		this.stack.top().content.html(content);
	} else {
		throw "Nothing to replace at depth "+depth+" - this.stack.top().depth="+this.stack.top().depth;
	}
}

DeepLog.prototype.seal = function(depth) {
	if (depth<=0)
		throw "expected positive depth but got "+depth;
	this.goToDepth(depth);
	if (this.stack.top().depth == depth) {
		this.stack.top().sealed = true;
	} else {
		throw "Nothing to seal at depth "+depth+" - this.stack.top().depth="+this.stack.top().depth;
	}
}

/**
 * returns new integers for new items, in a cycle
 */
CyclicMap = function(cycleSize) {
	this.cycleSize = cycleSize;
	this.map = {};
	this.currentValue = 0;
}

CyclicMap.prototype.get = function(item) {
	if (!(item in this.map)) {
		this.map[item] = this.currentValue;
		this.currentValue = (this.currentValue+1)%this.cycleSize;
	}
	return this.map[item];
}
