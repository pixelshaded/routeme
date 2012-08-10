var	fs = require('fs');

module.exports.getUndefined = function(objects, names){
    
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

module.exports.foreachFileInTreeSync = function foreachFileInTreeSync(folderPath, func){
	
	fs.readdirSync(folderPath).forEach(function(file){
		
		if (file[0] === '.') return; //skip files starting with a . such as .gitignore, swap files, etc
		
		if (file.lastIndexOf('.') === -1) {
			foreachFileInTreeSync(folderPath + '/' + file, func);
		}
		else {
			func(folderPath, file);
		}
	});
}