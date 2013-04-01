/**
 * phantomjs phantomBrowserExtractor.js - Browser based link extraction for use as an external process.
 * Will load the specified URL in phantomjs webkit browser and log request urls as JSON to the console.
 * The resources downloaded by the browser will not follow any robots restrictions, so use carefully.
 *
 * Options for debug/verbose output, user agent, and timeout. parseLevel and preload options not yet implemented.
 * 
 * TODO: implement dom parsing
 * TODO: implement preload request intercept
 *
 * @contributor adam
 *
*/

var system = require('system');
var args = []
var srcUrl=null;
var hashIndex=-1;
var userAgent=null;
var preloadedPage=null;
var verbose=false;
var parseLevel=1;
var debug=false;
var timeout=300000;

system.args.forEach(function (arg, i) {
        if(i>0)
            args.push(arg);
});
while(args.length>0) {
    var key = args.shift();
    if(key.length<2)
	invalidArgument();
    if(key.substr(0,2)==='--'){
	if(key==='--help'){
	    printUsage();
	    phantom.exit();
	}
	if(args.length<1)
	    invalidArgument();
	    
	var value=args.shift();
	if(key==='--url')
	    srcUrl=value;
	else if(key==='--userAgent')
	    userAgent=value;
	else if(key==='--preload'){
	    preloadedPage = JSON.parse(value);
	}
	else if(key==='--parseLevel'){
		parseLevel=value;
	}
	else if(key==='--timeout'){
		timeout=value;
	}
	else
	    invalidArgument();
    }
    else if(key.substr(0,1)==='-'){
	var flag=key.substr(1,1);
	if(flag==='?'){
	    printUsage();
	    phantom.exit();
	}
	else if(flag==='v')
	    verbose=true;
	else if(flag==='d')
	    debug=true;
	else
	    invalidArgument();
    }
}
if(srcUrl==='undefined' || srcUrl===null || srcUrl.length==0){
    console.log("ERROR: --url required\n");
    printUsage();
    phantom.exit();
}


function printUsage(){
    console.log("Usage:\n  phantomjs phantomBrowserExtractor.js [OPTION...] --url <url>");
    console.log("");
    console.log("Retrieves and parses the specified HTML page. Returns JSON encoded results of interest, as well as any XMLHttpRequests");
    console.log("");
    console.log("Help Options:\n  -?, --help	Display this usage information");
    console.log("");
    console.log("Application Options:\n	-v		Verbose output");
    console.log("	-d		Print debug information");
    console.log("	--url		The URL of the web page to be rendered");
    console.log("	--userAgent	The user agent string to use. Default is inherited from zombie.js - Mozilla/5.0 Chrome/10.0.613.0 Safari/534.15 Zombie.js/#{VERSION}");
    console.log("	--parseLevel	0 = don't parse; 1 = ajax requests only; 2 = basic parsing; 3 = intensive parsing");
    console.log("	--timeout	Integer in milliseconds representing overall timeout. default 5mins");
    console.log("	--preload	A JSON object containing http headers and file location of utf-8 encoded text to replace the initial request. Use this to keep the browser from making the initial http request");
    console.log("	  example:	{\"Content-Type\":\"text/html\",\"body\":\"/tmp/fileContents.utf8.html\"}");
    console.log("	  note:		escape non-alphanumeric characters with \\ ex. \\{\\\"Content\\-Type\\\"\\:\\\"text\\/html\\\"\\,\\\"body\\\"\\:\\\"\\/tmp\\/fileContents\\.utf8\\.html\\\"\\} ");
    console.log("Example:\n	phantomjs phantomBrowserExtractor.js --url http://www.google.com");
}
function invalidArgument(){
    console.log("ERROR: Invalid Argument.\n");
    printUsage();
    phantom.exit(-1);
}
function doTimeout(){
	if(debug || verbose)
		console.error('timeout exceeded');
	phantom.exit(-5);
}
function logObject(obj){
	if(verbose )
		console.log(JSON.stringify(obj,undefined,2));
	else
		console.log(JSON.stringify(obj,undefined));
}

var page = require('webpage').create(),
    t, address;



page.onResourceRequested = function (requestData,request){
    if(requestData.url.indexOf('data')<0){
	if(debug){
	    console.error(requestData.method+ ' ' + requestData.url);
	    if(verbose)
		console.error(JSON.stringify(requestData,undefined,4));
	}
	
	logObject({"tagName":"XMLHttpRequest","url":requestData.url});
    }
    if ((/http:\/\/.+?((\.google-analytics\.com)|(\.getclicky\.com)|(\.statcounter\.com)|(\.mxpnl\.com)|(\.mixpanel\.com)|(\.foxmetrics\.com)|(\.kissmetrics\.com)|(\.woopra\.com)|(\.reinvigorate\.net)|(\.webtrendslive\.com)|(\.webtrends\.com)|(webtrends\.js)|(\.chartbeat\.com)|(owa\.tracker-combined-min\.js)|(\/mint\/\?js)|(piwik\.js)|(chartbeat\.js))|(\.(css)|(jpg)|(png)|(gif))/gi).test(requestData['url']) || requestData['Content-Type'] == 'text/css') {
	if(debug){
	    console.error('The url of the request is matching. Aborting: ' + requestData['url']);
	}
	request.abort();
    }
};
page.onResourceReceived = function (response) {
	if(debug)
    	console.error('Received ' + response.url + ' => '+response.status);
};
if(userAgent!=='undefined' && userAgent!==null)
	page.settings.userAgent=userAgent;

if(debug){
    console.log("Debug: "+debug);
    console.log("UserAgent: "+page.settings.userAgent);
    console.log("ParseLevel: "+parseLevel);
    console.log("preloadedPage: "+preloadedPage);
    console.log("timeout: "+timeout);
}

t = Date.now();
setTimeout(doTimeout,timeout);

page.onInitialized=function(){
	// console.log('on init');
	// page.injectJs("inject.js");
	// page.evaluate(function(){
	// 		var a = new Image();
	// 	});
}
page.onLoadStarted=function(){

}

//page.onConsoleMessage = function (msg) { console.log(msg); };
page.open(srcUrl, function (status) {
    if (status !== 'success') {
        console.log('FAIL to load the address');
    } else {
        t = Date.now() - t;
		
		page.evaluate(function(){
			var a = new Image();
		});

        if(debug)
        	console.error('Loading time ' + t + ' msec');
    }
    phantom.exit();
});

function printObj(obj){
    var output = '';
    for (property in obj) {
	output += property + ': ' + obj[property]+'; ';
    }
    return output;
}