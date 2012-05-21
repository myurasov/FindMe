if (mym == undefined) mym = {};
if (mym.UI == undefined) mym.UI = {};

/**
 * Events
 *  _buy - buy link is clicked
 *  _load - ad is loaded
 */

/**
 * Version 0.3
 *
 * Supported orientations:
 *
 * iPhone - vertical
 * iPad - vertical & horizontal
 *
 * TODO: support for horizontal orientation
 * for iphone, orientation change
 */

// Constants
mym.UI.AdOverlay = {
  DOCK_TOP: "top",
  DOCK_BOTTOM: "bottom"
}

mym.UI.createAdOverlay = function(args)
{
  var view;
  var buyLinkContainer;

  var _utils = {
    isVerticalOrientation: function()
    {
      if (Ti.Gesture.orientation == 0
        || Ti.Gesture.orientation == Ti.UI.PORTRAIT
        || Ti.Gesture.orientation == Ti.UI.UPSIDE_PORTRAIT)
        {
        return true;
      }
      else if (Ti.Gesture.orientation == Ti.UI.LANDSCAPE_LEFT
        || Ti.Gesture.orientation == Ti.UI.LANDSCAPE_RIGHT)
        {
        return false;
      }
      else
      {
        return false;
      }
    },

    // http://developer.apple.com/library/ios/#documentation/UserExperience/Conceptual/iAd_Guide/
    // BannerAdvertisements/BannerAdvertisements.html#//apple_ref/doc/uid/TP40009881-CH3-SW5
    iAdSize: function(loaded, vertical)
    {
      if (typeof loaded == "undefined")
        loaded = true;

      var w = 0, h = 0;

      if (loaded)
      {
        if (vertical || mym.Utils.isVerticalOrientation())
        {
          if (Ti.Platform.osname == "ipad")
          {
            w = 766;
            h = 66;
          }
          else if (Ti.Platform.osname == "iphone")
          {
            w = 320;
            h = 50;
          }
        }
        else
        {
          if (Ti.Platform.osname == "ipad")
          {
            w = 1024;
            h = 66;
          }
          else if (Ti.Platform.osname == "iphone")
          {
            w = 480;
            h = 32;
          }
        }
      }

      return {
        width: w,
        height: h
      }
    }
  }

  function _init()
  {
    // Default args
    args = _.defaults(args || {}, {
      dock: mym.UI.AdOverlay.DOCK_TOP,
      showPlaceholderText: true
    });

    // !!! CHANGE THIS
    var iAdH = _utils.iAdSize(true, Ti.Platform.osname == "iphone" ? true : undefined).height;

    view = Ti.UI.createView({
      height: iAdH + 25,
      backgroundImage: "images/ad-overlay/" + Ti.Platform.osname + "-portrait-" + args.dock + ".png",
      width: "100%",
      left: 0,
      backgroundColor: "red"
    });

    //

    if (args.showPlaceholderText)
    {
      var adPlaceholder = Ti.UI.createLabel({
        height: iAdH,
        text: L("mym.UI.AdOverlay.advertisement", "ADVERTISEMENT"),
        font: {
            fontSize: 22,
            fontFamily: "Marker Felt",
            fontWeight: "bold"
          },
        textAlign: "center",
        opacity: 0.3
      });

      view.add(adPlaceholder);
    }

    //

    var iAd = Titanium.UI.iOS.createAdView({
      width: "auto",
      height: "auto"
    });

    view.add(iAd);

    //
    buyLinkContainer = Ti.UI.createView({
      height: 25
    })

    var buyLink = Ti.UI.createLabel({
      left: 25,
      height: 17,
      top: 4 - 1,
      text: L("mym.UI.AdOverlay.removeAds", "Remove Ads"),
      textAlign: "center",
      width: "auto",
      font: {
          fontSize: 16,
          fontFamily: "Helvetica Neue",
          fontWeight: "bold"
        },
        color: "#0457ff",
      backgroundTopCap: 5,
      backgroundLeftCap: 5,
      backgroundPaddingRight: 3 ,
      backgroundPaddingLeft: 3,
      backgroundPaddingTop: 0,
      backgroundPaddingBottom: 0
    });

    buyLinkContainer.width = buyLink.size.width + 50;

    var buyLinkSetPressed = function() {
      buyLink.backgroundImage = "images/ad-overlay/link-bg.png";
    }

    var buyLinkSetUnPressed = function() {
      buyLink.backgroundImage = null;
    }

    buyLinkContainer.left = (Titanium.Platform.displayCaps.platformWidth - buyLinkContainer.size.width) / 2;

    var buyLinkUnderline = Ti.UI.createView({
      backgroundColor: buyLink.color,
      height: 1,
      bottom: 2
    })

    buyLink.add(buyLinkUnderline);

    buyLinkContainer.add(buyLink);
    view.add(buyLinkContainer);

    buyLinkContainer.addEventListener("touchstart", buyLinkSetPressed);
    buyLinkContainer.addEventListener("touchcancel", buyLinkSetUnPressed);

    buyLinkContainer.addEventListener("touchend", function(e){

      buyLinkSetUnPressed();

      if (mym.Utils.eventIsInside(e))
      {
        view.fireEvent("_buy");
      }

    });

    buyLinkContainer.addEventListener("touchmove", function(e){

      if (mym.Utils.eventIsInside(e))
      {
        buyLinkSetPressed();
      }
      else
      {
        buyLinkSetUnPressed();
      }

    });

    //

    if (args.dock == mym.UI.AdOverlay.DOCK_TOP)
    {
      view.top = 0;
      if (args.showPlaceholderText) adPlaceholder.top = 0;
      iAd.top = -1 * iAdH;
      buyLinkContainer.bottom = 0;
      buyLink.top = 0;

      iAd.addEventListener("load", function(e){
        e.source.animate({
          top: 0
        });
        view.fireEvent("_load");
      });

      iAd.addEventListener("error", function(e){
        e.source.animate({
          top: -1 * iAdH
        })});
    }
    else if (args.dock == mym.UI.AdOverlay.DOCK_BOTTOM)
    {
      iAd.bottom = -1 * iAdH;
      view.bottom = 0;
      buyLinkContainer.top = 0;
      buyLink.bottom = 0;
      if (args.showPlaceholderText) adPlaceholder.bottom = 0;

      iAd.addEventListener("load", function(e){
        e.source.animate({
          bottom: 0
        });
        view.fireEvent("_load");
      });

      iAd.addEventListener("error", function(e){
        e.source.animate({
          bottom: -1 * iAdH
        })});
    }

  }

  _init();

  view.moveUI = function()
  {
    // !!! CHANGE THIS
    if (Ti.Platform.osname == "ipad")
    {
      buyLinkContainer.left = (Titanium.Platform.displayCaps.platformWidth - buyLinkContainer.size.width) / 2;
      view.backgroundImage = "images/ad-overlay/" + Ti.Platform.osname + "-" +
        (_utils.isVerticalOrientation() ? "portrait" : "landscape") + "-" + args.dock + ".png";
    }
  }

  return view;
}