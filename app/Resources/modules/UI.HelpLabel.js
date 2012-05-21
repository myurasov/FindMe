/**
 * Events:
 *
 */

Project.UI.createHelpLabel = function(args)
{
  var view;

  function _init()
  {
    // Default args
    args = _.defaults(args || {}, {
      lines: 1,
      text: '<args.text>'
    });

    view = Ti.UI.createView({
      height: args.lines * 20 + 8
    });

    view.add(Ti.UI.createLabel({
      top: 8,
      text: args.text,
      height: 20 * args.lines,
      font: {
        fontSize: 14,
        fontFamily: "Helvetica"
      },
      color: "#777",
      textAlign: "center",
      shadowColor: "#fff",
      shadowOffset: {
        x: 1,
        y: 1
      },
      zIndex: 1,
      width: 280
    }));
  }

  _init();
  return view;
}