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

var _score = require("./score.js");

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

//if we want to pack phaser in the build
//import Phaser from "Phaser";
//hack cause https://github.com/photonstorm/phaser/issues/2424
//window.PIXI = require( 'phaser/build/custom/pixi' );
//window.p2 = require( 'phaser/build/custom/p2' );
//window.Phaser = require( 'phaser/build/custom/phaser-split' );

function createBoard(game, dataString) {
    if (dataString === undefined) {
        var generationFunction = sideGeneration.mappingForDatGui.get(globalParams.sideGeneration);
        dataString = generationFunction(teamInfo.teams, globalParams.gridWidth, globalParams.gridHeight);
    }
    var boardModel = new _board2.Board(dataString, "normal", game.settingsGui);
    globalParams.dataString = boardModel.dataString;
    globalParams.sideGeneration = "dataString";
    var boardView = new _board.Board(game, 0, 0, boardModel, game.settingsGui);
    game.add.existing(boardView);
    game.boardView = boardView;
} //browserify doesn't like dat.gui, plus I don't think the repos from the maintainer anyway


var levels = {
    0: "(0,0)2:2:2:0:2:2|(0,1)2:2:2:0:2:2-0,0,3,0:0,1,3,0",
    1: "(0,0)0:1:2:2:2:1|(0,1)1:2:2:2:1:0-0,0,0,0:0,0,5,1:0,1,5,0:0,1,4,1",
    2: "(0,0)2:2:2:0:2:2|(0,1)2:0:2:2:2:0-0,1,1,0:0,1,5,0",
    3: "(0,0)0:1:2:2:2:1|(0,1)1:0:2:2:2:0-0,0,1,1:0,0,5,1:0,1,1,0:0,1,5,0",
    4: "(0,0)2:2:0:0:0:2|(0,1)2:0:2:2:2:0-0,1,1,0:0,1,5,0",
    5: "(0,0)0:1:2:0:2:1|(0,1)1:0:2:1:2:0-0,0,1,1:0,0,5,1:0,1,1,0:0,1,5,0"
};

var globalParams = {
    width: window.innerWidth,
    height: window.innerHeight,
    gridWidth: 5,
    gridHeight: 4,
    sideGeneration: "random", //be nice to store function directly here but doesn't play nice with dat-gui,
    dashBoardWidth: window.innerWidth / 10,
    presetLevels: levels
};

function globalSettingsGui(settingsGui, game) {
    settingsGui.add(globalParams, 'presetLevels', levels).listen().onFinishChange(function (newDataString) {
        game.boardView.destroy();
        createBoard(game, newDataString);
    });
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
    mapFolder.add(globalParams, 'sideGeneration', ["random", "even", "evenRandom", "dataString"]).listen().onFinishChange(function (genMethod) {
        game.boardView.destroy();
        createBoard(game);
    });
    //this cant point to board.dataString because dat-gui doesn't work with getters/setters
    mapFolder.add(globalParams, 'dataString').listen().onFinishChange(function (newDataString) {
        game.boardView.destroy();
        createBoard(game, newDataString);
    });
}

function preload(game) {
    game.load.image('left_rotate', '../../build/graphics/left_rotation.png');
    game.load.image('right_rotate', '../../build/graphics/right_rotation.png');
}

function onCreate(game) {
    game.stage.backgroundColor = "#666666"; //consider grey because less contrast
    var settingsGui = new dat.GUI();
    game.settingsGui = settingsGui;
    createBoard(game, levels[0]);
    globalSettingsGui(settingsGui, game);
    (0, _combinedSide2.combinedSideGameSettingsGui)(settingsGui);
    (0, _board.boardSettingsGui)(settingsGui, game);
    (0, _hexagon.hexagonSettingsGui)(settingsGui);
    (0, _combinedSide.combinedSideSettingsGui)(settingsGui);
    teamInfo.teamInfoSettingsGui(settingsGui);
    (0, _SingleSide.singleSideSettingsGui)(settingsGui);
    (0, _score.scoreSettingsGui)(settingsGui);
    (0, _board2.boardModelSettingsGui)(settingsGui);
}
function update(game) {}
window.onload = function () {
    var game = new Phaser.Game(globalParams.width, globalParams.height, Phaser.CANVAS, "phaser_parent", {
        preload: preload,
        create: onCreate,
        update: update
    });
};

},{"./models/board.js":28,"./models/combinedSide.js":29,"./score.js":31,"./sideGeneration.js":32,"./teamInfo.js":33,"./views/SingleSide.js":34,"./views/board.js":35,"./views/combinedSide.js":37,"./views/hexagon.js":39,"exdat":22}],26:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Character = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _gridNavigation = require("../gridNavigation.js");

var gridNavigation = _interopRequireWildcard(_gridNavigation);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Character = exports.Character = function () {
    function Character(board, cords, team) {
        _classCallCheck(this, Character);

        this.cords = cords;
        this.board = board;
        this.team = team;
        board.getHex(cords.x, cords.y).addListener(this);
        var otherHex = gridNavigation.getAdjacentHexagonCord(this.cords);
        if (board.getHex(otherHex.x, otherHex.y) !== undefined) {
            board.getHex(otherHex.x, otherHex.y).addListener(this);
        }
    }

    _createClass(Character, [{
        key: "rotate",
        value: function rotate(gridCords, amount) {
            this.lastRotation = amount; //hack for character animation
            var side = void 0;
            if (gridCords.x != this.x || gridCords.y != this.y) {
                side = (this.side + 3) % 6;
            } else {
                side = this.side;
            }
            var sideTeam = this.board.getHex(gridCords.x, gridCords.y).side(side).team;
            if (sideTeam !== this.team) {
                return false;
            }
            if (gridCords.x != this.x || gridCords.y != this.y) {
                this.board.getHex(this.x, this.y).removeListener(this);
                this.cords = { x: gridCords.x, y: gridCords.y, side: (this.cords.side + 3) % 6 };
            } else {
                var _otherHexCord = gridNavigation.getAdjacentHexagonCord(this);
                var _otherHex = this.board.getHex(_otherHexCord.x, _otherHexCord.y);
                if (_otherHex !== undefined) {
                    _otherHex.removeListener(this);
                }
            }
            this.cords.side = (this.cords.side + amount) % 6;
            var otherHexCord = gridNavigation.getAdjacentHexagonCord(this);
            var otherHex = this.board.getHex(otherHexCord.x, otherHexCord.y);
            if (otherHex !== undefined) {
                otherHex.addListener(this);
            }
            return true;
        }
    }, {
        key: "oppositeSideMatches",
        value: function oppositeSideMatches() {
            var otherHexCord = gridNavigation.getAdjacentHexagonCord(this);
            var otherHex = this.board.getHex(otherHexCord.x, otherHexCord.y);
            if (otherHex !== undefined) {
                var sideTeam = otherHex.side((this.side + 3) % 6).team;
                if (sideTeam == this.team) {
                    return true;
                }
            }
            return false;
        }
    }, {
        key: "x",
        get: function get() {
            return this.cords.x;
        }
    }, {
        key: "y",
        get: function get() {
            return this.cords.y;
        }
    }, {
        key: "side",
        get: function get() {
            return this.cords.side;
        }
    }]);

    return Character;
}();

},{"../gridNavigation.js":24}],27:[function(require,module,exports){
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

},{}],28:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Board = undefined;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.boardModelSettingsGui = boardModelSettingsGui;

var _hexagon = require("./hexagon.js");

var _combinedSide = require("./combinedSide.js");

var _teamInfo = require("../teamInfo.js");

var teamInfo = _interopRequireWildcard(_teamInfo);

var _gridNavigation = require("../gridNavigation.js");

var gridNavigation = _interopRequireWildcard(_gridNavigation);

var _score = require("../score.js");

var score = _interopRequireWildcard(_score);

var _Character = require("./Character.js");

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _toArray(arr) { return Array.isArray(arr) ? arr : Array.from(arr); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var settings = {
    mode: 'home',
    mapEdit: false
};

function boardModelSettingsGui(gui) {
    var boardFolder = gui.addFolder('board');
    boardFolder.add(settings, 'mode', ['home', 'normal']);
    boardFolder.add(settings, 'mapEdit');
}

var Board = exports.Board = function () {
    //passing in x is even more reason to make this a phaser object
    function Board(dataString, mode, gui) {
        _classCallCheck(this, Board);

        this.hexagons = this.parseDataString(dataString);
        this.createCombinedLines(this.hexArray);
        //settings.mode instead of this.mode is a horible hack
        settings.mode = mode;
    }

    _createClass(Board, [{
        key: "getHex",
        value: function getHex(x, y) {
            if (this.hexagons.get(x) !== undefined) {
                return this.hexagons.get(x).get(y);
            } else {
                return undefined;
            }
        }
    }, {
        key: "destroyHex",
        value: function destroyHex(x, y) {
            this.hexagons.get(x).delete(y);
            for (var side = 0; side < 6; side++) {
                var combinedSide = this.getCombinedSide({ x: x, y: y, side: side });
                var alternativeCords = combinedSide.alternativeCords;
                if (!this.hexagonExists(x, y) && !this.hexagonExists(alternativeCords.x, alternativeCords.y)) {
                    this.combinedSides.get(combinedSideCord.x).get(combinedSideCord.y).delete(combinedSideCord.side);
                }
            }
        }
    }, {
        key: "destroyCombinedSide",
        value: function destroyCombinedSide(combinedSideCord) {
            this.combinedSides.get(combinedSideCord.x).get(combinedSideCord.y).delete(combinedSideCord.side);
        }
    }, {
        key: "selectSection",
        value: function selectSection(singleSide) {
            var connectionSet = score.getConnectionSet(singleSide, singleSide.team, this);
            this.selected = connectionSet;
        }
    }, {
        key: "currentStateScore",
        value: function currentStateScore(team) {
            if (settings.mode == "home") {
                return score.allTeamHomeMode(this, team).score;
            } else {
                return score.allTeamScore(this, team).score;
            }
        }
    }, {
        key: "teamHighlight",
        value: function teamHighlight(team) {
            if (settings.mode == "home") {
                this.selected = score.allTeamHomeMode(this, team);
            } else {
                this.selected = score.allTeamScore(this, team);
            }
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
            return this.getHex(x, y) === undefined;
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
            this.combinedSides = new Map();
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = hexagons[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var centerHexagon = _step.value;
                    var _iteratorNormalCompletion2 = true;
                    var _didIteratorError2 = false;
                    var _iteratorError2 = undefined;

                    try {
                        for (var _iterator2 = centerHexagon.sides[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                            var side = _step2.value;

                            //so we don't create every combine twice)
                            if (this.getCombinedSide(side) === undefined) {
                                if (this.combinedSides.get(side.x) === undefined) {
                                    this.combinedSides.set(side.x, new Map());
                                }
                                var row = this.combinedSides.get(side.x);
                                if (row.get(side.y) === undefined) {
                                    row.set(side.y, new Map());
                                }
                                var rowColumn = row.get(side.y);
                                rowColumn.set(side.side, new _combinedSide.CombinedSide(side, this));
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

        //is this better defined as hexagon class method?

    }, {
        key: "hexagonInput",
        value: function hexagonInput(clickedHexagon, pointer) {
            if (settings.mapEdit) {
                this.destroyHex(clickedHexagon.data.model.x, clickedHexagon.data.model.y);
                //clickedHexagon.game.world.remove(clickedHexagon);
                clickedHexagon.kill();
                //clickedHexagon.destroy();
            } else {
                teamInfo.makeMove();
                var rotationAmt = void 0;
                if (clickedHexagon.data.model.rotation === "right") {
                    rotationAmt = 1;
                } else if (clickedHexagon.data.model.rotation === "left") {
                    rotationAmt = -1;
                } else if (clickedHexagon.data.model.rotation === "both") {
                    //using ctrlKey instead has a bug in phaser 2.6.2 https://github.com/photonstorm/phaser/issues/2167
                    if (pointer.leftButton.altKey) {
                        rotationAmt = -1;
                    } else {
                        rotationAmt = 1;
                    }
                }
                clickedHexagon.data.model.rotate(rotationAmt);
                if (teamInfo.endOfRound()) {
                    var _iteratorNormalCompletion3 = true;
                    var _didIteratorError3 = false;
                    var _iteratorError3 = undefined;

                    try {
                        for (var _iterator3 = teamInfo.teams[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                            var team = _step3.value;

                            if (settings.mode == "home") {
                                team.score += score.allTeamHomeMode(this, team).score;
                            } else {
                                team.score += score.allTeamScore(this, team).score;
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
                this.checkWinCondition();
            }
        }
    }, {
        key: "checkWinCondition",
        value: function checkWinCondition() {
            var teamCords = new Map();
            var _iteratorNormalCompletion4 = true;
            var _didIteratorError4 = false;
            var _iteratorError4 = undefined;

            try {
                for (var _iterator4 = this.characterArray[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                    var character = _step4.value;

                    if (!teamCords.has(character.team)) {
                        teamCords.set(character.team, character.cords);
                    } else {
                        var alreadySeenCords = teamCords.get(character.team);
                        if (!this.getCombinedSide(alreadySeenCords).equals(character.cords)) {
                            return false;
                        }
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

            alert("you won!");
            return true;
        }
    }, {
        key: "characterInput",
        value: function characterInput(clickedCharacter, pointer) {
            if (settings.mapEdit) {
                //this.characters.get(x).delete(y);
                //this.destroyHex(clickedHexagon.data.model.x, clickedHexagon.data.model.y);
                clickedCharacter.kill();
            }
        }
    }, {
        key: "parseGridCords",
        value: function parseGridCords(cordData) {
            var withoutBrackets = cordData.substring(1, cordData.length - 1);

            var _withoutBrackets$spli = withoutBrackets.split(","),
                _withoutBrackets$spli2 = _slicedToArray(_withoutBrackets$spli, 2),
                x = _withoutBrackets$spli2[0],
                y = _withoutBrackets$spli2[1];

            return { x: parseInt(x), y: parseInt(y) };
        }
    }, {
        key: "parseDataString",
        value: function parseDataString(dataString) {
            var _dataString$split = dataString.split("-"),
                _dataString$split2 = _slicedToArray(_dataString$split, 2),
                hexagonsData = _dataString$split2[0],
                characterData = _dataString$split2[1];

            var hexagons = new Map();
            var _iteratorNormalCompletion5 = true;
            var _didIteratorError5 = false;
            var _iteratorError5 = undefined;

            try {
                for (var _iterator5 = hexagonsData.split("|")[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                    var hexagonData = _step5.value;

                    if (hexagonData == "E") {
                        continue;
                    }

                    var _hexagonData$split = hexagonData.split(")"),
                        _hexagonData$split2 = _toArray(_hexagonData$split),
                        cordData = _hexagonData$split2[0],
                        sideData = _hexagonData$split2[1],
                        rest = _hexagonData$split2.slice(2);

                    var cords = this.parseGridCords(cordData + ")");
                    if (hexagons.get(cords.x) === undefined) {
                        hexagons.set(cords.x, new Map());
                    }
                    hexagons.get(cords.x).set(cords.y, new _hexagon.Hexagon(sideData, cords, this));
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

            this.hexagons = hexagons;
            this.characters = this.parseCharacters(characterData);
            return hexagons;
        }
    }, {
        key: "parseCharacters",
        value: function parseCharacters(characterData) {
            var characters = new Map();
            if (characterData === "") {
                return characters;
            }
            var _iteratorNormalCompletion6 = true;
            var _didIteratorError6 = false;
            var _iteratorError6 = undefined;

            try {
                for (var _iterator6 = characterData.split(":")[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                    var characterCord = _step6.value;

                    var _characterCord$split$ = characterCord.split(",").map(Number),
                        _characterCord$split$2 = _slicedToArray(_characterCord$split$, 4),
                        x = _characterCord$split$2[0],
                        y = _characterCord$split$2[1],
                        side = _characterCord$split$2[2],
                        team = _characterCord$split$2[3];

                    if (characters.get(x) === undefined) {
                        characters.set(x, new Map());
                    }
                    var characterColumn = characters.get(x);
                    if (characterColumn.get(y) === undefined) {
                        characterColumn.set(y, new Map());
                    }
                    var characterHex = characterColumn.get(y);
                    var character = new _Character.Character(this, { x: x, y: y, side: side }, teamInfo.teams[team]);
                    characterHex.set(side, character);
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

            return characters;
        }
    }, {
        key: "gridWidth",
        get: function get() {
            if (this.hexagons.size === 0) {
                return 0;
            } else {
                return Math.max.apply(Math, _toConsumableArray(this.hexagons.keys()));
            }
        }
    }, {
        key: "gridHeight",
        get: function get() {
            var currentMax = 0;
            var _iteratorNormalCompletion7 = true;
            var _didIteratorError7 = false;
            var _iteratorError7 = undefined;

            try {
                for (var _iterator7 = this.hexagons.values()[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
                    var row = _step7.value;

                    currentMax = Math.max.apply(Math, [currentMax].concat(_toConsumableArray(row.keys())));
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

            return currentMax;
        }
    }, {
        key: "hexArray",
        get: function get() {
            var hexArray = [];
            var _iteratorNormalCompletion8 = true;
            var _didIteratorError8 = false;
            var _iteratorError8 = undefined;

            try {
                for (var _iterator8 = this.hexagons.values()[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
                    var hexRow = _step8.value;

                    hexArray = hexArray.concat(Array.from(hexRow.values()));
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

            return hexArray;
        }
    }, {
        key: "characterArray",
        get: function get() {
            var characterArray = [];
            var _iteratorNormalCompletion9 = true;
            var _didIteratorError9 = false;
            var _iteratorError9 = undefined;

            try {
                for (var _iterator9 = this.characters.values()[Symbol.iterator](), _step9; !(_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done); _iteratorNormalCompletion9 = true) {
                    var characterRow = _step9.value;
                    var _iteratorNormalCompletion10 = true;
                    var _didIteratorError10 = false;
                    var _iteratorError10 = undefined;

                    try {
                        for (var _iterator10 = characterRow.values()[Symbol.iterator](), _step10; !(_iteratorNormalCompletion10 = (_step10 = _iterator10.next()).done); _iteratorNormalCompletion10 = true) {
                            var characterHex = _step10.value;

                            characterArray = characterArray.concat(Array.from(characterHex.values()));
                        }
                    } catch (err) {
                        _didIteratorError10 = true;
                        _iteratorError10 = err;
                    } finally {
                        try {
                            if (!_iteratorNormalCompletion10 && _iterator10.return) {
                                _iterator10.return();
                            }
                        } finally {
                            if (_didIteratorError10) {
                                throw _iteratorError10;
                            }
                        }
                    }
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

            return characterArray;
        }
    }, {
        key: "combinedSidesArray",
        get: function get() {
            var array = [];
            var _iteratorNormalCompletion11 = true;
            var _didIteratorError11 = false;
            var _iteratorError11 = undefined;

            try {
                for (var _iterator11 = this.combinedSides.values()[Symbol.iterator](), _step11; !(_iteratorNormalCompletion11 = (_step11 = _iterator11.next()).done); _iteratorNormalCompletion11 = true) {
                    var row = _step11.value;
                    var _iteratorNormalCompletion12 = true;
                    var _didIteratorError12 = false;
                    var _iteratorError12 = undefined;

                    try {
                        for (var _iterator12 = row.values()[Symbol.iterator](), _step12; !(_iteratorNormalCompletion12 = (_step12 = _iterator12.next()).done); _iteratorNormalCompletion12 = true) {
                            var xy = _step12.value;
                            var _iteratorNormalCompletion13 = true;
                            var _didIteratorError13 = false;
                            var _iteratorError13 = undefined;

                            try {
                                for (var _iterator13 = xy.values()[Symbol.iterator](), _step13; !(_iteratorNormalCompletion13 = (_step13 = _iterator13.next()).done); _iteratorNormalCompletion13 = true) {
                                    var combinedSide = _step13.value;

                                    array.push(combinedSide);
                                }
                            } catch (err) {
                                _didIteratorError13 = true;
                                _iteratorError13 = err;
                            } finally {
                                try {
                                    if (!_iteratorNormalCompletion13 && _iterator13.return) {
                                        _iterator13.return();
                                    }
                                } finally {
                                    if (_didIteratorError13) {
                                        throw _iteratorError13;
                                    }
                                }
                            }
                        }
                    } catch (err) {
                        _didIteratorError12 = true;
                        _iteratorError12 = err;
                    } finally {
                        try {
                            if (!_iteratorNormalCompletion12 && _iterator12.return) {
                                _iterator12.return();
                            }
                        } finally {
                            if (_didIteratorError12) {
                                throw _iteratorError12;
                            }
                        }
                    }
                }
            } catch (err) {
                _didIteratorError11 = true;
                _iteratorError11 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion11 && _iterator11.return) {
                        _iterator11.return();
                    }
                } finally {
                    if (_didIteratorError11) {
                        throw _iteratorError11;
                    }
                }
            }

            return array;
        }
    }, {
        key: "dataString",
        get: function get() {
            var hexagons = [];
            var _iteratorNormalCompletion14 = true;
            var _didIteratorError14 = false;
            var _iteratorError14 = undefined;

            try {
                for (var _iterator14 = Array.from(this.hexagons.keys()).sort()[Symbol.iterator](), _step14; !(_iteratorNormalCompletion14 = (_step14 = _iterator14.next()).done); _iteratorNormalCompletion14 = true) {
                    var x = _step14.value;
                    var _iteratorNormalCompletion16 = true;
                    var _didIteratorError16 = false;
                    var _iteratorError16 = undefined;

                    try {
                        for (var _iterator16 = Array.from(this.hexagons.get(x).keys()).sort()[Symbol.iterator](), _step16; !(_iteratorNormalCompletion16 = (_step16 = _iterator16.next()).done); _iteratorNormalCompletion16 = true) {
                            var y = _step16.value;

                            hexagons.push("(" + x + "," + y + ")" + this.getHex(x, y).sidesAsString());
                        }
                    } catch (err) {
                        _didIteratorError16 = true;
                        _iteratorError16 = err;
                    } finally {
                        try {
                            if (!_iteratorNormalCompletion16 && _iterator16.return) {
                                _iterator16.return();
                            }
                        } finally {
                            if (_didIteratorError16) {
                                throw _iteratorError16;
                            }
                        }
                    }
                }
            } catch (err) {
                _didIteratorError14 = true;
                _iteratorError14 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion14 && _iterator14.return) {
                        _iterator14.return();
                    }
                } finally {
                    if (_didIteratorError14) {
                        throw _iteratorError14;
                    }
                }
            }

            var characters = [];
            var _iteratorNormalCompletion15 = true;
            var _didIteratorError15 = false;
            var _iteratorError15 = undefined;

            try {
                for (var _iterator15 = Array.from(this.characters.keys()).sort()[Symbol.iterator](), _step15; !(_iteratorNormalCompletion15 = (_step15 = _iterator15.next()).done); _iteratorNormalCompletion15 = true) {
                    var _x = _step15.value;
                    var _iteratorNormalCompletion17 = true;
                    var _didIteratorError17 = false;
                    var _iteratorError17 = undefined;

                    try {
                        for (var _iterator17 = Array.from(this.characters.get(_x).keys()).sort()[Symbol.iterator](), _step17; !(_iteratorNormalCompletion17 = (_step17 = _iterator17.next()).done); _iteratorNormalCompletion17 = true) {
                            var _y = _step17.value;
                            var _iteratorNormalCompletion18 = true;
                            var _didIteratorError18 = false;
                            var _iteratorError18 = undefined;

                            try {
                                for (var _iterator18 = Array.from(this.characters.get(_x).get(_y).keys()).sort()[Symbol.iterator](), _step18; !(_iteratorNormalCompletion18 = (_step18 = _iterator18.next()).done); _iteratorNormalCompletion18 = true) {
                                    var side = _step18.value;

                                    var character = this.characters.get(_x).get(_y).get(side);
                                    characters.push([character.x, character.y, character.side, character.team.number].join(","));
                                }
                            } catch (err) {
                                _didIteratorError18 = true;
                                _iteratorError18 = err;
                            } finally {
                                try {
                                    if (!_iteratorNormalCompletion18 && _iterator18.return) {
                                        _iterator18.return();
                                    }
                                } finally {
                                    if (_didIteratorError18) {
                                        throw _iteratorError18;
                                    }
                                }
                            }
                        }
                    } catch (err) {
                        _didIteratorError17 = true;
                        _iteratorError17 = err;
                    } finally {
                        try {
                            if (!_iteratorNormalCompletion17 && _iterator17.return) {
                                _iterator17.return();
                            }
                        } finally {
                            if (_didIteratorError17) {
                                throw _iteratorError17;
                            }
                        }
                    }
                }
            } catch (err) {
                _didIteratorError15 = true;
                _iteratorError15 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion15 && _iterator15.return) {
                        _iterator15.return();
                    }
                } finally {
                    if (_didIteratorError15) {
                        throw _iteratorError15;
                    }
                }
            }

            return hexagons.join("|") + "-" + characters.join(":");
        }
    }]);

    return Board;
}();

},{"../gridNavigation.js":24,"../score.js":31,"../teamInfo.js":33,"./Character.js":26,"./combinedSide.js":29,"./hexagon.js":30}],29:[function(require,module,exports){
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
                return this.board.selected.combinedSidesScores.has(this);
            } else {
                return 0;
            }
        }
    }, {
        key: 'score',
        get: function get() {
            if (!this.selected) {
                throw new Error("don't ask a combined side for it's score when not highlighted, only for use by side view");
            } else {
                return this.board.selected.sideScore(this);
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

},{"../gridNavigation.js":24}],30:[function(require,module,exports){
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
    function Hexagon(sideInfo, gridCords, board) {
        _classCallCheck(this, Hexagon);

        this.sides = [];
        this.gridCords = gridCords;
        if (sideInfo[0] == "!") {
            this.isHome = true;
            this.team = _teamInfo.teams[sideInfo[1]];
            for (var sideCount = 0; sideCount < 6; sideCount++) {
                this.sides.push(new _SingleSide.SingleSide(this.team, this, board));
            }
        } else {
            var rotationInfo = sideInfo[0];
            if (rotationInfo == "L") {
                this.rotation = "left";
                sideInfo = sideInfo.substring(1);
            } else if (rotationInfo == "R") {
                sideInfo = sideInfo.substring(1);
                this.rotation = "right";
            } else {
                this.rotation = "both";
            }
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = sideInfo.split(":")[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
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
        }
        if (this.sides.length != 6) {
            throw new Error("incorrect number of sides: " + sides.length);
        }
        this.combinedSides = new Map();
        this.listeners = new Set();
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
            if (this.isHome) {
                return "!" + this.team.number;
            } else {
                var rotationInfo = void 0;
                if (this.rotation == "left") {
                    rotationInfo = "L";
                } else if (this.rotation == "right") {
                    rotationInfo = "R";
                } else {
                    rotationInfo = "";
                }
                var _sides = [];
                var _iteratorNormalCompletion3 = true;
                var _didIteratorError3 = false;
                var _iteratorError3 = undefined;

                try {
                    for (var _iterator3 = this.sides[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                        var side = _step3.value;

                        _sides.push(side.asString);
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

                return rotationInfo + _sides.join(":");
            }
        }
    }, {
        key: "rotate",
        value: function rotate(amount) {
            if (this.rotation == "left" && amount > 0) {
                console.log("tired rotating wrong way");
                return;
            } else if (this.rotation == "right" && amount < 0) {
                console.log("tired rotating wrong way");
                return;
            }
            amount = amount % 6;
            //for anti-clockwise
            if (amount < 0) {
                var absoluteAmount = amount * -1;
                amount = 6 - absoluteAmount;
            }
            var rotationAllowed = false;
            var _iteratorNormalCompletion4 = true;
            var _didIteratorError4 = false;
            var _iteratorError4 = undefined;

            try {
                for (var _iterator4 = this.listeners[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                    var listener = _step4.value;

                    rotationAllowed |= listener.rotate(this.gridCords, amount);
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

            if (rotationAllowed) {
                for (var i = 0; i < amount; i++) {
                    this.sides.unshift(this.sides.pop());
                }
            }
        }
    }, {
        key: "addListener",
        value: function addListener(listener) {
            this.listeners.add(listener);
        }
    }, {
        key: "removeListener",
        value: function removeListener(listener) {
            this.listeners.delete(listener);
        }
    }, {
        key: "x",
        get: function get() {
            return this.gridCords.x;
        }
    }, {
        key: "y",
        get: function get() {
            return this.gridCords.y;
        }
    }, {
        key: "canRotate",
        get: function get() {
            var _iteratorNormalCompletion5 = true;
            var _didIteratorError5 = false;
            var _iteratorError5 = undefined;

            try {
                for (var _iterator5 = this.listeners[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                    var listener = _step5.value;

                    if (this.side(listener.side).team === listener.team && this.x == listener.x && this.y == listener.y) {
                        return true;
                    } else if (this.side((listener.side + 3) % 6).team === listener.team) {
                        return true;
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

            return false;
        }
    }]);

    return Hexagon;
}();

},{"../teamInfo.js":33,"./SingleSide.js":27}],31:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.scoreSettingsGui = scoreSettingsGui;
exports.allTeamHomeMode = allTeamHomeMode;
exports.allTeamScore = allTeamScore;
exports.getConnectionSet = getConnectionSet;

var _gridNavigation = require("./gridNavigation.js");

var gridNavigation = _interopRequireWildcard(_gridNavigation);

var _teamInfo = require("./teamInfo.js");

var teamInfo = _interopRequireWildcard(_teamInfo);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var scoreSettings = {
    perSideIncrease: 1
};

function scoreSettingsGui(gui) {
    var scoreFolder = gui.addFolder('scoring');
    scoreFolder.add(scoreSettings, 'perSideIncrease', 0, 20).step(1);
}

var ConnectionSet = function () {
    function ConnectionSet(combinedSidesScores) {
        _classCallCheck(this, ConnectionSet);

        this.combinedSidesScores = combinedSidesScores;
    }

    _createClass(ConnectionSet, [{
        key: "sideScore",
        value: function sideScore(combinedSide) {
            return this.combinedSidesScores.get(combinedSide) * scoreSettings.perSideIncrease;
        }
    }, {
        key: "score",
        get: function get() {
            var score = 0;
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = this.combinedSidesScores.values()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var setPosition = _step.value;

                    score += setPosition * scoreSettings.perSideIncrease;
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

var ConnectionSetGroup = function () {
    function ConnectionSetGroup(connectionSets) {
        _classCallCheck(this, ConnectionSetGroup);

        this.connectionSets = connectionSets;
    }

    //this only works if all connection sets are mutaly exclusive


    _createClass(ConnectionSetGroup, [{
        key: "sideScore",
        value: function sideScore(combinedSide) {
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = this.connectionSets[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var connectionSet = _step2.value;

                    if (connectionSet.combinedSidesScores.has(combinedSide)) {
                        return connectionSet.sideScore(combinedSide) * scoreSettings.perSideIncrease;
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
        }
    }, {
        key: "combinedSidesScores",
        get: function get() {
            var all = new Map();
            var _iteratorNormalCompletion3 = true;
            var _didIteratorError3 = false;
            var _iteratorError3 = undefined;

            try {
                for (var _iterator3 = this.connectionSets[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                    var connectionSet = _step3.value;
                    var _iteratorNormalCompletion4 = true;
                    var _didIteratorError4 = false;
                    var _iteratorError4 = undefined;

                    try {
                        for (var _iterator4 = connectionSet.combinedSidesScores.entries()[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                            var _step4$value = _slicedToArray(_step4.value, 2),
                                combinedSide = _step4$value[0],
                                score = _step4$value[1];

                            all.set(combinedSide, score);
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

            return all;
        }
    }, {
        key: "score",
        get: function get() {
            var totalScore = 0;
            var _iteratorNormalCompletion5 = true;
            var _didIteratorError5 = false;
            var _iteratorError5 = undefined;

            try {
                for (var _iterator5 = this.connectionSets[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                    var connectionSet = _step5.value;

                    totalScore += connectionSet.score;
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

            return totalScore;
        }
    }]);

    return ConnectionSetGroup;
}();

function allTeamHomeMode(board, team) {
    var connectionSets = [];
    var allSearchedSides = new Set();
    var _iteratorNormalCompletion6 = true;
    var _didIteratorError6 = false;
    var _iteratorError6 = undefined;

    try {
        for (var _iterator6 = board.hexArray[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
            var hex = _step6.value;

            if (hex.isHome && hex.team === team) {
                //all sides of a home belong to the same team
                var startingCombinedSide = board.getCombinedSide(hex.side(0));
                if (!allSearchedSides.has(startingCombinedSide)) {
                    var newConnectionSet = getConnectionSet(startingCombinedSide, team, board);
                    connectionSets.push(newConnectionSet);
                    allSearchedSides = new Set([].concat(_toConsumableArray(allSearchedSides), _toConsumableArray(newConnectionSet.combinedSidesScores.keys())));
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

    return new ConnectionSetGroup(connectionSets);
}

function allTeamScore(board, team) {
    var connectionSets = [];
    var allSearchedSides = new Set();
    var _iteratorNormalCompletion7 = true;
    var _didIteratorError7 = false;
    var _iteratorError7 = undefined;

    try {
        for (var _iterator7 = board.hexArray[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
            var hex = _step7.value;
            var _iteratorNormalCompletion8 = true;
            var _didIteratorError8 = false;
            var _iteratorError8 = undefined;

            try {
                for (var _iterator8 = hex.sides[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
                    var side = _step8.value;

                    var startingCombinedSide = board.getCombinedSide(side);
                    if (!allSearchedSides.has(startingCombinedSide)) {
                        var newConnectionSet = getConnectionSet(startingCombinedSide, team, board);
                        connectionSets.push(newConnectionSet);
                        allSearchedSides = new Set([].concat(_toConsumableArray(allSearchedSides), _toConsumableArray(newConnectionSet.combinedSidesScores.keys())));
                    }
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

    return new ConnectionSetGroup(connectionSets);
}

function alreadyUsed(connects, combinedSide, board) {
    var _arr = [combinedSide, board.getCombinedSide(combinedSide.alternativeCords)];

    for (var _i = 0; _i < _arr.length; _i++) {
        var cord = _arr[_i];var _iteratorNormalCompletion9 = true;
        var _didIteratorError9 = false;
        var _iteratorError9 = undefined;

        try {
            for (var _iterator9 = connects[Symbol.iterator](), _step9; !(_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done); _iteratorNormalCompletion9 = true) {
                var connect = _step9.value;

                if (connect.get(combinedSide) !== undefined) {
                    return true;
                }
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
    }
    return false;
}

function getConnectionSet(startCord, team, board) {
    var startCombinedSide = board.getCombinedSide(startCord);
    var connection = new Map();
    var _iteratorNormalCompletion10 = true;
    var _didIteratorError10 = false;
    var _iteratorError10 = undefined;

    try {
        for (var _iterator10 = startCombinedSide.hexSideTeams[Symbol.iterator](), _step10; !(_iteratorNormalCompletion10 = (_step10 = _iterator10.next()).done); _iteratorNormalCompletion10 = true) {
            var nextTeam = _step10.value;

            if (team === nextTeam) {
                growConnect(board, startCombinedSide, connection, nextTeam);
                break;
            }
        }
    } catch (err) {
        _didIteratorError10 = true;
        _iteratorError10 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion10 && _iterator10.return) {
                _iterator10.return();
            }
        } finally {
            if (_didIteratorError10) {
                throw _iteratorError10;
            }
        }
    }

    return new ConnectionSet(connection);
}

//warning: existing nodes is shittily update in function, not reutrned
function growConnect(board, currentCombinedSide, existingNodes, team) {
    existingNodes.set(currentCombinedSide, existingNodes.size);
    var _arr2 = [-2, -1, 1, 2];
    for (var _i2 = 0; _i2 < _arr2.length; _i2++) {
        var direction = _arr2[_i2];
        var nextCombined = board.moveToAdjacentCombinedSide(currentCombinedSide, direction);
        if (nextCombined !== undefined && !existingNodes.has(nextCombined)) {
            var _iteratorNormalCompletion11 = true;
            var _didIteratorError11 = false;
            var _iteratorError11 = undefined;

            try {
                for (var _iterator11 = nextCombined.hexSideTeams[Symbol.iterator](), _step11; !(_iteratorNormalCompletion11 = (_step11 = _iterator11.next()).done); _iteratorNormalCompletion11 = true) {
                    var nextTeam = _step11.value;

                    if (team === nextTeam) {
                        growConnect(board, nextCombined, existingNodes, team);
                        break;
                    }
                }
            } catch (err) {
                _didIteratorError11 = true;
                _iteratorError11 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion11 && _iterator11.return) {
                        _iterator11.return();
                    }
                } finally {
                    if (_didIteratorError11) {
                        throw _iteratorError11;
                    }
                }
            }
        }
    }
}

},{"./gridNavigation.js":24,"./teamInfo.js":33}],32:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.evenRandomWithHomes = evenRandomWithHomes;
exports.evenRandom = evenRandom;
exports.random = random;
exports.even = even;
var mappingForDatGui = exports.mappingForDatGui = new Map([["random", random], ["even", even], ["evenRandom", evenRandom]]);

function generateCharacters(gridWidth, gridHeight) {
    var characters = [];
    //we need at least 2 for it to be playable
    for (var i = 0; i < 2; i++) {
        var x = Math.floor(Math.random() * gridWidth);
        var y = Math.floor(Math.random() * gridHeight);
        var side = Math.floor(Math.random() * 6);
        characters.push([x, y, side, 0].join(","));
    }
    for (var character_number = 0; character_number < 15; character_number++) {
        if (Math.random() > 0.5) {
            continue;
        }
        var _x = Math.floor(Math.random() * gridWidth);
        var _y = Math.floor(Math.random() * gridHeight);
        var _side = Math.floor(Math.random() * 6);
        var team = Math.floor(Math.random() * 2);
        characters.push([_x, _y, _side, team].join(","));
    }
    return characters.join(":");
}

function buildBoard(sideGenerator, gridWidth, gridHeight) {
    var hexagons = [];
    for (var x = 0; x < gridWidth; x++) {
        for (var y = 0; y < gridHeight; y++) {
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

            hexagons.push("(" + x + "," + y + ")" + sides.join(":"));
        }
    }
    return hexagons.join("|") + "-" + generateCharacters(gridWidth, gridHeight);
}

function evenRandomWithHomes(teams, gridWidth, gridHeight) {
    function sideGenerator() {
        var sideSelection = [0, 0, 1, 1, 2, 2];
        var sides = [];
        for (var sideNumber = 0; sideNumber < 6; sideNumber++) {
            sides.push(sideSelection[Math.floor(Math.random()) % 6]);
        }
        return sides;
    }
    return buildBoard(sideGenerator, gridWidth, gridHeight);
}

function evenRandom(teams, gridWidth, gridHeight) {
    function sideGenerator() {
        var sideSelection = [0, 0, 1, 1, 2, 2];
        var sides = [];
        for (var sideNumber = 0; sideNumber < 6; sideNumber++) {
            var nextSide = sideSelection.splice(Math.floor(Math.random() * sideSelection.length) % sideSelection.length, 1);
            sides.push(nextSide[0]);
        }
        return sides;
    }
    return buildBoard(sideGenerator, gridWidth, gridHeight);
}

function random(teams, gridWidth, gridHeight) {
    function sideGenerator() {
        var sides = [0];
        for (var sideNumber = 0; sideNumber < 5; sideNumber++) {
            if (Math.random() > 0.5) {
                sides.push(Math.floor(Math.random() * teams.length));
            } else {
                sides.unshift(Math.floor(Math.random() * teams.length));
            }
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

},{}],33:[function(require,module,exports){
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
    colour: 0x666666, //0x0000ff,
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

},{}],34:[function(require,module,exports){
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

            if (this.data.model.selected && false) {
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

},{"../geometry.js":23}],35:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Board = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

exports.boardSettingsGui = boardSettingsGui;

var _hexagon = require("./hexagon.js");

var _combinedSide = require("./combinedSide.js");

var _dashboard = require("./dashboard.js");

var _teamInfo = require("../teamInfo.js");

var teamInfo = _interopRequireWildcard(_teamInfo);

var _character = require("./character.js");

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var boardSettings = {
    spaceFactor: 0.6,
    sideLength: 10
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
        return width / (1.5 * gridWidth + 1) / 2;
    } else {
        return height / (2 * Math.sin(Math.PI / 3) * gridHeight + 1.5 * Math.sin(Math.PI / 3)) / 2;
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
        _this.data.gui = gui;
        _this.data.sideLengthGui = gui.add(_this.data, 'sideLength', sideLength * 0.5, sideLength * 2);
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

        _this.characters = [];
        var _iteratorNormalCompletion3 = true;
        var _didIteratorError3 = false;
        var _iteratorError3 = undefined;

        try {
            for (var _iterator3 = model.characterArray[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                var characterModel = _step3.value;

                var character = new _character.Character(game, _this, characterModel, model.characterInput);
                _this.data.gameBoardGroup.addChild(character);
                _this.characters.push(character);
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

        return _this;
    }

    _createClass(Board, [{
        key: "destroy",
        value: function destroy(destroyChildren, destroyTexture) {
            this.data.gui.remove(this.data.sideLengthGui);
            _get(Board.prototype.__proto__ || Object.getPrototypeOf(Board.prototype), "destroy", this).call(this, destroyChildren, destroyTexture);
        }
    }, {
        key: "update",
        value: function update() {
            var _iteratorNormalCompletion4 = true;
            var _didIteratorError4 = false;
            var _iteratorError4 = undefined;

            try {
                for (var _iterator4 = this.hexagons[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                    var hexagon = _step4.value;

                    hexagon.update();
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

            var _iteratorNormalCompletion5 = true;
            var _didIteratorError5 = false;
            var _iteratorError5 = undefined;

            try {
                for (var _iterator5 = this.combinedSides[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                    var combinedSide = _step5.value;

                    combinedSide.update();
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

            var _iteratorNormalCompletion6 = true;
            var _didIteratorError6 = false;
            var _iteratorError6 = undefined;

            try {
                for (var _iterator6 = this.characters[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                    var character = _step6.value;

                    character.update();
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

},{"../teamInfo.js":33,"./character.js":36,"./combinedSide.js":37,"./dashboard.js":38,"./hexagon.js":39}],36:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Character = undefined;

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

var Character = exports.Character = function (_Phaser$Sprite) {
    _inherits(Character, _Phaser$Sprite);

    function Character(game, boardView, model, inputDownCallback) {
        _classCallCheck(this, Character);

        var _this = _possibleConstructorReturn(this, (Character.__proto__ || Object.getPrototypeOf(Character)).call(this, game, 0, 0));

        _this.data.boardView = boardView;
        _this.data.model = model;
        var worldCords = boardView.calculateWorldCords(_this.data.model.cords);
        _this.x = worldCords.x;
        _this.y = worldCords.y;
        _this.interpolation = 0;
        _this.data.graphics = new Phaser.Graphics(game, 0, 0);
        _this.addChild(_this.data.graphics);
        _this.data.oldSide = _this.data.model.cords.side;
        _this.events.onInputDown.add(inputDownCallback, _this.data.boardView.data.model);
        return _this;
    }

    _createClass(Character, [{
        key: 'interpolationAmount',
        value: function interpolationAmount(midPoint) {
            if (this.data.oldSide != this.data.model.cords.side) {
                this.animate = true;
                this.data.oldSide = this.data.model.cords.side;
            } else if (!this.animate) {
                return midPoint;
            }
            this.maxInterpolation = 50;
            if (this.interpolation >= this.maxInterpolation) {
                this.interpolation = 0;
                this.animate = false;
            } else if (this.animate === true) {
                this.interpolation++;
            }
            var hexPoints = geometry.relativeScaledHexPoints(this.data.boardView.outerSideLength);
            var start = void 0;
            var end = void 0;
            if (this.data.model.lastRotation == 5) {
                //1 less then max is same as -1
                start = hexPoints[(this.data.model.cords.side + 2) % 6];
                end = hexPoints[(this.data.model.cords.side + 1) % 6];
            } else {
                start = hexPoints[(this.data.model.cords.side + 5) % 6];
                end = hexPoints[(this.data.model.cords.side + 6) % 6];
            }
            var midPoint2 = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
            var interpolationPercent = this.interpolation / this.maxInterpolation;
            var intX = (midPoint.x - midPoint2.x) * interpolationPercent;
            return {
                x: midPoint2.x + (midPoint.x - midPoint2.x) * interpolationPercent,
                y: midPoint2.y + (midPoint.y - midPoint2.y) * interpolationPercent
            };
        }
    }, {
        key: 'refreshPosition',
        value: function refreshPosition() {
            var worldCords = this.data.boardView.calculateWorldCords(this.data.model.cords);
            this.x = worldCords.x;
            this.y = worldCords.y;
            var hexPoints = geometry.relativeScaledHexPoints(this.data.boardView.outerSideLength);
            var start = hexPoints[this.data.model.cords.side];
            var end = hexPoints[(this.data.model.cords.side + 1) % 6];
            var midPoint = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
            //let interpolationAmount = this.interpolationAmount();
            //midPoint.x += this.interpolationAmount.x;
            //midPoint.y += this.interpolationAmount.y;
            var withInterpolation = this.interpolationAmount(midPoint);
            this.data.graphics.x = withInterpolation.x;
            this.data.graphics.y = withInterpolation.y;
            //this.data.graphics.x = midPoint.x;
            //this.data.graphics.y = midPoint.y;
        }
    }, {
        key: 'update',
        value: function update() {
            this.refreshPosition();
            this.data.graphics.clear();
            //now drawing
            //cause this doesnt change, we should cache bro
            this.data.graphics.lineStyle(2, '#ffffff');
            this.data.graphics.beginFill(this.data.model.team.colour, 0.5);
            //this and alpha are temp hacks to show overlaping characters of different colours
            var teamScale = 1 + 0.5 * this.data.model.team.number;
            this.data.graphics.drawCircle(0, 0, this.data.boardView.outerSideLength * teamScale / 10);
            this.data.graphics.endFill();
            this.data.graphics.lineStyle(5, 0x00000);
            //always point inwards because inner hex always has a matching side
            /*this.data.graphics.moveTo(0, this.data.boardView.outerSideLength/10);
            this.data.graphics.lineTo(0, this.data.boardView.outerSideLength/10 + 20);
            if(this.data.model.oppositeSideMatches()){
                this.data.graphics.moveTo(0, - this.data.boardView.outerSideLength/10);
                this.data.graphics.lineTo(0, - this.data.boardView.outerSideLength/10 - 20);
            }*/
        }
    }]);

    return Character;
}(Phaser.Sprite);

},{"../geometry.js":23}],37:[function(require,module,exports){
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
    thickness: 0,
    alpha: 1
};

var combinedColours = {
    team_0_1: 0xff0000, //0xffb000,
    team_1_2: 0x666666, //0x00ff00,
    team_2_0: 0xff0000 };

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
        var end = hexPoints[(_this.data.model.cords.side + 1) % 6];
        _this.data.graphics = new Phaser.Graphics(game, start.x, start.y);
        _this.addChild(_this.data.graphics);
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
            var end = hexPoints[(this.data.model.cords.side + 1) % 6];
            this.data.graphics.x = start.x;
            this.data.graphics.y = start.y;
            this.data.text.x = (start.x + end.x) / 2;
            this.data.text.y = (start.y + end.y) / 2;
        }
    }, {
        key: 'update',
        value: function update() {
            this.refreshPosition();
            var externalTangentAngle = 60;
            this.data.graphics.angle = externalTangentAngle * this.data.model.cords.side;
            this.data.graphics.clear();
            var hexSideTeams = this.data.model.hexSideTeams;
            if (hexSideTeams.length === 0) {
                return;
            }
            var firstTeam = hexSideTeams[0];
            var colour = void 0;
            if (hexSideTeams.length === 2) {
                var secondTeam = hexSideTeams[1];
                colour = this.manualCombine(firstTeam, secondTeam);
            } else {
                colour = firstTeam.colour;
            }
            if (this.data.model.selected && false) {
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
            //temp disable score display
            this.data.text.visible = false;
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

},{"../geometry.js":23}],38:[function(require,module,exports){
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
        _this.data.currentStateTeamDisplay = [];
        _this.addChild(new Phaser.Text(_this.game, 0, 70, "Total Scores:"));
        _this.addChild(new Phaser.Text(_this.game, 0, 150, "Current Round:"));
        _this.data.boardModel = boardModel;
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = teamInfo.teams.entries()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var _step$value = _slicedToArray(_step.value, 2),
                    index = _step$value[0],
                    team = _step$value[1];

                var teamDisplayGroup = _this.teamHighlights(team, index * 50, 110, 30, 30);
                _this.data.teamsDisplay.push(teamDisplayGroup);
                _this.addChild(teamDisplayGroup);
                var currentStateTeamDisplayGroup = _this.currentStateTeamHighlights(team, index * 50, 190, 30, 30);
                _this.data.currentStateTeamDisplay.push(currentStateTeamDisplayGroup);
                _this.addChild(currentStateTeamDisplayGroup);
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

        _this.moveCounter = new Phaser.Graphics(game, 0, _this.data.height / 2);
        _this.addChild(_this.moveCounter);
        _this.data.highlightedSectionScore = new Phaser.Text(game, 0, 10, "", { wordWrap: true, wordWrapWidth: width, fontSize: 15 });
        _this.addChild(_this.data.highlightedSectionScore);
        _this.data.highlightedSectionScoreBonus = new Phaser.Text(game, 0, 40, "", { wordWrap: true, wordWrapWidth: width, fontSize: 15 });
        _this.addChild(_this.data.highlightedSectionScoreBonus);
        return _this;
    }

    _createClass(Dashboard, [{
        key: "currentStateTeamHighlights",
        value: function currentStateTeamHighlights(team, x, y, width, height) {
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
            this.data.boardModel.teamHighlight(team);
            this.data.boardModel.currentStateScore(team);
            var boardModel = this.data.boardModel;
            scoreText.update = function () {
                this.text = boardModel.currentStateScore(team);
            };
            return group;
        }
    }, {
        key: "teamHighlights",
        value: function teamHighlights(team, x, y, width, height) {
            var group = new Phaser.Group(this.game, this);
            var teamHighlight = new Phaser.Graphics(this.game, x, y);
            teamHighlight.beginFill(team.colour);
            teamHighlight.drawRect(0, 0, width, height);
            teamHighlight.endFill();
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
            /*for(let teamDisplayGroup of this.data.teamsDisplay){
                teamDisplayGroup.update();
            }
            for(let currentStateTeamDisplayGroup of this.data.currentStateTeamDisplay){
                currentStateTeamDisplayGroup.update();
            }
            this.moveCounter.clear();
            let score;
            let bonus;
            if(this.data.boardModel.selected === undefined){
                score = 0;
            }else{
                score = this.data.boardModel.selected.score;
            }
            bonus = 0;
            this.data.highlightedSectionScore.text = "Highlighted Score: " + score;
            this.data.highlightedSectionScoreBonus.text = "Size Bonus: " + bonus;
            const currentTeam = this.data.teamInfo.currentTeam;
            const moveLimit = this.data.teamInfo.settings.standardMoveLimit;
            /*this.moveCounter.beginFill(currentTeam.colour);
            let radius = Math.min(this.data.width, this.data.height)/2;
            let center = {x: this.data.width/2, y: 0};
            if(currentTeam.movesLeft == moveLimit){
                //arc draws in discreat segments, so leaves a gap for full circles
                this.moveCounter.drawCircle(center.x, center.y, radius*2);
            }else{
                let percentOfCircle = currentTeam.movesLeft/moveLimit;
                let endAngleRadians = -Math.PI*2*percentOfCircle;
                let topOffset = -Math.PI/2;
                this.moveCounter.arc(center.x, center.y, radius, topOffset, topOffset+endAngleRadians, true, 128);
            }
            this.moveCounter.endFill();*/
        }
    }]);

    return Dashboard;
}(Phaser.Sprite);

},{"./combinedSide.js":37,"./hexagon.js":39}],39:[function(require,module,exports){
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
        _this.data.text.font = "arial";
        _this.data.text.fontSize = 8;
        //look at adding this to a group/image class with the graphics object
        _this.addChild(_this.data.text);
        _this.chooseRotationIcon(game);
        return _this;
    }

    /*destroy(){
        let boardModel = this.data.boardView.data.model;
        let hexModel = this.data.model;
        //super.destroy();
        boardModel.hexagons.get(hexModel.x).delete(hexModel.y);
    }*/

    _createClass(Hexagon, [{
        key: "chooseRotationIcon",
        value: function chooseRotationIcon(game) {
            var rotation_icon = void 0;
            if (this.data.model.rotation == 'left') {
                rotation_icon = 'left_rotate';
            } else if (this.data.model.rotation == 'right') {
                rotation_icon = 'right_rotate';
            } else if (this.data.model.rotation == 'both') {
                return;
            } else {
                console.log("model has invlaid roation setting");
                return;
            }
            var rotation_sprite = new Phaser.Sprite(game, 0, 0, rotation_icon); //changing x and y by absoulutes is horrible, stop that
            rotation_sprite.scale.setTo(0.5, 0.5);
            this.addChild(rotation_sprite);
        }
    }, {
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
            if (this.data.model.canRotate) {
                this.data.body.beginFill(hexStyle.colour);
            } else {
                this.data.body.beginFill(hexStyle.colour, 0.25);
            }

            this.data.body.drawPolygon(geometry.relativeScaledHexPoints(this.data.boardView.innerSideLength));
            this.data.body.endFill();
            if (this.data.model.isHome) {
                this.data.body.beginFill('0x0066ff');
                this.data.body.drawCircle(0, 0, 20);
                this.data.body.endFill();
            }
        }
    }]);

    return Hexagon;
}(Phaser.Sprite);

},{"../geometry.js":23,"../teamInfo.js":33,"./SingleSide.js":34}]},{},[25])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvZXhkYXQvc3JjL2RhdC9jb2xvci9Db2xvci5qcyIsIm5vZGVfbW9kdWxlcy9leGRhdC9zcmMvZGF0L2NvbG9yL2ludGVycHJldC5qcyIsIm5vZGVfbW9kdWxlcy9leGRhdC9zcmMvZGF0L2NvbG9yL21hdGguanMiLCJub2RlX21vZHVsZXMvZXhkYXQvc3JjL2RhdC9jb2xvci90b1N0cmluZy5qcyIsIm5vZGVfbW9kdWxlcy9leGRhdC9zcmMvZGF0L2NvbnRyb2xsZXJzL0Jvb2xlYW5Db250cm9sbGVyLmpzIiwibm9kZV9tb2R1bGVzL2V4ZGF0L3NyYy9kYXQvY29udHJvbGxlcnMvQ29sb3JDb250cm9sbGVyLmpzIiwibm9kZV9tb2R1bGVzL2V4ZGF0L3NyYy9kYXQvY29udHJvbGxlcnMvQ29udHJvbGxlci5qcyIsIm5vZGVfbW9kdWxlcy9leGRhdC9zcmMvZGF0L2NvbnRyb2xsZXJzL0Z1bmN0aW9uQ29udHJvbGxlci5qcyIsIm5vZGVfbW9kdWxlcy9leGRhdC9zcmMvZGF0L2NvbnRyb2xsZXJzL051bWJlckNvbnRyb2xsZXIuanMiLCJub2RlX21vZHVsZXMvZXhkYXQvc3JjL2RhdC9jb250cm9sbGVycy9OdW1iZXJDb250cm9sbGVyQm94LmpzIiwibm9kZV9tb2R1bGVzL2V4ZGF0L3NyYy9kYXQvY29udHJvbGxlcnMvTnVtYmVyQ29udHJvbGxlclNsaWRlci5qcyIsIm5vZGVfbW9kdWxlcy9leGRhdC9zcmMvZGF0L2NvbnRyb2xsZXJzL09wdGlvbkNvbnRyb2xsZXIuanMiLCJub2RlX21vZHVsZXMvZXhkYXQvc3JjL2RhdC9jb250cm9sbGVycy9TdHJpbmdDb250cm9sbGVyLmpzIiwibm9kZV9tb2R1bGVzL2V4ZGF0L3NyYy9kYXQvY29udHJvbGxlcnMvZmFjdG9yeS5qcyIsIm5vZGVfbW9kdWxlcy9leGRhdC9zcmMvZGF0L2RvbS9DZW50ZXJlZERpdi5qcyIsIm5vZGVfbW9kdWxlcy9leGRhdC9zcmMvZGF0L2RvbS9kb20uanMiLCJub2RlX21vZHVsZXMvZXhkYXQvc3JjL2RhdC9ndWkvR1VJLmpzIiwibm9kZV9tb2R1bGVzL2V4ZGF0L3NyYy9kYXQvdXRpbHMvY29tbW9uLmpzIiwibm9kZV9tb2R1bGVzL2V4ZGF0L3NyYy9kYXQvdXRpbHMvY3NzLmpzIiwibm9kZV9tb2R1bGVzL2V4ZGF0L3NyYy9kYXQvdXRpbHMvZXNjYXBlSHRtbC5qcyIsIm5vZGVfbW9kdWxlcy9leGRhdC9zcmMvZGF0L3V0aWxzL3JlcXVlc3RBbmltYXRpb25GcmFtZS5qcyIsIm5vZGVfbW9kdWxlcy9leGRhdC9zcmMvaW5kZXguanMiLCJzb3VyY2VcXGdlb21ldHJ5LmpzIiwic291cmNlXFxncmlkTmF2aWdhdGlvbi5qcyIsInNvdXJjZVxcbWFpbi5qcyIsInNvdXJjZVxcbW9kZWxzXFxDaGFyYWN0ZXIuanMiLCJzb3VyY2VcXG1vZGVsc1xcU2luZ2xlU2lkZS5qcyIsInNvdXJjZVxcbW9kZWxzXFxib2FyZC5qcyIsInNvdXJjZVxcbW9kZWxzXFxjb21iaW5lZFNpZGUuanMiLCJzb3VyY2VcXG1vZGVsc1xcaGV4YWdvbi5qcyIsInNvdXJjZVxcc2NvcmUuanMiLCJzb3VyY2VcXHNpZGVHZW5lcmF0aW9uLmpzIiwic291cmNlXFx0ZWFtSW5mby5qcyIsInNvdXJjZVxcdmlld3NcXFNpbmdsZVNpZGUuanMiLCJzb3VyY2VcXHZpZXdzXFxib2FyZC5qcyIsInNvdXJjZVxcdmlld3NcXGNoYXJhY3Rlci5qcyIsInNvdXJjZVxcdmlld3NcXGNvbWJpbmVkU2lkZS5qcyIsInNvdXJjZVxcdmlld3NcXGRhc2hib2FyZC5qcyIsInNvdXJjZVxcdmlld3NcXGhleGFnb24uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDclZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25HQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0lBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeDNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKlxuICogZGF0LWd1aSBKYXZhU2NyaXB0IENvbnRyb2xsZXIgTGlicmFyeVxuICogaHR0cDovL2NvZGUuZ29vZ2xlLmNvbS9wL2RhdC1ndWlcbiAqXG4gKiBDb3B5cmlnaHQgMjAxMSBEYXRhIEFydHMgVGVhbSwgR29vZ2xlIENyZWF0aXZlIExhYlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqL1xuXG52YXIgY29tbW9uID0gcmVxdWlyZSgnLi4vdXRpbHMvY29tbW9uLmpzJyk7XG52YXIgdG9TdHJpbmcgPSByZXF1aXJlKCcuL3RvU3RyaW5nLmpzJyk7XG52YXIgbWF0aCA9IHJlcXVpcmUoJy4vbWF0aC5qcycpO1xudmFyIGludGVycHJldCA9IHJlcXVpcmUoJy4vaW50ZXJwcmV0LmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gQ29sb3I7XG5cbmZ1bmN0aW9uIENvbG9yKCkge1xuXG4gIHRoaXMuX19zdGF0ZSA9IGludGVycHJldC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXG4gIGlmICh0aGlzLl9fc3RhdGUgPT09IGZhbHNlKSB7XG4gICAgdGhyb3cgJ0ZhaWxlZCB0byBpbnRlcnByZXQgY29sb3IgYXJndW1lbnRzJztcbiAgfVxuXG4gIHRoaXMuX19zdGF0ZS5hID0gdGhpcy5fX3N0YXRlLmEgfHwgMTtcbn1cblxuQ29sb3IuQ09NUE9ORU5UUyA9IFsncicsICdnJywgJ2InLCAnaCcsICdzJywgJ3YnLCAnaGV4JywgJ2EnXTtcblxuY29tbW9uLmV4dGVuZChDb2xvci5wcm90b3R5cGUsIHtcblxuICB0b1N0cmluZzogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRvU3RyaW5nKHRoaXMpO1xuICB9LFxuXG4gIHRvT3JpZ2luYWw6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLl9fc3RhdGUuY29udmVyc2lvbi53cml0ZSh0aGlzKTtcbiAgfVxuXG59KTtcblxuZGVmaW5lUkdCQ29tcG9uZW50KENvbG9yLnByb3RvdHlwZSwgJ3InLCAyKTtcbmRlZmluZVJHQkNvbXBvbmVudChDb2xvci5wcm90b3R5cGUsICdnJywgMSk7XG5kZWZpbmVSR0JDb21wb25lbnQoQ29sb3IucHJvdG90eXBlLCAnYicsIDApO1xuXG5kZWZpbmVIU1ZDb21wb25lbnQoQ29sb3IucHJvdG90eXBlLCAnaCcpO1xuZGVmaW5lSFNWQ29tcG9uZW50KENvbG9yLnByb3RvdHlwZSwgJ3MnKTtcbmRlZmluZUhTVkNvbXBvbmVudChDb2xvci5wcm90b3R5cGUsICd2Jyk7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShDb2xvci5wcm90b3R5cGUsICdhJywge1xuXG4gIGdldDogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuX19zdGF0ZS5hO1xuICB9LFxuXG4gIHNldDogZnVuY3Rpb24odikge1xuICAgIHRoaXMuX19zdGF0ZS5hID0gdjtcbiAgfVxuXG59KTtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KENvbG9yLnByb3RvdHlwZSwgJ2hleCcsIHtcblxuICBnZXQ6IGZ1bmN0aW9uKCkge1xuXG4gICAgaWYgKCF0aGlzLl9fc3RhdGUuc3BhY2UgIT09ICdIRVgnKSB7XG4gICAgICB0aGlzLl9fc3RhdGUuaGV4ID0gbWF0aC5yZ2JfdG9faGV4KHRoaXMuciwgdGhpcy5nLCB0aGlzLmIpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLl9fc3RhdGUuaGV4O1xuXG4gIH0sXG5cbiAgc2V0OiBmdW5jdGlvbih2KSB7XG5cbiAgICB0aGlzLl9fc3RhdGUuc3BhY2UgPSAnSEVYJztcbiAgICB0aGlzLl9fc3RhdGUuaGV4ID0gdjtcblxuICB9XG5cbn0pO1xuXG5mdW5jdGlvbiBkZWZpbmVSR0JDb21wb25lbnQodGFyZ2V0LCBjb21wb25lbnQsIGNvbXBvbmVudEhleEluZGV4KSB7XG5cbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgY29tcG9uZW50LCB7XG5cbiAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuXG4gICAgICBpZiAodGhpcy5fX3N0YXRlLnNwYWNlID09PSAnUkdCJykge1xuICAgICAgICByZXR1cm4gdGhpcy5fX3N0YXRlW2NvbXBvbmVudF07XG4gICAgICB9XG5cbiAgICAgIHJlY2FsY3VsYXRlUkdCKHRoaXMsIGNvbXBvbmVudCwgY29tcG9uZW50SGV4SW5kZXgpO1xuXG4gICAgICByZXR1cm4gdGhpcy5fX3N0YXRlW2NvbXBvbmVudF07XG5cbiAgICB9LFxuXG4gICAgc2V0OiBmdW5jdGlvbih2KSB7XG5cbiAgICAgIGlmICh0aGlzLl9fc3RhdGUuc3BhY2UgIT09ICdSR0InKSB7XG4gICAgICAgIHJlY2FsY3VsYXRlUkdCKHRoaXMsIGNvbXBvbmVudCwgY29tcG9uZW50SGV4SW5kZXgpO1xuICAgICAgICB0aGlzLl9fc3RhdGUuc3BhY2UgPSAnUkdCJztcbiAgICAgIH1cblxuICAgICAgdGhpcy5fX3N0YXRlW2NvbXBvbmVudF0gPSB2O1xuXG4gICAgfVxuXG4gIH0pO1xuXG59XG5cbmZ1bmN0aW9uIGRlZmluZUhTVkNvbXBvbmVudCh0YXJnZXQsIGNvbXBvbmVudCkge1xuXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGNvbXBvbmVudCwge1xuXG4gICAgZ2V0OiBmdW5jdGlvbigpIHtcblxuICAgICAgaWYgKHRoaXMuX19zdGF0ZS5zcGFjZSA9PT0gJ0hTVicpXG4gICAgICAgIHJldHVybiB0aGlzLl9fc3RhdGVbY29tcG9uZW50XTtcblxuICAgICAgcmVjYWxjdWxhdGVIU1YodGhpcyk7XG5cbiAgICAgIHJldHVybiB0aGlzLl9fc3RhdGVbY29tcG9uZW50XTtcblxuICAgIH0sXG5cbiAgICBzZXQ6IGZ1bmN0aW9uKHYpIHtcblxuICAgICAgaWYgKHRoaXMuX19zdGF0ZS5zcGFjZSAhPT0gJ0hTVicpIHtcbiAgICAgICAgcmVjYWxjdWxhdGVIU1YodGhpcyk7XG4gICAgICAgIHRoaXMuX19zdGF0ZS5zcGFjZSA9ICdIU1YnO1xuICAgICAgfVxuXG4gICAgICB0aGlzLl9fc3RhdGVbY29tcG9uZW50XSA9IHY7XG5cbiAgICB9XG5cbiAgfSk7XG5cbn1cblxuZnVuY3Rpb24gcmVjYWxjdWxhdGVSR0IoY29sb3IsIGNvbXBvbmVudCwgY29tcG9uZW50SGV4SW5kZXgpIHtcblxuICBpZiAoY29sb3IuX19zdGF0ZS5zcGFjZSA9PT0gJ0hFWCcpIHtcblxuICAgIGNvbG9yLl9fc3RhdGVbY29tcG9uZW50XSA9IG1hdGguY29tcG9uZW50X2Zyb21faGV4KGNvbG9yLl9fc3RhdGUuaGV4LCBjb21wb25lbnRIZXhJbmRleCk7XG5cbiAgfSBlbHNlIGlmIChjb2xvci5fX3N0YXRlLnNwYWNlID09PSAnSFNWJykge1xuXG4gICAgY29tbW9uLmV4dGVuZChjb2xvci5fX3N0YXRlLCBtYXRoLmhzdl90b19yZ2IoY29sb3IuX19zdGF0ZS5oLCBjb2xvci5fX3N0YXRlLnMsIGNvbG9yLl9fc3RhdGUudikpO1xuXG4gIH0gZWxzZSB7XG5cbiAgICB0aHJvdyAnQ29ycnVwdGVkIGNvbG9yIHN0YXRlJztcblxuICB9XG5cbn1cblxuZnVuY3Rpb24gcmVjYWxjdWxhdGVIU1YoY29sb3IpIHtcblxuICB2YXIgcmVzdWx0ID0gbWF0aC5yZ2JfdG9faHN2KGNvbG9yLnIsIGNvbG9yLmcsIGNvbG9yLmIpO1xuXG4gIGNvbW1vbi5leHRlbmQoY29sb3IuX19zdGF0ZSwge1xuICAgIHM6IHJlc3VsdC5zLFxuICAgIHY6IHJlc3VsdC52XG4gIH0pO1xuXG4gIGlmICghY29tbW9uLmlzTmFOKHJlc3VsdC5oKSkge1xuICAgIGNvbG9yLl9fc3RhdGUuaCA9IHJlc3VsdC5oO1xuICB9IGVsc2UgaWYgKGNvbW1vbi5pc1VuZGVmaW5lZChjb2xvci5fX3N0YXRlLmgpKSB7XG4gICAgY29sb3IuX19zdGF0ZS5oID0gMDtcbiAgfVxuXG59XG4iLCIvKipcbiAqIGRhdC1ndWkgSmF2YVNjcmlwdCBDb250cm9sbGVyIExpYnJhcnlcbiAqIGh0dHA6Ly9jb2RlLmdvb2dsZS5jb20vcC9kYXQtZ3VpXG4gKlxuICogQ29weXJpZ2h0IDIwMTEgRGF0YSBBcnRzIFRlYW0sIEdvb2dsZSBDcmVhdGl2ZSBMYWJcbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBjcmVhdGVJbnRlcnBlcnQoKTtcblxuZnVuY3Rpb24gY3JlYXRlSW50ZXJwZXJ0KCkge1xuICB2YXIgY29tbW9uID0gcmVxdWlyZSgnLi4vdXRpbHMvY29tbW9uLmpzJyk7XG4gIHZhciB0b1N0cmluZyA9IHJlcXVpcmUoJy4vdG9TdHJpbmcuanMnKTtcblxuICB2YXIgcmVzdWx0LCB0b1JldHVybjtcblxuICB2YXIgaW50ZXJwcmV0ID0gZnVuY3Rpb24oKSB7XG5cbiAgICB0b1JldHVybiA9IGZhbHNlO1xuXG4gICAgdmFyIG9yaWdpbmFsID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgPyBjb21tb24udG9BcnJheShhcmd1bWVudHMpIDogYXJndW1lbnRzWzBdO1xuXG4gICAgY29tbW9uLmVhY2goSU5URVJQUkVUQVRJT05TLCBmdW5jdGlvbihmYW1pbHkpIHtcblxuICAgICAgaWYgKGZhbWlseS5saXRtdXMob3JpZ2luYWwpKSB7XG5cbiAgICAgICAgY29tbW9uLmVhY2goZmFtaWx5LmNvbnZlcnNpb25zLCBmdW5jdGlvbihjb252ZXJzaW9uLCBjb252ZXJzaW9uTmFtZSkge1xuXG4gICAgICAgICAgcmVzdWx0ID0gY29udmVyc2lvbi5yZWFkKG9yaWdpbmFsKTtcblxuICAgICAgICAgIGlmICh0b1JldHVybiA9PT0gZmFsc2UgJiYgcmVzdWx0ICE9PSBmYWxzZSkge1xuICAgICAgICAgICAgdG9SZXR1cm4gPSByZXN1bHQ7XG4gICAgICAgICAgICByZXN1bHQuY29udmVyc2lvbk5hbWUgPSBjb252ZXJzaW9uTmFtZTtcbiAgICAgICAgICAgIHJlc3VsdC5jb252ZXJzaW9uID0gY29udmVyc2lvbjtcbiAgICAgICAgICAgIHJldHVybiBjb21tb24uQlJFQUs7XG5cbiAgICAgICAgICB9XG5cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIGNvbW1vbi5CUkVBSztcblxuICAgICAgfVxuXG4gICAgfSk7XG5cbiAgICByZXR1cm4gdG9SZXR1cm47XG5cbiAgfTtcblxuICB2YXIgSU5URVJQUkVUQVRJT05TID0gW1xuXG4gICAgLy8gU3RyaW5nc1xuICAgIHtcblxuICAgICAgbGl0bXVzOiBjb21tb24uaXNTdHJpbmcsXG5cbiAgICAgIGNvbnZlcnNpb25zOiB7XG5cbiAgICAgICAgVEhSRUVfQ0hBUl9IRVg6IHtcblxuICAgICAgICAgIHJlYWQ6IGZ1bmN0aW9uKG9yaWdpbmFsKSB7XG5cbiAgICAgICAgICAgIHZhciB0ZXN0ID0gb3JpZ2luYWwubWF0Y2goL14jKFtBLUYwLTldKShbQS1GMC05XSkoW0EtRjAtOV0pJC9pKTtcbiAgICAgICAgICAgIGlmICh0ZXN0ID09PSBudWxsKSByZXR1cm4gZmFsc2U7XG5cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgIHNwYWNlOiAnSEVYJyxcbiAgICAgICAgICAgICAgaGV4OiBwYXJzZUludChcbiAgICAgICAgICAgICAgICAgICcweCcgK1xuICAgICAgICAgICAgICAgICAgICAgIHRlc3RbMV0udG9TdHJpbmcoKSArIHRlc3RbMV0udG9TdHJpbmcoKSArXG4gICAgICAgICAgICAgICAgICAgICAgdGVzdFsyXS50b1N0cmluZygpICsgdGVzdFsyXS50b1N0cmluZygpICtcbiAgICAgICAgICAgICAgICAgICAgICB0ZXN0WzNdLnRvU3RyaW5nKCkgKyB0ZXN0WzNdLnRvU3RyaW5nKCkpXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgfSxcblxuICAgICAgICAgIHdyaXRlOiB0b1N0cmluZ1xuXG4gICAgICAgIH0sXG5cbiAgICAgICAgU0lYX0NIQVJfSEVYOiB7XG5cbiAgICAgICAgICByZWFkOiBmdW5jdGlvbihvcmlnaW5hbCkge1xuXG4gICAgICAgICAgICB2YXIgdGVzdCA9IG9yaWdpbmFsLm1hdGNoKC9eIyhbQS1GMC05XXs2fSkkL2kpO1xuICAgICAgICAgICAgaWYgKHRlc3QgPT09IG51bGwpIHJldHVybiBmYWxzZTtcblxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgc3BhY2U6ICdIRVgnLFxuICAgICAgICAgICAgICBoZXg6IHBhcnNlSW50KCcweCcgKyB0ZXN0WzFdLnRvU3RyaW5nKCkpXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgfSxcblxuICAgICAgICAgIHdyaXRlOiB0b1N0cmluZ1xuXG4gICAgICAgIH0sXG5cbiAgICAgICAgQ1NTX1JHQjoge1xuXG4gICAgICAgICAgcmVhZDogZnVuY3Rpb24ob3JpZ2luYWwpIHtcblxuICAgICAgICAgICAgdmFyIHRlc3QgPSBvcmlnaW5hbC5tYXRjaCgvXnJnYlxcKFxccyooLispXFxzKixcXHMqKC4rKVxccyosXFxzKiguKylcXHMqXFwpLyk7XG4gICAgICAgICAgICBpZiAodGVzdCA9PT0gbnVsbCkgcmV0dXJuIGZhbHNlO1xuXG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICBzcGFjZTogJ1JHQicsXG4gICAgICAgICAgICAgIHI6IHBhcnNlRmxvYXQodGVzdFsxXSksXG4gICAgICAgICAgICAgIGc6IHBhcnNlRmxvYXQodGVzdFsyXSksXG4gICAgICAgICAgICAgIGI6IHBhcnNlRmxvYXQodGVzdFszXSlcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICB9LFxuXG4gICAgICAgICAgd3JpdGU6IHRvU3RyaW5nXG5cbiAgICAgICAgfSxcblxuICAgICAgICBDU1NfUkdCQToge1xuXG4gICAgICAgICAgcmVhZDogZnVuY3Rpb24ob3JpZ2luYWwpIHtcblxuICAgICAgICAgICAgdmFyIHRlc3QgPSBvcmlnaW5hbC5tYXRjaCgvXnJnYmFcXChcXHMqKC4rKVxccyosXFxzKiguKylcXHMqLFxccyooLispXFxzKlxcLFxccyooLispXFxzKlxcKS8pO1xuICAgICAgICAgICAgaWYgKHRlc3QgPT09IG51bGwpIHJldHVybiBmYWxzZTtcblxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgc3BhY2U6ICdSR0InLFxuICAgICAgICAgICAgICByOiBwYXJzZUZsb2F0KHRlc3RbMV0pLFxuICAgICAgICAgICAgICBnOiBwYXJzZUZsb2F0KHRlc3RbMl0pLFxuICAgICAgICAgICAgICBiOiBwYXJzZUZsb2F0KHRlc3RbM10pLFxuICAgICAgICAgICAgICBhOiBwYXJzZUZsb2F0KHRlc3RbNF0pXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgfSxcblxuICAgICAgICAgIHdyaXRlOiB0b1N0cmluZ1xuXG4gICAgICAgIH1cblxuICAgICAgfVxuXG4gICAgfSxcblxuICAgIC8vIE51bWJlcnNcbiAgICB7XG5cbiAgICAgIGxpdG11czogY29tbW9uLmlzTnVtYmVyLFxuXG4gICAgICBjb252ZXJzaW9uczoge1xuXG4gICAgICAgIEhFWDoge1xuICAgICAgICAgIHJlYWQ6IGZ1bmN0aW9uKG9yaWdpbmFsKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICBzcGFjZTogJ0hFWCcsXG4gICAgICAgICAgICAgIGhleDogb3JpZ2luYWwsXG4gICAgICAgICAgICAgIGNvbnZlcnNpb25OYW1lOiAnSEVYJ1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sXG5cbiAgICAgICAgICB3cml0ZTogZnVuY3Rpb24oY29sb3IpIHtcbiAgICAgICAgICAgIHJldHVybiBjb2xvci5oZXg7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgIH1cblxuICAgIH0sXG5cbiAgICAvLyBBcnJheXNcbiAgICB7XG5cbiAgICAgIGxpdG11czogY29tbW9uLmlzQXJyYXksXG5cbiAgICAgIGNvbnZlcnNpb25zOiB7XG5cbiAgICAgICAgUkdCX0FSUkFZOiB7XG4gICAgICAgICAgcmVhZDogZnVuY3Rpb24ob3JpZ2luYWwpIHtcbiAgICAgICAgICAgIGlmIChvcmlnaW5hbC5sZW5ndGggIT0gMykgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgc3BhY2U6ICdSR0InLFxuICAgICAgICAgICAgICByOiBvcmlnaW5hbFswXSxcbiAgICAgICAgICAgICAgZzogb3JpZ2luYWxbMV0sXG4gICAgICAgICAgICAgIGI6IG9yaWdpbmFsWzJdXG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH0sXG5cbiAgICAgICAgICB3cml0ZTogZnVuY3Rpb24oY29sb3IpIHtcbiAgICAgICAgICAgIHJldHVybiBbY29sb3IuciwgY29sb3IuZywgY29sb3IuYl07XG4gICAgICAgICAgfVxuXG4gICAgICAgIH0sXG5cbiAgICAgICAgUkdCQV9BUlJBWToge1xuICAgICAgICAgIHJlYWQ6IGZ1bmN0aW9uKG9yaWdpbmFsKSB7XG4gICAgICAgICAgICBpZiAob3JpZ2luYWwubGVuZ3RoICE9IDQpIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgIHNwYWNlOiAnUkdCJyxcbiAgICAgICAgICAgICAgcjogb3JpZ2luYWxbMF0sXG4gICAgICAgICAgICAgIGc6IG9yaWdpbmFsWzFdLFxuICAgICAgICAgICAgICBiOiBvcmlnaW5hbFsyXSxcbiAgICAgICAgICAgICAgYTogb3JpZ2luYWxbM11cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgfSxcblxuICAgICAgICAgIHdyaXRlOiBmdW5jdGlvbihjb2xvcikge1xuICAgICAgICAgICAgcmV0dXJuIFtjb2xvci5yLCBjb2xvci5nLCBjb2xvci5iLCBjb2xvci5hXTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgfVxuXG4gICAgICB9XG5cbiAgICB9LFxuXG4gICAgLy8gT2JqZWN0c1xuICAgIHtcblxuICAgICAgbGl0bXVzOiBjb21tb24uaXNPYmplY3QsXG5cbiAgICAgIGNvbnZlcnNpb25zOiB7XG5cbiAgICAgICAgUkdCQV9PQko6IHtcbiAgICAgICAgICByZWFkOiBmdW5jdGlvbihvcmlnaW5hbCkge1xuICAgICAgICAgICAgaWYgKGNvbW1vbi5pc051bWJlcihvcmlnaW5hbC5yKSAmJlxuICAgICAgICAgICAgICAgIGNvbW1vbi5pc051bWJlcihvcmlnaW5hbC5nKSAmJlxuICAgICAgICAgICAgICAgIGNvbW1vbi5pc051bWJlcihvcmlnaW5hbC5iKSAmJlxuICAgICAgICAgICAgICAgIGNvbW1vbi5pc051bWJlcihvcmlnaW5hbC5hKSkge1xuICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHNwYWNlOiAnUkdCJyxcbiAgICAgICAgICAgICAgICByOiBvcmlnaW5hbC5yLFxuICAgICAgICAgICAgICAgIGc6IG9yaWdpbmFsLmcsXG4gICAgICAgICAgICAgICAgYjogb3JpZ2luYWwuYixcbiAgICAgICAgICAgICAgICBhOiBvcmlnaW5hbC5hXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB9LFxuXG4gICAgICAgICAgd3JpdGU6IGZ1bmN0aW9uKGNvbG9yKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICByOiBjb2xvci5yLFxuICAgICAgICAgICAgICBnOiBjb2xvci5nLFxuICAgICAgICAgICAgICBiOiBjb2xvci5iLFxuICAgICAgICAgICAgICBhOiBjb2xvci5hXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIFJHQl9PQko6IHtcbiAgICAgICAgICByZWFkOiBmdW5jdGlvbihvcmlnaW5hbCkge1xuICAgICAgICAgICAgaWYgKGNvbW1vbi5pc051bWJlcihvcmlnaW5hbC5yKSAmJlxuICAgICAgICAgICAgICAgIGNvbW1vbi5pc051bWJlcihvcmlnaW5hbC5nKSAmJlxuICAgICAgICAgICAgICAgIGNvbW1vbi5pc051bWJlcihvcmlnaW5hbC5iKSkge1xuICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHNwYWNlOiAnUkdCJyxcbiAgICAgICAgICAgICAgICByOiBvcmlnaW5hbC5yLFxuICAgICAgICAgICAgICAgIGc6IG9yaWdpbmFsLmcsXG4gICAgICAgICAgICAgICAgYjogb3JpZ2luYWwuYlxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgfSxcblxuICAgICAgICAgIHdyaXRlOiBmdW5jdGlvbihjb2xvcikge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgcjogY29sb3IucixcbiAgICAgICAgICAgICAgZzogY29sb3IuZyxcbiAgICAgICAgICAgICAgYjogY29sb3IuYlxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBIU1ZBX09CSjoge1xuICAgICAgICAgIHJlYWQ6IGZ1bmN0aW9uKG9yaWdpbmFsKSB7XG4gICAgICAgICAgICBpZiAoY29tbW9uLmlzTnVtYmVyKG9yaWdpbmFsLmgpICYmXG4gICAgICAgICAgICAgICAgY29tbW9uLmlzTnVtYmVyKG9yaWdpbmFsLnMpICYmXG4gICAgICAgICAgICAgICAgY29tbW9uLmlzTnVtYmVyKG9yaWdpbmFsLnYpICYmXG4gICAgICAgICAgICAgICAgY29tbW9uLmlzTnVtYmVyKG9yaWdpbmFsLmEpKSB7XG4gICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3BhY2U6ICdIU1YnLFxuICAgICAgICAgICAgICAgIGg6IG9yaWdpbmFsLmgsXG4gICAgICAgICAgICAgICAgczogb3JpZ2luYWwucyxcbiAgICAgICAgICAgICAgICB2OiBvcmlnaW5hbC52LFxuICAgICAgICAgICAgICAgIGE6IG9yaWdpbmFsLmFcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIH0sXG5cbiAgICAgICAgICB3cml0ZTogZnVuY3Rpb24oY29sb3IpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgIGg6IGNvbG9yLmgsXG4gICAgICAgICAgICAgIHM6IGNvbG9yLnMsXG4gICAgICAgICAgICAgIHY6IGNvbG9yLnYsXG4gICAgICAgICAgICAgIGE6IGNvbG9yLmFcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgSFNWX09CSjoge1xuICAgICAgICAgIHJlYWQ6IGZ1bmN0aW9uKG9yaWdpbmFsKSB7XG4gICAgICAgICAgICBpZiAoY29tbW9uLmlzTnVtYmVyKG9yaWdpbmFsLmgpICYmXG4gICAgICAgICAgICAgICAgY29tbW9uLmlzTnVtYmVyKG9yaWdpbmFsLnMpICYmXG4gICAgICAgICAgICAgICAgY29tbW9uLmlzTnVtYmVyKG9yaWdpbmFsLnYpKSB7XG4gICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3BhY2U6ICdIU1YnLFxuICAgICAgICAgICAgICAgIGg6IG9yaWdpbmFsLmgsXG4gICAgICAgICAgICAgICAgczogb3JpZ2luYWwucyxcbiAgICAgICAgICAgICAgICB2OiBvcmlnaW5hbC52XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB9LFxuXG4gICAgICAgICAgd3JpdGU6IGZ1bmN0aW9uKGNvbG9yKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICBoOiBjb2xvci5oLFxuICAgICAgICAgICAgICBzOiBjb2xvci5zLFxuICAgICAgICAgICAgICB2OiBjb2xvci52XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgIH1cblxuICAgICAgfVxuXG4gICAgfVxuXG5cbiAgXTtcblxuICByZXR1cm4gaW50ZXJwcmV0O1xuXG5cbn1cbiIsIi8qKlxuICogZGF0LWd1aSBKYXZhU2NyaXB0IENvbnRyb2xsZXIgTGlicmFyeVxuICogaHR0cDovL2NvZGUuZ29vZ2xlLmNvbS9wL2RhdC1ndWlcbiAqXG4gKiBDb3B5cmlnaHQgMjAxMSBEYXRhIEFydHMgVGVhbSwgR29vZ2xlIENyZWF0aXZlIExhYlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IG1hdGgoKTtcblxuZnVuY3Rpb24gbWF0aCgpIHtcblxuICB2YXIgdG1wQ29tcG9uZW50O1xuXG4gIHJldHVybiB7XG5cbiAgICBoc3ZfdG9fcmdiOiBmdW5jdGlvbihoLCBzLCB2KSB7XG5cbiAgICAgIHZhciBoaSA9IE1hdGguZmxvb3IoaCAvIDYwKSAlIDY7XG5cbiAgICAgIHZhciBmID0gaCAvIDYwIC0gTWF0aC5mbG9vcihoIC8gNjApO1xuICAgICAgdmFyIHAgPSB2ICogKDEuMCAtIHMpO1xuICAgICAgdmFyIHEgPSB2ICogKDEuMCAtIChmICogcykpO1xuICAgICAgdmFyIHQgPSB2ICogKDEuMCAtICgoMS4wIC0gZikgKiBzKSk7XG4gICAgICB2YXIgYyA9IFtcbiAgICAgICAgW3YsIHQsIHBdLFxuICAgICAgICBbcSwgdiwgcF0sXG4gICAgICAgIFtwLCB2LCB0XSxcbiAgICAgICAgW3AsIHEsIHZdLFxuICAgICAgICBbdCwgcCwgdl0sXG4gICAgICAgIFt2LCBwLCBxXVxuICAgICAgXVtoaV07XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIHI6IGNbMF0gKiAyNTUsXG4gICAgICAgIGc6IGNbMV0gKiAyNTUsXG4gICAgICAgIGI6IGNbMl0gKiAyNTVcbiAgICAgIH07XG5cbiAgICB9LFxuXG4gICAgcmdiX3RvX2hzdjogZnVuY3Rpb24ociwgZywgYikge1xuXG4gICAgICB2YXIgbWluID0gTWF0aC5taW4ociwgZywgYiksXG4gICAgICAgIG1heCA9IE1hdGgubWF4KHIsIGcsIGIpLFxuICAgICAgICBkZWx0YSA9IG1heCAtIG1pbixcbiAgICAgICAgaCwgcztcblxuICAgICAgaWYgKG1heCAhPSAwKSB7XG4gICAgICAgIHMgPSBkZWx0YSAvIG1heDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgaDogTmFOLFxuICAgICAgICAgIHM6IDAsXG4gICAgICAgICAgdjogMFxuICAgICAgICB9O1xuICAgICAgfVxuXG4gICAgICBpZiAociA9PSBtYXgpIHtcbiAgICAgICAgaCA9IChnIC0gYikgLyBkZWx0YTtcbiAgICAgIH0gZWxzZSBpZiAoZyA9PSBtYXgpIHtcbiAgICAgICAgaCA9IDIgKyAoYiAtIHIpIC8gZGVsdGE7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBoID0gNCArIChyIC0gZykgLyBkZWx0YTtcbiAgICAgIH1cbiAgICAgIGggLz0gNjtcbiAgICAgIGlmIChoIDwgMCkge1xuICAgICAgICBoICs9IDE7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIGg6IGggKiAzNjAsXG4gICAgICAgIHM6IHMsXG4gICAgICAgIHY6IG1heCAvIDI1NVxuICAgICAgfTtcbiAgICB9LFxuXG4gICAgcmdiX3RvX2hleDogZnVuY3Rpb24ociwgZywgYikge1xuICAgICAgdmFyIGhleCA9IHRoaXMuaGV4X3dpdGhfY29tcG9uZW50KDAsIDIsIHIpO1xuICAgICAgaGV4ID0gdGhpcy5oZXhfd2l0aF9jb21wb25lbnQoaGV4LCAxLCBnKTtcbiAgICAgIGhleCA9IHRoaXMuaGV4X3dpdGhfY29tcG9uZW50KGhleCwgMCwgYik7XG4gICAgICByZXR1cm4gaGV4O1xuICAgIH0sXG5cbiAgICBjb21wb25lbnRfZnJvbV9oZXg6IGZ1bmN0aW9uKGhleCwgY29tcG9uZW50SW5kZXgpIHtcbiAgICAgIHJldHVybiAoaGV4ID4+IChjb21wb25lbnRJbmRleCAqIDgpKSAmIDB4RkY7XG4gICAgfSxcblxuICAgIGhleF93aXRoX2NvbXBvbmVudDogZnVuY3Rpb24oaGV4LCBjb21wb25lbnRJbmRleCwgdmFsdWUpIHtcbiAgICAgIHJldHVybiB2YWx1ZSA8PCAodG1wQ29tcG9uZW50ID0gY29tcG9uZW50SW5kZXggKiA4KSB8IChoZXggJiB+KDB4RkYgPDwgdG1wQ29tcG9uZW50KSk7XG4gICAgfVxuXG4gIH07XG59XG4iLCIvKipcbiAqIGRhdC1ndWkgSmF2YVNjcmlwdCBDb250cm9sbGVyIExpYnJhcnlcbiAqIGh0dHA6Ly9jb2RlLmdvb2dsZS5jb20vcC9kYXQtZ3VpXG4gKlxuICogQ29weXJpZ2h0IDIwMTEgRGF0YSBBcnRzIFRlYW0sIEdvb2dsZSBDcmVhdGl2ZSBMYWJcbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKi9cblxudmFyIGNvbW1vbiA9IHJlcXVpcmUoJy4uL3V0aWxzL2NvbW1vbi5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHRvU3RyaW5nO1xuXG5mdW5jdGlvbiB0b1N0cmluZyhjb2xvcikge1xuXG4gIGlmIChjb2xvci5hID09IDEgfHwgY29tbW9uLmlzVW5kZWZpbmVkKGNvbG9yLmEpKSB7XG5cbiAgICB2YXIgcyA9IGNvbG9yLmhleC50b1N0cmluZygxNik7XG4gICAgd2hpbGUgKHMubGVuZ3RoIDwgNikge1xuICAgICAgcyA9ICcwJyArIHM7XG4gICAgfVxuXG4gICAgcmV0dXJuICcjJyArIHM7XG5cbiAgfSBlbHNlIHtcblxuICAgIHJldHVybiAncmdiYSgnICsgTWF0aC5yb3VuZChjb2xvci5yKSArICcsJyArIE1hdGgucm91bmQoY29sb3IuZykgKyAnLCcgKyBNYXRoLnJvdW5kKGNvbG9yLmIpICsgJywnICsgY29sb3IuYSArICcpJztcblxuICB9XG5cbn1cbiIsIi8qKlxuICogZGF0LWd1aSBKYXZhU2NyaXB0IENvbnRyb2xsZXIgTGlicmFyeVxuICogaHR0cDovL2NvZGUuZ29vZ2xlLmNvbS9wL2RhdC1ndWlcbiAqXG4gKiBDb3B5cmlnaHQgMjAxMSBEYXRhIEFydHMgVGVhbSwgR29vZ2xlIENyZWF0aXZlIExhYlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqL1xuXG52YXIgQ29udHJvbGxlciA9IHJlcXVpcmUoJy4vQ29udHJvbGxlci5qcycpO1xudmFyIGNvbW1vbiA9IHJlcXVpcmUoJy4uL3V0aWxzL2NvbW1vbi5qcycpO1xudmFyIGRvbSA9IHJlcXVpcmUoJy4uL2RvbS9kb20uanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBCb29sZWFuQ29udHJvbGxlcjtcblxuLyoqXG4gKiBAY2xhc3MgUHJvdmlkZXMgYSBjaGVja2JveCBpbnB1dCB0byBhbHRlciB0aGUgYm9vbGVhbiBwcm9wZXJ0eSBvZiBhbiBvYmplY3QuXG4gKiBAZXh0ZW5kcyBkYXQuY29udHJvbGxlcnMuQ29udHJvbGxlclxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBiZSBtYW5pcHVsYXRlZFxuICogQHBhcmFtIHtzdHJpbmd9IHByb3BlcnR5IFRoZSBuYW1lIG9mIHRoZSBwcm9wZXJ0eSB0byBiZSBtYW5pcHVsYXRlZFxuICpcbiAqIEBtZW1iZXIgZGF0LmNvbnRyb2xsZXJzXG4gKi9cbmZ1bmN0aW9uIEJvb2xlYW5Db250cm9sbGVyKG9iamVjdCwgcHJvcGVydHkpIHtcblxuICBCb29sZWFuQ29udHJvbGxlci5zdXBlcmNsYXNzLmNhbGwodGhpcywgb2JqZWN0LCBwcm9wZXJ0eSk7XG5cbiAgdmFyIF90aGlzID0gdGhpcztcbiAgdGhpcy5fX3ByZXYgPSB0aGlzLmdldFZhbHVlKCk7XG5cbiAgdGhpcy5fX2NoZWNrYm94ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcbiAgdGhpcy5fX2NoZWNrYm94LnNldEF0dHJpYnV0ZSgndHlwZScsICdjaGVja2JveCcpO1xuXG5cbiAgZG9tLmJpbmQodGhpcy5fX2NoZWNrYm94LCAnY2hhbmdlJywgb25DaGFuZ2UsIGZhbHNlKTtcblxuICB0aGlzLmRvbUVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5fX2NoZWNrYm94KTtcblxuICAvLyBNYXRjaCBvcmlnaW5hbCB2YWx1ZVxuICB0aGlzLnVwZGF0ZURpc3BsYXkoKTtcblxuICBmdW5jdGlvbiBvbkNoYW5nZSgpIHtcbiAgICBfdGhpcy5zZXRWYWx1ZSghX3RoaXMuX19wcmV2KTtcbiAgfVxuXG59XG5cbkJvb2xlYW5Db250cm9sbGVyLnN1cGVyY2xhc3MgPSBDb250cm9sbGVyO1xuXG5jb21tb24uZXh0ZW5kKFxuXG4gIEJvb2xlYW5Db250cm9sbGVyLnByb3RvdHlwZSxcbiAgQ29udHJvbGxlci5wcm90b3R5cGUsXG4gIHtcbiAgICBzZXRWYWx1ZTogZnVuY3Rpb24odikge1xuICAgICAgdmFyIHRvUmV0dXJuID0gQm9vbGVhbkNvbnRyb2xsZXIuc3VwZXJjbGFzcy5wcm90b3R5cGUuc2V0VmFsdWUuY2FsbCh0aGlzLCB2KTtcbiAgICAgIGlmICh0aGlzLl9fb25GaW5pc2hDaGFuZ2UpIHtcbiAgICAgICAgdGhpcy5fX29uRmluaXNoQ2hhbmdlLmNhbGwodGhpcywgdGhpcy5nZXRWYWx1ZSgpKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX19wcmV2ID0gdGhpcy5nZXRWYWx1ZSgpO1xuICAgICAgcmV0dXJuIHRvUmV0dXJuO1xuICAgIH0sXG5cbiAgICB1cGRhdGVEaXNwbGF5OiBmdW5jdGlvbigpIHtcblxuICAgICAgaWYgKHRoaXMuZ2V0VmFsdWUoKSA9PT0gdHJ1ZSkge1xuICAgICAgICB0aGlzLl9fY2hlY2tib3guc2V0QXR0cmlidXRlKCdjaGVja2VkJywgJ2NoZWNrZWQnKTtcbiAgICAgICAgdGhpcy5fX2NoZWNrYm94LmNoZWNrZWQgPSB0cnVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fX2NoZWNrYm94LmNoZWNrZWQgPSBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIEJvb2xlYW5Db250cm9sbGVyLnN1cGVyY2xhc3MucHJvdG90eXBlLnVwZGF0ZURpc3BsYXkuY2FsbCh0aGlzKTtcblxuICAgIH1cbiAgfVxuKTtcbiIsIi8qKlxuICogZGF0LWd1aSBKYXZhU2NyaXB0IENvbnRyb2xsZXIgTGlicmFyeVxuICogaHR0cDovL2NvZGUuZ29vZ2xlLmNvbS9wL2RhdC1ndWlcbiAqXG4gKiBDb3B5cmlnaHQgMjAxMSBEYXRhIEFydHMgVGVhbSwgR29vZ2xlIENyZWF0aXZlIExhYlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqL1xuXG52YXIgQ29udHJvbGxlciA9IHJlcXVpcmUoJy4vQ29udHJvbGxlci5qcycpO1xudmFyIGNvbW1vbiA9IHJlcXVpcmUoJy4uL3V0aWxzL2NvbW1vbi5qcycpO1xudmFyIGRvbSA9IHJlcXVpcmUoJy4uL2RvbS9kb20uanMnKTtcbnZhciBDb2xvciA9IHJlcXVpcmUoJy4uL2NvbG9yL0NvbG9yLmpzJyk7XG52YXIgaW50ZXJwcmV0ID0gcmVxdWlyZSgnLi4vY29sb3IvaW50ZXJwcmV0LmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gQ29sb3JDb250cm9sbGVyO1xuXG5mdW5jdGlvbiBDb2xvckNvbnRyb2xsZXIob2JqZWN0LCBwcm9wZXJ0eSkge1xuXG4gIENvbG9yQ29udHJvbGxlci5zdXBlcmNsYXNzLmNhbGwodGhpcywgb2JqZWN0LCBwcm9wZXJ0eSk7XG5cbiAgdGhpcy5fX2NvbG9yID0gbmV3IENvbG9yKHRoaXMuZ2V0VmFsdWUoKSk7XG4gIHRoaXMuX190ZW1wID0gbmV3IENvbG9yKDApO1xuXG4gIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgdGhpcy5kb21FbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cbiAgZG9tLm1ha2VTZWxlY3RhYmxlKHRoaXMuZG9tRWxlbWVudCwgZmFsc2UpO1xuXG4gIHRoaXMuX19zZWxlY3RvciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICB0aGlzLl9fc2VsZWN0b3IuY2xhc3NOYW1lID0gJ3NlbGVjdG9yJztcblxuICB0aGlzLl9fc2F0dXJhdGlvbl9maWVsZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICB0aGlzLl9fc2F0dXJhdGlvbl9maWVsZC5jbGFzc05hbWUgPSAnc2F0dXJhdGlvbi1maWVsZCc7XG5cbiAgdGhpcy5fX2ZpZWxkX2tub2IgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgdGhpcy5fX2ZpZWxkX2tub2IuY2xhc3NOYW1lID0gJ2ZpZWxkLWtub2InO1xuICB0aGlzLl9fZmllbGRfa25vYl9ib3JkZXIgPSAnMnB4IHNvbGlkICc7XG5cbiAgdGhpcy5fX2h1ZV9rbm9iID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIHRoaXMuX19odWVfa25vYi5jbGFzc05hbWUgPSAnaHVlLWtub2InO1xuXG4gIHRoaXMuX19odWVfZmllbGQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgdGhpcy5fX2h1ZV9maWVsZC5jbGFzc05hbWUgPSAnaHVlLWZpZWxkJztcblxuICB0aGlzLl9faW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xuICB0aGlzLl9faW5wdXQudHlwZSA9ICd0ZXh0JztcbiAgdGhpcy5fX2lucHV0X3RleHRTaGFkb3cgPSAnMCAxcHggMXB4ICc7XG5cbiAgZG9tLmJpbmQodGhpcy5fX2lucHV0LCAna2V5ZG93bicsIGZ1bmN0aW9uKGUpIHtcbiAgICBpZiAoZS5rZXlDb2RlID09PSAxMykgeyAvLyBvbiBlbnRlclxuICAgICAgb25CbHVyLmNhbGwodGhpcyk7XG4gICAgfVxuICB9KTtcblxuICBkb20uYmluZCh0aGlzLl9faW5wdXQsICdibHVyJywgb25CbHVyKTtcblxuICBkb20uYmluZCh0aGlzLl9fc2VsZWN0b3IsICdtb3VzZWRvd24nLCBmdW5jdGlvbihlKSB7XG5cbiAgICBkb21cbiAgICAgIC5hZGRDbGFzcyh0aGlzLCAnZHJhZycpXG4gICAgICAuYmluZCh3aW5kb3csICdtb3VzZXVwJywgZnVuY3Rpb24oZSkge1xuICAgICAgICBkb20ucmVtb3ZlQ2xhc3MoX3RoaXMuX19zZWxlY3RvciwgJ2RyYWcnKTtcbiAgICAgIH0pO1xuXG4gIH0pO1xuXG4gIHZhciB2YWx1ZV9maWVsZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXG4gIGNvbW1vbi5leHRlbmQodGhpcy5fX3NlbGVjdG9yLnN0eWxlLCB7XG4gICAgd2lkdGg6ICcxMjJweCcsXG4gICAgaGVpZ2h0OiAnMTAycHgnLFxuICAgIHBhZGRpbmc6ICczcHgnLFxuICAgIGJhY2tncm91bmRDb2xvcjogJyMyMjInLFxuICAgIGJveFNoYWRvdzogJzBweCAxcHggM3B4IHJnYmEoMCwwLDAsMC4zKSdcbiAgfSk7XG5cbiAgY29tbW9uLmV4dGVuZCh0aGlzLl9fZmllbGRfa25vYi5zdHlsZSwge1xuICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxuICAgIHdpZHRoOiAnMTJweCcsXG4gICAgaGVpZ2h0OiAnMTJweCcsXG4gICAgYm9yZGVyOiB0aGlzLl9fZmllbGRfa25vYl9ib3JkZXIgKyAodGhpcy5fX2NvbG9yLnYgPCAuNSA/ICcjZmZmJyA6ICcjMDAwJyksXG4gICAgYm94U2hhZG93OiAnMHB4IDFweCAzcHggcmdiYSgwLDAsMCwwLjUpJyxcbiAgICBib3JkZXJSYWRpdXM6ICcxMnB4JyxcbiAgICB6SW5kZXg6IDFcbiAgfSk7XG5cbiAgY29tbW9uLmV4dGVuZCh0aGlzLl9faHVlX2tub2Iuc3R5bGUsIHtcbiAgICBwb3NpdGlvbjogJ2Fic29sdXRlJyxcbiAgICB3aWR0aDogJzE1cHgnLFxuICAgIGhlaWdodDogJzJweCcsXG4gICAgYm9yZGVyUmlnaHQ6ICc0cHggc29saWQgI2ZmZicsXG4gICAgekluZGV4OiAxXG4gIH0pO1xuXG4gIGNvbW1vbi5leHRlbmQodGhpcy5fX3NhdHVyYXRpb25fZmllbGQuc3R5bGUsIHtcbiAgICB3aWR0aDogJzEwMHB4JyxcbiAgICBoZWlnaHQ6ICcxMDBweCcsXG4gICAgYm9yZGVyOiAnMXB4IHNvbGlkICM1NTUnLFxuICAgIG1hcmdpblJpZ2h0OiAnM3B4JyxcbiAgICBkaXNwbGF5OiAnaW5saW5lLWJsb2NrJyxcbiAgICBjdXJzb3I6ICdwb2ludGVyJ1xuICB9KTtcblxuICBjb21tb24uZXh0ZW5kKHZhbHVlX2ZpZWxkLnN0eWxlLCB7XG4gICAgd2lkdGg6ICcxMDAlJyxcbiAgICBoZWlnaHQ6ICcxMDAlJyxcbiAgICBiYWNrZ3JvdW5kOiAnbm9uZSdcbiAgfSk7XG5cbiAgbGluZWFyR3JhZGllbnQodmFsdWVfZmllbGQsICd0b3AnLCAncmdiYSgwLDAsMCwwKScsICcjMDAwJyk7XG5cbiAgY29tbW9uLmV4dGVuZCh0aGlzLl9faHVlX2ZpZWxkLnN0eWxlLCB7XG4gICAgd2lkdGg6ICcxNXB4JyxcbiAgICBoZWlnaHQ6ICcxMDBweCcsXG4gICAgZGlzcGxheTogJ2lubGluZS1ibG9jaycsXG4gICAgYm9yZGVyOiAnMXB4IHNvbGlkICM1NTUnLFxuICAgIGN1cnNvcjogJ25zLXJlc2l6ZSdcbiAgfSk7XG5cbiAgaHVlR3JhZGllbnQodGhpcy5fX2h1ZV9maWVsZCk7XG5cbiAgY29tbW9uLmV4dGVuZCh0aGlzLl9faW5wdXQuc3R5bGUsIHtcbiAgICBvdXRsaW5lOiAnbm9uZScsXG4gICAgLy8gICAgICB3aWR0aDogJzEyMHB4JyxcbiAgICB0ZXh0QWxpZ246ICdjZW50ZXInLFxuICAgIC8vICAgICAgcGFkZGluZzogJzRweCcsXG4gICAgLy8gICAgICBtYXJnaW5Cb3R0b206ICc2cHgnLFxuICAgIGNvbG9yOiAnI2ZmZicsXG4gICAgYm9yZGVyOiAwLFxuICAgIGZvbnRXZWlnaHQ6ICdib2xkJyxcbiAgICB0ZXh0U2hhZG93OiB0aGlzLl9faW5wdXRfdGV4dFNoYWRvdyArICdyZ2JhKDAsMCwwLDAuNyknXG4gIH0pO1xuXG4gIGRvbS5iaW5kKHRoaXMuX19zYXR1cmF0aW9uX2ZpZWxkLCAnbW91c2Vkb3duJywgZmllbGREb3duKTtcbiAgZG9tLmJpbmQodGhpcy5fX2ZpZWxkX2tub2IsICdtb3VzZWRvd24nLCBmaWVsZERvd24pO1xuXG4gIGRvbS5iaW5kKHRoaXMuX19odWVfZmllbGQsICdtb3VzZWRvd24nLCBmdW5jdGlvbihlKSB7XG4gICAgc2V0SChlKTtcbiAgICBkb20uYmluZCh3aW5kb3csICdtb3VzZW1vdmUnLCBzZXRIKTtcbiAgICBkb20uYmluZCh3aW5kb3csICdtb3VzZXVwJywgdW5iaW5kSCk7XG4gIH0pO1xuXG4gIGZ1bmN0aW9uIGZpZWxkRG93bihlKSB7XG4gICAgc2V0U1YoZSk7XG4gICAgLy8gZG9jdW1lbnQuYm9keS5zdHlsZS5jdXJzb3IgPSAnbm9uZSc7XG4gICAgZG9tLmJpbmQod2luZG93LCAnbW91c2Vtb3ZlJywgc2V0U1YpO1xuICAgIGRvbS5iaW5kKHdpbmRvdywgJ21vdXNldXAnLCB1bmJpbmRTVik7XG4gIH1cblxuICBmdW5jdGlvbiB1bmJpbmRTVigpIHtcbiAgICBkb20udW5iaW5kKHdpbmRvdywgJ21vdXNlbW92ZScsIHNldFNWKTtcbiAgICBkb20udW5iaW5kKHdpbmRvdywgJ21vdXNldXAnLCB1bmJpbmRTVik7XG4gICAgLy8gZG9jdW1lbnQuYm9keS5zdHlsZS5jdXJzb3IgPSAnZGVmYXVsdCc7XG4gIH1cblxuICBmdW5jdGlvbiBvbkJsdXIoKSB7XG4gICAgdmFyIGkgPSBpbnRlcnByZXQodGhpcy52YWx1ZSk7XG4gICAgaWYgKGkgIT09IGZhbHNlKSB7XG4gICAgICBfdGhpcy5fX2NvbG9yLl9fc3RhdGUgPSBpO1xuICAgICAgX3RoaXMuc2V0VmFsdWUoX3RoaXMuX19jb2xvci50b09yaWdpbmFsKCkpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnZhbHVlID0gX3RoaXMuX19jb2xvci50b1N0cmluZygpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHVuYmluZEgoKSB7XG4gICAgZG9tLnVuYmluZCh3aW5kb3csICdtb3VzZW1vdmUnLCBzZXRIKTtcbiAgICBkb20udW5iaW5kKHdpbmRvdywgJ21vdXNldXAnLCB1bmJpbmRIKTtcbiAgfVxuXG4gIHRoaXMuX19zYXR1cmF0aW9uX2ZpZWxkLmFwcGVuZENoaWxkKHZhbHVlX2ZpZWxkKTtcbiAgdGhpcy5fX3NlbGVjdG9yLmFwcGVuZENoaWxkKHRoaXMuX19maWVsZF9rbm9iKTtcbiAgdGhpcy5fX3NlbGVjdG9yLmFwcGVuZENoaWxkKHRoaXMuX19zYXR1cmF0aW9uX2ZpZWxkKTtcbiAgdGhpcy5fX3NlbGVjdG9yLmFwcGVuZENoaWxkKHRoaXMuX19odWVfZmllbGQpO1xuICB0aGlzLl9faHVlX2ZpZWxkLmFwcGVuZENoaWxkKHRoaXMuX19odWVfa25vYik7XG5cbiAgdGhpcy5kb21FbGVtZW50LmFwcGVuZENoaWxkKHRoaXMuX19pbnB1dCk7XG4gIHRoaXMuZG9tRWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLl9fc2VsZWN0b3IpO1xuXG4gIHRoaXMudXBkYXRlRGlzcGxheSgpO1xuXG4gIGZ1bmN0aW9uIHNldFNWKGUpIHtcblxuICAgIGUucHJldmVudERlZmF1bHQoKTtcblxuICAgIHZhciB3ID0gZG9tLmdldFdpZHRoKF90aGlzLl9fc2F0dXJhdGlvbl9maWVsZCk7XG4gICAgdmFyIG8gPSBkb20uZ2V0T2Zmc2V0KF90aGlzLl9fc2F0dXJhdGlvbl9maWVsZCk7XG4gICAgdmFyIHMgPSAoZS5jbGllbnRYIC0gby5sZWZ0ICsgZG9jdW1lbnQuYm9keS5zY3JvbGxMZWZ0KSAvIHc7XG4gICAgdmFyIHYgPSAxIC0gKGUuY2xpZW50WSAtIG8udG9wICsgZG9jdW1lbnQuYm9keS5zY3JvbGxUb3ApIC8gdztcblxuICAgIGlmICh2ID4gMSkgdiA9IDE7XG4gICAgZWxzZSBpZiAodiA8IDApIHYgPSAwO1xuXG4gICAgaWYgKHMgPiAxKSBzID0gMTtcbiAgICBlbHNlIGlmIChzIDwgMCkgcyA9IDA7XG5cbiAgICBfdGhpcy5fX2NvbG9yLnYgPSB2O1xuICAgIF90aGlzLl9fY29sb3IucyA9IHM7XG5cbiAgICBfdGhpcy5zZXRWYWx1ZShfdGhpcy5fX2NvbG9yLnRvT3JpZ2luYWwoKSk7XG5cblxuICAgIHJldHVybiBmYWxzZTtcblxuICB9XG5cbiAgZnVuY3Rpb24gc2V0SChlKSB7XG5cbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICB2YXIgcyA9IGRvbS5nZXRIZWlnaHQoX3RoaXMuX19odWVfZmllbGQpO1xuICAgIHZhciBvID0gZG9tLmdldE9mZnNldChfdGhpcy5fX2h1ZV9maWVsZCk7XG4gICAgdmFyIGggPSAxIC0gKGUuY2xpZW50WSAtIG8udG9wICsgZG9jdW1lbnQuYm9keS5zY3JvbGxUb3ApIC8gcztcblxuICAgIGlmIChoID4gMSkgaCA9IDE7XG4gICAgZWxzZSBpZiAoaCA8IDApIGggPSAwO1xuXG4gICAgX3RoaXMuX19jb2xvci5oID0gaCAqIDM2MDtcblxuICAgIF90aGlzLnNldFZhbHVlKF90aGlzLl9fY29sb3IudG9PcmlnaW5hbCgpKTtcblxuICAgIHJldHVybiBmYWxzZTtcblxuICB9XG5cbn07XG5cbkNvbG9yQ29udHJvbGxlci5zdXBlcmNsYXNzID0gQ29udHJvbGxlcjtcblxuY29tbW9uLmV4dGVuZChcblxuICBDb2xvckNvbnRyb2xsZXIucHJvdG90eXBlLFxuICBDb250cm9sbGVyLnByb3RvdHlwZSxcblxuICB7XG5cbiAgICB1cGRhdGVEaXNwbGF5OiBmdW5jdGlvbigpIHtcblxuICAgICAgdmFyIGkgPSBpbnRlcnByZXQodGhpcy5nZXRWYWx1ZSgpKTtcblxuICAgICAgaWYgKGkgIT09IGZhbHNlKSB7XG5cbiAgICAgICAgdmFyIG1pc21hdGNoID0gZmFsc2U7XG5cbiAgICAgICAgLy8gQ2hlY2sgZm9yIG1pc21hdGNoIG9uIHRoZSBpbnRlcnByZXRlZCB2YWx1ZS5cblxuICAgICAgICBjb21tb24uZWFjaChDb2xvci5DT01QT05FTlRTLCBmdW5jdGlvbihjb21wb25lbnQpIHtcbiAgICAgICAgICBpZiAoIWNvbW1vbi5pc1VuZGVmaW5lZChpW2NvbXBvbmVudF0pICYmXG4gICAgICAgICAgICAhY29tbW9uLmlzVW5kZWZpbmVkKHRoaXMuX19jb2xvci5fX3N0YXRlW2NvbXBvbmVudF0pICYmXG4gICAgICAgICAgICBpW2NvbXBvbmVudF0gIT09IHRoaXMuX19jb2xvci5fX3N0YXRlW2NvbXBvbmVudF0pIHtcbiAgICAgICAgICAgIG1pc21hdGNoID0gdHJ1ZTtcbiAgICAgICAgICAgIHJldHVybiB7fTsgLy8gYnJlYWtcbiAgICAgICAgICB9XG4gICAgICAgIH0sIHRoaXMpO1xuXG4gICAgICAgIC8vIElmIG5vdGhpbmcgZGl2ZXJnZXMsIHdlIGtlZXAgb3VyIHByZXZpb3VzIHZhbHVlc1xuICAgICAgICAvLyBmb3Igc3RhdGVmdWxuZXNzLCBvdGhlcndpc2Ugd2UgcmVjYWxjdWxhdGUgZnJlc2hcbiAgICAgICAgaWYgKG1pc21hdGNoKSB7XG4gICAgICAgICAgY29tbW9uLmV4dGVuZCh0aGlzLl9fY29sb3IuX19zdGF0ZSwgaSk7XG4gICAgICAgIH1cblxuICAgICAgfVxuXG4gICAgICBjb21tb24uZXh0ZW5kKHRoaXMuX190ZW1wLl9fc3RhdGUsIHRoaXMuX19jb2xvci5fX3N0YXRlKTtcblxuICAgICAgdGhpcy5fX3RlbXAuYSA9IDE7XG5cbiAgICAgIHZhciBmbGlwID0gKHRoaXMuX19jb2xvci52IDwgLjUgfHwgdGhpcy5fX2NvbG9yLnMgPiAuNSkgPyAyNTUgOiAwO1xuICAgICAgdmFyIF9mbGlwID0gMjU1IC0gZmxpcDtcblxuICAgICAgY29tbW9uLmV4dGVuZCh0aGlzLl9fZmllbGRfa25vYi5zdHlsZSwge1xuICAgICAgICBtYXJnaW5MZWZ0OiAxMDAgKiB0aGlzLl9fY29sb3IucyAtIDcgKyAncHgnLFxuICAgICAgICBtYXJnaW5Ub3A6IDEwMCAqICgxIC0gdGhpcy5fX2NvbG9yLnYpIC0gNyArICdweCcsXG4gICAgICAgIGJhY2tncm91bmRDb2xvcjogdGhpcy5fX3RlbXAudG9TdHJpbmcoKSxcbiAgICAgICAgYm9yZGVyOiB0aGlzLl9fZmllbGRfa25vYl9ib3JkZXIgKyAncmdiKCcgKyBmbGlwICsgJywnICsgZmxpcCArICcsJyArIGZsaXAgKyAnKSdcbiAgICAgIH0pO1xuXG4gICAgICB0aGlzLl9faHVlX2tub2Iuc3R5bGUubWFyZ2luVG9wID0gKDEgLSB0aGlzLl9fY29sb3IuaCAvIDM2MCkgKiAxMDAgKyAncHgnXG5cbiAgICAgIHRoaXMuX190ZW1wLnMgPSAxO1xuICAgICAgdGhpcy5fX3RlbXAudiA9IDE7XG5cbiAgICAgIGxpbmVhckdyYWRpZW50KHRoaXMuX19zYXR1cmF0aW9uX2ZpZWxkLCAnbGVmdCcsICcjZmZmJywgdGhpcy5fX3RlbXAudG9TdHJpbmcoKSk7XG5cbiAgICAgIGNvbW1vbi5leHRlbmQodGhpcy5fX2lucHV0LnN0eWxlLCB7XG4gICAgICAgIGJhY2tncm91bmRDb2xvcjogdGhpcy5fX2lucHV0LnZhbHVlID0gdGhpcy5fX2NvbG9yLnRvU3RyaW5nKCksXG4gICAgICAgIGNvbG9yOiAncmdiKCcgKyBmbGlwICsgJywnICsgZmxpcCArICcsJyArIGZsaXAgKyAnKScsXG4gICAgICAgIHRleHRTaGFkb3c6IHRoaXMuX19pbnB1dF90ZXh0U2hhZG93ICsgJ3JnYmEoJyArIF9mbGlwICsgJywnICsgX2ZsaXAgKyAnLCcgKyBfZmxpcCArICcsLjcpJ1xuICAgICAgfSk7XG5cbiAgICB9XG5cbiAgfVxuXG4pO1xuXG52YXIgdmVuZG9ycyA9IFsnLW1vei0nLCAnLW8tJywgJy13ZWJraXQtJywgJy1tcy0nLCAnJ107XG5cbmZ1bmN0aW9uIGxpbmVhckdyYWRpZW50KGVsZW0sIHgsIGEsIGIpIHtcbiAgZWxlbS5zdHlsZS5iYWNrZ3JvdW5kID0gJyc7XG4gIGNvbW1vbi5lYWNoKHZlbmRvcnMsIGZ1bmN0aW9uKHZlbmRvcikge1xuICAgIGVsZW0uc3R5bGUuY3NzVGV4dCArPSAnYmFja2dyb3VuZDogJyArIHZlbmRvciArICdsaW5lYXItZ3JhZGllbnQoJyArIHggKyAnLCAnICsgYSArICcgMCUsICcgKyBiICsgJyAxMDAlKTsgJztcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGh1ZUdyYWRpZW50KGVsZW0pIHtcbiAgZWxlbS5zdHlsZS5iYWNrZ3JvdW5kID0gJyc7XG4gIGVsZW0uc3R5bGUuY3NzVGV4dCArPSAnYmFja2dyb3VuZDogLW1vei1saW5lYXItZ3JhZGllbnQodG9wLCAgI2ZmMDAwMCAwJSwgI2ZmMDBmZiAxNyUsICMwMDAwZmYgMzQlLCAjMDBmZmZmIDUwJSwgIzAwZmYwMCA2NyUsICNmZmZmMDAgODQlLCAjZmYwMDAwIDEwMCUpOydcbiAgZWxlbS5zdHlsZS5jc3NUZXh0ICs9ICdiYWNrZ3JvdW5kOiAtd2Via2l0LWxpbmVhci1ncmFkaWVudCh0b3AsICAjZmYwMDAwIDAlLCNmZjAwZmYgMTclLCMwMDAwZmYgMzQlLCMwMGZmZmYgNTAlLCMwMGZmMDAgNjclLCNmZmZmMDAgODQlLCNmZjAwMDAgMTAwJSk7J1xuICBlbGVtLnN0eWxlLmNzc1RleHQgKz0gJ2JhY2tncm91bmQ6IC1vLWxpbmVhci1ncmFkaWVudCh0b3AsICAjZmYwMDAwIDAlLCNmZjAwZmYgMTclLCMwMDAwZmYgMzQlLCMwMGZmZmYgNTAlLCMwMGZmMDAgNjclLCNmZmZmMDAgODQlLCNmZjAwMDAgMTAwJSk7J1xuICBlbGVtLnN0eWxlLmNzc1RleHQgKz0gJ2JhY2tncm91bmQ6IC1tcy1saW5lYXItZ3JhZGllbnQodG9wLCAgI2ZmMDAwMCAwJSwjZmYwMGZmIDE3JSwjMDAwMGZmIDM0JSwjMDBmZmZmIDUwJSwjMDBmZjAwIDY3JSwjZmZmZjAwIDg0JSwjZmYwMDAwIDEwMCUpOydcbiAgZWxlbS5zdHlsZS5jc3NUZXh0ICs9ICdiYWNrZ3JvdW5kOiBsaW5lYXItZ3JhZGllbnQodG9wLCAgI2ZmMDAwMCAwJSwjZmYwMGZmIDE3JSwjMDAwMGZmIDM0JSwjMDBmZmZmIDUwJSwjMDBmZjAwIDY3JSwjZmZmZjAwIDg0JSwjZmYwMDAwIDEwMCUpOydcbn1cbiIsIi8qKlxuICogZGF0LWd1aSBKYXZhU2NyaXB0IENvbnRyb2xsZXIgTGlicmFyeVxuICogaHR0cDovL2NvZGUuZ29vZ2xlLmNvbS9wL2RhdC1ndWlcbiAqXG4gKiBDb3B5cmlnaHQgMjAxMSBEYXRhIEFydHMgVGVhbSwgR29vZ2xlIENyZWF0aXZlIExhYlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqL1xuXG52YXIgY29tbW9uID0gcmVxdWlyZSgnLi4vdXRpbHMvY29tbW9uLmpzJyk7XG52YXIgZXNjYXBlID0gcmVxdWlyZSgnLi4vdXRpbHMvZXNjYXBlSHRtbC5qcycpO1xubW9kdWxlLmV4cG9ydHMgPSBDb250cm9sbGVyO1xuXG4vKipcbiAqIEBjbGFzcyBBbiBcImFic3RyYWN0XCIgY2xhc3MgdGhhdCByZXByZXNlbnRzIGEgZ2l2ZW4gcHJvcGVydHkgb2YgYW4gb2JqZWN0LlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBiZSBtYW5pcHVsYXRlZFxuICogQHBhcmFtIHtzdHJpbmd9IHByb3BlcnR5IFRoZSBuYW1lIG9mIHRoZSBwcm9wZXJ0eSB0byBiZSBtYW5pcHVsYXRlZFxuICpcbiAqIEBtZW1iZXIgZGF0LmNvbnRyb2xsZXJzXG4gKi9cbmZ1bmN0aW9uIENvbnRyb2xsZXIob2JqZWN0LCBwcm9wZXJ0eSkge1xuXG4gIHRoaXMuaW5pdGlhbFZhbHVlID0gb2JqZWN0W3Byb3BlcnR5XTtcblxuICAvKipcbiAgICogVGhvc2Ugd2hvIGV4dGVuZCB0aGlzIGNsYXNzIHdpbGwgcHV0IHRoZWlyIERPTSBlbGVtZW50cyBpbiBoZXJlLlxuICAgKiBAdHlwZSB7RE9NRWxlbWVudH1cbiAgICovXG4gIHRoaXMuZG9tRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXG4gIC8qKlxuICAgKiBUaGUgb2JqZWN0IHRvIG1hbmlwdWxhdGVcbiAgICogQHR5cGUge09iamVjdH1cbiAgICovXG4gIHRoaXMub2JqZWN0ID0gb2JqZWN0O1xuXG4gIC8qKlxuICAgKiBUaGUgbmFtZSBvZiB0aGUgcHJvcGVydHkgdG8gbWFuaXB1bGF0ZVxuICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgKi9cbiAgdGhpcy5wcm9wZXJ0eSA9IHByb3BlcnR5O1xuXG4gIC8qKlxuICAgKiBUaGUgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIG9uIGNoYW5nZS5cbiAgICogQHR5cGUge0Z1bmN0aW9ufVxuICAgKiBAaWdub3JlXG4gICAqL1xuICB0aGlzLl9fb25DaGFuZ2UgPSB1bmRlZmluZWQ7XG5cbiAgLyoqXG4gICAqIFRoZSBmdW5jdGlvbiB0byBiZSBjYWxsZWQgb24gZmluaXNoaW5nIGNoYW5nZS5cbiAgICogQHR5cGUge0Z1bmN0aW9ufVxuICAgKiBAaWdub3JlXG4gICAqL1xuICB0aGlzLl9fb25GaW5pc2hDaGFuZ2UgPSB1bmRlZmluZWQ7XG5cbn1cblxuY29tbW9uLmV4dGVuZChcblxuICBDb250cm9sbGVyLnByb3RvdHlwZSxcblxuICAvKiogQGxlbmRzIGRhdC5jb250cm9sbGVycy5Db250cm9sbGVyLnByb3RvdHlwZSAqL1xuICB7XG5cbiAgICAvKipcbiAgICAgKiBTcGVjaWZ5IHRoYXQgYSBmdW5jdGlvbiBmaXJlIGV2ZXJ5IHRpbWUgc29tZW9uZSBjaGFuZ2VzIHRoZSB2YWx1ZSB3aXRoXG4gICAgICogdGhpcyBDb250cm9sbGVyLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZm5jIFRoaXMgZnVuY3Rpb24gd2lsbCBiZSBjYWxsZWQgd2hlbmV2ZXIgdGhlIHZhbHVlXG4gICAgICogaXMgbW9kaWZpZWQgdmlhIHRoaXMgQ29udHJvbGxlci5cbiAgICAgKiBAcmV0dXJucyB7ZGF0LmNvbnRyb2xsZXJzLkNvbnRyb2xsZXJ9IHRoaXNcbiAgICAgKi9cbiAgICBvbkNoYW5nZTogZnVuY3Rpb24oZm5jKSB7XG4gICAgICB0aGlzLl9fb25DaGFuZ2UgPSBmbmM7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU3BlY2lmeSB0aGF0IGEgZnVuY3Rpb24gZmlyZSBldmVyeSB0aW1lIHNvbWVvbmUgXCJmaW5pc2hlc1wiIGNoYW5naW5nXG4gICAgICogdGhlIHZhbHVlIHdpaCB0aGlzIENvbnRyb2xsZXIuIFVzZWZ1bCBmb3IgdmFsdWVzIHRoYXQgY2hhbmdlXG4gICAgICogaW5jcmVtZW50YWxseSBsaWtlIG51bWJlcnMgb3Igc3RyaW5ncy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuYyBUaGlzIGZ1bmN0aW9uIHdpbGwgYmUgY2FsbGVkIHdoZW5ldmVyXG4gICAgICogc29tZW9uZSBcImZpbmlzaGVzXCIgY2hhbmdpbmcgdGhlIHZhbHVlIHZpYSB0aGlzIENvbnRyb2xsZXIuXG4gICAgICogQHJldHVybnMge2RhdC5jb250cm9sbGVycy5Db250cm9sbGVyfSB0aGlzXG4gICAgICovXG4gICAgb25GaW5pc2hDaGFuZ2U6IGZ1bmN0aW9uKGZuYykge1xuICAgICAgdGhpcy5fX29uRmluaXNoQ2hhbmdlID0gZm5jO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENoYW5nZSB0aGUgdmFsdWUgb2YgPGNvZGU+b2JqZWN0W3Byb3BlcnR5XTwvY29kZT5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBuZXdWYWx1ZSBUaGUgbmV3IHZhbHVlIG9mIDxjb2RlPm9iamVjdFtwcm9wZXJ0eV08L2NvZGU+XG4gICAgICovXG4gICAgc2V0VmFsdWU6IGZ1bmN0aW9uKG5ld1ZhbHVlKSB7XG4gICAgICB0aGlzLm9iamVjdFt0aGlzLnByb3BlcnR5XSA9IG5ld1ZhbHVlO1xuICAgICAgaWYgKHRoaXMuX19vbkNoYW5nZSkge1xuICAgICAgICB0aGlzLl9fb25DaGFuZ2UuY2FsbCh0aGlzLCBuZXdWYWx1ZSk7XG4gICAgICB9XG4gICAgICB0aGlzLnVwZGF0ZURpc3BsYXkoKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXRzIHRoZSB2YWx1ZSBvZiA8Y29kZT5vYmplY3RbcHJvcGVydHldPC9jb2RlPlxuICAgICAqXG4gICAgICogQHJldHVybnMge09iamVjdH0gVGhlIGN1cnJlbnQgdmFsdWUgb2YgPGNvZGU+b2JqZWN0W3Byb3BlcnR5XTwvY29kZT5cbiAgICAgKi9cbiAgICBnZXRWYWx1ZTogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5vYmplY3RbdGhpcy5wcm9wZXJ0eV07XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlZnJlc2hlcyB0aGUgdmlzdWFsIGRpc3BsYXkgb2YgYSBDb250cm9sbGVyIGluIG9yZGVyIHRvIGtlZXAgc3luY1xuICAgICAqIHdpdGggdGhlIG9iamVjdCdzIGN1cnJlbnQgdmFsdWUuXG4gICAgICogQHJldHVybnMge2RhdC5jb250cm9sbGVycy5Db250cm9sbGVyfSB0aGlzXG4gICAgICovXG4gICAgdXBkYXRlRGlzcGxheTogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQHJldHVybnMge0Jvb2xlYW59IHRydWUgaWYgdGhlIHZhbHVlIGhhcyBkZXZpYXRlZCBmcm9tIGluaXRpYWxWYWx1ZVxuICAgICAqL1xuICAgIGlzTW9kaWZpZWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuaW5pdGlhbFZhbHVlICE9PSB0aGlzLmdldFZhbHVlKCk7XG4gICAgfVxuICB9XG5cbik7XG5cbiIsIi8qKlxuICogZGF0LWd1aSBKYXZhU2NyaXB0IENvbnRyb2xsZXIgTGlicmFyeVxuICogaHR0cDovL2NvZGUuZ29vZ2xlLmNvbS9wL2RhdC1ndWlcbiAqXG4gKiBDb3B5cmlnaHQgMjAxMSBEYXRhIEFydHMgVGVhbSwgR29vZ2xlIENyZWF0aXZlIExhYlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqL1xuXG52YXIgQ29udHJvbGxlciA9IHJlcXVpcmUoJy4vQ29udHJvbGxlci5qcycpO1xudmFyIGNvbW1vbiA9IHJlcXVpcmUoJy4uL3V0aWxzL2NvbW1vbi5qcycpO1xudmFyIGRvbSA9IHJlcXVpcmUoJy4uL2RvbS9kb20uanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBGdW5jdGlvbkNvbnRyb2xsZXI7XG5cbi8qKlxuICogQGNsYXNzIFByb3ZpZGVzIGEgR1VJIGludGVyZmFjZSB0byBmaXJlIGEgc3BlY2lmaWVkIG1ldGhvZCwgYSBwcm9wZXJ0eSBvZiBhbiBvYmplY3QuXG4gKlxuICogQGV4dGVuZHMgZGF0LmNvbnRyb2xsZXJzLkNvbnRyb2xsZXJcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gYmUgbWFuaXB1bGF0ZWRcbiAqIEBwYXJhbSB7c3RyaW5nfSBwcm9wZXJ0eSBUaGUgbmFtZSBvZiB0aGUgcHJvcGVydHkgdG8gYmUgbWFuaXB1bGF0ZWRcbiAqXG4gKiBAbWVtYmVyIGRhdC5jb250cm9sbGVyc1xuICovXG5mdW5jdGlvbiBGdW5jdGlvbkNvbnRyb2xsZXIob2JqZWN0LCBwcm9wZXJ0eSwgdGV4dCkge1xuXG4gIEZ1bmN0aW9uQ29udHJvbGxlci5zdXBlcmNsYXNzLmNhbGwodGhpcywgb2JqZWN0LCBwcm9wZXJ0eSk7XG5cbiAgdmFyIF90aGlzID0gdGhpcztcblxuICB0aGlzLl9fYnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIHRoaXMuX19idXR0b24uaW5uZXJIVE1MID0gdGV4dCA9PT0gdW5kZWZpbmVkID8gJ0ZpcmUnIDogdGV4dDtcbiAgZG9tLmJpbmQodGhpcy5fX2J1dHRvbiwgJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICBfdGhpcy5maXJlKCk7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9KTtcblxuICBkb20uYWRkQ2xhc3ModGhpcy5fX2J1dHRvbiwgJ2J1dHRvbicpO1xuXG4gIHRoaXMuZG9tRWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLl9fYnV0dG9uKTtcblxufVxuXG5GdW5jdGlvbkNvbnRyb2xsZXIuc3VwZXJjbGFzcyA9IENvbnRyb2xsZXI7XG5cbmNvbW1vbi5leHRlbmQoXG5cbiAgRnVuY3Rpb25Db250cm9sbGVyLnByb3RvdHlwZSxcbiAgQ29udHJvbGxlci5wcm90b3R5cGUsIHtcblxuICAgIGZpcmU6IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHRoaXMuX19vbkNoYW5nZSkge1xuICAgICAgICB0aGlzLl9fb25DaGFuZ2UuY2FsbCh0aGlzKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuZ2V0VmFsdWUoKS5jYWxsKHRoaXMub2JqZWN0KTtcbiAgICAgIGlmICh0aGlzLl9fb25GaW5pc2hDaGFuZ2UpIHtcbiAgICAgICAgdGhpcy5fX29uRmluaXNoQ2hhbmdlLmNhbGwodGhpcywgdGhpcy5nZXRWYWx1ZSgpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuKTtcbiIsIi8qKlxuICogZGF0LWd1aSBKYXZhU2NyaXB0IENvbnRyb2xsZXIgTGlicmFyeVxuICogaHR0cDovL2NvZGUuZ29vZ2xlLmNvbS9wL2RhdC1ndWlcbiAqXG4gKiBDb3B5cmlnaHQgMjAxMSBEYXRhIEFydHMgVGVhbSwgR29vZ2xlIENyZWF0aXZlIExhYlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqL1xuXG52YXIgQ29udHJvbGxlciA9IHJlcXVpcmUoJy4vQ29udHJvbGxlci5qcycpO1xudmFyIGNvbW1vbiA9IHJlcXVpcmUoJy4uL3V0aWxzL2NvbW1vbi5qcycpO1xubW9kdWxlLmV4cG9ydHMgPSBOdW1iZXJDb250cm9sbGVyO1xuXG4vKipcbiAqIEBjbGFzcyBSZXByZXNlbnRzIGEgZ2l2ZW4gcHJvcGVydHkgb2YgYW4gb2JqZWN0IHRoYXQgaXMgYSBudW1iZXIuXG4gKlxuICogQGV4dGVuZHMgZGF0LmNvbnRyb2xsZXJzLkNvbnRyb2xsZXJcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gYmUgbWFuaXB1bGF0ZWRcbiAqIEBwYXJhbSB7c3RyaW5nfSBwcm9wZXJ0eSBUaGUgbmFtZSBvZiB0aGUgcHJvcGVydHkgdG8gYmUgbWFuaXB1bGF0ZWRcbiAqIEBwYXJhbSB7T2JqZWN0fSBbcGFyYW1zXSBPcHRpb25hbCBwYXJhbWV0ZXJzXG4gKiBAcGFyYW0ge051bWJlcn0gW3BhcmFtcy5taW5dIE1pbmltdW0gYWxsb3dlZCB2YWx1ZVxuICogQHBhcmFtIHtOdW1iZXJ9IFtwYXJhbXMubWF4XSBNYXhpbXVtIGFsbG93ZWQgdmFsdWVcbiAqIEBwYXJhbSB7TnVtYmVyfSBbcGFyYW1zLnN0ZXBdIEluY3JlbWVudCBieSB3aGljaCB0byBjaGFuZ2UgdmFsdWVcbiAqXG4gKiBAbWVtYmVyIGRhdC5jb250cm9sbGVyc1xuICovXG5mdW5jdGlvbiBOdW1iZXJDb250cm9sbGVyKG9iamVjdCwgcHJvcGVydHksIHBhcmFtcykge1xuXG4gIE51bWJlckNvbnRyb2xsZXIuc3VwZXJjbGFzcy5jYWxsKHRoaXMsIG9iamVjdCwgcHJvcGVydHkpO1xuXG4gIHBhcmFtcyA9IHBhcmFtcyB8fCB7fTtcblxuICB0aGlzLl9fbWluID0gcGFyYW1zLm1pbjtcbiAgdGhpcy5fX21heCA9IHBhcmFtcy5tYXg7XG4gIHRoaXMuX19zdGVwID0gcGFyYW1zLnN0ZXA7XG5cbiAgaWYgKGNvbW1vbi5pc1VuZGVmaW5lZCh0aGlzLl9fc3RlcCkpIHtcblxuICAgIGlmICh0aGlzLmluaXRpYWxWYWx1ZSA9PSAwKSB7XG4gICAgICB0aGlzLl9faW1wbGllZFN0ZXAgPSAxOyAvLyBXaGF0IGFyZSB3ZSwgcHN5Y2hpY3M/XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIEhleSBEb3VnLCBjaGVjayB0aGlzIG91dC5cbiAgICAgIHRoaXMuX19pbXBsaWVkU3RlcCA9IE1hdGgucG93KDEwLCBNYXRoLmZsb29yKE1hdGgubG9nKHRoaXMuaW5pdGlhbFZhbHVlKSAvIE1hdGguTE4xMCkpIC8gMTA7XG4gICAgfVxuXG4gIH0gZWxzZSB7XG5cbiAgICB0aGlzLl9faW1wbGllZFN0ZXAgPSB0aGlzLl9fc3RlcDtcblxuICB9XG5cbiAgdGhpcy5fX3ByZWNpc2lvbiA9IG51bURlY2ltYWxzKHRoaXMuX19pbXBsaWVkU3RlcCk7XG5cblxufVxuXG5OdW1iZXJDb250cm9sbGVyLnN1cGVyY2xhc3MgPSBDb250cm9sbGVyO1xuXG5jb21tb24uZXh0ZW5kKFxuXG4gIE51bWJlckNvbnRyb2xsZXIucHJvdG90eXBlLFxuICBDb250cm9sbGVyLnByb3RvdHlwZSxcblxuICAvKiogQGxlbmRzIGRhdC5jb250cm9sbGVycy5OdW1iZXJDb250cm9sbGVyLnByb3RvdHlwZSAqL1xuICB7XG5cbiAgICBzZXRWYWx1ZTogZnVuY3Rpb24odikge1xuXG4gICAgICBpZiAodGhpcy5fX21pbiAhPT0gdW5kZWZpbmVkICYmIHYgPCB0aGlzLl9fbWluKSB7XG4gICAgICAgIHYgPSB0aGlzLl9fbWluO1xuICAgICAgfSBlbHNlIGlmICh0aGlzLl9fbWF4ICE9PSB1bmRlZmluZWQgJiYgdiA+IHRoaXMuX19tYXgpIHtcbiAgICAgICAgdiA9IHRoaXMuX19tYXg7XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLl9fc3RlcCAhPT0gdW5kZWZpbmVkICYmIHYgJSB0aGlzLl9fc3RlcCAhPSAwKSB7XG4gICAgICAgIHYgPSBNYXRoLnJvdW5kKHYgLyB0aGlzLl9fc3RlcCkgKiB0aGlzLl9fc3RlcDtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIE51bWJlckNvbnRyb2xsZXIuc3VwZXJjbGFzcy5wcm90b3R5cGUuc2V0VmFsdWUuY2FsbCh0aGlzLCB2KTtcblxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTcGVjaWZ5IGEgbWluaW11bSB2YWx1ZSBmb3IgPGNvZGU+b2JqZWN0W3Byb3BlcnR5XTwvY29kZT4uXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gbWluVmFsdWUgVGhlIG1pbmltdW0gdmFsdWUgZm9yXG4gICAgICogPGNvZGU+b2JqZWN0W3Byb3BlcnR5XTwvY29kZT5cbiAgICAgKiBAcmV0dXJucyB7ZGF0LmNvbnRyb2xsZXJzLk51bWJlckNvbnRyb2xsZXJ9IHRoaXNcbiAgICAgKi9cbiAgICBtaW46IGZ1bmN0aW9uKHYpIHtcbiAgICAgIHRoaXMuX19taW4gPSB2O1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNwZWNpZnkgYSBtYXhpbXVtIHZhbHVlIGZvciA8Y29kZT5vYmplY3RbcHJvcGVydHldPC9jb2RlPi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBtYXhWYWx1ZSBUaGUgbWF4aW11bSB2YWx1ZSBmb3JcbiAgICAgKiA8Y29kZT5vYmplY3RbcHJvcGVydHldPC9jb2RlPlxuICAgICAqIEByZXR1cm5zIHtkYXQuY29udHJvbGxlcnMuTnVtYmVyQ29udHJvbGxlcn0gdGhpc1xuICAgICAqL1xuICAgIG1heDogZnVuY3Rpb24odikge1xuICAgICAgdGhpcy5fX21heCA9IHY7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU3BlY2lmeSBhIHN0ZXAgdmFsdWUgdGhhdCBkYXQuY29udHJvbGxlcnMuTnVtYmVyQ29udHJvbGxlclxuICAgICAqIGluY3JlbWVudHMgYnkuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gc3RlcFZhbHVlIFRoZSBzdGVwIHZhbHVlIGZvclxuICAgICAqIGRhdC5jb250cm9sbGVycy5OdW1iZXJDb250cm9sbGVyXG4gICAgICogQGRlZmF1bHQgaWYgbWluaW11bSBhbmQgbWF4aW11bSBzcGVjaWZpZWQgaW5jcmVtZW50IGlzIDElIG9mIHRoZVxuICAgICAqIGRpZmZlcmVuY2Ugb3RoZXJ3aXNlIHN0ZXBWYWx1ZSBpcyAxXG4gICAgICogQHJldHVybnMge2RhdC5jb250cm9sbGVycy5OdW1iZXJDb250cm9sbGVyfSB0aGlzXG4gICAgICovXG4gICAgc3RlcDogZnVuY3Rpb24odikge1xuICAgICAgdGhpcy5fX3N0ZXAgPSB2O1xuICAgICAgdGhpcy5fX2ltcGxpZWRTdGVwID0gdjtcbiAgICAgIHRoaXMuX19wcmVjaXNpb24gPSBudW1EZWNpbWFscyh2KTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICB9XG5cbik7XG5cbmZ1bmN0aW9uIG51bURlY2ltYWxzKHgpIHtcbiAgeCA9IHgudG9TdHJpbmcoKTtcbiAgaWYgKHguaW5kZXhPZignLicpID4gLTEpIHtcbiAgICByZXR1cm4geC5sZW5ndGggLSB4LmluZGV4T2YoJy4nKSAtIDE7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIDA7XG4gIH1cbn1cbiIsIi8qKlxuICogZGF0LWd1aSBKYXZhU2NyaXB0IENvbnRyb2xsZXIgTGlicmFyeVxuICogaHR0cDovL2NvZGUuZ29vZ2xlLmNvbS9wL2RhdC1ndWlcbiAqXG4gKiBDb3B5cmlnaHQgMjAxMSBEYXRhIEFydHMgVGVhbSwgR29vZ2xlIENyZWF0aXZlIExhYlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqL1xuXG52YXIgTnVtYmVyQ29udHJvbGxlciA9IHJlcXVpcmUoJy4vTnVtYmVyQ29udHJvbGxlci5qcycpO1xudmFyIGNvbW1vbiA9IHJlcXVpcmUoJy4uL3V0aWxzL2NvbW1vbi5qcycpO1xudmFyIGRvbSA9IHJlcXVpcmUoJy4uL2RvbS9kb20uanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBOdW1iZXJDb250cm9sbGVyQm94O1xuXG4vKipcbiAqIEBjbGFzcyBSZXByZXNlbnRzIGEgZ2l2ZW4gcHJvcGVydHkgb2YgYW4gb2JqZWN0IHRoYXQgaXMgYSBudW1iZXIgYW5kXG4gKiBwcm92aWRlcyBhbiBpbnB1dCBlbGVtZW50IHdpdGggd2hpY2ggdG8gbWFuaXB1bGF0ZSBpdC5cbiAqXG4gKiBAZXh0ZW5kcyBkYXQuY29udHJvbGxlcnMuQ29udHJvbGxlclxuICogQGV4dGVuZHMgZGF0LmNvbnRyb2xsZXJzLk51bWJlckNvbnRyb2xsZXJcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gYmUgbWFuaXB1bGF0ZWRcbiAqIEBwYXJhbSB7c3RyaW5nfSBwcm9wZXJ0eSBUaGUgbmFtZSBvZiB0aGUgcHJvcGVydHkgdG8gYmUgbWFuaXB1bGF0ZWRcbiAqIEBwYXJhbSB7T2JqZWN0fSBbcGFyYW1zXSBPcHRpb25hbCBwYXJhbWV0ZXJzXG4gKiBAcGFyYW0ge051bWJlcn0gW3BhcmFtcy5taW5dIE1pbmltdW0gYWxsb3dlZCB2YWx1ZVxuICogQHBhcmFtIHtOdW1iZXJ9IFtwYXJhbXMubWF4XSBNYXhpbXVtIGFsbG93ZWQgdmFsdWVcbiAqIEBwYXJhbSB7TnVtYmVyfSBbcGFyYW1zLnN0ZXBdIEluY3JlbWVudCBieSB3aGljaCB0byBjaGFuZ2UgdmFsdWVcbiAqXG4gKiBAbWVtYmVyIGRhdC5jb250cm9sbGVyc1xuICovXG5mdW5jdGlvbiBOdW1iZXJDb250cm9sbGVyQm94KG9iamVjdCwgcHJvcGVydHksIHBhcmFtcykge1xuXG4gIHRoaXMuX190cnVuY2F0aW9uU3VzcGVuZGVkID0gZmFsc2U7XG5cbiAgTnVtYmVyQ29udHJvbGxlckJveC5zdXBlcmNsYXNzLmNhbGwodGhpcywgb2JqZWN0LCBwcm9wZXJ0eSwgcGFyYW1zKTtcblxuICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gIC8qKlxuICAgKiB7TnVtYmVyfSBQcmV2aW91cyBtb3VzZSB5IHBvc2l0aW9uXG4gICAqIEBpZ25vcmVcbiAgICovXG4gIHZhciBwcmV2X3k7XG5cbiAgdGhpcy5fX2lucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcbiAgdGhpcy5fX2lucHV0LnNldEF0dHJpYnV0ZSgndHlwZScsICd0ZXh0Jyk7XG5cbiAgLy8gTWFrZXMgaXQgc28gbWFudWFsbHkgc3BlY2lmaWVkIHZhbHVlcyBhcmUgbm90IHRydW5jYXRlZC5cblxuICBkb20uYmluZCh0aGlzLl9faW5wdXQsICdjaGFuZ2UnLCBvbkNoYW5nZSk7XG4gIGRvbS5iaW5kKHRoaXMuX19pbnB1dCwgJ2JsdXInLCBvbkJsdXIpO1xuICBkb20uYmluZCh0aGlzLl9faW5wdXQsICdtb3VzZWRvd24nLCBvbk1vdXNlRG93bik7XG4gIGRvbS5iaW5kKHRoaXMuX19pbnB1dCwgJ2tleWRvd24nLCBmdW5jdGlvbihlKSB7XG5cbiAgICAvLyBXaGVuIHByZXNzaW5nIGVudGlyZSwgeW91IGNhbiBiZSBhcyBwcmVjaXNlIGFzIHlvdSB3YW50LlxuICAgIGlmIChlLmtleUNvZGUgPT09IDEzKSB7XG4gICAgICBfdGhpcy5fX3RydW5jYXRpb25TdXNwZW5kZWQgPSB0cnVlO1xuICAgICAgdGhpcy5ibHVyKCk7XG4gICAgICBfdGhpcy5fX3RydW5jYXRpb25TdXNwZW5kZWQgPSBmYWxzZTtcbiAgICB9XG5cbiAgfSk7XG5cbiAgZnVuY3Rpb24gb25DaGFuZ2UoKSB7XG4gICAgdmFyIGF0dGVtcHRlZCA9IHBhcnNlRmxvYXQoX3RoaXMuX19pbnB1dC52YWx1ZSk7XG4gICAgaWYgKCFjb21tb24uaXNOYU4oYXR0ZW1wdGVkKSkgX3RoaXMuc2V0VmFsdWUoYXR0ZW1wdGVkKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIG9uQmx1cigpIHtcbiAgICBvbkNoYW5nZSgpO1xuICAgIGlmIChfdGhpcy5fX29uRmluaXNoQ2hhbmdlKSB7XG4gICAgICBfdGhpcy5fX29uRmluaXNoQ2hhbmdlLmNhbGwoX3RoaXMsIF90aGlzLmdldFZhbHVlKCkpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIG9uTW91c2VEb3duKGUpIHtcbiAgICBkb20uYmluZCh3aW5kb3csICdtb3VzZW1vdmUnLCBvbk1vdXNlRHJhZyk7XG4gICAgZG9tLmJpbmQod2luZG93LCAnbW91c2V1cCcsIG9uTW91c2VVcCk7XG4gICAgcHJldl95ID0gZS5jbGllbnRZO1xuICB9XG5cbiAgZnVuY3Rpb24gb25Nb3VzZURyYWcoZSkge1xuXG4gICAgdmFyIGRpZmYgPSBwcmV2X3kgLSBlLmNsaWVudFk7XG4gICAgX3RoaXMuc2V0VmFsdWUoX3RoaXMuZ2V0VmFsdWUoKSArIGRpZmYgKiBfdGhpcy5fX2ltcGxpZWRTdGVwKTtcblxuICAgIHByZXZfeSA9IGUuY2xpZW50WTtcblxuICB9XG5cbiAgZnVuY3Rpb24gb25Nb3VzZVVwKCkge1xuICAgIGRvbS51bmJpbmQod2luZG93LCAnbW91c2Vtb3ZlJywgb25Nb3VzZURyYWcpO1xuICAgIGRvbS51bmJpbmQod2luZG93LCAnbW91c2V1cCcsIG9uTW91c2VVcCk7XG4gIH1cblxuICB0aGlzLnVwZGF0ZURpc3BsYXkoKTtcblxuICB0aGlzLmRvbUVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5fX2lucHV0KTtcblxufVxuXG5OdW1iZXJDb250cm9sbGVyQm94LnN1cGVyY2xhc3MgPSBOdW1iZXJDb250cm9sbGVyO1xuXG5jb21tb24uZXh0ZW5kKFxuXG4gIE51bWJlckNvbnRyb2xsZXJCb3gucHJvdG90eXBlLFxuICBOdW1iZXJDb250cm9sbGVyLnByb3RvdHlwZSxcblxuICB7XG5cbiAgICB1cGRhdGVEaXNwbGF5OiBmdW5jdGlvbigpIHtcblxuICAgICAgdGhpcy5fX2lucHV0LnZhbHVlID0gdGhpcy5fX3RydW5jYXRpb25TdXNwZW5kZWQgPyB0aGlzLmdldFZhbHVlKCkgOiByb3VuZFRvRGVjaW1hbCh0aGlzLmdldFZhbHVlKCksIHRoaXMuX19wcmVjaXNpb24pO1xuICAgICAgcmV0dXJuIE51bWJlckNvbnRyb2xsZXJCb3guc3VwZXJjbGFzcy5wcm90b3R5cGUudXBkYXRlRGlzcGxheS5jYWxsKHRoaXMpO1xuICAgIH1cblxuICB9XG5cbik7XG5cbmZ1bmN0aW9uIHJvdW5kVG9EZWNpbWFsKHZhbHVlLCBkZWNpbWFscykge1xuICB2YXIgdGVuVG8gPSBNYXRoLnBvdygxMCwgZGVjaW1hbHMpO1xuICByZXR1cm4gTWF0aC5yb3VuZCh2YWx1ZSAqIHRlblRvKSAvIHRlblRvO1xufVxuIiwiLyoqXG4gKiBkYXQtZ3VpIEphdmFTY3JpcHQgQ29udHJvbGxlciBMaWJyYXJ5XG4gKiBodHRwOi8vY29kZS5nb29nbGUuY29tL3AvZGF0LWd1aVxuICpcbiAqIENvcHlyaWdodCAyMDExIERhdGEgQXJ0cyBUZWFtLCBHb29nbGUgQ3JlYXRpdmUgTGFiXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICovXG5cbnZhciBOdW1iZXJDb250cm9sbGVyID0gcmVxdWlyZSgnLi9OdW1iZXJDb250cm9sbGVyLmpzJyk7XG52YXIgY29tbW9uID0gcmVxdWlyZSgnLi4vdXRpbHMvY29tbW9uLmpzJyk7XG52YXIgZG9tID0gcmVxdWlyZSgnLi4vZG9tL2RvbS5qcycpO1xudmFyIGNzcyA9IHJlcXVpcmUoJy4uL3V0aWxzL2Nzcy5qcycpO1xuXG52YXIgc3R5bGVTaGVldCA9IFwiLyoqXFxuICogZGF0LWd1aSBKYXZhU2NyaXB0IENvbnRyb2xsZXIgTGlicmFyeVxcbiAqIGh0dHA6Ly9jb2RlLmdvb2dsZS5jb20vcC9kYXQtZ3VpXFxuICpcXG4gKiBDb3B5cmlnaHQgMjAxMSBEYXRhIEFydHMgVGVhbSwgR29vZ2xlIENyZWF0aXZlIExhYlxcbiAqXFxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFxcXCJMaWNlbnNlXFxcIik7XFxuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxcbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxcbiAqXFxuICogaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXFxuICovXFxuXFxuLnNsaWRlciB7XFxuICBib3gtc2hhZG93OiBpbnNldCAwIDJweCA0cHggcmdiYSgwLDAsMCwwLjE1KTtcXG4gIGhlaWdodDogMWVtO1xcbiAgYm9yZGVyLXJhZGl1czogMWVtO1xcbiAgYmFja2dyb3VuZC1jb2xvcjogI2VlZTtcXG4gIHBhZGRpbmc6IDAgMC41ZW07XFxuICBvdmVyZmxvdzogaGlkZGVuO1xcbn1cXG5cXG4uc2xpZGVyLWZnIHtcXG4gIHBhZGRpbmc6IDFweCAwIDJweCAwO1xcbiAgYmFja2dyb3VuZC1jb2xvcjogI2FhYTtcXG4gIGhlaWdodDogMWVtO1xcbiAgbWFyZ2luLWxlZnQ6IC0wLjVlbTtcXG4gIHBhZGRpbmctcmlnaHQ6IDAuNWVtO1xcbiAgYm9yZGVyLXJhZGl1czogMWVtIDAgMCAxZW07XFxufVxcblxcbi5zbGlkZXItZmc6YWZ0ZXIge1xcbiAgZGlzcGxheTogaW5saW5lLWJsb2NrO1xcbiAgYm9yZGVyLXJhZGl1czogMWVtO1xcbiAgYmFja2dyb3VuZC1jb2xvcjogI2ZmZjtcXG4gIGJvcmRlcjogIDFweCBzb2xpZCAjYWFhO1xcbiAgY29udGVudDogJyc7XFxuICBmbG9hdDogcmlnaHQ7XFxuICBtYXJnaW4tcmlnaHQ6IC0xZW07XFxuICBtYXJnaW4tdG9wOiAtMXB4O1xcbiAgaGVpZ2h0OiAwLjllbTtcXG4gIHdpZHRoOiAwLjllbTtcXG59XCI7XG5tb2R1bGUuZXhwb3J0cyA9IE51bWJlckNvbnRyb2xsZXJTbGlkZXI7XG5cbi8qKlxuICogQGNsYXNzIFJlcHJlc2VudHMgYSBnaXZlbiBwcm9wZXJ0eSBvZiBhbiBvYmplY3QgdGhhdCBpcyBhIG51bWJlciwgY29udGFpbnNcbiAqIGEgbWluaW11bSBhbmQgbWF4aW11bSwgYW5kIHByb3ZpZGVzIGEgc2xpZGVyIGVsZW1lbnQgd2l0aCB3aGljaCB0b1xuICogbWFuaXB1bGF0ZSBpdC4gSXQgc2hvdWxkIGJlIG5vdGVkIHRoYXQgdGhlIHNsaWRlciBlbGVtZW50IGlzIG1hZGUgdXAgb2ZcbiAqIDxjb2RlPiZsdDtkaXYmZ3Q7PC9jb2RlPiB0YWdzLCA8c3Ryb25nPm5vdDwvc3Ryb25nPiB0aGUgaHRtbDVcbiAqIDxjb2RlPiZsdDtzbGlkZXImZ3Q7PC9jb2RlPiBlbGVtZW50LlxuICpcbiAqIEBleHRlbmRzIGRhdC5jb250cm9sbGVycy5Db250cm9sbGVyXG4gKiBAZXh0ZW5kcyBkYXQuY29udHJvbGxlcnMuTnVtYmVyQ29udHJvbGxlclxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBiZSBtYW5pcHVsYXRlZFxuICogQHBhcmFtIHtzdHJpbmd9IHByb3BlcnR5IFRoZSBuYW1lIG9mIHRoZSBwcm9wZXJ0eSB0byBiZSBtYW5pcHVsYXRlZFxuICogQHBhcmFtIHtOdW1iZXJ9IG1pblZhbHVlIE1pbmltdW0gYWxsb3dlZCB2YWx1ZVxuICogQHBhcmFtIHtOdW1iZXJ9IG1heFZhbHVlIE1heGltdW0gYWxsb3dlZCB2YWx1ZVxuICogQHBhcmFtIHtOdW1iZXJ9IHN0ZXBWYWx1ZSBJbmNyZW1lbnQgYnkgd2hpY2ggdG8gY2hhbmdlIHZhbHVlXG4gKlxuICogQG1lbWJlciBkYXQuY29udHJvbGxlcnNcbiAqL1xuZnVuY3Rpb24gTnVtYmVyQ29udHJvbGxlclNsaWRlcihvYmplY3QsIHByb3BlcnR5LCBtaW4sIG1heCwgc3RlcCkge1xuXG4gIE51bWJlckNvbnRyb2xsZXJTbGlkZXIuc3VwZXJjbGFzcy5jYWxsKHRoaXMsIG9iamVjdCwgcHJvcGVydHksIHtcbiAgICBtaW46IG1pbixcbiAgICBtYXg6IG1heCxcbiAgICBzdGVwOiBzdGVwXG4gIH0pO1xuXG4gIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgdGhpcy5fX2JhY2tncm91bmQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgdGhpcy5fX2ZvcmVncm91bmQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblxuXG5cbiAgZG9tLmJpbmQodGhpcy5fX2JhY2tncm91bmQsICdtb3VzZWRvd24nLCBvbk1vdXNlRG93bik7XG5cbiAgZG9tLmFkZENsYXNzKHRoaXMuX19iYWNrZ3JvdW5kLCAnc2xpZGVyJyk7XG4gIGRvbS5hZGRDbGFzcyh0aGlzLl9fZm9yZWdyb3VuZCwgJ3NsaWRlci1mZycpO1xuXG4gIGZ1bmN0aW9uIG9uTW91c2VEb3duKGUpIHtcblxuICAgIGRvbS5iaW5kKHdpbmRvdywgJ21vdXNlbW92ZScsIG9uTW91c2VEcmFnKTtcbiAgICBkb20uYmluZCh3aW5kb3csICdtb3VzZXVwJywgb25Nb3VzZVVwKTtcblxuICAgIG9uTW91c2VEcmFnKGUpO1xuICB9XG5cbiAgZnVuY3Rpb24gb25Nb3VzZURyYWcoZSkge1xuXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgdmFyIG9mZnNldCA9IGRvbS5nZXRPZmZzZXQoX3RoaXMuX19iYWNrZ3JvdW5kKTtcbiAgICB2YXIgd2lkdGggPSBkb20uZ2V0V2lkdGgoX3RoaXMuX19iYWNrZ3JvdW5kKTtcblxuICAgIF90aGlzLnNldFZhbHVlKFxuICAgICAgbWFwKGUuY2xpZW50WCwgb2Zmc2V0LmxlZnQsIG9mZnNldC5sZWZ0ICsgd2lkdGgsIF90aGlzLl9fbWluLCBfdGhpcy5fX21heClcbiAgICApO1xuXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIH1cblxuICBmdW5jdGlvbiBvbk1vdXNlVXAoKSB7XG4gICAgZG9tLnVuYmluZCh3aW5kb3csICdtb3VzZW1vdmUnLCBvbk1vdXNlRHJhZyk7XG4gICAgZG9tLnVuYmluZCh3aW5kb3csICdtb3VzZXVwJywgb25Nb3VzZVVwKTtcbiAgICBpZiAoX3RoaXMuX19vbkZpbmlzaENoYW5nZSkge1xuICAgICAgX3RoaXMuX19vbkZpbmlzaENoYW5nZS5jYWxsKF90aGlzLCBfdGhpcy5nZXRWYWx1ZSgpKTtcbiAgICB9XG4gIH1cblxuICB0aGlzLnVwZGF0ZURpc3BsYXkoKTtcblxuICB0aGlzLl9fYmFja2dyb3VuZC5hcHBlbmRDaGlsZCh0aGlzLl9fZm9yZWdyb3VuZCk7XG4gIHRoaXMuZG9tRWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLl9fYmFja2dyb3VuZCk7XG5cbn1cblxuTnVtYmVyQ29udHJvbGxlclNsaWRlci5zdXBlcmNsYXNzID0gTnVtYmVyQ29udHJvbGxlcjtcblxuLyoqXG4gKiBJbmplY3RzIGRlZmF1bHQgc3R5bGVzaGVldCBmb3Igc2xpZGVyIGVsZW1lbnRzLlxuICovXG5OdW1iZXJDb250cm9sbGVyU2xpZGVyLnVzZURlZmF1bHRTdHlsZXMgPSBmdW5jdGlvbigpIHtcbiAgY3NzLmluamVjdChzdHlsZVNoZWV0KTtcbn07XG5cbmNvbW1vbi5leHRlbmQoXG5cbiAgTnVtYmVyQ29udHJvbGxlclNsaWRlci5wcm90b3R5cGUsXG4gIE51bWJlckNvbnRyb2xsZXIucHJvdG90eXBlLFxuXG4gIHtcblxuICAgIHVwZGF0ZURpc3BsYXk6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHBjdCA9ICh0aGlzLmdldFZhbHVlKCkgLSB0aGlzLl9fbWluKSAvICh0aGlzLl9fbWF4IC0gdGhpcy5fX21pbik7XG4gICAgICB0aGlzLl9fZm9yZWdyb3VuZC5zdHlsZS53aWR0aCA9IHBjdCAqIDEwMCArICclJztcbiAgICAgIHJldHVybiBOdW1iZXJDb250cm9sbGVyU2xpZGVyLnN1cGVyY2xhc3MucHJvdG90eXBlLnVwZGF0ZURpc3BsYXkuY2FsbCh0aGlzKTtcbiAgICB9XG5cbiAgfVxuXG5cblxuKTtcblxuZnVuY3Rpb24gbWFwKHYsIGkxLCBpMiwgbzEsIG8yKSB7XG4gIHJldHVybiBvMSArIChvMiAtIG8xKSAqICgodiAtIGkxKSAvIChpMiAtIGkxKSk7XG59XG4iLCIvKipcbiAqIGRhdC1ndWkgSmF2YVNjcmlwdCBDb250cm9sbGVyIExpYnJhcnlcbiAqIGh0dHA6Ly9jb2RlLmdvb2dsZS5jb20vcC9kYXQtZ3VpXG4gKlxuICogQ29weXJpZ2h0IDIwMTEgRGF0YSBBcnRzIFRlYW0sIEdvb2dsZSBDcmVhdGl2ZSBMYWJcbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKi9cblxudmFyIENvbnRyb2xsZXIgPSByZXF1aXJlKCcuL0NvbnRyb2xsZXIuanMnKTtcbnZhciBkb20gPSByZXF1aXJlKCcuLi9kb20vZG9tLmpzJyk7XG52YXIgY29tbW9uID0gcmVxdWlyZSgnLi4vdXRpbHMvY29tbW9uLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gT3B0aW9uQ29udHJvbGxlcjtcblxuLyoqXG4gKiBAY2xhc3MgUHJvdmlkZXMgYSBzZWxlY3QgaW5wdXQgdG8gYWx0ZXIgdGhlIHByb3BlcnR5IG9mIGFuIG9iamVjdCwgdXNpbmcgYVxuICogbGlzdCBvZiBhY2NlcHRlZCB2YWx1ZXMuXG4gKlxuICogQGV4dGVuZHMgZGF0LmNvbnRyb2xsZXJzLkNvbnRyb2xsZXJcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gYmUgbWFuaXB1bGF0ZWRcbiAqIEBwYXJhbSB7c3RyaW5nfSBwcm9wZXJ0eSBUaGUgbmFtZSBvZiB0aGUgcHJvcGVydHkgdG8gYmUgbWFuaXB1bGF0ZWRcbiAqIEBwYXJhbSB7T2JqZWN0fHN0cmluZ1tdfSBvcHRpb25zIEEgbWFwIG9mIGxhYmVscyB0byBhY2NlcHRhYmxlIHZhbHVlcywgb3JcbiAqIGEgbGlzdCBvZiBhY2NlcHRhYmxlIHN0cmluZyB2YWx1ZXMuXG4gKlxuICogQG1lbWJlciBkYXQuY29udHJvbGxlcnNcbiAqL1xuZnVuY3Rpb24gT3B0aW9uQ29udHJvbGxlcihvYmplY3QsIHByb3BlcnR5LCBvcHRpb25zKSB7XG5cbiAgT3B0aW9uQ29udHJvbGxlci5zdXBlcmNsYXNzLmNhbGwodGhpcywgb2JqZWN0LCBwcm9wZXJ0eSk7XG5cbiAgdmFyIF90aGlzID0gdGhpcztcblxuICAvKipcbiAgICogVGhlIGRyb3AgZG93biBtZW51XG4gICAqIEBpZ25vcmVcbiAgICovXG4gIHRoaXMuX19zZWxlY3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzZWxlY3QnKTtcblxuICBpZiAoY29tbW9uLmlzQXJyYXkob3B0aW9ucykpIHtcbiAgICB2YXIgbWFwID0ge307XG4gICAgY29tbW9uLmVhY2gob3B0aW9ucywgZnVuY3Rpb24oZWxlbWVudCkge1xuICAgICAgbWFwW2VsZW1lbnRdID0gZWxlbWVudDtcbiAgICB9KTtcbiAgICBvcHRpb25zID0gbWFwO1xuICB9XG5cbiAgY29tbW9uLmVhY2gob3B0aW9ucywgZnVuY3Rpb24odmFsdWUsIGtleSkge1xuXG4gICAgdmFyIG9wdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ29wdGlvbicpO1xuICAgIG9wdC5pbm5lckhUTUwgPSBrZXk7XG4gICAgb3B0LnNldEF0dHJpYnV0ZSgndmFsdWUnLCB2YWx1ZSk7XG4gICAgX3RoaXMuX19zZWxlY3QuYXBwZW5kQ2hpbGQob3B0KTtcblxuICB9KTtcblxuICAvLyBBY2tub3dsZWRnZSBvcmlnaW5hbCB2YWx1ZVxuICB0aGlzLnVwZGF0ZURpc3BsYXkoKTtcblxuICBkb20uYmluZCh0aGlzLl9fc2VsZWN0LCAnY2hhbmdlJywgZnVuY3Rpb24oKSB7XG4gICAgdmFyIGRlc2lyZWRWYWx1ZSA9IHRoaXMub3B0aW9uc1t0aGlzLnNlbGVjdGVkSW5kZXhdLnZhbHVlO1xuICAgIF90aGlzLnNldFZhbHVlKGRlc2lyZWRWYWx1ZSk7XG4gIH0pO1xuXG4gIHRoaXMuZG9tRWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLl9fc2VsZWN0KTtcblxufVxuXG5PcHRpb25Db250cm9sbGVyLnN1cGVyY2xhc3MgPSBDb250cm9sbGVyO1xuXG5jb21tb24uZXh0ZW5kKFxuXG4gIE9wdGlvbkNvbnRyb2xsZXIucHJvdG90eXBlLFxuICBDb250cm9sbGVyLnByb3RvdHlwZSxcblxuICB7XG5cbiAgICBzZXRWYWx1ZTogZnVuY3Rpb24odikge1xuICAgICAgdmFyIHRvUmV0dXJuID0gT3B0aW9uQ29udHJvbGxlci5zdXBlcmNsYXNzLnByb3RvdHlwZS5zZXRWYWx1ZS5jYWxsKHRoaXMsIHYpO1xuICAgICAgaWYgKHRoaXMuX19vbkZpbmlzaENoYW5nZSkge1xuICAgICAgICB0aGlzLl9fb25GaW5pc2hDaGFuZ2UuY2FsbCh0aGlzLCB0aGlzLmdldFZhbHVlKCkpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRvUmV0dXJuO1xuICAgIH0sXG5cbiAgICB1cGRhdGVEaXNwbGF5OiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuX19zZWxlY3QudmFsdWUgPSB0aGlzLmdldFZhbHVlKCk7XG4gICAgICByZXR1cm4gT3B0aW9uQ29udHJvbGxlci5zdXBlcmNsYXNzLnByb3RvdHlwZS51cGRhdGVEaXNwbGF5LmNhbGwodGhpcyk7XG4gICAgfVxuXG4gIH1cblxuKTtcbiIsIi8qKlxuICogZGF0LWd1aSBKYXZhU2NyaXB0IENvbnRyb2xsZXIgTGlicmFyeVxuICogaHR0cDovL2NvZGUuZ29vZ2xlLmNvbS9wL2RhdC1ndWlcbiAqXG4gKiBDb3B5cmlnaHQgMjAxMSBEYXRhIEFydHMgVGVhbSwgR29vZ2xlIENyZWF0aXZlIExhYlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqL1xuXG52YXIgQ29udHJvbGxlciA9IHJlcXVpcmUoJy4vQ29udHJvbGxlci5qcycpO1xudmFyIGRvbSA9IHJlcXVpcmUoJy4uL2RvbS9kb20uanMnKTtcbnZhciBjb21tb24gPSByZXF1aXJlKCcuLi91dGlscy9jb21tb24uanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBTdHJpbmdDb250cm9sbGVyO1xuXG4vKipcbiAqIEBjbGFzcyBQcm92aWRlcyBhIHRleHQgaW5wdXQgdG8gYWx0ZXIgdGhlIHN0cmluZyBwcm9wZXJ0eSBvZiBhbiBvYmplY3QuXG4gKlxuICogQGV4dGVuZHMgZGF0LmNvbnRyb2xsZXJzLkNvbnRyb2xsZXJcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gYmUgbWFuaXB1bGF0ZWRcbiAqIEBwYXJhbSB7c3RyaW5nfSBwcm9wZXJ0eSBUaGUgbmFtZSBvZiB0aGUgcHJvcGVydHkgdG8gYmUgbWFuaXB1bGF0ZWRcbiAqXG4gKiBAbWVtYmVyIGRhdC5jb250cm9sbGVyc1xuICovXG5mdW5jdGlvbiBTdHJpbmdDb250cm9sbGVyKG9iamVjdCwgcHJvcGVydHkpIHtcblxuICBTdHJpbmdDb250cm9sbGVyLnN1cGVyY2xhc3MuY2FsbCh0aGlzLCBvYmplY3QsIHByb3BlcnR5KTtcblxuICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gIHRoaXMuX19pbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG4gIHRoaXMuX19pbnB1dC5zZXRBdHRyaWJ1dGUoJ3R5cGUnLCAndGV4dCcpO1xuXG4gIGRvbS5iaW5kKHRoaXMuX19pbnB1dCwgJ2tleXVwJywgb25DaGFuZ2UpO1xuICBkb20uYmluZCh0aGlzLl9faW5wdXQsICdjaGFuZ2UnLCBvbkNoYW5nZSk7XG4gIGRvbS5iaW5kKHRoaXMuX19pbnB1dCwgJ2JsdXInLCBvbkJsdXIpO1xuICBkb20uYmluZCh0aGlzLl9faW5wdXQsICdrZXlkb3duJywgZnVuY3Rpb24oZSkge1xuICAgIGlmIChlLmtleUNvZGUgPT09IDEzKSB7XG4gICAgICB0aGlzLmJsdXIoKTtcbiAgICB9XG4gIH0pO1xuXG5cbiAgZnVuY3Rpb24gb25DaGFuZ2UoKSB7XG4gICAgX3RoaXMuc2V0VmFsdWUoX3RoaXMuX19pbnB1dC52YWx1ZSk7XG4gIH1cblxuICBmdW5jdGlvbiBvbkJsdXIoKSB7XG4gICAgaWYgKF90aGlzLl9fb25GaW5pc2hDaGFuZ2UpIHtcbiAgICAgIF90aGlzLl9fb25GaW5pc2hDaGFuZ2UuY2FsbChfdGhpcywgX3RoaXMuZ2V0VmFsdWUoKSk7XG4gICAgfVxuICB9XG5cbiAgdGhpcy51cGRhdGVEaXNwbGF5KCk7XG5cbiAgdGhpcy5kb21FbGVtZW50LmFwcGVuZENoaWxkKHRoaXMuX19pbnB1dCk7XG5cbn07XG5cblN0cmluZ0NvbnRyb2xsZXIuc3VwZXJjbGFzcyA9IENvbnRyb2xsZXI7XG5cbmNvbW1vbi5leHRlbmQoXG5cbiAgU3RyaW5nQ29udHJvbGxlci5wcm90b3R5cGUsXG4gIENvbnRyb2xsZXIucHJvdG90eXBlLFxuXG4gIHtcblxuICAgIHVwZGF0ZURpc3BsYXk6IGZ1bmN0aW9uKCkge1xuICAgICAgLy8gU3RvcHMgdGhlIGNhcmV0IGZyb20gbW92aW5nIG9uIGFjY291bnQgb2Y6XG4gICAgICAvLyBrZXl1cCAtPiBzZXRWYWx1ZSAtPiB1cGRhdGVEaXNwbGF5XG4gICAgICBpZiAoIWRvbS5pc0FjdGl2ZSh0aGlzLl9faW5wdXQpKSB7XG4gICAgICAgIHRoaXMuX19pbnB1dC52YWx1ZSA9IHRoaXMuZ2V0VmFsdWUoKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBTdHJpbmdDb250cm9sbGVyLnN1cGVyY2xhc3MucHJvdG90eXBlLnVwZGF0ZURpc3BsYXkuY2FsbCh0aGlzKTtcbiAgICB9XG5cbiAgfVxuXG4pO1xuIiwiLyoqXG4gKiBkYXQtZ3VpIEphdmFTY3JpcHQgQ29udHJvbGxlciBMaWJyYXJ5XG4gKiBodHRwOi8vY29kZS5nb29nbGUuY29tL3AvZGF0LWd1aVxuICpcbiAqIENvcHlyaWdodCAyMDExIERhdGEgQXJ0cyBUZWFtLCBHb29nbGUgQ3JlYXRpdmUgTGFiXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICovXG52YXIgT3B0aW9uQ29udHJvbGxlciA9IHJlcXVpcmUoJy4vT3B0aW9uQ29udHJvbGxlci5qcycpO1xudmFyIE51bWJlckNvbnRyb2xsZXJCb3ggPSByZXF1aXJlKCcuL051bWJlckNvbnRyb2xsZXJCb3guanMnKTtcbnZhciBOdW1iZXJDb250cm9sbGVyU2xpZGVyID0gcmVxdWlyZSgnLi9OdW1iZXJDb250cm9sbGVyU2xpZGVyLmpzJyk7XG52YXIgU3RyaW5nQ29udHJvbGxlciA9IHJlcXVpcmUoJy4vU3RyaW5nQ29udHJvbGxlci5qcycpO1xudmFyIEZ1bmN0aW9uQ29udHJvbGxlciA9IHJlcXVpcmUoJy4vRnVuY3Rpb25Db250cm9sbGVyLmpzJyk7XG52YXIgQm9vbGVhbkNvbnRyb2xsZXIgPSByZXF1aXJlKCcuL0Jvb2xlYW5Db250cm9sbGVyLmpzJyk7XG52YXIgY29tbW9uID0gcmVxdWlyZSgnLi4vdXRpbHMvY29tbW9uLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZmFjdG9yeTtcblxuZnVuY3Rpb24gZmFjdG9yeShvYmplY3QsIHByb3BlcnR5KSB7XG5cbiAgdmFyIGluaXRpYWxWYWx1ZSA9IG9iamVjdFtwcm9wZXJ0eV07XG5cbiAgLy8gUHJvdmlkaW5nIG9wdGlvbnM/XG4gIGlmIChjb21tb24uaXNBcnJheShhcmd1bWVudHNbMl0pIHx8IGNvbW1vbi5pc09iamVjdChhcmd1bWVudHNbMl0pKSB7XG4gICAgcmV0dXJuIG5ldyBPcHRpb25Db250cm9sbGVyKG9iamVjdCwgcHJvcGVydHksIGFyZ3VtZW50c1syXSk7XG4gIH1cblxuICAvLyBQcm92aWRpbmcgYSBtYXA/XG5cbiAgaWYgKGNvbW1vbi5pc051bWJlcihpbml0aWFsVmFsdWUpKSB7XG5cbiAgICBpZiAoY29tbW9uLmlzTnVtYmVyKGFyZ3VtZW50c1syXSkgJiYgY29tbW9uLmlzTnVtYmVyKGFyZ3VtZW50c1szXSkpIHtcblxuICAgICAgLy8gSGFzIG1pbiBhbmQgbWF4LlxuICAgICAgcmV0dXJuIG5ldyBOdW1iZXJDb250cm9sbGVyU2xpZGVyKG9iamVjdCwgcHJvcGVydHksIGFyZ3VtZW50c1syXSwgYXJndW1lbnRzWzNdKTtcblxuICAgIH0gZWxzZSB7XG5cbiAgICAgIHJldHVybiBuZXcgTnVtYmVyQ29udHJvbGxlckJveChvYmplY3QsIHByb3BlcnR5LCB7XG4gICAgICAgIG1pbjogYXJndW1lbnRzWzJdLFxuICAgICAgICBtYXg6IGFyZ3VtZW50c1szXVxuICAgICAgfSk7XG5cbiAgICB9XG5cbiAgfVxuXG4gIGlmIChjb21tb24uaXNTdHJpbmcoaW5pdGlhbFZhbHVlKSkge1xuICAgIHJldHVybiBuZXcgU3RyaW5nQ29udHJvbGxlcihvYmplY3QsIHByb3BlcnR5KTtcbiAgfVxuXG4gIGlmIChjb21tb24uaXNGdW5jdGlvbihpbml0aWFsVmFsdWUpKSB7XG4gICAgcmV0dXJuIG5ldyBGdW5jdGlvbkNvbnRyb2xsZXIob2JqZWN0LCBwcm9wZXJ0eSwgJycpO1xuICB9XG5cbiAgaWYgKGNvbW1vbi5pc0Jvb2xlYW4oaW5pdGlhbFZhbHVlKSkge1xuICAgIHJldHVybiBuZXcgQm9vbGVhbkNvbnRyb2xsZXIob2JqZWN0LCBwcm9wZXJ0eSk7XG4gIH1cblxufVxuIiwiLyoqXG4gKiBkYXQtZ3VpIEphdmFTY3JpcHQgQ29udHJvbGxlciBMaWJyYXJ5XG4gKiBodHRwOi8vY29kZS5nb29nbGUuY29tL3AvZGF0LWd1aVxuICpcbiAqIENvcHlyaWdodCAyMDExIERhdGEgQXJ0cyBUZWFtLCBHb29nbGUgQ3JlYXRpdmUgTGFiXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICovXG5cbnZhciBjb21tb24gPSByZXF1aXJlKCcuLi91dGlscy9jb21tb24uanMnKTtcbnZhciBkb20gPSByZXF1aXJlKCcuL2RvbS5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IENlbnRlcmVkRGl2O1xuXG5mdW5jdGlvbiBDZW50ZXJlZERpdigpIHtcblxuICB0aGlzLmJhY2tncm91bmRFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIGNvbW1vbi5leHRlbmQodGhpcy5iYWNrZ3JvdW5kRWxlbWVudC5zdHlsZSwge1xuICAgIGJhY2tncm91bmRDb2xvcjogJ3JnYmEoMCwwLDAsMC44KScsXG4gICAgdG9wOiAwLFxuICAgIGxlZnQ6IDAsXG4gICAgZGlzcGxheTogJ25vbmUnLFxuICAgIHpJbmRleDogJzEwMDAnLFxuICAgIG9wYWNpdHk6IDAsXG4gICAgV2Via2l0VHJhbnNpdGlvbjogJ29wYWNpdHkgMC4ycyBsaW5lYXInLFxuICAgIHRyYW5zaXRpb246ICdvcGFjaXR5IDAuMnMgbGluZWFyJ1xuICB9KTtcblxuICBkb20ubWFrZUZ1bGxzY3JlZW4odGhpcy5iYWNrZ3JvdW5kRWxlbWVudCk7XG4gIHRoaXMuYmFja2dyb3VuZEVsZW1lbnQuc3R5bGUucG9zaXRpb24gPSAnZml4ZWQnO1xuXG4gIHRoaXMuZG9tRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICBjb21tb24uZXh0ZW5kKHRoaXMuZG9tRWxlbWVudC5zdHlsZSwge1xuICAgIHBvc2l0aW9uOiAnZml4ZWQnLFxuICAgIGRpc3BsYXk6ICdub25lJyxcbiAgICB6SW5kZXg6ICcxMDAxJyxcbiAgICBvcGFjaXR5OiAwLFxuICAgIFdlYmtpdFRyYW5zaXRpb246ICctd2Via2l0LXRyYW5zZm9ybSAwLjJzIGVhc2Utb3V0LCBvcGFjaXR5IDAuMnMgbGluZWFyJyxcbiAgICB0cmFuc2l0aW9uOiAndHJhbnNmb3JtIDAuMnMgZWFzZS1vdXQsIG9wYWNpdHkgMC4ycyBsaW5lYXInXG4gIH0pO1xuXG5cbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0aGlzLmJhY2tncm91bmRFbGVtZW50KTtcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0aGlzLmRvbUVsZW1lbnQpO1xuXG4gIHZhciBfdGhpcyA9IHRoaXM7XG4gIGRvbS5iaW5kKHRoaXMuYmFja2dyb3VuZEVsZW1lbnQsICdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgIF90aGlzLmhpZGUoKTtcbiAgfSk7XG5cblxufTtcblxuQ2VudGVyZWREaXYucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbigpIHtcblxuICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gIHRoaXMuYmFja2dyb3VuZEVsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG5cbiAgdGhpcy5kb21FbGVtZW50LnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICB0aGlzLmRvbUVsZW1lbnQuc3R5bGUub3BhY2l0eSA9IDA7XG4gIC8vICAgIHRoaXMuZG9tRWxlbWVudC5zdHlsZS50b3AgPSAnNTIlJztcbiAgdGhpcy5kb21FbGVtZW50LnN0eWxlLndlYmtpdFRyYW5zZm9ybSA9ICdzY2FsZSgxLjEpJztcblxuICB0aGlzLmxheW91dCgpO1xuXG4gIGNvbW1vbi5kZWZlcihmdW5jdGlvbigpIHtcbiAgICBfdGhpcy5iYWNrZ3JvdW5kRWxlbWVudC5zdHlsZS5vcGFjaXR5ID0gMTtcbiAgICBfdGhpcy5kb21FbGVtZW50LnN0eWxlLm9wYWNpdHkgPSAxO1xuICAgIF90aGlzLmRvbUVsZW1lbnQuc3R5bGUud2Via2l0VHJhbnNmb3JtID0gJ3NjYWxlKDEpJztcbiAgfSk7XG5cbn07XG5cbkNlbnRlcmVkRGl2LnByb3RvdHlwZS5oaWRlID0gZnVuY3Rpb24oKSB7XG5cbiAgdmFyIF90aGlzID0gdGhpcztcblxuICB2YXIgaGlkZSA9IGZ1bmN0aW9uKCkge1xuXG4gICAgX3RoaXMuZG9tRWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgIF90aGlzLmJhY2tncm91bmRFbGVtZW50LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG5cbiAgICBkb20udW5iaW5kKF90aGlzLmRvbUVsZW1lbnQsICd3ZWJraXRUcmFuc2l0aW9uRW5kJywgaGlkZSk7XG4gICAgZG9tLnVuYmluZChfdGhpcy5kb21FbGVtZW50LCAndHJhbnNpdGlvbmVuZCcsIGhpZGUpO1xuICAgIGRvbS51bmJpbmQoX3RoaXMuZG9tRWxlbWVudCwgJ29UcmFuc2l0aW9uRW5kJywgaGlkZSk7XG5cbiAgfTtcblxuICBkb20uYmluZCh0aGlzLmRvbUVsZW1lbnQsICd3ZWJraXRUcmFuc2l0aW9uRW5kJywgaGlkZSk7XG4gIGRvbS5iaW5kKHRoaXMuZG9tRWxlbWVudCwgJ3RyYW5zaXRpb25lbmQnLCBoaWRlKTtcbiAgZG9tLmJpbmQodGhpcy5kb21FbGVtZW50LCAnb1RyYW5zaXRpb25FbmQnLCBoaWRlKTtcblxuICB0aGlzLmJhY2tncm91bmRFbGVtZW50LnN0eWxlLm9wYWNpdHkgPSAwO1xuICAvLyAgICB0aGlzLmRvbUVsZW1lbnQuc3R5bGUudG9wID0gJzQ4JSc7XG4gIHRoaXMuZG9tRWxlbWVudC5zdHlsZS5vcGFjaXR5ID0gMDtcbiAgdGhpcy5kb21FbGVtZW50LnN0eWxlLndlYmtpdFRyYW5zZm9ybSA9ICdzY2FsZSgxLjEpJztcblxufTtcblxuQ2VudGVyZWREaXYucHJvdG90eXBlLmxheW91dCA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLmRvbUVsZW1lbnQuc3R5bGUubGVmdCA9IHdpbmRvdy5pbm5lcldpZHRoIC8gMiAtIGRvbS5nZXRXaWR0aCh0aGlzLmRvbUVsZW1lbnQpIC8gMiArICdweCc7XG4gIHRoaXMuZG9tRWxlbWVudC5zdHlsZS50b3AgPSB3aW5kb3cuaW5uZXJIZWlnaHQgLyAyIC0gZG9tLmdldEhlaWdodCh0aGlzLmRvbUVsZW1lbnQpIC8gMiArICdweCc7XG59O1xuXG5mdW5jdGlvbiBsb2NrU2Nyb2xsKGUpIHtcbiAgY29uc29sZS5sb2coZSk7XG59XG4iLCIvKipcbiAqIGRhdC1ndWkgSmF2YVNjcmlwdCBDb250cm9sbGVyIExpYnJhcnlcbiAqIGh0dHA6Ly9jb2RlLmdvb2dsZS5jb20vcC9kYXQtZ3VpXG4gKlxuICogQ29weXJpZ2h0IDIwMTEgRGF0YSBBcnRzIFRlYW0sIEdvb2dsZSBDcmVhdGl2ZSBMYWJcbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKi9cblxudmFyIGNvbW1vbiA9IHJlcXVpcmUoJy4uL3V0aWxzL2NvbW1vbi5qcycpO1xuXG52YXIgRVZFTlRfTUFQID0ge1xuICAnSFRNTEV2ZW50cyc6IFsnY2hhbmdlJ10sXG4gICdNb3VzZUV2ZW50cyc6IFsnY2xpY2snLCAnbW91c2Vtb3ZlJywgJ21vdXNlZG93bicsICdtb3VzZXVwJywgJ21vdXNlb3ZlciddLFxuICAnS2V5Ym9hcmRFdmVudHMnOiBbJ2tleWRvd24nXVxufTtcblxudmFyIEVWRU5UX01BUF9JTlYgPSB7fTtcbmNvbW1vbi5lYWNoKEVWRU5UX01BUCwgZnVuY3Rpb24odiwgaykge1xuICBjb21tb24uZWFjaCh2LCBmdW5jdGlvbihlKSB7XG4gICAgRVZFTlRfTUFQX0lOVltlXSA9IGs7XG4gIH0pO1xufSk7XG5cbnZhciBDU1NfVkFMVUVfUElYRUxTID0gLyhcXGQrKFxcLlxcZCspPylweC87XG5cbmZ1bmN0aW9uIGNzc1ZhbHVlVG9QaXhlbHModmFsKSB7XG5cbiAgaWYgKHZhbCA9PT0gJzAnIHx8IGNvbW1vbi5pc1VuZGVmaW5lZCh2YWwpKSByZXR1cm4gMDtcblxuICB2YXIgbWF0Y2ggPSB2YWwubWF0Y2goQ1NTX1ZBTFVFX1BJWEVMUyk7XG5cbiAgaWYgKCFjb21tb24uaXNOdWxsKG1hdGNoKSkge1xuICAgIHJldHVybiBwYXJzZUZsb2F0KG1hdGNoWzFdKTtcbiAgfVxuXG4gIC8vIFRPRE8gLi4uZW1zPyAlP1xuXG4gIHJldHVybiAwO1xuXG59XG5cbi8qKlxuICogQG5hbWVzcGFjZVxuICogQG1lbWJlciBkYXQuZG9tXG4gKi9cbnZhciBkb20gPSB7XG5cbiAgLyoqXG4gICAqXG4gICAqIEBwYXJhbSBlbGVtXG4gICAqIEBwYXJhbSBzZWxlY3RhYmxlXG4gICAqL1xuICBtYWtlU2VsZWN0YWJsZTogZnVuY3Rpb24oZWxlbSwgc2VsZWN0YWJsZSkge1xuXG4gICAgaWYgKGVsZW0gPT09IHVuZGVmaW5lZCB8fCBlbGVtLnN0eWxlID09PSB1bmRlZmluZWQpIHJldHVybjtcblxuICAgIGVsZW0ub25zZWxlY3RzdGFydCA9IHNlbGVjdGFibGUgPyBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9IDogZnVuY3Rpb24oKSB7fTtcblxuICAgIGVsZW0uc3R5bGUuTW96VXNlclNlbGVjdCA9IHNlbGVjdGFibGUgPyAnYXV0bycgOiAnbm9uZSc7XG4gICAgZWxlbS5zdHlsZS5LaHRtbFVzZXJTZWxlY3QgPSBzZWxlY3RhYmxlID8gJ2F1dG8nIDogJ25vbmUnO1xuICAgIGVsZW0udW5zZWxlY3RhYmxlID0gc2VsZWN0YWJsZSA/ICdvbicgOiAnb2ZmJztcblxuICB9LFxuXG4gIC8qKlxuICAgKlxuICAgKiBAcGFyYW0gZWxlbVxuICAgKiBAcGFyYW0gaG9yaXpvbnRhbFxuICAgKiBAcGFyYW0gdmVydGljYWxcbiAgICovXG4gIG1ha2VGdWxsc2NyZWVuOiBmdW5jdGlvbihlbGVtLCBob3Jpem9udGFsLCB2ZXJ0aWNhbCkge1xuXG4gICAgaWYgKGNvbW1vbi5pc1VuZGVmaW5lZChob3Jpem9udGFsKSkgaG9yaXpvbnRhbCA9IHRydWU7XG4gICAgaWYgKGNvbW1vbi5pc1VuZGVmaW5lZCh2ZXJ0aWNhbCkpIHZlcnRpY2FsID0gdHJ1ZTtcblxuICAgIGVsZW0uc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuXG4gICAgaWYgKGhvcml6b250YWwpIHtcbiAgICAgIGVsZW0uc3R5bGUubGVmdCA9IDA7XG4gICAgICBlbGVtLnN0eWxlLnJpZ2h0ID0gMDtcbiAgICB9XG4gICAgaWYgKHZlcnRpY2FsKSB7XG4gICAgICBlbGVtLnN0eWxlLnRvcCA9IDA7XG4gICAgICBlbGVtLnN0eWxlLmJvdHRvbSA9IDA7XG4gICAgfVxuXG4gIH0sXG5cbiAgLyoqXG4gICAqXG4gICAqIEBwYXJhbSBlbGVtXG4gICAqIEBwYXJhbSBldmVudFR5cGVcbiAgICogQHBhcmFtIHBhcmFtc1xuICAgKi9cbiAgZmFrZUV2ZW50OiBmdW5jdGlvbihlbGVtLCBldmVudFR5cGUsIHBhcmFtcywgYXV4KSB7XG4gICAgcGFyYW1zID0gcGFyYW1zIHx8IHt9O1xuICAgIHZhciBjbGFzc05hbWUgPSBFVkVOVF9NQVBfSU5WW2V2ZW50VHlwZV07XG4gICAgaWYgKCFjbGFzc05hbWUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignRXZlbnQgdHlwZSAnICsgZXZlbnRUeXBlICsgJyBub3Qgc3VwcG9ydGVkLicpO1xuICAgIH1cbiAgICB2YXIgZXZ0ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoY2xhc3NOYW1lKTtcbiAgICBzd2l0Y2ggKGNsYXNzTmFtZSkge1xuICAgICAgY2FzZSAnTW91c2VFdmVudHMnOlxuICAgICAgICB2YXIgY2xpZW50WCA9IHBhcmFtcy54IHx8IHBhcmFtcy5jbGllbnRYIHx8IDA7XG4gICAgICAgIHZhciBjbGllbnRZID0gcGFyYW1zLnkgfHwgcGFyYW1zLmNsaWVudFkgfHwgMDtcbiAgICAgICAgZXZ0LmluaXRNb3VzZUV2ZW50KGV2ZW50VHlwZSwgcGFyYW1zLmJ1YmJsZXMgfHwgZmFsc2UsXG4gICAgICAgICAgcGFyYW1zLmNhbmNlbGFibGUgfHwgdHJ1ZSwgd2luZG93LCBwYXJhbXMuY2xpY2tDb3VudCB8fCAxLFxuICAgICAgICAgIDAsIC8vc2NyZWVuIFhcbiAgICAgICAgICAwLCAvL3NjcmVlbiBZXG4gICAgICAgICAgY2xpZW50WCwgLy9jbGllbnQgWFxuICAgICAgICAgIGNsaWVudFksIC8vY2xpZW50IFlcbiAgICAgICAgICBmYWxzZSwgZmFsc2UsIGZhbHNlLCBmYWxzZSwgMCwgbnVsbCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnS2V5Ym9hcmRFdmVudHMnOlxuICAgICAgICB2YXIgaW5pdCA9IGV2dC5pbml0S2V5Ym9hcmRFdmVudCB8fCBldnQuaW5pdEtleUV2ZW50OyAvLyB3ZWJraXQgfHwgbW96XG4gICAgICAgIGNvbW1vbi5kZWZhdWx0cyhwYXJhbXMsIHtcbiAgICAgICAgICBjYW5jZWxhYmxlOiB0cnVlLFxuICAgICAgICAgIGN0cmxLZXk6IGZhbHNlLFxuICAgICAgICAgIGFsdEtleTogZmFsc2UsXG4gICAgICAgICAgc2hpZnRLZXk6IGZhbHNlLFxuICAgICAgICAgIG1ldGFLZXk6IGZhbHNlLFxuICAgICAgICAgIGtleUNvZGU6IHVuZGVmaW5lZCxcbiAgICAgICAgICBjaGFyQ29kZTogdW5kZWZpbmVkXG4gICAgICAgIH0pO1xuICAgICAgICBpbml0KGV2ZW50VHlwZSwgcGFyYW1zLmJ1YmJsZXMgfHwgZmFsc2UsXG4gICAgICAgICAgcGFyYW1zLmNhbmNlbGFibGUsIHdpbmRvdyxcbiAgICAgICAgICBwYXJhbXMuY3RybEtleSwgcGFyYW1zLmFsdEtleSxcbiAgICAgICAgICBwYXJhbXMuc2hpZnRLZXksIHBhcmFtcy5tZXRhS2V5LFxuICAgICAgICAgIHBhcmFtcy5rZXlDb2RlLCBwYXJhbXMuY2hhckNvZGUpO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGV2dC5pbml0RXZlbnQoZXZlbnRUeXBlLCBwYXJhbXMuYnViYmxlcyB8fCBmYWxzZSxcbiAgICAgICAgICBwYXJhbXMuY2FuY2VsYWJsZSB8fCB0cnVlKTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGNvbW1vbi5kZWZhdWx0cyhldnQsIGF1eCk7XG4gICAgZWxlbS5kaXNwYXRjaEV2ZW50KGV2dCk7XG4gIH0sXG5cbiAgLyoqXG4gICAqXG4gICAqIEBwYXJhbSBlbGVtXG4gICAqIEBwYXJhbSBldmVudFxuICAgKiBAcGFyYW0gZnVuY1xuICAgKiBAcGFyYW0gYm9vbFxuICAgKi9cbiAgYmluZDogZnVuY3Rpb24oZWxlbSwgZXZlbnQsIGZ1bmMsIGJvb2wpIHtcbiAgICBib29sID0gYm9vbCB8fCBmYWxzZTtcbiAgICBpZiAoZWxlbS5hZGRFdmVudExpc3RlbmVyKVxuICAgICAgZWxlbS5hZGRFdmVudExpc3RlbmVyKGV2ZW50LCBmdW5jLCBib29sKTtcbiAgICBlbHNlIGlmIChlbGVtLmF0dGFjaEV2ZW50KVxuICAgICAgZWxlbS5hdHRhY2hFdmVudCgnb24nICsgZXZlbnQsIGZ1bmMpO1xuICAgIHJldHVybiBkb207XG4gIH0sXG5cbiAgLyoqXG4gICAqXG4gICAqIEBwYXJhbSBlbGVtXG4gICAqIEBwYXJhbSBldmVudFxuICAgKiBAcGFyYW0gZnVuY1xuICAgKiBAcGFyYW0gYm9vbFxuICAgKi9cbiAgdW5iaW5kOiBmdW5jdGlvbihlbGVtLCBldmVudCwgZnVuYywgYm9vbCkge1xuICAgIGJvb2wgPSBib29sIHx8IGZhbHNlO1xuICAgIGlmIChlbGVtLnJlbW92ZUV2ZW50TGlzdGVuZXIpXG4gICAgICBlbGVtLnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnQsIGZ1bmMsIGJvb2wpO1xuICAgIGVsc2UgaWYgKGVsZW0uZGV0YWNoRXZlbnQpXG4gICAgICBlbGVtLmRldGFjaEV2ZW50KCdvbicgKyBldmVudCwgZnVuYyk7XG4gICAgcmV0dXJuIGRvbTtcbiAgfSxcblxuICAvKipcbiAgICpcbiAgICogQHBhcmFtIGVsZW1cbiAgICogQHBhcmFtIGNsYXNzTmFtZVxuICAgKi9cbiAgYWRkQ2xhc3M6IGZ1bmN0aW9uKGVsZW0sIGNsYXNzTmFtZSkge1xuICAgIGlmIChlbGVtLmNsYXNzTmFtZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBlbGVtLmNsYXNzTmFtZSA9IGNsYXNzTmFtZTtcbiAgICB9IGVsc2UgaWYgKGVsZW0uY2xhc3NOYW1lICE9PSBjbGFzc05hbWUpIHtcbiAgICAgIHZhciBjbGFzc2VzID0gZWxlbS5jbGFzc05hbWUuc3BsaXQoLyArLyk7XG4gICAgICBpZiAoY2xhc3Nlcy5pbmRleE9mKGNsYXNzTmFtZSkgPT0gLTEpIHtcbiAgICAgICAgY2xhc3Nlcy5wdXNoKGNsYXNzTmFtZSk7XG4gICAgICAgIGVsZW0uY2xhc3NOYW1lID0gY2xhc3Nlcy5qb2luKCcgJykucmVwbGFjZSgvXlxccysvLCAnJykucmVwbGFjZSgvXFxzKyQvLCAnJyk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBkb207XG4gIH0sXG5cbiAgLyoqXG4gICAqXG4gICAqIEBwYXJhbSBlbGVtXG4gICAqIEBwYXJhbSBjbGFzc05hbWVcbiAgICovXG4gIHJlbW92ZUNsYXNzOiBmdW5jdGlvbihlbGVtLCBjbGFzc05hbWUpIHtcbiAgICBpZiAoY2xhc3NOYW1lKSB7XG4gICAgICBpZiAoZWxlbS5jbGFzc05hbWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAvLyBlbGVtLmNsYXNzTmFtZSA9IGNsYXNzTmFtZTtcbiAgICAgIH0gZWxzZSBpZiAoZWxlbS5jbGFzc05hbWUgPT09IGNsYXNzTmFtZSkge1xuICAgICAgICBlbGVtLnJlbW92ZUF0dHJpYnV0ZSgnY2xhc3MnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBjbGFzc2VzID0gZWxlbS5jbGFzc05hbWUuc3BsaXQoLyArLyk7XG4gICAgICAgIHZhciBpbmRleCA9IGNsYXNzZXMuaW5kZXhPZihjbGFzc05hbWUpO1xuICAgICAgICBpZiAoaW5kZXggIT0gLTEpIHtcbiAgICAgICAgICBjbGFzc2VzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgZWxlbS5jbGFzc05hbWUgPSBjbGFzc2VzLmpvaW4oJyAnKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBlbGVtLmNsYXNzTmFtZSA9IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgcmV0dXJuIGRvbTtcbiAgfSxcblxuICBoYXNDbGFzczogZnVuY3Rpb24oZWxlbSwgY2xhc3NOYW1lKSB7XG4gICAgcmV0dXJuIG5ldyBSZWdFeHAoJyg/Ol58XFxcXHMrKScgKyBjbGFzc05hbWUgKyAnKD86XFxcXHMrfCQpJykudGVzdChlbGVtLmNsYXNzTmFtZSkgfHwgZmFsc2U7XG4gIH0sXG5cbiAgLyoqXG4gICAqXG4gICAqIEBwYXJhbSBlbGVtXG4gICAqL1xuICBnZXRXaWR0aDogZnVuY3Rpb24oZWxlbSkge1xuXG4gICAgdmFyIHN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZShlbGVtKTtcblxuICAgIHJldHVybiBjc3NWYWx1ZVRvUGl4ZWxzKHN0eWxlWydib3JkZXItbGVmdC13aWR0aCddKSArXG4gICAgICBjc3NWYWx1ZVRvUGl4ZWxzKHN0eWxlWydib3JkZXItcmlnaHQtd2lkdGgnXSkgK1xuICAgICAgY3NzVmFsdWVUb1BpeGVscyhzdHlsZVsncGFkZGluZy1sZWZ0J10pICtcbiAgICAgIGNzc1ZhbHVlVG9QaXhlbHMoc3R5bGVbJ3BhZGRpbmctcmlnaHQnXSkgK1xuICAgICAgY3NzVmFsdWVUb1BpeGVscyhzdHlsZVsnd2lkdGgnXSk7XG4gIH0sXG5cbiAgLyoqXG4gICAqXG4gICAqIEBwYXJhbSBlbGVtXG4gICAqL1xuICBnZXRIZWlnaHQ6IGZ1bmN0aW9uKGVsZW0pIHtcblxuICAgIHZhciBzdHlsZSA9IGdldENvbXB1dGVkU3R5bGUoZWxlbSk7XG5cbiAgICByZXR1cm4gY3NzVmFsdWVUb1BpeGVscyhzdHlsZVsnYm9yZGVyLXRvcC13aWR0aCddKSArXG4gICAgICBjc3NWYWx1ZVRvUGl4ZWxzKHN0eWxlWydib3JkZXItYm90dG9tLXdpZHRoJ10pICtcbiAgICAgIGNzc1ZhbHVlVG9QaXhlbHMoc3R5bGVbJ3BhZGRpbmctdG9wJ10pICtcbiAgICAgIGNzc1ZhbHVlVG9QaXhlbHMoc3R5bGVbJ3BhZGRpbmctYm90dG9tJ10pICtcbiAgICAgIGNzc1ZhbHVlVG9QaXhlbHMoc3R5bGVbJ2hlaWdodCddKTtcbiAgfSxcblxuICAvKipcbiAgICpcbiAgICogQHBhcmFtIGVsZW1cbiAgICovXG4gIGdldE9mZnNldDogZnVuY3Rpb24oZWxlbSkge1xuICAgIHZhciBvZmZzZXQgPSB7XG4gICAgICBsZWZ0OiAwLFxuICAgICAgdG9wOiAwXG4gICAgfTtcbiAgICBpZiAoZWxlbS5vZmZzZXRQYXJlbnQpIHtcbiAgICAgIGRvIHtcbiAgICAgICAgb2Zmc2V0LmxlZnQgKz0gZWxlbS5vZmZzZXRMZWZ0O1xuICAgICAgICBvZmZzZXQudG9wICs9IGVsZW0ub2Zmc2V0VG9wO1xuICAgICAgfSB3aGlsZSAoZWxlbSA9IGVsZW0ub2Zmc2V0UGFyZW50KTtcbiAgICB9XG4gICAgcmV0dXJuIG9mZnNldDtcbiAgfSxcblxuICAvLyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcG9zdHMvMjY4NDU2MS9yZXZpc2lvbnNcbiAgLyoqXG4gICAqXG4gICAqIEBwYXJhbSBlbGVtXG4gICAqL1xuICBpc0FjdGl2ZTogZnVuY3Rpb24oZWxlbSkge1xuICAgIHJldHVybiBlbGVtID09PSBkb2N1bWVudC5hY3RpdmVFbGVtZW50ICYmIChlbGVtLnR5cGUgfHwgZWxlbS5ocmVmKTtcbiAgfVxuXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGRvbTtcbiIsIi8qKlxuICogZGF0LWd1aSBKYXZhU2NyaXB0IENvbnRyb2xsZXIgTGlicmFyeVxuICogaHR0cDovL2NvZGUuZ29vZ2xlLmNvbS9wL2RhdC1ndWlcbiAqXG4gKiBDb3B5cmlnaHQgMjAxMSBEYXRhIEFydHMgVGVhbSwgR29vZ2xlIENyZWF0aXZlIExhYlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqL1xuXG52YXIgY3NzID0gcmVxdWlyZSgnLi4vdXRpbHMvY3NzLmpzJyk7XG5cbnZhciBzYXZlRGlhbG9ndWVDb250ZW50cyA9IFwiPGRpdiBpZD1cXFwiZGctc2F2ZVxcXCIgY2xhc3M9XFxcImRnIGRpYWxvZ3VlXFxcIj5cXG5cXG4gIEhlcmUncyB0aGUgbmV3IGxvYWQgcGFyYW1ldGVyIGZvciB5b3VyIDxjb2RlPkdVSTwvY29kZT4ncyBjb25zdHJ1Y3RvcjpcXG5cXG4gIDx0ZXh0YXJlYSBpZD1cXFwiZGctbmV3LWNvbnN0cnVjdG9yXFxcIj48L3RleHRhcmVhPlxcblxcbiAgPGRpdiBpZD1cXFwiZGctc2F2ZS1sb2NhbGx5XFxcIj5cXG5cXG4gICAgPGlucHV0IGlkPVxcXCJkZy1sb2NhbC1zdG9yYWdlXFxcIiB0eXBlPVxcXCJjaGVja2JveFxcXCIvPiBBdXRvbWF0aWNhbGx5IHNhdmVcXG4gICAgdmFsdWVzIHRvIDxjb2RlPmxvY2FsU3RvcmFnZTwvY29kZT4gb24gZXhpdC5cXG5cXG4gICAgPGRpdiBpZD1cXFwiZGctbG9jYWwtZXhwbGFpblxcXCI+VGhlIHZhbHVlcyBzYXZlZCB0byA8Y29kZT5sb2NhbFN0b3JhZ2U8L2NvZGU+IHdpbGxcXG4gICAgICBvdmVycmlkZSB0aG9zZSBwYXNzZWQgdG8gPGNvZGU+ZGF0LkdVSTwvY29kZT4ncyBjb25zdHJ1Y3Rvci4gVGhpcyBtYWtlcyBpdFxcbiAgICAgIGVhc2llciB0byB3b3JrIGluY3JlbWVudGFsbHksIGJ1dCA8Y29kZT5sb2NhbFN0b3JhZ2U8L2NvZGU+IGlzIGZyYWdpbGUsXFxuICAgICAgYW5kIHlvdXIgZnJpZW5kcyBtYXkgbm90IHNlZSB0aGUgc2FtZSB2YWx1ZXMgeW91IGRvLlxcbiAgICAgIFxcbiAgICA8L2Rpdj5cXG4gICAgXFxuICA8L2Rpdj5cXG5cXG48L2Rpdj5cIjtcbnZhciBzdHlsZVNoZWV0ID0gXCIuZGcge1xcbiAgLyoqIENsZWFyIGxpc3Qgc3R5bGVzICovXFxuICAvKiBBdXRvLXBsYWNlIGNvbnRhaW5lciAqL1xcbiAgLyogQXV0by1wbGFjZWQgR1VJJ3MgKi9cXG4gIC8qIExpbmUgaXRlbXMgdGhhdCBkb24ndCBjb250YWluIGZvbGRlcnMuICovXFxuICAvKiogRm9sZGVyIG5hbWVzICovXFxuICAvKiogSGlkZXMgY2xvc2VkIGl0ZW1zICovXFxuICAvKiogQ29udHJvbGxlciByb3cgKi9cXG4gIC8qKiBOYW1lLWhhbGYgKGxlZnQpICovXFxuICAvKiogQ29udHJvbGxlci1oYWxmIChyaWdodCkgKi9cXG4gIC8qKiBDb250cm9sbGVyIHBsYWNlbWVudCAqL1xcbiAgLyoqIFNob3J0ZXIgbnVtYmVyIGJveGVzIHdoZW4gc2xpZGVyIGlzIHByZXNlbnQuICovXFxuICAvKiogRW5zdXJlIHRoZSBlbnRpcmUgYm9vbGVhbiBhbmQgZnVuY3Rpb24gcm93IHNob3dzIGEgaGFuZCAqLyB9XFxuICAuZGcgdWwge1xcbiAgICBsaXN0LXN0eWxlOiBub25lO1xcbiAgICBtYXJnaW46IDA7XFxuICAgIHBhZGRpbmc6IDA7XFxuICAgIHdpZHRoOiAxMDAlO1xcbiAgICBjbGVhcjogYm90aDsgfVxcbiAgLmRnLmFjIHtcXG4gICAgcG9zaXRpb246IGZpeGVkO1xcbiAgICB0b3A6IDA7XFxuICAgIGxlZnQ6IDA7XFxuICAgIHJpZ2h0OiAwO1xcbiAgICBoZWlnaHQ6IDA7XFxuICAgIHotaW5kZXg6IDA7IH1cXG4gIC5kZzpub3QoLmFjKSAubWFpbiB7XFxuICAgIC8qKiBFeGNsdWRlIG1haW5zIGluIGFjIHNvIHRoYXQgd2UgZG9uJ3QgaGlkZSBjbG9zZSBidXR0b24gKi9cXG4gICAgb3ZlcmZsb3c6IGhpZGRlbjsgfVxcbiAgLmRnLm1haW4ge1xcbiAgICAtd2Via2l0LXRyYW5zaXRpb246IG9wYWNpdHkgMC4xcyBsaW5lYXI7XFxuICAgIC1vLXRyYW5zaXRpb246IG9wYWNpdHkgMC4xcyBsaW5lYXI7XFxuICAgIC1tb3otdHJhbnNpdGlvbjogb3BhY2l0eSAwLjFzIGxpbmVhcjtcXG4gICAgdHJhbnNpdGlvbjogb3BhY2l0eSAwLjFzIGxpbmVhcjsgfVxcbiAgICAuZGcubWFpbi50YWxsZXItdGhhbi13aW5kb3cge1xcbiAgICAgIG92ZXJmbG93LXk6IGF1dG87IH1cXG4gICAgICAuZGcubWFpbi50YWxsZXItdGhhbi13aW5kb3cgLmNsb3NlLWJ1dHRvbiB7XFxuICAgICAgICBvcGFjaXR5OiAxO1xcbiAgICAgICAgLyogVE9ETywgdGhlc2UgYXJlIHN0eWxlIG5vdGVzICovXFxuICAgICAgICBtYXJnaW4tdG9wOiAtMXB4O1xcbiAgICAgICAgYm9yZGVyLXRvcDogMXB4IHNvbGlkICMyYzJjMmM7IH1cXG4gICAgLmRnLm1haW4gdWwuY2xvc2VkIC5jbG9zZS1idXR0b24ge1xcbiAgICAgIG9wYWNpdHk6IDEgIWltcG9ydGFudDsgfVxcbiAgICAuZGcubWFpbjpob3ZlciAuY2xvc2UtYnV0dG9uLFxcbiAgICAuZGcubWFpbiAuY2xvc2UtYnV0dG9uLmRyYWcge1xcbiAgICAgIG9wYWNpdHk6IDE7IH1cXG4gICAgLmRnLm1haW4gLmNsb3NlLWJ1dHRvbiB7XFxuICAgICAgLypvcGFjaXR5OiAwOyovXFxuICAgICAgLXdlYmtpdC10cmFuc2l0aW9uOiBvcGFjaXR5IDAuMXMgbGluZWFyO1xcbiAgICAgIC1vLXRyYW5zaXRpb246IG9wYWNpdHkgMC4xcyBsaW5lYXI7XFxuICAgICAgLW1vei10cmFuc2l0aW9uOiBvcGFjaXR5IDAuMXMgbGluZWFyO1xcbiAgICAgIHRyYW5zaXRpb246IG9wYWNpdHkgMC4xcyBsaW5lYXI7XFxuICAgICAgYm9yZGVyOiAwO1xcbiAgICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcXG4gICAgICBsaW5lLWhlaWdodDogMTlweDtcXG4gICAgICBoZWlnaHQ6IDIwcHg7XFxuICAgICAgLyogVE9ETywgdGhlc2UgYXJlIHN0eWxlIG5vdGVzICovXFxuICAgICAgY3Vyc29yOiBwb2ludGVyO1xcbiAgICAgIHRleHQtYWxpZ246IGNlbnRlcjtcXG4gICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjMDAwOyB9XFxuICAgICAgLmRnLm1haW4gLmNsb3NlLWJ1dHRvbjpob3ZlciB7XFxuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjMTExOyB9XFxuICAuZGcuYSB7XFxuICAgIGZsb2F0OiByaWdodDtcXG4gICAgbWFyZ2luLXJpZ2h0OiAxNXB4O1xcbiAgICBvdmVyZmxvdy14OiBoaWRkZW47IH1cXG4gICAgLmRnLmEuaGFzLXNhdmUgPiB1bCB7XFxuICAgICAgbWFyZ2luLXRvcDogMjdweDsgfVxcbiAgICAgIC5kZy5hLmhhcy1zYXZlID4gdWwuY2xvc2VkIHtcXG4gICAgICAgIG1hcmdpbi10b3A6IDA7IH1cXG4gICAgLmRnLmEgLnNhdmUtcm93IHtcXG4gICAgICBwb3NpdGlvbjogZml4ZWQ7XFxuICAgICAgdG9wOiAwO1xcbiAgICAgIHotaW5kZXg6IDEwMDI7IH1cXG4gIC5kZyBsaSB7XFxuICAgIC13ZWJraXQtdHJhbnNpdGlvbjogaGVpZ2h0IDAuMXMgZWFzZS1vdXQ7XFxuICAgIC1vLXRyYW5zaXRpb246IGhlaWdodCAwLjFzIGVhc2Utb3V0O1xcbiAgICAtbW96LXRyYW5zaXRpb246IGhlaWdodCAwLjFzIGVhc2Utb3V0O1xcbiAgICB0cmFuc2l0aW9uOiBoZWlnaHQgMC4xcyBlYXNlLW91dDsgfVxcbiAgLmRnIGxpOm5vdCguZm9sZGVyKSB7XFxuICAgIGN1cnNvcjogYXV0bztcXG4gICAgaGVpZ2h0OiAyN3B4O1xcbiAgICBsaW5lLWhlaWdodDogMjdweDtcXG4gICAgb3ZlcmZsb3c6IGhpZGRlbjtcXG4gICAgcGFkZGluZzogMCA0cHggMCA1cHg7IH1cXG4gIC5kZyBsaS5mb2xkZXIge1xcbiAgICBwYWRkaW5nOiAwO1xcbiAgICBib3JkZXItbGVmdDogNHB4IHNvbGlkIHJnYmEoMCwgMCwgMCwgMCk7IH1cXG4gIC5kZyBsaS50aXRsZSB7XFxuICAgIGN1cnNvcjogcG9pbnRlcjtcXG4gICAgbWFyZ2luLWxlZnQ6IC00cHg7IH1cXG4gIC5kZyAuY2xvc2VkIGxpOm5vdCgudGl0bGUpLFxcbiAgLmRnIC5jbG9zZWQgdWwgbGksXFxuICAuZGcgLmNsb3NlZCB1bCBsaSA+ICoge1xcbiAgICBoZWlnaHQ6IDA7XFxuICAgIG92ZXJmbG93OiBoaWRkZW47XFxuICAgIGJvcmRlcjogMDsgfVxcbiAgLmRnIC5jciB7XFxuICAgIGNsZWFyOiBib3RoO1xcbiAgICBwYWRkaW5nLWxlZnQ6IDNweDtcXG4gICAgaGVpZ2h0OiAyN3B4OyB9XFxuICAuZGcgLnByb3BlcnR5LW5hbWUge1xcbiAgICBjdXJzb3I6IGRlZmF1bHQ7XFxuICAgIGZsb2F0OiBsZWZ0O1xcbiAgICBjbGVhcjogbGVmdDtcXG4gICAgd2lkdGg6IDQwJTtcXG4gICAgb3ZlcmZsb3c6IGhpZGRlbjtcXG4gICAgdGV4dC1vdmVyZmxvdzogZWxsaXBzaXM7IH1cXG4gIC5kZyAuYyB7XFxuICAgIGZsb2F0OiBsZWZ0O1xcbiAgICB3aWR0aDogNjAlOyB9XFxuICAuZGcgLmMgaW5wdXRbdHlwZT10ZXh0XSB7XFxuICAgIGJvcmRlcjogMDtcXG4gICAgbWFyZ2luLXRvcDogNHB4O1xcbiAgICBwYWRkaW5nOiAzcHg7XFxuICAgIHdpZHRoOiAxMDAlO1xcbiAgICBmbG9hdDogcmlnaHQ7IH1cXG4gIC5kZyAuaGFzLXNsaWRlciBpbnB1dFt0eXBlPXRleHRdIHtcXG4gICAgd2lkdGg6IDMwJTtcXG4gICAgLypkaXNwbGF5OiBub25lOyovXFxuICAgIG1hcmdpbi1sZWZ0OiAwOyB9XFxuICAuZGcgLnNsaWRlciB7XFxuICAgIGZsb2F0OiBsZWZ0O1xcbiAgICB3aWR0aDogNjYlO1xcbiAgICBtYXJnaW4tbGVmdDogLTVweDtcXG4gICAgbWFyZ2luLXJpZ2h0OiAwO1xcbiAgICBoZWlnaHQ6IDE5cHg7XFxuICAgIG1hcmdpbi10b3A6IDRweDsgfVxcbiAgLmRnIC5zbGlkZXItZmcge1xcbiAgICBoZWlnaHQ6IDEwMCU7IH1cXG4gIC5kZyAuYyBpbnB1dFt0eXBlPWNoZWNrYm94XSB7XFxuICAgIG1hcmdpbi10b3A6IDlweDsgfVxcbiAgLmRnIC5jIHNlbGVjdCB7XFxuICAgIG1hcmdpbi10b3A6IDVweDsgfVxcbiAgLmRnIC5jci5mdW5jdGlvbixcXG4gIC5kZyAuY3IuZnVuY3Rpb24gLnByb3BlcnR5LW5hbWUsXFxuICAuZGcgLmNyLmZ1bmN0aW9uICosXFxuICAuZGcgLmNyLmJvb2xlYW4sXFxuICAuZGcgLmNyLmJvb2xlYW4gKiB7XFxuICAgIGN1cnNvcjogcG9pbnRlcjsgfVxcbiAgLmRnIC5zZWxlY3RvciB7XFxuICAgIGRpc3BsYXk6IG5vbmU7XFxuICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcXG4gICAgbWFyZ2luLWxlZnQ6IC05cHg7XFxuICAgIG1hcmdpbi10b3A6IDIzcHg7XFxuICAgIHotaW5kZXg6IDEwOyB9XFxuICAuZGcgLmM6aG92ZXIgLnNlbGVjdG9yLFxcbiAgLmRnIC5zZWxlY3Rvci5kcmFnIHtcXG4gICAgZGlzcGxheTogYmxvY2s7IH1cXG4gIC5kZyBsaS5zYXZlLXJvdyB7XFxuICAgIHBhZGRpbmc6IDA7IH1cXG4gICAgLmRnIGxpLnNhdmUtcm93IC5idXR0b24ge1xcbiAgICAgIGRpc3BsYXk6IGlubGluZS1ibG9jaztcXG4gICAgICBwYWRkaW5nOiAwcHggNnB4OyB9XFxuICAuZGcuZGlhbG9ndWUge1xcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjMjIyO1xcbiAgICB3aWR0aDogNDYwcHg7XFxuICAgIHBhZGRpbmc6IDE1cHg7XFxuICAgIGZvbnQtc2l6ZTogMTNweDtcXG4gICAgbGluZS1oZWlnaHQ6IDE1cHg7IH1cXG5cXG4vKiBUT0RPIFNlcGFyYXRlIHN0eWxlIGFuZCBzdHJ1Y3R1cmUgKi9cXG4jZGctbmV3LWNvbnN0cnVjdG9yIHtcXG4gIHBhZGRpbmc6IDEwcHg7XFxuICBjb2xvcjogIzIyMjtcXG4gIGZvbnQtZmFtaWx5OiBNb25hY28sIG1vbm9zcGFjZTtcXG4gIGZvbnQtc2l6ZTogMTBweDtcXG4gIGJvcmRlcjogMDtcXG4gIHJlc2l6ZTogbm9uZTtcXG4gIGJveC1zaGFkb3c6IGluc2V0IDFweCAxcHggMXB4ICM4ODg7XFxuICB3b3JkLXdyYXA6IGJyZWFrLXdvcmQ7XFxuICBtYXJnaW46IDEycHggMDtcXG4gIGRpc3BsYXk6IGJsb2NrO1xcbiAgd2lkdGg6IDQ0MHB4O1xcbiAgb3ZlcmZsb3cteTogc2Nyb2xsO1xcbiAgaGVpZ2h0OiAxMDBweDtcXG4gIHBvc2l0aW9uOiByZWxhdGl2ZTsgfVxcblxcbiNkZy1sb2NhbC1leHBsYWluIHtcXG4gIGRpc3BsYXk6IG5vbmU7XFxuICBmb250LXNpemU6IDExcHg7XFxuICBsaW5lLWhlaWdodDogMTdweDtcXG4gIGJvcmRlci1yYWRpdXM6IDNweDtcXG4gIGJhY2tncm91bmQtY29sb3I6ICMzMzM7XFxuICBwYWRkaW5nOiA4cHg7XFxuICBtYXJnaW4tdG9wOiAxMHB4OyB9XFxuICAjZGctbG9jYWwtZXhwbGFpbiBjb2RlIHtcXG4gICAgZm9udC1zaXplOiAxMHB4OyB9XFxuXFxuI2RhdC1ndWktc2F2ZS1sb2NhbGx5IHtcXG4gIGRpc3BsYXk6IG5vbmU7IH1cXG5cXG4vKiogTWFpbiB0eXBlICovXFxuLmRnIHtcXG4gIGNvbG9yOiAjZWVlO1xcbiAgZm9udDogMTFweCAnTHVjaWRhIEdyYW5kZScsIHNhbnMtc2VyaWY7XFxuICB0ZXh0LXNoYWRvdzogMCAtMXB4IDAgIzExMTtcXG4gIC8qKiBBdXRvIHBsYWNlICovXFxuICAvKiBDb250cm9sbGVyIHJvdywgPGxpPiAqL1xcbiAgLyoqIENvbnRyb2xsZXJzICovIH1cXG4gIC5kZy5tYWluIHtcXG4gICAgLyoqIFNjcm9sbGJhciAqLyB9XFxuICAgIC5kZy5tYWluOjotd2Via2l0LXNjcm9sbGJhciB7XFxuICAgICAgd2lkdGg6IDVweDtcXG4gICAgICBiYWNrZ3JvdW5kOiAjMWExYTFhOyB9XFxuICAgIC5kZy5tYWluOjotd2Via2l0LXNjcm9sbGJhci1jb3JuZXIge1xcbiAgICAgIGhlaWdodDogMDtcXG4gICAgICBkaXNwbGF5OiBub25lOyB9XFxuICAgIC5kZy5tYWluOjotd2Via2l0LXNjcm9sbGJhci10aHVtYiB7XFxuICAgICAgYm9yZGVyLXJhZGl1czogNXB4O1xcbiAgICAgIGJhY2tncm91bmQ6ICM2NzY3Njc7IH1cXG4gIC5kZyBsaTpub3QoLmZvbGRlcikge1xcbiAgICBiYWNrZ3JvdW5kOiAjMWExYTFhO1xcbiAgICBib3JkZXItYm90dG9tOiAxcHggc29saWQgIzJjMmMyYzsgfVxcbiAgLmRnIGxpLnNhdmUtcm93IHtcXG4gICAgbGluZS1oZWlnaHQ6IDI1cHg7XFxuICAgIGJhY2tncm91bmQ6ICNkYWQ1Y2I7XFxuICAgIGJvcmRlcjogMDsgfVxcbiAgICAuZGcgbGkuc2F2ZS1yb3cgc2VsZWN0IHtcXG4gICAgICBtYXJnaW4tbGVmdDogNXB4O1xcbiAgICAgIHdpZHRoOiAxMDhweDsgfVxcbiAgICAuZGcgbGkuc2F2ZS1yb3cgLmJ1dHRvbiB7XFxuICAgICAgbWFyZ2luLWxlZnQ6IDVweDtcXG4gICAgICBtYXJnaW4tdG9wOiAxcHg7XFxuICAgICAgYm9yZGVyLXJhZGl1czogMnB4O1xcbiAgICAgIGZvbnQtc2l6ZTogOXB4O1xcbiAgICAgIGxpbmUtaGVpZ2h0OiA3cHg7XFxuICAgICAgcGFkZGluZzogNHB4IDRweCA1cHggNHB4O1xcbiAgICAgIGJhY2tncm91bmQ6ICNjNWJkYWQ7XFxuICAgICAgY29sb3I6ICNmZmY7XFxuICAgICAgdGV4dC1zaGFkb3c6IDAgMXB4IDAgI2IwYTU4ZjtcXG4gICAgICBib3gtc2hhZG93OiAwIC0xcHggMCAjYjBhNThmO1xcbiAgICAgIGN1cnNvcjogcG9pbnRlcjsgfVxcbiAgICAgIC5kZyBsaS5zYXZlLXJvdyAuYnV0dG9uLmdlYXJzIHtcXG4gICAgICAgIGJhY2tncm91bmQ6ICNjNWJkYWQgdXJsKGRhdGE6aW1hZ2UvcG5nO2Jhc2U2NCxpVkJPUncwS0dnb0FBQUFOU1VoRVVnQUFBQXNBQUFBTkNBWUFBQUIvOVpRN0FBQUFHWFJGV0hSVGIyWjBkMkZ5WlFCQlpHOWlaU0JKYldGblpWSmxZV1I1Y2NsbFBBQUFBUUpKUkVGVWVOcGlZS0FVL1AvL1B3R0lDL0FwQ0FCaUJTQVcrSThBQ2xBY2dLeFE0VDlob01BRVVyeHgyUVNHTjYrZWdEWCsvdldUNGU3TjgyQU1Zb1BBeC9ldndXb1lvU1liQUNYMnM3S3hDeHpjc2V6RGgzZXZGb0RFQllURUVxeWNnZ1dBekE5QXVVU1FRZ2VZUGE5ZlB2Ni9ZV20vQWN4NUlQYjd0eS9mdytRWmJsdzY3dkRzOFIwWUh5UWhnT2J4K3lBSmtCcW1HNWRQUERoMWFQT0dSL2V1Z1cwRzR2bElvVElmeUZjQStRZWtoaEhKaFBkUXhiaUFJZ3VNQlRRWnJQRDcxMDhNNnJvV1lERlFpSUFBdjZBb3cvMWJGd1hnaXMrZjJMVUF5bndvSWFOY3o4WE54M0RsN01FSlVER1FweDlndFE4WUN1ZUIrRDI2T0VDQUFRRGFkdDdlNDZENDJRQUFBQUJKUlU1RXJrSmdnZz09KSAycHggMXB4IG5vLXJlcGVhdDtcXG4gICAgICAgIGhlaWdodDogN3B4O1xcbiAgICAgICAgd2lkdGg6IDhweDsgfVxcbiAgICAgIC5kZyBsaS5zYXZlLXJvdyAuYnV0dG9uOmhvdmVyIHtcXG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6ICNiYWIxOWU7XFxuICAgICAgICBib3gtc2hhZG93OiAwIC0xcHggMCAjYjBhNThmOyB9XFxuICAuZGcgbGkuZm9sZGVyIHtcXG4gICAgYm9yZGVyLWJvdHRvbTogMDsgfVxcbiAgLmRnIGxpLnRpdGxlIHtcXG4gICAgcGFkZGluZy1sZWZ0OiAxNnB4O1xcbiAgICBiYWNrZ3JvdW5kOiBibGFjayB1cmwoZGF0YTppbWFnZS9naWY7YmFzZTY0LFIwbEdPRGxoQlFBRkFKRUFBUC8vLy9QejgvLy8vLy8vL3lINUJBRUFBQUlBTEFBQUFBQUZBQVVBQUFJSWxJK2hLZ0Z4b0NnQU93PT0pIDZweCAxMHB4IG5vLXJlcGVhdDtcXG4gICAgY3Vyc29yOiBwb2ludGVyO1xcbiAgICBib3JkZXItYm90dG9tOiAxcHggc29saWQgcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjIpOyB9XFxuICAuZGcgLmNsb3NlZCBsaS50aXRsZSB7XFxuICAgIGJhY2tncm91bmQtaW1hZ2U6IHVybChkYXRhOmltYWdlL2dpZjtiYXNlNjQsUjBsR09EbGhCUUFGQUpFQUFQLy8vL1B6OC8vLy8vLy8veUg1QkFFQUFBSUFMQUFBQUFBRkFBVUFBQUlJbEdJV3FNQ2JXQUVBT3c9PSk7IH1cXG4gIC5kZyAuY3IuYm9vbGVhbiB7XFxuICAgIGJvcmRlci1sZWZ0OiAzcHggc29saWQgIzgwNjc4NzsgfVxcbiAgLmRnIC5jci5mdW5jdGlvbiB7XFxuICAgIGJvcmRlci1sZWZ0OiAzcHggc29saWQgI2U2MWQ1ZjsgfVxcbiAgLmRnIC5jci5udW1iZXIge1xcbiAgICBib3JkZXItbGVmdDogM3B4IHNvbGlkICMyZmExZDY7IH1cXG4gICAgLmRnIC5jci5udW1iZXIgaW5wdXRbdHlwZT10ZXh0XSB7XFxuICAgICAgY29sb3I6ICMyZmExZDY7IH1cXG4gIC5kZyAuY3Iuc3RyaW5nIHtcXG4gICAgYm9yZGVyLWxlZnQ6IDNweCBzb2xpZCAjMWVkMzZmOyB9XFxuICAgIC5kZyAuY3Iuc3RyaW5nIGlucHV0W3R5cGU9dGV4dF0ge1xcbiAgICAgIGNvbG9yOiAjMWVkMzZmOyB9XFxuICAuZGcgLmNyLmZ1bmN0aW9uOmhvdmVyLCAuZGcgLmNyLmJvb2xlYW46aG92ZXIge1xcbiAgICBiYWNrZ3JvdW5kOiAjMTExOyB9XFxuICAuZGcgLmMgaW5wdXRbdHlwZT10ZXh0XSB7XFxuICAgIGJhY2tncm91bmQ6ICMzMDMwMzA7XFxuICAgIG91dGxpbmU6IG5vbmU7IH1cXG4gICAgLmRnIC5jIGlucHV0W3R5cGU9dGV4dF06aG92ZXIge1xcbiAgICAgIGJhY2tncm91bmQ6ICMzYzNjM2M7IH1cXG4gICAgLmRnIC5jIGlucHV0W3R5cGU9dGV4dF06Zm9jdXMge1xcbiAgICAgIGJhY2tncm91bmQ6ICM0OTQ5NDk7XFxuICAgICAgY29sb3I6ICNmZmY7IH1cXG4gIC5kZyAuYyAuc2xpZGVyIHtcXG4gICAgYmFja2dyb3VuZDogIzMwMzAzMDtcXG4gICAgY3Vyc29yOiBldy1yZXNpemU7IH1cXG4gIC5kZyAuYyAuc2xpZGVyLWZnIHtcXG4gICAgYmFja2dyb3VuZDogIzJmYTFkNjsgfVxcbiAgLmRnIC5jIC5zbGlkZXI6aG92ZXIge1xcbiAgICBiYWNrZ3JvdW5kOiAjM2MzYzNjOyB9XFxuICAgIC5kZyAuYyAuc2xpZGVyOmhvdmVyIC5zbGlkZXItZmcge1xcbiAgICAgIGJhY2tncm91bmQ6ICM0NGFiZGE7IH1cXG5cIjtcblxudmFyIGNvbnRyb2xsZXJGYWN0b3J5ID0gcmVxdWlyZSgnLi4vY29udHJvbGxlcnMvZmFjdG9yeS5qcycpO1xudmFyIENvbnRyb2xsZXIgPSByZXF1aXJlKCcuLi9jb250cm9sbGVycy9Db250cm9sbGVyLmpzJyk7XG52YXIgQm9vbGVhbkNvbnRyb2xsZXIgPSByZXF1aXJlKCcuLi9jb250cm9sbGVycy9Cb29sZWFuQ29udHJvbGxlci5qcycpO1xudmFyIEZ1bmN0aW9uQ29udHJvbGxlciA9IHJlcXVpcmUoJy4uL2NvbnRyb2xsZXJzL0Z1bmN0aW9uQ29udHJvbGxlci5qcycpO1xudmFyIE51bWJlckNvbnRyb2xsZXJCb3ggPSByZXF1aXJlKCcuLi9jb250cm9sbGVycy9OdW1iZXJDb250cm9sbGVyQm94LmpzJyk7XG52YXIgTnVtYmVyQ29udHJvbGxlclNsaWRlciA9IHJlcXVpcmUoJy4uL2NvbnRyb2xsZXJzL051bWJlckNvbnRyb2xsZXJTbGlkZXIuanMnKTtcbnZhciBDb2xvckNvbnRyb2xsZXIgPSByZXF1aXJlKCcuLi9jb250cm9sbGVycy9Db2xvckNvbnRyb2xsZXIuanMnKTtcblxudmFyIHJhZiA9IHJlcXVpcmUoJy4uL3V0aWxzL3JlcXVlc3RBbmltYXRpb25GcmFtZS5qcycpO1xudmFyIENlbnRlcmVkRGl2ID0gcmVxdWlyZSgnLi4vZG9tL0NlbnRlcmVkRGl2LmpzJyk7XG52YXIgZG9tID0gcmVxdWlyZSgnLi4vZG9tL2RvbS5qcycpO1xudmFyIGNvbW1vbiA9IHJlcXVpcmUoJy4uL3V0aWxzL2NvbW1vbi5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNyZWF0ZUdVSSgpO1xuXG5mdW5jdGlvbiBjcmVhdGVHVUkoKSB7XG5cbiAgY3NzLmluamVjdChzdHlsZVNoZWV0KTtcblxuICAvKiogT3V0ZXItbW9zdCBjbGFzc05hbWUgZm9yIEdVSSdzICovXG4gIHZhciBDU1NfTkFNRVNQQUNFID0gJ2RnJztcblxuICB2YXIgSElERV9LRVlfQ09ERSA9IDcyO1xuXG4gIC8qKiBUaGUgb25seSB2YWx1ZSBzaGFyZWQgYmV0d2VlbiB0aGUgSlMgYW5kIFNDU1MuIFVzZSBjYXV0aW9uLiAqL1xuICB2YXIgQ0xPU0VfQlVUVE9OX0hFSUdIVCA9IDIwO1xuXG4gIHZhciBERUZBVUxUX0RFRkFVTFRfUFJFU0VUX05BTUUgPSAnRGVmYXVsdCc7XG5cbiAgdmFyIFNVUFBPUlRTX0xPQ0FMX1NUT1JBR0UgPSAoZnVuY3Rpb24oKSB7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiAnbG9jYWxTdG9yYWdlJyBpbiB3aW5kb3cgJiYgd2luZG93Wydsb2NhbFN0b3JhZ2UnXSAhPT0gbnVsbDtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9KSgpO1xuXG4gIHZhciBTQVZFX0RJQUxPR1VFO1xuXG4gIC8qKiBIYXZlIHdlIHlldCB0byBjcmVhdGUgYW4gYXV0b1BsYWNlIEdVST8gKi9cbiAgdmFyIGF1dG9fcGxhY2VfdmlyZ2luID0gdHJ1ZTtcblxuICAvKiogRml4ZWQgcG9zaXRpb24gZGl2IHRoYXQgYXV0byBwbGFjZSBHVUkncyBnbyBpbnNpZGUgKi9cbiAgdmFyIGF1dG9fcGxhY2VfY29udGFpbmVyO1xuXG4gIC8qKiBBcmUgd2UgaGlkaW5nIHRoZSBHVUkncyA/ICovXG4gIHZhciBoaWRlID0gZmFsc2U7XG5cbiAgLyoqIEdVSSdzIHdoaWNoIHNob3VsZCBiZSBoaWRkZW4gKi9cbiAgdmFyIGhpZGVhYmxlX2d1aXMgPSBbXTtcblxuICAvKipcbiAgICogQSBsaWdodHdlaWdodCBjb250cm9sbGVyIGxpYnJhcnkgZm9yIEphdmFTY3JpcHQuIEl0IGFsbG93cyB5b3UgdG8gZWFzaWx5XG4gICAqIG1hbmlwdWxhdGUgdmFyaWFibGVzIGFuZCBmaXJlIGZ1bmN0aW9ucyBvbiB0aGUgZmx5LlxuICAgKiBAY2xhc3NcbiAgICpcbiAgICogQG1lbWJlciBkYXQuZ3VpXG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbcGFyYW1zXVxuICAgKiBAcGFyYW0ge1N0cmluZ30gW3BhcmFtcy5uYW1lXSBUaGUgbmFtZSBvZiB0aGlzIEdVSS5cbiAgICogQHBhcmFtIHtPYmplY3R9IFtwYXJhbXMubG9hZF0gSlNPTiBvYmplY3QgcmVwcmVzZW50aW5nIHRoZSBzYXZlZCBzdGF0ZSBvZlxuICAgKiB0aGlzIEdVSS5cbiAgICogQHBhcmFtIHtCb29sZWFufSBbcGFyYW1zLmF1dG89dHJ1ZV1cbiAgICogQHBhcmFtIHtkYXQuZ3VpLkdVSX0gW3BhcmFtcy5wYXJlbnRdIFRoZSBHVUkgSSdtIG5lc3RlZCBpbi5cbiAgICogQHBhcmFtIHtCb29sZWFufSBbcGFyYW1zLmNsb3NlZF0gSWYgdHJ1ZSwgc3RhcnRzIGNsb3NlZFxuICAgKi9cbiAgdmFyIEdVSSA9IGZ1bmN0aW9uKHBhcmFtcykge1xuXG4gICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgIC8qKlxuICAgICAqIE91dGVybW9zdCBET00gRWxlbWVudFxuICAgICAqIEB0eXBlIERPTUVsZW1lbnRcbiAgICAgKi9cbiAgICB0aGlzLmRvbUVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB0aGlzLl9fdWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd1bCcpO1xuICAgIHRoaXMuZG9tRWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLl9fdWwpO1xuXG4gICAgZG9tLmFkZENsYXNzKHRoaXMuZG9tRWxlbWVudCwgQ1NTX05BTUVTUEFDRSk7XG5cbiAgICAvKipcbiAgICAgKiBOZXN0ZWQgR1VJJ3MgYnkgbmFtZVxuICAgICAqIEBpZ25vcmVcbiAgICAgKi9cbiAgICB0aGlzLl9fZm9sZGVycyA9IHt9O1xuXG4gICAgdGhpcy5fX2NvbnRyb2xsZXJzID0gW107XG5cbiAgICAvKipcbiAgICAgKiBMaXN0IG9mIG9iamVjdHMgSSdtIHJlbWVtYmVyaW5nIGZvciBzYXZlLCBvbmx5IHVzZWQgaW4gdG9wIGxldmVsIEdVSVxuICAgICAqIEBpZ25vcmVcbiAgICAgKi9cbiAgICB0aGlzLl9fcmVtZW1iZXJlZE9iamVjdHMgPSBbXTtcblxuICAgIC8qKlxuICAgICAqIE1hcHMgdGhlIGluZGV4IG9mIHJlbWVtYmVyZWQgb2JqZWN0cyB0byBhIG1hcCBvZiBjb250cm9sbGVycywgb25seSB1c2VkXG4gICAgICogaW4gdG9wIGxldmVsIEdVSS5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICogQGlnbm9yZVxuICAgICAqXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiBbXG4gICAgICogIHtcbiAgICAgKiAgICBwcm9wZXJ0eU5hbWU6IENvbnRyb2xsZXIsXG4gICAgICogICAgYW5vdGhlclByb3BlcnR5TmFtZTogQ29udHJvbGxlclxuICAgICAqICB9LFxuICAgICAqICB7XG4gICAgICogICAgcHJvcGVydHlOYW1lOiBDb250cm9sbGVyXG4gICAgICogIH1cbiAgICAgKiBdXG4gICAgICovXG4gICAgdGhpcy5fX3JlbWVtYmVyZWRPYmplY3RJbmRlY2VzVG9Db250cm9sbGVycyA9IFtdO1xuXG4gICAgdGhpcy5fX2xpc3RlbmluZyA9IFtdO1xuXG4gICAgcGFyYW1zID0gcGFyYW1zIHx8IHt9O1xuXG4gICAgLy8gRGVmYXVsdCBwYXJhbWV0ZXJzXG4gICAgcGFyYW1zID0gY29tbW9uLmRlZmF1bHRzKHBhcmFtcywge1xuICAgICAgYXV0b1BsYWNlOiB0cnVlLFxuICAgICAgd2lkdGg6IEdVSS5ERUZBVUxUX1dJRFRIXG4gICAgfSk7XG5cbiAgICBwYXJhbXMgPSBjb21tb24uZGVmYXVsdHMocGFyYW1zLCB7XG4gICAgICByZXNpemFibGU6IHBhcmFtcy5hdXRvUGxhY2UsXG4gICAgICBoaWRlYWJsZTogcGFyYW1zLmF1dG9QbGFjZVxuICAgIH0pO1xuXG5cbiAgICBpZiAoIWNvbW1vbi5pc1VuZGVmaW5lZChwYXJhbXMubG9hZCkpIHtcblxuICAgICAgLy8gRXhwbGljaXQgcHJlc2V0XG4gICAgICBpZiAocGFyYW1zLnByZXNldCkgcGFyYW1zLmxvYWQucHJlc2V0ID0gcGFyYW1zLnByZXNldDtcblxuICAgIH0gZWxzZSB7XG5cbiAgICAgIHBhcmFtcy5sb2FkID0ge1xuICAgICAgICBwcmVzZXQ6IERFRkFVTFRfREVGQVVMVF9QUkVTRVRfTkFNRVxuICAgICAgfTtcblxuICAgIH1cblxuICAgIGlmIChjb21tb24uaXNVbmRlZmluZWQocGFyYW1zLnBhcmVudCkgJiYgcGFyYW1zLmhpZGVhYmxlKSB7XG4gICAgICBoaWRlYWJsZV9ndWlzLnB1c2godGhpcyk7XG4gICAgfVxuXG4gICAgLy8gT25seSByb290IGxldmVsIEdVSSdzIGFyZSByZXNpemFibGUuXG4gICAgcGFyYW1zLnJlc2l6YWJsZSA9IGNvbW1vbi5pc1VuZGVmaW5lZChwYXJhbXMucGFyZW50KSAmJiBwYXJhbXMucmVzaXphYmxlO1xuXG5cbiAgICBpZiAocGFyYW1zLmF1dG9QbGFjZSAmJiBjb21tb24uaXNVbmRlZmluZWQocGFyYW1zLnNjcm9sbGFibGUpKSB7XG4gICAgICBwYXJhbXMuc2Nyb2xsYWJsZSA9IHRydWU7XG4gICAgfVxuICAgIC8vICAgIHBhcmFtcy5zY3JvbGxhYmxlID0gY29tbW9uLmlzVW5kZWZpbmVkKHBhcmFtcy5wYXJlbnQpICYmIHBhcmFtcy5zY3JvbGxhYmxlID09PSB0cnVlO1xuXG4gICAgLy8gTm90IHBhcnQgb2YgcGFyYW1zIGJlY2F1c2UgSSBkb24ndCB3YW50IHBlb3BsZSBwYXNzaW5nIHRoaXMgaW4gdmlhXG4gICAgLy8gY29uc3RydWN0b3IuIFNob3VsZCBiZSBhICdyZW1lbWJlcmVkJyB2YWx1ZS5cbiAgICB2YXIgdXNlX2xvY2FsX3N0b3JhZ2UgPVxuICAgICAgU1VQUE9SVFNfTE9DQUxfU1RPUkFHRSAmJlxuICAgICAgbG9jYWxTdG9yYWdlLmdldEl0ZW0oZ2V0TG9jYWxTdG9yYWdlSGFzaCh0aGlzLCAnaXNMb2NhbCcpKSA9PT0gJ3RydWUnO1xuXG4gICAgdmFyIHNhdmVUb0xvY2FsU3RvcmFnZTtcblxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKHRoaXMsXG5cbiAgICAgIC8qKiBAbGVuZHMgZGF0Lmd1aS5HVUkucHJvdG90eXBlICovXG4gICAgICB7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBwYXJlbnQgPGNvZGU+R1VJPC9jb2RlPlxuICAgICAgICAgKiBAdHlwZSBkYXQuZ3VpLkdVSVxuICAgICAgICAgKi9cbiAgICAgICAgcGFyZW50OiB7XG4gICAgICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiBwYXJhbXMucGFyZW50O1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBzY3JvbGxhYmxlOiB7XG4gICAgICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiBwYXJhbXMuc2Nyb2xsYWJsZTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEhhbmRsZXMgPGNvZGU+R1VJPC9jb2RlPidzIGVsZW1lbnQgcGxhY2VtZW50IGZvciB5b3VcbiAgICAgICAgICogQHR5cGUgQm9vbGVhblxuICAgICAgICAgKi9cbiAgICAgICAgYXV0b1BsYWNlOiB7XG4gICAgICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiBwYXJhbXMuYXV0b1BsYWNlO1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIGlkZW50aWZpZXIgZm9yIGEgc2V0IG9mIHNhdmVkIHZhbHVlc1xuICAgICAgICAgKiBAdHlwZSBTdHJpbmdcbiAgICAgICAgICovXG4gICAgICAgIHByZXNldDoge1xuXG4gICAgICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmIChfdGhpcy5wYXJlbnQpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIF90aGlzLmdldFJvb3QoKS5wcmVzZXQ7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICByZXR1cm4gcGFyYW1zLmxvYWQucHJlc2V0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sXG5cbiAgICAgICAgICBzZXQ6IGZ1bmN0aW9uKHYpIHtcbiAgICAgICAgICAgIGlmIChfdGhpcy5wYXJlbnQpIHtcbiAgICAgICAgICAgICAgX3RoaXMuZ2V0Um9vdCgpLnByZXNldCA9IHY7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBwYXJhbXMubG9hZC5wcmVzZXQgPSB2O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc2V0UHJlc2V0U2VsZWN0SW5kZXgodGhpcyk7XG4gICAgICAgICAgICBfdGhpcy5yZXZlcnQoKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIHdpZHRoIG9mIDxjb2RlPkdVSTwvY29kZT4gZWxlbWVudFxuICAgICAgICAgKiBAdHlwZSBOdW1iZXJcbiAgICAgICAgICovXG4gICAgICAgIHdpZHRoOiB7XG4gICAgICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiBwYXJhbXMud2lkdGg7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBzZXQ6IGZ1bmN0aW9uKHYpIHtcbiAgICAgICAgICAgIHBhcmFtcy53aWR0aCA9IHY7XG4gICAgICAgICAgICBzZXRXaWR0aChfdGhpcywgdik7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgbmFtZSBvZiA8Y29kZT5HVUk8L2NvZGU+LiBVc2VkIGZvciBmb2xkZXJzLiBpLmVcbiAgICAgICAgICogYSBmb2xkZXIncyBuYW1lXG4gICAgICAgICAqIEB0eXBlIFN0cmluZ1xuICAgICAgICAgKi9cbiAgICAgICAgbmFtZToge1xuICAgICAgICAgIGdldDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gcGFyYW1zLm5hbWU7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBzZXQ6IGZ1bmN0aW9uKHYpIHtcbiAgICAgICAgICAgIC8vIFRPRE8gQ2hlY2sgZm9yIGNvbGxpc2lvbnMgYW1vbmcgc2libGluZyBmb2xkZXJzXG4gICAgICAgICAgICBwYXJhbXMubmFtZSA9IHY7XG4gICAgICAgICAgICBpZiAodGl0bGVfcm93X25hbWUpIHtcbiAgICAgICAgICAgICAgdGl0bGVfcm93X25hbWUuaW5uZXJIVE1MID0gcGFyYW1zLm5hbWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBXaGV0aGVyIHRoZSA8Y29kZT5HVUk8L2NvZGU+IGlzIGNvbGxhcHNlZCBvciBub3RcbiAgICAgICAgICogQHR5cGUgQm9vbGVhblxuICAgICAgICAgKi9cbiAgICAgICAgY2xvc2VkOiB7XG4gICAgICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiBwYXJhbXMuY2xvc2VkO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgc2V0OiBmdW5jdGlvbih2KSB7XG4gICAgICAgICAgICBwYXJhbXMuY2xvc2VkID0gdjtcbiAgICAgICAgICAgIGlmIChwYXJhbXMuY2xvc2VkKSB7XG4gICAgICAgICAgICAgIGRvbS5hZGRDbGFzcyhfdGhpcy5fX3VsLCBHVUkuQ0xBU1NfQ0xPU0VEKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGRvbS5yZW1vdmVDbGFzcyhfdGhpcy5fX3VsLCBHVUkuQ0xBU1NfQ0xPU0VEKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIEZvciBicm93c2VycyB0aGF0IGFyZW4ndCBnb2luZyB0byByZXNwZWN0IHRoZSBDU1MgdHJhbnNpdGlvbixcbiAgICAgICAgICAgIC8vIExldHMganVzdCBjaGVjayBvdXIgaGVpZ2h0IGFnYWluc3QgdGhlIHdpbmRvdyBoZWlnaHQgcmlnaHQgb2ZmXG4gICAgICAgICAgICAvLyB0aGUgYmF0LlxuICAgICAgICAgICAgdGhpcy5vblJlc2l6ZSgpO1xuXG4gICAgICAgICAgICBpZiAoX3RoaXMuX19jbG9zZUJ1dHRvbikge1xuICAgICAgICAgICAgICBfdGhpcy5fX2Nsb3NlQnV0dG9uLmlubmVySFRNTCA9IHYgPyBHVUkuVEVYVF9PUEVOIDogR1VJLlRFWFRfQ0xPU0VEO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQ29udGFpbnMgYWxsIHByZXNldHNcbiAgICAgICAgICogQHR5cGUgT2JqZWN0XG4gICAgICAgICAqL1xuICAgICAgICBsb2FkOiB7XG4gICAgICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiBwYXJhbXMubG9hZDtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIERldGVybWluZXMgd2hldGhlciBvciBub3QgdG8gdXNlIDxhIGhyZWY9XCJodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi9ET00vU3RvcmFnZSNsb2NhbFN0b3JhZ2VcIj5sb2NhbFN0b3JhZ2U8L2E+IGFzIHRoZSBtZWFucyBmb3JcbiAgICAgICAgICogPGNvZGU+cmVtZW1iZXI8L2NvZGU+aW5nXG4gICAgICAgICAqIEB0eXBlIEJvb2xlYW5cbiAgICAgICAgICovXG4gICAgICAgIHVzZUxvY2FsU3RvcmFnZToge1xuXG4gICAgICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiB1c2VfbG9jYWxfc3RvcmFnZTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIHNldDogZnVuY3Rpb24oYm9vbCkge1xuICAgICAgICAgICAgaWYgKFNVUFBPUlRTX0xPQ0FMX1NUT1JBR0UpIHtcbiAgICAgICAgICAgICAgdXNlX2xvY2FsX3N0b3JhZ2UgPSBib29sO1xuICAgICAgICAgICAgICBpZiAoYm9vbCkge1xuICAgICAgICAgICAgICAgIGRvbS5iaW5kKHdpbmRvdywgJ3VubG9hZCcsIHNhdmVUb0xvY2FsU3RvcmFnZSk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZG9tLnVuYmluZCh3aW5kb3csICd1bmxvYWQnLCBzYXZlVG9Mb2NhbFN0b3JhZ2UpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKGdldExvY2FsU3RvcmFnZUhhc2goX3RoaXMsICdpc0xvY2FsJyksIGJvb2wpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICB9XG5cbiAgICAgIH0pO1xuXG4gICAgLy8gQXJlIHdlIGEgcm9vdCBsZXZlbCBHVUk/XG4gICAgaWYgKGNvbW1vbi5pc1VuZGVmaW5lZChwYXJhbXMucGFyZW50KSkge1xuXG4gICAgICBwYXJhbXMuY2xvc2VkID0gZmFsc2U7XG5cbiAgICAgIGRvbS5hZGRDbGFzcyh0aGlzLmRvbUVsZW1lbnQsIEdVSS5DTEFTU19NQUlOKTtcbiAgICAgIGRvbS5tYWtlU2VsZWN0YWJsZSh0aGlzLmRvbUVsZW1lbnQsIGZhbHNlKTtcblxuICAgICAgLy8gQXJlIHdlIHN1cHBvc2VkIHRvIGJlIGxvYWRpbmcgbG9jYWxseT9cbiAgICAgIGlmIChTVVBQT1JUU19MT0NBTF9TVE9SQUdFKSB7XG5cbiAgICAgICAgaWYgKHVzZV9sb2NhbF9zdG9yYWdlKSB7XG5cbiAgICAgICAgICBfdGhpcy51c2VMb2NhbFN0b3JhZ2UgPSB0cnVlO1xuXG4gICAgICAgICAgdmFyIHNhdmVkX2d1aSA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKGdldExvY2FsU3RvcmFnZUhhc2godGhpcywgJ2d1aScpKTtcblxuICAgICAgICAgIGlmIChzYXZlZF9ndWkpIHtcbiAgICAgICAgICAgIHBhcmFtcy5sb2FkID0gSlNPTi5wYXJzZShzYXZlZF9ndWkpO1xuICAgICAgICAgIH1cblxuICAgICAgICB9XG5cbiAgICAgIH1cblxuICAgICAgdGhpcy5fX2Nsb3NlQnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICB0aGlzLl9fY2xvc2VCdXR0b24uaW5uZXJIVE1MID0gR1VJLlRFWFRfQ0xPU0VEO1xuICAgICAgZG9tLmFkZENsYXNzKHRoaXMuX19jbG9zZUJ1dHRvbiwgR1VJLkNMQVNTX0NMT1NFX0JVVFRPTik7XG4gICAgICB0aGlzLmRvbUVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5fX2Nsb3NlQnV0dG9uKTtcblxuICAgICAgZG9tLmJpbmQodGhpcy5fX2Nsb3NlQnV0dG9uLCAnY2xpY2snLCBmdW5jdGlvbigpIHtcblxuICAgICAgICBfdGhpcy5jbG9zZWQgPSAhX3RoaXMuY2xvc2VkO1xuXG5cbiAgICAgIH0pO1xuXG5cbiAgICAgIC8vIE9oLCB5b3UncmUgYSBuZXN0ZWQgR1VJIVxuICAgIH0gZWxzZSB7XG5cbiAgICAgIGlmIChwYXJhbXMuY2xvc2VkID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcGFyYW1zLmNsb3NlZCA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIHZhciB0aXRsZV9yb3dfbmFtZSA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHBhcmFtcy5uYW1lKTtcbiAgICAgIGRvbS5hZGRDbGFzcyh0aXRsZV9yb3dfbmFtZSwgJ2NvbnRyb2xsZXItbmFtZScpO1xuXG4gICAgICB2YXIgdGl0bGVfcm93ID0gYWRkUm93KF90aGlzLCB0aXRsZV9yb3dfbmFtZSk7XG5cbiAgICAgIHZhciBvbl9jbGlja190aXRsZSA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBfdGhpcy5jbG9zZWQgPSAhX3RoaXMuY2xvc2VkO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9O1xuXG4gICAgICBkb20uYWRkQ2xhc3ModGhpcy5fX3VsLCBHVUkuQ0xBU1NfQ0xPU0VEKTtcblxuICAgICAgZG9tLmFkZENsYXNzKHRpdGxlX3JvdywgJ3RpdGxlJyk7XG4gICAgICBkb20uYmluZCh0aXRsZV9yb3csICdjbGljaycsIG9uX2NsaWNrX3RpdGxlKTtcblxuICAgICAgaWYgKCFwYXJhbXMuY2xvc2VkKSB7XG4gICAgICAgIHRoaXMuY2xvc2VkID0gZmFsc2U7XG4gICAgICB9XG5cbiAgICB9XG5cbiAgICBpZiAocGFyYW1zLmF1dG9QbGFjZSkge1xuXG4gICAgICBpZiAoY29tbW9uLmlzVW5kZWZpbmVkKHBhcmFtcy5wYXJlbnQpKSB7XG5cbiAgICAgICAgaWYgKGF1dG9fcGxhY2VfdmlyZ2luKSB7XG4gICAgICAgICAgYXV0b19wbGFjZV9jb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgICBkb20uYWRkQ2xhc3MoYXV0b19wbGFjZV9jb250YWluZXIsIENTU19OQU1FU1BBQ0UpO1xuICAgICAgICAgIGRvbS5hZGRDbGFzcyhhdXRvX3BsYWNlX2NvbnRhaW5lciwgR1VJLkNMQVNTX0FVVE9fUExBQ0VfQ09OVEFJTkVSKTtcbiAgICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGF1dG9fcGxhY2VfY29udGFpbmVyKTtcbiAgICAgICAgICBhdXRvX3BsYWNlX3ZpcmdpbiA9IGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUHV0IGl0IGluIHRoZSBkb20gZm9yIHlvdS5cbiAgICAgICAgYXV0b19wbGFjZV9jb250YWluZXIuYXBwZW5kQ2hpbGQodGhpcy5kb21FbGVtZW50KTtcblxuICAgICAgICAvLyBBcHBseSB0aGUgYXV0byBzdHlsZXNcbiAgICAgICAgZG9tLmFkZENsYXNzKHRoaXMuZG9tRWxlbWVudCwgR1VJLkNMQVNTX0FVVE9fUExBQ0UpO1xuXG4gICAgICB9XG5cblxuICAgICAgLy8gTWFrZSBpdCBub3QgZWxhc3RpYy5cbiAgICAgIGlmICghdGhpcy5wYXJlbnQpIHNldFdpZHRoKF90aGlzLCBwYXJhbXMud2lkdGgpO1xuXG4gICAgfVxuXG4gICAgZG9tLmJpbmQod2luZG93LCAncmVzaXplJywgZnVuY3Rpb24oKSB7XG4gICAgICBfdGhpcy5vblJlc2l6ZSgpXG4gICAgfSk7XG4gICAgZG9tLmJpbmQodGhpcy5fX3VsLCAnd2Via2l0VHJhbnNpdGlvbkVuZCcsIGZ1bmN0aW9uKCkge1xuICAgICAgX3RoaXMub25SZXNpemUoKTtcbiAgICB9KTtcbiAgICBkb20uYmluZCh0aGlzLl9fdWwsICd0cmFuc2l0aW9uZW5kJywgZnVuY3Rpb24oKSB7XG4gICAgICBfdGhpcy5vblJlc2l6ZSgpXG4gICAgfSk7XG4gICAgZG9tLmJpbmQodGhpcy5fX3VsLCAnb1RyYW5zaXRpb25FbmQnLCBmdW5jdGlvbigpIHtcbiAgICAgIF90aGlzLm9uUmVzaXplKClcbiAgICB9KTtcbiAgICB0aGlzLm9uUmVzaXplKCk7XG5cblxuICAgIGlmIChwYXJhbXMucmVzaXphYmxlKSB7XG4gICAgICBhZGRSZXNpemVIYW5kbGUodGhpcyk7XG4gICAgfVxuXG4gICAgc2F2ZVRvTG9jYWxTdG9yYWdlID0gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoU1VQUE9SVFNfTE9DQUxfU1RPUkFHRSAmJiBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShnZXRMb2NhbFN0b3JhZ2VIYXNoKF90aGlzLCAnaXNMb2NhbCcpKSA9PT0gJ3RydWUnKSB7XG4gICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKGdldExvY2FsU3RvcmFnZUhhc2goX3RoaXMsICdndWknKSwgSlNPTi5zdHJpbmdpZnkoX3RoaXMuZ2V0U2F2ZU9iamVjdCgpKSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gZXhwb3NlIHRoaXMgbWV0aG9kIHB1YmxpY2x5XG4gICAgdGhpcy5zYXZlVG9Mb2NhbFN0b3JhZ2VJZlBvc3NpYmxlID0gc2F2ZVRvTG9jYWxTdG9yYWdlO1xuXG4gICAgdmFyIHJvb3QgPSBfdGhpcy5nZXRSb290KCk7XG5cbiAgICBmdW5jdGlvbiByZXNldFdpZHRoKCkge1xuICAgICAgdmFyIHJvb3QgPSBfdGhpcy5nZXRSb290KCk7XG4gICAgICByb290LndpZHRoICs9IDE7XG4gICAgICBjb21tb24uZGVmZXIoZnVuY3Rpb24oKSB7XG4gICAgICAgIHJvb3Qud2lkdGggLT0gMTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmICghcGFyYW1zLnBhcmVudCkge1xuICAgICAgcmVzZXRXaWR0aCgpO1xuICAgIH1cblxuICB9O1xuXG4gIEdVSS50b2dnbGVIaWRlID0gZnVuY3Rpb24oKSB7XG5cbiAgICBoaWRlID0gIWhpZGU7XG4gICAgY29tbW9uLmVhY2goaGlkZWFibGVfZ3VpcywgZnVuY3Rpb24oZ3VpKSB7XG4gICAgICBndWkuZG9tRWxlbWVudC5zdHlsZS56SW5kZXggPSBoaWRlID8gLTk5OSA6IDk5OTtcbiAgICAgIGd1aS5kb21FbGVtZW50LnN0eWxlLm9wYWNpdHkgPSBoaWRlID8gMCA6IDE7XG4gICAgfSk7XG4gIH07XG5cbiAgR1VJLkNMQVNTX0FVVE9fUExBQ0UgPSAnYSc7XG4gIEdVSS5DTEFTU19BVVRPX1BMQUNFX0NPTlRBSU5FUiA9ICdhYyc7XG4gIEdVSS5DTEFTU19NQUlOID0gJ21haW4nO1xuICBHVUkuQ0xBU1NfQ09OVFJPTExFUl9ST1cgPSAnY3InO1xuICBHVUkuQ0xBU1NfVE9PX1RBTEwgPSAndGFsbGVyLXRoYW4td2luZG93JztcbiAgR1VJLkNMQVNTX0NMT1NFRCA9ICdjbG9zZWQnO1xuICBHVUkuQ0xBU1NfQ0xPU0VfQlVUVE9OID0gJ2Nsb3NlLWJ1dHRvbic7XG4gIEdVSS5DTEFTU19EUkFHID0gJ2RyYWcnO1xuXG4gIEdVSS5ERUZBVUxUX1dJRFRIID0gMjQ1O1xuICBHVUkuVEVYVF9DTE9TRUQgPSAnQ2xvc2UgQ29udHJvbHMnO1xuICBHVUkuVEVYVF9PUEVOID0gJ09wZW4gQ29udHJvbHMnO1xuXG4gIGRvbS5iaW5kKHdpbmRvdywgJ2tleWRvd24nLCBmdW5jdGlvbihlKSB7XG5cbiAgICBpZiAoZG9jdW1lbnQuYWN0aXZlRWxlbWVudC50eXBlICE9PSAndGV4dCcgJiZcbiAgICAgIChlLndoaWNoID09PSBISURFX0tFWV9DT0RFIHx8IGUua2V5Q29kZSA9PSBISURFX0tFWV9DT0RFKSkge1xuICAgICAgR1VJLnRvZ2dsZUhpZGUoKTtcbiAgICB9XG5cbiAgfSwgZmFsc2UpO1xuXG4gIGNvbW1vbi5leHRlbmQoXG5cbiAgICBHVUkucHJvdG90eXBlLFxuXG4gICAgLyoqIEBsZW5kcyBkYXQuZ3VpLkdVSSAqL1xuICAgIHtcblxuICAgICAgLyoqXG4gICAgICAgKiBAcGFyYW0gb2JqZWN0XG4gICAgICAgKiBAcGFyYW0gcHJvcGVydHlcbiAgICAgICAqIEByZXR1cm5zIHtkYXQuY29udHJvbGxlcnMuQ29udHJvbGxlcn0gVGhlIG5ldyBjb250cm9sbGVyIHRoYXQgd2FzIGFkZGVkLlxuICAgICAgICogQGluc3RhbmNlXG4gICAgICAgKi9cbiAgICAgIGFkZDogZnVuY3Rpb24ob2JqZWN0LCBwcm9wZXJ0eSkge1xuXG4gICAgICAgIHJldHVybiBhZGQoXG4gICAgICAgICAgdGhpcyxcbiAgICAgICAgICBvYmplY3QsXG4gICAgICAgICAgcHJvcGVydHksIHtcbiAgICAgICAgICAgIGZhY3RvcnlBcmdzOiBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDIpXG4gICAgICAgICAgfVxuICAgICAgICApO1xuXG4gICAgICB9LFxuXG4gICAgICAvKipcbiAgICAgICAqIEBwYXJhbSBvYmplY3RcbiAgICAgICAqIEBwYXJhbSBwcm9wZXJ0eVxuICAgICAgICogQHJldHVybnMge2RhdC5jb250cm9sbGVycy5Db2xvckNvbnRyb2xsZXJ9IFRoZSBuZXcgY29udHJvbGxlciB0aGF0IHdhcyBhZGRlZC5cbiAgICAgICAqIEBpbnN0YW5jZVxuICAgICAgICovXG4gICAgICBhZGRDb2xvcjogZnVuY3Rpb24ob2JqZWN0LCBwcm9wZXJ0eSkge1xuXG4gICAgICAgIHJldHVybiBhZGQoXG4gICAgICAgICAgdGhpcyxcbiAgICAgICAgICBvYmplY3QsXG4gICAgICAgICAgcHJvcGVydHksIHtcbiAgICAgICAgICAgIGNvbG9yOiB0cnVlXG4gICAgICAgICAgfVxuICAgICAgICApO1xuXG4gICAgICB9LFxuXG4gICAgICAvKipcbiAgICAgICAqIEBwYXJhbSBjb250cm9sbGVyXG4gICAgICAgKiBAaW5zdGFuY2VcbiAgICAgICAqL1xuICAgICAgcmVtb3ZlOiBmdW5jdGlvbihjb250cm9sbGVyKSB7XG5cbiAgICAgICAgLy8gVE9ETyBsaXN0ZW5pbmc/XG4gICAgICAgIHRoaXMuX191bC5yZW1vdmVDaGlsZChjb250cm9sbGVyLl9fbGkpO1xuICAgICAgICB0aGlzLl9fY29udHJvbGxlcnMuc3BsaWNlKHRoaXMuX19jb250cm9sbGVycy5pbmRleE9mKGNvbnRyb2xsZXIpLCAxKTtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgY29tbW9uLmRlZmVyKGZ1bmN0aW9uKCkge1xuICAgICAgICAgIF90aGlzLm9uUmVzaXplKCk7XG4gICAgICAgIH0pO1xuXG4gICAgICB9LFxuXG4gICAgICBkZXN0cm95OiBmdW5jdGlvbigpIHtcblxuICAgICAgICBpZiAodGhpcy5hdXRvUGxhY2UpIHtcbiAgICAgICAgICBhdXRvX3BsYWNlX2NvbnRhaW5lci5yZW1vdmVDaGlsZCh0aGlzLmRvbUVsZW1lbnQpO1xuICAgICAgICB9XG5cbiAgICAgIH0sXG5cbiAgICAgIC8qKlxuICAgICAgICogQHBhcmFtIG5hbWVcbiAgICAgICAqIEByZXR1cm5zIHtkYXQuZ3VpLkdVSX0gVGhlIG5ldyBmb2xkZXIuXG4gICAgICAgKiBAdGhyb3dzIHtFcnJvcn0gaWYgdGhpcyBHVUkgYWxyZWFkeSBoYXMgYSBmb2xkZXIgYnkgdGhlIHNwZWNpZmllZFxuICAgICAgICogbmFtZVxuICAgICAgICogQGluc3RhbmNlXG4gICAgICAgKi9cbiAgICAgIGFkZEZvbGRlcjogZnVuY3Rpb24obmFtZSkge1xuXG4gICAgICAgIC8vIFdlIGhhdmUgdG8gcHJldmVudCBjb2xsaXNpb25zIG9uIG5hbWVzIGluIG9yZGVyIHRvIGhhdmUgYSBrZXlcbiAgICAgICAgLy8gYnkgd2hpY2ggdG8gcmVtZW1iZXIgc2F2ZWQgdmFsdWVzXG4gICAgICAgIGlmICh0aGlzLl9fZm9sZGVyc1tuYW1lXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdZb3UgYWxyZWFkeSBoYXZlIGEgZm9sZGVyIGluIHRoaXMgR1VJIGJ5IHRoZScgK1xuICAgICAgICAgICAgJyBuYW1lIFwiJyArIG5hbWUgKyAnXCInKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBuZXdfZ3VpX3BhcmFtcyA9IHtcbiAgICAgICAgICBuYW1lOiBuYW1lLFxuICAgICAgICAgIHBhcmVudDogdGhpc1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIFdlIG5lZWQgdG8gcGFzcyBkb3duIHRoZSBhdXRvUGxhY2UgdHJhaXQgc28gdGhhdCB3ZSBjYW5cbiAgICAgICAgLy8gYXR0YWNoIGV2ZW50IGxpc3RlbmVycyB0byBvcGVuL2Nsb3NlIGZvbGRlciBhY3Rpb25zIHRvXG4gICAgICAgIC8vIGVuc3VyZSB0aGF0IGEgc2Nyb2xsYmFyIGFwcGVhcnMgaWYgdGhlIHdpbmRvdyBpcyB0b28gc2hvcnQuXG4gICAgICAgIG5ld19ndWlfcGFyYW1zLmF1dG9QbGFjZSA9IHRoaXMuYXV0b1BsYWNlO1xuXG4gICAgICAgIC8vIERvIHdlIGhhdmUgc2F2ZWQgYXBwZWFyYW5jZSBkYXRhIGZvciB0aGlzIGZvbGRlcj9cblxuICAgICAgICBpZiAodGhpcy5sb2FkICYmIC8vIEFueXRoaW5nIGxvYWRlZD9cbiAgICAgICAgICB0aGlzLmxvYWQuZm9sZGVycyAmJiAvLyBXYXMgbXkgcGFyZW50IGEgZGVhZC1lbmQ/XG4gICAgICAgICAgdGhpcy5sb2FkLmZvbGRlcnNbbmFtZV0pIHsgLy8gRGlkIGRhZGR5IHJlbWVtYmVyIG1lP1xuXG4gICAgICAgICAgLy8gU3RhcnQgbWUgY2xvc2VkIGlmIEkgd2FzIGNsb3NlZFxuICAgICAgICAgIG5ld19ndWlfcGFyYW1zLmNsb3NlZCA9IHRoaXMubG9hZC5mb2xkZXJzW25hbWVdLmNsb3NlZDtcblxuICAgICAgICAgIC8vIFBhc3MgZG93biB0aGUgbG9hZGVkIGRhdGFcbiAgICAgICAgICBuZXdfZ3VpX3BhcmFtcy5sb2FkID0gdGhpcy5sb2FkLmZvbGRlcnNbbmFtZV07XG5cbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBndWkgPSBuZXcgR1VJKG5ld19ndWlfcGFyYW1zKTtcbiAgICAgICAgdGhpcy5fX2ZvbGRlcnNbbmFtZV0gPSBndWk7XG5cbiAgICAgICAgdmFyIGxpID0gYWRkUm93KHRoaXMsIGd1aS5kb21FbGVtZW50KTtcbiAgICAgICAgZG9tLmFkZENsYXNzKGxpLCAnZm9sZGVyJyk7XG4gICAgICAgIHJldHVybiBndWk7XG5cbiAgICAgIH0sXG5cbiAgICAgIHJlbW92ZUZvbGRlcjogZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgdmFyIGZvbGRlciA9IHRoaXMuX19mb2xkZXJzW25hbWVdO1xuICAgICAgICBpZiAoIWZvbGRlcikge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBkZWxldGUgdGhpcy5fX2ZvbGRlcnNbbmFtZV07XG5cbiAgICAgICAgdmFyIGNoaWxkQ29udHJvbGxlcnMgPSBmb2xkZXIuX19jb250cm9sbGVycztcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaGlsZENvbnRyb2xsZXJzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgY2hpbGRDb250cm9sbGVyc1tpXS5yZW1vdmUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBjaGlsZEZvbGRlcnMgPSBPYmplY3Qua2V5cyhmb2xkZXIuX19mb2xkZXJzIHx8IHt9KTtcbiAgICAgICAgZm9yIChpICA9IDA7IGkgPCBjaGlsZEZvbGRlcnMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICB2YXIgY2hpbGROYW1lID0gY2hpbGRGb2xkZXJzW2ldO1xuICAgICAgICAgIGZvbGRlci5yZW1vdmVGb2xkZXIoY2hpbGROYW1lKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgbGlDb250YWluZXIgPSBmb2xkZXIuZG9tRWxlbWVudC5wYXJlbnROb2RlO1xuICAgICAgICBsaUNvbnRhaW5lci5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGxpQ29udGFpbmVyKTtcbiAgICAgIH0sXG5cbiAgICAgIG9wZW46IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLmNsb3NlZCA9IGZhbHNlO1xuICAgICAgfSxcblxuICAgICAgdXBkYXRlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHVwZGF0ZUFsbCh0aGlzKTtcbiAgICAgIH0sXG5cbiAgICAgIGNsb3NlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5jbG9zZWQgPSB0cnVlO1xuICAgICAgfSxcblxuICAgICAgb25SZXNpemU6IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIHZhciByb290ID0gdGhpcy5nZXRSb290KCk7XG5cbiAgICAgICAgaWYgKHJvb3Quc2Nyb2xsYWJsZSkge1xuXG4gICAgICAgICAgdmFyIHRvcCA9IGRvbS5nZXRPZmZzZXQocm9vdC5fX3VsKS50b3A7XG4gICAgICAgICAgdmFyIGggPSAwO1xuXG4gICAgICAgICAgY29tbW9uLmVhY2gocm9vdC5fX3VsLmNoaWxkTm9kZXMsIGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgICAgIGlmICghKHJvb3QuYXV0b1BsYWNlICYmIG5vZGUgPT09IHJvb3QuX19zYXZlX3JvdykpXG4gICAgICAgICAgICAgIGggKz0gZG9tLmdldEhlaWdodChub2RlKTtcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIGlmICh3aW5kb3cuaW5uZXJIZWlnaHQgLSB0b3AgLSBDTE9TRV9CVVRUT05fSEVJR0hUIDwgaCkge1xuICAgICAgICAgICAgZG9tLmFkZENsYXNzKHJvb3QuZG9tRWxlbWVudCwgR1VJLkNMQVNTX1RPT19UQUxMKTtcbiAgICAgICAgICAgIHJvb3QuX191bC5zdHlsZS5oZWlnaHQgPSB3aW5kb3cuaW5uZXJIZWlnaHQgLSB0b3AgLSBDTE9TRV9CVVRUT05fSEVJR0hUICsgJ3B4JztcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZG9tLnJlbW92ZUNsYXNzKHJvb3QuZG9tRWxlbWVudCwgR1VJLkNMQVNTX1RPT19UQUxMKTtcbiAgICAgICAgICAgIHJvb3QuX191bC5zdHlsZS5oZWlnaHQgPSAnYXV0byc7XG4gICAgICAgICAgfVxuXG4gICAgICAgIH1cblxuICAgICAgICBpZiAocm9vdC5fX3Jlc2l6ZV9oYW5kbGUpIHtcbiAgICAgICAgICBjb21tb24uZGVmZXIoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByb290Ll9fcmVzaXplX2hhbmRsZS5zdHlsZS5oZWlnaHQgPSByb290Ll9fdWwub2Zmc2V0SGVpZ2h0ICsgJ3B4JztcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChyb290Ll9fY2xvc2VCdXR0b24pIHtcbiAgICAgICAgICByb290Ll9fY2xvc2VCdXR0b24uc3R5bGUud2lkdGggPSByb290LndpZHRoICsgJ3B4JztcbiAgICAgICAgfVxuXG4gICAgICB9LFxuXG4gICAgICAvKipcbiAgICAgICAqIE1hcmsgb2JqZWN0cyBmb3Igc2F2aW5nLiBUaGUgb3JkZXIgb2YgdGhlc2Ugb2JqZWN0cyBjYW5ub3QgY2hhbmdlIGFzXG4gICAgICAgKiB0aGUgR1VJIGdyb3dzLiBXaGVuIHJlbWVtYmVyaW5nIG5ldyBvYmplY3RzLCBhcHBlbmQgdGhlbSB0byB0aGUgZW5kXG4gICAgICAgKiBvZiB0aGUgbGlzdC5cbiAgICAgICAqXG4gICAgICAgKiBAcGFyYW0ge09iamVjdC4uLn0gb2JqZWN0c1xuICAgICAgICogQHRocm93cyB7RXJyb3J9IGlmIG5vdCBjYWxsZWQgb24gYSB0b3AgbGV2ZWwgR1VJLlxuICAgICAgICogQGluc3RhbmNlXG4gICAgICAgKi9cbiAgICAgIHJlbWVtYmVyOiBmdW5jdGlvbigpIHtcblxuICAgICAgICBpZiAoY29tbW9uLmlzVW5kZWZpbmVkKFNBVkVfRElBTE9HVUUpKSB7XG4gICAgICAgICAgU0FWRV9ESUFMT0dVRSA9IG5ldyBDZW50ZXJlZERpdigpO1xuICAgICAgICAgIFNBVkVfRElBTE9HVUUuZG9tRWxlbWVudC5pbm5lckhUTUwgPSBzYXZlRGlhbG9ndWVDb250ZW50cztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLnBhcmVudCkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIllvdSBjYW4gb25seSBjYWxsIHJlbWVtYmVyIG9uIGEgdG9wIGxldmVsIEdVSS5cIik7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgICAgIGNvbW1vbi5lYWNoKEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyksIGZ1bmN0aW9uKG9iamVjdCkge1xuICAgICAgICAgIGlmIChfdGhpcy5fX3JlbWVtYmVyZWRPYmplY3RzLmxlbmd0aCA9PSAwKSB7XG4gICAgICAgICAgICBhZGRTYXZlTWVudShfdGhpcyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChfdGhpcy5fX3JlbWVtYmVyZWRPYmplY3RzLmluZGV4T2Yob2JqZWN0KSA9PSAtMSkge1xuICAgICAgICAgICAgX3RoaXMuX19yZW1lbWJlcmVkT2JqZWN0cy5wdXNoKG9iamVjdCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAodGhpcy5hdXRvUGxhY2UpIHtcbiAgICAgICAgICAvLyBTZXQgc2F2ZSByb3cgd2lkdGhcbiAgICAgICAgICBzZXRXaWR0aCh0aGlzLCB0aGlzLndpZHRoKTtcbiAgICAgICAgfVxuXG4gICAgICB9LFxuXG4gICAgICAvKipcbiAgICAgICAqIEByZXR1cm5zIHtkYXQuZ3VpLkdVSX0gdGhlIHRvcG1vc3QgcGFyZW50IEdVSSBvZiBhIG5lc3RlZCBHVUkuXG4gICAgICAgKiBAaW5zdGFuY2VcbiAgICAgICAqL1xuICAgICAgZ2V0Um9vdDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBndWkgPSB0aGlzO1xuICAgICAgICB3aGlsZSAoZ3VpLnBhcmVudCkge1xuICAgICAgICAgIGd1aSA9IGd1aS5wYXJlbnQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGd1aTtcbiAgICAgIH0sXG5cbiAgICAgIC8qKlxuICAgICAgICogQHJldHVybnMge09iamVjdH0gYSBKU09OIG9iamVjdCByZXByZXNlbnRpbmcgdGhlIGN1cnJlbnQgc3RhdGUgb2ZcbiAgICAgICAqIHRoaXMgR1VJIGFzIHdlbGwgYXMgaXRzIHJlbWVtYmVyZWQgcHJvcGVydGllcy5cbiAgICAgICAqIEBpbnN0YW5jZVxuICAgICAgICovXG4gICAgICBnZXRTYXZlT2JqZWN0OiBmdW5jdGlvbigpIHtcblxuICAgICAgICB2YXIgdG9SZXR1cm4gPSB0aGlzLmxvYWQ7XG5cbiAgICAgICAgdG9SZXR1cm4uY2xvc2VkID0gdGhpcy5jbG9zZWQ7XG5cbiAgICAgICAgLy8gQW0gSSByZW1lbWJlcmluZyBhbnkgdmFsdWVzP1xuICAgICAgICBpZiAodGhpcy5fX3JlbWVtYmVyZWRPYmplY3RzLmxlbmd0aCA+IDApIHtcblxuICAgICAgICAgIHRvUmV0dXJuLnByZXNldCA9IHRoaXMucHJlc2V0O1xuXG4gICAgICAgICAgaWYgKCF0b1JldHVybi5yZW1lbWJlcmVkKSB7XG4gICAgICAgICAgICB0b1JldHVybi5yZW1lbWJlcmVkID0ge307XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdG9SZXR1cm4ucmVtZW1iZXJlZFt0aGlzLnByZXNldF0gPSBnZXRDdXJyZW50UHJlc2V0KHRoaXMpO1xuXG4gICAgICAgIH1cblxuICAgICAgICB0b1JldHVybi5mb2xkZXJzID0ge307XG4gICAgICAgIGNvbW1vbi5lYWNoKHRoaXMuX19mb2xkZXJzLCBmdW5jdGlvbihlbGVtZW50LCBrZXkpIHtcbiAgICAgICAgICB0b1JldHVybi5mb2xkZXJzW2tleV0gPSBlbGVtZW50LmdldFNhdmVPYmplY3QoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHRvUmV0dXJuO1xuXG4gICAgICB9LFxuXG4gICAgICBzYXZlOiBmdW5jdGlvbigpIHtcblxuICAgICAgICBpZiAoIXRoaXMubG9hZC5yZW1lbWJlcmVkKSB7XG4gICAgICAgICAgdGhpcy5sb2FkLnJlbWVtYmVyZWQgPSB7fTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMubG9hZC5yZW1lbWJlcmVkW3RoaXMucHJlc2V0XSA9IGdldEN1cnJlbnRQcmVzZXQodGhpcyk7XG4gICAgICAgIG1hcmtQcmVzZXRNb2RpZmllZCh0aGlzLCBmYWxzZSk7XG4gICAgICAgIHRoaXMuc2F2ZVRvTG9jYWxTdG9yYWdlSWZQb3NzaWJsZSgpO1xuXG4gICAgICB9LFxuXG4gICAgICBzYXZlQXM6IGZ1bmN0aW9uKHByZXNldE5hbWUpIHtcblxuICAgICAgICBpZiAoIXRoaXMubG9hZC5yZW1lbWJlcmVkKSB7XG5cbiAgICAgICAgICAvLyBSZXRhaW4gZGVmYXVsdCB2YWx1ZXMgdXBvbiBmaXJzdCBzYXZlXG4gICAgICAgICAgdGhpcy5sb2FkLnJlbWVtYmVyZWQgPSB7fTtcbiAgICAgICAgICB0aGlzLmxvYWQucmVtZW1iZXJlZFtERUZBVUxUX0RFRkFVTFRfUFJFU0VUX05BTUVdID0gZ2V0Q3VycmVudFByZXNldCh0aGlzLCB0cnVlKTtcblxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5sb2FkLnJlbWVtYmVyZWRbcHJlc2V0TmFtZV0gPSBnZXRDdXJyZW50UHJlc2V0KHRoaXMpO1xuICAgICAgICB0aGlzLnByZXNldCA9IHByZXNldE5hbWU7XG4gICAgICAgIGFkZFByZXNldE9wdGlvbih0aGlzLCBwcmVzZXROYW1lLCB0cnVlKTtcbiAgICAgICAgdGhpcy5zYXZlVG9Mb2NhbFN0b3JhZ2VJZlBvc3NpYmxlKCk7XG5cbiAgICAgIH0sXG5cbiAgICAgIHJldmVydDogZnVuY3Rpb24oZ3VpKSB7XG5cbiAgICAgICAgY29tbW9uLmVhY2godGhpcy5fX2NvbnRyb2xsZXJzLCBmdW5jdGlvbihjb250cm9sbGVyKSB7XG4gICAgICAgICAgLy8gTWFrZSByZXZlcnQgd29yayBvbiBEZWZhdWx0LlxuICAgICAgICAgIGlmICghdGhpcy5nZXRSb290KCkubG9hZC5yZW1lbWJlcmVkKSB7XG4gICAgICAgICAgICBjb250cm9sbGVyLnNldFZhbHVlKGNvbnRyb2xsZXIuaW5pdGlhbFZhbHVlKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVjYWxsU2F2ZWRWYWx1ZShndWkgfHwgdGhpcy5nZXRSb290KCksIGNvbnRyb2xsZXIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSwgdGhpcyk7XG5cbiAgICAgICAgY29tbW9uLmVhY2godGhpcy5fX2ZvbGRlcnMsIGZ1bmN0aW9uKGZvbGRlcikge1xuICAgICAgICAgIGZvbGRlci5yZXZlcnQoZm9sZGVyKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKCFndWkpIHtcbiAgICAgICAgICBtYXJrUHJlc2V0TW9kaWZpZWQodGhpcy5nZXRSb290KCksIGZhbHNlKTtcbiAgICAgICAgfVxuXG5cbiAgICAgIH0sXG5cbiAgICAgIGxpc3RlbjogZnVuY3Rpb24oY29udHJvbGxlcikge1xuXG4gICAgICAgIHZhciBpbml0ID0gdGhpcy5fX2xpc3RlbmluZy5sZW5ndGggPT0gMDtcbiAgICAgICAgdGhpcy5fX2xpc3RlbmluZy5wdXNoKGNvbnRyb2xsZXIpO1xuICAgICAgICBpZiAoaW5pdCkgdXBkYXRlRGlzcGxheXModGhpcy5fX2xpc3RlbmluZyk7XG5cbiAgICAgIH1cblxuICAgIH1cblxuICApO1xuXG4gIGZ1bmN0aW9uIGFkZChndWksIG9iamVjdCwgcHJvcGVydHksIHBhcmFtcykge1xuXG4gICAgaWYgKG9iamVjdFtwcm9wZXJ0eV0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiT2JqZWN0IFwiICsgb2JqZWN0ICsgXCIgaGFzIG5vIHByb3BlcnR5IFxcXCJcIiArIHByb3BlcnR5ICsgXCJcXFwiXCIpO1xuICAgIH1cblxuICAgIHZhciBjb250cm9sbGVyO1xuXG4gICAgaWYgKHBhcmFtcy5jb2xvcikge1xuICAgICAgY29udHJvbGxlciA9IG5ldyBDb2xvckNvbnRyb2xsZXIob2JqZWN0LCBwcm9wZXJ0eSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBmYWN0b3J5QXJncyA9IFtvYmplY3QsIHByb3BlcnR5XS5jb25jYXQocGFyYW1zLmZhY3RvcnlBcmdzKTtcbiAgICAgIGNvbnRyb2xsZXIgPSBjb250cm9sbGVyRmFjdG9yeS5hcHBseShndWksIGZhY3RvcnlBcmdzKTtcbiAgICB9XG5cbiAgICBpZiAocGFyYW1zLmJlZm9yZSBpbnN0YW5jZW9mIENvbnRyb2xsZXIpIHtcbiAgICAgIHBhcmFtcy5iZWZvcmUgPSBwYXJhbXMuYmVmb3JlLl9fbGk7XG4gICAgfVxuXG4gICAgcmVjYWxsU2F2ZWRWYWx1ZShndWksIGNvbnRyb2xsZXIpO1xuXG4gICAgZG9tLmFkZENsYXNzKGNvbnRyb2xsZXIuZG9tRWxlbWVudCwgJ2MnKTtcblxuICAgIHZhciBuYW1lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgIGRvbS5hZGRDbGFzcyhuYW1lLCAncHJvcGVydHktbmFtZScpO1xuICAgIG5hbWUuaW5uZXJIVE1MID0gY29udHJvbGxlci5wcm9wZXJ0eTtcblxuICAgIHZhciBjb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQobmFtZSk7XG4gICAgY29udGFpbmVyLmFwcGVuZENoaWxkKGNvbnRyb2xsZXIuZG9tRWxlbWVudCk7XG5cbiAgICB2YXIgbGkgPSBhZGRSb3coZ3VpLCBjb250YWluZXIsIHBhcmFtcy5iZWZvcmUpO1xuXG4gICAgZG9tLmFkZENsYXNzKGxpLCBHVUkuQ0xBU1NfQ09OVFJPTExFUl9ST1cpO1xuICAgIGRvbS5hZGRDbGFzcyhsaSwgdHlwZW9mIGNvbnRyb2xsZXIuZ2V0VmFsdWUoKSk7XG5cbiAgICBhdWdtZW50Q29udHJvbGxlcihndWksIGxpLCBjb250cm9sbGVyKTtcblxuICAgIGd1aS5fX2NvbnRyb2xsZXJzLnB1c2goY29udHJvbGxlcik7XG5cbiAgICByZXR1cm4gY29udHJvbGxlcjtcblxuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBhIHJvdyB0byB0aGUgZW5kIG9mIHRoZSBHVUkgb3IgYmVmb3JlIGFub3RoZXIgcm93LlxuICAgKlxuICAgKiBAcGFyYW0gZ3VpXG4gICAqIEBwYXJhbSBbZG9tXSBJZiBzcGVjaWZpZWQsIGluc2VydHMgdGhlIGRvbSBjb250ZW50IGluIHRoZSBuZXcgcm93XG4gICAqIEBwYXJhbSBbbGlCZWZvcmVdIElmIHNwZWNpZmllZCwgcGxhY2VzIHRoZSBuZXcgcm93IGJlZm9yZSBhbm90aGVyIHJvd1xuICAgKi9cbiAgZnVuY3Rpb24gYWRkUm93KGd1aSwgZG9tLCBsaUJlZm9yZSkge1xuICAgIHZhciBsaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJyk7XG4gICAgaWYgKGRvbSkgbGkuYXBwZW5kQ2hpbGQoZG9tKTtcbiAgICBpZiAobGlCZWZvcmUpIHtcbiAgICAgIGd1aS5fX3VsLmluc2VydEJlZm9yZShsaSwgcGFyYW1zLmJlZm9yZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGd1aS5fX3VsLmFwcGVuZENoaWxkKGxpKTtcbiAgICB9XG4gICAgZ3VpLm9uUmVzaXplKCk7XG4gICAgcmV0dXJuIGxpO1xuICB9XG5cbiAgZnVuY3Rpb24gYXVnbWVudENvbnRyb2xsZXIoZ3VpLCBsaSwgY29udHJvbGxlcikge1xuXG4gICAgY29udHJvbGxlci5fX2xpID0gbGk7XG4gICAgY29udHJvbGxlci5fX2d1aSA9IGd1aTtcblxuICAgIGNvbW1vbi5leHRlbmQoY29udHJvbGxlciwge1xuXG4gICAgICBvcHRpb25zOiBmdW5jdGlvbihvcHRpb25zKSB7XG5cbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgY29udHJvbGxlci5yZW1vdmUoKTtcblxuICAgICAgICAgIHJldHVybiBhZGQoXG4gICAgICAgICAgICBndWksXG4gICAgICAgICAgICBjb250cm9sbGVyLm9iamVjdCxcbiAgICAgICAgICAgIGNvbnRyb2xsZXIucHJvcGVydHksIHtcbiAgICAgICAgICAgICAgYmVmb3JlOiBjb250cm9sbGVyLl9fbGkubmV4dEVsZW1lbnRTaWJsaW5nLFxuICAgICAgICAgICAgICBmYWN0b3J5QXJnczogW2NvbW1vbi50b0FycmF5KGFyZ3VtZW50cyldXG4gICAgICAgICAgICB9XG4gICAgICAgICAgKTtcblxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNvbW1vbi5pc0FycmF5KG9wdGlvbnMpIHx8IGNvbW1vbi5pc09iamVjdChvcHRpb25zKSkge1xuICAgICAgICAgIGNvbnRyb2xsZXIucmVtb3ZlKCk7XG5cbiAgICAgICAgICByZXR1cm4gYWRkKFxuICAgICAgICAgICAgZ3VpLFxuICAgICAgICAgICAgY29udHJvbGxlci5vYmplY3QsXG4gICAgICAgICAgICBjb250cm9sbGVyLnByb3BlcnR5LCB7XG4gICAgICAgICAgICAgIGJlZm9yZTogY29udHJvbGxlci5fX2xpLm5leHRFbGVtZW50U2libGluZyxcbiAgICAgICAgICAgICAgZmFjdG9yeUFyZ3M6IFtvcHRpb25zXVxuICAgICAgICAgICAgfVxuICAgICAgICAgICk7XG5cbiAgICAgICAgfVxuXG4gICAgICB9LFxuXG4gICAgICBuYW1lOiBmdW5jdGlvbih2KSB7XG4gICAgICAgIGNvbnRyb2xsZXIuX19saS5maXJzdEVsZW1lbnRDaGlsZC5maXJzdEVsZW1lbnRDaGlsZC5pbm5lckhUTUwgPSB2O1xuICAgICAgICByZXR1cm4gY29udHJvbGxlcjtcbiAgICAgIH0sXG5cbiAgICAgIGxpc3RlbjogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnRyb2xsZXIuX19ndWkubGlzdGVuKGNvbnRyb2xsZXIpO1xuICAgICAgICByZXR1cm4gY29udHJvbGxlcjtcbiAgICAgIH0sXG5cbiAgICAgIHJlbW92ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnRyb2xsZXIuX19ndWkucmVtb3ZlKGNvbnRyb2xsZXIpO1xuICAgICAgICByZXR1cm4gY29udHJvbGxlcjtcbiAgICAgIH1cblxuICAgIH0pO1xuXG4gICAgLy8gQWxsIHNsaWRlcnMgc2hvdWxkIGJlIGFjY29tcGFuaWVkIGJ5IGEgYm94LlxuICAgIGlmIChjb250cm9sbGVyIGluc3RhbmNlb2YgTnVtYmVyQ29udHJvbGxlclNsaWRlcikge1xuXG4gICAgICB2YXIgYm94ID0gbmV3IE51bWJlckNvbnRyb2xsZXJCb3goY29udHJvbGxlci5vYmplY3QsIGNvbnRyb2xsZXIucHJvcGVydHksIHtcbiAgICAgICAgbWluOiBjb250cm9sbGVyLl9fbWluLFxuICAgICAgICBtYXg6IGNvbnRyb2xsZXIuX19tYXgsXG4gICAgICAgIHN0ZXA6IGNvbnRyb2xsZXIuX19zdGVwXG4gICAgICB9KTtcblxuICAgICAgY29tbW9uLmVhY2goWyd1cGRhdGVEaXNwbGF5JywgJ29uQ2hhbmdlJywgJ29uRmluaXNoQ2hhbmdlJ10sIGZ1bmN0aW9uKG1ldGhvZCkge1xuICAgICAgICB2YXIgcGMgPSBjb250cm9sbGVyW21ldGhvZF07XG4gICAgICAgIHZhciBwYiA9IGJveFttZXRob2RdO1xuICAgICAgICBjb250cm9sbGVyW21ldGhvZF0gPSBib3hbbWV0aG9kXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcbiAgICAgICAgICBwYy5hcHBseShjb250cm9sbGVyLCBhcmdzKTtcbiAgICAgICAgICByZXR1cm4gcGIuYXBwbHkoYm94LCBhcmdzKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIGRvbS5hZGRDbGFzcyhsaSwgJ2hhcy1zbGlkZXInKTtcbiAgICAgIGNvbnRyb2xsZXIuZG9tRWxlbWVudC5pbnNlcnRCZWZvcmUoYm94LmRvbUVsZW1lbnQsIGNvbnRyb2xsZXIuZG9tRWxlbWVudC5maXJzdEVsZW1lbnRDaGlsZCk7XG5cbiAgICB9IGVsc2UgaWYgKGNvbnRyb2xsZXIgaW5zdGFuY2VvZiBOdW1iZXJDb250cm9sbGVyQm94KSB7XG5cbiAgICAgIHZhciByID0gZnVuY3Rpb24ocmV0dXJuZWQpIHtcblxuICAgICAgICAvLyBIYXZlIHdlIGRlZmluZWQgYm90aCBib3VuZGFyaWVzP1xuICAgICAgICBpZiAoY29tbW9uLmlzTnVtYmVyKGNvbnRyb2xsZXIuX19taW4pICYmIGNvbW1vbi5pc051bWJlcihjb250cm9sbGVyLl9fbWF4KSkge1xuXG4gICAgICAgICAgLy8gV2VsbCwgdGhlbiBsZXRzIGp1c3QgcmVwbGFjZSB0aGlzIHdpdGggYSBzbGlkZXIuXG4gICAgICAgICAgY29udHJvbGxlci5yZW1vdmUoKTtcbiAgICAgICAgICByZXR1cm4gYWRkKFxuICAgICAgICAgICAgZ3VpLFxuICAgICAgICAgICAgY29udHJvbGxlci5vYmplY3QsXG4gICAgICAgICAgICBjb250cm9sbGVyLnByb3BlcnR5LCB7XG4gICAgICAgICAgICAgIGJlZm9yZTogY29udHJvbGxlci5fX2xpLm5leHRFbGVtZW50U2libGluZyxcbiAgICAgICAgICAgICAgZmFjdG9yeUFyZ3M6IFtjb250cm9sbGVyLl9fbWluLCBjb250cm9sbGVyLl9fbWF4LCBjb250cm9sbGVyLl9fc3RlcF1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmV0dXJuZWQ7XG5cbiAgICAgIH07XG5cbiAgICAgIGNvbnRyb2xsZXIubWluID0gY29tbW9uLmNvbXBvc2UociwgY29udHJvbGxlci5taW4pO1xuICAgICAgY29udHJvbGxlci5tYXggPSBjb21tb24uY29tcG9zZShyLCBjb250cm9sbGVyLm1heCk7XG5cbiAgICB9IGVsc2UgaWYgKGNvbnRyb2xsZXIgaW5zdGFuY2VvZiBCb29sZWFuQ29udHJvbGxlcikge1xuXG4gICAgICBkb20uYmluZChsaSwgJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIGRvbS5mYWtlRXZlbnQoY29udHJvbGxlci5fX2NoZWNrYm94LCAnY2xpY2snKTtcbiAgICAgIH0pO1xuXG4gICAgICBkb20uYmluZChjb250cm9sbGVyLl9fY2hlY2tib3gsICdjbGljaycsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTsgLy8gUHJldmVudHMgZG91YmxlLXRvZ2dsZVxuICAgICAgfSlcblxuICAgIH0gZWxzZSBpZiAoY29udHJvbGxlciBpbnN0YW5jZW9mIEZ1bmN0aW9uQ29udHJvbGxlcikge1xuXG4gICAgICBkb20uYmluZChsaSwgJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIGRvbS5mYWtlRXZlbnQoY29udHJvbGxlci5fX2J1dHRvbiwgJ2NsaWNrJyk7XG4gICAgICB9KTtcblxuICAgICAgZG9tLmJpbmQobGksICdtb3VzZW92ZXInLCBmdW5jdGlvbigpIHtcbiAgICAgICAgZG9tLmFkZENsYXNzKGNvbnRyb2xsZXIuX19idXR0b24sICdob3ZlcicpO1xuICAgICAgfSk7XG5cbiAgICAgIGRvbS5iaW5kKGxpLCAnbW91c2VvdXQnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgZG9tLnJlbW92ZUNsYXNzKGNvbnRyb2xsZXIuX19idXR0b24sICdob3ZlcicpO1xuICAgICAgfSk7XG5cbiAgICB9IGVsc2UgaWYgKGNvbnRyb2xsZXIgaW5zdGFuY2VvZiBDb2xvckNvbnRyb2xsZXIpIHtcblxuICAgICAgZG9tLmFkZENsYXNzKGxpLCAnY29sb3InKTtcbiAgICAgIGNvbnRyb2xsZXIudXBkYXRlRGlzcGxheSA9IGNvbW1vbi5jb21wb3NlKGZ1bmN0aW9uKHIpIHtcbiAgICAgICAgbGkuc3R5bGUuYm9yZGVyTGVmdENvbG9yID0gY29udHJvbGxlci5fX2NvbG9yLnRvU3RyaW5nKCk7XG4gICAgICAgIHJldHVybiByO1xuICAgICAgfSwgY29udHJvbGxlci51cGRhdGVEaXNwbGF5KTtcblxuICAgICAgY29udHJvbGxlci51cGRhdGVEaXNwbGF5KCk7XG5cbiAgICB9XG5cbiAgICBjb250cm9sbGVyLnNldFZhbHVlID0gY29tbW9uLmNvbXBvc2UoZnVuY3Rpb24ocikge1xuICAgICAgaWYgKGd1aS5nZXRSb290KCkuX19wcmVzZXRfc2VsZWN0ICYmIGNvbnRyb2xsZXIuaXNNb2RpZmllZCgpKSB7XG4gICAgICAgIG1hcmtQcmVzZXRNb2RpZmllZChndWkuZ2V0Um9vdCgpLCB0cnVlKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByO1xuICAgIH0sIGNvbnRyb2xsZXIuc2V0VmFsdWUpO1xuXG4gIH1cblxuICBmdW5jdGlvbiByZWNhbGxTYXZlZFZhbHVlKGd1aSwgY29udHJvbGxlcikge1xuXG4gICAgLy8gRmluZCB0aGUgdG9wbW9zdCBHVUksIHRoYXQncyB3aGVyZSByZW1lbWJlcmVkIG9iamVjdHMgbGl2ZS5cbiAgICB2YXIgcm9vdCA9IGd1aS5nZXRSb290KCk7XG5cbiAgICAvLyBEb2VzIHRoZSBvYmplY3Qgd2UncmUgY29udHJvbGxpbmcgbWF0Y2ggYW55dGhpbmcgd2UndmUgYmVlbiB0b2xkIHRvXG4gICAgLy8gcmVtZW1iZXI/XG4gICAgdmFyIG1hdGNoZWRfaW5kZXggPSByb290Ll9fcmVtZW1iZXJlZE9iamVjdHMuaW5kZXhPZihjb250cm9sbGVyLm9iamVjdCk7XG5cbiAgICAvLyBXaHkgeWVzLCBpdCBkb2VzIVxuICAgIGlmIChtYXRjaGVkX2luZGV4ICE9IC0xKSB7XG5cbiAgICAgIC8vIExldCBtZSBmZXRjaCBhIG1hcCBvZiBjb250cm9sbGVycyBmb3IgdGhjb21tb24uaXNPYmplY3QuXG4gICAgICB2YXIgY29udHJvbGxlcl9tYXAgPVxuICAgICAgICByb290Ll9fcmVtZW1iZXJlZE9iamVjdEluZGVjZXNUb0NvbnRyb2xsZXJzW21hdGNoZWRfaW5kZXhdO1xuXG4gICAgICAvLyBPaHAsIEkgYmVsaWV2ZSB0aGlzIGlzIHRoZSBmaXJzdCBjb250cm9sbGVyIHdlJ3ZlIGNyZWF0ZWQgZm9yIHRoaXNcbiAgICAgIC8vIG9iamVjdC4gTGV0cyBtYWtlIHRoZSBtYXAgZnJlc2guXG4gICAgICBpZiAoY29udHJvbGxlcl9tYXAgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBjb250cm9sbGVyX21hcCA9IHt9O1xuICAgICAgICByb290Ll9fcmVtZW1iZXJlZE9iamVjdEluZGVjZXNUb0NvbnRyb2xsZXJzW21hdGNoZWRfaW5kZXhdID1cbiAgICAgICAgICBjb250cm9sbGVyX21hcDtcbiAgICAgIH1cblxuICAgICAgLy8gS2VlcCB0cmFjayBvZiB0aGlzIGNvbnRyb2xsZXJcbiAgICAgIGNvbnRyb2xsZXJfbWFwW2NvbnRyb2xsZXIucHJvcGVydHldID0gY29udHJvbGxlcjtcblxuICAgICAgLy8gT2theSwgbm93IGhhdmUgd2Ugc2F2ZWQgYW55IHZhbHVlcyBmb3IgdGhpcyBjb250cm9sbGVyP1xuICAgICAgaWYgKHJvb3QubG9hZCAmJiByb290LmxvYWQucmVtZW1iZXJlZCkge1xuXG4gICAgICAgIHZhciBwcmVzZXRfbWFwID0gcm9vdC5sb2FkLnJlbWVtYmVyZWQ7XG5cbiAgICAgICAgLy8gV2hpY2ggcHJlc2V0IGFyZSB3ZSB0cnlpbmcgdG8gbG9hZD9cbiAgICAgICAgdmFyIHByZXNldDtcblxuICAgICAgICBpZiAocHJlc2V0X21hcFtndWkucHJlc2V0XSkge1xuXG4gICAgICAgICAgcHJlc2V0ID0gcHJlc2V0X21hcFtndWkucHJlc2V0XTtcblxuICAgICAgICB9IGVsc2UgaWYgKHByZXNldF9tYXBbREVGQVVMVF9ERUZBVUxUX1BSRVNFVF9OQU1FXSkge1xuXG4gICAgICAgICAgLy8gVWhoLCB5b3UgY2FuIGhhdmUgdGhlIGRlZmF1bHQgaW5zdGVhZD9cbiAgICAgICAgICBwcmVzZXQgPSBwcmVzZXRfbWFwW0RFRkFVTFRfREVGQVVMVF9QUkVTRVRfTkFNRV07XG5cbiAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgIC8vIE5hZGEuXG5cbiAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgfVxuXG5cbiAgICAgICAgLy8gRGlkIHRoZSBsb2FkZWQgb2JqZWN0IHJlbWVtYmVyIHRoY29tbW9uLmlzT2JqZWN0P1xuICAgICAgICBpZiAocHJlc2V0W21hdGNoZWRfaW5kZXhdICYmXG5cbiAgICAgICAgICAvLyBEaWQgd2UgcmVtZW1iZXIgdGhpcyBwYXJ0aWN1bGFyIHByb3BlcnR5P1xuICAgICAgICAgIHByZXNldFttYXRjaGVkX2luZGV4XVtjb250cm9sbGVyLnByb3BlcnR5XSAhPT0gdW5kZWZpbmVkKSB7XG5cbiAgICAgICAgICAvLyBXZSBkaWQgcmVtZW1iZXIgc29tZXRoaW5nIGZvciB0aGlzIGd1eSAuLi5cbiAgICAgICAgICB2YXIgdmFsdWUgPSBwcmVzZXRbbWF0Y2hlZF9pbmRleF1bY29udHJvbGxlci5wcm9wZXJ0eV07XG5cbiAgICAgICAgICAvLyBBbmQgdGhhdCdzIHdoYXQgaXQgaXMuXG4gICAgICAgICAgY29udHJvbGxlci5pbml0aWFsVmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgICBjb250cm9sbGVyLnNldFZhbHVlKHZhbHVlKTtcblxuICAgICAgICB9XG5cbiAgICAgIH1cblxuICAgIH1cblxuICB9XG5cbiAgZnVuY3Rpb24gZ2V0TG9jYWxTdG9yYWdlSGFzaChndWksIGtleSkge1xuICAgIC8vIFRPRE8gaG93IGRvZXMgdGhpcyBkZWFsIHdpdGggbXVsdGlwbGUgR1VJJ3M/XG4gICAgcmV0dXJuIGRvY3VtZW50LmxvY2F0aW9uLmhyZWYgKyAnLicgKyBrZXk7XG5cbiAgfVxuXG4gIGZ1bmN0aW9uIGFkZFNhdmVNZW51KGd1aSkge1xuXG4gICAgdmFyIGRpdiA9IGd1aS5fX3NhdmVfcm93ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcblxuICAgIGRvbS5hZGRDbGFzcyhndWkuZG9tRWxlbWVudCwgJ2hhcy1zYXZlJyk7XG5cbiAgICBndWkuX191bC5pbnNlcnRCZWZvcmUoZGl2LCBndWkuX191bC5maXJzdENoaWxkKTtcblxuICAgIGRvbS5hZGRDbGFzcyhkaXYsICdzYXZlLXJvdycpO1xuXG4gICAgdmFyIGdlYXJzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgIGdlYXJzLmlubmVySFRNTCA9ICcmbmJzcDsnO1xuICAgIGRvbS5hZGRDbGFzcyhnZWFycywgJ2J1dHRvbiBnZWFycycpO1xuXG4gICAgLy8gVE9ETyByZXBsYWNlIHdpdGggRnVuY3Rpb25Db250cm9sbGVyXG4gICAgdmFyIGJ1dHRvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICBidXR0b24uaW5uZXJIVE1MID0gJ1NhdmUnO1xuICAgIGRvbS5hZGRDbGFzcyhidXR0b24sICdidXR0b24nKTtcbiAgICBkb20uYWRkQ2xhc3MoYnV0dG9uLCAnc2F2ZScpO1xuXG4gICAgdmFyIGJ1dHRvbjIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgYnV0dG9uMi5pbm5lckhUTUwgPSAnTmV3JztcbiAgICBkb20uYWRkQ2xhc3MoYnV0dG9uMiwgJ2J1dHRvbicpO1xuICAgIGRvbS5hZGRDbGFzcyhidXR0b24yLCAnc2F2ZS1hcycpO1xuXG4gICAgdmFyIGJ1dHRvbjMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgYnV0dG9uMy5pbm5lckhUTUwgPSAnUmV2ZXJ0JztcbiAgICBkb20uYWRkQ2xhc3MoYnV0dG9uMywgJ2J1dHRvbicpO1xuICAgIGRvbS5hZGRDbGFzcyhidXR0b24zLCAncmV2ZXJ0Jyk7XG5cbiAgICB2YXIgc2VsZWN0ID0gZ3VpLl9fcHJlc2V0X3NlbGVjdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NlbGVjdCcpO1xuXG4gICAgaWYgKGd1aS5sb2FkICYmIGd1aS5sb2FkLnJlbWVtYmVyZWQpIHtcblxuICAgICAgY29tbW9uLmVhY2goZ3VpLmxvYWQucmVtZW1iZXJlZCwgZnVuY3Rpb24odmFsdWUsIGtleSkge1xuICAgICAgICBhZGRQcmVzZXRPcHRpb24oZ3VpLCBrZXksIGtleSA9PSBndWkucHJlc2V0KTtcbiAgICAgIH0pO1xuXG4gICAgfSBlbHNlIHtcbiAgICAgIGFkZFByZXNldE9wdGlvbihndWksIERFRkFVTFRfREVGQVVMVF9QUkVTRVRfTkFNRSwgZmFsc2UpO1xuICAgIH1cblxuICAgIGRvbS5iaW5kKHNlbGVjdCwgJ2NoYW5nZScsIGZ1bmN0aW9uKCkge1xuXG5cbiAgICAgIGZvciAodmFyIGluZGV4ID0gMDsgaW5kZXggPCBndWkuX19wcmVzZXRfc2VsZWN0Lmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgICBndWkuX19wcmVzZXRfc2VsZWN0W2luZGV4XS5pbm5lckhUTUwgPSBndWkuX19wcmVzZXRfc2VsZWN0W2luZGV4XS52YWx1ZTtcbiAgICAgIH1cblxuICAgICAgZ3VpLnByZXNldCA9IHRoaXMudmFsdWU7XG5cbiAgICB9KTtcblxuICAgIGRpdi5hcHBlbmRDaGlsZChzZWxlY3QpO1xuICAgIGRpdi5hcHBlbmRDaGlsZChnZWFycyk7XG4gICAgZGl2LmFwcGVuZENoaWxkKGJ1dHRvbik7XG4gICAgZGl2LmFwcGVuZENoaWxkKGJ1dHRvbjIpO1xuICAgIGRpdi5hcHBlbmRDaGlsZChidXR0b24zKTtcblxuICAgIGlmIChTVVBQT1JUU19MT0NBTF9TVE9SQUdFKSB7XG5cbiAgICAgIHZhciBzYXZlTG9jYWxseSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkZy1zYXZlLWxvY2FsbHknKTtcbiAgICAgIHZhciBleHBsYWluID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2RnLWxvY2FsLWV4cGxhaW4nKTtcblxuICAgICAgc2F2ZUxvY2FsbHkuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG5cbiAgICAgIHZhciBsb2NhbFN0b3JhZ2VDaGVja0JveCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkZy1sb2NhbC1zdG9yYWdlJyk7XG5cbiAgICAgIGlmIChsb2NhbFN0b3JhZ2UuZ2V0SXRlbShnZXRMb2NhbFN0b3JhZ2VIYXNoKGd1aSwgJ2lzTG9jYWwnKSkgPT09ICd0cnVlJykge1xuICAgICAgICBsb2NhbFN0b3JhZ2VDaGVja0JveC5zZXRBdHRyaWJ1dGUoJ2NoZWNrZWQnLCAnY2hlY2tlZCcpO1xuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBzaG93SGlkZUV4cGxhaW4oKSB7XG4gICAgICAgIGV4cGxhaW4uc3R5bGUuZGlzcGxheSA9IGd1aS51c2VMb2NhbFN0b3JhZ2UgPyAnYmxvY2snIDogJ25vbmUnO1xuICAgICAgfVxuXG4gICAgICBzaG93SGlkZUV4cGxhaW4oKTtcblxuICAgICAgLy8gVE9ETzogVXNlIGEgYm9vbGVhbiBjb250cm9sbGVyLCBmb29sIVxuICAgICAgZG9tLmJpbmQobG9jYWxTdG9yYWdlQ2hlY2tCb3gsICdjaGFuZ2UnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgZ3VpLnVzZUxvY2FsU3RvcmFnZSA9ICFndWkudXNlTG9jYWxTdG9yYWdlO1xuICAgICAgICBzaG93SGlkZUV4cGxhaW4oKTtcbiAgICAgIH0pO1xuXG4gICAgfVxuXG4gICAgdmFyIG5ld0NvbnN0cnVjdG9yVGV4dEFyZWEgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZGctbmV3LWNvbnN0cnVjdG9yJyk7XG5cbiAgICBkb20uYmluZChuZXdDb25zdHJ1Y3RvclRleHRBcmVhLCAna2V5ZG93bicsIGZ1bmN0aW9uKGUpIHtcbiAgICAgIGlmIChlLm1ldGFLZXkgJiYgKGUud2hpY2ggPT09IDY3IHx8IGUua2V5Q29kZSA9PSA2NykpIHtcbiAgICAgICAgU0FWRV9ESUFMT0dVRS5oaWRlKCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBkb20uYmluZChnZWFycywgJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICBuZXdDb25zdHJ1Y3RvclRleHRBcmVhLmlubmVySFRNTCA9IEpTT04uc3RyaW5naWZ5KGd1aS5nZXRTYXZlT2JqZWN0KCksIHVuZGVmaW5lZCwgMik7XG4gICAgICBTQVZFX0RJQUxPR1VFLnNob3coKTtcbiAgICAgIG5ld0NvbnN0cnVjdG9yVGV4dEFyZWEuZm9jdXMoKTtcbiAgICAgIG5ld0NvbnN0cnVjdG9yVGV4dEFyZWEuc2VsZWN0KCk7XG4gICAgfSk7XG5cbiAgICBkb20uYmluZChidXR0b24sICdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgICAgZ3VpLnNhdmUoKTtcbiAgICB9KTtcblxuICAgIGRvbS5iaW5kKGJ1dHRvbjIsICdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHByZXNldE5hbWUgPSBwcm9tcHQoJ0VudGVyIGEgbmV3IHByZXNldCBuYW1lLicpO1xuICAgICAgaWYgKHByZXNldE5hbWUpIGd1aS5zYXZlQXMocHJlc2V0TmFtZSk7XG4gICAgfSk7XG5cbiAgICBkb20uYmluZChidXR0b24zLCAnY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAgIGd1aS5yZXZlcnQoKTtcbiAgICB9KTtcblxuICAgIC8vICAgIGRpdi5hcHBlbmRDaGlsZChidXR0b24yKTtcblxuICB9XG5cbiAgZnVuY3Rpb24gYWRkUmVzaXplSGFuZGxlKGd1aSkge1xuXG4gICAgZ3VpLl9fcmVzaXplX2hhbmRsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXG4gICAgY29tbW9uLmV4dGVuZChndWkuX19yZXNpemVfaGFuZGxlLnN0eWxlLCB7XG5cbiAgICAgIHdpZHRoOiAnNnB4JyxcbiAgICAgIG1hcmdpbkxlZnQ6ICctM3B4JyxcbiAgICAgIGhlaWdodDogJzIwMHB4JyxcbiAgICAgIGN1cnNvcjogJ2V3LXJlc2l6ZScsXG4gICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJ1xuICAgICAgICAvLyAgICAgIGJvcmRlcjogJzFweCBzb2xpZCBibHVlJ1xuXG4gICAgfSk7XG5cbiAgICB2YXIgcG1vdXNlWDtcblxuICAgIGRvbS5iaW5kKGd1aS5fX3Jlc2l6ZV9oYW5kbGUsICdtb3VzZWRvd24nLCBkcmFnU3RhcnQpO1xuICAgIGRvbS5iaW5kKGd1aS5fX2Nsb3NlQnV0dG9uLCAnbW91c2Vkb3duJywgZHJhZ1N0YXJ0KTtcblxuICAgIGd1aS5kb21FbGVtZW50Lmluc2VydEJlZm9yZShndWkuX19yZXNpemVfaGFuZGxlLCBndWkuZG9tRWxlbWVudC5maXJzdEVsZW1lbnRDaGlsZCk7XG5cbiAgICBmdW5jdGlvbiBkcmFnU3RhcnQoZSkge1xuXG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgIHBtb3VzZVggPSBlLmNsaWVudFg7XG5cbiAgICAgIGRvbS5hZGRDbGFzcyhndWkuX19jbG9zZUJ1dHRvbiwgR1VJLkNMQVNTX0RSQUcpO1xuICAgICAgZG9tLmJpbmQod2luZG93LCAnbW91c2Vtb3ZlJywgZHJhZyk7XG4gICAgICBkb20uYmluZCh3aW5kb3csICdtb3VzZXVwJywgZHJhZ1N0b3ApO1xuXG4gICAgICByZXR1cm4gZmFsc2U7XG5cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkcmFnKGUpIHtcblxuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICBndWkud2lkdGggKz0gcG1vdXNlWCAtIGUuY2xpZW50WDtcbiAgICAgIGd1aS5vblJlc2l6ZSgpO1xuICAgICAgcG1vdXNlWCA9IGUuY2xpZW50WDtcblxuICAgICAgcmV0dXJuIGZhbHNlO1xuXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZHJhZ1N0b3AoKSB7XG5cbiAgICAgIGRvbS5yZW1vdmVDbGFzcyhndWkuX19jbG9zZUJ1dHRvbiwgR1VJLkNMQVNTX0RSQUcpO1xuICAgICAgZG9tLnVuYmluZCh3aW5kb3csICdtb3VzZW1vdmUnLCBkcmFnKTtcbiAgICAgIGRvbS51bmJpbmQod2luZG93LCAnbW91c2V1cCcsIGRyYWdTdG9wKTtcblxuICAgIH1cblxuICB9XG5cbiAgZnVuY3Rpb24gc2V0V2lkdGgoZ3VpLCB3KSB7XG4gICAgZ3VpLmRvbUVsZW1lbnQuc3R5bGUud2lkdGggPSB3ICsgJ3B4JztcbiAgICAvLyBBdXRvIHBsYWNlZCBzYXZlLXJvd3MgYXJlIHBvc2l0aW9uIGZpeGVkLCBzbyB3ZSBoYXZlIHRvXG4gICAgLy8gc2V0IHRoZSB3aWR0aCBtYW51YWxseSBpZiB3ZSB3YW50IGl0IHRvIGJsZWVkIHRvIHRoZSBlZGdlXG4gICAgaWYgKGd1aS5fX3NhdmVfcm93ICYmIGd1aS5hdXRvUGxhY2UpIHtcbiAgICAgIGd1aS5fX3NhdmVfcm93LnN0eWxlLndpZHRoID0gdyArICdweCc7XG4gICAgfVxuICAgIGlmIChndWkuX19jbG9zZUJ1dHRvbikge1xuICAgICAgZ3VpLl9fY2xvc2VCdXR0b24uc3R5bGUud2lkdGggPSB3ICsgJ3B4JztcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBnZXRDdXJyZW50UHJlc2V0KGd1aSwgdXNlSW5pdGlhbFZhbHVlcykge1xuXG4gICAgdmFyIHRvUmV0dXJuID0ge307XG5cbiAgICAvLyBGb3IgZWFjaCBvYmplY3QgSSdtIHJlbWVtYmVyaW5nXG4gICAgY29tbW9uLmVhY2goZ3VpLl9fcmVtZW1iZXJlZE9iamVjdHMsIGZ1bmN0aW9uKHZhbCwgaW5kZXgpIHtcblxuICAgICAgdmFyIHNhdmVkX3ZhbHVlcyA9IHt9O1xuXG4gICAgICAvLyBUaGUgY29udHJvbGxlcnMgSSd2ZSBtYWRlIGZvciB0aGNvbW1vbi5pc09iamVjdCBieSBwcm9wZXJ0eVxuICAgICAgdmFyIGNvbnRyb2xsZXJfbWFwID1cbiAgICAgICAgZ3VpLl9fcmVtZW1iZXJlZE9iamVjdEluZGVjZXNUb0NvbnRyb2xsZXJzW2luZGV4XTtcblxuICAgICAgLy8gUmVtZW1iZXIgZWFjaCB2YWx1ZSBmb3IgZWFjaCBwcm9wZXJ0eVxuICAgICAgY29tbW9uLmVhY2goY29udHJvbGxlcl9tYXAsIGZ1bmN0aW9uKGNvbnRyb2xsZXIsIHByb3BlcnR5KSB7XG4gICAgICAgIHNhdmVkX3ZhbHVlc1twcm9wZXJ0eV0gPSB1c2VJbml0aWFsVmFsdWVzID8gY29udHJvbGxlci5pbml0aWFsVmFsdWUgOiBjb250cm9sbGVyLmdldFZhbHVlKCk7XG4gICAgICB9KTtcblxuICAgICAgLy8gU2F2ZSB0aGUgdmFsdWVzIGZvciB0aGNvbW1vbi5pc09iamVjdFxuICAgICAgdG9SZXR1cm5baW5kZXhdID0gc2F2ZWRfdmFsdWVzO1xuXG4gICAgfSk7XG5cbiAgICByZXR1cm4gdG9SZXR1cm47XG5cbiAgfVxuXG4gIGZ1bmN0aW9uIGFkZFByZXNldE9wdGlvbihndWksIG5hbWUsIHNldFNlbGVjdGVkKSB7XG4gICAgdmFyIG9wdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ29wdGlvbicpO1xuICAgIG9wdC5pbm5lckhUTUwgPSBuYW1lO1xuICAgIG9wdC52YWx1ZSA9IG5hbWU7XG4gICAgZ3VpLl9fcHJlc2V0X3NlbGVjdC5hcHBlbmRDaGlsZChvcHQpO1xuICAgIGlmIChzZXRTZWxlY3RlZCkge1xuICAgICAgZ3VpLl9fcHJlc2V0X3NlbGVjdC5zZWxlY3RlZEluZGV4ID0gZ3VpLl9fcHJlc2V0X3NlbGVjdC5sZW5ndGggLSAxO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHNldFByZXNldFNlbGVjdEluZGV4KGd1aSkge1xuICAgIGZvciAodmFyIGluZGV4ID0gMDsgaW5kZXggPCBndWkuX19wcmVzZXRfc2VsZWN0Lmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgaWYgKGd1aS5fX3ByZXNldF9zZWxlY3RbaW5kZXhdLnZhbHVlID09IGd1aS5wcmVzZXQpIHtcbiAgICAgICAgZ3VpLl9fcHJlc2V0X3NlbGVjdC5zZWxlY3RlZEluZGV4ID0gaW5kZXg7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gbWFya1ByZXNldE1vZGlmaWVkKGd1aSwgbW9kaWZpZWQpIHtcbiAgICB2YXIgb3B0ID0gZ3VpLl9fcHJlc2V0X3NlbGVjdFtndWkuX19wcmVzZXRfc2VsZWN0LnNlbGVjdGVkSW5kZXhdO1xuICAgIC8vICAgIGNvbnNvbGUubG9nKCdtYXJrJywgbW9kaWZpZWQsIG9wdCk7XG4gICAgaWYgKG1vZGlmaWVkKSB7XG4gICAgICBvcHQuaW5uZXJIVE1MID0gb3B0LnZhbHVlICsgXCIqXCI7XG4gICAgfSBlbHNlIHtcbiAgICAgIG9wdC5pbm5lckhUTUwgPSBvcHQudmFsdWU7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gdXBkYXRlRGlzcGxheXMoY29udHJvbGxlckFycmF5KSB7XG5cblxuICAgIGlmIChjb250cm9sbGVyQXJyYXkubGVuZ3RoICE9IDApIHtcblxuICAgICAgcmFmKGZ1bmN0aW9uKCkge1xuICAgICAgICB1cGRhdGVEaXNwbGF5cyhjb250cm9sbGVyQXJyYXkpO1xuICAgICAgfSk7XG5cbiAgICB9XG5cbiAgICBjb21tb24uZWFjaChjb250cm9sbGVyQXJyYXksIGZ1bmN0aW9uKGMpIHtcbiAgICAgIGMudXBkYXRlRGlzcGxheSgpO1xuICAgIH0pO1xuXG4gIH1cblxuICBmdW5jdGlvbiB1cGRhdGVBbGwocm9vdCkge1xuICAgIC8vIEl0ZXJhdGUgb3ZlciBhbGwgY29udHJvbGxlcnNcbiAgICB1cGRhdGVDb250cm9sbGVycyhyb290Ll9fY29udHJvbGxlcnMpO1xuICAgIE9iamVjdC5rZXlzKHJvb3QuX19mb2xkZXJzKS5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgICAgdXBkYXRlQWxsKHJvb3QuX19mb2xkZXJzW2tleV0pO1xuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gdXBkYXRlQ29udHJvbGxlcnMoY29udHJvbGxlcnMpIHtcbiAgICBmb3IgKHZhciBpIGluIGNvbnRyb2xsZXJzKSB7XG4gICAgICBjb250cm9sbGVyc1tpXS51cGRhdGVEaXNwbGF5KCk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIEdVSTtcbn1cbiIsIi8qKlxuICogZGF0LWd1aSBKYXZhU2NyaXB0IENvbnRyb2xsZXIgTGlicmFyeVxuICogaHR0cDovL2NvZGUuZ29vZ2xlLmNvbS9wL2RhdC1ndWlcbiAqXG4gKiBDb3B5cmlnaHQgMjAxMSBEYXRhIEFydHMgVGVhbSwgR29vZ2xlIENyZWF0aXZlIExhYlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNvbW1vbigpO1xuXG5mdW5jdGlvbiBjb21tb24oKSB7XG5cbiAgdmFyIEFSUl9FQUNIID0gQXJyYXkucHJvdG90eXBlLmZvckVhY2g7XG4gIHZhciBBUlJfU0xJQ0UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2U7XG5cbiAgLyoqXG4gICAqIEJhbmQtYWlkIG1ldGhvZHMgZm9yIHRoaW5ncyB0aGF0IHNob3VsZCBiZSBhIGxvdCBlYXNpZXIgaW4gSmF2YVNjcmlwdC5cbiAgICogSW1wbGVtZW50YXRpb24gYW5kIHN0cnVjdHVyZSBpbnNwaXJlZCBieSB1bmRlcnNjb3JlLmpzXG4gICAqIGh0dHA6Ly9kb2N1bWVudGNsb3VkLmdpdGh1Yi5jb20vdW5kZXJzY29yZS9cbiAgICovXG5cbiAgcmV0dXJuIHtcblxuICAgIEJSRUFLOiB7fSxcblxuICAgIGV4dGVuZDogZnVuY3Rpb24odGFyZ2V0KSB7XG5cbiAgICAgIHRoaXMuZWFjaChBUlJfU0xJQ0UuY2FsbChhcmd1bWVudHMsIDEpLCBmdW5jdGlvbihvYmopIHtcblxuICAgICAgICBmb3IgKHZhciBrZXkgaW4gb2JqKVxuICAgICAgICAgIGlmICghdGhpcy5pc1VuZGVmaW5lZChvYmpba2V5XSkpXG4gICAgICAgICAgICB0YXJnZXRba2V5XSA9IG9ialtrZXldO1xuXG4gICAgICB9LCB0aGlzKTtcblxuICAgICAgcmV0dXJuIHRhcmdldDtcblxuICAgIH0sXG5cbiAgICBkZWZhdWx0czogZnVuY3Rpb24odGFyZ2V0KSB7XG5cbiAgICAgIHRoaXMuZWFjaChBUlJfU0xJQ0UuY2FsbChhcmd1bWVudHMsIDEpLCBmdW5jdGlvbihvYmopIHtcblxuICAgICAgICBmb3IgKHZhciBrZXkgaW4gb2JqKVxuICAgICAgICAgIGlmICh0aGlzLmlzVW5kZWZpbmVkKHRhcmdldFtrZXldKSlcbiAgICAgICAgICAgIHRhcmdldFtrZXldID0gb2JqW2tleV07XG5cbiAgICAgIH0sIHRoaXMpO1xuXG4gICAgICByZXR1cm4gdGFyZ2V0O1xuXG4gICAgfSxcblxuICAgIGNvbXBvc2U6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHRvQ2FsbCA9IEFSUl9TTElDRS5jYWxsKGFyZ3VtZW50cyk7XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHZhciBhcmdzID0gQVJSX1NMSUNFLmNhbGwoYXJndW1lbnRzKTtcbiAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IHRvQ2FsbC5sZW5ndGggLTE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICAgICAgYXJncyA9IFt0b0NhbGxbaV0uYXBwbHkodGhpcywgYXJncyldO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHJldHVybiBhcmdzWzBdO1xuICAgICAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgZWFjaDogZnVuY3Rpb24ob2JqLCBpdHIsIHNjb3BlKSB7XG5cbiAgICAgIGlmICghb2JqKSByZXR1cm47XG5cbiAgICAgIGlmIChBUlJfRUFDSCAmJiBvYmouZm9yRWFjaCAmJiBvYmouZm9yRWFjaCA9PT0gQVJSX0VBQ0gpIHtcblxuICAgICAgICBvYmouZm9yRWFjaChpdHIsIHNjb3BlKTtcblxuICAgICAgfSBlbHNlIGlmIChvYmoubGVuZ3RoID09PSBvYmoubGVuZ3RoICsgMCkgeyAvLyBJcyBudW1iZXIgYnV0IG5vdCBOYU5cblxuICAgICAgICBmb3IgKHZhciBrZXkgPSAwLCBsID0gb2JqLmxlbmd0aDsga2V5IDwgbDsga2V5KyspXG4gICAgICAgICAgaWYgKGtleSBpbiBvYmogJiYgaXRyLmNhbGwoc2NvcGUsIG9ialtrZXldLCBrZXkpID09PSB0aGlzLkJSRUFLKVxuICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICB9IGVsc2Uge1xuXG4gICAgICAgIGZvciAodmFyIGtleSBpbiBvYmopXG4gICAgICAgICAgaWYgKGl0ci5jYWxsKHNjb3BlLCBvYmpba2V5XSwga2V5KSA9PT0gdGhpcy5CUkVBSylcbiAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgfVxuXG4gICAgfSxcblxuICAgIGRlZmVyOiBmdW5jdGlvbihmbmMpIHtcbiAgICAgIHNldFRpbWVvdXQoZm5jLCAwKTtcbiAgICB9LFxuXG4gICAgdG9BcnJheTogZnVuY3Rpb24ob2JqKSB7XG4gICAgICBpZiAob2JqLnRvQXJyYXkpIHJldHVybiBvYmoudG9BcnJheSgpO1xuICAgICAgcmV0dXJuIEFSUl9TTElDRS5jYWxsKG9iaik7XG4gICAgfSxcblxuICAgIGlzVW5kZWZpbmVkOiBmdW5jdGlvbihvYmopIHtcbiAgICAgIHJldHVybiBvYmogPT09IHVuZGVmaW5lZDtcbiAgICB9LFxuXG4gICAgaXNOdWxsOiBmdW5jdGlvbihvYmopIHtcbiAgICAgIHJldHVybiBvYmogPT09IG51bGw7XG4gICAgfSxcblxuICAgIGlzTmFOOiBmdW5jdGlvbihvYmopIHtcbiAgICAgIHJldHVybiBvYmogIT09IG9iajtcbiAgICB9LFxuXG4gICAgaXNBcnJheTogQXJyYXkuaXNBcnJheSB8fCBmdW5jdGlvbihvYmopIHtcbiAgICAgIHJldHVybiBvYmouY29uc3RydWN0b3IgPT09IEFycmF5O1xuICAgIH0sXG5cbiAgICBpc09iamVjdDogZnVuY3Rpb24ob2JqKSB7XG4gICAgICByZXR1cm4gb2JqID09PSBPYmplY3Qob2JqKTtcbiAgICB9LFxuXG4gICAgaXNOdW1iZXI6IGZ1bmN0aW9uKG9iaikge1xuICAgICAgcmV0dXJuIG9iaiA9PT0gb2JqKzA7XG4gICAgfSxcblxuICAgIGlzU3RyaW5nOiBmdW5jdGlvbihvYmopIHtcbiAgICAgIHJldHVybiBvYmogPT09IG9iaisnJztcbiAgICB9LFxuXG4gICAgaXNCb29sZWFuOiBmdW5jdGlvbihvYmopIHtcbiAgICAgIHJldHVybiBvYmogPT09IGZhbHNlIHx8IG9iaiA9PT0gdHJ1ZTtcbiAgICB9LFxuXG4gICAgaXNGdW5jdGlvbjogZnVuY3Rpb24ob2JqKSB7XG4gICAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iaikgPT09ICdbb2JqZWN0IEZ1bmN0aW9uXSc7XG4gICAgfVxuXG4gIH07XG59XG4iLCIvKipcbiAqIGRhdC1ndWkgSmF2YVNjcmlwdCBDb250cm9sbGVyIExpYnJhcnlcbiAqIGh0dHA6Ly9jb2RlLmdvb2dsZS5jb20vcC9kYXQtZ3VpXG4gKlxuICogQ29weXJpZ2h0IDIwMTEgRGF0YSBBcnRzIFRlYW0sIEdvb2dsZSBDcmVhdGl2ZSBMYWJcbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gY3NzKCk7XG5cbmZ1bmN0aW9uIGNzcygpIHtcbiAgcmV0dXJuIHtcbiAgICBsb2FkOiBmdW5jdGlvbiAodXJsLCBkb2MpIHtcbiAgICAgIGRvYyA9IGRvYyB8fCBkb2N1bWVudDtcbiAgICAgIHZhciBsaW5rID0gZG9jLmNyZWF0ZUVsZW1lbnQoJ2xpbmsnKTtcbiAgICAgIGxpbmsudHlwZSA9ICd0ZXh0L2Nzcyc7XG4gICAgICBsaW5rLnJlbCA9ICdzdHlsZXNoZWV0JztcbiAgICAgIGxpbmsuaHJlZiA9IHVybDtcbiAgICAgIGRvYy5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaGVhZCcpWzBdLmFwcGVuZENoaWxkKGxpbmspO1xuICAgIH0sXG4gICAgaW5qZWN0OiBmdW5jdGlvbihjc3MsIGRvYykge1xuICAgICAgZG9jID0gZG9jIHx8IGRvY3VtZW50O1xuICAgICAgdmFyIGluamVjdGVkID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcbiAgICAgIGluamVjdGVkLnR5cGUgPSAndGV4dC9jc3MnO1xuICAgICAgaW5qZWN0ZWQuaW5uZXJIVE1MID0gY3NzO1xuICAgICAgZG9jLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoZWFkJylbMF0uYXBwZW5kQ2hpbGQoaW5qZWN0ZWQpO1xuICAgIH1cbiAgfTtcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZXNjYXBlO1xuXG52YXIgZW50aXR5TWFwID0ge1xuICBcIiZcIjogXCImYW1wO1wiLFxuICBcIjxcIjogXCImbHQ7XCIsXG4gIFwiPlwiOiBcIiZndDtcIixcbiAgJ1wiJzogJyZxdW90OycsXG4gIFwiJ1wiOiAnJiMzOTsnLFxuICBcIi9cIjogJyYjeDJGOydcbn07XG5cbmZ1bmN0aW9uIGVzY2FwZShzdHJpbmcpIHtcbiAgcmV0dXJuIFN0cmluZyhzdHJpbmcpLnJlcGxhY2UoL1smPD5cIidcXC9dL2csIGZ1bmN0aW9uKHMpIHtcbiAgICByZXR1cm4gZW50aXR5TWFwW3NdO1xuICB9KTtcbn1cbiIsIi8qKlxuICogZGF0LWd1aSBKYXZhU2NyaXB0IENvbnRyb2xsZXIgTGlicmFyeVxuICogaHR0cDovL2NvZGUuZ29vZ2xlLmNvbS9wL2RhdC1ndWlcbiAqXG4gKiBDb3B5cmlnaHQgMjAxMSBEYXRhIEFydHMgVGVhbSwgR29vZ2xlIENyZWF0aXZlIExhYlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqL1xubW9kdWxlLmV4cG9ydHMgPSByYWYoKTtcblxuZnVuY3Rpb24gcmFmKCkge1xuXG4gIC8qKlxuICAgKiByZXF1aXJlanMgdmVyc2lvbiBvZiBQYXVsIElyaXNoJ3MgUmVxdWVzdEFuaW1hdGlvbkZyYW1lXG4gICAqIGh0dHA6Ly9wYXVsaXJpc2guY29tLzIwMTEvcmVxdWVzdGFuaW1hdGlvbmZyYW1lLWZvci1zbWFydC1hbmltYXRpbmcvXG4gICAqL1xuXG4gIHJldHVybiB3aW5kb3cud2Via2l0UmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XG4gICAgICB3aW5kb3cubW96UmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XG4gICAgICB3aW5kb3cub1JlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxuICAgICAgd2luZG93Lm1zUmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XG4gICAgICBmdW5jdGlvbihjYWxsYmFjaywgZWxlbWVudCkge1xuXG4gICAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KGNhbGxiYWNrLCAxMDAwIC8gNjApO1xuXG4gICAgICB9O1xufVxuIiwiLyoqIEBsaWNlbnNlXG4gKiBkYXQtZ3VpIEphdmFTY3JpcHQgQ29udHJvbGxlciBMaWJyYXJ5XG4gKiBodHRwOi8vY29kZS5nb29nbGUuY29tL3AvZGF0LWd1aVxuICpcbiAqIENvcHlyaWdodCAyMDExIERhdGEgQXJ0cyBUZWFtLCBHb29nbGUgQ3JlYXRpdmUgTGFiXG4gKiBDb3B5cmlnaHQgMjAxNSBBbmRyZWkgS2FzaGNoYVxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqL1xubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGNvbG9yOiB7XG4gICAgbWF0aDogcmVxdWlyZSgnLi9kYXQvY29sb3IvbWF0aC5qcycpLFxuICAgIGludGVycHJldDogcmVxdWlyZSgnLi9kYXQvY29sb3IvaW50ZXJwcmV0LmpzJyksXG4gICAgQ29sb3I6IHJlcXVpcmUoJy4vZGF0L2NvbG9yL0NvbG9yLmpzJylcbiAgfSxcbiAgZG9tOiB7XG4gICAgZG9tOiByZXF1aXJlKCcuL2RhdC9kb20vZG9tLmpzJylcbiAgfSxcbiAgY29udHJvbGxlcnM6IHtcbiAgICBDb250cm9sbGVyOiByZXF1aXJlKCcuL2RhdC9jb250cm9sbGVycy9Db250cm9sbGVyLmpzJyksXG4gICAgQm9vbGVhbkNvbnRyb2xsZXI6IHJlcXVpcmUoJy4vZGF0L2NvbnRyb2xsZXJzL0Jvb2xlYW5Db250cm9sbGVyLmpzJyksXG4gICAgT3B0aW9uQ29udHJvbGxlcjogcmVxdWlyZSgnLi9kYXQvY29udHJvbGxlcnMvT3B0aW9uQ29udHJvbGxlci5qcycpLFxuICAgIFN0cmluZ0NvbnRyb2xsZXI6IHJlcXVpcmUoJy4vZGF0L2NvbnRyb2xsZXJzL1N0cmluZ0NvbnRyb2xsZXIuanMnKSxcbiAgICBOdW1iZXJDb250cm9sbGVyOiByZXF1aXJlKCcuL2RhdC9jb250cm9sbGVycy9OdW1iZXJDb250cm9sbGVyLmpzJyksXG4gICAgTnVtYmVyQ29udHJvbGxlckJveDogcmVxdWlyZSgnLi9kYXQvY29udHJvbGxlcnMvTnVtYmVyQ29udHJvbGxlckJveC5qcycpLFxuICAgIE51bWJlckNvbnRyb2xsZXJTbGlkZXI6IHJlcXVpcmUoJy4vZGF0L2NvbnRyb2xsZXJzL051bWJlckNvbnRyb2xsZXJTbGlkZXIuanMnKSxcbiAgICBGdW5jdGlvbkNvbnRyb2xsZXI6IHJlcXVpcmUoJy4vZGF0L2NvbnRyb2xsZXJzL0Z1bmN0aW9uQ29udHJvbGxlci5qcycpLFxuICAgIENvbG9yQ29udHJvbGxlcjogcmVxdWlyZSgnLi9kYXQvY29udHJvbGxlcnMvQ29sb3JDb250cm9sbGVyLmpzJyksXG4gIH0sXG4gIGd1aToge1xuICAgIEdVSTogcmVxdWlyZSgnLi9kYXQvZ3VpL0dVSS5qcycpXG4gIH0sXG4gIEdVSTogcmVxdWlyZSgnLi9kYXQvZ3VpL0dVSS5qcycpXG59O1xuIiwiZXhwb3J0IGZ1bmN0aW9uIHJlbGF0aXZlU2NhbGVkSGV4UG9pbnRzKHNpZGVMZW5ndGgpe1xyXG4gICAgbGV0IGNvcm5lcl92ZXJ0aWNhbCA9IE1hdGguc2luKE1hdGguUEkvMykqc2lkZUxlbmd0aDtcclxuICAgIGxldCBjb3JuZXJfaG9yaXpvbnRhbCA9IE1hdGguY29zKE1hdGguUEkvMykqc2lkZUxlbmd0aDtcclxuICAgIHJldHVybiBbXHJcbiAgICAgICAge3g6IC1jb3JuZXJfaG9yaXpvbnRhbCwgeTogLWNvcm5lcl92ZXJ0aWNhbH0sXHJcbiAgICAgICAge3g6ICtjb3JuZXJfaG9yaXpvbnRhbCwgeTogLWNvcm5lcl92ZXJ0aWNhbH0sXHJcbiAgICAgICAge3g6IHNpZGVMZW5ndGgsIHk6IDB9LFxyXG4gICAgICAgIHt4OiArY29ybmVyX2hvcml6b250YWwsIHk6ICtjb3JuZXJfdmVydGljYWx9LFxyXG4gICAgICAgIHt4OiAtY29ybmVyX2hvcml6b250YWwsIHk6ICtjb3JuZXJfdmVydGljYWx9LFxyXG4gICAgICAgIHt4OiAtc2lkZUxlbmd0aCwgeTogMH1cclxuICAgIF07XHJcbn1cclxuIiwiZXhwb3J0IGZ1bmN0aW9uIGdldEFkamFjZW50SGV4YWdvbk9mZnNldChncmlkWCwgc2lkZSl7XHJcbiAgICAvL2V2ZW4gY29sdW1uOiBvZGQgY29sdW1uOiAoYSBtZWFucyBhZGphY2VudCwgKiBtZWFucyBub3QpXHJcbiAgICAvLyphKiAgICAgICAgICBhYWFcclxuICAgIC8vYWhhICAgICAgICAgIGFoYVxyXG4gICAgLy9hYWEgICAgICAgICAgKmEqXHJcbiAgICBsZXQgZGlhZ29uYWxZQWJvdmUgPSAxLWdyaWRYJTI7XHJcbiAgICBsZXQgZGlhZ29uYWxZQmVsb3cgPSAtZ3JpZFglMjtcclxuICAgIC8vYXNzdW1lcyBzaWRlIDAgaXMgdG9wLCBpbmNyZWFzaW5nIGNsb2Nrd2lzZVxyXG4gICAgbGV0IGFkamFjZW50SGV4T2Zmc2V0ID0gW1xyXG4gICAgICAgIHt4OiAwLCB5OiAtMX0sIHt4OiAxLCB5OiBkaWFnb25hbFlCZWxvd30sIHt4OiAxLCB5OiBkaWFnb25hbFlBYm92ZX0sXHJcbiAgICAgICAge3g6IDAsIHk6IDF9LCB7eDogLTEsIHk6IGRpYWdvbmFsWUFib3ZlfSwge3g6IC0xLCB5OiBkaWFnb25hbFlCZWxvd31cclxuICAgIF07XHJcbiAgICByZXR1cm4gYWRqYWNlbnRIZXhPZmZzZXRbc2lkZV07XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRBZGphY2VudEhleGFnb25Db3JkKGNvcmQpe1xyXG4gICAgbGV0IG9mZnNldCA9IGdldEFkamFjZW50SGV4YWdvbk9mZnNldChjb3JkLngsIGNvcmQuc2lkZSk7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHg6IGNvcmQueCArIG9mZnNldC54LFxyXG4gICAgICAgIHk6IGNvcmQueSArIG9mZnNldC55LFxyXG4gICAgICAgIHNpZGU6IChjb3JkLnNpZGUgKyAzKSAlIDZcclxuICAgIH07XHJcbn1cclxuIiwiLy9pZiB3ZSB3YW50IHRvIHBhY2sgcGhhc2VyIGluIHRoZSBidWlsZFxuLy9pbXBvcnQgUGhhc2VyIGZyb20gXCJQaGFzZXJcIjtcbi8vaGFjayBjYXVzZSBodHRwczovL2dpdGh1Yi5jb20vcGhvdG9uc3Rvcm0vcGhhc2VyL2lzc3Vlcy8yNDI0XG4vL3dpbmRvdy5QSVhJID0gcmVxdWlyZSggJ3BoYXNlci9idWlsZC9jdXN0b20vcGl4aScgKTtcbi8vd2luZG93LnAyID0gcmVxdWlyZSggJ3BoYXNlci9idWlsZC9jdXN0b20vcDInICk7XG4vL3dpbmRvdy5QaGFzZXIgPSByZXF1aXJlKCAncGhhc2VyL2J1aWxkL2N1c3RvbS9waGFzZXItc3BsaXQnICk7XG5cbmltcG9ydCAqIGFzIGRhdCBmcm9tIFwiZXhkYXRcIjsvL2Jyb3dzZXJpZnkgZG9lc24ndCBsaWtlIGRhdC5ndWksIHBsdXMgSSBkb24ndCB0aGluayB0aGUgcmVwb3MgZnJvbSB0aGUgbWFpbnRhaW5lciBhbnl3YXlcbmltcG9ydCB7aGV4YWdvblNldHRpbmdzR3VpfSBmcm9tIFwiLi92aWV3cy9oZXhhZ29uLmpzXCI7XG5pbXBvcnQge2NvbWJpbmVkU2lkZVNldHRpbmdzR3VpfSBmcm9tIFwiLi92aWV3cy9jb21iaW5lZFNpZGUuanNcIjtcbmltcG9ydCB7Ym9hcmRTZXR0aW5nc0d1aSwgQm9hcmQgYXMgQm9hcmRWaWV3fSBmcm9tIFwiLi92aWV3cy9ib2FyZC5qc1wiO1xuaW1wb3J0IHtCb2FyZCBhcyBCb2FyZE1vZGVsLCBib2FyZE1vZGVsU2V0dGluZ3NHdWl9IGZyb20gXCIuL21vZGVscy9ib2FyZC5qc1wiO1xuaW1wb3J0ICogYXMgdGVhbUluZm8gZnJvbSBcIi4vdGVhbUluZm8uanNcIjtcbmltcG9ydCAqIGFzIHNpZGVHZW5lcmF0aW9uIGZyb20gXCIuL3NpZGVHZW5lcmF0aW9uLmpzXCI7XG5pbXBvcnQge3NpbmdsZVNpZGVTZXR0aW5nc0d1aX0gZnJvbSBcIi4vdmlld3MvU2luZ2xlU2lkZS5qc1wiO1xuaW1wb3J0IHtjb21iaW5lZFNpZGVHYW1lU2V0dGluZ3NHdWl9IGZyb20gXCIuL21vZGVscy9jb21iaW5lZFNpZGUuanNcIjtcbmltcG9ydCB7c2NvcmVTZXR0aW5nc0d1aX0gZnJvbSBcIi4vc2NvcmUuanNcIjtcblxuZnVuY3Rpb24gY3JlYXRlQm9hcmQoZ2FtZSwgZGF0YVN0cmluZyl7XG4gICAgaWYoZGF0YVN0cmluZyA9PT0gdW5kZWZpbmVkKXtcbiAgICAgICAgbGV0IGdlbmVyYXRpb25GdW5jdGlvbiA9IHNpZGVHZW5lcmF0aW9uLm1hcHBpbmdGb3JEYXRHdWkuZ2V0KGdsb2JhbFBhcmFtcy5zaWRlR2VuZXJhdGlvbik7XG4gICAgICAgIGRhdGFTdHJpbmcgPSBnZW5lcmF0aW9uRnVuY3Rpb24odGVhbUluZm8udGVhbXMsIGdsb2JhbFBhcmFtcy5ncmlkV2lkdGgsIGdsb2JhbFBhcmFtcy5ncmlkSGVpZ2h0KTtcbiAgICB9XG4gICAgbGV0IGJvYXJkTW9kZWwgPSBuZXcgQm9hcmRNb2RlbChkYXRhU3RyaW5nLCBcIm5vcm1hbFwiLCBnYW1lLnNldHRpbmdzR3VpKTtcbiAgICBnbG9iYWxQYXJhbXMuZGF0YVN0cmluZyA9IGJvYXJkTW9kZWwuZGF0YVN0cmluZztcbiAgICBnbG9iYWxQYXJhbXMuc2lkZUdlbmVyYXRpb24gPSBcImRhdGFTdHJpbmdcIjtcbiAgICBsZXQgYm9hcmRWaWV3ID0gbmV3IEJvYXJkVmlldyhnYW1lLCAwLCAwLCBib2FyZE1vZGVsLCBnYW1lLnNldHRpbmdzR3VpKTtcbiAgICBnYW1lLmFkZC5leGlzdGluZyhib2FyZFZpZXcpO1xuICAgIGdhbWUuYm9hcmRWaWV3ID0gYm9hcmRWaWV3O1xufVxuXG5sZXQgbGV2ZWxzID0ge1xuICAgIDA6IFwiKDAsMCkyOjI6MjowOjI6MnwoMCwxKTI6MjoyOjA6MjoyLTAsMCwzLDA6MCwxLDMsMFwiLFxuICAgIDE6IFwiKDAsMCkwOjE6MjoyOjI6MXwoMCwxKTE6MjoyOjI6MTowLTAsMCwwLDA6MCwwLDUsMTowLDEsNSwwOjAsMSw0LDFcIixcbiAgICAyOiBcIigwLDApMjoyOjI6MDoyOjJ8KDAsMSkyOjA6MjoyOjI6MC0wLDEsMSwwOjAsMSw1LDBcIixcbiAgICAzOiBcIigwLDApMDoxOjI6MjoyOjF8KDAsMSkxOjA6MjoyOjI6MC0wLDAsMSwxOjAsMCw1LDE6MCwxLDEsMDowLDEsNSwwXCIsXG4gICAgNDogXCIoMCwwKTI6MjowOjA6MDoyfCgwLDEpMjowOjI6MjoyOjAtMCwxLDEsMDowLDEsNSwwXCIsXG4gICAgNTogXCIoMCwwKTA6MToyOjA6MjoxfCgwLDEpMTowOjI6MToyOjAtMCwwLDEsMTowLDAsNSwxOjAsMSwxLDA6MCwxLDUsMFwiLFxufTtcblxubGV0IGdsb2JhbFBhcmFtcyA9IHtcbiAgICB3aWR0aDogd2luZG93LmlubmVyV2lkdGgsXG4gICAgaGVpZ2h0OiB3aW5kb3cuaW5uZXJIZWlnaHQsXG4gICAgZ3JpZFdpZHRoOiA1LFxuICAgIGdyaWRIZWlnaHQ6IDQsXG4gICAgc2lkZUdlbmVyYXRpb246IFwicmFuZG9tXCIsLy9iZSBuaWNlIHRvIHN0b3JlIGZ1bmN0aW9uIGRpcmVjdGx5IGhlcmUgYnV0IGRvZXNuJ3QgcGxheSBuaWNlIHdpdGggZGF0LWd1aSxcbiAgICBkYXNoQm9hcmRXaWR0aDogd2luZG93LmlubmVyV2lkdGgvMTAsXG4gICAgcHJlc2V0TGV2ZWxzOiBsZXZlbHNcbn07XG5cbmZ1bmN0aW9uIGdsb2JhbFNldHRpbmdzR3VpKHNldHRpbmdzR3VpLCBnYW1lKXtcbiAgICBzZXR0aW5nc0d1aS5hZGQoZ2xvYmFsUGFyYW1zLCAncHJlc2V0TGV2ZWxzJywgbGV2ZWxzKS5saXN0ZW4oKS5vbkZpbmlzaENoYW5nZShmdW5jdGlvbihuZXdEYXRhU3RyaW5nKXtcbiAgICAgICAgZ2FtZS5ib2FyZFZpZXcuZGVzdHJveSgpO1xuICAgICAgICBjcmVhdGVCb2FyZChnYW1lLCBuZXdEYXRhU3RyaW5nKTtcbiAgICB9KTtcbiAgICBsZXQgZ3JhcGhpY3NGb2xkZXIgPSBzZXR0aW5nc0d1aS5hZGRGb2xkZXIoJ21haW4gZ3JhcGhpY3MnKTtcbiAgICBncmFwaGljc0ZvbGRlci5hZGRDb2xvcihnYW1lLnN0YWdlLCAnYmFja2dyb3VuZENvbG9yJyk7XG4gICAgZ3JhcGhpY3NGb2xkZXIuYWRkKGdsb2JhbFBhcmFtcywgJ3dpZHRoJywgMCwgd2luZG93LmlubmVyV2lkdGgpLm9uRmluaXNoQ2hhbmdlKGZ1bmN0aW9uKG5ld1dpZHRoKXtcbiAgICAgICAgZ2FtZS5zY2FsZS5zZXRHYW1lU2l6ZShuZXdXaWR0aCwgZ2FtZS5oZWlnaHQpO1xuICAgICAgICBnYW1lLmJvYXJkVmlldy51cGRhdGVTaWRlTGVuZ3RoKCk7XG4gICAgfSk7XG4gICAgZ3JhcGhpY3NGb2xkZXIuYWRkKGdsb2JhbFBhcmFtcywgJ2hlaWdodCcsIDAsIHdpbmRvdy5pbm5lckhlaWdodCkub25GaW5pc2hDaGFuZ2UoZnVuY3Rpb24obmV3SGVpZ2h0KXtcbiAgICAgICAgZ2FtZS5zY2FsZS5zZXRHYW1lU2l6ZShnYW1lLndpZHRoLCBuZXdIZWlnaHQpO1xuICAgICAgICBnYW1lLmJvYXJkVmlldy51cGRhdGVTaWRlTGVuZ3RoKCk7XG4gICAgfSk7XG4gICAgbGV0IG1hcEZvbGRlciA9IHNldHRpbmdzR3VpLmFkZEZvbGRlcignbWFwIHNldHVwJyk7XG4gICAgbWFwRm9sZGVyLmFkZChnbG9iYWxQYXJhbXMsICdncmlkV2lkdGgnLCAwKS5zdGVwKDEpO1xuICAgIG1hcEZvbGRlci5hZGQoZ2xvYmFsUGFyYW1zLCAnZ3JpZEhlaWdodCcsIDApLnN0ZXAoMSk7XG4gICAgbWFwRm9sZGVyLmFkZChnbG9iYWxQYXJhbXMsICdzaWRlR2VuZXJhdGlvbicsIFtcInJhbmRvbVwiLCBcImV2ZW5cIiwgXCJldmVuUmFuZG9tXCIsIFwiZGF0YVN0cmluZ1wiXSkubGlzdGVuKCkub25GaW5pc2hDaGFuZ2UoZnVuY3Rpb24oZ2VuTWV0aG9kKXtcbiAgICAgICAgZ2FtZS5ib2FyZFZpZXcuZGVzdHJveSgpO1xuICAgICAgICBjcmVhdGVCb2FyZChnYW1lKTtcbiAgICB9KTtcbiAgICAvL3RoaXMgY2FudCBwb2ludCB0byBib2FyZC5kYXRhU3RyaW5nIGJlY2F1c2UgZGF0LWd1aSBkb2Vzbid0IHdvcmsgd2l0aCBnZXR0ZXJzL3NldHRlcnNcbiAgICBtYXBGb2xkZXIuYWRkKGdsb2JhbFBhcmFtcywgJ2RhdGFTdHJpbmcnKS5saXN0ZW4oKS5vbkZpbmlzaENoYW5nZShmdW5jdGlvbihuZXdEYXRhU3RyaW5nKXtcbiAgICAgICAgZ2FtZS5ib2FyZFZpZXcuZGVzdHJveSgpO1xuICAgICAgICBjcmVhdGVCb2FyZChnYW1lLCBuZXdEYXRhU3RyaW5nKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gcHJlbG9hZChnYW1lKXtcbiAgICBnYW1lLmxvYWQuaW1hZ2UoJ2xlZnRfcm90YXRlJywgJy4uLy4uL2J1aWxkL2dyYXBoaWNzL2xlZnRfcm90YXRpb24ucG5nJyk7XG4gICAgZ2FtZS5sb2FkLmltYWdlKCdyaWdodF9yb3RhdGUnLCAnLi4vLi4vYnVpbGQvZ3JhcGhpY3MvcmlnaHRfcm90YXRpb24ucG5nJyk7XG59XG5cbmZ1bmN0aW9uIG9uQ3JlYXRlKGdhbWUpIHtcbiAgICBnYW1lLnN0YWdlLmJhY2tncm91bmRDb2xvciA9IFwiIzY2NjY2NlwiOy8vY29uc2lkZXIgZ3JleSBiZWNhdXNlIGxlc3MgY29udHJhc3RcbiAgICBsZXQgc2V0dGluZ3NHdWkgPSBuZXcgZGF0LkdVSSgpO1xuICAgIGdhbWUuc2V0dGluZ3NHdWkgPSBzZXR0aW5nc0d1aTtcbiAgICBjcmVhdGVCb2FyZChnYW1lLCBsZXZlbHNbMF0pO1xuICAgIGdsb2JhbFNldHRpbmdzR3VpKHNldHRpbmdzR3VpLCBnYW1lKTtcbiAgICBjb21iaW5lZFNpZGVHYW1lU2V0dGluZ3NHdWkoc2V0dGluZ3NHdWkpO1xuICAgIGJvYXJkU2V0dGluZ3NHdWkoc2V0dGluZ3NHdWksIGdhbWUpO1xuICAgIGhleGFnb25TZXR0aW5nc0d1aShzZXR0aW5nc0d1aSk7XG4gICAgY29tYmluZWRTaWRlU2V0dGluZ3NHdWkoc2V0dGluZ3NHdWkpO1xuICAgIHRlYW1JbmZvLnRlYW1JbmZvU2V0dGluZ3NHdWkoc2V0dGluZ3NHdWkpO1xuICAgIHNpbmdsZVNpZGVTZXR0aW5nc0d1aShzZXR0aW5nc0d1aSk7XG4gICAgc2NvcmVTZXR0aW5nc0d1aShzZXR0aW5nc0d1aSk7XG4gICAgYm9hcmRNb2RlbFNldHRpbmdzR3VpKHNldHRpbmdzR3VpKTtcbn1cbmZ1bmN0aW9uIHVwZGF0ZShnYW1lKXt9XG53aW5kb3cub25sb2FkID0gZnVuY3Rpb24oKSB7XG5cdGxldCBnYW1lID0gbmV3IFBoYXNlci5HYW1lKGdsb2JhbFBhcmFtcy53aWR0aCwgZ2xvYmFsUGFyYW1zLmhlaWdodCwgUGhhc2VyLkNBTlZBUywgXCJwaGFzZXJfcGFyZW50XCIsIHtcbiAgICAgICAgcHJlbG9hZDogcHJlbG9hZCxcbiAgICAgICAgY3JlYXRlOiBvbkNyZWF0ZSxcbiAgICAgICAgdXBkYXRlOiB1cGRhdGVcbiAgICB9KTtcbn07XG4iLCJpbXBvcnQgKiBhcyBncmlkTmF2aWdhdGlvbiBmcm9tIFwiLi4vZ3JpZE5hdmlnYXRpb24uanNcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBDaGFyYWN0ZXJ7XHJcbiAgICBjb25zdHJ1Y3Rvcihib2FyZCwgY29yZHMsIHRlYW0pe1xyXG4gICAgICAgIHRoaXMuY29yZHMgPSBjb3JkcztcclxuICAgICAgICB0aGlzLmJvYXJkID0gYm9hcmQ7XHJcbiAgICAgICAgdGhpcy50ZWFtID0gdGVhbTtcclxuICAgICAgICBib2FyZC5nZXRIZXgoY29yZHMueCwgY29yZHMueSkuYWRkTGlzdGVuZXIodGhpcyk7XHJcbiAgICAgICAgbGV0IG90aGVySGV4ID0gZ3JpZE5hdmlnYXRpb24uZ2V0QWRqYWNlbnRIZXhhZ29uQ29yZCh0aGlzLmNvcmRzKTtcclxuICAgICAgICBpZihib2FyZC5nZXRIZXgob3RoZXJIZXgueCwgb3RoZXJIZXgueSkgIT09IHVuZGVmaW5lZCl7XHJcbiAgICAgICAgICAgIGJvYXJkLmdldEhleChvdGhlckhleC54LCBvdGhlckhleC55KS5hZGRMaXN0ZW5lcih0aGlzKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IHgoKXtcclxuICAgICAgICByZXR1cm4gdGhpcy5jb3Jkcy54O1xyXG4gICAgfVxyXG5cclxuICAgIGdldCB5KCl7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY29yZHMueTtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgc2lkZSgpe1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNvcmRzLnNpZGU7XHJcbiAgICB9XHJcblxyXG4gICAgcm90YXRlKGdyaWRDb3JkcywgYW1vdW50KXtcclxuICAgICAgICB0aGlzLmxhc3RSb3RhdGlvbiA9IGFtb3VudDsvL2hhY2sgZm9yIGNoYXJhY3RlciBhbmltYXRpb25cclxuICAgICAgICBsZXQgc2lkZTtcclxuICAgICAgICBpZihncmlkQ29yZHMueCAhPSB0aGlzLnggfHwgZ3JpZENvcmRzLnkgIT0gdGhpcy55KXtcclxuICAgICAgICAgICAgc2lkZSA9ICh0aGlzLnNpZGUgKyAzKSU2O1xyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICBzaWRlID0gdGhpcy5zaWRlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBsZXQgc2lkZVRlYW0gPSB0aGlzLmJvYXJkLmdldEhleChncmlkQ29yZHMueCwgZ3JpZENvcmRzLnkpLnNpZGUoc2lkZSkudGVhbTtcclxuICAgICAgICBpZihzaWRlVGVhbSAhPT0gdGhpcy50ZWFtKXtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZihncmlkQ29yZHMueCAhPSB0aGlzLnggfHwgZ3JpZENvcmRzLnkgIT0gdGhpcy55KXtcclxuICAgICAgICAgICAgdGhpcy5ib2FyZC5nZXRIZXgodGhpcy54LCB0aGlzLnkpLnJlbW92ZUxpc3RlbmVyKHRoaXMpO1xyXG4gICAgICAgICAgICB0aGlzLmNvcmRzID0ge3g6IGdyaWRDb3Jkcy54LCB5OiBncmlkQ29yZHMueSwgc2lkZTogKHRoaXMuY29yZHMuc2lkZSArIDMpJTZ9O1xyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICBsZXQgb3RoZXJIZXhDb3JkID0gZ3JpZE5hdmlnYXRpb24uZ2V0QWRqYWNlbnRIZXhhZ29uQ29yZCh0aGlzKTtcclxuICAgICAgICAgICAgbGV0IG90aGVySGV4ID0gdGhpcy5ib2FyZC5nZXRIZXgob3RoZXJIZXhDb3JkLngsIG90aGVySGV4Q29yZC55KTtcclxuICAgICAgICAgICAgaWYob3RoZXJIZXggIT09IHVuZGVmaW5lZCl7XHJcbiAgICAgICAgICAgICAgICBvdGhlckhleC5yZW1vdmVMaXN0ZW5lcih0aGlzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmNvcmRzLnNpZGUgPSAodGhpcy5jb3Jkcy5zaWRlICsgYW1vdW50KSU2O1xyXG4gICAgICAgIGxldCBvdGhlckhleENvcmQgPSBncmlkTmF2aWdhdGlvbi5nZXRBZGphY2VudEhleGFnb25Db3JkKHRoaXMpO1xyXG4gICAgICAgIGxldCBvdGhlckhleCA9IHRoaXMuYm9hcmQuZ2V0SGV4KG90aGVySGV4Q29yZC54LCBvdGhlckhleENvcmQueSk7XHJcbiAgICAgICAgaWYob3RoZXJIZXggIT09IHVuZGVmaW5lZCl7XHJcbiAgICAgICAgICAgIG90aGVySGV4LmFkZExpc3RlbmVyKHRoaXMpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICBvcHBvc2l0ZVNpZGVNYXRjaGVzKCl7XHJcbiAgICAgICAgbGV0IG90aGVySGV4Q29yZCA9IGdyaWROYXZpZ2F0aW9uLmdldEFkamFjZW50SGV4YWdvbkNvcmQodGhpcyk7XHJcbiAgICAgICAgbGV0IG90aGVySGV4ID0gdGhpcy5ib2FyZC5nZXRIZXgob3RoZXJIZXhDb3JkLngsIG90aGVySGV4Q29yZC55KTtcclxuICAgICAgICBpZihvdGhlckhleCAhPT0gdW5kZWZpbmVkKXtcclxuICAgICAgICAgICAgbGV0IHNpZGVUZWFtID0gb3RoZXJIZXguc2lkZSgodGhpcy5zaWRlICsgMyklNikudGVhbTtcclxuICAgICAgICAgICAgaWYoc2lkZVRlYW0gPT0gdGhpcy50ZWFtKXtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxufVxyXG4iLCJleHBvcnQgY2xhc3MgU2luZ2xlU2lkZXtcclxuICAgIGNvbnN0cnVjdG9yKHRlYW0sIGhleCwgYm9hcmQpe1xyXG4gICAgICAgIHRoaXMudGVhbSA9IHRlYW07XHJcbiAgICAgICAgdGhpcy5oZXggPSBoZXg7XHJcbiAgICAgICAgdGhpcy5ib2FyZCA9IGJvYXJkO1xyXG4gICAgfVxyXG5cclxuICAgIG9uSW5wdXRPdmVyKGNvbWJpbmVkU2lkZVZpZXcsIHBvaW50ZXIpe1xyXG4gICAgICAgIHRoaXMuYm9hcmQuc2VsZWN0U2VjdGlvbih0aGlzKTtcclxuICAgICAgICB0aGlzLnNlbGVjdGVkID0gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICBvbklucHV0T3V0KGNvbWJpbmVkU2lkZVZpZXcsIHBvaW50ZXIpe1xyXG4gICAgICAgIHRoaXMuc2VsZWN0ZWQgPSBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgeCgpe1xyXG4gICAgICAgIHJldHVybiB0aGlzLmhleC5ncmlkQ29yZHMueDtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgeSgpe1xyXG4gICAgICAgIHJldHVybiB0aGlzLmhleC5ncmlkQ29yZHMueTtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgc2lkZSgpe1xyXG4gICAgICAgIHJldHVybiB0aGlzLmhleC5zaWRlTnVtYmVyKHRoaXMpO1xyXG4gICAgfVxyXG5cclxuICAgIGdldCBjb3Jkcygpe1xyXG4gICAgICAgIHJldHVybiB7eDogdGhpcy54LCB5OiB0aGlzLnksIHNpZGU6IHRoaXMuc2lkZX07XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IGFzU3RyaW5nKCl7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMudGVhbS5udW1iZXI7XHJcbiAgICB9XHJcbn1cclxuIiwiaW1wb3J0IHtIZXhhZ29ufSBmcm9tIFwiLi9oZXhhZ29uLmpzXCI7XG5pbXBvcnQge0NvbWJpbmVkU2lkZX0gZnJvbSBcIi4vY29tYmluZWRTaWRlLmpzXCI7XG5pbXBvcnQgKiBhcyB0ZWFtSW5mbyBmcm9tIFwiLi4vdGVhbUluZm8uanNcIjtcbmltcG9ydCAqIGFzIGdyaWROYXZpZ2F0aW9uIGZyb20gXCIuLi9ncmlkTmF2aWdhdGlvbi5qc1wiO1xuaW1wb3J0ICogYXMgc2NvcmUgZnJvbSAnLi4vc2NvcmUuanMnO1xuaW1wb3J0IHtDaGFyYWN0ZXJ9IGZyb20gXCIuL0NoYXJhY3Rlci5qc1wiO1xuXG5sZXQgc2V0dGluZ3MgPSB7XG4gICAgbW9kZTogJ2hvbWUnLFxuICAgIG1hcEVkaXQ6IGZhbHNlXG59O1xuXG5leHBvcnQgZnVuY3Rpb24gYm9hcmRNb2RlbFNldHRpbmdzR3VpKGd1aSl7XG4gICAgbGV0IGJvYXJkRm9sZGVyID0gZ3VpLmFkZEZvbGRlcignYm9hcmQnKTtcbiAgICBib2FyZEZvbGRlci5hZGQoc2V0dGluZ3MsICdtb2RlJywgWydob21lJywgJ25vcm1hbCddKTtcbiAgICBib2FyZEZvbGRlci5hZGQoc2V0dGluZ3MsICdtYXBFZGl0Jyk7XG59XG5cbmV4cG9ydCBjbGFzcyBCb2FyZHtcbiAgICAvL3Bhc3NpbmcgaW4geCBpcyBldmVuIG1vcmUgcmVhc29uIHRvIG1ha2UgdGhpcyBhIHBoYXNlciBvYmplY3RcbiAgICBjb25zdHJ1Y3RvcihkYXRhU3RyaW5nLCBtb2RlLCBndWkpe1xuICAgICAgICB0aGlzLmhleGFnb25zID0gdGhpcy5wYXJzZURhdGFTdHJpbmcoZGF0YVN0cmluZyk7XG4gICAgICAgIHRoaXMuY3JlYXRlQ29tYmluZWRMaW5lcyh0aGlzLmhleEFycmF5KTtcbiAgICAgICAgLy9zZXR0aW5ncy5tb2RlIGluc3RlYWQgb2YgdGhpcy5tb2RlIGlzIGEgaG9yaWJsZSBoYWNrXG4gICAgICAgIHNldHRpbmdzLm1vZGUgPSBtb2RlO1xuICAgIH1cblxuICAgIGdldEhleCh4LCB5KXtcbiAgICAgICAgaWYodGhpcy5oZXhhZ29ucy5nZXQoeCkgIT09IHVuZGVmaW5lZCl7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5oZXhhZ29ucy5nZXQoeCkuZ2V0KHkpO1xuICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBnZXQgZ3JpZFdpZHRoKCl7XG4gICAgICAgIGlmKHRoaXMuaGV4YWdvbnMuc2l6ZSA9PT0gMCl7XG4gICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICByZXR1cm4gTWF0aC5tYXgoLi4udGhpcy5oZXhhZ29ucy5rZXlzKCkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZ2V0IGdyaWRIZWlnaHQoKXtcbiAgICAgICAgbGV0IGN1cnJlbnRNYXggPSAwO1xuICAgICAgICBmb3IobGV0IHJvdyBvZiB0aGlzLmhleGFnb25zLnZhbHVlcygpKXtcbiAgICAgICAgICAgIGN1cnJlbnRNYXggPSBNYXRoLm1heChjdXJyZW50TWF4LCAuLi5yb3cua2V5cygpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY3VycmVudE1heDtcbiAgICB9XG5cbiAgICBkZXN0cm95SGV4KHgsIHkpe1xuICAgICAgICB0aGlzLmhleGFnb25zLmdldCh4KS5kZWxldGUoeSk7XG4gICAgICAgIGZvcihsZXQgc2lkZT0wOyBzaWRlPDY7IHNpZGUrKyl7XG4gICAgICAgICAgICBsZXQgY29tYmluZWRTaWRlID0gdGhpcy5nZXRDb21iaW5lZFNpZGUoe3g6IHgsIHk6IHksIHNpZGU6IHNpZGV9KTtcbiAgICAgICAgICAgIGxldCBhbHRlcm5hdGl2ZUNvcmRzID0gY29tYmluZWRTaWRlLmFsdGVybmF0aXZlQ29yZHM7XG4gICAgICAgICAgICBpZighdGhpcy5oZXhhZ29uRXhpc3RzKHgsIHkpICYmICF0aGlzLmhleGFnb25FeGlzdHMoYWx0ZXJuYXRpdmVDb3Jkcy54LCBhbHRlcm5hdGl2ZUNvcmRzLnkpKXtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbWJpbmVkU2lkZXMuZ2V0KGNvbWJpbmVkU2lkZUNvcmQueCkuZ2V0KGNvbWJpbmVkU2lkZUNvcmQueSkuZGVsZXRlKGNvbWJpbmVkU2lkZUNvcmQuc2lkZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBkZXN0cm95Q29tYmluZWRTaWRlKGNvbWJpbmVkU2lkZUNvcmQpe1xuICAgICAgICB0aGlzLmNvbWJpbmVkU2lkZXMuZ2V0KGNvbWJpbmVkU2lkZUNvcmQueCkuZ2V0KGNvbWJpbmVkU2lkZUNvcmQueSkuZGVsZXRlKGNvbWJpbmVkU2lkZUNvcmQuc2lkZSk7XG4gICAgfVxuXG4gICAgc2VsZWN0U2VjdGlvbihzaW5nbGVTaWRlKXtcbiAgICAgICAgbGV0IGNvbm5lY3Rpb25TZXQgPSBzY29yZS5nZXRDb25uZWN0aW9uU2V0KHNpbmdsZVNpZGUsIHNpbmdsZVNpZGUudGVhbSwgdGhpcyk7XG4gICAgICAgIHRoaXMuc2VsZWN0ZWQgPSBjb25uZWN0aW9uU2V0O1xuICAgIH1cblxuICAgIGN1cnJlbnRTdGF0ZVNjb3JlKHRlYW0pe1xuICAgICAgICBpZihzZXR0aW5ncy5tb2RlID09IFwiaG9tZVwiKXtcbiAgICAgICAgICAgIHJldHVybiBzY29yZS5hbGxUZWFtSG9tZU1vZGUodGhpcywgdGVhbSkuc2NvcmU7XG4gICAgICAgIH1lbHNle1xuICAgICAgICAgICAgcmV0dXJuIHNjb3JlLmFsbFRlYW1TY29yZSh0aGlzLCB0ZWFtKS5zY29yZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHRlYW1IaWdobGlnaHQodGVhbSl7XG4gICAgICAgIGlmKHNldHRpbmdzLm1vZGUgPT0gXCJob21lXCIpe1xuICAgICAgICAgICAgdGhpcy5zZWxlY3RlZCA9IHNjb3JlLmFsbFRlYW1Ib21lTW9kZSh0aGlzLCB0ZWFtKTtcbiAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICB0aGlzLnNlbGVjdGVkID0gc2NvcmUuYWxsVGVhbVNjb3JlKHRoaXMsIHRlYW0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZ2V0Q29tYmluZWRTaWRlKGNvbWJpbmVkU2lkZUNvcmQpe1xuICAgICAgICAvL2FueSBjb21iaW5lZFNpZGUgaGFzIDIgdmFsaWQgY29yZHMsIG9uZSBmb3IgZWFjaCAoeCx5LHNpZGUpIHRoYXQgbWFrZSBpdCB1cFxuICAgICAgICAvL3JlYWxseSB3ZSB3YW50IGEgTWFwIGNsYXNzIHdpdGggY3VzdG9tIGVxdWFsaXR5IG9wZXJhdG9yIGZyb20gY29tYmluZWRTaWRlQ29yZFxuICAgICAgICBsZXQgb3RoZXJDb3JkID0gZ3JpZE5hdmlnYXRpb24uZ2V0QWRqYWNlbnRIZXhhZ29uQ29yZChjb21iaW5lZFNpZGVDb3JkKTtcbiAgICAgICAgZm9yKGxldCBwb3RlbnRpYWxDb3JkIG9mIFtjb21iaW5lZFNpZGVDb3JkLCBvdGhlckNvcmRdKXtcbiAgICAgICAgICAgIGxldCByb3cgPSB0aGlzLmNvbWJpbmVkU2lkZXMuZ2V0KHBvdGVudGlhbENvcmQueCk7XG4gICAgICAgICAgICBpZihyb3cgIT09IHVuZGVmaW5lZCl7XG4gICAgICAgICAgICAgICAgbGV0IGhleCA9IHJvdy5nZXQocG90ZW50aWFsQ29yZC55KTtcbiAgICAgICAgICAgICAgICBpZihoZXggIT09IHVuZGVmaW5lZCl7XG4gICAgICAgICAgICAgICAgICAgIGxldCBjb21iaW5lZFNpZGUgPSBoZXguZ2V0KHBvdGVudGlhbENvcmQuc2lkZSk7XG4gICAgICAgICAgICAgICAgICAgIGlmKGNvbWJpbmVkU2lkZSAhPT0gdW5kZWZpbmVkKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjb21iaW5lZFNpZGU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICBnZXQgaGV4QXJyYXkoKXtcbiAgICAgICAgbGV0IGhleEFycmF5ID0gW107XG4gICAgICAgIGZvcihjb25zdCBoZXhSb3cgb2YgdGhpcy5oZXhhZ29ucy52YWx1ZXMoKSl7XG4gICAgICAgICAgICBoZXhBcnJheSA9IGhleEFycmF5LmNvbmNhdChBcnJheS5mcm9tKGhleFJvdy52YWx1ZXMoKSkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBoZXhBcnJheTtcbiAgICB9XG5cbiAgICBnZXQgY2hhcmFjdGVyQXJyYXkoKXtcbiAgICAgICAgbGV0IGNoYXJhY3RlckFycmF5ID0gW107XG4gICAgICAgIGZvcihjb25zdCBjaGFyYWN0ZXJSb3cgb2YgdGhpcy5jaGFyYWN0ZXJzLnZhbHVlcygpKXtcbiAgICAgICAgICAgIGZvcihjb25zdCBjaGFyYWN0ZXJIZXggb2YgY2hhcmFjdGVyUm93LnZhbHVlcygpKXtcbiAgICAgICAgICAgICAgICBjaGFyYWN0ZXJBcnJheSA9IGNoYXJhY3RlckFycmF5LmNvbmNhdChBcnJheS5mcm9tKGNoYXJhY3RlckhleC52YWx1ZXMoKSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjaGFyYWN0ZXJBcnJheTtcbiAgICB9XG5cbiAgICBnZXQgY29tYmluZWRTaWRlc0FycmF5KCl7XG4gICAgICAgIGxldCBhcnJheSA9IFtdO1xuICAgICAgICBmb3IoY29uc3Qgcm93IG9mIHRoaXMuY29tYmluZWRTaWRlcy52YWx1ZXMoKSl7XG4gICAgICAgICAgICBmb3IoY29uc3QgeHkgb2Ygcm93LnZhbHVlcygpKXtcbiAgICAgICAgICAgICAgICBmb3IoY29uc3QgY29tYmluZWRTaWRlIG9mIHh5LnZhbHVlcygpKXtcbiAgICAgICAgICAgICAgICAgICAgYXJyYXkucHVzaChjb21iaW5lZFNpZGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYXJyYXk7XG4gICAgfVxuXG4gICAgZ2V0IGRhdGFTdHJpbmcoKXtcbiAgICAgICAgbGV0IGhleGFnb25zID0gW107XG4gICAgICAgIGZvcihsZXQgeCBvZiBBcnJheS5mcm9tKHRoaXMuaGV4YWdvbnMua2V5cygpKS5zb3J0KCkpe1xuICAgICAgICAgICAgZm9yKGxldCB5IG9mIEFycmF5LmZyb20odGhpcy5oZXhhZ29ucy5nZXQoeCkua2V5cygpKS5zb3J0KCkpe1xuICAgICAgICAgICAgICAgIGhleGFnb25zLnB1c2goXCIoXCIgKyB4ICsgXCIsXCIgKyB5ICsgXCIpXCIgKyB0aGlzLmdldEhleCh4LHkpLnNpZGVzQXNTdHJpbmcoKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGNoYXJhY3RlcnMgPSBbXTtcbiAgICAgICAgZm9yKGxldCB4IG9mIEFycmF5LmZyb20odGhpcy5jaGFyYWN0ZXJzLmtleXMoKSkuc29ydCgpKXtcbiAgICAgICAgICAgIGZvcihsZXQgeSBvZiBBcnJheS5mcm9tKHRoaXMuY2hhcmFjdGVycy5nZXQoeCkua2V5cygpKS5zb3J0KCkpe1xuICAgICAgICAgICAgICAgIGZvcihsZXQgc2lkZSBvZiBBcnJheS5mcm9tKHRoaXMuY2hhcmFjdGVycy5nZXQoeCkuZ2V0KHkpLmtleXMoKSkuc29ydCgpKXtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGNoYXJhY3RlciA9IHRoaXMuY2hhcmFjdGVycy5nZXQoeCkuZ2V0KHkpLmdldChzaWRlKTtcbiAgICAgICAgICAgICAgICAgICAgY2hhcmFjdGVycy5wdXNoKFtjaGFyYWN0ZXIueCwgY2hhcmFjdGVyLnksIGNoYXJhY3Rlci5zaWRlLCBjaGFyYWN0ZXIudGVhbS5udW1iZXJdLmpvaW4oXCIsXCIpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGhleGFnb25zLmpvaW4oXCJ8XCIpICsgXCItXCIgKyBjaGFyYWN0ZXJzLmpvaW4oXCI6XCIpO1xuICAgIH1cblxuICAgIGhleGFnb25FeGlzdHMoeCx5KXtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0SGV4KHgsIHkpID09PSB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgbW92ZVRvQWRqYWNlbnRDb21iaW5lZFNpZGUoY29tYmluZWRTaWRlQ29yZCwgZGlyZWN0aW9uKXtcbiAgICAgICAgLypyZXR1cm5zIGNvLW9yZGluYXRlcyBvZiBhbiBhZGphY2VudCBjb21iaW5lZFNpZGVcbiAgICAgICAgdGhpcyB3b3JrcyBieSBsb29raW5nIGF0IGEgY29tYmluZWQgc2lkZSBhcyBoYXZpbmcgNCBuZWlnaGJvdXJpbmcgY29tYmluZWRTaWRlc1xuICAgICAgICB0aGVzZSBsb29rIGxpa2UgYSBib3d0aWU6XG4gICAgICAgICBcXC0xICAgICAgICAgICAgICsxICAvXG4gICAgICAgICAgXFwgICAgICAgICAgICAgICAgIC9cbiAgICAgICAgICAgXFwgICAgICAgICAgICAgICAvXG4gICAgICAgICAgICAtLS0tLS0tLS0tLS0tLS1cbiAgICAgICAgICAgLyAgW3N1cHBsaWVkICAgICBcXFxuICAgICAgICAgIC8gICAgaGV4YWdvbiAgICAgICBcXFxuICAgICAgICAgLyAtMiAgIHNpZGVdICAgICAgKzIgXFxcbiAgICAgICAgIFRoaXMgZXhhbXBsZSB3b3VsZCBiZSBpZiBzaWRlPTAgd2FzIHN1cHBsaWVkLlxuICAgICAgICAgRGlyZWN0aW9uIGRlbm90ZXMgd2hpY2ggc3Bva2UgKC0yLC0xLCsxLCsyKSB5b3UncmUgYXNraW5nIGFib3V0LlxuICAgICAgICAgdGhlIG51bWJlcmluZyBpcyByZWxhdGl2ZSwgc28gc3Bva2VzIC0yIGFuZCArMiBhcmUgYWx3YXlzIHNpZGVzIG9mIHRoZSBjZW50cmFsIGhleGFnb25cbiAgICAgICAgIGV2ZW4gYXMgc2lkZSBudW1iZXIgY2hhbmdlcy5cbiAgICAgICAgICovXG4gICAgICAgICBsZXQgbmV3Q29yZDtcbiAgICAgICAgIGlmKGRpcmVjdGlvbiA9PT0gLTIpe1xuICAgICAgICAgICAgbmV3Q29yZCA9IHtcbiAgICAgICAgICAgICAgICAgeDogY29tYmluZWRTaWRlQ29yZC54LFxuICAgICAgICAgICAgICAgICB5OiBjb21iaW5lZFNpZGVDb3JkLnksXG4gICAgICAgICAgICAgICAgIHNpZGU6IChjb21iaW5lZFNpZGVDb3JkLnNpZGUgLSAxICsgNiklNiAvLys2IHRvIHN0b3AgbmVnYWF0aXZlc1xuICAgICAgICAgICAgIH07XG4gICAgICAgICB9ZWxzZSBpZihkaXJlY3Rpb24gPT09ICsyKXtcbiAgICAgICAgICAgICBuZXdDb3JkID0ge1xuICAgICAgICAgICAgICAgICB4OiBjb21iaW5lZFNpZGVDb3JkLngsXG4gICAgICAgICAgICAgICAgIHk6IGNvbWJpbmVkU2lkZUNvcmQueSxcbiAgICAgICAgICAgICAgICAgc2lkZTogKGNvbWJpbmVkU2lkZUNvcmQuc2lkZSArIDEpJTZcbiAgICAgICAgICAgICB9O1xuICAgICAgICAgfWVsc2UgaWYoZGlyZWN0aW9uID09PSAtMSl7XG4gICAgICAgICAgICAgbmV3Q29yZCA9IGdyaWROYXZpZ2F0aW9uLmdldEFkamFjZW50SGV4YWdvbkNvcmQoY29tYmluZWRTaWRlQ29yZCk7XG4gICAgICAgICAgICAgbmV3Q29yZC5zaWRlID0gKG5ld0NvcmQuc2lkZSArIDEpJTY7XG4gICAgICAgICB9ZWxzZSBpZihkaXJlY3Rpb24gPT09ICsxKXtcbiAgICAgICAgICAgICAgbmV3Q29yZCA9IGdyaWROYXZpZ2F0aW9uLmdldEFkamFjZW50SGV4YWdvbkNvcmQoY29tYmluZWRTaWRlQ29yZCk7XG4gICAgICAgICAgICAgIG5ld0NvcmQuc2lkZSA9IChuZXdDb3JkLnNpZGUgLSAxICsgNiklNjsgLy8rNiB0byBzdG9wIG5lZ2FhdGl2ZXNcbiAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiaW52YWxpZCBkaXJlY3Rpb24gc3VwcGxpZWQgXCIgKyBkaXJlY3Rpb24pO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiB0aGlzLmdldENvbWJpbmVkU2lkZShuZXdDb3JkKTtcbiAgICB9XG5cbiAgICAvL2NvdWxkIHRoaXMgYmUgc2ltcGxpZmllZCBpZiB3ZSBzdHVjayBhbiBleHRyYSBib2FyZGVyIG9mIFwibm9uLW1vdmVcIiBoZXhhZ29ucyByb3VuZCB0aGUgZWRnZT9cbiAgICAvL3RvIG1ha2Ugc2lkZSBjYWxjcyBzaW1wbGlmZXJcbiAgICBjcmVhdGVDb21iaW5lZExpbmVzKGhleGFnb25zKXtcbiAgICAgICAgdGhpcy5jb21iaW5lZFNpZGVzID0gbmV3IE1hcCgpO1xuICAgICAgICBmb3IobGV0IGNlbnRlckhleGFnb24gb2YgaGV4YWdvbnMpe1xuICAgICAgICAgICAgZm9yKGxldCBzaWRlIG9mIGNlbnRlckhleGFnb24uc2lkZXMpe1xuICAgICAgICAgICAgICAgIC8vc28gd2UgZG9uJ3QgY3JlYXRlIGV2ZXJ5IGNvbWJpbmUgdHdpY2UpXG4gICAgICAgICAgICAgICAgaWYodGhpcy5nZXRDb21iaW5lZFNpZGUoc2lkZSkgPT09IHVuZGVmaW5lZCl7XG4gICAgICAgICAgICAgICAgICAgIGlmKHRoaXMuY29tYmluZWRTaWRlcy5nZXQoc2lkZS54KSA9PT0gdW5kZWZpbmVkKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY29tYmluZWRTaWRlcy5zZXQoc2lkZS54LCBuZXcgTWFwKCkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGxldCByb3cgPSB0aGlzLmNvbWJpbmVkU2lkZXMuZ2V0KHNpZGUueCk7XG4gICAgICAgICAgICAgICAgICAgIGlmKHJvdy5nZXQoc2lkZS55KSA9PT0gdW5kZWZpbmVkKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJvdy5zZXQoc2lkZS55LCBuZXcgTWFwKCkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGxldCByb3dDb2x1bW4gPSByb3cuZ2V0KHNpZGUueSk7XG4gICAgICAgICAgICAgICAgICAgIHJvd0NvbHVtbi5zZXQoc2lkZS5zaWRlLCBuZXcgQ29tYmluZWRTaWRlKHNpZGUsIHRoaXMpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvL2lzIHRoaXMgYmV0dGVyIGRlZmluZWQgYXMgaGV4YWdvbiBjbGFzcyBtZXRob2Q/XG4gICAgaGV4YWdvbklucHV0KGNsaWNrZWRIZXhhZ29uLCBwb2ludGVyKXtcbiAgICAgICAgaWYoc2V0dGluZ3MubWFwRWRpdCl7XG4gICAgICAgICAgICB0aGlzLmRlc3Ryb3lIZXgoY2xpY2tlZEhleGFnb24uZGF0YS5tb2RlbC54LCBjbGlja2VkSGV4YWdvbi5kYXRhLm1vZGVsLnkpO1xuICAgICAgICAgICAgLy9jbGlja2VkSGV4YWdvbi5nYW1lLndvcmxkLnJlbW92ZShjbGlja2VkSGV4YWdvbik7XG4gICAgICAgICAgICBjbGlja2VkSGV4YWdvbi5raWxsKCk7XG4gICAgICAgICAgICAvL2NsaWNrZWRIZXhhZ29uLmRlc3Ryb3koKTtcbiAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICB0ZWFtSW5mby5tYWtlTW92ZSgpO1xuICAgICAgICAgICAgbGV0IHJvdGF0aW9uQW10XG4gICAgICAgICAgICBpZihjbGlja2VkSGV4YWdvbi5kYXRhLm1vZGVsLnJvdGF0aW9uID09PSBcInJpZ2h0XCIpe1xuICAgICAgICAgICAgICAgIHJvdGF0aW9uQW10ID0gMTtcbiAgICAgICAgICAgIH1lbHNlIGlmKGNsaWNrZWRIZXhhZ29uLmRhdGEubW9kZWwucm90YXRpb24gPT09IFwibGVmdFwiKXtcbiAgICAgICAgICAgICAgICByb3RhdGlvbkFtdCA9IC0xO1xuICAgICAgICAgICAgfWVsc2UgaWYoY2xpY2tlZEhleGFnb24uZGF0YS5tb2RlbC5yb3RhdGlvbiA9PT1cImJvdGhcIil7XG4gICAgICAgICAgICAgICAgLy91c2luZyBjdHJsS2V5IGluc3RlYWQgaGFzIGEgYnVnIGluIHBoYXNlciAyLjYuMiBodHRwczovL2dpdGh1Yi5jb20vcGhvdG9uc3Rvcm0vcGhhc2VyL2lzc3Vlcy8yMTY3XG4gICAgICAgICAgICAgICAgaWYocG9pbnRlci5sZWZ0QnV0dG9uLmFsdEtleSl7XG4gICAgICAgICAgICAgICAgICAgIHJvdGF0aW9uQW10ID0gLTE7XG4gICAgICAgICAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICAgICAgICAgIHJvdGF0aW9uQW10ID0gMTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjbGlja2VkSGV4YWdvbi5kYXRhLm1vZGVsLnJvdGF0ZShyb3RhdGlvbkFtdCk7XG4gICAgICAgICAgICBpZih0ZWFtSW5mby5lbmRPZlJvdW5kKCkpe1xuICAgICAgICAgICAgICAgIGZvcihsZXQgdGVhbSBvZiB0ZWFtSW5mby50ZWFtcyl7XG4gICAgICAgICAgICAgICAgICAgIGlmKHNldHRpbmdzLm1vZGUgPT0gXCJob21lXCIpe1xuICAgICAgICAgICAgICAgICAgICAgICAgdGVhbS5zY29yZSArPSBzY29yZS5hbGxUZWFtSG9tZU1vZGUodGhpcywgdGVhbSkuc2NvcmU7XG4gICAgICAgICAgICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgICAgICAgICAgICAgdGVhbS5zY29yZSArPSBzY29yZS5hbGxUZWFtU2NvcmUodGhpcywgdGVhbSkuc2NvcmU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmNoZWNrV2luQ29uZGl0aW9uKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjaGVja1dpbkNvbmRpdGlvbigpe1xuICAgICAgICBsZXQgdGVhbUNvcmRzID0gbmV3IE1hcCgpO1xuICAgICAgICBmb3IobGV0IGNoYXJhY3RlciBvZiB0aGlzLmNoYXJhY3RlckFycmF5KXtcbiAgICAgICAgICAgIGlmKCF0ZWFtQ29yZHMuaGFzKGNoYXJhY3Rlci50ZWFtKSl7XG4gICAgICAgICAgICAgICAgdGVhbUNvcmRzLnNldChjaGFyYWN0ZXIudGVhbSwgY2hhcmFjdGVyLmNvcmRzKTtcbiAgICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgICAgIGxldCBhbHJlYWR5U2VlbkNvcmRzID0gdGVhbUNvcmRzLmdldChjaGFyYWN0ZXIudGVhbSk7XG4gICAgICAgICAgICAgICAgaWYoIXRoaXMuZ2V0Q29tYmluZWRTaWRlKGFscmVhZHlTZWVuQ29yZHMpLmVxdWFscyhjaGFyYWN0ZXIuY29yZHMpKXtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBhbGVydChcInlvdSB3b24hXCIpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBjaGFyYWN0ZXJJbnB1dChjbGlja2VkQ2hhcmFjdGVyLCBwb2ludGVyKXtcbiAgICAgICAgaWYoc2V0dGluZ3MubWFwRWRpdCl7XG4gICAgICAgICAgICAvL3RoaXMuY2hhcmFjdGVycy5nZXQoeCkuZGVsZXRlKHkpO1xuICAgICAgICAgICAgLy90aGlzLmRlc3Ryb3lIZXgoY2xpY2tlZEhleGFnb24uZGF0YS5tb2RlbC54LCBjbGlja2VkSGV4YWdvbi5kYXRhLm1vZGVsLnkpO1xuICAgICAgICAgICAgY2xpY2tlZENoYXJhY3Rlci5raWxsKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwYXJzZUdyaWRDb3Jkcyhjb3JkRGF0YSl7XG4gICAgICAgIGxldCB3aXRob3V0QnJhY2tldHMgPSBjb3JkRGF0YS5zdWJzdHJpbmcoMSxjb3JkRGF0YS5sZW5ndGgtMSk7XG4gICAgICAgIGxldCBbeCx5XSA9IHdpdGhvdXRCcmFja2V0cy5zcGxpdChcIixcIik7XG4gICAgICAgIHJldHVybiB7eDogcGFyc2VJbnQoeCksIHk6IHBhcnNlSW50KHkpfTtcbiAgICB9XG5cbiAgICBwYXJzZURhdGFTdHJpbmcoZGF0YVN0cmluZyl7XG4gICAgICAgIGxldCBbaGV4YWdvbnNEYXRhLCBjaGFyYWN0ZXJEYXRhXSA9IGRhdGFTdHJpbmcuc3BsaXQoXCItXCIpO1xuICAgICAgICBsZXQgaGV4YWdvbnMgPSBuZXcgTWFwKCk7XG4gICAgICAgIGZvcihsZXQgaGV4YWdvbkRhdGEgb2YgaGV4YWdvbnNEYXRhLnNwbGl0KFwifFwiKSl7XG4gICAgICAgICAgICBpZihoZXhhZ29uRGF0YSA9PSBcIkVcIil7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXQgW2NvcmREYXRhLCBzaWRlRGF0YSwgLi4ucmVzdF0gPSBoZXhhZ29uRGF0YS5zcGxpdChcIilcIik7XG4gICAgICAgICAgICBsZXQgY29yZHMgPSB0aGlzLnBhcnNlR3JpZENvcmRzKGNvcmREYXRhICsgXCIpXCIpO1xuICAgICAgICAgICAgaWYoaGV4YWdvbnMuZ2V0KGNvcmRzLngpID09PSB1bmRlZmluZWQpe1xuICAgICAgICAgICAgICAgIGhleGFnb25zLnNldChjb3Jkcy54LCBuZXcgTWFwKCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaGV4YWdvbnMuZ2V0KGNvcmRzLngpLnNldChjb3Jkcy55LCBuZXcgSGV4YWdvbihzaWRlRGF0YSwgY29yZHMsIHRoaXMpKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmhleGFnb25zID0gaGV4YWdvbnM7XG4gICAgICAgIHRoaXMuY2hhcmFjdGVycyA9IHRoaXMucGFyc2VDaGFyYWN0ZXJzKGNoYXJhY3RlckRhdGEpO1xuICAgICAgICByZXR1cm4gaGV4YWdvbnM7XG4gICAgfVxuXG4gICAgcGFyc2VDaGFyYWN0ZXJzKGNoYXJhY3RlckRhdGEpe1xuICAgICAgICBsZXQgY2hhcmFjdGVycyA9IG5ldyBNYXAoKTtcbiAgICAgICAgaWYoY2hhcmFjdGVyRGF0YSA9PT0gXCJcIil7XG4gICAgICAgICAgICByZXR1cm4gY2hhcmFjdGVycztcbiAgICAgICAgfVxuICAgICAgICBmb3IobGV0IGNoYXJhY3RlckNvcmQgb2YgY2hhcmFjdGVyRGF0YS5zcGxpdChcIjpcIikpe1xuICAgICAgICAgICAgbGV0IFt4LCB5LCBzaWRlLCB0ZWFtXSA9IGNoYXJhY3RlckNvcmQuc3BsaXQoXCIsXCIpLm1hcChOdW1iZXIpO1xuICAgICAgICAgICAgaWYoY2hhcmFjdGVycy5nZXQoeCkgPT09IHVuZGVmaW5lZCl7XG4gICAgICAgICAgICAgICAgY2hhcmFjdGVycy5zZXQoeCwgbmV3IE1hcCgpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldCBjaGFyYWN0ZXJDb2x1bW4gPSBjaGFyYWN0ZXJzLmdldCh4KTtcbiAgICAgICAgICAgIGlmKGNoYXJhY3RlckNvbHVtbi5nZXQoeSkgPT09IHVuZGVmaW5lZCl7XG4gICAgICAgICAgICAgICAgY2hhcmFjdGVyQ29sdW1uLnNldCh5LCBuZXcgTWFwKCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IGNoYXJhY3RlckhleCA9IGNoYXJhY3RlckNvbHVtbi5nZXQoeSk7XG4gICAgICAgICAgICBsZXQgY2hhcmFjdGVyID0gbmV3IENoYXJhY3Rlcih0aGlzLCB7eDogeCwgeTogeSwgc2lkZTogc2lkZX0sIHRlYW1JbmZvLnRlYW1zW3RlYW1dKTtcbiAgICAgICAgICAgIGNoYXJhY3RlckhleC5zZXQoc2lkZSwgY2hhcmFjdGVyKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY2hhcmFjdGVycztcbiAgICB9XG5cbn1cbiIsImltcG9ydCAqIGFzIGdyaWROYXZpZ2F0aW9uIGZyb20gJy4uL2dyaWROYXZpZ2F0aW9uLmpzJztcclxuXHJcbmxldCBzY29yaW5nID0ge1xyXG4gICAgc2luZ2xlQ29sb3I6IDEsXHJcbiAgICBkb3VibGVDb2xvcjogMlxyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGNvbWJpbmVkU2lkZUdhbWVTZXR0aW5nc0d1aShndWkpe1xyXG4gICAgbGV0IGZvbGRlciA9IGd1aS5hZGRGb2xkZXIoJ2NvbWJpbmVkIHNpZGUgZ2FtZSBzZXR0aW5ncycpO1xyXG4gICAgZm9sZGVyLmFkZChzY29yaW5nLCAnc2luZ2xlQ29sb3InLCAwLDUwKS5zdGVwKDEpO1xyXG4gICAgZm9sZGVyLmFkZChzY29yaW5nLCAnZG91YmxlQ29sb3InLCAwLCA1MCkuc3RlcCgxKTtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIENvbWJpbmVkU2lkZXtcclxuICAgIGNvbnN0cnVjdG9yKGNvcmRzLCBib2FyZCl7XHJcbiAgICAgICAgaWYoYm9hcmQuZ2V0SGV4KGNvcmRzLngsIGNvcmRzLnkpID09PSB1bmRlZmluZWQpe1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJjb21iaW5lZCBzaWRlJ3MgZGVmYXVsdCB4LHkgbXVzdCBiZSBhIGhleCBvbiB0aGUgbWFwXCIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnggPSBjb3Jkcy54O1xyXG4gICAgICAgIHRoaXMueSA9IGNvcmRzLnk7XHJcbiAgICAgICAgdGhpcy5zaWRlID0gY29yZHMuc2lkZTtcclxuICAgICAgICB0aGlzLmJvYXJkID0gYm9hcmQ7XHJcbiAgICB9XHJcblxyXG4gICAgb25JbnB1dE92ZXIoY29tYmluZWRTaWRlVmlldywgcG9pbnRlcil7XHJcbiAgICAgICAgLy90aGlzLmJvYXJkLnNlbGVjdFNlY3Rpb24odGhpcyk7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IHNlbGVjdGVkKCl7XHJcbiAgICAgICAgaWYodGhpcy5ib2FyZC5zZWxlY3RlZCAhPT0gdW5kZWZpbmVkKXtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuYm9hcmQuc2VsZWN0ZWQuY29tYmluZWRTaWRlc1Njb3Jlcy5oYXModGhpcyk7XHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIHJldHVybiAwO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBnZXQgc2NvcmUoKXtcclxuICAgICAgICBpZighdGhpcy5zZWxlY3RlZCl7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcImRvbid0IGFzayBhIGNvbWJpbmVkIHNpZGUgZm9yIGl0J3Mgc2NvcmUgd2hlbiBub3QgaGlnaGxpZ2h0ZWQsIG9ubHkgZm9yIHVzZSBieSBzaWRlIHZpZXdcIik7XHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmJvYXJkLnNlbGVjdGVkLnNpZGVTY29yZSh0aGlzKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZXF1YWxzKGNvbWJpbmVkU2lkZUNvcmQpe1xyXG4gICAgICAgICBmdW5jdGlvbiBjb3JkRXF1YWxpdHkoY29yZDEsIGNvcmQyKXtcclxuICAgICAgICAgICAgIHJldHVybiBjb3JkMS54ID09PSBjb3JkMi54ICYmIGNvcmQxLnkgPT09IGNvcmQyLnkgJiYgY29yZDEuc2lkZSA9PT0gY29yZDIuc2lkZTtcclxuICAgICAgICAgfVxyXG4gICAgICAgICByZXR1cm4gY29yZEVxdWFsaXR5KGNvbWJpbmVkU2lkZUNvcmQsIHRoaXMuY29yZHMpIHx8IGNvcmRFcXVhbGl0eShjb21iaW5lZFNpZGVDb3JkLCB0aGlzLmFsdGVybmF0aXZlQ29yZHMpO1xyXG4gICAgfVxyXG5cclxuICAgIGdldCBhbHRlcm5hdGl2ZUNvcmRzKCl7XHJcbiAgICAgICAgcmV0dXJuIGdyaWROYXZpZ2F0aW9uLmdldEFkamFjZW50SGV4YWdvbkNvcmQodGhpcyk7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IGNvcmRzKCl7XHJcbiAgICAgICAgcmV0dXJuIHt4OiB0aGlzLngsIHk6IHRoaXMueSwgc2lkZTogdGhpcy5zaWRlfTtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgaGV4U2lkZVRlYW1zKCl7XHJcbiAgICAgICAgbGV0IHRlYW1JbmZvID0gW107XHJcbiAgICAgICAgZm9yKGxldCBjb3JkcyBvZiBbdGhpcy5jb3JkcywgdGhpcy5hbHRlcm5hdGl2ZUNvcmRzXSl7XHJcbiAgICAgICAgICAgIGxldCBoZXggPSB0aGlzLmJvYXJkLmdldEhleChjb3Jkcy54LCBjb3Jkcy55KTtcclxuICAgICAgICAgICAgaWYoaGV4ICE9PSB1bmRlZmluZWQpe1xyXG4gICAgICAgICAgICAgICAgdGVhbUluZm8ucHVzaChoZXguc2lkZShjb3Jkcy5zaWRlKS50ZWFtKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGVhbUluZm87XHJcbiAgICB9XHJcblxyXG59XHJcbiIsImltcG9ydCB7dGVhbXN9IGZyb20gXCIuLi90ZWFtSW5mby5qc1wiO1xuaW1wb3J0IHtTaW5nbGVTaWRlfSBmcm9tIFwiLi9TaW5nbGVTaWRlLmpzXCI7XG5cbmV4cG9ydCBjbGFzcyBIZXhhZ29ue1xuICAgIGNvbnN0cnVjdG9yKHNpZGVJbmZvLCBncmlkQ29yZHMsIGJvYXJkKXtcbiAgICAgICAgdGhpcy5zaWRlcyA9IFtdO1xuICAgICAgICB0aGlzLmdyaWRDb3JkcyA9IGdyaWRDb3JkcztcbiAgICAgICAgaWYoc2lkZUluZm9bMF0gPT0gXCIhXCIpe1xuICAgICAgICAgICAgdGhpcy5pc0hvbWUgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy50ZWFtID0gdGVhbXNbc2lkZUluZm9bMV1dO1xuICAgICAgICAgICAgZm9yKGxldCBzaWRlQ291bnQgPSAwOyBzaWRlQ291bnQgPCA2OyBzaWRlQ291bnQrKyl7XG4gICAgICAgICAgICAgICAgdGhpcy5zaWRlcy5wdXNoKG5ldyBTaW5nbGVTaWRlKHRoaXMudGVhbSwgdGhpcywgYm9hcmQpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICBsZXQgcm90YXRpb25JbmZvID0gc2lkZUluZm9bMF07XG4gICAgICAgICAgICBpZihyb3RhdGlvbkluZm8gPT0gXCJMXCIpe1xuICAgICAgICAgICAgICAgIHRoaXMucm90YXRpb24gPSBcImxlZnRcIjtcbiAgICAgICAgICAgICAgICBzaWRlSW5mbyA9IHNpZGVJbmZvLnN1YnN0cmluZygxKTtcbiAgICAgICAgICAgIH1lbHNlIGlmKHJvdGF0aW9uSW5mbyA9PSBcIlJcIil7XG4gICAgICAgICAgICAgICAgc2lkZUluZm8gPSBzaWRlSW5mby5zdWJzdHJpbmcoMSk7XG4gICAgICAgICAgICAgICAgdGhpcy5yb3RhdGlvbiA9IFwicmlnaHRcIjtcbiAgICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgICAgIHRoaXMucm90YXRpb24gPSBcImJvdGhcIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvcihsZXQgc2lkZSBvZiBzaWRlSW5mby5zcGxpdChcIjpcIikpe1xuICAgICAgICAgICAgICAgIGxldCB0ZWFtID0gdGVhbXNbc2lkZV07XG4gICAgICAgICAgICAgICAgdGhpcy5zaWRlcy5wdXNoKG5ldyBTaW5nbGVTaWRlKHRlYW0sIHRoaXMsIGJvYXJkKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYodGhpcy5zaWRlcy5sZW5ndGggIT0gNil7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJpbmNvcnJlY3QgbnVtYmVyIG9mIHNpZGVzOiBcIiArIHNpZGVzLmxlbmd0aCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5jb21iaW5lZFNpZGVzID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLmxpc3RlbmVycyA9IG5ldyBTZXQoKTtcbiAgICB9XG5cbiAgICBnZXQgeCgpe1xuICAgICAgICByZXR1cm4gdGhpcy5ncmlkQ29yZHMueDtcbiAgICB9XG5cbiAgICBnZXQgeSgpe1xuICAgICAgICByZXR1cm4gdGhpcy5ncmlkQ29yZHMueTtcbiAgICB9XG5cbiAgICBzaWRlTnVtYmVyKHNpZGUpe1xuICAgICAgICBmb3IobGV0IFtzaWRlTnVtYmVyLCBwb3RlbnRpYWxNYXRjaF0gb2YgdGhpcy5zaWRlcy5lbnRyaWVzKCkpe1xuICAgICAgICAgICAgaWYoc2lkZSA9PT0gcG90ZW50aWFsTWF0Y2gpe1xuICAgICAgICAgICAgICAgIHJldHVybiBzaWRlTnVtYmVyO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgc2lkZShudW1iZXIpe1xuICAgICAgICByZXR1cm4gdGhpcy5zaWRlc1tudW1iZXJdO1xuICAgIH1cblxuICAgIHNpZGVzQXNTdHJpbmcoKXtcbiAgICAgICAgaWYodGhpcy5pc0hvbWUpe1xuICAgICAgICAgICAgcmV0dXJuIFwiIVwiICsgdGhpcy50ZWFtLm51bWJlcjtcbiAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICBsZXQgcm90YXRpb25JbmZvO1xuICAgICAgICAgICAgaWYodGhpcy5yb3RhdGlvbiA9PSBcImxlZnRcIil7XG4gICAgICAgICAgICAgICAgcm90YXRpb25JbmZvID0gXCJMXCI7XG4gICAgICAgICAgICB9ZWxzZSBpZih0aGlzLnJvdGF0aW9uID09IFwicmlnaHRcIil7XG4gICAgICAgICAgICAgICAgcm90YXRpb25JbmZvID0gXCJSXCI7XG4gICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgICByb3RhdGlvbkluZm8gPSBcIlwiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IHNpZGVzID0gW107XG4gICAgICAgICAgICBmb3IobGV0IHNpZGUgb2YgdGhpcy5zaWRlcyl7XG4gICAgICAgICAgICAgICAgc2lkZXMucHVzaChzaWRlLmFzU3RyaW5nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByb3RhdGlvbkluZm8gKyBzaWRlcy5qb2luKFwiOlwiKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJvdGF0ZShhbW91bnQpe1xuICAgICAgICBpZih0aGlzLnJvdGF0aW9uID09IFwibGVmdFwiICYmIGFtb3VudCA+IDApe1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJ0aXJlZCByb3RhdGluZyB3cm9uZyB3YXlcIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1lbHNlIGlmKHRoaXMucm90YXRpb24gPT0gXCJyaWdodFwiICYmIGFtb3VudCA8IDApe1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJ0aXJlZCByb3RhdGluZyB3cm9uZyB3YXlcIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgYW1vdW50ID0gYW1vdW50ICUgNjtcbiAgICAgICAgLy9mb3IgYW50aS1jbG9ja3dpc2VcbiAgICAgICAgaWYoYW1vdW50IDwgMCl7XG4gICAgICAgICAgICBsZXQgYWJzb2x1dGVBbW91bnQgPSBhbW91bnQqLTE7XG4gICAgICAgICAgICBhbW91bnQgPSA2LWFic29sdXRlQW1vdW50O1xuICAgICAgICB9XG4gICAgICAgIGxldCByb3RhdGlvbkFsbG93ZWQgPSBmYWxzZTtcbiAgICAgICAgZm9yKGxldCBsaXN0ZW5lciBvZiB0aGlzLmxpc3RlbmVycyl7XG4gICAgICAgICAgICByb3RhdGlvbkFsbG93ZWQgfD0gbGlzdGVuZXIucm90YXRlKHRoaXMuZ3JpZENvcmRzLCBhbW91bnQpO1xuICAgICAgICB9XG4gICAgICAgIGlmKHJvdGF0aW9uQWxsb3dlZCl7XG4gICAgICAgICAgICBmb3IobGV0IGk9MDtpPGFtb3VudDtpKyspe1xuICAgICAgICAgICAgICAgIHRoaXMuc2lkZXMudW5zaGlmdCh0aGlzLnNpZGVzLnBvcCgpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFkZExpc3RlbmVyKGxpc3RlbmVyKXtcbiAgICAgICAgdGhpcy5saXN0ZW5lcnMuYWRkKGxpc3RlbmVyKTtcbiAgICB9XG5cbiAgICByZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcil7XG4gICAgICAgIHRoaXMubGlzdGVuZXJzLmRlbGV0ZShsaXN0ZW5lcik7XG4gICAgfVxuXG4gICAgZ2V0IGNhblJvdGF0ZSgpe1xuICAgICAgICBmb3IobGV0IGxpc3RlbmVyIG9mIHRoaXMubGlzdGVuZXJzKXtcbiAgICAgICAgICAgIGlmKHRoaXMuc2lkZShsaXN0ZW5lci5zaWRlKS50ZWFtID09PSBsaXN0ZW5lci50ZWFtICYmIHRoaXMueCA9PSBsaXN0ZW5lci54ICYmIHRoaXMueSA9PSBsaXN0ZW5lci55KXtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1lbHNlIGlmKHRoaXMuc2lkZSgobGlzdGVuZXIuc2lkZSArIDMpJTYpLnRlYW0gPT09IGxpc3RlbmVyLnRlYW0pe1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG59XG4iLCJpbXBvcnQgKiBhcyBncmlkTmF2aWdhdGlvbiBmcm9tIFwiLi9ncmlkTmF2aWdhdGlvbi5qc1wiO1xuaW1wb3J0ICogYXMgdGVhbUluZm8gZnJvbSBcIi4vdGVhbUluZm8uanNcIjtcblxubGV0IHNjb3JlU2V0dGluZ3MgPSB7XG4gICAgcGVyU2lkZUluY3JlYXNlOiAxXG59O1xuXG5leHBvcnQgZnVuY3Rpb24gc2NvcmVTZXR0aW5nc0d1aShndWkpe1xuICAgIGxldCBzY29yZUZvbGRlciA9IGd1aS5hZGRGb2xkZXIoJ3Njb3JpbmcnKTtcbiAgICBzY29yZUZvbGRlci5hZGQoc2NvcmVTZXR0aW5ncywgJ3BlclNpZGVJbmNyZWFzZScsIDAsIDIwKS5zdGVwKDEpO1xufVxuXG5jbGFzcyBDb25uZWN0aW9uU2V0e1xuICAgIGNvbnN0cnVjdG9yKGNvbWJpbmVkU2lkZXNTY29yZXMpe1xuICAgICAgICB0aGlzLmNvbWJpbmVkU2lkZXNTY29yZXMgPSBjb21iaW5lZFNpZGVzU2NvcmVzO1xuICAgIH1cblxuICAgIHNpZGVTY29yZShjb21iaW5lZFNpZGUpe1xuICAgICAgICByZXR1cm4gdGhpcy5jb21iaW5lZFNpZGVzU2NvcmVzLmdldChjb21iaW5lZFNpZGUpICogc2NvcmVTZXR0aW5ncy5wZXJTaWRlSW5jcmVhc2U7XG4gICAgfVxuXG4gICAgZ2V0IHNjb3JlKCl7XG4gICAgICAgIGxldCBzY29yZSA9IDA7XG4gICAgICAgIGZvcihsZXQgc2V0UG9zaXRpb24gb2YgdGhpcy5jb21iaW5lZFNpZGVzU2NvcmVzLnZhbHVlcygpKXtcbiAgICAgICAgICAgIHNjb3JlICs9IHNldFBvc2l0aW9uICogc2NvcmVTZXR0aW5ncy5wZXJTaWRlSW5jcmVhc2U7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHNjb3JlO1xuICAgIH1cbn1cblxuY2xhc3MgQ29ubmVjdGlvblNldEdyb3Vwe1xuICAgIGNvbnN0cnVjdG9yKGNvbm5lY3Rpb25TZXRzKXtcbiAgICAgICAgdGhpcy5jb25uZWN0aW9uU2V0cyA9IGNvbm5lY3Rpb25TZXRzO1xuICAgIH1cblxuICAgIC8vdGhpcyBvbmx5IHdvcmtzIGlmIGFsbCBjb25uZWN0aW9uIHNldHMgYXJlIG11dGFseSBleGNsdXNpdmVcbiAgICBnZXQgY29tYmluZWRTaWRlc1Njb3Jlcygpe1xuICAgICAgICBsZXQgYWxsID0gbmV3IE1hcCgpO1xuICAgICAgICBmb3IobGV0IGNvbm5lY3Rpb25TZXQgb2YgdGhpcy5jb25uZWN0aW9uU2V0cyl7XG4gICAgICAgICAgICBmb3IobGV0IFtjb21iaW5lZFNpZGUsIHNjb3JlXSBvZiBjb25uZWN0aW9uU2V0LmNvbWJpbmVkU2lkZXNTY29yZXMuZW50cmllcygpKXtcbiAgICAgICAgICAgICAgICBhbGwuc2V0KGNvbWJpbmVkU2lkZSwgc2NvcmUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhbGw7XG4gICAgfVxuXG4gICAgc2lkZVNjb3JlKGNvbWJpbmVkU2lkZSl7XG4gICAgICAgIGZvcihsZXQgY29ubmVjdGlvblNldCBvZiB0aGlzLmNvbm5lY3Rpb25TZXRzKXtcbiAgICAgICAgICAgIGlmKGNvbm5lY3Rpb25TZXQuY29tYmluZWRTaWRlc1Njb3Jlcy5oYXMoY29tYmluZWRTaWRlKSl7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbm5lY3Rpb25TZXQuc2lkZVNjb3JlKGNvbWJpbmVkU2lkZSkgKiBzY29yZVNldHRpbmdzLnBlclNpZGVJbmNyZWFzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGdldCBzY29yZSgpe1xuICAgICAgICBsZXQgdG90YWxTY29yZSA9IDA7XG4gICAgICAgIGZvcihsZXQgY29ubmVjdGlvblNldCBvZiB0aGlzLmNvbm5lY3Rpb25TZXRzKXtcbiAgICAgICAgICAgIHRvdGFsU2NvcmUgKz0gY29ubmVjdGlvblNldC5zY29yZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdG90YWxTY29yZTtcbiAgICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhbGxUZWFtSG9tZU1vZGUoYm9hcmQsIHRlYW0pe1xuICAgIGxldCBjb25uZWN0aW9uU2V0cyA9IFtdO1xuICAgIGxldCBhbGxTZWFyY2hlZFNpZGVzID0gbmV3IFNldCgpO1xuICAgIGZvcihsZXQgaGV4IG9mIGJvYXJkLmhleEFycmF5KXtcbiAgICAgICAgaWYoaGV4LmlzSG9tZSAmJiBoZXgudGVhbSA9PT0gdGVhbSl7XG4gICAgICAgICAgICAvL2FsbCBzaWRlcyBvZiBhIGhvbWUgYmVsb25nIHRvIHRoZSBzYW1lIHRlYW1cbiAgICAgICAgICAgIGxldCBzdGFydGluZ0NvbWJpbmVkU2lkZSA9IGJvYXJkLmdldENvbWJpbmVkU2lkZShoZXguc2lkZSgwKSk7XG4gICAgICAgICAgICBpZighYWxsU2VhcmNoZWRTaWRlcy5oYXMoc3RhcnRpbmdDb21iaW5lZFNpZGUpKXtcbiAgICAgICAgICAgICAgICBsZXQgbmV3Q29ubmVjdGlvblNldCA9IGdldENvbm5lY3Rpb25TZXQoc3RhcnRpbmdDb21iaW5lZFNpZGUsIHRlYW0sIGJvYXJkKTtcbiAgICAgICAgICAgICAgICBjb25uZWN0aW9uU2V0cy5wdXNoKG5ld0Nvbm5lY3Rpb25TZXQpO1xuICAgICAgICAgICAgICAgIGFsbFNlYXJjaGVkU2lkZXMgPSBuZXcgU2V0KFsuLi5hbGxTZWFyY2hlZFNpZGVzLCAuLi5uZXdDb25uZWN0aW9uU2V0LmNvbWJpbmVkU2lkZXNTY29yZXMua2V5cygpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG5ldyBDb25uZWN0aW9uU2V0R3JvdXAoY29ubmVjdGlvblNldHMpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYWxsVGVhbVNjb3JlKGJvYXJkLCB0ZWFtKXtcbiAgICBsZXQgY29ubmVjdGlvblNldHMgPSBbXTtcbiAgICBsZXQgYWxsU2VhcmNoZWRTaWRlcyA9IG5ldyBTZXQoKTtcbiAgICBmb3IobGV0IGhleCBvZiBib2FyZC5oZXhBcnJheSl7XG4gICAgICAgIGZvcihsZXQgc2lkZSBvZiBoZXguc2lkZXMpe1xuICAgICAgICAgICAgbGV0IHN0YXJ0aW5nQ29tYmluZWRTaWRlID0gYm9hcmQuZ2V0Q29tYmluZWRTaWRlKHNpZGUpO1xuICAgICAgICAgICAgaWYoIWFsbFNlYXJjaGVkU2lkZXMuaGFzKHN0YXJ0aW5nQ29tYmluZWRTaWRlKSl7XG4gICAgICAgICAgICAgICAgbGV0IG5ld0Nvbm5lY3Rpb25TZXQgPSBnZXRDb25uZWN0aW9uU2V0KHN0YXJ0aW5nQ29tYmluZWRTaWRlLCB0ZWFtLCBib2FyZCk7XG4gICAgICAgICAgICAgICAgY29ubmVjdGlvblNldHMucHVzaChuZXdDb25uZWN0aW9uU2V0KTtcbiAgICAgICAgICAgICAgICBhbGxTZWFyY2hlZFNpZGVzID0gbmV3IFNldChbLi4uYWxsU2VhcmNoZWRTaWRlcywgLi4ubmV3Q29ubmVjdGlvblNldC5jb21iaW5lZFNpZGVzU2NvcmVzLmtleXMoKV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBuZXcgQ29ubmVjdGlvblNldEdyb3VwKGNvbm5lY3Rpb25TZXRzKTtcbn1cblxuZnVuY3Rpb24gYWxyZWFkeVVzZWQoY29ubmVjdHMsIGNvbWJpbmVkU2lkZSwgYm9hcmQpe1xuICAgIGZvcihsZXQgY29yZCBvZiBbY29tYmluZWRTaWRlLCBib2FyZC5nZXRDb21iaW5lZFNpZGUoY29tYmluZWRTaWRlLmFsdGVybmF0aXZlQ29yZHMpXSl7XG4gICAgICAgIGZvcihsZXQgY29ubmVjdCBvZiBjb25uZWN0cyl7XG4gICAgICAgICAgICBpZihjb25uZWN0LmdldChjb21iaW5lZFNpZGUpICE9PSB1bmRlZmluZWQpe1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldENvbm5lY3Rpb25TZXQoc3RhcnRDb3JkLCB0ZWFtLCBib2FyZCl7XG4gICAgbGV0IHN0YXJ0Q29tYmluZWRTaWRlID0gYm9hcmQuZ2V0Q29tYmluZWRTaWRlKHN0YXJ0Q29yZCk7XG4gICAgbGV0IGNvbm5lY3Rpb24gPSBuZXcgTWFwKCk7XG4gICAgZm9yKGxldCBuZXh0VGVhbSBvZiBzdGFydENvbWJpbmVkU2lkZS5oZXhTaWRlVGVhbXMpe1xuICAgICAgICBpZih0ZWFtID09PSBuZXh0VGVhbSl7XG4gICAgICAgICAgICBncm93Q29ubmVjdChib2FyZCwgc3RhcnRDb21iaW5lZFNpZGUsIGNvbm5lY3Rpb24sIG5leHRUZWFtKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBuZXcgQ29ubmVjdGlvblNldChjb25uZWN0aW9uKTtcbn1cblxuLy93YXJuaW5nOiBleGlzdGluZyBub2RlcyBpcyBzaGl0dGlseSB1cGRhdGUgaW4gZnVuY3Rpb24sIG5vdCByZXV0cm5lZFxuZnVuY3Rpb24gZ3Jvd0Nvbm5lY3QoYm9hcmQsIGN1cnJlbnRDb21iaW5lZFNpZGUsIGV4aXN0aW5nTm9kZXMsIHRlYW0pe1xuICAgIGV4aXN0aW5nTm9kZXMuc2V0KGN1cnJlbnRDb21iaW5lZFNpZGUsIGV4aXN0aW5nTm9kZXMuc2l6ZSk7XG4gICAgZm9yKGxldCBkaXJlY3Rpb24gb2YgWy0yLC0xLDEsMl0pe1xuICAgICAgICBsZXQgbmV4dENvbWJpbmVkID0gYm9hcmQubW92ZVRvQWRqYWNlbnRDb21iaW5lZFNpZGUoY3VycmVudENvbWJpbmVkU2lkZSwgZGlyZWN0aW9uKTtcbiAgICAgICAgaWYobmV4dENvbWJpbmVkICE9PSB1bmRlZmluZWQgJiYgIWV4aXN0aW5nTm9kZXMuaGFzKG5leHRDb21iaW5lZCkpe1xuICAgICAgICAgICAgZm9yKGxldCBuZXh0VGVhbSBvZiBuZXh0Q29tYmluZWQuaGV4U2lkZVRlYW1zKXtcbiAgICAgICAgICAgICAgICBpZih0ZWFtID09PSBuZXh0VGVhbSl7XG4gICAgICAgICAgICAgICAgICAgIGdyb3dDb25uZWN0KGJvYXJkLCBuZXh0Q29tYmluZWQsIGV4aXN0aW5nTm9kZXMsIHRlYW0pO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG4iLCJleHBvcnQgbGV0IG1hcHBpbmdGb3JEYXRHdWkgPSBuZXcgTWFwKFtcclxuICAgIFtcInJhbmRvbVwiLCByYW5kb21dLFxyXG4gICAgW1wiZXZlblwiLCBldmVuXSxcclxuICAgIFtcImV2ZW5SYW5kb21cIiwgZXZlblJhbmRvbV1cclxuXSk7XHJcblxyXG5mdW5jdGlvbiBnZW5lcmF0ZUNoYXJhY3RlcnMoZ3JpZFdpZHRoLCBncmlkSGVpZ2h0KXtcclxuICAgIGxldCBjaGFyYWN0ZXJzID0gW107XHJcbiAgICAvL3dlIG5lZWQgYXQgbGVhc3QgMiBmb3IgaXQgdG8gYmUgcGxheWFibGVcclxuICAgIGZvcihsZXQgaT0wOyBpPDI7aSsrKXtcclxuICAgICAgICBsZXQgeCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSpncmlkV2lkdGgpO1xyXG4gICAgICAgIGxldCB5ID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpKmdyaWRIZWlnaHQpO1xyXG4gICAgICAgIGxldCBzaWRlID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpKjYpO1xyXG4gICAgICAgIGNoYXJhY3RlcnMucHVzaChbeCwgeSwgc2lkZSwgMF0uam9pbihcIixcIikpO1xyXG4gICAgfVxyXG4gICAgZm9yKGxldCBjaGFyYWN0ZXJfbnVtYmVyPTA7IGNoYXJhY3Rlcl9udW1iZXIgPCAxNTsgY2hhcmFjdGVyX251bWJlcisrKXtcclxuICAgICAgICBpZihNYXRoLnJhbmRvbSgpID4gMC41KXtcclxuICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGxldCB4ID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpKmdyaWRXaWR0aCk7XHJcbiAgICAgICAgbGV0IHkgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkqZ3JpZEhlaWdodCk7XHJcbiAgICAgICAgbGV0IHNpZGUgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkqNik7XHJcbiAgICAgICAgbGV0IHRlYW0gPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkqMik7XHJcbiAgICAgICAgY2hhcmFjdGVycy5wdXNoKFt4LCB5LCBzaWRlLCB0ZWFtXS5qb2luKFwiLFwiKSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gY2hhcmFjdGVycy5qb2luKFwiOlwiKTtcclxufVxyXG5cclxuZnVuY3Rpb24gYnVpbGRCb2FyZChzaWRlR2VuZXJhdG9yLCBncmlkV2lkdGgsIGdyaWRIZWlnaHQpe1xyXG4gICAgbGV0IGhleGFnb25zID0gW107XHJcbiAgICBmb3IobGV0IHg9MDsgeDxncmlkV2lkdGg7IHgrKyl7XHJcbiAgICAgICAgZm9yKGxldCB5PTA7IHk8Z3JpZEhlaWdodDsgeSsrKXtcclxuICAgICAgICAgICAgbGV0IHNpZGVzID0gW107XHJcbiAgICAgICAgICAgIGZvcihsZXQgc2lkZSBvZiBzaWRlR2VuZXJhdG9yKCkpe1xyXG4gICAgICAgICAgICAgICAgc2lkZXMucHVzaChzaWRlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBoZXhhZ29ucy5wdXNoKFwiKFwiICsgeCArIFwiLFwiICsgeSArIFwiKVwiICsgc2lkZXMuam9pbihcIjpcIikpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBoZXhhZ29ucy5qb2luKFwifFwiKSArIFwiLVwiICsgZ2VuZXJhdGVDaGFyYWN0ZXJzKGdyaWRXaWR0aCwgZ3JpZEhlaWdodCk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBldmVuUmFuZG9tV2l0aEhvbWVzKHRlYW1zLCBncmlkV2lkdGgsIGdyaWRIZWlnaHQpe1xyXG4gICAgZnVuY3Rpb24gc2lkZUdlbmVyYXRvcigpe1xyXG4gICAgICAgIGxldCBzaWRlU2VsZWN0aW9uID0gWzAsMCwxLDEsMiwyXTtcclxuICAgICAgICBsZXQgc2lkZXMgPSBbXTtcclxuICAgICAgICBmb3IobGV0IHNpZGVOdW1iZXIgPSAwOyBzaWRlTnVtYmVyIDwgNjsgc2lkZU51bWJlcisrKXtcclxuICAgICAgICAgICAgc2lkZXMucHVzaChzaWRlU2VsZWN0aW9uW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSklNl0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gc2lkZXM7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gYnVpbGRCb2FyZChzaWRlR2VuZXJhdG9yLCBncmlkV2lkdGgsIGdyaWRIZWlnaHQpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZXZlblJhbmRvbSh0ZWFtcywgZ3JpZFdpZHRoLCBncmlkSGVpZ2h0KXtcclxuICAgIGZ1bmN0aW9uIHNpZGVHZW5lcmF0b3IoKXtcclxuICAgICAgICBsZXQgc2lkZVNlbGVjdGlvbiA9IFswLDAsMSwxLDIsMl07XHJcbiAgICAgICAgbGV0IHNpZGVzID0gW107XHJcbiAgICAgICAgZm9yKGxldCBzaWRlTnVtYmVyID0gMDsgc2lkZU51bWJlciA8IDY7IHNpZGVOdW1iZXIrKyl7XHJcbiAgICAgICAgICAgIGxldCBuZXh0U2lkZSA9IHNpZGVTZWxlY3Rpb24uc3BsaWNlKE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSpzaWRlU2VsZWN0aW9uLmxlbmd0aCklc2lkZVNlbGVjdGlvbi5sZW5ndGgsIDEpO1xyXG4gICAgICAgICAgICBzaWRlcy5wdXNoKG5leHRTaWRlWzBdKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHNpZGVzO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGJ1aWxkQm9hcmQoc2lkZUdlbmVyYXRvciwgZ3JpZFdpZHRoLCBncmlkSGVpZ2h0KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHJhbmRvbSh0ZWFtcywgZ3JpZFdpZHRoLCBncmlkSGVpZ2h0KXtcclxuICAgIGZ1bmN0aW9uIHNpZGVHZW5lcmF0b3IoKXtcclxuICAgICAgICBsZXQgc2lkZXMgPSBbMF07XHJcbiAgICAgICAgZm9yKGxldCBzaWRlTnVtYmVyID0gMDsgc2lkZU51bWJlciA8IDU7IHNpZGVOdW1iZXIrKyl7XHJcbiAgICAgICAgICAgIGlmKE1hdGgucmFuZG9tKCkgPiAwLjUpe1xyXG4gICAgICAgICAgICAgICAgc2lkZXMucHVzaChNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkqdGVhbXMubGVuZ3RoKSk7XHJcbiAgICAgICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICAgICAgc2lkZXMudW5zaGlmdChNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkqdGVhbXMubGVuZ3RoKSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBzaWRlcztcclxuICAgIH1cclxuICAgIHJldHVybiBidWlsZEJvYXJkKHNpZGVHZW5lcmF0b3IsIGdyaWRXaWR0aCwgZ3JpZEhlaWdodCk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBldmVuKHRlYW1zLCBncmlkV2lkdGgsIGdyaWRIZWlnaHQpe1xyXG4gICAgZnVuY3Rpb24gc2lkZUdlbmVyYXRvcigpe1xyXG4gICAgICAgIGxldCBzaWRlcyA9IFtdO1xyXG4gICAgICAgIGZvcihsZXQgc2lkZU51bWJlciA9IDA7IHNpZGVOdW1iZXIgPCA2OyBzaWRlTnVtYmVyKyspe1xyXG4gICAgICAgICAgICBzaWRlcy5wdXNoKHNpZGVOdW1iZXIldGVhbXMubGVuZ3RoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHNpZGVzO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGJ1aWxkQm9hcmQoc2lkZUdlbmVyYXRvciwgZ3JpZFdpZHRoLCBncmlkSGVpZ2h0KTtcclxufVxyXG4iLCJleHBvcnQgbGV0IHNldHRpbmdzID0ge1xyXG4gICAgc3RhbmRhcmRNb3ZlTGltaXQ6IDRcclxufTtcclxuXHJcbmV4cG9ydCBsZXQgdGVhbXMgPSBbXHJcbiAgICB7XHJcbiAgICAgICAgbnVtYmVyOiAwLFxyXG4gICAgICAgIGNvbG91cjogMHhmZjAwMDAsXHJcbiAgICAgICAgbW92ZXNMZWZ0OiBzZXR0aW5ncy5zdGFuZGFyZE1vdmVMaW1pdCxcclxuICAgICAgICBzY29yZTogMFxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBudW1iZXI6IDEsXHJcbiAgICAgICAgY29sb3VyOiAweGViZmYwMCxcclxuICAgICAgICBtb3Zlc0xlZnQ6IHNldHRpbmdzLnN0YW5kYXJkTW92ZUxpbWl0LFxyXG4gICAgICAgIHNjb3JlOiAwXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIG51bWJlcjogMixcclxuICAgICAgICBjb2xvdXI6IDB4NjY2NjY2LC8vMHgwMDAwZmYsXHJcbiAgICAgICAgbW92ZXNMZWZ0OiBzZXR0aW5ncy5zdGFuZGFyZE1vdmVMaW1pdCxcclxuICAgICAgICBzY29yZTogMFxyXG4gICAgfVxyXG5dO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHRlYW1JbmZvU2V0dGluZ3NHdWkoZ3VpKXtcclxuICAgIGxldCBmb2xkZXIgPSBndWkuYWRkRm9sZGVyKCd0ZWFtIHNldHRpbnMnKTtcclxuICAgIGZvbGRlci5hZGRDb2xvcih0ZWFtc1swXSwgJ2NvbG91cicpO1xyXG4gICAgZm9sZGVyLmFkZENvbG9yKHRlYW1zWzFdLCAnY29sb3VyJyk7XHJcbiAgICBmb2xkZXIuYWRkQ29sb3IodGVhbXNbMl0sICdjb2xvdXInKTtcclxuICAgIGZvbGRlci5hZGQoc2V0dGluZ3MsICdzdGFuZGFyZE1vdmVMaW1pdCcsIDEsIDEwKS5zdGVwKDEpO1xyXG59XHJcblxyXG5leHBvcnQgbGV0IGN1cnJlbnRUZWFtID0gdGVhbXNbMF07XHJcbmV4cG9ydCBsZXQgY3VycmVudFJvdW5kID0gMDtcclxuZXhwb3J0IGZ1bmN0aW9uIGVuZE9mUm91bmQoKXtcclxuICAgIHJldHVybiBjdXJyZW50VGVhbS5udW1iZXIgPT09IDAgJiYgY3VycmVudFRlYW0ubW92ZXNMZWZ0ID09PSBzZXR0aW5ncy5zdGFuZGFyZE1vdmVMaW1pdDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIG1ha2VNb3ZlKCl7XHJcbiAgICBjdXJyZW50VGVhbS5tb3Zlc0xlZnQgLT0gMTtcclxuICAgIGlmKGN1cnJlbnRUZWFtLm1vdmVzTGVmdCA9PT0gMCl7XHJcbiAgICAgICAgY3VycmVudFRlYW0gPSB0ZWFtc1soY3VycmVudFRlYW0ubnVtYmVyICsgMSkldGVhbXMubGVuZ3RoXTtcclxuICAgICAgICBjdXJyZW50VGVhbS5tb3Zlc0xlZnQgPSBzZXR0aW5ncy5zdGFuZGFyZE1vdmVMaW1pdDtcclxuICAgIH1cclxufVxyXG4iLCJpbXBvcnQgKiBhcyBnZW9tZXRyeSBmcm9tIFwiLi4vZ2VvbWV0cnkuanNcIjtcclxuXHJcbmxldCBsaW5lU3R5bGUgPSB7XHJcbiAgICB0aGlja25lc3M6IDUsXHJcbiAgICBhbHBoYTogMVxyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHNpbmdsZVNpZGVTZXR0aW5nc0d1aShndWkpe1xyXG4gICAgbGV0IGZvbGRlciA9IGd1aS5hZGRGb2xkZXIoJ3NpbmdsZSBzaWRlIGdyYXBoaWNzJyk7XHJcbiAgICBmb2xkZXIuYWRkKGxpbmVTdHlsZSwgJ3RoaWNrbmVzcycsIDAsMjApO1xyXG4gICAgZm9sZGVyLmFkZChsaW5lU3R5bGUsICdhbHBoYScsIDAsIDEpO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgU2luZ2xlU2lkZSBleHRlbmRzIFBoYXNlci5TcHJpdGV7XHJcblxyXG4gICAgY29uc3RydWN0b3IoZ2FtZSwgeCwgeSwgYm9hcmRWaWV3LCBtb2RlbCl7XHJcbiAgICAgICAgc3VwZXIoZ2FtZSwgeCwgeSk7XHJcbiAgICAgICAgdGhpcy5kYXRhLmJvYXJkVmlldyA9IGJvYXJkVmlldztcclxuICAgICAgICB0aGlzLmRhdGEubW9kZWwgPSBtb2RlbDtcclxuICAgICAgICBsZXQgaGV4UG9pbnRzID0gZ2VvbWV0cnkucmVsYXRpdmVTY2FsZWRIZXhQb2ludHModGhpcy5kYXRhLmJvYXJkVmlldy5pbm5lclNpZGVMZW5ndGgpO1xyXG4gICAgICAgIGxldCBzdGFydCA9IGhleFBvaW50c1t0aGlzLmRhdGEubW9kZWwuY29yZHMuc2lkZV07XHJcbiAgICAgICAgdGhpcy5kYXRhLmdyYXBoaWNzID0gbmV3IFBoYXNlci5HcmFwaGljcyhnYW1lLCBzdGFydC54LCBzdGFydC55KTtcclxuICAgICAgICB0aGlzLmFkZENoaWxkKHRoaXMuZGF0YS5ncmFwaGljcyk7XHJcbiAgICAgICAgdGhpcy5kYXRhLmdyYXBoaWNzLmlucHV0RW5hYmxlZCA9IHRydWU7XHJcbiAgICAgICAgdGhpcy5kYXRhLmdyYXBoaWNzLmV2ZW50cy5vbklucHV0T3Zlci5hZGQodGhpcy5kYXRhLm1vZGVsLm9uSW5wdXRPdmVyLCB0aGlzLmRhdGEubW9kZWwpO1xyXG4gICAgICAgIHRoaXMuZGF0YS5ncmFwaGljcy5ldmVudHMub25JbnB1dE91dC5hZGQodGhpcy5kYXRhLm1vZGVsLm9uSW5wdXRPdXQsIHRoaXMuZGF0YS5tb2RlbCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmVmcmVzaFBvc2l0aW9uKCl7XHJcbiAgICAgICAgbGV0IGhleFBvaW50cyA9IGdlb21ldHJ5LnJlbGF0aXZlU2NhbGVkSGV4UG9pbnRzKHRoaXMuZGF0YS5ib2FyZFZpZXcuaW5uZXJTaWRlTGVuZ3RoKTtcclxuICAgICAgICBsZXQgc3RhcnQgPSBoZXhQb2ludHNbdGhpcy5kYXRhLm1vZGVsLmNvcmRzLnNpZGVdO1xyXG4gICAgICAgIHRoaXMuZGF0YS5ncmFwaGljcy54ID0gc3RhcnQueDtcclxuICAgICAgICB0aGlzLmRhdGEuZ3JhcGhpY3MueSA9IHN0YXJ0Lnk7XHJcbiAgICB9XHJcblxyXG4gICAgdXBkYXRlKCl7XHJcbiAgICAgICAgdGhpcy5yZWZyZXNoUG9zaXRpb24oKTtcclxuICAgICAgICBsZXQgZXh0ZXJuYWxUYW5nZW50QW5nbGUgPSA2MDtcclxuICAgICAgICB0aGlzLmRhdGEuZ3JhcGhpY3MuYW5nbGUgPSBleHRlcm5hbFRhbmdlbnRBbmdsZSp0aGlzLmRhdGEubW9kZWwuY29yZHMuc2lkZTtcclxuICAgICAgICB0aGlzLmRhdGEuZ3JhcGhpY3MuY2xlYXIoKTtcclxuICAgICAgICAvL3RoaXMgcmVjdCB1c2VkIGZybyBoaXQgYm94IG9ubHlcclxuICAgICAgICB0aGlzLmRhdGEuZ3JhcGhpY3MuYmVnaW5GaWxsKDAsIDApO1xyXG4gICAgICAgIHRoaXMuZGF0YS5ncmFwaGljcy5kcmF3UmVjdCgwLCAwLCB0aGlzLmRhdGEuYm9hcmRWaWV3LmlubmVyU2lkZUxlbmd0aCxsaW5lU3R5bGUudGhpY2tuZXNzICogMik7XHJcbiAgICAgICAgdGhpcy5kYXRhLmdyYXBoaWNzLmVuZEZpbGwoKTtcclxuICAgICAgICAvL25vdyBkcmF3aW5nXHJcbiAgICAgICAgdGhpcy5kYXRhLmdyYXBoaWNzLmxpbmVTdHlsZShsaW5lU3R5bGUudGhpY2tuZXNzLCB0aGlzLmRhdGEubW9kZWwudGVhbS5jb2xvdXIsIGxpbmVTdHlsZS5hbHBoYSk7XHJcbiAgICAgICAgdGhpcy5kYXRhLmdyYXBoaWNzLm1vdmVUbygwLCAwKTtcclxuICAgICAgICB0aGlzLmRhdGEuZ3JhcGhpY3MubGluZVRvKHRoaXMuZGF0YS5ib2FyZFZpZXcuaW5uZXJTaWRlTGVuZ3RoLCAwKTtcclxuXHJcbiAgICAgICAgaWYodGhpcy5kYXRhLm1vZGVsLnNlbGVjdGVkICYmIGZhbHNlKXtcclxuICAgICAgICAgICAgLy90aGlzIGlzIGdvbm5hIGJlIGEgcmVhbCByZXNvdXJjZSBkcmFpblxyXG4gICAgICAgICAgICAvL3Nob3VsZCBpbnN0ZWFkIHJlbmRlciB0byB0ZXh0dXJlICg2IGRpZmZlcmVudCBvbmVzKSwgdGhlbiByZWFwcGx5XHJcbiAgICAgICAgICAgIGxldCBzdGVwcyA9IDEwO1xyXG4gICAgICAgICAgICBsZXQgbWF4VGhpY2tuZXNzID0gbGluZVN0eWxlLnRoaWNrbmVzcyAqIDU7XHJcbiAgICAgICAgICAgIGxldCB0aGlja25lc3NTdGVwID0gKG1heFRoaWNrbmVzcyAtIGxpbmVTdHlsZS50aGlja25lc3MpL3N0ZXBzO1xyXG4gICAgICAgICAgICBsZXQgYWxwaGEgPSAxL3N0ZXBzOy8vdGhlc2UgbmF0dXJhbHkgc3RhY2ssIHNvIHNjYWxpbmcgd2l0aCBzdGVwIGlzIG5vdCBuZWVkZWRcclxuICAgICAgICAgICAgZm9yKGxldCBzdGVwID0gMDsgc3RlcCA8IHN0ZXBzOyBzdGVwKyspe1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kYXRhLmdyYXBoaWNzLmxpbmVTdHlsZShsaW5lU3R5bGUudGhpY2tuZXNzICsgKHRoaWNrbmVzc1N0ZXAqc3RlcCksIDB4ZmZmZmZmLCBhbHBoYSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRhdGEuZ3JhcGhpY3MubW92ZVRvKDAsIDApO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kYXRhLmdyYXBoaWNzLmxpbmVUbyh0aGlzLmRhdGEuYm9hcmRWaWV3LmlubmVyU2lkZUxlbmd0aCwgMCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuIiwiaW1wb3J0IHtIZXhhZ29ufSBmcm9tIFwiLi9oZXhhZ29uLmpzXCI7XHJcbmltcG9ydCB7Q29tYmluZWRTaWRlfSBmcm9tIFwiLi9jb21iaW5lZFNpZGUuanNcIjtcclxuaW1wb3J0IHtEYXNoYm9hcmR9IGZyb20gXCIuL2Rhc2hib2FyZC5qc1wiO1xyXG5pbXBvcnQgKiBhcyB0ZWFtSW5mbyBmcm9tIFwiLi4vdGVhbUluZm8uanNcIjtcclxuaW1wb3J0IHtDaGFyYWN0ZXJ9IGZyb20gXCIuL2NoYXJhY3Rlci5qc1wiO1xyXG5cclxubGV0IGJvYXJkU2V0dGluZ3MgPSB7XHJcbiAgICBzcGFjZUZhY3RvcjogMC42LFxyXG4gICAgc2lkZUxlbmd0aDogMTBcclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBib2FyZFNldHRpbmdzR3VpKGd1aSwgZ2FtZSl7XHJcbiAgICBsZXQgYm9hcmRWaWV3ID0gZ3VpLmFkZEZvbGRlcignYm9hcmQgdmlldycpO1xyXG4gICAgYm9hcmRWaWV3LmFkZChib2FyZFNldHRpbmdzLCAnc3BhY2VGYWN0b3InLCAwLCAyKTtcclxufVxyXG5cclxuLy90aGlzIGRvZXNudCB3b3JrIHByb3Blcmx5XHJcbmZ1bmN0aW9uIGNhbGN1bGF0ZVNpZGVMZW5ndGgod2lkdGgsIGhlaWdodCwgZ3JpZFdpZHRoLCBncmlkSGVpZ2h0KXtcclxuICAgIGxldCBib2FyZFdpZHRoID0gKDEuNSpncmlkV2lkdGgpKzE7XHJcbiAgICBsZXQgYm9hcmRIZWlnaHQgPSAoMipNYXRoLnNpbihNYXRoLlBJLzMpKmdyaWRIZWlnaHQpKygxLjUqTWF0aC5zaW4oTWF0aC5QSS8zKSk7XHJcbiAgICBpZihib2FyZFdpZHRoID4gYm9hcmRIZWlnaHQpe1xyXG4gICAgICAgIHJldHVybiB3aWR0aC8oMS41KmdyaWRXaWR0aCsxKS8yO1xyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgcmV0dXJuIGhlaWdodC8oKDIqTWF0aC5zaW4oTWF0aC5QSS8zKSpncmlkSGVpZ2h0KSsoMS41Kk1hdGguc2luKE1hdGguUEkvMykpKS8yO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgQm9hcmQgZXh0ZW5kcyBQaGFzZXIuU3ByaXRle1xyXG4gICAgLy9wYXNzaW5nIGluIHggaXMgZXZlbiBtb3JlIHJlYXNvbiB0byBtYWtlIHRoaXMgYSBwaGFzZXIgb2JqZWN0XHJcbiAgICBjb25zdHJ1Y3RvcihnYW1lLCB4LCB5LCBtb2RlbCwgZ3VpLCBzaWRlTGVuZ3RoKXtcclxuICAgICAgICBzdXBlcihnYW1lLCB4LCB5KTtcclxuICAgICAgICB0aGlzLmRhdGEubW9kZWwgPSBtb2RlbDtcclxuICAgICAgICB0aGlzLmRhdGEuZGFzaGJvYXJkID0gbmV3IERhc2hib2FyZChnYW1lLCAwLCAwLCAyMDAsIHRlYW1JbmZvLCB0aGlzLmRhdGEubW9kZWwpO1xyXG4gICAgICAgIHRoaXMuYWRkQ2hpbGQodGhpcy5kYXRhLmRhc2hib2FyZCk7XHJcbiAgICAgICAgaWYoc2lkZUxlbmd0aCA9PT0gdW5kZWZpbmVkKXtcclxuICAgICAgICAgICAgc2lkZUxlbmd0aCA9IHRoaXMuZGVmYXVsdFNpZGVMZW5ndGg7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuZGF0YS5zaWRlTGVuZ3RoID0gc2lkZUxlbmd0aDtcclxuICAgICAgICB0aGlzLmRhdGEuZ3VpID0gZ3VpO1xyXG4gICAgICAgIHRoaXMuZGF0YS5zaWRlTGVuZ3RoR3VpID0gZ3VpLmFkZCh0aGlzLmRhdGEsICdzaWRlTGVuZ3RoJywgc2lkZUxlbmd0aCowLjUsIHNpZGVMZW5ndGgqMik7XHJcbiAgICAgICAgdGhpcy5oZXhhZ29ucyA9IFtdO1xyXG4gICAgICAgIHRoaXMuZGF0YS5nYW1lQm9hcmRHcm91cCA9IG5ldyBQaGFzZXIuR3JvdXAoZ2FtZSwgdGhpcyk7XHJcbiAgICAgICAgdGhpcy5kYXRhLmdhbWVCb2FyZEdyb3VwLnggPSB0aGlzLmRhdGEuZGFzaGJvYXJkLmRhdGEud2lkdGg7XHJcbiAgICAgICAgLy9zaG91bGQgcHV0IGhleCB2ZWl3cyBpbiB0aGVpciBvd24gZ3JvdXBcclxuICAgICAgICBmb3IoY29uc3QgaGV4TW9kZWwgb2YgbW9kZWwuaGV4QXJyYXkpe1xyXG4gICAgICAgICAgICBsZXQgd29ybGRDb3JkcyA9IHRoaXMuY2FsY3VsYXRlV29ybGRDb3JkcyhoZXhNb2RlbC5ncmlkQ29yZHMpO1xyXG4gICAgICAgICAgICBsZXQgaGV4YWdvbiA9IG5ldyBIZXhhZ29uKGdhbWUsIHdvcmxkQ29yZHMueCwgd29ybGRDb3Jkcy55LCB0aGlzLCBtb2RlbC5oZXhhZ29uSW5wdXQsIGhleE1vZGVsKTtcclxuICAgICAgICAgICAgdGhpcy5kYXRhLmdhbWVCb2FyZEdyb3VwLmFkZENoaWxkKGhleGFnb24pO1xyXG4gICAgICAgICAgICB0aGlzLmhleGFnb25zLnB1c2goaGV4YWdvbik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuY29tYmluZWRTaWRlcyA9IFtdO1xyXG4gICAgICAgIGZvcihsZXQgY29tYk1vZGVsIG9mIG1vZGVsLmNvbWJpbmVkU2lkZXNBcnJheSl7XHJcbiAgICAgICAgICAgIGxldCB3b3JsZENvcmRzID0gdGhpcy5jYWxjdWxhdGVXb3JsZENvcmRzKGNvbWJNb2RlbC5jb3Jkcyk7XHJcbiAgICAgICAgICAgIGxldCBjb21iaW5lZFNpZGUgPSBuZXcgQ29tYmluZWRTaWRlKGdhbWUsIHdvcmxkQ29yZHMueCwgd29ybGRDb3Jkcy55LCB0aGlzLCBjb21iTW9kZWwpO1xyXG4gICAgICAgICAgICB0aGlzLmRhdGEuZ2FtZUJvYXJkR3JvdXAuYWRkQ2hpbGQoY29tYmluZWRTaWRlKTtcclxuICAgICAgICAgICAgdGhpcy5jb21iaW5lZFNpZGVzLnB1c2goY29tYmluZWRTaWRlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5jaGFyYWN0ZXJzID0gW107XHJcbiAgICAgICAgZm9yKGxldCBjaGFyYWN0ZXJNb2RlbCBvZiBtb2RlbC5jaGFyYWN0ZXJBcnJheSl7XHJcbiAgICAgICAgICAgIGxldCBjaGFyYWN0ZXIgPSBuZXcgQ2hhcmFjdGVyKGdhbWUsIHRoaXMsIGNoYXJhY3Rlck1vZGVsLCBtb2RlbC5jaGFyYWN0ZXJJbnB1dCk7XHJcbiAgICAgICAgICAgIHRoaXMuZGF0YS5nYW1lQm9hcmRHcm91cC5hZGRDaGlsZChjaGFyYWN0ZXIpO1xyXG4gICAgICAgICAgICB0aGlzLmNoYXJhY3RlcnMucHVzaChjaGFyYWN0ZXIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBkZXN0cm95KGRlc3Ryb3lDaGlsZHJlbiwgZGVzdHJveVRleHR1cmUpe1xyXG4gICAgICAgIHRoaXMuZGF0YS5ndWkucmVtb3ZlKHRoaXMuZGF0YS5zaWRlTGVuZ3RoR3VpKTtcclxuICAgICAgICBzdXBlci5kZXN0cm95KGRlc3Ryb3lDaGlsZHJlbiwgZGVzdHJveVRleHR1cmUpO1xyXG4gICAgfVxyXG5cclxuICAgIGdldCBkZWZhdWx0U2lkZUxlbmd0aCgpe1xyXG4gICAgICAgIHJldHVybiBjYWxjdWxhdGVTaWRlTGVuZ3RoKHRoaXMuZ2FtZS53aWR0aC10aGlzLmRhdGEuZGFzaGJvYXJkLndpZHRoLCB0aGlzLmdhbWUuaGVpZ2h0LCB0aGlzLmRhdGEubW9kZWwuZ3JpZFdpZHRoLCB0aGlzLmRhdGEubW9kZWwuZ3JpZEhlaWdodCk7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IGlubmVyU2lkZUxlbmd0aCgpe1xyXG4gICAgICAgIHJldHVybiBib2FyZFNldHRpbmdzLnNwYWNlRmFjdG9yKnRoaXMuZGF0YS5zaWRlTGVuZ3RoO1xyXG4gICAgfVxyXG5cclxuICAgIGdldCBvdXRlclNpZGVMZW5ndGgoKXtcclxuICAgICAgICByZXR1cm4gdGhpcy5kYXRhLnNpZGVMZW5ndGg7XHJcbiAgICB9XHJcblxyXG4gICAgdXBkYXRlKCl7XHJcbiAgICAgICAgZm9yKGxldCBoZXhhZ29uIG9mIHRoaXMuaGV4YWdvbnMpe1xyXG4gICAgICAgICAgICBoZXhhZ29uLnVwZGF0ZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmb3IobGV0IGNvbWJpbmVkU2lkZSBvZiB0aGlzLmNvbWJpbmVkU2lkZXMpe1xyXG4gICAgICAgICAgICBjb21iaW5lZFNpZGUudXBkYXRlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZvcihsZXQgY2hhcmFjdGVyIG9mIHRoaXMuY2hhcmFjdGVycyl7XHJcbiAgICAgICAgICAgIGNoYXJhY3Rlci51cGRhdGUoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5kYXRhLmRhc2hib2FyZC51cGRhdGUoKTtcclxuICAgIH1cclxuXHJcbiAgICB1cGRhdGVTaWRlTGVuZ3RoKHNpZGVMZW5ndGgpe1xyXG4gICAgICAgIGlmKHNpZGVMZW5ndGggPT09IHVuZGVmaW5lZCl7XHJcbiAgICAgICAgICAgIHNpZGVMZW5ndGggPSB0aGlzLmRlZmF1bHRTaWRlTGVuZ3RoO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmRhdGEuc2lkZUxlbmd0aCA9IHNpZGVMZW5ndGg7XHJcbiAgICB9XHJcblxyXG4gICAgY2FsY3VsYXRlV29ybGRDb3JkcyhncmlkQ29yZHMpe1xyXG4gICAgICAgIGxldCBzcGFjaW5nU2lkZUxlbmd0aCA9IHRoaXMuZGF0YS5zaWRlTGVuZ3RoO1xyXG4gICAgICAgIGxldCB5U3BhY2luZyA9IDIqTWF0aC5zaW4oTWF0aC5QSS8zKSpzcGFjaW5nU2lkZUxlbmd0aDtcclxuICAgICAgICBsZXQgeFNwYWNpbmcgPSBzcGFjaW5nU2lkZUxlbmd0aCoxLjU7XHJcbiAgICAgICAgLy9wbHVzIG9uZXMgc28gd2UgZG9uJ3QgZ2V0IGN1dCBvZmYgYnkgZWRnZSBvZiBtYXBcclxuICAgICAgICBsZXQgcG9zaXRpb24gPSAge1xyXG4gICAgICAgICAgICB4OiAoeFNwYWNpbmcqZ3JpZENvcmRzLngpK3NwYWNpbmdTaWRlTGVuZ3RoLFxyXG4gICAgICAgICAgICB5OiAoeVNwYWNpbmcqZ3JpZENvcmRzLnkpKygyKk1hdGguc2luKE1hdGguUEkvMykqc3BhY2luZ1NpZGVMZW5ndGgpXHJcbiAgICAgICAgfTtcclxuICAgICAgICBsZXQgaXNPZGRDb2x1bW4gPSBncmlkQ29yZHMueCUyPT0xO1xyXG4gICAgICAgIGlmKGlzT2RkQ29sdW1uKXtcclxuICAgICAgICAgICAgcG9zaXRpb24ueSAtPSB5U3BhY2luZy8yO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcG9zaXRpb247XHJcbiAgICB9XHJcbn1cclxuIiwiaW1wb3J0ICogYXMgZ2VvbWV0cnkgZnJvbSBcIi4uL2dlb21ldHJ5LmpzXCI7XHJcblxyXG5sZXQgbGluZVN0eWxlID0ge1xyXG4gICAgdGhpY2tuZXNzOiA1LFxyXG4gICAgYWxwaGE6IDFcclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBzaW5nbGVTaWRlU2V0dGluZ3NHdWkoZ3VpKXtcclxuICAgIGxldCBmb2xkZXIgPSBndWkuYWRkRm9sZGVyKCdzaW5nbGUgc2lkZSBncmFwaGljcycpO1xyXG4gICAgZm9sZGVyLmFkZChsaW5lU3R5bGUsICd0aGlja25lc3MnLCAwLDIwKTtcclxuICAgIGZvbGRlci5hZGQobGluZVN0eWxlLCAnYWxwaGEnLCAwLCAxKTtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIENoYXJhY3RlciBleHRlbmRzIFBoYXNlci5TcHJpdGV7XHJcblxyXG4gICAgY29uc3RydWN0b3IoZ2FtZSwgYm9hcmRWaWV3LCBtb2RlbCwgaW5wdXREb3duQ2FsbGJhY2spe1xyXG4gICAgICAgIHN1cGVyKGdhbWUsIDAsIDApO1xyXG4gICAgICAgIHRoaXMuZGF0YS5ib2FyZFZpZXcgPSBib2FyZFZpZXc7XHJcbiAgICAgICAgdGhpcy5kYXRhLm1vZGVsID0gbW9kZWw7XHJcbiAgICAgICAgbGV0IHdvcmxkQ29yZHMgPSBib2FyZFZpZXcuY2FsY3VsYXRlV29ybGRDb3Jkcyh0aGlzLmRhdGEubW9kZWwuY29yZHMpO1xyXG4gICAgICAgIHRoaXMueCA9IHdvcmxkQ29yZHMueDtcclxuICAgICAgICB0aGlzLnkgPSB3b3JsZENvcmRzLnk7XHJcbiAgICAgICAgdGhpcy5pbnRlcnBvbGF0aW9uID0gMDtcclxuICAgICAgICB0aGlzLmRhdGEuZ3JhcGhpY3MgPSBuZXcgUGhhc2VyLkdyYXBoaWNzKGdhbWUsIDAsIDApO1xyXG4gICAgICAgIHRoaXMuYWRkQ2hpbGQodGhpcy5kYXRhLmdyYXBoaWNzKTtcclxuICAgICAgICB0aGlzLmRhdGEub2xkU2lkZSA9IHRoaXMuZGF0YS5tb2RlbC5jb3Jkcy5zaWRlO1xyXG4gICAgICAgIHRoaXMuZXZlbnRzLm9uSW5wdXREb3duLmFkZChpbnB1dERvd25DYWxsYmFjaywgdGhpcy5kYXRhLmJvYXJkVmlldy5kYXRhLm1vZGVsKTtcclxuICAgIH1cclxuXHJcbiAgICBpbnRlcnBvbGF0aW9uQW1vdW50KG1pZFBvaW50KXtcclxuICAgICAgICBpZih0aGlzLmRhdGEub2xkU2lkZSAhPSB0aGlzLmRhdGEubW9kZWwuY29yZHMuc2lkZSl7XHJcbiAgICAgICAgICAgIHRoaXMuYW5pbWF0ZSA9IHRydWU7XHJcbiAgICAgICAgICAgIHRoaXMuZGF0YS5vbGRTaWRlID0gdGhpcy5kYXRhLm1vZGVsLmNvcmRzLnNpZGU7XHJcbiAgICAgICAgfWVsc2UgaWYoIXRoaXMuYW5pbWF0ZSl7XHJcbiAgICAgICAgICAgIHJldHVybiBtaWRQb2ludDtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5tYXhJbnRlcnBvbGF0aW9uID0gNTA7XHJcbiAgICAgICAgaWYodGhpcy5pbnRlcnBvbGF0aW9uID49IHRoaXMubWF4SW50ZXJwb2xhdGlvbil7XHJcbiAgICAgICAgICAgIHRoaXMuaW50ZXJwb2xhdGlvbiA9IDA7XHJcbiAgICAgICAgICAgIHRoaXMuYW5pbWF0ZSA9IGZhbHNlO1xyXG4gICAgICAgIH1lbHNlIGlmKHRoaXMuYW5pbWF0ZSA9PT0gdHJ1ZSl7XHJcbiAgICAgICAgICAgIHRoaXMuaW50ZXJwb2xhdGlvbisrO1xyXG4gICAgICAgIH1cclxuICAgICAgICBsZXQgaGV4UG9pbnRzID0gZ2VvbWV0cnkucmVsYXRpdmVTY2FsZWRIZXhQb2ludHModGhpcy5kYXRhLmJvYXJkVmlldy5vdXRlclNpZGVMZW5ndGgpO1xyXG4gICAgICAgIGxldCBzdGFydDtcclxuICAgICAgICBsZXQgZW5kO1xyXG4gICAgICAgIGlmKHRoaXMuZGF0YS5tb2RlbC5sYXN0Um90YXRpb24gPT0gNSl7Ly8xIGxlc3MgdGhlbiBtYXggaXMgc2FtZSBhcyAtMVxyXG4gICAgICAgICAgICBzdGFydCA9IGhleFBvaW50c1sodGhpcy5kYXRhLm1vZGVsLmNvcmRzLnNpZGUrMiklNl07XHJcbiAgICAgICAgICAgIGVuZCA9IGhleFBvaW50c1sodGhpcy5kYXRhLm1vZGVsLmNvcmRzLnNpZGUrMSklNl07XHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIHN0YXJ0ID0gaGV4UG9pbnRzWyh0aGlzLmRhdGEubW9kZWwuY29yZHMuc2lkZSs1KSU2XTtcclxuICAgICAgICAgICAgZW5kID0gaGV4UG9pbnRzWyh0aGlzLmRhdGEubW9kZWwuY29yZHMuc2lkZSs2KSU2XTtcclxuICAgICAgICB9XHJcbiAgICAgICAgbGV0IG1pZFBvaW50MiA9IHt4OiAoc3RhcnQueCArIGVuZC54KS8yLCB5OiAoc3RhcnQueSArIGVuZC55KS8yfTtcclxuICAgICAgICBsZXQgaW50ZXJwb2xhdGlvblBlcmNlbnQgPSAodGhpcy5pbnRlcnBvbGF0aW9uL3RoaXMubWF4SW50ZXJwb2xhdGlvbik7XHJcbiAgICAgICAgbGV0IGludFggPSAobWlkUG9pbnQueCAtIG1pZFBvaW50Mi54KSppbnRlcnBvbGF0aW9uUGVyY2VudDtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICB4OiBtaWRQb2ludDIueCArIChtaWRQb2ludC54IC0gbWlkUG9pbnQyLngpKihpbnRlcnBvbGF0aW9uUGVyY2VudCksXHJcbiAgICAgICAgICAgIHk6IG1pZFBvaW50Mi55ICsgKG1pZFBvaW50LnkgLSBtaWRQb2ludDIueSkqKGludGVycG9sYXRpb25QZXJjZW50KVxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgcmVmcmVzaFBvc2l0aW9uKCl7XHJcbiAgICAgICAgbGV0IHdvcmxkQ29yZHMgPSB0aGlzLmRhdGEuYm9hcmRWaWV3LmNhbGN1bGF0ZVdvcmxkQ29yZHModGhpcy5kYXRhLm1vZGVsLmNvcmRzKTtcclxuICAgICAgICB0aGlzLnggPSB3b3JsZENvcmRzLng7XHJcbiAgICAgICAgdGhpcy55ID0gd29ybGRDb3Jkcy55O1xyXG4gICAgICAgIGxldCBoZXhQb2ludHMgPSBnZW9tZXRyeS5yZWxhdGl2ZVNjYWxlZEhleFBvaW50cyh0aGlzLmRhdGEuYm9hcmRWaWV3Lm91dGVyU2lkZUxlbmd0aCk7XHJcbiAgICAgICAgbGV0IHN0YXJ0ID0gaGV4UG9pbnRzW3RoaXMuZGF0YS5tb2RlbC5jb3Jkcy5zaWRlXTtcclxuICAgICAgICBsZXQgZW5kID0gaGV4UG9pbnRzWyh0aGlzLmRhdGEubW9kZWwuY29yZHMuc2lkZSArIDEpJTZdO1xyXG4gICAgICAgIGxldCBtaWRQb2ludCA9IHt4OiAoc3RhcnQueCArIGVuZC54KS8yLCB5OiAoc3RhcnQueSArIGVuZC55KS8yfTtcclxuICAgICAgICAvL2xldCBpbnRlcnBvbGF0aW9uQW1vdW50ID0gdGhpcy5pbnRlcnBvbGF0aW9uQW1vdW50KCk7XHJcbiAgICAgICAgLy9taWRQb2ludC54ICs9IHRoaXMuaW50ZXJwb2xhdGlvbkFtb3VudC54O1xyXG4gICAgICAgIC8vbWlkUG9pbnQueSArPSB0aGlzLmludGVycG9sYXRpb25BbW91bnQueTtcclxuICAgICAgICBsZXQgd2l0aEludGVycG9sYXRpb24gPSB0aGlzLmludGVycG9sYXRpb25BbW91bnQobWlkUG9pbnQpO1xyXG4gICAgICAgIHRoaXMuZGF0YS5ncmFwaGljcy54ID0gd2l0aEludGVycG9sYXRpb24ueDtcclxuICAgICAgICB0aGlzLmRhdGEuZ3JhcGhpY3MueSA9IHdpdGhJbnRlcnBvbGF0aW9uLnk7XHJcbiAgICAgICAgLy90aGlzLmRhdGEuZ3JhcGhpY3MueCA9IG1pZFBvaW50Lng7XHJcbiAgICAgICAgLy90aGlzLmRhdGEuZ3JhcGhpY3MueSA9IG1pZFBvaW50Lnk7XHJcbiAgICB9XHJcblxyXG4gICAgdXBkYXRlKCl7XHJcbiAgICAgICAgdGhpcy5yZWZyZXNoUG9zaXRpb24oKTtcclxuICAgICAgICB0aGlzLmRhdGEuZ3JhcGhpY3MuY2xlYXIoKTtcclxuICAgICAgICAvL25vdyBkcmF3aW5nXHJcbiAgICAgICAgLy9jYXVzZSB0aGlzIGRvZXNudCBjaGFuZ2UsIHdlIHNob3VsZCBjYWNoZSBicm9cclxuICAgICAgICB0aGlzLmRhdGEuZ3JhcGhpY3MubGluZVN0eWxlKDIsICcjZmZmZmZmJyk7XHJcbiAgICAgICAgdGhpcy5kYXRhLmdyYXBoaWNzLmJlZ2luRmlsbCh0aGlzLmRhdGEubW9kZWwudGVhbS5jb2xvdXIsIDAuNSk7XHJcbiAgICAgICAgLy90aGlzIGFuZCBhbHBoYSBhcmUgdGVtcCBoYWNrcyB0byBzaG93IG92ZXJsYXBpbmcgY2hhcmFjdGVycyBvZiBkaWZmZXJlbnQgY29sb3Vyc1xyXG4gICAgICAgIGxldCB0ZWFtU2NhbGUgPSAxICsgMC41KnRoaXMuZGF0YS5tb2RlbC50ZWFtLm51bWJlcjtcclxuICAgICAgICB0aGlzLmRhdGEuZ3JhcGhpY3MuZHJhd0NpcmNsZSgwLCAwLCB0aGlzLmRhdGEuYm9hcmRWaWV3Lm91dGVyU2lkZUxlbmd0aCp0ZWFtU2NhbGUvMTApO1xyXG4gICAgICAgIHRoaXMuZGF0YS5ncmFwaGljcy5lbmRGaWxsKCk7XHJcbiAgICAgICAgdGhpcy5kYXRhLmdyYXBoaWNzLmxpbmVTdHlsZSg1LCAweDAwMDAwKTtcclxuICAgICAgICAvL2Fsd2F5cyBwb2ludCBpbndhcmRzIGJlY2F1c2UgaW5uZXIgaGV4IGFsd2F5cyBoYXMgYSBtYXRjaGluZyBzaWRlXHJcbiAgICAgICAgLyp0aGlzLmRhdGEuZ3JhcGhpY3MubW92ZVRvKDAsIHRoaXMuZGF0YS5ib2FyZFZpZXcub3V0ZXJTaWRlTGVuZ3RoLzEwKTtcclxuICAgICAgICB0aGlzLmRhdGEuZ3JhcGhpY3MubGluZVRvKDAsIHRoaXMuZGF0YS5ib2FyZFZpZXcub3V0ZXJTaWRlTGVuZ3RoLzEwICsgMjApO1xyXG4gICAgICAgIGlmKHRoaXMuZGF0YS5tb2RlbC5vcHBvc2l0ZVNpZGVNYXRjaGVzKCkpe1xyXG4gICAgICAgICAgICB0aGlzLmRhdGEuZ3JhcGhpY3MubW92ZVRvKDAsIC0gdGhpcy5kYXRhLmJvYXJkVmlldy5vdXRlclNpZGVMZW5ndGgvMTApO1xyXG4gICAgICAgICAgICB0aGlzLmRhdGEuZ3JhcGhpY3MubGluZVRvKDAsIC0gdGhpcy5kYXRhLmJvYXJkVmlldy5vdXRlclNpZGVMZW5ndGgvMTAgLSAyMCk7XHJcbiAgICAgICAgfSovXHJcbiAgICB9XHJcbn1cclxuIiwiaW1wb3J0ICogYXMgZ2VvbWV0cnkgZnJvbSBcIi4uL2dlb21ldHJ5LmpzXCI7XHJcblxyXG5sZXQgbGluZVN0eWxlID0ge1xyXG4gICAgdGhpY2tuZXNzOiAwLFxyXG4gICAgYWxwaGE6IDFcclxufTtcclxuXHJcbmxldCBjb21iaW5lZENvbG91cnMgPSB7XHJcbiAgICB0ZWFtXzBfMTogMHhmZjAwMDAsLy8weGZmYjAwMCxcclxuICAgIHRlYW1fMV8yOiAweDY2NjY2NiwvLzB4MDBmZjAwLFxyXG4gICAgdGVhbV8yXzA6IDB4ZmYwMDAwLC8vMHhhZjAwZmZcclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBjb21iaW5lZFNpZGVTZXR0aW5nc0d1aShndWkpe1xyXG4gICAgbGV0IGZvbGRlciA9IGd1aS5hZGRGb2xkZXIoJ2NvbWJpbmVkIHNpZGUgZ3JhcGhpY3MnKTtcclxuICAgIGZvbGRlci5hZGQobGluZVN0eWxlLCAndGhpY2tuZXNzJywgMCwyMCk7XHJcbiAgICBmb2xkZXIuYWRkKGxpbmVTdHlsZSwgJ2FscGhhJywgMCwgMSk7XHJcbiAgICBmb2xkZXIuYWRkQ29sb3IoY29tYmluZWRDb2xvdXJzLCAndGVhbV8wXzEnKTtcclxuICAgIGZvbGRlci5hZGRDb2xvcihjb21iaW5lZENvbG91cnMsICd0ZWFtXzFfMicpO1xyXG4gICAgZm9sZGVyLmFkZENvbG9yKGNvbWJpbmVkQ29sb3VycywgJ3RlYW1fMl8wJyk7XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBDb21iaW5lZFNpZGUgZXh0ZW5kcyBQaGFzZXIuU3ByaXRle1xyXG4gICAgLypcclxuICAgIG1vZGVsIEFQSTpcclxuICAgICAgICBwcm9wZXJ0eSBoZXhTaWRlVGVhbXMgLT4gYXJyYXkgb2YgdGVhbU51bWJlcnMgb2YgYWRqYWNlbnQgaGV4IHNpZGVzXHJcbiAgICAgICAgcHJvZXJ0eSBjb3JkcyAtPiB7eCx5LCBzaWRlfSBzdGFuZGFyZCBjb3JvZGluYXRlIGZvciBhZGRyZXNzaW5nIGNvbWJpbmVkIHNpZGVzXHJcbiAgICAqL1xyXG4gICAgY29uc3RydWN0b3IoZ2FtZSwgeCwgeSwgYm9hcmRWaWV3LCBtb2RlbCl7XHJcbiAgICAgICAgc3VwZXIoZ2FtZSwgeCwgeSk7XHJcbiAgICAgICAgdGhpcy5kYXRhLmJvYXJkVmlldyA9IGJvYXJkVmlldztcclxuICAgICAgICB0aGlzLmRhdGEubW9kZWwgPSBtb2RlbDtcclxuICAgICAgICBsZXQgaGV4UG9pbnRzID0gZ2VvbWV0cnkucmVsYXRpdmVTY2FsZWRIZXhQb2ludHModGhpcy5kYXRhLmJvYXJkVmlldy5vdXRlclNpZGVMZW5ndGgpO1xyXG4gICAgICAgIGxldCBzdGFydCA9IGhleFBvaW50c1t0aGlzLmRhdGEubW9kZWwuY29yZHMuc2lkZV07XHJcbiAgICAgICAgbGV0IGVuZCA9IGhleFBvaW50c1sodGhpcy5kYXRhLm1vZGVsLmNvcmRzLnNpZGUgKyAxKSAlIDZdO1xyXG4gICAgICAgIHRoaXMuZGF0YS5ncmFwaGljcyA9IG5ldyBQaGFzZXIuR3JhcGhpY3MoZ2FtZSwgc3RhcnQueCwgc3RhcnQueSk7XHJcbiAgICAgICAgdGhpcy5hZGRDaGlsZCh0aGlzLmRhdGEuZ3JhcGhpY3MpO1xyXG4gICAgICAgIGxldCB0ZXh0UG9zaXRpb24gPSB7eDogKHN0YXJ0LnggKyBlbmQueCkvMiwgeTogKHN0YXJ0LnkgKyBlbmQueSkvMn07XHJcbiAgICAgICAgdGhpcy5kYXRhLnRleHQgPSBuZXcgUGhhc2VyLlRleHQoZ2FtZSwgdGV4dFBvc2l0aW9uLngsIHRleHRQb3NpdGlvbi55LCBcIlwiKTtcclxuICAgICAgICB0aGlzLmFkZENoaWxkKHRoaXMuZGF0YS50ZXh0KTtcclxuICAgICAgICB0aGlzLmRhdGEudGV4dC52aXNpYmxlID0gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgcmVmcmVzaFBvc2l0aW9uKCl7XHJcbiAgICAgICAgbGV0IHdvcmxkQ29yZHMgPSB0aGlzLmRhdGEuYm9hcmRWaWV3LmNhbGN1bGF0ZVdvcmxkQ29yZHModGhpcy5kYXRhLm1vZGVsLmNvcmRzKTtcclxuICAgICAgICB0aGlzLnggPSB3b3JsZENvcmRzLng7XHJcbiAgICAgICAgdGhpcy55ID0gd29ybGRDb3Jkcy55O1xyXG4gICAgICAgIGxldCBoZXhQb2ludHMgPSBnZW9tZXRyeS5yZWxhdGl2ZVNjYWxlZEhleFBvaW50cyh0aGlzLmRhdGEuYm9hcmRWaWV3Lm91dGVyU2lkZUxlbmd0aCk7XHJcbiAgICAgICAgbGV0IHN0YXJ0ID0gaGV4UG9pbnRzW3RoaXMuZGF0YS5tb2RlbC5jb3Jkcy5zaWRlXTtcclxuICAgICAgICBsZXQgZW5kID0gaGV4UG9pbnRzWyh0aGlzLmRhdGEubW9kZWwuY29yZHMuc2lkZSArIDEpICUgNl07XHJcbiAgICAgICAgdGhpcy5kYXRhLmdyYXBoaWNzLnggPSBzdGFydC54O1xyXG4gICAgICAgIHRoaXMuZGF0YS5ncmFwaGljcy55ID0gc3RhcnQueTtcclxuICAgICAgICB0aGlzLmRhdGEudGV4dC54ID0gKHN0YXJ0LnggKyBlbmQueCkvMjtcclxuICAgICAgICB0aGlzLmRhdGEudGV4dC55ID0gKHN0YXJ0LnkgKyBlbmQueSkvMjtcclxuICAgIH1cclxuXHJcbiAgICB1cGRhdGUoKXtcclxuICAgICAgICB0aGlzLnJlZnJlc2hQb3NpdGlvbigpO1xyXG4gICAgICAgIGxldCBleHRlcm5hbFRhbmdlbnRBbmdsZSA9IDYwO1xyXG4gICAgICAgIHRoaXMuZGF0YS5ncmFwaGljcy5hbmdsZSA9IGV4dGVybmFsVGFuZ2VudEFuZ2xlKnRoaXMuZGF0YS5tb2RlbC5jb3Jkcy5zaWRlO1xyXG4gICAgICAgIHRoaXMuZGF0YS5ncmFwaGljcy5jbGVhcigpO1xyXG4gICAgICAgIGxldCBoZXhTaWRlVGVhbXMgPSB0aGlzLmRhdGEubW9kZWwuaGV4U2lkZVRlYW1zO1xyXG4gICAgICAgIGlmKGhleFNpZGVUZWFtcy5sZW5ndGggPT09IDApe1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGxldCBmaXJzdFRlYW0gPSBoZXhTaWRlVGVhbXNbMF07XHJcbiAgICAgICAgbGV0IGNvbG91cjtcclxuICAgICAgICBpZihoZXhTaWRlVGVhbXMubGVuZ3RoID09PSAyKXtcclxuICAgICAgICAgICAgbGV0IHNlY29uZFRlYW0gPSBoZXhTaWRlVGVhbXNbMV07XHJcbiAgICAgICAgICAgIGNvbG91ciA9IHRoaXMubWFudWFsQ29tYmluZShmaXJzdFRlYW0sIHNlY29uZFRlYW0pO1xyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICBjb2xvdXIgPSBmaXJzdFRlYW0uY29sb3VyO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZih0aGlzLmRhdGEubW9kZWwuc2VsZWN0ZWQgJiYgZmFsc2Upe1xyXG4gICAgICAgICAgICAvL3RoaXMgaXMgZ29ubmEgYmUgYSByZWFsIHJlc291cmNlIGRyYWluXHJcbiAgICAgICAgICAgIC8vc2hvdWxkIGluc3RlYWQgcmVuZGVyIHRvIHRleHR1cmUgKDYgZGlmZmVyZW50IG9uZXMpLCB0aGVuIHJlYXBwbHlcclxuICAgICAgICAgICAgbGV0IHN0ZXBzID0gMTA7XHJcbiAgICAgICAgICAgIGxldCBtYXhUaGlja25lc3MgPSBsaW5lU3R5bGUudGhpY2tuZXNzICogNTtcclxuICAgICAgICAgICAgbGV0IHRoaWNrbmVzc1N0ZXAgPSAobWF4VGhpY2tuZXNzIC0gbGluZVN0eWxlLnRoaWNrbmVzcykvc3RlcHM7XHJcbiAgICAgICAgICAgIGxldCBhbHBoYSA9IDEvc3RlcHM7Ly90aGVzZSBuYXR1cmFseSBzdGFjaywgc28gc2NhbGluZyB3aXRoIHN0ZXAgaXMgbm90IG5lZWRlZFxyXG4gICAgICAgICAgICBmb3IobGV0IHN0ZXAgPSAwOyBzdGVwIDwgc3RlcHM7IHN0ZXArKyl7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRhdGEuZ3JhcGhpY3MubGluZVN0eWxlKGxpbmVTdHlsZS50aGlja25lc3MgKyAodGhpY2tuZXNzU3RlcCpzdGVwKSwgMHhmZmZmZmYsIGFscGhhKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuZGF0YS5ncmFwaGljcy5tb3ZlVG8oMCwgMCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRhdGEuZ3JhcGhpY3MubGluZVRvKHRoaXMuZGF0YS5ib2FyZFZpZXcub3V0ZXJTaWRlTGVuZ3RoLCAwKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmRhdGEudGV4dC50ZXh0ID0gdGhpcy5kYXRhLm1vZGVsLnNjb3JlO1xyXG4gICAgICAgICAgICB0aGlzLmRhdGEudGV4dC52aXNpYmxlID0gdHJ1ZTtcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgdGhpcy5kYXRhLnRleHQudmlzaWJsZSA9IGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvL3RlbXAgZGlzYWJsZSBzY29yZSBkaXNwbGF5XHJcbiAgICAgICAgdGhpcy5kYXRhLnRleHQudmlzaWJsZSA9IGZhbHNlO1xyXG4gICAgICAgIC8vZG9pbmcgdGhpcyBsYXN0IG1lYW5zIGl0IHNpdHMgb24gdG9wIG9mIHRoZSBoaWdodGxpZ2hcclxuICAgICAgICB0aGlzLmRhdGEuZ3JhcGhpY3MubGluZVN0eWxlKGxpbmVTdHlsZS50aGlja25lc3MsIGNvbG91ciwgbGluZVN0eWxlLmFscGhhKTtcclxuICAgICAgICB0aGlzLmRhdGEuZ3JhcGhpY3MubW92ZVRvKDAsIDApO1xyXG4gICAgICAgIHRoaXMuZGF0YS5ncmFwaGljcy5saW5lVG8odGhpcy5kYXRhLmJvYXJkVmlldy5vdXRlclNpZGVMZW5ndGgsIDApO1xyXG4gICAgfVxyXG5cclxuICAgIC8vdGhpcyBmZWVscyBsaWtlIGl0cyBsZWFraW5nIHRoZSBtb2RlbCBhIGJpdD9cclxuICAgIG1hbnVhbENvbWJpbmUoZmlyc3RfdGVhbSwgc2Vjb25kX3RlYW0pe1xyXG4gICAgICAgIGZ1bmN0aW9uIGxvZ0Vycm9yKCl7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiZXJycm9yLCBpbnZhbGlkIHRlYW1zIGZvciBjb21iaW5pbmcgc2lkZXNcIik7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGZpcnN0X3RlYW0pO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhzZWNvbmRfdGVhbSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKGZpcnN0X3RlYW0ubnVtYmVyID4gc2Vjb25kX3RlYW0ubnVtYmVyKXtcclxuICAgICAgICAgICAgbGV0IHRlbXAgPSBmaXJzdF90ZWFtO1xyXG4gICAgICAgICAgICBmaXJzdF90ZWFtID0gc2Vjb25kX3RlYW07XHJcbiAgICAgICAgICAgIHNlY29uZF90ZWFtID0gdGVtcDtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYoZmlyc3RfdGVhbS5udW1iZXIgPT09IHNlY29uZF90ZWFtLm51bWJlcil7XHJcbiAgICAgICAgICAgIHJldHVybiBmaXJzdF90ZWFtLmNvbG91cjtcclxuICAgICAgICB9ZWxzZSBpZihmaXJzdF90ZWFtLm51bWJlciA9PT0gMCAmJiBzZWNvbmRfdGVhbS5udW1iZXIgPT09IDEpe1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbWJpbmVkQ29sb3Vycy50ZWFtXzBfMTtcclxuICAgICAgICB9ZWxzZSBpZihmaXJzdF90ZWFtLm51bWJlciA9PT0gMSAmJiBzZWNvbmRfdGVhbS5udW1iZXIgPT09IDIpe1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbWJpbmVkQ29sb3Vycy50ZWFtXzFfMjtcclxuICAgICAgICB9ZWxzZSBpZihmaXJzdF90ZWFtLm51bWJlciA9PT0gMCAmJiBzZWNvbmRfdGVhbS5udW1iZXIgPT09IDIpe1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbWJpbmVkQ29sb3Vycy50ZWFtXzJfMDtcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgbG9nRXJyb3IoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuIiwiaW1wb3J0IHtIZXhhZ29ufSBmcm9tIFwiLi9oZXhhZ29uLmpzXCI7XHJcbmltcG9ydCB7Q29tYmluZWRTaWRlfSBmcm9tIFwiLi9jb21iaW5lZFNpZGUuanNcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBEYXNoYm9hcmQgZXh0ZW5kcyBQaGFzZXIuU3ByaXRle1xyXG4gICAgLy9kZXBlbmRpbmcgb24gd2hhdCB0aGVlIGNvbnRyb2xzIGxvb2sgbGlrZVxyXG4gICAgLy9taWdodCBiZSBiZXR0ZXIgdG8gbWFrZSB0aGlzIHdpdGggbm9ybWFsIGh0bWwvY3NzXHJcbiAgICBjb25zdHJ1Y3RvcihnYW1lLCB4LCB5LCB3aWR0aCwgdGVhbUluZm8sIGJvYXJkTW9kZWwpe1xyXG4gICAgICAgIHN1cGVyKGdhbWUsIHgsIHkpO1xyXG4gICAgICAgIHRoaXMuZGF0YS50ZWFtSW5mbyA9IHRlYW1JbmZvO1xyXG4gICAgICAgIHRoaXMuZGF0YS53aWR0aCA9IHdpZHRoO1xyXG4gICAgICAgIHRoaXMuZGF0YS5oZWlnaHQgPSBnYW1lLmhlaWdodDtcclxuICAgICAgICB0aGlzLm91dGxpbmUoKTtcclxuICAgICAgICB0aGlzLmRhdGEudGVhbXNEaXNwbGF5ID0gW107XHJcbiAgICAgICAgdGhpcy5kYXRhLmN1cnJlbnRTdGF0ZVRlYW1EaXNwbGF5ID0gW107XHJcbiAgICAgICAgdGhpcy5hZGRDaGlsZChuZXcgUGhhc2VyLlRleHQodGhpcy5nYW1lLCAwLCA3MCwgXCJUb3RhbCBTY29yZXM6XCIpKTtcclxuICAgICAgICB0aGlzLmFkZENoaWxkKG5ldyBQaGFzZXIuVGV4dCh0aGlzLmdhbWUsIDAsIDE1MCwgXCJDdXJyZW50IFJvdW5kOlwiKSk7XHJcbiAgICAgICAgdGhpcy5kYXRhLmJvYXJkTW9kZWwgPSBib2FyZE1vZGVsO1xyXG4gICAgICAgIGZvcihsZXQgW2luZGV4LCB0ZWFtXSBvZiB0ZWFtSW5mby50ZWFtcy5lbnRyaWVzKCkpe1xyXG4gICAgICAgICAgICBsZXQgdGVhbURpc3BsYXlHcm91cCA9IHRoaXMudGVhbUhpZ2hsaWdodHModGVhbSwgaW5kZXgqNTAsIDExMCwgMzAsIDMwKTtcclxuICAgICAgICAgICAgdGhpcy5kYXRhLnRlYW1zRGlzcGxheS5wdXNoKHRlYW1EaXNwbGF5R3JvdXApO1xyXG4gICAgICAgICAgICB0aGlzLmFkZENoaWxkKHRlYW1EaXNwbGF5R3JvdXApO1xyXG4gICAgICAgICAgICBsZXQgY3VycmVudFN0YXRlVGVhbURpc3BsYXlHcm91cCA9IHRoaXMuY3VycmVudFN0YXRlVGVhbUhpZ2hsaWdodHModGVhbSwgaW5kZXgqNTAsIDE5MCwgMzAsIDMwKTtcclxuICAgICAgICAgICAgdGhpcy5kYXRhLmN1cnJlbnRTdGF0ZVRlYW1EaXNwbGF5LnB1c2goY3VycmVudFN0YXRlVGVhbURpc3BsYXlHcm91cCk7XHJcbiAgICAgICAgICAgIHRoaXMuYWRkQ2hpbGQoY3VycmVudFN0YXRlVGVhbURpc3BsYXlHcm91cCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMubW92ZUNvdW50ZXIgPSBuZXcgUGhhc2VyLkdyYXBoaWNzKGdhbWUsIDAsIHRoaXMuZGF0YS5oZWlnaHQvMik7XHJcbiAgICAgICAgdGhpcy5hZGRDaGlsZCh0aGlzLm1vdmVDb3VudGVyKTtcclxuICAgICAgICB0aGlzLmRhdGEuaGlnaGxpZ2h0ZWRTZWN0aW9uU2NvcmUgPSBuZXcgUGhhc2VyLlRleHQoZ2FtZSwgMCwgMTAsIFwiXCIsIHt3b3JkV3JhcDogdHJ1ZSwgd29yZFdyYXBXaWR0aDogd2lkdGgsIGZvbnRTaXplOiAxNX0pO1xyXG4gICAgICAgIHRoaXMuYWRkQ2hpbGQodGhpcy5kYXRhLmhpZ2hsaWdodGVkU2VjdGlvblNjb3JlKTtcclxuICAgICAgICB0aGlzLmRhdGEuaGlnaGxpZ2h0ZWRTZWN0aW9uU2NvcmVCb251cyA9IG5ldyBQaGFzZXIuVGV4dChnYW1lLCAwLCA0MCwgXCJcIiwge3dvcmRXcmFwOiB0cnVlLCB3b3JkV3JhcFdpZHRoOiB3aWR0aCwgZm9udFNpemU6IDE1fSk7XHJcbiAgICAgICAgdGhpcy5hZGRDaGlsZCh0aGlzLmRhdGEuaGlnaGxpZ2h0ZWRTZWN0aW9uU2NvcmVCb251cyk7XHJcbiAgICB9XHJcblxyXG4gICAgY3VycmVudFN0YXRlVGVhbUhpZ2hsaWdodHModGVhbSwgeCwgeSwgd2lkdGgsIGhlaWdodCl7XHJcbiAgICAgICAgbGV0IGdyb3VwID0gbmV3IFBoYXNlci5Hcm91cCh0aGlzLmdhbWUsIHRoaXMpO1xyXG4gICAgICAgIGxldCB0ZWFtSGlnaGxpZ2h0ID0gbmV3IFBoYXNlci5HcmFwaGljcyh0aGlzLmdhbWUsIHgsIHkpO1xyXG4gICAgICAgIHRlYW1IaWdobGlnaHQuYmVnaW5GaWxsKHRlYW0uY29sb3VyKTtcclxuICAgICAgICB0ZWFtSGlnaGxpZ2h0LmRyYXdSZWN0KDAsMCwgd2lkdGgsIGhlaWdodCk7XHJcbiAgICAgICAgdGVhbUhpZ2hsaWdodC5lbmRGaWxsKCk7XHJcbiAgICAgICAgdGVhbUhpZ2hsaWdodC5pbnB1dEVuYWJsZWQgPSB0cnVlO1xyXG4gICAgICAgIHRlYW1IaWdobGlnaHQuZXZlbnRzLm9uSW5wdXRPdmVyLmFkZChmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICB0aGlzLmRhdGEuYm9hcmRNb2RlbC50ZWFtSGlnaGxpZ2h0KHRlYW0pO1xyXG4gICAgICAgIH0sIHRoaXMpO1xyXG4gICAgICAgIGdyb3VwLmFkZENoaWxkKHRlYW1IaWdobGlnaHQpO1xyXG4gICAgICAgIGxldCBzY29yZVRleHQgPSBuZXcgUGhhc2VyLlRleHQodGhpcy5nYW1lLCB4LCB5LCBcIlwiKTtcclxuICAgICAgICBncm91cC5hZGRDaGlsZChzY29yZVRleHQpO1xyXG4gICAgICAgIHRoaXMuZGF0YS5ib2FyZE1vZGVsLnRlYW1IaWdobGlnaHQodGVhbSk7XHJcbiAgICAgICAgdGhpcy5kYXRhLmJvYXJkTW9kZWwuY3VycmVudFN0YXRlU2NvcmUodGVhbSk7XHJcbiAgICAgICAgbGV0IGJvYXJkTW9kZWwgPSB0aGlzLmRhdGEuYm9hcmRNb2RlbDtcclxuICAgICAgICBzY29yZVRleHQudXBkYXRlID0gZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgdGhpcy50ZXh0ID0gYm9hcmRNb2RlbC5jdXJyZW50U3RhdGVTY29yZSh0ZWFtKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHJldHVybiBncm91cDtcclxuICAgIH1cclxuXHJcbiAgICB0ZWFtSGlnaGxpZ2h0cyh0ZWFtLCB4LCB5LCB3aWR0aCwgaGVpZ2h0KXtcclxuICAgICAgICBsZXQgZ3JvdXAgPSBuZXcgUGhhc2VyLkdyb3VwKHRoaXMuZ2FtZSwgdGhpcyk7XHJcbiAgICAgICAgbGV0IHRlYW1IaWdobGlnaHQgPSBuZXcgUGhhc2VyLkdyYXBoaWNzKHRoaXMuZ2FtZSwgeCwgeSk7XHJcbiAgICAgICAgdGVhbUhpZ2hsaWdodC5iZWdpbkZpbGwodGVhbS5jb2xvdXIpO1xyXG4gICAgICAgIHRlYW1IaWdobGlnaHQuZHJhd1JlY3QoMCwwLCB3aWR0aCwgaGVpZ2h0KTtcclxuICAgICAgICB0ZWFtSGlnaGxpZ2h0LmVuZEZpbGwoKTtcclxuICAgICAgICBncm91cC5hZGRDaGlsZCh0ZWFtSGlnaGxpZ2h0KTtcclxuICAgICAgICBsZXQgc2NvcmVUZXh0ID0gbmV3IFBoYXNlci5UZXh0KHRoaXMuZ2FtZSwgeCwgeSwgXCJcIik7XHJcbiAgICAgICAgZ3JvdXAuYWRkQ2hpbGQoc2NvcmVUZXh0KTtcclxuICAgICAgICBzY29yZVRleHQudXBkYXRlID0gZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgdGhpcy50ZXh0ID0gdGVhbS5zY29yZTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHJldHVybiBncm91cDtcclxuICAgIH1cclxuXHJcbiAgICBvdXRsaW5lKCl7XHJcbiAgICAgICAgdGhpcy5kYXRhLm91dGxpbmUgPSBuZXcgUGhhc2VyLkdyYXBoaWNzKHRoaXMuZ2FtZSwgMCwgMCk7XHJcbiAgICAgICAgdGhpcy5kYXRhLm91dGxpbmUuYmVnaW5GaWxsKCcweGZmNjYwMCcpO1xyXG4gICAgICAgIHRoaXMuZGF0YS5vdXRsaW5lLmRyYXdSZWN0KDAsMCwgdGhpcy5kYXRhLndpZHRoLCB0aGlzLmRhdGEuaGVpZ2h0KTtcclxuICAgICAgICB0aGlzLmRhdGEub3V0bGluZS5lbmRGaWxsKCk7XHJcbiAgICAgICAgdGhpcy5hZGRDaGlsZCh0aGlzLmRhdGEub3V0bGluZSk7XHJcbiAgICB9XHJcblxyXG4gICAgdXBkYXRlKCl7XHJcbiAgICAgICAgLypmb3IobGV0IHRlYW1EaXNwbGF5R3JvdXAgb2YgdGhpcy5kYXRhLnRlYW1zRGlzcGxheSl7XHJcbiAgICAgICAgICAgIHRlYW1EaXNwbGF5R3JvdXAudXBkYXRlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZvcihsZXQgY3VycmVudFN0YXRlVGVhbURpc3BsYXlHcm91cCBvZiB0aGlzLmRhdGEuY3VycmVudFN0YXRlVGVhbURpc3BsYXkpe1xyXG4gICAgICAgICAgICBjdXJyZW50U3RhdGVUZWFtRGlzcGxheUdyb3VwLnVwZGF0ZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLm1vdmVDb3VudGVyLmNsZWFyKCk7XHJcbiAgICAgICAgbGV0IHNjb3JlO1xyXG4gICAgICAgIGxldCBib251cztcclxuICAgICAgICBpZih0aGlzLmRhdGEuYm9hcmRNb2RlbC5zZWxlY3RlZCA9PT0gdW5kZWZpbmVkKXtcclxuICAgICAgICAgICAgc2NvcmUgPSAwO1xyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICBzY29yZSA9IHRoaXMuZGF0YS5ib2FyZE1vZGVsLnNlbGVjdGVkLnNjb3JlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBib251cyA9IDA7XHJcbiAgICAgICAgdGhpcy5kYXRhLmhpZ2hsaWdodGVkU2VjdGlvblNjb3JlLnRleHQgPSBcIkhpZ2hsaWdodGVkIFNjb3JlOiBcIiArIHNjb3JlO1xyXG4gICAgICAgIHRoaXMuZGF0YS5oaWdobGlnaHRlZFNlY3Rpb25TY29yZUJvbnVzLnRleHQgPSBcIlNpemUgQm9udXM6IFwiICsgYm9udXM7XHJcbiAgICAgICAgY29uc3QgY3VycmVudFRlYW0gPSB0aGlzLmRhdGEudGVhbUluZm8uY3VycmVudFRlYW07XHJcbiAgICAgICAgY29uc3QgbW92ZUxpbWl0ID0gdGhpcy5kYXRhLnRlYW1JbmZvLnNldHRpbmdzLnN0YW5kYXJkTW92ZUxpbWl0O1xyXG4gICAgICAgIC8qdGhpcy5tb3ZlQ291bnRlci5iZWdpbkZpbGwoY3VycmVudFRlYW0uY29sb3VyKTtcclxuICAgICAgICBsZXQgcmFkaXVzID0gTWF0aC5taW4odGhpcy5kYXRhLndpZHRoLCB0aGlzLmRhdGEuaGVpZ2h0KS8yO1xyXG4gICAgICAgIGxldCBjZW50ZXIgPSB7eDogdGhpcy5kYXRhLndpZHRoLzIsIHk6IDB9O1xyXG4gICAgICAgIGlmKGN1cnJlbnRUZWFtLm1vdmVzTGVmdCA9PSBtb3ZlTGltaXQpe1xyXG4gICAgICAgICAgICAvL2FyYyBkcmF3cyBpbiBkaXNjcmVhdCBzZWdtZW50cywgc28gbGVhdmVzIGEgZ2FwIGZvciBmdWxsIGNpcmNsZXNcclxuICAgICAgICAgICAgdGhpcy5tb3ZlQ291bnRlci5kcmF3Q2lyY2xlKGNlbnRlci54LCBjZW50ZXIueSwgcmFkaXVzKjIpO1xyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICBsZXQgcGVyY2VudE9mQ2lyY2xlID0gY3VycmVudFRlYW0ubW92ZXNMZWZ0L21vdmVMaW1pdDtcclxuICAgICAgICAgICAgbGV0IGVuZEFuZ2xlUmFkaWFucyA9IC1NYXRoLlBJKjIqcGVyY2VudE9mQ2lyY2xlO1xyXG4gICAgICAgICAgICBsZXQgdG9wT2Zmc2V0ID0gLU1hdGguUEkvMjtcclxuICAgICAgICAgICAgdGhpcy5tb3ZlQ291bnRlci5hcmMoY2VudGVyLngsIGNlbnRlci55LCByYWRpdXMsIHRvcE9mZnNldCwgdG9wT2Zmc2V0K2VuZEFuZ2xlUmFkaWFucywgdHJ1ZSwgMTI4KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5tb3ZlQ291bnRlci5lbmRGaWxsKCk7Ki9cclxuICAgIH1cclxufVxyXG4iLCJpbXBvcnQge3RlYW1zfSBmcm9tIFwiLi4vdGVhbUluZm8uanNcIjtcbmltcG9ydCAqIGFzIGdlb21ldHJ5IGZyb20gXCIuLi9nZW9tZXRyeS5qc1wiO1xuaW1wb3J0IHtTaW5nbGVTaWRlfSBmcm9tIFwiLi9TaW5nbGVTaWRlLmpzXCI7XG5cbmxldCBsaW5lU3R5bGUgPSB7XG4gICAgdGhpY2tuZXNzOiA1LFxuICAgIGFscGhhOiAxXG59O1xuXG5sZXQgaGV4U3R5bGUgPSB7XG4gICAgY29sb3VyOiAweEZGMzNmZlxufTtcblxuZXhwb3J0IGZ1bmN0aW9uIGhleGFnb25TZXR0aW5nc0d1aShndWkpe1xuICAgIGxldCBmb2xkZXIgPSBndWkuYWRkRm9sZGVyKCdoZXhhZ29uIGdyYXBoaWNzJyk7XG4gICAgZm9sZGVyLmFkZChsaW5lU3R5bGUsICd0aGlja25lc3MnLCAwLDIwKTtcbiAgICBmb2xkZXIuYWRkKGxpbmVTdHlsZSwgJ2FscGhhJywgMCwgMSk7XG4gICAgZm9sZGVyLmFkZENvbG9yKGhleFN0eWxlLCAnY29sb3VyJyk7XG59XG5cbmV4cG9ydCBjbGFzcyBIZXhhZ29uIGV4dGVuZHMgUGhhc2VyLlNwcml0ZXtcbiAgICAvKlxuICAgIEhleG1vZGVsIGlzIGFuIGludGVyZmFjZSB0aGF0IHN1cHBsaWVzIGluZm8gb24gaG93IHRvIHJlbmRlclxuICAgIEl0J3MgQVBJIGlzOlxuICAgICAgICBwcm9wZXJ0eTogZ3JpZENvcmRzIC0+IHJldHVybnMge3gsIHl9IG9iamVjdFxuICAgICAgICBwcm9wb2VydHlMIHNpZGVzIC0+IHJldHVybnMgW10gb2YgdGVhbSBudW1iZXJzLCBzdGFydGluZyBmcm9tIHRvcCBzaWRlLCBnb2luZyBjbG9ja3dpc2VcbiAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGdhbWUsIHgsIHksIGJvYXJkVmlldywgaW5wdXREb3duQ2FsbGJhY2ssIG1vZGVsKXtcbiAgICAgICAgc3VwZXIoZ2FtZSwgeCwgeSk7XG4gICAgICAgIHRoaXMuZGF0YS5tb2RlbCA9IG1vZGVsO1xuICAgICAgICB0aGlzLmRhdGEuYm9hcmRWaWV3ID0gYm9hcmRWaWV3O1xuICAgICAgICB0aGlzLmlucHV0RW5hYmxlZCA9IHRydWU7XG4gICAgICAgIC8vdGhpcyBpc24ndCBwaXhsZSBwZXJmZWN0LCBzbyB1c2UgaW4gY29uanVjdGlvbiB3aXRoIHBvbHlnb24gaGl0IHRlc3Q/XG4gICAgICAgIC8vYXNzdW1pbmcgYm94IGZvciB0aGlzIHRlc3RpIGlzIHRvbyBiaWcsIG5vdCB0b28gc21hbGxcbiAgICAgICAgdGhpcy5ldmVudHMub25JbnB1dERvd24uYWRkKGlucHV0RG93bkNhbGxiYWNrLCB0aGlzLmRhdGEuYm9hcmRWaWV3LmRhdGEubW9kZWwpO1xuXG4gICAgICAgIHRoaXMuZGF0YS5ib2R5ID0gbmV3IFBoYXNlci5HcmFwaGljcyhnYW1lLCAwLCAwKTtcbiAgICAgICAgdGhpcy5hZGRDaGlsZCh0aGlzLmRhdGEuYm9keSk7XG5cbiAgICAgICAgdGhpcy5kYXRhLnNpZGVzID0gW107XG5cbiAgICAgICAgZm9yKGxldCBzaWRlTW9kZWwgb2YgdGhpcy5kYXRhLm1vZGVsLnNpZGVzKXtcbiAgICAgICAgICAgIGxldCBzaWRlVmlldyA9IG5ldyBTaW5nbGVTaWRlKGdhbWUsIDAsIDAsIGJvYXJkVmlldywgc2lkZU1vZGVsKTtcbiAgICAgICAgICAgIHRoaXMuYWRkQ2hpbGQoc2lkZVZpZXcpO1xuICAgICAgICAgICAgdGhpcy5kYXRhLnNpZGVzLnB1c2goc2lkZVZpZXcpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZGF0YS50ZXh0ID0gbmV3IFBoYXNlci5UZXh0KGdhbWUsIC0xMCwgLTEwLCB0aGlzLmRhdGEubW9kZWwuZ3JpZENvcmRzLnggKyBcIixcIiArIHRoaXMuZGF0YS5tb2RlbC5ncmlkQ29yZHMueSk7XG4gICAgICAgIHRoaXMuZGF0YS50ZXh0LmZvbnQgPSBcImFyaWFsXCI7XG4gICAgICAgIHRoaXMuZGF0YS50ZXh0LmZvbnRTaXplID0gODtcbiAgICAgICAgLy9sb29rIGF0IGFkZGluZyB0aGlzIHRvIGEgZ3JvdXAvaW1hZ2UgY2xhc3Mgd2l0aCB0aGUgZ3JhcGhpY3Mgb2JqZWN0XG4gICAgICAgIHRoaXMuYWRkQ2hpbGQodGhpcy5kYXRhLnRleHQpO1xuICAgICAgICB0aGlzLmNob29zZVJvdGF0aW9uSWNvbihnYW1lKTtcbiAgICB9XG5cbiAgICAvKmRlc3Ryb3koKXtcbiAgICAgICAgbGV0IGJvYXJkTW9kZWwgPSB0aGlzLmRhdGEuYm9hcmRWaWV3LmRhdGEubW9kZWw7XG4gICAgICAgIGxldCBoZXhNb2RlbCA9IHRoaXMuZGF0YS5tb2RlbDtcbiAgICAgICAgLy9zdXBlci5kZXN0cm95KCk7XG4gICAgICAgIGJvYXJkTW9kZWwuaGV4YWdvbnMuZ2V0KGhleE1vZGVsLngpLmRlbGV0ZShoZXhNb2RlbC55KTtcbiAgICB9Ki9cblxuICAgIGNob29zZVJvdGF0aW9uSWNvbihnYW1lKXtcbiAgICAgICAgbGV0IHJvdGF0aW9uX2ljb247XG4gICAgICAgIGlmKHRoaXMuZGF0YS5tb2RlbC5yb3RhdGlvbiA9PSAnbGVmdCcpe1xuICAgICAgICAgICAgcm90YXRpb25faWNvbiA9ICdsZWZ0X3JvdGF0ZSc7XG4gICAgICAgIH1lbHNlIGlmKHRoaXMuZGF0YS5tb2RlbC5yb3RhdGlvbiA9PSAncmlnaHQnKXtcbiAgICAgICAgICAgIHJvdGF0aW9uX2ljb24gPSAncmlnaHRfcm90YXRlJztcbiAgICAgICAgfWVsc2UgaWYodGhpcy5kYXRhLm1vZGVsLnJvdGF0aW9uID09ICdib3RoJyl7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1lbHNle1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJtb2RlbCBoYXMgaW52bGFpZCByb2F0aW9uIHNldHRpbmdcIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHJvdGF0aW9uX3Nwcml0ZSA9IG5ldyBQaGFzZXIuU3ByaXRlKGdhbWUsIDAsIDAsIHJvdGF0aW9uX2ljb24pOy8vY2hhbmdpbmcgeCBhbmQgeSBieSBhYnNvdWx1dGVzIGlzIGhvcnJpYmxlLCBzdG9wIHRoYXRcbiAgICAgICAgcm90YXRpb25fc3ByaXRlLnNjYWxlLnNldFRvKDAuNSwgMC41KTtcbiAgICAgICAgdGhpcy5hZGRDaGlsZChyb3RhdGlvbl9zcHJpdGUpO1xuICAgIH1cblxuICAgIHJlZnJlc2hQb3NpdG9uKCl7XG4gICAgICAgIGxldCB3b3JsZENvcmRzID0gdGhpcy5kYXRhLmJvYXJkVmlldy5jYWxjdWxhdGVXb3JsZENvcmRzKHRoaXMuZGF0YS5tb2RlbC5ncmlkQ29yZHMpO1xuICAgICAgICB0aGlzLnggPSB3b3JsZENvcmRzLng7XG4gICAgICAgIHRoaXMueSA9IHdvcmxkQ29yZHMueTtcbiAgICB9XG5cbiAgICB1cGRhdGUoKXtcbiAgICAgICAgdGhpcy5yZWZyZXNoUG9zaXRvbigpO1xuICAgICAgICAvL3RoaXMuZHJhd1NpZGVzKCk7XG4gICAgICAgIHRoaXMuZHJhd0hleGFnb24oKTtcbiAgICAgICAgZm9yKGxldCBzaWRlVmlldyBvZiB0aGlzLmRhdGEuc2lkZXMpe1xuICAgICAgICAgICAgc2lkZVZpZXcudXBkYXRlKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBkcmF3U2lkZXMoKXtcbiAgICAgICAgdGhpcy5kYXRhLnNpZGVzLmNsZWFyKCk7XG4gICAgICAgIGxldCBoZXhQb2ludHMgPSBnZW9tZXRyeS5yZWxhdGl2ZVNjYWxlZEhleFBvaW50cyh0aGlzLmRhdGEuYm9hcmRWaWV3LmlubmVyU2lkZUxlbmd0aCk7XG4gICAgICAgIGZvcihsZXQgW3NpZGVOdW1iZXIsdGVhbV0gb2YgdGhpcy5kYXRhLm1vZGVsLnNpZGVzLmVudHJpZXMoKSl7XG4gICAgICAgICAgICB0aGlzLmRhdGEuc2lkZXMubGluZVN0eWxlKGxpbmVTdHlsZS50aGlja25lc3MsIHRlYW0uY29sb3VyLCBsaW5lU3R5bGUuYWxwaGEpO1xuICAgICAgICAgICAgbGV0IHN0YXJ0ID0gaGV4UG9pbnRzW3NpZGVOdW1iZXJdO1xuICAgICAgICAgICAgdGhpcy5kYXRhLnNpZGVzLm1vdmVUbyhzdGFydC54LCBzdGFydC55KTtcbiAgICAgICAgICAgIGxldCBlbmQgPSBoZXhQb2ludHNbKHNpZGVOdW1iZXIrMSklNl07XG4gICAgICAgICAgICB0aGlzLmRhdGEuc2lkZXMubGluZVRvKGVuZC54LCBlbmQueSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBkcmF3SGV4YWdvbigpe1xuICAgICAgICB0aGlzLmRhdGEuYm9keS5jbGVhcigpO1xuICAgICAgICBpZih0aGlzLmRhdGEubW9kZWwuY2FuUm90YXRlKXtcbiAgICAgICAgICAgIHRoaXMuZGF0YS5ib2R5LmJlZ2luRmlsbChoZXhTdHlsZS5jb2xvdXIpO1xuICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgIHRoaXMuZGF0YS5ib2R5LmJlZ2luRmlsbChoZXhTdHlsZS5jb2xvdXIsIDAuMjUpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5kYXRhLmJvZHkuZHJhd1BvbHlnb24oZ2VvbWV0cnkucmVsYXRpdmVTY2FsZWRIZXhQb2ludHModGhpcy5kYXRhLmJvYXJkVmlldy5pbm5lclNpZGVMZW5ndGgpKTtcbiAgICAgICAgdGhpcy5kYXRhLmJvZHkuZW5kRmlsbCgpO1xuICAgICAgICBpZih0aGlzLmRhdGEubW9kZWwuaXNIb21lKXtcbiAgICAgICAgICAgIHRoaXMuZGF0YS5ib2R5LmJlZ2luRmlsbCgnMHgwMDY2ZmYnKTtcbiAgICAgICAgICAgIHRoaXMuZGF0YS5ib2R5LmRyYXdDaXJjbGUoMCwwLCAyMCk7XG4gICAgICAgICAgICB0aGlzLmRhdGEuYm9keS5lbmRGaWxsKCk7XG4gICAgICAgIH1cbiAgICB9XG59XG4iXX0=
