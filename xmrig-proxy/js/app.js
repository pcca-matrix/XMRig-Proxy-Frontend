// Dom7
var $$ = Dom7;

// Init App
var app = new Framework7({
  id: 'io.framework7.proxy',
  root: '#app',
  name: 'XMRig Proxy',
  theme: 'auto',
  routes: routes,
});

var mainView = app.views.create('.view-main');
var proxy_id = 0;
var config_data = {};
var days = 1;
window.onresize = function() { Plotly.Plots.resize('proxy_hashrate'); }

//-- Workers page init
$$(document).on('page:init', '.page[data-name="workers"]', function (e) {
  workers_list();
})

//-- Change pool page init
$$(document).on('page:init', '.page[data-name="ch_pool"]', function (e) {
  	$.each( config_data.pools, function( i, item ){
		$('select[name=pool]').append($("<option></option>").attr("value",i).text(item.url));
	});	
	$('select[name=pool]').on('change', function(e){
		var index = this.value;
		app.dialog.confirm('to '+$(this).find("option:selected").text()+' ?', 'Change Pool', function () {
			arraymove(config_data.pools, index, 0);
				app.dialog.preloader('Changing pool ...');
				app.request.post('php/get_json.php', {cc:"put_data",  endpoint: 'config', proxy: proxy_id,json:config_data}, function (data) {
					app.dialog.close();
			},"json");				
		}, function(){
			$("select[name=pool]").val(0);
		});
	});
	$("input[name=loop_minutes]").on("input", function(){ 
		app.dialog.alert('Not implemented yet !');
		$("input[name=loop_minutes]").val("").attr('disabled','disabled');		
	});
})


//-- Settings page init
$$(document).on('page:init', '.page[data-name="settings"]', function (e) {	
	$.each( config_data, function( i, item ){		
		if(item === true) item = "true"; if(item === false) item = "false";
		if(item)$("[name='"+i+"']").val(item);
	});
	$("#proxy-form-settings :input").on("change",function(){ $('#submit').show() });
	$('#submit').on("click", function(){
		app.dialog.preloader('Sending datas...');
		var form = GetFormDatas($("#proxy-form-settings"));
		$.each( $.parseJSON(form), function(i, item ){
			config_data[i]=item;
		});
		app.request.post('php/get_json.php', {cc:"put_data",  endpoint: 'config', proxy: proxy_id,json:config_data}, function (data) {
			app.dialog.close();
			$('#submit').hide();
		},"json");
	});
})

//-- On app start
graph();
get_config();

$$('#mindays').on("click",function() {
	if(days > 1) { days--; graph(); }
	$('#numdays').text(days);
});
$$('#maxdays').on("click",function() {
		days++; graph();
		$('#numdays').text(days);
});	


//-- functions
function get_config(){
	app.request.post('php/get_json.php', {cc:"proxy_data", endpoint: 'config', proxy: proxy_id}, function (data) {
		config_data = data;
		get_data();
	},"json");	
}

function workers_list(){
	app.request.post('php/get_json.php', {cc:"proxy_data", endpoint: 'workers', proxy: proxy_id}, function (data) {
		$$('#worker_list').html("");
		$.each( data.workers, function( i, item ){
			$$('#worker_list').append('<li>'+
			  '<div class="item-content">'+
				'<div class="item-inner">'+
				  '<div class="item-title-row">'+
					'<div class="item-title">'+item[0].substr(0,5)+'...'+item[0].substr(5,4)+'</div>'+
					'<div class="item-after">('+item[2]+') '+item[1]+'</div>'+
				  '</div>'+
				  '<div class="item-subtitle" style="font-size:11px">'+
					$.timeago(new Date(item[7]).toISOString())+ 
					' Tot: '+getReadableHashRateString(item[6])+' ('+item[3]+')'+' ('+item[4]+')'+' ('+item[5]+')'+
				  '</div>'+
							'<div class="item-row" style="font-size:12px;">'+
							  '<div class="item-cell">1m</div>'+
							  '<div class="item-cell">10m</div>'+
							  '<div class="item-cell">1h</div>'+
							  '<div class="item-cell">12h</div>'+
							  '<div class="item-cell">24h</div>'+
						    '</div>'+
						    '<div class="item-row" style="font-size:11px;">'+
							  '<div class="item-cell">'+getReadableHashRateString(item[8]*1000)+"/s"+'</div>'+
							  '<div class="item-cell">'+getReadableHashRateString(item[9]*1000)+"/s"+'</div>'+
							  '<div class="item-cell">'+getReadableHashRateString(item[10]*1000)+"/s"+'</div>'+
							  '<div class="item-cell">'+getReadableHashRateString(item[11]*1000)+"/s"+'</div>'+
							  '<div class="item-cell">'+getReadableHashRateString(item[12]*1000)+"/s"+'</div>'+
						    '</div>'+
				'</div>'+
			  '</div>'+
			'</li>'
			);
		});	
	},"json");	
}


