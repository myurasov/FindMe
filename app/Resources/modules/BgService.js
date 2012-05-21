/**
 * Background service
 */

Ti.API.info('Background service started');

Ti.App.currentService.addEventListener('stop', function() {
  Ti.API.info('Background service stopped');
});

//

var __DEBUG = true;
var __DEMO = false;

var Project = {};

Titanium.include(
  '../lib/underscore.js',
  '../lib/mym/Utils.js',
  '../lib/mym/Configuration.js',
  '../lib/mym/Mixins/EventsMixin.js',
  '../modules/Utils.js',
  '../modules/Config.js',
  '../modules/Messenger.js'
);

//

var messenger = new Project.Messenger(Project.Config.get('channel'));

// start geolocation

Ti.Geolocation.purpose = "Geolocation";
Ti.Geolocation.preferredProvider = "gps";
Ti.Geolocation.accuracy = Ti.Geolocation.ACCURACY_NEAREST_TEN_METERS;
Ti.Geolocation.distanceFilter = 3;

Ti.Geolocation.addEventListener("location", function(e){
  publishLocation(e);
});

/**
  * Publich location
  */
var publishLocation = mym.Utils.dejitter(function(e) {

  Project.Utils.fetchAddress(
    e.coords.latitude,
    e.coords.longitude,

    function(address) {
      var message = {
        location: {
          lat: e.coords.latitude,
          lon: e.coords.longitude,
          address: address
        }
      };
      messenger.publish(message);
  });

}, Project.Config.get('publishTimeout') * 1000);