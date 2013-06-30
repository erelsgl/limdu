/**
 * A socket.io server for text categorization. Based on a pre-trained model. 
 * 
 * @author Erel Segal-Halevi erelsgl@gmail.com
 * @since 2013-06
 */
var express = require('express')
	, http = require('http')
	, path = require('path')
	, url = require('url')
	, fs = require('fs')
	, util = require('util')
	, logger = require('./logger')
	, _ = require('underscore')._
	;

//
// Step 1: Configure an application with EXPRESS
//

var app = express();
app.configure(function(){
	// Settings:
	app.set('port', process.env.PORT || 9995);
	app.set('views', path.join(__dirname, 'views'));		// The view directory path
	app.set('view engine', 'jade');						// The default engine extension to use when omitted
	app.set('case sensitive routing', false);	// Enable case sensitivity, disabled by default, treating "/Foo" and "/foo" as same

	// Define tasks to do for ANY url:
	app.use(function(req,res,next) {
		if (!/\/assets\//.test(req.url)  && !/\/images\//.test(req.url) && !/\/stylesheets\//.test(req.url) && !/\/js\//.test(req.url) && !/\/javascripts\//.test(req.url)) {
			logger.writeEventLog("events", req.method+" "+req.url, _.extend({remoteAddress: req.ip}, req.headers));
		}
		next(); // go to the next task - routing:
	});

	app.use(app.router);
	app.use(express.static(path.join(__dirname, 'public')));

	// Application local variables are provided to all templates rendered within the application:
	app.locals.pretty = true;
});

app.configure('development', function(){
	app.use(express.errorHandler());
});


//
// Step 2: Load the classifier
//

var serialize = require('../serialize');
var classifier = serialize.loadSync("trainedClassifiers/NegotiationSvm.json", __dirname);




//
// Step 4: define an HTTP server over the express application:
//

var httpserver = http.createServer(app);
var serverStartTime = null;

httpserver.listen(app.get('port'), function(){
	logger.writeEventLog("events", "START", {port:app.get('port')});
	serverStartTime = new Date();
});



//
// Step 5: define a SOCKET.IO server that listens to the http server:
//

var io = require('socket.io').listen(httpserver);

io.configure(function () { 
	io.set('log level', 1);
	io.set("polling duration", 10); 
});


io.sockets.on('connection', function (socket) {
	console.log("SOCKETIO: New client connects");
	
	socket.on('disconnect', function () { console.log("SOCKETIO: Client disconnects"); });
	
	socket.on('translate', function (request) {
		console.log("SOCKETIO: New client request: "+JSON.stringify(request));
		var classification = classifier.classify(request.text);
		socket.emit('translation', {
			text: request.text,
			translations: classification
		});
	});
});


//
// Last things to do before exit:
//
 
process.on('exit', function (){
	logger.writeEventLog("events", "END", {port:app.get('port')});
	console.log('Goodbye!');
});
