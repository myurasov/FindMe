/**
 * Events:
 *
 */

Project.UI.createHelpWindow = function()
{
  var view;

  function _init()
  {
    view = Ti.UI.createWindow({
      title: "Help",
      barImage: "images/bar.png",
      barColor: Project.Config.get('_barColor'),
      backgroundColor: "red"
    });

    var webView;

    view.add(webView = Ti.UI.createWebView({
      url: "http://findme.ws/app-help.html",
      top: 0,
      left: 0,
      width: 320,
      height: 250,
      zIndex: 2
    }));

    webView.addEventListener("click", function(e){
      webView.url = "http://findme.ws/app-help.html?" + Math.random();
    });

    view.addEventListener("click", function(e){
      Ti.API.info('click'); // xxx
      webView.top = 0;
      webView.left = 0;
      webView.height = 250;
      webView.width = 320;
      webView.zIndex = 2;
      webView.show();
      webView.url = "http://findme.ws/app-help.html?" + Math.random();
    });

    view.addEventListener("open", function(e){
      Ti.API.info('open'); // xxx

      webView.top = 0;
      webView.left = 0;
      webView.height = 250;
      webView.width = 320;
      webView.zIndex = 2;
      webView.show();
      webView.url = "http://findme.ws/app-help.html?" + Math.random();
    });

    view.addEventListener("focus", function(e){
      Ti.API.info('focus'); // xxx

      webView.top = 0;
      webView.left = 0;
      webView.height = 250;
      webView.width = 320;
      webView.zIndex = 2;
      webView.show();
      webView.url = "http://findme.ws/app-help.html?" + Math.random();
    });
  }

  _init();
  return view;
}