/***
 * @copyright 2017 Ruben Schulz
 * @author    Ruben Schulz <info@rubenschulz.nl>
 * @package   VPS Health
 * @link      http://www.rubenschulz.nl/
 * @version   1.0
***/

/*** Execute functions ***/
	// Start Foundation
	$(document).foundation();

	// Execute functions
	$(document).ready(function(){
		// Add VPS
		VPSHealth.addVPS({
			'title'   : 'Ruben Lokaal', 
			'host'    : 'http://ruben',
			'path'    : 'vps-health/server/',
			'file'    : 'health.php',
			'interval': 2500,	// ms
			'server'  : {
				'cpu'   : 4,
				'memory': 8,	// GB
				'disk'  : 80	// GB
			}
		});

/*
		// Add VPS
		VPSHealth.addVPS({
			'title'       : 'Demo VPS', 
			'host'        : 'https://vps.example.com',
		});
*/

		// Start health check
		VPSHealth.start();
	});