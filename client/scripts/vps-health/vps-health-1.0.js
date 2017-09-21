/***
 * @copyright 2017 Ruben Schulz
 * @author    Ruben Schulz <info@rubenschulz.nl>
 * @package   VPS Health
 * @link      http://www.rubenschulz.nl/
 * @version   1.0
***/

var VPSHealth = (function(){
/*** Global variables ***/
	// Define API key
	var api_key      = 'vps-health';

	// Define thresholds
	var load_warning = 70;		// %
	var load_alert   = 100;		// %
	var disk_warning = 80;		// %
	var disk_alert   = 90;		// %
	var interval     = 10000	// ms
	var timeout      = 5000		// ms

	// Define vpsses
	var vpsses       = [];
	var vps_default  = {
		'title'       : 'Demo VPS', 
		'host'        : 'https://vps.example.com',
		'path'        : '',
		'file'        : 'health.php',
		'api_key'     : api_key,
		'load_warning': load_warning,
		'load_alert'  : load_alert,
		'disk_warning': disk_warning,
		'disk_alert'  : disk_alert,
		'interval'    : interval,
		'timeout'     : timeout,
		'server'      : {
			'cpu'     : null,
			'memory'  : null,	// GB
			'disk'    : null	// GB
		}
	};



/*** Private functions ***/
	function _checkVPSHealth(key, vps){
		// Add check class
		$('#vpsses #vps_'+ key).addClass('check');

		// Check health
		$.ajax({
			url      : vps.url,
			timeout  : vps.timeout,
			type     : 'get', 
			dataType : 'json',
			headers  : {
				'X-API-Key': vps.api_key
			},
			complete: function(xhr, status){
				// Set data
				data = status == 'success' ? xhr.responseJSON : '{}';

				// Update status
				_updateVPSstatus(key, vps, data, status);

				// Save history
				_saveVPSHistory(vps, data);

				// Repeat check
				window.setTimeout(function(){
					// Check VPS health
					_checkVPSHealth(key, vps);
			    }, vps.interval);

			},
		});
	}

	function _updateVPSstatus(key, vps, data, status){
		// Update VPS
		_updateVPSload(key, vps, data);
		_updateVPSCPU(key, vps, data);
		_updateVPSmemory(key, vps, data);
		_updateVPSdisk(key, vps, data);
		_updateVPSuptime(key, vps, data);
		_updateVPSavailability(key, vps, status);

		// Update existing vps
		if(status == 'error' ||
		   data.load && (data.load.usage_pct_15 >= vps.load_alert) ||
		   data.disk && (data.disk.usage_pct    >= vps.disk_alert)){
			// Set alert
			$('#vpsses #vps_'+ key)
				.addClass('alert')
				.removeClass('warning')
				.removeClass('success')
				.attr('data-sort', 10);

		}else if(data.load && (data.load.usage_pct_15 >= vps.load_warning) ||
		  		 data.disk && (data.disk.usage_pct    >= vps.disk_warning)){
			// Set warning=
			$('#vpsses #vps_'+ key)
				.addClass('warning')
				.removeClass('success')
				.removeClass('alert')
				.attr('data-sort', 20);

		}else if(status == 'timeout'){
			// Set warning=
			$('#vpsses #vps_'+ key)
				.removeClass('warning')
				.removeClass('success')
				.removeClass('alert')
				.attr('data-sort', 0);

		}else{
			// Set success
			$('#vpsses #vps_'+ key)
				.addClass('success')
				.removeClass('warning')
				.removeClass('alert')
				.attr('data-sort', 30);
		}

		// Remove check class
		$('#vpsses #vps_'+ key).removeClass('check');

		// Sort VPSSes
		_sortVPSses($('#vpsses'));
	}

	function _showVPSDetails(vps){
		// Open pop-up
		$('#vps_details').foundation('open');

		// Set VPS ID
		$('#vps_details').attr('data-vps-id', vps.hash);

		// Set VPS title
		$('#vps_details h2')
			.text(vps.title);

		// Set VPS host
		$('#vps_details h3')
			.text(vps.host);

		if(vps.memory){
			// Set VPS cpu
			$('#vps_details #cpu span')
				.text(vps.cpu + ' cpu');
		}else{
			// Set VPS cpu
			$('#vps_details #cpu span')
				.text('-');
		}

		if(vps.memory){
			// Set VPS memory
			$('#vps_details #memory span')
				.text(vps.memory + ' GB');

		}else{
			// Set VPS memory
			$('#vps_details #memory span')
				.text('-');
		}

		// Set VPS disk
		if(vps.disk){
			$('#vps_details #disk span')
				.text(vps.disk + ' GB');
		}else{
			// Set VPS memory
			$('#vps_details #disk span')
				.text('-');
		}

		// Add click
		$('#vps_details #delete_vps_history').click(function(){
			// Delete VPS history
			_deleteVPSHistory(vps);
		});

		// Draw history charts
		if(vps.history){
			_drawChart(vps.history.load,         'history_load');
			_drawChart(vps.history.cpu,          'history_cpu');
			_drawChart(vps.history.memory,       'history_memory');
			_drawChart(vps.history.disk,         'history_disk');
			_drawChart(vps.history.availability, 'history_availability');
		}
	}

	function _updateVPSload(key, vps, data){
		// Calculate totals
		vps.cpu = data.cores ? data.cores : vps.server.cpu;

		if(data.load){
			// Calculate totals
			data.load.usage_pct_1  = Math.round((data.load.min_1  * 100) / vps.cpu);
			data.load.usage_pct_5  = Math.round((data.load.min_5  * 100) / vps.cpu);
			data.load.usage_pct_15 = Math.round((data.load.min_15 * 100) / vps.cpu);

			// Set data
			$('#vpsses #vps_'+ key +' #load_1 span')
				.text(data.load.usage_pct_1 +'%');

			$('#vpsses #vps_'+ key +' #load_5 span')
				.text(data.load.usage_pct_5 +'%');

			$('#vpsses #vps_'+ key +' #load_15 span')
				.text(data.load.usage_pct_15 +'%');

		}else{
			// Set data
			$('#vpsses #vps_'+ key +' #load_1 span')
				.text('-');

			// Set data
			$('#vpsses #vps_'+ key +' #load_5 span')
				.text('-');

			// Set data
			$('#vpsses #vps_'+ key +' #load_15 span')
				.text('-');
		}
	}

	function _updateVPSCPU(key, vps, data){
		if(data.cpu){
			// Calculate totals
			data.cpu.total     = data.cpu.total ? data.cpu.total : vps.server.cpu * 1024 * 1024 * 1024;
			data.cpu.used      = data.cpu.used  ? data.cpu.used  : 0;
			data.cpu.usage_pct = Math.round((data.cpu.used / data.cpu.total) * 100);

			// Set data
			$('#vpsses #vps_'+ key +' #cpu span')
				.text(data.cpu.usage_pct +'%');
		
		}else{
			// Set data
			$('#vpsses #vps_'+ key +' #cpu span')
				.text('-');
		}
	}

	function _updateVPSmemory(key, vps, data){
		// Calculate totals
		vps.memory = data.memory ? Math.round(data.memory.total / 1024 / 1024 / 1024) : vps.server.memory;

		if(data.memory){
			// Calculate totals
			data.memory.total     = data.memory.total ? data.memory.total : vps.server.memory * 1024 * 1024 * 1024;
			data.memory.used      = data.memory.used  ? data.memory.used  : 0;
			data.memory.usage_pct = Math.round((data.memory.used / data.memory.total) * 100);

			// Set data
			$('#vpsses #vps_'+ key +' #memory span')
				.text(data.memory.usage_pct +'%');
		
		}else{
			// Set data
			$('#vpsses #vps_'+ key +' #memory span')
				.text('-');
		}
	}

	function _updateVPSdisk(key, vps, data){
		// Calculate totals
		vps.disk = data.disk ? Math.round(data.disk.total / 1024 / 1024 / 1024) : vps.server.disk;

		if(data.disk){
			// Calculate totals
			data.disk.total     = data.disk.total ? data.disk.total : vps.server.disk * 1024 * 1024 * 1024;
			data.disk.used      = data.disk.total - data.disk.free;
			data.disk.usage_pct = Math.round((data.disk.used / data.disk.total) * 100);

			// Set data
			$('#vpsses #vps_'+ key +' #disk span')
				.text(data.disk.usage_pct +'%');

		}else{
			// Set data
			$('#vpsses #vps_'+ key +' #disk span')
				.text('-');
		}
	}

	function _updateVPSuptime(key, vps, data){
		if(data.uptime){
			// Set data
			$('#vpsses #vps_'+ key +' #uptime')
				.text(data.uptime.days+' days, '+ data.uptime.hours+':'+ data.uptime.minutes+' hours');

		}else{
			// Set data
			$('#vpsses #vps_'+ key +' #uptime')
				.text('-');
		}
	}

	function _updateVPSavailability(key, vps, status){
		// Add counters
		status == 'error'   ? vps.availability.error++   : '';
		status == 'timeout' ? vps.availability.timeout++ : '';
		status == 'success' ? vps.availability.success++ : '';
		vps.availability.total++;

		// Calculate totals
		vps.availability.error_pct   = Math.round((vps.availability.error   / vps.availability.total) * 100);
		vps.availability.timeout_pct = Math.round((vps.availability.timeout / vps.availability.total) * 100);
		vps.availability.success_pct = Math.round((vps.availability.success / vps.availability.total) * 100);

		// Save availability
		localStorage.setItem('vpshealth_availability_'+vps.hash, JSON.stringify(vps.availability));

		// Set data
		$('#vpsses #vps_'+ key +' #availability span')
			.text(vps.availability.success_pct +'%');
	}

	function _saveVPSHistory(vps, data){
		// Check VPS history
		if(vps.history){
			// Add data to VPS history
			vps.history = {
				'load'        : Object.assign({}, vps.history.load, {
					[data.timestamp]: data.load   ? data.load.usage_pct_1 : null
				}),
				'cpu'         : Object.assign({}, vps.history.cpu, {
					[data.timestamp]: data.cpu    ? data.cpu.usage_pct    : null
				}),
				'memory'      : Object.assign({}, vps.history.memory, {
					[data.timestamp]: data.memory ? data.memory.usage_pct : null
				}),
				'disk'        : Object.assign({}, vps.history.disk, {
					[data.timestamp]: data.disk   ? data.disk.usage_pct   : null
				}),
				'availability': Object.assign({}, vps.history.availability, {
					[data.timestamp]: vps.availability.success_pct
				}),
			};

		}else{
			// Set VPS history
			vps.history = {
				'load'        : {
					[data.timestamp]: data.load   ? data.load.usage_pct_1 : null
				},
				'cpu'        : {
					[data.timestamp]: data.cpu    ? data.cpu.usage_pct    : null
				},
				'memory'      : {
					[data.timestamp]: data.memory ? data.memory.usage_pct : null
				},
				'disk'        : {
					[data.timestamp]: data.disk   ? data.disk.usage_pct   : null
				},
				'availability': {
					[data.timestamp]: vps.availability.success_pct
				},
			};
		}

		// Save VPS history
		localStorage.setItem('vpshealth_history_'+vps.hash, JSON.stringify(vps.history));

		// Update charts
		if($('#vps_details').attr('data-vps-id') == vps.hash){
			// Update history charts
			_drawChart(vps.history.load,         'history_load');
			_drawChart(vps.history.cpu,          'history_cpu');
			_drawChart(vps.history.memory,       'history_memory');
			_drawChart(vps.history.disk,         'history_disk');
			_drawChart(vps.history.availability, 'history_availability');
		}
	}

	function _deleteVPSHistory(vps){
		// Delete VPS history
		localStorage.removeItem('vpshealth_history_'+vps.hash);
		localStorage.removeItem('vpshealth_availability_'+vps.hash);

		// Remove history
		vps.history = null;

		// Reset history charts
		_drawChart(null, 'history_load');
		_drawChart(null, 'history_cpu');
		_drawChart(null, 'history_memory');
		_drawChart(null, 'history_disk');
		_drawChart(null, 'history_availability');
	}

	function _deleteAllHistory(){
		// Loop through vpsses
		$.each(vpsses, function(key, vps){
			// Delete VPS history
			localStorage.removeItem('vpshealth_history_'+vps.hash);
			localStorage.removeItem('vpshealth_availability_'+vps.hash);

			// Remove history
			vps.history = null;
		});

		// Reset history charts
		_drawChart(null, 'history_load');
		_drawChart(null, 'history_cpu');
		_drawChart(null, 'history_memory');
		_drawChart(null, 'history_disk');
		_drawChart(null, 'history_availability');
	}

	function _drawChart(history, container){
		// Build labels and data
		var labels  = [];
		var data    = [];

		var length  = history ? Object.keys(history).length : 0;
		var factor  = Math.ceil(length / 50);
		var total   = 0;
		var i       = 0;

		// Loop through history
		$.each(history, function(index, value){
			// Calculate total
			total = total + value;

			// Only add 50 data points
			if(i % factor == 0){
				// Set label and data
				labels.push(index);
				data.push(Math.round(total / factor));

				// Reset total
				total = 0;
			}

			i++;
		});

		// Check if chart exists
		if(typeof window[container+'Chart'] === 'undefined'){
			// Draw chart
			window[container+'Chart'] = new Chart($('#'+container), {
				'type': 'line',
				'data': {
					'labels'  : labels,
					'datasets': [{
						'borderColor'    : '#3CABFF',
						'backgroundColor': '#DBEFFF',
						'data'           : data
					}]
				},
				'options': {
					'responsive'          : true,
					'maintainAspectRatio' : true,
					'title': {
						'display'   : true,
						'fontFamily': 'Ubuntu, sans-sertif',
						'text'      : $('#'+container).attr('data-label')
					},
					'legend': {
			            'display': false,
					},
					'scales': {
						'xAxes': [{
							'type': 'time',
			                'time': {
			                    'unit': 'minute'
			                },
			                'ticks': {
								'autoSkip': true
			                }
						}],
						'yAxes': [{
							'ticks': {
                                'suggestedMin' : 0,
                                'suggestedMax' : 100,
                                'maxTicksLimit': 5
							}
						}]
					}
				}
			});

		}else{
			// Update chart
			window[container+'Chart'].data.labels           = labels;
			window[container+'Chart'].data.datasets[0].data = data;
			window[container+'Chart'].update();
		}
	}

	function _sortVPSses(parent){
		// Sort VPSses
		var child = parent.find('> div').sort(function(a, b){
			// Define variables
			var aSort  = $(a).attr('data-sort');
		    var bSort  = $(b).attr('data-sort');
		    var aTitle = $(a).find('h2').text();
		    var bTitle = $(b).find('h2').text();

			// Check sort
			if(aSort == bSort){
				return aTitle < bTitle ? -1 : (aTitle > bTitle) ? 1 : 0;
			}else{
				return aSort  < bSort  ? -1 : 1;
			}
		});

		// Reorder VPSses
		parent.append(child);
	}

	function _generateHash(object){
		// Convert object to string
		str = JSON.stringify(object);

		// Hash string
		var hash = 0;
	    if (str == 0) return hash;
	    for (i = 0; i < str.length; i++) {
	        char = str.charCodeAt(i);
	        hash = ((hash << 5) - hash) + char;
	        hash = hash & hash;
	    }

	    // Output
	    return hash >>> 0;
	}



/*** Public functions ***/
	function setAPIKey(key){
		// Set API key
		api_key      = key;
	}

	function setInterval(milliseconds){
		// Set interval
		interval     = milliseconds;
	}

	function setTimeout(milliseconds){
		// Set timeout
		timeout      = milliseconds;
	}

	function setLoadWarning(percentage){
		// Set load warning
		load_warning = percentage;
	}

	function setLoadAlert(percentage){
		// Set load alert
		load_alert   = percentage;
	}

	function setDiskWarning(percentage){
		// Set disk warning
		disk_warning = percentage;
	}

	function setDiskAlert(percentage){
		// Set disk alert
		disk_alert   = percentage;
	}

	function addVPS(vps){
		// Build VPS object
		vps      = Object.assign({}, vps_default, vps);

		// Set VPSHealth URL
		vps.host = vps.host.replace(/\/+$/, '') + '/';
		vps.path = vps.path.replace(/\/+$/, '') + '/';
		vps.file = vps.file.replace(/\/+$/, '');
		vps.url  = vps.host + vps.path + vps.file;
		vps.url  = vps.url.replace(/([^:]\/)\/+/g, '$1');

		// Set hash
		vps.hash = _generateHash(vps);

		// Set availability
		vps.availability = Object.assign({}, {
			'error'      : 0,
			'timeout'    : 0,
			'success'    : 0,
			'total'      : 0,
			'error_pct'  : 0,
			'timeout_pct': 0,
			'success_pct': 0
		}, JSON.parse(localStorage.getItem('vpshealth_availability_'+vps.hash)));

		// Set history
		vps.history = JSON.parse(localStorage.getItem('vpshealth_history_'+vps.hash));

		// Add VPS to array
		vpsses.push(vps);

		// Get VPS key
		key  = vpsses.indexOf(vps);

		// Add VPS to list
		$('#vpsses #dummy')
			.clone()
			.prependTo('#vpsses')
			.attr('id', 'vps_'+ key)
			.attr('data-sort', 90)
			.removeClass('hide')

		// Set VPS title
		$('#vpsses #vps_'+ key +' h2')
			.text(vps.title);

		// Set VPS host
		$('#vpsses #vps_'+ key +' h3')
			.text(vps.host);

		// Add click
		$('#vpsses #vps_'+ key).click(function(){
			// Show details
			_showVPSDetails(vps);
		});
	}

	function start(){
		// Loop through vpsses
		$.each(vpsses, function(key, vps){
			// Check VPS health
			_checkVPSHealth(key, vps);
		});

		// Add click
		$('#delete_all_history').click(function(){
			// Delete all history
			_deleteAllHistory();
		});
	}

	// Output
	return {
		setAPIKey     : setAPIKey,
		setInterval   : setInterval,
		setTimeout    : setTimeout,
		setLoadWarning: setLoadWarning,
		setLoadAlert  : setLoadAlert,
		setDiskWarning: setDiskWarning,
		setDiskAlert  : setDiskAlert,
		addVPS        : addVPS,
		start         : start
	};

})();