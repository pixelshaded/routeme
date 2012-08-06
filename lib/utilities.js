var	fs = require('fs');

exports.getUndefined = function(objects, names){
    
    var defined = true;
    var logs = new Array();

    for (var i = 0; i < objects.length; i++){
		if (objects[i] === undefined){
			defined = false;
			logs.push(names[i] + " was undefined.");
		}
    }

    if (!defined){
		for (log in logs){
			console.log(logs[log]);
		}
    }

    if (defined) return null;
    else return logs;
}

exports.foreachFileInTreeSync = function(folderPath, func){

    fs.readdirSync(folderPath).forEach(function(file){
		if (file.lastIndexOf('.') === -1) {
			foreachFileInTreeSync(folderPath + '/' + file, func);
		}
		else {
			func(folderPath, file);
		}
    });
}