/*
 * Requres: underscore.js
 */

if (mym == undefined) mym = {};
if (mym.UI == undefined) mym.UI = {};

/**
 * Events
 */

// Constants
mym.UI.HudMessage = {
  INDICATOR: 0,
  TEXT: 1
}

mym.UI.createHudMessage = function(args)
{
  var view;

  function _init()
  {
    // Default args
    args = _.defaults(args || {}, {
      top: "auto",
      left: "auto",
      bottom: "auto",
      right: "auto",
      height: "auto",
      width: "auto",
      style: mym.UI.HudMessage.INDICATOR,
      zIndex: 1
    });

    view = Ti.UI.createView({
      top: args.top,
      left: args.left,
      bottom: args.bottom,
      right: args.right,
      width: args.width,
      height: args.height,
      backgroundColor: "transparent",
      zIndex: args.zIndex,
      opacity: 0
    });

    var bg;

    view.add(bg = Ti.UI.createView({
      top: args.top,
      left: args.left,
      bottom: args.bottom,
      right: args.right,
      width: args.width,
      height: args.height,
      backgroundColor: "black",
      borderRadius: 16,
      opacity: 0.5,
      zIndex: args.zIndex + 1
    }));

    if (args.style == mym.UI.HudMessage.INDICATOR)
    {
      bg.width = 70;
      bg.height = 70;
      var indicator = Ti.UI.createActivityIndicator({
        style: Titanium.UI.iPhone.ActivityIndicatorStyle.BIG,
        zIndex: args.zIndex + 2
      });
      view.add(indicator);
      indicator.show();
    }
  }

  _init();

  view.showHud = function()
  {
    view.show();
    view.animate({
      duration: 250,
      opacity: 1
    });
  }

  view.hideHud = function()
  {
    view.animate({
      opacity: 0,
      duration: 250
    }, function(){
      view.hide();
    });
  }

  return view;
}