function graph(){
	app.request.post('php/get_json.php', {cc:"read_db", proxy:proxy_id, days:days}, 
		function (data) {
			var X = []; var Y = [];
			for (var reading = 0; reading < data.length-2; reading++) {
				X.push(data[reading].date);
				Y.push( data[reading].value/1000 );
			}			
			var trace1 = {
			  x: X,
			  y: Y,
			  fill: 'tozeroy',
			  type: 'scatter'
			};
			var data = [trace1];
	
			var layout = {
				paper_bgcolor: "#1E1E1E",
				plot_bgcolor: "#1E1E1E",
				margin: {
					l:40,
					r:10,
					t:10,
					b:30
				},
				autosize: true,
				height: "260",
				showlegend: false,
				  xaxis: {
					autorange: true,
					showgrid: false,
					zeroline: false,
					showline: false,
					autotick: true,
					ticks: '',
					showticklabels: true
				  },
				  yaxis: {
					autorange: true,
					showgrid: true,
					zeroline: true,
					showline: true,
					autotick: true,
					ticks: '',
					tickformat: ".2f",
					showticklabels: true
				  }
			};
			Plotly.newPlot('proxy_hashrate', data, layout, {displaylogo: false, displayModeBar: false});
		},"json");
}

function get_data(){
	app.request.post('php/get_json.php', {cc:"proxy_data",  endpoint: 'summary', proxy: proxy_id}, function (data) {
		$$("#proxy_infos").html( data.worker_id + " - " + data.version);
		$$("#act_pool").html( config_data.pools[0].url );
		$$("#uptime").html( secondstotime(data.uptime) );
		$$("#workers").html( "Now: <b>"+data.miners.now+"</b> - Max: <b>"+data.miners.max+"</b>");
		$$("#tothash").html(getReadableHashRateString(data.results.hashes_total));
		$$("#avghash").html(getReadableHashRateString( (data.results.hashes_total / data.uptime))+"/s");
		$$("#accepted").html(data.results.accepted);
		$$("#invalid").html(data.results.invalid);
		$$("#rejected").html(data.results.rejected);
		$$("#expired").html(data.results.expired);
		$$("#avgT").html(data.results.avg_time+" ms");
		$$("#latency").html(data.results.latency);			
		$$("#donated").html(data.donated);			
		$$("#donatelevel").html(data.donate_level);					
		$$("#up_tot").html(data.upstreams.total);			
		$$("#up_active").html(data.upstreams.active);			
		$$("#up_error").html(data.upstreams.error);			
		$$("#up_ratio").html(data.upstreams.ratio);			
		$$("#up_sleep").html(data.upstreams.sleep);			
		var best_list="";
		var bl = data.results.best;
		$.each( bl, function( i, item ){
			best_list+='<tr><td class="label-cell">'+(i+1)+'</td><td class="numeric-cell">'+parseInt(item)+'</td></tr>';
		});		
		var hash_list="";
		$.each( data.hashrate.total, function( i, item ){
			if(i<5)hash_list+="<td>"+getReadableHashRateString(item*1000)+"/s</td>";
		});			
		setTimeout(function(){
			$$("#ten_best").html(best_list);
			$$('#hashrate').html(hash_list);
		},500);

	},"json");
	setTimeout(function(){
		get_data();
	},20000);
}

function arraymove(arr, fromIndex, toIndex) {
    var element = arr[fromIndex];
    arr.splice(fromIndex, 1);
    arr.splice(toIndex, 0, element);
}

function GetFormDatas(form) {
    var select = form.find('select'),
        input = form.find('input'),
        requestString = '{';
    for (var i = 0; i < select.length; i++) {
        requestString += '"' + $(select[i]).attr('name') + '": "' +$(select[i]).val() + '",';
    }
    /*if (select.length > 0) {
        requestString = requestString.substring(0, requestString.length - 1);
    }
	*/
    for (var i = 0; i < input.length; i++) {
        if ($(input[i]).attr('type') !== 'checkbox') {
            requestString += '"' + $(input[i]).attr('name') + '":"' + $(input[i]).val() + '",';
        } else {
            if ($(input[i]).attr('checked')) {
                requestString += '"' + $(input[i]).attr('name') +'":"' + $(input[i]).val() +'",';
            }
        }
    }
    if (input.length > 0) {
        requestString = requestString.substring(0, requestString.length - 1);
    }
    requestString += '}';
    return requestString;
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function secondstotime(secs)
{
	var seconds = parseInt(secs, 10);
	var days = Math.floor(seconds / (3600*24));
	seconds  -= days*3600*24;
	var hrs   = Math.floor(seconds / 3600);
	seconds  -= hrs*3600;
	var mnts = Math.floor(seconds / 60);
	seconds  -= mnts*60;
	return days+" days, "+hrs+" Hrs, "+mnts+" Minutes, "+seconds+" Seconds";
}


function getReadableHashRateString(hashrate) {
	hashrates = hashrate || 0;
	var i = 0;
	var byteUnits = [' H', ' Kh', ' Mh', ' Gh', ' Th', ' Ph' ];
	while(hashrates >=1000) {
		hashrates = hashrates / 1000;
		i++;
	}
	return parseFloat(hashrates).toFixed(2) + byteUnits[i];
}