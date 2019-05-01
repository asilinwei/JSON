var json_stringify = (function() {
  "use strict";

  var isArray = Array.isArray,
      hasOwnProperty = ({}).hasOwnProperty,
      toString = ({}).toString,
      isNaN = Number.isNaN,
      floor = Math.floor,
      abs = Math.abs;

  var count = -1;   

  var toInteger = function(value) {
    value = floor(value);
    return isNaN(value) ? 0 : value;
  };    

  var isPlainObject = function(value) {
    return toString.apply(value) === '[object Object]';
  };  

  var isStringObject = function(value) {
    return toString.apply(value) === '[object String]';
  }; 

  var isDate = function(value) {
    return toString.apply(value) === '[object Date]';
  };

  var isRegExp = function(value) {
    return toString.apply(value) === '[object RegExp]';
  }; 

  var object = function(value, indent) {
    var result = '{',
        pair = [];

    if (indent) {
      result += '\n' + indent;
      count += 1;
    }    
    for (var key in value) {
      if (hasOwnProperty.call(value, key)) {
        pair.push((indent ? indent.repeat(count) : '') + '"' + key + '":' + (indent ? ' ' : '') + str(value[key], indent));
      }
    }
    result += pair.join(',' + (indent ? '\n' + indent : ''));
    result += (indent ? '\n' + indent.repeat(count) : '') + '}';
    if (indent) {
      count -= 1;
    }
    return result;
  };

  var array = function(value, indent) {
    var result = '[',
        element = [];

    if (indent) {
      result += '\n' + indent;
      count += 1;
    }    
    value.forEach(function(e) {
      element.push((indent ? indent.repeat(count) : '') + str(e, indent));
    });    
    result += element.join(',' + (indent ? '\n' + indent : ''));
    result += (indent ? '\n' + indent.repeat(count) : '') + ']';
    if (indent) {
      count -= 1;
    }
    return result;
  };

  var string = function(value) {
    var match = value.match(/[\s\S]/gu) || [],
        length = match.length,
        result = '"';

    for (var i = 0; i < length; i += 1) {
      var char = match[i];
      if (char.length === 1 && char >= '\ud800' && char <= '\udfff') {
        result += '\\u' + char.codePointAt(0).toString(16);
      } else {
        result += char;
      }
    }        
    return result + '"';
  };

  var str = function(value, indent) {
    if (isNaN(value) || abs(value) === Infinity || value === null || typeof value === 'function') {
      return String(null);
    }
    if (isPlainObject(value)) {
      return object(value, indent);
    }
    if (isRegExp(value)) {
      return '{}';
    }
    if (typeof value === 'string' || isStringObject(value)) {
      return string(value);
    }
    if (isDate(value)) {
      return '"' + value.toISOString() + '"';
    }
    if (isArray(value)) {
      return array(value, indent);
    }
    return String(value);
  };   

  return function(value, space) {
    var indent = ' ';
    if (value === undefined || typeof value === 'function') {
      return undefined;
    }
    if (space === undefined) {
      space = 0;
    }
    return str(value, indent.repeat(toInteger(space)));
  };    
})();