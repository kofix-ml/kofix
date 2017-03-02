var queue 	= 	[];
var http	=	{};	

//Cache Variables
var cache		=	{};
var cache_entry	=	{};

//Cached GET Request If Less Then 15 Seconds; the cache time can be disabled by passing 5th parameter as 0
function GET(_url, _data, _callback, _beforesend, _cacheseconds){			
	
	if (typeof _cacheseconds === "undefined" || _cacheseconds === null) {
		//By default get cached result(s)
		_cacheseconds	=	15;
	}
	
	//Set Parameters
	if(typeof _data !== 'undefined'){	_url	=	_url + "/"+_data;	}
	
	//Set HTTP Info
	http.method	=	'GET';	
	http.url	=	_url;	
	
	//console.log(_cacheseconds > 0);
	
	if(_cacheseconds > 0){
		if (http.method == 'GET'){
			$.each(cache_entry, function(key, entry) {
				
				cached_url		=	key.toString()	;
				requested_url	=	_url			;
				
				//Check for matching URL
				if(requested_url == cached_url){
					//console.log('Found Matching Entry');
					//Check how many seconds has elapsed
					seconds_elapsed	=	Math.round(Math.round((new Date().getTime() / 1000))-entry.datetime);
					if(seconds_elapsed <= _cacheseconds){
						//If data exist; use back else make new ajax call
						if(typeof entry.data != 'undefined'){
							//console.log('Cached Data:'+requested_url);
							beforeSend(_beforesend);
							window[_callback](entry.data);
							return;
						}
					}
				}
			});
		}
	}
	
	//Set Cache Information
	cache			=	{};
	cache.datetime 	=	new Date().getTime() / 1000;
		
	//Add the cache to array
	cache_entry[_url]=cache;
	
	//Queue AJAX call 
	queue.push(['GET', _url, null, _callback, _beforesend]);
	ajaxHandler();
}

function POST(_url, _data, _callback, _beforesend){
	
	//Set HTTP Info
	http.method	=	'POST';	
	http.url	=	_url;	
	
	//Queue AJAX call 
	queue.push(['POST', _url, _data, _callback, _beforesend]);
	ajaxHandler();
}

//Get Query String Parameters
function _queryString(name)
{
	name		=	name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
	var regexS 	= 	"[\\?&]"+name+"=([^&#]*)";
	var regex 	= 	new RegExp( regexS );
	var results = 	regex.exec( window.location.href );
	if( results == null )
		return "";
	else
		return results[1];
}

//Get clean URL; remove all anchor link
function getPathFromUrl(url) {
  return url.split(/[#]/)[0];
}

function ajaxHandler(){
	
	$.each(queue, function (i, item) {

		//inputToken	=	$('input[name="_token"]').val();
		_token			=	$('meta[name="csrf-token"]').attr('content');
		
		// Clear the hash from anchor link in the URL; from modal or selecting tab 
		// Query string is acceptable but not anchor links(#) breaks accessor validation
		_currentpage	=	getPathFromUrl(window.location + '');
		
		//SM-DM or other no login user access token
		_accessToken	=	_queryString('accessToken');
		
		$.ajaxSetup({
			headers:{
				'X-CSRF-TOKEN'	:	_token					,
				'Accessor-Info'	:	window.accessor_info	,
				'Current-Page'	:	_currentpage			,
				'Access-Token'	:	_accessToken			
			}						
		});
		
		// beforesend function
		//Consider using: typeof item[4]==undefined 
		if(item[4]==undefined)
		{
			item[4] = "";
		}

		//TODO: json_string		=	JSON.stringify(_data);
		//TODO: Handle Invalid Access
		
		var request 	= 	$.ajax({
								url			: 	item[1]		,
								type		: 	item[0]		,
								data		:	item[2]		,
								async		: 	true		,
								//dataType	:	'json'		,
								beforeSend	:	function() {
									beforeSend(item[4]);
								},
								success		: 	function(data, textStatus, jqXHR) {callback(data,item[3],this.url);},
								'_token'	:	_token		,
								'_method'	:	item[0]		,
								error		:	function(jqXHR, textStatus, errorThrown){
											// alert(item[1]);
											// var responseText = jqXHR.responseText;
											// alert(responseText);
											//TODO: Check if invalid access then reload
													//window.location.reload();
												}			,		     
								timeout		: 	300000 
							});
		
		queue.splice(i,1);
	});
	
	queue 	= 	[];
	return false;
}

//Handle Callback's After AJAX Call
function callback(data, _call, _url) {

	//Invalid Token; Refresh The Page
	if(data=="Invalid Access"){alert('Your session has expired, please refresh the page for new session.');}
	
	if (http.method == 'GET'){
		$.each(cache_entry, function(key, entry) {
			cached_url		=	key.toString()	;
			requested_url	=	_url			;
			//Check for matching URL
			if(requested_url == cached_url){
				//Cache the ajax result
				cache_entry[key].data	=	data;
			}
		});
	}
	window[_call](data);
	
}

//Handle Beforesend before AJAX Call
function beforeSend(_call) {
	if(_call != "")
	{
		window[_call]();
	}
}