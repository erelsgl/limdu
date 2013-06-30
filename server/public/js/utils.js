/* utility functions common to all clients of biu_nlp_net */

/**
 * @see http://stackoverflow.com/a/2548133/639505
 */
if (!String.prototype.endsWith)
String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

/**
 * @see http://stackoverflow.com/questions/1744310/how-to-fix-array-indexof-in-javascript-for-ie-browsers
 */
if (!Array.prototype.indexOf)
Array.prototype.indexOf = function(obj, start) {
     for (var i = (start || 0), j = this.length; i < j; i++) {
         if (this[i] === obj) { return i; }
     }
     return -1;
}

/**
 * @see http://stackoverflow.com/a/647272/827927
 */
function getQueryString() {
	  var result = {}, queryString = location.search.substring(1),
	      re = /([^&=]+)=([^&]*)/g, m;
	  while (m = re.exec(queryString)) {
	    result[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
	  }
	  return result;
}

/**
 * @see http://stackoverflow.com/questions/1787322/htmlspecialchars-equivalent-in-javascript
 */
String.prototype.htmlspecialchars = function() {
  return this
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
}

Array.isArray = Array.isArray || function (vArg) {
    return Object.prototype.toString.call(vArg) === "[object Array]";
};

Math.probabilityToPercent = function(probability) {
	var percent = Math.round(probability*100);
	return (percent>99? 99: percent);
}


/**
 * @param form
 * @return an object whose fields are the fields of the given form.
 * Also converts 'any' selected-options to nulls, and handles arrays (fields whose name ends with []).
 */
function formToObject(form) {
	  var request = {};
	  //console.log(form.serializeArray());
	  $.each(form.serializeArray(), function(i, field) {
	    if (field.name.endsWith("[]")) { // field is an array:
	      field.name = field.name.substr(0,field.name.length-2);
	      if (!request[field.name])
	        request[field.name] = [];
	      request[field.name].push(field.value);
	    } else {
	      request[field.name] = (field.value=='any'? null: field.value);
	    }
	  });
	  return request;
}

function objectToUrlQueryString(fields) {
	var string = "";
	for (key in fields) {
		var value = fields[key];
		if (Array.isArray(value)) {
			for (var i=0; i<value.length; ++i) {
				if (string)
					string += '&';
				string += key + '[]=' + encodeURIComponent(value[i]);
			}
		} else {
				if (string)
					string += '&';
			string += key + '=' + encodeURIComponent(value);
		}
	}
	return string;
}




function setOptionsFromArray(idOfSelectElement, arrayOfOptions) {
	var selectElement = $(document.getElementById(idOfSelectElement));
	selectElement.html("");
	$.each(arrayOfOptions, function(key, value) {
		selectElement
		.append($('<option>', { value : value })
				.text(value));
	});
}

function setCheckboxesFromArray(idOfContainingElement, arrayOfOptions, checkedValues, nameOfInput, attributes) {
	var containingElement = $(document.getElementById(idOfContainingElement));
	if (!containingElement) {
		console.error("CLIENT: no element "+idOfContainingElement);
		return;
	}
	var checkboxes = "";
	$.each(arrayOfOptions, function(key, value) {
		var checked = (checkedValues && checkedValues.indexOf(value)>=0? "checked='yes' ": "");
		var checkbox = "<input type='checkbox' id='resource_"+value+"' name='"+nameOfInput+"' "+checked+attributes+" value='"+value+"'  /"+"> "+value;
		checkboxes += "<div>"+checkbox+"</div>\n";
	});

	containingElement.html(checkboxes);
}

function loggingMessageToString(data) {
  if (data.message)
  	return "SERVER: "+(data.sender? data.sender+": ": "")+data.message+" ("+data.depth+")";
  else
    return "SERVER: "+JSON.stringify(data);
}

function formatLogMessageForDeepLog(data) {
  if (data.message) {
		if (data.message) data.message = data.message.htmlspecialchars();
		if (data.message && /\n.*\n/.test(data.message)) // if message contains at least two newlines - make it pre
			data.message = "<pre>"+data.message+"</pre>";
		return (data.sender? data.sender+": ": "")+data.message;
  } else {
    return JSON.stringify(data);
  }
}

function formatLogMessageWithTimeAndResult(sender, time, message, result) {
	//message = message.replace(/Eyal[.]txt/ig,".txt");  // ANON
	return (sender? sender+": ": "")+message.htmlspecialchars() + 
		   (result? "<br/><b>"+result+"</b>": "") + 
                   " <small>("+time+")</small>" +
		   "";
}

function parseLogMessage(data) {
	var matchStart = /\[startAction\](.*)/.exec(data.message);
	var matchEndWithResult = /\[endAction: (.*?)\](.*) (result: .*)/.exec(data.message);
	var matchEnd = /\[endAction: (.*?)\](.*)/.exec(data.message);
	if (matchStart) {
		data.start = true;
		data.deepMessage = formatLogMessageForDeepLog({sender: data.sender, message: matchStart[1]+ " ... "});
	} else if (matchEndWithResult) {
		data.end = true;
		data.deepMessage = formatLogMessageWithTimeAndResult(data.sender, matchEndWithResult[1], matchEndWithResult[2], matchEndWithResult[3]);
	} else if (matchEnd) {
		data.end = true;
		data.deepMessage = formatLogMessageWithTimeAndResult(data.sender, matchEnd[1], matchEnd[2], null);
	} else {
		data.deepMessage = formatLogMessageForDeepLog(data);
	}
}


/**
 * Put a "sandclock" image in the given JQuery element
 */
function startSandclock(element) {
	element.html("<img src='images/ajax_loader.gif' />");
}

/**
 * There was an exception - put an error message in the given JQuery element, IF it contains a sandclock
 */
function replaceSandclockWithError(element) {
	if (element.html() && element.html().indexOf("ajax_loader")>0)
		element.html("<p class='serverResponseLabelError'>Error - please try again. See log below for more details.</p>\n");
}

/**
 * Connect to socket.io, and add the common listeners:
 */
function commonConnect(serverport, deeplog) {
	  var server = (
			location.protocol=='file:'? "http://localhost:"+serverport: 
			// /irsrv2/.test(location.host)? "http://nlp-srv:"+serverport: 
			location.protocol+"//"+location.hostname+":"+serverport);
	deeplog.add(1, "Connecting to "+server+"...");
	console.info("CLIENT: connecting to "+server);
	var socket = io.connect(server);

	socket.on('connect', function() {
		//deeplog.clear();
		deeplog.replace(1, "Client: Connected to server. Click to see log.");
		console.info("CLIENT: connected to "+server);
	});
	socket.on('trace', function(data) {
		if (deeplog) deeplog.add(data.depth, formatLogMessageForDeepLog(data));
		if (!/\n.*\n/.test(data.message))   // don't print long debug messages
			console.log(loggingMessageToString(data));
	});
	socket.on('debug', function(data) {
		if (deeplog) deeplog.add(data.depth, formatLogMessageForDeepLog(data));
		if (!/\n.*\n/.test(data.message))   // don't print long debug messages
			console.log(loggingMessageToString(data));
	});
	socket.on('info', function(data) {
		if (deeplog) {
			parseLogMessage(data);
			if (data.start) {
				deeplog.add(data.depth-1, data.deepMessage);
			} else if (data.end) {
				deeplog.replace(data.depth-1, data.deepMessage);
				deeplog.seal(data.depth-1);  // don't allow to add anything after endAction
			} else {
				deeplog.add(data.depth, data.deepMessage);
			}
		}
		console.info(loggingMessageToString(data));
	});
	socket.on('warn', function(data) {
		if (deeplog) deeplog.add(data.depth, formatLogMessageForDeepLog(data));
		console.warn(loggingMessageToString(data));
	});
	socket.on('error', function(data) {
		if (deeplog) deeplog.add(data.depth, formatLogMessageForDeepLog(data));
		console.error(loggingMessageToString(data));
	});
	socket.on('fatal', function(data) {
		if (deeplog) deeplog.add(data.depth, formatLogMessageForDeepLog(data));
		console.error("SERVER: fatal error: "+JSON.stringify(data));
	});
	socket.on('exception', function(throwableObject) {
		//if (deeplog) deeplog.add(1, JSON.stringify(throwableObject));
		console.error(throwableObject);
	});
	socket.on('statusHtml', function(message) {
		//message = message.replace(/Eyal[.]txt/ig,".txt");  // ANON
		deeplog.add(2, "Server status");
		deeplog.add(3, message);
	});
	socket.on('disconnect', function(data) {
		deeplog.add(1, "Disconnected from server.");
		console.log("CLIENT: good bye, server!");
	});
	
	return socket;
}


function abort(socket) {
	socket.emit('abort',null);
	console.log("CLIENT: sent 'abort' to the server");
}



/* Translations to HTML */
function translationsToHtml(translations) {
	if (translations==null)
		return "null";
	if (translations.length==0)
		return "no translations";
	var html = "";
	for (i=0; i<translations.length; ++i) {
		var translation = translations[i];
		//var translationObject = JSON.parse(translation);
		//console.dir(translationObject);
		html += "<li>"+translation+"</li>";
	}
	return "<ul>"+html+"</ul>";
}




