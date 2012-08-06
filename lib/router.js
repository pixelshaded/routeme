var querystring = require('querystring'),
	util = require('./utilities'),
	fs = require('fs'),
	validator = require('./amanda-fixed').('json'),
	colors = require('colors'),
	routes = [],
	validationErrorCallback;
	
colors.setTheme({
  warn: 'yellow',
  debug: 'blue',
  error: 'red'
});

exports = init;
exports.generateURL = generateURL;
exports.findRouteByUri = findRouteByUri;
exports.findRouteByName = findRouteName;
exports.bindToExpress = bindToExpress; 
exports.printRouteMap = printRouteMap;
exports.validateSchema = validateSchema;

function init(controller_folder, validationCB){
	validationErrorCallback = validationCB;
	util.foreachFileInTreeSync(controller_folder, processControllers);
}

function generateURL(name, data){
	
	var route = findRouteByName(name);
	if (!route){
		console.log('Could not find a route with the name %s'.error, name);
		return null;
	}

	var url = route.uri;
	if (data !== undefined || data) url += '?' + querystring.stringify(data);

	return url;
}

function findRouteName(name){
    return routes[name] || null;
}

function findRouteByUri(uri, method){
    
    for (var i in routes){
		var route = routes[i];

		if (route.uri === uri && route.method === method){
			return route;
		}
    }
    
    return null;
}

var bound = false;

function bindToExpress(app){
	
	if (bound) console.log('Routes have already been bound to express.'.warn);
	
	for (var i = 0; i < routes.length; i++){

		var route = routes[i];
		
		var method = route.method.toLowerCase();

		if (app[method] !== undefined){
			app[method](route.uri, route.action);
			if (!bound) bound = true;
		}
		else {
			console.log('Method %s for route %s in %s is not supported.'.error, route.method, route.name, fullpath);
		}
    }
	
	if (!bound){
		console.log('There were no routes to bind to express.'.warn);
	}
}

function processControllers(folderPath, file){

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
		
		var match = findRouteByUri(route.uri, route.method);

		if (match){
			console.log('Route %s will overwrite route %s because they share the same uri: %s %s'.warn, route.name, match.name, route.method.toUpperCase(), route.uri);
		}
		
		routes[route.name] = route;
		
		//for spacing of debug. Stores length of longest field.
		for(field in maxLength){
			if (route[field].length > maxLength[field].length) maxLength[field].length = route[field].length;
		}
	}
}

function validMethod(route, app){

    var method = route.method.toLowerCase();
    var valid = false;
	
	if (app[method] !== undefined){
		app[method](route.uri, route.action);
		return true;
	}
	return false;
}

//this is for debug
var maxLength = { 
    method : { length : 0},
    uri : { length : 0}
};

function addSpaces(string, maxLength){
    
    var diff = maxLength + 4 - string.length;
    
    for (var i = 0; i < diff; i++){
		string += ' ';
    }
    
    return string;
}

function printRouteMap(){
    
    var debugString = 'Route Map\n\n';
    
    for (var i in routes){
		var route = routes[i];	
		debugString += addSpaces(route.method.toUpperCase(), maxLength.method.length) + ' ' + addSpaces(route.uri, maxLength.uri.length) + ' ' + route.name + '\n';
    }
    
    console.log(debugString.debug);
}

function validateSchema(req, res, next){
	
	var route = app.router.findRouteByUri(req.url, req.method.toLowerCase());

	if (route && route.schema !== undefined){
	    
		var data = req.body || req.query;
		
		app.jsonValidator.validate(data, route.schema, {singleError: false}, function(errors){
			if (errors){
				validationErrorCallback(errors);
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