module.exports = Routeme;

var querystring = require('querystring'),
	util = require('./utilities'),
	fs = require('fs'),
	validator = require('./amanda-fixed')('json'),
	colors = require('colors'),
	tinytim = require('tinytim').tim,
	url = require('url')
	
colors.setTheme({
  warn: 'yellow',
  debug: 'blue',
  error: 'red'
});

function Routeme(validationCB){
	
	var newObj = this;	
	this.routes = {};
	this.bound = false;
	if (validationCB !== undefined) this.validationErrorCallback = validationCB;
	
	this.validateRequestSchema = function(req, res, next){
	
		var route = newObj.findRouteByMatch(req.url, req.method);

		if (route && route.schema !== undefined){

			var data = req.body || req.query;

			validator.validate(data, route.schema, {singleError: false}, function(errors){
				if (errors){
					newObj.validationErrorCallback(errors, req, res, next);
				}
				else {
					next();
				}
			});
		}
		else {
			next();
		}
	}
}

Routeme.prototype.generateURL = function(name, query, params){
	
	var route = this.findRouteByName(name);
	if (!route){
		console.log('Could not find a route with the name %s'.error, name);
		return null;
	}

	var url = route.uri;
	
	if (params !== undefined && params){
		//convert URL in to a micro template, then insert params with tinytim
		url = url.replace(/(:(\w*))/g, '{{$2}}');
		url = tinytim(url, params);
	}
	
	if (query !== undefined && query) url += '?' + querystring.stringify(query);

	return url;
}

Routeme.prototype.findRouteByName = function(name){
    return this.routes[name] || null;
}

Routeme.prototype.findRouteByUri = function(uri, method){
	
	for (var i in this.routes){
		var route = this.routes[i];

		if (route.uri === uri && route.method === method){
			return route;
		}
    }
    
    return null;
}

Routeme.prototype.findRouteByMatch = function(reqUrl, method){
	
	var urlObj = url.parse(reqUrl);
	var method = method.toLowerCase();
	
	for (var i in this.routes){
		
		var route = this.routes[i];

		if (route.method === method){
			
			var routeparams = route.uri.match(/(:(\w*))/g);
			
			//if the route we are matching against has params
			if (routeparams && routeparams.length > 0){
				
				//replace param ids with alpha numeric match to create regex
				var exp = route.uri.replace(/(:(\w*))/g, '(\\w*)');
				exp = exp.replace(/\//g, '\\/');
				exp = exp.replace(/\./g, '\\.');
				
				var match = urlObj.pathname.match(new RegExp(exp, 'g'));
				
				//if the match is the entire path and we found one
				if (match && match[0].length === urlObj.pathname.length){
					return route;
				}
			}
			else {
				if (urlObj.pathname === route.uri){
					return route;
				}
			}
		}
    }
    
    return null;
}

Routeme.prototype.scan = function(abs_controller_folder){
	
	var routeme = this;
	
	util.foreachFileInTreeSync(abs_controller_folder, function(folderPath, file){
		processController.call(routeme, folderPath, file);
	});
}

Routeme.prototype.bindToExpress = function(app){
	
	if (this.bound) console.log('Routes have already been bound to express.'.warn);
	
	for (key in this.routes){
		
		var route = this.routes[key];
		
		var method = route.method.toLowerCase();

		if (app[method] !== undefined){
			
			app[method](route.uri, route.action);
			
			if (!this.bound) this.bound = true;
		}
		else {
			console.log('Method %s for route %s is not supported.'.error, route.method, route.name);
		}
    }
	
	if (!this.bound){
		console.log('There were no routes to bind to express.'.warn);
	}
}

Routeme.prototype.printRouteMap = function(){
    
    var debugString = 'Route Map\n\n';
    
    for (var i in this.routes){
		var route = this.routes[i];	
		debugString += addSpaces(route.method.toUpperCase(), maxLength.method.length) + ' ' + addSpaces(route.uri, maxLength.uri.length) + ' ' + route.name + '\n';
    }
    
    console.log(debugString.debug);
}

Routeme.prototype.validationErrorCallback = function(errors, req, res, next){
	res.json({"errors" : errors.getMessages()}, 400);
}

//this is for debug
var maxLength = { 
    method : { length : 0},
    uri : { length : 0}
};

//function processController(folderPath, file){
function processController(folderPath, file){
	
	var fullpath = folderPath + '/' + file;
    var controller = require(fullpath);

    if (controller.routes === undefined || controller.routes.length === 0){
		console.log('Controller %s did not contain any routes.'.warn, fullpath);
		return;
    }

    var routes = controller.routes;
    var prefix = controller.prefix;
	
	for (var i = 0; i < routes.length; i++){
	
		var route = routes[i];
		
		if (prefix !== undefined) route.uri = prefix + route.uri;

		if (util.getUndefined([route.uri, route.name, route.action], ['uri', 'name', 'action'])){
			console.log('Route %s in %s is missing a field.'.error, i, fullpath);
		}

		if (routes[routes.name] !== undefined){
			console.log('The route name %s in %s is already in use.'.warn, route.name, fullpath);
		}
		
		var match = this.findRouteByUri(route.uri, route.method);

		if (match){
			console.log('Route %s will overwrite route %s because they share the same uri: %s %s'.warn, route.name, match.name, route.method.toUpperCase(), route.uri);
		}
		
		this.routes[route.name] = route;
		
		//for spacing of debug. Stores length of longest field.
		for(field in maxLength){
			if (route[field].length > maxLength[field].length) maxLength[field].length = route[field].length;
		}
	}
}

function addSpaces(string, maxLength){
    
    var diff = maxLength + 4 - string.length;
    
    for (var i = 0; i < diff; i++){
		string += ' ';
    }
    
    return string;
}