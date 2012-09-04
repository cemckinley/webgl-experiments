webgl-experiments
=================

Random experiments in webGL

Stereoscopic Carousel
---------------------

A 3D click & drag carousel of spheres for viewing stereoscopic photos. The original intent was to pull in photos from a special stereoscopic photo group using the Flickr API, but cross domain restrictions within webGL prevent this. Unfortunately, Flickr does not currently support external domains in CORS headers, but maybe this will change in time. For now, all Flickr photos (CC licensed) are stored locally.

To prevent x-domain issues when running locally, run the site on localhost or some IP - not file://etc etc