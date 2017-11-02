var Promise = require('bluebird');
var request = require('request');
var fs = require('fs');

var qlikConnect = function QlikConnect(qlikConfig) {	
	/*
		XrfKey Generation
	*/
	function createXrf() { 
		var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
		var newXrf = "";
		
		for (var i = 0; i < 16;i++) { 
			newXrf += possible.charAt(Math.floor(Math.random() * possible.length));
		}
		return newXrf;		
	};
	
	var xrfKey = createXrf();
	
	/*
		Request Handler Config
	*/
	var requestConfig = {
		key: fs.readFileSync(qlikConfig.key),
		cert: fs.readFileSync(qlikConfig.cert),
		ca: fs.readFileSync(qlikConfig.ca),
		
		headers: { 
			'X-Qlik-Xrfkey': xrfKey,
			'Content-Type': 'application/json; charset=UTF-8'
		}
	};
	
	var requestHandler = request.defaults(requestConfig);
	
	/*
		Qlik API Messager
	*/
	this.send = function(requestMethod, requestPath, requestBody) { 
		return new Promise(function (resolve, reject) {
			var sCode; 
			var res = '';
			var jsonBody = JSON.stringify(requestBody);
			
			requestHandler({
				url: requestPath + "?xrfKey=" + xrfKey,
				method: requestMethod,
				body: jsonBody
			})
			.on('response', function(response, body) { 
				sCode = response.statusCode;
			})
			.on('error', function(err) { 
				reject(err);
			})
			.on('data', function(data) { 
				res += data;
			})
			.on('end', function() { 
				if (sCode == 200 || sCode == 201) { 
					var responseBody = '';
					if (res != '') { 
						try {
							responseBody = JSON.parse(res);
						}
						catch(e) {
							responseBody = res;
						}
					}
					resolve({
						"statusCode": sCode,
						"body": responseBody
					})
				}
				else {
					reject('Error Code: ' + sCode);
				}
			});
		});
	};		
	
	/*
		Wrapper for easy calls. 
	*/
	this.get = function(requestPath) { 
		return this.send('GET', requestPath, '');
	};	
	
	this.post = function(requestPath, requestBody) { 
		return this.send('POST', requestPath, requestBody);
	};
	
	this.put = function(requestPath, requestBody) { 
		return this.send('PUT', requestPath, requestBody);
	};

};

module.exports = qlikConnect;
