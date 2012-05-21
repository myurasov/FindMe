if (mym == undefined) mym = {};
if (mym.UI == undefined) mym.UI = {};

if (typeof Titanium.Storekit == "undefined" || typeof Ti.Storekit == "undefined")
  Titanium.Storekit = Ti.Storekit = require("ti.storekit");

/**
 * Ads Host window
 * ver: 0.3
 *
 * todo: support for landscape for iPhone
 */

mym.UI.createAdsHostWindow = function(args)
{
  // Constants
  var TOP_AD = 0;
  var BOTTOM_AD = 1;
  var PROPERTIES_PREFIX = "mym.UI.AdsHostWindow.";

  var view;
  var hudIndicator;

  var iAds = [];
  var clientViews = [];

  var topAdEnabled;
  var bottomAdEnabled;
  var removeAdsIsPurchased;

  var adsChanged = true;
  var isBuying = false;

  var tryToLoadRemoteSettingsInterval_ms;

  function _init()
  {
    // Default args
    args = _.defaults(args || {}, {
      topAdEnabled: true,                 // top ad
      bottomAdEnabled: true,              // bottom ad
      showPlaceholderText: true,          // show placeholder text when no ads shown?
      inAppProductId: "remove_ads",       // product name
      adSettingsUrl: null,                // ad settings url {nocache} is replaced with anti-caching param,
      sandboxMode: false,                 // sandbox mode
      settingsLoadInterval: 60 * 60,      // Remote settings reload minimum  interval [seconds] 1 hr
      settingsLoadRetryInterval: 60 * 10, // retry interval [seconds] 10 minutes
      removeAdsIsPurchased: false
    });

    _loadSettings();

    // Poll remote settings

    if (args.adSettingsUrl != null)
    {
      tryToLoadRemoteSettingsInterval_ms =
        Math.min(args.settingsLoadInterval,
        args.settingsLoadRetryInterval) * 1000;

      setInterval(function() {
        view.tryToLoadRemoteSettings();
      }, tryToLoadRemoteSettingsInterval_ms);
    }

    //

    view = Ti.UI.createWindow();

    hudIndicator = mym.UI.createHudMessage({
      style: mym.UI.HudMessage.INDICATOR
    });

    view.add(hudIndicator);

    if (args.adSettingsUrl != null)
    {
      view.addEventListener("open", function(){
        view.tryToLoadRemoteSettings();
      });
    }

    Ti.Gesture.addEventListener('orientationchange', function(){
      _resizeClients();

      // !!! CHANGE THIS
      if (Ti.Platform.osname == "ipad")
      {
        _.each(iAds, function(v){
          v.moveUI();
        });
      }
    });
  }

  function _loadSettings()
  {
    topAdEnabled =
      Ti.App.Properties.getBool(PROPERTIES_PREFIX + "topAdEnabled", args.topAdEnabled);
    bottomAdEnabled =
      Ti.App.Properties.getBool(PROPERTIES_PREFIX + "bottomAdEnabled", args.bottomAdEnabled);
    removeAdsIsPurchased =
      Ti.App.Properties.getBool(PROPERTIES_PREFIX + "removeAdsIsPurchased", args.removeAdsIsPurchased);
  }

  _init();

  function _saveSettings()
  {
    Ti.App.Properties.setBool(PROPERTIES_PREFIX + "topAdEnabled", topAdEnabled);
    Ti.App.Properties.setBool(PROPERTIES_PREFIX + "bottomAdEnabled", bottomAdEnabled);
    Ti.App.Properties.setBool(PROPERTIES_PREFIX + "removeAdsIsPurchased", removeAdsIsPurchased);
  }

  function _buy()
  {
    if (!isBuying)
    {
      isBuying = true;
      hudIndicator.showHud();

      if (Ti.Storekit.canMakePayments)
      {
        Ti.Storekit.requestProducts([args.inAppProductId], function(event) {

          if (event.success && event.products.length >= 1)
          {
            var product = event.products[0];

            Ti.Storekit.purchase(product, function(event){

              if (event.state == Ti.Storekit.FAILED)
              {
                // Cancelled / failed
                hudIndicator.hideHud();
                isBuying = false;
              }
              else if (event.state == Ti.Storekit.PURCHASED || event.state == Ti.Storekit.RESTORED)
              {
                var receipt = event.receipt;

                Ti.Storekit.verifyReceipt({
                  receipt: receipt,
                  sandbox: args.sandboxMode,

                  callback: function(event) {

                    if (event.success)
                    {
                      if (event.valid)
                      {
                        // Success
                        mym.Utils.alert("Thank you!", undefined, function(){
                          removeAdsIsPurchased = true;
                          adsChanged = true;
                          _saveSettings();
                          view.refreshAds();
                          hudIndicator.hideHud();
                          isBuying = false;
                        });
                      }
                      else
                      {
                        // Invalid receipt
                        mym.Utils.alert("Invalid purchase", "Error #2", function(){
                          hudIndicator.hideHud();
                        });
                        isBuying = false;
                      }
                    }
                    else
                    {
                      // Failed to verify receipt
                      mym.Utils.alert("Failed to verify your purchase", "Error #3", function(){
                        hudIndicator.hideHud();
                      });
                      isBuying = false;
                    }
                  }

                })
              }
            });

          }
          else
          {
            // Failed to request products
            mym.Utils.alert("Unable to purchase", "Error #4", function(){
              hudIndicator.hideHud();
            });

            isBuying = false;
          }
        });

      }
      else
      {
        mym.Utils.alert("You can not make payments", "Error #1", function(){
          hudIndicator.hideHud();
        });
        isBuying = false;
      }
    }
  }

  function _setAds()
  {
    if (typeof __DEMO != "undefined" && __DEMO) return;

    var ad;

    if (topAdEnabled && !removeAdsIsPurchased)
    {
      if (iAds[TOP_AD] == undefined)
      {
        ad = mym.UI.createAdOverlay({
          dock: mym.UI.AdOverlay.DOCK_TOP,
          showPlaceholderText: args.showPlaceholderText
        });

        ad.addEventListener("_buy", function(){
          _buy();
        });

        view.add(ad);
        iAds[TOP_AD] = ad;
      }
    }
    else
    {
      if (iAds[TOP_AD] != undefined)
      {
        view.remove(iAds[TOP_AD]);
        delete iAds[TOP_AD];
      }
    }

    if (bottomAdEnabled && !removeAdsIsPurchased)
    {
      if (iAds[BOTTOM_AD] == undefined)
      {
        ad = mym.UI.createAdOverlay({
          dock: mym.UI.AdOverlay.DOCK_BOTTOM,
          showPlaceholderText: args.showPlaceholderText
        });

        ad.addEventListener("_buy", function(){
          _buy();
        });

        view.add(ad);
        iAds[BOTTOM_AD] = ad;
      }
    }
    else
    {
      if (iAds[BOTTOM_AD] != undefined)
      {
        view.remove(iAds[BOTTOM_AD]);
        delete iAds[BOTTOM_AD];
      }
    }
  }

  function _getClientArea()
  {
    var s = {
      top: iAds[TOP_AD] ? iAds[TOP_AD].size.height : 0,
      bottom: iAds[BOTTOM_AD] ? iAds[BOTTOM_AD].size.height : 0,
      left: 0,
      right: 0,
      width: view.size.width
    }

    s.height =  view.size.height - s.top - s.bottom;

    return s;
  }

  function _resizeClients()
  {
    _.each(clientViews, function(v){
      _resizeClient(v);
    });
  }

  function _resizeClient(client)
  {
    var s = _getClientArea();

    client.top = s.top;
    client.left = s.left;
    client.width = s.width;
    client.height = s.height;

    if (typeof client.moveUI == "function")
      client.moveUI(s);
  }

  function _loadRemoteAdSettings(callback)
  {
    if (args.adSettingsUrl != null)
    {
      var xhr = Ti.Network.createHTTPClient();
      xhr.timeout = 15 * 1000; // 30 seconds
      xhr.open("GET", args.adSettingsUrl.replace("{nocache}", Math.random()));

      xhr.onload = function() {

        if (xhr.status < 400)
        {
          var response = xhr.responseText;
          var top, bottom;
          var oldTop = topAdEnabled, oldBottom = bottomAdEnabled;

          top = response.indexOf(Ti.Platform.osname + "-top") != -1;
          bottom = response.indexOf(Ti.Platform.osname + "-bottom") != -1;

          if (!top && !bottom)
          {
            if (response.indexOf(Ti.Platform.osname + "-none") != -1)
            {
              topAdEnabled = top;
              bottomAdEnabled = bottom;
            }
          }
          else
          {
            topAdEnabled = top;
            bottomAdEnabled = bottom;
          }

          if (typeof callback != "undefined")
          {
            callback({
              success: true,
              changed: (topAdEnabled != oldTop || bottomAdEnabled != oldBottom)
            });
          }
        }
        else
        {
          if (typeof callback != "undefined")
          {
            callback({
              success: false,
              changed: false
            });
          }
        }
      }

      xhr.onerror = function() {
        if (typeof callback != "undefined")
          callback({success: false});
      }

      xhr.send();
    }
  }

  view.tryToLoadRemoteSettings = function()
  {
    if (view.__tryToLoadRemoteSettings == undefined)
    {
      view.__tryToLoadRemoteSettings = mym.Utils.dejitter(function() {
        view.refreshAdsFromRemoteSettings(function(e) {
          if (!e.success)
          {
            view.__tryToLoadRemoteSettings.interval =
              args.settingsLoadRetryInterval * 1000;
          }
          else
          {
            view.__tryToLoadRemoteSettings.interval =
              args.settingsLoadInterval * 1000;
          }
        });
      }, args.settingsLoadInterval * 1000);
    }

    view.__tryToLoadRemoteSettings();
  }

  view.addClientView = function(clientView)
  {
    view.add(clientView);
    clientViews.push(clientView);
  }

  view.refreshAds = function()
  {
    if (adsChanged)
    {
      adsChanged = false;
      _setAds();
      _resizeClients();
    }
  }

  view.refreshAdsFromRemoteSettings = function(doneCallback)
  {
    _loadRemoteAdSettings(function(e){
      if (e.success)
      {
        _saveSettings();

        if (e.changed)
        {
          adsChanged = true;
          view.refreshAds();
        }
      }

      if (typeof doneCallback != "undefined") doneCallback(e);
    });
  }

  view.resetSettings = function()
  {
    adsChanged = true;
    topAdEnabled = args.topAdEnabled;
    bottomAdEnabled = args.bottomAdEnabled;
    removeAdsIsPurchased = args.removeAdsIsPurchased;
    _saveSettings();
  }

  return view;
}