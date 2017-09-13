# VPS-Health
Dashboard to monitor VPS health

# Configuration
The file scripts/app.js contains the VPS configuration.
Add as many VPSses to the dashboard as you need.

The dashboard will look for the server-side health.php script, in the location {host}/{path}/{file}. 
Add the host, path and optional file variables in the VPS configuration to reflect the correct location of the script.

# API key
An API key is used to restrict unwanted access to the server-side script. The default
API key is "vps-health". You can change the key globally for all VPSses, or set a different
key for each VPS for added security.

# CORS
The server-side health.php is configured to use CORS (Cross Origin Resource Sharing).
For easy set-up it is set to allow requests from all hosts. Change the value of Access-Control-Allow-Origin 
to the hostname where the dashboard is located for added security.

# SSL support
Due to the CORS restriction "protocols must match", if the dashboard on a SSL connection 
you can only monitor hosts that are on SSL as well.  You can however monitor hosts on a
SSl connection even when the dashboard is not.