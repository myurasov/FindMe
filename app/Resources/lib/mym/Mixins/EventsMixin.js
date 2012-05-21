/*
 * Ver. 1.1
 * May 1 2012
 */

if (typeof mym == "undefined") var mym = {};

mym.EventsMixin = function(obj)
{
  obj.listeners = {};

  /**
   * Add event listener
   * @return {int} id of the added listener
   */
  obj.addEventListener = function(eventName, listener, once)
  {
    once = once == undefined ? false : once;
    obj.listeners[eventName] = obj.listeners[eventName] || [];
    var id = obj.listeners[eventName].length;
    obj.listeners[eventName][id] = {once: once, listener: listener};
    return id;
  };

  /**
   * Remove event listener with specifiled id
   */
  obj.removeEventListener = function(eventName, id)
  {
    delete obj.listeners[eventName][id];
  };

  /**
   * Fire an event
   */
  obj.fireEvent = function(eventName, eventData)
  {
    obj.listeners[eventName] = obj.listeners[eventName] || [];

    for (var i in obj.listeners[eventName])
    {
      eventData = eventData || {};
      eventData.type = eventName;
      eventData.source = this;
      obj.listeners[eventName][i].listener(eventData);

      if (obj.listeners[eventName][i].once)
        obj.removeEventListener(eventName, i);
    }
  };
}