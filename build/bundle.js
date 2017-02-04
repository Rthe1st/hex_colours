(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * dat-gui JavaScript Controller Library
 * http://code.google.com/p/dat-gui
 *
 * Copyright 2011 Data Arts Team, Google Creative Lab
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 */

var common = require('../utils/common.js');
var toString = require('./toString.js');
var math = require('./math.js');
var interpret = require('./interpret.js');

module.exports = Color;

function Color() {

  this.__state = interpret.apply(this, arguments);

  if (this.__state === false) {
    throw 'Failed to interpret color arguments';
  }

  this.__state.a = this.__state.a || 1;
}

Color.COMPONENTS = ['r', 'g', 'b', 'h', 's', 'v', 'hex', 'a'];

common.extend(Color.prototype, {

  toString: function() {
    return toString(this);
  },

  toOriginal: function() {
    return this.__state.conversion.write(this);
  }

});

defineRGBComponent(Color.prototype, 'r', 2);
defineRGBComponent(Color.prototype, 'g', 1);
defineRGBComponent(Color.prototype, 'b', 0);

defineHSVComponent(Color.prototype, 'h');
defineHSVComponent(Color.prototype, 's');
defineHSVComponent(Color.prototype, 'v');

Object.defineProperty(Color.prototype, 'a', {

  get: function() {
    return this.__state.a;
  },

  set: function(v) {
    this.__state.a = v;
  }

});

Object.defineProperty(Color.prototype, 'hex', {

  get: function() {

    if (!this.__state.space !== 'HEX') {
      this.__state.hex = math.rgb_to_hex(this.r, this.g, this.b);
    }

    return this.__state.hex;

  },

  set: function(v) {

    this.__state.space = 'HEX';
    this.__state.hex = v;

  }

});

function defineRGBComponent(target, component, componentHexIndex) {

  Object.defineProperty(target, component, {

    get: function() {

      if (this.__state.space === 'RGB') {
        return this.__state[component];
      }

      recalculateRGB(this, component, componentHexIndex);

      return this.__state[component];

    },

    set: function(v) {

      if (this.__state.space !== 'RGB') {
        recalculateRGB(this, component, componentHexIndex);
        this.__state.space = 'RGB';
      }

      this.__state[component] = v;

    }

  });

}

function defineHSVComponent(target, component) {

  Object.defineProperty(target, component, {

    get: function() {

      if (this.__state.space === 'HSV')
        return this.__state[component];

      recalculateHSV(this);

      return this.__state[component];

    },

    set: function(v) {

      if (this.__state.space !== 'HSV') {
        recalculateHSV(this);
        this.__state.space = 'HSV';
      }

      this.__state[component] = v;

    }

  });

}

function recalculateRGB(color, component, componentHexIndex) {

  if (color.__state.space === 'HEX') {

    color.__state[component] = math.component_from_hex(color.__state.hex, componentHexIndex);

  } else if (color.__state.space === 'HSV') {

    common.extend(color.__state, math.hsv_to_rgb(color.__state.h, color.__state.s, color.__state.v));

  } else {

    throw 'Corrupted color state';

  }

}

function recalculateHSV(color) {

  var result = math.rgb_to_hsv(color.r, color.g, color.b);

  common.extend(color.__state, {
    s: result.s,
    v: result.v
  });

  if (!common.isNaN(result.h)) {
    color.__state.h = result.h;
  } else if (common.isUndefined(color.__state.h)) {
    color.__state.h = 0;
  }

}

},{"../utils/common.js":18,"./interpret.js":2,"./math.js":3,"./toString.js":4}],2:[function(require,module,exports){
/**
 * dat-gui JavaScript Controller Library
 * http://code.google.com/p/dat-gui
 *
 * Copyright 2011 Data Arts Team, Google Creative Lab
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 */

module.exports = createInterpert();

function createInterpert() {
  var common = require('../utils/common.js');
  var toString = require('./toString.js');

  var result, toReturn;

  var interpret = function() {

    toReturn = false;

    var original = arguments.length > 1 ? common.toArray(arguments) : arguments[0];

    common.each(INTERPRETATIONS, function(family) {

      if (family.litmus(original)) {

        common.each(family.conversions, function(conversion, conversionName) {

          result = conversion.read(original);

          if (toReturn === false && result !== false) {
            toReturn = result;
            result.conversionName = conversionName;
            result.conversion = conversion;
            return common.BREAK;

          }

        });

        return common.BREAK;

      }

    });

    return toReturn;

  };

  var INTERPRETATIONS = [

    // Strings
    {

      litmus: common.isString,

      conversions: {

        THREE_CHAR_HEX: {

          read: function(original) {

            var test = original.match(/^#([A-F0-9])([A-F0-9])([A-F0-9])$/i);
            if (test === null) return false;

            return {
              space: 'HEX',
              hex: parseInt(
                  '0x' +
                      test[1].toString() + test[1].toString() +
                      test[2].toString() + test[2].toString() +
                      test[3].toString() + test[3].toString())
            };

          },

          write: toString

        },

        SIX_CHAR_HEX: {

          read: function(original) {

            var test = original.match(/^#([A-F0-9]{6})$/i);
            if (test === null) return false;

            return {
              space: 'HEX',
              hex: parseInt('0x' + test[1].toString())
            };

          },

          write: toString

        },

        CSS_RGB: {

          read: function(original) {

            var test = original.match(/^rgb\(\s*(.+)\s*,\s*(.+)\s*,\s*(.+)\s*\)/);
            if (test === null) return false;

            return {
              space: 'RGB',
              r: parseFloat(test[1]),
              g: parseFloat(test[2]),
              b: parseFloat(test[3])
            };

          },

          write: toString

        },

        CSS_RGBA: {

          read: function(original) {

            var test = original.match(/^rgba\(\s*(.+)\s*,\s*(.+)\s*,\s*(.+)\s*\,\s*(.+)\s*\)/);
            if (test === null) return false;

            return {
              space: 'RGB',
              r: parseFloat(test[1]),
              g: parseFloat(test[2]),
              b: parseFloat(test[3]),
              a: parseFloat(test[4])
            };

          },

          write: toString

        }

      }

    },

    // Numbers
    {

      litmus: common.isNumber,

      conversions: {

        HEX: {
          read: function(original) {
            return {
              space: 'HEX',
              hex: original,
              conversionName: 'HEX'
            }
          },

          write: function(color) {
            return color.hex;
          }
        }

      }

    },

    // Arrays
    {

      litmus: common.isArray,

      conversions: {

        RGB_ARRAY: {
          read: function(original) {
            if (original.length != 3) return false;
            return {
              space: 'RGB',
              r: original[0],
              g: original[1],
              b: original[2]
            };
          },

          write: function(color) {
            return [color.r, color.g, color.b];
          }

        },

        RGBA_ARRAY: {
          read: function(original) {
            if (original.length != 4) return false;
            return {
              space: 'RGB',
              r: original[0],
              g: original[1],
              b: original[2],
              a: original[3]
            };
          },

          write: function(color) {
            return [color.r, color.g, color.b, color.a];
          }

        }

      }

    },

    // Objects
    {

      litmus: common.isObject,

      conversions: {

        RGBA_OBJ: {
          read: function(original) {
            if (common.isNumber(original.r) &&
                common.isNumber(original.g) &&
                common.isNumber(original.b) &&
                common.isNumber(original.a)) {
              return {
                space: 'RGB',
                r: original.r,
                g: original.g,
                b: original.b,
                a: original.a
              }
            }
            return false;
          },

          write: function(color) {
            return {
              r: color.r,
              g: color.g,
              b: color.b,
              a: color.a
            }
          }
        },

        RGB_OBJ: {
          read: function(original) {
            if (common.isNumber(original.r) &&
                common.isNumber(original.g) &&
                common.isNumber(original.b)) {
              return {
                space: 'RGB',
                r: original.r,
                g: original.g,
                b: original.b
              }
            }
            return false;
          },

          write: function(color) {
            return {
              r: color.r,
              g: color.g,
              b: color.b
            }
          }
        },

        HSVA_OBJ: {
          read: function(original) {
            if (common.isNumber(original.h) &&
                common.isNumber(original.s) &&
                common.isNumber(original.v) &&
                common.isNumber(original.a)) {
              return {
                space: 'HSV',
                h: original.h,
                s: original.s,
                v: original.v,
                a: original.a
              }
            }
            return false;
          },

          write: function(color) {
            return {
              h: color.h,
              s: color.s,
              v: color.v,
              a: color.a
            }
          }
        },

        HSV_OBJ: {
          read: function(original) {
            if (common.isNumber(original.h) &&
                common.isNumber(original.s) &&
                common.isNumber(original.v)) {
              return {
                space: 'HSV',
                h: original.h,
                s: original.s,
                v: original.v
              }
            }
            return false;
          },

          write: function(color) {
            return {
              h: color.h,
              s: color.s,
              v: color.v
            }
          }

        }

      }

    }


  ];

  return interpret;


}

},{"../utils/common.js":18,"./toString.js":4}],3:[function(require,module,exports){
/**
 * dat-gui JavaScript Controller Library
 * http://code.google.com/p/dat-gui
 *
 * Copyright 2011 Data Arts Team, Google Creative Lab
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 */

module.exports = math();

function math() {

  var tmpComponent;

  return {

    hsv_to_rgb: function(h, s, v) {

      var hi = Math.floor(h / 60) % 6;

      var f = h / 60 - Math.floor(h / 60);
      var p = v * (1.0 - s);
      var q = v * (1.0 - (f * s));
      var t = v * (1.0 - ((1.0 - f) * s));
      var c = [
        [v, t, p],
        [q, v, p],
        [p, v, t],
        [p, q, v],
        [t, p, v],
        [v, p, q]
      ][hi];

      return {
        r: c[0] * 255,
        g: c[1] * 255,
        b: c[2] * 255
      };

    },

    rgb_to_hsv: function(r, g, b) {

      var min = Math.min(r, g, b),
        max = Math.max(r, g, b),
        delta = max - min,
        h, s;

      if (max != 0) {
        s = delta / max;
      } else {
        return {
          h: NaN,
          s: 0,
          v: 0
        };
      }

      if (r == max) {
        h = (g - b) / delta;
      } else if (g == max) {
        h = 2 + (b - r) / delta;
      } else {
        h = 4 + (r - g) / delta;
      }
      h /= 6;
      if (h < 0) {
        h += 1;
      }

      return {
        h: h * 360,
        s: s,
        v: max / 255
      };
    },

    rgb_to_hex: function(r, g, b) {
      var hex = this.hex_with_component(0, 2, r);
      hex = this.hex_with_component(hex, 1, g);
      hex = this.hex_with_component(hex, 0, b);
      return hex;
    },

    component_from_hex: function(hex, componentIndex) {
      return (hex >> (componentIndex * 8)) & 0xFF;
    },

    hex_with_component: function(hex, componentIndex, value) {
      return value << (tmpComponent = componentIndex * 8) | (hex & ~(0xFF << tmpComponent));
    }

  };
}

},{}],4:[function(require,module,exports){
/**
 * dat-gui JavaScript Controller Library
 * http://code.google.com/p/dat-gui
 *
 * Copyright 2011 Data Arts Team, Google Creative Lab
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 */

var common = require('../utils/common.js');

module.exports = toString;

function toString(color) {

  if (color.a == 1 || common.isUndefined(color.a)) {

    var s = color.hex.toString(16);
    while (s.length < 6) {
      s = '0' + s;
    }

    return '#' + s;

  } else {

    return 'rgba(' + Math.round(color.r) + ',' + Math.round(color.g) + ',' + Math.round(color.b) + ',' + color.a + ')';

  }

}

},{"../utils/common.js":18}],5:[function(require,module,exports){
/**
 * dat-gui JavaScript Controller Library
 * http://code.google.com/p/dat-gui
 *
 * Copyright 2011 Data Arts Team, Google Creative Lab
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 */

var Controller = require('./Controller.js');
var common = require('../utils/common.js');
var dom = require('../dom/dom.js');

module.exports = BooleanController;

/**
 * @class Provides a checkbox input to alter the boolean property of an object.
 * @extends dat.controllers.Controller
 *
 * @param {Object} object The object to be manipulated
 * @param {string} property The name of the property to be manipulated
 *
 * @member dat.controllers
 */
function BooleanController(object, property) {

  BooleanController.superclass.call(this, object, property);

  var _this = this;
  this.__prev = this.getValue();

  this.__checkbox = document.createElement('input');
  this.__checkbox.setAttribute('type', 'checkbox');


  dom.bind(this.__checkbox, 'change', onChange, false);

  this.domElement.appendChild(this.__checkbox);

  // Match original value
  this.updateDisplay();

  function onChange() {
    _this.setValue(!_this.__prev);
  }

}

BooleanController.superclass = Controller;

common.extend(

  BooleanController.prototype,
  Controller.prototype,
  {
    setValue: function(v) {
      var toReturn = BooleanController.superclass.prototype.setValue.call(this, v);
      if (this.__onFinishChange) {
        this.__onFinishChange.call(this, this.getValue());
      }
      this.__prev = this.getValue();
      return toReturn;
    },

    updateDisplay: function() {

      if (this.getValue() === true) {
        this.__checkbox.setAttribute('checked', 'checked');
        this.__checkbox.checked = true;
      } else {
        this.__checkbox.checked = false;
      }

      return BooleanController.superclass.prototype.updateDisplay.call(this);

    }
  }
);

},{"../dom/dom.js":16,"../utils/common.js":18,"./Controller.js":7}],6:[function(require,module,exports){
/**
 * dat-gui JavaScript Controller Library
 * http://code.google.com/p/dat-gui
 *
 * Copyright 2011 Data Arts Team, Google Creative Lab
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 */

var Controller = require('./Controller.js');
var common = require('../utils/common.js');
var dom = require('../dom/dom.js');
var Color = require('../color/Color.js');
var interpret = require('../color/interpret.js');

module.exports = ColorController;

function ColorController(object, property) {

  ColorController.superclass.call(this, object, property);

  this.__color = new Color(this.getValue());
  this.__temp = new Color(0);

  var _this = this;

  this.domElement = document.createElement('div');

  dom.makeSelectable(this.domElement, false);

  this.__selector = document.createElement('div');
  this.__selector.className = 'selector';

  this.__saturation_field = document.createElement('div');
  this.__saturation_field.className = 'saturation-field';

  this.__field_knob = document.createElement('div');
  this.__field_knob.className = 'field-knob';
  this.__field_knob_border = '2px solid ';

  this.__hue_knob = document.createElement('div');
  this.__hue_knob.className = 'hue-knob';

  this.__hue_field = document.createElement('div');
  this.__hue_field.className = 'hue-field';

  this.__input = document.createElement('input');
  this.__input.type = 'text';
  this.__input_textShadow = '0 1px 1px ';

  dom.bind(this.__input, 'keydown', function(e) {
    if (e.keyCode === 13) { // on enter
      onBlur.call(this);
    }
  });

  dom.bind(this.__input, 'blur', onBlur);

  dom.bind(this.__selector, 'mousedown', function(e) {

    dom
      .addClass(this, 'drag')
      .bind(window, 'mouseup', function(e) {
        dom.removeClass(_this.__selector, 'drag');
      });

  });

  var value_field = document.createElement('div');

  common.extend(this.__selector.style, {
    width: '122px',
    height: '102px',
    padding: '3px',
    backgroundColor: '#222',
    boxShadow: '0px 1px 3px rgba(0,0,0,0.3)'
  });

  common.extend(this.__field_knob.style, {
    position: 'absolute',
    width: '12px',
    height: '12px',
    border: this.__field_knob_border + (this.__color.v < .5 ? '#fff' : '#000'),
    boxShadow: '0px 1px 3px rgba(0,0,0,0.5)',
    borderRadius: '12px',
    zIndex: 1
  });

  common.extend(this.__hue_knob.style, {
    position: 'absolute',
    width: '15px',
    height: '2px',
    borderRight: '4px solid #fff',
    zIndex: 1
  });

  common.extend(this.__saturation_field.style, {
    width: '100px',
    height: '100px',
    border: '1px solid #555',
    marginRight: '3px',
    display: 'inline-block',
    cursor: 'pointer'
  });

  common.extend(value_field.style, {
    width: '100%',
    height: '100%',
    background: 'none'
  });

  linearGradient(value_field, 'top', 'rgba(0,0,0,0)', '#000');

  common.extend(this.__hue_field.style, {
    width: '15px',
    height: '100px',
    display: 'inline-block',
    border: '1px solid #555',
    cursor: 'ns-resize'
  });

  hueGradient(this.__hue_field);

  common.extend(this.__input.style, {
    outline: 'none',
    //      width: '120px',
    textAlign: 'center',
    //      padding: '4px',
    //      marginBottom: '6px',
    color: '#fff',
    border: 0,
    fontWeight: 'bold',
    textShadow: this.__input_textShadow + 'rgba(0,0,0,0.7)'
  });

  dom.bind(this.__saturation_field, 'mousedown', fieldDown);
  dom.bind(this.__field_knob, 'mousedown', fieldDown);

  dom.bind(this.__hue_field, 'mousedown', function(e) {
    setH(e);
    dom.bind(window, 'mousemove', setH);
    dom.bind(window, 'mouseup', unbindH);
  });

  function fieldDown(e) {
    setSV(e);
    // document.body.style.cursor = 'none';
    dom.bind(window, 'mousemove', setSV);
    dom.bind(window, 'mouseup', unbindSV);
  }

  function unbindSV() {
    dom.unbind(window, 'mousemove', setSV);
    dom.unbind(window, 'mouseup', unbindSV);
    // document.body.style.cursor = 'default';
  }

  function onBlur() {
    var i = interpret(this.value);
    if (i !== false) {
      _this.__color.__state = i;
      _this.setValue(_this.__color.toOriginal());
    } else {
      this.value = _this.__color.toString();
    }
  }

  function unbindH() {
    dom.unbind(window, 'mousemove', setH);
    dom.unbind(window, 'mouseup', unbindH);
  }

  this.__saturation_field.appendChild(value_field);
  this.__selector.appendChild(this.__field_knob);
  this.__selector.appendChild(this.__saturation_field);
  this.__selector.appendChild(this.__hue_field);
  this.__hue_field.appendChild(this.__hue_knob);

  this.domElement.appendChild(this.__input);
  this.domElement.appendChild(this.__selector);

  this.updateDisplay();

  function setSV(e) {

    e.preventDefault();

    var w = dom.getWidth(_this.__saturation_field);
    var o = dom.getOffset(_this.__saturation_field);
    var s = (e.clientX - o.left + document.body.scrollLeft) / w;
    var v = 1 - (e.clientY - o.top + document.body.scrollTop) / w;

    if (v > 1) v = 1;
    else if (v < 0) v = 0;

    if (s > 1) s = 1;
    else if (s < 0) s = 0;

    _this.__color.v = v;
    _this.__color.s = s;

    _this.setValue(_this.__color.toOriginal());


    return false;

  }

  function setH(e) {

    e.preventDefault();

    var s = dom.getHeight(_this.__hue_field);
    var o = dom.getOffset(_this.__hue_field);
    var h = 1 - (e.clientY - o.top + document.body.scrollTop) / s;

    if (h > 1) h = 1;
    else if (h < 0) h = 0;

    _this.__color.h = h * 360;

    _this.setValue(_this.__color.toOriginal());

    return false;

  }

};

ColorController.superclass = Controller;

common.extend(

  ColorController.prototype,
  Controller.prototype,

  {

    updateDisplay: function() {

      var i = interpret(this.getValue());

      if (i !== false) {

        var mismatch = false;

        // Check for mismatch on the interpreted value.

        common.each(Color.COMPONENTS, function(component) {
          if (!common.isUndefined(i[component]) &&
            !common.isUndefined(this.__color.__state[component]) &&
            i[component] !== this.__color.__state[component]) {
            mismatch = true;
            return {}; // break
          }
        }, this);

        // If nothing diverges, we keep our previous values
        // for statefulness, otherwise we recalculate fresh
        if (mismatch) {
          common.extend(this.__color.__state, i);
        }

      }

      common.extend(this.__temp.__state, this.__color.__state);

      this.__temp.a = 1;

      var flip = (this.__color.v < .5 || this.__color.s > .5) ? 255 : 0;
      var _flip = 255 - flip;

      common.extend(this.__field_knob.style, {
        marginLeft: 100 * this.__color.s - 7 + 'px',
        marginTop: 100 * (1 - this.__color.v) - 7 + 'px',
        backgroundColor: this.__temp.toString(),
        border: this.__field_knob_border + 'rgb(' + flip + ',' + flip + ',' + flip + ')'
      });

      this.__hue_knob.style.marginTop = (1 - this.__color.h / 360) * 100 + 'px'

      this.__temp.s = 1;
      this.__temp.v = 1;

      linearGradient(this.__saturation_field, 'left', '#fff', this.__temp.toString());

      common.extend(this.__input.style, {
        backgroundColor: this.__input.value = this.__color.toString(),
        color: 'rgb(' + flip + ',' + flip + ',' + flip + ')',
        textShadow: this.__input_textShadow + 'rgba(' + _flip + ',' + _flip + ',' + _flip + ',.7)'
      });

    }

  }

);

var vendors = ['-moz-', '-o-', '-webkit-', '-ms-', ''];

function linearGradient(elem, x, a, b) {
  elem.style.background = '';
  common.each(vendors, function(vendor) {
    elem.style.cssText += 'background: ' + vendor + 'linear-gradient(' + x + ', ' + a + ' 0%, ' + b + ' 100%); ';
  });
}

function hueGradient(elem) {
  elem.style.background = '';
  elem.style.cssText += 'background: -moz-linear-gradient(top,  #ff0000 0%, #ff00ff 17%, #0000ff 34%, #00ffff 50%, #00ff00 67%, #ffff00 84%, #ff0000 100%);'
  elem.style.cssText += 'background: -webkit-linear-gradient(top,  #ff0000 0%,#ff00ff 17%,#0000ff 34%,#00ffff 50%,#00ff00 67%,#ffff00 84%,#ff0000 100%);'
  elem.style.cssText += 'background: -o-linear-gradient(top,  #ff0000 0%,#ff00ff 17%,#0000ff 34%,#00ffff 50%,#00ff00 67%,#ffff00 84%,#ff0000 100%);'
  elem.style.cssText += 'background: -ms-linear-gradient(top,  #ff0000 0%,#ff00ff 17%,#0000ff 34%,#00ffff 50%,#00ff00 67%,#ffff00 84%,#ff0000 100%);'
  elem.style.cssText += 'background: linear-gradient(top,  #ff0000 0%,#ff00ff 17%,#0000ff 34%,#00ffff 50%,#00ff00 67%,#ffff00 84%,#ff0000 100%);'
}

},{"../color/Color.js":1,"../color/interpret.js":2,"../dom/dom.js":16,"../utils/common.js":18,"./Controller.js":7}],7:[function(require,module,exports){
/**
 * dat-gui JavaScript Controller Library
 * http://code.google.com/p/dat-gui
 *
 * Copyright 2011 Data Arts Team, Google Creative Lab
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 */

var common = require('../utils/common.js');
var escape = require('../utils/escapeHtml.js');
module.exports = Controller;

/**
 * @class An "abstract" class that represents a given property of an object.
 *
 * @param {Object} object The object to be manipulated
 * @param {string} property The name of the property to be manipulated
 *
 * @member dat.controllers
 */
function Controller(object, property) {

  this.initialValue = object[property];

  /**
   * Those who extend this class will put their DOM elements in here.
   * @type {DOMElement}
   */
  this.domElement = document.createElement('div');

  /**
   * The object to manipulate
   * @type {Object}
   */
  this.object = object;

  /**
   * The name of the property to manipulate
   * @type {String}
   */
  this.property = property;

  /**
   * The function to be called on change.
   * @type {Function}
   * @ignore
   */
  this.__onChange = undefined;

  /**
   * The function to be called on finishing change.
   * @type {Function}
   * @ignore
   */
  this.__onFinishChange = undefined;

}

common.extend(

  Controller.prototype,

  /** @lends dat.controllers.Controller.prototype */
  {

    /**
     * Specify that a function fire every time someone changes the value with
     * this Controller.
     *
     * @param {Function} fnc This function will be called whenever the value
     * is modified via this Controller.
     * @returns {dat.controllers.Controller} this
     */
    onChange: function(fnc) {
      this.__onChange = fnc;
      return this;
    },

    /**
     * Specify that a function fire every time someone "finishes" changing
     * the value wih this Controller. Useful for values that change
     * incrementally like numbers or strings.
     *
     * @param {Function} fnc This function will be called whenever
     * someone "finishes" changing the value via this Controller.
     * @returns {dat.controllers.Controller} this
     */
    onFinishChange: function(fnc) {
      this.__onFinishChange = fnc;
      return this;
    },

    /**
     * Change the value of <code>object[property]</code>
     *
     * @param {Object} newValue The new value of <code>object[property]</code>
     */
    setValue: function(newValue) {
      this.object[this.property] = newValue;
      if (this.__onChange) {
        this.__onChange.call(this, newValue);
      }
      this.updateDisplay();
      return this;
    },

    /**
     * Gets the value of <code>object[property]</code>
     *
     * @returns {Object} The current value of <code>object[property]</code>
     */
    getValue: function() {
      return this.object[this.property];
    },

    /**
     * Refreshes the visual display of a Controller in order to keep sync
     * with the object's current value.
     * @returns {dat.controllers.Controller} this
     */
    updateDisplay: function() {
      return this;
    },

    /**
     * @returns {Boolean} true if the value has deviated from initialValue
     */
    isModified: function() {
      return this.initialValue !== this.getValue();
    }
  }

);


},{"../utils/common.js":18,"../utils/escapeHtml.js":20}],8:[function(require,module,exports){
/**
 * dat-gui JavaScript Controller Library
 * http://code.google.com/p/dat-gui
 *
 * Copyright 2011 Data Arts Team, Google Creative Lab
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 */

var Controller = require('./Controller.js');
var common = require('../utils/common.js');
var dom = require('../dom/dom.js');

module.exports = FunctionController;

/**
 * @class Provides a GUI interface to fire a specified method, a property of an object.
 *
 * @extends dat.controllers.Controller
 *
 * @param {Object} object The object to be manipulated
 * @param {string} property The name of the property to be manipulated
 *
 * @member dat.controllers
 */
function FunctionController(object, property, text) {

  FunctionController.superclass.call(this, object, property);

  var _this = this;

  this.__button = document.createElement('div');
  this.__button.innerHTML = text === undefined ? 'Fire' : text;
  dom.bind(this.__button, 'click', function(e) {
    e.preventDefault();
    _this.fire();
    return false;
  });

  dom.addClass(this.__button, 'button');

  this.domElement.appendChild(this.__button);

}

FunctionController.superclass = Controller;

common.extend(

  FunctionController.prototype,
  Controller.prototype, {

    fire: function() {
      if (this.__onChange) {
        this.__onChange.call(this);
      }
      this.getValue().call(this.object);
      if (this.__onFinishChange) {
        this.__onFinishChange.call(this, this.getValue());
      }
    }
  }

);

},{"../dom/dom.js":16,"../utils/common.js":18,"./Controller.js":7}],9:[function(require,module,exports){
/**
 * dat-gui JavaScript Controller Library
 * http://code.google.com/p/dat-gui
 *
 * Copyright 2011 Data Arts Team, Google Creative Lab
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 */

var Controller = require('./Controller.js');
var common = require('../utils/common.js');
module.exports = NumberController;

/**
 * @class Represents a given property of an object that is a number.
 *
 * @extends dat.controllers.Controller
 *
 * @param {Object} object The object to be manipulated
 * @param {string} property The name of the property to be manipulated
 * @param {Object} [params] Optional parameters
 * @param {Number} [params.min] Minimum allowed value
 * @param {Number} [params.max] Maximum allowed value
 * @param {Number} [params.step] Increment by which to change value
 *
 * @member dat.controllers
 */
function NumberController(object, property, params) {

  NumberController.superclass.call(this, object, property);

  params = params || {};

  this.__min = params.min;
  this.__max = params.max;
  this.__step = params.step;

  if (common.isUndefined(this.__step)) {

    if (this.initialValue == 0) {
      this.__impliedStep = 1; // What are we, psychics?
    } else {
      // Hey Doug, check this out.
      this.__impliedStep = Math.pow(10, Math.floor(Math.log(this.initialValue) / Math.LN10)) / 10;
    }

  } else {

    this.__impliedStep = this.__step;

  }

  this.__precision = numDecimals(this.__impliedStep);


}

NumberController.superclass = Controller;

common.extend(

  NumberController.prototype,
  Controller.prototype,

  /** @lends dat.controllers.NumberController.prototype */
  {

    setValue: function(v) {

      if (this.__min !== undefined && v < this.__min) {
        v = this.__min;
      } else if (this.__max !== undefined && v > this.__max) {
        v = this.__max;
      }

      if (this.__step !== undefined && v % this.__step != 0) {
        v = Math.round(v / this.__step) * this.__step;
      }

      return NumberController.superclass.prototype.setValue.call(this, v);

    },

    /**
     * Specify a minimum value for <code>object[property]</code>.
     *
     * @param {Number} minValue The minimum value for
     * <code>object[property]</code>
     * @returns {dat.controllers.NumberController} this
     */
    min: function(v) {
      this.__min = v;
      return this;
    },

    /**
     * Specify a maximum value for <code>object[property]</code>.
     *
     * @param {Number} maxValue The maximum value for
     * <code>object[property]</code>
     * @returns {dat.controllers.NumberController} this
     */
    max: function(v) {
      this.__max = v;
      return this;
    },

    /**
     * Specify a step value that dat.controllers.NumberController
     * increments by.
     *
     * @param {Number} stepValue The step value for
     * dat.controllers.NumberController
     * @default if minimum and maximum specified increment is 1% of the
     * difference otherwise stepValue is 1
     * @returns {dat.controllers.NumberController} this
     */
    step: function(v) {
      this.__step = v;
      this.__impliedStep = v;
      this.__precision = numDecimals(v);
      return this;
    }

  }

);

function numDecimals(x) {
  x = x.toString();
  if (x.indexOf('.') > -1) {
    return x.length - x.indexOf('.') - 1;
  } else {
    return 0;
  }
}

},{"../utils/common.js":18,"./Controller.js":7}],10:[function(require,module,exports){
/**
 * dat-gui JavaScript Controller Library
 * http://code.google.com/p/dat-gui
 *
 * Copyright 2011 Data Arts Team, Google Creative Lab
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 */

var NumberController = require('./NumberController.js');
var common = require('../utils/common.js');
var dom = require('../dom/dom.js');

module.exports = NumberControllerBox;

/**
 * @class Represents a given property of an object that is a number and
 * provides an input element with which to manipulate it.
 *
 * @extends dat.controllers.Controller
 * @extends dat.controllers.NumberController
 *
 * @param {Object} object The object to be manipulated
 * @param {string} property The name of the property to be manipulated
 * @param {Object} [params] Optional parameters
 * @param {Number} [params.min] Minimum allowed value
 * @param {Number} [params.max] Maximum allowed value
 * @param {Number} [params.step] Increment by which to change value
 *
 * @member dat.controllers
 */
function NumberControllerBox(object, property, params) {

  this.__truncationSuspended = false;

  NumberControllerBox.superclass.call(this, object, property, params);

  var _this = this;

  /**
   * {Number} Previous mouse y position
   * @ignore
   */
  var prev_y;

  this.__input = document.createElement('input');
  this.__input.setAttribute('type', 'text');

  // Makes it so manually specified values are not truncated.

  dom.bind(this.__input, 'change', onChange);
  dom.bind(this.__input, 'blur', onBlur);
  dom.bind(this.__input, 'mousedown', onMouseDown);
  dom.bind(this.__input, 'keydown', function(e) {

    // When pressing entire, you can be as precise as you want.
    if (e.keyCode === 13) {
      _this.__truncationSuspended = true;
      this.blur();
      _this.__truncationSuspended = false;
    }

  });

  function onChange() {
    var attempted = parseFloat(_this.__input.value);
    if (!common.isNaN(attempted)) _this.setValue(attempted);
  }

  function onBlur() {
    onChange();
    if (_this.__onFinishChange) {
      _this.__onFinishChange.call(_this, _this.getValue());
    }
  }

  function onMouseDown(e) {
    dom.bind(window, 'mousemove', onMouseDrag);
    dom.bind(window, 'mouseup', onMouseUp);
    prev_y = e.clientY;
  }

  function onMouseDrag(e) {

    var diff = prev_y - e.clientY;
    _this.setValue(_this.getValue() + diff * _this.__impliedStep);

    prev_y = e.clientY;

  }

  function onMouseUp() {
    dom.unbind(window, 'mousemove', onMouseDrag);
    dom.unbind(window, 'mouseup', onMouseUp);
  }

  this.updateDisplay();

  this.domElement.appendChild(this.__input);

}

NumberControllerBox.superclass = NumberController;

common.extend(

  NumberControllerBox.prototype,
  NumberController.prototype,

  {

    updateDisplay: function() {

      this.__input.value = this.__truncationSuspended ? this.getValue() : roundToDecimal(this.getValue(), this.__precision);
      return NumberControllerBox.superclass.prototype.updateDisplay.call(this);
    }

  }

);

function roundToDecimal(value, decimals) {
  var tenTo = Math.pow(10, decimals);
  return Math.round(value * tenTo) / tenTo;
}

},{"../dom/dom.js":16,"../utils/common.js":18,"./NumberController.js":9}],11:[function(require,module,exports){
/**
 * dat-gui JavaScript Controller Library
 * http://code.google.com/p/dat-gui
 *
 * Copyright 2011 Data Arts Team, Google Creative Lab
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 */

var NumberController = require('./NumberController.js');
var common = require('../utils/common.js');
var dom = require('../dom/dom.js');
var css = require('../utils/css.js');

var styleSheet = "/**\n * dat-gui JavaScript Controller Library\n * http://code.google.com/p/dat-gui\n *\n * Copyright 2011 Data Arts Team, Google Creative Lab\n *\n * Licensed under the Apache License, Version 2.0 (the \"License\");\n * you may not use this file except in compliance with the License.\n * You may obtain a copy of the License at\n *\n * http://www.apache.org/licenses/LICENSE-2.0\n */\n\n.slider {\n  box-shadow: inset 0 2px 4px rgba(0,0,0,0.15);\n  height: 1em;\n  border-radius: 1em;\n  background-color: #eee;\n  padding: 0 0.5em;\n  overflow: hidden;\n}\n\n.slider-fg {\n  padding: 1px 0 2px 0;\n  background-color: #aaa;\n  height: 1em;\n  margin-left: -0.5em;\n  padding-right: 0.5em;\n  border-radius: 1em 0 0 1em;\n}\n\n.slider-fg:after {\n  display: inline-block;\n  border-radius: 1em;\n  background-color: #fff;\n  border:  1px solid #aaa;\n  content: '';\n  float: right;\n  margin-right: -1em;\n  margin-top: -1px;\n  height: 0.9em;\n  width: 0.9em;\n}";
module.exports = NumberControllerSlider;

/**
 * @class Represents a given property of an object that is a number, contains
 * a minimum and maximum, and provides a slider element with which to
 * manipulate it. It should be noted that the slider element is made up of
 * <code>&lt;div&gt;</code> tags, <strong>not</strong> the html5
 * <code>&lt;slider&gt;</code> element.
 *
 * @extends dat.controllers.Controller
 * @extends dat.controllers.NumberController
 *
 * @param {Object} object The object to be manipulated
 * @param {string} property The name of the property to be manipulated
 * @param {Number} minValue Minimum allowed value
 * @param {Number} maxValue Maximum allowed value
 * @param {Number} stepValue Increment by which to change value
 *
 * @member dat.controllers
 */
function NumberControllerSlider(object, property, min, max, step) {

  NumberControllerSlider.superclass.call(this, object, property, {
    min: min,
    max: max,
    step: step
  });

  var _this = this;

  this.__background = document.createElement('div');
  this.__foreground = document.createElement('div');



  dom.bind(this.__background, 'mousedown', onMouseDown);

  dom.addClass(this.__background, 'slider');
  dom.addClass(this.__foreground, 'slider-fg');

  function onMouseDown(e) {

    dom.bind(window, 'mousemove', onMouseDrag);
    dom.bind(window, 'mouseup', onMouseUp);

    onMouseDrag(e);
  }

  function onMouseDrag(e) {

    e.preventDefault();

    var offset = dom.getOffset(_this.__background);
    var width = dom.getWidth(_this.__background);

    _this.setValue(
      map(e.clientX, offset.left, offset.left + width, _this.__min, _this.__max)
    );

    return false;

  }

  function onMouseUp() {
    dom.unbind(window, 'mousemove', onMouseDrag);
    dom.unbind(window, 'mouseup', onMouseUp);
    if (_this.__onFinishChange) {
      _this.__onFinishChange.call(_this, _this.getValue());
    }
  }

  this.updateDisplay();

  this.__background.appendChild(this.__foreground);
  this.domElement.appendChild(this.__background);

}

NumberControllerSlider.superclass = NumberController;

/**
 * Injects default stylesheet for slider elements.
 */
NumberControllerSlider.useDefaultStyles = function() {
  css.inject(styleSheet);
};

common.extend(

  NumberControllerSlider.prototype,
  NumberController.prototype,

  {

    updateDisplay: function() {
      var pct = (this.getValue() - this.__min) / (this.__max - this.__min);
      this.__foreground.style.width = pct * 100 + '%';
      return NumberControllerSlider.superclass.prototype.updateDisplay.call(this);
    }

  }



);

function map(v, i1, i2, o1, o2) {
  return o1 + (o2 - o1) * ((v - i1) / (i2 - i1));
}

},{"../dom/dom.js":16,"../utils/common.js":18,"../utils/css.js":19,"./NumberController.js":9}],12:[function(require,module,exports){
/**
 * dat-gui JavaScript Controller Library
 * http://code.google.com/p/dat-gui
 *
 * Copyright 2011 Data Arts Team, Google Creative Lab
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 */

var Controller = require('./Controller.js');
var dom = require('../dom/dom.js');
var common = require('../utils/common.js');

module.exports = OptionController;

/**
 * @class Provides a select input to alter the property of an object, using a
 * list of accepted values.
 *
 * @extends dat.controllers.Controller
 *
 * @param {Object} object The object to be manipulated
 * @param {string} property The name of the property to be manipulated
 * @param {Object|string[]} options A map of labels to acceptable values, or
 * a list of acceptable string values.
 *
 * @member dat.controllers
 */
function OptionController(object, property, options) {

  OptionController.superclass.call(this, object, property);

  var _this = this;

  /**
   * The drop down menu
   * @ignore
   */
  this.__select = document.createElement('select');

  if (common.isArray(options)) {
    var map = {};
    common.each(options, function(element) {
      map[element] = element;
    });
    options = map;
  }

  common.each(options, function(value, key) {

    var opt = document.createElement('option');
    opt.innerHTML = key;
    opt.setAttribute('value', value);
    _this.__select.appendChild(opt);

  });

  // Acknowledge original value
  this.updateDisplay();

  dom.bind(this.__select, 'change', function() {
    var desiredValue = this.options[this.selectedIndex].value;
    _this.setValue(desiredValue);
  });

  this.domElement.appendChild(this.__select);

}

OptionController.superclass = Controller;

common.extend(

  OptionController.prototype,
  Controller.prototype,

  {

    setValue: function(v) {
      var toReturn = OptionController.superclass.prototype.setValue.call(this, v);
      if (this.__onFinishChange) {
        this.__onFinishChange.call(this, this.getValue());
      }
      return toReturn;
    },

    updateDisplay: function() {
      this.__select.value = this.getValue();
      return OptionController.superclass.prototype.updateDisplay.call(this);
    }

  }

);

},{"../dom/dom.js":16,"../utils/common.js":18,"./Controller.js":7}],13:[function(require,module,exports){
/**
 * dat-gui JavaScript Controller Library
 * http://code.google.com/p/dat-gui
 *
 * Copyright 2011 Data Arts Team, Google Creative Lab
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 */

var Controller = require('./Controller.js');
var dom = require('../dom/dom.js');
var common = require('../utils/common.js');

module.exports = StringController;

/**
 * @class Provides a text input to alter the string property of an object.
 *
 * @extends dat.controllers.Controller
 *
 * @param {Object} object The object to be manipulated
 * @param {string} property The name of the property to be manipulated
 *
 * @member dat.controllers
 */
function StringController(object, property) {

  StringController.superclass.call(this, object, property);

  var _this = this;

  this.__input = document.createElement('input');
  this.__input.setAttribute('type', 'text');

  dom.bind(this.__input, 'keyup', onChange);
  dom.bind(this.__input, 'change', onChange);
  dom.bind(this.__input, 'blur', onBlur);
  dom.bind(this.__input, 'keydown', function(e) {
    if (e.keyCode === 13) {
      this.blur();
    }
  });


  function onChange() {
    _this.setValue(_this.__input.value);
  }

  function onBlur() {
    if (_this.__onFinishChange) {
      _this.__onFinishChange.call(_this, _this.getValue());
    }
  }

  this.updateDisplay();

  this.domElement.appendChild(this.__input);

};

StringController.superclass = Controller;

common.extend(

  StringController.prototype,
  Controller.prototype,

  {

    updateDisplay: function() {
      // Stops the caret from moving on account of:
      // keyup -> setValue -> updateDisplay
      if (!dom.isActive(this.__input)) {
        this.__input.value = this.getValue();
      }
      return StringController.superclass.prototype.updateDisplay.call(this);
    }

  }

);

},{"../dom/dom.js":16,"../utils/common.js":18,"./Controller.js":7}],14:[function(require,module,exports){
/**
 * dat-gui JavaScript Controller Library
 * http://code.google.com/p/dat-gui
 *
 * Copyright 2011 Data Arts Team, Google Creative Lab
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 */
var OptionController = require('./OptionController.js');
var NumberControllerBox = require('./NumberControllerBox.js');
var NumberControllerSlider = require('./NumberControllerSlider.js');
var StringController = require('./StringController.js');
var FunctionController = require('./FunctionController.js');
var BooleanController = require('./BooleanController.js');
var common = require('../utils/common.js');

module.exports = factory;

function factory(object, property) {

  var initialValue = object[property];

  // Providing options?
  if (common.isArray(arguments[2]) || common.isObject(arguments[2])) {
    return new OptionController(object, property, arguments[2]);
  }

  // Providing a map?

  if (common.isNumber(initialValue)) {

    if (common.isNumber(arguments[2]) && common.isNumber(arguments[3])) {

      // Has min and max.
      return new NumberControllerSlider(object, property, arguments[2], arguments[3]);

    } else {

      return new NumberControllerBox(object, property, {
        min: arguments[2],
        max: arguments[3]
      });

    }

  }

  if (common.isString(initialValue)) {
    return new StringController(object, property);
  }

  if (common.isFunction(initialValue)) {
    return new FunctionController(object, property, '');
  }

  if (common.isBoolean(initialValue)) {
    return new BooleanController(object, property);
  }

}

},{"../utils/common.js":18,"./BooleanController.js":5,"./FunctionController.js":8,"./NumberControllerBox.js":10,"./NumberControllerSlider.js":11,"./OptionController.js":12,"./StringController.js":13}],15:[function(require,module,exports){
/**
 * dat-gui JavaScript Controller Library
 * http://code.google.com/p/dat-gui
 *
 * Copyright 2011 Data Arts Team, Google Creative Lab
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 */

var common = require('../utils/common.js');
var dom = require('./dom.js');

module.exports = CenteredDiv;

function CenteredDiv() {

  this.backgroundElement = document.createElement('div');
  common.extend(this.backgroundElement.style, {
    backgroundColor: 'rgba(0,0,0,0.8)',
    top: 0,
    left: 0,
    display: 'none',
    zIndex: '1000',
    opacity: 0,
    WebkitTransition: 'opacity 0.2s linear',
    transition: 'opacity 0.2s linear'
  });

  dom.makeFullscreen(this.backgroundElement);
  this.backgroundElement.style.position = 'fixed';

  this.domElement = document.createElement('div');
  common.extend(this.domElement.style, {
    position: 'fixed',
    display: 'none',
    zIndex: '1001',
    opacity: 0,
    WebkitTransition: '-webkit-transform 0.2s ease-out, opacity 0.2s linear',
    transition: 'transform 0.2s ease-out, opacity 0.2s linear'
  });


  document.body.appendChild(this.backgroundElement);
  document.body.appendChild(this.domElement);

  var _this = this;
  dom.bind(this.backgroundElement, 'click', function() {
    _this.hide();
  });


};

CenteredDiv.prototype.show = function() {

  var _this = this;

  this.backgroundElement.style.display = 'block';

  this.domElement.style.display = 'block';
  this.domElement.style.opacity = 0;
  //    this.domElement.style.top = '52%';
  this.domElement.style.webkitTransform = 'scale(1.1)';

  this.layout();

  common.defer(function() {
    _this.backgroundElement.style.opacity = 1;
    _this.domElement.style.opacity = 1;
    _this.domElement.style.webkitTransform = 'scale(1)';
  });

};

CenteredDiv.prototype.hide = function() {

  var _this = this;

  var hide = function() {

    _this.domElement.style.display = 'none';
    _this.backgroundElement.style.display = 'none';

    dom.unbind(_this.domElement, 'webkitTransitionEnd', hide);
    dom.unbind(_this.domElement, 'transitionend', hide);
    dom.unbind(_this.domElement, 'oTransitionEnd', hide);

  };

  dom.bind(this.domElement, 'webkitTransitionEnd', hide);
  dom.bind(this.domElement, 'transitionend', hide);
  dom.bind(this.domElement, 'oTransitionEnd', hide);

  this.backgroundElement.style.opacity = 0;
  //    this.domElement.style.top = '48%';
  this.domElement.style.opacity = 0;
  this.domElement.style.webkitTransform = 'scale(1.1)';

};

CenteredDiv.prototype.layout = function() {
  this.domElement.style.left = window.innerWidth / 2 - dom.getWidth(this.domElement) / 2 + 'px';
  this.domElement.style.top = window.innerHeight / 2 - dom.getHeight(this.domElement) / 2 + 'px';
};

function lockScroll(e) {
  console.log(e);
}

},{"../utils/common.js":18,"./dom.js":16}],16:[function(require,module,exports){
/**
 * dat-gui JavaScript Controller Library
 * http://code.google.com/p/dat-gui
 *
 * Copyright 2011 Data Arts Team, Google Creative Lab
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 */

var common = require('../utils/common.js');

var EVENT_MAP = {
  'HTMLEvents': ['change'],
  'MouseEvents': ['click', 'mousemove', 'mousedown', 'mouseup', 'mouseover'],
  'KeyboardEvents': ['keydown']
};

var EVENT_MAP_INV = {};
common.each(EVENT_MAP, function(v, k) {
  common.each(v, function(e) {
    EVENT_MAP_INV[e] = k;
  });
});

var CSS_VALUE_PIXELS = /(\d+(\.\d+)?)px/;

function cssValueToPixels(val) {

  if (val === '0' || common.isUndefined(val)) return 0;

  var match = val.match(CSS_VALUE_PIXELS);

  if (!common.isNull(match)) {
    return parseFloat(match[1]);
  }

  // TODO ...ems? %?

  return 0;

}

/**
 * @namespace
 * @member dat.dom
 */
var dom = {

  /**
   *
   * @param elem
   * @param selectable
   */
  makeSelectable: function(elem, selectable) {

    if (elem === undefined || elem.style === undefined) return;

    elem.onselectstart = selectable ? function() {
      return false;
    } : function() {};

    elem.style.MozUserSelect = selectable ? 'auto' : 'none';
    elem.style.KhtmlUserSelect = selectable ? 'auto' : 'none';
    elem.unselectable = selectable ? 'on' : 'off';

  },

  /**
   *
   * @param elem
   * @param horizontal
   * @param vertical
   */
  makeFullscreen: function(elem, horizontal, vertical) {

    if (common.isUndefined(horizontal)) horizontal = true;
    if (common.isUndefined(vertical)) vertical = true;

    elem.style.position = 'absolute';

    if (horizontal) {
      elem.style.left = 0;
      elem.style.right = 0;
    }
    if (vertical) {
      elem.style.top = 0;
      elem.style.bottom = 0;
    }

  },

  /**
   *
   * @param elem
   * @param eventType
   * @param params
   */
  fakeEvent: function(elem, eventType, params, aux) {
    params = params || {};
    var className = EVENT_MAP_INV[eventType];
    if (!className) {
      throw new Error('Event type ' + eventType + ' not supported.');
    }
    var evt = document.createEvent(className);
    switch (className) {
      case 'MouseEvents':
        var clientX = params.x || params.clientX || 0;
        var clientY = params.y || params.clientY || 0;
        evt.initMouseEvent(eventType, params.bubbles || false,
          params.cancelable || true, window, params.clickCount || 1,
          0, //screen X
          0, //screen Y
          clientX, //client X
          clientY, //client Y
          false, false, false, false, 0, null);
        break;
      case 'KeyboardEvents':
        var init = evt.initKeyboardEvent || evt.initKeyEvent; // webkit || moz
        common.defaults(params, {
          cancelable: true,
          ctrlKey: false,
          altKey: false,
          shiftKey: false,
          metaKey: false,
          keyCode: undefined,
          charCode: undefined
        });
        init(eventType, params.bubbles || false,
          params.cancelable, window,
          params.ctrlKey, params.altKey,
          params.shiftKey, params.metaKey,
          params.keyCode, params.charCode);
        break;
      default:
        evt.initEvent(eventType, params.bubbles || false,
          params.cancelable || true);
        break;
    }
    common.defaults(evt, aux);
    elem.dispatchEvent(evt);
  },

  /**
   *
   * @param elem
   * @param event
   * @param func
   * @param bool
   */
  bind: function(elem, event, func, bool) {
    bool = bool || false;
    if (elem.addEventListener)
      elem.addEventListener(event, func, bool);
    else if (elem.attachEvent)
      elem.attachEvent('on' + event, func);
    return dom;
  },

  /**
   *
   * @param elem
   * @param event
   * @param func
   * @param bool
   */
  unbind: function(elem, event, func, bool) {
    bool = bool || false;
    if (elem.removeEventListener)
      elem.removeEventListener(event, func, bool);
    else if (elem.detachEvent)
      elem.detachEvent('on' + event, func);
    return dom;
  },

  /**
   *
   * @param elem
   * @param className
   */
  addClass: function(elem, className) {
    if (elem.className === undefined) {
      elem.className = className;
    } else if (elem.className !== className) {
      var classes = elem.className.split(/ +/);
      if (classes.indexOf(className) == -1) {
        classes.push(className);
        elem.className = classes.join(' ').replace(/^\s+/, '').replace(/\s+$/, '');
      }
    }
    return dom;
  },

  /**
   *
   * @param elem
   * @param className
   */
  removeClass: function(elem, className) {
    if (className) {
      if (elem.className === undefined) {
        // elem.className = className;
      } else if (elem.className === className) {
        elem.removeAttribute('class');
      } else {
        var classes = elem.className.split(/ +/);
        var index = classes.indexOf(className);
        if (index != -1) {
          classes.splice(index, 1);
          elem.className = classes.join(' ');
        }
      }
    } else {
      elem.className = undefined;
    }
    return dom;
  },

  hasClass: function(elem, className) {
    return new RegExp('(?:^|\\s+)' + className + '(?:\\s+|$)').test(elem.className) || false;
  },

  /**
   *
   * @param elem
   */
  getWidth: function(elem) {

    var style = getComputedStyle(elem);

    return cssValueToPixels(style['border-left-width']) +
      cssValueToPixels(style['border-right-width']) +
      cssValueToPixels(style['padding-left']) +
      cssValueToPixels(style['padding-right']) +
      cssValueToPixels(style['width']);
  },

  /**
   *
   * @param elem
   */
  getHeight: function(elem) {

    var style = getComputedStyle(elem);

    return cssValueToPixels(style['border-top-width']) +
      cssValueToPixels(style['border-bottom-width']) +
      cssValueToPixels(style['padding-top']) +
      cssValueToPixels(style['padding-bottom']) +
      cssValueToPixels(style['height']);
  },

  /**
   *
   * @param elem
   */
  getOffset: function(elem) {
    var offset = {
      left: 0,
      top: 0
    };
    if (elem.offsetParent) {
      do {
        offset.left += elem.offsetLeft;
        offset.top += elem.offsetTop;
      } while (elem = elem.offsetParent);
    }
    return offset;
  },

  // http://stackoverflow.com/posts/2684561/revisions
  /**
   *
   * @param elem
   */
  isActive: function(elem) {
    return elem === document.activeElement && (elem.type || elem.href);
  }

};

module.exports = dom;

},{"../utils/common.js":18}],17:[function(require,module,exports){
/**
 * dat-gui JavaScript Controller Library
 * http://code.google.com/p/dat-gui
 *
 * Copyright 2011 Data Arts Team, Google Creative Lab
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 */

var css = require('../utils/css.js');

var saveDialogueContents = "<div id=\"dg-save\" class=\"dg dialogue\">\n\n  Here's the new load parameter for your <code>GUI</code>'s constructor:\n\n  <textarea id=\"dg-new-constructor\"></textarea>\n\n  <div id=\"dg-save-locally\">\n\n    <input id=\"dg-local-storage\" type=\"checkbox\"/> Automatically save\n    values to <code>localStorage</code> on exit.\n\n    <div id=\"dg-local-explain\">The values saved to <code>localStorage</code> will\n      override those passed to <code>dat.GUI</code>'s constructor. This makes it\n      easier to work incrementally, but <code>localStorage</code> is fragile,\n      and your friends may not see the same values you do.\n      \n    </div>\n    \n  </div>\n\n</div>";
var styleSheet = ".dg {\n  /** Clear list styles */\n  /* Auto-place container */\n  /* Auto-placed GUI's */\n  /* Line items that don't contain folders. */\n  /** Folder names */\n  /** Hides closed items */\n  /** Controller row */\n  /** Name-half (left) */\n  /** Controller-half (right) */\n  /** Controller placement */\n  /** Shorter number boxes when slider is present. */\n  /** Ensure the entire boolean and function row shows a hand */ }\n  .dg ul {\n    list-style: none;\n    margin: 0;\n    padding: 0;\n    width: 100%;\n    clear: both; }\n  .dg.ac {\n    position: fixed;\n    top: 0;\n    left: 0;\n    right: 0;\n    height: 0;\n    z-index: 0; }\n  .dg:not(.ac) .main {\n    /** Exclude mains in ac so that we don't hide close button */\n    overflow: hidden; }\n  .dg.main {\n    -webkit-transition: opacity 0.1s linear;\n    -o-transition: opacity 0.1s linear;\n    -moz-transition: opacity 0.1s linear;\n    transition: opacity 0.1s linear; }\n    .dg.main.taller-than-window {\n      overflow-y: auto; }\n      .dg.main.taller-than-window .close-button {\n        opacity: 1;\n        /* TODO, these are style notes */\n        margin-top: -1px;\n        border-top: 1px solid #2c2c2c; }\n    .dg.main ul.closed .close-button {\n      opacity: 1 !important; }\n    .dg.main:hover .close-button,\n    .dg.main .close-button.drag {\n      opacity: 1; }\n    .dg.main .close-button {\n      /*opacity: 0;*/\n      -webkit-transition: opacity 0.1s linear;\n      -o-transition: opacity 0.1s linear;\n      -moz-transition: opacity 0.1s linear;\n      transition: opacity 0.1s linear;\n      border: 0;\n      position: absolute;\n      line-height: 19px;\n      height: 20px;\n      /* TODO, these are style notes */\n      cursor: pointer;\n      text-align: center;\n      background-color: #000; }\n      .dg.main .close-button:hover {\n        background-color: #111; }\n  .dg.a {\n    float: right;\n    margin-right: 15px;\n    overflow-x: hidden; }\n    .dg.a.has-save > ul {\n      margin-top: 27px; }\n      .dg.a.has-save > ul.closed {\n        margin-top: 0; }\n    .dg.a .save-row {\n      position: fixed;\n      top: 0;\n      z-index: 1002; }\n  .dg li {\n    -webkit-transition: height 0.1s ease-out;\n    -o-transition: height 0.1s ease-out;\n    -moz-transition: height 0.1s ease-out;\n    transition: height 0.1s ease-out; }\n  .dg li:not(.folder) {\n    cursor: auto;\n    height: 27px;\n    line-height: 27px;\n    overflow: hidden;\n    padding: 0 4px 0 5px; }\n  .dg li.folder {\n    padding: 0;\n    border-left: 4px solid rgba(0, 0, 0, 0); }\n  .dg li.title {\n    cursor: pointer;\n    margin-left: -4px; }\n  .dg .closed li:not(.title),\n  .dg .closed ul li,\n  .dg .closed ul li > * {\n    height: 0;\n    overflow: hidden;\n    border: 0; }\n  .dg .cr {\n    clear: both;\n    padding-left: 3px;\n    height: 27px; }\n  .dg .property-name {\n    cursor: default;\n    float: left;\n    clear: left;\n    width: 40%;\n    overflow: hidden;\n    text-overflow: ellipsis; }\n  .dg .c {\n    float: left;\n    width: 60%; }\n  .dg .c input[type=text] {\n    border: 0;\n    margin-top: 4px;\n    padding: 3px;\n    width: 100%;\n    float: right; }\n  .dg .has-slider input[type=text] {\n    width: 30%;\n    /*display: none;*/\n    margin-left: 0; }\n  .dg .slider {\n    float: left;\n    width: 66%;\n    margin-left: -5px;\n    margin-right: 0;\n    height: 19px;\n    margin-top: 4px; }\n  .dg .slider-fg {\n    height: 100%; }\n  .dg .c input[type=checkbox] {\n    margin-top: 9px; }\n  .dg .c select {\n    margin-top: 5px; }\n  .dg .cr.function,\n  .dg .cr.function .property-name,\n  .dg .cr.function *,\n  .dg .cr.boolean,\n  .dg .cr.boolean * {\n    cursor: pointer; }\n  .dg .selector {\n    display: none;\n    position: absolute;\n    margin-left: -9px;\n    margin-top: 23px;\n    z-index: 10; }\n  .dg .c:hover .selector,\n  .dg .selector.drag {\n    display: block; }\n  .dg li.save-row {\n    padding: 0; }\n    .dg li.save-row .button {\n      display: inline-block;\n      padding: 0px 6px; }\n  .dg.dialogue {\n    background-color: #222;\n    width: 460px;\n    padding: 15px;\n    font-size: 13px;\n    line-height: 15px; }\n\n/* TODO Separate style and structure */\n#dg-new-constructor {\n  padding: 10px;\n  color: #222;\n  font-family: Monaco, monospace;\n  font-size: 10px;\n  border: 0;\n  resize: none;\n  box-shadow: inset 1px 1px 1px #888;\n  word-wrap: break-word;\n  margin: 12px 0;\n  display: block;\n  width: 440px;\n  overflow-y: scroll;\n  height: 100px;\n  position: relative; }\n\n#dg-local-explain {\n  display: none;\n  font-size: 11px;\n  line-height: 17px;\n  border-radius: 3px;\n  background-color: #333;\n  padding: 8px;\n  margin-top: 10px; }\n  #dg-local-explain code {\n    font-size: 10px; }\n\n#dat-gui-save-locally {\n  display: none; }\n\n/** Main type */\n.dg {\n  color: #eee;\n  font: 11px 'Lucida Grande', sans-serif;\n  text-shadow: 0 -1px 0 #111;\n  /** Auto place */\n  /* Controller row, <li> */\n  /** Controllers */ }\n  .dg.main {\n    /** Scrollbar */ }\n    .dg.main::-webkit-scrollbar {\n      width: 5px;\n      background: #1a1a1a; }\n    .dg.main::-webkit-scrollbar-corner {\n      height: 0;\n      display: none; }\n    .dg.main::-webkit-scrollbar-thumb {\n      border-radius: 5px;\n      background: #676767; }\n  .dg li:not(.folder) {\n    background: #1a1a1a;\n    border-bottom: 1px solid #2c2c2c; }\n  .dg li.save-row {\n    line-height: 25px;\n    background: #dad5cb;\n    border: 0; }\n    .dg li.save-row select {\n      margin-left: 5px;\n      width: 108px; }\n    .dg li.save-row .button {\n      margin-left: 5px;\n      margin-top: 1px;\n      border-radius: 2px;\n      font-size: 9px;\n      line-height: 7px;\n      padding: 4px 4px 5px 4px;\n      background: #c5bdad;\n      color: #fff;\n      text-shadow: 0 1px 0 #b0a58f;\n      box-shadow: 0 -1px 0 #b0a58f;\n      cursor: pointer; }\n      .dg li.save-row .button.gears {\n        background: #c5bdad url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAANCAYAAAB/9ZQ7AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAQJJREFUeNpiYKAU/P//PwGIC/ApCABiBSAW+I8AClAcgKxQ4T9hoMAEUrxx2QSGN6+egDX+/vWT4e7N82AMYoPAx/evwWoYoSYbACX2s7KxCxzcsezDh3evFoDEBYTEEqycggWAzA9AuUSQQgeYPa9fPv6/YWm/Acx5IPb7ty/fw+QZblw67vDs8R0YHyQhgObx+yAJkBqmG5dPPDh1aPOGR/eugW0G4vlIoTIfyFcA+QekhhHJhPdQxbiAIguMBTQZrPD7108M6roWYDFQiIAAv6Aow/1bFwXgis+f2LUAynwoIaNcz8XNx3Dl7MEJUDGQpx9gtQ8YCueB+D26OECAAQDadt7e46D42QAAAABJRU5ErkJggg==) 2px 1px no-repeat;\n        height: 7px;\n        width: 8px; }\n      .dg li.save-row .button:hover {\n        background-color: #bab19e;\n        box-shadow: 0 -1px 0 #b0a58f; }\n  .dg li.folder {\n    border-bottom: 0; }\n  .dg li.title {\n    padding-left: 16px;\n    background: black url(data:image/gif;base64,R0lGODlhBQAFAJEAAP////Pz8////////yH5BAEAAAIALAAAAAAFAAUAAAIIlI+hKgFxoCgAOw==) 6px 10px no-repeat;\n    cursor: pointer;\n    border-bottom: 1px solid rgba(255, 255, 255, 0.2); }\n  .dg .closed li.title {\n    background-image: url(data:image/gif;base64,R0lGODlhBQAFAJEAAP////Pz8////////yH5BAEAAAIALAAAAAAFAAUAAAIIlGIWqMCbWAEAOw==); }\n  .dg .cr.boolean {\n    border-left: 3px solid #806787; }\n  .dg .cr.function {\n    border-left: 3px solid #e61d5f; }\n  .dg .cr.number {\n    border-left: 3px solid #2fa1d6; }\n    .dg .cr.number input[type=text] {\n      color: #2fa1d6; }\n  .dg .cr.string {\n    border-left: 3px solid #1ed36f; }\n    .dg .cr.string input[type=text] {\n      color: #1ed36f; }\n  .dg .cr.function:hover, .dg .cr.boolean:hover {\n    background: #111; }\n  .dg .c input[type=text] {\n    background: #303030;\n    outline: none; }\n    .dg .c input[type=text]:hover {\n      background: #3c3c3c; }\n    .dg .c input[type=text]:focus {\n      background: #494949;\n      color: #fff; }\n  .dg .c .slider {\n    background: #303030;\n    cursor: ew-resize; }\n  .dg .c .slider-fg {\n    background: #2fa1d6; }\n  .dg .c .slider:hover {\n    background: #3c3c3c; }\n    .dg .c .slider:hover .slider-fg {\n      background: #44abda; }\n";

var controllerFactory = require('../controllers/factory.js');
var Controller = require('../controllers/Controller.js');
var BooleanController = require('../controllers/BooleanController.js');
var FunctionController = require('../controllers/FunctionController.js');
var NumberControllerBox = require('../controllers/NumberControllerBox.js');
var NumberControllerSlider = require('../controllers/NumberControllerSlider.js');
var ColorController = require('../controllers/ColorController.js');

var raf = require('../utils/requestAnimationFrame.js');
var CenteredDiv = require('../dom/CenteredDiv.js');
var dom = require('../dom/dom.js');
var common = require('../utils/common.js');

module.exports = createGUI();

function createGUI() {

  css.inject(styleSheet);

  /** Outer-most className for GUI's */
  var CSS_NAMESPACE = 'dg';

  var HIDE_KEY_CODE = 72;

  /** The only value shared between the JS and SCSS. Use caution. */
  var CLOSE_BUTTON_HEIGHT = 20;

  var DEFAULT_DEFAULT_PRESET_NAME = 'Default';

  var SUPPORTS_LOCAL_STORAGE = (function() {
    try {
      return 'localStorage' in window && window['localStorage'] !== null;
    } catch (e) {
      return false;
    }
  })();

  var SAVE_DIALOGUE;

  /** Have we yet to create an autoPlace GUI? */
  var auto_place_virgin = true;

  /** Fixed position div that auto place GUI's go inside */
  var auto_place_container;

  /** Are we hiding the GUI's ? */
  var hide = false;

  /** GUI's which should be hidden */
  var hideable_guis = [];

  /**
   * A lightweight controller library for JavaScript. It allows you to easily
   * manipulate variables and fire functions on the fly.
   * @class
   *
   * @member dat.gui
   *
   * @param {Object} [params]
   * @param {String} [params.name] The name of this GUI.
   * @param {Object} [params.load] JSON object representing the saved state of
   * this GUI.
   * @param {Boolean} [params.auto=true]
   * @param {dat.gui.GUI} [params.parent] The GUI I'm nested in.
   * @param {Boolean} [params.closed] If true, starts closed
   */
  var GUI = function(params) {

    var _this = this;

    /**
     * Outermost DOM Element
     * @type DOMElement
     */
    this.domElement = document.createElement('div');
    this.__ul = document.createElement('ul');
    this.domElement.appendChild(this.__ul);

    dom.addClass(this.domElement, CSS_NAMESPACE);

    /**
     * Nested GUI's by name
     * @ignore
     */
    this.__folders = {};

    this.__controllers = [];

    /**
     * List of objects I'm remembering for save, only used in top level GUI
     * @ignore
     */
    this.__rememberedObjects = [];

    /**
     * Maps the index of remembered objects to a map of controllers, only used
     * in top level GUI.
     *
     * @private
     * @ignore
     *
     * @example
     * [
     *  {
     *    propertyName: Controller,
     *    anotherPropertyName: Controller
     *  },
     *  {
     *    propertyName: Controller
     *  }
     * ]
     */
    this.__rememberedObjectIndecesToControllers = [];

    this.__listening = [];

    params = params || {};

    // Default parameters
    params = common.defaults(params, {
      autoPlace: true,
      width: GUI.DEFAULT_WIDTH
    });

    params = common.defaults(params, {
      resizable: params.autoPlace,
      hideable: params.autoPlace
    });


    if (!common.isUndefined(params.load)) {

      // Explicit preset
      if (params.preset) params.load.preset = params.preset;

    } else {

      params.load = {
        preset: DEFAULT_DEFAULT_PRESET_NAME
      };

    }

    if (common.isUndefined(params.parent) && params.hideable) {
      hideable_guis.push(this);
    }

    // Only root level GUI's are resizable.
    params.resizable = common.isUndefined(params.parent) && params.resizable;


    if (params.autoPlace && common.isUndefined(params.scrollable)) {
      params.scrollable = true;
    }
    //    params.scrollable = common.isUndefined(params.parent) && params.scrollable === true;

    // Not part of params because I don't want people passing this in via
    // constructor. Should be a 'remembered' value.
    var use_local_storage =
      SUPPORTS_LOCAL_STORAGE &&
      localStorage.getItem(getLocalStorageHash(this, 'isLocal')) === 'true';

    var saveToLocalStorage;

    Object.defineProperties(this,

      /** @lends dat.gui.GUI.prototype */
      {

        /**
         * The parent <code>GUI</code>
         * @type dat.gui.GUI
         */
        parent: {
          get: function() {
            return params.parent;
          }
        },

        scrollable: {
          get: function() {
            return params.scrollable;
          }
        },

        /**
         * Handles <code>GUI</code>'s element placement for you
         * @type Boolean
         */
        autoPlace: {
          get: function() {
            return params.autoPlace;
          }
        },

        /**
         * The identifier for a set of saved values
         * @type String
         */
        preset: {

          get: function() {
            if (_this.parent) {
              return _this.getRoot().preset;
            } else {
              return params.load.preset;
            }
          },

          set: function(v) {
            if (_this.parent) {
              _this.getRoot().preset = v;
            } else {
              params.load.preset = v;
            }
            setPresetSelectIndex(this);
            _this.revert();
          }

        },

        /**
         * The width of <code>GUI</code> element
         * @type Number
         */
        width: {
          get: function() {
            return params.width;
          },
          set: function(v) {
            params.width = v;
            setWidth(_this, v);
          }
        },

        /**
         * The name of <code>GUI</code>. Used for folders. i.e
         * a folder's name
         * @type String
         */
        name: {
          get: function() {
            return params.name;
          },
          set: function(v) {
            // TODO Check for collisions among sibling folders
            params.name = v;
            if (title_row_name) {
              title_row_name.innerHTML = params.name;
            }
          }
        },

        /**
         * Whether the <code>GUI</code> is collapsed or not
         * @type Boolean
         */
        closed: {
          get: function() {
            return params.closed;
          },
          set: function(v) {
            params.closed = v;
            if (params.closed) {
              dom.addClass(_this.__ul, GUI.CLASS_CLOSED);
            } else {
              dom.removeClass(_this.__ul, GUI.CLASS_CLOSED);
            }
            // For browsers that aren't going to respect the CSS transition,
            // Lets just check our height against the window height right off
            // the bat.
            this.onResize();

            if (_this.__closeButton) {
              _this.__closeButton.innerHTML = v ? GUI.TEXT_OPEN : GUI.TEXT_CLOSED;
            }
          }
        },

        /**
         * Contains all presets
         * @type Object
         */
        load: {
          get: function() {
            return params.load;
          }
        },

        /**
         * Determines whether or not to use <a href="https://developer.mozilla.org/en/DOM/Storage#localStorage">localStorage</a> as the means for
         * <code>remember</code>ing
         * @type Boolean
         */
        useLocalStorage: {

          get: function() {
            return use_local_storage;
          },
          set: function(bool) {
            if (SUPPORTS_LOCAL_STORAGE) {
              use_local_storage = bool;
              if (bool) {
                dom.bind(window, 'unload', saveToLocalStorage);
              } else {
                dom.unbind(window, 'unload', saveToLocalStorage);
              }
              localStorage.setItem(getLocalStorageHash(_this, 'isLocal'), bool);
            }
          }

        }

      });

    // Are we a root level GUI?
    if (common.isUndefined(params.parent)) {

      params.closed = false;

      dom.addClass(this.domElement, GUI.CLASS_MAIN);
      dom.makeSelectable(this.domElement, false);

      // Are we supposed to be loading locally?
      if (SUPPORTS_LOCAL_STORAGE) {

        if (use_local_storage) {

          _this.useLocalStorage = true;

          var saved_gui = localStorage.getItem(getLocalStorageHash(this, 'gui'));

          if (saved_gui) {
            params.load = JSON.parse(saved_gui);
          }

        }

      }

      this.__closeButton = document.createElement('div');
      this.__closeButton.innerHTML = GUI.TEXT_CLOSED;
      dom.addClass(this.__closeButton, GUI.CLASS_CLOSE_BUTTON);
      this.domElement.appendChild(this.__closeButton);

      dom.bind(this.__closeButton, 'click', function() {

        _this.closed = !_this.closed;


      });


      // Oh, you're a nested GUI!
    } else {

      if (params.closed === undefined) {
        params.closed = true;
      }

      var title_row_name = document.createTextNode(params.name);
      dom.addClass(title_row_name, 'controller-name');

      var title_row = addRow(_this, title_row_name);

      var on_click_title = function(e) {
        e.preventDefault();
        _this.closed = !_this.closed;
        return false;
      };

      dom.addClass(this.__ul, GUI.CLASS_CLOSED);

      dom.addClass(title_row, 'title');
      dom.bind(title_row, 'click', on_click_title);

      if (!params.closed) {
        this.closed = false;
      }

    }

    if (params.autoPlace) {

      if (common.isUndefined(params.parent)) {

        if (auto_place_virgin) {
          auto_place_container = document.createElement('div');
          dom.addClass(auto_place_container, CSS_NAMESPACE);
          dom.addClass(auto_place_container, GUI.CLASS_AUTO_PLACE_CONTAINER);
          document.body.appendChild(auto_place_container);
          auto_place_virgin = false;
        }

        // Put it in the dom for you.
        auto_place_container.appendChild(this.domElement);

        // Apply the auto styles
        dom.addClass(this.domElement, GUI.CLASS_AUTO_PLACE);

      }


      // Make it not elastic.
      if (!this.parent) setWidth(_this, params.width);

    }

    dom.bind(window, 'resize', function() {
      _this.onResize()
    });
    dom.bind(this.__ul, 'webkitTransitionEnd', function() {
      _this.onResize();
    });
    dom.bind(this.__ul, 'transitionend', function() {
      _this.onResize()
    });
    dom.bind(this.__ul, 'oTransitionEnd', function() {
      _this.onResize()
    });
    this.onResize();


    if (params.resizable) {
      addResizeHandle(this);
    }

    saveToLocalStorage = function() {
      if (SUPPORTS_LOCAL_STORAGE && localStorage.getItem(getLocalStorageHash(_this, 'isLocal')) === 'true') {
        localStorage.setItem(getLocalStorageHash(_this, 'gui'), JSON.stringify(_this.getSaveObject()));
      }
    }

    // expose this method publicly
    this.saveToLocalStorageIfPossible = saveToLocalStorage;

    var root = _this.getRoot();

    function resetWidth() {
      var root = _this.getRoot();
      root.width += 1;
      common.defer(function() {
        root.width -= 1;
      });
    }

    if (!params.parent) {
      resetWidth();
    }

  };

  GUI.toggleHide = function() {

    hide = !hide;
    common.each(hideable_guis, function(gui) {
      gui.domElement.style.zIndex = hide ? -999 : 999;
      gui.domElement.style.opacity = hide ? 0 : 1;
    });
  };

  GUI.CLASS_AUTO_PLACE = 'a';
  GUI.CLASS_AUTO_PLACE_CONTAINER = 'ac';
  GUI.CLASS_MAIN = 'main';
  GUI.CLASS_CONTROLLER_ROW = 'cr';
  GUI.CLASS_TOO_TALL = 'taller-than-window';
  GUI.CLASS_CLOSED = 'closed';
  GUI.CLASS_CLOSE_BUTTON = 'close-button';
  GUI.CLASS_DRAG = 'drag';

  GUI.DEFAULT_WIDTH = 245;
  GUI.TEXT_CLOSED = 'Close Controls';
  GUI.TEXT_OPEN = 'Open Controls';

  dom.bind(window, 'keydown', function(e) {

    if (document.activeElement.type !== 'text' &&
      (e.which === HIDE_KEY_CODE || e.keyCode == HIDE_KEY_CODE)) {
      GUI.toggleHide();
    }

  }, false);

  common.extend(

    GUI.prototype,

    /** @lends dat.gui.GUI */
    {

      /**
       * @param object
       * @param property
       * @returns {dat.controllers.Controller} The new controller that was added.
       * @instance
       */
      add: function(object, property) {

        return add(
          this,
          object,
          property, {
            factoryArgs: Array.prototype.slice.call(arguments, 2)
          }
        );

      },

      /**
       * @param object
       * @param property
       * @returns {dat.controllers.ColorController} The new controller that was added.
       * @instance
       */
      addColor: function(object, property) {

        return add(
          this,
          object,
          property, {
            color: true
          }
        );

      },

      /**
       * @param controller
       * @instance
       */
      remove: function(controller) {

        // TODO listening?
        this.__ul.removeChild(controller.__li);
        this.__controllers.splice(this.__controllers.indexOf(controller), 1);
        var _this = this;
        common.defer(function() {
          _this.onResize();
        });

      },

      destroy: function() {

        if (this.autoPlace) {
          auto_place_container.removeChild(this.domElement);
        }

      },

      /**
       * @param name
       * @returns {dat.gui.GUI} The new folder.
       * @throws {Error} if this GUI already has a folder by the specified
       * name
       * @instance
       */
      addFolder: function(name) {

        // We have to prevent collisions on names in order to have a key
        // by which to remember saved values
        if (this.__folders[name] !== undefined) {
          throw new Error('You already have a folder in this GUI by the' +
            ' name "' + name + '"');
        }

        var new_gui_params = {
          name: name,
          parent: this
        };

        // We need to pass down the autoPlace trait so that we can
        // attach event listeners to open/close folder actions to
        // ensure that a scrollbar appears if the window is too short.
        new_gui_params.autoPlace = this.autoPlace;

        // Do we have saved appearance data for this folder?

        if (this.load && // Anything loaded?
          this.load.folders && // Was my parent a dead-end?
          this.load.folders[name]) { // Did daddy remember me?

          // Start me closed if I was closed
          new_gui_params.closed = this.load.folders[name].closed;

          // Pass down the loaded data
          new_gui_params.load = this.load.folders[name];

        }

        var gui = new GUI(new_gui_params);
        this.__folders[name] = gui;

        var li = addRow(this, gui.domElement);
        dom.addClass(li, 'folder');
        return gui;

      },

      removeFolder: function (name) {
        var folder = this.__folders[name];
        if (!folder) {
          return;
        }
        delete this.__folders[name];

        var childControllers = folder.__controllers;
        for (var i = 0; i < childControllers.length; ++i) {
          childControllers[i].remove();
        }

        var childFolders = Object.keys(folder.__folders || {});
        for (i  = 0; i < childFolders.length; ++i) {
          var childName = childFolders[i];
          folder.removeFolder(childName);
        }
        var liContainer = folder.domElement.parentNode;
        liContainer.parentNode.removeChild(liContainer);
      },

      open: function() {
        this.closed = false;
      },

      update: function () {
        updateAll(this);
      },

      close: function() {
        this.closed = true;
      },

      onResize: function() {

        var root = this.getRoot();

        if (root.scrollable) {

          var top = dom.getOffset(root.__ul).top;
          var h = 0;

          common.each(root.__ul.childNodes, function(node) {
            if (!(root.autoPlace && node === root.__save_row))
              h += dom.getHeight(node);
          });

          if (window.innerHeight - top - CLOSE_BUTTON_HEIGHT < h) {
            dom.addClass(root.domElement, GUI.CLASS_TOO_TALL);
            root.__ul.style.height = window.innerHeight - top - CLOSE_BUTTON_HEIGHT + 'px';
          } else {
            dom.removeClass(root.domElement, GUI.CLASS_TOO_TALL);
            root.__ul.style.height = 'auto';
          }

        }

        if (root.__resize_handle) {
          common.defer(function() {
            root.__resize_handle.style.height = root.__ul.offsetHeight + 'px';
          });
        }

        if (root.__closeButton) {
          root.__closeButton.style.width = root.width + 'px';
        }

      },

      /**
       * Mark objects for saving. The order of these objects cannot change as
       * the GUI grows. When remembering new objects, append them to the end
       * of the list.
       *
       * @param {Object...} objects
       * @throws {Error} if not called on a top level GUI.
       * @instance
       */
      remember: function() {

        if (common.isUndefined(SAVE_DIALOGUE)) {
          SAVE_DIALOGUE = new CenteredDiv();
          SAVE_DIALOGUE.domElement.innerHTML = saveDialogueContents;
        }

        if (this.parent) {
          throw new Error("You can only call remember on a top level GUI.");
        }

        var _this = this;

        common.each(Array.prototype.slice.call(arguments), function(object) {
          if (_this.__rememberedObjects.length == 0) {
            addSaveMenu(_this);
          }
          if (_this.__rememberedObjects.indexOf(object) == -1) {
            _this.__rememberedObjects.push(object);
          }
        });

        if (this.autoPlace) {
          // Set save row width
          setWidth(this, this.width);
        }

      },

      /**
       * @returns {dat.gui.GUI} the topmost parent GUI of a nested GUI.
       * @instance
       */
      getRoot: function() {
        var gui = this;
        while (gui.parent) {
          gui = gui.parent;
        }
        return gui;
      },

      /**
       * @returns {Object} a JSON object representing the current state of
       * this GUI as well as its remembered properties.
       * @instance
       */
      getSaveObject: function() {

        var toReturn = this.load;

        toReturn.closed = this.closed;

        // Am I remembering any values?
        if (this.__rememberedObjects.length > 0) {

          toReturn.preset = this.preset;

          if (!toReturn.remembered) {
            toReturn.remembered = {};
          }

          toReturn.remembered[this.preset] = getCurrentPreset(this);

        }

        toReturn.folders = {};
        common.each(this.__folders, function(element, key) {
          toReturn.folders[key] = element.getSaveObject();
        });

        return toReturn;

      },

      save: function() {

        if (!this.load.remembered) {
          this.load.remembered = {};
        }

        this.load.remembered[this.preset] = getCurrentPreset(this);
        markPresetModified(this, false);
        this.saveToLocalStorageIfPossible();

      },

      saveAs: function(presetName) {

        if (!this.load.remembered) {

          // Retain default values upon first save
          this.load.remembered = {};
          this.load.remembered[DEFAULT_DEFAULT_PRESET_NAME] = getCurrentPreset(this, true);

        }

        this.load.remembered[presetName] = getCurrentPreset(this);
        this.preset = presetName;
        addPresetOption(this, presetName, true);
        this.saveToLocalStorageIfPossible();

      },

      revert: function(gui) {

        common.each(this.__controllers, function(controller) {
          // Make revert work on Default.
          if (!this.getRoot().load.remembered) {
            controller.setValue(controller.initialValue);
          } else {
            recallSavedValue(gui || this.getRoot(), controller);
          }
        }, this);

        common.each(this.__folders, function(folder) {
          folder.revert(folder);
        });

        if (!gui) {
          markPresetModified(this.getRoot(), false);
        }


      },

      listen: function(controller) {

        var init = this.__listening.length == 0;
        this.__listening.push(controller);
        if (init) updateDisplays(this.__listening);

      }

    }

  );

  function add(gui, object, property, params) {

    if (object[property] === undefined) {
      throw new Error("Object " + object + " has no property \"" + property + "\"");
    }

    var controller;

    if (params.color) {
      controller = new ColorController(object, property);
    } else {
      var factoryArgs = [object, property].concat(params.factoryArgs);
      controller = controllerFactory.apply(gui, factoryArgs);
    }

    if (params.before instanceof Controller) {
      params.before = params.before.__li;
    }

    recallSavedValue(gui, controller);

    dom.addClass(controller.domElement, 'c');

    var name = document.createElement('span');
    dom.addClass(name, 'property-name');
    name.innerHTML = controller.property;

    var container = document.createElement('div');
    container.appendChild(name);
    container.appendChild(controller.domElement);

    var li = addRow(gui, container, params.before);

    dom.addClass(li, GUI.CLASS_CONTROLLER_ROW);
    dom.addClass(li, typeof controller.getValue());

    augmentController(gui, li, controller);

    gui.__controllers.push(controller);

    return controller;

  }

  /**
   * Add a row to the end of the GUI or before another row.
   *
   * @param gui
   * @param [dom] If specified, inserts the dom content in the new row
   * @param [liBefore] If specified, places the new row before another row
   */
  function addRow(gui, dom, liBefore) {
    var li = document.createElement('li');
    if (dom) li.appendChild(dom);
    if (liBefore) {
      gui.__ul.insertBefore(li, params.before);
    } else {
      gui.__ul.appendChild(li);
    }
    gui.onResize();
    return li;
  }

  function augmentController(gui, li, controller) {

    controller.__li = li;
    controller.__gui = gui;

    common.extend(controller, {

      options: function(options) {

        if (arguments.length > 1) {
          controller.remove();

          return add(
            gui,
            controller.object,
            controller.property, {
              before: controller.__li.nextElementSibling,
              factoryArgs: [common.toArray(arguments)]
            }
          );

        }

        if (common.isArray(options) || common.isObject(options)) {
          controller.remove();

          return add(
            gui,
            controller.object,
            controller.property, {
              before: controller.__li.nextElementSibling,
              factoryArgs: [options]
            }
          );

        }

      },

      name: function(v) {
        controller.__li.firstElementChild.firstElementChild.innerHTML = v;
        return controller;
      },

      listen: function() {
        controller.__gui.listen(controller);
        return controller;
      },

      remove: function() {
        controller.__gui.remove(controller);
        return controller;
      }

    });

    // All sliders should be accompanied by a box.
    if (controller instanceof NumberControllerSlider) {

      var box = new NumberControllerBox(controller.object, controller.property, {
        min: controller.__min,
        max: controller.__max,
        step: controller.__step
      });

      common.each(['updateDisplay', 'onChange', 'onFinishChange'], function(method) {
        var pc = controller[method];
        var pb = box[method];
        controller[method] = box[method] = function() {
          var args = Array.prototype.slice.call(arguments);
          pc.apply(controller, args);
          return pb.apply(box, args);
        }
      });

      dom.addClass(li, 'has-slider');
      controller.domElement.insertBefore(box.domElement, controller.domElement.firstElementChild);

    } else if (controller instanceof NumberControllerBox) {

      var r = function(returned) {

        // Have we defined both boundaries?
        if (common.isNumber(controller.__min) && common.isNumber(controller.__max)) {

          // Well, then lets just replace this with a slider.
          controller.remove();
          return add(
            gui,
            controller.object,
            controller.property, {
              before: controller.__li.nextElementSibling,
              factoryArgs: [controller.__min, controller.__max, controller.__step]
            });

        }

        return returned;

      };

      controller.min = common.compose(r, controller.min);
      controller.max = common.compose(r, controller.max);

    } else if (controller instanceof BooleanController) {

      dom.bind(li, 'click', function() {
        dom.fakeEvent(controller.__checkbox, 'click');
      });

      dom.bind(controller.__checkbox, 'click', function(e) {
        e.stopPropagation(); // Prevents double-toggle
      })

    } else if (controller instanceof FunctionController) {

      dom.bind(li, 'click', function() {
        dom.fakeEvent(controller.__button, 'click');
      });

      dom.bind(li, 'mouseover', function() {
        dom.addClass(controller.__button, 'hover');
      });

      dom.bind(li, 'mouseout', function() {
        dom.removeClass(controller.__button, 'hover');
      });

    } else if (controller instanceof ColorController) {

      dom.addClass(li, 'color');
      controller.updateDisplay = common.compose(function(r) {
        li.style.borderLeftColor = controller.__color.toString();
        return r;
      }, controller.updateDisplay);

      controller.updateDisplay();

    }

    controller.setValue = common.compose(function(r) {
      if (gui.getRoot().__preset_select && controller.isModified()) {
        markPresetModified(gui.getRoot(), true);
      }
      return r;
    }, controller.setValue);

  }

  function recallSavedValue(gui, controller) {

    // Find the topmost GUI, that's where remembered objects live.
    var root = gui.getRoot();

    // Does the object we're controlling match anything we've been told to
    // remember?
    var matched_index = root.__rememberedObjects.indexOf(controller.object);

    // Why yes, it does!
    if (matched_index != -1) {

      // Let me fetch a map of controllers for thcommon.isObject.
      var controller_map =
        root.__rememberedObjectIndecesToControllers[matched_index];

      // Ohp, I believe this is the first controller we've created for this
      // object. Lets make the map fresh.
      if (controller_map === undefined) {
        controller_map = {};
        root.__rememberedObjectIndecesToControllers[matched_index] =
          controller_map;
      }

      // Keep track of this controller
      controller_map[controller.property] = controller;

      // Okay, now have we saved any values for this controller?
      if (root.load && root.load.remembered) {

        var preset_map = root.load.remembered;

        // Which preset are we trying to load?
        var preset;

        if (preset_map[gui.preset]) {

          preset = preset_map[gui.preset];

        } else if (preset_map[DEFAULT_DEFAULT_PRESET_NAME]) {

          // Uhh, you can have the default instead?
          preset = preset_map[DEFAULT_DEFAULT_PRESET_NAME];

        } else {

          // Nada.

          return;

        }


        // Did the loaded object remember thcommon.isObject?
        if (preset[matched_index] &&

          // Did we remember this particular property?
          preset[matched_index][controller.property] !== undefined) {

          // We did remember something for this guy ...
          var value = preset[matched_index][controller.property];

          // And that's what it is.
          controller.initialValue = value;
          controller.setValue(value);

        }

      }

    }

  }

  function getLocalStorageHash(gui, key) {
    // TODO how does this deal with multiple GUI's?
    return document.location.href + '.' + key;

  }

  function addSaveMenu(gui) {

    var div = gui.__save_row = document.createElement('li');

    dom.addClass(gui.domElement, 'has-save');

    gui.__ul.insertBefore(div, gui.__ul.firstChild);

    dom.addClass(div, 'save-row');

    var gears = document.createElement('span');
    gears.innerHTML = '&nbsp;';
    dom.addClass(gears, 'button gears');

    // TODO replace with FunctionController
    var button = document.createElement('span');
    button.innerHTML = 'Save';
    dom.addClass(button, 'button');
    dom.addClass(button, 'save');

    var button2 = document.createElement('span');
    button2.innerHTML = 'New';
    dom.addClass(button2, 'button');
    dom.addClass(button2, 'save-as');

    var button3 = document.createElement('span');
    button3.innerHTML = 'Revert';
    dom.addClass(button3, 'button');
    dom.addClass(button3, 'revert');

    var select = gui.__preset_select = document.createElement('select');

    if (gui.load && gui.load.remembered) {

      common.each(gui.load.remembered, function(value, key) {
        addPresetOption(gui, key, key == gui.preset);
      });

    } else {
      addPresetOption(gui, DEFAULT_DEFAULT_PRESET_NAME, false);
    }

    dom.bind(select, 'change', function() {


      for (var index = 0; index < gui.__preset_select.length; index++) {
        gui.__preset_select[index].innerHTML = gui.__preset_select[index].value;
      }

      gui.preset = this.value;

    });

    div.appendChild(select);
    div.appendChild(gears);
    div.appendChild(button);
    div.appendChild(button2);
    div.appendChild(button3);

    if (SUPPORTS_LOCAL_STORAGE) {

      var saveLocally = document.getElementById('dg-save-locally');
      var explain = document.getElementById('dg-local-explain');

      saveLocally.style.display = 'block';

      var localStorageCheckBox = document.getElementById('dg-local-storage');

      if (localStorage.getItem(getLocalStorageHash(gui, 'isLocal')) === 'true') {
        localStorageCheckBox.setAttribute('checked', 'checked');
      }

      function showHideExplain() {
        explain.style.display = gui.useLocalStorage ? 'block' : 'none';
      }

      showHideExplain();

      // TODO: Use a boolean controller, fool!
      dom.bind(localStorageCheckBox, 'change', function() {
        gui.useLocalStorage = !gui.useLocalStorage;
        showHideExplain();
      });

    }

    var newConstructorTextArea = document.getElementById('dg-new-constructor');

    dom.bind(newConstructorTextArea, 'keydown', function(e) {
      if (e.metaKey && (e.which === 67 || e.keyCode == 67)) {
        SAVE_DIALOGUE.hide();
      }
    });

    dom.bind(gears, 'click', function() {
      newConstructorTextArea.innerHTML = JSON.stringify(gui.getSaveObject(), undefined, 2);
      SAVE_DIALOGUE.show();
      newConstructorTextArea.focus();
      newConstructorTextArea.select();
    });

    dom.bind(button, 'click', function() {
      gui.save();
    });

    dom.bind(button2, 'click', function() {
      var presetName = prompt('Enter a new preset name.');
      if (presetName) gui.saveAs(presetName);
    });

    dom.bind(button3, 'click', function() {
      gui.revert();
    });

    //    div.appendChild(button2);

  }

  function addResizeHandle(gui) {

    gui.__resize_handle = document.createElement('div');

    common.extend(gui.__resize_handle.style, {

      width: '6px',
      marginLeft: '-3px',
      height: '200px',
      cursor: 'ew-resize',
      position: 'absolute'
        //      border: '1px solid blue'

    });

    var pmouseX;

    dom.bind(gui.__resize_handle, 'mousedown', dragStart);
    dom.bind(gui.__closeButton, 'mousedown', dragStart);

    gui.domElement.insertBefore(gui.__resize_handle, gui.domElement.firstElementChild);

    function dragStart(e) {

      e.preventDefault();

      pmouseX = e.clientX;

      dom.addClass(gui.__closeButton, GUI.CLASS_DRAG);
      dom.bind(window, 'mousemove', drag);
      dom.bind(window, 'mouseup', dragStop);

      return false;

    }

    function drag(e) {

      e.preventDefault();

      gui.width += pmouseX - e.clientX;
      gui.onResize();
      pmouseX = e.clientX;

      return false;

    }

    function dragStop() {

      dom.removeClass(gui.__closeButton, GUI.CLASS_DRAG);
      dom.unbind(window, 'mousemove', drag);
      dom.unbind(window, 'mouseup', dragStop);

    }

  }

  function setWidth(gui, w) {
    gui.domElement.style.width = w + 'px';
    // Auto placed save-rows are position fixed, so we have to
    // set the width manually if we want it to bleed to the edge
    if (gui.__save_row && gui.autoPlace) {
      gui.__save_row.style.width = w + 'px';
    }
    if (gui.__closeButton) {
      gui.__closeButton.style.width = w + 'px';
    }
  }

  function getCurrentPreset(gui, useInitialValues) {

    var toReturn = {};

    // For each object I'm remembering
    common.each(gui.__rememberedObjects, function(val, index) {

      var saved_values = {};

      // The controllers I've made for thcommon.isObject by property
      var controller_map =
        gui.__rememberedObjectIndecesToControllers[index];

      // Remember each value for each property
      common.each(controller_map, function(controller, property) {
        saved_values[property] = useInitialValues ? controller.initialValue : controller.getValue();
      });

      // Save the values for thcommon.isObject
      toReturn[index] = saved_values;

    });

    return toReturn;

  }

  function addPresetOption(gui, name, setSelected) {
    var opt = document.createElement('option');
    opt.innerHTML = name;
    opt.value = name;
    gui.__preset_select.appendChild(opt);
    if (setSelected) {
      gui.__preset_select.selectedIndex = gui.__preset_select.length - 1;
    }
  }

  function setPresetSelectIndex(gui) {
    for (var index = 0; index < gui.__preset_select.length; index++) {
      if (gui.__preset_select[index].value == gui.preset) {
        gui.__preset_select.selectedIndex = index;
      }
    }
  }

  function markPresetModified(gui, modified) {
    var opt = gui.__preset_select[gui.__preset_select.selectedIndex];
    //    console.log('mark', modified, opt);
    if (modified) {
      opt.innerHTML = opt.value + "*";
    } else {
      opt.innerHTML = opt.value;
    }
  }

  function updateDisplays(controllerArray) {


    if (controllerArray.length != 0) {

      raf(function() {
        updateDisplays(controllerArray);
      });

    }

    common.each(controllerArray, function(c) {
      c.updateDisplay();
    });

  }

  function updateAll(root) {
    // Iterate over all controllers
    updateControllers(root.__controllers);
    Object.keys(root.__folders).forEach(function(key) {
      updateAll(root.__folders[key]);
    });
  }

  function updateControllers(controllers) {
    for (var i in controllers) {
      controllers[i].updateDisplay();
    }
  }

  return GUI;
}

},{"../controllers/BooleanController.js":5,"../controllers/ColorController.js":6,"../controllers/Controller.js":7,"../controllers/FunctionController.js":8,"../controllers/NumberControllerBox.js":10,"../controllers/NumberControllerSlider.js":11,"../controllers/factory.js":14,"../dom/CenteredDiv.js":15,"../dom/dom.js":16,"../utils/common.js":18,"../utils/css.js":19,"../utils/requestAnimationFrame.js":21}],18:[function(require,module,exports){
/**
 * dat-gui JavaScript Controller Library
 * http://code.google.com/p/dat-gui
 *
 * Copyright 2011 Data Arts Team, Google Creative Lab
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 */

module.exports = common();

function common() {

  var ARR_EACH = Array.prototype.forEach;
  var ARR_SLICE = Array.prototype.slice;

  /**
   * Band-aid methods for things that should be a lot easier in JavaScript.
   * Implementation and structure inspired by underscore.js
   * http://documentcloud.github.com/underscore/
   */

  return {

    BREAK: {},

    extend: function(target) {

      this.each(ARR_SLICE.call(arguments, 1), function(obj) {

        for (var key in obj)
          if (!this.isUndefined(obj[key]))
            target[key] = obj[key];

      }, this);

      return target;

    },

    defaults: function(target) {

      this.each(ARR_SLICE.call(arguments, 1), function(obj) {

        for (var key in obj)
          if (this.isUndefined(target[key]))
            target[key] = obj[key];

      }, this);

      return target;

    },

    compose: function() {
      var toCall = ARR_SLICE.call(arguments);
            return function() {
              var args = ARR_SLICE.call(arguments);
              for (var i = toCall.length -1; i >= 0; i--) {
                args = [toCall[i].apply(this, args)];
              }
              return args[0];
            };
    },

    each: function(obj, itr, scope) {

      if (!obj) return;

      if (ARR_EACH && obj.forEach && obj.forEach === ARR_EACH) {

        obj.forEach(itr, scope);

      } else if (obj.length === obj.length + 0) { // Is number but not NaN

        for (var key = 0, l = obj.length; key < l; key++)
          if (key in obj && itr.call(scope, obj[key], key) === this.BREAK)
            return;

      } else {

        for (var key in obj)
          if (itr.call(scope, obj[key], key) === this.BREAK)
            return;

      }

    },

    defer: function(fnc) {
      setTimeout(fnc, 0);
    },

    toArray: function(obj) {
      if (obj.toArray) return obj.toArray();
      return ARR_SLICE.call(obj);
    },

    isUndefined: function(obj) {
      return obj === undefined;
    },

    isNull: function(obj) {
      return obj === null;
    },

    isNaN: function(obj) {
      return obj !== obj;
    },

    isArray: Array.isArray || function(obj) {
      return obj.constructor === Array;
    },

    isObject: function(obj) {
      return obj === Object(obj);
    },

    isNumber: function(obj) {
      return obj === obj+0;
    },

    isString: function(obj) {
      return obj === obj+'';
    },

    isBoolean: function(obj) {
      return obj === false || obj === true;
    },

    isFunction: function(obj) {
      return Object.prototype.toString.call(obj) === '[object Function]';
    }

  };
}

},{}],19:[function(require,module,exports){
/**
 * dat-gui JavaScript Controller Library
 * http://code.google.com/p/dat-gui
 *
 * Copyright 2011 Data Arts Team, Google Creative Lab
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 */
module.exports = css();

function css() {
  return {
    load: function (url, doc) {
      doc = doc || document;
      var link = doc.createElement('link');
      link.type = 'text/css';
      link.rel = 'stylesheet';
      link.href = url;
      doc.getElementsByTagName('head')[0].appendChild(link);
    },
    inject: function(css, doc) {
      doc = doc || document;
      var injected = document.createElement('style');
      injected.type = 'text/css';
      injected.innerHTML = css;
      doc.getElementsByTagName('head')[0].appendChild(injected);
    }
  };
}

},{}],20:[function(require,module,exports){
module.exports = escape;

var entityMap = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': '&quot;',
  "'": '&#39;',
  "/": '&#x2F;'
};

function escape(string) {
  return String(string).replace(/[&<>"'\/]/g, function(s) {
    return entityMap[s];
  });
}

},{}],21:[function(require,module,exports){
/**
 * dat-gui JavaScript Controller Library
 * http://code.google.com/p/dat-gui
 *
 * Copyright 2011 Data Arts Team, Google Creative Lab
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 */
module.exports = raf();

function raf() {

  /**
   * requirejs version of Paul Irish's RequestAnimationFrame
   * http://paulirish.com/2011/requestanimationframe-for-smart-animating/
   */

  return window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      window.oRequestAnimationFrame ||
      window.msRequestAnimationFrame ||
      function(callback, element) {

        window.setTimeout(callback, 1000 / 60);

      };
}

},{}],22:[function(require,module,exports){
/** @license
 * dat-gui JavaScript Controller Library
 * http://code.google.com/p/dat-gui
 *
 * Copyright 2011 Data Arts Team, Google Creative Lab
 * Copyright 2015 Andrei Kashcha
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 */
module.exports = {
  color: {
    math: require('./dat/color/math.js'),
    interpret: require('./dat/color/interpret.js'),
    Color: require('./dat/color/Color.js')
  },
  dom: {
    dom: require('./dat/dom/dom.js')
  },
  controllers: {
    Controller: require('./dat/controllers/Controller.js'),
    BooleanController: require('./dat/controllers/BooleanController.js'),
    OptionController: require('./dat/controllers/OptionController.js'),
    StringController: require('./dat/controllers/StringController.js'),
    NumberController: require('./dat/controllers/NumberController.js'),
    NumberControllerBox: require('./dat/controllers/NumberControllerBox.js'),
    NumberControllerSlider: require('./dat/controllers/NumberControllerSlider.js'),
    FunctionController: require('./dat/controllers/FunctionController.js'),
    ColorController: require('./dat/controllers/ColorController.js'),
  },
  gui: {
    GUI: require('./dat/gui/GUI.js')
  },
  GUI: require('./dat/gui/GUI.js')
};

},{"./dat/color/Color.js":1,"./dat/color/interpret.js":2,"./dat/color/math.js":3,"./dat/controllers/BooleanController.js":5,"./dat/controllers/ColorController.js":6,"./dat/controllers/Controller.js":7,"./dat/controllers/FunctionController.js":8,"./dat/controllers/NumberController.js":9,"./dat/controllers/NumberControllerBox.js":10,"./dat/controllers/NumberControllerSlider.js":11,"./dat/controllers/OptionController.js":12,"./dat/controllers/StringController.js":13,"./dat/dom/dom.js":16,"./dat/gui/GUI.js":17}],23:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.relativeScaledHexPoints = relativeScaledHexPoints;
function relativeScaledHexPoints(sideLength) {
    var corner_vertical = Math.sin(Math.PI / 3) * sideLength;
    var corner_horizontal = Math.cos(Math.PI / 3) * sideLength;
    return [{ x: -corner_horizontal, y: -corner_vertical }, { x: +corner_horizontal, y: -corner_vertical }, { x: sideLength, y: 0 }, { x: +corner_horizontal, y: +corner_vertical }, { x: -corner_horizontal, y: +corner_vertical }, { x: -sideLength, y: 0 }];
}

},{}],24:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.getAdjacentHexagonOffset = getAdjacentHexagonOffset;
exports.getAdjacentHexagonCord = getAdjacentHexagonCord;
function getAdjacentHexagonOffset(gridX, side) {
    //even column: odd column: (a means adjacent, * means not)
    //*a*          aaa
    //aha          aha
    //aaa          *a*
    var diagonalYAbove = 1 - gridX % 2;
    var diagonalYBelow = -gridX % 2;
    //assumes side 0 is top, increasing clockwise
    var adjacentHexOffset = [{ x: 0, y: -1 }, { x: 1, y: diagonalYBelow }, { x: 1, y: diagonalYAbove }, { x: 0, y: 1 }, { x: -1, y: diagonalYAbove }, { x: -1, y: diagonalYBelow }];
    return adjacentHexOffset[side];
}

function getAdjacentHexagonCord(cord) {
    var offset = getAdjacentHexagonOffset(cord.x, cord.side);
    return {
        x: cord.x + offset.x,
        y: cord.y + offset.y,
        side: (cord.side + 3) % 6
    };
}

},{}],25:[function(require,module,exports){
"use strict";

var _exdat = require("exdat");

var dat = _interopRequireWildcard(_exdat);

var _hexagon = require("./views/hexagon.js");

var _combinedSide = require("./views/combinedSide.js");

var _board = require("./views/board.js");

var _board2 = require("./models/board.js");

var _teamInfo = require("./teamInfo.js");

var teamInfo = _interopRequireWildcard(_teamInfo);

var _sideGeneration = require("./sideGeneration.js");

var sideGeneration = _interopRequireWildcard(_sideGeneration);

var _SingleSide = require("./views/SingleSide.js");

var _combinedSide2 = require("./models/combinedSide.js");

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

//browserify doesn't like dat.gui, plus I don't think the repos from the maintainer anyway
function createBoard(game, dataString) {
    if (dataString === undefined) {
        var generationFunction = sideGeneration.mappingForDatGui.get(globalParams.sideGeneration);
        dataString = generationFunction(teamInfo.teams, globalParams.gridWidth, globalParams.gridHeight);
    }
    var boardModel = new _board2.Board(dataString);
    globalParams.dataString = boardModel.dataString;
    globalParams.sideGeneration = "dataString";
    var boardView = new _board.Board(game, 0, 0, boardModel, game.settingsGui);
    game.add.existing(boardView);
    game.boardView = boardView;
} //if we want to pack phaser in the build
//import Phaser from "Phaser";
//hack cause https://github.com/photonstorm/phaser/issues/2424
//window.PIXI = require( 'phaser/build/custom/pixi' );
//window.p2 = require( 'phaser/build/custom/p2' );
//window.Phaser = require( 'phaser/build/custom/phaser-split' );

var globalParams = {
    width: window.innerWidth,
    height: window.innerHeight,
    gridWidth: 2,
    gridHeight: 2,
    sideGeneration: "random", //be nice to store function directly here but doesn't play nice with dat-gui,
    dashBoardWidth: window.innerWidth / 10
};

function globalSettingsGui(settingsGui, game) {
    var graphicsFolder = settingsGui.addFolder('main graphics');
    graphicsFolder.addColor(game.stage, 'backgroundColor');
    graphicsFolder.add(globalParams, 'width', 0, window.innerWidth).onFinishChange(function (newWidth) {
        game.scale.setGameSize(newWidth, game.height);
        game.boardView.updateSideLength();
    });
    graphicsFolder.add(globalParams, 'height', 0, window.innerHeight).onFinishChange(function (newHeight) {
        game.scale.setGameSize(game.width, newHeight);
        game.boardView.updateSideLength();
    });
    var mapFolder = settingsGui.addFolder('map setup');
    mapFolder.add(globalParams, 'gridWidth', 0).step(1);
    mapFolder.add(globalParams, 'gridHeight', 0).step(1);
    mapFolder.add(globalParams, 'sideGeneration', ["random", "even", "dataString"]).listen().onFinishChange(function (genMethod) {
        game.boardView.destroy();
        createBoard(game);
    });
    //this cant point to board.dataString because dat-gui doesn't work with getters/setters
    mapFolder.add(globalParams, 'dataString').listen().onFinishChange(function (newDataString) {
        game.boardView.destroy();
        createBoard(game, newDataString);
    });
}

function onCreate(game) {
    game.stage.backgroundColor = "#666666"; //consider grey because less contrast
    var settingsGui = new dat.GUI();
    game.settingsGui = settingsGui;
    createBoard(game);
    (0, _combinedSide2.combinedSideGameSettingsGui)(settingsGui);
    globalSettingsGui(settingsGui, game);
    (0, _board.boardSettingsGui)(settingsGui, game);
    (0, _hexagon.hexagonSettingsGui)(settingsGui);
    (0, _combinedSide.combinedSideSettingsGui)(settingsGui);
    teamInfo.teamInfoSettingsGui(settingsGui);
    (0, _SingleSide.singleSideSettingsGui)(settingsGui);
}
function update(game) {}
window.onload = function () {
    var game = new Phaser.Game(globalParams.width, globalParams.height, Phaser.CANVAS, "phaser_parent", { create: onCreate, update: update });
};

},{"./models/board.js":27,"./models/combinedSide.js":28,"./sideGeneration.js":31,"./teamInfo.js":32,"./views/SingleSide.js":33,"./views/board.js":34,"./views/combinedSide.js":35,"./views/hexagon.js":37,"exdat":22}],26:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var SingleSide = exports.SingleSide = function () {
    function SingleSide(team, hex, board) {
        _classCallCheck(this, SingleSide);

        this.team = team;
        this.hex = hex;
        this.board = board;
    }

    _createClass(SingleSide, [{
        key: "onInputOver",
        value: function onInputOver(combinedSideView, pointer) {
            this.board.selectSection(this);
            this.selected = true;
        }
    }, {
        key: "onInputOut",
        value: function onInputOut(combinedSideView, pointer) {
            this.selected = false;
        }
    }, {
        key: "x",
        get: function get() {
            return this.hex.gridCords.x;
        }
    }, {
        key: "y",
        get: function get() {
            return this.hex.gridCords.y;
        }
    }, {
        key: "side",
        get: function get() {
            return this.hex.sideNumber(this);
        }
    }, {
        key: "cords",
        get: function get() {
            return { x: this.x, y: this.y, side: this.side };
        }
    }, {
        key: "asString",
        get: function get() {
            return this.team.number;
        }
    }]);

    return SingleSide;
}();

},{}],27:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Board = undefined;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _hexagon = require("./hexagon.js");

var _combinedSide = require("./combinedSide.js");

var _teamInfo = require("../teamInfo.js");

var teamInfo = _interopRequireWildcard(_teamInfo);

var _gridNavigation = require("../gridNavigation.js");

var gridNavigation = _interopRequireWildcard(_gridNavigation);

var _score = require("../score.js");

var score = _interopRequireWildcard(_score);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Board = exports.Board = function () {
    //passing in x is even more reason to make this a phaser object
    function Board(dataString) {
        _classCallCheck(this, Board);

        this.hexagons = this.parseDataString(dataString);
        this.combinedSides = this.createCombinedLines(this.hexagons);
    }

    _createClass(Board, [{
        key: "getHex",
        value: function getHex(x, y) {
            if (!this.hexagonExists(x, y)) {
                return undefined;
            } else {
                return this.hexagons[x][y];
            }
        }
    }, {
        key: "selectSection",
        value: function selectSection(singleSide) {
            var connectionSet = score.getConnectionSet(singleSide, singleSide.team, this);
            this.selected = connectionSet;
        }
    }, {
        key: "teamHighlight",
        value: function teamHighlight(team) {
            this.selected = score.allTeamScore(this, team);
        }
    }, {
        key: "getCombinedSide",
        value: function getCombinedSide(combinedSideCord) {
            //any combinedSide has 2 valid cords, one for each (x,y,side) that make it up
            //really we want a Map class with custom equality operator from combinedSideCord
            var otherCord = gridNavigation.getAdjacentHexagonCord(combinedSideCord);
            var _arr = [combinedSideCord, otherCord];
            for (var _i = 0; _i < _arr.length; _i++) {
                var potentialCord = _arr[_i];
                var row = this.combinedSides.get(potentialCord.x);
                if (row !== undefined) {
                    var hex = row.get(potentialCord.y);
                    if (hex !== undefined) {
                        var combinedSide = hex.get(potentialCord.side);
                        if (combinedSide !== undefined) {
                            return combinedSide;
                        }
                    }
                }
            }
            return undefined;
        }
    }, {
        key: "hexagonExists",
        value: function hexagonExists(x, y) {
            if (x < 0) {
                return false;
            } else if (x >= this.hexagons.length) {
                return false;
            } else if (y < 0) {
                return false;
            } else if (y >= this.hexagons[x].length) {
                return false;
            } else {
                return true;
            }
        }
    }, {
        key: "moveToAdjacentCombinedSide",
        value: function moveToAdjacentCombinedSide(combinedSideCord, direction) {
            /*returns co-ordinates of an adjacent combinedSide
            this works by looking at a combined side as having 4 neighbouring combinedSides
            these look like a bowtie:
             \-1             +1  /
              \                 /
               \               /
                ---------------
               /  [supplied     \
              /    hexagon       \
             / -2   side]      +2 \
             This example would be if side=0 was supplied.
             Direction denotes which spoke (-2,-1,+1,+2) you're asking about.
             the numbering is relative, so spokes -2 and +2 are always sides of the central hexagon
             even as side number changes.
             */
            var newCord = void 0;
            if (direction === -2) {
                newCord = {
                    x: combinedSideCord.x,
                    y: combinedSideCord.y,
                    side: (combinedSideCord.side - 1 + 6) % 6 //+6 to stop negaatives
                };
            } else if (direction === +2) {
                newCord = {
                    x: combinedSideCord.x,
                    y: combinedSideCord.y,
                    side: (combinedSideCord.side + 1) % 6
                };
            } else if (direction === -1) {
                newCord = gridNavigation.getAdjacentHexagonCord(combinedSideCord);
                newCord.side = (newCord.side + 1) % 6;
            } else if (direction === +1) {
                newCord = gridNavigation.getAdjacentHexagonCord(combinedSideCord);
                newCord.side = (newCord.side - 1 + 6) % 6; //+6 to stop negaatives
            } else {
                throw new Error("invalid direction supplied " + direction);
            }

            return this.getCombinedSide(newCord);
        }

        //could this be simplified if we stuck an extra boarder of "non-move" hexagons round the edge?
        //to make side calcs simplifer

    }, {
        key: "createCombinedLines",
        value: function createCombinedLines(hexagons) {
            var combinedSides = new Map();
            for (var x = 0; x < hexagons.length; x++) {
                combinedSides.set(x, new Map());
                for (var y = 0; y < hexagons[x].length; y++) {
                    combinedSides.get(x).set(y, new Map());
                    var centerHexagon = hexagons[x][y];
                    for (var sideNumber = 0; sideNumber < 6; sideNumber++) {
                        var hexInfo = [{
                            hexagon: centerHexagon,
                            side: sideNumber
                        }];
                        var hexagon2Coordinates = gridNavigation.getAdjacentHexagonCord({ x: x, y: y, side: sideNumber });
                        var hexagon2Exists = this.hexagonExists(hexagon2Coordinates.x, hexagon2Coordinates.y);
                        //sides numbered above 3 are covered when we iterate over the other hexagon (so we don't create every combine twice)
                        if (!hexagon2Exists || sideNumber < 3) {
                            if (hexagon2Exists) {
                                hexInfo.push({
                                    hexagon: hexagons[hexagon2Coordinates.x][hexagon2Coordinates.y],
                                    side: (sideNumber + 3) % 6
                                });
                            }
                            var combinedSide = new _combinedSide.CombinedSide({ x: x, y: y, side: sideNumber }, this);
                            combinedSides.get(x).get(y).set(sideNumber, combinedSide);
                        }
                    }
                }
            }
            return combinedSides;
        }

        //is this better defined as hexagon class method?

    }, {
        key: "hexagonInput",
        value: function hexagonInput(clickedHexagon) {
            teamInfo.makeMove();
            clickedHexagon.data.model.rotate(1);
            if (teamInfo.endOfRound()) {
                var _iteratorNormalCompletion = true;
                var _didIteratorError = false;
                var _iteratorError = undefined;

                try {
                    for (var _iterator = teamInfo.teams[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                        var team = _step.value;

                        team.score += score.allTeamScore(this, team).score;
                    }
                } catch (err) {
                    _didIteratorError = true;
                    _iteratorError = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion && _iterator.return) {
                            _iterator.return();
                        }
                    } finally {
                        if (_didIteratorError) {
                            throw _iteratorError;
                        }
                    }
                }
            }
        }
    }, {
        key: "parseDataString",
        value: function parseDataString(string) {
            var hexagons = [];
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = string.split("r").entries()[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var _step2$value = _slicedToArray(_step2.value, 2),
                        x = _step2$value[0],
                        rowData = _step2$value[1];

                    var row = [];
                    var _iteratorNormalCompletion3 = true;
                    var _didIteratorError3 = false;
                    var _iteratorError3 = undefined;

                    try {
                        for (var _iterator3 = rowData.split("h").entries()[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                            var _step3$value = _slicedToArray(_step3.value, 2),
                                y = _step3$value[0],
                                hexagonData = _step3$value[1];

                            var hexagon = new _hexagon.Hexagon(hexagonData, { x: x, y: y }, this);
                            row.push(hexagon);
                        }
                    } catch (err) {
                        _didIteratorError3 = true;
                        _iteratorError3 = err;
                    } finally {
                        try {
                            if (!_iteratorNormalCompletion3 && _iterator3.return) {
                                _iterator3.return();
                            }
                        } finally {
                            if (_didIteratorError3) {
                                throw _iteratorError3;
                            }
                        }
                    }

                    hexagons.push(row);
                }
            } catch (err) {
                _didIteratorError2 = true;
                _iteratorError2 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion2 && _iterator2.return) {
                        _iterator2.return();
                    }
                } finally {
                    if (_didIteratorError2) {
                        throw _iteratorError2;
                    }
                }
            }

            return hexagons;
        }
    }, {
        key: "gridWidth",
        get: function get() {
            if (this.hexagons.length === 0) {
                return 0;
            } else {
                return this.hexagons[0].length;
            }
        }
    }, {
        key: "gridHeight",
        get: function get() {
            return this.hexagons.length;
        }
    }, {
        key: "hexArray",
        get: function get() {
            var hexArray = [];
            var _iteratorNormalCompletion4 = true;
            var _didIteratorError4 = false;
            var _iteratorError4 = undefined;

            try {
                for (var _iterator4 = this.hexagons[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                    var hexRow = _step4.value;

                    hexArray = hexArray.concat(hexRow);
                }
            } catch (err) {
                _didIteratorError4 = true;
                _iteratorError4 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion4 && _iterator4.return) {
                        _iterator4.return();
                    }
                } finally {
                    if (_didIteratorError4) {
                        throw _iteratorError4;
                    }
                }
            }

            return hexArray;
        }
    }, {
        key: "combinedSidesArray",
        get: function get() {
            var array = [];
            var _iteratorNormalCompletion5 = true;
            var _didIteratorError5 = false;
            var _iteratorError5 = undefined;

            try {
                for (var _iterator5 = this.combinedSides.values()[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                    var row = _step5.value;
                    var _iteratorNormalCompletion6 = true;
                    var _didIteratorError6 = false;
                    var _iteratorError6 = undefined;

                    try {
                        for (var _iterator6 = row.values()[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                            var xy = _step6.value;
                            var _iteratorNormalCompletion7 = true;
                            var _didIteratorError7 = false;
                            var _iteratorError7 = undefined;

                            try {
                                for (var _iterator7 = xy.values()[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
                                    var combinedSide = _step7.value;

                                    array.push(combinedSide);
                                }
                            } catch (err) {
                                _didIteratorError7 = true;
                                _iteratorError7 = err;
                            } finally {
                                try {
                                    if (!_iteratorNormalCompletion7 && _iterator7.return) {
                                        _iterator7.return();
                                    }
                                } finally {
                                    if (_didIteratorError7) {
                                        throw _iteratorError7;
                                    }
                                }
                            }
                        }
                    } catch (err) {
                        _didIteratorError6 = true;
                        _iteratorError6 = err;
                    } finally {
                        try {
                            if (!_iteratorNormalCompletion6 && _iterator6.return) {
                                _iterator6.return();
                            }
                        } finally {
                            if (_didIteratorError6) {
                                throw _iteratorError6;
                            }
                        }
                    }
                }
            } catch (err) {
                _didIteratorError5 = true;
                _iteratorError5 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion5 && _iterator5.return) {
                        _iterator5.return();
                    }
                } finally {
                    if (_didIteratorError5) {
                        throw _iteratorError5;
                    }
                }
            }

            return array;
        }
    }, {
        key: "dataString",
        get: function get() {
            var rows = [];
            var _iteratorNormalCompletion8 = true;
            var _didIteratorError8 = false;
            var _iteratorError8 = undefined;

            try {
                for (var _iterator8 = this.hexagons[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
                    var row = _step8.value;

                    var hexagons = [];
                    var _iteratorNormalCompletion9 = true;
                    var _didIteratorError9 = false;
                    var _iteratorError9 = undefined;

                    try {
                        for (var _iterator9 = row[Symbol.iterator](), _step9; !(_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done); _iteratorNormalCompletion9 = true) {
                            var hexagon = _step9.value;

                            hexagons.push(hexagon.sidesAsString());
                        }
                    } catch (err) {
                        _didIteratorError9 = true;
                        _iteratorError9 = err;
                    } finally {
                        try {
                            if (!_iteratorNormalCompletion9 && _iterator9.return) {
                                _iterator9.return();
                            }
                        } finally {
                            if (_didIteratorError9) {
                                throw _iteratorError9;
                            }
                        }
                    }

                    rows.push(hexagons.join("h"));
                }
            } catch (err) {
                _didIteratorError8 = true;
                _iteratorError8 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion8 && _iterator8.return) {
                        _iterator8.return();
                    }
                } finally {
                    if (_didIteratorError8) {
                        throw _iteratorError8;
                    }
                }
            }

            return rows.join("r");
        }
    }]);

    return Board;
}();

},{"../gridNavigation.js":24,"../score.js":30,"../teamInfo.js":32,"./combinedSide.js":28,"./hexagon.js":29}],28:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.CombinedSide = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.combinedSideGameSettingsGui = combinedSideGameSettingsGui;

var _gridNavigation = require('../gridNavigation.js');

var gridNavigation = _interopRequireWildcard(_gridNavigation);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var scoring = {
    singleColor: 1,
    doubleColor: 2
};

function combinedSideGameSettingsGui(gui) {
    var folder = gui.addFolder('combined side game settings');
    folder.add(scoring, 'singleColor', 0, 50).step(1);
    folder.add(scoring, 'doubleColor', 0, 50).step(1);
}

var CombinedSide = exports.CombinedSide = function () {
    function CombinedSide(cords, board) {
        _classCallCheck(this, CombinedSide);

        if (board.getHex(cords.x, cords.y) === undefined) {
            throw new Error("combined side's default x,y must be a hex on the map");
        }
        this.x = cords.x;
        this.y = cords.y;
        this.side = cords.side;
        this.board = board;
    }

    _createClass(CombinedSide, [{
        key: 'onInputOver',
        value: function onInputOver(combinedSideView, pointer) {
            //this.board.selectSection(this);
        }
    }, {
        key: 'equals',
        value: function equals(combinedSideCord) {
            function cordEquality(cord1, cord2) {
                return cord1.x === cord2.x && cord1.y === cord2.y && cord1.side === cord2.side;
            }
            return cordEquality(combinedSideCord, this.cords) || cordEquality(combinedSideCord, this.alternativeCords);
        }
    }, {
        key: 'selected',
        get: function get() {
            if (this.board.selected !== undefined) {
                return this.board.selected.combinedSides.has(this);
            } else {
                return 0;
            }
        }
    }, {
        key: 'score',
        get: function get() {
            var score = 0;
            var teams = this.hexSideTeams;
            if (teams.length === 2 && teams[0] === teams[1]) {
                return scoring.doubleColor;
            } else {
                return scoring.singleColor;
            }
        }
    }, {
        key: 'alternativeCords',
        get: function get() {
            return gridNavigation.getAdjacentHexagonCord(this);
        }
    }, {
        key: 'cords',
        get: function get() {
            return { x: this.x, y: this.y, side: this.side };
        }
    }, {
        key: 'hexSideTeams',
        get: function get() {
            var teamInfo = [];
            var _arr = [this.cords, this.alternativeCords];
            for (var _i = 0; _i < _arr.length; _i++) {
                var cords = _arr[_i];
                var hex = this.board.getHex(cords.x, cords.y);
                if (hex !== undefined) {
                    teamInfo.push(hex.side(cords.side).team);
                }
            }
            return teamInfo;
        }
    }]);

    return CombinedSide;
}();

},{"../gridNavigation.js":24}],29:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Hexagon = undefined;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _teamInfo = require("../teamInfo.js");

var _SingleSide = require("./SingleSide.js");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Hexagon = exports.Hexagon = function () {
    function Hexagon(dataString, gridCords, board) {
        _classCallCheck(this, Hexagon);

        this.sides = [];
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = dataString.split(":")[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var side = _step.value;

                var team = _teamInfo.teams[side];
                this.sides.push(new _SingleSide.SingleSide(team, this, board));
            }
        } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion && _iterator.return) {
                    _iterator.return();
                }
            } finally {
                if (_didIteratorError) {
                    throw _iteratorError;
                }
            }
        }

        if (this.sides.length != 6) {
            throw new Error("incorrect number of sides: " + sides.length);
        }
        this.combinedSides = new Map();
        this.gridCords = gridCords;
    }

    _createClass(Hexagon, [{
        key: "sideNumber",
        value: function sideNumber(side) {
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = this.sides.entries()[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var _step2$value = _slicedToArray(_step2.value, 2),
                        sideNumber = _step2$value[0],
                        potentialMatch = _step2$value[1];

                    if (side === potentialMatch) {
                        return sideNumber;
                    }
                }
            } catch (err) {
                _didIteratorError2 = true;
                _iteratorError2 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion2 && _iterator2.return) {
                        _iterator2.return();
                    }
                } finally {
                    if (_didIteratorError2) {
                        throw _iteratorError2;
                    }
                }
            }

            return undefined;
        }
    }, {
        key: "side",
        value: function side(number) {
            return this.sides[number];
        }
    }, {
        key: "sidesAsString",
        value: function sidesAsString() {
            var sides = [];
            var _iteratorNormalCompletion3 = true;
            var _didIteratorError3 = false;
            var _iteratorError3 = undefined;

            try {
                for (var _iterator3 = this.sides[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                    var side = _step3.value;

                    sides.push(side.asString);
                }
            } catch (err) {
                _didIteratorError3 = true;
                _iteratorError3 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion3 && _iterator3.return) {
                        _iterator3.return();
                    }
                } finally {
                    if (_didIteratorError3) {
                        throw _iteratorError3;
                    }
                }
            }

            return sides.join(":");
        }
    }, {
        key: "rotate",
        value: function rotate(amount) {
            amount = amount % 6;
            //for anti-clockwise
            if (amount < 0) {
                var absoluteAmount = amount * -1;
                amount = 6 - absoluteAmount;
            }
            for (var i = 0; i < amount; i++) {
                this.sides.unshift(this.sides.pop());
            }
        }
    }]);

    return Hexagon;
}();

},{"../teamInfo.js":32,"./SingleSide.js":26}],30:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.scoreSettingsGui = scoreSettingsGui;
exports.allTeamScore = allTeamScore;
exports.getConnectionSet = getConnectionSet;

var _gridNavigation = require("./gridNavigation.js");

var gridNavigation = _interopRequireWildcard(_gridNavigation);

var _teamInfo = require("./teamInfo.js");

var teamInfo = _interopRequireWildcard(_teamInfo);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var boardSettings = {
    spaceFactor: 0.6
};

function scoreSettingsGui(gui, game) {
    gui.add(boardSettings, 'spaceFactor', 0, 2);
}

var ConnectionSet = function () {
    function ConnectionSet(combinedSides) {
        _classCallCheck(this, ConnectionSet);

        this.combinedSides = combinedSides;
    }

    _createClass(ConnectionSet, [{
        key: "score",
        get: function get() {
            var perSideBonus = 1;
            var score = 0;
            //let count = 0;
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = this.combinedSides[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var combinedSide = _step.value;

                    score += combinedSide.score;
                    //count += 1;
                    //score += perSideBonus * count;
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }

            return score;
        }
    }]);

    return ConnectionSet;
}();

function allTeamScore(board, team) {
    var connectionSets = [];
    var allSearchedSides = new Set();
    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
        for (var _iterator2 = board.hexArray[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var hex = _step2.value;
            var _iteratorNormalCompletion3 = true;
            var _didIteratorError3 = false;
            var _iteratorError3 = undefined;

            try {
                for (var _iterator3 = hex.sides[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                    var side = _step3.value;

                    if (!allSearchedSides.has(side)) {
                        var newConnectionSet = getConnectionSet(side, team, board);
                        connectionSets.push(newConnectionSet);
                        allSearchedSides = new Set([].concat(_toConsumableArray(allSearchedSides), _toConsumableArray(newConnectionSet.combinedSides)));
                    }
                }
            } catch (err) {
                _didIteratorError3 = true;
                _iteratorError3 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion3 && _iterator3.return) {
                        _iterator3.return();
                    }
                } finally {
                    if (_didIteratorError3) {
                        throw _iteratorError3;
                    }
                }
            }
        }
    } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion2 && _iterator2.return) {
                _iterator2.return();
            }
        } finally {
            if (_didIteratorError2) {
                throw _iteratorError2;
            }
        }
    }

    return new ConnectionSet(allSearchedSides);
}

function alreadyUsed(connects, combinedSide, board) {
    var _arr = [combinedSide, board.getCombinedSide(combinedSide.alternativeCords)];

    for (var _i = 0; _i < _arr.length; _i++) {
        var cord = _arr[_i];var _iteratorNormalCompletion4 = true;
        var _didIteratorError4 = false;
        var _iteratorError4 = undefined;

        try {
            for (var _iterator4 = connects[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                var connect = _step4.value;

                if (connect.get(combinedSide) !== undefined) {
                    return true;
                }
            }
        } catch (err) {
            _didIteratorError4 = true;
            _iteratorError4 = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion4 && _iterator4.return) {
                    _iterator4.return();
                }
            } finally {
                if (_didIteratorError4) {
                    throw _iteratorError4;
                }
            }
        }
    }
    return false;
}

function getConnectionSet(startCord, team, board) {
    var startCombinedSide = board.getCombinedSide(startCord);
    var connection = new Set();
    var _iteratorNormalCompletion5 = true;
    var _didIteratorError5 = false;
    var _iteratorError5 = undefined;

    try {
        for (var _iterator5 = startCombinedSide.hexSideTeams[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
            var nextTeam = _step5.value;

            if (team === nextTeam) {
                growConnect(board, startCombinedSide, connection, nextTeam);
                break;
            }
        }
    } catch (err) {
        _didIteratorError5 = true;
        _iteratorError5 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion5 && _iterator5.return) {
                _iterator5.return();
            }
        } finally {
            if (_didIteratorError5) {
                throw _iteratorError5;
            }
        }
    }

    return new ConnectionSet(connection);
}

//warning: existing nodes is shittily update in function, not reutrned
function growConnect(board, currentCombinedSide, existingNodes, team) {
    existingNodes.add(currentCombinedSide);
    var _arr2 = [-2, -1, 1, 2];
    for (var _i2 = 0; _i2 < _arr2.length; _i2++) {
        var direction = _arr2[_i2];
        var nextCombined = board.moveToAdjacentCombinedSide(currentCombinedSide, direction);
        if (nextCombined !== undefined && !existingNodes.has(nextCombined)) {
            var _iteratorNormalCompletion6 = true;
            var _didIteratorError6 = false;
            var _iteratorError6 = undefined;

            try {
                for (var _iterator6 = nextCombined.hexSideTeams[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                    var nextTeam = _step6.value;

                    if (team === nextTeam) {
                        growConnect(board, nextCombined, existingNodes, team);
                        break;
                    }
                }
            } catch (err) {
                _didIteratorError6 = true;
                _iteratorError6 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion6 && _iterator6.return) {
                        _iterator6.return();
                    }
                } finally {
                    if (_didIteratorError6) {
                        throw _iteratorError6;
                    }
                }
            }
        }
    }
}

},{"./gridNavigation.js":24,"./teamInfo.js":32}],31:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.random = random;
exports.even = even;
var mappingForDatGui = exports.mappingForDatGui = new Map([["random", random], ["even", even]]);

function buildBoard(sideGenerator, gridWidth, gridHeight) {
    var rows = [];
    for (var row = 0; row < gridWidth; row++) {
        var hexagons = [];
        for (var height = 0; height < gridHeight; height++) {
            var sides = [];
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = sideGenerator()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var side = _step.value;

                    sides.push(side);
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }

            hexagons.push(sides.join(":"));
        }
        rows.push(hexagons.join("h"));
    }
    return rows.join("r");
}

function random(teams, gridWidth, gridHeight) {
    function sideGenerator() {
        var sides = [];
        for (var sideNumber = 0; sideNumber < 6; sideNumber++) {
            sides.push(Math.floor(Math.random() * teams.length));
        }
        return sides;
    }
    return buildBoard(sideGenerator, gridWidth, gridHeight);
}

function even(teams, gridWidth, gridHeight) {
    function sideGenerator() {
        var sides = [];
        for (var sideNumber = 0; sideNumber < 6; sideNumber++) {
            sides.push(sideNumber % teams.length);
        }
        return sides;
    }
    return buildBoard(sideGenerator, gridWidth, gridHeight);
}

},{}],32:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.teamInfoSettingsGui = teamInfoSettingsGui;
exports.endOfRound = endOfRound;
exports.makeMove = makeMove;
var settings = exports.settings = {
    standardMoveLimit: 4
};

var teams = exports.teams = [{
    number: 0,
    colour: 0xff0000,
    movesLeft: settings.standardMoveLimit,
    score: 0
}, {
    number: 1,
    colour: 0xebff00,
    movesLeft: settings.standardMoveLimit,
    score: 0
}, {
    number: 2,
    colour: 0x0000ff,
    movesLeft: settings.standardMoveLimit,
    score: 0
}];

function teamInfoSettingsGui(gui) {
    var folder = gui.addFolder('team settins');
    folder.addColor(teams[0], 'colour');
    folder.addColor(teams[1], 'colour');
    folder.addColor(teams[2], 'colour');
    folder.add(settings, 'standardMoveLimit', 1, 10).step(1);
}

var currentTeam = exports.currentTeam = teams[0];
var currentRound = exports.currentRound = 0;
function endOfRound() {
    return currentTeam.number === 0 && currentTeam.movesLeft === settings.standardMoveLimit;
}

function makeMove() {
    currentTeam.movesLeft -= 1;
    if (currentTeam.movesLeft === 0) {
        exports.currentTeam = currentTeam = teams[(currentTeam.number + 1) % teams.length];
        currentTeam.movesLeft = settings.standardMoveLimit;
    }
}

},{}],33:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.SingleSide = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.singleSideSettingsGui = singleSideSettingsGui;

var _geometry = require('../geometry.js');

var geometry = _interopRequireWildcard(_geometry);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var lineStyle = {
    thickness: 5,
    alpha: 1
};

function singleSideSettingsGui(gui) {
    var folder = gui.addFolder('single side graphics');
    folder.add(lineStyle, 'thickness', 0, 20);
    folder.add(lineStyle, 'alpha', 0, 1);
}

var SingleSide = exports.SingleSide = function (_Phaser$Sprite) {
    _inherits(SingleSide, _Phaser$Sprite);

    function SingleSide(game, x, y, boardView, model) {
        _classCallCheck(this, SingleSide);

        var _this = _possibleConstructorReturn(this, (SingleSide.__proto__ || Object.getPrototypeOf(SingleSide)).call(this, game, x, y));

        _this.data.boardView = boardView;
        _this.data.model = model;
        var hexPoints = geometry.relativeScaledHexPoints(_this.data.boardView.innerSideLength);
        var start = hexPoints[_this.data.model.cords.side];
        _this.data.graphics = new Phaser.Graphics(game, start.x, start.y);
        _this.addChild(_this.data.graphics);
        _this.data.graphics.inputEnabled = true;
        _this.data.graphics.events.onInputOver.add(_this.data.model.onInputOver, _this.data.model);
        _this.data.graphics.events.onInputOut.add(_this.data.model.onInputOut, _this.data.model);
        return _this;
    }

    _createClass(SingleSide, [{
        key: 'refreshPosition',
        value: function refreshPosition() {
            var hexPoints = geometry.relativeScaledHexPoints(this.data.boardView.innerSideLength);
            var start = hexPoints[this.data.model.cords.side];
            this.data.graphics.x = start.x;
            this.data.graphics.y = start.y;
        }
    }, {
        key: 'update',
        value: function update() {
            this.refreshPosition();
            var externalTangentAngle = 60;
            this.data.graphics.angle = externalTangentAngle * this.data.model.cords.side;
            this.data.graphics.clear();
            //this rect used fro hit box only
            this.data.graphics.beginFill(0, 0);
            this.data.graphics.drawRect(0, 0, this.data.boardView.innerSideLength, lineStyle.thickness * 2);
            this.data.graphics.endFill();
            //now drawing
            this.data.graphics.lineStyle(lineStyle.thickness, this.data.model.team.colour, lineStyle.alpha);
            this.data.graphics.moveTo(0, 0);
            this.data.graphics.lineTo(this.data.boardView.innerSideLength, 0);

            if (this.data.model.selected) {
                //this is gonna be a real resource drain
                //should instead render to texture (6 different ones), then reapply
                var steps = 10;
                var maxThickness = lineStyle.thickness * 5;
                var thicknessStep = (maxThickness - lineStyle.thickness) / steps;
                var alpha = 1 / steps; //these naturaly stack, so scaling with step is not needed
                for (var step = 0; step < steps; step++) {
                    this.data.graphics.lineStyle(lineStyle.thickness + thicknessStep * step, 0xffffff, alpha);
                    this.data.graphics.moveTo(0, 0);
                    this.data.graphics.lineTo(this.data.boardView.innerSideLength, 0);
                }
            }
        }
    }]);

    return SingleSide;
}(Phaser.Sprite);

},{"../geometry.js":23}],34:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Board = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.boardSettingsGui = boardSettingsGui;

var _hexagon = require("./hexagon.js");

var _combinedSide = require("./combinedSide.js");

var _dashboard = require("./dashboard.js");

var _teamInfo = require("../teamInfo.js");

var teamInfo = _interopRequireWildcard(_teamInfo);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var boardSettings = {
    spaceFactor: 0.6
};

function boardSettingsGui(gui, game) {
    var boardView = gui.addFolder('board view');
    boardView.add(boardSettings, 'spaceFactor', 0, 2);
}

//this doesnt work properly
function calculateSideLength(width, height, gridWidth, gridHeight) {
    var boardWidth = 1.5 * gridWidth + 1;
    var boardHeight = 2 * Math.sin(Math.PI / 3) * gridHeight + 1.5 * Math.sin(Math.PI / 3);
    if (boardWidth > boardHeight) {
        return width / (1.5 * gridWidth + 1);
    } else {
        return height / (2 * Math.sin(Math.PI / 3) * gridHeight + 1.5 * Math.sin(Math.PI / 3));
    }
}

var Board = exports.Board = function (_Phaser$Sprite) {
    _inherits(Board, _Phaser$Sprite);

    //passing in x is even more reason to make this a phaser object
    function Board(game, x, y, model, gui, sideLength) {
        _classCallCheck(this, Board);

        var _this = _possibleConstructorReturn(this, (Board.__proto__ || Object.getPrototypeOf(Board)).call(this, game, x, y));

        _this.data.model = model;
        _this.data.dashboard = new _dashboard.Dashboard(game, 0, 0, 200, teamInfo, _this.data.model);
        _this.addChild(_this.data.dashboard);
        if (sideLength === undefined) {
            sideLength = _this.defaultSideLength;
        }
        _this.data.sideLength = sideLength;
        gui.add(_this.data, 'sideLength', sideLength * 0.5, sideLength * 2);
        _this.hexagons = [];
        _this.data.gameBoardGroup = new Phaser.Group(game, _this);
        _this.data.gameBoardGroup.x = _this.data.dashboard.data.width;
        //should put hex veiws in their own group
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = model.hexArray[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var hexModel = _step.value;

                var worldCords = _this.calculateWorldCords(hexModel.gridCords);
                var hexagon = new _hexagon.Hexagon(game, worldCords.x, worldCords.y, _this, model.hexagonInput, hexModel);
                _this.data.gameBoardGroup.addChild(hexagon);
                _this.hexagons.push(hexagon);
            }
        } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion && _iterator.return) {
                    _iterator.return();
                }
            } finally {
                if (_didIteratorError) {
                    throw _iteratorError;
                }
            }
        }

        _this.combinedSides = [];
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
            for (var _iterator2 = model.combinedSidesArray[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                var combModel = _step2.value;

                var _worldCords = _this.calculateWorldCords(combModel.cords);
                var combinedSide = new _combinedSide.CombinedSide(game, _worldCords.x, _worldCords.y, _this, combModel);
                _this.data.gameBoardGroup.addChild(combinedSide);
                _this.combinedSides.push(combinedSide);
            }
        } catch (err) {
            _didIteratorError2 = true;
            _iteratorError2 = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion2 && _iterator2.return) {
                    _iterator2.return();
                }
            } finally {
                if (_didIteratorError2) {
                    throw _iteratorError2;
                }
            }
        }

        return _this;
    }

    _createClass(Board, [{
        key: "update",
        value: function update() {
            var _iteratorNormalCompletion3 = true;
            var _didIteratorError3 = false;
            var _iteratorError3 = undefined;

            try {
                for (var _iterator3 = this.hexagons[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                    var hexagon = _step3.value;

                    hexagon.update();
                }
            } catch (err) {
                _didIteratorError3 = true;
                _iteratorError3 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion3 && _iterator3.return) {
                        _iterator3.return();
                    }
                } finally {
                    if (_didIteratorError3) {
                        throw _iteratorError3;
                    }
                }
            }

            var _iteratorNormalCompletion4 = true;
            var _didIteratorError4 = false;
            var _iteratorError4 = undefined;

            try {
                for (var _iterator4 = this.combinedSides[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                    var combinedSide = _step4.value;

                    combinedSide.update();
                }
            } catch (err) {
                _didIteratorError4 = true;
                _iteratorError4 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion4 && _iterator4.return) {
                        _iterator4.return();
                    }
                } finally {
                    if (_didIteratorError4) {
                        throw _iteratorError4;
                    }
                }
            }

            this.data.dashboard.update();
        }
    }, {
        key: "updateSideLength",
        value: function updateSideLength(sideLength) {
            if (sideLength === undefined) {
                sideLength = this.defaultSideLength;
            }
            this.data.sideLength = sideLength;
        }
    }, {
        key: "calculateWorldCords",
        value: function calculateWorldCords(gridCords) {
            var spacingSideLength = this.data.sideLength;
            var ySpacing = 2 * Math.sin(Math.PI / 3) * spacingSideLength;
            var xSpacing = spacingSideLength * 1.5;
            //plus ones so we don't get cut off by edge of map
            var position = {
                x: xSpacing * gridCords.x + spacingSideLength,
                y: ySpacing * gridCords.y + 2 * Math.sin(Math.PI / 3) * spacingSideLength
            };
            var isOddColumn = gridCords.x % 2 == 1;
            if (isOddColumn) {
                position.y -= ySpacing / 2;
            }
            return position;
        }
    }, {
        key: "defaultSideLength",
        get: function get() {
            return calculateSideLength(this.game.width - this.data.dashboard.width, this.game.height, this.data.model.gridWidth, this.data.model.gridHeight);
        }
    }, {
        key: "innerSideLength",
        get: function get() {
            return boardSettings.spaceFactor * this.data.sideLength;
        }
    }, {
        key: "outerSideLength",
        get: function get() {
            return this.data.sideLength;
        }
    }]);

    return Board;
}(Phaser.Sprite);

},{"../teamInfo.js":32,"./combinedSide.js":35,"./dashboard.js":36,"./hexagon.js":37}],35:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.CombinedSide = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.combinedSideSettingsGui = combinedSideSettingsGui;

var _geometry = require('../geometry.js');

var geometry = _interopRequireWildcard(_geometry);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var lineStyle = {
    thickness: 5,
    alpha: 1
};

var combinedColours = {
    team_0_1: 0xffb000,
    team_1_2: 0x00ff00,
    team_2_0: 0xaf00ff
};

function combinedSideSettingsGui(gui) {
    var folder = gui.addFolder('combined side graphics');
    folder.add(lineStyle, 'thickness', 0, 20);
    folder.add(lineStyle, 'alpha', 0, 1);
    folder.addColor(combinedColours, 'team_0_1');
    folder.addColor(combinedColours, 'team_1_2');
    folder.addColor(combinedColours, 'team_2_0');
}

var CombinedSide = exports.CombinedSide = function (_Phaser$Sprite) {
    _inherits(CombinedSide, _Phaser$Sprite);

    /*
    model API:
        property hexSideTeams -> array of teamNumbers of adjacent hex sides
        proerty cords -> {x,y, side} standard corodinate for addressing combined sides
    */
    function CombinedSide(game, x, y, boardView, model) {
        _classCallCheck(this, CombinedSide);

        var _this = _possibleConstructorReturn(this, (CombinedSide.__proto__ || Object.getPrototypeOf(CombinedSide)).call(this, game, x, y));

        _this.data.boardView = boardView;
        _this.data.model = model;
        var hexPoints = geometry.relativeScaledHexPoints(_this.data.boardView.outerSideLength);
        var start = hexPoints[_this.data.model.cords.side];
        _this.data.graphics = new Phaser.Graphics(game, start.x, start.y);
        _this.addChild(_this.data.graphics);
        var end = hexPoints[(_this.data.model.cords.side + 1) % 6];
        var textPosition = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
        _this.data.text = new Phaser.Text(game, textPosition.x, textPosition.y, "");
        _this.addChild(_this.data.text);
        _this.data.text.visible = false;
        return _this;
    }

    _createClass(CombinedSide, [{
        key: 'refreshPosition',
        value: function refreshPosition() {
            var worldCords = this.data.boardView.calculateWorldCords(this.data.model.cords);
            this.x = worldCords.x;
            this.y = worldCords.y;
            var hexPoints = geometry.relativeScaledHexPoints(this.data.boardView.outerSideLength);
            var start = hexPoints[this.data.model.cords.side];
            this.data.graphics.x = start.x;
            this.data.graphics.y = start.y;
        }
    }, {
        key: 'update',
        value: function update() {
            this.refreshPosition();
            var externalTangentAngle = 60;
            this.data.graphics.angle = externalTangentAngle * this.data.model.cords.side;
            this.data.graphics.clear();
            var hexSideTeams = this.data.model.hexSideTeams;
            var firstTeam = hexSideTeams[0];
            var colour = void 0;
            if (hexSideTeams.length === 2) {
                var secondTeam = hexSideTeams[1];
                colour = this.manualCombine(firstTeam, secondTeam);
            } else {
                colour = firstTeam.colour;
            }
            if (this.data.model.selected) {
                //this is gonna be a real resource drain
                //should instead render to texture (6 different ones), then reapply
                var steps = 10;
                var maxThickness = lineStyle.thickness * 5;
                var thicknessStep = (maxThickness - lineStyle.thickness) / steps;
                var alpha = 1 / steps; //these naturaly stack, so scaling with step is not needed
                for (var step = 0; step < steps; step++) {
                    this.data.graphics.lineStyle(lineStyle.thickness + thicknessStep * step, 0xffffff, alpha);
                    this.data.graphics.moveTo(0, 0);
                    this.data.graphics.lineTo(this.data.boardView.outerSideLength, 0);
                }
                this.data.text.text = this.data.model.score;
                this.data.text.visible = true;
            } else {
                this.data.text.visible = false;
            }
            //doing this last means it sits on top of the hightligh
            this.data.graphics.lineStyle(lineStyle.thickness, colour, lineStyle.alpha);
            this.data.graphics.moveTo(0, 0);
            this.data.graphics.lineTo(this.data.boardView.outerSideLength, 0);
        }

        //this feels like its leaking the model a bit?

    }, {
        key: 'manualCombine',
        value: function manualCombine(first_team, second_team) {
            function logError() {
                console.log("errror, invalid teams for combining sides");
                console.log(first_team);
                console.log(second_team);
            }
            if (first_team.number > second_team.number) {
                var temp = first_team;
                first_team = second_team;
                second_team = temp;
            }
            if (first_team.number === second_team.number) {
                return first_team.colour;
            } else if (first_team.number === 0 && second_team.number === 1) {
                return combinedColours.team_0_1;
            } else if (first_team.number === 1 && second_team.number === 2) {
                return combinedColours.team_1_2;
            } else if (first_team.number === 0 && second_team.number === 2) {
                return combinedColours.team_2_0;
            } else {
                logError();
            }
        }
    }]);

    return CombinedSide;
}(Phaser.Sprite);

},{"../geometry.js":23}],36:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Dashboard = undefined;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _hexagon = require("./hexagon.js");

var _combinedSide = require("./combinedSide.js");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Dashboard = exports.Dashboard = function (_Phaser$Sprite) {
    _inherits(Dashboard, _Phaser$Sprite);

    //depending on what thee controls look like
    //might be better to make this with normal html/css
    function Dashboard(game, x, y, width, teamInfo, boardModel) {
        _classCallCheck(this, Dashboard);

        var _this = _possibleConstructorReturn(this, (Dashboard.__proto__ || Object.getPrototypeOf(Dashboard)).call(this, game, x, y));

        _this.data.teamInfo = teamInfo;
        _this.data.width = width;
        _this.data.height = game.height;
        _this.outline();
        _this.data.teamsDisplay = [];
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = teamInfo.teams.entries()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var _step$value = _slicedToArray(_step.value, 2),
                    index = _step$value[0],
                    team = _step$value[1];

                var teamDisplayGroup = _this.teamHighlights(team, index * 50, 50, 30, 30);
                _this.data.teamsDisplay.push(teamDisplayGroup);
                _this.addChild(teamDisplayGroup);
            }
        } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion && _iterator.return) {
                    _iterator.return();
                }
            } finally {
                if (_didIteratorError) {
                    throw _iteratorError;
                }
            }
        }

        _this.data.boardModel = boardModel;
        _this.moveCounter = new Phaser.Graphics(game, 0, _this.data.height / 2);
        _this.addChild(_this.moveCounter);
        _this.data.highlighedSectionScore = new Phaser.Text(game, 0, 10, "", { wordWrap: true, wordWrapWidth: width, fontSize: 15 });
        _this.addChild(_this.data.highlighedSectionScore);
        return _this;
    }

    _createClass(Dashboard, [{
        key: "teamHighlights",
        value: function teamHighlights(team, x, y, width, height) {
            var group = new Phaser.Group(this.game, this);
            var teamHighlight = new Phaser.Graphics(this.game, x, y);
            teamHighlight.beginFill(team.colour);
            teamHighlight.drawRect(0, 0, width, height);
            teamHighlight.endFill();
            teamHighlight.inputEnabled = true;
            teamHighlight.events.onInputOver.add(function () {
                this.data.boardModel.teamHighlight(team);
            }, this);
            group.addChild(teamHighlight);
            var scoreText = new Phaser.Text(this.game, x, y, "");
            group.addChild(scoreText);
            scoreText.update = function () {
                this.text = team.score;
            };
            return group;
        }
    }, {
        key: "outline",
        value: function outline() {
            this.data.outline = new Phaser.Graphics(this.game, 0, 0);
            this.data.outline.beginFill('0xff6600');
            this.data.outline.drawRect(0, 0, this.data.width, this.data.height);
            this.data.outline.endFill();
            this.addChild(this.data.outline);
        }
    }, {
        key: "update",
        value: function update() {
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = this.data.teamsDisplay[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var teamDisplayGroup = _step2.value;

                    teamDisplayGroup.update();
                }
            } catch (err) {
                _didIteratorError2 = true;
                _iteratorError2 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion2 && _iterator2.return) {
                        _iterator2.return();
                    }
                } finally {
                    if (_didIteratorError2) {
                        throw _iteratorError2;
                    }
                }
            }

            this.moveCounter.clear();
            var score = void 0;
            if (this.data.boardModel.selected === undefined) {
                score = 0;
            } else {
                score = this.data.boardModel.selected.score;
            }
            this.data.highlighedSectionScore.text = "Highlighted Score: " + score;
            var currentTeam = this.data.teamInfo.currentTeam;
            var moveLimit = this.data.teamInfo.settings.standardMoveLimit;
            this.moveCounter.beginFill(currentTeam.colour);
            var radius = Math.min(this.data.width, this.data.height) / 2;
            var center = { x: this.data.width / 2, y: 0 };
            if (currentTeam.movesLeft == moveLimit) {
                //arc draws in discreat segments, so leaves a gap for full circles
                this.moveCounter.drawCircle(center.x, center.y, radius * 2);
            } else {
                var percentOfCircle = currentTeam.movesLeft / moveLimit;
                var endAngleRadians = -Math.PI * 2 * percentOfCircle;
                var topOffset = -Math.PI / 2;
                this.moveCounter.arc(center.x, center.y, radius, topOffset, topOffset + endAngleRadians, true, 128);
            }
            this.moveCounter.endFill();
        }
    }]);

    return Dashboard;
}(Phaser.Sprite);

},{"./combinedSide.js":35,"./hexagon.js":37}],37:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Hexagon = undefined;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.hexagonSettingsGui = hexagonSettingsGui;

var _teamInfo = require("../teamInfo.js");

var _geometry = require("../geometry.js");

var geometry = _interopRequireWildcard(_geometry);

var _SingleSide = require("./SingleSide.js");

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var lineStyle = {
    thickness: 5,
    alpha: 1
};

var hexStyle = {
    colour: 0xFF33ff
};

function hexagonSettingsGui(gui) {
    var folder = gui.addFolder('hexagon graphics');
    folder.add(lineStyle, 'thickness', 0, 20);
    folder.add(lineStyle, 'alpha', 0, 1);
    folder.addColor(hexStyle, 'colour');
}

var Hexagon = exports.Hexagon = function (_Phaser$Sprite) {
    _inherits(Hexagon, _Phaser$Sprite);

    /*
    Hexmodel is an interface that supplies info on how to render
    It's API is:
        property: gridCords -> returns {x, y} object
        propoertyL sides -> returns [] of team numbers, starting from top side, going clockwise
    */
    function Hexagon(game, x, y, boardView, inputDownCallback, model) {
        _classCallCheck(this, Hexagon);

        var _this = _possibleConstructorReturn(this, (Hexagon.__proto__ || Object.getPrototypeOf(Hexagon)).call(this, game, x, y));

        _this.data.model = model;
        _this.data.boardView = boardView;
        _this.inputEnabled = true;
        //this isn't pixle perfect, so use in conjuction with polygon hit test?
        //assuming box for this testi is too big, not too small
        _this.events.onInputDown.add(inputDownCallback, _this.data.boardView.data.model);

        _this.data.body = new Phaser.Graphics(game, 0, 0);
        _this.addChild(_this.data.body);

        _this.data.sides = [];

        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = _this.data.model.sides[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var sideModel = _step.value;

                var sideView = new _SingleSide.SingleSide(game, 0, 0, boardView, sideModel);
                _this.addChild(sideView);
                _this.data.sides.push(sideView);
            }
        } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion && _iterator.return) {
                    _iterator.return();
                }
            } finally {
                if (_didIteratorError) {
                    throw _iteratorError;
                }
            }
        }

        _this.data.text = new Phaser.Text(game, -10, -10, _this.data.model.gridCords.x + "," + _this.data.model.gridCords.y);
        //look at adding this to a group/image class with the graphics object
        _this.addChild(_this.data.text);
        return _this;
    }

    _createClass(Hexagon, [{
        key: "refreshPositon",
        value: function refreshPositon() {
            var worldCords = this.data.boardView.calculateWorldCords(this.data.model.gridCords);
            this.x = worldCords.x;
            this.y = worldCords.y;
        }
    }, {
        key: "update",
        value: function update() {
            this.refreshPositon();
            //this.drawSides();
            this.drawHexagon();
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = this.data.sides[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var sideView = _step2.value;

                    sideView.update();
                }
            } catch (err) {
                _didIteratorError2 = true;
                _iteratorError2 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion2 && _iterator2.return) {
                        _iterator2.return();
                    }
                } finally {
                    if (_didIteratorError2) {
                        throw _iteratorError2;
                    }
                }
            }
        }
    }, {
        key: "drawSides",
        value: function drawSides() {
            this.data.sides.clear();
            var hexPoints = geometry.relativeScaledHexPoints(this.data.boardView.innerSideLength);
            var _iteratorNormalCompletion3 = true;
            var _didIteratorError3 = false;
            var _iteratorError3 = undefined;

            try {
                for (var _iterator3 = this.data.model.sides.entries()[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                    var _step3$value = _slicedToArray(_step3.value, 2),
                        sideNumber = _step3$value[0],
                        team = _step3$value[1];

                    this.data.sides.lineStyle(lineStyle.thickness, team.colour, lineStyle.alpha);
                    var start = hexPoints[sideNumber];
                    this.data.sides.moveTo(start.x, start.y);
                    var end = hexPoints[(sideNumber + 1) % 6];
                    this.data.sides.lineTo(end.x, end.y);
                }
            } catch (err) {
                _didIteratorError3 = true;
                _iteratorError3 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion3 && _iterator3.return) {
                        _iterator3.return();
                    }
                } finally {
                    if (_didIteratorError3) {
                        throw _iteratorError3;
                    }
                }
            }
        }
    }, {
        key: "drawHexagon",
        value: function drawHexagon() {
            this.data.body.clear();
            this.data.body.beginFill(hexStyle.colour);
            this.data.body.drawPolygon(geometry.relativeScaledHexPoints(this.data.boardView.innerSideLength));
            this.data.body.endFill();
            this.data.text.font = "arial";
            this.data.text.fontSize = 8;
        }
    }]);

    return Hexagon;
}(Phaser.Sprite);

},{"../geometry.js":23,"../teamInfo.js":32,"./SingleSide.js":33}]},{},[25])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvZXhkYXQvc3JjL2RhdC9jb2xvci9Db2xvci5qcyIsIm5vZGVfbW9kdWxlcy9leGRhdC9zcmMvZGF0L2NvbG9yL2ludGVycHJldC5qcyIsIm5vZGVfbW9kdWxlcy9leGRhdC9zcmMvZGF0L2NvbG9yL21hdGguanMiLCJub2RlX21vZHVsZXMvZXhkYXQvc3JjL2RhdC9jb2xvci90b1N0cmluZy5qcyIsIm5vZGVfbW9kdWxlcy9leGRhdC9zcmMvZGF0L2NvbnRyb2xsZXJzL0Jvb2xlYW5Db250cm9sbGVyLmpzIiwibm9kZV9tb2R1bGVzL2V4ZGF0L3NyYy9kYXQvY29udHJvbGxlcnMvQ29sb3JDb250cm9sbGVyLmpzIiwibm9kZV9tb2R1bGVzL2V4ZGF0L3NyYy9kYXQvY29udHJvbGxlcnMvQ29udHJvbGxlci5qcyIsIm5vZGVfbW9kdWxlcy9leGRhdC9zcmMvZGF0L2NvbnRyb2xsZXJzL0Z1bmN0aW9uQ29udHJvbGxlci5qcyIsIm5vZGVfbW9kdWxlcy9leGRhdC9zcmMvZGF0L2NvbnRyb2xsZXJzL051bWJlckNvbnRyb2xsZXIuanMiLCJub2RlX21vZHVsZXMvZXhkYXQvc3JjL2RhdC9jb250cm9sbGVycy9OdW1iZXJDb250cm9sbGVyQm94LmpzIiwibm9kZV9tb2R1bGVzL2V4ZGF0L3NyYy9kYXQvY29udHJvbGxlcnMvTnVtYmVyQ29udHJvbGxlclNsaWRlci5qcyIsIm5vZGVfbW9kdWxlcy9leGRhdC9zcmMvZGF0L2NvbnRyb2xsZXJzL09wdGlvbkNvbnRyb2xsZXIuanMiLCJub2RlX21vZHVsZXMvZXhkYXQvc3JjL2RhdC9jb250cm9sbGVycy9TdHJpbmdDb250cm9sbGVyLmpzIiwibm9kZV9tb2R1bGVzL2V4ZGF0L3NyYy9kYXQvY29udHJvbGxlcnMvZmFjdG9yeS5qcyIsIm5vZGVfbW9kdWxlcy9leGRhdC9zcmMvZGF0L2RvbS9DZW50ZXJlZERpdi5qcyIsIm5vZGVfbW9kdWxlcy9leGRhdC9zcmMvZGF0L2RvbS9kb20uanMiLCJub2RlX21vZHVsZXMvZXhkYXQvc3JjL2RhdC9ndWkvR1VJLmpzIiwibm9kZV9tb2R1bGVzL2V4ZGF0L3NyYy9kYXQvdXRpbHMvY29tbW9uLmpzIiwibm9kZV9tb2R1bGVzL2V4ZGF0L3NyYy9kYXQvdXRpbHMvY3NzLmpzIiwibm9kZV9tb2R1bGVzL2V4ZGF0L3NyYy9kYXQvdXRpbHMvZXNjYXBlSHRtbC5qcyIsIm5vZGVfbW9kdWxlcy9leGRhdC9zcmMvZGF0L3V0aWxzL3JlcXVlc3RBbmltYXRpb25GcmFtZS5qcyIsIm5vZGVfbW9kdWxlcy9leGRhdC9zcmMvaW5kZXguanMiLCJzb3VyY2UvZ2VvbWV0cnkuanMiLCJzb3VyY2UvZ3JpZE5hdmlnYXRpb24uanMiLCJzb3VyY2UvbWFpbi5qcyIsInNvdXJjZS9tb2RlbHMvU2luZ2xlU2lkZS5qcyIsInNvdXJjZS9tb2RlbHMvYm9hcmQuanMiLCJzb3VyY2UvbW9kZWxzL2NvbWJpbmVkU2lkZS5qcyIsInNvdXJjZS9tb2RlbHMvaGV4YWdvbi5qcyIsInNvdXJjZS9zY29yZS5qcyIsInNvdXJjZS9zaWRlR2VuZXJhdGlvbi5qcyIsInNvdXJjZS90ZWFtSW5mby5qcyIsInNvdXJjZS92aWV3cy9TaW5nbGVTaWRlLmpzIiwic291cmNlL3ZpZXdzL2JvYXJkLmpzIiwic291cmNlL3ZpZXdzL2NvbWJpbmVkU2lkZS5qcyIsInNvdXJjZS92aWV3cy9kYXNoYm9hcmQuanMiLCJzb3VyY2Uvdmlld3MvaGV4YWdvbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4M0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7OztRQ3RD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QkFBSyxJQUFMLENBQVUsSUFBVixDQUFlLFFBQWYsR0FBMEIsQ0FBMUI7QUFDSDs7OztFQWpFd0IsT0FBTyxNIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKlxuICogZGF0LWd1aSBKYXZhU2NyaXB0IENvbnRyb2xsZXIgTGlicmFyeVxuICogaHR0cDovL2NvZGUuZ29vZ2xlLmNvbS9wL2RhdC1ndWlcbiAqXG4gKiBDb3B5cmlnaHQgMjAxMSBEYXRhIEFydHMgVGVhbSwgR29vZ2xlIENyZWF0aXZlIExhYlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqL1xuXG52YXIgY29tbW9uID0gcmVxdWlyZSgnLi4vdXRpbHMvY29tbW9uLmpzJyk7XG52YXIgdG9TdHJpbmcgPSByZXF1aXJlKCcuL3RvU3RyaW5nLmpzJyk7XG52YXIgbWF0aCA9IHJlcXVpcmUoJy4vbWF0aC5qcycpO1xudmFyIGludGVycHJldCA9IHJlcXVpcmUoJy4vaW50ZXJwcmV0LmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gQ29sb3I7XG5cbmZ1bmN0aW9uIENvbG9yKCkge1xuXG4gIHRoaXMuX19zdGF0ZSA9IGludGVycHJldC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXG4gIGlmICh0aGlzLl9fc3RhdGUgPT09IGZhbHNlKSB7XG4gICAgdGhyb3cgJ0ZhaWxlZCB0byBpbnRlcnByZXQgY29sb3IgYXJndW1lbnRzJztcbiAgfVxuXG4gIHRoaXMuX19zdGF0ZS5hID0gdGhpcy5fX3N0YXRlLmEgfHwgMTtcbn1cblxuQ29sb3IuQ09NUE9ORU5UUyA9IFsncicsICdnJywgJ2InLCAnaCcsICdzJywgJ3YnLCAnaGV4JywgJ2EnXTtcblxuY29tbW9uLmV4dGVuZChDb2xvci5wcm90b3R5cGUsIHtcblxuICB0b1N0cmluZzogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRvU3RyaW5nKHRoaXMpO1xuICB9LFxuXG4gIHRvT3JpZ2luYWw6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLl9fc3RhdGUuY29udmVyc2lvbi53cml0ZSh0aGlzKTtcbiAgfVxuXG59KTtcblxuZGVmaW5lUkdCQ29tcG9uZW50KENvbG9yLnByb3RvdHlwZSwgJ3InLCAyKTtcbmRlZmluZVJHQkNvbXBvbmVudChDb2xvci5wcm90b3R5cGUsICdnJywgMSk7XG5kZWZpbmVSR0JDb21wb25lbnQoQ29sb3IucHJvdG90eXBlLCAnYicsIDApO1xuXG5kZWZpbmVIU1ZDb21wb25lbnQoQ29sb3IucHJvdG90eXBlLCAnaCcpO1xuZGVmaW5lSFNWQ29tcG9uZW50KENvbG9yLnByb3RvdHlwZSwgJ3MnKTtcbmRlZmluZUhTVkNvbXBvbmVudChDb2xvci5wcm90b3R5cGUsICd2Jyk7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShDb2xvci5wcm90b3R5cGUsICdhJywge1xuXG4gIGdldDogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuX19zdGF0ZS5hO1xuICB9LFxuXG4gIHNldDogZnVuY3Rpb24odikge1xuICAgIHRoaXMuX19zdGF0ZS5hID0gdjtcbiAgfVxuXG59KTtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KENvbG9yLnByb3RvdHlwZSwgJ2hleCcsIHtcblxuICBnZXQ6IGZ1bmN0aW9uKCkge1xuXG4gICAgaWYgKCF0aGlzLl9fc3RhdGUuc3BhY2UgIT09ICdIRVgnKSB7XG4gICAgICB0aGlzLl9fc3RhdGUuaGV4ID0gbWF0aC5yZ2JfdG9faGV4KHRoaXMuciwgdGhpcy5nLCB0aGlzLmIpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLl9fc3RhdGUuaGV4O1xuXG4gIH0sXG5cbiAgc2V0OiBmdW5jdGlvbih2KSB7XG5cbiAgICB0aGlzLl9fc3RhdGUuc3BhY2UgPSAnSEVYJztcbiAgICB0aGlzLl9fc3RhdGUuaGV4ID0gdjtcblxuICB9XG5cbn0pO1xuXG5mdW5jdGlvbiBkZWZpbmVSR0JDb21wb25lbnQodGFyZ2V0LCBjb21wb25lbnQsIGNvbXBvbmVudEhleEluZGV4KSB7XG5cbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgY29tcG9uZW50LCB7XG5cbiAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuXG4gICAgICBpZiAodGhpcy5fX3N0YXRlLnNwYWNlID09PSAnUkdCJykge1xuICAgICAgICByZXR1cm4gdGhpcy5fX3N0YXRlW2NvbXBvbmVudF07XG4gICAgICB9XG5cbiAgICAgIHJlY2FsY3VsYXRlUkdCKHRoaXMsIGNvbXBvbmVudCwgY29tcG9uZW50SGV4SW5kZXgpO1xuXG4gICAgICByZXR1cm4gdGhpcy5fX3N0YXRlW2NvbXBvbmVudF07XG5cbiAgICB9LFxuXG4gICAgc2V0OiBmdW5jdGlvbih2KSB7XG5cbiAgICAgIGlmICh0aGlzLl9fc3RhdGUuc3BhY2UgIT09ICdSR0InKSB7XG4gICAgICAgIHJlY2FsY3VsYXRlUkdCKHRoaXMsIGNvbXBvbmVudCwgY29tcG9uZW50SGV4SW5kZXgpO1xuICAgICAgICB0aGlzLl9fc3RhdGUuc3BhY2UgPSAnUkdCJztcbiAgICAgIH1cblxuICAgICAgdGhpcy5fX3N0YXRlW2NvbXBvbmVudF0gPSB2O1xuXG4gICAgfVxuXG4gIH0pO1xuXG59XG5cbmZ1bmN0aW9uIGRlZmluZUhTVkNvbXBvbmVudCh0YXJnZXQsIGNvbXBvbmVudCkge1xuXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGNvbXBvbmVudCwge1xuXG4gICAgZ2V0OiBmdW5jdGlvbigpIHtcblxuICAgICAgaWYgKHRoaXMuX19zdGF0ZS5zcGFjZSA9PT0gJ0hTVicpXG4gICAgICAgIHJldHVybiB0aGlzLl9fc3RhdGVbY29tcG9uZW50XTtcblxuICAgICAgcmVjYWxjdWxhdGVIU1YodGhpcyk7XG5cbiAgICAgIHJldHVybiB0aGlzLl9fc3RhdGVbY29tcG9uZW50XTtcblxuICAgIH0sXG5cbiAgICBzZXQ6IGZ1bmN0aW9uKHYpIHtcblxuICAgICAgaWYgKHRoaXMuX19zdGF0ZS5zcGFjZSAhPT0gJ0hTVicpIHtcbiAgICAgICAgcmVjYWxjdWxhdGVIU1YodGhpcyk7XG4gICAgICAgIHRoaXMuX19zdGF0ZS5zcGFjZSA9ICdIU1YnO1xuICAgICAgfVxuXG4gICAgICB0aGlzLl9fc3RhdGVbY29tcG9uZW50XSA9IHY7XG5cbiAgICB9XG5cbiAgfSk7XG5cbn1cblxuZnVuY3Rpb24gcmVjYWxjdWxhdGVSR0IoY29sb3IsIGNvbXBvbmVudCwgY29tcG9uZW50SGV4SW5kZXgpIHtcblxuICBpZiAoY29sb3IuX19zdGF0ZS5zcGFjZSA9PT0gJ0hFWCcpIHtcblxuICAgIGNvbG9yLl9fc3RhdGVbY29tcG9uZW50XSA9IG1hdGguY29tcG9uZW50X2Zyb21faGV4KGNvbG9yLl9fc3RhdGUuaGV4LCBjb21wb25lbnRIZXhJbmRleCk7XG5cbiAgfSBlbHNlIGlmIChjb2xvci5fX3N0YXRlLnNwYWNlID09PSAnSFNWJykge1xuXG4gICAgY29tbW9uLmV4dGVuZChjb2xvci5fX3N0YXRlLCBtYXRoLmhzdl90b19yZ2IoY29sb3IuX19zdGF0ZS5oLCBjb2xvci5fX3N0YXRlLnMsIGNvbG9yLl9fc3RhdGUudikpO1xuXG4gIH0gZWxzZSB7XG5cbiAgICB0aHJvdyAnQ29ycnVwdGVkIGNvbG9yIHN0YXRlJztcblxuICB9XG5cbn1cblxuZnVuY3Rpb24gcmVjYWxjdWxhdGVIU1YoY29sb3IpIHtcblxuICB2YXIgcmVzdWx0ID0gbWF0aC5yZ2JfdG9faHN2KGNvbG9yLnIsIGNvbG9yLmcsIGNvbG9yLmIpO1xuXG4gIGNvbW1vbi5leHRlbmQoY29sb3IuX19zdGF0ZSwge1xuICAgIHM6IHJlc3VsdC5zLFxuICAgIHY6IHJlc3VsdC52XG4gIH0pO1xuXG4gIGlmICghY29tbW9uLmlzTmFOKHJlc3VsdC5oKSkge1xuICAgIGNvbG9yLl9fc3RhdGUuaCA9IHJlc3VsdC5oO1xuICB9IGVsc2UgaWYgKGNvbW1vbi5pc1VuZGVmaW5lZChjb2xvci5fX3N0YXRlLmgpKSB7XG4gICAgY29sb3IuX19zdGF0ZS5oID0gMDtcbiAgfVxuXG59XG4iLCIvKipcbiAqIGRhdC1ndWkgSmF2YVNjcmlwdCBDb250cm9sbGVyIExpYnJhcnlcbiAqIGh0dHA6Ly9jb2RlLmdvb2dsZS5jb20vcC9kYXQtZ3VpXG4gKlxuICogQ29weXJpZ2h0IDIwMTEgRGF0YSBBcnRzIFRlYW0sIEdvb2dsZSBDcmVhdGl2ZSBMYWJcbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBjcmVhdGVJbnRlcnBlcnQoKTtcblxuZnVuY3Rpb24gY3JlYXRlSW50ZXJwZXJ0KCkge1xuICB2YXIgY29tbW9uID0gcmVxdWlyZSgnLi4vdXRpbHMvY29tbW9uLmpzJyk7XG4gIHZhciB0b1N0cmluZyA9IHJlcXVpcmUoJy4vdG9TdHJpbmcuanMnKTtcblxuICB2YXIgcmVzdWx0LCB0b1JldHVybjtcblxuICB2YXIgaW50ZXJwcmV0ID0gZnVuY3Rpb24oKSB7XG5cbiAgICB0b1JldHVybiA9IGZhbHNlO1xuXG4gICAgdmFyIG9yaWdpbmFsID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgPyBjb21tb24udG9BcnJheShhcmd1bWVudHMpIDogYXJndW1lbnRzWzBdO1xuXG4gICAgY29tbW9uLmVhY2goSU5URVJQUkVUQVRJT05TLCBmdW5jdGlvbihmYW1pbHkpIHtcblxuICAgICAgaWYgKGZhbWlseS5saXRtdXMob3JpZ2luYWwpKSB7XG5cbiAgICAgICAgY29tbW9uLmVhY2goZmFtaWx5LmNvbnZlcnNpb25zLCBmdW5jdGlvbihjb252ZXJzaW9uLCBjb252ZXJzaW9uTmFtZSkge1xuXG4gICAgICAgICAgcmVzdWx0ID0gY29udmVyc2lvbi5yZWFkKG9yaWdpbmFsKTtcblxuICAgICAgICAgIGlmICh0b1JldHVybiA9PT0gZmFsc2UgJiYgcmVzdWx0ICE9PSBmYWxzZSkge1xuICAgICAgICAgICAgdG9SZXR1cm4gPSByZXN1bHQ7XG4gICAgICAgICAgICByZXN1bHQuY29udmVyc2lvbk5hbWUgPSBjb252ZXJzaW9uTmFtZTtcbiAgICAgICAgICAgIHJlc3VsdC5jb252ZXJzaW9uID0gY29udmVyc2lvbjtcbiAgICAgICAgICAgIHJldHVybiBjb21tb24uQlJFQUs7XG5cbiAgICAgICAgICB9XG5cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIGNvbW1vbi5CUkVBSztcblxuICAgICAgfVxuXG4gICAgfSk7XG5cbiAgICByZXR1cm4gdG9SZXR1cm47XG5cbiAgfTtcblxuICB2YXIgSU5URVJQUkVUQVRJT05TID0gW1xuXG4gICAgLy8gU3RyaW5nc1xuICAgIHtcblxuICAgICAgbGl0bXVzOiBjb21tb24uaXNTdHJpbmcsXG5cbiAgICAgIGNvbnZlcnNpb25zOiB7XG5cbiAgICAgICAgVEhSRUVfQ0hBUl9IRVg6IHtcblxuICAgICAgICAgIHJlYWQ6IGZ1bmN0aW9uKG9yaWdpbmFsKSB7XG5cbiAgICAgICAgICAgIHZhciB0ZXN0ID0gb3JpZ2luYWwubWF0Y2goL14jKFtBLUYwLTldKShbQS1GMC05XSkoW0EtRjAtOV0pJC9pKTtcbiAgICAgICAgICAgIGlmICh0ZXN0ID09PSBudWxsKSByZXR1cm4gZmFsc2U7XG5cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgIHNwYWNlOiAnSEVYJyxcbiAgICAgICAgICAgICAgaGV4OiBwYXJzZUludChcbiAgICAgICAgICAgICAgICAgICcweCcgK1xuICAgICAgICAgICAgICAgICAgICAgIHRlc3RbMV0udG9TdHJpbmcoKSArIHRlc3RbMV0udG9TdHJpbmcoKSArXG4gICAgICAgICAgICAgICAgICAgICAgdGVzdFsyXS50b1N0cmluZygpICsgdGVzdFsyXS50b1N0cmluZygpICtcbiAgICAgICAgICAgICAgICAgICAgICB0ZXN0WzNdLnRvU3RyaW5nKCkgKyB0ZXN0WzNdLnRvU3RyaW5nKCkpXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgfSxcblxuICAgICAgICAgIHdyaXRlOiB0b1N0cmluZ1xuXG4gICAgICAgIH0sXG5cbiAgICAgICAgU0lYX0NIQVJfSEVYOiB7XG5cbiAgICAgICAgICByZWFkOiBmdW5jdGlvbihvcmlnaW5hbCkge1xuXG4gICAgICAgICAgICB2YXIgdGVzdCA9IG9yaWdpbmFsLm1hdGNoKC9eIyhbQS1GMC05XXs2fSkkL2kpO1xuICAgICAgICAgICAgaWYgKHRlc3QgPT09IG51bGwpIHJldHVybiBmYWxzZTtcblxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgc3BhY2U6ICdIRVgnLFxuICAgICAgICAgICAgICBoZXg6IHBhcnNlSW50KCcweCcgKyB0ZXN0WzFdLnRvU3RyaW5nKCkpXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgfSxcblxuICAgICAgICAgIHdyaXRlOiB0b1N0cmluZ1xuXG4gICAgICAgIH0sXG5cbiAgICAgICAgQ1NTX1JHQjoge1xuXG4gICAgICAgICAgcmVhZDogZnVuY3Rpb24ob3JpZ2luYWwpIHtcblxuICAgICAgICAgICAgdmFyIHRlc3QgPSBvcmlnaW5hbC5tYXRjaCgvXnJnYlxcKFxccyooLispXFxzKixcXHMqKC4rKVxccyosXFxzKiguKylcXHMqXFwpLyk7XG4gICAgICAgICAgICBpZiAodGVzdCA9PT0gbnVsbCkgcmV0dXJuIGZhbHNlO1xuXG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICBzcGFjZTogJ1JHQicsXG4gICAgICAgICAgICAgIHI6IHBhcnNlRmxvYXQodGVzdFsxXSksXG4gICAgICAgICAgICAgIGc6IHBhcnNlRmxvYXQodGVzdFsyXSksXG4gICAgICAgICAgICAgIGI6IHBhcnNlRmxvYXQodGVzdFszXSlcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICB9LFxuXG4gICAgICAgICAgd3JpdGU6IHRvU3RyaW5nXG5cbiAgICAgICAgfSxcblxuICAgICAgICBDU1NfUkdCQToge1xuXG4gICAgICAgICAgcmVhZDogZnVuY3Rpb24ob3JpZ2luYWwpIHtcblxuICAgICAgICAgICAgdmFyIHRlc3QgPSBvcmlnaW5hbC5tYXRjaCgvXnJnYmFcXChcXHMqKC4rKVxccyosXFxzKiguKylcXHMqLFxccyooLispXFxzKlxcLFxccyooLispXFxzKlxcKS8pO1xuICAgICAgICAgICAgaWYgKHRlc3QgPT09IG51bGwpIHJldHVybiBmYWxzZTtcblxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgc3BhY2U6ICdSR0InLFxuICAgICAgICAgICAgICByOiBwYXJzZUZsb2F0KHRlc3RbMV0pLFxuICAgICAgICAgICAgICBnOiBwYXJzZUZsb2F0KHRlc3RbMl0pLFxuICAgICAgICAgICAgICBiOiBwYXJzZUZsb2F0KHRlc3RbM10pLFxuICAgICAgICAgICAgICBhOiBwYXJzZUZsb2F0KHRlc3RbNF0pXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgfSxcblxuICAgICAgICAgIHdyaXRlOiB0b1N0cmluZ1xuXG4gICAgICAgIH1cblxuICAgICAgfVxuXG4gICAgfSxcblxuICAgIC8vIE51bWJlcnNcbiAgICB7XG5cbiAgICAgIGxpdG11czogY29tbW9uLmlzTnVtYmVyLFxuXG4gICAgICBjb252ZXJzaW9uczoge1xuXG4gICAgICAgIEhFWDoge1xuICAgICAgICAgIHJlYWQ6IGZ1bmN0aW9uKG9yaWdpbmFsKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICBzcGFjZTogJ0hFWCcsXG4gICAgICAgICAgICAgIGhleDogb3JpZ2luYWwsXG4gICAgICAgICAgICAgIGNvbnZlcnNpb25OYW1lOiAnSEVYJ1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sXG5cbiAgICAgICAgICB3cml0ZTogZnVuY3Rpb24oY29sb3IpIHtcbiAgICAgICAgICAgIHJldHVybiBjb2xvci5oZXg7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgIH1cblxuICAgIH0sXG5cbiAgICAvLyBBcnJheXNcbiAgICB7XG5cbiAgICAgIGxpdG11czogY29tbW9uLmlzQXJyYXksXG5cbiAgICAgIGNvbnZlcnNpb25zOiB7XG5cbiAgICAgICAgUkdCX0FSUkFZOiB7XG4gICAgICAgICAgcmVhZDogZnVuY3Rpb24ob3JpZ2luYWwpIHtcbiAgICAgICAgICAgIGlmIChvcmlnaW5hbC5sZW5ndGggIT0gMykgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgc3BhY2U6ICdSR0InLFxuICAgICAgICAgICAgICByOiBvcmlnaW5hbFswXSxcbiAgICAgICAgICAgICAgZzogb3JpZ2luYWxbMV0sXG4gICAgICAgICAgICAgIGI6IG9yaWdpbmFsWzJdXG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH0sXG5cbiAgICAgICAgICB3cml0ZTogZnVuY3Rpb24oY29sb3IpIHtcbiAgICAgICAgICAgIHJldHVybiBbY29sb3IuciwgY29sb3IuZywgY29sb3IuYl07XG4gICAgICAgICAgfVxuXG4gICAgICAgIH0sXG5cbiAgICAgICAgUkdCQV9BUlJBWToge1xuICAgICAgICAgIHJlYWQ6IGZ1bmN0aW9uKG9yaWdpbmFsKSB7XG4gICAgICAgICAgICBpZiAob3JpZ2luYWwubGVuZ3RoICE9IDQpIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgIHNwYWNlOiAnUkdCJyxcbiAgICAgICAgICAgICAgcjogb3JpZ2luYWxbMF0sXG4gICAgICAgICAgICAgIGc6IG9yaWdpbmFsWzFdLFxuICAgICAgICAgICAgICBiOiBvcmlnaW5hbFsyXSxcbiAgICAgICAgICAgICAgYTogb3JpZ2luYWxbM11cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgfSxcblxuICAgICAgICAgIHdyaXRlOiBmdW5jdGlvbihjb2xvcikge1xuICAgICAgICAgICAgcmV0dXJuIFtjb2xvci5yLCBjb2xvci5nLCBjb2xvci5iLCBjb2xvci5hXTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgfVxuXG4gICAgICB9XG5cbiAgICB9LFxuXG4gICAgLy8gT2JqZWN0c1xuICAgIHtcblxuICAgICAgbGl0bXVzOiBjb21tb24uaXNPYmplY3QsXG5cbiAgICAgIGNvbnZlcnNpb25zOiB7XG5cbiAgICAgICAgUkdCQV9PQko6IHtcbiAgICAgICAgICByZWFkOiBmdW5jdGlvbihvcmlnaW5hbCkge1xuICAgICAgICAgICAgaWYgKGNvbW1vbi5pc051bWJlcihvcmlnaW5hbC5yKSAmJlxuICAgICAgICAgICAgICAgIGNvbW1vbi5pc051bWJlcihvcmlnaW5hbC5nKSAmJlxuICAgICAgICAgICAgICAgIGNvbW1vbi5pc051bWJlcihvcmlnaW5hbC5iKSAmJlxuICAgICAgICAgICAgICAgIGNvbW1vbi5pc051bWJlcihvcmlnaW5hbC5hKSkge1xuICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHNwYWNlOiAnUkdCJyxcbiAgICAgICAgICAgICAgICByOiBvcmlnaW5hbC5yLFxuICAgICAgICAgICAgICAgIGc6IG9yaWdpbmFsLmcsXG4gICAgICAgICAgICAgICAgYjogb3JpZ2luYWwuYixcbiAgICAgICAgICAgICAgICBhOiBvcmlnaW5hbC5hXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB9LFxuXG4gICAgICAgICAgd3JpdGU6IGZ1bmN0aW9uKGNvbG9yKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICByOiBjb2xvci5yLFxuICAgICAgICAgICAgICBnOiBjb2xvci5nLFxuICAgICAgICAgICAgICBiOiBjb2xvci5iLFxuICAgICAgICAgICAgICBhOiBjb2xvci5hXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIFJHQl9PQko6IHtcbiAgICAgICAgICByZWFkOiBmdW5jdGlvbihvcmlnaW5hbCkge1xuICAgICAgICAgICAgaWYgKGNvbW1vbi5pc051bWJlcihvcmlnaW5hbC5yKSAmJlxuICAgICAgICAgICAgICAgIGNvbW1vbi5pc051bWJlcihvcmlnaW5hbC5nKSAmJlxuICAgICAgICAgICAgICAgIGNvbW1vbi5pc051bWJlcihvcmlnaW5hbC5iKSkge1xuICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHNwYWNlOiAnUkdCJyxcbiAgICAgICAgICAgICAgICByOiBvcmlnaW5hbC5yLFxuICAgICAgICAgICAgICAgIGc6IG9yaWdpbmFsLmcsXG4gICAgICAgICAgICAgICAgYjogb3JpZ2luYWwuYlxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgfSxcblxuICAgICAgICAgIHdyaXRlOiBmdW5jdGlvbihjb2xvcikge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgcjogY29sb3IucixcbiAgICAgICAgICAgICAgZzogY29sb3IuZyxcbiAgICAgICAgICAgICAgYjogY29sb3IuYlxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBIU1ZBX09CSjoge1xuICAgICAgICAgIHJlYWQ6IGZ1bmN0aW9uKG9yaWdpbmFsKSB7XG4gICAgICAgICAgICBpZiAoY29tbW9uLmlzTnVtYmVyKG9yaWdpbmFsLmgpICYmXG4gICAgICAgICAgICAgICAgY29tbW9uLmlzTnVtYmVyKG9yaWdpbmFsLnMpICYmXG4gICAgICAgICAgICAgICAgY29tbW9uLmlzTnVtYmVyKG9yaWdpbmFsLnYpICYmXG4gICAgICAgICAgICAgICAgY29tbW9uLmlzTnVtYmVyKG9yaWdpbmFsLmEpKSB7XG4gICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3BhY2U6ICdIU1YnLFxuICAgICAgICAgICAgICAgIGg6IG9yaWdpbmFsLmgsXG4gICAgICAgICAgICAgICAgczogb3JpZ2luYWwucyxcbiAgICAgICAgICAgICAgICB2OiBvcmlnaW5hbC52LFxuICAgICAgICAgICAgICAgIGE6IG9yaWdpbmFsLmFcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIH0sXG5cbiAgICAgICAgICB3cml0ZTogZnVuY3Rpb24oY29sb3IpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgIGg6IGNvbG9yLmgsXG4gICAgICAgICAgICAgIHM6IGNvbG9yLnMsXG4gICAgICAgICAgICAgIHY6IGNvbG9yLnYsXG4gICAgICAgICAgICAgIGE6IGNvbG9yLmFcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgSFNWX09CSjoge1xuICAgICAgICAgIHJlYWQ6IGZ1bmN0aW9uKG9yaWdpbmFsKSB7XG4gICAgICAgICAgICBpZiAoY29tbW9uLmlzTnVtYmVyKG9yaWdpbmFsLmgpICYmXG4gICAgICAgICAgICAgICAgY29tbW9uLmlzTnVtYmVyKG9yaWdpbmFsLnMpICYmXG4gICAgICAgICAgICAgICAgY29tbW9uLmlzTnVtYmVyKG9yaWdpbmFsLnYpKSB7XG4gICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3BhY2U6ICdIU1YnLFxuICAgICAgICAgICAgICAgIGg6IG9yaWdpbmFsLmgsXG4gICAgICAgICAgICAgICAgczogb3JpZ2luYWwucyxcbiAgICAgICAgICAgICAgICB2OiBvcmlnaW5hbC52XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB9LFxuXG4gICAgICAgICAgd3JpdGU6IGZ1bmN0aW9uKGNvbG9yKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICBoOiBjb2xvci5oLFxuICAgICAgICAgICAgICBzOiBjb2xvci5zLFxuICAgICAgICAgICAgICB2OiBjb2xvci52XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgIH1cblxuICAgICAgfVxuXG4gICAgfVxuXG5cbiAgXTtcblxuICByZXR1cm4gaW50ZXJwcmV0O1xuXG5cbn1cbiIsIi8qKlxuICogZGF0LWd1aSBKYXZhU2NyaXB0IENvbnRyb2xsZXIgTGlicmFyeVxuICogaHR0cDovL2NvZGUuZ29vZ2xlLmNvbS9wL2RhdC1ndWlcbiAqXG4gKiBDb3B5cmlnaHQgMjAxMSBEYXRhIEFydHMgVGVhbSwgR29vZ2xlIENyZWF0aXZlIExhYlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IG1hdGgoKTtcblxuZnVuY3Rpb24gbWF0aCgpIHtcblxuICB2YXIgdG1wQ29tcG9uZW50O1xuXG4gIHJldHVybiB7XG5cbiAgICBoc3ZfdG9fcmdiOiBmdW5jdGlvbihoLCBzLCB2KSB7XG5cbiAgICAgIHZhciBoaSA9IE1hdGguZmxvb3IoaCAvIDYwKSAlIDY7XG5cbiAgICAgIHZhciBmID0gaCAvIDYwIC0gTWF0aC5mbG9vcihoIC8gNjApO1xuICAgICAgdmFyIHAgPSB2ICogKDEuMCAtIHMpO1xuICAgICAgdmFyIHEgPSB2ICogKDEuMCAtIChmICogcykpO1xuICAgICAgdmFyIHQgPSB2ICogKDEuMCAtICgoMS4wIC0gZikgKiBzKSk7XG4gICAgICB2YXIgYyA9IFtcbiAgICAgICAgW3YsIHQsIHBdLFxuICAgICAgICBbcSwgdiwgcF0sXG4gICAgICAgIFtwLCB2LCB0XSxcbiAgICAgICAgW3AsIHEsIHZdLFxuICAgICAgICBbdCwgcCwgdl0sXG4gICAgICAgIFt2LCBwLCBxXVxuICAgICAgXVtoaV07XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIHI6IGNbMF0gKiAyNTUsXG4gICAgICAgIGc6IGNbMV0gKiAyNTUsXG4gICAgICAgIGI6IGNbMl0gKiAyNTVcbiAgICAgIH07XG5cbiAgICB9LFxuXG4gICAgcmdiX3RvX2hzdjogZnVuY3Rpb24ociwgZywgYikge1xuXG4gICAgICB2YXIgbWluID0gTWF0aC5taW4ociwgZywgYiksXG4gICAgICAgIG1heCA9IE1hdGgubWF4KHIsIGcsIGIpLFxuICAgICAgICBkZWx0YSA9IG1heCAtIG1pbixcbiAgICAgICAgaCwgcztcblxuICAgICAgaWYgKG1heCAhPSAwKSB7XG4gICAgICAgIHMgPSBkZWx0YSAvIG1heDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgaDogTmFOLFxuICAgICAgICAgIHM6IDAsXG4gICAgICAgICAgdjogMFxuICAgICAgICB9O1xuICAgICAgfVxuXG4gICAgICBpZiAociA9PSBtYXgpIHtcbiAgICAgICAgaCA9IChnIC0gYikgLyBkZWx0YTtcbiAgICAgIH0gZWxzZSBpZiAoZyA9PSBtYXgpIHtcbiAgICAgICAgaCA9IDIgKyAoYiAtIHIpIC8gZGVsdGE7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBoID0gNCArIChyIC0gZykgLyBkZWx0YTtcbiAgICAgIH1cbiAgICAgIGggLz0gNjtcbiAgICAgIGlmIChoIDwgMCkge1xuICAgICAgICBoICs9IDE7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIGg6IGggKiAzNjAsXG4gICAgICAgIHM6IHMsXG4gICAgICAgIHY6IG1heCAvIDI1NVxuICAgICAgfTtcbiAgICB9LFxuXG4gICAgcmdiX3RvX2hleDogZnVuY3Rpb24ociwgZywgYikge1xuICAgICAgdmFyIGhleCA9IHRoaXMuaGV4X3dpdGhfY29tcG9uZW50KDAsIDIsIHIpO1xuICAgICAgaGV4ID0gdGhpcy5oZXhfd2l0aF9jb21wb25lbnQoaGV4LCAxLCBnKTtcbiAgICAgIGhleCA9IHRoaXMuaGV4X3dpdGhfY29tcG9uZW50KGhleCwgMCwgYik7XG4gICAgICByZXR1cm4gaGV4O1xuICAgIH0sXG5cbiAgICBjb21wb25lbnRfZnJvbV9oZXg6IGZ1bmN0aW9uKGhleCwgY29tcG9uZW50SW5kZXgpIHtcbiAgICAgIHJldHVybiAoaGV4ID4+IChjb21wb25lbnRJbmRleCAqIDgpKSAmIDB4RkY7XG4gICAgfSxcblxuICAgIGhleF93aXRoX2NvbXBvbmVudDogZnVuY3Rpb24oaGV4LCBjb21wb25lbnRJbmRleCwgdmFsdWUpIHtcbiAgICAgIHJldHVybiB2YWx1ZSA8PCAodG1wQ29tcG9uZW50ID0gY29tcG9uZW50SW5kZXggKiA4KSB8IChoZXggJiB+KDB4RkYgPDwgdG1wQ29tcG9uZW50KSk7XG4gICAgfVxuXG4gIH07XG59XG4iLCIvKipcbiAqIGRhdC1ndWkgSmF2YVNjcmlwdCBDb250cm9sbGVyIExpYnJhcnlcbiAqIGh0dHA6Ly9jb2RlLmdvb2dsZS5jb20vcC9kYXQtZ3VpXG4gKlxuICogQ29weXJpZ2h0IDIwMTEgRGF0YSBBcnRzIFRlYW0sIEdvb2dsZSBDcmVhdGl2ZSBMYWJcbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKi9cblxudmFyIGNvbW1vbiA9IHJlcXVpcmUoJy4uL3V0aWxzL2NvbW1vbi5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHRvU3RyaW5nO1xuXG5mdW5jdGlvbiB0b1N0cmluZyhjb2xvcikge1xuXG4gIGlmIChjb2xvci5hID09IDEgfHwgY29tbW9uLmlzVW5kZWZpbmVkKGNvbG9yLmEpKSB7XG5cbiAgICB2YXIgcyA9IGNvbG9yLmhleC50b1N0cmluZygxNik7XG4gICAgd2hpbGUgKHMubGVuZ3RoIDwgNikge1xuICAgICAgcyA9ICcwJyArIHM7XG4gICAgfVxuXG4gICAgcmV0dXJuICcjJyArIHM7XG5cbiAgfSBlbHNlIHtcblxuICAgIHJldHVybiAncmdiYSgnICsgTWF0aC5yb3VuZChjb2xvci5yKSArICcsJyArIE1hdGgucm91bmQoY29sb3IuZykgKyAnLCcgKyBNYXRoLnJvdW5kKGNvbG9yLmIpICsgJywnICsgY29sb3IuYSArICcpJztcblxuICB9XG5cbn1cbiIsIi8qKlxuICogZGF0LWd1aSBKYXZhU2NyaXB0IENvbnRyb2xsZXIgTGlicmFyeVxuICogaHR0cDovL2NvZGUuZ29vZ2xlLmNvbS9wL2RhdC1ndWlcbiAqXG4gKiBDb3B5cmlnaHQgMjAxMSBEYXRhIEFydHMgVGVhbSwgR29vZ2xlIENyZWF0aXZlIExhYlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqL1xuXG52YXIgQ29udHJvbGxlciA9IHJlcXVpcmUoJy4vQ29udHJvbGxlci5qcycpO1xudmFyIGNvbW1vbiA9IHJlcXVpcmUoJy4uL3V0aWxzL2NvbW1vbi5qcycpO1xudmFyIGRvbSA9IHJlcXVpcmUoJy4uL2RvbS9kb20uanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBCb29sZWFuQ29udHJvbGxlcjtcblxuLyoqXG4gKiBAY2xhc3MgUHJvdmlkZXMgYSBjaGVja2JveCBpbnB1dCB0byBhbHRlciB0aGUgYm9vbGVhbiBwcm9wZXJ0eSBvZiBhbiBvYmplY3QuXG4gKiBAZXh0ZW5kcyBkYXQuY29udHJvbGxlcnMuQ29udHJvbGxlclxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBiZSBtYW5pcHVsYXRlZFxuICogQHBhcmFtIHtzdHJpbmd9IHByb3BlcnR5IFRoZSBuYW1lIG9mIHRoZSBwcm9wZXJ0eSB0byBiZSBtYW5pcHVsYXRlZFxuICpcbiAqIEBtZW1iZXIgZGF0LmNvbnRyb2xsZXJzXG4gKi9cbmZ1bmN0aW9uIEJvb2xlYW5Db250cm9sbGVyKG9iamVjdCwgcHJvcGVydHkpIHtcblxuICBCb29sZWFuQ29udHJvbGxlci5zdXBlcmNsYXNzLmNhbGwodGhpcywgb2JqZWN0LCBwcm9wZXJ0eSk7XG5cbiAgdmFyIF90aGlzID0gdGhpcztcbiAgdGhpcy5fX3ByZXYgPSB0aGlzLmdldFZhbHVlKCk7XG5cbiAgdGhpcy5fX2NoZWNrYm94ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcbiAgdGhpcy5fX2NoZWNrYm94LnNldEF0dHJpYnV0ZSgndHlwZScsICdjaGVja2JveCcpO1xuXG5cbiAgZG9tLmJpbmQodGhpcy5fX2NoZWNrYm94LCAnY2hhbmdlJywgb25DaGFuZ2UsIGZhbHNlKTtcblxuICB0aGlzLmRvbUVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5fX2NoZWNrYm94KTtcblxuICAvLyBNYXRjaCBvcmlnaW5hbCB2YWx1ZVxuICB0aGlzLnVwZGF0ZURpc3BsYXkoKTtcblxuICBmdW5jdGlvbiBvbkNoYW5nZSgpIHtcbiAgICBfdGhpcy5zZXRWYWx1ZSghX3RoaXMuX19wcmV2KTtcbiAgfVxuXG59XG5cbkJvb2xlYW5Db250cm9sbGVyLnN1cGVyY2xhc3MgPSBDb250cm9sbGVyO1xuXG5jb21tb24uZXh0ZW5kKFxuXG4gIEJvb2xlYW5Db250cm9sbGVyLnByb3RvdHlwZSxcbiAgQ29udHJvbGxlci5wcm90b3R5cGUsXG4gIHtcbiAgICBzZXRWYWx1ZTogZnVuY3Rpb24odikge1xuICAgICAgdmFyIHRvUmV0dXJuID0gQm9vbGVhbkNvbnRyb2xsZXIuc3VwZXJjbGFzcy5wcm90b3R5cGUuc2V0VmFsdWUuY2FsbCh0aGlzLCB2KTtcbiAgICAgIGlmICh0aGlzLl9fb25GaW5pc2hDaGFuZ2UpIHtcbiAgICAgICAgdGhpcy5fX29uRmluaXNoQ2hhbmdlLmNhbGwodGhpcywgdGhpcy5nZXRWYWx1ZSgpKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX19wcmV2ID0gdGhpcy5nZXRWYWx1ZSgpO1xuICAgICAgcmV0dXJuIHRvUmV0dXJuO1xuICAgIH0sXG5cbiAgICB1cGRhdGVEaXNwbGF5OiBmdW5jdGlvbigpIHtcblxuICAgICAgaWYgKHRoaXMuZ2V0VmFsdWUoKSA9PT0gdHJ1ZSkge1xuICAgICAgICB0aGlzLl9fY2hlY2tib3guc2V0QXR0cmlidXRlKCdjaGVja2VkJywgJ2NoZWNrZWQnKTtcbiAgICAgICAgdGhpcy5fX2NoZWNrYm94LmNoZWNrZWQgPSB0cnVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fX2NoZWNrYm94LmNoZWNrZWQgPSBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIEJvb2xlYW5Db250cm9sbGVyLnN1cGVyY2xhc3MucHJvdG90eXBlLnVwZGF0ZURpc3BsYXkuY2FsbCh0aGlzKTtcblxuICAgIH1cbiAgfVxuKTtcbiIsIi8qKlxuICogZGF0LWd1aSBKYXZhU2NyaXB0IENvbnRyb2xsZXIgTGlicmFyeVxuICogaHR0cDovL2NvZGUuZ29vZ2xlLmNvbS9wL2RhdC1ndWlcbiAqXG4gKiBDb3B5cmlnaHQgMjAxMSBEYXRhIEFydHMgVGVhbSwgR29vZ2xlIENyZWF0aXZlIExhYlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqL1xuXG52YXIgQ29udHJvbGxlciA9IHJlcXVpcmUoJy4vQ29udHJvbGxlci5qcycpO1xudmFyIGNvbW1vbiA9IHJlcXVpcmUoJy4uL3V0aWxzL2NvbW1vbi5qcycpO1xudmFyIGRvbSA9IHJlcXVpcmUoJy4uL2RvbS9kb20uanMnKTtcbnZhciBDb2xvciA9IHJlcXVpcmUoJy4uL2NvbG9yL0NvbG9yLmpzJyk7XG52YXIgaW50ZXJwcmV0ID0gcmVxdWlyZSgnLi4vY29sb3IvaW50ZXJwcmV0LmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gQ29sb3JDb250cm9sbGVyO1xuXG5mdW5jdGlvbiBDb2xvckNvbnRyb2xsZXIob2JqZWN0LCBwcm9wZXJ0eSkge1xuXG4gIENvbG9yQ29udHJvbGxlci5zdXBlcmNsYXNzLmNhbGwodGhpcywgb2JqZWN0LCBwcm9wZXJ0eSk7XG5cbiAgdGhpcy5fX2NvbG9yID0gbmV3IENvbG9yKHRoaXMuZ2V0VmFsdWUoKSk7XG4gIHRoaXMuX190ZW1wID0gbmV3IENvbG9yKDApO1xuXG4gIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgdGhpcy5kb21FbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cbiAgZG9tLm1ha2VTZWxlY3RhYmxlKHRoaXMuZG9tRWxlbWVudCwgZmFsc2UpO1xuXG4gIHRoaXMuX19zZWxlY3RvciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICB0aGlzLl9fc2VsZWN0b3IuY2xhc3NOYW1lID0gJ3NlbGVjdG9yJztcblxuICB0aGlzLl9fc2F0dXJhdGlvbl9maWVsZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICB0aGlzLl9fc2F0dXJhdGlvbl9maWVsZC5jbGFzc05hbWUgPSAnc2F0dXJhdGlvbi1maWVsZCc7XG5cbiAgdGhpcy5fX2ZpZWxkX2tub2IgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgdGhpcy5fX2ZpZWxkX2tub2IuY2xhc3NOYW1lID0gJ2ZpZWxkLWtub2InO1xuICB0aGlzLl9fZmllbGRfa25vYl9ib3JkZXIgPSAnMnB4IHNvbGlkICc7XG5cbiAgdGhpcy5fX2h1ZV9rbm9iID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIHRoaXMuX19odWVfa25vYi5jbGFzc05hbWUgPSAnaHVlLWtub2InO1xuXG4gIHRoaXMuX19odWVfZmllbGQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgdGhpcy5fX2h1ZV9maWVsZC5jbGFzc05hbWUgPSAnaHVlLWZpZWxkJztcblxuICB0aGlzLl9faW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xuICB0aGlzLl9faW5wdXQudHlwZSA9ICd0ZXh0JztcbiAgdGhpcy5fX2lucHV0X3RleHRTaGFkb3cgPSAnMCAxcHggMXB4ICc7XG5cbiAgZG9tLmJpbmQodGhpcy5fX2lucHV0LCAna2V5ZG93bicsIGZ1bmN0aW9uKGUpIHtcbiAgICBpZiAoZS5rZXlDb2RlID09PSAxMykgeyAvLyBvbiBlbnRlclxuICAgICAgb25CbHVyLmNhbGwodGhpcyk7XG4gICAgfVxuICB9KTtcblxuICBkb20uYmluZCh0aGlzLl9faW5wdXQsICdibHVyJywgb25CbHVyKTtcblxuICBkb20uYmluZCh0aGlzLl9fc2VsZWN0b3IsICdtb3VzZWRvd24nLCBmdW5jdGlvbihlKSB7XG5cbiAgICBkb21cbiAgICAgIC5hZGRDbGFzcyh0aGlzLCAnZHJhZycpXG4gICAgICAuYmluZCh3aW5kb3csICdtb3VzZXVwJywgZnVuY3Rpb24oZSkge1xuICAgICAgICBkb20ucmVtb3ZlQ2xhc3MoX3RoaXMuX19zZWxlY3RvciwgJ2RyYWcnKTtcbiAgICAgIH0pO1xuXG4gIH0pO1xuXG4gIHZhciB2YWx1ZV9maWVsZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXG4gIGNvbW1vbi5leHRlbmQodGhpcy5fX3NlbGVjdG9yLnN0eWxlLCB7XG4gICAgd2lkdGg6ICcxMjJweCcsXG4gICAgaGVpZ2h0OiAnMTAycHgnLFxuICAgIHBhZGRpbmc6ICczcHgnLFxuICAgIGJhY2tncm91bmRDb2xvcjogJyMyMjInLFxuICAgIGJveFNoYWRvdzogJzBweCAxcHggM3B4IHJnYmEoMCwwLDAsMC4zKSdcbiAgfSk7XG5cbiAgY29tbW9uLmV4dGVuZCh0aGlzLl9fZmllbGRfa25vYi5zdHlsZSwge1xuICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxuICAgIHdpZHRoOiAnMTJweCcsXG4gICAgaGVpZ2h0OiAnMTJweCcsXG4gICAgYm9yZGVyOiB0aGlzLl9fZmllbGRfa25vYl9ib3JkZXIgKyAodGhpcy5fX2NvbG9yLnYgPCAuNSA/ICcjZmZmJyA6ICcjMDAwJyksXG4gICAgYm94U2hhZG93OiAnMHB4IDFweCAzcHggcmdiYSgwLDAsMCwwLjUpJyxcbiAgICBib3JkZXJSYWRpdXM6ICcxMnB4JyxcbiAgICB6SW5kZXg6IDFcbiAgfSk7XG5cbiAgY29tbW9uLmV4dGVuZCh0aGlzLl9faHVlX2tub2Iuc3R5bGUsIHtcbiAgICBwb3NpdGlvbjogJ2Fic29sdXRlJyxcbiAgICB3aWR0aDogJzE1cHgnLFxuICAgIGhlaWdodDogJzJweCcsXG4gICAgYm9yZGVyUmlnaHQ6ICc0cHggc29saWQgI2ZmZicsXG4gICAgekluZGV4OiAxXG4gIH0pO1xuXG4gIGNvbW1vbi5leHRlbmQodGhpcy5fX3NhdHVyYXRpb25fZmllbGQuc3R5bGUsIHtcbiAgICB3aWR0aDogJzEwMHB4JyxcbiAgICBoZWlnaHQ6ICcxMDBweCcsXG4gICAgYm9yZGVyOiAnMXB4IHNvbGlkICM1NTUnLFxuICAgIG1hcmdpblJpZ2h0OiAnM3B4JyxcbiAgICBkaXNwbGF5OiAnaW5saW5lLWJsb2NrJyxcbiAgICBjdXJzb3I6ICdwb2ludGVyJ1xuICB9KTtcblxuICBjb21tb24uZXh0ZW5kKHZhbHVlX2ZpZWxkLnN0eWxlLCB7XG4gICAgd2lkdGg6ICcxMDAlJyxcbiAgICBoZWlnaHQ6ICcxMDAlJyxcbiAgICBiYWNrZ3JvdW5kOiAnbm9uZSdcbiAgfSk7XG5cbiAgbGluZWFyR3JhZGllbnQodmFsdWVfZmllbGQsICd0b3AnLCAncmdiYSgwLDAsMCwwKScsICcjMDAwJyk7XG5cbiAgY29tbW9uLmV4dGVuZCh0aGlzLl9faHVlX2ZpZWxkLnN0eWxlLCB7XG4gICAgd2lkdGg6ICcxNXB4JyxcbiAgICBoZWlnaHQ6ICcxMDBweCcsXG4gICAgZGlzcGxheTogJ2lubGluZS1ibG9jaycsXG4gICAgYm9yZGVyOiAnMXB4IHNvbGlkICM1NTUnLFxuICAgIGN1cnNvcjogJ25zLXJlc2l6ZSdcbiAgfSk7XG5cbiAgaHVlR3JhZGllbnQodGhpcy5fX2h1ZV9maWVsZCk7XG5cbiAgY29tbW9uLmV4dGVuZCh0aGlzLl9faW5wdXQuc3R5bGUsIHtcbiAgICBvdXRsaW5lOiAnbm9uZScsXG4gICAgLy8gICAgICB3aWR0aDogJzEyMHB4JyxcbiAgICB0ZXh0QWxpZ246ICdjZW50ZXInLFxuICAgIC8vICAgICAgcGFkZGluZzogJzRweCcsXG4gICAgLy8gICAgICBtYXJnaW5Cb3R0b206ICc2cHgnLFxuICAgIGNvbG9yOiAnI2ZmZicsXG4gICAgYm9yZGVyOiAwLFxuICAgIGZvbnRXZWlnaHQ6ICdib2xkJyxcbiAgICB0ZXh0U2hhZG93OiB0aGlzLl9faW5wdXRfdGV4dFNoYWRvdyArICdyZ2JhKDAsMCwwLDAuNyknXG4gIH0pO1xuXG4gIGRvbS5iaW5kKHRoaXMuX19zYXR1cmF0aW9uX2ZpZWxkLCAnbW91c2Vkb3duJywgZmllbGREb3duKTtcbiAgZG9tLmJpbmQodGhpcy5fX2ZpZWxkX2tub2IsICdtb3VzZWRvd24nLCBmaWVsZERvd24pO1xuXG4gIGRvbS5iaW5kKHRoaXMuX19odWVfZmllbGQsICdtb3VzZWRvd24nLCBmdW5jdGlvbihlKSB7XG4gICAgc2V0SChlKTtcbiAgICBkb20uYmluZCh3aW5kb3csICdtb3VzZW1vdmUnLCBzZXRIKTtcbiAgICBkb20uYmluZCh3aW5kb3csICdtb3VzZXVwJywgdW5iaW5kSCk7XG4gIH0pO1xuXG4gIGZ1bmN0aW9uIGZpZWxkRG93bihlKSB7XG4gICAgc2V0U1YoZSk7XG4gICAgLy8gZG9jdW1lbnQuYm9keS5zdHlsZS5jdXJzb3IgPSAnbm9uZSc7XG4gICAgZG9tLmJpbmQod2luZG93LCAnbW91c2Vtb3ZlJywgc2V0U1YpO1xuICAgIGRvbS5iaW5kKHdpbmRvdywgJ21vdXNldXAnLCB1bmJpbmRTVik7XG4gIH1cblxuICBmdW5jdGlvbiB1bmJpbmRTVigpIHtcbiAgICBkb20udW5iaW5kKHdpbmRvdywgJ21vdXNlbW92ZScsIHNldFNWKTtcbiAgICBkb20udW5iaW5kKHdpbmRvdywgJ21vdXNldXAnLCB1bmJpbmRTVik7XG4gICAgLy8gZG9jdW1lbnQuYm9keS5zdHlsZS5jdXJzb3IgPSAnZGVmYXVsdCc7XG4gIH1cblxuICBmdW5jdGlvbiBvbkJsdXIoKSB7XG4gICAgdmFyIGkgPSBpbnRlcnByZXQodGhpcy52YWx1ZSk7XG4gICAgaWYgKGkgIT09IGZhbHNlKSB7XG4gICAgICBfdGhpcy5fX2NvbG9yLl9fc3RhdGUgPSBpO1xuICAgICAgX3RoaXMuc2V0VmFsdWUoX3RoaXMuX19jb2xvci50b09yaWdpbmFsKCkpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnZhbHVlID0gX3RoaXMuX19jb2xvci50b1N0cmluZygpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHVuYmluZEgoKSB7XG4gICAgZG9tLnVuYmluZCh3aW5kb3csICdtb3VzZW1vdmUnLCBzZXRIKTtcbiAgICBkb20udW5iaW5kKHdpbmRvdywgJ21vdXNldXAnLCB1bmJpbmRIKTtcbiAgfVxuXG4gIHRoaXMuX19zYXR1cmF0aW9uX2ZpZWxkLmFwcGVuZENoaWxkKHZhbHVlX2ZpZWxkKTtcbiAgdGhpcy5fX3NlbGVjdG9yLmFwcGVuZENoaWxkKHRoaXMuX19maWVsZF9rbm9iKTtcbiAgdGhpcy5fX3NlbGVjdG9yLmFwcGVuZENoaWxkKHRoaXMuX19zYXR1cmF0aW9uX2ZpZWxkKTtcbiAgdGhpcy5fX3NlbGVjdG9yLmFwcGVuZENoaWxkKHRoaXMuX19odWVfZmllbGQpO1xuICB0aGlzLl9faHVlX2ZpZWxkLmFwcGVuZENoaWxkKHRoaXMuX19odWVfa25vYik7XG5cbiAgdGhpcy5kb21FbGVtZW50LmFwcGVuZENoaWxkKHRoaXMuX19pbnB1dCk7XG4gIHRoaXMuZG9tRWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLl9fc2VsZWN0b3IpO1xuXG4gIHRoaXMudXBkYXRlRGlzcGxheSgpO1xuXG4gIGZ1bmN0aW9uIHNldFNWKGUpIHtcblxuICAgIGUucHJldmVudERlZmF1bHQoKTtcblxuICAgIHZhciB3ID0gZG9tLmdldFdpZHRoKF90aGlzLl9fc2F0dXJhdGlvbl9maWVsZCk7XG4gICAgdmFyIG8gPSBkb20uZ2V0T2Zmc2V0KF90aGlzLl9fc2F0dXJhdGlvbl9maWVsZCk7XG4gICAgdmFyIHMgPSAoZS5jbGllbnRYIC0gby5sZWZ0ICsgZG9jdW1lbnQuYm9keS5zY3JvbGxMZWZ0KSAvIHc7XG4gICAgdmFyIHYgPSAxIC0gKGUuY2xpZW50WSAtIG8udG9wICsgZG9jdW1lbnQuYm9keS5zY3JvbGxUb3ApIC8gdztcblxuICAgIGlmICh2ID4gMSkgdiA9IDE7XG4gICAgZWxzZSBpZiAodiA8IDApIHYgPSAwO1xuXG4gICAgaWYgKHMgPiAxKSBzID0gMTtcbiAgICBlbHNlIGlmIChzIDwgMCkgcyA9IDA7XG5cbiAgICBfdGhpcy5fX2NvbG9yLnYgPSB2O1xuICAgIF90aGlzLl9fY29sb3IucyA9IHM7XG5cbiAgICBfdGhpcy5zZXRWYWx1ZShfdGhpcy5fX2NvbG9yLnRvT3JpZ2luYWwoKSk7XG5cblxuICAgIHJldHVybiBmYWxzZTtcblxuICB9XG5cbiAgZnVuY3Rpb24gc2V0SChlKSB7XG5cbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICB2YXIgcyA9IGRvbS5nZXRIZWlnaHQoX3RoaXMuX19odWVfZmllbGQpO1xuICAgIHZhciBvID0gZG9tLmdldE9mZnNldChfdGhpcy5fX2h1ZV9maWVsZCk7XG4gICAgdmFyIGggPSAxIC0gKGUuY2xpZW50WSAtIG8udG9wICsgZG9jdW1lbnQuYm9keS5zY3JvbGxUb3ApIC8gcztcblxuICAgIGlmIChoID4gMSkgaCA9IDE7XG4gICAgZWxzZSBpZiAoaCA8IDApIGggPSAwO1xuXG4gICAgX3RoaXMuX19jb2xvci5oID0gaCAqIDM2MDtcblxuICAgIF90aGlzLnNldFZhbHVlKF90aGlzLl9fY29sb3IudG9PcmlnaW5hbCgpKTtcblxuICAgIHJldHVybiBmYWxzZTtcblxuICB9XG5cbn07XG5cbkNvbG9yQ29udHJvbGxlci5zdXBlcmNsYXNzID0gQ29udHJvbGxlcjtcblxuY29tbW9uLmV4dGVuZChcblxuICBDb2xvckNvbnRyb2xsZXIucHJvdG90eXBlLFxuICBDb250cm9sbGVyLnByb3RvdHlwZSxcblxuICB7XG5cbiAgICB1cGRhdGVEaXNwbGF5OiBmdW5jdGlvbigpIHtcblxuICAgICAgdmFyIGkgPSBpbnRlcnByZXQodGhpcy5nZXRWYWx1ZSgpKTtcblxuICAgICAgaWYgKGkgIT09IGZhbHNlKSB7XG5cbiAgICAgICAgdmFyIG1pc21hdGNoID0gZmFsc2U7XG5cbiAgICAgICAgLy8gQ2hlY2sgZm9yIG1pc21hdGNoIG9uIHRoZSBpbnRlcnByZXRlZCB2YWx1ZS5cblxuICAgICAgICBjb21tb24uZWFjaChDb2xvci5DT01QT05FTlRTLCBmdW5jdGlvbihjb21wb25lbnQpIHtcbiAgICAgICAgICBpZiAoIWNvbW1vbi5pc1VuZGVmaW5lZChpW2NvbXBvbmVudF0pICYmXG4gICAgICAgICAgICAhY29tbW9uLmlzVW5kZWZpbmVkKHRoaXMuX19jb2xvci5fX3N0YXRlW2NvbXBvbmVudF0pICYmXG4gICAgICAgICAgICBpW2NvbXBvbmVudF0gIT09IHRoaXMuX19jb2xvci5fX3N0YXRlW2NvbXBvbmVudF0pIHtcbiAgICAgICAgICAgIG1pc21hdGNoID0gdHJ1ZTtcbiAgICAgICAgICAgIHJldHVybiB7fTsgLy8gYnJlYWtcbiAgICAgICAgICB9XG4gICAgICAgIH0sIHRoaXMpO1xuXG4gICAgICAgIC8vIElmIG5vdGhpbmcgZGl2ZXJnZXMsIHdlIGtlZXAgb3VyIHByZXZpb3VzIHZhbHVlc1xuICAgICAgICAvLyBmb3Igc3RhdGVmdWxuZXNzLCBvdGhlcndpc2Ugd2UgcmVjYWxjdWxhdGUgZnJlc2hcbiAgICAgICAgaWYgKG1pc21hdGNoKSB7XG4gICAgICAgICAgY29tbW9uLmV4dGVuZCh0aGlzLl9fY29sb3IuX19zdGF0ZSwgaSk7XG4gICAgICAgIH1cblxuICAgICAgfVxuXG4gICAgICBjb21tb24uZXh0ZW5kKHRoaXMuX190ZW1wLl9fc3RhdGUsIHRoaXMuX19jb2xvci5fX3N0YXRlKTtcblxuICAgICAgdGhpcy5fX3RlbXAuYSA9IDE7XG5cbiAgICAgIHZhciBmbGlwID0gKHRoaXMuX19jb2xvci52IDwgLjUgfHwgdGhpcy5fX2NvbG9yLnMgPiAuNSkgPyAyNTUgOiAwO1xuICAgICAgdmFyIF9mbGlwID0gMjU1IC0gZmxpcDtcblxuICAgICAgY29tbW9uLmV4dGVuZCh0aGlzLl9fZmllbGRfa25vYi5zdHlsZSwge1xuICAgICAgICBtYXJnaW5MZWZ0OiAxMDAgKiB0aGlzLl9fY29sb3IucyAtIDcgKyAncHgnLFxuICAgICAgICBtYXJnaW5Ub3A6IDEwMCAqICgxIC0gdGhpcy5fX2NvbG9yLnYpIC0gNyArICdweCcsXG4gICAgICAgIGJhY2tncm91bmRDb2xvcjogdGhpcy5fX3RlbXAudG9TdHJpbmcoKSxcbiAgICAgICAgYm9yZGVyOiB0aGlzLl9fZmllbGRfa25vYl9ib3JkZXIgKyAncmdiKCcgKyBmbGlwICsgJywnICsgZmxpcCArICcsJyArIGZsaXAgKyAnKSdcbiAgICAgIH0pO1xuXG4gICAgICB0aGlzLl9faHVlX2tub2Iuc3R5bGUubWFyZ2luVG9wID0gKDEgLSB0aGlzLl9fY29sb3IuaCAvIDM2MCkgKiAxMDAgKyAncHgnXG5cbiAgICAgIHRoaXMuX190ZW1wLnMgPSAxO1xuICAgICAgdGhpcy5fX3RlbXAudiA9IDE7XG5cbiAgICAgIGxpbmVhckdyYWRpZW50KHRoaXMuX19zYXR1cmF0aW9uX2ZpZWxkLCAnbGVmdCcsICcjZmZmJywgdGhpcy5fX3RlbXAudG9TdHJpbmcoKSk7XG5cbiAgICAgIGNvbW1vbi5leHRlbmQodGhpcy5fX2lucHV0LnN0eWxlLCB7XG4gICAgICAgIGJhY2tncm91bmRDb2xvcjogdGhpcy5fX2lucHV0LnZhbHVlID0gdGhpcy5fX2NvbG9yLnRvU3RyaW5nKCksXG4gICAgICAgIGNvbG9yOiAncmdiKCcgKyBmbGlwICsgJywnICsgZmxpcCArICcsJyArIGZsaXAgKyAnKScsXG4gICAgICAgIHRleHRTaGFkb3c6IHRoaXMuX19pbnB1dF90ZXh0U2hhZG93ICsgJ3JnYmEoJyArIF9mbGlwICsgJywnICsgX2ZsaXAgKyAnLCcgKyBfZmxpcCArICcsLjcpJ1xuICAgICAgfSk7XG5cbiAgICB9XG5cbiAgfVxuXG4pO1xuXG52YXIgdmVuZG9ycyA9IFsnLW1vei0nLCAnLW8tJywgJy13ZWJraXQtJywgJy1tcy0nLCAnJ107XG5cbmZ1bmN0aW9uIGxpbmVhckdyYWRpZW50KGVsZW0sIHgsIGEsIGIpIHtcbiAgZWxlbS5zdHlsZS5iYWNrZ3JvdW5kID0gJyc7XG4gIGNvbW1vbi5lYWNoKHZlbmRvcnMsIGZ1bmN0aW9uKHZlbmRvcikge1xuICAgIGVsZW0uc3R5bGUuY3NzVGV4dCArPSAnYmFja2dyb3VuZDogJyArIHZlbmRvciArICdsaW5lYXItZ3JhZGllbnQoJyArIHggKyAnLCAnICsgYSArICcgMCUsICcgKyBiICsgJyAxMDAlKTsgJztcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGh1ZUdyYWRpZW50KGVsZW0pIHtcbiAgZWxlbS5zdHlsZS5iYWNrZ3JvdW5kID0gJyc7XG4gIGVsZW0uc3R5bGUuY3NzVGV4dCArPSAnYmFja2dyb3VuZDogLW1vei1saW5lYXItZ3JhZGllbnQodG9wLCAgI2ZmMDAwMCAwJSwgI2ZmMDBmZiAxNyUsICMwMDAwZmYgMzQlLCAjMDBmZmZmIDUwJSwgIzAwZmYwMCA2NyUsICNmZmZmMDAgODQlLCAjZmYwMDAwIDEwMCUpOydcbiAgZWxlbS5zdHlsZS5jc3NUZXh0ICs9ICdiYWNrZ3JvdW5kOiAtd2Via2l0LWxpbmVhci1ncmFkaWVudCh0b3AsICAjZmYwMDAwIDAlLCNmZjAwZmYgMTclLCMwMDAwZmYgMzQlLCMwMGZmZmYgNTAlLCMwMGZmMDAgNjclLCNmZmZmMDAgODQlLCNmZjAwMDAgMTAwJSk7J1xuICBlbGVtLnN0eWxlLmNzc1RleHQgKz0gJ2JhY2tncm91bmQ6IC1vLWxpbmVhci1ncmFkaWVudCh0b3AsICAjZmYwMDAwIDAlLCNmZjAwZmYgMTclLCMwMDAwZmYgMzQlLCMwMGZmZmYgNTAlLCMwMGZmMDAgNjclLCNmZmZmMDAgODQlLCNmZjAwMDAgMTAwJSk7J1xuICBlbGVtLnN0eWxlLmNzc1RleHQgKz0gJ2JhY2tncm91bmQ6IC1tcy1saW5lYXItZ3JhZGllbnQodG9wLCAgI2ZmMDAwMCAwJSwjZmYwMGZmIDE3JSwjMDAwMGZmIDM0JSwjMDBmZmZmIDUwJSwjMDBmZjAwIDY3JSwjZmZmZjAwIDg0JSwjZmYwMDAwIDEwMCUpOydcbiAgZWxlbS5zdHlsZS5jc3NUZXh0ICs9ICdiYWNrZ3JvdW5kOiBsaW5lYXItZ3JhZGllbnQodG9wLCAgI2ZmMDAwMCAwJSwjZmYwMGZmIDE3JSwjMDAwMGZmIDM0JSwjMDBmZmZmIDUwJSwjMDBmZjAwIDY3JSwjZmZmZjAwIDg0JSwjZmYwMDAwIDEwMCUpOydcbn1cbiIsIi8qKlxuICogZGF0LWd1aSBKYXZhU2NyaXB0IENvbnRyb2xsZXIgTGlicmFyeVxuICogaHR0cDovL2NvZGUuZ29vZ2xlLmNvbS9wL2RhdC1ndWlcbiAqXG4gKiBDb3B5cmlnaHQgMjAxMSBEYXRhIEFydHMgVGVhbSwgR29vZ2xlIENyZWF0aXZlIExhYlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqL1xuXG52YXIgY29tbW9uID0gcmVxdWlyZSgnLi4vdXRpbHMvY29tbW9uLmpzJyk7XG52YXIgZXNjYXBlID0gcmVxdWlyZSgnLi4vdXRpbHMvZXNjYXBlSHRtbC5qcycpO1xubW9kdWxlLmV4cG9ydHMgPSBDb250cm9sbGVyO1xuXG4vKipcbiAqIEBjbGFzcyBBbiBcImFic3RyYWN0XCIgY2xhc3MgdGhhdCByZXByZXNlbnRzIGEgZ2l2ZW4gcHJvcGVydHkgb2YgYW4gb2JqZWN0LlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBiZSBtYW5pcHVsYXRlZFxuICogQHBhcmFtIHtzdHJpbmd9IHByb3BlcnR5IFRoZSBuYW1lIG9mIHRoZSBwcm9wZXJ0eSB0byBiZSBtYW5pcHVsYXRlZFxuICpcbiAqIEBtZW1iZXIgZGF0LmNvbnRyb2xsZXJzXG4gKi9cbmZ1bmN0aW9uIENvbnRyb2xsZXIob2JqZWN0LCBwcm9wZXJ0eSkge1xuXG4gIHRoaXMuaW5pdGlhbFZhbHVlID0gb2JqZWN0W3Byb3BlcnR5XTtcblxuICAvKipcbiAgICogVGhvc2Ugd2hvIGV4dGVuZCB0aGlzIGNsYXNzIHdpbGwgcHV0IHRoZWlyIERPTSBlbGVtZW50cyBpbiBoZXJlLlxuICAgKiBAdHlwZSB7RE9NRWxlbWVudH1cbiAgICovXG4gIHRoaXMuZG9tRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXG4gIC8qKlxuICAgKiBUaGUgb2JqZWN0IHRvIG1hbmlwdWxhdGVcbiAgICogQHR5cGUge09iamVjdH1cbiAgICovXG4gIHRoaXMub2JqZWN0ID0gb2JqZWN0O1xuXG4gIC8qKlxuICAgKiBUaGUgbmFtZSBvZiB0aGUgcHJvcGVydHkgdG8gbWFuaXB1bGF0ZVxuICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgKi9cbiAgdGhpcy5wcm9wZXJ0eSA9IHByb3BlcnR5O1xuXG4gIC8qKlxuICAgKiBUaGUgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIG9uIGNoYW5nZS5cbiAgICogQHR5cGUge0Z1bmN0aW9ufVxuICAgKiBAaWdub3JlXG4gICAqL1xuICB0aGlzLl9fb25DaGFuZ2UgPSB1bmRlZmluZWQ7XG5cbiAgLyoqXG4gICAqIFRoZSBmdW5jdGlvbiB0byBiZSBjYWxsZWQgb24gZmluaXNoaW5nIGNoYW5nZS5cbiAgICogQHR5cGUge0Z1bmN0aW9ufVxuICAgKiBAaWdub3JlXG4gICAqL1xuICB0aGlzLl9fb25GaW5pc2hDaGFuZ2UgPSB1bmRlZmluZWQ7XG5cbn1cblxuY29tbW9uLmV4dGVuZChcblxuICBDb250cm9sbGVyLnByb3RvdHlwZSxcblxuICAvKiogQGxlbmRzIGRhdC5jb250cm9sbGVycy5Db250cm9sbGVyLnByb3RvdHlwZSAqL1xuICB7XG5cbiAgICAvKipcbiAgICAgKiBTcGVjaWZ5IHRoYXQgYSBmdW5jdGlvbiBmaXJlIGV2ZXJ5IHRpbWUgc29tZW9uZSBjaGFuZ2VzIHRoZSB2YWx1ZSB3aXRoXG4gICAgICogdGhpcyBDb250cm9sbGVyLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZm5jIFRoaXMgZnVuY3Rpb24gd2lsbCBiZSBjYWxsZWQgd2hlbmV2ZXIgdGhlIHZhbHVlXG4gICAgICogaXMgbW9kaWZpZWQgdmlhIHRoaXMgQ29udHJvbGxlci5cbiAgICAgKiBAcmV0dXJucyB7ZGF0LmNvbnRyb2xsZXJzLkNvbnRyb2xsZXJ9IHRoaXNcbiAgICAgKi9cbiAgICBvbkNoYW5nZTogZnVuY3Rpb24oZm5jKSB7XG4gICAgICB0aGlzLl9fb25DaGFuZ2UgPSBmbmM7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU3BlY2lmeSB0aGF0IGEgZnVuY3Rpb24gZmlyZSBldmVyeSB0aW1lIHNvbWVvbmUgXCJmaW5pc2hlc1wiIGNoYW5naW5nXG4gICAgICogdGhlIHZhbHVlIHdpaCB0aGlzIENvbnRyb2xsZXIuIFVzZWZ1bCBmb3IgdmFsdWVzIHRoYXQgY2hhbmdlXG4gICAgICogaW5jcmVtZW50YWxseSBsaWtlIG51bWJlcnMgb3Igc3RyaW5ncy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuYyBUaGlzIGZ1bmN0aW9uIHdpbGwgYmUgY2FsbGVkIHdoZW5ldmVyXG4gICAgICogc29tZW9uZSBcImZpbmlzaGVzXCIgY2hhbmdpbmcgdGhlIHZhbHVlIHZpYSB0aGlzIENvbnRyb2xsZXIuXG4gICAgICogQHJldHVybnMge2RhdC5jb250cm9sbGVycy5Db250cm9sbGVyfSB0aGlzXG4gICAgICovXG4gICAgb25GaW5pc2hDaGFuZ2U6IGZ1bmN0aW9uKGZuYykge1xuICAgICAgdGhpcy5fX29uRmluaXNoQ2hhbmdlID0gZm5jO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENoYW5nZSB0aGUgdmFsdWUgb2YgPGNvZGU+b2JqZWN0W3Byb3BlcnR5XTwvY29kZT5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBuZXdWYWx1ZSBUaGUgbmV3IHZhbHVlIG9mIDxjb2RlPm9iamVjdFtwcm9wZXJ0eV08L2NvZGU+XG4gICAgICovXG4gICAgc2V0VmFsdWU6IGZ1bmN0aW9uKG5ld1ZhbHVlKSB7XG4gICAgICB0aGlzLm9iamVjdFt0aGlzLnByb3BlcnR5XSA9IG5ld1ZhbHVlO1xuICAgICAgaWYgKHRoaXMuX19vbkNoYW5nZSkge1xuICAgICAgICB0aGlzLl9fb25DaGFuZ2UuY2FsbCh0aGlzLCBuZXdWYWx1ZSk7XG4gICAgICB9XG4gICAgICB0aGlzLnVwZGF0ZURpc3BsYXkoKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXRzIHRoZSB2YWx1ZSBvZiA8Y29kZT5vYmplY3RbcHJvcGVydHldPC9jb2RlPlxuICAgICAqXG4gICAgICogQHJldHVybnMge09iamVjdH0gVGhlIGN1cnJlbnQgdmFsdWUgb2YgPGNvZGU+b2JqZWN0W3Byb3BlcnR5XTwvY29kZT5cbiAgICAgKi9cbiAgICBnZXRWYWx1ZTogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5vYmplY3RbdGhpcy5wcm9wZXJ0eV07XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlZnJlc2hlcyB0aGUgdmlzdWFsIGRpc3BsYXkgb2YgYSBDb250cm9sbGVyIGluIG9yZGVyIHRvIGtlZXAgc3luY1xuICAgICAqIHdpdGggdGhlIG9iamVjdCdzIGN1cnJlbnQgdmFsdWUuXG4gICAgICogQHJldHVybnMge2RhdC5jb250cm9sbGVycy5Db250cm9sbGVyfSB0aGlzXG4gICAgICovXG4gICAgdXBkYXRlRGlzcGxheTogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQHJldHVybnMge0Jvb2xlYW59IHRydWUgaWYgdGhlIHZhbHVlIGhhcyBkZXZpYXRlZCBmcm9tIGluaXRpYWxWYWx1ZVxuICAgICAqL1xuICAgIGlzTW9kaWZpZWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuaW5pdGlhbFZhbHVlICE9PSB0aGlzLmdldFZhbHVlKCk7XG4gICAgfVxuICB9XG5cbik7XG5cbiIsIi8qKlxuICogZGF0LWd1aSBKYXZhU2NyaXB0IENvbnRyb2xsZXIgTGlicmFyeVxuICogaHR0cDovL2NvZGUuZ29vZ2xlLmNvbS9wL2RhdC1ndWlcbiAqXG4gKiBDb3B5cmlnaHQgMjAxMSBEYXRhIEFydHMgVGVhbSwgR29vZ2xlIENyZWF0aXZlIExhYlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqL1xuXG52YXIgQ29udHJvbGxlciA9IHJlcXVpcmUoJy4vQ29udHJvbGxlci5qcycpO1xudmFyIGNvbW1vbiA9IHJlcXVpcmUoJy4uL3V0aWxzL2NvbW1vbi5qcycpO1xudmFyIGRvbSA9IHJlcXVpcmUoJy4uL2RvbS9kb20uanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBGdW5jdGlvbkNvbnRyb2xsZXI7XG5cbi8qKlxuICogQGNsYXNzIFByb3ZpZGVzIGEgR1VJIGludGVyZmFjZSB0byBmaXJlIGEgc3BlY2lmaWVkIG1ldGhvZCwgYSBwcm9wZXJ0eSBvZiBhbiBvYmplY3QuXG4gKlxuICogQGV4dGVuZHMgZGF0LmNvbnRyb2xsZXJzLkNvbnRyb2xsZXJcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gYmUgbWFuaXB1bGF0ZWRcbiAqIEBwYXJhbSB7c3RyaW5nfSBwcm9wZXJ0eSBUaGUgbmFtZSBvZiB0aGUgcHJvcGVydHkgdG8gYmUgbWFuaXB1bGF0ZWRcbiAqXG4gKiBAbWVtYmVyIGRhdC5jb250cm9sbGVyc1xuICovXG5mdW5jdGlvbiBGdW5jdGlvbkNvbnRyb2xsZXIob2JqZWN0LCBwcm9wZXJ0eSwgdGV4dCkge1xuXG4gIEZ1bmN0aW9uQ29udHJvbGxlci5zdXBlcmNsYXNzLmNhbGwodGhpcywgb2JqZWN0LCBwcm9wZXJ0eSk7XG5cbiAgdmFyIF90aGlzID0gdGhpcztcblxuICB0aGlzLl9fYnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIHRoaXMuX19idXR0b24uaW5uZXJIVE1MID0gdGV4dCA9PT0gdW5kZWZpbmVkID8gJ0ZpcmUnIDogdGV4dDtcbiAgZG9tLmJpbmQodGhpcy5fX2J1dHRvbiwgJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICBfdGhpcy5maXJlKCk7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9KTtcblxuICBkb20uYWRkQ2xhc3ModGhpcy5fX2J1dHRvbiwgJ2J1dHRvbicpO1xuXG4gIHRoaXMuZG9tRWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLl9fYnV0dG9uKTtcblxufVxuXG5GdW5jdGlvbkNvbnRyb2xsZXIuc3VwZXJjbGFzcyA9IENvbnRyb2xsZXI7XG5cbmNvbW1vbi5leHRlbmQoXG5cbiAgRnVuY3Rpb25Db250cm9sbGVyLnByb3RvdHlwZSxcbiAgQ29udHJvbGxlci5wcm90b3R5cGUsIHtcblxuICAgIGZpcmU6IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHRoaXMuX19vbkNoYW5nZSkge1xuICAgICAgICB0aGlzLl9fb25DaGFuZ2UuY2FsbCh0aGlzKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuZ2V0VmFsdWUoKS5jYWxsKHRoaXMub2JqZWN0KTtcbiAgICAgIGlmICh0aGlzLl9fb25GaW5pc2hDaGFuZ2UpIHtcbiAgICAgICAgdGhpcy5fX29uRmluaXNoQ2hhbmdlLmNhbGwodGhpcywgdGhpcy5nZXRWYWx1ZSgpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuKTtcbiIsIi8qKlxuICogZGF0LWd1aSBKYXZhU2NyaXB0IENvbnRyb2xsZXIgTGlicmFyeVxuICogaHR0cDovL2NvZGUuZ29vZ2xlLmNvbS9wL2RhdC1ndWlcbiAqXG4gKiBDb3B5cmlnaHQgMjAxMSBEYXRhIEFydHMgVGVhbSwgR29vZ2xlIENyZWF0aXZlIExhYlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqL1xuXG52YXIgQ29udHJvbGxlciA9IHJlcXVpcmUoJy4vQ29udHJvbGxlci5qcycpO1xudmFyIGNvbW1vbiA9IHJlcXVpcmUoJy4uL3V0aWxzL2NvbW1vbi5qcycpO1xubW9kdWxlLmV4cG9ydHMgPSBOdW1iZXJDb250cm9sbGVyO1xuXG4vKipcbiAqIEBjbGFzcyBSZXByZXNlbnRzIGEgZ2l2ZW4gcHJvcGVydHkgb2YgYW4gb2JqZWN0IHRoYXQgaXMgYSBudW1iZXIuXG4gKlxuICogQGV4dGVuZHMgZGF0LmNvbnRyb2xsZXJzLkNvbnRyb2xsZXJcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gYmUgbWFuaXB1bGF0ZWRcbiAqIEBwYXJhbSB7c3RyaW5nfSBwcm9wZXJ0eSBUaGUgbmFtZSBvZiB0aGUgcHJvcGVydHkgdG8gYmUgbWFuaXB1bGF0ZWRcbiAqIEBwYXJhbSB7T2JqZWN0fSBbcGFyYW1zXSBPcHRpb25hbCBwYXJhbWV0ZXJzXG4gKiBAcGFyYW0ge051bWJlcn0gW3BhcmFtcy5taW5dIE1pbmltdW0gYWxsb3dlZCB2YWx1ZVxuICogQHBhcmFtIHtOdW1iZXJ9IFtwYXJhbXMubWF4XSBNYXhpbXVtIGFsbG93ZWQgdmFsdWVcbiAqIEBwYXJhbSB7TnVtYmVyfSBbcGFyYW1zLnN0ZXBdIEluY3JlbWVudCBieSB3aGljaCB0byBjaGFuZ2UgdmFsdWVcbiAqXG4gKiBAbWVtYmVyIGRhdC5jb250cm9sbGVyc1xuICovXG5mdW5jdGlvbiBOdW1iZXJDb250cm9sbGVyKG9iamVjdCwgcHJvcGVydHksIHBhcmFtcykge1xuXG4gIE51bWJlckNvbnRyb2xsZXIuc3VwZXJjbGFzcy5jYWxsKHRoaXMsIG9iamVjdCwgcHJvcGVydHkpO1xuXG4gIHBhcmFtcyA9IHBhcmFtcyB8fCB7fTtcblxuICB0aGlzLl9fbWluID0gcGFyYW1zLm1pbjtcbiAgdGhpcy5fX21heCA9IHBhcmFtcy5tYXg7XG4gIHRoaXMuX19zdGVwID0gcGFyYW1zLnN0ZXA7XG5cbiAgaWYgKGNvbW1vbi5pc1VuZGVmaW5lZCh0aGlzLl9fc3RlcCkpIHtcblxuICAgIGlmICh0aGlzLmluaXRpYWxWYWx1ZSA9PSAwKSB7XG4gICAgICB0aGlzLl9faW1wbGllZFN0ZXAgPSAxOyAvLyBXaGF0IGFyZSB3ZSwgcHN5Y2hpY3M/XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIEhleSBEb3VnLCBjaGVjayB0aGlzIG91dC5cbiAgICAgIHRoaXMuX19pbXBsaWVkU3RlcCA9IE1hdGgucG93KDEwLCBNYXRoLmZsb29yKE1hdGgubG9nKHRoaXMuaW5pdGlhbFZhbHVlKSAvIE1hdGguTE4xMCkpIC8gMTA7XG4gICAgfVxuXG4gIH0gZWxzZSB7XG5cbiAgICB0aGlzLl9faW1wbGllZFN0ZXAgPSB0aGlzLl9fc3RlcDtcblxuICB9XG5cbiAgdGhpcy5fX3ByZWNpc2lvbiA9IG51bURlY2ltYWxzKHRoaXMuX19pbXBsaWVkU3RlcCk7XG5cblxufVxuXG5OdW1iZXJDb250cm9sbGVyLnN1cGVyY2xhc3MgPSBDb250cm9sbGVyO1xuXG5jb21tb24uZXh0ZW5kKFxuXG4gIE51bWJlckNvbnRyb2xsZXIucHJvdG90eXBlLFxuICBDb250cm9sbGVyLnByb3RvdHlwZSxcblxuICAvKiogQGxlbmRzIGRhdC5jb250cm9sbGVycy5OdW1iZXJDb250cm9sbGVyLnByb3RvdHlwZSAqL1xuICB7XG5cbiAgICBzZXRWYWx1ZTogZnVuY3Rpb24odikge1xuXG4gICAgICBpZiAodGhpcy5fX21pbiAhPT0gdW5kZWZpbmVkICYmIHYgPCB0aGlzLl9fbWluKSB7XG4gICAgICAgIHYgPSB0aGlzLl9fbWluO1xuICAgICAgfSBlbHNlIGlmICh0aGlzLl9fbWF4ICE9PSB1bmRlZmluZWQgJiYgdiA+IHRoaXMuX19tYXgpIHtcbiAgICAgICAgdiA9IHRoaXMuX19tYXg7XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLl9fc3RlcCAhPT0gdW5kZWZpbmVkICYmIHYgJSB0aGlzLl9fc3RlcCAhPSAwKSB7XG4gICAgICAgIHYgPSBNYXRoLnJvdW5kKHYgLyB0aGlzLl9fc3RlcCkgKiB0aGlzLl9fc3RlcDtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIE51bWJlckNvbnRyb2xsZXIuc3VwZXJjbGFzcy5wcm90b3R5cGUuc2V0VmFsdWUuY2FsbCh0aGlzLCB2KTtcblxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTcGVjaWZ5IGEgbWluaW11bSB2YWx1ZSBmb3IgPGNvZGU+b2JqZWN0W3Byb3BlcnR5XTwvY29kZT4uXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gbWluVmFsdWUgVGhlIG1pbmltdW0gdmFsdWUgZm9yXG4gICAgICogPGNvZGU+b2JqZWN0W3Byb3BlcnR5XTwvY29kZT5cbiAgICAgKiBAcmV0dXJucyB7ZGF0LmNvbnRyb2xsZXJzLk51bWJlckNvbnRyb2xsZXJ9IHRoaXNcbiAgICAgKi9cbiAgICBtaW46IGZ1bmN0aW9uKHYpIHtcbiAgICAgIHRoaXMuX19taW4gPSB2O1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNwZWNpZnkgYSBtYXhpbXVtIHZhbHVlIGZvciA8Y29kZT5vYmplY3RbcHJvcGVydHldPC9jb2RlPi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBtYXhWYWx1ZSBUaGUgbWF4aW11bSB2YWx1ZSBmb3JcbiAgICAgKiA8Y29kZT5vYmplY3RbcHJvcGVydHldPC9jb2RlPlxuICAgICAqIEByZXR1cm5zIHtkYXQuY29udHJvbGxlcnMuTnVtYmVyQ29udHJvbGxlcn0gdGhpc1xuICAgICAqL1xuICAgIG1heDogZnVuY3Rpb24odikge1xuICAgICAgdGhpcy5fX21heCA9IHY7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU3BlY2lmeSBhIHN0ZXAgdmFsdWUgdGhhdCBkYXQuY29udHJvbGxlcnMuTnVtYmVyQ29udHJvbGxlclxuICAgICAqIGluY3JlbWVudHMgYnkuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gc3RlcFZhbHVlIFRoZSBzdGVwIHZhbHVlIGZvclxuICAgICAqIGRhdC5jb250cm9sbGVycy5OdW1iZXJDb250cm9sbGVyXG4gICAgICogQGRlZmF1bHQgaWYgbWluaW11bSBhbmQgbWF4aW11bSBzcGVjaWZpZWQgaW5jcmVtZW50IGlzIDElIG9mIHRoZVxuICAgICAqIGRpZmZlcmVuY2Ugb3RoZXJ3aXNlIHN0ZXBWYWx1ZSBpcyAxXG4gICAgICogQHJldHVybnMge2RhdC5jb250cm9sbGVycy5OdW1iZXJDb250cm9sbGVyfSB0aGlzXG4gICAgICovXG4gICAgc3RlcDogZnVuY3Rpb24odikge1xuICAgICAgdGhpcy5fX3N0ZXAgPSB2O1xuICAgICAgdGhpcy5fX2ltcGxpZWRTdGVwID0gdjtcbiAgICAgIHRoaXMuX19wcmVjaXNpb24gPSBudW1EZWNpbWFscyh2KTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICB9XG5cbik7XG5cbmZ1bmN0aW9uIG51bURlY2ltYWxzKHgpIHtcbiAgeCA9IHgudG9TdHJpbmcoKTtcbiAgaWYgKHguaW5kZXhPZignLicpID4gLTEpIHtcbiAgICByZXR1cm4geC5sZW5ndGggLSB4LmluZGV4T2YoJy4nKSAtIDE7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIDA7XG4gIH1cbn1cbiIsIi8qKlxuICogZGF0LWd1aSBKYXZhU2NyaXB0IENvbnRyb2xsZXIgTGlicmFyeVxuICogaHR0cDovL2NvZGUuZ29vZ2xlLmNvbS9wL2RhdC1ndWlcbiAqXG4gKiBDb3B5cmlnaHQgMjAxMSBEYXRhIEFydHMgVGVhbSwgR29vZ2xlIENyZWF0aXZlIExhYlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqL1xuXG52YXIgTnVtYmVyQ29udHJvbGxlciA9IHJlcXVpcmUoJy4vTnVtYmVyQ29udHJvbGxlci5qcycpO1xudmFyIGNvbW1vbiA9IHJlcXVpcmUoJy4uL3V0aWxzL2NvbW1vbi5qcycpO1xudmFyIGRvbSA9IHJlcXVpcmUoJy4uL2RvbS9kb20uanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBOdW1iZXJDb250cm9sbGVyQm94O1xuXG4vKipcbiAqIEBjbGFzcyBSZXByZXNlbnRzIGEgZ2l2ZW4gcHJvcGVydHkgb2YgYW4gb2JqZWN0IHRoYXQgaXMgYSBudW1iZXIgYW5kXG4gKiBwcm92aWRlcyBhbiBpbnB1dCBlbGVtZW50IHdpdGggd2hpY2ggdG8gbWFuaXB1bGF0ZSBpdC5cbiAqXG4gKiBAZXh0ZW5kcyBkYXQuY29udHJvbGxlcnMuQ29udHJvbGxlclxuICogQGV4dGVuZHMgZGF0LmNvbnRyb2xsZXJzLk51bWJlckNvbnRyb2xsZXJcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gYmUgbWFuaXB1bGF0ZWRcbiAqIEBwYXJhbSB7c3RyaW5nfSBwcm9wZXJ0eSBUaGUgbmFtZSBvZiB0aGUgcHJvcGVydHkgdG8gYmUgbWFuaXB1bGF0ZWRcbiAqIEBwYXJhbSB7T2JqZWN0fSBbcGFyYW1zXSBPcHRpb25hbCBwYXJhbWV0ZXJzXG4gKiBAcGFyYW0ge051bWJlcn0gW3BhcmFtcy5taW5dIE1pbmltdW0gYWxsb3dlZCB2YWx1ZVxuICogQHBhcmFtIHtOdW1iZXJ9IFtwYXJhbXMubWF4XSBNYXhpbXVtIGFsbG93ZWQgdmFsdWVcbiAqIEBwYXJhbSB7TnVtYmVyfSBbcGFyYW1zLnN0ZXBdIEluY3JlbWVudCBieSB3aGljaCB0byBjaGFuZ2UgdmFsdWVcbiAqXG4gKiBAbWVtYmVyIGRhdC5jb250cm9sbGVyc1xuICovXG5mdW5jdGlvbiBOdW1iZXJDb250cm9sbGVyQm94KG9iamVjdCwgcHJvcGVydHksIHBhcmFtcykge1xuXG4gIHRoaXMuX190cnVuY2F0aW9uU3VzcGVuZGVkID0gZmFsc2U7XG5cbiAgTnVtYmVyQ29udHJvbGxlckJveC5zdXBlcmNsYXNzLmNhbGwodGhpcywgb2JqZWN0LCBwcm9wZXJ0eSwgcGFyYW1zKTtcblxuICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gIC8qKlxuICAgKiB7TnVtYmVyfSBQcmV2aW91cyBtb3VzZSB5IHBvc2l0aW9uXG4gICAqIEBpZ25vcmVcbiAgICovXG4gIHZhciBwcmV2X3k7XG5cbiAgdGhpcy5fX2lucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcbiAgdGhpcy5fX2lucHV0LnNldEF0dHJpYnV0ZSgndHlwZScsICd0ZXh0Jyk7XG5cbiAgLy8gTWFrZXMgaXQgc28gbWFudWFsbHkgc3BlY2lmaWVkIHZhbHVlcyBhcmUgbm90IHRydW5jYXRlZC5cblxuICBkb20uYmluZCh0aGlzLl9faW5wdXQsICdjaGFuZ2UnLCBvbkNoYW5nZSk7XG4gIGRvbS5iaW5kKHRoaXMuX19pbnB1dCwgJ2JsdXInLCBvbkJsdXIpO1xuICBkb20uYmluZCh0aGlzLl9faW5wdXQsICdtb3VzZWRvd24nLCBvbk1vdXNlRG93bik7XG4gIGRvbS5iaW5kKHRoaXMuX19pbnB1dCwgJ2tleWRvd24nLCBmdW5jdGlvbihlKSB7XG5cbiAgICAvLyBXaGVuIHByZXNzaW5nIGVudGlyZSwgeW91IGNhbiBiZSBhcyBwcmVjaXNlIGFzIHlvdSB3YW50LlxuICAgIGlmIChlLmtleUNvZGUgPT09IDEzKSB7XG4gICAgICBfdGhpcy5fX3RydW5jYXRpb25TdXNwZW5kZWQgPSB0cnVlO1xuICAgICAgdGhpcy5ibHVyKCk7XG4gICAgICBfdGhpcy5fX3RydW5jYXRpb25TdXNwZW5kZWQgPSBmYWxzZTtcbiAgICB9XG5cbiAgfSk7XG5cbiAgZnVuY3Rpb24gb25DaGFuZ2UoKSB7XG4gICAgdmFyIGF0dGVtcHRlZCA9IHBhcnNlRmxvYXQoX3RoaXMuX19pbnB1dC52YWx1ZSk7XG4gICAgaWYgKCFjb21tb24uaXNOYU4oYXR0ZW1wdGVkKSkgX3RoaXMuc2V0VmFsdWUoYXR0ZW1wdGVkKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIG9uQmx1cigpIHtcbiAgICBvbkNoYW5nZSgpO1xuICAgIGlmIChfdGhpcy5fX29uRmluaXNoQ2hhbmdlKSB7XG4gICAgICBfdGhpcy5fX29uRmluaXNoQ2hhbmdlLmNhbGwoX3RoaXMsIF90aGlzLmdldFZhbHVlKCkpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIG9uTW91c2VEb3duKGUpIHtcbiAgICBkb20uYmluZCh3aW5kb3csICdtb3VzZW1vdmUnLCBvbk1vdXNlRHJhZyk7XG4gICAgZG9tLmJpbmQod2luZG93LCAnbW91c2V1cCcsIG9uTW91c2VVcCk7XG4gICAgcHJldl95ID0gZS5jbGllbnRZO1xuICB9XG5cbiAgZnVuY3Rpb24gb25Nb3VzZURyYWcoZSkge1xuXG4gICAgdmFyIGRpZmYgPSBwcmV2X3kgLSBlLmNsaWVudFk7XG4gICAgX3RoaXMuc2V0VmFsdWUoX3RoaXMuZ2V0VmFsdWUoKSArIGRpZmYgKiBfdGhpcy5fX2ltcGxpZWRTdGVwKTtcblxuICAgIHByZXZfeSA9IGUuY2xpZW50WTtcblxuICB9XG5cbiAgZnVuY3Rpb24gb25Nb3VzZVVwKCkge1xuICAgIGRvbS51bmJpbmQod2luZG93LCAnbW91c2Vtb3ZlJywgb25Nb3VzZURyYWcpO1xuICAgIGRvbS51bmJpbmQod2luZG93LCAnbW91c2V1cCcsIG9uTW91c2VVcCk7XG4gIH1cblxuICB0aGlzLnVwZGF0ZURpc3BsYXkoKTtcblxuICB0aGlzLmRvbUVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5fX2lucHV0KTtcblxufVxuXG5OdW1iZXJDb250cm9sbGVyQm94LnN1cGVyY2xhc3MgPSBOdW1iZXJDb250cm9sbGVyO1xuXG5jb21tb24uZXh0ZW5kKFxuXG4gIE51bWJlckNvbnRyb2xsZXJCb3gucHJvdG90eXBlLFxuICBOdW1iZXJDb250cm9sbGVyLnByb3RvdHlwZSxcblxuICB7XG5cbiAgICB1cGRhdGVEaXNwbGF5OiBmdW5jdGlvbigpIHtcblxuICAgICAgdGhpcy5fX2lucHV0LnZhbHVlID0gdGhpcy5fX3RydW5jYXRpb25TdXNwZW5kZWQgPyB0aGlzLmdldFZhbHVlKCkgOiByb3VuZFRvRGVjaW1hbCh0aGlzLmdldFZhbHVlKCksIHRoaXMuX19wcmVjaXNpb24pO1xuICAgICAgcmV0dXJuIE51bWJlckNvbnRyb2xsZXJCb3guc3VwZXJjbGFzcy5wcm90b3R5cGUudXBkYXRlRGlzcGxheS5jYWxsKHRoaXMpO1xuICAgIH1cblxuICB9XG5cbik7XG5cbmZ1bmN0aW9uIHJvdW5kVG9EZWNpbWFsKHZhbHVlLCBkZWNpbWFscykge1xuICB2YXIgdGVuVG8gPSBNYXRoLnBvdygxMCwgZGVjaW1hbHMpO1xuICByZXR1cm4gTWF0aC5yb3VuZCh2YWx1ZSAqIHRlblRvKSAvIHRlblRvO1xufVxuIiwiLyoqXG4gKiBkYXQtZ3VpIEphdmFTY3JpcHQgQ29udHJvbGxlciBMaWJyYXJ5XG4gKiBodHRwOi8vY29kZS5nb29nbGUuY29tL3AvZGF0LWd1aVxuICpcbiAqIENvcHlyaWdodCAyMDExIERhdGEgQXJ0cyBUZWFtLCBHb29nbGUgQ3JlYXRpdmUgTGFiXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICovXG5cbnZhciBOdW1iZXJDb250cm9sbGVyID0gcmVxdWlyZSgnLi9OdW1iZXJDb250cm9sbGVyLmpzJyk7XG52YXIgY29tbW9uID0gcmVxdWlyZSgnLi4vdXRpbHMvY29tbW9uLmpzJyk7XG52YXIgZG9tID0gcmVxdWlyZSgnLi4vZG9tL2RvbS5qcycpO1xudmFyIGNzcyA9IHJlcXVpcmUoJy4uL3V0aWxzL2Nzcy5qcycpO1xuXG52YXIgc3R5bGVTaGVldCA9IFwiLyoqXFxuICogZGF0LWd1aSBKYXZhU2NyaXB0IENvbnRyb2xsZXIgTGlicmFyeVxcbiAqIGh0dHA6Ly9jb2RlLmdvb2dsZS5jb20vcC9kYXQtZ3VpXFxuICpcXG4gKiBDb3B5cmlnaHQgMjAxMSBEYXRhIEFydHMgVGVhbSwgR29vZ2xlIENyZWF0aXZlIExhYlxcbiAqXFxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFxcXCJMaWNlbnNlXFxcIik7XFxuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxcbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxcbiAqXFxuICogaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXFxuICovXFxuXFxuLnNsaWRlciB7XFxuICBib3gtc2hhZG93OiBpbnNldCAwIDJweCA0cHggcmdiYSgwLDAsMCwwLjE1KTtcXG4gIGhlaWdodDogMWVtO1xcbiAgYm9yZGVyLXJhZGl1czogMWVtO1xcbiAgYmFja2dyb3VuZC1jb2xvcjogI2VlZTtcXG4gIHBhZGRpbmc6IDAgMC41ZW07XFxuICBvdmVyZmxvdzogaGlkZGVuO1xcbn1cXG5cXG4uc2xpZGVyLWZnIHtcXG4gIHBhZGRpbmc6IDFweCAwIDJweCAwO1xcbiAgYmFja2dyb3VuZC1jb2xvcjogI2FhYTtcXG4gIGhlaWdodDogMWVtO1xcbiAgbWFyZ2luLWxlZnQ6IC0wLjVlbTtcXG4gIHBhZGRpbmctcmlnaHQ6IDAuNWVtO1xcbiAgYm9yZGVyLXJhZGl1czogMWVtIDAgMCAxZW07XFxufVxcblxcbi5zbGlkZXItZmc6YWZ0ZXIge1xcbiAgZGlzcGxheTogaW5saW5lLWJsb2NrO1xcbiAgYm9yZGVyLXJhZGl1czogMWVtO1xcbiAgYmFja2dyb3VuZC1jb2xvcjogI2ZmZjtcXG4gIGJvcmRlcjogIDFweCBzb2xpZCAjYWFhO1xcbiAgY29udGVudDogJyc7XFxuICBmbG9hdDogcmlnaHQ7XFxuICBtYXJnaW4tcmlnaHQ6IC0xZW07XFxuICBtYXJnaW4tdG9wOiAtMXB4O1xcbiAgaGVpZ2h0OiAwLjllbTtcXG4gIHdpZHRoOiAwLjllbTtcXG59XCI7XG5tb2R1bGUuZXhwb3J0cyA9IE51bWJlckNvbnRyb2xsZXJTbGlkZXI7XG5cbi8qKlxuICogQGNsYXNzIFJlcHJlc2VudHMgYSBnaXZlbiBwcm9wZXJ0eSBvZiBhbiBvYmplY3QgdGhhdCBpcyBhIG51bWJlciwgY29udGFpbnNcbiAqIGEgbWluaW11bSBhbmQgbWF4aW11bSwgYW5kIHByb3ZpZGVzIGEgc2xpZGVyIGVsZW1lbnQgd2l0aCB3aGljaCB0b1xuICogbWFuaXB1bGF0ZSBpdC4gSXQgc2hvdWxkIGJlIG5vdGVkIHRoYXQgdGhlIHNsaWRlciBlbGVtZW50IGlzIG1hZGUgdXAgb2ZcbiAqIDxjb2RlPiZsdDtkaXYmZ3Q7PC9jb2RlPiB0YWdzLCA8c3Ryb25nPm5vdDwvc3Ryb25nPiB0aGUgaHRtbDVcbiAqIDxjb2RlPiZsdDtzbGlkZXImZ3Q7PC9jb2RlPiBlbGVtZW50LlxuICpcbiAqIEBleHRlbmRzIGRhdC5jb250cm9sbGVycy5Db250cm9sbGVyXG4gKiBAZXh0ZW5kcyBkYXQuY29udHJvbGxlcnMuTnVtYmVyQ29udHJvbGxlclxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBiZSBtYW5pcHVsYXRlZFxuICogQHBhcmFtIHtzdHJpbmd9IHByb3BlcnR5IFRoZSBuYW1lIG9mIHRoZSBwcm9wZXJ0eSB0byBiZSBtYW5pcHVsYXRlZFxuICogQHBhcmFtIHtOdW1iZXJ9IG1pblZhbHVlIE1pbmltdW0gYWxsb3dlZCB2YWx1ZVxuICogQHBhcmFtIHtOdW1iZXJ9IG1heFZhbHVlIE1heGltdW0gYWxsb3dlZCB2YWx1ZVxuICogQHBhcmFtIHtOdW1iZXJ9IHN0ZXBWYWx1ZSBJbmNyZW1lbnQgYnkgd2hpY2ggdG8gY2hhbmdlIHZhbHVlXG4gKlxuICogQG1lbWJlciBkYXQuY29udHJvbGxlcnNcbiAqL1xuZnVuY3Rpb24gTnVtYmVyQ29udHJvbGxlclNsaWRlcihvYmplY3QsIHByb3BlcnR5LCBtaW4sIG1heCwgc3RlcCkge1xuXG4gIE51bWJlckNvbnRyb2xsZXJTbGlkZXIuc3VwZXJjbGFzcy5jYWxsKHRoaXMsIG9iamVjdCwgcHJvcGVydHksIHtcbiAgICBtaW46IG1pbixcbiAgICBtYXg6IG1heCxcbiAgICBzdGVwOiBzdGVwXG4gIH0pO1xuXG4gIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgdGhpcy5fX2JhY2tncm91bmQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgdGhpcy5fX2ZvcmVncm91bmQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblxuXG5cbiAgZG9tLmJpbmQodGhpcy5fX2JhY2tncm91bmQsICdtb3VzZWRvd24nLCBvbk1vdXNlRG93bik7XG5cbiAgZG9tLmFkZENsYXNzKHRoaXMuX19iYWNrZ3JvdW5kLCAnc2xpZGVyJyk7XG4gIGRvbS5hZGRDbGFzcyh0aGlzLl9fZm9yZWdyb3VuZCwgJ3NsaWRlci1mZycpO1xuXG4gIGZ1bmN0aW9uIG9uTW91c2VEb3duKGUpIHtcblxuICAgIGRvbS5iaW5kKHdpbmRvdywgJ21vdXNlbW92ZScsIG9uTW91c2VEcmFnKTtcbiAgICBkb20uYmluZCh3aW5kb3csICdtb3VzZXVwJywgb25Nb3VzZVVwKTtcblxuICAgIG9uTW91c2VEcmFnKGUpO1xuICB9XG5cbiAgZnVuY3Rpb24gb25Nb3VzZURyYWcoZSkge1xuXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgdmFyIG9mZnNldCA9IGRvbS5nZXRPZmZzZXQoX3RoaXMuX19iYWNrZ3JvdW5kKTtcbiAgICB2YXIgd2lkdGggPSBkb20uZ2V0V2lkdGgoX3RoaXMuX19iYWNrZ3JvdW5kKTtcblxuICAgIF90aGlzLnNldFZhbHVlKFxuICAgICAgbWFwKGUuY2xpZW50WCwgb2Zmc2V0LmxlZnQsIG9mZnNldC5sZWZ0ICsgd2lkdGgsIF90aGlzLl9fbWluLCBfdGhpcy5fX21heClcbiAgICApO1xuXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIH1cblxuICBmdW5jdGlvbiBvbk1vdXNlVXAoKSB7XG4gICAgZG9tLnVuYmluZCh3aW5kb3csICdtb3VzZW1vdmUnLCBvbk1vdXNlRHJhZyk7XG4gICAgZG9tLnVuYmluZCh3aW5kb3csICdtb3VzZXVwJywgb25Nb3VzZVVwKTtcbiAgICBpZiAoX3RoaXMuX19vbkZpbmlzaENoYW5nZSkge1xuICAgICAgX3RoaXMuX19vbkZpbmlzaENoYW5nZS5jYWxsKF90aGlzLCBfdGhpcy5nZXRWYWx1ZSgpKTtcbiAgICB9XG4gIH1cblxuICB0aGlzLnVwZGF0ZURpc3BsYXkoKTtcblxuICB0aGlzLl9fYmFja2dyb3VuZC5hcHBlbmRDaGlsZCh0aGlzLl9fZm9yZWdyb3VuZCk7XG4gIHRoaXMuZG9tRWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLl9fYmFja2dyb3VuZCk7XG5cbn1cblxuTnVtYmVyQ29udHJvbGxlclNsaWRlci5zdXBlcmNsYXNzID0gTnVtYmVyQ29udHJvbGxlcjtcblxuLyoqXG4gKiBJbmplY3RzIGRlZmF1bHQgc3R5bGVzaGVldCBmb3Igc2xpZGVyIGVsZW1lbnRzLlxuICovXG5OdW1iZXJDb250cm9sbGVyU2xpZGVyLnVzZURlZmF1bHRTdHlsZXMgPSBmdW5jdGlvbigpIHtcbiAgY3NzLmluamVjdChzdHlsZVNoZWV0KTtcbn07XG5cbmNvbW1vbi5leHRlbmQoXG5cbiAgTnVtYmVyQ29udHJvbGxlclNsaWRlci5wcm90b3R5cGUsXG4gIE51bWJlckNvbnRyb2xsZXIucHJvdG90eXBlLFxuXG4gIHtcblxuICAgIHVwZGF0ZURpc3BsYXk6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHBjdCA9ICh0aGlzLmdldFZhbHVlKCkgLSB0aGlzLl9fbWluKSAvICh0aGlzLl9fbWF4IC0gdGhpcy5fX21pbik7XG4gICAgICB0aGlzLl9fZm9yZWdyb3VuZC5zdHlsZS53aWR0aCA9IHBjdCAqIDEwMCArICclJztcbiAgICAgIHJldHVybiBOdW1iZXJDb250cm9sbGVyU2xpZGVyLnN1cGVyY2xhc3MucHJvdG90eXBlLnVwZGF0ZURpc3BsYXkuY2FsbCh0aGlzKTtcbiAgICB9XG5cbiAgfVxuXG5cblxuKTtcblxuZnVuY3Rpb24gbWFwKHYsIGkxLCBpMiwgbzEsIG8yKSB7XG4gIHJldHVybiBvMSArIChvMiAtIG8xKSAqICgodiAtIGkxKSAvIChpMiAtIGkxKSk7XG59XG4iLCIvKipcbiAqIGRhdC1ndWkgSmF2YVNjcmlwdCBDb250cm9sbGVyIExpYnJhcnlcbiAqIGh0dHA6Ly9jb2RlLmdvb2dsZS5jb20vcC9kYXQtZ3VpXG4gKlxuICogQ29weXJpZ2h0IDIwMTEgRGF0YSBBcnRzIFRlYW0sIEdvb2dsZSBDcmVhdGl2ZSBMYWJcbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKi9cblxudmFyIENvbnRyb2xsZXIgPSByZXF1aXJlKCcuL0NvbnRyb2xsZXIuanMnKTtcbnZhciBkb20gPSByZXF1aXJlKCcuLi9kb20vZG9tLmpzJyk7XG52YXIgY29tbW9uID0gcmVxdWlyZSgnLi4vdXRpbHMvY29tbW9uLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gT3B0aW9uQ29udHJvbGxlcjtcblxuLyoqXG4gKiBAY2xhc3MgUHJvdmlkZXMgYSBzZWxlY3QgaW5wdXQgdG8gYWx0ZXIgdGhlIHByb3BlcnR5IG9mIGFuIG9iamVjdCwgdXNpbmcgYVxuICogbGlzdCBvZiBhY2NlcHRlZCB2YWx1ZXMuXG4gKlxuICogQGV4dGVuZHMgZGF0LmNvbnRyb2xsZXJzLkNvbnRyb2xsZXJcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gYmUgbWFuaXB1bGF0ZWRcbiAqIEBwYXJhbSB7c3RyaW5nfSBwcm9wZXJ0eSBUaGUgbmFtZSBvZiB0aGUgcHJvcGVydHkgdG8gYmUgbWFuaXB1bGF0ZWRcbiAqIEBwYXJhbSB7T2JqZWN0fHN0cmluZ1tdfSBvcHRpb25zIEEgbWFwIG9mIGxhYmVscyB0byBhY2NlcHRhYmxlIHZhbHVlcywgb3JcbiAqIGEgbGlzdCBvZiBhY2NlcHRhYmxlIHN0cmluZyB2YWx1ZXMuXG4gKlxuICogQG1lbWJlciBkYXQuY29udHJvbGxlcnNcbiAqL1xuZnVuY3Rpb24gT3B0aW9uQ29udHJvbGxlcihvYmplY3QsIHByb3BlcnR5LCBvcHRpb25zKSB7XG5cbiAgT3B0aW9uQ29udHJvbGxlci5zdXBlcmNsYXNzLmNhbGwodGhpcywgb2JqZWN0LCBwcm9wZXJ0eSk7XG5cbiAgdmFyIF90aGlzID0gdGhpcztcblxuICAvKipcbiAgICogVGhlIGRyb3AgZG93biBtZW51XG4gICAqIEBpZ25vcmVcbiAgICovXG4gIHRoaXMuX19zZWxlY3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzZWxlY3QnKTtcblxuICBpZiAoY29tbW9uLmlzQXJyYXkob3B0aW9ucykpIHtcbiAgICB2YXIgbWFwID0ge307XG4gICAgY29tbW9uLmVhY2gob3B0aW9ucywgZnVuY3Rpb24oZWxlbWVudCkge1xuICAgICAgbWFwW2VsZW1lbnRdID0gZWxlbWVudDtcbiAgICB9KTtcbiAgICBvcHRpb25zID0gbWFwO1xuICB9XG5cbiAgY29tbW9uLmVhY2gob3B0aW9ucywgZnVuY3Rpb24odmFsdWUsIGtleSkge1xuXG4gICAgdmFyIG9wdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ29wdGlvbicpO1xuICAgIG9wdC5pbm5lckhUTUwgPSBrZXk7XG4gICAgb3B0LnNldEF0dHJpYnV0ZSgndmFsdWUnLCB2YWx1ZSk7XG4gICAgX3RoaXMuX19zZWxlY3QuYXBwZW5kQ2hpbGQob3B0KTtcblxuICB9KTtcblxuICAvLyBBY2tub3dsZWRnZSBvcmlnaW5hbCB2YWx1ZVxuICB0aGlzLnVwZGF0ZURpc3BsYXkoKTtcblxuICBkb20uYmluZCh0aGlzLl9fc2VsZWN0LCAnY2hhbmdlJywgZnVuY3Rpb24oKSB7XG4gICAgdmFyIGRlc2lyZWRWYWx1ZSA9IHRoaXMub3B0aW9uc1t0aGlzLnNlbGVjdGVkSW5kZXhdLnZhbHVlO1xuICAgIF90aGlzLnNldFZhbHVlKGRlc2lyZWRWYWx1ZSk7XG4gIH0pO1xuXG4gIHRoaXMuZG9tRWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLl9fc2VsZWN0KTtcblxufVxuXG5PcHRpb25Db250cm9sbGVyLnN1cGVyY2xhc3MgPSBDb250cm9sbGVyO1xuXG5jb21tb24uZXh0ZW5kKFxuXG4gIE9wdGlvbkNvbnRyb2xsZXIucHJvdG90eXBlLFxuICBDb250cm9sbGVyLnByb3RvdHlwZSxcblxuICB7XG5cbiAgICBzZXRWYWx1ZTogZnVuY3Rpb24odikge1xuICAgICAgdmFyIHRvUmV0dXJuID0gT3B0aW9uQ29udHJvbGxlci5zdXBlcmNsYXNzLnByb3RvdHlwZS5zZXRWYWx1ZS5jYWxsKHRoaXMsIHYpO1xuICAgICAgaWYgKHRoaXMuX19vbkZpbmlzaENoYW5nZSkge1xuICAgICAgICB0aGlzLl9fb25GaW5pc2hDaGFuZ2UuY2FsbCh0aGlzLCB0aGlzLmdldFZhbHVlKCkpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRvUmV0dXJuO1xuICAgIH0sXG5cbiAgICB1cGRhdGVEaXNwbGF5OiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuX19zZWxlY3QudmFsdWUgPSB0aGlzLmdldFZhbHVlKCk7XG4gICAgICByZXR1cm4gT3B0aW9uQ29udHJvbGxlci5zdXBlcmNsYXNzLnByb3RvdHlwZS51cGRhdGVEaXNwbGF5LmNhbGwodGhpcyk7XG4gICAgfVxuXG4gIH1cblxuKTtcbiIsIi8qKlxuICogZGF0LWd1aSBKYXZhU2NyaXB0IENvbnRyb2xsZXIgTGlicmFyeVxuICogaHR0cDovL2NvZGUuZ29vZ2xlLmNvbS9wL2RhdC1ndWlcbiAqXG4gKiBDb3B5cmlnaHQgMjAxMSBEYXRhIEFydHMgVGVhbSwgR29vZ2xlIENyZWF0aXZlIExhYlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqL1xuXG52YXIgQ29udHJvbGxlciA9IHJlcXVpcmUoJy4vQ29udHJvbGxlci5qcycpO1xudmFyIGRvbSA9IHJlcXVpcmUoJy4uL2RvbS9kb20uanMnKTtcbnZhciBjb21tb24gPSByZXF1aXJlKCcuLi91dGlscy9jb21tb24uanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBTdHJpbmdDb250cm9sbGVyO1xuXG4vKipcbiAqIEBjbGFzcyBQcm92aWRlcyBhIHRleHQgaW5wdXQgdG8gYWx0ZXIgdGhlIHN0cmluZyBwcm9wZXJ0eSBvZiBhbiBvYmplY3QuXG4gKlxuICogQGV4dGVuZHMgZGF0LmNvbnRyb2xsZXJzLkNvbnRyb2xsZXJcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gYmUgbWFuaXB1bGF0ZWRcbiAqIEBwYXJhbSB7c3RyaW5nfSBwcm9wZXJ0eSBUaGUgbmFtZSBvZiB0aGUgcHJvcGVydHkgdG8gYmUgbWFuaXB1bGF0ZWRcbiAqXG4gKiBAbWVtYmVyIGRhdC5jb250cm9sbGVyc1xuICovXG5mdW5jdGlvbiBTdHJpbmdDb250cm9sbGVyKG9iamVjdCwgcHJvcGVydHkpIHtcblxuICBTdHJpbmdDb250cm9sbGVyLnN1cGVyY2xhc3MuY2FsbCh0aGlzLCBvYmplY3QsIHByb3BlcnR5KTtcblxuICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gIHRoaXMuX19pbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG4gIHRoaXMuX19pbnB1dC5zZXRBdHRyaWJ1dGUoJ3R5cGUnLCAndGV4dCcpO1xuXG4gIGRvbS5iaW5kKHRoaXMuX19pbnB1dCwgJ2tleXVwJywgb25DaGFuZ2UpO1xuICBkb20uYmluZCh0aGlzLl9faW5wdXQsICdjaGFuZ2UnLCBvbkNoYW5nZSk7XG4gIGRvbS5iaW5kKHRoaXMuX19pbnB1dCwgJ2JsdXInLCBvbkJsdXIpO1xuICBkb20uYmluZCh0aGlzLl9faW5wdXQsICdrZXlkb3duJywgZnVuY3Rpb24oZSkge1xuICAgIGlmIChlLmtleUNvZGUgPT09IDEzKSB7XG4gICAgICB0aGlzLmJsdXIoKTtcbiAgICB9XG4gIH0pO1xuXG5cbiAgZnVuY3Rpb24gb25DaGFuZ2UoKSB7XG4gICAgX3RoaXMuc2V0VmFsdWUoX3RoaXMuX19pbnB1dC52YWx1ZSk7XG4gIH1cblxuICBmdW5jdGlvbiBvbkJsdXIoKSB7XG4gICAgaWYgKF90aGlzLl9fb25GaW5pc2hDaGFuZ2UpIHtcbiAgICAgIF90aGlzLl9fb25GaW5pc2hDaGFuZ2UuY2FsbChfdGhpcywgX3RoaXMuZ2V0VmFsdWUoKSk7XG4gICAgfVxuICB9XG5cbiAgdGhpcy51cGRhdGVEaXNwbGF5KCk7XG5cbiAgdGhpcy5kb21FbGVtZW50LmFwcGVuZENoaWxkKHRoaXMuX19pbnB1dCk7XG5cbn07XG5cblN0cmluZ0NvbnRyb2xsZXIuc3VwZXJjbGFzcyA9IENvbnRyb2xsZXI7XG5cbmNvbW1vbi5leHRlbmQoXG5cbiAgU3RyaW5nQ29udHJvbGxlci5wcm90b3R5cGUsXG4gIENvbnRyb2xsZXIucHJvdG90eXBlLFxuXG4gIHtcblxuICAgIHVwZGF0ZURpc3BsYXk6IGZ1bmN0aW9uKCkge1xuICAgICAgLy8gU3RvcHMgdGhlIGNhcmV0IGZyb20gbW92aW5nIG9uIGFjY291bnQgb2Y6XG4gICAgICAvLyBrZXl1cCAtPiBzZXRWYWx1ZSAtPiB1cGRhdGVEaXNwbGF5XG4gICAgICBpZiAoIWRvbS5pc0FjdGl2ZSh0aGlzLl9faW5wdXQpKSB7XG4gICAgICAgIHRoaXMuX19pbnB1dC52YWx1ZSA9IHRoaXMuZ2V0VmFsdWUoKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBTdHJpbmdDb250cm9sbGVyLnN1cGVyY2xhc3MucHJvdG90eXBlLnVwZGF0ZURpc3BsYXkuY2FsbCh0aGlzKTtcbiAgICB9XG5cbiAgfVxuXG4pO1xuIiwiLyoqXG4gKiBkYXQtZ3VpIEphdmFTY3JpcHQgQ29udHJvbGxlciBMaWJyYXJ5XG4gKiBodHRwOi8vY29kZS5nb29nbGUuY29tL3AvZGF0LWd1aVxuICpcbiAqIENvcHlyaWdodCAyMDExIERhdGEgQXJ0cyBUZWFtLCBHb29nbGUgQ3JlYXRpdmUgTGFiXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICovXG52YXIgT3B0aW9uQ29udHJvbGxlciA9IHJlcXVpcmUoJy4vT3B0aW9uQ29udHJvbGxlci5qcycpO1xudmFyIE51bWJlckNvbnRyb2xsZXJCb3ggPSByZXF1aXJlKCcuL051bWJlckNvbnRyb2xsZXJCb3guanMnKTtcbnZhciBOdW1iZXJDb250cm9sbGVyU2xpZGVyID0gcmVxdWlyZSgnLi9OdW1iZXJDb250cm9sbGVyU2xpZGVyLmpzJyk7XG52YXIgU3RyaW5nQ29udHJvbGxlciA9IHJlcXVpcmUoJy4vU3RyaW5nQ29udHJvbGxlci5qcycpO1xudmFyIEZ1bmN0aW9uQ29udHJvbGxlciA9IHJlcXVpcmUoJy4vRnVuY3Rpb25Db250cm9sbGVyLmpzJyk7XG52YXIgQm9vbGVhbkNvbnRyb2xsZXIgPSByZXF1aXJlKCcuL0Jvb2xlYW5Db250cm9sbGVyLmpzJyk7XG52YXIgY29tbW9uID0gcmVxdWlyZSgnLi4vdXRpbHMvY29tbW9uLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZmFjdG9yeTtcblxuZnVuY3Rpb24gZmFjdG9yeShvYmplY3QsIHByb3BlcnR5KSB7XG5cbiAgdmFyIGluaXRpYWxWYWx1ZSA9IG9iamVjdFtwcm9wZXJ0eV07XG5cbiAgLy8gUHJvdmlkaW5nIG9wdGlvbnM/XG4gIGlmIChjb21tb24uaXNBcnJheShhcmd1bWVudHNbMl0pIHx8IGNvbW1vbi5pc09iamVjdChhcmd1bWVudHNbMl0pKSB7XG4gICAgcmV0dXJuIG5ldyBPcHRpb25Db250cm9sbGVyKG9iamVjdCwgcHJvcGVydHksIGFyZ3VtZW50c1syXSk7XG4gIH1cblxuICAvLyBQcm92aWRpbmcgYSBtYXA/XG5cbiAgaWYgKGNvbW1vbi5pc051bWJlcihpbml0aWFsVmFsdWUpKSB7XG5cbiAgICBpZiAoY29tbW9uLmlzTnVtYmVyKGFyZ3VtZW50c1syXSkgJiYgY29tbW9uLmlzTnVtYmVyKGFyZ3VtZW50c1szXSkpIHtcblxuICAgICAgLy8gSGFzIG1pbiBhbmQgbWF4LlxuICAgICAgcmV0dXJuIG5ldyBOdW1iZXJDb250cm9sbGVyU2xpZGVyKG9iamVjdCwgcHJvcGVydHksIGFyZ3VtZW50c1syXSwgYXJndW1lbnRzWzNdKTtcblxuICAgIH0gZWxzZSB7XG5cbiAgICAgIHJldHVybiBuZXcgTnVtYmVyQ29udHJvbGxlckJveChvYmplY3QsIHByb3BlcnR5LCB7XG4gICAgICAgIG1pbjogYXJndW1lbnRzWzJdLFxuICAgICAgICBtYXg6IGFyZ3VtZW50c1szXVxuICAgICAgfSk7XG5cbiAgICB9XG5cbiAgfVxuXG4gIGlmIChjb21tb24uaXNTdHJpbmcoaW5pdGlhbFZhbHVlKSkge1xuICAgIHJldHVybiBuZXcgU3RyaW5nQ29udHJvbGxlcihvYmplY3QsIHByb3BlcnR5KTtcbiAgfVxuXG4gIGlmIChjb21tb24uaXNGdW5jdGlvbihpbml0aWFsVmFsdWUpKSB7XG4gICAgcmV0dXJuIG5ldyBGdW5jdGlvbkNvbnRyb2xsZXIob2JqZWN0LCBwcm9wZXJ0eSwgJycpO1xuICB9XG5cbiAgaWYgKGNvbW1vbi5pc0Jvb2xlYW4oaW5pdGlhbFZhbHVlKSkge1xuICAgIHJldHVybiBuZXcgQm9vbGVhbkNvbnRyb2xsZXIob2JqZWN0LCBwcm9wZXJ0eSk7XG4gIH1cblxufVxuIiwiLyoqXG4gKiBkYXQtZ3VpIEphdmFTY3JpcHQgQ29udHJvbGxlciBMaWJyYXJ5XG4gKiBodHRwOi8vY29kZS5nb29nbGUuY29tL3AvZGF0LWd1aVxuICpcbiAqIENvcHlyaWdodCAyMDExIERhdGEgQXJ0cyBUZWFtLCBHb29nbGUgQ3JlYXRpdmUgTGFiXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICovXG5cbnZhciBjb21tb24gPSByZXF1aXJlKCcuLi91dGlscy9jb21tb24uanMnKTtcbnZhciBkb20gPSByZXF1aXJlKCcuL2RvbS5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IENlbnRlcmVkRGl2O1xuXG5mdW5jdGlvbiBDZW50ZXJlZERpdigpIHtcblxuICB0aGlzLmJhY2tncm91bmRFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIGNvbW1vbi5leHRlbmQodGhpcy5iYWNrZ3JvdW5kRWxlbWVudC5zdHlsZSwge1xuICAgIGJhY2tncm91bmRDb2xvcjogJ3JnYmEoMCwwLDAsMC44KScsXG4gICAgdG9wOiAwLFxuICAgIGxlZnQ6IDAsXG4gICAgZGlzcGxheTogJ25vbmUnLFxuICAgIHpJbmRleDogJzEwMDAnLFxuICAgIG9wYWNpdHk6IDAsXG4gICAgV2Via2l0VHJhbnNpdGlvbjogJ29wYWNpdHkgMC4ycyBsaW5lYXInLFxuICAgIHRyYW5zaXRpb246ICdvcGFjaXR5IDAuMnMgbGluZWFyJ1xuICB9KTtcblxuICBkb20ubWFrZUZ1bGxzY3JlZW4odGhpcy5iYWNrZ3JvdW5kRWxlbWVudCk7XG4gIHRoaXMuYmFja2dyb3VuZEVsZW1lbnQuc3R5bGUucG9zaXRpb24gPSAnZml4ZWQnO1xuXG4gIHRoaXMuZG9tRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICBjb21tb24uZXh0ZW5kKHRoaXMuZG9tRWxlbWVudC5zdHlsZSwge1xuICAgIHBvc2l0aW9uOiAnZml4ZWQnLFxuICAgIGRpc3BsYXk6ICdub25lJyxcbiAgICB6SW5kZXg6ICcxMDAxJyxcbiAgICBvcGFjaXR5OiAwLFxuICAgIFdlYmtpdFRyYW5zaXRpb246ICctd2Via2l0LXRyYW5zZm9ybSAwLjJzIGVhc2Utb3V0LCBvcGFjaXR5IDAuMnMgbGluZWFyJyxcbiAgICB0cmFuc2l0aW9uOiAndHJhbnNmb3JtIDAuMnMgZWFzZS1vdXQsIG9wYWNpdHkgMC4ycyBsaW5lYXInXG4gIH0pO1xuXG5cbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0aGlzLmJhY2tncm91bmRFbGVtZW50KTtcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0aGlzLmRvbUVsZW1lbnQpO1xuXG4gIHZhciBfdGhpcyA9IHRoaXM7XG4gIGRvbS5iaW5kKHRoaXMuYmFja2dyb3VuZEVsZW1lbnQsICdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgIF90aGlzLmhpZGUoKTtcbiAgfSk7XG5cblxufTtcblxuQ2VudGVyZWREaXYucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbigpIHtcblxuICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gIHRoaXMuYmFja2dyb3VuZEVsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG5cbiAgdGhpcy5kb21FbGVtZW50LnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICB0aGlzLmRvbUVsZW1lbnQuc3R5bGUub3BhY2l0eSA9IDA7XG4gIC8vICAgIHRoaXMuZG9tRWxlbWVudC5zdHlsZS50b3AgPSAnNTIlJztcbiAgdGhpcy5kb21FbGVtZW50LnN0eWxlLndlYmtpdFRyYW5zZm9ybSA9ICdzY2FsZSgxLjEpJztcblxuICB0aGlzLmxheW91dCgpO1xuXG4gIGNvbW1vbi5kZWZlcihmdW5jdGlvbigpIHtcbiAgICBfdGhpcy5iYWNrZ3JvdW5kRWxlbWVudC5zdHlsZS5vcGFjaXR5ID0gMTtcbiAgICBfdGhpcy5kb21FbGVtZW50LnN0eWxlLm9wYWNpdHkgPSAxO1xuICAgIF90aGlzLmRvbUVsZW1lbnQuc3R5bGUud2Via2l0VHJhbnNmb3JtID0gJ3NjYWxlKDEpJztcbiAgfSk7XG5cbn07XG5cbkNlbnRlcmVkRGl2LnByb3RvdHlwZS5oaWRlID0gZnVuY3Rpb24oKSB7XG5cbiAgdmFyIF90aGlzID0gdGhpcztcblxuICB2YXIgaGlkZSA9IGZ1bmN0aW9uKCkge1xuXG4gICAgX3RoaXMuZG9tRWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgIF90aGlzLmJhY2tncm91bmRFbGVtZW50LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG5cbiAgICBkb20udW5iaW5kKF90aGlzLmRvbUVsZW1lbnQsICd3ZWJraXRUcmFuc2l0aW9uRW5kJywgaGlkZSk7XG4gICAgZG9tLnVuYmluZChfdGhpcy5kb21FbGVtZW50LCAndHJhbnNpdGlvbmVuZCcsIGhpZGUpO1xuICAgIGRvbS51bmJpbmQoX3RoaXMuZG9tRWxlbWVudCwgJ29UcmFuc2l0aW9uRW5kJywgaGlkZSk7XG5cbiAgfTtcblxuICBkb20uYmluZCh0aGlzLmRvbUVsZW1lbnQsICd3ZWJraXRUcmFuc2l0aW9uRW5kJywgaGlkZSk7XG4gIGRvbS5iaW5kKHRoaXMuZG9tRWxlbWVudCwgJ3RyYW5zaXRpb25lbmQnLCBoaWRlKTtcbiAgZG9tLmJpbmQodGhpcy5kb21FbGVtZW50LCAnb1RyYW5zaXRpb25FbmQnLCBoaWRlKTtcblxuICB0aGlzLmJhY2tncm91bmRFbGVtZW50LnN0eWxlLm9wYWNpdHkgPSAwO1xuICAvLyAgICB0aGlzLmRvbUVsZW1lbnQuc3R5bGUudG9wID0gJzQ4JSc7XG4gIHRoaXMuZG9tRWxlbWVudC5zdHlsZS5vcGFjaXR5ID0gMDtcbiAgdGhpcy5kb21FbGVtZW50LnN0eWxlLndlYmtpdFRyYW5zZm9ybSA9ICdzY2FsZSgxLjEpJztcblxufTtcblxuQ2VudGVyZWREaXYucHJvdG90eXBlLmxheW91dCA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLmRvbUVsZW1lbnQuc3R5bGUubGVmdCA9IHdpbmRvdy5pbm5lcldpZHRoIC8gMiAtIGRvbS5nZXRXaWR0aCh0aGlzLmRvbUVsZW1lbnQpIC8gMiArICdweCc7XG4gIHRoaXMuZG9tRWxlbWVudC5zdHlsZS50b3AgPSB3aW5kb3cuaW5uZXJIZWlnaHQgLyAyIC0gZG9tLmdldEhlaWdodCh0aGlzLmRvbUVsZW1lbnQpIC8gMiArICdweCc7XG59O1xuXG5mdW5jdGlvbiBsb2NrU2Nyb2xsKGUpIHtcbiAgY29uc29sZS5sb2coZSk7XG59XG4iLCIvKipcbiAqIGRhdC1ndWkgSmF2YVNjcmlwdCBDb250cm9sbGVyIExpYnJhcnlcbiAqIGh0dHA6Ly9jb2RlLmdvb2dsZS5jb20vcC9kYXQtZ3VpXG4gKlxuICogQ29weXJpZ2h0IDIwMTEgRGF0YSBBcnRzIFRlYW0sIEdvb2dsZSBDcmVhdGl2ZSBMYWJcbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKi9cblxudmFyIGNvbW1vbiA9IHJlcXVpcmUoJy4uL3V0aWxzL2NvbW1vbi5qcycpO1xuXG52YXIgRVZFTlRfTUFQID0ge1xuICAnSFRNTEV2ZW50cyc6IFsnY2hhbmdlJ10sXG4gICdNb3VzZUV2ZW50cyc6IFsnY2xpY2snLCAnbW91c2Vtb3ZlJywgJ21vdXNlZG93bicsICdtb3VzZXVwJywgJ21vdXNlb3ZlciddLFxuICAnS2V5Ym9hcmRFdmVudHMnOiBbJ2tleWRvd24nXVxufTtcblxudmFyIEVWRU5UX01BUF9JTlYgPSB7fTtcbmNvbW1vbi5lYWNoKEVWRU5UX01BUCwgZnVuY3Rpb24odiwgaykge1xuICBjb21tb24uZWFjaCh2LCBmdW5jdGlvbihlKSB7XG4gICAgRVZFTlRfTUFQX0lOVltlXSA9IGs7XG4gIH0pO1xufSk7XG5cbnZhciBDU1NfVkFMVUVfUElYRUxTID0gLyhcXGQrKFxcLlxcZCspPylweC87XG5cbmZ1bmN0aW9uIGNzc1ZhbHVlVG9QaXhlbHModmFsKSB7XG5cbiAgaWYgKHZhbCA9PT0gJzAnIHx8IGNvbW1vbi5pc1VuZGVmaW5lZCh2YWwpKSByZXR1cm4gMDtcblxuICB2YXIgbWF0Y2ggPSB2YWwubWF0Y2goQ1NTX1ZBTFVFX1BJWEVMUyk7XG5cbiAgaWYgKCFjb21tb24uaXNOdWxsKG1hdGNoKSkge1xuICAgIHJldHVybiBwYXJzZUZsb2F0KG1hdGNoWzFdKTtcbiAgfVxuXG4gIC8vIFRPRE8gLi4uZW1zPyAlP1xuXG4gIHJldHVybiAwO1xuXG59XG5cbi8qKlxuICogQG5hbWVzcGFjZVxuICogQG1lbWJlciBkYXQuZG9tXG4gKi9cbnZhciBkb20gPSB7XG5cbiAgLyoqXG4gICAqXG4gICAqIEBwYXJhbSBlbGVtXG4gICAqIEBwYXJhbSBzZWxlY3RhYmxlXG4gICAqL1xuICBtYWtlU2VsZWN0YWJsZTogZnVuY3Rpb24oZWxlbSwgc2VsZWN0YWJsZSkge1xuXG4gICAgaWYgKGVsZW0gPT09IHVuZGVmaW5lZCB8fCBlbGVtLnN0eWxlID09PSB1bmRlZmluZWQpIHJldHVybjtcblxuICAgIGVsZW0ub25zZWxlY3RzdGFydCA9IHNlbGVjdGFibGUgPyBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9IDogZnVuY3Rpb24oKSB7fTtcblxuICAgIGVsZW0uc3R5bGUuTW96VXNlclNlbGVjdCA9IHNlbGVjdGFibGUgPyAnYXV0bycgOiAnbm9uZSc7XG4gICAgZWxlbS5zdHlsZS5LaHRtbFVzZXJTZWxlY3QgPSBzZWxlY3RhYmxlID8gJ2F1dG8nIDogJ25vbmUnO1xuICAgIGVsZW0udW5zZWxlY3RhYmxlID0gc2VsZWN0YWJsZSA/ICdvbicgOiAnb2ZmJztcblxuICB9LFxuXG4gIC8qKlxuICAgKlxuICAgKiBAcGFyYW0gZWxlbVxuICAgKiBAcGFyYW0gaG9yaXpvbnRhbFxuICAgKiBAcGFyYW0gdmVydGljYWxcbiAgICovXG4gIG1ha2VGdWxsc2NyZWVuOiBmdW5jdGlvbihlbGVtLCBob3Jpem9udGFsLCB2ZXJ0aWNhbCkge1xuXG4gICAgaWYgKGNvbW1vbi5pc1VuZGVmaW5lZChob3Jpem9udGFsKSkgaG9yaXpvbnRhbCA9IHRydWU7XG4gICAgaWYgKGNvbW1vbi5pc1VuZGVmaW5lZCh2ZXJ0aWNhbCkpIHZlcnRpY2FsID0gdHJ1ZTtcblxuICAgIGVsZW0uc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuXG4gICAgaWYgKGhvcml6b250YWwpIHtcbiAgICAgIGVsZW0uc3R5bGUubGVmdCA9IDA7XG4gICAgICBlbGVtLnN0eWxlLnJpZ2h0ID0gMDtcbiAgICB9XG4gICAgaWYgKHZlcnRpY2FsKSB7XG4gICAgICBlbGVtLnN0eWxlLnRvcCA9IDA7XG4gICAgICBlbGVtLnN0eWxlLmJvdHRvbSA9IDA7XG4gICAgfVxuXG4gIH0sXG5cbiAgLyoqXG4gICAqXG4gICAqIEBwYXJhbSBlbGVtXG4gICAqIEBwYXJhbSBldmVudFR5cGVcbiAgICogQHBhcmFtIHBhcmFtc1xuICAgKi9cbiAgZmFrZUV2ZW50OiBmdW5jdGlvbihlbGVtLCBldmVudFR5cGUsIHBhcmFtcywgYXV4KSB7XG4gICAgcGFyYW1zID0gcGFyYW1zIHx8IHt9O1xuICAgIHZhciBjbGFzc05hbWUgPSBFVkVOVF9NQVBfSU5WW2V2ZW50VHlwZV07XG4gICAgaWYgKCFjbGFzc05hbWUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignRXZlbnQgdHlwZSAnICsgZXZlbnRUeXBlICsgJyBub3Qgc3VwcG9ydGVkLicpO1xuICAgIH1cbiAgICB2YXIgZXZ0ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoY2xhc3NOYW1lKTtcbiAgICBzd2l0Y2ggKGNsYXNzTmFtZSkge1xuICAgICAgY2FzZSAnTW91c2VFdmVudHMnOlxuICAgICAgICB2YXIgY2xpZW50WCA9IHBhcmFtcy54IHx8IHBhcmFtcy5jbGllbnRYIHx8IDA7XG4gICAgICAgIHZhciBjbGllbnRZID0gcGFyYW1zLnkgfHwgcGFyYW1zLmNsaWVudFkgfHwgMDtcbiAgICAgICAgZXZ0LmluaXRNb3VzZUV2ZW50KGV2ZW50VHlwZSwgcGFyYW1zLmJ1YmJsZXMgfHwgZmFsc2UsXG4gICAgICAgICAgcGFyYW1zLmNhbmNlbGFibGUgfHwgdHJ1ZSwgd2luZG93LCBwYXJhbXMuY2xpY2tDb3VudCB8fCAxLFxuICAgICAgICAgIDAsIC8vc2NyZWVuIFhcbiAgICAgICAgICAwLCAvL3NjcmVlbiBZXG4gICAgICAgICAgY2xpZW50WCwgLy9jbGllbnQgWFxuICAgICAgICAgIGNsaWVudFksIC8vY2xpZW50IFlcbiAgICAgICAgICBmYWxzZSwgZmFsc2UsIGZhbHNlLCBmYWxzZSwgMCwgbnVsbCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnS2V5Ym9hcmRFdmVudHMnOlxuICAgICAgICB2YXIgaW5pdCA9IGV2dC5pbml0S2V5Ym9hcmRFdmVudCB8fCBldnQuaW5pdEtleUV2ZW50OyAvLyB3ZWJraXQgfHwgbW96XG4gICAgICAgIGNvbW1vbi5kZWZhdWx0cyhwYXJhbXMsIHtcbiAgICAgICAgICBjYW5jZWxhYmxlOiB0cnVlLFxuICAgICAgICAgIGN0cmxLZXk6IGZhbHNlLFxuICAgICAgICAgIGFsdEtleTogZmFsc2UsXG4gICAgICAgICAgc2hpZnRLZXk6IGZhbHNlLFxuICAgICAgICAgIG1ldGFLZXk6IGZhbHNlLFxuICAgICAgICAgIGtleUNvZGU6IHVuZGVmaW5lZCxcbiAgICAgICAgICBjaGFyQ29kZTogdW5kZWZpbmVkXG4gICAgICAgIH0pO1xuICAgICAgICBpbml0KGV2ZW50VHlwZSwgcGFyYW1zLmJ1YmJsZXMgfHwgZmFsc2UsXG4gICAgICAgICAgcGFyYW1zLmNhbmNlbGFibGUsIHdpbmRvdyxcbiAgICAgICAgICBwYXJhbXMuY3RybEtleSwgcGFyYW1zLmFsdEtleSxcbiAgICAgICAgICBwYXJhbXMuc2hpZnRLZXksIHBhcmFtcy5tZXRhS2V5LFxuICAgICAgICAgIHBhcmFtcy5rZXlDb2RlLCBwYXJhbXMuY2hhckNvZGUpO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGV2dC5pbml0RXZlbnQoZXZlbnRUeXBlLCBwYXJhbXMuYnViYmxlcyB8fCBmYWxzZSxcbiAgICAgICAgICBwYXJhbXMuY2FuY2VsYWJsZSB8fCB0cnVlKTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGNvbW1vbi5kZWZhdWx0cyhldnQsIGF1eCk7XG4gICAgZWxlbS5kaXNwYXRjaEV2ZW50KGV2dCk7XG4gIH0sXG5cbiAgLyoqXG4gICAqXG4gICAqIEBwYXJhbSBlbGVtXG4gICAqIEBwYXJhbSBldmVudFxuICAgKiBAcGFyYW0gZnVuY1xuICAgKiBAcGFyYW0gYm9vbFxuICAgKi9cbiAgYmluZDogZnVuY3Rpb24oZWxlbSwgZXZlbnQsIGZ1bmMsIGJvb2wpIHtcbiAgICBib29sID0gYm9vbCB8fCBmYWxzZTtcbiAgICBpZiAoZWxlbS5hZGRFdmVudExpc3RlbmVyKVxuICAgICAgZWxlbS5hZGRFdmVudExpc3RlbmVyKGV2ZW50LCBmdW5jLCBib29sKTtcbiAgICBlbHNlIGlmIChlbGVtLmF0dGFjaEV2ZW50KVxuICAgICAgZWxlbS5hdHRhY2hFdmVudCgnb24nICsgZXZlbnQsIGZ1bmMpO1xuICAgIHJldHVybiBkb207XG4gIH0sXG5cbiAgLyoqXG4gICAqXG4gICAqIEBwYXJhbSBlbGVtXG4gICAqIEBwYXJhbSBldmVudFxuICAgKiBAcGFyYW0gZnVuY1xuICAgKiBAcGFyYW0gYm9vbFxuICAgKi9cbiAgdW5iaW5kOiBmdW5jdGlvbihlbGVtLCBldmVudCwgZnVuYywgYm9vbCkge1xuICAgIGJvb2wgPSBib29sIHx8IGZhbHNlO1xuICAgIGlmIChlbGVtLnJlbW92ZUV2ZW50TGlzdGVuZXIpXG4gICAgICBlbGVtLnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnQsIGZ1bmMsIGJvb2wpO1xuICAgIGVsc2UgaWYgKGVsZW0uZGV0YWNoRXZlbnQpXG4gICAgICBlbGVtLmRldGFjaEV2ZW50KCdvbicgKyBldmVudCwgZnVuYyk7XG4gICAgcmV0dXJuIGRvbTtcbiAgfSxcblxuICAvKipcbiAgICpcbiAgICogQHBhcmFtIGVsZW1cbiAgICogQHBhcmFtIGNsYXNzTmFtZVxuICAgKi9cbiAgYWRkQ2xhc3M6IGZ1bmN0aW9uKGVsZW0sIGNsYXNzTmFtZSkge1xuICAgIGlmIChlbGVtLmNsYXNzTmFtZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBlbGVtLmNsYXNzTmFtZSA9IGNsYXNzTmFtZTtcbiAgICB9IGVsc2UgaWYgKGVsZW0uY2xhc3NOYW1lICE9PSBjbGFzc05hbWUpIHtcbiAgICAgIHZhciBjbGFzc2VzID0gZWxlbS5jbGFzc05hbWUuc3BsaXQoLyArLyk7XG4gICAgICBpZiAoY2xhc3Nlcy5pbmRleE9mKGNsYXNzTmFtZSkgPT0gLTEpIHtcbiAgICAgICAgY2xhc3Nlcy5wdXNoKGNsYXNzTmFtZSk7XG4gICAgICAgIGVsZW0uY2xhc3NOYW1lID0gY2xhc3Nlcy5qb2luKCcgJykucmVwbGFjZSgvXlxccysvLCAnJykucmVwbGFjZSgvXFxzKyQvLCAnJyk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBkb207XG4gIH0sXG5cbiAgLyoqXG4gICAqXG4gICAqIEBwYXJhbSBlbGVtXG4gICAqIEBwYXJhbSBjbGFzc05hbWVcbiAgICovXG4gIHJlbW92ZUNsYXNzOiBmdW5jdGlvbihlbGVtLCBjbGFzc05hbWUpIHtcbiAgICBpZiAoY2xhc3NOYW1lKSB7XG4gICAgICBpZiAoZWxlbS5jbGFzc05hbWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAvLyBlbGVtLmNsYXNzTmFtZSA9IGNsYXNzTmFtZTtcbiAgICAgIH0gZWxzZSBpZiAoZWxlbS5jbGFzc05hbWUgPT09IGNsYXNzTmFtZSkge1xuICAgICAgICBlbGVtLnJlbW92ZUF0dHJpYnV0ZSgnY2xhc3MnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBjbGFzc2VzID0gZWxlbS5jbGFzc05hbWUuc3BsaXQoLyArLyk7XG4gICAgICAgIHZhciBpbmRleCA9IGNsYXNzZXMuaW5kZXhPZihjbGFzc05hbWUpO1xuICAgICAgICBpZiAoaW5kZXggIT0gLTEpIHtcbiAgICAgICAgICBjbGFzc2VzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgZWxlbS5jbGFzc05hbWUgPSBjbGFzc2VzLmpvaW4oJyAnKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBlbGVtLmNsYXNzTmFtZSA9IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgcmV0dXJuIGRvbTtcbiAgfSxcblxuICBoYXNDbGFzczogZnVuY3Rpb24oZWxlbSwgY2xhc3NOYW1lKSB7XG4gICAgcmV0dXJuIG5ldyBSZWdFeHAoJyg/Ol58XFxcXHMrKScgKyBjbGFzc05hbWUgKyAnKD86XFxcXHMrfCQpJykudGVzdChlbGVtLmNsYXNzTmFtZSkgfHwgZmFsc2U7XG4gIH0sXG5cbiAgLyoqXG4gICAqXG4gICAqIEBwYXJhbSBlbGVtXG4gICAqL1xuICBnZXRXaWR0aDogZnVuY3Rpb24oZWxlbSkge1xuXG4gICAgdmFyIHN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZShlbGVtKTtcblxuICAgIHJldHVybiBjc3NWYWx1ZVRvUGl4ZWxzKHN0eWxlWydib3JkZXItbGVmdC13aWR0aCddKSArXG4gICAgICBjc3NWYWx1ZVRvUGl4ZWxzKHN0eWxlWydib3JkZXItcmlnaHQtd2lkdGgnXSkgK1xuICAgICAgY3NzVmFsdWVUb1BpeGVscyhzdHlsZVsncGFkZGluZy1sZWZ0J10pICtcbiAgICAgIGNzc1ZhbHVlVG9QaXhlbHMoc3R5bGVbJ3BhZGRpbmctcmlnaHQnXSkgK1xuICAgICAgY3NzVmFsdWVUb1BpeGVscyhzdHlsZVsnd2lkdGgnXSk7XG4gIH0sXG5cbiAgLyoqXG4gICAqXG4gICAqIEBwYXJhbSBlbGVtXG4gICAqL1xuICBnZXRIZWlnaHQ6IGZ1bmN0aW9uKGVsZW0pIHtcblxuICAgIHZhciBzdHlsZSA9IGdldENvbXB1dGVkU3R5bGUoZWxlbSk7XG5cbiAgICByZXR1cm4gY3NzVmFsdWVUb1BpeGVscyhzdHlsZVsnYm9yZGVyLXRvcC13aWR0aCddKSArXG4gICAgICBjc3NWYWx1ZVRvUGl4ZWxzKHN0eWxlWydib3JkZXItYm90dG9tLXdpZHRoJ10pICtcbiAgICAgIGNzc1ZhbHVlVG9QaXhlbHMoc3R5bGVbJ3BhZGRpbmctdG9wJ10pICtcbiAgICAgIGNzc1ZhbHVlVG9QaXhlbHMoc3R5bGVbJ3BhZGRpbmctYm90dG9tJ10pICtcbiAgICAgIGNzc1ZhbHVlVG9QaXhlbHMoc3R5bGVbJ2hlaWdodCddKTtcbiAgfSxcblxuICAvKipcbiAgICpcbiAgICogQHBhcmFtIGVsZW1cbiAgICovXG4gIGdldE9mZnNldDogZnVuY3Rpb24oZWxlbSkge1xuICAgIHZhciBvZmZzZXQgPSB7XG4gICAgICBsZWZ0OiAwLFxuICAgICAgdG9wOiAwXG4gICAgfTtcbiAgICBpZiAoZWxlbS5vZmZzZXRQYXJlbnQpIHtcbiAgICAgIGRvIHtcbiAgICAgICAgb2Zmc2V0LmxlZnQgKz0gZWxlbS5vZmZzZXRMZWZ0O1xuICAgICAgICBvZmZzZXQudG9wICs9IGVsZW0ub2Zmc2V0VG9wO1xuICAgICAgfSB3aGlsZSAoZWxlbSA9IGVsZW0ub2Zmc2V0UGFyZW50KTtcbiAgICB9XG4gICAgcmV0dXJuIG9mZnNldDtcbiAgfSxcblxuICAvLyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcG9zdHMvMjY4NDU2MS9yZXZpc2lvbnNcbiAgLyoqXG4gICAqXG4gICAqIEBwYXJhbSBlbGVtXG4gICAqL1xuICBpc0FjdGl2ZTogZnVuY3Rpb24oZWxlbSkge1xuICAgIHJldHVybiBlbGVtID09PSBkb2N1bWVudC5hY3RpdmVFbGVtZW50ICYmIChlbGVtLnR5cGUgfHwgZWxlbS5ocmVmKTtcbiAgfVxuXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGRvbTtcbiIsIi8qKlxuICogZGF0LWd1aSBKYXZhU2NyaXB0IENvbnRyb2xsZXIgTGlicmFyeVxuICogaHR0cDovL2NvZGUuZ29vZ2xlLmNvbS9wL2RhdC1ndWlcbiAqXG4gKiBDb3B5cmlnaHQgMjAxMSBEYXRhIEFydHMgVGVhbSwgR29vZ2xlIENyZWF0aXZlIExhYlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqL1xuXG52YXIgY3NzID0gcmVxdWlyZSgnLi4vdXRpbHMvY3NzLmpzJyk7XG5cbnZhciBzYXZlRGlhbG9ndWVDb250ZW50cyA9IFwiPGRpdiBpZD1cXFwiZGctc2F2ZVxcXCIgY2xhc3M9XFxcImRnIGRpYWxvZ3VlXFxcIj5cXG5cXG4gIEhlcmUncyB0aGUgbmV3IGxvYWQgcGFyYW1ldGVyIGZvciB5b3VyIDxjb2RlPkdVSTwvY29kZT4ncyBjb25zdHJ1Y3RvcjpcXG5cXG4gIDx0ZXh0YXJlYSBpZD1cXFwiZGctbmV3LWNvbnN0cnVjdG9yXFxcIj48L3RleHRhcmVhPlxcblxcbiAgPGRpdiBpZD1cXFwiZGctc2F2ZS1sb2NhbGx5XFxcIj5cXG5cXG4gICAgPGlucHV0IGlkPVxcXCJkZy1sb2NhbC1zdG9yYWdlXFxcIiB0eXBlPVxcXCJjaGVja2JveFxcXCIvPiBBdXRvbWF0aWNhbGx5IHNhdmVcXG4gICAgdmFsdWVzIHRvIDxjb2RlPmxvY2FsU3RvcmFnZTwvY29kZT4gb24gZXhpdC5cXG5cXG4gICAgPGRpdiBpZD1cXFwiZGctbG9jYWwtZXhwbGFpblxcXCI+VGhlIHZhbHVlcyBzYXZlZCB0byA8Y29kZT5sb2NhbFN0b3JhZ2U8L2NvZGU+IHdpbGxcXG4gICAgICBvdmVycmlkZSB0aG9zZSBwYXNzZWQgdG8gPGNvZGU+ZGF0LkdVSTwvY29kZT4ncyBjb25zdHJ1Y3Rvci4gVGhpcyBtYWtlcyBpdFxcbiAgICAgIGVhc2llciB0byB3b3JrIGluY3JlbWVudGFsbHksIGJ1dCA8Y29kZT5sb2NhbFN0b3JhZ2U8L2NvZGU+IGlzIGZyYWdpbGUsXFxuICAgICAgYW5kIHlvdXIgZnJpZW5kcyBtYXkgbm90IHNlZSB0aGUgc2FtZSB2YWx1ZXMgeW91IGRvLlxcbiAgICAgIFxcbiAgICA8L2Rpdj5cXG4gICAgXFxuICA8L2Rpdj5cXG5cXG48L2Rpdj5cIjtcbnZhciBzdHlsZVNoZWV0ID0gXCIuZGcge1xcbiAgLyoqIENsZWFyIGxpc3Qgc3R5bGVzICovXFxuICAvKiBBdXRvLXBsYWNlIGNvbnRhaW5lciAqL1xcbiAgLyogQXV0by1wbGFjZWQgR1VJJ3MgKi9cXG4gIC8qIExpbmUgaXRlbXMgdGhhdCBkb24ndCBjb250YWluIGZvbGRlcnMuICovXFxuICAvKiogRm9sZGVyIG5hbWVzICovXFxuICAvKiogSGlkZXMgY2xvc2VkIGl0ZW1zICovXFxuICAvKiogQ29udHJvbGxlciByb3cgKi9cXG4gIC8qKiBOYW1lLWhhbGYgKGxlZnQpICovXFxuICAvKiogQ29udHJvbGxlci1oYWxmIChyaWdodCkgKi9cXG4gIC8qKiBDb250cm9sbGVyIHBsYWNlbWVudCAqL1xcbiAgLyoqIFNob3J0ZXIgbnVtYmVyIGJveGVzIHdoZW4gc2xpZGVyIGlzIHByZXNlbnQuICovXFxuICAvKiogRW5zdXJlIHRoZSBlbnRpcmUgYm9vbGVhbiBhbmQgZnVuY3Rpb24gcm93IHNob3dzIGEgaGFuZCAqLyB9XFxuICAuZGcgdWwge1xcbiAgICBsaXN0LXN0eWxlOiBub25lO1xcbiAgICBtYXJnaW46IDA7XFxuICAgIHBhZGRpbmc6IDA7XFxuICAgIHdpZHRoOiAxMDAlO1xcbiAgICBjbGVhcjogYm90aDsgfVxcbiAgLmRnLmFjIHtcXG4gICAgcG9zaXRpb246IGZpeGVkO1xcbiAgICB0b3A6IDA7XFxuICAgIGxlZnQ6IDA7XFxuICAgIHJpZ2h0OiAwO1xcbiAgICBoZWlnaHQ6IDA7XFxuICAgIHotaW5kZXg6IDA7IH1cXG4gIC5kZzpub3QoLmFjKSAubWFpbiB7XFxuICAgIC8qKiBFeGNsdWRlIG1haW5zIGluIGFjIHNvIHRoYXQgd2UgZG9uJ3QgaGlkZSBjbG9zZSBidXR0b24gKi9cXG4gICAgb3ZlcmZsb3c6IGhpZGRlbjsgfVxcbiAgLmRnLm1haW4ge1xcbiAgICAtd2Via2l0LXRyYW5zaXRpb246IG9wYWNpdHkgMC4xcyBsaW5lYXI7XFxuICAgIC1vLXRyYW5zaXRpb246IG9wYWNpdHkgMC4xcyBsaW5lYXI7XFxuICAgIC1tb3otdHJhbnNpdGlvbjogb3BhY2l0eSAwLjFzIGxpbmVhcjtcXG4gICAgdHJhbnNpdGlvbjogb3BhY2l0eSAwLjFzIGxpbmVhcjsgfVxcbiAgICAuZGcubWFpbi50YWxsZXItdGhhbi13aW5kb3cge1xcbiAgICAgIG92ZXJmbG93LXk6IGF1dG87IH1cXG4gICAgICAuZGcubWFpbi50YWxsZXItdGhhbi13aW5kb3cgLmNsb3NlLWJ1dHRvbiB7XFxuICAgICAgICBvcGFjaXR5OiAxO1xcbiAgICAgICAgLyogVE9ETywgdGhlc2UgYXJlIHN0eWxlIG5vdGVzICovXFxuICAgICAgICBtYXJnaW4tdG9wOiAtMXB4O1xcbiAgICAgICAgYm9yZGVyLXRvcDogMXB4IHNvbGlkICMyYzJjMmM7IH1cXG4gICAgLmRnLm1haW4gdWwuY2xvc2VkIC5jbG9zZS1idXR0b24ge1xcbiAgICAgIG9wYWNpdHk6IDEgIWltcG9ydGFudDsgfVxcbiAgICAuZGcubWFpbjpob3ZlciAuY2xvc2UtYnV0dG9uLFxcbiAgICAuZGcubWFpbiAuY2xvc2UtYnV0dG9uLmRyYWcge1xcbiAgICAgIG9wYWNpdHk6IDE7IH1cXG4gICAgLmRnLm1haW4gLmNsb3NlLWJ1dHRvbiB7XFxuICAgICAgLypvcGFjaXR5OiAwOyovXFxuICAgICAgLXdlYmtpdC10cmFuc2l0aW9uOiBvcGFjaXR5IDAuMXMgbGluZWFyO1xcbiAgICAgIC1vLXRyYW5zaXRpb246IG9wYWNpdHkgMC4xcyBsaW5lYXI7XFxuICAgICAgLW1vei10cmFuc2l0aW9uOiBvcGFjaXR5IDAuMXMgbGluZWFyO1xcbiAgICAgIHRyYW5zaXRpb246IG9wYWNpdHkgMC4xcyBsaW5lYXI7XFxuICAgICAgYm9yZGVyOiAwO1xcbiAgICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcXG4gICAgICBsaW5lLWhlaWdodDogMTlweDtcXG4gICAgICBoZWlnaHQ6IDIwcHg7XFxuICAgICAgLyogVE9ETywgdGhlc2UgYXJlIHN0eWxlIG5vdGVzICovXFxuICAgICAgY3Vyc29yOiBwb2ludGVyO1xcbiAgICAgIHRleHQtYWxpZ246IGNlbnRlcjtcXG4gICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjMDAwOyB9XFxuICAgICAgLmRnLm1haW4gLmNsb3NlLWJ1dHRvbjpob3ZlciB7XFxuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjMTExOyB9XFxuICAuZGcuYSB7XFxuICAgIGZsb2F0OiByaWdodDtcXG4gICAgbWFyZ2luLXJpZ2h0OiAxNXB4O1xcbiAgICBvdmVyZmxvdy14OiBoaWRkZW47IH1cXG4gICAgLmRnLmEuaGFzLXNhdmUgPiB1bCB7XFxuICAgICAgbWFyZ2luLXRvcDogMjdweDsgfVxcbiAgICAgIC5kZy5hLmhhcy1zYXZlID4gdWwuY2xvc2VkIHtcXG4gICAgICAgIG1hcmdpbi10b3A6IDA7IH1cXG4gICAgLmRnLmEgLnNhdmUtcm93IHtcXG4gICAgICBwb3NpdGlvbjogZml4ZWQ7XFxuICAgICAgdG9wOiAwO1xcbiAgICAgIHotaW5kZXg6IDEwMDI7IH1cXG4gIC5kZyBsaSB7XFxuICAgIC13ZWJraXQtdHJhbnNpdGlvbjogaGVpZ2h0IDAuMXMgZWFzZS1vdXQ7XFxuICAgIC1vLXRyYW5zaXRpb246IGhlaWdodCAwLjFzIGVhc2Utb3V0O1xcbiAgICAtbW96LXRyYW5zaXRpb246IGhlaWdodCAwLjFzIGVhc2Utb3V0O1xcbiAgICB0cmFuc2l0aW9uOiBoZWlnaHQgMC4xcyBlYXNlLW91dDsgfVxcbiAgLmRnIGxpOm5vdCguZm9sZGVyKSB7XFxuICAgIGN1cnNvcjogYXV0bztcXG4gICAgaGVpZ2h0OiAyN3B4O1xcbiAgICBsaW5lLWhlaWdodDogMjdweDtcXG4gICAgb3ZlcmZsb3c6IGhpZGRlbjtcXG4gICAgcGFkZGluZzogMCA0cHggMCA1cHg7IH1cXG4gIC5kZyBsaS5mb2xkZXIge1xcbiAgICBwYWRkaW5nOiAwO1xcbiAgICBib3JkZXItbGVmdDogNHB4IHNvbGlkIHJnYmEoMCwgMCwgMCwgMCk7IH1cXG4gIC5kZyBsaS50aXRsZSB7XFxuICAgIGN1cnNvcjogcG9pbnRlcjtcXG4gICAgbWFyZ2luLWxlZnQ6IC00cHg7IH1cXG4gIC5kZyAuY2xvc2VkIGxpOm5vdCgudGl0bGUpLFxcbiAgLmRnIC5jbG9zZWQgdWwgbGksXFxuICAuZGcgLmNsb3NlZCB1bCBsaSA+ICoge1xcbiAgICBoZWlnaHQ6IDA7XFxuICAgIG92ZXJmbG93OiBoaWRkZW47XFxuICAgIGJvcmRlcjogMDsgfVxcbiAgLmRnIC5jciB7XFxuICAgIGNsZWFyOiBib3RoO1xcbiAgICBwYWRkaW5nLWxlZnQ6IDNweDtcXG4gICAgaGVpZ2h0OiAyN3B4OyB9XFxuICAuZGcgLnByb3BlcnR5LW5hbWUge1xcbiAgICBjdXJzb3I6IGRlZmF1bHQ7XFxuICAgIGZsb2F0OiBsZWZ0O1xcbiAgICBjbGVhcjogbGVmdDtcXG4gICAgd2lkdGg6IDQwJTtcXG4gICAgb3ZlcmZsb3c6IGhpZGRlbjtcXG4gICAgdGV4dC1vdmVyZmxvdzogZWxsaXBzaXM7IH1cXG4gIC5kZyAuYyB7XFxuICAgIGZsb2F0OiBsZWZ0O1xcbiAgICB3aWR0aDogNjAlOyB9XFxuICAuZGcgLmMgaW5wdXRbdHlwZT10ZXh0XSB7XFxuICAgIGJvcmRlcjogMDtcXG4gICAgbWFyZ2luLXRvcDogNHB4O1xcbiAgICBwYWRkaW5nOiAzcHg7XFxuICAgIHdpZHRoOiAxMDAlO1xcbiAgICBmbG9hdDogcmlnaHQ7IH1cXG4gIC5kZyAuaGFzLXNsaWRlciBpbnB1dFt0eXBlPXRleHRdIHtcXG4gICAgd2lkdGg6IDMwJTtcXG4gICAgLypkaXNwbGF5OiBub25lOyovXFxuICAgIG1hcmdpbi1sZWZ0OiAwOyB9XFxuICAuZGcgLnNsaWRlciB7XFxuICAgIGZsb2F0OiBsZWZ0O1xcbiAgICB3aWR0aDogNjYlO1xcbiAgICBtYXJnaW4tbGVmdDogLTVweDtcXG4gICAgbWFyZ2luLXJpZ2h0OiAwO1xcbiAgICBoZWlnaHQ6IDE5cHg7XFxuICAgIG1hcmdpbi10b3A6IDRweDsgfVxcbiAgLmRnIC5zbGlkZXItZmcge1xcbiAgICBoZWlnaHQ6IDEwMCU7IH1cXG4gIC5kZyAuYyBpbnB1dFt0eXBlPWNoZWNrYm94XSB7XFxuICAgIG1hcmdpbi10b3A6IDlweDsgfVxcbiAgLmRnIC5jIHNlbGVjdCB7XFxuICAgIG1hcmdpbi10b3A6IDVweDsgfVxcbiAgLmRnIC5jci5mdW5jdGlvbixcXG4gIC5kZyAuY3IuZnVuY3Rpb24gLnByb3BlcnR5LW5hbWUsXFxuICAuZGcgLmNyLmZ1bmN0aW9uICosXFxuICAuZGcgLmNyLmJvb2xlYW4sXFxuICAuZGcgLmNyLmJvb2xlYW4gKiB7XFxuICAgIGN1cnNvcjogcG9pbnRlcjsgfVxcbiAgLmRnIC5zZWxlY3RvciB7XFxuICAgIGRpc3BsYXk6IG5vbmU7XFxuICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcXG4gICAgbWFyZ2luLWxlZnQ6IC05cHg7XFxuICAgIG1hcmdpbi10b3A6IDIzcHg7XFxuICAgIHotaW5kZXg6IDEwOyB9XFxuICAuZGcgLmM6aG92ZXIgLnNlbGVjdG9yLFxcbiAgLmRnIC5zZWxlY3Rvci5kcmFnIHtcXG4gICAgZGlzcGxheTogYmxvY2s7IH1cXG4gIC5kZyBsaS5zYXZlLXJvdyB7XFxuICAgIHBhZGRpbmc6IDA7IH1cXG4gICAgLmRnIGxpLnNhdmUtcm93IC5idXR0b24ge1xcbiAgICAgIGRpc3BsYXk6IGlubGluZS1ibG9jaztcXG4gICAgICBwYWRkaW5nOiAwcHggNnB4OyB9XFxuICAuZGcuZGlhbG9ndWUge1xcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjMjIyO1xcbiAgICB3aWR0aDogNDYwcHg7XFxuICAgIHBhZGRpbmc6IDE1cHg7XFxuICAgIGZvbnQtc2l6ZTogMTNweDtcXG4gICAgbGluZS1oZWlnaHQ6IDE1cHg7IH1cXG5cXG4vKiBUT0RPIFNlcGFyYXRlIHN0eWxlIGFuZCBzdHJ1Y3R1cmUgKi9cXG4jZGctbmV3LWNvbnN0cnVjdG9yIHtcXG4gIHBhZGRpbmc6IDEwcHg7XFxuICBjb2xvcjogIzIyMjtcXG4gIGZvbnQtZmFtaWx5OiBNb25hY28sIG1vbm9zcGFjZTtcXG4gIGZvbnQtc2l6ZTogMTBweDtcXG4gIGJvcmRlcjogMDtcXG4gIHJlc2l6ZTogbm9uZTtcXG4gIGJveC1zaGFkb3c6IGluc2V0IDFweCAxcHggMXB4ICM4ODg7XFxuICB3b3JkLXdyYXA6IGJyZWFrLXdvcmQ7XFxuICBtYXJnaW46IDEycHggMDtcXG4gIGRpc3BsYXk6IGJsb2NrO1xcbiAgd2lkdGg6IDQ0MHB4O1xcbiAgb3ZlcmZsb3cteTogc2Nyb2xsO1xcbiAgaGVpZ2h0OiAxMDBweDtcXG4gIHBvc2l0aW9uOiByZWxhdGl2ZTsgfVxcblxcbiNkZy1sb2NhbC1leHBsYWluIHtcXG4gIGRpc3BsYXk6IG5vbmU7XFxuICBmb250LXNpemU6IDExcHg7XFxuICBsaW5lLWhlaWdodDogMTdweDtcXG4gIGJvcmRlci1yYWRpdXM6IDNweDtcXG4gIGJhY2tncm91bmQtY29sb3I6ICMzMzM7XFxuICBwYWRkaW5nOiA4cHg7XFxuICBtYXJnaW4tdG9wOiAxMHB4OyB9XFxuICAjZGctbG9jYWwtZXhwbGFpbiBjb2RlIHtcXG4gICAgZm9udC1zaXplOiAxMHB4OyB9XFxuXFxuI2RhdC1ndWktc2F2ZS1sb2NhbGx5IHtcXG4gIGRpc3BsYXk6IG5vbmU7IH1cXG5cXG4vKiogTWFpbiB0eXBlICovXFxuLmRnIHtcXG4gIGNvbG9yOiAjZWVlO1xcbiAgZm9udDogMTFweCAnTHVjaWRhIEdyYW5kZScsIHNhbnMtc2VyaWY7XFxuICB0ZXh0LXNoYWRvdzogMCAtMXB4IDAgIzExMTtcXG4gIC8qKiBBdXRvIHBsYWNlICovXFxuICAvKiBDb250cm9sbGVyIHJvdywgPGxpPiAqL1xcbiAgLyoqIENvbnRyb2xsZXJzICovIH1cXG4gIC5kZy5tYWluIHtcXG4gICAgLyoqIFNjcm9sbGJhciAqLyB9XFxuICAgIC5kZy5tYWluOjotd2Via2l0LXNjcm9sbGJhciB7XFxuICAgICAgd2lkdGg6IDVweDtcXG4gICAgICBiYWNrZ3JvdW5kOiAjMWExYTFhOyB9XFxuICAgIC5kZy5tYWluOjotd2Via2l0LXNjcm9sbGJhci1jb3JuZXIge1xcbiAgICAgIGhlaWdodDogMDtcXG4gICAgICBkaXNwbGF5OiBub25lOyB9XFxuICAgIC5kZy5tYWluOjotd2Via2l0LXNjcm9sbGJhci10aHVtYiB7XFxuICAgICAgYm9yZGVyLXJhZGl1czogNXB4O1xcbiAgICAgIGJhY2tncm91bmQ6ICM2NzY3Njc7IH1cXG4gIC5kZyBsaTpub3QoLmZvbGRlcikge1xcbiAgICBiYWNrZ3JvdW5kOiAjMWExYTFhO1xcbiAgICBib3JkZXItYm90dG9tOiAxcHggc29saWQgIzJjMmMyYzsgfVxcbiAgLmRnIGxpLnNhdmUtcm93IHtcXG4gICAgbGluZS1oZWlnaHQ6IDI1cHg7XFxuICAgIGJhY2tncm91bmQ6ICNkYWQ1Y2I7XFxuICAgIGJvcmRlcjogMDsgfVxcbiAgICAuZGcgbGkuc2F2ZS1yb3cgc2VsZWN0IHtcXG4gICAgICBtYXJnaW4tbGVmdDogNXB4O1xcbiAgICAgIHdpZHRoOiAxMDhweDsgfVxcbiAgICAuZGcgbGkuc2F2ZS1yb3cgLmJ1dHRvbiB7XFxuICAgICAgbWFyZ2luLWxlZnQ6IDVweDtcXG4gICAgICBtYXJnaW4tdG9wOiAxcHg7XFxuICAgICAgYm9yZGVyLXJhZGl1czogMnB4O1xcbiAgICAgIGZvbnQtc2l6ZTogOXB4O1xcbiAgICAgIGxpbmUtaGVpZ2h0OiA3cHg7XFxuICAgICAgcGFkZGluZzogNHB4IDRweCA1cHggNHB4O1xcbiAgICAgIGJhY2tncm91bmQ6ICNjNWJkYWQ7XFxuICAgICAgY29sb3I6ICNmZmY7XFxuICAgICAgdGV4dC1zaGFkb3c6IDAgMXB4IDAgI2IwYTU4ZjtcXG4gICAgICBib3gtc2hhZG93OiAwIC0xcHggMCAjYjBhNThmO1xcbiAgICAgIGN1cnNvcjogcG9pbnRlcjsgfVxcbiAgICAgIC5kZyBsaS5zYXZlLXJvdyAuYnV0dG9uLmdlYXJzIHtcXG4gICAgICAgIGJhY2tncm91bmQ6ICNjNWJkYWQgdXJsKGRhdGE6aW1hZ2UvcG5nO2Jhc2U2NCxpVkJPUncwS0dnb0FBQUFOU1VoRVVnQUFBQXNBQUFBTkNBWUFBQUIvOVpRN0FBQUFHWFJGV0hSVGIyWjBkMkZ5WlFCQlpHOWlaU0JKYldGblpWSmxZV1I1Y2NsbFBBQUFBUUpKUkVGVWVOcGlZS0FVL1AvL1B3R0lDL0FwQ0FCaUJTQVcrSThBQ2xBY2dLeFE0VDlob01BRVVyeHgyUVNHTjYrZWdEWCsvdldUNGU3TjgyQU1Zb1BBeC9ldndXb1lvU1liQUNYMnM3S3hDeHpjc2V6RGgzZXZGb0RFQllURUVxeWNnZ1dBekE5QXVVU1FRZ2VZUGE5ZlB2Ni9ZV20vQWN4NUlQYjd0eS9mdytRWmJsdzY3dkRzOFIwWUh5UWhnT2J4K3lBSmtCcW1HNWRQUERoMWFQT0dSL2V1Z1cwRzR2bElvVElmeUZjQStRZWtoaEhKaFBkUXhiaUFJZ3VNQlRRWnJQRDcxMDhNNnJvV1lERlFpSUFBdjZBb3cvMWJGd1hnaXMrZjJMVUF5bndvSWFOY3o4WE54M0RsN01FSlVER1FweDlndFE4WUN1ZUIrRDI2T0VDQUFRRGFkdDdlNDZENDJRQUFBQUJKUlU1RXJrSmdnZz09KSAycHggMXB4IG5vLXJlcGVhdDtcXG4gICAgICAgIGhlaWdodDogN3B4O1xcbiAgICAgICAgd2lkdGg6IDhweDsgfVxcbiAgICAgIC5kZyBsaS5zYXZlLXJvdyAuYnV0dG9uOmhvdmVyIHtcXG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6ICNiYWIxOWU7XFxuICAgICAgICBib3gtc2hhZG93OiAwIC0xcHggMCAjYjBhNThmOyB9XFxuICAuZGcgbGkuZm9sZGVyIHtcXG4gICAgYm9yZGVyLWJvdHRvbTogMDsgfVxcbiAgLmRnIGxpLnRpdGxlIHtcXG4gICAgcGFkZGluZy1sZWZ0OiAxNnB4O1xcbiAgICBiYWNrZ3JvdW5kOiBibGFjayB1cmwoZGF0YTppbWFnZS9naWY7YmFzZTY0LFIwbEdPRGxoQlFBRkFKRUFBUC8vLy9QejgvLy8vLy8vL3lINUJBRUFBQUlBTEFBQUFBQUZBQVVBQUFJSWxJK2hLZ0Z4b0NnQU93PT0pIDZweCAxMHB4IG5vLXJlcGVhdDtcXG4gICAgY3Vyc29yOiBwb2ludGVyO1xcbiAgICBib3JkZXItYm90dG9tOiAxcHggc29saWQgcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjIpOyB9XFxuICAuZGcgLmNsb3NlZCBsaS50aXRsZSB7XFxuICAgIGJhY2tncm91bmQtaW1hZ2U6IHVybChkYXRhOmltYWdlL2dpZjtiYXNlNjQsUjBsR09EbGhCUUFGQUpFQUFQLy8vL1B6OC8vLy8vLy8veUg1QkFFQUFBSUFMQUFBQUFBRkFBVUFBQUlJbEdJV3FNQ2JXQUVBT3c9PSk7IH1cXG4gIC5kZyAuY3IuYm9vbGVhbiB7XFxuICAgIGJvcmRlci1sZWZ0OiAzcHggc29saWQgIzgwNjc4NzsgfVxcbiAgLmRnIC5jci5mdW5jdGlvbiB7XFxuICAgIGJvcmRlci1sZWZ0OiAzcHggc29saWQgI2U2MWQ1ZjsgfVxcbiAgLmRnIC5jci5udW1iZXIge1xcbiAgICBib3JkZXItbGVmdDogM3B4IHNvbGlkICMyZmExZDY7IH1cXG4gICAgLmRnIC5jci5udW1iZXIgaW5wdXRbdHlwZT10ZXh0XSB7XFxuICAgICAgY29sb3I6ICMyZmExZDY7IH1cXG4gIC5kZyAuY3Iuc3RyaW5nIHtcXG4gICAgYm9yZGVyLWxlZnQ6IDNweCBzb2xpZCAjMWVkMzZmOyB9XFxuICAgIC5kZyAuY3Iuc3RyaW5nIGlucHV0W3R5cGU9dGV4dF0ge1xcbiAgICAgIGNvbG9yOiAjMWVkMzZmOyB9XFxuICAuZGcgLmNyLmZ1bmN0aW9uOmhvdmVyLCAuZGcgLmNyLmJvb2xlYW46aG92ZXIge1xcbiAgICBiYWNrZ3JvdW5kOiAjMTExOyB9XFxuICAuZGcgLmMgaW5wdXRbdHlwZT10ZXh0XSB7XFxuICAgIGJhY2tncm91bmQ6ICMzMDMwMzA7XFxuICAgIG91dGxpbmU6IG5vbmU7IH1cXG4gICAgLmRnIC5jIGlucHV0W3R5cGU9dGV4dF06aG92ZXIge1xcbiAgICAgIGJhY2tncm91bmQ6ICMzYzNjM2M7IH1cXG4gICAgLmRnIC5jIGlucHV0W3R5cGU9dGV4dF06Zm9jdXMge1xcbiAgICAgIGJhY2tncm91bmQ6ICM0OTQ5NDk7XFxuICAgICAgY29sb3I6ICNmZmY7IH1cXG4gIC5kZyAuYyAuc2xpZGVyIHtcXG4gICAgYmFja2dyb3VuZDogIzMwMzAzMDtcXG4gICAgY3Vyc29yOiBldy1yZXNpemU7IH1cXG4gIC5kZyAuYyAuc2xpZGVyLWZnIHtcXG4gICAgYmFja2dyb3VuZDogIzJmYTFkNjsgfVxcbiAgLmRnIC5jIC5zbGlkZXI6aG92ZXIge1xcbiAgICBiYWNrZ3JvdW5kOiAjM2MzYzNjOyB9XFxuICAgIC5kZyAuYyAuc2xpZGVyOmhvdmVyIC5zbGlkZXItZmcge1xcbiAgICAgIGJhY2tncm91bmQ6ICM0NGFiZGE7IH1cXG5cIjtcblxudmFyIGNvbnRyb2xsZXJGYWN0b3J5ID0gcmVxdWlyZSgnLi4vY29udHJvbGxlcnMvZmFjdG9yeS5qcycpO1xudmFyIENvbnRyb2xsZXIgPSByZXF1aXJlKCcuLi9jb250cm9sbGVycy9Db250cm9sbGVyLmpzJyk7XG52YXIgQm9vbGVhbkNvbnRyb2xsZXIgPSByZXF1aXJlKCcuLi9jb250cm9sbGVycy9Cb29sZWFuQ29udHJvbGxlci5qcycpO1xudmFyIEZ1bmN0aW9uQ29udHJvbGxlciA9IHJlcXVpcmUoJy4uL2NvbnRyb2xsZXJzL0Z1bmN0aW9uQ29udHJvbGxlci5qcycpO1xudmFyIE51bWJlckNvbnRyb2xsZXJCb3ggPSByZXF1aXJlKCcuLi9jb250cm9sbGVycy9OdW1iZXJDb250cm9sbGVyQm94LmpzJyk7XG52YXIgTnVtYmVyQ29udHJvbGxlclNsaWRlciA9IHJlcXVpcmUoJy4uL2NvbnRyb2xsZXJzL051bWJlckNvbnRyb2xsZXJTbGlkZXIuanMnKTtcbnZhciBDb2xvckNvbnRyb2xsZXIgPSByZXF1aXJlKCcuLi9jb250cm9sbGVycy9Db2xvckNvbnRyb2xsZXIuanMnKTtcblxudmFyIHJhZiA9IHJlcXVpcmUoJy4uL3V0aWxzL3JlcXVlc3RBbmltYXRpb25GcmFtZS5qcycpO1xudmFyIENlbnRlcmVkRGl2ID0gcmVxdWlyZSgnLi4vZG9tL0NlbnRlcmVkRGl2LmpzJyk7XG52YXIgZG9tID0gcmVxdWlyZSgnLi4vZG9tL2RvbS5qcycpO1xudmFyIGNvbW1vbiA9IHJlcXVpcmUoJy4uL3V0aWxzL2NvbW1vbi5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNyZWF0ZUdVSSgpO1xuXG5mdW5jdGlvbiBjcmVhdGVHVUkoKSB7XG5cbiAgY3NzLmluamVjdChzdHlsZVNoZWV0KTtcblxuICAvKiogT3V0ZXItbW9zdCBjbGFzc05hbWUgZm9yIEdVSSdzICovXG4gIHZhciBDU1NfTkFNRVNQQUNFID0gJ2RnJztcblxuICB2YXIgSElERV9LRVlfQ09ERSA9IDcyO1xuXG4gIC8qKiBUaGUgb25seSB2YWx1ZSBzaGFyZWQgYmV0d2VlbiB0aGUgSlMgYW5kIFNDU1MuIFVzZSBjYXV0aW9uLiAqL1xuICB2YXIgQ0xPU0VfQlVUVE9OX0hFSUdIVCA9IDIwO1xuXG4gIHZhciBERUZBVUxUX0RFRkFVTFRfUFJFU0VUX05BTUUgPSAnRGVmYXVsdCc7XG5cbiAgdmFyIFNVUFBPUlRTX0xPQ0FMX1NUT1JBR0UgPSAoZnVuY3Rpb24oKSB7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiAnbG9jYWxTdG9yYWdlJyBpbiB3aW5kb3cgJiYgd2luZG93Wydsb2NhbFN0b3JhZ2UnXSAhPT0gbnVsbDtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9KSgpO1xuXG4gIHZhciBTQVZFX0RJQUxPR1VFO1xuXG4gIC8qKiBIYXZlIHdlIHlldCB0byBjcmVhdGUgYW4gYXV0b1BsYWNlIEdVST8gKi9cbiAgdmFyIGF1dG9fcGxhY2VfdmlyZ2luID0gdHJ1ZTtcblxuICAvKiogRml4ZWQgcG9zaXRpb24gZGl2IHRoYXQgYXV0byBwbGFjZSBHVUkncyBnbyBpbnNpZGUgKi9cbiAgdmFyIGF1dG9fcGxhY2VfY29udGFpbmVyO1xuXG4gIC8qKiBBcmUgd2UgaGlkaW5nIHRoZSBHVUkncyA/ICovXG4gIHZhciBoaWRlID0gZmFsc2U7XG5cbiAgLyoqIEdVSSdzIHdoaWNoIHNob3VsZCBiZSBoaWRkZW4gKi9cbiAgdmFyIGhpZGVhYmxlX2d1aXMgPSBbXTtcblxuICAvKipcbiAgICogQSBsaWdodHdlaWdodCBjb250cm9sbGVyIGxpYnJhcnkgZm9yIEphdmFTY3JpcHQuIEl0IGFsbG93cyB5b3UgdG8gZWFzaWx5XG4gICAqIG1hbmlwdWxhdGUgdmFyaWFibGVzIGFuZCBmaXJlIGZ1bmN0aW9ucyBvbiB0aGUgZmx5LlxuICAgKiBAY2xhc3NcbiAgICpcbiAgICogQG1lbWJlciBkYXQuZ3VpXG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbcGFyYW1zXVxuICAgKiBAcGFyYW0ge1N0cmluZ30gW3BhcmFtcy5uYW1lXSBUaGUgbmFtZSBvZiB0aGlzIEdVSS5cbiAgICogQHBhcmFtIHtPYmplY3R9IFtwYXJhbXMubG9hZF0gSlNPTiBvYmplY3QgcmVwcmVzZW50aW5nIHRoZSBzYXZlZCBzdGF0ZSBvZlxuICAgKiB0aGlzIEdVSS5cbiAgICogQHBhcmFtIHtCb29sZWFufSBbcGFyYW1zLmF1dG89dHJ1ZV1cbiAgICogQHBhcmFtIHtkYXQuZ3VpLkdVSX0gW3BhcmFtcy5wYXJlbnRdIFRoZSBHVUkgSSdtIG5lc3RlZCBpbi5cbiAgICogQHBhcmFtIHtCb29sZWFufSBbcGFyYW1zLmNsb3NlZF0gSWYgdHJ1ZSwgc3RhcnRzIGNsb3NlZFxuICAgKi9cbiAgdmFyIEdVSSA9IGZ1bmN0aW9uKHBhcmFtcykge1xuXG4gICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgIC8qKlxuICAgICAqIE91dGVybW9zdCBET00gRWxlbWVudFxuICAgICAqIEB0eXBlIERPTUVsZW1lbnRcbiAgICAgKi9cbiAgICB0aGlzLmRvbUVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB0aGlzLl9fdWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd1bCcpO1xuICAgIHRoaXMuZG9tRWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLl9fdWwpO1xuXG4gICAgZG9tLmFkZENsYXNzKHRoaXMuZG9tRWxlbWVudCwgQ1NTX05BTUVTUEFDRSk7XG5cbiAgICAvKipcbiAgICAgKiBOZXN0ZWQgR1VJJ3MgYnkgbmFtZVxuICAgICAqIEBpZ25vcmVcbiAgICAgKi9cbiAgICB0aGlzLl9fZm9sZGVycyA9IHt9O1xuXG4gICAgdGhpcy5fX2NvbnRyb2xsZXJzID0gW107XG5cbiAgICAvKipcbiAgICAgKiBMaXN0IG9mIG9iamVjdHMgSSdtIHJlbWVtYmVyaW5nIGZvciBzYXZlLCBvbmx5IHVzZWQgaW4gdG9wIGxldmVsIEdVSVxuICAgICAqIEBpZ25vcmVcbiAgICAgKi9cbiAgICB0aGlzLl9fcmVtZW1iZXJlZE9iamVjdHMgPSBbXTtcblxuICAgIC8qKlxuICAgICAqIE1hcHMgdGhlIGluZGV4IG9mIHJlbWVtYmVyZWQgb2JqZWN0cyB0byBhIG1hcCBvZiBjb250cm9sbGVycywgb25seSB1c2VkXG4gICAgICogaW4gdG9wIGxldmVsIEdVSS5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICogQGlnbm9yZVxuICAgICAqXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiBbXG4gICAgICogIHtcbiAgICAgKiAgICBwcm9wZXJ0eU5hbWU6IENvbnRyb2xsZXIsXG4gICAgICogICAgYW5vdGhlclByb3BlcnR5TmFtZTogQ29udHJvbGxlclxuICAgICAqICB9LFxuICAgICAqICB7XG4gICAgICogICAgcHJvcGVydHlOYW1lOiBDb250cm9sbGVyXG4gICAgICogIH1cbiAgICAgKiBdXG4gICAgICovXG4gICAgdGhpcy5fX3JlbWVtYmVyZWRPYmplY3RJbmRlY2VzVG9Db250cm9sbGVycyA9IFtdO1xuXG4gICAgdGhpcy5fX2xpc3RlbmluZyA9IFtdO1xuXG4gICAgcGFyYW1zID0gcGFyYW1zIHx8IHt9O1xuXG4gICAgLy8gRGVmYXVsdCBwYXJhbWV0ZXJzXG4gICAgcGFyYW1zID0gY29tbW9uLmRlZmF1bHRzKHBhcmFtcywge1xuICAgICAgYXV0b1BsYWNlOiB0cnVlLFxuICAgICAgd2lkdGg6IEdVSS5ERUZBVUxUX1dJRFRIXG4gICAgfSk7XG5cbiAgICBwYXJhbXMgPSBjb21tb24uZGVmYXVsdHMocGFyYW1zLCB7XG4gICAgICByZXNpemFibGU6IHBhcmFtcy5hdXRvUGxhY2UsXG4gICAgICBoaWRlYWJsZTogcGFyYW1zLmF1dG9QbGFjZVxuICAgIH0pO1xuXG5cbiAgICBpZiAoIWNvbW1vbi5pc1VuZGVmaW5lZChwYXJhbXMubG9hZCkpIHtcblxuICAgICAgLy8gRXhwbGljaXQgcHJlc2V0XG4gICAgICBpZiAocGFyYW1zLnByZXNldCkgcGFyYW1zLmxvYWQucHJlc2V0ID0gcGFyYW1zLnByZXNldDtcblxuICAgIH0gZWxzZSB7XG5cbiAgICAgIHBhcmFtcy5sb2FkID0ge1xuICAgICAgICBwcmVzZXQ6IERFRkFVTFRfREVGQVVMVF9QUkVTRVRfTkFNRVxuICAgICAgfTtcblxuICAgIH1cblxuICAgIGlmIChjb21tb24uaXNVbmRlZmluZWQocGFyYW1zLnBhcmVudCkgJiYgcGFyYW1zLmhpZGVhYmxlKSB7XG4gICAgICBoaWRlYWJsZV9ndWlzLnB1c2godGhpcyk7XG4gICAgfVxuXG4gICAgLy8gT25seSByb290IGxldmVsIEdVSSdzIGFyZSByZXNpemFibGUuXG4gICAgcGFyYW1zLnJlc2l6YWJsZSA9IGNvbW1vbi5pc1VuZGVmaW5lZChwYXJhbXMucGFyZW50KSAmJiBwYXJhbXMucmVzaXphYmxlO1xuXG5cbiAgICBpZiAocGFyYW1zLmF1dG9QbGFjZSAmJiBjb21tb24uaXNVbmRlZmluZWQocGFyYW1zLnNjcm9sbGFibGUpKSB7XG4gICAgICBwYXJhbXMuc2Nyb2xsYWJsZSA9IHRydWU7XG4gICAgfVxuICAgIC8vICAgIHBhcmFtcy5zY3JvbGxhYmxlID0gY29tbW9uLmlzVW5kZWZpbmVkKHBhcmFtcy5wYXJlbnQpICYmIHBhcmFtcy5zY3JvbGxhYmxlID09PSB0cnVlO1xuXG4gICAgLy8gTm90IHBhcnQgb2YgcGFyYW1zIGJlY2F1c2UgSSBkb24ndCB3YW50IHBlb3BsZSBwYXNzaW5nIHRoaXMgaW4gdmlhXG4gICAgLy8gY29uc3RydWN0b3IuIFNob3VsZCBiZSBhICdyZW1lbWJlcmVkJyB2YWx1ZS5cbiAgICB2YXIgdXNlX2xvY2FsX3N0b3JhZ2UgPVxuICAgICAgU1VQUE9SVFNfTE9DQUxfU1RPUkFHRSAmJlxuICAgICAgbG9jYWxTdG9yYWdlLmdldEl0ZW0oZ2V0TG9jYWxTdG9yYWdlSGFzaCh0aGlzLCAnaXNMb2NhbCcpKSA9PT0gJ3RydWUnO1xuXG4gICAgdmFyIHNhdmVUb0xvY2FsU3RvcmFnZTtcblxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKHRoaXMsXG5cbiAgICAgIC8qKiBAbGVuZHMgZGF0Lmd1aS5HVUkucHJvdG90eXBlICovXG4gICAgICB7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBwYXJlbnQgPGNvZGU+R1VJPC9jb2RlPlxuICAgICAgICAgKiBAdHlwZSBkYXQuZ3VpLkdVSVxuICAgICAgICAgKi9cbiAgICAgICAgcGFyZW50OiB7XG4gICAgICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiBwYXJhbXMucGFyZW50O1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBzY3JvbGxhYmxlOiB7XG4gICAgICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiBwYXJhbXMuc2Nyb2xsYWJsZTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEhhbmRsZXMgPGNvZGU+R1VJPC9jb2RlPidzIGVsZW1lbnQgcGxhY2VtZW50IGZvciB5b3VcbiAgICAgICAgICogQHR5cGUgQm9vbGVhblxuICAgICAgICAgKi9cbiAgICAgICAgYXV0b1BsYWNlOiB7XG4gICAgICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiBwYXJhbXMuYXV0b1BsYWNlO1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIGlkZW50aWZpZXIgZm9yIGEgc2V0IG9mIHNhdmVkIHZhbHVlc1xuICAgICAgICAgKiBAdHlwZSBTdHJpbmdcbiAgICAgICAgICovXG4gICAgICAgIHByZXNldDoge1xuXG4gICAgICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmIChfdGhpcy5wYXJlbnQpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIF90aGlzLmdldFJvb3QoKS5wcmVzZXQ7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICByZXR1cm4gcGFyYW1zLmxvYWQucHJlc2V0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sXG5cbiAgICAgICAgICBzZXQ6IGZ1bmN0aW9uKHYpIHtcbiAgICAgICAgICAgIGlmIChfdGhpcy5wYXJlbnQpIHtcbiAgICAgICAgICAgICAgX3RoaXMuZ2V0Um9vdCgpLnByZXNldCA9IHY7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBwYXJhbXMubG9hZC5wcmVzZXQgPSB2O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc2V0UHJlc2V0U2VsZWN0SW5kZXgodGhpcyk7XG4gICAgICAgICAgICBfdGhpcy5yZXZlcnQoKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIHdpZHRoIG9mIDxjb2RlPkdVSTwvY29kZT4gZWxlbWVudFxuICAgICAgICAgKiBAdHlwZSBOdW1iZXJcbiAgICAgICAgICovXG4gICAgICAgIHdpZHRoOiB7XG4gICAgICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiBwYXJhbXMud2lkdGg7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBzZXQ6IGZ1bmN0aW9uKHYpIHtcbiAgICAgICAgICAgIHBhcmFtcy53aWR0aCA9IHY7XG4gICAgICAgICAgICBzZXRXaWR0aChfdGhpcywgdik7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgbmFtZSBvZiA8Y29kZT5HVUk8L2NvZGU+LiBVc2VkIGZvciBmb2xkZXJzLiBpLmVcbiAgICAgICAgICogYSBmb2xkZXIncyBuYW1lXG4gICAgICAgICAqIEB0eXBlIFN0cmluZ1xuICAgICAgICAgKi9cbiAgICAgICAgbmFtZToge1xuICAgICAgICAgIGdldDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gcGFyYW1zLm5hbWU7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBzZXQ6IGZ1bmN0aW9uKHYpIHtcbiAgICAgICAgICAgIC8vIFRPRE8gQ2hlY2sgZm9yIGNvbGxpc2lvbnMgYW1vbmcgc2libGluZyBmb2xkZXJzXG4gICAgICAgICAgICBwYXJhbXMubmFtZSA9IHY7XG4gICAgICAgICAgICBpZiAodGl0bGVfcm93X25hbWUpIHtcbiAgICAgICAgICAgICAgdGl0bGVfcm93X25hbWUuaW5uZXJIVE1MID0gcGFyYW1zLm5hbWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBXaGV0aGVyIHRoZSA8Y29kZT5HVUk8L2NvZGU+IGlzIGNvbGxhcHNlZCBvciBub3RcbiAgICAgICAgICogQHR5cGUgQm9vbGVhblxuICAgICAgICAgKi9cbiAgICAgICAgY2xvc2VkOiB7XG4gICAgICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiBwYXJhbXMuY2xvc2VkO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgc2V0OiBmdW5jdGlvbih2KSB7XG4gICAgICAgICAgICBwYXJhbXMuY2xvc2VkID0gdjtcbiAgICAgICAgICAgIGlmIChwYXJhbXMuY2xvc2VkKSB7XG4gICAgICAgICAgICAgIGRvbS5hZGRDbGFzcyhfdGhpcy5fX3VsLCBHVUkuQ0xBU1NfQ0xPU0VEKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGRvbS5yZW1vdmVDbGFzcyhfdGhpcy5fX3VsLCBHVUkuQ0xBU1NfQ0xPU0VEKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIEZvciBicm93c2VycyB0aGF0IGFyZW4ndCBnb2luZyB0byByZXNwZWN0IHRoZSBDU1MgdHJhbnNpdGlvbixcbiAgICAgICAgICAgIC8vIExldHMganVzdCBjaGVjayBvdXIgaGVpZ2h0IGFnYWluc3QgdGhlIHdpbmRvdyBoZWlnaHQgcmlnaHQgb2ZmXG4gICAgICAgICAgICAvLyB0aGUgYmF0LlxuICAgICAgICAgICAgdGhpcy5vblJlc2l6ZSgpO1xuXG4gICAgICAgICAgICBpZiAoX3RoaXMuX19jbG9zZUJ1dHRvbikge1xuICAgICAgICAgICAgICBfdGhpcy5fX2Nsb3NlQnV0dG9uLmlubmVySFRNTCA9IHYgPyBHVUkuVEVYVF9PUEVOIDogR1VJLlRFWFRfQ0xPU0VEO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQ29udGFpbnMgYWxsIHByZXNldHNcbiAgICAgICAgICogQHR5cGUgT2JqZWN0XG4gICAgICAgICAqL1xuICAgICAgICBsb2FkOiB7XG4gICAgICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiBwYXJhbXMubG9hZDtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIERldGVybWluZXMgd2hldGhlciBvciBub3QgdG8gdXNlIDxhIGhyZWY9XCJodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi9ET00vU3RvcmFnZSNsb2NhbFN0b3JhZ2VcIj5sb2NhbFN0b3JhZ2U8L2E+IGFzIHRoZSBtZWFucyBmb3JcbiAgICAgICAgICogPGNvZGU+cmVtZW1iZXI8L2NvZGU+aW5nXG4gICAgICAgICAqIEB0eXBlIEJvb2xlYW5cbiAgICAgICAgICovXG4gICAgICAgIHVzZUxvY2FsU3RvcmFnZToge1xuXG4gICAgICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiB1c2VfbG9jYWxfc3RvcmFnZTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIHNldDogZnVuY3Rpb24oYm9vbCkge1xuICAgICAgICAgICAgaWYgKFNVUFBPUlRTX0xPQ0FMX1NUT1JBR0UpIHtcbiAgICAgICAgICAgICAgdXNlX2xvY2FsX3N0b3JhZ2UgPSBib29sO1xuICAgICAgICAgICAgICBpZiAoYm9vbCkge1xuICAgICAgICAgICAgICAgIGRvbS5iaW5kKHdpbmRvdywgJ3VubG9hZCcsIHNhdmVUb0xvY2FsU3RvcmFnZSk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZG9tLnVuYmluZCh3aW5kb3csICd1bmxvYWQnLCBzYXZlVG9Mb2NhbFN0b3JhZ2UpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKGdldExvY2FsU3RvcmFnZUhhc2goX3RoaXMsICdpc0xvY2FsJyksIGJvb2wpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICB9XG5cbiAgICAgIH0pO1xuXG4gICAgLy8gQXJlIHdlIGEgcm9vdCBsZXZlbCBHVUk/XG4gICAgaWYgKGNvbW1vbi5pc1VuZGVmaW5lZChwYXJhbXMucGFyZW50KSkge1xuXG4gICAgICBwYXJhbXMuY2xvc2VkID0gZmFsc2U7XG5cbiAgICAgIGRvbS5hZGRDbGFzcyh0aGlzLmRvbUVsZW1lbnQsIEdVSS5DTEFTU19NQUlOKTtcbiAgICAgIGRvbS5tYWtlU2VsZWN0YWJsZSh0aGlzLmRvbUVsZW1lbnQsIGZhbHNlKTtcblxuICAgICAgLy8gQXJlIHdlIHN1cHBvc2VkIHRvIGJlIGxvYWRpbmcgbG9jYWxseT9cbiAgICAgIGlmIChTVVBQT1JUU19MT0NBTF9TVE9SQUdFKSB7XG5cbiAgICAgICAgaWYgKHVzZV9sb2NhbF9zdG9yYWdlKSB7XG5cbiAgICAgICAgICBfdGhpcy51c2VMb2NhbFN0b3JhZ2UgPSB0cnVlO1xuXG4gICAgICAgICAgdmFyIHNhdmVkX2d1aSA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKGdldExvY2FsU3RvcmFnZUhhc2godGhpcywgJ2d1aScpKTtcblxuICAgICAgICAgIGlmIChzYXZlZF9ndWkpIHtcbiAgICAgICAgICAgIHBhcmFtcy5sb2FkID0gSlNPTi5wYXJzZShzYXZlZF9ndWkpO1xuICAgICAgICAgIH1cblxuICAgICAgICB9XG5cbiAgICAgIH1cblxuICAgICAgdGhpcy5fX2Nsb3NlQnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICB0aGlzLl9fY2xvc2VCdXR0b24uaW5uZXJIVE1MID0gR1VJLlRFWFRfQ0xPU0VEO1xuICAgICAgZG9tLmFkZENsYXNzKHRoaXMuX19jbG9zZUJ1dHRvbiwgR1VJLkNMQVNTX0NMT1NFX0JVVFRPTik7XG4gICAgICB0aGlzLmRvbUVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5fX2Nsb3NlQnV0dG9uKTtcblxuICAgICAgZG9tLmJpbmQodGhpcy5fX2Nsb3NlQnV0dG9uLCAnY2xpY2snLCBmdW5jdGlvbigpIHtcblxuICAgICAgICBfdGhpcy5jbG9zZWQgPSAhX3RoaXMuY2xvc2VkO1xuXG5cbiAgICAgIH0pO1xuXG5cbiAgICAgIC8vIE9oLCB5b3UncmUgYSBuZXN0ZWQgR1VJIVxuICAgIH0gZWxzZSB7XG5cbiAgICAgIGlmIChwYXJhbXMuY2xvc2VkID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcGFyYW1zLmNsb3NlZCA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIHZhciB0aXRsZV9yb3dfbmFtZSA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHBhcmFtcy5uYW1lKTtcbiAgICAgIGRvbS5hZGRDbGFzcyh0aXRsZV9yb3dfbmFtZSwgJ2NvbnRyb2xsZXItbmFtZScpO1xuXG4gICAgICB2YXIgdGl0bGVfcm93ID0gYWRkUm93KF90aGlzLCB0aXRsZV9yb3dfbmFtZSk7XG5cbiAgICAgIHZhciBvbl9jbGlja190aXRsZSA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBfdGhpcy5jbG9zZWQgPSAhX3RoaXMuY2xvc2VkO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9O1xuXG4gICAgICBkb20uYWRkQ2xhc3ModGhpcy5fX3VsLCBHVUkuQ0xBU1NfQ0xPU0VEKTtcblxuICAgICAgZG9tLmFkZENsYXNzKHRpdGxlX3JvdywgJ3RpdGxlJyk7XG4gICAgICBkb20uYmluZCh0aXRsZV9yb3csICdjbGljaycsIG9uX2NsaWNrX3RpdGxlKTtcblxuICAgICAgaWYgKCFwYXJhbXMuY2xvc2VkKSB7XG4gICAgICAgIHRoaXMuY2xvc2VkID0gZmFsc2U7XG4gICAgICB9XG5cbiAgICB9XG5cbiAgICBpZiAocGFyYW1zLmF1dG9QbGFjZSkge1xuXG4gICAgICBpZiAoY29tbW9uLmlzVW5kZWZpbmVkKHBhcmFtcy5wYXJlbnQpKSB7XG5cbiAgICAgICAgaWYgKGF1dG9fcGxhY2VfdmlyZ2luKSB7XG4gICAgICAgICAgYXV0b19wbGFjZV9jb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgICBkb20uYWRkQ2xhc3MoYXV0b19wbGFjZV9jb250YWluZXIsIENTU19OQU1FU1BBQ0UpO1xuICAgICAgICAgIGRvbS5hZGRDbGFzcyhhdXRvX3BsYWNlX2NvbnRhaW5lciwgR1VJLkNMQVNTX0FVVE9fUExBQ0VfQ09OVEFJTkVSKTtcbiAgICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGF1dG9fcGxhY2VfY29udGFpbmVyKTtcbiAgICAgICAgICBhdXRvX3BsYWNlX3ZpcmdpbiA9IGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUHV0IGl0IGluIHRoZSBkb20gZm9yIHlvdS5cbiAgICAgICAgYXV0b19wbGFjZV9jb250YWluZXIuYXBwZW5kQ2hpbGQodGhpcy5kb21FbGVtZW50KTtcblxuICAgICAgICAvLyBBcHBseSB0aGUgYXV0byBzdHlsZXNcbiAgICAgICAgZG9tLmFkZENsYXNzKHRoaXMuZG9tRWxlbWVudCwgR1VJLkNMQVNTX0FVVE9fUExBQ0UpO1xuXG4gICAgICB9XG5cblxuICAgICAgLy8gTWFrZSBpdCBub3QgZWxhc3RpYy5cbiAgICAgIGlmICghdGhpcy5wYXJlbnQpIHNldFdpZHRoKF90aGlzLCBwYXJhbXMud2lkdGgpO1xuXG4gICAgfVxuXG4gICAgZG9tLmJpbmQod2luZG93LCAncmVzaXplJywgZnVuY3Rpb24oKSB7XG4gICAgICBfdGhpcy5vblJlc2l6ZSgpXG4gICAgfSk7XG4gICAgZG9tLmJpbmQodGhpcy5fX3VsLCAnd2Via2l0VHJhbnNpdGlvbkVuZCcsIGZ1bmN0aW9uKCkge1xuICAgICAgX3RoaXMub25SZXNpemUoKTtcbiAgICB9KTtcbiAgICBkb20uYmluZCh0aGlzLl9fdWwsICd0cmFuc2l0aW9uZW5kJywgZnVuY3Rpb24oKSB7XG4gICAgICBfdGhpcy5vblJlc2l6ZSgpXG4gICAgfSk7XG4gICAgZG9tLmJpbmQodGhpcy5fX3VsLCAnb1RyYW5zaXRpb25FbmQnLCBmdW5jdGlvbigpIHtcbiAgICAgIF90aGlzLm9uUmVzaXplKClcbiAgICB9KTtcbiAgICB0aGlzLm9uUmVzaXplKCk7XG5cblxuICAgIGlmIChwYXJhbXMucmVzaXphYmxlKSB7XG4gICAgICBhZGRSZXNpemVIYW5kbGUodGhpcyk7XG4gICAgfVxuXG4gICAgc2F2ZVRvTG9jYWxTdG9yYWdlID0gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoU1VQUE9SVFNfTE9DQUxfU1RPUkFHRSAmJiBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShnZXRMb2NhbFN0b3JhZ2VIYXNoKF90aGlzLCAnaXNMb2NhbCcpKSA9PT0gJ3RydWUnKSB7XG4gICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKGdldExvY2FsU3RvcmFnZUhhc2goX3RoaXMsICdndWknKSwgSlNPTi5zdHJpbmdpZnkoX3RoaXMuZ2V0U2F2ZU9iamVjdCgpKSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gZXhwb3NlIHRoaXMgbWV0aG9kIHB1YmxpY2x5XG4gICAgdGhpcy5zYXZlVG9Mb2NhbFN0b3JhZ2VJZlBvc3NpYmxlID0gc2F2ZVRvTG9jYWxTdG9yYWdlO1xuXG4gICAgdmFyIHJvb3QgPSBfdGhpcy5nZXRSb290KCk7XG5cbiAgICBmdW5jdGlvbiByZXNldFdpZHRoKCkge1xuICAgICAgdmFyIHJvb3QgPSBfdGhpcy5nZXRSb290KCk7XG4gICAgICByb290LndpZHRoICs9IDE7XG4gICAgICBjb21tb24uZGVmZXIoZnVuY3Rpb24oKSB7XG4gICAgICAgIHJvb3Qud2lkdGggLT0gMTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmICghcGFyYW1zLnBhcmVudCkge1xuICAgICAgcmVzZXRXaWR0aCgpO1xuICAgIH1cblxuICB9O1xuXG4gIEdVSS50b2dnbGVIaWRlID0gZnVuY3Rpb24oKSB7XG5cbiAgICBoaWRlID0gIWhpZGU7XG4gICAgY29tbW9uLmVhY2goaGlkZWFibGVfZ3VpcywgZnVuY3Rpb24oZ3VpKSB7XG4gICAgICBndWkuZG9tRWxlbWVudC5zdHlsZS56SW5kZXggPSBoaWRlID8gLTk5OSA6IDk5OTtcbiAgICAgIGd1aS5kb21FbGVtZW50LnN0eWxlLm9wYWNpdHkgPSBoaWRlID8gMCA6IDE7XG4gICAgfSk7XG4gIH07XG5cbiAgR1VJLkNMQVNTX0FVVE9fUExBQ0UgPSAnYSc7XG4gIEdVSS5DTEFTU19BVVRPX1BMQUNFX0NPTlRBSU5FUiA9ICdhYyc7XG4gIEdVSS5DTEFTU19NQUlOID0gJ21haW4nO1xuICBHVUkuQ0xBU1NfQ09OVFJPTExFUl9ST1cgPSAnY3InO1xuICBHVUkuQ0xBU1NfVE9PX1RBTEwgPSAndGFsbGVyLXRoYW4td2luZG93JztcbiAgR1VJLkNMQVNTX0NMT1NFRCA9ICdjbG9zZWQnO1xuICBHVUkuQ0xBU1NfQ0xPU0VfQlVUVE9OID0gJ2Nsb3NlLWJ1dHRvbic7XG4gIEdVSS5DTEFTU19EUkFHID0gJ2RyYWcnO1xuXG4gIEdVSS5ERUZBVUxUX1dJRFRIID0gMjQ1O1xuICBHVUkuVEVYVF9DTE9TRUQgPSAnQ2xvc2UgQ29udHJvbHMnO1xuICBHVUkuVEVYVF9PUEVOID0gJ09wZW4gQ29udHJvbHMnO1xuXG4gIGRvbS5iaW5kKHdpbmRvdywgJ2tleWRvd24nLCBmdW5jdGlvbihlKSB7XG5cbiAgICBpZiAoZG9jdW1lbnQuYWN0aXZlRWxlbWVudC50eXBlICE9PSAndGV4dCcgJiZcbiAgICAgIChlLndoaWNoID09PSBISURFX0tFWV9DT0RFIHx8IGUua2V5Q29kZSA9PSBISURFX0tFWV9DT0RFKSkge1xuICAgICAgR1VJLnRvZ2dsZUhpZGUoKTtcbiAgICB9XG5cbiAgfSwgZmFsc2UpO1xuXG4gIGNvbW1vbi5leHRlbmQoXG5cbiAgICBHVUkucHJvdG90eXBlLFxuXG4gICAgLyoqIEBsZW5kcyBkYXQuZ3VpLkdVSSAqL1xuICAgIHtcblxuICAgICAgLyoqXG4gICAgICAgKiBAcGFyYW0gb2JqZWN0XG4gICAgICAgKiBAcGFyYW0gcHJvcGVydHlcbiAgICAgICAqIEByZXR1cm5zIHtkYXQuY29udHJvbGxlcnMuQ29udHJvbGxlcn0gVGhlIG5ldyBjb250cm9sbGVyIHRoYXQgd2FzIGFkZGVkLlxuICAgICAgICogQGluc3RhbmNlXG4gICAgICAgKi9cbiAgICAgIGFkZDogZnVuY3Rpb24ob2JqZWN0LCBwcm9wZXJ0eSkge1xuXG4gICAgICAgIHJldHVybiBhZGQoXG4gICAgICAgICAgdGhpcyxcbiAgICAgICAgICBvYmplY3QsXG4gICAgICAgICAgcHJvcGVydHksIHtcbiAgICAgICAgICAgIGZhY3RvcnlBcmdzOiBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDIpXG4gICAgICAgICAgfVxuICAgICAgICApO1xuXG4gICAgICB9LFxuXG4gICAgICAvKipcbiAgICAgICAqIEBwYXJhbSBvYmplY3RcbiAgICAgICAqIEBwYXJhbSBwcm9wZXJ0eVxuICAgICAgICogQHJldHVybnMge2RhdC5jb250cm9sbGVycy5Db2xvckNvbnRyb2xsZXJ9IFRoZSBuZXcgY29udHJvbGxlciB0aGF0IHdhcyBhZGRlZC5cbiAgICAgICAqIEBpbnN0YW5jZVxuICAgICAgICovXG4gICAgICBhZGRDb2xvcjogZnVuY3Rpb24ob2JqZWN0LCBwcm9wZXJ0eSkge1xuXG4gICAgICAgIHJldHVybiBhZGQoXG4gICAgICAgICAgdGhpcyxcbiAgICAgICAgICBvYmplY3QsXG4gICAgICAgICAgcHJvcGVydHksIHtcbiAgICAgICAgICAgIGNvbG9yOiB0cnVlXG4gICAgICAgICAgfVxuICAgICAgICApO1xuXG4gICAgICB9LFxuXG4gICAgICAvKipcbiAgICAgICAqIEBwYXJhbSBjb250cm9sbGVyXG4gICAgICAgKiBAaW5zdGFuY2VcbiAgICAgICAqL1xuICAgICAgcmVtb3ZlOiBmdW5jdGlvbihjb250cm9sbGVyKSB7XG5cbiAgICAgICAgLy8gVE9ETyBsaXN0ZW5pbmc/XG4gICAgICAgIHRoaXMuX191bC5yZW1vdmVDaGlsZChjb250cm9sbGVyLl9fbGkpO1xuICAgICAgICB0aGlzLl9fY29udHJvbGxlcnMuc3BsaWNlKHRoaXMuX19jb250cm9sbGVycy5pbmRleE9mKGNvbnRyb2xsZXIpLCAxKTtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgY29tbW9uLmRlZmVyKGZ1bmN0aW9uKCkge1xuICAgICAgICAgIF90aGlzLm9uUmVzaXplKCk7XG4gICAgICAgIH0pO1xuXG4gICAgICB9LFxuXG4gICAgICBkZXN0cm95OiBmdW5jdGlvbigpIHtcblxuICAgICAgICBpZiAodGhpcy5hdXRvUGxhY2UpIHtcbiAgICAgICAgICBhdXRvX3BsYWNlX2NvbnRhaW5lci5yZW1vdmVDaGlsZCh0aGlzLmRvbUVsZW1lbnQpO1xuICAgICAgICB9XG5cbiAgICAgIH0sXG5cbiAgICAgIC8qKlxuICAgICAgICogQHBhcmFtIG5hbWVcbiAgICAgICAqIEByZXR1cm5zIHtkYXQuZ3VpLkdVSX0gVGhlIG5ldyBmb2xkZXIuXG4gICAgICAgKiBAdGhyb3dzIHtFcnJvcn0gaWYgdGhpcyBHVUkgYWxyZWFkeSBoYXMgYSBmb2xkZXIgYnkgdGhlIHNwZWNpZmllZFxuICAgICAgICogbmFtZVxuICAgICAgICogQGluc3RhbmNlXG4gICAgICAgKi9cbiAgICAgIGFkZEZvbGRlcjogZnVuY3Rpb24obmFtZSkge1xuXG4gICAgICAgIC8vIFdlIGhhdmUgdG8gcHJldmVudCBjb2xsaXNpb25zIG9uIG5hbWVzIGluIG9yZGVyIHRvIGhhdmUgYSBrZXlcbiAgICAgICAgLy8gYnkgd2hpY2ggdG8gcmVtZW1iZXIgc2F2ZWQgdmFsdWVzXG4gICAgICAgIGlmICh0aGlzLl9fZm9sZGVyc1tuYW1lXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdZb3UgYWxyZWFkeSBoYXZlIGEgZm9sZGVyIGluIHRoaXMgR1VJIGJ5IHRoZScgK1xuICAgICAgICAgICAgJyBuYW1lIFwiJyArIG5hbWUgKyAnXCInKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBuZXdfZ3VpX3BhcmFtcyA9IHtcbiAgICAgICAgICBuYW1lOiBuYW1lLFxuICAgICAgICAgIHBhcmVudDogdGhpc1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIFdlIG5lZWQgdG8gcGFzcyBkb3duIHRoZSBhdXRvUGxhY2UgdHJhaXQgc28gdGhhdCB3ZSBjYW5cbiAgICAgICAgLy8gYXR0YWNoIGV2ZW50IGxpc3RlbmVycyB0byBvcGVuL2Nsb3NlIGZvbGRlciBhY3Rpb25zIHRvXG4gICAgICAgIC8vIGVuc3VyZSB0aGF0IGEgc2Nyb2xsYmFyIGFwcGVhcnMgaWYgdGhlIHdpbmRvdyBpcyB0b28gc2hvcnQuXG4gICAgICAgIG5ld19ndWlfcGFyYW1zLmF1dG9QbGFjZSA9IHRoaXMuYXV0b1BsYWNlO1xuXG4gICAgICAgIC8vIERvIHdlIGhhdmUgc2F2ZWQgYXBwZWFyYW5jZSBkYXRhIGZvciB0aGlzIGZvbGRlcj9cblxuICAgICAgICBpZiAodGhpcy5sb2FkICYmIC8vIEFueXRoaW5nIGxvYWRlZD9cbiAgICAgICAgICB0aGlzLmxvYWQuZm9sZGVycyAmJiAvLyBXYXMgbXkgcGFyZW50IGEgZGVhZC1lbmQ/XG4gICAgICAgICAgdGhpcy5sb2FkLmZvbGRlcnNbbmFtZV0pIHsgLy8gRGlkIGRhZGR5IHJlbWVtYmVyIG1lP1xuXG4gICAgICAgICAgLy8gU3RhcnQgbWUgY2xvc2VkIGlmIEkgd2FzIGNsb3NlZFxuICAgICAgICAgIG5ld19ndWlfcGFyYW1zLmNsb3NlZCA9IHRoaXMubG9hZC5mb2xkZXJzW25hbWVdLmNsb3NlZDtcblxuICAgICAgICAgIC8vIFBhc3MgZG93biB0aGUgbG9hZGVkIGRhdGFcbiAgICAgICAgICBuZXdfZ3VpX3BhcmFtcy5sb2FkID0gdGhpcy5sb2FkLmZvbGRlcnNbbmFtZV07XG5cbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBndWkgPSBuZXcgR1VJKG5ld19ndWlfcGFyYW1zKTtcbiAgICAgICAgdGhpcy5fX2ZvbGRlcnNbbmFtZV0gPSBndWk7XG5cbiAgICAgICAgdmFyIGxpID0gYWRkUm93KHRoaXMsIGd1aS5kb21FbGVtZW50KTtcbiAgICAgICAgZG9tLmFkZENsYXNzKGxpLCAnZm9sZGVyJyk7XG4gICAgICAgIHJldHVybiBndWk7XG5cbiAgICAgIH0sXG5cbiAgICAgIHJlbW92ZUZvbGRlcjogZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgdmFyIGZvbGRlciA9IHRoaXMuX19mb2xkZXJzW25hbWVdO1xuICAgICAgICBpZiAoIWZvbGRlcikge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBkZWxldGUgdGhpcy5fX2ZvbGRlcnNbbmFtZV07XG5cbiAgICAgICAgdmFyIGNoaWxkQ29udHJvbGxlcnMgPSBmb2xkZXIuX19jb250cm9sbGVycztcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaGlsZENvbnRyb2xsZXJzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgY2hpbGRDb250cm9sbGVyc1tpXS5yZW1vdmUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBjaGlsZEZvbGRlcnMgPSBPYmplY3Qua2V5cyhmb2xkZXIuX19mb2xkZXJzIHx8IHt9KTtcbiAgICAgICAgZm9yIChpICA9IDA7IGkgPCBjaGlsZEZvbGRlcnMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICB2YXIgY2hpbGROYW1lID0gY2hpbGRGb2xkZXJzW2ldO1xuICAgICAgICAgIGZvbGRlci5yZW1vdmVGb2xkZXIoY2hpbGROYW1lKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgbGlDb250YWluZXIgPSBmb2xkZXIuZG9tRWxlbWVudC5wYXJlbnROb2RlO1xuICAgICAgICBsaUNvbnRhaW5lci5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGxpQ29udGFpbmVyKTtcbiAgICAgIH0sXG5cbiAgICAgIG9wZW46IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLmNsb3NlZCA9IGZhbHNlO1xuICAgICAgfSxcblxuICAgICAgdXBkYXRlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHVwZGF0ZUFsbCh0aGlzKTtcbiAgICAgIH0sXG5cbiAgICAgIGNsb3NlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5jbG9zZWQgPSB0cnVlO1xuICAgICAgfSxcblxuICAgICAgb25SZXNpemU6IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIHZhciByb290ID0gdGhpcy5nZXRSb290KCk7XG5cbiAgICAgICAgaWYgKHJvb3Quc2Nyb2xsYWJsZSkge1xuXG4gICAgICAgICAgdmFyIHRvcCA9IGRvbS5nZXRPZmZzZXQocm9vdC5fX3VsKS50b3A7XG4gICAgICAgICAgdmFyIGggPSAwO1xuXG4gICAgICAgICAgY29tbW9uLmVhY2gocm9vdC5fX3VsLmNoaWxkTm9kZXMsIGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgICAgIGlmICghKHJvb3QuYXV0b1BsYWNlICYmIG5vZGUgPT09IHJvb3QuX19zYXZlX3JvdykpXG4gICAgICAgICAgICAgIGggKz0gZG9tLmdldEhlaWdodChub2RlKTtcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIGlmICh3aW5kb3cuaW5uZXJIZWlnaHQgLSB0b3AgLSBDTE9TRV9CVVRUT05fSEVJR0hUIDwgaCkge1xuICAgICAgICAgICAgZG9tLmFkZENsYXNzKHJvb3QuZG9tRWxlbWVudCwgR1VJLkNMQVNTX1RPT19UQUxMKTtcbiAgICAgICAgICAgIHJvb3QuX191bC5zdHlsZS5oZWlnaHQgPSB3aW5kb3cuaW5uZXJIZWlnaHQgLSB0b3AgLSBDTE9TRV9CVVRUT05fSEVJR0hUICsgJ3B4JztcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZG9tLnJlbW92ZUNsYXNzKHJvb3QuZG9tRWxlbWVudCwgR1VJLkNMQVNTX1RPT19UQUxMKTtcbiAgICAgICAgICAgIHJvb3QuX191bC5zdHlsZS5oZWlnaHQgPSAnYXV0byc7XG4gICAgICAgICAgfVxuXG4gICAgICAgIH1cblxuICAgICAgICBpZiAocm9vdC5fX3Jlc2l6ZV9oYW5kbGUpIHtcbiAgICAgICAgICBjb21tb24uZGVmZXIoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByb290Ll9fcmVzaXplX2hhbmRsZS5zdHlsZS5oZWlnaHQgPSByb290Ll9fdWwub2Zmc2V0SGVpZ2h0ICsgJ3B4JztcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChyb290Ll9fY2xvc2VCdXR0b24pIHtcbiAgICAgICAgICByb290Ll9fY2xvc2VCdXR0b24uc3R5bGUud2lkdGggPSByb290LndpZHRoICsgJ3B4JztcbiAgICAgICAgfVxuXG4gICAgICB9LFxuXG4gICAgICAvKipcbiAgICAgICAqIE1hcmsgb2JqZWN0cyBmb3Igc2F2aW5nLiBUaGUgb3JkZXIgb2YgdGhlc2Ugb2JqZWN0cyBjYW5ub3QgY2hhbmdlIGFzXG4gICAgICAgKiB0aGUgR1VJIGdyb3dzLiBXaGVuIHJlbWVtYmVyaW5nIG5ldyBvYmplY3RzLCBhcHBlbmQgdGhlbSB0byB0aGUgZW5kXG4gICAgICAgKiBvZiB0aGUgbGlzdC5cbiAgICAgICAqXG4gICAgICAgKiBAcGFyYW0ge09iamVjdC4uLn0gb2JqZWN0c1xuICAgICAgICogQHRocm93cyB7RXJyb3J9IGlmIG5vdCBjYWxsZWQgb24gYSB0b3AgbGV2ZWwgR1VJLlxuICAgICAgICogQGluc3RhbmNlXG4gICAgICAgKi9cbiAgICAgIHJlbWVtYmVyOiBmdW5jdGlvbigpIHtcblxuICAgICAgICBpZiAoY29tbW9uLmlzVW5kZWZpbmVkKFNBVkVfRElBTE9HVUUpKSB7XG4gICAgICAgICAgU0FWRV9ESUFMT0dVRSA9IG5ldyBDZW50ZXJlZERpdigpO1xuICAgICAgICAgIFNBVkVfRElBTE9HVUUuZG9tRWxlbWVudC5pbm5lckhUTUwgPSBzYXZlRGlhbG9ndWVDb250ZW50cztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLnBhcmVudCkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIllvdSBjYW4gb25seSBjYWxsIHJlbWVtYmVyIG9uIGEgdG9wIGxldmVsIEdVSS5cIik7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgICAgIGNvbW1vbi5lYWNoKEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyksIGZ1bmN0aW9uKG9iamVjdCkge1xuICAgICAgICAgIGlmIChfdGhpcy5fX3JlbWVtYmVyZWRPYmplY3RzLmxlbmd0aCA9PSAwKSB7XG4gICAgICAgICAgICBhZGRTYXZlTWVudShfdGhpcyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChfdGhpcy5fX3JlbWVtYmVyZWRPYmplY3RzLmluZGV4T2Yob2JqZWN0KSA9PSAtMSkge1xuICAgICAgICAgICAgX3RoaXMuX19yZW1lbWJlcmVkT2JqZWN0cy5wdXNoKG9iamVjdCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAodGhpcy5hdXRvUGxhY2UpIHtcbiAgICAgICAgICAvLyBTZXQgc2F2ZSByb3cgd2lkdGhcbiAgICAgICAgICBzZXRXaWR0aCh0aGlzLCB0aGlzLndpZHRoKTtcbiAgICAgICAgfVxuXG4gICAgICB9LFxuXG4gICAgICAvKipcbiAgICAgICAqIEByZXR1cm5zIHtkYXQuZ3VpLkdVSX0gdGhlIHRvcG1vc3QgcGFyZW50IEdVSSBvZiBhIG5lc3RlZCBHVUkuXG4gICAgICAgKiBAaW5zdGFuY2VcbiAgICAgICAqL1xuICAgICAgZ2V0Um9vdDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBndWkgPSB0aGlzO1xuICAgICAgICB3aGlsZSAoZ3VpLnBhcmVudCkge1xuICAgICAgICAgIGd1aSA9IGd1aS5wYXJlbnQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGd1aTtcbiAgICAgIH0sXG5cbiAgICAgIC8qKlxuICAgICAgICogQHJldHVybnMge09iamVjdH0gYSBKU09OIG9iamVjdCByZXByZXNlbnRpbmcgdGhlIGN1cnJlbnQgc3RhdGUgb2ZcbiAgICAgICAqIHRoaXMgR1VJIGFzIHdlbGwgYXMgaXRzIHJlbWVtYmVyZWQgcHJvcGVydGllcy5cbiAgICAgICAqIEBpbnN0YW5jZVxuICAgICAgICovXG4gICAgICBnZXRTYXZlT2JqZWN0OiBmdW5jdGlvbigpIHtcblxuICAgICAgICB2YXIgdG9SZXR1cm4gPSB0aGlzLmxvYWQ7XG5cbiAgICAgICAgdG9SZXR1cm4uY2xvc2VkID0gdGhpcy5jbG9zZWQ7XG5cbiAgICAgICAgLy8gQW0gSSByZW1lbWJlcmluZyBhbnkgdmFsdWVzP1xuICAgICAgICBpZiAodGhpcy5fX3JlbWVtYmVyZWRPYmplY3RzLmxlbmd0aCA+IDApIHtcblxuICAgICAgICAgIHRvUmV0dXJuLnByZXNldCA9IHRoaXMucHJlc2V0O1xuXG4gICAgICAgICAgaWYgKCF0b1JldHVybi5yZW1lbWJlcmVkKSB7XG4gICAgICAgICAgICB0b1JldHVybi5yZW1lbWJlcmVkID0ge307XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdG9SZXR1cm4ucmVtZW1iZXJlZFt0aGlzLnByZXNldF0gPSBnZXRDdXJyZW50UHJlc2V0KHRoaXMpO1xuXG4gICAgICAgIH1cblxuICAgICAgICB0b1JldHVybi5mb2xkZXJzID0ge307XG4gICAgICAgIGNvbW1vbi5lYWNoKHRoaXMuX19mb2xkZXJzLCBmdW5jdGlvbihlbGVtZW50LCBrZXkpIHtcbiAgICAgICAgICB0b1JldHVybi5mb2xkZXJzW2tleV0gPSBlbGVtZW50LmdldFNhdmVPYmplY3QoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHRvUmV0dXJuO1xuXG4gICAgICB9LFxuXG4gICAgICBzYXZlOiBmdW5jdGlvbigpIHtcblxuICAgICAgICBpZiAoIXRoaXMubG9hZC5yZW1lbWJlcmVkKSB7XG4gICAgICAgICAgdGhpcy5sb2FkLnJlbWVtYmVyZWQgPSB7fTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMubG9hZC5yZW1lbWJlcmVkW3RoaXMucHJlc2V0XSA9IGdldEN1cnJlbnRQcmVzZXQodGhpcyk7XG4gICAgICAgIG1hcmtQcmVzZXRNb2RpZmllZCh0aGlzLCBmYWxzZSk7XG4gICAgICAgIHRoaXMuc2F2ZVRvTG9jYWxTdG9yYWdlSWZQb3NzaWJsZSgpO1xuXG4gICAgICB9LFxuXG4gICAgICBzYXZlQXM6IGZ1bmN0aW9uKHByZXNldE5hbWUpIHtcblxuICAgICAgICBpZiAoIXRoaXMubG9hZC5yZW1lbWJlcmVkKSB7XG5cbiAgICAgICAgICAvLyBSZXRhaW4gZGVmYXVsdCB2YWx1ZXMgdXBvbiBmaXJzdCBzYXZlXG4gICAgICAgICAgdGhpcy5sb2FkLnJlbWVtYmVyZWQgPSB7fTtcbiAgICAgICAgICB0aGlzLmxvYWQucmVtZW1iZXJlZFtERUZBVUxUX0RFRkFVTFRfUFJFU0VUX05BTUVdID0gZ2V0Q3VycmVudFByZXNldCh0aGlzLCB0cnVlKTtcblxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5sb2FkLnJlbWVtYmVyZWRbcHJlc2V0TmFtZV0gPSBnZXRDdXJyZW50UHJlc2V0KHRoaXMpO1xuICAgICAgICB0aGlzLnByZXNldCA9IHByZXNldE5hbWU7XG4gICAgICAgIGFkZFByZXNldE9wdGlvbih0aGlzLCBwcmVzZXROYW1lLCB0cnVlKTtcbiAgICAgICAgdGhpcy5zYXZlVG9Mb2NhbFN0b3JhZ2VJZlBvc3NpYmxlKCk7XG5cbiAgICAgIH0sXG5cbiAgICAgIHJldmVydDogZnVuY3Rpb24oZ3VpKSB7XG5cbiAgICAgICAgY29tbW9uLmVhY2godGhpcy5fX2NvbnRyb2xsZXJzLCBmdW5jdGlvbihjb250cm9sbGVyKSB7XG4gICAgICAgICAgLy8gTWFrZSByZXZlcnQgd29yayBvbiBEZWZhdWx0LlxuICAgICAgICAgIGlmICghdGhpcy5nZXRSb290KCkubG9hZC5yZW1lbWJlcmVkKSB7XG4gICAgICAgICAgICBjb250cm9sbGVyLnNldFZhbHVlKGNvbnRyb2xsZXIuaW5pdGlhbFZhbHVlKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVjYWxsU2F2ZWRWYWx1ZShndWkgfHwgdGhpcy5nZXRSb290KCksIGNvbnRyb2xsZXIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSwgdGhpcyk7XG5cbiAgICAgICAgY29tbW9uLmVhY2godGhpcy5fX2ZvbGRlcnMsIGZ1bmN0aW9uKGZvbGRlcikge1xuICAgICAgICAgIGZvbGRlci5yZXZlcnQoZm9sZGVyKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKCFndWkpIHtcbiAgICAgICAgICBtYXJrUHJlc2V0TW9kaWZpZWQodGhpcy5nZXRSb290KCksIGZhbHNlKTtcbiAgICAgICAgfVxuXG5cbiAgICAgIH0sXG5cbiAgICAgIGxpc3RlbjogZnVuY3Rpb24oY29udHJvbGxlcikge1xuXG4gICAgICAgIHZhciBpbml0ID0gdGhpcy5fX2xpc3RlbmluZy5sZW5ndGggPT0gMDtcbiAgICAgICAgdGhpcy5fX2xpc3RlbmluZy5wdXNoKGNvbnRyb2xsZXIpO1xuICAgICAgICBpZiAoaW5pdCkgdXBkYXRlRGlzcGxheXModGhpcy5fX2xpc3RlbmluZyk7XG5cbiAgICAgIH1cblxuICAgIH1cblxuICApO1xuXG4gIGZ1bmN0aW9uIGFkZChndWksIG9iamVjdCwgcHJvcGVydHksIHBhcmFtcykge1xuXG4gICAgaWYgKG9iamVjdFtwcm9wZXJ0eV0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiT2JqZWN0IFwiICsgb2JqZWN0ICsgXCIgaGFzIG5vIHByb3BlcnR5IFxcXCJcIiArIHByb3BlcnR5ICsgXCJcXFwiXCIpO1xuICAgIH1cblxuICAgIHZhciBjb250cm9sbGVyO1xuXG4gICAgaWYgKHBhcmFtcy5jb2xvcikge1xuICAgICAgY29udHJvbGxlciA9IG5ldyBDb2xvckNvbnRyb2xsZXIob2JqZWN0LCBwcm9wZXJ0eSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBmYWN0b3J5QXJncyA9IFtvYmplY3QsIHByb3BlcnR5XS5jb25jYXQocGFyYW1zLmZhY3RvcnlBcmdzKTtcbiAgICAgIGNvbnRyb2xsZXIgPSBjb250cm9sbGVyRmFjdG9yeS5hcHBseShndWksIGZhY3RvcnlBcmdzKTtcbiAgICB9XG5cbiAgICBpZiAocGFyYW1zLmJlZm9yZSBpbnN0YW5jZW9mIENvbnRyb2xsZXIpIHtcbiAgICAgIHBhcmFtcy5iZWZvcmUgPSBwYXJhbXMuYmVmb3JlLl9fbGk7XG4gICAgfVxuXG4gICAgcmVjYWxsU2F2ZWRWYWx1ZShndWksIGNvbnRyb2xsZXIpO1xuXG4gICAgZG9tLmFkZENsYXNzKGNvbnRyb2xsZXIuZG9tRWxlbWVudCwgJ2MnKTtcblxuICAgIHZhciBuYW1lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgIGRvbS5hZGRDbGFzcyhuYW1lLCAncHJvcGVydHktbmFtZScpO1xuICAgIG5hbWUuaW5uZXJIVE1MID0gY29udHJvbGxlci5wcm9wZXJ0eTtcblxuICAgIHZhciBjb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQobmFtZSk7XG4gICAgY29udGFpbmVyLmFwcGVuZENoaWxkKGNvbnRyb2xsZXIuZG9tRWxlbWVudCk7XG5cbiAgICB2YXIgbGkgPSBhZGRSb3coZ3VpLCBjb250YWluZXIsIHBhcmFtcy5iZWZvcmUpO1xuXG4gICAgZG9tLmFkZENsYXNzKGxpLCBHVUkuQ0xBU1NfQ09OVFJPTExFUl9ST1cpO1xuICAgIGRvbS5hZGRDbGFzcyhsaSwgdHlwZW9mIGNvbnRyb2xsZXIuZ2V0VmFsdWUoKSk7XG5cbiAgICBhdWdtZW50Q29udHJvbGxlcihndWksIGxpLCBjb250cm9sbGVyKTtcblxuICAgIGd1aS5fX2NvbnRyb2xsZXJzLnB1c2goY29udHJvbGxlcik7XG5cbiAgICByZXR1cm4gY29udHJvbGxlcjtcblxuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBhIHJvdyB0byB0aGUgZW5kIG9mIHRoZSBHVUkgb3IgYmVmb3JlIGFub3RoZXIgcm93LlxuICAgKlxuICAgKiBAcGFyYW0gZ3VpXG4gICAqIEBwYXJhbSBbZG9tXSBJZiBzcGVjaWZpZWQsIGluc2VydHMgdGhlIGRvbSBjb250ZW50IGluIHRoZSBuZXcgcm93XG4gICAqIEBwYXJhbSBbbGlCZWZvcmVdIElmIHNwZWNpZmllZCwgcGxhY2VzIHRoZSBuZXcgcm93IGJlZm9yZSBhbm90aGVyIHJvd1xuICAgKi9cbiAgZnVuY3Rpb24gYWRkUm93KGd1aSwgZG9tLCBsaUJlZm9yZSkge1xuICAgIHZhciBsaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJyk7XG4gICAgaWYgKGRvbSkgbGkuYXBwZW5kQ2hpbGQoZG9tKTtcbiAgICBpZiAobGlCZWZvcmUpIHtcbiAgICAgIGd1aS5fX3VsLmluc2VydEJlZm9yZShsaSwgcGFyYW1zLmJlZm9yZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGd1aS5fX3VsLmFwcGVuZENoaWxkKGxpKTtcbiAgICB9XG4gICAgZ3VpLm9uUmVzaXplKCk7XG4gICAgcmV0dXJuIGxpO1xuICB9XG5cbiAgZnVuY3Rpb24gYXVnbWVudENvbnRyb2xsZXIoZ3VpLCBsaSwgY29udHJvbGxlcikge1xuXG4gICAgY29udHJvbGxlci5fX2xpID0gbGk7XG4gICAgY29udHJvbGxlci5fX2d1aSA9IGd1aTtcblxuICAgIGNvbW1vbi5leHRlbmQoY29udHJvbGxlciwge1xuXG4gICAgICBvcHRpb25zOiBmdW5jdGlvbihvcHRpb25zKSB7XG5cbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgY29udHJvbGxlci5yZW1vdmUoKTtcblxuICAgICAgICAgIHJldHVybiBhZGQoXG4gICAgICAgICAgICBndWksXG4gICAgICAgICAgICBjb250cm9sbGVyLm9iamVjdCxcbiAgICAgICAgICAgIGNvbnRyb2xsZXIucHJvcGVydHksIHtcbiAgICAgICAgICAgICAgYmVmb3JlOiBjb250cm9sbGVyLl9fbGkubmV4dEVsZW1lbnRTaWJsaW5nLFxuICAgICAgICAgICAgICBmYWN0b3J5QXJnczogW2NvbW1vbi50b0FycmF5KGFyZ3VtZW50cyldXG4gICAgICAgICAgICB9XG4gICAgICAgICAgKTtcblxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNvbW1vbi5pc0FycmF5KG9wdGlvbnMpIHx8IGNvbW1vbi5pc09iamVjdChvcHRpb25zKSkge1xuICAgICAgICAgIGNvbnRyb2xsZXIucmVtb3ZlKCk7XG5cbiAgICAgICAgICByZXR1cm4gYWRkKFxuICAgICAgICAgICAgZ3VpLFxuICAgICAgICAgICAgY29udHJvbGxlci5vYmplY3QsXG4gICAgICAgICAgICBjb250cm9sbGVyLnByb3BlcnR5LCB7XG4gICAgICAgICAgICAgIGJlZm9yZTogY29udHJvbGxlci5fX2xpLm5leHRFbGVtZW50U2libGluZyxcbiAgICAgICAgICAgICAgZmFjdG9yeUFyZ3M6IFtvcHRpb25zXVxuICAgICAgICAgICAgfVxuICAgICAgICAgICk7XG5cbiAgICAgICAgfVxuXG4gICAgICB9LFxuXG4gICAgICBuYW1lOiBmdW5jdGlvbih2KSB7XG4gICAgICAgIGNvbnRyb2xsZXIuX19saS5maXJzdEVsZW1lbnRDaGlsZC5maXJzdEVsZW1lbnRDaGlsZC5pbm5lckhUTUwgPSB2O1xuICAgICAgICByZXR1cm4gY29udHJvbGxlcjtcbiAgICAgIH0sXG5cbiAgICAgIGxpc3RlbjogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnRyb2xsZXIuX19ndWkubGlzdGVuKGNvbnRyb2xsZXIpO1xuICAgICAgICByZXR1cm4gY29udHJvbGxlcjtcbiAgICAgIH0sXG5cbiAgICAgIHJlbW92ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnRyb2xsZXIuX19ndWkucmVtb3ZlKGNvbnRyb2xsZXIpO1xuICAgICAgICByZXR1cm4gY29udHJvbGxlcjtcbiAgICAgIH1cblxuICAgIH0pO1xuXG4gICAgLy8gQWxsIHNsaWRlcnMgc2hvdWxkIGJlIGFjY29tcGFuaWVkIGJ5IGEgYm94LlxuICAgIGlmIChjb250cm9sbGVyIGluc3RhbmNlb2YgTnVtYmVyQ29udHJvbGxlclNsaWRlcikge1xuXG4gICAgICB2YXIgYm94ID0gbmV3IE51bWJlckNvbnRyb2xsZXJCb3goY29udHJvbGxlci5vYmplY3QsIGNvbnRyb2xsZXIucHJvcGVydHksIHtcbiAgICAgICAgbWluOiBjb250cm9sbGVyLl9fbWluLFxuICAgICAgICBtYXg6IGNvbnRyb2xsZXIuX19tYXgsXG4gICAgICAgIHN0ZXA6IGNvbnRyb2xsZXIuX19zdGVwXG4gICAgICB9KTtcblxuICAgICAgY29tbW9uLmVhY2goWyd1cGRhdGVEaXNwbGF5JywgJ29uQ2hhbmdlJywgJ29uRmluaXNoQ2hhbmdlJ10sIGZ1bmN0aW9uKG1ldGhvZCkge1xuICAgICAgICB2YXIgcGMgPSBjb250cm9sbGVyW21ldGhvZF07XG4gICAgICAgIHZhciBwYiA9IGJveFttZXRob2RdO1xuICAgICAgICBjb250cm9sbGVyW21ldGhvZF0gPSBib3hbbWV0aG9kXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcbiAgICAgICAgICBwYy5hcHBseShjb250cm9sbGVyLCBhcmdzKTtcbiAgICAgICAgICByZXR1cm4gcGIuYXBwbHkoYm94LCBhcmdzKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIGRvbS5hZGRDbGFzcyhsaSwgJ2hhcy1zbGlkZXInKTtcbiAgICAgIGNvbnRyb2xsZXIuZG9tRWxlbWVudC5pbnNlcnRCZWZvcmUoYm94LmRvbUVsZW1lbnQsIGNvbnRyb2xsZXIuZG9tRWxlbWVudC5maXJzdEVsZW1lbnRDaGlsZCk7XG5cbiAgICB9IGVsc2UgaWYgKGNvbnRyb2xsZXIgaW5zdGFuY2VvZiBOdW1iZXJDb250cm9sbGVyQm94KSB7XG5cbiAgICAgIHZhciByID0gZnVuY3Rpb24ocmV0dXJuZWQpIHtcblxuICAgICAgICAvLyBIYXZlIHdlIGRlZmluZWQgYm90aCBib3VuZGFyaWVzP1xuICAgICAgICBpZiAoY29tbW9uLmlzTnVtYmVyKGNvbnRyb2xsZXIuX19taW4pICYmIGNvbW1vbi5pc051bWJlcihjb250cm9sbGVyLl9fbWF4KSkge1xuXG4gICAgICAgICAgLy8gV2VsbCwgdGhlbiBsZXRzIGp1c3QgcmVwbGFjZSB0aGlzIHdpdGggYSBzbGlkZXIuXG4gICAgICAgICAgY29udHJvbGxlci5yZW1vdmUoKTtcbiAgICAgICAgICByZXR1cm4gYWRkKFxuICAgICAgICAgICAgZ3VpLFxuICAgICAgICAgICAgY29udHJvbGxlci5vYmplY3QsXG4gICAgICAgICAgICBjb250cm9sbGVyLnByb3BlcnR5LCB7XG4gICAgICAgICAgICAgIGJlZm9yZTogY29udHJvbGxlci5fX2xpLm5leHRFbGVtZW50U2libGluZyxcbiAgICAgICAgICAgICAgZmFjdG9yeUFyZ3M6IFtjb250cm9sbGVyLl9fbWluLCBjb250cm9sbGVyLl9fbWF4LCBjb250cm9sbGVyLl9fc3RlcF1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmV0dXJuZWQ7XG5cbiAgICAgIH07XG5cbiAgICAgIGNvbnRyb2xsZXIubWluID0gY29tbW9uLmNvbXBvc2UociwgY29udHJvbGxlci5taW4pO1xuICAgICAgY29udHJvbGxlci5tYXggPSBjb21tb24uY29tcG9zZShyLCBjb250cm9sbGVyLm1heCk7XG5cbiAgICB9IGVsc2UgaWYgKGNvbnRyb2xsZXIgaW5zdGFuY2VvZiBCb29sZWFuQ29udHJvbGxlcikge1xuXG4gICAgICBkb20uYmluZChsaSwgJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIGRvbS5mYWtlRXZlbnQoY29udHJvbGxlci5fX2NoZWNrYm94LCAnY2xpY2snKTtcbiAgICAgIH0pO1xuXG4gICAgICBkb20uYmluZChjb250cm9sbGVyLl9fY2hlY2tib3gsICdjbGljaycsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTsgLy8gUHJldmVudHMgZG91YmxlLXRvZ2dsZVxuICAgICAgfSlcblxuICAgIH0gZWxzZSBpZiAoY29udHJvbGxlciBpbnN0YW5jZW9mIEZ1bmN0aW9uQ29udHJvbGxlcikge1xuXG4gICAgICBkb20uYmluZChsaSwgJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIGRvbS5mYWtlRXZlbnQoY29udHJvbGxlci5fX2J1dHRvbiwgJ2NsaWNrJyk7XG4gICAgICB9KTtcblxuICAgICAgZG9tLmJpbmQobGksICdtb3VzZW92ZXInLCBmdW5jdGlvbigpIHtcbiAgICAgICAgZG9tLmFkZENsYXNzKGNvbnRyb2xsZXIuX19idXR0b24sICdob3ZlcicpO1xuICAgICAgfSk7XG5cbiAgICAgIGRvbS5iaW5kKGxpLCAnbW91c2VvdXQnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgZG9tLnJlbW92ZUNsYXNzKGNvbnRyb2xsZXIuX19idXR0b24sICdob3ZlcicpO1xuICAgICAgfSk7XG5cbiAgICB9IGVsc2UgaWYgKGNvbnRyb2xsZXIgaW5zdGFuY2VvZiBDb2xvckNvbnRyb2xsZXIpIHtcblxuICAgICAgZG9tLmFkZENsYXNzKGxpLCAnY29sb3InKTtcbiAgICAgIGNvbnRyb2xsZXIudXBkYXRlRGlzcGxheSA9IGNvbW1vbi5jb21wb3NlKGZ1bmN0aW9uKHIpIHtcbiAgICAgICAgbGkuc3R5bGUuYm9yZGVyTGVmdENvbG9yID0gY29udHJvbGxlci5fX2NvbG9yLnRvU3RyaW5nKCk7XG4gICAgICAgIHJldHVybiByO1xuICAgICAgfSwgY29udHJvbGxlci51cGRhdGVEaXNwbGF5KTtcblxuICAgICAgY29udHJvbGxlci51cGRhdGVEaXNwbGF5KCk7XG5cbiAgICB9XG5cbiAgICBjb250cm9sbGVyLnNldFZhbHVlID0gY29tbW9uLmNvbXBvc2UoZnVuY3Rpb24ocikge1xuICAgICAgaWYgKGd1aS5nZXRSb290KCkuX19wcmVzZXRfc2VsZWN0ICYmIGNvbnRyb2xsZXIuaXNNb2RpZmllZCgpKSB7XG4gICAgICAgIG1hcmtQcmVzZXRNb2RpZmllZChndWkuZ2V0Um9vdCgpLCB0cnVlKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByO1xuICAgIH0sIGNvbnRyb2xsZXIuc2V0VmFsdWUpO1xuXG4gIH1cblxuICBmdW5jdGlvbiByZWNhbGxTYXZlZFZhbHVlKGd1aSwgY29udHJvbGxlcikge1xuXG4gICAgLy8gRmluZCB0aGUgdG9wbW9zdCBHVUksIHRoYXQncyB3aGVyZSByZW1lbWJlcmVkIG9iamVjdHMgbGl2ZS5cbiAgICB2YXIgcm9vdCA9IGd1aS5nZXRSb290KCk7XG5cbiAgICAvLyBEb2VzIHRoZSBvYmplY3Qgd2UncmUgY29udHJvbGxpbmcgbWF0Y2ggYW55dGhpbmcgd2UndmUgYmVlbiB0b2xkIHRvXG4gICAgLy8gcmVtZW1iZXI/XG4gICAgdmFyIG1hdGNoZWRfaW5kZXggPSByb290Ll9fcmVtZW1iZXJlZE9iamVjdHMuaW5kZXhPZihjb250cm9sbGVyLm9iamVjdCk7XG5cbiAgICAvLyBXaHkgeWVzLCBpdCBkb2VzIVxuICAgIGlmIChtYXRjaGVkX2luZGV4ICE9IC0xKSB7XG5cbiAgICAgIC8vIExldCBtZSBmZXRjaCBhIG1hcCBvZiBjb250cm9sbGVycyBmb3IgdGhjb21tb24uaXNPYmplY3QuXG4gICAgICB2YXIgY29udHJvbGxlcl9tYXAgPVxuICAgICAgICByb290Ll9fcmVtZW1iZXJlZE9iamVjdEluZGVjZXNUb0NvbnRyb2xsZXJzW21hdGNoZWRfaW5kZXhdO1xuXG4gICAgICAvLyBPaHAsIEkgYmVsaWV2ZSB0aGlzIGlzIHRoZSBmaXJzdCBjb250cm9sbGVyIHdlJ3ZlIGNyZWF0ZWQgZm9yIHRoaXNcbiAgICAgIC8vIG9iamVjdC4gTGV0cyBtYWtlIHRoZSBtYXAgZnJlc2guXG4gICAgICBpZiAoY29udHJvbGxlcl9tYXAgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBjb250cm9sbGVyX21hcCA9IHt9O1xuICAgICAgICByb290Ll9fcmVtZW1iZXJlZE9iamVjdEluZGVjZXNUb0NvbnRyb2xsZXJzW21hdGNoZWRfaW5kZXhdID1cbiAgICAgICAgICBjb250cm9sbGVyX21hcDtcbiAgICAgIH1cblxuICAgICAgLy8gS2VlcCB0cmFjayBvZiB0aGlzIGNvbnRyb2xsZXJcbiAgICAgIGNvbnRyb2xsZXJfbWFwW2NvbnRyb2xsZXIucHJvcGVydHldID0gY29udHJvbGxlcjtcblxuICAgICAgLy8gT2theSwgbm93IGhhdmUgd2Ugc2F2ZWQgYW55IHZhbHVlcyBmb3IgdGhpcyBjb250cm9sbGVyP1xuICAgICAgaWYgKHJvb3QubG9hZCAmJiByb290LmxvYWQucmVtZW1iZXJlZCkge1xuXG4gICAgICAgIHZhciBwcmVzZXRfbWFwID0gcm9vdC5sb2FkLnJlbWVtYmVyZWQ7XG5cbiAgICAgICAgLy8gV2hpY2ggcHJlc2V0IGFyZSB3ZSB0cnlpbmcgdG8gbG9hZD9cbiAgICAgICAgdmFyIHByZXNldDtcblxuICAgICAgICBpZiAocHJlc2V0X21hcFtndWkucHJlc2V0XSkge1xuXG4gICAgICAgICAgcHJlc2V0ID0gcHJlc2V0X21hcFtndWkucHJlc2V0XTtcblxuICAgICAgICB9IGVsc2UgaWYgKHByZXNldF9tYXBbREVGQVVMVF9ERUZBVUxUX1BSRVNFVF9OQU1FXSkge1xuXG4gICAgICAgICAgLy8gVWhoLCB5b3UgY2FuIGhhdmUgdGhlIGRlZmF1bHQgaW5zdGVhZD9cbiAgICAgICAgICBwcmVzZXQgPSBwcmVzZXRfbWFwW0RFRkFVTFRfREVGQVVMVF9QUkVTRVRfTkFNRV07XG5cbiAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgIC8vIE5hZGEuXG5cbiAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgfVxuXG5cbiAgICAgICAgLy8gRGlkIHRoZSBsb2FkZWQgb2JqZWN0IHJlbWVtYmVyIHRoY29tbW9uLmlzT2JqZWN0P1xuICAgICAgICBpZiAocHJlc2V0W21hdGNoZWRfaW5kZXhdICYmXG5cbiAgICAgICAgICAvLyBEaWQgd2UgcmVtZW1iZXIgdGhpcyBwYXJ0aWN1bGFyIHByb3BlcnR5P1xuICAgICAgICAgIHByZXNldFttYXRjaGVkX2luZGV4XVtjb250cm9sbGVyLnByb3BlcnR5XSAhPT0gdW5kZWZpbmVkKSB7XG5cbiAgICAgICAgICAvLyBXZSBkaWQgcmVtZW1iZXIgc29tZXRoaW5nIGZvciB0aGlzIGd1eSAuLi5cbiAgICAgICAgICB2YXIgdmFsdWUgPSBwcmVzZXRbbWF0Y2hlZF9pbmRleF1bY29udHJvbGxlci5wcm9wZXJ0eV07XG5cbiAgICAgICAgICAvLyBBbmQgdGhhdCdzIHdoYXQgaXQgaXMuXG4gICAgICAgICAgY29udHJvbGxlci5pbml0aWFsVmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgICBjb250cm9sbGVyLnNldFZhbHVlKHZhbHVlKTtcblxuICAgICAgICB9XG5cbiAgICAgIH1cblxuICAgIH1cblxuICB9XG5cbiAgZnVuY3Rpb24gZ2V0TG9jYWxTdG9yYWdlSGFzaChndWksIGtleSkge1xuICAgIC8vIFRPRE8gaG93IGRvZXMgdGhpcyBkZWFsIHdpdGggbXVsdGlwbGUgR1VJJ3M/XG4gICAgcmV0dXJuIGRvY3VtZW50LmxvY2F0aW9uLmhyZWYgKyAnLicgKyBrZXk7XG5cbiAgfVxuXG4gIGZ1bmN0aW9uIGFkZFNhdmVNZW51KGd1aSkge1xuXG4gICAgdmFyIGRpdiA9IGd1aS5fX3NhdmVfcm93ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcblxuICAgIGRvbS5hZGRDbGFzcyhndWkuZG9tRWxlbWVudCwgJ2hhcy1zYXZlJyk7XG5cbiAgICBndWkuX191bC5pbnNlcnRCZWZvcmUoZGl2LCBndWkuX191bC5maXJzdENoaWxkKTtcblxuICAgIGRvbS5hZGRDbGFzcyhkaXYsICdzYXZlLXJvdycpO1xuXG4gICAgdmFyIGdlYXJzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgIGdlYXJzLmlubmVySFRNTCA9ICcmbmJzcDsnO1xuICAgIGRvbS5hZGRDbGFzcyhnZWFycywgJ2J1dHRvbiBnZWFycycpO1xuXG4gICAgLy8gVE9ETyByZXBsYWNlIHdpdGggRnVuY3Rpb25Db250cm9sbGVyXG4gICAgdmFyIGJ1dHRvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICBidXR0b24uaW5uZXJIVE1MID0gJ1NhdmUnO1xuICAgIGRvbS5hZGRDbGFzcyhidXR0b24sICdidXR0b24nKTtcbiAgICBkb20uYWRkQ2xhc3MoYnV0dG9uLCAnc2F2ZScpO1xuXG4gICAgdmFyIGJ1dHRvbjIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgYnV0dG9uMi5pbm5lckhUTUwgPSAnTmV3JztcbiAgICBkb20uYWRkQ2xhc3MoYnV0dG9uMiwgJ2J1dHRvbicpO1xuICAgIGRvbS5hZGRDbGFzcyhidXR0b24yLCAnc2F2ZS1hcycpO1xuXG4gICAgdmFyIGJ1dHRvbjMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgYnV0dG9uMy5pbm5lckhUTUwgPSAnUmV2ZXJ0JztcbiAgICBkb20uYWRkQ2xhc3MoYnV0dG9uMywgJ2J1dHRvbicpO1xuICAgIGRvbS5hZGRDbGFzcyhidXR0b24zLCAncmV2ZXJ0Jyk7XG5cbiAgICB2YXIgc2VsZWN0ID0gZ3VpLl9fcHJlc2V0X3NlbGVjdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NlbGVjdCcpO1xuXG4gICAgaWYgKGd1aS5sb2FkICYmIGd1aS5sb2FkLnJlbWVtYmVyZWQpIHtcblxuICAgICAgY29tbW9uLmVhY2goZ3VpLmxvYWQucmVtZW1iZXJlZCwgZnVuY3Rpb24odmFsdWUsIGtleSkge1xuICAgICAgICBhZGRQcmVzZXRPcHRpb24oZ3VpLCBrZXksIGtleSA9PSBndWkucHJlc2V0KTtcbiAgICAgIH0pO1xuXG4gICAgfSBlbHNlIHtcbiAgICAgIGFkZFByZXNldE9wdGlvbihndWksIERFRkFVTFRfREVGQVVMVF9QUkVTRVRfTkFNRSwgZmFsc2UpO1xuICAgIH1cblxuICAgIGRvbS5iaW5kKHNlbGVjdCwgJ2NoYW5nZScsIGZ1bmN0aW9uKCkge1xuXG5cbiAgICAgIGZvciAodmFyIGluZGV4ID0gMDsgaW5kZXggPCBndWkuX19wcmVzZXRfc2VsZWN0Lmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgICBndWkuX19wcmVzZXRfc2VsZWN0W2luZGV4XS5pbm5lckhUTUwgPSBndWkuX19wcmVzZXRfc2VsZWN0W2luZGV4XS52YWx1ZTtcbiAgICAgIH1cblxuICAgICAgZ3VpLnByZXNldCA9IHRoaXMudmFsdWU7XG5cbiAgICB9KTtcblxuICAgIGRpdi5hcHBlbmRDaGlsZChzZWxlY3QpO1xuICAgIGRpdi5hcHBlbmRDaGlsZChnZWFycyk7XG4gICAgZGl2LmFwcGVuZENoaWxkKGJ1dHRvbik7XG4gICAgZGl2LmFwcGVuZENoaWxkKGJ1dHRvbjIpO1xuICAgIGRpdi5hcHBlbmRDaGlsZChidXR0b24zKTtcblxuICAgIGlmIChTVVBQT1JUU19MT0NBTF9TVE9SQUdFKSB7XG5cbiAgICAgIHZhciBzYXZlTG9jYWxseSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkZy1zYXZlLWxvY2FsbHknKTtcbiAgICAgIHZhciBleHBsYWluID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2RnLWxvY2FsLWV4cGxhaW4nKTtcblxuICAgICAgc2F2ZUxvY2FsbHkuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG5cbiAgICAgIHZhciBsb2NhbFN0b3JhZ2VDaGVja0JveCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkZy1sb2NhbC1zdG9yYWdlJyk7XG5cbiAgICAgIGlmIChsb2NhbFN0b3JhZ2UuZ2V0SXRlbShnZXRMb2NhbFN0b3JhZ2VIYXNoKGd1aSwgJ2lzTG9jYWwnKSkgPT09ICd0cnVlJykge1xuICAgICAgICBsb2NhbFN0b3JhZ2VDaGVja0JveC5zZXRBdHRyaWJ1dGUoJ2NoZWNrZWQnLCAnY2hlY2tlZCcpO1xuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBzaG93SGlkZUV4cGxhaW4oKSB7XG4gICAgICAgIGV4cGxhaW4uc3R5bGUuZGlzcGxheSA9IGd1aS51c2VMb2NhbFN0b3JhZ2UgPyAnYmxvY2snIDogJ25vbmUnO1xuICAgICAgfVxuXG4gICAgICBzaG93SGlkZUV4cGxhaW4oKTtcblxuICAgICAgLy8gVE9ETzogVXNlIGEgYm9vbGVhbiBjb250cm9sbGVyLCBmb29sIVxuICAgICAgZG9tLmJpbmQobG9jYWxTdG9yYWdlQ2hlY2tCb3gsICdjaGFuZ2UnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgZ3VpLnVzZUxvY2FsU3RvcmFnZSA9ICFndWkudXNlTG9jYWxTdG9yYWdlO1xuICAgICAgICBzaG93SGlkZUV4cGxhaW4oKTtcbiAgICAgIH0pO1xuXG4gICAgfVxuXG4gICAgdmFyIG5ld0NvbnN0cnVjdG9yVGV4dEFyZWEgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZGctbmV3LWNvbnN0cnVjdG9yJyk7XG5cbiAgICBkb20uYmluZChuZXdDb25zdHJ1Y3RvclRleHRBcmVhLCAna2V5ZG93bicsIGZ1bmN0aW9uKGUpIHtcbiAgICAgIGlmIChlLm1ldGFLZXkgJiYgKGUud2hpY2ggPT09IDY3IHx8IGUua2V5Q29kZSA9PSA2NykpIHtcbiAgICAgICAgU0FWRV9ESUFMT0dVRS5oaWRlKCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBkb20uYmluZChnZWFycywgJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICBuZXdDb25zdHJ1Y3RvclRleHRBcmVhLmlubmVySFRNTCA9IEpTT04uc3RyaW5naWZ5KGd1aS5nZXRTYXZlT2JqZWN0KCksIHVuZGVmaW5lZCwgMik7XG4gICAgICBTQVZFX0RJQUxPR1VFLnNob3coKTtcbiAgICAgIG5ld0NvbnN0cnVjdG9yVGV4dEFyZWEuZm9jdXMoKTtcbiAgICAgIG5ld0NvbnN0cnVjdG9yVGV4dEFyZWEuc2VsZWN0KCk7XG4gICAgfSk7XG5cbiAgICBkb20uYmluZChidXR0b24sICdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgICAgZ3VpLnNhdmUoKTtcbiAgICB9KTtcblxuICAgIGRvbS5iaW5kKGJ1dHRvbjIsICdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHByZXNldE5hbWUgPSBwcm9tcHQoJ0VudGVyIGEgbmV3IHByZXNldCBuYW1lLicpO1xuICAgICAgaWYgKHByZXNldE5hbWUpIGd1aS5zYXZlQXMocHJlc2V0TmFtZSk7XG4gICAgfSk7XG5cbiAgICBkb20uYmluZChidXR0b24zLCAnY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAgIGd1aS5yZXZlcnQoKTtcbiAgICB9KTtcblxuICAgIC8vICAgIGRpdi5hcHBlbmRDaGlsZChidXR0b24yKTtcblxuICB9XG5cbiAgZnVuY3Rpb24gYWRkUmVzaXplSGFuZGxlKGd1aSkge1xuXG4gICAgZ3VpLl9fcmVzaXplX2hhbmRsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXG4gICAgY29tbW9uLmV4dGVuZChndWkuX19yZXNpemVfaGFuZGxlLnN0eWxlLCB7XG5cbiAgICAgIHdpZHRoOiAnNnB4JyxcbiAgICAgIG1hcmdpbkxlZnQ6ICctM3B4JyxcbiAgICAgIGhlaWdodDogJzIwMHB4JyxcbiAgICAgIGN1cnNvcjogJ2V3LXJlc2l6ZScsXG4gICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJ1xuICAgICAgICAvLyAgICAgIGJvcmRlcjogJzFweCBzb2xpZCBibHVlJ1xuXG4gICAgfSk7XG5cbiAgICB2YXIgcG1vdXNlWDtcblxuICAgIGRvbS5iaW5kKGd1aS5fX3Jlc2l6ZV9oYW5kbGUsICdtb3VzZWRvd24nLCBkcmFnU3RhcnQpO1xuICAgIGRvbS5iaW5kKGd1aS5fX2Nsb3NlQnV0dG9uLCAnbW91c2Vkb3duJywgZHJhZ1N0YXJ0KTtcblxuICAgIGd1aS5kb21FbGVtZW50Lmluc2VydEJlZm9yZShndWkuX19yZXNpemVfaGFuZGxlLCBndWkuZG9tRWxlbWVudC5maXJzdEVsZW1lbnRDaGlsZCk7XG5cbiAgICBmdW5jdGlvbiBkcmFnU3RhcnQoZSkge1xuXG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgIHBtb3VzZVggPSBlLmNsaWVudFg7XG5cbiAgICAgIGRvbS5hZGRDbGFzcyhndWkuX19jbG9zZUJ1dHRvbiwgR1VJLkNMQVNTX0RSQUcpO1xuICAgICAgZG9tLmJpbmQod2luZG93LCAnbW91c2Vtb3ZlJywgZHJhZyk7XG4gICAgICBkb20uYmluZCh3aW5kb3csICdtb3VzZXVwJywgZHJhZ1N0b3ApO1xuXG4gICAgICByZXR1cm4gZmFsc2U7XG5cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkcmFnKGUpIHtcblxuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICBndWkud2lkdGggKz0gcG1vdXNlWCAtIGUuY2xpZW50WDtcbiAgICAgIGd1aS5vblJlc2l6ZSgpO1xuICAgICAgcG1vdXNlWCA9IGUuY2xpZW50WDtcblxuICAgICAgcmV0dXJuIGZhbHNlO1xuXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZHJhZ1N0b3AoKSB7XG5cbiAgICAgIGRvbS5yZW1vdmVDbGFzcyhndWkuX19jbG9zZUJ1dHRvbiwgR1VJLkNMQVNTX0RSQUcpO1xuICAgICAgZG9tLnVuYmluZCh3aW5kb3csICdtb3VzZW1vdmUnLCBkcmFnKTtcbiAgICAgIGRvbS51bmJpbmQod2luZG93LCAnbW91c2V1cCcsIGRyYWdTdG9wKTtcblxuICAgIH1cblxuICB9XG5cbiAgZnVuY3Rpb24gc2V0V2lkdGgoZ3VpLCB3KSB7XG4gICAgZ3VpLmRvbUVsZW1lbnQuc3R5bGUud2lkdGggPSB3ICsgJ3B4JztcbiAgICAvLyBBdXRvIHBsYWNlZCBzYXZlLXJvd3MgYXJlIHBvc2l0aW9uIGZpeGVkLCBzbyB3ZSBoYXZlIHRvXG4gICAgLy8gc2V0IHRoZSB3aWR0aCBtYW51YWxseSBpZiB3ZSB3YW50IGl0IHRvIGJsZWVkIHRvIHRoZSBlZGdlXG4gICAgaWYgKGd1aS5fX3NhdmVfcm93ICYmIGd1aS5hdXRvUGxhY2UpIHtcbiAgICAgIGd1aS5fX3NhdmVfcm93LnN0eWxlLndpZHRoID0gdyArICdweCc7XG4gICAgfVxuICAgIGlmIChndWkuX19jbG9zZUJ1dHRvbikge1xuICAgICAgZ3VpLl9fY2xvc2VCdXR0b24uc3R5bGUud2lkdGggPSB3ICsgJ3B4JztcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBnZXRDdXJyZW50UHJlc2V0KGd1aSwgdXNlSW5pdGlhbFZhbHVlcykge1xuXG4gICAgdmFyIHRvUmV0dXJuID0ge307XG5cbiAgICAvLyBGb3IgZWFjaCBvYmplY3QgSSdtIHJlbWVtYmVyaW5nXG4gICAgY29tbW9uLmVhY2goZ3VpLl9fcmVtZW1iZXJlZE9iamVjdHMsIGZ1bmN0aW9uKHZhbCwgaW5kZXgpIHtcblxuICAgICAgdmFyIHNhdmVkX3ZhbHVlcyA9IHt9O1xuXG4gICAgICAvLyBUaGUgY29udHJvbGxlcnMgSSd2ZSBtYWRlIGZvciB0aGNvbW1vbi5pc09iamVjdCBieSBwcm9wZXJ0eVxuICAgICAgdmFyIGNvbnRyb2xsZXJfbWFwID1cbiAgICAgICAgZ3VpLl9fcmVtZW1iZXJlZE9iamVjdEluZGVjZXNUb0NvbnRyb2xsZXJzW2luZGV4XTtcblxuICAgICAgLy8gUmVtZW1iZXIgZWFjaCB2YWx1ZSBmb3IgZWFjaCBwcm9wZXJ0eVxuICAgICAgY29tbW9uLmVhY2goY29udHJvbGxlcl9tYXAsIGZ1bmN0aW9uKGNvbnRyb2xsZXIsIHByb3BlcnR5KSB7XG4gICAgICAgIHNhdmVkX3ZhbHVlc1twcm9wZXJ0eV0gPSB1c2VJbml0aWFsVmFsdWVzID8gY29udHJvbGxlci5pbml0aWFsVmFsdWUgOiBjb250cm9sbGVyLmdldFZhbHVlKCk7XG4gICAgICB9KTtcblxuICAgICAgLy8gU2F2ZSB0aGUgdmFsdWVzIGZvciB0aGNvbW1vbi5pc09iamVjdFxuICAgICAgdG9SZXR1cm5baW5kZXhdID0gc2F2ZWRfdmFsdWVzO1xuXG4gICAgfSk7XG5cbiAgICByZXR1cm4gdG9SZXR1cm47XG5cbiAgfVxuXG4gIGZ1bmN0aW9uIGFkZFByZXNldE9wdGlvbihndWksIG5hbWUsIHNldFNlbGVjdGVkKSB7XG4gICAgdmFyIG9wdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ29wdGlvbicpO1xuICAgIG9wdC5pbm5lckhUTUwgPSBuYW1lO1xuICAgIG9wdC52YWx1ZSA9IG5hbWU7XG4gICAgZ3VpLl9fcHJlc2V0X3NlbGVjdC5hcHBlbmRDaGlsZChvcHQpO1xuICAgIGlmIChzZXRTZWxlY3RlZCkge1xuICAgICAgZ3VpLl9fcHJlc2V0X3NlbGVjdC5zZWxlY3RlZEluZGV4ID0gZ3VpLl9fcHJlc2V0X3NlbGVjdC5sZW5ndGggLSAxO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHNldFByZXNldFNlbGVjdEluZGV4KGd1aSkge1xuICAgIGZvciAodmFyIGluZGV4ID0gMDsgaW5kZXggPCBndWkuX19wcmVzZXRfc2VsZWN0Lmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgaWYgKGd1aS5fX3ByZXNldF9zZWxlY3RbaW5kZXhdLnZhbHVlID09IGd1aS5wcmVzZXQpIHtcbiAgICAgICAgZ3VpLl9fcHJlc2V0X3NlbGVjdC5zZWxlY3RlZEluZGV4ID0gaW5kZXg7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gbWFya1ByZXNldE1vZGlmaWVkKGd1aSwgbW9kaWZpZWQpIHtcbiAgICB2YXIgb3B0ID0gZ3VpLl9fcHJlc2V0X3NlbGVjdFtndWkuX19wcmVzZXRfc2VsZWN0LnNlbGVjdGVkSW5kZXhdO1xuICAgIC8vICAgIGNvbnNvbGUubG9nKCdtYXJrJywgbW9kaWZpZWQsIG9wdCk7XG4gICAgaWYgKG1vZGlmaWVkKSB7XG4gICAgICBvcHQuaW5uZXJIVE1MID0gb3B0LnZhbHVlICsgXCIqXCI7XG4gICAgfSBlbHNlIHtcbiAgICAgIG9wdC5pbm5lckhUTUwgPSBvcHQudmFsdWU7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gdXBkYXRlRGlzcGxheXMoY29udHJvbGxlckFycmF5KSB7XG5cblxuICAgIGlmIChjb250cm9sbGVyQXJyYXkubGVuZ3RoICE9IDApIHtcblxuICAgICAgcmFmKGZ1bmN0aW9uKCkge1xuICAgICAgICB1cGRhdGVEaXNwbGF5cyhjb250cm9sbGVyQXJyYXkpO1xuICAgICAgfSk7XG5cbiAgICB9XG5cbiAgICBjb21tb24uZWFjaChjb250cm9sbGVyQXJyYXksIGZ1bmN0aW9uKGMpIHtcbiAgICAgIGMudXBkYXRlRGlzcGxheSgpO1xuICAgIH0pO1xuXG4gIH1cblxuICBmdW5jdGlvbiB1cGRhdGVBbGwocm9vdCkge1xuICAgIC8vIEl0ZXJhdGUgb3ZlciBhbGwgY29udHJvbGxlcnNcbiAgICB1cGRhdGVDb250cm9sbGVycyhyb290Ll9fY29udHJvbGxlcnMpO1xuICAgIE9iamVjdC5rZXlzKHJvb3QuX19mb2xkZXJzKS5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgICAgdXBkYXRlQWxsKHJvb3QuX19mb2xkZXJzW2tleV0pO1xuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gdXBkYXRlQ29udHJvbGxlcnMoY29udHJvbGxlcnMpIHtcbiAgICBmb3IgKHZhciBpIGluIGNvbnRyb2xsZXJzKSB7XG4gICAgICBjb250cm9sbGVyc1tpXS51cGRhdGVEaXNwbGF5KCk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIEdVSTtcbn1cbiIsIi8qKlxuICogZGF0LWd1aSBKYXZhU2NyaXB0IENvbnRyb2xsZXIgTGlicmFyeVxuICogaHR0cDovL2NvZGUuZ29vZ2xlLmNvbS9wL2RhdC1ndWlcbiAqXG4gKiBDb3B5cmlnaHQgMjAxMSBEYXRhIEFydHMgVGVhbSwgR29vZ2xlIENyZWF0aXZlIExhYlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNvbW1vbigpO1xuXG5mdW5jdGlvbiBjb21tb24oKSB7XG5cbiAgdmFyIEFSUl9FQUNIID0gQXJyYXkucHJvdG90eXBlLmZvckVhY2g7XG4gIHZhciBBUlJfU0xJQ0UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2U7XG5cbiAgLyoqXG4gICAqIEJhbmQtYWlkIG1ldGhvZHMgZm9yIHRoaW5ncyB0aGF0IHNob3VsZCBiZSBhIGxvdCBlYXNpZXIgaW4gSmF2YVNjcmlwdC5cbiAgICogSW1wbGVtZW50YXRpb24gYW5kIHN0cnVjdHVyZSBpbnNwaXJlZCBieSB1bmRlcnNjb3JlLmpzXG4gICAqIGh0dHA6Ly9kb2N1bWVudGNsb3VkLmdpdGh1Yi5jb20vdW5kZXJzY29yZS9cbiAgICovXG5cbiAgcmV0dXJuIHtcblxuICAgIEJSRUFLOiB7fSxcblxuICAgIGV4dGVuZDogZnVuY3Rpb24odGFyZ2V0KSB7XG5cbiAgICAgIHRoaXMuZWFjaChBUlJfU0xJQ0UuY2FsbChhcmd1bWVudHMsIDEpLCBmdW5jdGlvbihvYmopIHtcblxuICAgICAgICBmb3IgKHZhciBrZXkgaW4gb2JqKVxuICAgICAgICAgIGlmICghdGhpcy5pc1VuZGVmaW5lZChvYmpba2V5XSkpXG4gICAgICAgICAgICB0YXJnZXRba2V5XSA9IG9ialtrZXldO1xuXG4gICAgICB9LCB0aGlzKTtcblxuICAgICAgcmV0dXJuIHRhcmdldDtcblxuICAgIH0sXG5cbiAgICBkZWZhdWx0czogZnVuY3Rpb24odGFyZ2V0KSB7XG5cbiAgICAgIHRoaXMuZWFjaChBUlJfU0xJQ0UuY2FsbChhcmd1bWVudHMsIDEpLCBmdW5jdGlvbihvYmopIHtcblxuICAgICAgICBmb3IgKHZhciBrZXkgaW4gb2JqKVxuICAgICAgICAgIGlmICh0aGlzLmlzVW5kZWZpbmVkKHRhcmdldFtrZXldKSlcbiAgICAgICAgICAgIHRhcmdldFtrZXldID0gb2JqW2tleV07XG5cbiAgICAgIH0sIHRoaXMpO1xuXG4gICAgICByZXR1cm4gdGFyZ2V0O1xuXG4gICAgfSxcblxuICAgIGNvbXBvc2U6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHRvQ2FsbCA9IEFSUl9TTElDRS5jYWxsKGFyZ3VtZW50cyk7XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHZhciBhcmdzID0gQVJSX1NMSUNFLmNhbGwoYXJndW1lbnRzKTtcbiAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IHRvQ2FsbC5sZW5ndGggLTE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICAgICAgYXJncyA9IFt0b0NhbGxbaV0uYXBwbHkodGhpcywgYXJncyldO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHJldHVybiBhcmdzWzBdO1xuICAgICAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgZWFjaDogZnVuY3Rpb24ob2JqLCBpdHIsIHNjb3BlKSB7XG5cbiAgICAgIGlmICghb2JqKSByZXR1cm47XG5cbiAgICAgIGlmIChBUlJfRUFDSCAmJiBvYmouZm9yRWFjaCAmJiBvYmouZm9yRWFjaCA9PT0gQVJSX0VBQ0gpIHtcblxuICAgICAgICBvYmouZm9yRWFjaChpdHIsIHNjb3BlKTtcblxuICAgICAgfSBlbHNlIGlmIChvYmoubGVuZ3RoID09PSBvYmoubGVuZ3RoICsgMCkgeyAvLyBJcyBudW1iZXIgYnV0IG5vdCBOYU5cblxuICAgICAgICBmb3IgKHZhciBrZXkgPSAwLCBsID0gb2JqLmxlbmd0aDsga2V5IDwgbDsga2V5KyspXG4gICAgICAgICAgaWYgKGtleSBpbiBvYmogJiYgaXRyLmNhbGwoc2NvcGUsIG9ialtrZXldLCBrZXkpID09PSB0aGlzLkJSRUFLKVxuICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICB9IGVsc2Uge1xuXG4gICAgICAgIGZvciAodmFyIGtleSBpbiBvYmopXG4gICAgICAgICAgaWYgKGl0ci5jYWxsKHNjb3BlLCBvYmpba2V5XSwga2V5KSA9PT0gdGhpcy5CUkVBSylcbiAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgfVxuXG4gICAgfSxcblxuICAgIGRlZmVyOiBmdW5jdGlvbihmbmMpIHtcbiAgICAgIHNldFRpbWVvdXQoZm5jLCAwKTtcbiAgICB9LFxuXG4gICAgdG9BcnJheTogZnVuY3Rpb24ob2JqKSB7XG4gICAgICBpZiAob2JqLnRvQXJyYXkpIHJldHVybiBvYmoudG9BcnJheSgpO1xuICAgICAgcmV0dXJuIEFSUl9TTElDRS5jYWxsKG9iaik7XG4gICAgfSxcblxuICAgIGlzVW5kZWZpbmVkOiBmdW5jdGlvbihvYmopIHtcbiAgICAgIHJldHVybiBvYmogPT09IHVuZGVmaW5lZDtcbiAgICB9LFxuXG4gICAgaXNOdWxsOiBmdW5jdGlvbihvYmopIHtcbiAgICAgIHJldHVybiBvYmogPT09IG51bGw7XG4gICAgfSxcblxuICAgIGlzTmFOOiBmdW5jdGlvbihvYmopIHtcbiAgICAgIHJldHVybiBvYmogIT09IG9iajtcbiAgICB9LFxuXG4gICAgaXNBcnJheTogQXJyYXkuaXNBcnJheSB8fCBmdW5jdGlvbihvYmopIHtcbiAgICAgIHJldHVybiBvYmouY29uc3RydWN0b3IgPT09IEFycmF5O1xuICAgIH0sXG5cbiAgICBpc09iamVjdDogZnVuY3Rpb24ob2JqKSB7XG4gICAgICByZXR1cm4gb2JqID09PSBPYmplY3Qob2JqKTtcbiAgICB9LFxuXG4gICAgaXNOdW1iZXI6IGZ1bmN0aW9uKG9iaikge1xuICAgICAgcmV0dXJuIG9iaiA9PT0gb2JqKzA7XG4gICAgfSxcblxuICAgIGlzU3RyaW5nOiBmdW5jdGlvbihvYmopIHtcbiAgICAgIHJldHVybiBvYmogPT09IG9iaisnJztcbiAgICB9LFxuXG4gICAgaXNCb29sZWFuOiBmdW5jdGlvbihvYmopIHtcbiAgICAgIHJldHVybiBvYmogPT09IGZhbHNlIHx8IG9iaiA9PT0gdHJ1ZTtcbiAgICB9LFxuXG4gICAgaXNGdW5jdGlvbjogZnVuY3Rpb24ob2JqKSB7XG4gICAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iaikgPT09ICdbb2JqZWN0IEZ1bmN0aW9uXSc7XG4gICAgfVxuXG4gIH07XG59XG4iLCIvKipcbiAqIGRhdC1ndWkgSmF2YVNjcmlwdCBDb250cm9sbGVyIExpYnJhcnlcbiAqIGh0dHA6Ly9jb2RlLmdvb2dsZS5jb20vcC9kYXQtZ3VpXG4gKlxuICogQ29weXJpZ2h0IDIwMTEgRGF0YSBBcnRzIFRlYW0sIEdvb2dsZSBDcmVhdGl2ZSBMYWJcbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gY3NzKCk7XG5cbmZ1bmN0aW9uIGNzcygpIHtcbiAgcmV0dXJuIHtcbiAgICBsb2FkOiBmdW5jdGlvbiAodXJsLCBkb2MpIHtcbiAgICAgIGRvYyA9IGRvYyB8fCBkb2N1bWVudDtcbiAgICAgIHZhciBsaW5rID0gZG9jLmNyZWF0ZUVsZW1lbnQoJ2xpbmsnKTtcbiAgICAgIGxpbmsudHlwZSA9ICd0ZXh0L2Nzcyc7XG4gICAgICBsaW5rLnJlbCA9ICdzdHlsZXNoZWV0JztcbiAgICAgIGxpbmsuaHJlZiA9IHVybDtcbiAgICAgIGRvYy5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaGVhZCcpWzBdLmFwcGVuZENoaWxkKGxpbmspO1xuICAgIH0sXG4gICAgaW5qZWN0OiBmdW5jdGlvbihjc3MsIGRvYykge1xuICAgICAgZG9jID0gZG9jIHx8IGRvY3VtZW50O1xuICAgICAgdmFyIGluamVjdGVkID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcbiAgICAgIGluamVjdGVkLnR5cGUgPSAndGV4dC9jc3MnO1xuICAgICAgaW5qZWN0ZWQuaW5uZXJIVE1MID0gY3NzO1xuICAgICAgZG9jLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoZWFkJylbMF0uYXBwZW5kQ2hpbGQoaW5qZWN0ZWQpO1xuICAgIH1cbiAgfTtcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZXNjYXBlO1xuXG52YXIgZW50aXR5TWFwID0ge1xuICBcIiZcIjogXCImYW1wO1wiLFxuICBcIjxcIjogXCImbHQ7XCIsXG4gIFwiPlwiOiBcIiZndDtcIixcbiAgJ1wiJzogJyZxdW90OycsXG4gIFwiJ1wiOiAnJiMzOTsnLFxuICBcIi9cIjogJyYjeDJGOydcbn07XG5cbmZ1bmN0aW9uIGVzY2FwZShzdHJpbmcpIHtcbiAgcmV0dXJuIFN0cmluZyhzdHJpbmcpLnJlcGxhY2UoL1smPD5cIidcXC9dL2csIGZ1bmN0aW9uKHMpIHtcbiAgICByZXR1cm4gZW50aXR5TWFwW3NdO1xuICB9KTtcbn1cbiIsIi8qKlxuICogZGF0LWd1aSBKYXZhU2NyaXB0IENvbnRyb2xsZXIgTGlicmFyeVxuICogaHR0cDovL2NvZGUuZ29vZ2xlLmNvbS9wL2RhdC1ndWlcbiAqXG4gKiBDb3B5cmlnaHQgMjAxMSBEYXRhIEFydHMgVGVhbSwgR29vZ2xlIENyZWF0aXZlIExhYlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqL1xubW9kdWxlLmV4cG9ydHMgPSByYWYoKTtcblxuZnVuY3Rpb24gcmFmKCkge1xuXG4gIC8qKlxuICAgKiByZXF1aXJlanMgdmVyc2lvbiBvZiBQYXVsIElyaXNoJ3MgUmVxdWVzdEFuaW1hdGlvbkZyYW1lXG4gICAqIGh0dHA6Ly9wYXVsaXJpc2guY29tLzIwMTEvcmVxdWVzdGFuaW1hdGlvbmZyYW1lLWZvci1zbWFydC1hbmltYXRpbmcvXG4gICAqL1xuXG4gIHJldHVybiB3aW5kb3cud2Via2l0UmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XG4gICAgICB3aW5kb3cubW96UmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XG4gICAgICB3aW5kb3cub1JlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxuICAgICAgd2luZG93Lm1zUmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XG4gICAgICBmdW5jdGlvbihjYWxsYmFjaywgZWxlbWVudCkge1xuXG4gICAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KGNhbGxiYWNrLCAxMDAwIC8gNjApO1xuXG4gICAgICB9O1xufVxuIiwiLyoqIEBsaWNlbnNlXG4gKiBkYXQtZ3VpIEphdmFTY3JpcHQgQ29udHJvbGxlciBMaWJyYXJ5XG4gKiBodHRwOi8vY29kZS5nb29nbGUuY29tL3AvZGF0LWd1aVxuICpcbiAqIENvcHlyaWdodCAyMDExIERhdGEgQXJ0cyBUZWFtLCBHb29nbGUgQ3JlYXRpdmUgTGFiXG4gKiBDb3B5cmlnaHQgMjAxNSBBbmRyZWkgS2FzaGNoYVxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqL1xubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGNvbG9yOiB7XG4gICAgbWF0aDogcmVxdWlyZSgnLi9kYXQvY29sb3IvbWF0aC5qcycpLFxuICAgIGludGVycHJldDogcmVxdWlyZSgnLi9kYXQvY29sb3IvaW50ZXJwcmV0LmpzJyksXG4gICAgQ29sb3I6IHJlcXVpcmUoJy4vZGF0L2NvbG9yL0NvbG9yLmpzJylcbiAgfSxcbiAgZG9tOiB7XG4gICAgZG9tOiByZXF1aXJlKCcuL2RhdC9kb20vZG9tLmpzJylcbiAgfSxcbiAgY29udHJvbGxlcnM6IHtcbiAgICBDb250cm9sbGVyOiByZXF1aXJlKCcuL2RhdC9jb250cm9sbGVycy9Db250cm9sbGVyLmpzJyksXG4gICAgQm9vbGVhbkNvbnRyb2xsZXI6IHJlcXVpcmUoJy4vZGF0L2NvbnRyb2xsZXJzL0Jvb2xlYW5Db250cm9sbGVyLmpzJyksXG4gICAgT3B0aW9uQ29udHJvbGxlcjogcmVxdWlyZSgnLi9kYXQvY29udHJvbGxlcnMvT3B0aW9uQ29udHJvbGxlci5qcycpLFxuICAgIFN0cmluZ0NvbnRyb2xsZXI6IHJlcXVpcmUoJy4vZGF0L2NvbnRyb2xsZXJzL1N0cmluZ0NvbnRyb2xsZXIuanMnKSxcbiAgICBOdW1iZXJDb250cm9sbGVyOiByZXF1aXJlKCcuL2RhdC9jb250cm9sbGVycy9OdW1iZXJDb250cm9sbGVyLmpzJyksXG4gICAgTnVtYmVyQ29udHJvbGxlckJveDogcmVxdWlyZSgnLi9kYXQvY29udHJvbGxlcnMvTnVtYmVyQ29udHJvbGxlckJveC5qcycpLFxuICAgIE51bWJlckNvbnRyb2xsZXJTbGlkZXI6IHJlcXVpcmUoJy4vZGF0L2NvbnRyb2xsZXJzL051bWJlckNvbnRyb2xsZXJTbGlkZXIuanMnKSxcbiAgICBGdW5jdGlvbkNvbnRyb2xsZXI6IHJlcXVpcmUoJy4vZGF0L2NvbnRyb2xsZXJzL0Z1bmN0aW9uQ29udHJvbGxlci5qcycpLFxuICAgIENvbG9yQ29udHJvbGxlcjogcmVxdWlyZSgnLi9kYXQvY29udHJvbGxlcnMvQ29sb3JDb250cm9sbGVyLmpzJyksXG4gIH0sXG4gIGd1aToge1xuICAgIEdVSTogcmVxdWlyZSgnLi9kYXQvZ3VpL0dVSS5qcycpXG4gIH0sXG4gIEdVSTogcmVxdWlyZSgnLi9kYXQvZ3VpL0dVSS5qcycpXG59O1xuIiwiZXhwb3J0IGZ1bmN0aW9uIHJlbGF0aXZlU2NhbGVkSGV4UG9pbnRzKHNpZGVMZW5ndGgpe1xyXG4gICAgbGV0IGNvcm5lcl92ZXJ0aWNhbCA9IE1hdGguc2luKE1hdGguUEkvMykqc2lkZUxlbmd0aDtcclxuICAgIGxldCBjb3JuZXJfaG9yaXpvbnRhbCA9IE1hdGguY29zKE1hdGguUEkvMykqc2lkZUxlbmd0aDtcclxuICAgIHJldHVybiBbXHJcbiAgICAgICAge3g6IC1jb3JuZXJfaG9yaXpvbnRhbCwgeTogLWNvcm5lcl92ZXJ0aWNhbH0sXHJcbiAgICAgICAge3g6ICtjb3JuZXJfaG9yaXpvbnRhbCwgeTogLWNvcm5lcl92ZXJ0aWNhbH0sXHJcbiAgICAgICAge3g6IHNpZGVMZW5ndGgsIHk6IDB9LFxyXG4gICAgICAgIHt4OiArY29ybmVyX2hvcml6b250YWwsIHk6ICtjb3JuZXJfdmVydGljYWx9LFxyXG4gICAgICAgIHt4OiAtY29ybmVyX2hvcml6b250YWwsIHk6ICtjb3JuZXJfdmVydGljYWx9LFxyXG4gICAgICAgIHt4OiAtc2lkZUxlbmd0aCwgeTogMH1cclxuICAgIF07XHJcbn1cclxuIiwiZXhwb3J0IGZ1bmN0aW9uIGdldEFkamFjZW50SGV4YWdvbk9mZnNldChncmlkWCwgc2lkZSl7XHJcbiAgICAvL2V2ZW4gY29sdW1uOiBvZGQgY29sdW1uOiAoYSBtZWFucyBhZGphY2VudCwgKiBtZWFucyBub3QpXHJcbiAgICAvLyphKiAgICAgICAgICBhYWFcclxuICAgIC8vYWhhICAgICAgICAgIGFoYVxyXG4gICAgLy9hYWEgICAgICAgICAgKmEqXHJcbiAgICBsZXQgZGlhZ29uYWxZQWJvdmUgPSAxLWdyaWRYJTI7XHJcbiAgICBsZXQgZGlhZ29uYWxZQmVsb3cgPSAtZ3JpZFglMjtcclxuICAgIC8vYXNzdW1lcyBzaWRlIDAgaXMgdG9wLCBpbmNyZWFzaW5nIGNsb2Nrd2lzZVxyXG4gICAgbGV0IGFkamFjZW50SGV4T2Zmc2V0ID0gW1xyXG4gICAgICAgIHt4OiAwLCB5OiAtMX0sIHt4OiAxLCB5OiBkaWFnb25hbFlCZWxvd30sIHt4OiAxLCB5OiBkaWFnb25hbFlBYm92ZX0sXHJcbiAgICAgICAge3g6IDAsIHk6IDF9LCB7eDogLTEsIHk6IGRpYWdvbmFsWUFib3ZlfSwge3g6IC0xLCB5OiBkaWFnb25hbFlCZWxvd31cclxuICAgIF07XHJcbiAgICByZXR1cm4gYWRqYWNlbnRIZXhPZmZzZXRbc2lkZV07XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRBZGphY2VudEhleGFnb25Db3JkKGNvcmQpe1xyXG4gICAgbGV0IG9mZnNldCA9IGdldEFkamFjZW50SGV4YWdvbk9mZnNldChjb3JkLngsIGNvcmQuc2lkZSk7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHg6IGNvcmQueCArIG9mZnNldC54LFxyXG4gICAgICAgIHk6IGNvcmQueSArIG9mZnNldC55LFxyXG4gICAgICAgIHNpZGU6IChjb3JkLnNpZGUgKyAzKSAlIDZcclxuICAgIH07XHJcbn1cclxuIiwiLy9pZiB3ZSB3YW50IHRvIHBhY2sgcGhhc2VyIGluIHRoZSBidWlsZFxyXG4vL2ltcG9ydCBQaGFzZXIgZnJvbSBcIlBoYXNlclwiO1xyXG4vL2hhY2sgY2F1c2UgaHR0cHM6Ly9naXRodWIuY29tL3Bob3RvbnN0b3JtL3BoYXNlci9pc3N1ZXMvMjQyNFxyXG4vL3dpbmRvdy5QSVhJID0gcmVxdWlyZSggJ3BoYXNlci9idWlsZC9jdXN0b20vcGl4aScgKTtcclxuLy93aW5kb3cucDIgPSByZXF1aXJlKCAncGhhc2VyL2J1aWxkL2N1c3RvbS9wMicgKTtcclxuLy93aW5kb3cuUGhhc2VyID0gcmVxdWlyZSggJ3BoYXNlci9idWlsZC9jdXN0b20vcGhhc2VyLXNwbGl0JyApO1xyXG5cclxuaW1wb3J0ICogYXMgZGF0IGZyb20gXCJleGRhdFwiOy8vYnJvd3NlcmlmeSBkb2Vzbid0IGxpa2UgZGF0Lmd1aSwgcGx1cyBJIGRvbid0IHRoaW5rIHRoZSByZXBvcyBmcm9tIHRoZSBtYWludGFpbmVyIGFueXdheVxyXG5pbXBvcnQge2hleGFnb25TZXR0aW5nc0d1aX0gZnJvbSBcIi4vdmlld3MvaGV4YWdvbi5qc1wiO1xyXG5pbXBvcnQge2NvbWJpbmVkU2lkZVNldHRpbmdzR3VpfSBmcm9tIFwiLi92aWV3cy9jb21iaW5lZFNpZGUuanNcIjtcclxuaW1wb3J0IHtib2FyZFNldHRpbmdzR3VpLCBCb2FyZCBhcyBCb2FyZFZpZXd9IGZyb20gXCIuL3ZpZXdzL2JvYXJkLmpzXCI7XHJcbmltcG9ydCB7Qm9hcmQgYXMgQm9hcmRNb2RlbH0gZnJvbSBcIi4vbW9kZWxzL2JvYXJkLmpzXCI7XHJcbmltcG9ydCAqIGFzIHRlYW1JbmZvIGZyb20gXCIuL3RlYW1JbmZvLmpzXCI7XHJcbmltcG9ydCAqIGFzIHNpZGVHZW5lcmF0aW9uIGZyb20gXCIuL3NpZGVHZW5lcmF0aW9uLmpzXCI7XHJcbmltcG9ydCB7c2luZ2xlU2lkZVNldHRpbmdzR3VpfSBmcm9tIFwiLi92aWV3cy9TaW5nbGVTaWRlLmpzXCI7XHJcbmltcG9ydCB7Y29tYmluZWRTaWRlR2FtZVNldHRpbmdzR3VpfSBmcm9tIFwiLi9tb2RlbHMvY29tYmluZWRTaWRlLmpzXCI7XHJcblxyXG5mdW5jdGlvbiBjcmVhdGVCb2FyZChnYW1lLCBkYXRhU3RyaW5nKXtcclxuICAgIGlmKGRhdGFTdHJpbmcgPT09IHVuZGVmaW5lZCl7XHJcbiAgICAgICAgbGV0IGdlbmVyYXRpb25GdW5jdGlvbiA9IHNpZGVHZW5lcmF0aW9uLm1hcHBpbmdGb3JEYXRHdWkuZ2V0KGdsb2JhbFBhcmFtcy5zaWRlR2VuZXJhdGlvbik7XHJcbiAgICAgICAgZGF0YVN0cmluZyA9IGdlbmVyYXRpb25GdW5jdGlvbih0ZWFtSW5mby50ZWFtcywgZ2xvYmFsUGFyYW1zLmdyaWRXaWR0aCwgZ2xvYmFsUGFyYW1zLmdyaWRIZWlnaHQpO1xyXG4gICAgfVxyXG4gICAgbGV0IGJvYXJkTW9kZWwgPSBuZXcgQm9hcmRNb2RlbChkYXRhU3RyaW5nKTtcclxuICAgIGdsb2JhbFBhcmFtcy5kYXRhU3RyaW5nID0gYm9hcmRNb2RlbC5kYXRhU3RyaW5nO1xyXG4gICAgZ2xvYmFsUGFyYW1zLnNpZGVHZW5lcmF0aW9uID0gXCJkYXRhU3RyaW5nXCI7XHJcbiAgICBsZXQgYm9hcmRWaWV3ID0gbmV3IEJvYXJkVmlldyhnYW1lLCAwLCAwLCBib2FyZE1vZGVsLCBnYW1lLnNldHRpbmdzR3VpKTtcclxuICAgIGdhbWUuYWRkLmV4aXN0aW5nKGJvYXJkVmlldyk7XHJcbiAgICBnYW1lLmJvYXJkVmlldyA9IGJvYXJkVmlldztcclxufVxyXG5cclxubGV0IGdsb2JhbFBhcmFtcyA9IHtcclxuICAgIHdpZHRoOiB3aW5kb3cuaW5uZXJXaWR0aCxcclxuICAgIGhlaWdodDogd2luZG93LmlubmVySGVpZ2h0LFxyXG4gICAgZ3JpZFdpZHRoOiAyLFxyXG4gICAgZ3JpZEhlaWdodDogMixcclxuICAgIHNpZGVHZW5lcmF0aW9uOiBcInJhbmRvbVwiLC8vYmUgbmljZSB0byBzdG9yZSBmdW5jdGlvbiBkaXJlY3RseSBoZXJlIGJ1dCBkb2Vzbid0IHBsYXkgbmljZSB3aXRoIGRhdC1ndWksXHJcbiAgICBkYXNoQm9hcmRXaWR0aDogd2luZG93LmlubmVyV2lkdGgvMTAsXHJcbn07XHJcblxyXG5mdW5jdGlvbiBnbG9iYWxTZXR0aW5nc0d1aShzZXR0aW5nc0d1aSwgZ2FtZSl7XHJcbiAgICBsZXQgZ3JhcGhpY3NGb2xkZXIgPSBzZXR0aW5nc0d1aS5hZGRGb2xkZXIoJ21haW4gZ3JhcGhpY3MnKTtcclxuICAgIGdyYXBoaWNzRm9sZGVyLmFkZENvbG9yKGdhbWUuc3RhZ2UsICdiYWNrZ3JvdW5kQ29sb3InKTtcclxuICAgIGdyYXBoaWNzRm9sZGVyLmFkZChnbG9iYWxQYXJhbXMsICd3aWR0aCcsIDAsIHdpbmRvdy5pbm5lcldpZHRoKS5vbkZpbmlzaENoYW5nZShmdW5jdGlvbihuZXdXaWR0aCl7XHJcbiAgICAgICAgZ2FtZS5zY2FsZS5zZXRHYW1lU2l6ZShuZXdXaWR0aCwgZ2FtZS5oZWlnaHQpO1xyXG4gICAgICAgIGdhbWUuYm9hcmRWaWV3LnVwZGF0ZVNpZGVMZW5ndGgoKTtcclxuICAgIH0pO1xyXG4gICAgZ3JhcGhpY3NGb2xkZXIuYWRkKGdsb2JhbFBhcmFtcywgJ2hlaWdodCcsIDAsIHdpbmRvdy5pbm5lckhlaWdodCkub25GaW5pc2hDaGFuZ2UoZnVuY3Rpb24obmV3SGVpZ2h0KXtcclxuICAgICAgICBnYW1lLnNjYWxlLnNldEdhbWVTaXplKGdhbWUud2lkdGgsIG5ld0hlaWdodCk7XHJcbiAgICAgICAgZ2FtZS5ib2FyZFZpZXcudXBkYXRlU2lkZUxlbmd0aCgpO1xyXG4gICAgfSk7XHJcbiAgICBsZXQgbWFwRm9sZGVyID0gc2V0dGluZ3NHdWkuYWRkRm9sZGVyKCdtYXAgc2V0dXAnKTtcclxuICAgIG1hcEZvbGRlci5hZGQoZ2xvYmFsUGFyYW1zLCAnZ3JpZFdpZHRoJywgMCkuc3RlcCgxKTtcclxuICAgIG1hcEZvbGRlci5hZGQoZ2xvYmFsUGFyYW1zLCAnZ3JpZEhlaWdodCcsIDApLnN0ZXAoMSk7XHJcbiAgICBtYXBGb2xkZXIuYWRkKGdsb2JhbFBhcmFtcywgJ3NpZGVHZW5lcmF0aW9uJywgW1wicmFuZG9tXCIsIFwiZXZlblwiLCBcImRhdGFTdHJpbmdcIl0pLmxpc3RlbigpLm9uRmluaXNoQ2hhbmdlKGZ1bmN0aW9uKGdlbk1ldGhvZCl7XHJcbiAgICAgICAgZ2FtZS5ib2FyZFZpZXcuZGVzdHJveSgpO1xyXG4gICAgICAgIGNyZWF0ZUJvYXJkKGdhbWUpO1xyXG4gICAgfSk7XHJcbiAgICAvL3RoaXMgY2FudCBwb2ludCB0byBib2FyZC5kYXRhU3RyaW5nIGJlY2F1c2UgZGF0LWd1aSBkb2Vzbid0IHdvcmsgd2l0aCBnZXR0ZXJzL3NldHRlcnNcclxuICAgIG1hcEZvbGRlci5hZGQoZ2xvYmFsUGFyYW1zLCAnZGF0YVN0cmluZycpLmxpc3RlbigpLm9uRmluaXNoQ2hhbmdlKGZ1bmN0aW9uKG5ld0RhdGFTdHJpbmcpe1xyXG4gICAgICAgIGdhbWUuYm9hcmRWaWV3LmRlc3Ryb3koKTtcclxuICAgICAgICBjcmVhdGVCb2FyZChnYW1lLCBuZXdEYXRhU3RyaW5nKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBvbkNyZWF0ZShnYW1lKSB7XHJcbiAgICBnYW1lLnN0YWdlLmJhY2tncm91bmRDb2xvciA9IFwiIzY2NjY2NlwiOy8vY29uc2lkZXIgZ3JleSBiZWNhdXNlIGxlc3MgY29udHJhc3RcclxuICAgIGxldCBzZXR0aW5nc0d1aSA9IG5ldyBkYXQuR1VJKCk7XHJcbiAgICBnYW1lLnNldHRpbmdzR3VpID0gc2V0dGluZ3NHdWk7XHJcbiAgICBjcmVhdGVCb2FyZChnYW1lKTtcclxuICAgIGNvbWJpbmVkU2lkZUdhbWVTZXR0aW5nc0d1aShzZXR0aW5nc0d1aSk7XHJcbiAgICBnbG9iYWxTZXR0aW5nc0d1aShzZXR0aW5nc0d1aSwgZ2FtZSk7XHJcbiAgICBib2FyZFNldHRpbmdzR3VpKHNldHRpbmdzR3VpLCBnYW1lKTtcclxuICAgIGhleGFnb25TZXR0aW5nc0d1aShzZXR0aW5nc0d1aSk7XHJcbiAgICBjb21iaW5lZFNpZGVTZXR0aW5nc0d1aShzZXR0aW5nc0d1aSk7XHJcbiAgICB0ZWFtSW5mby50ZWFtSW5mb1NldHRpbmdzR3VpKHNldHRpbmdzR3VpKTtcclxuICAgIHNpbmdsZVNpZGVTZXR0aW5nc0d1aShzZXR0aW5nc0d1aSk7XHJcbn1cclxuZnVuY3Rpb24gdXBkYXRlKGdhbWUpe31cclxud2luZG93Lm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xyXG5cdGxldCBnYW1lID0gbmV3IFBoYXNlci5HYW1lKGdsb2JhbFBhcmFtcy53aWR0aCwgZ2xvYmFsUGFyYW1zLmhlaWdodCwgUGhhc2VyLkNBTlZBUywgXCJwaGFzZXJfcGFyZW50XCIsIHtjcmVhdGU6IG9uQ3JlYXRlLCB1cGRhdGU6IHVwZGF0ZX0pO1xyXG59O1xyXG4iLCJleHBvcnQgY2xhc3MgU2luZ2xlU2lkZXtcclxuICAgIGNvbnN0cnVjdG9yKHRlYW0sIGhleCwgYm9hcmQpe1xyXG4gICAgICAgIHRoaXMudGVhbSA9IHRlYW07XHJcbiAgICAgICAgdGhpcy5oZXggPSBoZXg7XHJcbiAgICAgICAgdGhpcy5ib2FyZCA9IGJvYXJkO1xyXG4gICAgfVxyXG5cclxuICAgIG9uSW5wdXRPdmVyKGNvbWJpbmVkU2lkZVZpZXcsIHBvaW50ZXIpe1xyXG4gICAgICAgIHRoaXMuYm9hcmQuc2VsZWN0U2VjdGlvbih0aGlzKTtcclxuICAgICAgICB0aGlzLnNlbGVjdGVkID0gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICBvbklucHV0T3V0KGNvbWJpbmVkU2lkZVZpZXcsIHBvaW50ZXIpe1xyXG4gICAgICAgIHRoaXMuc2VsZWN0ZWQgPSBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgeCgpe1xyXG4gICAgICAgIHJldHVybiB0aGlzLmhleC5ncmlkQ29yZHMueDtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgeSgpe1xyXG4gICAgICAgIHJldHVybiB0aGlzLmhleC5ncmlkQ29yZHMueTtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgc2lkZSgpe1xyXG4gICAgICAgIHJldHVybiB0aGlzLmhleC5zaWRlTnVtYmVyKHRoaXMpO1xyXG4gICAgfVxyXG5cclxuICAgIGdldCBjb3Jkcygpe1xyXG4gICAgICAgIHJldHVybiB7eDogdGhpcy54LCB5OiB0aGlzLnksIHNpZGU6IHRoaXMuc2lkZX07XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IGFzU3RyaW5nKCl7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMudGVhbS5udW1iZXI7XHJcbiAgICB9XHJcbn1cclxuIiwiaW1wb3J0IHtIZXhhZ29ufSBmcm9tIFwiLi9oZXhhZ29uLmpzXCI7XHJcbmltcG9ydCB7Q29tYmluZWRTaWRlfSBmcm9tIFwiLi9jb21iaW5lZFNpZGUuanNcIjtcclxuaW1wb3J0ICogYXMgdGVhbUluZm8gZnJvbSBcIi4uL3RlYW1JbmZvLmpzXCI7XHJcbmltcG9ydCAqIGFzIGdyaWROYXZpZ2F0aW9uIGZyb20gXCIuLi9ncmlkTmF2aWdhdGlvbi5qc1wiO1xyXG5pbXBvcnQgKiBhcyBzY29yZSBmcm9tICcuLi9zY29yZS5qcyc7XHJcblxyXG5leHBvcnQgY2xhc3MgQm9hcmR7XHJcbiAgICAvL3Bhc3NpbmcgaW4geCBpcyBldmVuIG1vcmUgcmVhc29uIHRvIG1ha2UgdGhpcyBhIHBoYXNlciBvYmplY3RcclxuICAgIGNvbnN0cnVjdG9yKGRhdGFTdHJpbmcpe1xyXG4gICAgICAgIHRoaXMuaGV4YWdvbnMgPSB0aGlzLnBhcnNlRGF0YVN0cmluZyhkYXRhU3RyaW5nKTtcclxuICAgICAgICB0aGlzLmNvbWJpbmVkU2lkZXMgPSB0aGlzLmNyZWF0ZUNvbWJpbmVkTGluZXModGhpcy5oZXhhZ29ucyk7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0SGV4KHgsIHkpe1xyXG4gICAgICAgIGlmKCF0aGlzLmhleGFnb25FeGlzdHMoeCx5KSl7XHJcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmhleGFnb25zW3hdW3ldO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBnZXQgZ3JpZFdpZHRoKCl7XHJcbiAgICAgICAgaWYodGhpcy5oZXhhZ29ucy5sZW5ndGggPT09IDApe1xyXG4gICAgICAgICAgICByZXR1cm4gMDtcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuaGV4YWdvbnNbMF0ubGVuZ3RoO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBnZXQgZ3JpZEhlaWdodCgpe1xyXG4gICAgICAgIHJldHVybiB0aGlzLmhleGFnb25zLmxlbmd0aDtcclxuICAgIH1cclxuXHJcbiAgICBzZWxlY3RTZWN0aW9uKHNpbmdsZVNpZGUpe1xyXG4gICAgICAgIGxldCBjb25uZWN0aW9uU2V0ID0gc2NvcmUuZ2V0Q29ubmVjdGlvblNldChzaW5nbGVTaWRlLCBzaW5nbGVTaWRlLnRlYW0sIHRoaXMpO1xyXG4gICAgICAgIHRoaXMuc2VsZWN0ZWQgPSBjb25uZWN0aW9uU2V0O1xyXG4gICAgfVxyXG5cclxuICAgIHRlYW1IaWdobGlnaHQodGVhbSl7XHJcbiAgICAgICAgdGhpcy5zZWxlY3RlZCA9IHNjb3JlLmFsbFRlYW1TY29yZSh0aGlzLCB0ZWFtKTtcclxuICAgIH1cclxuXHJcbiAgICBnZXRDb21iaW5lZFNpZGUoY29tYmluZWRTaWRlQ29yZCl7XHJcbiAgICAgICAgLy9hbnkgY29tYmluZWRTaWRlIGhhcyAyIHZhbGlkIGNvcmRzLCBvbmUgZm9yIGVhY2ggKHgseSxzaWRlKSB0aGF0IG1ha2UgaXQgdXBcclxuICAgICAgICAvL3JlYWxseSB3ZSB3YW50IGEgTWFwIGNsYXNzIHdpdGggY3VzdG9tIGVxdWFsaXR5IG9wZXJhdG9yIGZyb20gY29tYmluZWRTaWRlQ29yZFxyXG4gICAgICAgIGxldCBvdGhlckNvcmQgPSBncmlkTmF2aWdhdGlvbi5nZXRBZGphY2VudEhleGFnb25Db3JkKGNvbWJpbmVkU2lkZUNvcmQpO1xyXG4gICAgICAgIGZvcihsZXQgcG90ZW50aWFsQ29yZCBvZiBbY29tYmluZWRTaWRlQ29yZCwgb3RoZXJDb3JkXSl7XHJcbiAgICAgICAgICAgIGxldCByb3cgPSB0aGlzLmNvbWJpbmVkU2lkZXMuZ2V0KHBvdGVudGlhbENvcmQueCk7XHJcbiAgICAgICAgICAgIGlmKHJvdyAhPT0gdW5kZWZpbmVkKXtcclxuICAgICAgICAgICAgICAgIGxldCBoZXggPSByb3cuZ2V0KHBvdGVudGlhbENvcmQueSk7XHJcbiAgICAgICAgICAgICAgICBpZihoZXggIT09IHVuZGVmaW5lZCl7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGNvbWJpbmVkU2lkZSA9IGhleC5nZXQocG90ZW50aWFsQ29yZC5zaWRlKTtcclxuICAgICAgICAgICAgICAgICAgICBpZihjb21iaW5lZFNpZGUgIT09IHVuZGVmaW5lZCl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjb21iaW5lZFNpZGU7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IGhleEFycmF5KCl7XHJcbiAgICAgICAgbGV0IGhleEFycmF5ID0gW107XHJcbiAgICAgICAgZm9yKGNvbnN0IGhleFJvdyBvZiB0aGlzLmhleGFnb25zKXtcclxuICAgICAgICAgICAgaGV4QXJyYXkgPSBoZXhBcnJheS5jb25jYXQoaGV4Um93KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGhleEFycmF5O1xyXG4gICAgfVxyXG5cclxuICAgIGdldCBjb21iaW5lZFNpZGVzQXJyYXkoKXtcclxuICAgICAgICBsZXQgYXJyYXkgPSBbXTtcclxuICAgICAgICBmb3IoY29uc3Qgcm93IG9mIHRoaXMuY29tYmluZWRTaWRlcy52YWx1ZXMoKSl7XHJcbiAgICAgICAgICAgIGZvcihjb25zdCB4eSBvZiByb3cudmFsdWVzKCkpe1xyXG4gICAgICAgICAgICAgICAgZm9yKGNvbnN0IGNvbWJpbmVkU2lkZSBvZiB4eS52YWx1ZXMoKSl7XHJcbiAgICAgICAgICAgICAgICAgICAgYXJyYXkucHVzaChjb21iaW5lZFNpZGUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBhcnJheTtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgZGF0YVN0cmluZygpe1xyXG4gICAgICAgIGxldCByb3dzID0gW107XHJcbiAgICAgICAgZm9yKGxldCByb3cgb2YgdGhpcy5oZXhhZ29ucyl7XHJcbiAgICAgICAgICAgIGxldCBoZXhhZ29ucyA9IFtdO1xyXG4gICAgICAgICAgICBmb3IobGV0IGhleGFnb24gb2Ygcm93KXtcclxuICAgICAgICAgICAgICAgIGhleGFnb25zLnB1c2goaGV4YWdvbi5zaWRlc0FzU3RyaW5nKCkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJvd3MucHVzaChoZXhhZ29ucy5qb2luKFwiaFwiKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByb3dzLmpvaW4oXCJyXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIGhleGFnb25FeGlzdHMoeCx5KXtcclxuICAgICAgICBpZih4IDwgMCl7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9ZWxzZSBpZih4ID49IHRoaXMuaGV4YWdvbnMubGVuZ3RoKXtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1lbHNlIGlmKHkgPCAwKXtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1lbHNlIGlmKHkgPj0gdGhpcy5oZXhhZ29uc1t4XS5sZW5ndGgpe1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBtb3ZlVG9BZGphY2VudENvbWJpbmVkU2lkZShjb21iaW5lZFNpZGVDb3JkLCBkaXJlY3Rpb24pe1xyXG4gICAgICAgIC8qcmV0dXJucyBjby1vcmRpbmF0ZXMgb2YgYW4gYWRqYWNlbnQgY29tYmluZWRTaWRlXHJcbiAgICAgICAgdGhpcyB3b3JrcyBieSBsb29raW5nIGF0IGEgY29tYmluZWQgc2lkZSBhcyBoYXZpbmcgNCBuZWlnaGJvdXJpbmcgY29tYmluZWRTaWRlc1xyXG4gICAgICAgIHRoZXNlIGxvb2sgbGlrZSBhIGJvd3RpZTpcclxuICAgICAgICAgXFwtMSAgICAgICAgICAgICArMSAgL1xyXG4gICAgICAgICAgXFwgICAgICAgICAgICAgICAgIC9cclxuICAgICAgICAgICBcXCAgICAgICAgICAgICAgIC9cclxuICAgICAgICAgICAgLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAgICAgICAgLyAgW3N1cHBsaWVkICAgICBcXFxyXG4gICAgICAgICAgLyAgICBoZXhhZ29uICAgICAgIFxcXHJcbiAgICAgICAgIC8gLTIgICBzaWRlXSAgICAgICsyIFxcXHJcbiAgICAgICAgIFRoaXMgZXhhbXBsZSB3b3VsZCBiZSBpZiBzaWRlPTAgd2FzIHN1cHBsaWVkLlxyXG4gICAgICAgICBEaXJlY3Rpb24gZGVub3RlcyB3aGljaCBzcG9rZSAoLTIsLTEsKzEsKzIpIHlvdSdyZSBhc2tpbmcgYWJvdXQuXHJcbiAgICAgICAgIHRoZSBudW1iZXJpbmcgaXMgcmVsYXRpdmUsIHNvIHNwb2tlcyAtMiBhbmQgKzIgYXJlIGFsd2F5cyBzaWRlcyBvZiB0aGUgY2VudHJhbCBoZXhhZ29uXHJcbiAgICAgICAgIGV2ZW4gYXMgc2lkZSBudW1iZXIgY2hhbmdlcy5cclxuICAgICAgICAgKi9cclxuICAgICAgICAgbGV0IG5ld0NvcmQ7XHJcbiAgICAgICAgIGlmKGRpcmVjdGlvbiA9PT0gLTIpe1xyXG4gICAgICAgICAgICBuZXdDb3JkID0ge1xyXG4gICAgICAgICAgICAgICAgIHg6IGNvbWJpbmVkU2lkZUNvcmQueCxcclxuICAgICAgICAgICAgICAgICB5OiBjb21iaW5lZFNpZGVDb3JkLnksXHJcbiAgICAgICAgICAgICAgICAgc2lkZTogKGNvbWJpbmVkU2lkZUNvcmQuc2lkZSAtIDEgKyA2KSU2IC8vKzYgdG8gc3RvcCBuZWdhYXRpdmVzXHJcbiAgICAgICAgICAgICB9O1xyXG4gICAgICAgICB9ZWxzZSBpZihkaXJlY3Rpb24gPT09ICsyKXtcclxuICAgICAgICAgICAgIG5ld0NvcmQgPSB7XHJcbiAgICAgICAgICAgICAgICAgeDogY29tYmluZWRTaWRlQ29yZC54LFxyXG4gICAgICAgICAgICAgICAgIHk6IGNvbWJpbmVkU2lkZUNvcmQueSxcclxuICAgICAgICAgICAgICAgICBzaWRlOiAoY29tYmluZWRTaWRlQ29yZC5zaWRlICsgMSklNlxyXG4gICAgICAgICAgICAgfTtcclxuICAgICAgICAgfWVsc2UgaWYoZGlyZWN0aW9uID09PSAtMSl7XHJcbiAgICAgICAgICAgICBuZXdDb3JkID0gZ3JpZE5hdmlnYXRpb24uZ2V0QWRqYWNlbnRIZXhhZ29uQ29yZChjb21iaW5lZFNpZGVDb3JkKTtcclxuICAgICAgICAgICAgIG5ld0NvcmQuc2lkZSA9IChuZXdDb3JkLnNpZGUgKyAxKSU2O1xyXG4gICAgICAgICB9ZWxzZSBpZihkaXJlY3Rpb24gPT09ICsxKXtcclxuICAgICAgICAgICAgICBuZXdDb3JkID0gZ3JpZE5hdmlnYXRpb24uZ2V0QWRqYWNlbnRIZXhhZ29uQ29yZChjb21iaW5lZFNpZGVDb3JkKTtcclxuICAgICAgICAgICAgICBuZXdDb3JkLnNpZGUgPSAobmV3Q29yZC5zaWRlIC0gMSArIDYpJTY7IC8vKzYgdG8gc3RvcCBuZWdhYXRpdmVzXHJcbiAgICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJpbnZhbGlkIGRpcmVjdGlvbiBzdXBwbGllZCBcIiArIGRpcmVjdGlvbik7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0Q29tYmluZWRTaWRlKG5ld0NvcmQpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vY291bGQgdGhpcyBiZSBzaW1wbGlmaWVkIGlmIHdlIHN0dWNrIGFuIGV4dHJhIGJvYXJkZXIgb2YgXCJub24tbW92ZVwiIGhleGFnb25zIHJvdW5kIHRoZSBlZGdlP1xyXG4gICAgLy90byBtYWtlIHNpZGUgY2FsY3Mgc2ltcGxpZmVyXHJcbiAgICBjcmVhdGVDb21iaW5lZExpbmVzKGhleGFnb25zKXtcclxuICAgICAgICBsZXQgY29tYmluZWRTaWRlcyA9IG5ldyBNYXAoKTtcclxuICAgICAgICBmb3IobGV0IHggPSAwOyB4IDwgaGV4YWdvbnMubGVuZ3RoOyB4Kyspe1xyXG4gICAgICAgICAgICBjb21iaW5lZFNpZGVzLnNldCh4LCBuZXcgTWFwKCkpO1xyXG4gICAgICAgICAgICBmb3IobGV0IHkgPSAwOyB5IDwgaGV4YWdvbnNbeF0ubGVuZ3RoOyB5Kyspe1xyXG4gICAgICAgICAgICAgICAgY29tYmluZWRTaWRlcy5nZXQoeCkuc2V0KHksIG5ldyBNYXAoKSk7XHJcbiAgICAgICAgICAgICAgICBsZXQgY2VudGVySGV4YWdvbiA9IGhleGFnb25zW3hdW3ldO1xyXG4gICAgICAgICAgICAgICAgZm9yKGxldCBzaWRlTnVtYmVyID0gMDsgc2lkZU51bWJlciA8IDY7IHNpZGVOdW1iZXIrKyl7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGhleEluZm8gPSBbe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBoZXhhZ29uOiBjZW50ZXJIZXhhZ29uLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzaWRlOiBzaWRlTnVtYmVyXHJcbiAgICAgICAgICAgICAgICAgICAgfV07XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGhleGFnb24yQ29vcmRpbmF0ZXMgPSBncmlkTmF2aWdhdGlvbi5nZXRBZGphY2VudEhleGFnb25Db3JkKHt4OiB4LCB5OiB5LCBzaWRlOiBzaWRlTnVtYmVyfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGhleGFnb24yRXhpc3RzID0gdGhpcy5oZXhhZ29uRXhpc3RzKGhleGFnb24yQ29vcmRpbmF0ZXMueCwgaGV4YWdvbjJDb29yZGluYXRlcy55KTtcclxuICAgICAgICAgICAgICAgICAgICAvL3NpZGVzIG51bWJlcmVkIGFib3ZlIDMgYXJlIGNvdmVyZWQgd2hlbiB3ZSBpdGVyYXRlIG92ZXIgdGhlIG90aGVyIGhleGFnb24gKHNvIHdlIGRvbid0IGNyZWF0ZSBldmVyeSBjb21iaW5lIHR3aWNlKVxyXG4gICAgICAgICAgICAgICAgICAgIGlmKCFoZXhhZ29uMkV4aXN0cyB8fCBzaWRlTnVtYmVyIDwgMyl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKGhleGFnb24yRXhpc3RzKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgaGV4SW5mby5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhleGFnb246IGhleGFnb25zW2hleGFnb24yQ29vcmRpbmF0ZXMueF1baGV4YWdvbjJDb29yZGluYXRlcy55XSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpZGU6IChzaWRlTnVtYmVyICsgMykgJSA2XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBjb21iaW5lZFNpZGUgPSBuZXcgQ29tYmluZWRTaWRlKHt4OiB4LCB5OiB5LCBzaWRlOiBzaWRlTnVtYmVyfSwgdGhpcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbWJpbmVkU2lkZXMuZ2V0KHgpLmdldCh5KS5zZXQoc2lkZU51bWJlciwgY29tYmluZWRTaWRlKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGNvbWJpbmVkU2lkZXM7XHJcbiAgICB9XHJcblxyXG4gICAgLy9pcyB0aGlzIGJldHRlciBkZWZpbmVkIGFzIGhleGFnb24gY2xhc3MgbWV0aG9kP1xyXG4gICAgaGV4YWdvbklucHV0KGNsaWNrZWRIZXhhZ29uKXtcclxuICAgICAgICB0ZWFtSW5mby5tYWtlTW92ZSgpO1xyXG4gICAgICAgIGNsaWNrZWRIZXhhZ29uLmRhdGEubW9kZWwucm90YXRlKDEpO1xyXG4gICAgICAgIGlmKHRlYW1JbmZvLmVuZE9mUm91bmQoKSl7XHJcbiAgICAgICAgICAgIGZvcihsZXQgdGVhbSBvZiB0ZWFtSW5mby50ZWFtcyl7XHJcbiAgICAgICAgICAgICAgICB0ZWFtLnNjb3JlICs9IHNjb3JlLmFsbFRlYW1TY29yZSh0aGlzLCB0ZWFtKS5zY29yZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwYXJzZURhdGFTdHJpbmcoc3RyaW5nKXtcclxuICAgICAgICBsZXQgaGV4YWdvbnMgPSBbXTtcclxuICAgICAgICBmb3IobGV0IFt4LCByb3dEYXRhXSBvZiBzdHJpbmcuc3BsaXQoXCJyXCIpLmVudHJpZXMoKSl7XHJcbiAgICAgICAgICAgIGxldCByb3cgPSBbXTtcclxuICAgICAgICAgICAgZm9yKGxldCBbeSwgaGV4YWdvbkRhdGFdIG9mIHJvd0RhdGEuc3BsaXQoXCJoXCIpLmVudHJpZXMoKSl7XHJcbiAgICAgICAgICAgICAgICBsZXQgaGV4YWdvbiA9IG5ldyBIZXhhZ29uKGhleGFnb25EYXRhLCB7eDogeCwgeTogeX0sIHRoaXMpO1xyXG4gICAgICAgICAgICAgICAgcm93LnB1c2goaGV4YWdvbik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaGV4YWdvbnMucHVzaChyb3cpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gaGV4YWdvbnM7XHJcbiAgICB9XHJcblxyXG59XHJcbiIsImltcG9ydCAqIGFzIGdyaWROYXZpZ2F0aW9uIGZyb20gJy4uL2dyaWROYXZpZ2F0aW9uLmpzJztcclxuXHJcbmxldCBzY29yaW5nID0ge1xyXG4gICAgc2luZ2xlQ29sb3I6IDEsXHJcbiAgICBkb3VibGVDb2xvcjogMlxyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGNvbWJpbmVkU2lkZUdhbWVTZXR0aW5nc0d1aShndWkpe1xyXG4gICAgbGV0IGZvbGRlciA9IGd1aS5hZGRGb2xkZXIoJ2NvbWJpbmVkIHNpZGUgZ2FtZSBzZXR0aW5ncycpO1xyXG4gICAgZm9sZGVyLmFkZChzY29yaW5nLCAnc2luZ2xlQ29sb3InLCAwLDUwKS5zdGVwKDEpO1xyXG4gICAgZm9sZGVyLmFkZChzY29yaW5nLCAnZG91YmxlQ29sb3InLCAwLCA1MCkuc3RlcCgxKTtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIENvbWJpbmVkU2lkZXtcclxuICAgIGNvbnN0cnVjdG9yKGNvcmRzLCBib2FyZCl7XHJcbiAgICAgICAgaWYoYm9hcmQuZ2V0SGV4KGNvcmRzLngsIGNvcmRzLnkpID09PSB1bmRlZmluZWQpe1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJjb21iaW5lZCBzaWRlJ3MgZGVmYXVsdCB4LHkgbXVzdCBiZSBhIGhleCBvbiB0aGUgbWFwXCIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnggPSBjb3Jkcy54O1xyXG4gICAgICAgIHRoaXMueSA9IGNvcmRzLnk7XHJcbiAgICAgICAgdGhpcy5zaWRlID0gY29yZHMuc2lkZTtcclxuICAgICAgICB0aGlzLmJvYXJkID0gYm9hcmQ7XHJcbiAgICB9XHJcblxyXG4gICAgb25JbnB1dE92ZXIoY29tYmluZWRTaWRlVmlldywgcG9pbnRlcil7XHJcbiAgICAgICAgLy90aGlzLmJvYXJkLnNlbGVjdFNlY3Rpb24odGhpcyk7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IHNlbGVjdGVkKCl7XHJcbiAgICAgICAgaWYodGhpcy5ib2FyZC5zZWxlY3RlZCAhPT0gdW5kZWZpbmVkKXtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuYm9hcmQuc2VsZWN0ZWQuY29tYmluZWRTaWRlcy5oYXModGhpcyk7XHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIHJldHVybiAwO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBnZXQgc2NvcmUoKXtcclxuICAgICAgICBsZXQgc2NvcmUgPSAwO1xyXG4gICAgICAgIGxldCB0ZWFtcyA9IHRoaXMuaGV4U2lkZVRlYW1zO1xyXG4gICAgICAgIGlmKHRlYW1zLmxlbmd0aCA9PT0gMiAmJiB0ZWFtc1swXSA9PT0gdGVhbXNbMV0pe1xyXG4gICAgICAgICAgICByZXR1cm4gc2NvcmluZy5kb3VibGVDb2xvcjtcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgcmV0dXJuIHNjb3Jpbmcuc2luZ2xlQ29sb3I7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGVxdWFscyhjb21iaW5lZFNpZGVDb3JkKXtcclxuICAgICAgICAgZnVuY3Rpb24gY29yZEVxdWFsaXR5KGNvcmQxLCBjb3JkMil7XHJcbiAgICAgICAgICAgICByZXR1cm4gY29yZDEueCA9PT0gY29yZDIueCAmJiBjb3JkMS55ID09PSBjb3JkMi55ICYmIGNvcmQxLnNpZGUgPT09IGNvcmQyLnNpZGU7XHJcbiAgICAgICAgIH1cclxuICAgICAgICAgcmV0dXJuIGNvcmRFcXVhbGl0eShjb21iaW5lZFNpZGVDb3JkLCB0aGlzLmNvcmRzKSB8fCBjb3JkRXF1YWxpdHkoY29tYmluZWRTaWRlQ29yZCwgdGhpcy5hbHRlcm5hdGl2ZUNvcmRzKTtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgYWx0ZXJuYXRpdmVDb3Jkcygpe1xyXG4gICAgICAgIHJldHVybiBncmlkTmF2aWdhdGlvbi5nZXRBZGphY2VudEhleGFnb25Db3JkKHRoaXMpO1xyXG4gICAgfVxyXG5cclxuICAgIGdldCBjb3Jkcygpe1xyXG4gICAgICAgIHJldHVybiB7eDogdGhpcy54LCB5OiB0aGlzLnksIHNpZGU6IHRoaXMuc2lkZX07XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IGhleFNpZGVUZWFtcygpe1xyXG4gICAgICAgIGxldCB0ZWFtSW5mbyA9IFtdO1xyXG4gICAgICAgIGZvcihsZXQgY29yZHMgb2YgW3RoaXMuY29yZHMsIHRoaXMuYWx0ZXJuYXRpdmVDb3Jkc10pe1xyXG4gICAgICAgICAgICBsZXQgaGV4ID0gdGhpcy5ib2FyZC5nZXRIZXgoY29yZHMueCwgY29yZHMueSk7XHJcbiAgICAgICAgICAgIGlmKGhleCAhPT0gdW5kZWZpbmVkKXtcclxuICAgICAgICAgICAgICAgIHRlYW1JbmZvLnB1c2goaGV4LnNpZGUoY29yZHMuc2lkZSkudGVhbSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRlYW1JbmZvO1xyXG4gICAgfVxyXG5cclxufVxyXG4iLCJpbXBvcnQge3RlYW1zfSBmcm9tIFwiLi4vdGVhbUluZm8uanNcIjtcclxuaW1wb3J0IHtTaW5nbGVTaWRlfSBmcm9tIFwiLi9TaW5nbGVTaWRlLmpzXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgSGV4YWdvbntcclxuICAgIGNvbnN0cnVjdG9yKGRhdGFTdHJpbmcsIGdyaWRDb3JkcywgYm9hcmQpe1xyXG4gICAgICAgIHRoaXMuc2lkZXMgPSBbXTtcclxuICAgICAgICBmb3IobGV0IHNpZGUgb2YgZGF0YVN0cmluZy5zcGxpdChcIjpcIikpe1xyXG4gICAgICAgICAgICBsZXQgdGVhbSA9IHRlYW1zW3NpZGVdO1xyXG4gICAgICAgICAgICB0aGlzLnNpZGVzLnB1c2gobmV3IFNpbmdsZVNpZGUodGVhbSwgdGhpcywgYm9hcmQpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYodGhpcy5zaWRlcy5sZW5ndGggIT0gNil7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcImluY29ycmVjdCBudW1iZXIgb2Ygc2lkZXM6IFwiICsgc2lkZXMubGVuZ3RoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5jb21iaW5lZFNpZGVzID0gbmV3IE1hcCgpO1xyXG4gICAgICAgIHRoaXMuZ3JpZENvcmRzID0gZ3JpZENvcmRzO1xyXG4gICAgfVxyXG5cclxuICAgIHNpZGVOdW1iZXIoc2lkZSl7XHJcbiAgICAgICAgZm9yKGxldCBbc2lkZU51bWJlciwgcG90ZW50aWFsTWF0Y2hdIG9mIHRoaXMuc2lkZXMuZW50cmllcygpKXtcclxuICAgICAgICAgICAgaWYoc2lkZSA9PT0gcG90ZW50aWFsTWF0Y2gpe1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHNpZGVOdW1iZXI7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgIH1cclxuXHJcbiAgICBzaWRlKG51bWJlcil7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc2lkZXNbbnVtYmVyXTtcclxuICAgIH1cclxuXHJcbiAgICBzaWRlc0FzU3RyaW5nKCl7XHJcbiAgICAgICAgbGV0IHNpZGVzID0gW107XHJcbiAgICAgICAgZm9yKGxldCBzaWRlIG9mIHRoaXMuc2lkZXMpe1xyXG4gICAgICAgICAgICBzaWRlcy5wdXNoKHNpZGUuYXNTdHJpbmcpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gc2lkZXMuam9pbihcIjpcIik7XHJcbiAgICB9XHJcblxyXG4gICAgcm90YXRlKGFtb3VudCl7XHJcbiAgICAgICAgYW1vdW50ID0gYW1vdW50ICUgNjtcclxuICAgICAgICAvL2ZvciBhbnRpLWNsb2Nrd2lzZVxyXG4gICAgICAgIGlmKGFtb3VudCA8IDApe1xyXG4gICAgICAgICAgICBsZXQgYWJzb2x1dGVBbW91bnQgPSBhbW91bnQqLTE7XHJcbiAgICAgICAgICAgIGFtb3VudCA9IDYtYWJzb2x1dGVBbW91bnQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZvcihsZXQgaT0wO2k8YW1vdW50O2krKyl7XHJcbiAgICAgICAgICAgIHRoaXMuc2lkZXMudW5zaGlmdCh0aGlzLnNpZGVzLnBvcCgpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuIiwiaW1wb3J0ICogYXMgZ3JpZE5hdmlnYXRpb24gZnJvbSBcIi4vZ3JpZE5hdmlnYXRpb24uanNcIjtcclxuaW1wb3J0ICogYXMgdGVhbUluZm8gZnJvbSBcIi4vdGVhbUluZm8uanNcIjtcclxuXHJcbmxldCBib2FyZFNldHRpbmdzID0ge1xyXG4gICAgc3BhY2VGYWN0b3I6IDAuNlxyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHNjb3JlU2V0dGluZ3NHdWkoZ3VpLCBnYW1lKXtcclxuICAgIGd1aS5hZGQoYm9hcmRTZXR0aW5ncywgJ3NwYWNlRmFjdG9yJywgMCwgMik7XHJcbn1cclxuXHJcbmNsYXNzIENvbm5lY3Rpb25TZXR7XHJcbiAgICBjb25zdHJ1Y3Rvcihjb21iaW5lZFNpZGVzKXtcclxuICAgICAgICB0aGlzLmNvbWJpbmVkU2lkZXMgPSBjb21iaW5lZFNpZGVzO1xyXG4gICAgfVxyXG5cclxuICAgIGdldCBzY29yZSgpe1xyXG4gICAgICAgIGxldCBwZXJTaWRlQm9udXMgPSAxO1xyXG4gICAgICAgIGxldCBzY29yZSA9IDA7XHJcbiAgICAgICAgLy9sZXQgY291bnQgPSAwO1xyXG4gICAgICAgIGZvcihsZXQgY29tYmluZWRTaWRlIG9mIHRoaXMuY29tYmluZWRTaWRlcyl7XHJcbiAgICAgICAgICAgIHNjb3JlICs9IGNvbWJpbmVkU2lkZS5zY29yZTtcclxuICAgICAgICAgICAgLy9jb3VudCArPSAxO1xyXG4gICAgICAgICAgICAvL3Njb3JlICs9IHBlclNpZGVCb251cyAqIGNvdW50O1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gc2NvcmU7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBhbGxUZWFtU2NvcmUoYm9hcmQsIHRlYW0pe1xyXG4gICAgbGV0IGNvbm5lY3Rpb25TZXRzID0gW107XHJcbiAgICBsZXQgYWxsU2VhcmNoZWRTaWRlcyA9IG5ldyBTZXQoKTtcclxuICAgIGZvcihsZXQgaGV4IG9mIGJvYXJkLmhleEFycmF5KXtcclxuICAgICAgICBmb3IobGV0IHNpZGUgb2YgaGV4LnNpZGVzKXtcclxuICAgICAgICAgICAgaWYoIWFsbFNlYXJjaGVkU2lkZXMuaGFzKHNpZGUpKXtcclxuICAgICAgICAgICAgICAgIGxldCBuZXdDb25uZWN0aW9uU2V0ID0gZ2V0Q29ubmVjdGlvblNldChzaWRlLCB0ZWFtLCBib2FyZCk7XHJcbiAgICAgICAgICAgICAgICBjb25uZWN0aW9uU2V0cy5wdXNoKG5ld0Nvbm5lY3Rpb25TZXQpO1xyXG4gICAgICAgICAgICAgICAgYWxsU2VhcmNoZWRTaWRlcyA9IG5ldyBTZXQoWy4uLmFsbFNlYXJjaGVkU2lkZXMsIC4uLm5ld0Nvbm5lY3Rpb25TZXQuY29tYmluZWRTaWRlc10pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIG5ldyBDb25uZWN0aW9uU2V0KGFsbFNlYXJjaGVkU2lkZXMpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBhbHJlYWR5VXNlZChjb25uZWN0cywgY29tYmluZWRTaWRlLCBib2FyZCl7XHJcbiAgICBmb3IobGV0IGNvcmQgb2YgW2NvbWJpbmVkU2lkZSwgYm9hcmQuZ2V0Q29tYmluZWRTaWRlKGNvbWJpbmVkU2lkZS5hbHRlcm5hdGl2ZUNvcmRzKV0pe1xyXG4gICAgICAgIGZvcihsZXQgY29ubmVjdCBvZiBjb25uZWN0cyl7XHJcbiAgICAgICAgICAgIGlmKGNvbm5lY3QuZ2V0KGNvbWJpbmVkU2lkZSkgIT09IHVuZGVmaW5lZCl7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBmYWxzZTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldENvbm5lY3Rpb25TZXQoc3RhcnRDb3JkLCB0ZWFtLCBib2FyZCl7XHJcbiAgICBsZXQgc3RhcnRDb21iaW5lZFNpZGUgPSBib2FyZC5nZXRDb21iaW5lZFNpZGUoc3RhcnRDb3JkKTtcclxuICAgIGxldCBjb25uZWN0aW9uID0gbmV3IFNldCgpO1xyXG4gICAgZm9yKGxldCBuZXh0VGVhbSBvZiBzdGFydENvbWJpbmVkU2lkZS5oZXhTaWRlVGVhbXMpe1xyXG4gICAgICAgIGlmKHRlYW0gPT09IG5leHRUZWFtKXtcclxuICAgICAgICAgICAgZ3Jvd0Nvbm5lY3QoYm9hcmQsIHN0YXJ0Q29tYmluZWRTaWRlLCBjb25uZWN0aW9uLCBuZXh0VGVhbSk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBuZXcgQ29ubmVjdGlvblNldChjb25uZWN0aW9uKTtcclxufVxyXG5cclxuLy93YXJuaW5nOiBleGlzdGluZyBub2RlcyBpcyBzaGl0dGlseSB1cGRhdGUgaW4gZnVuY3Rpb24sIG5vdCByZXV0cm5lZFxyXG5mdW5jdGlvbiBncm93Q29ubmVjdChib2FyZCwgY3VycmVudENvbWJpbmVkU2lkZSwgZXhpc3RpbmdOb2RlcywgdGVhbSl7XHJcbiAgICBleGlzdGluZ05vZGVzLmFkZChjdXJyZW50Q29tYmluZWRTaWRlKTtcclxuICAgIGZvcihsZXQgZGlyZWN0aW9uIG9mIFstMiwtMSwxLDJdKXtcclxuICAgICAgICBsZXQgbmV4dENvbWJpbmVkID0gYm9hcmQubW92ZVRvQWRqYWNlbnRDb21iaW5lZFNpZGUoY3VycmVudENvbWJpbmVkU2lkZSwgZGlyZWN0aW9uKTtcclxuICAgICAgICBpZihuZXh0Q29tYmluZWQgIT09IHVuZGVmaW5lZCAmJiAhZXhpc3RpbmdOb2Rlcy5oYXMobmV4dENvbWJpbmVkKSl7XHJcbiAgICAgICAgICAgIGZvcihsZXQgbmV4dFRlYW0gb2YgbmV4dENvbWJpbmVkLmhleFNpZGVUZWFtcyl7XHJcbiAgICAgICAgICAgICAgICBpZih0ZWFtID09PSBuZXh0VGVhbSl7XHJcbiAgICAgICAgICAgICAgICAgICAgZ3Jvd0Nvbm5lY3QoYm9hcmQsIG5leHRDb21iaW5lZCwgZXhpc3RpbmdOb2RlcywgdGVhbSk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuIiwiZXhwb3J0IGxldCBtYXBwaW5nRm9yRGF0R3VpID0gbmV3IE1hcChbXHJcbiAgICBbXCJyYW5kb21cIiwgcmFuZG9tXSxcclxuICAgIFtcImV2ZW5cIiwgZXZlbl1cclxuXSk7XHJcblxyXG5mdW5jdGlvbiBidWlsZEJvYXJkKHNpZGVHZW5lcmF0b3IsIGdyaWRXaWR0aCwgZ3JpZEhlaWdodCl7XHJcbiAgICBsZXQgcm93cyA9IFtdO1xyXG4gICAgZm9yKGxldCByb3c9MDsgcm93PGdyaWRXaWR0aDsgcm93Kyspe1xyXG4gICAgICAgIGxldCBoZXhhZ29ucyA9IFtdO1xyXG4gICAgICAgIGZvcihsZXQgaGVpZ2h0PTA7IGhlaWdodDxncmlkSGVpZ2h0OyBoZWlnaHQrKyl7XHJcbiAgICAgICAgICAgIGxldCBzaWRlcyA9IFtdO1xyXG4gICAgICAgICAgICBmb3IobGV0IHNpZGUgb2Ygc2lkZUdlbmVyYXRvcigpKXtcclxuICAgICAgICAgICAgICAgIHNpZGVzLnB1c2goc2lkZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaGV4YWdvbnMucHVzaChzaWRlcy5qb2luKFwiOlwiKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJvd3MucHVzaChoZXhhZ29ucy5qb2luKFwiaFwiKSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcm93cy5qb2luKFwiclwiKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHJhbmRvbSh0ZWFtcywgZ3JpZFdpZHRoLCBncmlkSGVpZ2h0KXtcclxuICAgIGZ1bmN0aW9uIHNpZGVHZW5lcmF0b3IoKXtcclxuICAgICAgICBsZXQgc2lkZXMgPSBbXTtcclxuICAgICAgICBmb3IobGV0IHNpZGVOdW1iZXIgPSAwOyBzaWRlTnVtYmVyIDwgNjsgc2lkZU51bWJlcisrKXtcclxuICAgICAgICAgICAgc2lkZXMucHVzaChNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkqdGVhbXMubGVuZ3RoKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBzaWRlcztcclxuICAgIH1cclxuICAgIHJldHVybiBidWlsZEJvYXJkKHNpZGVHZW5lcmF0b3IsIGdyaWRXaWR0aCwgZ3JpZEhlaWdodCk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBldmVuKHRlYW1zLCBncmlkV2lkdGgsIGdyaWRIZWlnaHQpe1xyXG4gICAgZnVuY3Rpb24gc2lkZUdlbmVyYXRvcigpe1xyXG4gICAgICAgIGxldCBzaWRlcyA9IFtdO1xyXG4gICAgICAgIGZvcihsZXQgc2lkZU51bWJlciA9IDA7IHNpZGVOdW1iZXIgPCA2OyBzaWRlTnVtYmVyKyspe1xyXG4gICAgICAgICAgICBzaWRlcy5wdXNoKHNpZGVOdW1iZXIldGVhbXMubGVuZ3RoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHNpZGVzO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGJ1aWxkQm9hcmQoc2lkZUdlbmVyYXRvciwgZ3JpZFdpZHRoLCBncmlkSGVpZ2h0KTtcclxufVxyXG4iLCJleHBvcnQgbGV0IHNldHRpbmdzID0ge1xyXG4gICAgc3RhbmRhcmRNb3ZlTGltaXQ6IDRcclxufTtcclxuXHJcbmV4cG9ydCBsZXQgdGVhbXMgPSBbXHJcbiAgICB7XHJcbiAgICAgICAgbnVtYmVyOiAwLFxyXG4gICAgICAgIGNvbG91cjogMHhmZjAwMDAsXHJcbiAgICAgICAgbW92ZXNMZWZ0OiBzZXR0aW5ncy5zdGFuZGFyZE1vdmVMaW1pdCxcclxuICAgICAgICBzY29yZTogMFxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBudW1iZXI6IDEsXHJcbiAgICAgICAgY29sb3VyOiAweGViZmYwMCxcclxuICAgICAgICBtb3Zlc0xlZnQ6IHNldHRpbmdzLnN0YW5kYXJkTW92ZUxpbWl0LFxyXG4gICAgICAgIHNjb3JlOiAwXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIG51bWJlcjogMixcclxuICAgICAgICBjb2xvdXI6IDB4MDAwMGZmLFxyXG4gICAgICAgIG1vdmVzTGVmdDogc2V0dGluZ3Muc3RhbmRhcmRNb3ZlTGltaXQsXHJcbiAgICAgICAgc2NvcmU6IDBcclxuICAgIH1cclxuXTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB0ZWFtSW5mb1NldHRpbmdzR3VpKGd1aSl7XHJcbiAgICBsZXQgZm9sZGVyID0gZ3VpLmFkZEZvbGRlcigndGVhbSBzZXR0aW5zJyk7XHJcbiAgICBmb2xkZXIuYWRkQ29sb3IodGVhbXNbMF0sICdjb2xvdXInKTtcclxuICAgIGZvbGRlci5hZGRDb2xvcih0ZWFtc1sxXSwgJ2NvbG91cicpO1xyXG4gICAgZm9sZGVyLmFkZENvbG9yKHRlYW1zWzJdLCAnY29sb3VyJyk7XHJcbiAgICBmb2xkZXIuYWRkKHNldHRpbmdzLCAnc3RhbmRhcmRNb3ZlTGltaXQnLCAxLCAxMCkuc3RlcCgxKTtcclxufVxyXG5cclxuZXhwb3J0IGxldCBjdXJyZW50VGVhbSA9IHRlYW1zWzBdO1xyXG5leHBvcnQgbGV0IGN1cnJlbnRSb3VuZCA9IDA7XHJcbmV4cG9ydCBmdW5jdGlvbiBlbmRPZlJvdW5kKCl7XHJcbiAgICByZXR1cm4gY3VycmVudFRlYW0ubnVtYmVyID09PSAwICYmIGN1cnJlbnRUZWFtLm1vdmVzTGVmdCA9PT0gc2V0dGluZ3Muc3RhbmRhcmRNb3ZlTGltaXQ7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBtYWtlTW92ZSgpe1xyXG4gICAgY3VycmVudFRlYW0ubW92ZXNMZWZ0IC09IDE7XHJcbiAgICBpZihjdXJyZW50VGVhbS5tb3Zlc0xlZnQgPT09IDApe1xyXG4gICAgICAgIGN1cnJlbnRUZWFtID0gdGVhbXNbKGN1cnJlbnRUZWFtLm51bWJlciArIDEpJXRlYW1zLmxlbmd0aF07XHJcbiAgICAgICAgY3VycmVudFRlYW0ubW92ZXNMZWZ0ID0gc2V0dGluZ3Muc3RhbmRhcmRNb3ZlTGltaXQ7XHJcbiAgICB9XHJcbn1cclxuIiwiaW1wb3J0ICogYXMgZ2VvbWV0cnkgZnJvbSBcIi4uL2dlb21ldHJ5LmpzXCI7XHJcblxyXG5sZXQgbGluZVN0eWxlID0ge1xyXG4gICAgdGhpY2tuZXNzOiA1LFxyXG4gICAgYWxwaGE6IDFcclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBzaW5nbGVTaWRlU2V0dGluZ3NHdWkoZ3VpKXtcclxuICAgIGxldCBmb2xkZXIgPSBndWkuYWRkRm9sZGVyKCdzaW5nbGUgc2lkZSBncmFwaGljcycpO1xyXG4gICAgZm9sZGVyLmFkZChsaW5lU3R5bGUsICd0aGlja25lc3MnLCAwLDIwKTtcclxuICAgIGZvbGRlci5hZGQobGluZVN0eWxlLCAnYWxwaGEnLCAwLCAxKTtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIFNpbmdsZVNpZGUgZXh0ZW5kcyBQaGFzZXIuU3ByaXRle1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKGdhbWUsIHgsIHksIGJvYXJkVmlldywgbW9kZWwpe1xyXG4gICAgICAgIHN1cGVyKGdhbWUsIHgsIHkpO1xyXG4gICAgICAgIHRoaXMuZGF0YS5ib2FyZFZpZXcgPSBib2FyZFZpZXc7XHJcbiAgICAgICAgdGhpcy5kYXRhLm1vZGVsID0gbW9kZWw7XHJcbiAgICAgICAgbGV0IGhleFBvaW50cyA9IGdlb21ldHJ5LnJlbGF0aXZlU2NhbGVkSGV4UG9pbnRzKHRoaXMuZGF0YS5ib2FyZFZpZXcuaW5uZXJTaWRlTGVuZ3RoKTtcclxuICAgICAgICBsZXQgc3RhcnQgPSBoZXhQb2ludHNbdGhpcy5kYXRhLm1vZGVsLmNvcmRzLnNpZGVdO1xyXG4gICAgICAgIHRoaXMuZGF0YS5ncmFwaGljcyA9IG5ldyBQaGFzZXIuR3JhcGhpY3MoZ2FtZSwgc3RhcnQueCwgc3RhcnQueSk7XHJcbiAgICAgICAgdGhpcy5hZGRDaGlsZCh0aGlzLmRhdGEuZ3JhcGhpY3MpO1xyXG4gICAgICAgIHRoaXMuZGF0YS5ncmFwaGljcy5pbnB1dEVuYWJsZWQgPSB0cnVlO1xyXG4gICAgICAgIHRoaXMuZGF0YS5ncmFwaGljcy5ldmVudHMub25JbnB1dE92ZXIuYWRkKHRoaXMuZGF0YS5tb2RlbC5vbklucHV0T3ZlciwgdGhpcy5kYXRhLm1vZGVsKTtcclxuICAgICAgICB0aGlzLmRhdGEuZ3JhcGhpY3MuZXZlbnRzLm9uSW5wdXRPdXQuYWRkKHRoaXMuZGF0YS5tb2RlbC5vbklucHV0T3V0LCB0aGlzLmRhdGEubW9kZWwpO1xyXG4gICAgfVxyXG5cclxuICAgIHJlZnJlc2hQb3NpdGlvbigpe1xyXG4gICAgICAgIGxldCBoZXhQb2ludHMgPSBnZW9tZXRyeS5yZWxhdGl2ZVNjYWxlZEhleFBvaW50cyh0aGlzLmRhdGEuYm9hcmRWaWV3LmlubmVyU2lkZUxlbmd0aCk7XHJcbiAgICAgICAgbGV0IHN0YXJ0ID0gaGV4UG9pbnRzW3RoaXMuZGF0YS5tb2RlbC5jb3Jkcy5zaWRlXTtcclxuICAgICAgICB0aGlzLmRhdGEuZ3JhcGhpY3MueCA9IHN0YXJ0Lng7XHJcbiAgICAgICAgdGhpcy5kYXRhLmdyYXBoaWNzLnkgPSBzdGFydC55O1xyXG4gICAgfVxyXG5cclxuICAgIHVwZGF0ZSgpe1xyXG4gICAgICAgIHRoaXMucmVmcmVzaFBvc2l0aW9uKCk7XHJcbiAgICAgICAgbGV0IGV4dGVybmFsVGFuZ2VudEFuZ2xlID0gNjA7XHJcbiAgICAgICAgdGhpcy5kYXRhLmdyYXBoaWNzLmFuZ2xlID0gZXh0ZXJuYWxUYW5nZW50QW5nbGUqdGhpcy5kYXRhLm1vZGVsLmNvcmRzLnNpZGU7XHJcbiAgICAgICAgdGhpcy5kYXRhLmdyYXBoaWNzLmNsZWFyKCk7XHJcbiAgICAgICAgLy90aGlzIHJlY3QgdXNlZCBmcm8gaGl0IGJveCBvbmx5XHJcbiAgICAgICAgdGhpcy5kYXRhLmdyYXBoaWNzLmJlZ2luRmlsbCgwLCAwKTtcclxuICAgICAgICB0aGlzLmRhdGEuZ3JhcGhpY3MuZHJhd1JlY3QoMCwgMCwgdGhpcy5kYXRhLmJvYXJkVmlldy5pbm5lclNpZGVMZW5ndGgsbGluZVN0eWxlLnRoaWNrbmVzcyAqIDIpO1xyXG4gICAgICAgIHRoaXMuZGF0YS5ncmFwaGljcy5lbmRGaWxsKCk7XHJcbiAgICAgICAgLy9ub3cgZHJhd2luZ1xyXG4gICAgICAgIHRoaXMuZGF0YS5ncmFwaGljcy5saW5lU3R5bGUobGluZVN0eWxlLnRoaWNrbmVzcywgdGhpcy5kYXRhLm1vZGVsLnRlYW0uY29sb3VyLCBsaW5lU3R5bGUuYWxwaGEpO1xyXG4gICAgICAgIHRoaXMuZGF0YS5ncmFwaGljcy5tb3ZlVG8oMCwgMCk7XHJcbiAgICAgICAgdGhpcy5kYXRhLmdyYXBoaWNzLmxpbmVUbyh0aGlzLmRhdGEuYm9hcmRWaWV3LmlubmVyU2lkZUxlbmd0aCwgMCk7XHJcblxyXG4gICAgICAgIGlmKHRoaXMuZGF0YS5tb2RlbC5zZWxlY3RlZCl7XHJcbiAgICAgICAgICAgIC8vdGhpcyBpcyBnb25uYSBiZSBhIHJlYWwgcmVzb3VyY2UgZHJhaW5cclxuICAgICAgICAgICAgLy9zaG91bGQgaW5zdGVhZCByZW5kZXIgdG8gdGV4dHVyZSAoNiBkaWZmZXJlbnQgb25lcyksIHRoZW4gcmVhcHBseVxyXG4gICAgICAgICAgICBsZXQgc3RlcHMgPSAxMDtcclxuICAgICAgICAgICAgbGV0IG1heFRoaWNrbmVzcyA9IGxpbmVTdHlsZS50aGlja25lc3MgKiA1O1xyXG4gICAgICAgICAgICBsZXQgdGhpY2tuZXNzU3RlcCA9IChtYXhUaGlja25lc3MgLSBsaW5lU3R5bGUudGhpY2tuZXNzKS9zdGVwcztcclxuICAgICAgICAgICAgbGV0IGFscGhhID0gMS9zdGVwczsvL3RoZXNlIG5hdHVyYWx5IHN0YWNrLCBzbyBzY2FsaW5nIHdpdGggc3RlcCBpcyBub3QgbmVlZGVkXHJcbiAgICAgICAgICAgIGZvcihsZXQgc3RlcCA9IDA7IHN0ZXAgPCBzdGVwczsgc3RlcCsrKXtcclxuICAgICAgICAgICAgICAgIHRoaXMuZGF0YS5ncmFwaGljcy5saW5lU3R5bGUobGluZVN0eWxlLnRoaWNrbmVzcyArICh0aGlja25lc3NTdGVwKnN0ZXApLCAweGZmZmZmZiwgYWxwaGEpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kYXRhLmdyYXBoaWNzLm1vdmVUbygwLCAwKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuZGF0YS5ncmFwaGljcy5saW5lVG8odGhpcy5kYXRhLmJvYXJkVmlldy5pbm5lclNpZGVMZW5ndGgsIDApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcbiIsImltcG9ydCB7SGV4YWdvbn0gZnJvbSBcIi4vaGV4YWdvbi5qc1wiO1xyXG5pbXBvcnQge0NvbWJpbmVkU2lkZX0gZnJvbSBcIi4vY29tYmluZWRTaWRlLmpzXCI7XHJcbmltcG9ydCB7RGFzaGJvYXJkfSBmcm9tIFwiLi9kYXNoYm9hcmQuanNcIjtcclxuaW1wb3J0ICogYXMgdGVhbUluZm8gZnJvbSBcIi4uL3RlYW1JbmZvLmpzXCI7XHJcblxyXG5sZXQgYm9hcmRTZXR0aW5ncyA9IHtcclxuICAgIHNwYWNlRmFjdG9yOiAwLjZcclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBib2FyZFNldHRpbmdzR3VpKGd1aSwgZ2FtZSl7XHJcbiAgICBsZXQgYm9hcmRWaWV3ID0gZ3VpLmFkZEZvbGRlcignYm9hcmQgdmlldycpO1xyXG4gICAgYm9hcmRWaWV3LmFkZChib2FyZFNldHRpbmdzLCAnc3BhY2VGYWN0b3InLCAwLCAyKTtcclxufVxyXG5cclxuLy90aGlzIGRvZXNudCB3b3JrIHByb3Blcmx5XHJcbmZ1bmN0aW9uIGNhbGN1bGF0ZVNpZGVMZW5ndGgod2lkdGgsIGhlaWdodCwgZ3JpZFdpZHRoLCBncmlkSGVpZ2h0KXtcclxuICAgIGxldCBib2FyZFdpZHRoID0gKDEuNSpncmlkV2lkdGgpKzE7XHJcbiAgICBsZXQgYm9hcmRIZWlnaHQgPSAoMipNYXRoLnNpbihNYXRoLlBJLzMpKmdyaWRIZWlnaHQpKygxLjUqTWF0aC5zaW4oTWF0aC5QSS8zKSk7XHJcbiAgICBpZihib2FyZFdpZHRoID4gYm9hcmRIZWlnaHQpe1xyXG4gICAgICAgIHJldHVybiB3aWR0aC8oMS41KmdyaWRXaWR0aCsxKTtcclxuICAgIH1lbHNle1xyXG4gICAgICAgIHJldHVybiBoZWlnaHQvKCgyKk1hdGguc2luKE1hdGguUEkvMykqZ3JpZEhlaWdodCkrKDEuNSpNYXRoLnNpbihNYXRoLlBJLzMpKSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBCb2FyZCBleHRlbmRzIFBoYXNlci5TcHJpdGV7XHJcbiAgICAvL3Bhc3NpbmcgaW4geCBpcyBldmVuIG1vcmUgcmVhc29uIHRvIG1ha2UgdGhpcyBhIHBoYXNlciBvYmplY3RcclxuICAgIGNvbnN0cnVjdG9yKGdhbWUsIHgsIHksIG1vZGVsLCBndWksIHNpZGVMZW5ndGgpe1xyXG4gICAgICAgIHN1cGVyKGdhbWUsIHgsIHkpO1xyXG4gICAgICAgIHRoaXMuZGF0YS5tb2RlbCA9IG1vZGVsO1xyXG4gICAgICAgIHRoaXMuZGF0YS5kYXNoYm9hcmQgPSBuZXcgRGFzaGJvYXJkKGdhbWUsIDAsIDAsIDIwMCwgdGVhbUluZm8sIHRoaXMuZGF0YS5tb2RlbCk7XHJcbiAgICAgICAgdGhpcy5hZGRDaGlsZCh0aGlzLmRhdGEuZGFzaGJvYXJkKTtcclxuICAgICAgICBpZihzaWRlTGVuZ3RoID09PSB1bmRlZmluZWQpe1xyXG4gICAgICAgICAgICBzaWRlTGVuZ3RoID0gdGhpcy5kZWZhdWx0U2lkZUxlbmd0aDtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5kYXRhLnNpZGVMZW5ndGggPSBzaWRlTGVuZ3RoO1xyXG4gICAgICAgIGd1aS5hZGQodGhpcy5kYXRhLCAnc2lkZUxlbmd0aCcsIHNpZGVMZW5ndGgqMC41LCBzaWRlTGVuZ3RoKjIpO1xyXG4gICAgICAgIHRoaXMuaGV4YWdvbnMgPSBbXTtcclxuICAgICAgICB0aGlzLmRhdGEuZ2FtZUJvYXJkR3JvdXAgPSBuZXcgUGhhc2VyLkdyb3VwKGdhbWUsIHRoaXMpO1xyXG4gICAgICAgIHRoaXMuZGF0YS5nYW1lQm9hcmRHcm91cC54ID0gdGhpcy5kYXRhLmRhc2hib2FyZC5kYXRhLndpZHRoO1xyXG4gICAgICAgIC8vc2hvdWxkIHB1dCBoZXggdmVpd3MgaW4gdGhlaXIgb3duIGdyb3VwXHJcbiAgICAgICAgZm9yKGNvbnN0IGhleE1vZGVsIG9mIG1vZGVsLmhleEFycmF5KXtcclxuICAgICAgICAgICAgbGV0IHdvcmxkQ29yZHMgPSB0aGlzLmNhbGN1bGF0ZVdvcmxkQ29yZHMoaGV4TW9kZWwuZ3JpZENvcmRzKTtcclxuICAgICAgICAgICAgbGV0IGhleGFnb24gPSBuZXcgSGV4YWdvbihnYW1lLCB3b3JsZENvcmRzLngsIHdvcmxkQ29yZHMueSwgdGhpcywgbW9kZWwuaGV4YWdvbklucHV0LCBoZXhNb2RlbCk7XHJcbiAgICAgICAgICAgIHRoaXMuZGF0YS5nYW1lQm9hcmRHcm91cC5hZGRDaGlsZChoZXhhZ29uKTtcclxuICAgICAgICAgICAgdGhpcy5oZXhhZ29ucy5wdXNoKGhleGFnb24pO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmNvbWJpbmVkU2lkZXMgPSBbXTtcclxuICAgICAgICBmb3IobGV0IGNvbWJNb2RlbCBvZiBtb2RlbC5jb21iaW5lZFNpZGVzQXJyYXkpe1xyXG4gICAgICAgICAgICBsZXQgd29ybGRDb3JkcyA9IHRoaXMuY2FsY3VsYXRlV29ybGRDb3Jkcyhjb21iTW9kZWwuY29yZHMpO1xyXG4gICAgICAgICAgICBsZXQgY29tYmluZWRTaWRlID0gbmV3IENvbWJpbmVkU2lkZShnYW1lLCB3b3JsZENvcmRzLngsIHdvcmxkQ29yZHMueSwgdGhpcywgY29tYk1vZGVsKTtcclxuICAgICAgICAgICAgdGhpcy5kYXRhLmdhbWVCb2FyZEdyb3VwLmFkZENoaWxkKGNvbWJpbmVkU2lkZSk7XHJcbiAgICAgICAgICAgIHRoaXMuY29tYmluZWRTaWRlcy5wdXNoKGNvbWJpbmVkU2lkZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGdldCBkZWZhdWx0U2lkZUxlbmd0aCgpe1xyXG4gICAgICAgIHJldHVybiBjYWxjdWxhdGVTaWRlTGVuZ3RoKHRoaXMuZ2FtZS53aWR0aC10aGlzLmRhdGEuZGFzaGJvYXJkLndpZHRoLCB0aGlzLmdhbWUuaGVpZ2h0LCB0aGlzLmRhdGEubW9kZWwuZ3JpZFdpZHRoLCB0aGlzLmRhdGEubW9kZWwuZ3JpZEhlaWdodCk7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IGlubmVyU2lkZUxlbmd0aCgpe1xyXG4gICAgICAgIHJldHVybiBib2FyZFNldHRpbmdzLnNwYWNlRmFjdG9yKnRoaXMuZGF0YS5zaWRlTGVuZ3RoO1xyXG4gICAgfVxyXG5cclxuICAgIGdldCBvdXRlclNpZGVMZW5ndGgoKXtcclxuICAgICAgICByZXR1cm4gdGhpcy5kYXRhLnNpZGVMZW5ndGg7XHJcbiAgICB9XHJcblxyXG4gICAgdXBkYXRlKCl7XHJcbiAgICAgICAgZm9yKGxldCBoZXhhZ29uIG9mIHRoaXMuaGV4YWdvbnMpe1xyXG4gICAgICAgICAgICBoZXhhZ29uLnVwZGF0ZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmb3IobGV0IGNvbWJpbmVkU2lkZSBvZiB0aGlzLmNvbWJpbmVkU2lkZXMpe1xyXG4gICAgICAgICAgICBjb21iaW5lZFNpZGUudXBkYXRlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuZGF0YS5kYXNoYm9hcmQudXBkYXRlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgdXBkYXRlU2lkZUxlbmd0aChzaWRlTGVuZ3RoKXtcclxuICAgICAgICBpZihzaWRlTGVuZ3RoID09PSB1bmRlZmluZWQpe1xyXG4gICAgICAgICAgICBzaWRlTGVuZ3RoID0gdGhpcy5kZWZhdWx0U2lkZUxlbmd0aDtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5kYXRhLnNpZGVMZW5ndGggPSBzaWRlTGVuZ3RoO1xyXG4gICAgfVxyXG5cclxuICAgIGNhbGN1bGF0ZVdvcmxkQ29yZHMoZ3JpZENvcmRzKXtcclxuICAgICAgICBsZXQgc3BhY2luZ1NpZGVMZW5ndGggPSB0aGlzLmRhdGEuc2lkZUxlbmd0aDtcclxuICAgICAgICBsZXQgeVNwYWNpbmcgPSAyKk1hdGguc2luKE1hdGguUEkvMykqc3BhY2luZ1NpZGVMZW5ndGg7XHJcbiAgICAgICAgbGV0IHhTcGFjaW5nID0gc3BhY2luZ1NpZGVMZW5ndGgqMS41O1xyXG4gICAgICAgIC8vcGx1cyBvbmVzIHNvIHdlIGRvbid0IGdldCBjdXQgb2ZmIGJ5IGVkZ2Ugb2YgbWFwXHJcbiAgICAgICAgbGV0IHBvc2l0aW9uID0gIHtcclxuICAgICAgICAgICAgeDogKHhTcGFjaW5nKmdyaWRDb3Jkcy54KStzcGFjaW5nU2lkZUxlbmd0aCxcclxuICAgICAgICAgICAgeTogKHlTcGFjaW5nKmdyaWRDb3Jkcy55KSsoMipNYXRoLnNpbihNYXRoLlBJLzMpKnNwYWNpbmdTaWRlTGVuZ3RoKVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgbGV0IGlzT2RkQ29sdW1uID0gZ3JpZENvcmRzLnglMj09MTtcclxuICAgICAgICBpZihpc09kZENvbHVtbil7XHJcbiAgICAgICAgICAgIHBvc2l0aW9uLnkgLT0geVNwYWNpbmcvMjtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHBvc2l0aW9uO1xyXG4gICAgfVxyXG59XHJcbiIsImltcG9ydCAqIGFzIGdlb21ldHJ5IGZyb20gXCIuLi9nZW9tZXRyeS5qc1wiO1xyXG5cclxubGV0IGxpbmVTdHlsZSA9IHtcclxuICAgIHRoaWNrbmVzczogNSxcclxuICAgIGFscGhhOiAxXHJcbn07XHJcblxyXG5sZXQgY29tYmluZWRDb2xvdXJzID0ge1xyXG4gICAgdGVhbV8wXzE6IDB4ZmZiMDAwLFxyXG4gICAgdGVhbV8xXzI6IDB4MDBmZjAwLFxyXG4gICAgdGVhbV8yXzA6IDB4YWYwMGZmXHJcbn07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY29tYmluZWRTaWRlU2V0dGluZ3NHdWkoZ3VpKXtcclxuICAgIGxldCBmb2xkZXIgPSBndWkuYWRkRm9sZGVyKCdjb21iaW5lZCBzaWRlIGdyYXBoaWNzJyk7XHJcbiAgICBmb2xkZXIuYWRkKGxpbmVTdHlsZSwgJ3RoaWNrbmVzcycsIDAsMjApO1xyXG4gICAgZm9sZGVyLmFkZChsaW5lU3R5bGUsICdhbHBoYScsIDAsIDEpO1xyXG4gICAgZm9sZGVyLmFkZENvbG9yKGNvbWJpbmVkQ29sb3VycywgJ3RlYW1fMF8xJyk7XHJcbiAgICBmb2xkZXIuYWRkQ29sb3IoY29tYmluZWRDb2xvdXJzLCAndGVhbV8xXzInKTtcclxuICAgIGZvbGRlci5hZGRDb2xvcihjb21iaW5lZENvbG91cnMsICd0ZWFtXzJfMCcpO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgQ29tYmluZWRTaWRlIGV4dGVuZHMgUGhhc2VyLlNwcml0ZXtcclxuICAgIC8qXHJcbiAgICBtb2RlbCBBUEk6XHJcbiAgICAgICAgcHJvcGVydHkgaGV4U2lkZVRlYW1zIC0+IGFycmF5IG9mIHRlYW1OdW1iZXJzIG9mIGFkamFjZW50IGhleCBzaWRlc1xyXG4gICAgICAgIHByb2VydHkgY29yZHMgLT4ge3gseSwgc2lkZX0gc3RhbmRhcmQgY29yb2RpbmF0ZSBmb3IgYWRkcmVzc2luZyBjb21iaW5lZCBzaWRlc1xyXG4gICAgKi9cclxuICAgIGNvbnN0cnVjdG9yKGdhbWUsIHgsIHksIGJvYXJkVmlldywgbW9kZWwpe1xyXG4gICAgICAgIHN1cGVyKGdhbWUsIHgsIHkpO1xyXG4gICAgICAgIHRoaXMuZGF0YS5ib2FyZFZpZXcgPSBib2FyZFZpZXc7XHJcbiAgICAgICAgdGhpcy5kYXRhLm1vZGVsID0gbW9kZWw7XHJcbiAgICAgICAgbGV0IGhleFBvaW50cyA9IGdlb21ldHJ5LnJlbGF0aXZlU2NhbGVkSGV4UG9pbnRzKHRoaXMuZGF0YS5ib2FyZFZpZXcub3V0ZXJTaWRlTGVuZ3RoKTtcclxuICAgICAgICBsZXQgc3RhcnQgPSBoZXhQb2ludHNbdGhpcy5kYXRhLm1vZGVsLmNvcmRzLnNpZGVdO1xyXG4gICAgICAgIHRoaXMuZGF0YS5ncmFwaGljcyA9IG5ldyBQaGFzZXIuR3JhcGhpY3MoZ2FtZSwgc3RhcnQueCwgc3RhcnQueSk7XHJcbiAgICAgICAgdGhpcy5hZGRDaGlsZCh0aGlzLmRhdGEuZ3JhcGhpY3MpO1xyXG4gICAgICAgIGxldCBlbmQgPSBoZXhQb2ludHNbKHRoaXMuZGF0YS5tb2RlbC5jb3Jkcy5zaWRlICsgMSkgJSA2XTtcclxuICAgICAgICBsZXQgdGV4dFBvc2l0aW9uID0ge3g6IChzdGFydC54ICsgZW5kLngpLzIsIHk6IChzdGFydC55ICsgZW5kLnkpLzJ9O1xyXG4gICAgICAgIHRoaXMuZGF0YS50ZXh0ID0gbmV3IFBoYXNlci5UZXh0KGdhbWUsIHRleHRQb3NpdGlvbi54LCB0ZXh0UG9zaXRpb24ueSwgXCJcIik7XHJcbiAgICAgICAgdGhpcy5hZGRDaGlsZCh0aGlzLmRhdGEudGV4dCk7XHJcbiAgICAgICAgdGhpcy5kYXRhLnRleHQudmlzaWJsZSA9IGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIHJlZnJlc2hQb3NpdGlvbigpe1xyXG4gICAgICAgIGxldCB3b3JsZENvcmRzID0gdGhpcy5kYXRhLmJvYXJkVmlldy5jYWxjdWxhdGVXb3JsZENvcmRzKHRoaXMuZGF0YS5tb2RlbC5jb3Jkcyk7XHJcbiAgICAgICAgdGhpcy54ID0gd29ybGRDb3Jkcy54O1xyXG4gICAgICAgIHRoaXMueSA9IHdvcmxkQ29yZHMueTtcclxuICAgICAgICBsZXQgaGV4UG9pbnRzID0gZ2VvbWV0cnkucmVsYXRpdmVTY2FsZWRIZXhQb2ludHModGhpcy5kYXRhLmJvYXJkVmlldy5vdXRlclNpZGVMZW5ndGgpO1xyXG4gICAgICAgIGxldCBzdGFydCA9IGhleFBvaW50c1t0aGlzLmRhdGEubW9kZWwuY29yZHMuc2lkZV07XHJcbiAgICAgICAgdGhpcy5kYXRhLmdyYXBoaWNzLnggPSBzdGFydC54O1xyXG4gICAgICAgIHRoaXMuZGF0YS5ncmFwaGljcy55ID0gc3RhcnQueTtcclxuICAgIH1cclxuXHJcbiAgICB1cGRhdGUoKXtcclxuICAgICAgICB0aGlzLnJlZnJlc2hQb3NpdGlvbigpO1xyXG4gICAgICAgIGxldCBleHRlcm5hbFRhbmdlbnRBbmdsZSA9IDYwO1xyXG4gICAgICAgIHRoaXMuZGF0YS5ncmFwaGljcy5hbmdsZSA9IGV4dGVybmFsVGFuZ2VudEFuZ2xlKnRoaXMuZGF0YS5tb2RlbC5jb3Jkcy5zaWRlO1xyXG4gICAgICAgIHRoaXMuZGF0YS5ncmFwaGljcy5jbGVhcigpO1xyXG4gICAgICAgIGxldCBoZXhTaWRlVGVhbXMgPSB0aGlzLmRhdGEubW9kZWwuaGV4U2lkZVRlYW1zO1xyXG4gICAgICAgIGxldCBmaXJzdFRlYW0gPSBoZXhTaWRlVGVhbXNbMF07XHJcbiAgICAgICAgbGV0IGNvbG91cjtcclxuICAgICAgICBpZihoZXhTaWRlVGVhbXMubGVuZ3RoID09PSAyKXtcclxuICAgICAgICAgICAgbGV0IHNlY29uZFRlYW0gPSBoZXhTaWRlVGVhbXNbMV07XHJcbiAgICAgICAgICAgIGNvbG91ciA9IHRoaXMubWFudWFsQ29tYmluZShmaXJzdFRlYW0sIHNlY29uZFRlYW0pO1xyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICBjb2xvdXIgPSBmaXJzdFRlYW0uY29sb3VyO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZih0aGlzLmRhdGEubW9kZWwuc2VsZWN0ZWQpe1xyXG4gICAgICAgICAgICAvL3RoaXMgaXMgZ29ubmEgYmUgYSByZWFsIHJlc291cmNlIGRyYWluXHJcbiAgICAgICAgICAgIC8vc2hvdWxkIGluc3RlYWQgcmVuZGVyIHRvIHRleHR1cmUgKDYgZGlmZmVyZW50IG9uZXMpLCB0aGVuIHJlYXBwbHlcclxuICAgICAgICAgICAgbGV0IHN0ZXBzID0gMTA7XHJcbiAgICAgICAgICAgIGxldCBtYXhUaGlja25lc3MgPSBsaW5lU3R5bGUudGhpY2tuZXNzICogNTtcclxuICAgICAgICAgICAgbGV0IHRoaWNrbmVzc1N0ZXAgPSAobWF4VGhpY2tuZXNzIC0gbGluZVN0eWxlLnRoaWNrbmVzcykvc3RlcHM7XHJcbiAgICAgICAgICAgIGxldCBhbHBoYSA9IDEvc3RlcHM7Ly90aGVzZSBuYXR1cmFseSBzdGFjaywgc28gc2NhbGluZyB3aXRoIHN0ZXAgaXMgbm90IG5lZWRlZFxyXG4gICAgICAgICAgICBmb3IobGV0IHN0ZXAgPSAwOyBzdGVwIDwgc3RlcHM7IHN0ZXArKyl7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRhdGEuZ3JhcGhpY3MubGluZVN0eWxlKGxpbmVTdHlsZS50aGlja25lc3MgKyAodGhpY2tuZXNzU3RlcCpzdGVwKSwgMHhmZmZmZmYsIGFscGhhKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuZGF0YS5ncmFwaGljcy5tb3ZlVG8oMCwgMCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRhdGEuZ3JhcGhpY3MubGluZVRvKHRoaXMuZGF0YS5ib2FyZFZpZXcub3V0ZXJTaWRlTGVuZ3RoLCAwKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmRhdGEudGV4dC50ZXh0ID0gdGhpcy5kYXRhLm1vZGVsLnNjb3JlO1xyXG4gICAgICAgICAgICB0aGlzLmRhdGEudGV4dC52aXNpYmxlID0gdHJ1ZTtcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgdGhpcy5kYXRhLnRleHQudmlzaWJsZSA9IGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvL2RvaW5nIHRoaXMgbGFzdCBtZWFucyBpdCBzaXRzIG9uIHRvcCBvZiB0aGUgaGlnaHRsaWdoXHJcbiAgICAgICAgdGhpcy5kYXRhLmdyYXBoaWNzLmxpbmVTdHlsZShsaW5lU3R5bGUudGhpY2tuZXNzLCBjb2xvdXIsIGxpbmVTdHlsZS5hbHBoYSk7XHJcbiAgICAgICAgdGhpcy5kYXRhLmdyYXBoaWNzLm1vdmVUbygwLCAwKTtcclxuICAgICAgICB0aGlzLmRhdGEuZ3JhcGhpY3MubGluZVRvKHRoaXMuZGF0YS5ib2FyZFZpZXcub3V0ZXJTaWRlTGVuZ3RoLCAwKTtcclxuICAgIH1cclxuXHJcbiAgICAvL3RoaXMgZmVlbHMgbGlrZSBpdHMgbGVha2luZyB0aGUgbW9kZWwgYSBiaXQ/XHJcbiAgICBtYW51YWxDb21iaW5lKGZpcnN0X3RlYW0sIHNlY29uZF90ZWFtKXtcclxuICAgICAgICBmdW5jdGlvbiBsb2dFcnJvcigpe1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcImVycnJvciwgaW52YWxpZCB0ZWFtcyBmb3IgY29tYmluaW5nIHNpZGVzXCIpO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhmaXJzdF90ZWFtKTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coc2Vjb25kX3RlYW0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZihmaXJzdF90ZWFtLm51bWJlciA+IHNlY29uZF90ZWFtLm51bWJlcil7XHJcbiAgICAgICAgICAgIGxldCB0ZW1wID0gZmlyc3RfdGVhbTtcclxuICAgICAgICAgICAgZmlyc3RfdGVhbSA9IHNlY29uZF90ZWFtO1xyXG4gICAgICAgICAgICBzZWNvbmRfdGVhbSA9IHRlbXA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKGZpcnN0X3RlYW0ubnVtYmVyID09PSBzZWNvbmRfdGVhbS5udW1iZXIpe1xyXG4gICAgICAgICAgICByZXR1cm4gZmlyc3RfdGVhbS5jb2xvdXI7XHJcbiAgICAgICAgfWVsc2UgaWYoZmlyc3RfdGVhbS5udW1iZXIgPT09IDAgJiYgc2Vjb25kX3RlYW0ubnVtYmVyID09PSAxKXtcclxuICAgICAgICAgICAgICAgIHJldHVybiBjb21iaW5lZENvbG91cnMudGVhbV8wXzE7XHJcbiAgICAgICAgfWVsc2UgaWYoZmlyc3RfdGVhbS5udW1iZXIgPT09IDEgJiYgc2Vjb25kX3RlYW0ubnVtYmVyID09PSAyKXtcclxuICAgICAgICAgICAgICAgIHJldHVybiBjb21iaW5lZENvbG91cnMudGVhbV8xXzI7XHJcbiAgICAgICAgfWVsc2UgaWYoZmlyc3RfdGVhbS5udW1iZXIgPT09IDAgJiYgc2Vjb25kX3RlYW0ubnVtYmVyID09PSAyKXtcclxuICAgICAgICAgICAgICAgIHJldHVybiBjb21iaW5lZENvbG91cnMudGVhbV8yXzA7XHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIGxvZ0Vycm9yKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcbiIsImltcG9ydCB7SGV4YWdvbn0gZnJvbSBcIi4vaGV4YWdvbi5qc1wiO1xyXG5pbXBvcnQge0NvbWJpbmVkU2lkZX0gZnJvbSBcIi4vY29tYmluZWRTaWRlLmpzXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgRGFzaGJvYXJkIGV4dGVuZHMgUGhhc2VyLlNwcml0ZXtcclxuICAgIC8vZGVwZW5kaW5nIG9uIHdoYXQgdGhlZSBjb250cm9scyBsb29rIGxpa2VcclxuICAgIC8vbWlnaHQgYmUgYmV0dGVyIHRvIG1ha2UgdGhpcyB3aXRoIG5vcm1hbCBodG1sL2Nzc1xyXG4gICAgY29uc3RydWN0b3IoZ2FtZSwgeCwgeSwgd2lkdGgsIHRlYW1JbmZvLCBib2FyZE1vZGVsKXtcclxuICAgICAgICBzdXBlcihnYW1lLCB4LCB5KTtcclxuICAgICAgICB0aGlzLmRhdGEudGVhbUluZm8gPSB0ZWFtSW5mbztcclxuICAgICAgICB0aGlzLmRhdGEud2lkdGggPSB3aWR0aDtcclxuICAgICAgICB0aGlzLmRhdGEuaGVpZ2h0ID0gZ2FtZS5oZWlnaHQ7XHJcbiAgICAgICAgdGhpcy5vdXRsaW5lKCk7XHJcbiAgICAgICAgdGhpcy5kYXRhLnRlYW1zRGlzcGxheSA9IFtdO1xyXG4gICAgICAgIGZvcihsZXQgW2luZGV4LCB0ZWFtXSBvZiB0ZWFtSW5mby50ZWFtcy5lbnRyaWVzKCkpe1xyXG4gICAgICAgICAgICBsZXQgdGVhbURpc3BsYXlHcm91cCA9IHRoaXMudGVhbUhpZ2hsaWdodHModGVhbSwgaW5kZXgqNTAsIDUwLCAzMCwgMzApO1xyXG4gICAgICAgICAgICB0aGlzLmRhdGEudGVhbXNEaXNwbGF5LnB1c2godGVhbURpc3BsYXlHcm91cCk7XHJcbiAgICAgICAgICAgIHRoaXMuYWRkQ2hpbGQodGVhbURpc3BsYXlHcm91cCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuZGF0YS5ib2FyZE1vZGVsID0gYm9hcmRNb2RlbDtcclxuICAgICAgICB0aGlzLm1vdmVDb3VudGVyID0gbmV3IFBoYXNlci5HcmFwaGljcyhnYW1lLCAwLCB0aGlzLmRhdGEuaGVpZ2h0LzIpO1xyXG4gICAgICAgIHRoaXMuYWRkQ2hpbGQodGhpcy5tb3ZlQ291bnRlcik7XHJcbiAgICAgICAgdGhpcy5kYXRhLmhpZ2hsaWdoZWRTZWN0aW9uU2NvcmUgPSBuZXcgUGhhc2VyLlRleHQoZ2FtZSwgMCwgMTAsIFwiXCIsIHt3b3JkV3JhcDogdHJ1ZSwgd29yZFdyYXBXaWR0aDogd2lkdGgsIGZvbnRTaXplOiAxNX0pO1xyXG4gICAgICAgIHRoaXMuYWRkQ2hpbGQodGhpcy5kYXRhLmhpZ2hsaWdoZWRTZWN0aW9uU2NvcmUpO1xyXG4gICAgfVxyXG5cclxuICAgIHRlYW1IaWdobGlnaHRzKHRlYW0sIHgsIHksIHdpZHRoLCBoZWlnaHQpe1xyXG4gICAgICAgIGxldCBncm91cCA9IG5ldyBQaGFzZXIuR3JvdXAodGhpcy5nYW1lLCB0aGlzKTtcclxuICAgICAgICBsZXQgdGVhbUhpZ2hsaWdodCA9IG5ldyBQaGFzZXIuR3JhcGhpY3ModGhpcy5nYW1lLCB4LCB5KTtcclxuICAgICAgICB0ZWFtSGlnaGxpZ2h0LmJlZ2luRmlsbCh0ZWFtLmNvbG91cik7XHJcbiAgICAgICAgdGVhbUhpZ2hsaWdodC5kcmF3UmVjdCgwLDAsIHdpZHRoLCBoZWlnaHQpO1xyXG4gICAgICAgIHRlYW1IaWdobGlnaHQuZW5kRmlsbCgpO1xyXG4gICAgICAgIHRlYW1IaWdobGlnaHQuaW5wdXRFbmFibGVkID0gdHJ1ZTtcclxuICAgICAgICB0ZWFtSGlnaGxpZ2h0LmV2ZW50cy5vbklucHV0T3Zlci5hZGQoZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgdGhpcy5kYXRhLmJvYXJkTW9kZWwudGVhbUhpZ2hsaWdodCh0ZWFtKTtcclxuICAgICAgICB9LCB0aGlzKTtcclxuICAgICAgICBncm91cC5hZGRDaGlsZCh0ZWFtSGlnaGxpZ2h0KTtcclxuICAgICAgICBsZXQgc2NvcmVUZXh0ID0gbmV3IFBoYXNlci5UZXh0KHRoaXMuZ2FtZSwgeCwgeSwgXCJcIik7XHJcbiAgICAgICAgZ3JvdXAuYWRkQ2hpbGQoc2NvcmVUZXh0KTtcclxuICAgICAgICBzY29yZVRleHQudXBkYXRlID0gZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgdGhpcy50ZXh0ID0gdGVhbS5zY29yZTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHJldHVybiBncm91cDtcclxuICAgIH1cclxuXHJcbiAgICBvdXRsaW5lKCl7XHJcbiAgICAgICAgdGhpcy5kYXRhLm91dGxpbmUgPSBuZXcgUGhhc2VyLkdyYXBoaWNzKHRoaXMuZ2FtZSwgMCwgMCk7XHJcbiAgICAgICAgdGhpcy5kYXRhLm91dGxpbmUuYmVnaW5GaWxsKCcweGZmNjYwMCcpO1xyXG4gICAgICAgIHRoaXMuZGF0YS5vdXRsaW5lLmRyYXdSZWN0KDAsMCwgdGhpcy5kYXRhLndpZHRoLCB0aGlzLmRhdGEuaGVpZ2h0KTtcclxuICAgICAgICB0aGlzLmRhdGEub3V0bGluZS5lbmRGaWxsKCk7XHJcbiAgICAgICAgdGhpcy5hZGRDaGlsZCh0aGlzLmRhdGEub3V0bGluZSk7XHJcbiAgICB9XHJcblxyXG4gICAgdXBkYXRlKCl7XHJcbiAgICAgICAgZm9yKGxldCB0ZWFtRGlzcGxheUdyb3VwIG9mIHRoaXMuZGF0YS50ZWFtc0Rpc3BsYXkpe1xyXG4gICAgICAgICAgICB0ZWFtRGlzcGxheUdyb3VwLnVwZGF0ZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLm1vdmVDb3VudGVyLmNsZWFyKCk7XHJcbiAgICAgICAgbGV0IHNjb3JlO1xyXG4gICAgICAgIGlmKHRoaXMuZGF0YS5ib2FyZE1vZGVsLnNlbGVjdGVkID09PSB1bmRlZmluZWQpe1xyXG4gICAgICAgICAgICBzY29yZSA9IDA7XHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIHNjb3JlID0gdGhpcy5kYXRhLmJvYXJkTW9kZWwuc2VsZWN0ZWQuc2NvcmU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuZGF0YS5oaWdobGlnaGVkU2VjdGlvblNjb3JlLnRleHQgPSBcIkhpZ2hsaWdodGVkIFNjb3JlOiBcIiArIHNjb3JlO1xyXG4gICAgICAgIGNvbnN0IGN1cnJlbnRUZWFtID0gdGhpcy5kYXRhLnRlYW1JbmZvLmN1cnJlbnRUZWFtO1xyXG4gICAgICAgIGNvbnN0IG1vdmVMaW1pdCA9IHRoaXMuZGF0YS50ZWFtSW5mby5zZXR0aW5ncy5zdGFuZGFyZE1vdmVMaW1pdDtcclxuICAgICAgICB0aGlzLm1vdmVDb3VudGVyLmJlZ2luRmlsbChjdXJyZW50VGVhbS5jb2xvdXIpO1xyXG4gICAgICAgIGxldCByYWRpdXMgPSBNYXRoLm1pbih0aGlzLmRhdGEud2lkdGgsIHRoaXMuZGF0YS5oZWlnaHQpLzI7XHJcbiAgICAgICAgbGV0IGNlbnRlciA9IHt4OiB0aGlzLmRhdGEud2lkdGgvMiwgeTogMH07XHJcbiAgICAgICAgaWYoY3VycmVudFRlYW0ubW92ZXNMZWZ0ID09IG1vdmVMaW1pdCl7XHJcbiAgICAgICAgICAgIC8vYXJjIGRyYXdzIGluIGRpc2NyZWF0IHNlZ21lbnRzLCBzbyBsZWF2ZXMgYSBnYXAgZm9yIGZ1bGwgY2lyY2xlc1xyXG4gICAgICAgICAgICB0aGlzLm1vdmVDb3VudGVyLmRyYXdDaXJjbGUoY2VudGVyLngsIGNlbnRlci55LCByYWRpdXMqMik7XHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIGxldCBwZXJjZW50T2ZDaXJjbGUgPSBjdXJyZW50VGVhbS5tb3Zlc0xlZnQvbW92ZUxpbWl0O1xyXG4gICAgICAgICAgICBsZXQgZW5kQW5nbGVSYWRpYW5zID0gLU1hdGguUEkqMipwZXJjZW50T2ZDaXJjbGU7XHJcbiAgICAgICAgICAgIGxldCB0b3BPZmZzZXQgPSAtTWF0aC5QSS8yO1xyXG4gICAgICAgICAgICB0aGlzLm1vdmVDb3VudGVyLmFyYyhjZW50ZXIueCwgY2VudGVyLnksIHJhZGl1cywgdG9wT2Zmc2V0LCB0b3BPZmZzZXQrZW5kQW5nbGVSYWRpYW5zLCB0cnVlLCAxMjgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLm1vdmVDb3VudGVyLmVuZEZpbGwoKTtcclxuICAgIH1cclxufVxyXG4iLCJpbXBvcnQge3RlYW1zfSBmcm9tIFwiLi4vdGVhbUluZm8uanNcIjtcclxuaW1wb3J0ICogYXMgZ2VvbWV0cnkgZnJvbSBcIi4uL2dlb21ldHJ5LmpzXCI7XHJcbmltcG9ydCB7U2luZ2xlU2lkZX0gZnJvbSBcIi4vU2luZ2xlU2lkZS5qc1wiO1xyXG5cclxubGV0IGxpbmVTdHlsZSA9IHtcclxuICAgIHRoaWNrbmVzczogNSxcclxuICAgIGFscGhhOiAxXHJcbn07XHJcblxyXG5sZXQgaGV4U3R5bGUgPSB7XHJcbiAgICBjb2xvdXI6IDB4RkYzM2ZmXHJcbn07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gaGV4YWdvblNldHRpbmdzR3VpKGd1aSl7XHJcbiAgICBsZXQgZm9sZGVyID0gZ3VpLmFkZEZvbGRlcignaGV4YWdvbiBncmFwaGljcycpO1xyXG4gICAgZm9sZGVyLmFkZChsaW5lU3R5bGUsICd0aGlja25lc3MnLCAwLDIwKTtcclxuICAgIGZvbGRlci5hZGQobGluZVN0eWxlLCAnYWxwaGEnLCAwLCAxKTtcclxuICAgIGZvbGRlci5hZGRDb2xvcihoZXhTdHlsZSwgJ2NvbG91cicpO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgSGV4YWdvbiBleHRlbmRzIFBoYXNlci5TcHJpdGV7XHJcbiAgICAvKlxyXG4gICAgSGV4bW9kZWwgaXMgYW4gaW50ZXJmYWNlIHRoYXQgc3VwcGxpZXMgaW5mbyBvbiBob3cgdG8gcmVuZGVyXHJcbiAgICBJdCdzIEFQSSBpczpcclxuICAgICAgICBwcm9wZXJ0eTogZ3JpZENvcmRzIC0+IHJldHVybnMge3gsIHl9IG9iamVjdFxyXG4gICAgICAgIHByb3BvZXJ0eUwgc2lkZXMgLT4gcmV0dXJucyBbXSBvZiB0ZWFtIG51bWJlcnMsIHN0YXJ0aW5nIGZyb20gdG9wIHNpZGUsIGdvaW5nIGNsb2Nrd2lzZVxyXG4gICAgKi9cclxuICAgIGNvbnN0cnVjdG9yKGdhbWUsIHgsIHksIGJvYXJkVmlldywgaW5wdXREb3duQ2FsbGJhY2ssIG1vZGVsKXtcclxuICAgICAgICBzdXBlcihnYW1lLCB4LCB5KTtcclxuICAgICAgICB0aGlzLmRhdGEubW9kZWwgPSBtb2RlbDtcclxuICAgICAgICB0aGlzLmRhdGEuYm9hcmRWaWV3ID0gYm9hcmRWaWV3O1xyXG4gICAgICAgIHRoaXMuaW5wdXRFbmFibGVkID0gdHJ1ZTtcclxuICAgICAgICAvL3RoaXMgaXNuJ3QgcGl4bGUgcGVyZmVjdCwgc28gdXNlIGluIGNvbmp1Y3Rpb24gd2l0aCBwb2x5Z29uIGhpdCB0ZXN0P1xyXG4gICAgICAgIC8vYXNzdW1pbmcgYm94IGZvciB0aGlzIHRlc3RpIGlzIHRvbyBiaWcsIG5vdCB0b28gc21hbGxcclxuICAgICAgICB0aGlzLmV2ZW50cy5vbklucHV0RG93bi5hZGQoaW5wdXREb3duQ2FsbGJhY2ssIHRoaXMuZGF0YS5ib2FyZFZpZXcuZGF0YS5tb2RlbCk7XHJcblxyXG4gICAgICAgIHRoaXMuZGF0YS5ib2R5ID0gbmV3IFBoYXNlci5HcmFwaGljcyhnYW1lLCAwLCAwKTtcclxuICAgICAgICB0aGlzLmFkZENoaWxkKHRoaXMuZGF0YS5ib2R5KTtcclxuXHJcbiAgICAgICAgdGhpcy5kYXRhLnNpZGVzID0gW107XHJcblxyXG4gICAgICAgIGZvcihsZXQgc2lkZU1vZGVsIG9mIHRoaXMuZGF0YS5tb2RlbC5zaWRlcyl7XHJcbiAgICAgICAgICAgIGxldCBzaWRlVmlldyA9IG5ldyBTaW5nbGVTaWRlKGdhbWUsIDAsIDAsIGJvYXJkVmlldywgc2lkZU1vZGVsKTtcclxuICAgICAgICAgICAgdGhpcy5hZGRDaGlsZChzaWRlVmlldyk7XHJcbiAgICAgICAgICAgIHRoaXMuZGF0YS5zaWRlcy5wdXNoKHNpZGVWaWV3KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5kYXRhLnRleHQgPSBuZXcgUGhhc2VyLlRleHQoZ2FtZSwgLTEwLCAtMTAsIHRoaXMuZGF0YS5tb2RlbC5ncmlkQ29yZHMueCArIFwiLFwiICsgdGhpcy5kYXRhLm1vZGVsLmdyaWRDb3Jkcy55KTtcclxuICAgICAgICAvL2xvb2sgYXQgYWRkaW5nIHRoaXMgdG8gYSBncm91cC9pbWFnZSBjbGFzcyB3aXRoIHRoZSBncmFwaGljcyBvYmplY3RcclxuICAgICAgICB0aGlzLmFkZENoaWxkKHRoaXMuZGF0YS50ZXh0KTtcclxuICAgIH1cclxuXHJcbiAgICByZWZyZXNoUG9zaXRvbigpe1xyXG4gICAgICAgIGxldCB3b3JsZENvcmRzID0gdGhpcy5kYXRhLmJvYXJkVmlldy5jYWxjdWxhdGVXb3JsZENvcmRzKHRoaXMuZGF0YS5tb2RlbC5ncmlkQ29yZHMpO1xyXG4gICAgICAgIHRoaXMueCA9IHdvcmxkQ29yZHMueDtcclxuICAgICAgICB0aGlzLnkgPSB3b3JsZENvcmRzLnk7XHJcbiAgICB9XHJcblxyXG4gICAgdXBkYXRlKCl7XHJcbiAgICAgICAgdGhpcy5yZWZyZXNoUG9zaXRvbigpO1xyXG4gICAgICAgIC8vdGhpcy5kcmF3U2lkZXMoKTtcclxuICAgICAgICB0aGlzLmRyYXdIZXhhZ29uKCk7XHJcbiAgICAgICAgZm9yKGxldCBzaWRlVmlldyBvZiB0aGlzLmRhdGEuc2lkZXMpe1xyXG4gICAgICAgICAgICBzaWRlVmlldy51cGRhdGUoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZHJhd1NpZGVzKCl7XHJcbiAgICAgICAgdGhpcy5kYXRhLnNpZGVzLmNsZWFyKCk7XHJcbiAgICAgICAgbGV0IGhleFBvaW50cyA9IGdlb21ldHJ5LnJlbGF0aXZlU2NhbGVkSGV4UG9pbnRzKHRoaXMuZGF0YS5ib2FyZFZpZXcuaW5uZXJTaWRlTGVuZ3RoKTtcclxuICAgICAgICBmb3IobGV0IFtzaWRlTnVtYmVyLHRlYW1dIG9mIHRoaXMuZGF0YS5tb2RlbC5zaWRlcy5lbnRyaWVzKCkpe1xyXG4gICAgICAgICAgICB0aGlzLmRhdGEuc2lkZXMubGluZVN0eWxlKGxpbmVTdHlsZS50aGlja25lc3MsIHRlYW0uY29sb3VyLCBsaW5lU3R5bGUuYWxwaGEpO1xyXG4gICAgICAgICAgICBsZXQgc3RhcnQgPSBoZXhQb2ludHNbc2lkZU51bWJlcl07XHJcbiAgICAgICAgICAgIHRoaXMuZGF0YS5zaWRlcy5tb3ZlVG8oc3RhcnQueCwgc3RhcnQueSk7XHJcbiAgICAgICAgICAgIGxldCBlbmQgPSBoZXhQb2ludHNbKHNpZGVOdW1iZXIrMSklNl07XHJcbiAgICAgICAgICAgIHRoaXMuZGF0YS5zaWRlcy5saW5lVG8oZW5kLngsIGVuZC55KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZHJhd0hleGFnb24oKXtcclxuICAgICAgICB0aGlzLmRhdGEuYm9keS5jbGVhcigpO1xyXG4gICAgICAgIHRoaXMuZGF0YS5ib2R5LmJlZ2luRmlsbChoZXhTdHlsZS5jb2xvdXIpO1xyXG4gICAgICAgIHRoaXMuZGF0YS5ib2R5LmRyYXdQb2x5Z29uKGdlb21ldHJ5LnJlbGF0aXZlU2NhbGVkSGV4UG9pbnRzKHRoaXMuZGF0YS5ib2FyZFZpZXcuaW5uZXJTaWRlTGVuZ3RoKSk7XHJcbiAgICAgICAgdGhpcy5kYXRhLmJvZHkuZW5kRmlsbCgpO1xyXG4gICAgICAgIHRoaXMuZGF0YS50ZXh0LmZvbnQgPSBcImFyaWFsXCI7XHJcbiAgICAgICAgdGhpcy5kYXRhLnRleHQuZm9udFNpemUgPSA4O1xyXG4gICAgfVxyXG59XHJcbiJdfQ==
