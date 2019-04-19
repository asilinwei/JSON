var json_parse = (function() {
  "use strict";

  var text,
      at,
      ch;

  var escape = {
    '"': '"',
    '\\': '\\',
    '/': '/',
    'b': '\b',
    'f': '\f',
    'n': '\n',
    'r': '\r',
    't': '\t'
  };

  var error = function(message) {
    throw {
      type: 'SyntaxError',
      message: message,
      at: at - 1,
      input: text
    };
  };

  var next = function(c) {
    if (!ch) {
      error('Unexpected end of JSON input');
    }
    if (c && c !== ch) {
      error('Expected "' + c + '" instead of "' + ch + '" in JSON input');
    }
    ch = text[at++];
    return ch;
  };

  var white = function() {
    while (ch && (ch === '\u0009' || ch === '\u000d' || ch === '\u000a' || ch === '\u0020')) {
      next();
    }
  };

  var object = function() {
    var result = {};
    next('{');
    white();
    if (ch === ',') {
      error('Unexpected token "," in JSON input');
    }
    if (ch === '}') {
      next('}');
      return result;
    }
    while (ch) {
      var key = string();
      white();
      if (!ch) {
        error('Unexpected end of JSON input');
      }
      next(':');
      if (result.hasOwnProperty(key)) {
        error('Repeated key "' + key + '" in object');
      }
      result[key] = value();
      white();
      if (ch === '}') {
        next('}');
        return result;
      }
      if (!ch) {
        error('Unexpected end of JSON input');
      }
      next(',');
      white();
      if (!ch) {
        error('Unexpected end of JSON input');
      }
      if (ch === '}') {
        error('Unexpected token "}" in JSON input');
      }
    }
    error('Bad object');
  };

  var array = function() {
    var result = [];
    next('[');
    white();
    if (ch === ',') {
      error('Unexpected token "," in JSON input');
    }
    if (ch === ']') {
      next(']');
      return result;
    }
    while (ch) {
      result.push(value());
      white();
      if (ch === ']') {
        next(']');
        return result;
      }
      if (!ch) {
        error('Unexpected end of JSON input');
      }
      next(',');
      white();
      if (!ch) {
        error('Unexpected end of JSON input');
      }
      if (ch === ']') {
        error('Unexpected token "]" in JSON input');
      }
    }
    error('Bad array');
  };

  var string = function() {
    var result = '';
    if (ch === '"') {
      while (next()) {
        if (ch === '"') {
          next('"');
          return result;
        }
        if (ch === '\\') {
          next('\\');
          if (ch === 'u') {
            var uffff = 0;
            for (var i = 0; i < 4; i += 1) {
              var hex = parseInt(next(), 16);
              if (!isFinite(hex)) {
                error('Unexpected token "' + ch + '" in JSON input');
              }
              uffff = uffff * 16 + hex;
            }
            result += String.fromCharCode(uffff);
          } else if (escape[ch]) {
            result += escape[ch];
          } else {
            error('Unexpected token "' + ch + '" in JSON input');
          }
        } else if (ch >= '\u0020') {
          result += ch;
        } else {
          error('Unexpected token "' + ch + '" in JSON input');
        }
      }
      if (result) {
        error('Unexpected end of JSON input');
      }
    } else {
      error('Expected "\"" instead of "' + ch + '" in JSON input');
    }
    error('Bad string');
  };

  var number = function() {
    var result = '';
    if (ch === '-') {
      result += '-';
      next('-');
    }
    if (!ch) {
      error('Unexpected end of JSON input');
    }
    if (ch === '0') {
      result += '0';
      next('0');
      if (ch >= '0' && ch <= '9') {
        error('Unexpected token "' + ch + '" in JSON input');
      }
    } else if (ch >= '1' && ch <= '9') {
      while (ch >= '0' && ch <= '9') {
        result += ch;
        next();
      }
    } else {
      error('Unexpected token "' + ch + '" in JSON input');
    }
    if (ch === '.') {
      result += '.';
      next('.');
      if (!ch) {
        error('Unexpected end of JSON input');
      }
      if (ch >= '0' && ch <= '9') {
        while (ch >= '0' && ch <= '9') {
          result += ch;
          next();
        }
      } else {
        error('Unexpected token "' + ch + '" in JSON input');
      }
    } 
    if (ch === 'e' || ch === 'E') {
      result += ch;
      next();
      if (!ch) {
        error('Unexpected end of JSON input');
      }
      if (ch === '+' || ch === '-') {
        result += ch;
        next();
      }
      if (!ch) {
        error('Unexpected end of JSON input');
      }
      if (ch >= '0' && ch <= '9') {
        while (ch >= '0' && ch <= '9') {
          result += ch;
          next();
        }
      } else {
        error('Unexpected token "' + ch + '" in JSON input');
      }
    }
    result = +result;
    if (!isFinite(result)) {
      error('Bad number');
    }
    return result;
  };

  var word = function() {
    switch (ch) {
      case 't':
        next('t');
        next('r');
        next('u');
        next('e');
        return true;
      case 'f':
        next('f');
        next('a');
        next('l');
        next('s');
        next('e');
        return false;
      case 'n':
        next('n');
        next('u');
        next('l');
        next('l');
        return null;      
    }
    error('Unexpected token "' + ch + '" in JSON input');
  };

  var value = function() {
    white();
    if (!ch) {
      error('Unexpected end of JSON input');
    }
    switch (ch) {
      case '{':
        return object();
      case '[':
        return array();
      case '"':
        return string();
      case '-':
        return number();
      default:
        return ch >= '0' && ch <= '9' ? number() : word();        
    }
  };

  return function(source, reviver) {
    at = 0;
    text = String(source);
    ch = ' ';
    var result = value();
    white();
    if (ch) {
      error('Unexpected token "' + ch + '" in JSON input');
    }
    return typeof reviver === 'function'
      ? (function walk(object, key) {
          var value = object[key];
          if (typeof value === 'object' && value) {
            for (var k in value) {
              if (value.hasOwnProperty(k)) {
                var v = walk(value, k);
                if (v !== undefined) {
                  value[k] = v;
                } else {
                  delete value[k];
                }
              }
            }
          }
          return reviver.call(object, key, value);
        })({'': result}, '')
      : result;  
  };
})();