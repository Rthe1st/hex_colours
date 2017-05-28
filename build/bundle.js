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
    mapFolder.add(globalParams, 'presetLevels', levels).listen().onFinishChange(function (newDataString) {
        game.boardView.destroy();
        createBoard(game, newDataString);
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
    createBoard(game, levels[0]);
    (0, _combinedSide2.combinedSideGameSettingsGui)(settingsGui);
    globalSettingsGui(settingsGui, game);
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
    var game = new Phaser.Game(globalParams.width, globalParams.height, Phaser.CANVAS, "phaser_parent", { create: onCreate, update: update });
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
    gui.add(settings, 'mode', ['home', 'normal']);
    gui.add(settings, 'mapEdit');
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
                var rotationAmt = 1;
                //using ctrlKey instead has a bug in phaser 2.6.2 https://github.com/photonstorm/phaser/issues/2167
                if (pointer.leftButton.altKey) {
                    rotationAmt *= -1;
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

                return _sides.join(":");
            }
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
    gui.add(scoreSettings, 'perSideIncrease', 0, 20).step(1);
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
        return _this;
    }

    /*destroy(){
        let boardModel = this.data.boardView.data.model;
        let hexModel = this.data.model;
        //super.destroy();
        boardModel.hexagons.get(hexModel.x).delete(hexModel.y);
    }*/

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvZXhkYXQvc3JjL2RhdC9jb2xvci9Db2xvci5qcyIsIm5vZGVfbW9kdWxlcy9leGRhdC9zcmMvZGF0L2NvbG9yL2ludGVycHJldC5qcyIsIm5vZGVfbW9kdWxlcy9leGRhdC9zcmMvZGF0L2NvbG9yL21hdGguanMiLCJub2RlX21vZHVsZXMvZXhkYXQvc3JjL2RhdC9jb2xvci90b1N0cmluZy5qcyIsIm5vZGVfbW9kdWxlcy9leGRhdC9zcmMvZGF0L2NvbnRyb2xsZXJzL0Jvb2xlYW5Db250cm9sbGVyLmpzIiwibm9kZV9tb2R1bGVzL2V4ZGF0L3NyYy9kYXQvY29udHJvbGxlcnMvQ29sb3JDb250cm9sbGVyLmpzIiwibm9kZV9tb2R1bGVzL2V4ZGF0L3NyYy9kYXQvY29udHJvbGxlcnMvQ29udHJvbGxlci5qcyIsIm5vZGVfbW9kdWxlcy9leGRhdC9zcmMvZGF0L2NvbnRyb2xsZXJzL0Z1bmN0aW9uQ29udHJvbGxlci5qcyIsIm5vZGVfbW9kdWxlcy9leGRhdC9zcmMvZGF0L2NvbnRyb2xsZXJzL051bWJlckNvbnRyb2xsZXIuanMiLCJub2RlX21vZHVsZXMvZXhkYXQvc3JjL2RhdC9jb250cm9sbGVycy9OdW1iZXJDb250cm9sbGVyQm94LmpzIiwibm9kZV9tb2R1bGVzL2V4ZGF0L3NyYy9kYXQvY29udHJvbGxlcnMvTnVtYmVyQ29udHJvbGxlclNsaWRlci5qcyIsIm5vZGVfbW9kdWxlcy9leGRhdC9zcmMvZGF0L2NvbnRyb2xsZXJzL09wdGlvbkNvbnRyb2xsZXIuanMiLCJub2RlX21vZHVsZXMvZXhkYXQvc3JjL2RhdC9jb250cm9sbGVycy9TdHJpbmdDb250cm9sbGVyLmpzIiwibm9kZV9tb2R1bGVzL2V4ZGF0L3NyYy9kYXQvY29udHJvbGxlcnMvZmFjdG9yeS5qcyIsIm5vZGVfbW9kdWxlcy9leGRhdC9zcmMvZGF0L2RvbS9DZW50ZXJlZERpdi5qcyIsIm5vZGVfbW9kdWxlcy9leGRhdC9zcmMvZGF0L2RvbS9kb20uanMiLCJub2RlX21vZHVsZXMvZXhkYXQvc3JjL2RhdC9ndWkvR1VJLmpzIiwibm9kZV9tb2R1bGVzL2V4ZGF0L3NyYy9kYXQvdXRpbHMvY29tbW9uLmpzIiwibm9kZV9tb2R1bGVzL2V4ZGF0L3NyYy9kYXQvdXRpbHMvY3NzLmpzIiwibm9kZV9tb2R1bGVzL2V4ZGF0L3NyYy9kYXQvdXRpbHMvZXNjYXBlSHRtbC5qcyIsIm5vZGVfbW9kdWxlcy9leGRhdC9zcmMvZGF0L3V0aWxzL3JlcXVlc3RBbmltYXRpb25GcmFtZS5qcyIsIm5vZGVfbW9kdWxlcy9leGRhdC9zcmMvaW5kZXguanMiLCJzb3VyY2VcXGdlb21ldHJ5LmpzIiwic291cmNlXFxncmlkTmF2aWdhdGlvbi5qcyIsInNvdXJjZVxcbWFpbi5qcyIsInNvdXJjZVxcbW9kZWxzXFxDaGFyYWN0ZXIuanMiLCJzb3VyY2VcXG1vZGVsc1xcU2luZ2xlU2lkZS5qcyIsInNvdXJjZVxcbW9kZWxzXFxib2FyZC5qcyIsInNvdXJjZVxcbW9kZWxzXFxjb21iaW5lZFNpZGUuanMiLCJzb3VyY2VcXG1vZGVsc1xcaGV4YWdvbi5qcyIsInNvdXJjZVxcc2NvcmUuanMiLCJzb3VyY2VcXHNpZGVHZW5lcmF0aW9uLmpzIiwic291cmNlXFx0ZWFtSW5mby5qcyIsInNvdXJjZVxcdmlld3NcXFNpbmdsZVNpZGUuanMiLCJzb3VyY2VcXHZpZXdzXFxib2FyZC5qcyIsInNvdXJjZVxcdmlld3NcXGNoYXJhY3Rlci5qcyIsInNvdXJjZVxcdmlld3NcXGNvbWJpbmVkU2lkZS5qcyIsInNvdXJjZVxcdmlld3NcXGRhc2hib2FyZC5qcyIsInNvdXJjZVxcdmlld3NcXGhleGFnb24uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDclZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25HQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0lBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeDNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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SyxJQUFMLENBQVUsSUFBVixDQUFlLE9BQWY7QUFDSDtBQUNKOzs7O0VBbEZ3QixPQUFPLE0iLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyoqXG4gKiBkYXQtZ3VpIEphdmFTY3JpcHQgQ29udHJvbGxlciBMaWJyYXJ5XG4gKiBodHRwOi8vY29kZS5nb29nbGUuY29tL3AvZGF0LWd1aVxuICpcbiAqIENvcHlyaWdodCAyMDExIERhdGEgQXJ0cyBUZWFtLCBHb29nbGUgQ3JlYXRpdmUgTGFiXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICovXG5cbnZhciBjb21tb24gPSByZXF1aXJlKCcuLi91dGlscy9jb21tb24uanMnKTtcbnZhciB0b1N0cmluZyA9IHJlcXVpcmUoJy4vdG9TdHJpbmcuanMnKTtcbnZhciBtYXRoID0gcmVxdWlyZSgnLi9tYXRoLmpzJyk7XG52YXIgaW50ZXJwcmV0ID0gcmVxdWlyZSgnLi9pbnRlcnByZXQuanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBDb2xvcjtcblxuZnVuY3Rpb24gQ29sb3IoKSB7XG5cbiAgdGhpcy5fX3N0YXRlID0gaW50ZXJwcmV0LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cbiAgaWYgKHRoaXMuX19zdGF0ZSA9PT0gZmFsc2UpIHtcbiAgICB0aHJvdyAnRmFpbGVkIHRvIGludGVycHJldCBjb2xvciBhcmd1bWVudHMnO1xuICB9XG5cbiAgdGhpcy5fX3N0YXRlLmEgPSB0aGlzLl9fc3RhdGUuYSB8fCAxO1xufVxuXG5Db2xvci5DT01QT05FTlRTID0gWydyJywgJ2cnLCAnYicsICdoJywgJ3MnLCAndicsICdoZXgnLCAnYSddO1xuXG5jb21tb24uZXh0ZW5kKENvbG9yLnByb3RvdHlwZSwge1xuXG4gIHRvU3RyaW5nOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdG9TdHJpbmcodGhpcyk7XG4gIH0sXG5cbiAgdG9PcmlnaW5hbDogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuX19zdGF0ZS5jb252ZXJzaW9uLndyaXRlKHRoaXMpO1xuICB9XG5cbn0pO1xuXG5kZWZpbmVSR0JDb21wb25lbnQoQ29sb3IucHJvdG90eXBlLCAncicsIDIpO1xuZGVmaW5lUkdCQ29tcG9uZW50KENvbG9yLnByb3RvdHlwZSwgJ2cnLCAxKTtcbmRlZmluZVJHQkNvbXBvbmVudChDb2xvci5wcm90b3R5cGUsICdiJywgMCk7XG5cbmRlZmluZUhTVkNvbXBvbmVudChDb2xvci5wcm90b3R5cGUsICdoJyk7XG5kZWZpbmVIU1ZDb21wb25lbnQoQ29sb3IucHJvdG90eXBlLCAncycpO1xuZGVmaW5lSFNWQ29tcG9uZW50KENvbG9yLnByb3RvdHlwZSwgJ3YnKTtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KENvbG9yLnByb3RvdHlwZSwgJ2EnLCB7XG5cbiAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5fX3N0YXRlLmE7XG4gIH0sXG5cbiAgc2V0OiBmdW5jdGlvbih2KSB7XG4gICAgdGhpcy5fX3N0YXRlLmEgPSB2O1xuICB9XG5cbn0pO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoQ29sb3IucHJvdG90eXBlLCAnaGV4Jywge1xuXG4gIGdldDogZnVuY3Rpb24oKSB7XG5cbiAgICBpZiAoIXRoaXMuX19zdGF0ZS5zcGFjZSAhPT0gJ0hFWCcpIHtcbiAgICAgIHRoaXMuX19zdGF0ZS5oZXggPSBtYXRoLnJnYl90b19oZXgodGhpcy5yLCB0aGlzLmcsIHRoaXMuYik7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuX19zdGF0ZS5oZXg7XG5cbiAgfSxcblxuICBzZXQ6IGZ1bmN0aW9uKHYpIHtcblxuICAgIHRoaXMuX19zdGF0ZS5zcGFjZSA9ICdIRVgnO1xuICAgIHRoaXMuX19zdGF0ZS5oZXggPSB2O1xuXG4gIH1cblxufSk7XG5cbmZ1bmN0aW9uIGRlZmluZVJHQkNvbXBvbmVudCh0YXJnZXQsIGNvbXBvbmVudCwgY29tcG9uZW50SGV4SW5kZXgpIHtcblxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBjb21wb25lbnQsIHtcblxuICAgIGdldDogZnVuY3Rpb24oKSB7XG5cbiAgICAgIGlmICh0aGlzLl9fc3RhdGUuc3BhY2UgPT09ICdSR0InKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9fc3RhdGVbY29tcG9uZW50XTtcbiAgICAgIH1cblxuICAgICAgcmVjYWxjdWxhdGVSR0IodGhpcywgY29tcG9uZW50LCBjb21wb25lbnRIZXhJbmRleCk7XG5cbiAgICAgIHJldHVybiB0aGlzLl9fc3RhdGVbY29tcG9uZW50XTtcblxuICAgIH0sXG5cbiAgICBzZXQ6IGZ1bmN0aW9uKHYpIHtcblxuICAgICAgaWYgKHRoaXMuX19zdGF0ZS5zcGFjZSAhPT0gJ1JHQicpIHtcbiAgICAgICAgcmVjYWxjdWxhdGVSR0IodGhpcywgY29tcG9uZW50LCBjb21wb25lbnRIZXhJbmRleCk7XG4gICAgICAgIHRoaXMuX19zdGF0ZS5zcGFjZSA9ICdSR0InO1xuICAgICAgfVxuXG4gICAgICB0aGlzLl9fc3RhdGVbY29tcG9uZW50XSA9IHY7XG5cbiAgICB9XG5cbiAgfSk7XG5cbn1cblxuZnVuY3Rpb24gZGVmaW5lSFNWQ29tcG9uZW50KHRhcmdldCwgY29tcG9uZW50KSB7XG5cbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgY29tcG9uZW50LCB7XG5cbiAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuXG4gICAgICBpZiAodGhpcy5fX3N0YXRlLnNwYWNlID09PSAnSFNWJylcbiAgICAgICAgcmV0dXJuIHRoaXMuX19zdGF0ZVtjb21wb25lbnRdO1xuXG4gICAgICByZWNhbGN1bGF0ZUhTVih0aGlzKTtcblxuICAgICAgcmV0dXJuIHRoaXMuX19zdGF0ZVtjb21wb25lbnRdO1xuXG4gICAgfSxcblxuICAgIHNldDogZnVuY3Rpb24odikge1xuXG4gICAgICBpZiAodGhpcy5fX3N0YXRlLnNwYWNlICE9PSAnSFNWJykge1xuICAgICAgICByZWNhbGN1bGF0ZUhTVih0aGlzKTtcbiAgICAgICAgdGhpcy5fX3N0YXRlLnNwYWNlID0gJ0hTVic7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuX19zdGF0ZVtjb21wb25lbnRdID0gdjtcblxuICAgIH1cblxuICB9KTtcblxufVxuXG5mdW5jdGlvbiByZWNhbGN1bGF0ZVJHQihjb2xvciwgY29tcG9uZW50LCBjb21wb25lbnRIZXhJbmRleCkge1xuXG4gIGlmIChjb2xvci5fX3N0YXRlLnNwYWNlID09PSAnSEVYJykge1xuXG4gICAgY29sb3IuX19zdGF0ZVtjb21wb25lbnRdID0gbWF0aC5jb21wb25lbnRfZnJvbV9oZXgoY29sb3IuX19zdGF0ZS5oZXgsIGNvbXBvbmVudEhleEluZGV4KTtcblxuICB9IGVsc2UgaWYgKGNvbG9yLl9fc3RhdGUuc3BhY2UgPT09ICdIU1YnKSB7XG5cbiAgICBjb21tb24uZXh0ZW5kKGNvbG9yLl9fc3RhdGUsIG1hdGguaHN2X3RvX3JnYihjb2xvci5fX3N0YXRlLmgsIGNvbG9yLl9fc3RhdGUucywgY29sb3IuX19zdGF0ZS52KSk7XG5cbiAgfSBlbHNlIHtcblxuICAgIHRocm93ICdDb3JydXB0ZWQgY29sb3Igc3RhdGUnO1xuXG4gIH1cblxufVxuXG5mdW5jdGlvbiByZWNhbGN1bGF0ZUhTVihjb2xvcikge1xuXG4gIHZhciByZXN1bHQgPSBtYXRoLnJnYl90b19oc3YoY29sb3IuciwgY29sb3IuZywgY29sb3IuYik7XG5cbiAgY29tbW9uLmV4dGVuZChjb2xvci5fX3N0YXRlLCB7XG4gICAgczogcmVzdWx0LnMsXG4gICAgdjogcmVzdWx0LnZcbiAgfSk7XG5cbiAgaWYgKCFjb21tb24uaXNOYU4ocmVzdWx0LmgpKSB7XG4gICAgY29sb3IuX19zdGF0ZS5oID0gcmVzdWx0Lmg7XG4gIH0gZWxzZSBpZiAoY29tbW9uLmlzVW5kZWZpbmVkKGNvbG9yLl9fc3RhdGUuaCkpIHtcbiAgICBjb2xvci5fX3N0YXRlLmggPSAwO1xuICB9XG5cbn1cbiIsIi8qKlxuICogZGF0LWd1aSBKYXZhU2NyaXB0IENvbnRyb2xsZXIgTGlicmFyeVxuICogaHR0cDovL2NvZGUuZ29vZ2xlLmNvbS9wL2RhdC1ndWlcbiAqXG4gKiBDb3B5cmlnaHQgMjAxMSBEYXRhIEFydHMgVGVhbSwgR29vZ2xlIENyZWF0aXZlIExhYlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNyZWF0ZUludGVycGVydCgpO1xuXG5mdW5jdGlvbiBjcmVhdGVJbnRlcnBlcnQoKSB7XG4gIHZhciBjb21tb24gPSByZXF1aXJlKCcuLi91dGlscy9jb21tb24uanMnKTtcbiAgdmFyIHRvU3RyaW5nID0gcmVxdWlyZSgnLi90b1N0cmluZy5qcycpO1xuXG4gIHZhciByZXN1bHQsIHRvUmV0dXJuO1xuXG4gIHZhciBpbnRlcnByZXQgPSBmdW5jdGlvbigpIHtcblxuICAgIHRvUmV0dXJuID0gZmFsc2U7XG5cbiAgICB2YXIgb3JpZ2luYWwgPSBhcmd1bWVudHMubGVuZ3RoID4gMSA/IGNvbW1vbi50b0FycmF5KGFyZ3VtZW50cykgOiBhcmd1bWVudHNbMF07XG5cbiAgICBjb21tb24uZWFjaChJTlRFUlBSRVRBVElPTlMsIGZ1bmN0aW9uKGZhbWlseSkge1xuXG4gICAgICBpZiAoZmFtaWx5LmxpdG11cyhvcmlnaW5hbCkpIHtcblxuICAgICAgICBjb21tb24uZWFjaChmYW1pbHkuY29udmVyc2lvbnMsIGZ1bmN0aW9uKGNvbnZlcnNpb24sIGNvbnZlcnNpb25OYW1lKSB7XG5cbiAgICAgICAgICByZXN1bHQgPSBjb252ZXJzaW9uLnJlYWQob3JpZ2luYWwpO1xuXG4gICAgICAgICAgaWYgKHRvUmV0dXJuID09PSBmYWxzZSAmJiByZXN1bHQgIT09IGZhbHNlKSB7XG4gICAgICAgICAgICB0b1JldHVybiA9IHJlc3VsdDtcbiAgICAgICAgICAgIHJlc3VsdC5jb252ZXJzaW9uTmFtZSA9IGNvbnZlcnNpb25OYW1lO1xuICAgICAgICAgICAgcmVzdWx0LmNvbnZlcnNpb24gPSBjb252ZXJzaW9uO1xuICAgICAgICAgICAgcmV0dXJuIGNvbW1vbi5CUkVBSztcblxuICAgICAgICAgIH1cblxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gY29tbW9uLkJSRUFLO1xuXG4gICAgICB9XG5cbiAgICB9KTtcblxuICAgIHJldHVybiB0b1JldHVybjtcblxuICB9O1xuXG4gIHZhciBJTlRFUlBSRVRBVElPTlMgPSBbXG5cbiAgICAvLyBTdHJpbmdzXG4gICAge1xuXG4gICAgICBsaXRtdXM6IGNvbW1vbi5pc1N0cmluZyxcblxuICAgICAgY29udmVyc2lvbnM6IHtcblxuICAgICAgICBUSFJFRV9DSEFSX0hFWDoge1xuXG4gICAgICAgICAgcmVhZDogZnVuY3Rpb24ob3JpZ2luYWwpIHtcblxuICAgICAgICAgICAgdmFyIHRlc3QgPSBvcmlnaW5hbC5tYXRjaCgvXiMoW0EtRjAtOV0pKFtBLUYwLTldKShbQS1GMC05XSkkL2kpO1xuICAgICAgICAgICAgaWYgKHRlc3QgPT09IG51bGwpIHJldHVybiBmYWxzZTtcblxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgc3BhY2U6ICdIRVgnLFxuICAgICAgICAgICAgICBoZXg6IHBhcnNlSW50KFxuICAgICAgICAgICAgICAgICAgJzB4JyArXG4gICAgICAgICAgICAgICAgICAgICAgdGVzdFsxXS50b1N0cmluZygpICsgdGVzdFsxXS50b1N0cmluZygpICtcbiAgICAgICAgICAgICAgICAgICAgICB0ZXN0WzJdLnRvU3RyaW5nKCkgKyB0ZXN0WzJdLnRvU3RyaW5nKCkgK1xuICAgICAgICAgICAgICAgICAgICAgIHRlc3RbM10udG9TdHJpbmcoKSArIHRlc3RbM10udG9TdHJpbmcoKSlcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICB9LFxuXG4gICAgICAgICAgd3JpdGU6IHRvU3RyaW5nXG5cbiAgICAgICAgfSxcblxuICAgICAgICBTSVhfQ0hBUl9IRVg6IHtcblxuICAgICAgICAgIHJlYWQ6IGZ1bmN0aW9uKG9yaWdpbmFsKSB7XG5cbiAgICAgICAgICAgIHZhciB0ZXN0ID0gb3JpZ2luYWwubWF0Y2goL14jKFtBLUYwLTldezZ9KSQvaSk7XG4gICAgICAgICAgICBpZiAodGVzdCA9PT0gbnVsbCkgcmV0dXJuIGZhbHNlO1xuXG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICBzcGFjZTogJ0hFWCcsXG4gICAgICAgICAgICAgIGhleDogcGFyc2VJbnQoJzB4JyArIHRlc3RbMV0udG9TdHJpbmcoKSlcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICB9LFxuXG4gICAgICAgICAgd3JpdGU6IHRvU3RyaW5nXG5cbiAgICAgICAgfSxcblxuICAgICAgICBDU1NfUkdCOiB7XG5cbiAgICAgICAgICByZWFkOiBmdW5jdGlvbihvcmlnaW5hbCkge1xuXG4gICAgICAgICAgICB2YXIgdGVzdCA9IG9yaWdpbmFsLm1hdGNoKC9ecmdiXFwoXFxzKiguKylcXHMqLFxccyooLispXFxzKixcXHMqKC4rKVxccypcXCkvKTtcbiAgICAgICAgICAgIGlmICh0ZXN0ID09PSBudWxsKSByZXR1cm4gZmFsc2U7XG5cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgIHNwYWNlOiAnUkdCJyxcbiAgICAgICAgICAgICAgcjogcGFyc2VGbG9hdCh0ZXN0WzFdKSxcbiAgICAgICAgICAgICAgZzogcGFyc2VGbG9hdCh0ZXN0WzJdKSxcbiAgICAgICAgICAgICAgYjogcGFyc2VGbG9hdCh0ZXN0WzNdKVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgIH0sXG5cbiAgICAgICAgICB3cml0ZTogdG9TdHJpbmdcblxuICAgICAgICB9LFxuXG4gICAgICAgIENTU19SR0JBOiB7XG5cbiAgICAgICAgICByZWFkOiBmdW5jdGlvbihvcmlnaW5hbCkge1xuXG4gICAgICAgICAgICB2YXIgdGVzdCA9IG9yaWdpbmFsLm1hdGNoKC9ecmdiYVxcKFxccyooLispXFxzKixcXHMqKC4rKVxccyosXFxzKiguKylcXHMqXFwsXFxzKiguKylcXHMqXFwpLyk7XG4gICAgICAgICAgICBpZiAodGVzdCA9PT0gbnVsbCkgcmV0dXJuIGZhbHNlO1xuXG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICBzcGFjZTogJ1JHQicsXG4gICAgICAgICAgICAgIHI6IHBhcnNlRmxvYXQodGVzdFsxXSksXG4gICAgICAgICAgICAgIGc6IHBhcnNlRmxvYXQodGVzdFsyXSksXG4gICAgICAgICAgICAgIGI6IHBhcnNlRmxvYXQodGVzdFszXSksXG4gICAgICAgICAgICAgIGE6IHBhcnNlRmxvYXQodGVzdFs0XSlcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICB9LFxuXG4gICAgICAgICAgd3JpdGU6IHRvU3RyaW5nXG5cbiAgICAgICAgfVxuXG4gICAgICB9XG5cbiAgICB9LFxuXG4gICAgLy8gTnVtYmVyc1xuICAgIHtcblxuICAgICAgbGl0bXVzOiBjb21tb24uaXNOdW1iZXIsXG5cbiAgICAgIGNvbnZlcnNpb25zOiB7XG5cbiAgICAgICAgSEVYOiB7XG4gICAgICAgICAgcmVhZDogZnVuY3Rpb24ob3JpZ2luYWwpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgIHNwYWNlOiAnSEVYJyxcbiAgICAgICAgICAgICAgaGV4OiBvcmlnaW5hbCxcbiAgICAgICAgICAgICAgY29udmVyc2lvbk5hbWU6ICdIRVgnXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSxcblxuICAgICAgICAgIHdyaXRlOiBmdW5jdGlvbihjb2xvcikge1xuICAgICAgICAgICAgcmV0dXJuIGNvbG9yLmhleDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgfVxuXG4gICAgfSxcblxuICAgIC8vIEFycmF5c1xuICAgIHtcblxuICAgICAgbGl0bXVzOiBjb21tb24uaXNBcnJheSxcblxuICAgICAgY29udmVyc2lvbnM6IHtcblxuICAgICAgICBSR0JfQVJSQVk6IHtcbiAgICAgICAgICByZWFkOiBmdW5jdGlvbihvcmlnaW5hbCkge1xuICAgICAgICAgICAgaWYgKG9yaWdpbmFsLmxlbmd0aCAhPSAzKSByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICBzcGFjZTogJ1JHQicsXG4gICAgICAgICAgICAgIHI6IG9yaWdpbmFsWzBdLFxuICAgICAgICAgICAgICBnOiBvcmlnaW5hbFsxXSxcbiAgICAgICAgICAgICAgYjogb3JpZ2luYWxbMl1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgfSxcblxuICAgICAgICAgIHdyaXRlOiBmdW5jdGlvbihjb2xvcikge1xuICAgICAgICAgICAgcmV0dXJuIFtjb2xvci5yLCBjb2xvci5nLCBjb2xvci5iXTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgfSxcblxuICAgICAgICBSR0JBX0FSUkFZOiB7XG4gICAgICAgICAgcmVhZDogZnVuY3Rpb24ob3JpZ2luYWwpIHtcbiAgICAgICAgICAgIGlmIChvcmlnaW5hbC5sZW5ndGggIT0gNCkgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgc3BhY2U6ICdSR0InLFxuICAgICAgICAgICAgICByOiBvcmlnaW5hbFswXSxcbiAgICAgICAgICAgICAgZzogb3JpZ2luYWxbMV0sXG4gICAgICAgICAgICAgIGI6IG9yaWdpbmFsWzJdLFxuICAgICAgICAgICAgICBhOiBvcmlnaW5hbFszXVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9LFxuXG4gICAgICAgICAgd3JpdGU6IGZ1bmN0aW9uKGNvbG9yKSB7XG4gICAgICAgICAgICByZXR1cm4gW2NvbG9yLnIsIGNvbG9yLmcsIGNvbG9yLmIsIGNvbG9yLmFdO1xuICAgICAgICAgIH1cblxuICAgICAgICB9XG5cbiAgICAgIH1cblxuICAgIH0sXG5cbiAgICAvLyBPYmplY3RzXG4gICAge1xuXG4gICAgICBsaXRtdXM6IGNvbW1vbi5pc09iamVjdCxcblxuICAgICAgY29udmVyc2lvbnM6IHtcblxuICAgICAgICBSR0JBX09CSjoge1xuICAgICAgICAgIHJlYWQ6IGZ1bmN0aW9uKG9yaWdpbmFsKSB7XG4gICAgICAgICAgICBpZiAoY29tbW9uLmlzTnVtYmVyKG9yaWdpbmFsLnIpICYmXG4gICAgICAgICAgICAgICAgY29tbW9uLmlzTnVtYmVyKG9yaWdpbmFsLmcpICYmXG4gICAgICAgICAgICAgICAgY29tbW9uLmlzTnVtYmVyKG9yaWdpbmFsLmIpICYmXG4gICAgICAgICAgICAgICAgY29tbW9uLmlzTnVtYmVyKG9yaWdpbmFsLmEpKSB7XG4gICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3BhY2U6ICdSR0InLFxuICAgICAgICAgICAgICAgIHI6IG9yaWdpbmFsLnIsXG4gICAgICAgICAgICAgICAgZzogb3JpZ2luYWwuZyxcbiAgICAgICAgICAgICAgICBiOiBvcmlnaW5hbC5iLFxuICAgICAgICAgICAgICAgIGE6IG9yaWdpbmFsLmFcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIH0sXG5cbiAgICAgICAgICB3cml0ZTogZnVuY3Rpb24oY29sb3IpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgIHI6IGNvbG9yLnIsXG4gICAgICAgICAgICAgIGc6IGNvbG9yLmcsXG4gICAgICAgICAgICAgIGI6IGNvbG9yLmIsXG4gICAgICAgICAgICAgIGE6IGNvbG9yLmFcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgUkdCX09CSjoge1xuICAgICAgICAgIHJlYWQ6IGZ1bmN0aW9uKG9yaWdpbmFsKSB7XG4gICAgICAgICAgICBpZiAoY29tbW9uLmlzTnVtYmVyKG9yaWdpbmFsLnIpICYmXG4gICAgICAgICAgICAgICAgY29tbW9uLmlzTnVtYmVyKG9yaWdpbmFsLmcpICYmXG4gICAgICAgICAgICAgICAgY29tbW9uLmlzTnVtYmVyKG9yaWdpbmFsLmIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3BhY2U6ICdSR0InLFxuICAgICAgICAgICAgICAgIHI6IG9yaWdpbmFsLnIsXG4gICAgICAgICAgICAgICAgZzogb3JpZ2luYWwuZyxcbiAgICAgICAgICAgICAgICBiOiBvcmlnaW5hbC5iXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB9LFxuXG4gICAgICAgICAgd3JpdGU6IGZ1bmN0aW9uKGNvbG9yKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICByOiBjb2xvci5yLFxuICAgICAgICAgICAgICBnOiBjb2xvci5nLFxuICAgICAgICAgICAgICBiOiBjb2xvci5iXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIEhTVkFfT0JKOiB7XG4gICAgICAgICAgcmVhZDogZnVuY3Rpb24ob3JpZ2luYWwpIHtcbiAgICAgICAgICAgIGlmIChjb21tb24uaXNOdW1iZXIob3JpZ2luYWwuaCkgJiZcbiAgICAgICAgICAgICAgICBjb21tb24uaXNOdW1iZXIob3JpZ2luYWwucykgJiZcbiAgICAgICAgICAgICAgICBjb21tb24uaXNOdW1iZXIob3JpZ2luYWwudikgJiZcbiAgICAgICAgICAgICAgICBjb21tb24uaXNOdW1iZXIob3JpZ2luYWwuYSkpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzcGFjZTogJ0hTVicsXG4gICAgICAgICAgICAgICAgaDogb3JpZ2luYWwuaCxcbiAgICAgICAgICAgICAgICBzOiBvcmlnaW5hbC5zLFxuICAgICAgICAgICAgICAgIHY6IG9yaWdpbmFsLnYsXG4gICAgICAgICAgICAgICAgYTogb3JpZ2luYWwuYVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgfSxcblxuICAgICAgICAgIHdyaXRlOiBmdW5jdGlvbihjb2xvcikge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgaDogY29sb3IuaCxcbiAgICAgICAgICAgICAgczogY29sb3IucyxcbiAgICAgICAgICAgICAgdjogY29sb3IudixcbiAgICAgICAgICAgICAgYTogY29sb3IuYVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBIU1ZfT0JKOiB7XG4gICAgICAgICAgcmVhZDogZnVuY3Rpb24ob3JpZ2luYWwpIHtcbiAgICAgICAgICAgIGlmIChjb21tb24uaXNOdW1iZXIob3JpZ2luYWwuaCkgJiZcbiAgICAgICAgICAgICAgICBjb21tb24uaXNOdW1iZXIob3JpZ2luYWwucykgJiZcbiAgICAgICAgICAgICAgICBjb21tb24uaXNOdW1iZXIob3JpZ2luYWwudikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzcGFjZTogJ0hTVicsXG4gICAgICAgICAgICAgICAgaDogb3JpZ2luYWwuaCxcbiAgICAgICAgICAgICAgICBzOiBvcmlnaW5hbC5zLFxuICAgICAgICAgICAgICAgIHY6IG9yaWdpbmFsLnZcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIH0sXG5cbiAgICAgICAgICB3cml0ZTogZnVuY3Rpb24oY29sb3IpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgIGg6IGNvbG9yLmgsXG4gICAgICAgICAgICAgIHM6IGNvbG9yLnMsXG4gICAgICAgICAgICAgIHY6IGNvbG9yLnZcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgfVxuXG4gICAgICB9XG5cbiAgICB9XG5cblxuICBdO1xuXG4gIHJldHVybiBpbnRlcnByZXQ7XG5cblxufVxuIiwiLyoqXG4gKiBkYXQtZ3VpIEphdmFTY3JpcHQgQ29udHJvbGxlciBMaWJyYXJ5XG4gKiBodHRwOi8vY29kZS5nb29nbGUuY29tL3AvZGF0LWd1aVxuICpcbiAqIENvcHlyaWdodCAyMDExIERhdGEgQXJ0cyBUZWFtLCBHb29nbGUgQ3JlYXRpdmUgTGFiXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gbWF0aCgpO1xuXG5mdW5jdGlvbiBtYXRoKCkge1xuXG4gIHZhciB0bXBDb21wb25lbnQ7XG5cbiAgcmV0dXJuIHtcblxuICAgIGhzdl90b19yZ2I6IGZ1bmN0aW9uKGgsIHMsIHYpIHtcblxuICAgICAgdmFyIGhpID0gTWF0aC5mbG9vcihoIC8gNjApICUgNjtcblxuICAgICAgdmFyIGYgPSBoIC8gNjAgLSBNYXRoLmZsb29yKGggLyA2MCk7XG4gICAgICB2YXIgcCA9IHYgKiAoMS4wIC0gcyk7XG4gICAgICB2YXIgcSA9IHYgKiAoMS4wIC0gKGYgKiBzKSk7XG4gICAgICB2YXIgdCA9IHYgKiAoMS4wIC0gKCgxLjAgLSBmKSAqIHMpKTtcbiAgICAgIHZhciBjID0gW1xuICAgICAgICBbdiwgdCwgcF0sXG4gICAgICAgIFtxLCB2LCBwXSxcbiAgICAgICAgW3AsIHYsIHRdLFxuICAgICAgICBbcCwgcSwgdl0sXG4gICAgICAgIFt0LCBwLCB2XSxcbiAgICAgICAgW3YsIHAsIHFdXG4gICAgICBdW2hpXTtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcjogY1swXSAqIDI1NSxcbiAgICAgICAgZzogY1sxXSAqIDI1NSxcbiAgICAgICAgYjogY1syXSAqIDI1NVxuICAgICAgfTtcblxuICAgIH0sXG5cbiAgICByZ2JfdG9faHN2OiBmdW5jdGlvbihyLCBnLCBiKSB7XG5cbiAgICAgIHZhciBtaW4gPSBNYXRoLm1pbihyLCBnLCBiKSxcbiAgICAgICAgbWF4ID0gTWF0aC5tYXgociwgZywgYiksXG4gICAgICAgIGRlbHRhID0gbWF4IC0gbWluLFxuICAgICAgICBoLCBzO1xuXG4gICAgICBpZiAobWF4ICE9IDApIHtcbiAgICAgICAgcyA9IGRlbHRhIC8gbWF4O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBoOiBOYU4sXG4gICAgICAgICAgczogMCxcbiAgICAgICAgICB2OiAwXG4gICAgICAgIH07XG4gICAgICB9XG5cbiAgICAgIGlmIChyID09IG1heCkge1xuICAgICAgICBoID0gKGcgLSBiKSAvIGRlbHRhO1xuICAgICAgfSBlbHNlIGlmIChnID09IG1heCkge1xuICAgICAgICBoID0gMiArIChiIC0gcikgLyBkZWx0YTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGggPSA0ICsgKHIgLSBnKSAvIGRlbHRhO1xuICAgICAgfVxuICAgICAgaCAvPSA2O1xuICAgICAgaWYgKGggPCAwKSB7XG4gICAgICAgIGggKz0gMTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgaDogaCAqIDM2MCxcbiAgICAgICAgczogcyxcbiAgICAgICAgdjogbWF4IC8gMjU1XG4gICAgICB9O1xuICAgIH0sXG5cbiAgICByZ2JfdG9faGV4OiBmdW5jdGlvbihyLCBnLCBiKSB7XG4gICAgICB2YXIgaGV4ID0gdGhpcy5oZXhfd2l0aF9jb21wb25lbnQoMCwgMiwgcik7XG4gICAgICBoZXggPSB0aGlzLmhleF93aXRoX2NvbXBvbmVudChoZXgsIDEsIGcpO1xuICAgICAgaGV4ID0gdGhpcy5oZXhfd2l0aF9jb21wb25lbnQoaGV4LCAwLCBiKTtcbiAgICAgIHJldHVybiBoZXg7XG4gICAgfSxcblxuICAgIGNvbXBvbmVudF9mcm9tX2hleDogZnVuY3Rpb24oaGV4LCBjb21wb25lbnRJbmRleCkge1xuICAgICAgcmV0dXJuIChoZXggPj4gKGNvbXBvbmVudEluZGV4ICogOCkpICYgMHhGRjtcbiAgICB9LFxuXG4gICAgaGV4X3dpdGhfY29tcG9uZW50OiBmdW5jdGlvbihoZXgsIGNvbXBvbmVudEluZGV4LCB2YWx1ZSkge1xuICAgICAgcmV0dXJuIHZhbHVlIDw8ICh0bXBDb21wb25lbnQgPSBjb21wb25lbnRJbmRleCAqIDgpIHwgKGhleCAmIH4oMHhGRiA8PCB0bXBDb21wb25lbnQpKTtcbiAgICB9XG5cbiAgfTtcbn1cbiIsIi8qKlxuICogZGF0LWd1aSBKYXZhU2NyaXB0IENvbnRyb2xsZXIgTGlicmFyeVxuICogaHR0cDovL2NvZGUuZ29vZ2xlLmNvbS9wL2RhdC1ndWlcbiAqXG4gKiBDb3B5cmlnaHQgMjAxMSBEYXRhIEFydHMgVGVhbSwgR29vZ2xlIENyZWF0aXZlIExhYlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqL1xuXG52YXIgY29tbW9uID0gcmVxdWlyZSgnLi4vdXRpbHMvY29tbW9uLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gdG9TdHJpbmc7XG5cbmZ1bmN0aW9uIHRvU3RyaW5nKGNvbG9yKSB7XG5cbiAgaWYgKGNvbG9yLmEgPT0gMSB8fCBjb21tb24uaXNVbmRlZmluZWQoY29sb3IuYSkpIHtcblxuICAgIHZhciBzID0gY29sb3IuaGV4LnRvU3RyaW5nKDE2KTtcbiAgICB3aGlsZSAocy5sZW5ndGggPCA2KSB7XG4gICAgICBzID0gJzAnICsgcztcbiAgICB9XG5cbiAgICByZXR1cm4gJyMnICsgcztcblxuICB9IGVsc2Uge1xuXG4gICAgcmV0dXJuICdyZ2JhKCcgKyBNYXRoLnJvdW5kKGNvbG9yLnIpICsgJywnICsgTWF0aC5yb3VuZChjb2xvci5nKSArICcsJyArIE1hdGgucm91bmQoY29sb3IuYikgKyAnLCcgKyBjb2xvci5hICsgJyknO1xuXG4gIH1cblxufVxuIiwiLyoqXG4gKiBkYXQtZ3VpIEphdmFTY3JpcHQgQ29udHJvbGxlciBMaWJyYXJ5XG4gKiBodHRwOi8vY29kZS5nb29nbGUuY29tL3AvZGF0LWd1aVxuICpcbiAqIENvcHlyaWdodCAyMDExIERhdGEgQXJ0cyBUZWFtLCBHb29nbGUgQ3JlYXRpdmUgTGFiXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICovXG5cbnZhciBDb250cm9sbGVyID0gcmVxdWlyZSgnLi9Db250cm9sbGVyLmpzJyk7XG52YXIgY29tbW9uID0gcmVxdWlyZSgnLi4vdXRpbHMvY29tbW9uLmpzJyk7XG52YXIgZG9tID0gcmVxdWlyZSgnLi4vZG9tL2RvbS5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEJvb2xlYW5Db250cm9sbGVyO1xuXG4vKipcbiAqIEBjbGFzcyBQcm92aWRlcyBhIGNoZWNrYm94IGlucHV0IHRvIGFsdGVyIHRoZSBib29sZWFuIHByb3BlcnR5IG9mIGFuIG9iamVjdC5cbiAqIEBleHRlbmRzIGRhdC5jb250cm9sbGVycy5Db250cm9sbGVyXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIGJlIG1hbmlwdWxhdGVkXG4gKiBAcGFyYW0ge3N0cmluZ30gcHJvcGVydHkgVGhlIG5hbWUgb2YgdGhlIHByb3BlcnR5IHRvIGJlIG1hbmlwdWxhdGVkXG4gKlxuICogQG1lbWJlciBkYXQuY29udHJvbGxlcnNcbiAqL1xuZnVuY3Rpb24gQm9vbGVhbkNvbnRyb2xsZXIob2JqZWN0LCBwcm9wZXJ0eSkge1xuXG4gIEJvb2xlYW5Db250cm9sbGVyLnN1cGVyY2xhc3MuY2FsbCh0aGlzLCBvYmplY3QsIHByb3BlcnR5KTtcblxuICB2YXIgX3RoaXMgPSB0aGlzO1xuICB0aGlzLl9fcHJldiA9IHRoaXMuZ2V0VmFsdWUoKTtcblxuICB0aGlzLl9fY2hlY2tib3ggPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xuICB0aGlzLl9fY2hlY2tib3guc2V0QXR0cmlidXRlKCd0eXBlJywgJ2NoZWNrYm94Jyk7XG5cblxuICBkb20uYmluZCh0aGlzLl9fY2hlY2tib3gsICdjaGFuZ2UnLCBvbkNoYW5nZSwgZmFsc2UpO1xuXG4gIHRoaXMuZG9tRWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLl9fY2hlY2tib3gpO1xuXG4gIC8vIE1hdGNoIG9yaWdpbmFsIHZhbHVlXG4gIHRoaXMudXBkYXRlRGlzcGxheSgpO1xuXG4gIGZ1bmN0aW9uIG9uQ2hhbmdlKCkge1xuICAgIF90aGlzLnNldFZhbHVlKCFfdGhpcy5fX3ByZXYpO1xuICB9XG5cbn1cblxuQm9vbGVhbkNvbnRyb2xsZXIuc3VwZXJjbGFzcyA9IENvbnRyb2xsZXI7XG5cbmNvbW1vbi5leHRlbmQoXG5cbiAgQm9vbGVhbkNvbnRyb2xsZXIucHJvdG90eXBlLFxuICBDb250cm9sbGVyLnByb3RvdHlwZSxcbiAge1xuICAgIHNldFZhbHVlOiBmdW5jdGlvbih2KSB7XG4gICAgICB2YXIgdG9SZXR1cm4gPSBCb29sZWFuQ29udHJvbGxlci5zdXBlcmNsYXNzLnByb3RvdHlwZS5zZXRWYWx1ZS5jYWxsKHRoaXMsIHYpO1xuICAgICAgaWYgKHRoaXMuX19vbkZpbmlzaENoYW5nZSkge1xuICAgICAgICB0aGlzLl9fb25GaW5pc2hDaGFuZ2UuY2FsbCh0aGlzLCB0aGlzLmdldFZhbHVlKCkpO1xuICAgICAgfVxuICAgICAgdGhpcy5fX3ByZXYgPSB0aGlzLmdldFZhbHVlKCk7XG4gICAgICByZXR1cm4gdG9SZXR1cm47XG4gICAgfSxcblxuICAgIHVwZGF0ZURpc3BsYXk6IGZ1bmN0aW9uKCkge1xuXG4gICAgICBpZiAodGhpcy5nZXRWYWx1ZSgpID09PSB0cnVlKSB7XG4gICAgICAgIHRoaXMuX19jaGVja2JveC5zZXRBdHRyaWJ1dGUoJ2NoZWNrZWQnLCAnY2hlY2tlZCcpO1xuICAgICAgICB0aGlzLl9fY2hlY2tib3guY2hlY2tlZCA9IHRydWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9fY2hlY2tib3guY2hlY2tlZCA9IGZhbHNlO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gQm9vbGVhbkNvbnRyb2xsZXIuc3VwZXJjbGFzcy5wcm90b3R5cGUudXBkYXRlRGlzcGxheS5jYWxsKHRoaXMpO1xuXG4gICAgfVxuICB9XG4pO1xuIiwiLyoqXG4gKiBkYXQtZ3VpIEphdmFTY3JpcHQgQ29udHJvbGxlciBMaWJyYXJ5XG4gKiBodHRwOi8vY29kZS5nb29nbGUuY29tL3AvZGF0LWd1aVxuICpcbiAqIENvcHlyaWdodCAyMDExIERhdGEgQXJ0cyBUZWFtLCBHb29nbGUgQ3JlYXRpdmUgTGFiXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICovXG5cbnZhciBDb250cm9sbGVyID0gcmVxdWlyZSgnLi9Db250cm9sbGVyLmpzJyk7XG52YXIgY29tbW9uID0gcmVxdWlyZSgnLi4vdXRpbHMvY29tbW9uLmpzJyk7XG52YXIgZG9tID0gcmVxdWlyZSgnLi4vZG9tL2RvbS5qcycpO1xudmFyIENvbG9yID0gcmVxdWlyZSgnLi4vY29sb3IvQ29sb3IuanMnKTtcbnZhciBpbnRlcnByZXQgPSByZXF1aXJlKCcuLi9jb2xvci9pbnRlcnByZXQuanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBDb2xvckNvbnRyb2xsZXI7XG5cbmZ1bmN0aW9uIENvbG9yQ29udHJvbGxlcihvYmplY3QsIHByb3BlcnR5KSB7XG5cbiAgQ29sb3JDb250cm9sbGVyLnN1cGVyY2xhc3MuY2FsbCh0aGlzLCBvYmplY3QsIHByb3BlcnR5KTtcblxuICB0aGlzLl9fY29sb3IgPSBuZXcgQ29sb3IodGhpcy5nZXRWYWx1ZSgpKTtcbiAgdGhpcy5fX3RlbXAgPSBuZXcgQ29sb3IoMCk7XG5cbiAgdmFyIF90aGlzID0gdGhpcztcblxuICB0aGlzLmRvbUVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblxuICBkb20ubWFrZVNlbGVjdGFibGUodGhpcy5kb21FbGVtZW50LCBmYWxzZSk7XG5cbiAgdGhpcy5fX3NlbGVjdG9yID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIHRoaXMuX19zZWxlY3Rvci5jbGFzc05hbWUgPSAnc2VsZWN0b3InO1xuXG4gIHRoaXMuX19zYXR1cmF0aW9uX2ZpZWxkID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIHRoaXMuX19zYXR1cmF0aW9uX2ZpZWxkLmNsYXNzTmFtZSA9ICdzYXR1cmF0aW9uLWZpZWxkJztcblxuICB0aGlzLl9fZmllbGRfa25vYiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICB0aGlzLl9fZmllbGRfa25vYi5jbGFzc05hbWUgPSAnZmllbGQta25vYic7XG4gIHRoaXMuX19maWVsZF9rbm9iX2JvcmRlciA9ICcycHggc29saWQgJztcblxuICB0aGlzLl9faHVlX2tub2IgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgdGhpcy5fX2h1ZV9rbm9iLmNsYXNzTmFtZSA9ICdodWUta25vYic7XG5cbiAgdGhpcy5fX2h1ZV9maWVsZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICB0aGlzLl9faHVlX2ZpZWxkLmNsYXNzTmFtZSA9ICdodWUtZmllbGQnO1xuXG4gIHRoaXMuX19pbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG4gIHRoaXMuX19pbnB1dC50eXBlID0gJ3RleHQnO1xuICB0aGlzLl9faW5wdXRfdGV4dFNoYWRvdyA9ICcwIDFweCAxcHggJztcblxuICBkb20uYmluZCh0aGlzLl9faW5wdXQsICdrZXlkb3duJywgZnVuY3Rpb24oZSkge1xuICAgIGlmIChlLmtleUNvZGUgPT09IDEzKSB7IC8vIG9uIGVudGVyXG4gICAgICBvbkJsdXIuY2FsbCh0aGlzKTtcbiAgICB9XG4gIH0pO1xuXG4gIGRvbS5iaW5kKHRoaXMuX19pbnB1dCwgJ2JsdXInLCBvbkJsdXIpO1xuXG4gIGRvbS5iaW5kKHRoaXMuX19zZWxlY3RvciwgJ21vdXNlZG93bicsIGZ1bmN0aW9uKGUpIHtcblxuICAgIGRvbVxuICAgICAgLmFkZENsYXNzKHRoaXMsICdkcmFnJylcbiAgICAgIC5iaW5kKHdpbmRvdywgJ21vdXNldXAnLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIGRvbS5yZW1vdmVDbGFzcyhfdGhpcy5fX3NlbGVjdG9yLCAnZHJhZycpO1xuICAgICAgfSk7XG5cbiAgfSk7XG5cbiAgdmFyIHZhbHVlX2ZpZWxkID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cbiAgY29tbW9uLmV4dGVuZCh0aGlzLl9fc2VsZWN0b3Iuc3R5bGUsIHtcbiAgICB3aWR0aDogJzEyMnB4JyxcbiAgICBoZWlnaHQ6ICcxMDJweCcsXG4gICAgcGFkZGluZzogJzNweCcsXG4gICAgYmFja2dyb3VuZENvbG9yOiAnIzIyMicsXG4gICAgYm94U2hhZG93OiAnMHB4IDFweCAzcHggcmdiYSgwLDAsMCwwLjMpJ1xuICB9KTtcblxuICBjb21tb24uZXh0ZW5kKHRoaXMuX19maWVsZF9rbm9iLnN0eWxlLCB7XG4gICAgcG9zaXRpb246ICdhYnNvbHV0ZScsXG4gICAgd2lkdGg6ICcxMnB4JyxcbiAgICBoZWlnaHQ6ICcxMnB4JyxcbiAgICBib3JkZXI6IHRoaXMuX19maWVsZF9rbm9iX2JvcmRlciArICh0aGlzLl9fY29sb3IudiA8IC41ID8gJyNmZmYnIDogJyMwMDAnKSxcbiAgICBib3hTaGFkb3c6ICcwcHggMXB4IDNweCByZ2JhKDAsMCwwLDAuNSknLFxuICAgIGJvcmRlclJhZGl1czogJzEycHgnLFxuICAgIHpJbmRleDogMVxuICB9KTtcblxuICBjb21tb24uZXh0ZW5kKHRoaXMuX19odWVfa25vYi5zdHlsZSwge1xuICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxuICAgIHdpZHRoOiAnMTVweCcsXG4gICAgaGVpZ2h0OiAnMnB4JyxcbiAgICBib3JkZXJSaWdodDogJzRweCBzb2xpZCAjZmZmJyxcbiAgICB6SW5kZXg6IDFcbiAgfSk7XG5cbiAgY29tbW9uLmV4dGVuZCh0aGlzLl9fc2F0dXJhdGlvbl9maWVsZC5zdHlsZSwge1xuICAgIHdpZHRoOiAnMTAwcHgnLFxuICAgIGhlaWdodDogJzEwMHB4JyxcbiAgICBib3JkZXI6ICcxcHggc29saWQgIzU1NScsXG4gICAgbWFyZ2luUmlnaHQ6ICczcHgnLFxuICAgIGRpc3BsYXk6ICdpbmxpbmUtYmxvY2snLFxuICAgIGN1cnNvcjogJ3BvaW50ZXInXG4gIH0pO1xuXG4gIGNvbW1vbi5leHRlbmQodmFsdWVfZmllbGQuc3R5bGUsIHtcbiAgICB3aWR0aDogJzEwMCUnLFxuICAgIGhlaWdodDogJzEwMCUnLFxuICAgIGJhY2tncm91bmQ6ICdub25lJ1xuICB9KTtcblxuICBsaW5lYXJHcmFkaWVudCh2YWx1ZV9maWVsZCwgJ3RvcCcsICdyZ2JhKDAsMCwwLDApJywgJyMwMDAnKTtcblxuICBjb21tb24uZXh0ZW5kKHRoaXMuX19odWVfZmllbGQuc3R5bGUsIHtcbiAgICB3aWR0aDogJzE1cHgnLFxuICAgIGhlaWdodDogJzEwMHB4JyxcbiAgICBkaXNwbGF5OiAnaW5saW5lLWJsb2NrJyxcbiAgICBib3JkZXI6ICcxcHggc29saWQgIzU1NScsXG4gICAgY3Vyc29yOiAnbnMtcmVzaXplJ1xuICB9KTtcblxuICBodWVHcmFkaWVudCh0aGlzLl9faHVlX2ZpZWxkKTtcblxuICBjb21tb24uZXh0ZW5kKHRoaXMuX19pbnB1dC5zdHlsZSwge1xuICAgIG91dGxpbmU6ICdub25lJyxcbiAgICAvLyAgICAgIHdpZHRoOiAnMTIwcHgnLFxuICAgIHRleHRBbGlnbjogJ2NlbnRlcicsXG4gICAgLy8gICAgICBwYWRkaW5nOiAnNHB4JyxcbiAgICAvLyAgICAgIG1hcmdpbkJvdHRvbTogJzZweCcsXG4gICAgY29sb3I6ICcjZmZmJyxcbiAgICBib3JkZXI6IDAsXG4gICAgZm9udFdlaWdodDogJ2JvbGQnLFxuICAgIHRleHRTaGFkb3c6IHRoaXMuX19pbnB1dF90ZXh0U2hhZG93ICsgJ3JnYmEoMCwwLDAsMC43KSdcbiAgfSk7XG5cbiAgZG9tLmJpbmQodGhpcy5fX3NhdHVyYXRpb25fZmllbGQsICdtb3VzZWRvd24nLCBmaWVsZERvd24pO1xuICBkb20uYmluZCh0aGlzLl9fZmllbGRfa25vYiwgJ21vdXNlZG93bicsIGZpZWxkRG93bik7XG5cbiAgZG9tLmJpbmQodGhpcy5fX2h1ZV9maWVsZCwgJ21vdXNlZG93bicsIGZ1bmN0aW9uKGUpIHtcbiAgICBzZXRIKGUpO1xuICAgIGRvbS5iaW5kKHdpbmRvdywgJ21vdXNlbW92ZScsIHNldEgpO1xuICAgIGRvbS5iaW5kKHdpbmRvdywgJ21vdXNldXAnLCB1bmJpbmRIKTtcbiAgfSk7XG5cbiAgZnVuY3Rpb24gZmllbGREb3duKGUpIHtcbiAgICBzZXRTVihlKTtcbiAgICAvLyBkb2N1bWVudC5ib2R5LnN0eWxlLmN1cnNvciA9ICdub25lJztcbiAgICBkb20uYmluZCh3aW5kb3csICdtb3VzZW1vdmUnLCBzZXRTVik7XG4gICAgZG9tLmJpbmQod2luZG93LCAnbW91c2V1cCcsIHVuYmluZFNWKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHVuYmluZFNWKCkge1xuICAgIGRvbS51bmJpbmQod2luZG93LCAnbW91c2Vtb3ZlJywgc2V0U1YpO1xuICAgIGRvbS51bmJpbmQod2luZG93LCAnbW91c2V1cCcsIHVuYmluZFNWKTtcbiAgICAvLyBkb2N1bWVudC5ib2R5LnN0eWxlLmN1cnNvciA9ICdkZWZhdWx0JztcbiAgfVxuXG4gIGZ1bmN0aW9uIG9uQmx1cigpIHtcbiAgICB2YXIgaSA9IGludGVycHJldCh0aGlzLnZhbHVlKTtcbiAgICBpZiAoaSAhPT0gZmFsc2UpIHtcbiAgICAgIF90aGlzLl9fY29sb3IuX19zdGF0ZSA9IGk7XG4gICAgICBfdGhpcy5zZXRWYWx1ZShfdGhpcy5fX2NvbG9yLnRvT3JpZ2luYWwoKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMudmFsdWUgPSBfdGhpcy5fX2NvbG9yLnRvU3RyaW5nKCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gdW5iaW5kSCgpIHtcbiAgICBkb20udW5iaW5kKHdpbmRvdywgJ21vdXNlbW92ZScsIHNldEgpO1xuICAgIGRvbS51bmJpbmQod2luZG93LCAnbW91c2V1cCcsIHVuYmluZEgpO1xuICB9XG5cbiAgdGhpcy5fX3NhdHVyYXRpb25fZmllbGQuYXBwZW5kQ2hpbGQodmFsdWVfZmllbGQpO1xuICB0aGlzLl9fc2VsZWN0b3IuYXBwZW5kQ2hpbGQodGhpcy5fX2ZpZWxkX2tub2IpO1xuICB0aGlzLl9fc2VsZWN0b3IuYXBwZW5kQ2hpbGQodGhpcy5fX3NhdHVyYXRpb25fZmllbGQpO1xuICB0aGlzLl9fc2VsZWN0b3IuYXBwZW5kQ2hpbGQodGhpcy5fX2h1ZV9maWVsZCk7XG4gIHRoaXMuX19odWVfZmllbGQuYXBwZW5kQ2hpbGQodGhpcy5fX2h1ZV9rbm9iKTtcblxuICB0aGlzLmRvbUVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5fX2lucHV0KTtcbiAgdGhpcy5kb21FbGVtZW50LmFwcGVuZENoaWxkKHRoaXMuX19zZWxlY3Rvcik7XG5cbiAgdGhpcy51cGRhdGVEaXNwbGF5KCk7XG5cbiAgZnVuY3Rpb24gc2V0U1YoZSkge1xuXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgdmFyIHcgPSBkb20uZ2V0V2lkdGgoX3RoaXMuX19zYXR1cmF0aW9uX2ZpZWxkKTtcbiAgICB2YXIgbyA9IGRvbS5nZXRPZmZzZXQoX3RoaXMuX19zYXR1cmF0aW9uX2ZpZWxkKTtcbiAgICB2YXIgcyA9IChlLmNsaWVudFggLSBvLmxlZnQgKyBkb2N1bWVudC5ib2R5LnNjcm9sbExlZnQpIC8gdztcbiAgICB2YXIgdiA9IDEgLSAoZS5jbGllbnRZIC0gby50b3AgKyBkb2N1bWVudC5ib2R5LnNjcm9sbFRvcCkgLyB3O1xuXG4gICAgaWYgKHYgPiAxKSB2ID0gMTtcbiAgICBlbHNlIGlmICh2IDwgMCkgdiA9IDA7XG5cbiAgICBpZiAocyA+IDEpIHMgPSAxO1xuICAgIGVsc2UgaWYgKHMgPCAwKSBzID0gMDtcblxuICAgIF90aGlzLl9fY29sb3IudiA9IHY7XG4gICAgX3RoaXMuX19jb2xvci5zID0gcztcblxuICAgIF90aGlzLnNldFZhbHVlKF90aGlzLl9fY29sb3IudG9PcmlnaW5hbCgpKTtcblxuXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIH1cblxuICBmdW5jdGlvbiBzZXRIKGUpIHtcblxuICAgIGUucHJldmVudERlZmF1bHQoKTtcblxuICAgIHZhciBzID0gZG9tLmdldEhlaWdodChfdGhpcy5fX2h1ZV9maWVsZCk7XG4gICAgdmFyIG8gPSBkb20uZ2V0T2Zmc2V0KF90aGlzLl9faHVlX2ZpZWxkKTtcbiAgICB2YXIgaCA9IDEgLSAoZS5jbGllbnRZIC0gby50b3AgKyBkb2N1bWVudC5ib2R5LnNjcm9sbFRvcCkgLyBzO1xuXG4gICAgaWYgKGggPiAxKSBoID0gMTtcbiAgICBlbHNlIGlmIChoIDwgMCkgaCA9IDA7XG5cbiAgICBfdGhpcy5fX2NvbG9yLmggPSBoICogMzYwO1xuXG4gICAgX3RoaXMuc2V0VmFsdWUoX3RoaXMuX19jb2xvci50b09yaWdpbmFsKCkpO1xuXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIH1cblxufTtcblxuQ29sb3JDb250cm9sbGVyLnN1cGVyY2xhc3MgPSBDb250cm9sbGVyO1xuXG5jb21tb24uZXh0ZW5kKFxuXG4gIENvbG9yQ29udHJvbGxlci5wcm90b3R5cGUsXG4gIENvbnRyb2xsZXIucHJvdG90eXBlLFxuXG4gIHtcblxuICAgIHVwZGF0ZURpc3BsYXk6IGZ1bmN0aW9uKCkge1xuXG4gICAgICB2YXIgaSA9IGludGVycHJldCh0aGlzLmdldFZhbHVlKCkpO1xuXG4gICAgICBpZiAoaSAhPT0gZmFsc2UpIHtcblxuICAgICAgICB2YXIgbWlzbWF0Y2ggPSBmYWxzZTtcblxuICAgICAgICAvLyBDaGVjayBmb3IgbWlzbWF0Y2ggb24gdGhlIGludGVycHJldGVkIHZhbHVlLlxuXG4gICAgICAgIGNvbW1vbi5lYWNoKENvbG9yLkNPTVBPTkVOVFMsIGZ1bmN0aW9uKGNvbXBvbmVudCkge1xuICAgICAgICAgIGlmICghY29tbW9uLmlzVW5kZWZpbmVkKGlbY29tcG9uZW50XSkgJiZcbiAgICAgICAgICAgICFjb21tb24uaXNVbmRlZmluZWQodGhpcy5fX2NvbG9yLl9fc3RhdGVbY29tcG9uZW50XSkgJiZcbiAgICAgICAgICAgIGlbY29tcG9uZW50XSAhPT0gdGhpcy5fX2NvbG9yLl9fc3RhdGVbY29tcG9uZW50XSkge1xuICAgICAgICAgICAgbWlzbWF0Y2ggPSB0cnVlO1xuICAgICAgICAgICAgcmV0dXJuIHt9OyAvLyBicmVha1xuICAgICAgICAgIH1cbiAgICAgICAgfSwgdGhpcyk7XG5cbiAgICAgICAgLy8gSWYgbm90aGluZyBkaXZlcmdlcywgd2Uga2VlcCBvdXIgcHJldmlvdXMgdmFsdWVzXG4gICAgICAgIC8vIGZvciBzdGF0ZWZ1bG5lc3MsIG90aGVyd2lzZSB3ZSByZWNhbGN1bGF0ZSBmcmVzaFxuICAgICAgICBpZiAobWlzbWF0Y2gpIHtcbiAgICAgICAgICBjb21tb24uZXh0ZW5kKHRoaXMuX19jb2xvci5fX3N0YXRlLCBpKTtcbiAgICAgICAgfVxuXG4gICAgICB9XG5cbiAgICAgIGNvbW1vbi5leHRlbmQodGhpcy5fX3RlbXAuX19zdGF0ZSwgdGhpcy5fX2NvbG9yLl9fc3RhdGUpO1xuXG4gICAgICB0aGlzLl9fdGVtcC5hID0gMTtcblxuICAgICAgdmFyIGZsaXAgPSAodGhpcy5fX2NvbG9yLnYgPCAuNSB8fCB0aGlzLl9fY29sb3IucyA+IC41KSA/IDI1NSA6IDA7XG4gICAgICB2YXIgX2ZsaXAgPSAyNTUgLSBmbGlwO1xuXG4gICAgICBjb21tb24uZXh0ZW5kKHRoaXMuX19maWVsZF9rbm9iLnN0eWxlLCB7XG4gICAgICAgIG1hcmdpbkxlZnQ6IDEwMCAqIHRoaXMuX19jb2xvci5zIC0gNyArICdweCcsXG4gICAgICAgIG1hcmdpblRvcDogMTAwICogKDEgLSB0aGlzLl9fY29sb3IudikgLSA3ICsgJ3B4JyxcbiAgICAgICAgYmFja2dyb3VuZENvbG9yOiB0aGlzLl9fdGVtcC50b1N0cmluZygpLFxuICAgICAgICBib3JkZXI6IHRoaXMuX19maWVsZF9rbm9iX2JvcmRlciArICdyZ2IoJyArIGZsaXAgKyAnLCcgKyBmbGlwICsgJywnICsgZmxpcCArICcpJ1xuICAgICAgfSk7XG5cbiAgICAgIHRoaXMuX19odWVfa25vYi5zdHlsZS5tYXJnaW5Ub3AgPSAoMSAtIHRoaXMuX19jb2xvci5oIC8gMzYwKSAqIDEwMCArICdweCdcblxuICAgICAgdGhpcy5fX3RlbXAucyA9IDE7XG4gICAgICB0aGlzLl9fdGVtcC52ID0gMTtcblxuICAgICAgbGluZWFyR3JhZGllbnQodGhpcy5fX3NhdHVyYXRpb25fZmllbGQsICdsZWZ0JywgJyNmZmYnLCB0aGlzLl9fdGVtcC50b1N0cmluZygpKTtcblxuICAgICAgY29tbW9uLmV4dGVuZCh0aGlzLl9faW5wdXQuc3R5bGUsIHtcbiAgICAgICAgYmFja2dyb3VuZENvbG9yOiB0aGlzLl9faW5wdXQudmFsdWUgPSB0aGlzLl9fY29sb3IudG9TdHJpbmcoKSxcbiAgICAgICAgY29sb3I6ICdyZ2IoJyArIGZsaXAgKyAnLCcgKyBmbGlwICsgJywnICsgZmxpcCArICcpJyxcbiAgICAgICAgdGV4dFNoYWRvdzogdGhpcy5fX2lucHV0X3RleHRTaGFkb3cgKyAncmdiYSgnICsgX2ZsaXAgKyAnLCcgKyBfZmxpcCArICcsJyArIF9mbGlwICsgJywuNyknXG4gICAgICB9KTtcblxuICAgIH1cblxuICB9XG5cbik7XG5cbnZhciB2ZW5kb3JzID0gWyctbW96LScsICctby0nLCAnLXdlYmtpdC0nLCAnLW1zLScsICcnXTtcblxuZnVuY3Rpb24gbGluZWFyR3JhZGllbnQoZWxlbSwgeCwgYSwgYikge1xuICBlbGVtLnN0eWxlLmJhY2tncm91bmQgPSAnJztcbiAgY29tbW9uLmVhY2godmVuZG9ycywgZnVuY3Rpb24odmVuZG9yKSB7XG4gICAgZWxlbS5zdHlsZS5jc3NUZXh0ICs9ICdiYWNrZ3JvdW5kOiAnICsgdmVuZG9yICsgJ2xpbmVhci1ncmFkaWVudCgnICsgeCArICcsICcgKyBhICsgJyAwJSwgJyArIGIgKyAnIDEwMCUpOyAnO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gaHVlR3JhZGllbnQoZWxlbSkge1xuICBlbGVtLnN0eWxlLmJhY2tncm91bmQgPSAnJztcbiAgZWxlbS5zdHlsZS5jc3NUZXh0ICs9ICdiYWNrZ3JvdW5kOiAtbW96LWxpbmVhci1ncmFkaWVudCh0b3AsICAjZmYwMDAwIDAlLCAjZmYwMGZmIDE3JSwgIzAwMDBmZiAzNCUsICMwMGZmZmYgNTAlLCAjMDBmZjAwIDY3JSwgI2ZmZmYwMCA4NCUsICNmZjAwMDAgMTAwJSk7J1xuICBlbGVtLnN0eWxlLmNzc1RleHQgKz0gJ2JhY2tncm91bmQ6IC13ZWJraXQtbGluZWFyLWdyYWRpZW50KHRvcCwgICNmZjAwMDAgMCUsI2ZmMDBmZiAxNyUsIzAwMDBmZiAzNCUsIzAwZmZmZiA1MCUsIzAwZmYwMCA2NyUsI2ZmZmYwMCA4NCUsI2ZmMDAwMCAxMDAlKTsnXG4gIGVsZW0uc3R5bGUuY3NzVGV4dCArPSAnYmFja2dyb3VuZDogLW8tbGluZWFyLWdyYWRpZW50KHRvcCwgICNmZjAwMDAgMCUsI2ZmMDBmZiAxNyUsIzAwMDBmZiAzNCUsIzAwZmZmZiA1MCUsIzAwZmYwMCA2NyUsI2ZmZmYwMCA4NCUsI2ZmMDAwMCAxMDAlKTsnXG4gIGVsZW0uc3R5bGUuY3NzVGV4dCArPSAnYmFja2dyb3VuZDogLW1zLWxpbmVhci1ncmFkaWVudCh0b3AsICAjZmYwMDAwIDAlLCNmZjAwZmYgMTclLCMwMDAwZmYgMzQlLCMwMGZmZmYgNTAlLCMwMGZmMDAgNjclLCNmZmZmMDAgODQlLCNmZjAwMDAgMTAwJSk7J1xuICBlbGVtLnN0eWxlLmNzc1RleHQgKz0gJ2JhY2tncm91bmQ6IGxpbmVhci1ncmFkaWVudCh0b3AsICAjZmYwMDAwIDAlLCNmZjAwZmYgMTclLCMwMDAwZmYgMzQlLCMwMGZmZmYgNTAlLCMwMGZmMDAgNjclLCNmZmZmMDAgODQlLCNmZjAwMDAgMTAwJSk7J1xufVxuIiwiLyoqXG4gKiBkYXQtZ3VpIEphdmFTY3JpcHQgQ29udHJvbGxlciBMaWJyYXJ5XG4gKiBodHRwOi8vY29kZS5nb29nbGUuY29tL3AvZGF0LWd1aVxuICpcbiAqIENvcHlyaWdodCAyMDExIERhdGEgQXJ0cyBUZWFtLCBHb29nbGUgQ3JlYXRpdmUgTGFiXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICovXG5cbnZhciBjb21tb24gPSByZXF1aXJlKCcuLi91dGlscy9jb21tb24uanMnKTtcbnZhciBlc2NhcGUgPSByZXF1aXJlKCcuLi91dGlscy9lc2NhcGVIdG1sLmpzJyk7XG5tb2R1bGUuZXhwb3J0cyA9IENvbnRyb2xsZXI7XG5cbi8qKlxuICogQGNsYXNzIEFuIFwiYWJzdHJhY3RcIiBjbGFzcyB0aGF0IHJlcHJlc2VudHMgYSBnaXZlbiBwcm9wZXJ0eSBvZiBhbiBvYmplY3QuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIGJlIG1hbmlwdWxhdGVkXG4gKiBAcGFyYW0ge3N0cmluZ30gcHJvcGVydHkgVGhlIG5hbWUgb2YgdGhlIHByb3BlcnR5IHRvIGJlIG1hbmlwdWxhdGVkXG4gKlxuICogQG1lbWJlciBkYXQuY29udHJvbGxlcnNcbiAqL1xuZnVuY3Rpb24gQ29udHJvbGxlcihvYmplY3QsIHByb3BlcnR5KSB7XG5cbiAgdGhpcy5pbml0aWFsVmFsdWUgPSBvYmplY3RbcHJvcGVydHldO1xuXG4gIC8qKlxuICAgKiBUaG9zZSB3aG8gZXh0ZW5kIHRoaXMgY2xhc3Mgd2lsbCBwdXQgdGhlaXIgRE9NIGVsZW1lbnRzIGluIGhlcmUuXG4gICAqIEB0eXBlIHtET01FbGVtZW50fVxuICAgKi9cbiAgdGhpcy5kb21FbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cbiAgLyoqXG4gICAqIFRoZSBvYmplY3QgdG8gbWFuaXB1bGF0ZVxuICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgKi9cbiAgdGhpcy5vYmplY3QgPSBvYmplY3Q7XG5cbiAgLyoqXG4gICAqIFRoZSBuYW1lIG9mIHRoZSBwcm9wZXJ0eSB0byBtYW5pcHVsYXRlXG4gICAqIEB0eXBlIHtTdHJpbmd9XG4gICAqL1xuICB0aGlzLnByb3BlcnR5ID0gcHJvcGVydHk7XG5cbiAgLyoqXG4gICAqIFRoZSBmdW5jdGlvbiB0byBiZSBjYWxsZWQgb24gY2hhbmdlLlxuICAgKiBAdHlwZSB7RnVuY3Rpb259XG4gICAqIEBpZ25vcmVcbiAgICovXG4gIHRoaXMuX19vbkNoYW5nZSA9IHVuZGVmaW5lZDtcblxuICAvKipcbiAgICogVGhlIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCBvbiBmaW5pc2hpbmcgY2hhbmdlLlxuICAgKiBAdHlwZSB7RnVuY3Rpb259XG4gICAqIEBpZ25vcmVcbiAgICovXG4gIHRoaXMuX19vbkZpbmlzaENoYW5nZSA9IHVuZGVmaW5lZDtcblxufVxuXG5jb21tb24uZXh0ZW5kKFxuXG4gIENvbnRyb2xsZXIucHJvdG90eXBlLFxuXG4gIC8qKiBAbGVuZHMgZGF0LmNvbnRyb2xsZXJzLkNvbnRyb2xsZXIucHJvdG90eXBlICovXG4gIHtcblxuICAgIC8qKlxuICAgICAqIFNwZWNpZnkgdGhhdCBhIGZ1bmN0aW9uIGZpcmUgZXZlcnkgdGltZSBzb21lb25lIGNoYW5nZXMgdGhlIHZhbHVlIHdpdGhcbiAgICAgKiB0aGlzIENvbnRyb2xsZXIuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbmMgVGhpcyBmdW5jdGlvbiB3aWxsIGJlIGNhbGxlZCB3aGVuZXZlciB0aGUgdmFsdWVcbiAgICAgKiBpcyBtb2RpZmllZCB2aWEgdGhpcyBDb250cm9sbGVyLlxuICAgICAqIEByZXR1cm5zIHtkYXQuY29udHJvbGxlcnMuQ29udHJvbGxlcn0gdGhpc1xuICAgICAqL1xuICAgIG9uQ2hhbmdlOiBmdW5jdGlvbihmbmMpIHtcbiAgICAgIHRoaXMuX19vbkNoYW5nZSA9IGZuYztcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTcGVjaWZ5IHRoYXQgYSBmdW5jdGlvbiBmaXJlIGV2ZXJ5IHRpbWUgc29tZW9uZSBcImZpbmlzaGVzXCIgY2hhbmdpbmdcbiAgICAgKiB0aGUgdmFsdWUgd2loIHRoaXMgQ29udHJvbGxlci4gVXNlZnVsIGZvciB2YWx1ZXMgdGhhdCBjaGFuZ2VcbiAgICAgKiBpbmNyZW1lbnRhbGx5IGxpa2UgbnVtYmVycyBvciBzdHJpbmdzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZm5jIFRoaXMgZnVuY3Rpb24gd2lsbCBiZSBjYWxsZWQgd2hlbmV2ZXJcbiAgICAgKiBzb21lb25lIFwiZmluaXNoZXNcIiBjaGFuZ2luZyB0aGUgdmFsdWUgdmlhIHRoaXMgQ29udHJvbGxlci5cbiAgICAgKiBAcmV0dXJucyB7ZGF0LmNvbnRyb2xsZXJzLkNvbnRyb2xsZXJ9IHRoaXNcbiAgICAgKi9cbiAgICBvbkZpbmlzaENoYW5nZTogZnVuY3Rpb24oZm5jKSB7XG4gICAgICB0aGlzLl9fb25GaW5pc2hDaGFuZ2UgPSBmbmM7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2hhbmdlIHRoZSB2YWx1ZSBvZiA8Y29kZT5vYmplY3RbcHJvcGVydHldPC9jb2RlPlxuICAgICAqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG5ld1ZhbHVlIFRoZSBuZXcgdmFsdWUgb2YgPGNvZGU+b2JqZWN0W3Byb3BlcnR5XTwvY29kZT5cbiAgICAgKi9cbiAgICBzZXRWYWx1ZTogZnVuY3Rpb24obmV3VmFsdWUpIHtcbiAgICAgIHRoaXMub2JqZWN0W3RoaXMucHJvcGVydHldID0gbmV3VmFsdWU7XG4gICAgICBpZiAodGhpcy5fX29uQ2hhbmdlKSB7XG4gICAgICAgIHRoaXMuX19vbkNoYW5nZS5jYWxsKHRoaXMsIG5ld1ZhbHVlKTtcbiAgICAgIH1cbiAgICAgIHRoaXMudXBkYXRlRGlzcGxheSgpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldHMgdGhlIHZhbHVlIG9mIDxjb2RlPm9iamVjdFtwcm9wZXJ0eV08L2NvZGU+XG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7T2JqZWN0fSBUaGUgY3VycmVudCB2YWx1ZSBvZiA8Y29kZT5vYmplY3RbcHJvcGVydHldPC9jb2RlPlxuICAgICAqL1xuICAgIGdldFZhbHVlOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLm9iamVjdFt0aGlzLnByb3BlcnR5XTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVmcmVzaGVzIHRoZSB2aXN1YWwgZGlzcGxheSBvZiBhIENvbnRyb2xsZXIgaW4gb3JkZXIgdG8ga2VlcCBzeW5jXG4gICAgICogd2l0aCB0aGUgb2JqZWN0J3MgY3VycmVudCB2YWx1ZS5cbiAgICAgKiBAcmV0dXJucyB7ZGF0LmNvbnRyb2xsZXJzLkNvbnRyb2xsZXJ9IHRoaXNcbiAgICAgKi9cbiAgICB1cGRhdGVEaXNwbGF5OiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBAcmV0dXJucyB7Qm9vbGVhbn0gdHJ1ZSBpZiB0aGUgdmFsdWUgaGFzIGRldmlhdGVkIGZyb20gaW5pdGlhbFZhbHVlXG4gICAgICovXG4gICAgaXNNb2RpZmllZDogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5pbml0aWFsVmFsdWUgIT09IHRoaXMuZ2V0VmFsdWUoKTtcbiAgICB9XG4gIH1cblxuKTtcblxuIiwiLyoqXG4gKiBkYXQtZ3VpIEphdmFTY3JpcHQgQ29udHJvbGxlciBMaWJyYXJ5XG4gKiBodHRwOi8vY29kZS5nb29nbGUuY29tL3AvZGF0LWd1aVxuICpcbiAqIENvcHlyaWdodCAyMDExIERhdGEgQXJ0cyBUZWFtLCBHb29nbGUgQ3JlYXRpdmUgTGFiXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICovXG5cbnZhciBDb250cm9sbGVyID0gcmVxdWlyZSgnLi9Db250cm9sbGVyLmpzJyk7XG52YXIgY29tbW9uID0gcmVxdWlyZSgnLi4vdXRpbHMvY29tbW9uLmpzJyk7XG52YXIgZG9tID0gcmVxdWlyZSgnLi4vZG9tL2RvbS5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZ1bmN0aW9uQ29udHJvbGxlcjtcblxuLyoqXG4gKiBAY2xhc3MgUHJvdmlkZXMgYSBHVUkgaW50ZXJmYWNlIHRvIGZpcmUgYSBzcGVjaWZpZWQgbWV0aG9kLCBhIHByb3BlcnR5IG9mIGFuIG9iamVjdC5cbiAqXG4gKiBAZXh0ZW5kcyBkYXQuY29udHJvbGxlcnMuQ29udHJvbGxlclxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBiZSBtYW5pcHVsYXRlZFxuICogQHBhcmFtIHtzdHJpbmd9IHByb3BlcnR5IFRoZSBuYW1lIG9mIHRoZSBwcm9wZXJ0eSB0byBiZSBtYW5pcHVsYXRlZFxuICpcbiAqIEBtZW1iZXIgZGF0LmNvbnRyb2xsZXJzXG4gKi9cbmZ1bmN0aW9uIEZ1bmN0aW9uQ29udHJvbGxlcihvYmplY3QsIHByb3BlcnR5LCB0ZXh0KSB7XG5cbiAgRnVuY3Rpb25Db250cm9sbGVyLnN1cGVyY2xhc3MuY2FsbCh0aGlzLCBvYmplY3QsIHByb3BlcnR5KTtcblxuICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gIHRoaXMuX19idXR0b24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgdGhpcy5fX2J1dHRvbi5pbm5lckhUTUwgPSB0ZXh0ID09PSB1bmRlZmluZWQgPyAnRmlyZScgOiB0ZXh0O1xuICBkb20uYmluZCh0aGlzLl9fYnV0dG9uLCAnY2xpY2snLCBmdW5jdGlvbihlKSB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIF90aGlzLmZpcmUoKTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH0pO1xuXG4gIGRvbS5hZGRDbGFzcyh0aGlzLl9fYnV0dG9uLCAnYnV0dG9uJyk7XG5cbiAgdGhpcy5kb21FbGVtZW50LmFwcGVuZENoaWxkKHRoaXMuX19idXR0b24pO1xuXG59XG5cbkZ1bmN0aW9uQ29udHJvbGxlci5zdXBlcmNsYXNzID0gQ29udHJvbGxlcjtcblxuY29tbW9uLmV4dGVuZChcblxuICBGdW5jdGlvbkNvbnRyb2xsZXIucHJvdG90eXBlLFxuICBDb250cm9sbGVyLnByb3RvdHlwZSwge1xuXG4gICAgZmlyZTogZnVuY3Rpb24oKSB7XG4gICAgICBpZiAodGhpcy5fX29uQ2hhbmdlKSB7XG4gICAgICAgIHRoaXMuX19vbkNoYW5nZS5jYWxsKHRoaXMpO1xuICAgICAgfVxuICAgICAgdGhpcy5nZXRWYWx1ZSgpLmNhbGwodGhpcy5vYmplY3QpO1xuICAgICAgaWYgKHRoaXMuX19vbkZpbmlzaENoYW5nZSkge1xuICAgICAgICB0aGlzLl9fb25GaW5pc2hDaGFuZ2UuY2FsbCh0aGlzLCB0aGlzLmdldFZhbHVlKCkpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4pO1xuIiwiLyoqXG4gKiBkYXQtZ3VpIEphdmFTY3JpcHQgQ29udHJvbGxlciBMaWJyYXJ5XG4gKiBodHRwOi8vY29kZS5nb29nbGUuY29tL3AvZGF0LWd1aVxuICpcbiAqIENvcHlyaWdodCAyMDExIERhdGEgQXJ0cyBUZWFtLCBHb29nbGUgQ3JlYXRpdmUgTGFiXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICovXG5cbnZhciBDb250cm9sbGVyID0gcmVxdWlyZSgnLi9Db250cm9sbGVyLmpzJyk7XG52YXIgY29tbW9uID0gcmVxdWlyZSgnLi4vdXRpbHMvY29tbW9uLmpzJyk7XG5tb2R1bGUuZXhwb3J0cyA9IE51bWJlckNvbnRyb2xsZXI7XG5cbi8qKlxuICogQGNsYXNzIFJlcHJlc2VudHMgYSBnaXZlbiBwcm9wZXJ0eSBvZiBhbiBvYmplY3QgdGhhdCBpcyBhIG51bWJlci5cbiAqXG4gKiBAZXh0ZW5kcyBkYXQuY29udHJvbGxlcnMuQ29udHJvbGxlclxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBiZSBtYW5pcHVsYXRlZFxuICogQHBhcmFtIHtzdHJpbmd9IHByb3BlcnR5IFRoZSBuYW1lIG9mIHRoZSBwcm9wZXJ0eSB0byBiZSBtYW5pcHVsYXRlZFxuICogQHBhcmFtIHtPYmplY3R9IFtwYXJhbXNdIE9wdGlvbmFsIHBhcmFtZXRlcnNcbiAqIEBwYXJhbSB7TnVtYmVyfSBbcGFyYW1zLm1pbl0gTWluaW11bSBhbGxvd2VkIHZhbHVlXG4gKiBAcGFyYW0ge051bWJlcn0gW3BhcmFtcy5tYXhdIE1heGltdW0gYWxsb3dlZCB2YWx1ZVxuICogQHBhcmFtIHtOdW1iZXJ9IFtwYXJhbXMuc3RlcF0gSW5jcmVtZW50IGJ5IHdoaWNoIHRvIGNoYW5nZSB2YWx1ZVxuICpcbiAqIEBtZW1iZXIgZGF0LmNvbnRyb2xsZXJzXG4gKi9cbmZ1bmN0aW9uIE51bWJlckNvbnRyb2xsZXIob2JqZWN0LCBwcm9wZXJ0eSwgcGFyYW1zKSB7XG5cbiAgTnVtYmVyQ29udHJvbGxlci5zdXBlcmNsYXNzLmNhbGwodGhpcywgb2JqZWN0LCBwcm9wZXJ0eSk7XG5cbiAgcGFyYW1zID0gcGFyYW1zIHx8IHt9O1xuXG4gIHRoaXMuX19taW4gPSBwYXJhbXMubWluO1xuICB0aGlzLl9fbWF4ID0gcGFyYW1zLm1heDtcbiAgdGhpcy5fX3N0ZXAgPSBwYXJhbXMuc3RlcDtcblxuICBpZiAoY29tbW9uLmlzVW5kZWZpbmVkKHRoaXMuX19zdGVwKSkge1xuXG4gICAgaWYgKHRoaXMuaW5pdGlhbFZhbHVlID09IDApIHtcbiAgICAgIHRoaXMuX19pbXBsaWVkU3RlcCA9IDE7IC8vIFdoYXQgYXJlIHdlLCBwc3ljaGljcz9cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gSGV5IERvdWcsIGNoZWNrIHRoaXMgb3V0LlxuICAgICAgdGhpcy5fX2ltcGxpZWRTdGVwID0gTWF0aC5wb3coMTAsIE1hdGguZmxvb3IoTWF0aC5sb2codGhpcy5pbml0aWFsVmFsdWUpIC8gTWF0aC5MTjEwKSkgLyAxMDtcbiAgICB9XG5cbiAgfSBlbHNlIHtcblxuICAgIHRoaXMuX19pbXBsaWVkU3RlcCA9IHRoaXMuX19zdGVwO1xuXG4gIH1cblxuICB0aGlzLl9fcHJlY2lzaW9uID0gbnVtRGVjaW1hbHModGhpcy5fX2ltcGxpZWRTdGVwKTtcblxuXG59XG5cbk51bWJlckNvbnRyb2xsZXIuc3VwZXJjbGFzcyA9IENvbnRyb2xsZXI7XG5cbmNvbW1vbi5leHRlbmQoXG5cbiAgTnVtYmVyQ29udHJvbGxlci5wcm90b3R5cGUsXG4gIENvbnRyb2xsZXIucHJvdG90eXBlLFxuXG4gIC8qKiBAbGVuZHMgZGF0LmNvbnRyb2xsZXJzLk51bWJlckNvbnRyb2xsZXIucHJvdG90eXBlICovXG4gIHtcblxuICAgIHNldFZhbHVlOiBmdW5jdGlvbih2KSB7XG5cbiAgICAgIGlmICh0aGlzLl9fbWluICE9PSB1bmRlZmluZWQgJiYgdiA8IHRoaXMuX19taW4pIHtcbiAgICAgICAgdiA9IHRoaXMuX19taW47XG4gICAgICB9IGVsc2UgaWYgKHRoaXMuX19tYXggIT09IHVuZGVmaW5lZCAmJiB2ID4gdGhpcy5fX21heCkge1xuICAgICAgICB2ID0gdGhpcy5fX21heDtcbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMuX19zdGVwICE9PSB1bmRlZmluZWQgJiYgdiAlIHRoaXMuX19zdGVwICE9IDApIHtcbiAgICAgICAgdiA9IE1hdGgucm91bmQodiAvIHRoaXMuX19zdGVwKSAqIHRoaXMuX19zdGVwO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gTnVtYmVyQ29udHJvbGxlci5zdXBlcmNsYXNzLnByb3RvdHlwZS5zZXRWYWx1ZS5jYWxsKHRoaXMsIHYpO1xuXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNwZWNpZnkgYSBtaW5pbXVtIHZhbHVlIGZvciA8Y29kZT5vYmplY3RbcHJvcGVydHldPC9jb2RlPi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBtaW5WYWx1ZSBUaGUgbWluaW11bSB2YWx1ZSBmb3JcbiAgICAgKiA8Y29kZT5vYmplY3RbcHJvcGVydHldPC9jb2RlPlxuICAgICAqIEByZXR1cm5zIHtkYXQuY29udHJvbGxlcnMuTnVtYmVyQ29udHJvbGxlcn0gdGhpc1xuICAgICAqL1xuICAgIG1pbjogZnVuY3Rpb24odikge1xuICAgICAgdGhpcy5fX21pbiA9IHY7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU3BlY2lmeSBhIG1heGltdW0gdmFsdWUgZm9yIDxjb2RlPm9iamVjdFtwcm9wZXJ0eV08L2NvZGU+LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IG1heFZhbHVlIFRoZSBtYXhpbXVtIHZhbHVlIGZvclxuICAgICAqIDxjb2RlPm9iamVjdFtwcm9wZXJ0eV08L2NvZGU+XG4gICAgICogQHJldHVybnMge2RhdC5jb250cm9sbGVycy5OdW1iZXJDb250cm9sbGVyfSB0aGlzXG4gICAgICovXG4gICAgbWF4OiBmdW5jdGlvbih2KSB7XG4gICAgICB0aGlzLl9fbWF4ID0gdjtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTcGVjaWZ5IGEgc3RlcCB2YWx1ZSB0aGF0IGRhdC5jb250cm9sbGVycy5OdW1iZXJDb250cm9sbGVyXG4gICAgICogaW5jcmVtZW50cyBieS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBzdGVwVmFsdWUgVGhlIHN0ZXAgdmFsdWUgZm9yXG4gICAgICogZGF0LmNvbnRyb2xsZXJzLk51bWJlckNvbnRyb2xsZXJcbiAgICAgKiBAZGVmYXVsdCBpZiBtaW5pbXVtIGFuZCBtYXhpbXVtIHNwZWNpZmllZCBpbmNyZW1lbnQgaXMgMSUgb2YgdGhlXG4gICAgICogZGlmZmVyZW5jZSBvdGhlcndpc2Ugc3RlcFZhbHVlIGlzIDFcbiAgICAgKiBAcmV0dXJucyB7ZGF0LmNvbnRyb2xsZXJzLk51bWJlckNvbnRyb2xsZXJ9IHRoaXNcbiAgICAgKi9cbiAgICBzdGVwOiBmdW5jdGlvbih2KSB7XG4gICAgICB0aGlzLl9fc3RlcCA9IHY7XG4gICAgICB0aGlzLl9faW1wbGllZFN0ZXAgPSB2O1xuICAgICAgdGhpcy5fX3ByZWNpc2lvbiA9IG51bURlY2ltYWxzKHYpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gIH1cblxuKTtcblxuZnVuY3Rpb24gbnVtRGVjaW1hbHMoeCkge1xuICB4ID0geC50b1N0cmluZygpO1xuICBpZiAoeC5pbmRleE9mKCcuJykgPiAtMSkge1xuICAgIHJldHVybiB4Lmxlbmd0aCAtIHguaW5kZXhPZignLicpIC0gMTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gMDtcbiAgfVxufVxuIiwiLyoqXG4gKiBkYXQtZ3VpIEphdmFTY3JpcHQgQ29udHJvbGxlciBMaWJyYXJ5XG4gKiBodHRwOi8vY29kZS5nb29nbGUuY29tL3AvZGF0LWd1aVxuICpcbiAqIENvcHlyaWdodCAyMDExIERhdGEgQXJ0cyBUZWFtLCBHb29nbGUgQ3JlYXRpdmUgTGFiXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICovXG5cbnZhciBOdW1iZXJDb250cm9sbGVyID0gcmVxdWlyZSgnLi9OdW1iZXJDb250cm9sbGVyLmpzJyk7XG52YXIgY29tbW9uID0gcmVxdWlyZSgnLi4vdXRpbHMvY29tbW9uLmpzJyk7XG52YXIgZG9tID0gcmVxdWlyZSgnLi4vZG9tL2RvbS5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IE51bWJlckNvbnRyb2xsZXJCb3g7XG5cbi8qKlxuICogQGNsYXNzIFJlcHJlc2VudHMgYSBnaXZlbiBwcm9wZXJ0eSBvZiBhbiBvYmplY3QgdGhhdCBpcyBhIG51bWJlciBhbmRcbiAqIHByb3ZpZGVzIGFuIGlucHV0IGVsZW1lbnQgd2l0aCB3aGljaCB0byBtYW5pcHVsYXRlIGl0LlxuICpcbiAqIEBleHRlbmRzIGRhdC5jb250cm9sbGVycy5Db250cm9sbGVyXG4gKiBAZXh0ZW5kcyBkYXQuY29udHJvbGxlcnMuTnVtYmVyQ29udHJvbGxlclxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBiZSBtYW5pcHVsYXRlZFxuICogQHBhcmFtIHtzdHJpbmd9IHByb3BlcnR5IFRoZSBuYW1lIG9mIHRoZSBwcm9wZXJ0eSB0byBiZSBtYW5pcHVsYXRlZFxuICogQHBhcmFtIHtPYmplY3R9IFtwYXJhbXNdIE9wdGlvbmFsIHBhcmFtZXRlcnNcbiAqIEBwYXJhbSB7TnVtYmVyfSBbcGFyYW1zLm1pbl0gTWluaW11bSBhbGxvd2VkIHZhbHVlXG4gKiBAcGFyYW0ge051bWJlcn0gW3BhcmFtcy5tYXhdIE1heGltdW0gYWxsb3dlZCB2YWx1ZVxuICogQHBhcmFtIHtOdW1iZXJ9IFtwYXJhbXMuc3RlcF0gSW5jcmVtZW50IGJ5IHdoaWNoIHRvIGNoYW5nZSB2YWx1ZVxuICpcbiAqIEBtZW1iZXIgZGF0LmNvbnRyb2xsZXJzXG4gKi9cbmZ1bmN0aW9uIE51bWJlckNvbnRyb2xsZXJCb3gob2JqZWN0LCBwcm9wZXJ0eSwgcGFyYW1zKSB7XG5cbiAgdGhpcy5fX3RydW5jYXRpb25TdXNwZW5kZWQgPSBmYWxzZTtcblxuICBOdW1iZXJDb250cm9sbGVyQm94LnN1cGVyY2xhc3MuY2FsbCh0aGlzLCBvYmplY3QsIHByb3BlcnR5LCBwYXJhbXMpO1xuXG4gIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgLyoqXG4gICAqIHtOdW1iZXJ9IFByZXZpb3VzIG1vdXNlIHkgcG9zaXRpb25cbiAgICogQGlnbm9yZVxuICAgKi9cbiAgdmFyIHByZXZfeTtcblxuICB0aGlzLl9faW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xuICB0aGlzLl9faW5wdXQuc2V0QXR0cmlidXRlKCd0eXBlJywgJ3RleHQnKTtcblxuICAvLyBNYWtlcyBpdCBzbyBtYW51YWxseSBzcGVjaWZpZWQgdmFsdWVzIGFyZSBub3QgdHJ1bmNhdGVkLlxuXG4gIGRvbS5iaW5kKHRoaXMuX19pbnB1dCwgJ2NoYW5nZScsIG9uQ2hhbmdlKTtcbiAgZG9tLmJpbmQodGhpcy5fX2lucHV0LCAnYmx1cicsIG9uQmx1cik7XG4gIGRvbS5iaW5kKHRoaXMuX19pbnB1dCwgJ21vdXNlZG93bicsIG9uTW91c2VEb3duKTtcbiAgZG9tLmJpbmQodGhpcy5fX2lucHV0LCAna2V5ZG93bicsIGZ1bmN0aW9uKGUpIHtcblxuICAgIC8vIFdoZW4gcHJlc3NpbmcgZW50aXJlLCB5b3UgY2FuIGJlIGFzIHByZWNpc2UgYXMgeW91IHdhbnQuXG4gICAgaWYgKGUua2V5Q29kZSA9PT0gMTMpIHtcbiAgICAgIF90aGlzLl9fdHJ1bmNhdGlvblN1c3BlbmRlZCA9IHRydWU7XG4gICAgICB0aGlzLmJsdXIoKTtcbiAgICAgIF90aGlzLl9fdHJ1bmNhdGlvblN1c3BlbmRlZCA9IGZhbHNlO1xuICAgIH1cblxuICB9KTtcblxuICBmdW5jdGlvbiBvbkNoYW5nZSgpIHtcbiAgICB2YXIgYXR0ZW1wdGVkID0gcGFyc2VGbG9hdChfdGhpcy5fX2lucHV0LnZhbHVlKTtcbiAgICBpZiAoIWNvbW1vbi5pc05hTihhdHRlbXB0ZWQpKSBfdGhpcy5zZXRWYWx1ZShhdHRlbXB0ZWQpO1xuICB9XG5cbiAgZnVuY3Rpb24gb25CbHVyKCkge1xuICAgIG9uQ2hhbmdlKCk7XG4gICAgaWYgKF90aGlzLl9fb25GaW5pc2hDaGFuZ2UpIHtcbiAgICAgIF90aGlzLl9fb25GaW5pc2hDaGFuZ2UuY2FsbChfdGhpcywgX3RoaXMuZ2V0VmFsdWUoKSk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gb25Nb3VzZURvd24oZSkge1xuICAgIGRvbS5iaW5kKHdpbmRvdywgJ21vdXNlbW92ZScsIG9uTW91c2VEcmFnKTtcbiAgICBkb20uYmluZCh3aW5kb3csICdtb3VzZXVwJywgb25Nb3VzZVVwKTtcbiAgICBwcmV2X3kgPSBlLmNsaWVudFk7XG4gIH1cblxuICBmdW5jdGlvbiBvbk1vdXNlRHJhZyhlKSB7XG5cbiAgICB2YXIgZGlmZiA9IHByZXZfeSAtIGUuY2xpZW50WTtcbiAgICBfdGhpcy5zZXRWYWx1ZShfdGhpcy5nZXRWYWx1ZSgpICsgZGlmZiAqIF90aGlzLl9faW1wbGllZFN0ZXApO1xuXG4gICAgcHJldl95ID0gZS5jbGllbnRZO1xuXG4gIH1cblxuICBmdW5jdGlvbiBvbk1vdXNlVXAoKSB7XG4gICAgZG9tLnVuYmluZCh3aW5kb3csICdtb3VzZW1vdmUnLCBvbk1vdXNlRHJhZyk7XG4gICAgZG9tLnVuYmluZCh3aW5kb3csICdtb3VzZXVwJywgb25Nb3VzZVVwKTtcbiAgfVxuXG4gIHRoaXMudXBkYXRlRGlzcGxheSgpO1xuXG4gIHRoaXMuZG9tRWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLl9faW5wdXQpO1xuXG59XG5cbk51bWJlckNvbnRyb2xsZXJCb3guc3VwZXJjbGFzcyA9IE51bWJlckNvbnRyb2xsZXI7XG5cbmNvbW1vbi5leHRlbmQoXG5cbiAgTnVtYmVyQ29udHJvbGxlckJveC5wcm90b3R5cGUsXG4gIE51bWJlckNvbnRyb2xsZXIucHJvdG90eXBlLFxuXG4gIHtcblxuICAgIHVwZGF0ZURpc3BsYXk6IGZ1bmN0aW9uKCkge1xuXG4gICAgICB0aGlzLl9faW5wdXQudmFsdWUgPSB0aGlzLl9fdHJ1bmNhdGlvblN1c3BlbmRlZCA/IHRoaXMuZ2V0VmFsdWUoKSA6IHJvdW5kVG9EZWNpbWFsKHRoaXMuZ2V0VmFsdWUoKSwgdGhpcy5fX3ByZWNpc2lvbik7XG4gICAgICByZXR1cm4gTnVtYmVyQ29udHJvbGxlckJveC5zdXBlcmNsYXNzLnByb3RvdHlwZS51cGRhdGVEaXNwbGF5LmNhbGwodGhpcyk7XG4gICAgfVxuXG4gIH1cblxuKTtcblxuZnVuY3Rpb24gcm91bmRUb0RlY2ltYWwodmFsdWUsIGRlY2ltYWxzKSB7XG4gIHZhciB0ZW5UbyA9IE1hdGgucG93KDEwLCBkZWNpbWFscyk7XG4gIHJldHVybiBNYXRoLnJvdW5kKHZhbHVlICogdGVuVG8pIC8gdGVuVG87XG59XG4iLCIvKipcbiAqIGRhdC1ndWkgSmF2YVNjcmlwdCBDb250cm9sbGVyIExpYnJhcnlcbiAqIGh0dHA6Ly9jb2RlLmdvb2dsZS5jb20vcC9kYXQtZ3VpXG4gKlxuICogQ29weXJpZ2h0IDIwMTEgRGF0YSBBcnRzIFRlYW0sIEdvb2dsZSBDcmVhdGl2ZSBMYWJcbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKi9cblxudmFyIE51bWJlckNvbnRyb2xsZXIgPSByZXF1aXJlKCcuL051bWJlckNvbnRyb2xsZXIuanMnKTtcbnZhciBjb21tb24gPSByZXF1aXJlKCcuLi91dGlscy9jb21tb24uanMnKTtcbnZhciBkb20gPSByZXF1aXJlKCcuLi9kb20vZG9tLmpzJyk7XG52YXIgY3NzID0gcmVxdWlyZSgnLi4vdXRpbHMvY3NzLmpzJyk7XG5cbnZhciBzdHlsZVNoZWV0ID0gXCIvKipcXG4gKiBkYXQtZ3VpIEphdmFTY3JpcHQgQ29udHJvbGxlciBMaWJyYXJ5XFxuICogaHR0cDovL2NvZGUuZ29vZ2xlLmNvbS9wL2RhdC1ndWlcXG4gKlxcbiAqIENvcHlyaWdodCAyMDExIERhdGEgQXJ0cyBUZWFtLCBHb29nbGUgQ3JlYXRpdmUgTGFiXFxuICpcXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXFxcIkxpY2Vuc2VcXFwiKTtcXG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXFxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XFxuICpcXG4gKiBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcXG4gKi9cXG5cXG4uc2xpZGVyIHtcXG4gIGJveC1zaGFkb3c6IGluc2V0IDAgMnB4IDRweCByZ2JhKDAsMCwwLDAuMTUpO1xcbiAgaGVpZ2h0OiAxZW07XFxuICBib3JkZXItcmFkaXVzOiAxZW07XFxuICBiYWNrZ3JvdW5kLWNvbG9yOiAjZWVlO1xcbiAgcGFkZGluZzogMCAwLjVlbTtcXG4gIG92ZXJmbG93OiBoaWRkZW47XFxufVxcblxcbi5zbGlkZXItZmcge1xcbiAgcGFkZGluZzogMXB4IDAgMnB4IDA7XFxuICBiYWNrZ3JvdW5kLWNvbG9yOiAjYWFhO1xcbiAgaGVpZ2h0OiAxZW07XFxuICBtYXJnaW4tbGVmdDogLTAuNWVtO1xcbiAgcGFkZGluZy1yaWdodDogMC41ZW07XFxuICBib3JkZXItcmFkaXVzOiAxZW0gMCAwIDFlbTtcXG59XFxuXFxuLnNsaWRlci1mZzphZnRlciB7XFxuICBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7XFxuICBib3JkZXItcmFkaXVzOiAxZW07XFxuICBiYWNrZ3JvdW5kLWNvbG9yOiAjZmZmO1xcbiAgYm9yZGVyOiAgMXB4IHNvbGlkICNhYWE7XFxuICBjb250ZW50OiAnJztcXG4gIGZsb2F0OiByaWdodDtcXG4gIG1hcmdpbi1yaWdodDogLTFlbTtcXG4gIG1hcmdpbi10b3A6IC0xcHg7XFxuICBoZWlnaHQ6IDAuOWVtO1xcbiAgd2lkdGg6IDAuOWVtO1xcbn1cIjtcbm1vZHVsZS5leHBvcnRzID0gTnVtYmVyQ29udHJvbGxlclNsaWRlcjtcblxuLyoqXG4gKiBAY2xhc3MgUmVwcmVzZW50cyBhIGdpdmVuIHByb3BlcnR5IG9mIGFuIG9iamVjdCB0aGF0IGlzIGEgbnVtYmVyLCBjb250YWluc1xuICogYSBtaW5pbXVtIGFuZCBtYXhpbXVtLCBhbmQgcHJvdmlkZXMgYSBzbGlkZXIgZWxlbWVudCB3aXRoIHdoaWNoIHRvXG4gKiBtYW5pcHVsYXRlIGl0LiBJdCBzaG91bGQgYmUgbm90ZWQgdGhhdCB0aGUgc2xpZGVyIGVsZW1lbnQgaXMgbWFkZSB1cCBvZlxuICogPGNvZGU+Jmx0O2RpdiZndDs8L2NvZGU+IHRhZ3MsIDxzdHJvbmc+bm90PC9zdHJvbmc+IHRoZSBodG1sNVxuICogPGNvZGU+Jmx0O3NsaWRlciZndDs8L2NvZGU+IGVsZW1lbnQuXG4gKlxuICogQGV4dGVuZHMgZGF0LmNvbnRyb2xsZXJzLkNvbnRyb2xsZXJcbiAqIEBleHRlbmRzIGRhdC5jb250cm9sbGVycy5OdW1iZXJDb250cm9sbGVyXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIGJlIG1hbmlwdWxhdGVkXG4gKiBAcGFyYW0ge3N0cmluZ30gcHJvcGVydHkgVGhlIG5hbWUgb2YgdGhlIHByb3BlcnR5IHRvIGJlIG1hbmlwdWxhdGVkXG4gKiBAcGFyYW0ge051bWJlcn0gbWluVmFsdWUgTWluaW11bSBhbGxvd2VkIHZhbHVlXG4gKiBAcGFyYW0ge051bWJlcn0gbWF4VmFsdWUgTWF4aW11bSBhbGxvd2VkIHZhbHVlXG4gKiBAcGFyYW0ge051bWJlcn0gc3RlcFZhbHVlIEluY3JlbWVudCBieSB3aGljaCB0byBjaGFuZ2UgdmFsdWVcbiAqXG4gKiBAbWVtYmVyIGRhdC5jb250cm9sbGVyc1xuICovXG5mdW5jdGlvbiBOdW1iZXJDb250cm9sbGVyU2xpZGVyKG9iamVjdCwgcHJvcGVydHksIG1pbiwgbWF4LCBzdGVwKSB7XG5cbiAgTnVtYmVyQ29udHJvbGxlclNsaWRlci5zdXBlcmNsYXNzLmNhbGwodGhpcywgb2JqZWN0LCBwcm9wZXJ0eSwge1xuICAgIG1pbjogbWluLFxuICAgIG1heDogbWF4LFxuICAgIHN0ZXA6IHN0ZXBcbiAgfSk7XG5cbiAgdmFyIF90aGlzID0gdGhpcztcblxuICB0aGlzLl9fYmFja2dyb3VuZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICB0aGlzLl9fZm9yZWdyb3VuZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXG5cblxuICBkb20uYmluZCh0aGlzLl9fYmFja2dyb3VuZCwgJ21vdXNlZG93bicsIG9uTW91c2VEb3duKTtcblxuICBkb20uYWRkQ2xhc3ModGhpcy5fX2JhY2tncm91bmQsICdzbGlkZXInKTtcbiAgZG9tLmFkZENsYXNzKHRoaXMuX19mb3JlZ3JvdW5kLCAnc2xpZGVyLWZnJyk7XG5cbiAgZnVuY3Rpb24gb25Nb3VzZURvd24oZSkge1xuXG4gICAgZG9tLmJpbmQod2luZG93LCAnbW91c2Vtb3ZlJywgb25Nb3VzZURyYWcpO1xuICAgIGRvbS5iaW5kKHdpbmRvdywgJ21vdXNldXAnLCBvbk1vdXNlVXApO1xuXG4gICAgb25Nb3VzZURyYWcoZSk7XG4gIH1cblxuICBmdW5jdGlvbiBvbk1vdXNlRHJhZyhlKSB7XG5cbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICB2YXIgb2Zmc2V0ID0gZG9tLmdldE9mZnNldChfdGhpcy5fX2JhY2tncm91bmQpO1xuICAgIHZhciB3aWR0aCA9IGRvbS5nZXRXaWR0aChfdGhpcy5fX2JhY2tncm91bmQpO1xuXG4gICAgX3RoaXMuc2V0VmFsdWUoXG4gICAgICBtYXAoZS5jbGllbnRYLCBvZmZzZXQubGVmdCwgb2Zmc2V0LmxlZnQgKyB3aWR0aCwgX3RoaXMuX19taW4sIF90aGlzLl9fbWF4KVxuICAgICk7XG5cbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgfVxuXG4gIGZ1bmN0aW9uIG9uTW91c2VVcCgpIHtcbiAgICBkb20udW5iaW5kKHdpbmRvdywgJ21vdXNlbW92ZScsIG9uTW91c2VEcmFnKTtcbiAgICBkb20udW5iaW5kKHdpbmRvdywgJ21vdXNldXAnLCBvbk1vdXNlVXApO1xuICAgIGlmIChfdGhpcy5fX29uRmluaXNoQ2hhbmdlKSB7XG4gICAgICBfdGhpcy5fX29uRmluaXNoQ2hhbmdlLmNhbGwoX3RoaXMsIF90aGlzLmdldFZhbHVlKCkpO1xuICAgIH1cbiAgfVxuXG4gIHRoaXMudXBkYXRlRGlzcGxheSgpO1xuXG4gIHRoaXMuX19iYWNrZ3JvdW5kLmFwcGVuZENoaWxkKHRoaXMuX19mb3JlZ3JvdW5kKTtcbiAgdGhpcy5kb21FbGVtZW50LmFwcGVuZENoaWxkKHRoaXMuX19iYWNrZ3JvdW5kKTtcblxufVxuXG5OdW1iZXJDb250cm9sbGVyU2xpZGVyLnN1cGVyY2xhc3MgPSBOdW1iZXJDb250cm9sbGVyO1xuXG4vKipcbiAqIEluamVjdHMgZGVmYXVsdCBzdHlsZXNoZWV0IGZvciBzbGlkZXIgZWxlbWVudHMuXG4gKi9cbk51bWJlckNvbnRyb2xsZXJTbGlkZXIudXNlRGVmYXVsdFN0eWxlcyA9IGZ1bmN0aW9uKCkge1xuICBjc3MuaW5qZWN0KHN0eWxlU2hlZXQpO1xufTtcblxuY29tbW9uLmV4dGVuZChcblxuICBOdW1iZXJDb250cm9sbGVyU2xpZGVyLnByb3RvdHlwZSxcbiAgTnVtYmVyQ29udHJvbGxlci5wcm90b3R5cGUsXG5cbiAge1xuXG4gICAgdXBkYXRlRGlzcGxheTogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgcGN0ID0gKHRoaXMuZ2V0VmFsdWUoKSAtIHRoaXMuX19taW4pIC8gKHRoaXMuX19tYXggLSB0aGlzLl9fbWluKTtcbiAgICAgIHRoaXMuX19mb3JlZ3JvdW5kLnN0eWxlLndpZHRoID0gcGN0ICogMTAwICsgJyUnO1xuICAgICAgcmV0dXJuIE51bWJlckNvbnRyb2xsZXJTbGlkZXIuc3VwZXJjbGFzcy5wcm90b3R5cGUudXBkYXRlRGlzcGxheS5jYWxsKHRoaXMpO1xuICAgIH1cblxuICB9XG5cblxuXG4pO1xuXG5mdW5jdGlvbiBtYXAodiwgaTEsIGkyLCBvMSwgbzIpIHtcbiAgcmV0dXJuIG8xICsgKG8yIC0gbzEpICogKCh2IC0gaTEpIC8gKGkyIC0gaTEpKTtcbn1cbiIsIi8qKlxuICogZGF0LWd1aSBKYXZhU2NyaXB0IENvbnRyb2xsZXIgTGlicmFyeVxuICogaHR0cDovL2NvZGUuZ29vZ2xlLmNvbS9wL2RhdC1ndWlcbiAqXG4gKiBDb3B5cmlnaHQgMjAxMSBEYXRhIEFydHMgVGVhbSwgR29vZ2xlIENyZWF0aXZlIExhYlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqL1xuXG52YXIgQ29udHJvbGxlciA9IHJlcXVpcmUoJy4vQ29udHJvbGxlci5qcycpO1xudmFyIGRvbSA9IHJlcXVpcmUoJy4uL2RvbS9kb20uanMnKTtcbnZhciBjb21tb24gPSByZXF1aXJlKCcuLi91dGlscy9jb21tb24uanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBPcHRpb25Db250cm9sbGVyO1xuXG4vKipcbiAqIEBjbGFzcyBQcm92aWRlcyBhIHNlbGVjdCBpbnB1dCB0byBhbHRlciB0aGUgcHJvcGVydHkgb2YgYW4gb2JqZWN0LCB1c2luZyBhXG4gKiBsaXN0IG9mIGFjY2VwdGVkIHZhbHVlcy5cbiAqXG4gKiBAZXh0ZW5kcyBkYXQuY29udHJvbGxlcnMuQ29udHJvbGxlclxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBiZSBtYW5pcHVsYXRlZFxuICogQHBhcmFtIHtzdHJpbmd9IHByb3BlcnR5IFRoZSBuYW1lIG9mIHRoZSBwcm9wZXJ0eSB0byBiZSBtYW5pcHVsYXRlZFxuICogQHBhcmFtIHtPYmplY3R8c3RyaW5nW119IG9wdGlvbnMgQSBtYXAgb2YgbGFiZWxzIHRvIGFjY2VwdGFibGUgdmFsdWVzLCBvclxuICogYSBsaXN0IG9mIGFjY2VwdGFibGUgc3RyaW5nIHZhbHVlcy5cbiAqXG4gKiBAbWVtYmVyIGRhdC5jb250cm9sbGVyc1xuICovXG5mdW5jdGlvbiBPcHRpb25Db250cm9sbGVyKG9iamVjdCwgcHJvcGVydHksIG9wdGlvbnMpIHtcblxuICBPcHRpb25Db250cm9sbGVyLnN1cGVyY2xhc3MuY2FsbCh0aGlzLCBvYmplY3QsIHByb3BlcnR5KTtcblxuICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gIC8qKlxuICAgKiBUaGUgZHJvcCBkb3duIG1lbnVcbiAgICogQGlnbm9yZVxuICAgKi9cbiAgdGhpcy5fX3NlbGVjdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NlbGVjdCcpO1xuXG4gIGlmIChjb21tb24uaXNBcnJheShvcHRpb25zKSkge1xuICAgIHZhciBtYXAgPSB7fTtcbiAgICBjb21tb24uZWFjaChvcHRpb25zLCBmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgICBtYXBbZWxlbWVudF0gPSBlbGVtZW50O1xuICAgIH0pO1xuICAgIG9wdGlvbnMgPSBtYXA7XG4gIH1cblxuICBjb21tb24uZWFjaChvcHRpb25zLCBmdW5jdGlvbih2YWx1ZSwga2V5KSB7XG5cbiAgICB2YXIgb3B0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnb3B0aW9uJyk7XG4gICAgb3B0LmlubmVySFRNTCA9IGtleTtcbiAgICBvcHQuc2V0QXR0cmlidXRlKCd2YWx1ZScsIHZhbHVlKTtcbiAgICBfdGhpcy5fX3NlbGVjdC5hcHBlbmRDaGlsZChvcHQpO1xuXG4gIH0pO1xuXG4gIC8vIEFja25vd2xlZGdlIG9yaWdpbmFsIHZhbHVlXG4gIHRoaXMudXBkYXRlRGlzcGxheSgpO1xuXG4gIGRvbS5iaW5kKHRoaXMuX19zZWxlY3QsICdjaGFuZ2UnLCBmdW5jdGlvbigpIHtcbiAgICB2YXIgZGVzaXJlZFZhbHVlID0gdGhpcy5vcHRpb25zW3RoaXMuc2VsZWN0ZWRJbmRleF0udmFsdWU7XG4gICAgX3RoaXMuc2V0VmFsdWUoZGVzaXJlZFZhbHVlKTtcbiAgfSk7XG5cbiAgdGhpcy5kb21FbGVtZW50LmFwcGVuZENoaWxkKHRoaXMuX19zZWxlY3QpO1xuXG59XG5cbk9wdGlvbkNvbnRyb2xsZXIuc3VwZXJjbGFzcyA9IENvbnRyb2xsZXI7XG5cbmNvbW1vbi5leHRlbmQoXG5cbiAgT3B0aW9uQ29udHJvbGxlci5wcm90b3R5cGUsXG4gIENvbnRyb2xsZXIucHJvdG90eXBlLFxuXG4gIHtcblxuICAgIHNldFZhbHVlOiBmdW5jdGlvbih2KSB7XG4gICAgICB2YXIgdG9SZXR1cm4gPSBPcHRpb25Db250cm9sbGVyLnN1cGVyY2xhc3MucHJvdG90eXBlLnNldFZhbHVlLmNhbGwodGhpcywgdik7XG4gICAgICBpZiAodGhpcy5fX29uRmluaXNoQ2hhbmdlKSB7XG4gICAgICAgIHRoaXMuX19vbkZpbmlzaENoYW5nZS5jYWxsKHRoaXMsIHRoaXMuZ2V0VmFsdWUoKSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdG9SZXR1cm47XG4gICAgfSxcblxuICAgIHVwZGF0ZURpc3BsYXk6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5fX3NlbGVjdC52YWx1ZSA9IHRoaXMuZ2V0VmFsdWUoKTtcbiAgICAgIHJldHVybiBPcHRpb25Db250cm9sbGVyLnN1cGVyY2xhc3MucHJvdG90eXBlLnVwZGF0ZURpc3BsYXkuY2FsbCh0aGlzKTtcbiAgICB9XG5cbiAgfVxuXG4pO1xuIiwiLyoqXG4gKiBkYXQtZ3VpIEphdmFTY3JpcHQgQ29udHJvbGxlciBMaWJyYXJ5XG4gKiBodHRwOi8vY29kZS5nb29nbGUuY29tL3AvZGF0LWd1aVxuICpcbiAqIENvcHlyaWdodCAyMDExIERhdGEgQXJ0cyBUZWFtLCBHb29nbGUgQ3JlYXRpdmUgTGFiXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICovXG5cbnZhciBDb250cm9sbGVyID0gcmVxdWlyZSgnLi9Db250cm9sbGVyLmpzJyk7XG52YXIgZG9tID0gcmVxdWlyZSgnLi4vZG9tL2RvbS5qcycpO1xudmFyIGNvbW1vbiA9IHJlcXVpcmUoJy4uL3V0aWxzL2NvbW1vbi5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFN0cmluZ0NvbnRyb2xsZXI7XG5cbi8qKlxuICogQGNsYXNzIFByb3ZpZGVzIGEgdGV4dCBpbnB1dCB0byBhbHRlciB0aGUgc3RyaW5nIHByb3BlcnR5IG9mIGFuIG9iamVjdC5cbiAqXG4gKiBAZXh0ZW5kcyBkYXQuY29udHJvbGxlcnMuQ29udHJvbGxlclxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBiZSBtYW5pcHVsYXRlZFxuICogQHBhcmFtIHtzdHJpbmd9IHByb3BlcnR5IFRoZSBuYW1lIG9mIHRoZSBwcm9wZXJ0eSB0byBiZSBtYW5pcHVsYXRlZFxuICpcbiAqIEBtZW1iZXIgZGF0LmNvbnRyb2xsZXJzXG4gKi9cbmZ1bmN0aW9uIFN0cmluZ0NvbnRyb2xsZXIob2JqZWN0LCBwcm9wZXJ0eSkge1xuXG4gIFN0cmluZ0NvbnRyb2xsZXIuc3VwZXJjbGFzcy5jYWxsKHRoaXMsIG9iamVjdCwgcHJvcGVydHkpO1xuXG4gIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgdGhpcy5fX2lucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcbiAgdGhpcy5fX2lucHV0LnNldEF0dHJpYnV0ZSgndHlwZScsICd0ZXh0Jyk7XG5cbiAgZG9tLmJpbmQodGhpcy5fX2lucHV0LCAna2V5dXAnLCBvbkNoYW5nZSk7XG4gIGRvbS5iaW5kKHRoaXMuX19pbnB1dCwgJ2NoYW5nZScsIG9uQ2hhbmdlKTtcbiAgZG9tLmJpbmQodGhpcy5fX2lucHV0LCAnYmx1cicsIG9uQmx1cik7XG4gIGRvbS5iaW5kKHRoaXMuX19pbnB1dCwgJ2tleWRvd24nLCBmdW5jdGlvbihlKSB7XG4gICAgaWYgKGUua2V5Q29kZSA9PT0gMTMpIHtcbiAgICAgIHRoaXMuYmx1cigpO1xuICAgIH1cbiAgfSk7XG5cblxuICBmdW5jdGlvbiBvbkNoYW5nZSgpIHtcbiAgICBfdGhpcy5zZXRWYWx1ZShfdGhpcy5fX2lucHV0LnZhbHVlKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIG9uQmx1cigpIHtcbiAgICBpZiAoX3RoaXMuX19vbkZpbmlzaENoYW5nZSkge1xuICAgICAgX3RoaXMuX19vbkZpbmlzaENoYW5nZS5jYWxsKF90aGlzLCBfdGhpcy5nZXRWYWx1ZSgpKTtcbiAgICB9XG4gIH1cblxuICB0aGlzLnVwZGF0ZURpc3BsYXkoKTtcblxuICB0aGlzLmRvbUVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5fX2lucHV0KTtcblxufTtcblxuU3RyaW5nQ29udHJvbGxlci5zdXBlcmNsYXNzID0gQ29udHJvbGxlcjtcblxuY29tbW9uLmV4dGVuZChcblxuICBTdHJpbmdDb250cm9sbGVyLnByb3RvdHlwZSxcbiAgQ29udHJvbGxlci5wcm90b3R5cGUsXG5cbiAge1xuXG4gICAgdXBkYXRlRGlzcGxheTogZnVuY3Rpb24oKSB7XG4gICAgICAvLyBTdG9wcyB0aGUgY2FyZXQgZnJvbSBtb3Zpbmcgb24gYWNjb3VudCBvZjpcbiAgICAgIC8vIGtleXVwIC0+IHNldFZhbHVlIC0+IHVwZGF0ZURpc3BsYXlcbiAgICAgIGlmICghZG9tLmlzQWN0aXZlKHRoaXMuX19pbnB1dCkpIHtcbiAgICAgICAgdGhpcy5fX2lucHV0LnZhbHVlID0gdGhpcy5nZXRWYWx1ZSgpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIFN0cmluZ0NvbnRyb2xsZXIuc3VwZXJjbGFzcy5wcm90b3R5cGUudXBkYXRlRGlzcGxheS5jYWxsKHRoaXMpO1xuICAgIH1cblxuICB9XG5cbik7XG4iLCIvKipcbiAqIGRhdC1ndWkgSmF2YVNjcmlwdCBDb250cm9sbGVyIExpYnJhcnlcbiAqIGh0dHA6Ly9jb2RlLmdvb2dsZS5jb20vcC9kYXQtZ3VpXG4gKlxuICogQ29weXJpZ2h0IDIwMTEgRGF0YSBBcnRzIFRlYW0sIEdvb2dsZSBDcmVhdGl2ZSBMYWJcbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKi9cbnZhciBPcHRpb25Db250cm9sbGVyID0gcmVxdWlyZSgnLi9PcHRpb25Db250cm9sbGVyLmpzJyk7XG52YXIgTnVtYmVyQ29udHJvbGxlckJveCA9IHJlcXVpcmUoJy4vTnVtYmVyQ29udHJvbGxlckJveC5qcycpO1xudmFyIE51bWJlckNvbnRyb2xsZXJTbGlkZXIgPSByZXF1aXJlKCcuL051bWJlckNvbnRyb2xsZXJTbGlkZXIuanMnKTtcbnZhciBTdHJpbmdDb250cm9sbGVyID0gcmVxdWlyZSgnLi9TdHJpbmdDb250cm9sbGVyLmpzJyk7XG52YXIgRnVuY3Rpb25Db250cm9sbGVyID0gcmVxdWlyZSgnLi9GdW5jdGlvbkNvbnRyb2xsZXIuanMnKTtcbnZhciBCb29sZWFuQ29udHJvbGxlciA9IHJlcXVpcmUoJy4vQm9vbGVhbkNvbnRyb2xsZXIuanMnKTtcbnZhciBjb21tb24gPSByZXF1aXJlKCcuLi91dGlscy9jb21tb24uanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5O1xuXG5mdW5jdGlvbiBmYWN0b3J5KG9iamVjdCwgcHJvcGVydHkpIHtcblxuICB2YXIgaW5pdGlhbFZhbHVlID0gb2JqZWN0W3Byb3BlcnR5XTtcblxuICAvLyBQcm92aWRpbmcgb3B0aW9ucz9cbiAgaWYgKGNvbW1vbi5pc0FycmF5KGFyZ3VtZW50c1syXSkgfHwgY29tbW9uLmlzT2JqZWN0KGFyZ3VtZW50c1syXSkpIHtcbiAgICByZXR1cm4gbmV3IE9wdGlvbkNvbnRyb2xsZXIob2JqZWN0LCBwcm9wZXJ0eSwgYXJndW1lbnRzWzJdKTtcbiAgfVxuXG4gIC8vIFByb3ZpZGluZyBhIG1hcD9cblxuICBpZiAoY29tbW9uLmlzTnVtYmVyKGluaXRpYWxWYWx1ZSkpIHtcblxuICAgIGlmIChjb21tb24uaXNOdW1iZXIoYXJndW1lbnRzWzJdKSAmJiBjb21tb24uaXNOdW1iZXIoYXJndW1lbnRzWzNdKSkge1xuXG4gICAgICAvLyBIYXMgbWluIGFuZCBtYXguXG4gICAgICByZXR1cm4gbmV3IE51bWJlckNvbnRyb2xsZXJTbGlkZXIob2JqZWN0LCBwcm9wZXJ0eSwgYXJndW1lbnRzWzJdLCBhcmd1bWVudHNbM10pO1xuXG4gICAgfSBlbHNlIHtcblxuICAgICAgcmV0dXJuIG5ldyBOdW1iZXJDb250cm9sbGVyQm94KG9iamVjdCwgcHJvcGVydHksIHtcbiAgICAgICAgbWluOiBhcmd1bWVudHNbMl0sXG4gICAgICAgIG1heDogYXJndW1lbnRzWzNdXG4gICAgICB9KTtcblxuICAgIH1cblxuICB9XG5cbiAgaWYgKGNvbW1vbi5pc1N0cmluZyhpbml0aWFsVmFsdWUpKSB7XG4gICAgcmV0dXJuIG5ldyBTdHJpbmdDb250cm9sbGVyKG9iamVjdCwgcHJvcGVydHkpO1xuICB9XG5cbiAgaWYgKGNvbW1vbi5pc0Z1bmN0aW9uKGluaXRpYWxWYWx1ZSkpIHtcbiAgICByZXR1cm4gbmV3IEZ1bmN0aW9uQ29udHJvbGxlcihvYmplY3QsIHByb3BlcnR5LCAnJyk7XG4gIH1cblxuICBpZiAoY29tbW9uLmlzQm9vbGVhbihpbml0aWFsVmFsdWUpKSB7XG4gICAgcmV0dXJuIG5ldyBCb29sZWFuQ29udHJvbGxlcihvYmplY3QsIHByb3BlcnR5KTtcbiAgfVxuXG59XG4iLCIvKipcbiAqIGRhdC1ndWkgSmF2YVNjcmlwdCBDb250cm9sbGVyIExpYnJhcnlcbiAqIGh0dHA6Ly9jb2RlLmdvb2dsZS5jb20vcC9kYXQtZ3VpXG4gKlxuICogQ29weXJpZ2h0IDIwMTEgRGF0YSBBcnRzIFRlYW0sIEdvb2dsZSBDcmVhdGl2ZSBMYWJcbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKi9cblxudmFyIGNvbW1vbiA9IHJlcXVpcmUoJy4uL3V0aWxzL2NvbW1vbi5qcycpO1xudmFyIGRvbSA9IHJlcXVpcmUoJy4vZG9tLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gQ2VudGVyZWREaXY7XG5cbmZ1bmN0aW9uIENlbnRlcmVkRGl2KCkge1xuXG4gIHRoaXMuYmFja2dyb3VuZEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgY29tbW9uLmV4dGVuZCh0aGlzLmJhY2tncm91bmRFbGVtZW50LnN0eWxlLCB7XG4gICAgYmFja2dyb3VuZENvbG9yOiAncmdiYSgwLDAsMCwwLjgpJyxcbiAgICB0b3A6IDAsXG4gICAgbGVmdDogMCxcbiAgICBkaXNwbGF5OiAnbm9uZScsXG4gICAgekluZGV4OiAnMTAwMCcsXG4gICAgb3BhY2l0eTogMCxcbiAgICBXZWJraXRUcmFuc2l0aW9uOiAnb3BhY2l0eSAwLjJzIGxpbmVhcicsXG4gICAgdHJhbnNpdGlvbjogJ29wYWNpdHkgMC4ycyBsaW5lYXInXG4gIH0pO1xuXG4gIGRvbS5tYWtlRnVsbHNjcmVlbih0aGlzLmJhY2tncm91bmRFbGVtZW50KTtcbiAgdGhpcy5iYWNrZ3JvdW5kRWxlbWVudC5zdHlsZS5wb3NpdGlvbiA9ICdmaXhlZCc7XG5cbiAgdGhpcy5kb21FbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIGNvbW1vbi5leHRlbmQodGhpcy5kb21FbGVtZW50LnN0eWxlLCB7XG4gICAgcG9zaXRpb246ICdmaXhlZCcsXG4gICAgZGlzcGxheTogJ25vbmUnLFxuICAgIHpJbmRleDogJzEwMDEnLFxuICAgIG9wYWNpdHk6IDAsXG4gICAgV2Via2l0VHJhbnNpdGlvbjogJy13ZWJraXQtdHJhbnNmb3JtIDAuMnMgZWFzZS1vdXQsIG9wYWNpdHkgMC4ycyBsaW5lYXInLFxuICAgIHRyYW5zaXRpb246ICd0cmFuc2Zvcm0gMC4ycyBlYXNlLW91dCwgb3BhY2l0eSAwLjJzIGxpbmVhcidcbiAgfSk7XG5cblxuICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHRoaXMuYmFja2dyb3VuZEVsZW1lbnQpO1xuICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHRoaXMuZG9tRWxlbWVudCk7XG5cbiAgdmFyIF90aGlzID0gdGhpcztcbiAgZG9tLmJpbmQodGhpcy5iYWNrZ3JvdW5kRWxlbWVudCwgJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgX3RoaXMuaGlkZSgpO1xuICB9KTtcblxuXG59O1xuXG5DZW50ZXJlZERpdi5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uKCkge1xuXG4gIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgdGhpcy5iYWNrZ3JvdW5kRWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcblxuICB0aGlzLmRvbUVsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG4gIHRoaXMuZG9tRWxlbWVudC5zdHlsZS5vcGFjaXR5ID0gMDtcbiAgLy8gICAgdGhpcy5kb21FbGVtZW50LnN0eWxlLnRvcCA9ICc1MiUnO1xuICB0aGlzLmRvbUVsZW1lbnQuc3R5bGUud2Via2l0VHJhbnNmb3JtID0gJ3NjYWxlKDEuMSknO1xuXG4gIHRoaXMubGF5b3V0KCk7XG5cbiAgY29tbW9uLmRlZmVyKGZ1bmN0aW9uKCkge1xuICAgIF90aGlzLmJhY2tncm91bmRFbGVtZW50LnN0eWxlLm9wYWNpdHkgPSAxO1xuICAgIF90aGlzLmRvbUVsZW1lbnQuc3R5bGUub3BhY2l0eSA9IDE7XG4gICAgX3RoaXMuZG9tRWxlbWVudC5zdHlsZS53ZWJraXRUcmFuc2Zvcm0gPSAnc2NhbGUoMSknO1xuICB9KTtcblxufTtcblxuQ2VudGVyZWREaXYucHJvdG90eXBlLmhpZGUgPSBmdW5jdGlvbigpIHtcblxuICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gIHZhciBoaWRlID0gZnVuY3Rpb24oKSB7XG5cbiAgICBfdGhpcy5kb21FbGVtZW50LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgX3RoaXMuYmFja2dyb3VuZEVsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICdub25lJztcblxuICAgIGRvbS51bmJpbmQoX3RoaXMuZG9tRWxlbWVudCwgJ3dlYmtpdFRyYW5zaXRpb25FbmQnLCBoaWRlKTtcbiAgICBkb20udW5iaW5kKF90aGlzLmRvbUVsZW1lbnQsICd0cmFuc2l0aW9uZW5kJywgaGlkZSk7XG4gICAgZG9tLnVuYmluZChfdGhpcy5kb21FbGVtZW50LCAnb1RyYW5zaXRpb25FbmQnLCBoaWRlKTtcblxuICB9O1xuXG4gIGRvbS5iaW5kKHRoaXMuZG9tRWxlbWVudCwgJ3dlYmtpdFRyYW5zaXRpb25FbmQnLCBoaWRlKTtcbiAgZG9tLmJpbmQodGhpcy5kb21FbGVtZW50LCAndHJhbnNpdGlvbmVuZCcsIGhpZGUpO1xuICBkb20uYmluZCh0aGlzLmRvbUVsZW1lbnQsICdvVHJhbnNpdGlvbkVuZCcsIGhpZGUpO1xuXG4gIHRoaXMuYmFja2dyb3VuZEVsZW1lbnQuc3R5bGUub3BhY2l0eSA9IDA7XG4gIC8vICAgIHRoaXMuZG9tRWxlbWVudC5zdHlsZS50b3AgPSAnNDglJztcbiAgdGhpcy5kb21FbGVtZW50LnN0eWxlLm9wYWNpdHkgPSAwO1xuICB0aGlzLmRvbUVsZW1lbnQuc3R5bGUud2Via2l0VHJhbnNmb3JtID0gJ3NjYWxlKDEuMSknO1xuXG59O1xuXG5DZW50ZXJlZERpdi5wcm90b3R5cGUubGF5b3V0ID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuZG9tRWxlbWVudC5zdHlsZS5sZWZ0ID0gd2luZG93LmlubmVyV2lkdGggLyAyIC0gZG9tLmdldFdpZHRoKHRoaXMuZG9tRWxlbWVudCkgLyAyICsgJ3B4JztcbiAgdGhpcy5kb21FbGVtZW50LnN0eWxlLnRvcCA9IHdpbmRvdy5pbm5lckhlaWdodCAvIDIgLSBkb20uZ2V0SGVpZ2h0KHRoaXMuZG9tRWxlbWVudCkgLyAyICsgJ3B4Jztcbn07XG5cbmZ1bmN0aW9uIGxvY2tTY3JvbGwoZSkge1xuICBjb25zb2xlLmxvZyhlKTtcbn1cbiIsIi8qKlxuICogZGF0LWd1aSBKYXZhU2NyaXB0IENvbnRyb2xsZXIgTGlicmFyeVxuICogaHR0cDovL2NvZGUuZ29vZ2xlLmNvbS9wL2RhdC1ndWlcbiAqXG4gKiBDb3B5cmlnaHQgMjAxMSBEYXRhIEFydHMgVGVhbSwgR29vZ2xlIENyZWF0aXZlIExhYlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqL1xuXG52YXIgY29tbW9uID0gcmVxdWlyZSgnLi4vdXRpbHMvY29tbW9uLmpzJyk7XG5cbnZhciBFVkVOVF9NQVAgPSB7XG4gICdIVE1MRXZlbnRzJzogWydjaGFuZ2UnXSxcbiAgJ01vdXNlRXZlbnRzJzogWydjbGljaycsICdtb3VzZW1vdmUnLCAnbW91c2Vkb3duJywgJ21vdXNldXAnLCAnbW91c2VvdmVyJ10sXG4gICdLZXlib2FyZEV2ZW50cyc6IFsna2V5ZG93biddXG59O1xuXG52YXIgRVZFTlRfTUFQX0lOViA9IHt9O1xuY29tbW9uLmVhY2goRVZFTlRfTUFQLCBmdW5jdGlvbih2LCBrKSB7XG4gIGNvbW1vbi5lYWNoKHYsIGZ1bmN0aW9uKGUpIHtcbiAgICBFVkVOVF9NQVBfSU5WW2VdID0gaztcbiAgfSk7XG59KTtcblxudmFyIENTU19WQUxVRV9QSVhFTFMgPSAvKFxcZCsoXFwuXFxkKyk/KXB4LztcblxuZnVuY3Rpb24gY3NzVmFsdWVUb1BpeGVscyh2YWwpIHtcblxuICBpZiAodmFsID09PSAnMCcgfHwgY29tbW9uLmlzVW5kZWZpbmVkKHZhbCkpIHJldHVybiAwO1xuXG4gIHZhciBtYXRjaCA9IHZhbC5tYXRjaChDU1NfVkFMVUVfUElYRUxTKTtcblxuICBpZiAoIWNvbW1vbi5pc051bGwobWF0Y2gpKSB7XG4gICAgcmV0dXJuIHBhcnNlRmxvYXQobWF0Y2hbMV0pO1xuICB9XG5cbiAgLy8gVE9ETyAuLi5lbXM/ICU/XG5cbiAgcmV0dXJuIDA7XG5cbn1cblxuLyoqXG4gKiBAbmFtZXNwYWNlXG4gKiBAbWVtYmVyIGRhdC5kb21cbiAqL1xudmFyIGRvbSA9IHtcblxuICAvKipcbiAgICpcbiAgICogQHBhcmFtIGVsZW1cbiAgICogQHBhcmFtIHNlbGVjdGFibGVcbiAgICovXG4gIG1ha2VTZWxlY3RhYmxlOiBmdW5jdGlvbihlbGVtLCBzZWxlY3RhYmxlKSB7XG5cbiAgICBpZiAoZWxlbSA9PT0gdW5kZWZpbmVkIHx8IGVsZW0uc3R5bGUgPT09IHVuZGVmaW5lZCkgcmV0dXJuO1xuXG4gICAgZWxlbS5vbnNlbGVjdHN0YXJ0ID0gc2VsZWN0YWJsZSA/IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0gOiBmdW5jdGlvbigpIHt9O1xuXG4gICAgZWxlbS5zdHlsZS5Nb3pVc2VyU2VsZWN0ID0gc2VsZWN0YWJsZSA/ICdhdXRvJyA6ICdub25lJztcbiAgICBlbGVtLnN0eWxlLktodG1sVXNlclNlbGVjdCA9IHNlbGVjdGFibGUgPyAnYXV0bycgOiAnbm9uZSc7XG4gICAgZWxlbS51bnNlbGVjdGFibGUgPSBzZWxlY3RhYmxlID8gJ29uJyA6ICdvZmYnO1xuXG4gIH0sXG5cbiAgLyoqXG4gICAqXG4gICAqIEBwYXJhbSBlbGVtXG4gICAqIEBwYXJhbSBob3Jpem9udGFsXG4gICAqIEBwYXJhbSB2ZXJ0aWNhbFxuICAgKi9cbiAgbWFrZUZ1bGxzY3JlZW46IGZ1bmN0aW9uKGVsZW0sIGhvcml6b250YWwsIHZlcnRpY2FsKSB7XG5cbiAgICBpZiAoY29tbW9uLmlzVW5kZWZpbmVkKGhvcml6b250YWwpKSBob3Jpem9udGFsID0gdHJ1ZTtcbiAgICBpZiAoY29tbW9uLmlzVW5kZWZpbmVkKHZlcnRpY2FsKSkgdmVydGljYWwgPSB0cnVlO1xuXG4gICAgZWxlbS5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG5cbiAgICBpZiAoaG9yaXpvbnRhbCkge1xuICAgICAgZWxlbS5zdHlsZS5sZWZ0ID0gMDtcbiAgICAgIGVsZW0uc3R5bGUucmlnaHQgPSAwO1xuICAgIH1cbiAgICBpZiAodmVydGljYWwpIHtcbiAgICAgIGVsZW0uc3R5bGUudG9wID0gMDtcbiAgICAgIGVsZW0uc3R5bGUuYm90dG9tID0gMDtcbiAgICB9XG5cbiAgfSxcblxuICAvKipcbiAgICpcbiAgICogQHBhcmFtIGVsZW1cbiAgICogQHBhcmFtIGV2ZW50VHlwZVxuICAgKiBAcGFyYW0gcGFyYW1zXG4gICAqL1xuICBmYWtlRXZlbnQ6IGZ1bmN0aW9uKGVsZW0sIGV2ZW50VHlwZSwgcGFyYW1zLCBhdXgpIHtcbiAgICBwYXJhbXMgPSBwYXJhbXMgfHwge307XG4gICAgdmFyIGNsYXNzTmFtZSA9IEVWRU5UX01BUF9JTlZbZXZlbnRUeXBlXTtcbiAgICBpZiAoIWNsYXNzTmFtZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdFdmVudCB0eXBlICcgKyBldmVudFR5cGUgKyAnIG5vdCBzdXBwb3J0ZWQuJyk7XG4gICAgfVxuICAgIHZhciBldnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudChjbGFzc05hbWUpO1xuICAgIHN3aXRjaCAoY2xhc3NOYW1lKSB7XG4gICAgICBjYXNlICdNb3VzZUV2ZW50cyc6XG4gICAgICAgIHZhciBjbGllbnRYID0gcGFyYW1zLnggfHwgcGFyYW1zLmNsaWVudFggfHwgMDtcbiAgICAgICAgdmFyIGNsaWVudFkgPSBwYXJhbXMueSB8fCBwYXJhbXMuY2xpZW50WSB8fCAwO1xuICAgICAgICBldnQuaW5pdE1vdXNlRXZlbnQoZXZlbnRUeXBlLCBwYXJhbXMuYnViYmxlcyB8fCBmYWxzZSxcbiAgICAgICAgICBwYXJhbXMuY2FuY2VsYWJsZSB8fCB0cnVlLCB3aW5kb3csIHBhcmFtcy5jbGlja0NvdW50IHx8IDEsXG4gICAgICAgICAgMCwgLy9zY3JlZW4gWFxuICAgICAgICAgIDAsIC8vc2NyZWVuIFlcbiAgICAgICAgICBjbGllbnRYLCAvL2NsaWVudCBYXG4gICAgICAgICAgY2xpZW50WSwgLy9jbGllbnQgWVxuICAgICAgICAgIGZhbHNlLCBmYWxzZSwgZmFsc2UsIGZhbHNlLCAwLCBudWxsKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdLZXlib2FyZEV2ZW50cyc6XG4gICAgICAgIHZhciBpbml0ID0gZXZ0LmluaXRLZXlib2FyZEV2ZW50IHx8IGV2dC5pbml0S2V5RXZlbnQ7IC8vIHdlYmtpdCB8fCBtb3pcbiAgICAgICAgY29tbW9uLmRlZmF1bHRzKHBhcmFtcywge1xuICAgICAgICAgIGNhbmNlbGFibGU6IHRydWUsXG4gICAgICAgICAgY3RybEtleTogZmFsc2UsXG4gICAgICAgICAgYWx0S2V5OiBmYWxzZSxcbiAgICAgICAgICBzaGlmdEtleTogZmFsc2UsXG4gICAgICAgICAgbWV0YUtleTogZmFsc2UsXG4gICAgICAgICAga2V5Q29kZTogdW5kZWZpbmVkLFxuICAgICAgICAgIGNoYXJDb2RlOiB1bmRlZmluZWRcbiAgICAgICAgfSk7XG4gICAgICAgIGluaXQoZXZlbnRUeXBlLCBwYXJhbXMuYnViYmxlcyB8fCBmYWxzZSxcbiAgICAgICAgICBwYXJhbXMuY2FuY2VsYWJsZSwgd2luZG93LFxuICAgICAgICAgIHBhcmFtcy5jdHJsS2V5LCBwYXJhbXMuYWx0S2V5LFxuICAgICAgICAgIHBhcmFtcy5zaGlmdEtleSwgcGFyYW1zLm1ldGFLZXksXG4gICAgICAgICAgcGFyYW1zLmtleUNvZGUsIHBhcmFtcy5jaGFyQ29kZSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgZXZ0LmluaXRFdmVudChldmVudFR5cGUsIHBhcmFtcy5idWJibGVzIHx8IGZhbHNlLFxuICAgICAgICAgIHBhcmFtcy5jYW5jZWxhYmxlIHx8IHRydWUpO1xuICAgICAgICBicmVhaztcbiAgICB9XG4gICAgY29tbW9uLmRlZmF1bHRzKGV2dCwgYXV4KTtcbiAgICBlbGVtLmRpc3BhdGNoRXZlbnQoZXZ0KTtcbiAgfSxcblxuICAvKipcbiAgICpcbiAgICogQHBhcmFtIGVsZW1cbiAgICogQHBhcmFtIGV2ZW50XG4gICAqIEBwYXJhbSBmdW5jXG4gICAqIEBwYXJhbSBib29sXG4gICAqL1xuICBiaW5kOiBmdW5jdGlvbihlbGVtLCBldmVudCwgZnVuYywgYm9vbCkge1xuICAgIGJvb2wgPSBib29sIHx8IGZhbHNlO1xuICAgIGlmIChlbGVtLmFkZEV2ZW50TGlzdGVuZXIpXG4gICAgICBlbGVtLmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIGZ1bmMsIGJvb2wpO1xuICAgIGVsc2UgaWYgKGVsZW0uYXR0YWNoRXZlbnQpXG4gICAgICBlbGVtLmF0dGFjaEV2ZW50KCdvbicgKyBldmVudCwgZnVuYyk7XG4gICAgcmV0dXJuIGRvbTtcbiAgfSxcblxuICAvKipcbiAgICpcbiAgICogQHBhcmFtIGVsZW1cbiAgICogQHBhcmFtIGV2ZW50XG4gICAqIEBwYXJhbSBmdW5jXG4gICAqIEBwYXJhbSBib29sXG4gICAqL1xuICB1bmJpbmQ6IGZ1bmN0aW9uKGVsZW0sIGV2ZW50LCBmdW5jLCBib29sKSB7XG4gICAgYm9vbCA9IGJvb2wgfHwgZmFsc2U7XG4gICAgaWYgKGVsZW0ucmVtb3ZlRXZlbnRMaXN0ZW5lcilcbiAgICAgIGVsZW0ucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudCwgZnVuYywgYm9vbCk7XG4gICAgZWxzZSBpZiAoZWxlbS5kZXRhY2hFdmVudClcbiAgICAgIGVsZW0uZGV0YWNoRXZlbnQoJ29uJyArIGV2ZW50LCBmdW5jKTtcbiAgICByZXR1cm4gZG9tO1xuICB9LFxuXG4gIC8qKlxuICAgKlxuICAgKiBAcGFyYW0gZWxlbVxuICAgKiBAcGFyYW0gY2xhc3NOYW1lXG4gICAqL1xuICBhZGRDbGFzczogZnVuY3Rpb24oZWxlbSwgY2xhc3NOYW1lKSB7XG4gICAgaWYgKGVsZW0uY2xhc3NOYW1lID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGVsZW0uY2xhc3NOYW1lID0gY2xhc3NOYW1lO1xuICAgIH0gZWxzZSBpZiAoZWxlbS5jbGFzc05hbWUgIT09IGNsYXNzTmFtZSkge1xuICAgICAgdmFyIGNsYXNzZXMgPSBlbGVtLmNsYXNzTmFtZS5zcGxpdCgvICsvKTtcbiAgICAgIGlmIChjbGFzc2VzLmluZGV4T2YoY2xhc3NOYW1lKSA9PSAtMSkge1xuICAgICAgICBjbGFzc2VzLnB1c2goY2xhc3NOYW1lKTtcbiAgICAgICAgZWxlbS5jbGFzc05hbWUgPSBjbGFzc2VzLmpvaW4oJyAnKS5yZXBsYWNlKC9eXFxzKy8sICcnKS5yZXBsYWNlKC9cXHMrJC8sICcnKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGRvbTtcbiAgfSxcblxuICAvKipcbiAgICpcbiAgICogQHBhcmFtIGVsZW1cbiAgICogQHBhcmFtIGNsYXNzTmFtZVxuICAgKi9cbiAgcmVtb3ZlQ2xhc3M6IGZ1bmN0aW9uKGVsZW0sIGNsYXNzTmFtZSkge1xuICAgIGlmIChjbGFzc05hbWUpIHtcbiAgICAgIGlmIChlbGVtLmNsYXNzTmFtZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIC8vIGVsZW0uY2xhc3NOYW1lID0gY2xhc3NOYW1lO1xuICAgICAgfSBlbHNlIGlmIChlbGVtLmNsYXNzTmFtZSA9PT0gY2xhc3NOYW1lKSB7XG4gICAgICAgIGVsZW0ucmVtb3ZlQXR0cmlidXRlKCdjbGFzcycpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIGNsYXNzZXMgPSBlbGVtLmNsYXNzTmFtZS5zcGxpdCgvICsvKTtcbiAgICAgICAgdmFyIGluZGV4ID0gY2xhc3Nlcy5pbmRleE9mKGNsYXNzTmFtZSk7XG4gICAgICAgIGlmIChpbmRleCAhPSAtMSkge1xuICAgICAgICAgIGNsYXNzZXMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICBlbGVtLmNsYXNzTmFtZSA9IGNsYXNzZXMuam9pbignICcpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGVsZW0uY2xhc3NOYW1lID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICByZXR1cm4gZG9tO1xuICB9LFxuXG4gIGhhc0NsYXNzOiBmdW5jdGlvbihlbGVtLCBjbGFzc05hbWUpIHtcbiAgICByZXR1cm4gbmV3IFJlZ0V4cCgnKD86XnxcXFxccyspJyArIGNsYXNzTmFtZSArICcoPzpcXFxccyt8JCknKS50ZXN0KGVsZW0uY2xhc3NOYW1lKSB8fCBmYWxzZTtcbiAgfSxcblxuICAvKipcbiAgICpcbiAgICogQHBhcmFtIGVsZW1cbiAgICovXG4gIGdldFdpZHRoOiBmdW5jdGlvbihlbGVtKSB7XG5cbiAgICB2YXIgc3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlKGVsZW0pO1xuXG4gICAgcmV0dXJuIGNzc1ZhbHVlVG9QaXhlbHMoc3R5bGVbJ2JvcmRlci1sZWZ0LXdpZHRoJ10pICtcbiAgICAgIGNzc1ZhbHVlVG9QaXhlbHMoc3R5bGVbJ2JvcmRlci1yaWdodC13aWR0aCddKSArXG4gICAgICBjc3NWYWx1ZVRvUGl4ZWxzKHN0eWxlWydwYWRkaW5nLWxlZnQnXSkgK1xuICAgICAgY3NzVmFsdWVUb1BpeGVscyhzdHlsZVsncGFkZGluZy1yaWdodCddKSArXG4gICAgICBjc3NWYWx1ZVRvUGl4ZWxzKHN0eWxlWyd3aWR0aCddKTtcbiAgfSxcblxuICAvKipcbiAgICpcbiAgICogQHBhcmFtIGVsZW1cbiAgICovXG4gIGdldEhlaWdodDogZnVuY3Rpb24oZWxlbSkge1xuXG4gICAgdmFyIHN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZShlbGVtKTtcblxuICAgIHJldHVybiBjc3NWYWx1ZVRvUGl4ZWxzKHN0eWxlWydib3JkZXItdG9wLXdpZHRoJ10pICtcbiAgICAgIGNzc1ZhbHVlVG9QaXhlbHMoc3R5bGVbJ2JvcmRlci1ib3R0b20td2lkdGgnXSkgK1xuICAgICAgY3NzVmFsdWVUb1BpeGVscyhzdHlsZVsncGFkZGluZy10b3AnXSkgK1xuICAgICAgY3NzVmFsdWVUb1BpeGVscyhzdHlsZVsncGFkZGluZy1ib3R0b20nXSkgK1xuICAgICAgY3NzVmFsdWVUb1BpeGVscyhzdHlsZVsnaGVpZ2h0J10pO1xuICB9LFxuXG4gIC8qKlxuICAgKlxuICAgKiBAcGFyYW0gZWxlbVxuICAgKi9cbiAgZ2V0T2Zmc2V0OiBmdW5jdGlvbihlbGVtKSB7XG4gICAgdmFyIG9mZnNldCA9IHtcbiAgICAgIGxlZnQ6IDAsXG4gICAgICB0b3A6IDBcbiAgICB9O1xuICAgIGlmIChlbGVtLm9mZnNldFBhcmVudCkge1xuICAgICAgZG8ge1xuICAgICAgICBvZmZzZXQubGVmdCArPSBlbGVtLm9mZnNldExlZnQ7XG4gICAgICAgIG9mZnNldC50b3AgKz0gZWxlbS5vZmZzZXRUb3A7XG4gICAgICB9IHdoaWxlIChlbGVtID0gZWxlbS5vZmZzZXRQYXJlbnQpO1xuICAgIH1cbiAgICByZXR1cm4gb2Zmc2V0O1xuICB9LFxuXG4gIC8vIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9wb3N0cy8yNjg0NTYxL3JldmlzaW9uc1xuICAvKipcbiAgICpcbiAgICogQHBhcmFtIGVsZW1cbiAgICovXG4gIGlzQWN0aXZlOiBmdW5jdGlvbihlbGVtKSB7XG4gICAgcmV0dXJuIGVsZW0gPT09IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQgJiYgKGVsZW0udHlwZSB8fCBlbGVtLmhyZWYpO1xuICB9XG5cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZG9tO1xuIiwiLyoqXG4gKiBkYXQtZ3VpIEphdmFTY3JpcHQgQ29udHJvbGxlciBMaWJyYXJ5XG4gKiBodHRwOi8vY29kZS5nb29nbGUuY29tL3AvZGF0LWd1aVxuICpcbiAqIENvcHlyaWdodCAyMDExIERhdGEgQXJ0cyBUZWFtLCBHb29nbGUgQ3JlYXRpdmUgTGFiXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICovXG5cbnZhciBjc3MgPSByZXF1aXJlKCcuLi91dGlscy9jc3MuanMnKTtcblxudmFyIHNhdmVEaWFsb2d1ZUNvbnRlbnRzID0gXCI8ZGl2IGlkPVxcXCJkZy1zYXZlXFxcIiBjbGFzcz1cXFwiZGcgZGlhbG9ndWVcXFwiPlxcblxcbiAgSGVyZSdzIHRoZSBuZXcgbG9hZCBwYXJhbWV0ZXIgZm9yIHlvdXIgPGNvZGU+R1VJPC9jb2RlPidzIGNvbnN0cnVjdG9yOlxcblxcbiAgPHRleHRhcmVhIGlkPVxcXCJkZy1uZXctY29uc3RydWN0b3JcXFwiPjwvdGV4dGFyZWE+XFxuXFxuICA8ZGl2IGlkPVxcXCJkZy1zYXZlLWxvY2FsbHlcXFwiPlxcblxcbiAgICA8aW5wdXQgaWQ9XFxcImRnLWxvY2FsLXN0b3JhZ2VcXFwiIHR5cGU9XFxcImNoZWNrYm94XFxcIi8+IEF1dG9tYXRpY2FsbHkgc2F2ZVxcbiAgICB2YWx1ZXMgdG8gPGNvZGU+bG9jYWxTdG9yYWdlPC9jb2RlPiBvbiBleGl0LlxcblxcbiAgICA8ZGl2IGlkPVxcXCJkZy1sb2NhbC1leHBsYWluXFxcIj5UaGUgdmFsdWVzIHNhdmVkIHRvIDxjb2RlPmxvY2FsU3RvcmFnZTwvY29kZT4gd2lsbFxcbiAgICAgIG92ZXJyaWRlIHRob3NlIHBhc3NlZCB0byA8Y29kZT5kYXQuR1VJPC9jb2RlPidzIGNvbnN0cnVjdG9yLiBUaGlzIG1ha2VzIGl0XFxuICAgICAgZWFzaWVyIHRvIHdvcmsgaW5jcmVtZW50YWxseSwgYnV0IDxjb2RlPmxvY2FsU3RvcmFnZTwvY29kZT4gaXMgZnJhZ2lsZSxcXG4gICAgICBhbmQgeW91ciBmcmllbmRzIG1heSBub3Qgc2VlIHRoZSBzYW1lIHZhbHVlcyB5b3UgZG8uXFxuICAgICAgXFxuICAgIDwvZGl2PlxcbiAgICBcXG4gIDwvZGl2PlxcblxcbjwvZGl2PlwiO1xudmFyIHN0eWxlU2hlZXQgPSBcIi5kZyB7XFxuICAvKiogQ2xlYXIgbGlzdCBzdHlsZXMgKi9cXG4gIC8qIEF1dG8tcGxhY2UgY29udGFpbmVyICovXFxuICAvKiBBdXRvLXBsYWNlZCBHVUkncyAqL1xcbiAgLyogTGluZSBpdGVtcyB0aGF0IGRvbid0IGNvbnRhaW4gZm9sZGVycy4gKi9cXG4gIC8qKiBGb2xkZXIgbmFtZXMgKi9cXG4gIC8qKiBIaWRlcyBjbG9zZWQgaXRlbXMgKi9cXG4gIC8qKiBDb250cm9sbGVyIHJvdyAqL1xcbiAgLyoqIE5hbWUtaGFsZiAobGVmdCkgKi9cXG4gIC8qKiBDb250cm9sbGVyLWhhbGYgKHJpZ2h0KSAqL1xcbiAgLyoqIENvbnRyb2xsZXIgcGxhY2VtZW50ICovXFxuICAvKiogU2hvcnRlciBudW1iZXIgYm94ZXMgd2hlbiBzbGlkZXIgaXMgcHJlc2VudC4gKi9cXG4gIC8qKiBFbnN1cmUgdGhlIGVudGlyZSBib29sZWFuIGFuZCBmdW5jdGlvbiByb3cgc2hvd3MgYSBoYW5kICovIH1cXG4gIC5kZyB1bCB7XFxuICAgIGxpc3Qtc3R5bGU6IG5vbmU7XFxuICAgIG1hcmdpbjogMDtcXG4gICAgcGFkZGluZzogMDtcXG4gICAgd2lkdGg6IDEwMCU7XFxuICAgIGNsZWFyOiBib3RoOyB9XFxuICAuZGcuYWMge1xcbiAgICBwb3NpdGlvbjogZml4ZWQ7XFxuICAgIHRvcDogMDtcXG4gICAgbGVmdDogMDtcXG4gICAgcmlnaHQ6IDA7XFxuICAgIGhlaWdodDogMDtcXG4gICAgei1pbmRleDogMDsgfVxcbiAgLmRnOm5vdCguYWMpIC5tYWluIHtcXG4gICAgLyoqIEV4Y2x1ZGUgbWFpbnMgaW4gYWMgc28gdGhhdCB3ZSBkb24ndCBoaWRlIGNsb3NlIGJ1dHRvbiAqL1xcbiAgICBvdmVyZmxvdzogaGlkZGVuOyB9XFxuICAuZGcubWFpbiB7XFxuICAgIC13ZWJraXQtdHJhbnNpdGlvbjogb3BhY2l0eSAwLjFzIGxpbmVhcjtcXG4gICAgLW8tdHJhbnNpdGlvbjogb3BhY2l0eSAwLjFzIGxpbmVhcjtcXG4gICAgLW1vei10cmFuc2l0aW9uOiBvcGFjaXR5IDAuMXMgbGluZWFyO1xcbiAgICB0cmFuc2l0aW9uOiBvcGFjaXR5IDAuMXMgbGluZWFyOyB9XFxuICAgIC5kZy5tYWluLnRhbGxlci10aGFuLXdpbmRvdyB7XFxuICAgICAgb3ZlcmZsb3cteTogYXV0bzsgfVxcbiAgICAgIC5kZy5tYWluLnRhbGxlci10aGFuLXdpbmRvdyAuY2xvc2UtYnV0dG9uIHtcXG4gICAgICAgIG9wYWNpdHk6IDE7XFxuICAgICAgICAvKiBUT0RPLCB0aGVzZSBhcmUgc3R5bGUgbm90ZXMgKi9cXG4gICAgICAgIG1hcmdpbi10b3A6IC0xcHg7XFxuICAgICAgICBib3JkZXItdG9wOiAxcHggc29saWQgIzJjMmMyYzsgfVxcbiAgICAuZGcubWFpbiB1bC5jbG9zZWQgLmNsb3NlLWJ1dHRvbiB7XFxuICAgICAgb3BhY2l0eTogMSAhaW1wb3J0YW50OyB9XFxuICAgIC5kZy5tYWluOmhvdmVyIC5jbG9zZS1idXR0b24sXFxuICAgIC5kZy5tYWluIC5jbG9zZS1idXR0b24uZHJhZyB7XFxuICAgICAgb3BhY2l0eTogMTsgfVxcbiAgICAuZGcubWFpbiAuY2xvc2UtYnV0dG9uIHtcXG4gICAgICAvKm9wYWNpdHk6IDA7Ki9cXG4gICAgICAtd2Via2l0LXRyYW5zaXRpb246IG9wYWNpdHkgMC4xcyBsaW5lYXI7XFxuICAgICAgLW8tdHJhbnNpdGlvbjogb3BhY2l0eSAwLjFzIGxpbmVhcjtcXG4gICAgICAtbW96LXRyYW5zaXRpb246IG9wYWNpdHkgMC4xcyBsaW5lYXI7XFxuICAgICAgdHJhbnNpdGlvbjogb3BhY2l0eSAwLjFzIGxpbmVhcjtcXG4gICAgICBib3JkZXI6IDA7XFxuICAgICAgcG9zaXRpb246IGFic29sdXRlO1xcbiAgICAgIGxpbmUtaGVpZ2h0OiAxOXB4O1xcbiAgICAgIGhlaWdodDogMjBweDtcXG4gICAgICAvKiBUT0RPLCB0aGVzZSBhcmUgc3R5bGUgbm90ZXMgKi9cXG4gICAgICBjdXJzb3I6IHBvaW50ZXI7XFxuICAgICAgdGV4dC1hbGlnbjogY2VudGVyO1xcbiAgICAgIGJhY2tncm91bmQtY29sb3I6ICMwMDA7IH1cXG4gICAgICAuZGcubWFpbiAuY2xvc2UtYnV0dG9uOmhvdmVyIHtcXG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6ICMxMTE7IH1cXG4gIC5kZy5hIHtcXG4gICAgZmxvYXQ6IHJpZ2h0O1xcbiAgICBtYXJnaW4tcmlnaHQ6IDE1cHg7XFxuICAgIG92ZXJmbG93LXg6IGhpZGRlbjsgfVxcbiAgICAuZGcuYS5oYXMtc2F2ZSA+IHVsIHtcXG4gICAgICBtYXJnaW4tdG9wOiAyN3B4OyB9XFxuICAgICAgLmRnLmEuaGFzLXNhdmUgPiB1bC5jbG9zZWQge1xcbiAgICAgICAgbWFyZ2luLXRvcDogMDsgfVxcbiAgICAuZGcuYSAuc2F2ZS1yb3cge1xcbiAgICAgIHBvc2l0aW9uOiBmaXhlZDtcXG4gICAgICB0b3A6IDA7XFxuICAgICAgei1pbmRleDogMTAwMjsgfVxcbiAgLmRnIGxpIHtcXG4gICAgLXdlYmtpdC10cmFuc2l0aW9uOiBoZWlnaHQgMC4xcyBlYXNlLW91dDtcXG4gICAgLW8tdHJhbnNpdGlvbjogaGVpZ2h0IDAuMXMgZWFzZS1vdXQ7XFxuICAgIC1tb3otdHJhbnNpdGlvbjogaGVpZ2h0IDAuMXMgZWFzZS1vdXQ7XFxuICAgIHRyYW5zaXRpb246IGhlaWdodCAwLjFzIGVhc2Utb3V0OyB9XFxuICAuZGcgbGk6bm90KC5mb2xkZXIpIHtcXG4gICAgY3Vyc29yOiBhdXRvO1xcbiAgICBoZWlnaHQ6IDI3cHg7XFxuICAgIGxpbmUtaGVpZ2h0OiAyN3B4O1xcbiAgICBvdmVyZmxvdzogaGlkZGVuO1xcbiAgICBwYWRkaW5nOiAwIDRweCAwIDVweDsgfVxcbiAgLmRnIGxpLmZvbGRlciB7XFxuICAgIHBhZGRpbmc6IDA7XFxuICAgIGJvcmRlci1sZWZ0OiA0cHggc29saWQgcmdiYSgwLCAwLCAwLCAwKTsgfVxcbiAgLmRnIGxpLnRpdGxlIHtcXG4gICAgY3Vyc29yOiBwb2ludGVyO1xcbiAgICBtYXJnaW4tbGVmdDogLTRweDsgfVxcbiAgLmRnIC5jbG9zZWQgbGk6bm90KC50aXRsZSksXFxuICAuZGcgLmNsb3NlZCB1bCBsaSxcXG4gIC5kZyAuY2xvc2VkIHVsIGxpID4gKiB7XFxuICAgIGhlaWdodDogMDtcXG4gICAgb3ZlcmZsb3c6IGhpZGRlbjtcXG4gICAgYm9yZGVyOiAwOyB9XFxuICAuZGcgLmNyIHtcXG4gICAgY2xlYXI6IGJvdGg7XFxuICAgIHBhZGRpbmctbGVmdDogM3B4O1xcbiAgICBoZWlnaHQ6IDI3cHg7IH1cXG4gIC5kZyAucHJvcGVydHktbmFtZSB7XFxuICAgIGN1cnNvcjogZGVmYXVsdDtcXG4gICAgZmxvYXQ6IGxlZnQ7XFxuICAgIGNsZWFyOiBsZWZ0O1xcbiAgICB3aWR0aDogNDAlO1xcbiAgICBvdmVyZmxvdzogaGlkZGVuO1xcbiAgICB0ZXh0LW92ZXJmbG93OiBlbGxpcHNpczsgfVxcbiAgLmRnIC5jIHtcXG4gICAgZmxvYXQ6IGxlZnQ7XFxuICAgIHdpZHRoOiA2MCU7IH1cXG4gIC5kZyAuYyBpbnB1dFt0eXBlPXRleHRdIHtcXG4gICAgYm9yZGVyOiAwO1xcbiAgICBtYXJnaW4tdG9wOiA0cHg7XFxuICAgIHBhZGRpbmc6IDNweDtcXG4gICAgd2lkdGg6IDEwMCU7XFxuICAgIGZsb2F0OiByaWdodDsgfVxcbiAgLmRnIC5oYXMtc2xpZGVyIGlucHV0W3R5cGU9dGV4dF0ge1xcbiAgICB3aWR0aDogMzAlO1xcbiAgICAvKmRpc3BsYXk6IG5vbmU7Ki9cXG4gICAgbWFyZ2luLWxlZnQ6IDA7IH1cXG4gIC5kZyAuc2xpZGVyIHtcXG4gICAgZmxvYXQ6IGxlZnQ7XFxuICAgIHdpZHRoOiA2NiU7XFxuICAgIG1hcmdpbi1sZWZ0OiAtNXB4O1xcbiAgICBtYXJnaW4tcmlnaHQ6IDA7XFxuICAgIGhlaWdodDogMTlweDtcXG4gICAgbWFyZ2luLXRvcDogNHB4OyB9XFxuICAuZGcgLnNsaWRlci1mZyB7XFxuICAgIGhlaWdodDogMTAwJTsgfVxcbiAgLmRnIC5jIGlucHV0W3R5cGU9Y2hlY2tib3hdIHtcXG4gICAgbWFyZ2luLXRvcDogOXB4OyB9XFxuICAuZGcgLmMgc2VsZWN0IHtcXG4gICAgbWFyZ2luLXRvcDogNXB4OyB9XFxuICAuZGcgLmNyLmZ1bmN0aW9uLFxcbiAgLmRnIC5jci5mdW5jdGlvbiAucHJvcGVydHktbmFtZSxcXG4gIC5kZyAuY3IuZnVuY3Rpb24gKixcXG4gIC5kZyAuY3IuYm9vbGVhbixcXG4gIC5kZyAuY3IuYm9vbGVhbiAqIHtcXG4gICAgY3Vyc29yOiBwb2ludGVyOyB9XFxuICAuZGcgLnNlbGVjdG9yIHtcXG4gICAgZGlzcGxheTogbm9uZTtcXG4gICAgcG9zaXRpb246IGFic29sdXRlO1xcbiAgICBtYXJnaW4tbGVmdDogLTlweDtcXG4gICAgbWFyZ2luLXRvcDogMjNweDtcXG4gICAgei1pbmRleDogMTA7IH1cXG4gIC5kZyAuYzpob3ZlciAuc2VsZWN0b3IsXFxuICAuZGcgLnNlbGVjdG9yLmRyYWcge1xcbiAgICBkaXNwbGF5OiBibG9jazsgfVxcbiAgLmRnIGxpLnNhdmUtcm93IHtcXG4gICAgcGFkZGluZzogMDsgfVxcbiAgICAuZGcgbGkuc2F2ZS1yb3cgLmJ1dHRvbiB7XFxuICAgICAgZGlzcGxheTogaW5saW5lLWJsb2NrO1xcbiAgICAgIHBhZGRpbmc6IDBweCA2cHg7IH1cXG4gIC5kZy5kaWFsb2d1ZSB7XFxuICAgIGJhY2tncm91bmQtY29sb3I6ICMyMjI7XFxuICAgIHdpZHRoOiA0NjBweDtcXG4gICAgcGFkZGluZzogMTVweDtcXG4gICAgZm9udC1zaXplOiAxM3B4O1xcbiAgICBsaW5lLWhlaWdodDogMTVweDsgfVxcblxcbi8qIFRPRE8gU2VwYXJhdGUgc3R5bGUgYW5kIHN0cnVjdHVyZSAqL1xcbiNkZy1uZXctY29uc3RydWN0b3Ige1xcbiAgcGFkZGluZzogMTBweDtcXG4gIGNvbG9yOiAjMjIyO1xcbiAgZm9udC1mYW1pbHk6IE1vbmFjbywgbW9ub3NwYWNlO1xcbiAgZm9udC1zaXplOiAxMHB4O1xcbiAgYm9yZGVyOiAwO1xcbiAgcmVzaXplOiBub25lO1xcbiAgYm94LXNoYWRvdzogaW5zZXQgMXB4IDFweCAxcHggIzg4ODtcXG4gIHdvcmQtd3JhcDogYnJlYWstd29yZDtcXG4gIG1hcmdpbjogMTJweCAwO1xcbiAgZGlzcGxheTogYmxvY2s7XFxuICB3aWR0aDogNDQwcHg7XFxuICBvdmVyZmxvdy15OiBzY3JvbGw7XFxuICBoZWlnaHQ6IDEwMHB4O1xcbiAgcG9zaXRpb246IHJlbGF0aXZlOyB9XFxuXFxuI2RnLWxvY2FsLWV4cGxhaW4ge1xcbiAgZGlzcGxheTogbm9uZTtcXG4gIGZvbnQtc2l6ZTogMTFweDtcXG4gIGxpbmUtaGVpZ2h0OiAxN3B4O1xcbiAgYm9yZGVyLXJhZGl1czogM3B4O1xcbiAgYmFja2dyb3VuZC1jb2xvcjogIzMzMztcXG4gIHBhZGRpbmc6IDhweDtcXG4gIG1hcmdpbi10b3A6IDEwcHg7IH1cXG4gICNkZy1sb2NhbC1leHBsYWluIGNvZGUge1xcbiAgICBmb250LXNpemU6IDEwcHg7IH1cXG5cXG4jZGF0LWd1aS1zYXZlLWxvY2FsbHkge1xcbiAgZGlzcGxheTogbm9uZTsgfVxcblxcbi8qKiBNYWluIHR5cGUgKi9cXG4uZGcge1xcbiAgY29sb3I6ICNlZWU7XFxuICBmb250OiAxMXB4ICdMdWNpZGEgR3JhbmRlJywgc2Fucy1zZXJpZjtcXG4gIHRleHQtc2hhZG93OiAwIC0xcHggMCAjMTExO1xcbiAgLyoqIEF1dG8gcGxhY2UgKi9cXG4gIC8qIENvbnRyb2xsZXIgcm93LCA8bGk+ICovXFxuICAvKiogQ29udHJvbGxlcnMgKi8gfVxcbiAgLmRnLm1haW4ge1xcbiAgICAvKiogU2Nyb2xsYmFyICovIH1cXG4gICAgLmRnLm1haW46Oi13ZWJraXQtc2Nyb2xsYmFyIHtcXG4gICAgICB3aWR0aDogNXB4O1xcbiAgICAgIGJhY2tncm91bmQ6ICMxYTFhMWE7IH1cXG4gICAgLmRnLm1haW46Oi13ZWJraXQtc2Nyb2xsYmFyLWNvcm5lciB7XFxuICAgICAgaGVpZ2h0OiAwO1xcbiAgICAgIGRpc3BsYXk6IG5vbmU7IH1cXG4gICAgLmRnLm1haW46Oi13ZWJraXQtc2Nyb2xsYmFyLXRodW1iIHtcXG4gICAgICBib3JkZXItcmFkaXVzOiA1cHg7XFxuICAgICAgYmFja2dyb3VuZDogIzY3Njc2NzsgfVxcbiAgLmRnIGxpOm5vdCguZm9sZGVyKSB7XFxuICAgIGJhY2tncm91bmQ6ICMxYTFhMWE7XFxuICAgIGJvcmRlci1ib3R0b206IDFweCBzb2xpZCAjMmMyYzJjOyB9XFxuICAuZGcgbGkuc2F2ZS1yb3cge1xcbiAgICBsaW5lLWhlaWdodDogMjVweDtcXG4gICAgYmFja2dyb3VuZDogI2RhZDVjYjtcXG4gICAgYm9yZGVyOiAwOyB9XFxuICAgIC5kZyBsaS5zYXZlLXJvdyBzZWxlY3Qge1xcbiAgICAgIG1hcmdpbi1sZWZ0OiA1cHg7XFxuICAgICAgd2lkdGg6IDEwOHB4OyB9XFxuICAgIC5kZyBsaS5zYXZlLXJvdyAuYnV0dG9uIHtcXG4gICAgICBtYXJnaW4tbGVmdDogNXB4O1xcbiAgICAgIG1hcmdpbi10b3A6IDFweDtcXG4gICAgICBib3JkZXItcmFkaXVzOiAycHg7XFxuICAgICAgZm9udC1zaXplOiA5cHg7XFxuICAgICAgbGluZS1oZWlnaHQ6IDdweDtcXG4gICAgICBwYWRkaW5nOiA0cHggNHB4IDVweCA0cHg7XFxuICAgICAgYmFja2dyb3VuZDogI2M1YmRhZDtcXG4gICAgICBjb2xvcjogI2ZmZjtcXG4gICAgICB0ZXh0LXNoYWRvdzogMCAxcHggMCAjYjBhNThmO1xcbiAgICAgIGJveC1zaGFkb3c6IDAgLTFweCAwICNiMGE1OGY7XFxuICAgICAgY3Vyc29yOiBwb2ludGVyOyB9XFxuICAgICAgLmRnIGxpLnNhdmUtcm93IC5idXR0b24uZ2VhcnMge1xcbiAgICAgICAgYmFja2dyb3VuZDogI2M1YmRhZCB1cmwoZGF0YTppbWFnZS9wbmc7YmFzZTY0LGlWQk9SdzBLR2dvQUFBQU5TVWhFVWdBQUFBc0FBQUFOQ0FZQUFBQi85WlE3QUFBQUdYUkZXSFJUYjJaMGQyRnlaUUJCWkc5aVpTQkpiV0ZuWlZKbFlXUjVjY2xsUEFBQUFRSkpSRUZVZU5waVlLQVUvUC8vUHdHSUMvQXBDQUJpQlNBVytJOEFDbEFjZ0t4UTRUOWhvTUFFVXJ4eDJRU0dONitlZ0RYKy92V1Q0ZTdOODJBTVlvUEF4L2V2d1dvWW9TWWJBQ1gyczdLeEN4emNzZXpEaDNldkZvREVCWVRFRXF5Y2dnV0F6QTlBdVVTUVFnZVlQYTlmUHY2L1lXbS9BY3g1SVBiN3R5L2Z3K1FaYmx3Njd2RHM4UjBZSHlRaGdPYngreUFKa0JxbUc1ZFBQRGgxYVBPR1IvZXVnVzBHNHZsSW9USWZ5RmNBK1Fla2hoSEpoUGRReGJpQUlndU1CVFFaclBENzEwOE02cm9XWURGUWlJQUF2NkFvdy8xYkZ3WGdpcytmMkxVQXlud29JYU5jejhYTngzRGw3TUVKVURHUXB4OWd0UThZQ3VlQitEMjZPRUNBQVFEYWR0N2U0NkQ0MlFBQUFBQkpSVTVFcmtKZ2dnPT0pIDJweCAxcHggbm8tcmVwZWF0O1xcbiAgICAgICAgaGVpZ2h0OiA3cHg7XFxuICAgICAgICB3aWR0aDogOHB4OyB9XFxuICAgICAgLmRnIGxpLnNhdmUtcm93IC5idXR0b246aG92ZXIge1xcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogI2JhYjE5ZTtcXG4gICAgICAgIGJveC1zaGFkb3c6IDAgLTFweCAwICNiMGE1OGY7IH1cXG4gIC5kZyBsaS5mb2xkZXIge1xcbiAgICBib3JkZXItYm90dG9tOiAwOyB9XFxuICAuZGcgbGkudGl0bGUge1xcbiAgICBwYWRkaW5nLWxlZnQ6IDE2cHg7XFxuICAgIGJhY2tncm91bmQ6IGJsYWNrIHVybChkYXRhOmltYWdlL2dpZjtiYXNlNjQsUjBsR09EbGhCUUFGQUpFQUFQLy8vL1B6OC8vLy8vLy8veUg1QkFFQUFBSUFMQUFBQUFBRkFBVUFBQUlJbEkraEtnRnhvQ2dBT3c9PSkgNnB4IDEwcHggbm8tcmVwZWF0O1xcbiAgICBjdXJzb3I6IHBvaW50ZXI7XFxuICAgIGJvcmRlci1ib3R0b206IDFweCBzb2xpZCByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMik7IH1cXG4gIC5kZyAuY2xvc2VkIGxpLnRpdGxlIHtcXG4gICAgYmFja2dyb3VuZC1pbWFnZTogdXJsKGRhdGE6aW1hZ2UvZ2lmO2Jhc2U2NCxSMGxHT0RsaEJRQUZBSkVBQVAvLy8vUHo4Ly8vLy8vLy95SDVCQUVBQUFJQUxBQUFBQUFGQUFVQUFBSUlsR0lXcU1DYldBRUFPdz09KTsgfVxcbiAgLmRnIC5jci5ib29sZWFuIHtcXG4gICAgYm9yZGVyLWxlZnQ6IDNweCBzb2xpZCAjODA2Nzg3OyB9XFxuICAuZGcgLmNyLmZ1bmN0aW9uIHtcXG4gICAgYm9yZGVyLWxlZnQ6IDNweCBzb2xpZCAjZTYxZDVmOyB9XFxuICAuZGcgLmNyLm51bWJlciB7XFxuICAgIGJvcmRlci1sZWZ0OiAzcHggc29saWQgIzJmYTFkNjsgfVxcbiAgICAuZGcgLmNyLm51bWJlciBpbnB1dFt0eXBlPXRleHRdIHtcXG4gICAgICBjb2xvcjogIzJmYTFkNjsgfVxcbiAgLmRnIC5jci5zdHJpbmcge1xcbiAgICBib3JkZXItbGVmdDogM3B4IHNvbGlkICMxZWQzNmY7IH1cXG4gICAgLmRnIC5jci5zdHJpbmcgaW5wdXRbdHlwZT10ZXh0XSB7XFxuICAgICAgY29sb3I6ICMxZWQzNmY7IH1cXG4gIC5kZyAuY3IuZnVuY3Rpb246aG92ZXIsIC5kZyAuY3IuYm9vbGVhbjpob3ZlciB7XFxuICAgIGJhY2tncm91bmQ6ICMxMTE7IH1cXG4gIC5kZyAuYyBpbnB1dFt0eXBlPXRleHRdIHtcXG4gICAgYmFja2dyb3VuZDogIzMwMzAzMDtcXG4gICAgb3V0bGluZTogbm9uZTsgfVxcbiAgICAuZGcgLmMgaW5wdXRbdHlwZT10ZXh0XTpob3ZlciB7XFxuICAgICAgYmFja2dyb3VuZDogIzNjM2MzYzsgfVxcbiAgICAuZGcgLmMgaW5wdXRbdHlwZT10ZXh0XTpmb2N1cyB7XFxuICAgICAgYmFja2dyb3VuZDogIzQ5NDk0OTtcXG4gICAgICBjb2xvcjogI2ZmZjsgfVxcbiAgLmRnIC5jIC5zbGlkZXIge1xcbiAgICBiYWNrZ3JvdW5kOiAjMzAzMDMwO1xcbiAgICBjdXJzb3I6IGV3LXJlc2l6ZTsgfVxcbiAgLmRnIC5jIC5zbGlkZXItZmcge1xcbiAgICBiYWNrZ3JvdW5kOiAjMmZhMWQ2OyB9XFxuICAuZGcgLmMgLnNsaWRlcjpob3ZlciB7XFxuICAgIGJhY2tncm91bmQ6ICMzYzNjM2M7IH1cXG4gICAgLmRnIC5jIC5zbGlkZXI6aG92ZXIgLnNsaWRlci1mZyB7XFxuICAgICAgYmFja2dyb3VuZDogIzQ0YWJkYTsgfVxcblwiO1xuXG52YXIgY29udHJvbGxlckZhY3RvcnkgPSByZXF1aXJlKCcuLi9jb250cm9sbGVycy9mYWN0b3J5LmpzJyk7XG52YXIgQ29udHJvbGxlciA9IHJlcXVpcmUoJy4uL2NvbnRyb2xsZXJzL0NvbnRyb2xsZXIuanMnKTtcbnZhciBCb29sZWFuQ29udHJvbGxlciA9IHJlcXVpcmUoJy4uL2NvbnRyb2xsZXJzL0Jvb2xlYW5Db250cm9sbGVyLmpzJyk7XG52YXIgRnVuY3Rpb25Db250cm9sbGVyID0gcmVxdWlyZSgnLi4vY29udHJvbGxlcnMvRnVuY3Rpb25Db250cm9sbGVyLmpzJyk7XG52YXIgTnVtYmVyQ29udHJvbGxlckJveCA9IHJlcXVpcmUoJy4uL2NvbnRyb2xsZXJzL051bWJlckNvbnRyb2xsZXJCb3guanMnKTtcbnZhciBOdW1iZXJDb250cm9sbGVyU2xpZGVyID0gcmVxdWlyZSgnLi4vY29udHJvbGxlcnMvTnVtYmVyQ29udHJvbGxlclNsaWRlci5qcycpO1xudmFyIENvbG9yQ29udHJvbGxlciA9IHJlcXVpcmUoJy4uL2NvbnRyb2xsZXJzL0NvbG9yQ29udHJvbGxlci5qcycpO1xuXG52YXIgcmFmID0gcmVxdWlyZSgnLi4vdXRpbHMvcmVxdWVzdEFuaW1hdGlvbkZyYW1lLmpzJyk7XG52YXIgQ2VudGVyZWREaXYgPSByZXF1aXJlKCcuLi9kb20vQ2VudGVyZWREaXYuanMnKTtcbnZhciBkb20gPSByZXF1aXJlKCcuLi9kb20vZG9tLmpzJyk7XG52YXIgY29tbW9uID0gcmVxdWlyZSgnLi4vdXRpbHMvY29tbW9uLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gY3JlYXRlR1VJKCk7XG5cbmZ1bmN0aW9uIGNyZWF0ZUdVSSgpIHtcblxuICBjc3MuaW5qZWN0KHN0eWxlU2hlZXQpO1xuXG4gIC8qKiBPdXRlci1tb3N0IGNsYXNzTmFtZSBmb3IgR1VJJ3MgKi9cbiAgdmFyIENTU19OQU1FU1BBQ0UgPSAnZGcnO1xuXG4gIHZhciBISURFX0tFWV9DT0RFID0gNzI7XG5cbiAgLyoqIFRoZSBvbmx5IHZhbHVlIHNoYXJlZCBiZXR3ZWVuIHRoZSBKUyBhbmQgU0NTUy4gVXNlIGNhdXRpb24uICovXG4gIHZhciBDTE9TRV9CVVRUT05fSEVJR0hUID0gMjA7XG5cbiAgdmFyIERFRkFVTFRfREVGQVVMVF9QUkVTRVRfTkFNRSA9ICdEZWZhdWx0JztcblxuICB2YXIgU1VQUE9SVFNfTE9DQUxfU1RPUkFHRSA9IChmdW5jdGlvbigpIHtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuICdsb2NhbFN0b3JhZ2UnIGluIHdpbmRvdyAmJiB3aW5kb3dbJ2xvY2FsU3RvcmFnZSddICE9PSBudWxsO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH0pKCk7XG5cbiAgdmFyIFNBVkVfRElBTE9HVUU7XG5cbiAgLyoqIEhhdmUgd2UgeWV0IHRvIGNyZWF0ZSBhbiBhdXRvUGxhY2UgR1VJPyAqL1xuICB2YXIgYXV0b19wbGFjZV92aXJnaW4gPSB0cnVlO1xuXG4gIC8qKiBGaXhlZCBwb3NpdGlvbiBkaXYgdGhhdCBhdXRvIHBsYWNlIEdVSSdzIGdvIGluc2lkZSAqL1xuICB2YXIgYXV0b19wbGFjZV9jb250YWluZXI7XG5cbiAgLyoqIEFyZSB3ZSBoaWRpbmcgdGhlIEdVSSdzID8gKi9cbiAgdmFyIGhpZGUgPSBmYWxzZTtcblxuICAvKiogR1VJJ3Mgd2hpY2ggc2hvdWxkIGJlIGhpZGRlbiAqL1xuICB2YXIgaGlkZWFibGVfZ3VpcyA9IFtdO1xuXG4gIC8qKlxuICAgKiBBIGxpZ2h0d2VpZ2h0IGNvbnRyb2xsZXIgbGlicmFyeSBmb3IgSmF2YVNjcmlwdC4gSXQgYWxsb3dzIHlvdSB0byBlYXNpbHlcbiAgICogbWFuaXB1bGF0ZSB2YXJpYWJsZXMgYW5kIGZpcmUgZnVuY3Rpb25zIG9uIHRoZSBmbHkuXG4gICAqIEBjbGFzc1xuICAgKlxuICAgKiBAbWVtYmVyIGRhdC5ndWlcbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9IFtwYXJhbXNdXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBbcGFyYW1zLm5hbWVdIFRoZSBuYW1lIG9mIHRoaXMgR1VJLlxuICAgKiBAcGFyYW0ge09iamVjdH0gW3BhcmFtcy5sb2FkXSBKU09OIG9iamVjdCByZXByZXNlbnRpbmcgdGhlIHNhdmVkIHN0YXRlIG9mXG4gICAqIHRoaXMgR1VJLlxuICAgKiBAcGFyYW0ge0Jvb2xlYW59IFtwYXJhbXMuYXV0bz10cnVlXVxuICAgKiBAcGFyYW0ge2RhdC5ndWkuR1VJfSBbcGFyYW1zLnBhcmVudF0gVGhlIEdVSSBJJ20gbmVzdGVkIGluLlxuICAgKiBAcGFyYW0ge0Jvb2xlYW59IFtwYXJhbXMuY2xvc2VkXSBJZiB0cnVlLCBzdGFydHMgY2xvc2VkXG4gICAqL1xuICB2YXIgR1VJID0gZnVuY3Rpb24ocGFyYW1zKSB7XG5cbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgLyoqXG4gICAgICogT3V0ZXJtb3N0IERPTSBFbGVtZW50XG4gICAgICogQHR5cGUgRE9NRWxlbWVudFxuICAgICAqL1xuICAgIHRoaXMuZG9tRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHRoaXMuX191bCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3VsJyk7XG4gICAgdGhpcy5kb21FbGVtZW50LmFwcGVuZENoaWxkKHRoaXMuX191bCk7XG5cbiAgICBkb20uYWRkQ2xhc3ModGhpcy5kb21FbGVtZW50LCBDU1NfTkFNRVNQQUNFKTtcblxuICAgIC8qKlxuICAgICAqIE5lc3RlZCBHVUkncyBieSBuYW1lXG4gICAgICogQGlnbm9yZVxuICAgICAqL1xuICAgIHRoaXMuX19mb2xkZXJzID0ge307XG5cbiAgICB0aGlzLl9fY29udHJvbGxlcnMgPSBbXTtcblxuICAgIC8qKlxuICAgICAqIExpc3Qgb2Ygb2JqZWN0cyBJJ20gcmVtZW1iZXJpbmcgZm9yIHNhdmUsIG9ubHkgdXNlZCBpbiB0b3AgbGV2ZWwgR1VJXG4gICAgICogQGlnbm9yZVxuICAgICAqL1xuICAgIHRoaXMuX19yZW1lbWJlcmVkT2JqZWN0cyA9IFtdO1xuXG4gICAgLyoqXG4gICAgICogTWFwcyB0aGUgaW5kZXggb2YgcmVtZW1iZXJlZCBvYmplY3RzIHRvIGEgbWFwIG9mIGNvbnRyb2xsZXJzLCBvbmx5IHVzZWRcbiAgICAgKiBpbiB0b3AgbGV2ZWwgR1VJLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKiBAaWdub3JlXG4gICAgICpcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIFtcbiAgICAgKiAge1xuICAgICAqICAgIHByb3BlcnR5TmFtZTogQ29udHJvbGxlcixcbiAgICAgKiAgICBhbm90aGVyUHJvcGVydHlOYW1lOiBDb250cm9sbGVyXG4gICAgICogIH0sXG4gICAgICogIHtcbiAgICAgKiAgICBwcm9wZXJ0eU5hbWU6IENvbnRyb2xsZXJcbiAgICAgKiAgfVxuICAgICAqIF1cbiAgICAgKi9cbiAgICB0aGlzLl9fcmVtZW1iZXJlZE9iamVjdEluZGVjZXNUb0NvbnRyb2xsZXJzID0gW107XG5cbiAgICB0aGlzLl9fbGlzdGVuaW5nID0gW107XG5cbiAgICBwYXJhbXMgPSBwYXJhbXMgfHwge307XG5cbiAgICAvLyBEZWZhdWx0IHBhcmFtZXRlcnNcbiAgICBwYXJhbXMgPSBjb21tb24uZGVmYXVsdHMocGFyYW1zLCB7XG4gICAgICBhdXRvUGxhY2U6IHRydWUsXG4gICAgICB3aWR0aDogR1VJLkRFRkFVTFRfV0lEVEhcbiAgICB9KTtcblxuICAgIHBhcmFtcyA9IGNvbW1vbi5kZWZhdWx0cyhwYXJhbXMsIHtcbiAgICAgIHJlc2l6YWJsZTogcGFyYW1zLmF1dG9QbGFjZSxcbiAgICAgIGhpZGVhYmxlOiBwYXJhbXMuYXV0b1BsYWNlXG4gICAgfSk7XG5cblxuICAgIGlmICghY29tbW9uLmlzVW5kZWZpbmVkKHBhcmFtcy5sb2FkKSkge1xuXG4gICAgICAvLyBFeHBsaWNpdCBwcmVzZXRcbiAgICAgIGlmIChwYXJhbXMucHJlc2V0KSBwYXJhbXMubG9hZC5wcmVzZXQgPSBwYXJhbXMucHJlc2V0O1xuXG4gICAgfSBlbHNlIHtcblxuICAgICAgcGFyYW1zLmxvYWQgPSB7XG4gICAgICAgIHByZXNldDogREVGQVVMVF9ERUZBVUxUX1BSRVNFVF9OQU1FXG4gICAgICB9O1xuXG4gICAgfVxuXG4gICAgaWYgKGNvbW1vbi5pc1VuZGVmaW5lZChwYXJhbXMucGFyZW50KSAmJiBwYXJhbXMuaGlkZWFibGUpIHtcbiAgICAgIGhpZGVhYmxlX2d1aXMucHVzaCh0aGlzKTtcbiAgICB9XG5cbiAgICAvLyBPbmx5IHJvb3QgbGV2ZWwgR1VJJ3MgYXJlIHJlc2l6YWJsZS5cbiAgICBwYXJhbXMucmVzaXphYmxlID0gY29tbW9uLmlzVW5kZWZpbmVkKHBhcmFtcy5wYXJlbnQpICYmIHBhcmFtcy5yZXNpemFibGU7XG5cblxuICAgIGlmIChwYXJhbXMuYXV0b1BsYWNlICYmIGNvbW1vbi5pc1VuZGVmaW5lZChwYXJhbXMuc2Nyb2xsYWJsZSkpIHtcbiAgICAgIHBhcmFtcy5zY3JvbGxhYmxlID0gdHJ1ZTtcbiAgICB9XG4gICAgLy8gICAgcGFyYW1zLnNjcm9sbGFibGUgPSBjb21tb24uaXNVbmRlZmluZWQocGFyYW1zLnBhcmVudCkgJiYgcGFyYW1zLnNjcm9sbGFibGUgPT09IHRydWU7XG5cbiAgICAvLyBOb3QgcGFydCBvZiBwYXJhbXMgYmVjYXVzZSBJIGRvbid0IHdhbnQgcGVvcGxlIHBhc3NpbmcgdGhpcyBpbiB2aWFcbiAgICAvLyBjb25zdHJ1Y3Rvci4gU2hvdWxkIGJlIGEgJ3JlbWVtYmVyZWQnIHZhbHVlLlxuICAgIHZhciB1c2VfbG9jYWxfc3RvcmFnZSA9XG4gICAgICBTVVBQT1JUU19MT0NBTF9TVE9SQUdFICYmXG4gICAgICBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShnZXRMb2NhbFN0b3JhZ2VIYXNoKHRoaXMsICdpc0xvY2FsJykpID09PSAndHJ1ZSc7XG5cbiAgICB2YXIgc2F2ZVRvTG9jYWxTdG9yYWdlO1xuXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXModGhpcyxcblxuICAgICAgLyoqIEBsZW5kcyBkYXQuZ3VpLkdVSS5wcm90b3R5cGUgKi9cbiAgICAgIHtcblxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIHBhcmVudCA8Y29kZT5HVUk8L2NvZGU+XG4gICAgICAgICAqIEB0eXBlIGRhdC5ndWkuR1VJXG4gICAgICAgICAqL1xuICAgICAgICBwYXJlbnQ6IHtcbiAgICAgICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIHBhcmFtcy5wYXJlbnQ7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIHNjcm9sbGFibGU6IHtcbiAgICAgICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIHBhcmFtcy5zY3JvbGxhYmxlO1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogSGFuZGxlcyA8Y29kZT5HVUk8L2NvZGU+J3MgZWxlbWVudCBwbGFjZW1lbnQgZm9yIHlvdVxuICAgICAgICAgKiBAdHlwZSBCb29sZWFuXG4gICAgICAgICAqL1xuICAgICAgICBhdXRvUGxhY2U6IHtcbiAgICAgICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIHBhcmFtcy5hdXRvUGxhY2U7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgaWRlbnRpZmllciBmb3IgYSBzZXQgb2Ygc2F2ZWQgdmFsdWVzXG4gICAgICAgICAqIEB0eXBlIFN0cmluZ1xuICAgICAgICAgKi9cbiAgICAgICAgcHJlc2V0OiB7XG5cbiAgICAgICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKF90aGlzLnBhcmVudCkge1xuICAgICAgICAgICAgICByZXR1cm4gX3RoaXMuZ2V0Um9vdCgpLnByZXNldDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJldHVybiBwYXJhbXMubG9hZC5wcmVzZXQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSxcblxuICAgICAgICAgIHNldDogZnVuY3Rpb24odikge1xuICAgICAgICAgICAgaWYgKF90aGlzLnBhcmVudCkge1xuICAgICAgICAgICAgICBfdGhpcy5nZXRSb290KCkucHJlc2V0ID0gdjtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHBhcmFtcy5sb2FkLnByZXNldCA9IHY7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzZXRQcmVzZXRTZWxlY3RJbmRleCh0aGlzKTtcbiAgICAgICAgICAgIF90aGlzLnJldmVydCgpO1xuICAgICAgICAgIH1cblxuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgd2lkdGggb2YgPGNvZGU+R1VJPC9jb2RlPiBlbGVtZW50XG4gICAgICAgICAqIEB0eXBlIE51bWJlclxuICAgICAgICAgKi9cbiAgICAgICAgd2lkdGg6IHtcbiAgICAgICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIHBhcmFtcy53aWR0aDtcbiAgICAgICAgICB9LFxuICAgICAgICAgIHNldDogZnVuY3Rpb24odikge1xuICAgICAgICAgICAgcGFyYW1zLndpZHRoID0gdjtcbiAgICAgICAgICAgIHNldFdpZHRoKF90aGlzLCB2KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBuYW1lIG9mIDxjb2RlPkdVSTwvY29kZT4uIFVzZWQgZm9yIGZvbGRlcnMuIGkuZVxuICAgICAgICAgKiBhIGZvbGRlcidzIG5hbWVcbiAgICAgICAgICogQHR5cGUgU3RyaW5nXG4gICAgICAgICAqL1xuICAgICAgICBuYW1lOiB7XG4gICAgICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiBwYXJhbXMubmFtZTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIHNldDogZnVuY3Rpb24odikge1xuICAgICAgICAgICAgLy8gVE9ETyBDaGVjayBmb3IgY29sbGlzaW9ucyBhbW9uZyBzaWJsaW5nIGZvbGRlcnNcbiAgICAgICAgICAgIHBhcmFtcy5uYW1lID0gdjtcbiAgICAgICAgICAgIGlmICh0aXRsZV9yb3dfbmFtZSkge1xuICAgICAgICAgICAgICB0aXRsZV9yb3dfbmFtZS5pbm5lckhUTUwgPSBwYXJhbXMubmFtZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFdoZXRoZXIgdGhlIDxjb2RlPkdVSTwvY29kZT4gaXMgY29sbGFwc2VkIG9yIG5vdFxuICAgICAgICAgKiBAdHlwZSBCb29sZWFuXG4gICAgICAgICAqL1xuICAgICAgICBjbG9zZWQ6IHtcbiAgICAgICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIHBhcmFtcy5jbG9zZWQ7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBzZXQ6IGZ1bmN0aW9uKHYpIHtcbiAgICAgICAgICAgIHBhcmFtcy5jbG9zZWQgPSB2O1xuICAgICAgICAgICAgaWYgKHBhcmFtcy5jbG9zZWQpIHtcbiAgICAgICAgICAgICAgZG9tLmFkZENsYXNzKF90aGlzLl9fdWwsIEdVSS5DTEFTU19DTE9TRUQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgZG9tLnJlbW92ZUNsYXNzKF90aGlzLl9fdWwsIEdVSS5DTEFTU19DTE9TRUQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gRm9yIGJyb3dzZXJzIHRoYXQgYXJlbid0IGdvaW5nIHRvIHJlc3BlY3QgdGhlIENTUyB0cmFuc2l0aW9uLFxuICAgICAgICAgICAgLy8gTGV0cyBqdXN0IGNoZWNrIG91ciBoZWlnaHQgYWdhaW5zdCB0aGUgd2luZG93IGhlaWdodCByaWdodCBvZmZcbiAgICAgICAgICAgIC8vIHRoZSBiYXQuXG4gICAgICAgICAgICB0aGlzLm9uUmVzaXplKCk7XG5cbiAgICAgICAgICAgIGlmIChfdGhpcy5fX2Nsb3NlQnV0dG9uKSB7XG4gICAgICAgICAgICAgIF90aGlzLl9fY2xvc2VCdXR0b24uaW5uZXJIVE1MID0gdiA/IEdVSS5URVhUX09QRU4gOiBHVUkuVEVYVF9DTE9TRUQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDb250YWlucyBhbGwgcHJlc2V0c1xuICAgICAgICAgKiBAdHlwZSBPYmplY3RcbiAgICAgICAgICovXG4gICAgICAgIGxvYWQ6IHtcbiAgICAgICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIHBhcmFtcy5sb2FkO1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogRGV0ZXJtaW5lcyB3aGV0aGVyIG9yIG5vdCB0byB1c2UgPGEgaHJlZj1cImh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuL0RPTS9TdG9yYWdlI2xvY2FsU3RvcmFnZVwiPmxvY2FsU3RvcmFnZTwvYT4gYXMgdGhlIG1lYW5zIGZvclxuICAgICAgICAgKiA8Y29kZT5yZW1lbWJlcjwvY29kZT5pbmdcbiAgICAgICAgICogQHR5cGUgQm9vbGVhblxuICAgICAgICAgKi9cbiAgICAgICAgdXNlTG9jYWxTdG9yYWdlOiB7XG5cbiAgICAgICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIHVzZV9sb2NhbF9zdG9yYWdlO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgc2V0OiBmdW5jdGlvbihib29sKSB7XG4gICAgICAgICAgICBpZiAoU1VQUE9SVFNfTE9DQUxfU1RPUkFHRSkge1xuICAgICAgICAgICAgICB1c2VfbG9jYWxfc3RvcmFnZSA9IGJvb2w7XG4gICAgICAgICAgICAgIGlmIChib29sKSB7XG4gICAgICAgICAgICAgICAgZG9tLmJpbmQod2luZG93LCAndW5sb2FkJywgc2F2ZVRvTG9jYWxTdG9yYWdlKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkb20udW5iaW5kKHdpbmRvdywgJ3VubG9hZCcsIHNhdmVUb0xvY2FsU3RvcmFnZSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oZ2V0TG9jYWxTdG9yYWdlSGFzaChfdGhpcywgJ2lzTG9jYWwnKSwgYm9vbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgIH1cblxuICAgICAgfSk7XG5cbiAgICAvLyBBcmUgd2UgYSByb290IGxldmVsIEdVST9cbiAgICBpZiAoY29tbW9uLmlzVW5kZWZpbmVkKHBhcmFtcy5wYXJlbnQpKSB7XG5cbiAgICAgIHBhcmFtcy5jbG9zZWQgPSBmYWxzZTtcblxuICAgICAgZG9tLmFkZENsYXNzKHRoaXMuZG9tRWxlbWVudCwgR1VJLkNMQVNTX01BSU4pO1xuICAgICAgZG9tLm1ha2VTZWxlY3RhYmxlKHRoaXMuZG9tRWxlbWVudCwgZmFsc2UpO1xuXG4gICAgICAvLyBBcmUgd2Ugc3VwcG9zZWQgdG8gYmUgbG9hZGluZyBsb2NhbGx5P1xuICAgICAgaWYgKFNVUFBPUlRTX0xPQ0FMX1NUT1JBR0UpIHtcblxuICAgICAgICBpZiAodXNlX2xvY2FsX3N0b3JhZ2UpIHtcblxuICAgICAgICAgIF90aGlzLnVzZUxvY2FsU3RvcmFnZSA9IHRydWU7XG5cbiAgICAgICAgICB2YXIgc2F2ZWRfZ3VpID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oZ2V0TG9jYWxTdG9yYWdlSGFzaCh0aGlzLCAnZ3VpJykpO1xuXG4gICAgICAgICAgaWYgKHNhdmVkX2d1aSkge1xuICAgICAgICAgICAgcGFyYW1zLmxvYWQgPSBKU09OLnBhcnNlKHNhdmVkX2d1aSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgIH1cblxuICAgICAgfVxuXG4gICAgICB0aGlzLl9fY2xvc2VCdXR0b24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgIHRoaXMuX19jbG9zZUJ1dHRvbi5pbm5lckhUTUwgPSBHVUkuVEVYVF9DTE9TRUQ7XG4gICAgICBkb20uYWRkQ2xhc3ModGhpcy5fX2Nsb3NlQnV0dG9uLCBHVUkuQ0xBU1NfQ0xPU0VfQlVUVE9OKTtcbiAgICAgIHRoaXMuZG9tRWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLl9fY2xvc2VCdXR0b24pO1xuXG4gICAgICBkb20uYmluZCh0aGlzLl9fY2xvc2VCdXR0b24sICdjbGljaycsIGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIF90aGlzLmNsb3NlZCA9ICFfdGhpcy5jbG9zZWQ7XG5cblxuICAgICAgfSk7XG5cblxuICAgICAgLy8gT2gsIHlvdSdyZSBhIG5lc3RlZCBHVUkhXG4gICAgfSBlbHNlIHtcblxuICAgICAgaWYgKHBhcmFtcy5jbG9zZWQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBwYXJhbXMuY2xvc2VkID0gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgdmFyIHRpdGxlX3Jvd19uYW1lID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUocGFyYW1zLm5hbWUpO1xuICAgICAgZG9tLmFkZENsYXNzKHRpdGxlX3Jvd19uYW1lLCAnY29udHJvbGxlci1uYW1lJyk7XG5cbiAgICAgIHZhciB0aXRsZV9yb3cgPSBhZGRSb3coX3RoaXMsIHRpdGxlX3Jvd19uYW1lKTtcblxuICAgICAgdmFyIG9uX2NsaWNrX3RpdGxlID0gZnVuY3Rpb24oZSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIF90aGlzLmNsb3NlZCA9ICFfdGhpcy5jbG9zZWQ7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH07XG5cbiAgICAgIGRvbS5hZGRDbGFzcyh0aGlzLl9fdWwsIEdVSS5DTEFTU19DTE9TRUQpO1xuXG4gICAgICBkb20uYWRkQ2xhc3ModGl0bGVfcm93LCAndGl0bGUnKTtcbiAgICAgIGRvbS5iaW5kKHRpdGxlX3JvdywgJ2NsaWNrJywgb25fY2xpY2tfdGl0bGUpO1xuXG4gICAgICBpZiAoIXBhcmFtcy5jbG9zZWQpIHtcbiAgICAgICAgdGhpcy5jbG9zZWQgPSBmYWxzZTtcbiAgICAgIH1cblxuICAgIH1cblxuICAgIGlmIChwYXJhbXMuYXV0b1BsYWNlKSB7XG5cbiAgICAgIGlmIChjb21tb24uaXNVbmRlZmluZWQocGFyYW1zLnBhcmVudCkpIHtcblxuICAgICAgICBpZiAoYXV0b19wbGFjZV92aXJnaW4pIHtcbiAgICAgICAgICBhdXRvX3BsYWNlX2NvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICAgIGRvbS5hZGRDbGFzcyhhdXRvX3BsYWNlX2NvbnRhaW5lciwgQ1NTX05BTUVTUEFDRSk7XG4gICAgICAgICAgZG9tLmFkZENsYXNzKGF1dG9fcGxhY2VfY29udGFpbmVyLCBHVUkuQ0xBU1NfQVVUT19QTEFDRV9DT05UQUlORVIpO1xuICAgICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoYXV0b19wbGFjZV9jb250YWluZXIpO1xuICAgICAgICAgIGF1dG9fcGxhY2VfdmlyZ2luID0gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBQdXQgaXQgaW4gdGhlIGRvbSBmb3IgeW91LlxuICAgICAgICBhdXRvX3BsYWNlX2NvbnRhaW5lci5hcHBlbmRDaGlsZCh0aGlzLmRvbUVsZW1lbnQpO1xuXG4gICAgICAgIC8vIEFwcGx5IHRoZSBhdXRvIHN0eWxlc1xuICAgICAgICBkb20uYWRkQ2xhc3ModGhpcy5kb21FbGVtZW50LCBHVUkuQ0xBU1NfQVVUT19QTEFDRSk7XG5cbiAgICAgIH1cblxuXG4gICAgICAvLyBNYWtlIGl0IG5vdCBlbGFzdGljLlxuICAgICAgaWYgKCF0aGlzLnBhcmVudCkgc2V0V2lkdGgoX3RoaXMsIHBhcmFtcy53aWR0aCk7XG5cbiAgICB9XG5cbiAgICBkb20uYmluZCh3aW5kb3csICdyZXNpemUnLCBmdW5jdGlvbigpIHtcbiAgICAgIF90aGlzLm9uUmVzaXplKClcbiAgICB9KTtcbiAgICBkb20uYmluZCh0aGlzLl9fdWwsICd3ZWJraXRUcmFuc2l0aW9uRW5kJywgZnVuY3Rpb24oKSB7XG4gICAgICBfdGhpcy5vblJlc2l6ZSgpO1xuICAgIH0pO1xuICAgIGRvbS5iaW5kKHRoaXMuX191bCwgJ3RyYW5zaXRpb25lbmQnLCBmdW5jdGlvbigpIHtcbiAgICAgIF90aGlzLm9uUmVzaXplKClcbiAgICB9KTtcbiAgICBkb20uYmluZCh0aGlzLl9fdWwsICdvVHJhbnNpdGlvbkVuZCcsIGZ1bmN0aW9uKCkge1xuICAgICAgX3RoaXMub25SZXNpemUoKVxuICAgIH0pO1xuICAgIHRoaXMub25SZXNpemUoKTtcblxuXG4gICAgaWYgKHBhcmFtcy5yZXNpemFibGUpIHtcbiAgICAgIGFkZFJlc2l6ZUhhbmRsZSh0aGlzKTtcbiAgICB9XG5cbiAgICBzYXZlVG9Mb2NhbFN0b3JhZ2UgPSBmdW5jdGlvbigpIHtcbiAgICAgIGlmIChTVVBQT1JUU19MT0NBTF9TVE9SQUdFICYmIGxvY2FsU3RvcmFnZS5nZXRJdGVtKGdldExvY2FsU3RvcmFnZUhhc2goX3RoaXMsICdpc0xvY2FsJykpID09PSAndHJ1ZScpIHtcbiAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oZ2V0TG9jYWxTdG9yYWdlSGFzaChfdGhpcywgJ2d1aScpLCBKU09OLnN0cmluZ2lmeShfdGhpcy5nZXRTYXZlT2JqZWN0KCkpKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBleHBvc2UgdGhpcyBtZXRob2QgcHVibGljbHlcbiAgICB0aGlzLnNhdmVUb0xvY2FsU3RvcmFnZUlmUG9zc2libGUgPSBzYXZlVG9Mb2NhbFN0b3JhZ2U7XG5cbiAgICB2YXIgcm9vdCA9IF90aGlzLmdldFJvb3QoKTtcblxuICAgIGZ1bmN0aW9uIHJlc2V0V2lkdGgoKSB7XG4gICAgICB2YXIgcm9vdCA9IF90aGlzLmdldFJvb3QoKTtcbiAgICAgIHJvb3Qud2lkdGggKz0gMTtcbiAgICAgIGNvbW1vbi5kZWZlcihmdW5jdGlvbigpIHtcbiAgICAgICAgcm9vdC53aWR0aCAtPSAxO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKCFwYXJhbXMucGFyZW50KSB7XG4gICAgICByZXNldFdpZHRoKCk7XG4gICAgfVxuXG4gIH07XG5cbiAgR1VJLnRvZ2dsZUhpZGUgPSBmdW5jdGlvbigpIHtcblxuICAgIGhpZGUgPSAhaGlkZTtcbiAgICBjb21tb24uZWFjaChoaWRlYWJsZV9ndWlzLCBmdW5jdGlvbihndWkpIHtcbiAgICAgIGd1aS5kb21FbGVtZW50LnN0eWxlLnpJbmRleCA9IGhpZGUgPyAtOTk5IDogOTk5O1xuICAgICAgZ3VpLmRvbUVsZW1lbnQuc3R5bGUub3BhY2l0eSA9IGhpZGUgPyAwIDogMTtcbiAgICB9KTtcbiAgfTtcblxuICBHVUkuQ0xBU1NfQVVUT19QTEFDRSA9ICdhJztcbiAgR1VJLkNMQVNTX0FVVE9fUExBQ0VfQ09OVEFJTkVSID0gJ2FjJztcbiAgR1VJLkNMQVNTX01BSU4gPSAnbWFpbic7XG4gIEdVSS5DTEFTU19DT05UUk9MTEVSX1JPVyA9ICdjcic7XG4gIEdVSS5DTEFTU19UT09fVEFMTCA9ICd0YWxsZXItdGhhbi13aW5kb3cnO1xuICBHVUkuQ0xBU1NfQ0xPU0VEID0gJ2Nsb3NlZCc7XG4gIEdVSS5DTEFTU19DTE9TRV9CVVRUT04gPSAnY2xvc2UtYnV0dG9uJztcbiAgR1VJLkNMQVNTX0RSQUcgPSAnZHJhZyc7XG5cbiAgR1VJLkRFRkFVTFRfV0lEVEggPSAyNDU7XG4gIEdVSS5URVhUX0NMT1NFRCA9ICdDbG9zZSBDb250cm9scyc7XG4gIEdVSS5URVhUX09QRU4gPSAnT3BlbiBDb250cm9scyc7XG5cbiAgZG9tLmJpbmQod2luZG93LCAna2V5ZG93bicsIGZ1bmN0aW9uKGUpIHtcblxuICAgIGlmIChkb2N1bWVudC5hY3RpdmVFbGVtZW50LnR5cGUgIT09ICd0ZXh0JyAmJlxuICAgICAgKGUud2hpY2ggPT09IEhJREVfS0VZX0NPREUgfHwgZS5rZXlDb2RlID09IEhJREVfS0VZX0NPREUpKSB7XG4gICAgICBHVUkudG9nZ2xlSGlkZSgpO1xuICAgIH1cblxuICB9LCBmYWxzZSk7XG5cbiAgY29tbW9uLmV4dGVuZChcblxuICAgIEdVSS5wcm90b3R5cGUsXG5cbiAgICAvKiogQGxlbmRzIGRhdC5ndWkuR1VJICovXG4gICAge1xuXG4gICAgICAvKipcbiAgICAgICAqIEBwYXJhbSBvYmplY3RcbiAgICAgICAqIEBwYXJhbSBwcm9wZXJ0eVxuICAgICAgICogQHJldHVybnMge2RhdC5jb250cm9sbGVycy5Db250cm9sbGVyfSBUaGUgbmV3IGNvbnRyb2xsZXIgdGhhdCB3YXMgYWRkZWQuXG4gICAgICAgKiBAaW5zdGFuY2VcbiAgICAgICAqL1xuICAgICAgYWRkOiBmdW5jdGlvbihvYmplY3QsIHByb3BlcnR5KSB7XG5cbiAgICAgICAgcmV0dXJuIGFkZChcbiAgICAgICAgICB0aGlzLFxuICAgICAgICAgIG9iamVjdCxcbiAgICAgICAgICBwcm9wZXJ0eSwge1xuICAgICAgICAgICAgZmFjdG9yeUFyZ3M6IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMilcbiAgICAgICAgICB9XG4gICAgICAgICk7XG5cbiAgICAgIH0sXG5cbiAgICAgIC8qKlxuICAgICAgICogQHBhcmFtIG9iamVjdFxuICAgICAgICogQHBhcmFtIHByb3BlcnR5XG4gICAgICAgKiBAcmV0dXJucyB7ZGF0LmNvbnRyb2xsZXJzLkNvbG9yQ29udHJvbGxlcn0gVGhlIG5ldyBjb250cm9sbGVyIHRoYXQgd2FzIGFkZGVkLlxuICAgICAgICogQGluc3RhbmNlXG4gICAgICAgKi9cbiAgICAgIGFkZENvbG9yOiBmdW5jdGlvbihvYmplY3QsIHByb3BlcnR5KSB7XG5cbiAgICAgICAgcmV0dXJuIGFkZChcbiAgICAgICAgICB0aGlzLFxuICAgICAgICAgIG9iamVjdCxcbiAgICAgICAgICBwcm9wZXJ0eSwge1xuICAgICAgICAgICAgY29sb3I6IHRydWVcbiAgICAgICAgICB9XG4gICAgICAgICk7XG5cbiAgICAgIH0sXG5cbiAgICAgIC8qKlxuICAgICAgICogQHBhcmFtIGNvbnRyb2xsZXJcbiAgICAgICAqIEBpbnN0YW5jZVxuICAgICAgICovXG4gICAgICByZW1vdmU6IGZ1bmN0aW9uKGNvbnRyb2xsZXIpIHtcblxuICAgICAgICAvLyBUT0RPIGxpc3RlbmluZz9cbiAgICAgICAgdGhpcy5fX3VsLnJlbW92ZUNoaWxkKGNvbnRyb2xsZXIuX19saSk7XG4gICAgICAgIHRoaXMuX19jb250cm9sbGVycy5zcGxpY2UodGhpcy5fX2NvbnRyb2xsZXJzLmluZGV4T2YoY29udHJvbGxlciksIDEpO1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICBjb21tb24uZGVmZXIoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgX3RoaXMub25SZXNpemUoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgIH0sXG5cbiAgICAgIGRlc3Ryb3k6IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIGlmICh0aGlzLmF1dG9QbGFjZSkge1xuICAgICAgICAgIGF1dG9fcGxhY2VfY29udGFpbmVyLnJlbW92ZUNoaWxkKHRoaXMuZG9tRWxlbWVudCk7XG4gICAgICAgIH1cblxuICAgICAgfSxcblxuICAgICAgLyoqXG4gICAgICAgKiBAcGFyYW0gbmFtZVxuICAgICAgICogQHJldHVybnMge2RhdC5ndWkuR1VJfSBUaGUgbmV3IGZvbGRlci5cbiAgICAgICAqIEB0aHJvd3Mge0Vycm9yfSBpZiB0aGlzIEdVSSBhbHJlYWR5IGhhcyBhIGZvbGRlciBieSB0aGUgc3BlY2lmaWVkXG4gICAgICAgKiBuYW1lXG4gICAgICAgKiBAaW5zdGFuY2VcbiAgICAgICAqL1xuICAgICAgYWRkRm9sZGVyOiBmdW5jdGlvbihuYW1lKSB7XG5cbiAgICAgICAgLy8gV2UgaGF2ZSB0byBwcmV2ZW50IGNvbGxpc2lvbnMgb24gbmFtZXMgaW4gb3JkZXIgdG8gaGF2ZSBhIGtleVxuICAgICAgICAvLyBieSB3aGljaCB0byByZW1lbWJlciBzYXZlZCB2YWx1ZXNcbiAgICAgICAgaWYgKHRoaXMuX19mb2xkZXJzW25hbWVdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1lvdSBhbHJlYWR5IGhhdmUgYSBmb2xkZXIgaW4gdGhpcyBHVUkgYnkgdGhlJyArXG4gICAgICAgICAgICAnIG5hbWUgXCInICsgbmFtZSArICdcIicpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIG5ld19ndWlfcGFyYW1zID0ge1xuICAgICAgICAgIG5hbWU6IG5hbWUsXG4gICAgICAgICAgcGFyZW50OiB0aGlzXG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gV2UgbmVlZCB0byBwYXNzIGRvd24gdGhlIGF1dG9QbGFjZSB0cmFpdCBzbyB0aGF0IHdlIGNhblxuICAgICAgICAvLyBhdHRhY2ggZXZlbnQgbGlzdGVuZXJzIHRvIG9wZW4vY2xvc2UgZm9sZGVyIGFjdGlvbnMgdG9cbiAgICAgICAgLy8gZW5zdXJlIHRoYXQgYSBzY3JvbGxiYXIgYXBwZWFycyBpZiB0aGUgd2luZG93IGlzIHRvbyBzaG9ydC5cbiAgICAgICAgbmV3X2d1aV9wYXJhbXMuYXV0b1BsYWNlID0gdGhpcy5hdXRvUGxhY2U7XG5cbiAgICAgICAgLy8gRG8gd2UgaGF2ZSBzYXZlZCBhcHBlYXJhbmNlIGRhdGEgZm9yIHRoaXMgZm9sZGVyP1xuXG4gICAgICAgIGlmICh0aGlzLmxvYWQgJiYgLy8gQW55dGhpbmcgbG9hZGVkP1xuICAgICAgICAgIHRoaXMubG9hZC5mb2xkZXJzICYmIC8vIFdhcyBteSBwYXJlbnQgYSBkZWFkLWVuZD9cbiAgICAgICAgICB0aGlzLmxvYWQuZm9sZGVyc1tuYW1lXSkgeyAvLyBEaWQgZGFkZHkgcmVtZW1iZXIgbWU/XG5cbiAgICAgICAgICAvLyBTdGFydCBtZSBjbG9zZWQgaWYgSSB3YXMgY2xvc2VkXG4gICAgICAgICAgbmV3X2d1aV9wYXJhbXMuY2xvc2VkID0gdGhpcy5sb2FkLmZvbGRlcnNbbmFtZV0uY2xvc2VkO1xuXG4gICAgICAgICAgLy8gUGFzcyBkb3duIHRoZSBsb2FkZWQgZGF0YVxuICAgICAgICAgIG5ld19ndWlfcGFyYW1zLmxvYWQgPSB0aGlzLmxvYWQuZm9sZGVyc1tuYW1lXTtcblxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGd1aSA9IG5ldyBHVUkobmV3X2d1aV9wYXJhbXMpO1xuICAgICAgICB0aGlzLl9fZm9sZGVyc1tuYW1lXSA9IGd1aTtcblxuICAgICAgICB2YXIgbGkgPSBhZGRSb3codGhpcywgZ3VpLmRvbUVsZW1lbnQpO1xuICAgICAgICBkb20uYWRkQ2xhc3MobGksICdmb2xkZXInKTtcbiAgICAgICAgcmV0dXJuIGd1aTtcblxuICAgICAgfSxcblxuICAgICAgcmVtb3ZlRm9sZGVyOiBmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICB2YXIgZm9sZGVyID0gdGhpcy5fX2ZvbGRlcnNbbmFtZV07XG4gICAgICAgIGlmICghZm9sZGVyKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGRlbGV0ZSB0aGlzLl9fZm9sZGVyc1tuYW1lXTtcblxuICAgICAgICB2YXIgY2hpbGRDb250cm9sbGVycyA9IGZvbGRlci5fX2NvbnRyb2xsZXJzO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNoaWxkQ29udHJvbGxlcnMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICBjaGlsZENvbnRyb2xsZXJzW2ldLnJlbW92ZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGNoaWxkRm9sZGVycyA9IE9iamVjdC5rZXlzKGZvbGRlci5fX2ZvbGRlcnMgfHwge30pO1xuICAgICAgICBmb3IgKGkgID0gMDsgaSA8IGNoaWxkRm9sZGVycy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgIHZhciBjaGlsZE5hbWUgPSBjaGlsZEZvbGRlcnNbaV07XG4gICAgICAgICAgZm9sZGVyLnJlbW92ZUZvbGRlcihjaGlsZE5hbWUpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBsaUNvbnRhaW5lciA9IGZvbGRlci5kb21FbGVtZW50LnBhcmVudE5vZGU7XG4gICAgICAgIGxpQ29udGFpbmVyLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQobGlDb250YWluZXIpO1xuICAgICAgfSxcblxuICAgICAgb3BlbjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuY2xvc2VkID0gZmFsc2U7XG4gICAgICB9LFxuXG4gICAgICB1cGRhdGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdXBkYXRlQWxsKHRoaXMpO1xuICAgICAgfSxcblxuICAgICAgY2xvc2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLmNsb3NlZCA9IHRydWU7XG4gICAgICB9LFxuXG4gICAgICBvblJlc2l6ZTogZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgdmFyIHJvb3QgPSB0aGlzLmdldFJvb3QoKTtcblxuICAgICAgICBpZiAocm9vdC5zY3JvbGxhYmxlKSB7XG5cbiAgICAgICAgICB2YXIgdG9wID0gZG9tLmdldE9mZnNldChyb290Ll9fdWwpLnRvcDtcbiAgICAgICAgICB2YXIgaCA9IDA7XG5cbiAgICAgICAgICBjb21tb24uZWFjaChyb290Ll9fdWwuY2hpbGROb2RlcywgZnVuY3Rpb24obm9kZSkge1xuICAgICAgICAgICAgaWYgKCEocm9vdC5hdXRvUGxhY2UgJiYgbm9kZSA9PT0gcm9vdC5fX3NhdmVfcm93KSlcbiAgICAgICAgICAgICAgaCArPSBkb20uZ2V0SGVpZ2h0KG5vZGUpO1xuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgaWYgKHdpbmRvdy5pbm5lckhlaWdodCAtIHRvcCAtIENMT1NFX0JVVFRPTl9IRUlHSFQgPCBoKSB7XG4gICAgICAgICAgICBkb20uYWRkQ2xhc3Mocm9vdC5kb21FbGVtZW50LCBHVUkuQ0xBU1NfVE9PX1RBTEwpO1xuICAgICAgICAgICAgcm9vdC5fX3VsLnN0eWxlLmhlaWdodCA9IHdpbmRvdy5pbm5lckhlaWdodCAtIHRvcCAtIENMT1NFX0JVVFRPTl9IRUlHSFQgKyAncHgnO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkb20ucmVtb3ZlQ2xhc3Mocm9vdC5kb21FbGVtZW50LCBHVUkuQ0xBU1NfVE9PX1RBTEwpO1xuICAgICAgICAgICAgcm9vdC5fX3VsLnN0eWxlLmhlaWdodCA9ICdhdXRvJztcbiAgICAgICAgICB9XG5cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChyb290Ll9fcmVzaXplX2hhbmRsZSkge1xuICAgICAgICAgIGNvbW1vbi5kZWZlcihmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJvb3QuX19yZXNpemVfaGFuZGxlLnN0eWxlLmhlaWdodCA9IHJvb3QuX191bC5vZmZzZXRIZWlnaHQgKyAncHgnO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHJvb3QuX19jbG9zZUJ1dHRvbikge1xuICAgICAgICAgIHJvb3QuX19jbG9zZUJ1dHRvbi5zdHlsZS53aWR0aCA9IHJvb3Qud2lkdGggKyAncHgnO1xuICAgICAgICB9XG5cbiAgICAgIH0sXG5cbiAgICAgIC8qKlxuICAgICAgICogTWFyayBvYmplY3RzIGZvciBzYXZpbmcuIFRoZSBvcmRlciBvZiB0aGVzZSBvYmplY3RzIGNhbm5vdCBjaGFuZ2UgYXNcbiAgICAgICAqIHRoZSBHVUkgZ3Jvd3MuIFdoZW4gcmVtZW1iZXJpbmcgbmV3IG9iamVjdHMsIGFwcGVuZCB0aGVtIHRvIHRoZSBlbmRcbiAgICAgICAqIG9mIHRoZSBsaXN0LlxuICAgICAgICpcbiAgICAgICAqIEBwYXJhbSB7T2JqZWN0Li4ufSBvYmplY3RzXG4gICAgICAgKiBAdGhyb3dzIHtFcnJvcn0gaWYgbm90IGNhbGxlZCBvbiBhIHRvcCBsZXZlbCBHVUkuXG4gICAgICAgKiBAaW5zdGFuY2VcbiAgICAgICAqL1xuICAgICAgcmVtZW1iZXI6IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIGlmIChjb21tb24uaXNVbmRlZmluZWQoU0FWRV9ESUFMT0dVRSkpIHtcbiAgICAgICAgICBTQVZFX0RJQUxPR1VFID0gbmV3IENlbnRlcmVkRGl2KCk7XG4gICAgICAgICAgU0FWRV9ESUFMT0dVRS5kb21FbGVtZW50LmlubmVySFRNTCA9IHNhdmVEaWFsb2d1ZUNvbnRlbnRzO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMucGFyZW50KSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiWW91IGNhbiBvbmx5IGNhbGwgcmVtZW1iZXIgb24gYSB0b3AgbGV2ZWwgR1VJLlwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICAgICAgY29tbW9uLmVhY2goQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKSwgZnVuY3Rpb24ob2JqZWN0KSB7XG4gICAgICAgICAgaWYgKF90aGlzLl9fcmVtZW1iZXJlZE9iamVjdHMubGVuZ3RoID09IDApIHtcbiAgICAgICAgICAgIGFkZFNhdmVNZW51KF90aGlzKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKF90aGlzLl9fcmVtZW1iZXJlZE9iamVjdHMuaW5kZXhPZihvYmplY3QpID09IC0xKSB7XG4gICAgICAgICAgICBfdGhpcy5fX3JlbWVtYmVyZWRPYmplY3RzLnB1c2gob2JqZWN0KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmICh0aGlzLmF1dG9QbGFjZSkge1xuICAgICAgICAgIC8vIFNldCBzYXZlIHJvdyB3aWR0aFxuICAgICAgICAgIHNldFdpZHRoKHRoaXMsIHRoaXMud2lkdGgpO1xuICAgICAgICB9XG5cbiAgICAgIH0sXG5cbiAgICAgIC8qKlxuICAgICAgICogQHJldHVybnMge2RhdC5ndWkuR1VJfSB0aGUgdG9wbW9zdCBwYXJlbnQgR1VJIG9mIGEgbmVzdGVkIEdVSS5cbiAgICAgICAqIEBpbnN0YW5jZVxuICAgICAgICovXG4gICAgICBnZXRSb290OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGd1aSA9IHRoaXM7XG4gICAgICAgIHdoaWxlIChndWkucGFyZW50KSB7XG4gICAgICAgICAgZ3VpID0gZ3VpLnBhcmVudDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZ3VpO1xuICAgICAgfSxcblxuICAgICAgLyoqXG4gICAgICAgKiBAcmV0dXJucyB7T2JqZWN0fSBhIEpTT04gb2JqZWN0IHJlcHJlc2VudGluZyB0aGUgY3VycmVudCBzdGF0ZSBvZlxuICAgICAgICogdGhpcyBHVUkgYXMgd2VsbCBhcyBpdHMgcmVtZW1iZXJlZCBwcm9wZXJ0aWVzLlxuICAgICAgICogQGluc3RhbmNlXG4gICAgICAgKi9cbiAgICAgIGdldFNhdmVPYmplY3Q6IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIHZhciB0b1JldHVybiA9IHRoaXMubG9hZDtcblxuICAgICAgICB0b1JldHVybi5jbG9zZWQgPSB0aGlzLmNsb3NlZDtcblxuICAgICAgICAvLyBBbSBJIHJlbWVtYmVyaW5nIGFueSB2YWx1ZXM/XG4gICAgICAgIGlmICh0aGlzLl9fcmVtZW1iZXJlZE9iamVjdHMubGVuZ3RoID4gMCkge1xuXG4gICAgICAgICAgdG9SZXR1cm4ucHJlc2V0ID0gdGhpcy5wcmVzZXQ7XG5cbiAgICAgICAgICBpZiAoIXRvUmV0dXJuLnJlbWVtYmVyZWQpIHtcbiAgICAgICAgICAgIHRvUmV0dXJuLnJlbWVtYmVyZWQgPSB7fTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB0b1JldHVybi5yZW1lbWJlcmVkW3RoaXMucHJlc2V0XSA9IGdldEN1cnJlbnRQcmVzZXQodGhpcyk7XG5cbiAgICAgICAgfVxuXG4gICAgICAgIHRvUmV0dXJuLmZvbGRlcnMgPSB7fTtcbiAgICAgICAgY29tbW9uLmVhY2godGhpcy5fX2ZvbGRlcnMsIGZ1bmN0aW9uKGVsZW1lbnQsIGtleSkge1xuICAgICAgICAgIHRvUmV0dXJuLmZvbGRlcnNba2V5XSA9IGVsZW1lbnQuZ2V0U2F2ZU9iamVjdCgpO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gdG9SZXR1cm47XG5cbiAgICAgIH0sXG5cbiAgICAgIHNhdmU6IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIGlmICghdGhpcy5sb2FkLnJlbWVtYmVyZWQpIHtcbiAgICAgICAgICB0aGlzLmxvYWQucmVtZW1iZXJlZCA9IHt9O1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5sb2FkLnJlbWVtYmVyZWRbdGhpcy5wcmVzZXRdID0gZ2V0Q3VycmVudFByZXNldCh0aGlzKTtcbiAgICAgICAgbWFya1ByZXNldE1vZGlmaWVkKHRoaXMsIGZhbHNlKTtcbiAgICAgICAgdGhpcy5zYXZlVG9Mb2NhbFN0b3JhZ2VJZlBvc3NpYmxlKCk7XG5cbiAgICAgIH0sXG5cbiAgICAgIHNhdmVBczogZnVuY3Rpb24ocHJlc2V0TmFtZSkge1xuXG4gICAgICAgIGlmICghdGhpcy5sb2FkLnJlbWVtYmVyZWQpIHtcblxuICAgICAgICAgIC8vIFJldGFpbiBkZWZhdWx0IHZhbHVlcyB1cG9uIGZpcnN0IHNhdmVcbiAgICAgICAgICB0aGlzLmxvYWQucmVtZW1iZXJlZCA9IHt9O1xuICAgICAgICAgIHRoaXMubG9hZC5yZW1lbWJlcmVkW0RFRkFVTFRfREVGQVVMVF9QUkVTRVRfTkFNRV0gPSBnZXRDdXJyZW50UHJlc2V0KHRoaXMsIHRydWUpO1xuXG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmxvYWQucmVtZW1iZXJlZFtwcmVzZXROYW1lXSA9IGdldEN1cnJlbnRQcmVzZXQodGhpcyk7XG4gICAgICAgIHRoaXMucHJlc2V0ID0gcHJlc2V0TmFtZTtcbiAgICAgICAgYWRkUHJlc2V0T3B0aW9uKHRoaXMsIHByZXNldE5hbWUsIHRydWUpO1xuICAgICAgICB0aGlzLnNhdmVUb0xvY2FsU3RvcmFnZUlmUG9zc2libGUoKTtcblxuICAgICAgfSxcblxuICAgICAgcmV2ZXJ0OiBmdW5jdGlvbihndWkpIHtcblxuICAgICAgICBjb21tb24uZWFjaCh0aGlzLl9fY29udHJvbGxlcnMsIGZ1bmN0aW9uKGNvbnRyb2xsZXIpIHtcbiAgICAgICAgICAvLyBNYWtlIHJldmVydCB3b3JrIG9uIERlZmF1bHQuXG4gICAgICAgICAgaWYgKCF0aGlzLmdldFJvb3QoKS5sb2FkLnJlbWVtYmVyZWQpIHtcbiAgICAgICAgICAgIGNvbnRyb2xsZXIuc2V0VmFsdWUoY29udHJvbGxlci5pbml0aWFsVmFsdWUpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZWNhbGxTYXZlZFZhbHVlKGd1aSB8fCB0aGlzLmdldFJvb3QoKSwgY29udHJvbGxlcik7XG4gICAgICAgICAgfVxuICAgICAgICB9LCB0aGlzKTtcblxuICAgICAgICBjb21tb24uZWFjaCh0aGlzLl9fZm9sZGVycywgZnVuY3Rpb24oZm9sZGVyKSB7XG4gICAgICAgICAgZm9sZGVyLnJldmVydChmb2xkZXIpO1xuICAgICAgICB9KTtcblxuICAgICAgICBpZiAoIWd1aSkge1xuICAgICAgICAgIG1hcmtQcmVzZXRNb2RpZmllZCh0aGlzLmdldFJvb3QoKSwgZmFsc2UpO1xuICAgICAgICB9XG5cblxuICAgICAgfSxcblxuICAgICAgbGlzdGVuOiBmdW5jdGlvbihjb250cm9sbGVyKSB7XG5cbiAgICAgICAgdmFyIGluaXQgPSB0aGlzLl9fbGlzdGVuaW5nLmxlbmd0aCA9PSAwO1xuICAgICAgICB0aGlzLl9fbGlzdGVuaW5nLnB1c2goY29udHJvbGxlcik7XG4gICAgICAgIGlmIChpbml0KSB1cGRhdGVEaXNwbGF5cyh0aGlzLl9fbGlzdGVuaW5nKTtcblxuICAgICAgfVxuXG4gICAgfVxuXG4gICk7XG5cbiAgZnVuY3Rpb24gYWRkKGd1aSwgb2JqZWN0LCBwcm9wZXJ0eSwgcGFyYW1zKSB7XG5cbiAgICBpZiAob2JqZWN0W3Byb3BlcnR5XSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJPYmplY3QgXCIgKyBvYmplY3QgKyBcIiBoYXMgbm8gcHJvcGVydHkgXFxcIlwiICsgcHJvcGVydHkgKyBcIlxcXCJcIik7XG4gICAgfVxuXG4gICAgdmFyIGNvbnRyb2xsZXI7XG5cbiAgICBpZiAocGFyYW1zLmNvbG9yKSB7XG4gICAgICBjb250cm9sbGVyID0gbmV3IENvbG9yQ29udHJvbGxlcihvYmplY3QsIHByb3BlcnR5KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGZhY3RvcnlBcmdzID0gW29iamVjdCwgcHJvcGVydHldLmNvbmNhdChwYXJhbXMuZmFjdG9yeUFyZ3MpO1xuICAgICAgY29udHJvbGxlciA9IGNvbnRyb2xsZXJGYWN0b3J5LmFwcGx5KGd1aSwgZmFjdG9yeUFyZ3MpO1xuICAgIH1cblxuICAgIGlmIChwYXJhbXMuYmVmb3JlIGluc3RhbmNlb2YgQ29udHJvbGxlcikge1xuICAgICAgcGFyYW1zLmJlZm9yZSA9IHBhcmFtcy5iZWZvcmUuX19saTtcbiAgICB9XG5cbiAgICByZWNhbGxTYXZlZFZhbHVlKGd1aSwgY29udHJvbGxlcik7XG5cbiAgICBkb20uYWRkQ2xhc3MoY29udHJvbGxlci5kb21FbGVtZW50LCAnYycpO1xuXG4gICAgdmFyIG5hbWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgZG9tLmFkZENsYXNzKG5hbWUsICdwcm9wZXJ0eS1uYW1lJyk7XG4gICAgbmFtZS5pbm5lckhUTUwgPSBjb250cm9sbGVyLnByb3BlcnR5O1xuXG4gICAgdmFyIGNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChuYW1lKTtcbiAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQoY29udHJvbGxlci5kb21FbGVtZW50KTtcblxuICAgIHZhciBsaSA9IGFkZFJvdyhndWksIGNvbnRhaW5lciwgcGFyYW1zLmJlZm9yZSk7XG5cbiAgICBkb20uYWRkQ2xhc3MobGksIEdVSS5DTEFTU19DT05UUk9MTEVSX1JPVyk7XG4gICAgZG9tLmFkZENsYXNzKGxpLCB0eXBlb2YgY29udHJvbGxlci5nZXRWYWx1ZSgpKTtcblxuICAgIGF1Z21lbnRDb250cm9sbGVyKGd1aSwgbGksIGNvbnRyb2xsZXIpO1xuXG4gICAgZ3VpLl9fY29udHJvbGxlcnMucHVzaChjb250cm9sbGVyKTtcblxuICAgIHJldHVybiBjb250cm9sbGVyO1xuXG4gIH1cblxuICAvKipcbiAgICogQWRkIGEgcm93IHRvIHRoZSBlbmQgb2YgdGhlIEdVSSBvciBiZWZvcmUgYW5vdGhlciByb3cuXG4gICAqXG4gICAqIEBwYXJhbSBndWlcbiAgICogQHBhcmFtIFtkb21dIElmIHNwZWNpZmllZCwgaW5zZXJ0cyB0aGUgZG9tIGNvbnRlbnQgaW4gdGhlIG5ldyByb3dcbiAgICogQHBhcmFtIFtsaUJlZm9yZV0gSWYgc3BlY2lmaWVkLCBwbGFjZXMgdGhlIG5ldyByb3cgYmVmb3JlIGFub3RoZXIgcm93XG4gICAqL1xuICBmdW5jdGlvbiBhZGRSb3coZ3VpLCBkb20sIGxpQmVmb3JlKSB7XG4gICAgdmFyIGxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcbiAgICBpZiAoZG9tKSBsaS5hcHBlbmRDaGlsZChkb20pO1xuICAgIGlmIChsaUJlZm9yZSkge1xuICAgICAgZ3VpLl9fdWwuaW5zZXJ0QmVmb3JlKGxpLCBwYXJhbXMuYmVmb3JlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZ3VpLl9fdWwuYXBwZW5kQ2hpbGQobGkpO1xuICAgIH1cbiAgICBndWkub25SZXNpemUoKTtcbiAgICByZXR1cm4gbGk7XG4gIH1cblxuICBmdW5jdGlvbiBhdWdtZW50Q29udHJvbGxlcihndWksIGxpLCBjb250cm9sbGVyKSB7XG5cbiAgICBjb250cm9sbGVyLl9fbGkgPSBsaTtcbiAgICBjb250cm9sbGVyLl9fZ3VpID0gZ3VpO1xuXG4gICAgY29tbW9uLmV4dGVuZChjb250cm9sbGVyLCB7XG5cbiAgICAgIG9wdGlvbnM6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcblxuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICBjb250cm9sbGVyLnJlbW92ZSgpO1xuXG4gICAgICAgICAgcmV0dXJuIGFkZChcbiAgICAgICAgICAgIGd1aSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXIub2JqZWN0LFxuICAgICAgICAgICAgY29udHJvbGxlci5wcm9wZXJ0eSwge1xuICAgICAgICAgICAgICBiZWZvcmU6IGNvbnRyb2xsZXIuX19saS5uZXh0RWxlbWVudFNpYmxpbmcsXG4gICAgICAgICAgICAgIGZhY3RvcnlBcmdzOiBbY29tbW9uLnRvQXJyYXkoYXJndW1lbnRzKV1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICApO1xuXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY29tbW9uLmlzQXJyYXkob3B0aW9ucykgfHwgY29tbW9uLmlzT2JqZWN0KG9wdGlvbnMpKSB7XG4gICAgICAgICAgY29udHJvbGxlci5yZW1vdmUoKTtcblxuICAgICAgICAgIHJldHVybiBhZGQoXG4gICAgICAgICAgICBndWksXG4gICAgICAgICAgICBjb250cm9sbGVyLm9iamVjdCxcbiAgICAgICAgICAgIGNvbnRyb2xsZXIucHJvcGVydHksIHtcbiAgICAgICAgICAgICAgYmVmb3JlOiBjb250cm9sbGVyLl9fbGkubmV4dEVsZW1lbnRTaWJsaW5nLFxuICAgICAgICAgICAgICBmYWN0b3J5QXJnczogW29wdGlvbnNdXG4gICAgICAgICAgICB9XG4gICAgICAgICAgKTtcblxuICAgICAgICB9XG5cbiAgICAgIH0sXG5cbiAgICAgIG5hbWU6IGZ1bmN0aW9uKHYpIHtcbiAgICAgICAgY29udHJvbGxlci5fX2xpLmZpcnN0RWxlbWVudENoaWxkLmZpcnN0RWxlbWVudENoaWxkLmlubmVySFRNTCA9IHY7XG4gICAgICAgIHJldHVybiBjb250cm9sbGVyO1xuICAgICAgfSxcblxuICAgICAgbGlzdGVuOiBmdW5jdGlvbigpIHtcbiAgICAgICAgY29udHJvbGxlci5fX2d1aS5saXN0ZW4oY29udHJvbGxlcik7XG4gICAgICAgIHJldHVybiBjb250cm9sbGVyO1xuICAgICAgfSxcblxuICAgICAgcmVtb3ZlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgY29udHJvbGxlci5fX2d1aS5yZW1vdmUoY29udHJvbGxlcik7XG4gICAgICAgIHJldHVybiBjb250cm9sbGVyO1xuICAgICAgfVxuXG4gICAgfSk7XG5cbiAgICAvLyBBbGwgc2xpZGVycyBzaG91bGQgYmUgYWNjb21wYW5pZWQgYnkgYSBib3guXG4gICAgaWYgKGNvbnRyb2xsZXIgaW5zdGFuY2VvZiBOdW1iZXJDb250cm9sbGVyU2xpZGVyKSB7XG5cbiAgICAgIHZhciBib3ggPSBuZXcgTnVtYmVyQ29udHJvbGxlckJveChjb250cm9sbGVyLm9iamVjdCwgY29udHJvbGxlci5wcm9wZXJ0eSwge1xuICAgICAgICBtaW46IGNvbnRyb2xsZXIuX19taW4sXG4gICAgICAgIG1heDogY29udHJvbGxlci5fX21heCxcbiAgICAgICAgc3RlcDogY29udHJvbGxlci5fX3N0ZXBcbiAgICAgIH0pO1xuXG4gICAgICBjb21tb24uZWFjaChbJ3VwZGF0ZURpc3BsYXknLCAnb25DaGFuZ2UnLCAnb25GaW5pc2hDaGFuZ2UnXSwgZnVuY3Rpb24obWV0aG9kKSB7XG4gICAgICAgIHZhciBwYyA9IGNvbnRyb2xsZXJbbWV0aG9kXTtcbiAgICAgICAgdmFyIHBiID0gYm94W21ldGhvZF07XG4gICAgICAgIGNvbnRyb2xsZXJbbWV0aG9kXSA9IGJveFttZXRob2RdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICAgICAgICAgIHBjLmFwcGx5KGNvbnRyb2xsZXIsIGFyZ3MpO1xuICAgICAgICAgIHJldHVybiBwYi5hcHBseShib3gsIGFyZ3MpO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgZG9tLmFkZENsYXNzKGxpLCAnaGFzLXNsaWRlcicpO1xuICAgICAgY29udHJvbGxlci5kb21FbGVtZW50Lmluc2VydEJlZm9yZShib3guZG9tRWxlbWVudCwgY29udHJvbGxlci5kb21FbGVtZW50LmZpcnN0RWxlbWVudENoaWxkKTtcblxuICAgIH0gZWxzZSBpZiAoY29udHJvbGxlciBpbnN0YW5jZW9mIE51bWJlckNvbnRyb2xsZXJCb3gpIHtcblxuICAgICAgdmFyIHIgPSBmdW5jdGlvbihyZXR1cm5lZCkge1xuXG4gICAgICAgIC8vIEhhdmUgd2UgZGVmaW5lZCBib3RoIGJvdW5kYXJpZXM/XG4gICAgICAgIGlmIChjb21tb24uaXNOdW1iZXIoY29udHJvbGxlci5fX21pbikgJiYgY29tbW9uLmlzTnVtYmVyKGNvbnRyb2xsZXIuX19tYXgpKSB7XG5cbiAgICAgICAgICAvLyBXZWxsLCB0aGVuIGxldHMganVzdCByZXBsYWNlIHRoaXMgd2l0aCBhIHNsaWRlci5cbiAgICAgICAgICBjb250cm9sbGVyLnJlbW92ZSgpO1xuICAgICAgICAgIHJldHVybiBhZGQoXG4gICAgICAgICAgICBndWksXG4gICAgICAgICAgICBjb250cm9sbGVyLm9iamVjdCxcbiAgICAgICAgICAgIGNvbnRyb2xsZXIucHJvcGVydHksIHtcbiAgICAgICAgICAgICAgYmVmb3JlOiBjb250cm9sbGVyLl9fbGkubmV4dEVsZW1lbnRTaWJsaW5nLFxuICAgICAgICAgICAgICBmYWN0b3J5QXJnczogW2NvbnRyb2xsZXIuX19taW4sIGNvbnRyb2xsZXIuX19tYXgsIGNvbnRyb2xsZXIuX19zdGVwXVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXR1cm5lZDtcblxuICAgICAgfTtcblxuICAgICAgY29udHJvbGxlci5taW4gPSBjb21tb24uY29tcG9zZShyLCBjb250cm9sbGVyLm1pbik7XG4gICAgICBjb250cm9sbGVyLm1heCA9IGNvbW1vbi5jb21wb3NlKHIsIGNvbnRyb2xsZXIubWF4KTtcblxuICAgIH0gZWxzZSBpZiAoY29udHJvbGxlciBpbnN0YW5jZW9mIEJvb2xlYW5Db250cm9sbGVyKSB7XG5cbiAgICAgIGRvbS5iaW5kKGxpLCAnY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAgICAgZG9tLmZha2VFdmVudChjb250cm9sbGVyLl9fY2hlY2tib3gsICdjbGljaycpO1xuICAgICAgfSk7XG5cbiAgICAgIGRvbS5iaW5kKGNvbnRyb2xsZXIuX19jaGVja2JveCwgJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpOyAvLyBQcmV2ZW50cyBkb3VibGUtdG9nZ2xlXG4gICAgICB9KVxuXG4gICAgfSBlbHNlIGlmIChjb250cm9sbGVyIGluc3RhbmNlb2YgRnVuY3Rpb25Db250cm9sbGVyKSB7XG5cbiAgICAgIGRvbS5iaW5kKGxpLCAnY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAgICAgZG9tLmZha2VFdmVudChjb250cm9sbGVyLl9fYnV0dG9uLCAnY2xpY2snKTtcbiAgICAgIH0pO1xuXG4gICAgICBkb20uYmluZChsaSwgJ21vdXNlb3ZlcicsIGZ1bmN0aW9uKCkge1xuICAgICAgICBkb20uYWRkQ2xhc3MoY29udHJvbGxlci5fX2J1dHRvbiwgJ2hvdmVyJyk7XG4gICAgICB9KTtcblxuICAgICAgZG9tLmJpbmQobGksICdtb3VzZW91dCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICBkb20ucmVtb3ZlQ2xhc3MoY29udHJvbGxlci5fX2J1dHRvbiwgJ2hvdmVyJyk7XG4gICAgICB9KTtcblxuICAgIH0gZWxzZSBpZiAoY29udHJvbGxlciBpbnN0YW5jZW9mIENvbG9yQ29udHJvbGxlcikge1xuXG4gICAgICBkb20uYWRkQ2xhc3MobGksICdjb2xvcicpO1xuICAgICAgY29udHJvbGxlci51cGRhdGVEaXNwbGF5ID0gY29tbW9uLmNvbXBvc2UoZnVuY3Rpb24ocikge1xuICAgICAgICBsaS5zdHlsZS5ib3JkZXJMZWZ0Q29sb3IgPSBjb250cm9sbGVyLl9fY29sb3IudG9TdHJpbmcoKTtcbiAgICAgICAgcmV0dXJuIHI7XG4gICAgICB9LCBjb250cm9sbGVyLnVwZGF0ZURpc3BsYXkpO1xuXG4gICAgICBjb250cm9sbGVyLnVwZGF0ZURpc3BsYXkoKTtcblxuICAgIH1cblxuICAgIGNvbnRyb2xsZXIuc2V0VmFsdWUgPSBjb21tb24uY29tcG9zZShmdW5jdGlvbihyKSB7XG4gICAgICBpZiAoZ3VpLmdldFJvb3QoKS5fX3ByZXNldF9zZWxlY3QgJiYgY29udHJvbGxlci5pc01vZGlmaWVkKCkpIHtcbiAgICAgICAgbWFya1ByZXNldE1vZGlmaWVkKGd1aS5nZXRSb290KCksIHRydWUpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHI7XG4gICAgfSwgY29udHJvbGxlci5zZXRWYWx1ZSk7XG5cbiAgfVxuXG4gIGZ1bmN0aW9uIHJlY2FsbFNhdmVkVmFsdWUoZ3VpLCBjb250cm9sbGVyKSB7XG5cbiAgICAvLyBGaW5kIHRoZSB0b3Btb3N0IEdVSSwgdGhhdCdzIHdoZXJlIHJlbWVtYmVyZWQgb2JqZWN0cyBsaXZlLlxuICAgIHZhciByb290ID0gZ3VpLmdldFJvb3QoKTtcblxuICAgIC8vIERvZXMgdGhlIG9iamVjdCB3ZSdyZSBjb250cm9sbGluZyBtYXRjaCBhbnl0aGluZyB3ZSd2ZSBiZWVuIHRvbGQgdG9cbiAgICAvLyByZW1lbWJlcj9cbiAgICB2YXIgbWF0Y2hlZF9pbmRleCA9IHJvb3QuX19yZW1lbWJlcmVkT2JqZWN0cy5pbmRleE9mKGNvbnRyb2xsZXIub2JqZWN0KTtcblxuICAgIC8vIFdoeSB5ZXMsIGl0IGRvZXMhXG4gICAgaWYgKG1hdGNoZWRfaW5kZXggIT0gLTEpIHtcblxuICAgICAgLy8gTGV0IG1lIGZldGNoIGEgbWFwIG9mIGNvbnRyb2xsZXJzIGZvciB0aGNvbW1vbi5pc09iamVjdC5cbiAgICAgIHZhciBjb250cm9sbGVyX21hcCA9XG4gICAgICAgIHJvb3QuX19yZW1lbWJlcmVkT2JqZWN0SW5kZWNlc1RvQ29udHJvbGxlcnNbbWF0Y2hlZF9pbmRleF07XG5cbiAgICAgIC8vIE9ocCwgSSBiZWxpZXZlIHRoaXMgaXMgdGhlIGZpcnN0IGNvbnRyb2xsZXIgd2UndmUgY3JlYXRlZCBmb3IgdGhpc1xuICAgICAgLy8gb2JqZWN0LiBMZXRzIG1ha2UgdGhlIG1hcCBmcmVzaC5cbiAgICAgIGlmIChjb250cm9sbGVyX21hcCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGNvbnRyb2xsZXJfbWFwID0ge307XG4gICAgICAgIHJvb3QuX19yZW1lbWJlcmVkT2JqZWN0SW5kZWNlc1RvQ29udHJvbGxlcnNbbWF0Y2hlZF9pbmRleF0gPVxuICAgICAgICAgIGNvbnRyb2xsZXJfbWFwO1xuICAgICAgfVxuXG4gICAgICAvLyBLZWVwIHRyYWNrIG9mIHRoaXMgY29udHJvbGxlclxuICAgICAgY29udHJvbGxlcl9tYXBbY29udHJvbGxlci5wcm9wZXJ0eV0gPSBjb250cm9sbGVyO1xuXG4gICAgICAvLyBPa2F5LCBub3cgaGF2ZSB3ZSBzYXZlZCBhbnkgdmFsdWVzIGZvciB0aGlzIGNvbnRyb2xsZXI/XG4gICAgICBpZiAocm9vdC5sb2FkICYmIHJvb3QubG9hZC5yZW1lbWJlcmVkKSB7XG5cbiAgICAgICAgdmFyIHByZXNldF9tYXAgPSByb290LmxvYWQucmVtZW1iZXJlZDtcblxuICAgICAgICAvLyBXaGljaCBwcmVzZXQgYXJlIHdlIHRyeWluZyB0byBsb2FkP1xuICAgICAgICB2YXIgcHJlc2V0O1xuXG4gICAgICAgIGlmIChwcmVzZXRfbWFwW2d1aS5wcmVzZXRdKSB7XG5cbiAgICAgICAgICBwcmVzZXQgPSBwcmVzZXRfbWFwW2d1aS5wcmVzZXRdO1xuXG4gICAgICAgIH0gZWxzZSBpZiAocHJlc2V0X21hcFtERUZBVUxUX0RFRkFVTFRfUFJFU0VUX05BTUVdKSB7XG5cbiAgICAgICAgICAvLyBVaGgsIHlvdSBjYW4gaGF2ZSB0aGUgZGVmYXVsdCBpbnN0ZWFkP1xuICAgICAgICAgIHByZXNldCA9IHByZXNldF9tYXBbREVGQVVMVF9ERUZBVUxUX1BSRVNFVF9OQU1FXTtcblxuICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgLy8gTmFkYS5cblxuICAgICAgICAgIHJldHVybjtcblxuICAgICAgICB9XG5cblxuICAgICAgICAvLyBEaWQgdGhlIGxvYWRlZCBvYmplY3QgcmVtZW1iZXIgdGhjb21tb24uaXNPYmplY3Q/XG4gICAgICAgIGlmIChwcmVzZXRbbWF0Y2hlZF9pbmRleF0gJiZcblxuICAgICAgICAgIC8vIERpZCB3ZSByZW1lbWJlciB0aGlzIHBhcnRpY3VsYXIgcHJvcGVydHk/XG4gICAgICAgICAgcHJlc2V0W21hdGNoZWRfaW5kZXhdW2NvbnRyb2xsZXIucHJvcGVydHldICE9PSB1bmRlZmluZWQpIHtcblxuICAgICAgICAgIC8vIFdlIGRpZCByZW1lbWJlciBzb21ldGhpbmcgZm9yIHRoaXMgZ3V5IC4uLlxuICAgICAgICAgIHZhciB2YWx1ZSA9IHByZXNldFttYXRjaGVkX2luZGV4XVtjb250cm9sbGVyLnByb3BlcnR5XTtcblxuICAgICAgICAgIC8vIEFuZCB0aGF0J3Mgd2hhdCBpdCBpcy5cbiAgICAgICAgICBjb250cm9sbGVyLmluaXRpYWxWYWx1ZSA9IHZhbHVlO1xuICAgICAgICAgIGNvbnRyb2xsZXIuc2V0VmFsdWUodmFsdWUpO1xuXG4gICAgICAgIH1cblxuICAgICAgfVxuXG4gICAgfVxuXG4gIH1cblxuICBmdW5jdGlvbiBnZXRMb2NhbFN0b3JhZ2VIYXNoKGd1aSwga2V5KSB7XG4gICAgLy8gVE9ETyBob3cgZG9lcyB0aGlzIGRlYWwgd2l0aCBtdWx0aXBsZSBHVUkncz9cbiAgICByZXR1cm4gZG9jdW1lbnQubG9jYXRpb24uaHJlZiArICcuJyArIGtleTtcblxuICB9XG5cbiAgZnVuY3Rpb24gYWRkU2F2ZU1lbnUoZ3VpKSB7XG5cbiAgICB2YXIgZGl2ID0gZ3VpLl9fc2F2ZV9yb3cgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xuXG4gICAgZG9tLmFkZENsYXNzKGd1aS5kb21FbGVtZW50LCAnaGFzLXNhdmUnKTtcblxuICAgIGd1aS5fX3VsLmluc2VydEJlZm9yZShkaXYsIGd1aS5fX3VsLmZpcnN0Q2hpbGQpO1xuXG4gICAgZG9tLmFkZENsYXNzKGRpdiwgJ3NhdmUtcm93Jyk7XG5cbiAgICB2YXIgZ2VhcnMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgZ2VhcnMuaW5uZXJIVE1MID0gJyZuYnNwOyc7XG4gICAgZG9tLmFkZENsYXNzKGdlYXJzLCAnYnV0dG9uIGdlYXJzJyk7XG5cbiAgICAvLyBUT0RPIHJlcGxhY2Ugd2l0aCBGdW5jdGlvbkNvbnRyb2xsZXJcbiAgICB2YXIgYnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgIGJ1dHRvbi5pbm5lckhUTUwgPSAnU2F2ZSc7XG4gICAgZG9tLmFkZENsYXNzKGJ1dHRvbiwgJ2J1dHRvbicpO1xuICAgIGRvbS5hZGRDbGFzcyhidXR0b24sICdzYXZlJyk7XG5cbiAgICB2YXIgYnV0dG9uMiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICBidXR0b24yLmlubmVySFRNTCA9ICdOZXcnO1xuICAgIGRvbS5hZGRDbGFzcyhidXR0b24yLCAnYnV0dG9uJyk7XG4gICAgZG9tLmFkZENsYXNzKGJ1dHRvbjIsICdzYXZlLWFzJyk7XG5cbiAgICB2YXIgYnV0dG9uMyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICBidXR0b24zLmlubmVySFRNTCA9ICdSZXZlcnQnO1xuICAgIGRvbS5hZGRDbGFzcyhidXR0b24zLCAnYnV0dG9uJyk7XG4gICAgZG9tLmFkZENsYXNzKGJ1dHRvbjMsICdyZXZlcnQnKTtcblxuICAgIHZhciBzZWxlY3QgPSBndWkuX19wcmVzZXRfc2VsZWN0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2VsZWN0Jyk7XG5cbiAgICBpZiAoZ3VpLmxvYWQgJiYgZ3VpLmxvYWQucmVtZW1iZXJlZCkge1xuXG4gICAgICBjb21tb24uZWFjaChndWkubG9hZC5yZW1lbWJlcmVkLCBmdW5jdGlvbih2YWx1ZSwga2V5KSB7XG4gICAgICAgIGFkZFByZXNldE9wdGlvbihndWksIGtleSwga2V5ID09IGd1aS5wcmVzZXQpO1xuICAgICAgfSk7XG5cbiAgICB9IGVsc2Uge1xuICAgICAgYWRkUHJlc2V0T3B0aW9uKGd1aSwgREVGQVVMVF9ERUZBVUxUX1BSRVNFVF9OQU1FLCBmYWxzZSk7XG4gICAgfVxuXG4gICAgZG9tLmJpbmQoc2VsZWN0LCAnY2hhbmdlJywgZnVuY3Rpb24oKSB7XG5cblxuICAgICAgZm9yICh2YXIgaW5kZXggPSAwOyBpbmRleCA8IGd1aS5fX3ByZXNldF9zZWxlY3QubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICAgIGd1aS5fX3ByZXNldF9zZWxlY3RbaW5kZXhdLmlubmVySFRNTCA9IGd1aS5fX3ByZXNldF9zZWxlY3RbaW5kZXhdLnZhbHVlO1xuICAgICAgfVxuXG4gICAgICBndWkucHJlc2V0ID0gdGhpcy52YWx1ZTtcblxuICAgIH0pO1xuXG4gICAgZGl2LmFwcGVuZENoaWxkKHNlbGVjdCk7XG4gICAgZGl2LmFwcGVuZENoaWxkKGdlYXJzKTtcbiAgICBkaXYuYXBwZW5kQ2hpbGQoYnV0dG9uKTtcbiAgICBkaXYuYXBwZW5kQ2hpbGQoYnV0dG9uMik7XG4gICAgZGl2LmFwcGVuZENoaWxkKGJ1dHRvbjMpO1xuXG4gICAgaWYgKFNVUFBPUlRTX0xPQ0FMX1NUT1JBR0UpIHtcblxuICAgICAgdmFyIHNhdmVMb2NhbGx5ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2RnLXNhdmUtbG9jYWxseScpO1xuICAgICAgdmFyIGV4cGxhaW4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZGctbG9jYWwtZXhwbGFpbicpO1xuXG4gICAgICBzYXZlTG9jYWxseS5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcblxuICAgICAgdmFyIGxvY2FsU3RvcmFnZUNoZWNrQm94ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2RnLWxvY2FsLXN0b3JhZ2UnKTtcblxuICAgICAgaWYgKGxvY2FsU3RvcmFnZS5nZXRJdGVtKGdldExvY2FsU3RvcmFnZUhhc2goZ3VpLCAnaXNMb2NhbCcpKSA9PT0gJ3RydWUnKSB7XG4gICAgICAgIGxvY2FsU3RvcmFnZUNoZWNrQm94LnNldEF0dHJpYnV0ZSgnY2hlY2tlZCcsICdjaGVja2VkJyk7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIHNob3dIaWRlRXhwbGFpbigpIHtcbiAgICAgICAgZXhwbGFpbi5zdHlsZS5kaXNwbGF5ID0gZ3VpLnVzZUxvY2FsU3RvcmFnZSA/ICdibG9jaycgOiAnbm9uZSc7XG4gICAgICB9XG5cbiAgICAgIHNob3dIaWRlRXhwbGFpbigpO1xuXG4gICAgICAvLyBUT0RPOiBVc2UgYSBib29sZWFuIGNvbnRyb2xsZXIsIGZvb2whXG4gICAgICBkb20uYmluZChsb2NhbFN0b3JhZ2VDaGVja0JveCwgJ2NoYW5nZScsIGZ1bmN0aW9uKCkge1xuICAgICAgICBndWkudXNlTG9jYWxTdG9yYWdlID0gIWd1aS51c2VMb2NhbFN0b3JhZ2U7XG4gICAgICAgIHNob3dIaWRlRXhwbGFpbigpO1xuICAgICAgfSk7XG5cbiAgICB9XG5cbiAgICB2YXIgbmV3Q29uc3RydWN0b3JUZXh0QXJlYSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkZy1uZXctY29uc3RydWN0b3InKTtcblxuICAgIGRvbS5iaW5kKG5ld0NvbnN0cnVjdG9yVGV4dEFyZWEsICdrZXlkb3duJywgZnVuY3Rpb24oZSkge1xuICAgICAgaWYgKGUubWV0YUtleSAmJiAoZS53aGljaCA9PT0gNjcgfHwgZS5rZXlDb2RlID09IDY3KSkge1xuICAgICAgICBTQVZFX0RJQUxPR1VFLmhpZGUoKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGRvbS5iaW5kKGdlYXJzLCAnY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAgIG5ld0NvbnN0cnVjdG9yVGV4dEFyZWEuaW5uZXJIVE1MID0gSlNPTi5zdHJpbmdpZnkoZ3VpLmdldFNhdmVPYmplY3QoKSwgdW5kZWZpbmVkLCAyKTtcbiAgICAgIFNBVkVfRElBTE9HVUUuc2hvdygpO1xuICAgICAgbmV3Q29uc3RydWN0b3JUZXh0QXJlYS5mb2N1cygpO1xuICAgICAgbmV3Q29uc3RydWN0b3JUZXh0QXJlYS5zZWxlY3QoKTtcbiAgICB9KTtcblxuICAgIGRvbS5iaW5kKGJ1dHRvbiwgJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICBndWkuc2F2ZSgpO1xuICAgIH0pO1xuXG4gICAgZG9tLmJpbmQoYnV0dG9uMiwgJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgcHJlc2V0TmFtZSA9IHByb21wdCgnRW50ZXIgYSBuZXcgcHJlc2V0IG5hbWUuJyk7XG4gICAgICBpZiAocHJlc2V0TmFtZSkgZ3VpLnNhdmVBcyhwcmVzZXROYW1lKTtcbiAgICB9KTtcblxuICAgIGRvbS5iaW5kKGJ1dHRvbjMsICdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgICAgZ3VpLnJldmVydCgpO1xuICAgIH0pO1xuXG4gICAgLy8gICAgZGl2LmFwcGVuZENoaWxkKGJ1dHRvbjIpO1xuXG4gIH1cblxuICBmdW5jdGlvbiBhZGRSZXNpemVIYW5kbGUoZ3VpKSB7XG5cbiAgICBndWkuX19yZXNpemVfaGFuZGxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cbiAgICBjb21tb24uZXh0ZW5kKGd1aS5fX3Jlc2l6ZV9oYW5kbGUuc3R5bGUsIHtcblxuICAgICAgd2lkdGg6ICc2cHgnLFxuICAgICAgbWFyZ2luTGVmdDogJy0zcHgnLFxuICAgICAgaGVpZ2h0OiAnMjAwcHgnLFxuICAgICAgY3Vyc29yOiAnZXctcmVzaXplJyxcbiAgICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnXG4gICAgICAgIC8vICAgICAgYm9yZGVyOiAnMXB4IHNvbGlkIGJsdWUnXG5cbiAgICB9KTtcblxuICAgIHZhciBwbW91c2VYO1xuXG4gICAgZG9tLmJpbmQoZ3VpLl9fcmVzaXplX2hhbmRsZSwgJ21vdXNlZG93bicsIGRyYWdTdGFydCk7XG4gICAgZG9tLmJpbmQoZ3VpLl9fY2xvc2VCdXR0b24sICdtb3VzZWRvd24nLCBkcmFnU3RhcnQpO1xuXG4gICAgZ3VpLmRvbUVsZW1lbnQuaW5zZXJ0QmVmb3JlKGd1aS5fX3Jlc2l6ZV9oYW5kbGUsIGd1aS5kb21FbGVtZW50LmZpcnN0RWxlbWVudENoaWxkKTtcblxuICAgIGZ1bmN0aW9uIGRyYWdTdGFydChlKSB7XG5cbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgcG1vdXNlWCA9IGUuY2xpZW50WDtcblxuICAgICAgZG9tLmFkZENsYXNzKGd1aS5fX2Nsb3NlQnV0dG9uLCBHVUkuQ0xBU1NfRFJBRyk7XG4gICAgICBkb20uYmluZCh3aW5kb3csICdtb3VzZW1vdmUnLCBkcmFnKTtcbiAgICAgIGRvbS5iaW5kKHdpbmRvdywgJ21vdXNldXAnLCBkcmFnU3RvcCk7XG5cbiAgICAgIHJldHVybiBmYWxzZTtcblxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRyYWcoZSkge1xuXG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgIGd1aS53aWR0aCArPSBwbW91c2VYIC0gZS5jbGllbnRYO1xuICAgICAgZ3VpLm9uUmVzaXplKCk7XG4gICAgICBwbW91c2VYID0gZS5jbGllbnRYO1xuXG4gICAgICByZXR1cm4gZmFsc2U7XG5cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkcmFnU3RvcCgpIHtcblxuICAgICAgZG9tLnJlbW92ZUNsYXNzKGd1aS5fX2Nsb3NlQnV0dG9uLCBHVUkuQ0xBU1NfRFJBRyk7XG4gICAgICBkb20udW5iaW5kKHdpbmRvdywgJ21vdXNlbW92ZScsIGRyYWcpO1xuICAgICAgZG9tLnVuYmluZCh3aW5kb3csICdtb3VzZXVwJywgZHJhZ1N0b3ApO1xuXG4gICAgfVxuXG4gIH1cblxuICBmdW5jdGlvbiBzZXRXaWR0aChndWksIHcpIHtcbiAgICBndWkuZG9tRWxlbWVudC5zdHlsZS53aWR0aCA9IHcgKyAncHgnO1xuICAgIC8vIEF1dG8gcGxhY2VkIHNhdmUtcm93cyBhcmUgcG9zaXRpb24gZml4ZWQsIHNvIHdlIGhhdmUgdG9cbiAgICAvLyBzZXQgdGhlIHdpZHRoIG1hbnVhbGx5IGlmIHdlIHdhbnQgaXQgdG8gYmxlZWQgdG8gdGhlIGVkZ2VcbiAgICBpZiAoZ3VpLl9fc2F2ZV9yb3cgJiYgZ3VpLmF1dG9QbGFjZSkge1xuICAgICAgZ3VpLl9fc2F2ZV9yb3cuc3R5bGUud2lkdGggPSB3ICsgJ3B4JztcbiAgICB9XG4gICAgaWYgKGd1aS5fX2Nsb3NlQnV0dG9uKSB7XG4gICAgICBndWkuX19jbG9zZUJ1dHRvbi5zdHlsZS53aWR0aCA9IHcgKyAncHgnO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGdldEN1cnJlbnRQcmVzZXQoZ3VpLCB1c2VJbml0aWFsVmFsdWVzKSB7XG5cbiAgICB2YXIgdG9SZXR1cm4gPSB7fTtcblxuICAgIC8vIEZvciBlYWNoIG9iamVjdCBJJ20gcmVtZW1iZXJpbmdcbiAgICBjb21tb24uZWFjaChndWkuX19yZW1lbWJlcmVkT2JqZWN0cywgZnVuY3Rpb24odmFsLCBpbmRleCkge1xuXG4gICAgICB2YXIgc2F2ZWRfdmFsdWVzID0ge307XG5cbiAgICAgIC8vIFRoZSBjb250cm9sbGVycyBJJ3ZlIG1hZGUgZm9yIHRoY29tbW9uLmlzT2JqZWN0IGJ5IHByb3BlcnR5XG4gICAgICB2YXIgY29udHJvbGxlcl9tYXAgPVxuICAgICAgICBndWkuX19yZW1lbWJlcmVkT2JqZWN0SW5kZWNlc1RvQ29udHJvbGxlcnNbaW5kZXhdO1xuXG4gICAgICAvLyBSZW1lbWJlciBlYWNoIHZhbHVlIGZvciBlYWNoIHByb3BlcnR5XG4gICAgICBjb21tb24uZWFjaChjb250cm9sbGVyX21hcCwgZnVuY3Rpb24oY29udHJvbGxlciwgcHJvcGVydHkpIHtcbiAgICAgICAgc2F2ZWRfdmFsdWVzW3Byb3BlcnR5XSA9IHVzZUluaXRpYWxWYWx1ZXMgPyBjb250cm9sbGVyLmluaXRpYWxWYWx1ZSA6IGNvbnRyb2xsZXIuZ2V0VmFsdWUoKTtcbiAgICAgIH0pO1xuXG4gICAgICAvLyBTYXZlIHRoZSB2YWx1ZXMgZm9yIHRoY29tbW9uLmlzT2JqZWN0XG4gICAgICB0b1JldHVybltpbmRleF0gPSBzYXZlZF92YWx1ZXM7XG5cbiAgICB9KTtcblxuICAgIHJldHVybiB0b1JldHVybjtcblxuICB9XG5cbiAgZnVuY3Rpb24gYWRkUHJlc2V0T3B0aW9uKGd1aSwgbmFtZSwgc2V0U2VsZWN0ZWQpIHtcbiAgICB2YXIgb3B0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnb3B0aW9uJyk7XG4gICAgb3B0LmlubmVySFRNTCA9IG5hbWU7XG4gICAgb3B0LnZhbHVlID0gbmFtZTtcbiAgICBndWkuX19wcmVzZXRfc2VsZWN0LmFwcGVuZENoaWxkKG9wdCk7XG4gICAgaWYgKHNldFNlbGVjdGVkKSB7XG4gICAgICBndWkuX19wcmVzZXRfc2VsZWN0LnNlbGVjdGVkSW5kZXggPSBndWkuX19wcmVzZXRfc2VsZWN0Lmxlbmd0aCAtIDE7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gc2V0UHJlc2V0U2VsZWN0SW5kZXgoZ3VpKSB7XG4gICAgZm9yICh2YXIgaW5kZXggPSAwOyBpbmRleCA8IGd1aS5fX3ByZXNldF9zZWxlY3QubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICBpZiAoZ3VpLl9fcHJlc2V0X3NlbGVjdFtpbmRleF0udmFsdWUgPT0gZ3VpLnByZXNldCkge1xuICAgICAgICBndWkuX19wcmVzZXRfc2VsZWN0LnNlbGVjdGVkSW5kZXggPSBpbmRleDtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBtYXJrUHJlc2V0TW9kaWZpZWQoZ3VpLCBtb2RpZmllZCkge1xuICAgIHZhciBvcHQgPSBndWkuX19wcmVzZXRfc2VsZWN0W2d1aS5fX3ByZXNldF9zZWxlY3Quc2VsZWN0ZWRJbmRleF07XG4gICAgLy8gICAgY29uc29sZS5sb2coJ21hcmsnLCBtb2RpZmllZCwgb3B0KTtcbiAgICBpZiAobW9kaWZpZWQpIHtcbiAgICAgIG9wdC5pbm5lckhUTUwgPSBvcHQudmFsdWUgKyBcIipcIjtcbiAgICB9IGVsc2Uge1xuICAgICAgb3B0LmlubmVySFRNTCA9IG9wdC52YWx1ZTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiB1cGRhdGVEaXNwbGF5cyhjb250cm9sbGVyQXJyYXkpIHtcblxuXG4gICAgaWYgKGNvbnRyb2xsZXJBcnJheS5sZW5ndGggIT0gMCkge1xuXG4gICAgICByYWYoZnVuY3Rpb24oKSB7XG4gICAgICAgIHVwZGF0ZURpc3BsYXlzKGNvbnRyb2xsZXJBcnJheSk7XG4gICAgICB9KTtcblxuICAgIH1cblxuICAgIGNvbW1vbi5lYWNoKGNvbnRyb2xsZXJBcnJheSwgZnVuY3Rpb24oYykge1xuICAgICAgYy51cGRhdGVEaXNwbGF5KCk7XG4gICAgfSk7XG5cbiAgfVxuXG4gIGZ1bmN0aW9uIHVwZGF0ZUFsbChyb290KSB7XG4gICAgLy8gSXRlcmF0ZSBvdmVyIGFsbCBjb250cm9sbGVyc1xuICAgIHVwZGF0ZUNvbnRyb2xsZXJzKHJvb3QuX19jb250cm9sbGVycyk7XG4gICAgT2JqZWN0LmtleXMocm9vdC5fX2ZvbGRlcnMpLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XG4gICAgICB1cGRhdGVBbGwocm9vdC5fX2ZvbGRlcnNba2V5XSk7XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiB1cGRhdGVDb250cm9sbGVycyhjb250cm9sbGVycykge1xuICAgIGZvciAodmFyIGkgaW4gY29udHJvbGxlcnMpIHtcbiAgICAgIGNvbnRyb2xsZXJzW2ldLnVwZGF0ZURpc3BsYXkoKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gR1VJO1xufVxuIiwiLyoqXG4gKiBkYXQtZ3VpIEphdmFTY3JpcHQgQ29udHJvbGxlciBMaWJyYXJ5XG4gKiBodHRwOi8vY29kZS5nb29nbGUuY29tL3AvZGF0LWd1aVxuICpcbiAqIENvcHlyaWdodCAyMDExIERhdGEgQXJ0cyBUZWFtLCBHb29nbGUgQ3JlYXRpdmUgTGFiXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gY29tbW9uKCk7XG5cbmZ1bmN0aW9uIGNvbW1vbigpIHtcblxuICB2YXIgQVJSX0VBQ0ggPSBBcnJheS5wcm90b3R5cGUuZm9yRWFjaDtcbiAgdmFyIEFSUl9TTElDRSA9IEFycmF5LnByb3RvdHlwZS5zbGljZTtcblxuICAvKipcbiAgICogQmFuZC1haWQgbWV0aG9kcyBmb3IgdGhpbmdzIHRoYXQgc2hvdWxkIGJlIGEgbG90IGVhc2llciBpbiBKYXZhU2NyaXB0LlxuICAgKiBJbXBsZW1lbnRhdGlvbiBhbmQgc3RydWN0dXJlIGluc3BpcmVkIGJ5IHVuZGVyc2NvcmUuanNcbiAgICogaHR0cDovL2RvY3VtZW50Y2xvdWQuZ2l0aHViLmNvbS91bmRlcnNjb3JlL1xuICAgKi9cblxuICByZXR1cm4ge1xuXG4gICAgQlJFQUs6IHt9LFxuXG4gICAgZXh0ZW5kOiBmdW5jdGlvbih0YXJnZXQpIHtcblxuICAgICAgdGhpcy5lYWNoKEFSUl9TTElDRS5jYWxsKGFyZ3VtZW50cywgMSksIGZ1bmN0aW9uKG9iaikge1xuXG4gICAgICAgIGZvciAodmFyIGtleSBpbiBvYmopXG4gICAgICAgICAgaWYgKCF0aGlzLmlzVW5kZWZpbmVkKG9ialtrZXldKSlcbiAgICAgICAgICAgIHRhcmdldFtrZXldID0gb2JqW2tleV07XG5cbiAgICAgIH0sIHRoaXMpO1xuXG4gICAgICByZXR1cm4gdGFyZ2V0O1xuXG4gICAgfSxcblxuICAgIGRlZmF1bHRzOiBmdW5jdGlvbih0YXJnZXQpIHtcblxuICAgICAgdGhpcy5lYWNoKEFSUl9TTElDRS5jYWxsKGFyZ3VtZW50cywgMSksIGZ1bmN0aW9uKG9iaikge1xuXG4gICAgICAgIGZvciAodmFyIGtleSBpbiBvYmopXG4gICAgICAgICAgaWYgKHRoaXMuaXNVbmRlZmluZWQodGFyZ2V0W2tleV0pKVxuICAgICAgICAgICAgdGFyZ2V0W2tleV0gPSBvYmpba2V5XTtcblxuICAgICAgfSwgdGhpcyk7XG5cbiAgICAgIHJldHVybiB0YXJnZXQ7XG5cbiAgICB9LFxuXG4gICAgY29tcG9zZTogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgdG9DYWxsID0gQVJSX1NMSUNFLmNhbGwoYXJndW1lbnRzKTtcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgdmFyIGFyZ3MgPSBBUlJfU0xJQ0UuY2FsbChhcmd1bWVudHMpO1xuICAgICAgICAgICAgICBmb3IgKHZhciBpID0gdG9DYWxsLmxlbmd0aCAtMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgICAgICBhcmdzID0gW3RvQ2FsbFtpXS5hcHBseSh0aGlzLCBhcmdzKV07XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmV0dXJuIGFyZ3NbMF07XG4gICAgICAgICAgICB9O1xuICAgIH0sXG5cbiAgICBlYWNoOiBmdW5jdGlvbihvYmosIGl0ciwgc2NvcGUpIHtcblxuICAgICAgaWYgKCFvYmopIHJldHVybjtcblxuICAgICAgaWYgKEFSUl9FQUNIICYmIG9iai5mb3JFYWNoICYmIG9iai5mb3JFYWNoID09PSBBUlJfRUFDSCkge1xuXG4gICAgICAgIG9iai5mb3JFYWNoKGl0ciwgc2NvcGUpO1xuXG4gICAgICB9IGVsc2UgaWYgKG9iai5sZW5ndGggPT09IG9iai5sZW5ndGggKyAwKSB7IC8vIElzIG51bWJlciBidXQgbm90IE5hTlxuXG4gICAgICAgIGZvciAodmFyIGtleSA9IDAsIGwgPSBvYmoubGVuZ3RoOyBrZXkgPCBsOyBrZXkrKylcbiAgICAgICAgICBpZiAoa2V5IGluIG9iaiAmJiBpdHIuY2FsbChzY29wZSwgb2JqW2tleV0sIGtleSkgPT09IHRoaXMuQlJFQUspXG4gICAgICAgICAgICByZXR1cm47XG5cbiAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgZm9yICh2YXIga2V5IGluIG9iailcbiAgICAgICAgICBpZiAoaXRyLmNhbGwoc2NvcGUsIG9ialtrZXldLCBrZXkpID09PSB0aGlzLkJSRUFLKVxuICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICB9XG5cbiAgICB9LFxuXG4gICAgZGVmZXI6IGZ1bmN0aW9uKGZuYykge1xuICAgICAgc2V0VGltZW91dChmbmMsIDApO1xuICAgIH0sXG5cbiAgICB0b0FycmF5OiBmdW5jdGlvbihvYmopIHtcbiAgICAgIGlmIChvYmoudG9BcnJheSkgcmV0dXJuIG9iai50b0FycmF5KCk7XG4gICAgICByZXR1cm4gQVJSX1NMSUNFLmNhbGwob2JqKTtcbiAgICB9LFxuXG4gICAgaXNVbmRlZmluZWQ6IGZ1bmN0aW9uKG9iaikge1xuICAgICAgcmV0dXJuIG9iaiA9PT0gdW5kZWZpbmVkO1xuICAgIH0sXG5cbiAgICBpc051bGw6IGZ1bmN0aW9uKG9iaikge1xuICAgICAgcmV0dXJuIG9iaiA9PT0gbnVsbDtcbiAgICB9LFxuXG4gICAgaXNOYU46IGZ1bmN0aW9uKG9iaikge1xuICAgICAgcmV0dXJuIG9iaiAhPT0gb2JqO1xuICAgIH0sXG5cbiAgICBpc0FycmF5OiBBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uKG9iaikge1xuICAgICAgcmV0dXJuIG9iai5jb25zdHJ1Y3RvciA9PT0gQXJyYXk7XG4gICAgfSxcblxuICAgIGlzT2JqZWN0OiBmdW5jdGlvbihvYmopIHtcbiAgICAgIHJldHVybiBvYmogPT09IE9iamVjdChvYmopO1xuICAgIH0sXG5cbiAgICBpc051bWJlcjogZnVuY3Rpb24ob2JqKSB7XG4gICAgICByZXR1cm4gb2JqID09PSBvYmorMDtcbiAgICB9LFxuXG4gICAgaXNTdHJpbmc6IGZ1bmN0aW9uKG9iaikge1xuICAgICAgcmV0dXJuIG9iaiA9PT0gb2JqKycnO1xuICAgIH0sXG5cbiAgICBpc0Jvb2xlYW46IGZ1bmN0aW9uKG9iaikge1xuICAgICAgcmV0dXJuIG9iaiA9PT0gZmFsc2UgfHwgb2JqID09PSB0cnVlO1xuICAgIH0sXG5cbiAgICBpc0Z1bmN0aW9uOiBmdW5jdGlvbihvYmopIHtcbiAgICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqKSA9PT0gJ1tvYmplY3QgRnVuY3Rpb25dJztcbiAgICB9XG5cbiAgfTtcbn1cbiIsIi8qKlxuICogZGF0LWd1aSBKYXZhU2NyaXB0IENvbnRyb2xsZXIgTGlicmFyeVxuICogaHR0cDovL2NvZGUuZ29vZ2xlLmNvbS9wL2RhdC1ndWlcbiAqXG4gKiBDb3B5cmlnaHQgMjAxMSBEYXRhIEFydHMgVGVhbSwgR29vZ2xlIENyZWF0aXZlIExhYlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBjc3MoKTtcblxuZnVuY3Rpb24gY3NzKCkge1xuICByZXR1cm4ge1xuICAgIGxvYWQ6IGZ1bmN0aW9uICh1cmwsIGRvYykge1xuICAgICAgZG9jID0gZG9jIHx8IGRvY3VtZW50O1xuICAgICAgdmFyIGxpbmsgPSBkb2MuY3JlYXRlRWxlbWVudCgnbGluaycpO1xuICAgICAgbGluay50eXBlID0gJ3RleHQvY3NzJztcbiAgICAgIGxpbmsucmVsID0gJ3N0eWxlc2hlZXQnO1xuICAgICAgbGluay5ocmVmID0gdXJsO1xuICAgICAgZG9jLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoZWFkJylbMF0uYXBwZW5kQ2hpbGQobGluayk7XG4gICAgfSxcbiAgICBpbmplY3Q6IGZ1bmN0aW9uKGNzcywgZG9jKSB7XG4gICAgICBkb2MgPSBkb2MgfHwgZG9jdW1lbnQ7XG4gICAgICB2YXIgaW5qZWN0ZWQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xuICAgICAgaW5qZWN0ZWQudHlwZSA9ICd0ZXh0L2Nzcyc7XG4gICAgICBpbmplY3RlZC5pbm5lckhUTUwgPSBjc3M7XG4gICAgICBkb2MuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2hlYWQnKVswXS5hcHBlbmRDaGlsZChpbmplY3RlZCk7XG4gICAgfVxuICB9O1xufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBlc2NhcGU7XG5cbnZhciBlbnRpdHlNYXAgPSB7XG4gIFwiJlwiOiBcIiZhbXA7XCIsXG4gIFwiPFwiOiBcIiZsdDtcIixcbiAgXCI+XCI6IFwiJmd0O1wiLFxuICAnXCInOiAnJnF1b3Q7JyxcbiAgXCInXCI6ICcmIzM5OycsXG4gIFwiL1wiOiAnJiN4MkY7J1xufTtcblxuZnVuY3Rpb24gZXNjYXBlKHN0cmluZykge1xuICByZXR1cm4gU3RyaW5nKHN0cmluZykucmVwbGFjZSgvWyY8PlwiJ1xcL10vZywgZnVuY3Rpb24ocykge1xuICAgIHJldHVybiBlbnRpdHlNYXBbc107XG4gIH0pO1xufVxuIiwiLyoqXG4gKiBkYXQtZ3VpIEphdmFTY3JpcHQgQ29udHJvbGxlciBMaWJyYXJ5XG4gKiBodHRwOi8vY29kZS5nb29nbGUuY29tL3AvZGF0LWd1aVxuICpcbiAqIENvcHlyaWdodCAyMDExIERhdGEgQXJ0cyBUZWFtLCBHb29nbGUgQ3JlYXRpdmUgTGFiXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICovXG5tb2R1bGUuZXhwb3J0cyA9IHJhZigpO1xuXG5mdW5jdGlvbiByYWYoKSB7XG5cbiAgLyoqXG4gICAqIHJlcXVpcmVqcyB2ZXJzaW9uIG9mIFBhdWwgSXJpc2gncyBSZXF1ZXN0QW5pbWF0aW9uRnJhbWVcbiAgICogaHR0cDovL3BhdWxpcmlzaC5jb20vMjAxMS9yZXF1ZXN0YW5pbWF0aW9uZnJhbWUtZm9yLXNtYXJ0LWFuaW1hdGluZy9cbiAgICovXG5cbiAgcmV0dXJuIHdpbmRvdy53ZWJraXRSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcbiAgICAgIHdpbmRvdy5tb3pSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcbiAgICAgIHdpbmRvdy5vUmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XG4gICAgICB3aW5kb3cubXNSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcbiAgICAgIGZ1bmN0aW9uKGNhbGxiYWNrLCBlbGVtZW50KSB7XG5cbiAgICAgICAgd2luZG93LnNldFRpbWVvdXQoY2FsbGJhY2ssIDEwMDAgLyA2MCk7XG5cbiAgICAgIH07XG59XG4iLCIvKiogQGxpY2Vuc2VcbiAqIGRhdC1ndWkgSmF2YVNjcmlwdCBDb250cm9sbGVyIExpYnJhcnlcbiAqIGh0dHA6Ly9jb2RlLmdvb2dsZS5jb20vcC9kYXQtZ3VpXG4gKlxuICogQ29weXJpZ2h0IDIwMTEgRGF0YSBBcnRzIFRlYW0sIEdvb2dsZSBDcmVhdGl2ZSBMYWJcbiAqIENvcHlyaWdodCAyMDE1IEFuZHJlaSBLYXNoY2hhXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICovXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgY29sb3I6IHtcbiAgICBtYXRoOiByZXF1aXJlKCcuL2RhdC9jb2xvci9tYXRoLmpzJyksXG4gICAgaW50ZXJwcmV0OiByZXF1aXJlKCcuL2RhdC9jb2xvci9pbnRlcnByZXQuanMnKSxcbiAgICBDb2xvcjogcmVxdWlyZSgnLi9kYXQvY29sb3IvQ29sb3IuanMnKVxuICB9LFxuICBkb206IHtcbiAgICBkb206IHJlcXVpcmUoJy4vZGF0L2RvbS9kb20uanMnKVxuICB9LFxuICBjb250cm9sbGVyczoge1xuICAgIENvbnRyb2xsZXI6IHJlcXVpcmUoJy4vZGF0L2NvbnRyb2xsZXJzL0NvbnRyb2xsZXIuanMnKSxcbiAgICBCb29sZWFuQ29udHJvbGxlcjogcmVxdWlyZSgnLi9kYXQvY29udHJvbGxlcnMvQm9vbGVhbkNvbnRyb2xsZXIuanMnKSxcbiAgICBPcHRpb25Db250cm9sbGVyOiByZXF1aXJlKCcuL2RhdC9jb250cm9sbGVycy9PcHRpb25Db250cm9sbGVyLmpzJyksXG4gICAgU3RyaW5nQ29udHJvbGxlcjogcmVxdWlyZSgnLi9kYXQvY29udHJvbGxlcnMvU3RyaW5nQ29udHJvbGxlci5qcycpLFxuICAgIE51bWJlckNvbnRyb2xsZXI6IHJlcXVpcmUoJy4vZGF0L2NvbnRyb2xsZXJzL051bWJlckNvbnRyb2xsZXIuanMnKSxcbiAgICBOdW1iZXJDb250cm9sbGVyQm94OiByZXF1aXJlKCcuL2RhdC9jb250cm9sbGVycy9OdW1iZXJDb250cm9sbGVyQm94LmpzJyksXG4gICAgTnVtYmVyQ29udHJvbGxlclNsaWRlcjogcmVxdWlyZSgnLi9kYXQvY29udHJvbGxlcnMvTnVtYmVyQ29udHJvbGxlclNsaWRlci5qcycpLFxuICAgIEZ1bmN0aW9uQ29udHJvbGxlcjogcmVxdWlyZSgnLi9kYXQvY29udHJvbGxlcnMvRnVuY3Rpb25Db250cm9sbGVyLmpzJyksXG4gICAgQ29sb3JDb250cm9sbGVyOiByZXF1aXJlKCcuL2RhdC9jb250cm9sbGVycy9Db2xvckNvbnRyb2xsZXIuanMnKSxcbiAgfSxcbiAgZ3VpOiB7XG4gICAgR1VJOiByZXF1aXJlKCcuL2RhdC9ndWkvR1VJLmpzJylcbiAgfSxcbiAgR1VJOiByZXF1aXJlKCcuL2RhdC9ndWkvR1VJLmpzJylcbn07XG4iLCJleHBvcnQgZnVuY3Rpb24gcmVsYXRpdmVTY2FsZWRIZXhQb2ludHMoc2lkZUxlbmd0aCl7XHJcbiAgICBsZXQgY29ybmVyX3ZlcnRpY2FsID0gTWF0aC5zaW4oTWF0aC5QSS8zKSpzaWRlTGVuZ3RoO1xyXG4gICAgbGV0IGNvcm5lcl9ob3Jpem9udGFsID0gTWF0aC5jb3MoTWF0aC5QSS8zKSpzaWRlTGVuZ3RoO1xyXG4gICAgcmV0dXJuIFtcclxuICAgICAgICB7eDogLWNvcm5lcl9ob3Jpem9udGFsLCB5OiAtY29ybmVyX3ZlcnRpY2FsfSxcclxuICAgICAgICB7eDogK2Nvcm5lcl9ob3Jpem9udGFsLCB5OiAtY29ybmVyX3ZlcnRpY2FsfSxcclxuICAgICAgICB7eDogc2lkZUxlbmd0aCwgeTogMH0sXHJcbiAgICAgICAge3g6ICtjb3JuZXJfaG9yaXpvbnRhbCwgeTogK2Nvcm5lcl92ZXJ0aWNhbH0sXHJcbiAgICAgICAge3g6IC1jb3JuZXJfaG9yaXpvbnRhbCwgeTogK2Nvcm5lcl92ZXJ0aWNhbH0sXHJcbiAgICAgICAge3g6IC1zaWRlTGVuZ3RoLCB5OiAwfVxyXG4gICAgXTtcclxufVxyXG4iLCJleHBvcnQgZnVuY3Rpb24gZ2V0QWRqYWNlbnRIZXhhZ29uT2Zmc2V0KGdyaWRYLCBzaWRlKXtcclxuICAgIC8vZXZlbiBjb2x1bW46IG9kZCBjb2x1bW46IChhIG1lYW5zIGFkamFjZW50LCAqIG1lYW5zIG5vdClcclxuICAgIC8vKmEqICAgICAgICAgIGFhYVxyXG4gICAgLy9haGEgICAgICAgICAgYWhhXHJcbiAgICAvL2FhYSAgICAgICAgICAqYSpcclxuICAgIGxldCBkaWFnb25hbFlBYm92ZSA9IDEtZ3JpZFglMjtcclxuICAgIGxldCBkaWFnb25hbFlCZWxvdyA9IC1ncmlkWCUyO1xyXG4gICAgLy9hc3N1bWVzIHNpZGUgMCBpcyB0b3AsIGluY3JlYXNpbmcgY2xvY2t3aXNlXHJcbiAgICBsZXQgYWRqYWNlbnRIZXhPZmZzZXQgPSBbXHJcbiAgICAgICAge3g6IDAsIHk6IC0xfSwge3g6IDEsIHk6IGRpYWdvbmFsWUJlbG93fSwge3g6IDEsIHk6IGRpYWdvbmFsWUFib3ZlfSxcclxuICAgICAgICB7eDogMCwgeTogMX0sIHt4OiAtMSwgeTogZGlhZ29uYWxZQWJvdmV9LCB7eDogLTEsIHk6IGRpYWdvbmFsWUJlbG93fVxyXG4gICAgXTtcclxuICAgIHJldHVybiBhZGphY2VudEhleE9mZnNldFtzaWRlXTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldEFkamFjZW50SGV4YWdvbkNvcmQoY29yZCl7XHJcbiAgICBsZXQgb2Zmc2V0ID0gZ2V0QWRqYWNlbnRIZXhhZ29uT2Zmc2V0KGNvcmQueCwgY29yZC5zaWRlKTtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgeDogY29yZC54ICsgb2Zmc2V0LngsXHJcbiAgICAgICAgeTogY29yZC55ICsgb2Zmc2V0LnksXHJcbiAgICAgICAgc2lkZTogKGNvcmQuc2lkZSArIDMpICUgNlxyXG4gICAgfTtcclxufVxyXG4iLCIvL2lmIHdlIHdhbnQgdG8gcGFjayBwaGFzZXIgaW4gdGhlIGJ1aWxkXHJcbi8vaW1wb3J0IFBoYXNlciBmcm9tIFwiUGhhc2VyXCI7XHJcbi8vaGFjayBjYXVzZSBodHRwczovL2dpdGh1Yi5jb20vcGhvdG9uc3Rvcm0vcGhhc2VyL2lzc3Vlcy8yNDI0XHJcbi8vd2luZG93LlBJWEkgPSByZXF1aXJlKCAncGhhc2VyL2J1aWxkL2N1c3RvbS9waXhpJyApO1xyXG4vL3dpbmRvdy5wMiA9IHJlcXVpcmUoICdwaGFzZXIvYnVpbGQvY3VzdG9tL3AyJyApO1xyXG4vL3dpbmRvdy5QaGFzZXIgPSByZXF1aXJlKCAncGhhc2VyL2J1aWxkL2N1c3RvbS9waGFzZXItc3BsaXQnICk7XHJcblxyXG5pbXBvcnQgKiBhcyBkYXQgZnJvbSBcImV4ZGF0XCI7Ly9icm93c2VyaWZ5IGRvZXNuJ3QgbGlrZSBkYXQuZ3VpLCBwbHVzIEkgZG9uJ3QgdGhpbmsgdGhlIHJlcG9zIGZyb20gdGhlIG1haW50YWluZXIgYW55d2F5XHJcbmltcG9ydCB7aGV4YWdvblNldHRpbmdzR3VpfSBmcm9tIFwiLi92aWV3cy9oZXhhZ29uLmpzXCI7XHJcbmltcG9ydCB7Y29tYmluZWRTaWRlU2V0dGluZ3NHdWl9IGZyb20gXCIuL3ZpZXdzL2NvbWJpbmVkU2lkZS5qc1wiO1xyXG5pbXBvcnQge2JvYXJkU2V0dGluZ3NHdWksIEJvYXJkIGFzIEJvYXJkVmlld30gZnJvbSBcIi4vdmlld3MvYm9hcmQuanNcIjtcclxuaW1wb3J0IHtCb2FyZCBhcyBCb2FyZE1vZGVsLCBib2FyZE1vZGVsU2V0dGluZ3NHdWl9IGZyb20gXCIuL21vZGVscy9ib2FyZC5qc1wiO1xyXG5pbXBvcnQgKiBhcyB0ZWFtSW5mbyBmcm9tIFwiLi90ZWFtSW5mby5qc1wiO1xyXG5pbXBvcnQgKiBhcyBzaWRlR2VuZXJhdGlvbiBmcm9tIFwiLi9zaWRlR2VuZXJhdGlvbi5qc1wiO1xyXG5pbXBvcnQge3NpbmdsZVNpZGVTZXR0aW5nc0d1aX0gZnJvbSBcIi4vdmlld3MvU2luZ2xlU2lkZS5qc1wiO1xyXG5pbXBvcnQge2NvbWJpbmVkU2lkZUdhbWVTZXR0aW5nc0d1aX0gZnJvbSBcIi4vbW9kZWxzL2NvbWJpbmVkU2lkZS5qc1wiO1xyXG5pbXBvcnQge3Njb3JlU2V0dGluZ3NHdWl9IGZyb20gXCIuL3Njb3JlLmpzXCI7XHJcblxyXG5mdW5jdGlvbiBjcmVhdGVCb2FyZChnYW1lLCBkYXRhU3RyaW5nKXtcclxuICAgIGlmKGRhdGFTdHJpbmcgPT09IHVuZGVmaW5lZCl7XHJcbiAgICAgICAgbGV0IGdlbmVyYXRpb25GdW5jdGlvbiA9IHNpZGVHZW5lcmF0aW9uLm1hcHBpbmdGb3JEYXRHdWkuZ2V0KGdsb2JhbFBhcmFtcy5zaWRlR2VuZXJhdGlvbik7XHJcbiAgICAgICAgZGF0YVN0cmluZyA9IGdlbmVyYXRpb25GdW5jdGlvbih0ZWFtSW5mby50ZWFtcywgZ2xvYmFsUGFyYW1zLmdyaWRXaWR0aCwgZ2xvYmFsUGFyYW1zLmdyaWRIZWlnaHQpO1xyXG4gICAgfVxyXG4gICAgbGV0IGJvYXJkTW9kZWwgPSBuZXcgQm9hcmRNb2RlbChkYXRhU3RyaW5nLCBcIm5vcm1hbFwiLCBnYW1lLnNldHRpbmdzR3VpKTtcclxuICAgIGdsb2JhbFBhcmFtcy5kYXRhU3RyaW5nID0gYm9hcmRNb2RlbC5kYXRhU3RyaW5nO1xyXG4gICAgZ2xvYmFsUGFyYW1zLnNpZGVHZW5lcmF0aW9uID0gXCJkYXRhU3RyaW5nXCI7XHJcbiAgICBsZXQgYm9hcmRWaWV3ID0gbmV3IEJvYXJkVmlldyhnYW1lLCAwLCAwLCBib2FyZE1vZGVsLCBnYW1lLnNldHRpbmdzR3VpKTtcclxuICAgIGdhbWUuYWRkLmV4aXN0aW5nKGJvYXJkVmlldyk7XHJcbiAgICBnYW1lLmJvYXJkVmlldyA9IGJvYXJkVmlldztcclxufVxyXG5cclxubGV0IGxldmVscyA9IHtcclxuICAgIDA6IFwiKDAsMCkyOjI6MjowOjI6MnwoMCwxKTI6MjoyOjA6MjoyLTAsMCwzLDA6MCwxLDMsMFwiLFxyXG4gICAgMTogXCIoMCwwKTA6MToyOjI6MjoxfCgwLDEpMToyOjI6MjoxOjAtMCwwLDAsMDowLDAsNSwxOjAsMSw1LDA6MCwxLDQsMVwiLFxyXG4gICAgMjogXCIoMCwwKTI6MjoyOjA6MjoyfCgwLDEpMjowOjI6MjoyOjAtMCwxLDEsMDowLDEsNSwwXCIsXHJcbiAgICAzOiBcIigwLDApMDoxOjI6MjoyOjF8KDAsMSkxOjA6MjoyOjI6MC0wLDAsMSwxOjAsMCw1LDE6MCwxLDEsMDowLDEsNSwwXCIsXHJcbiAgICA0OiBcIigwLDApMjoyOjA6MDowOjJ8KDAsMSkyOjA6MjoyOjI6MC0wLDEsMSwwOjAsMSw1LDBcIixcclxuICAgIDU6IFwiKDAsMCkwOjE6MjowOjI6MXwoMCwxKTE6MDoyOjE6MjowLTAsMCwxLDE6MCwwLDUsMTowLDEsMSwwOjAsMSw1LDBcIixcclxufTtcclxuXHJcbmxldCBnbG9iYWxQYXJhbXMgPSB7XHJcbiAgICB3aWR0aDogd2luZG93LmlubmVyV2lkdGgsXHJcbiAgICBoZWlnaHQ6IHdpbmRvdy5pbm5lckhlaWdodCxcclxuICAgIGdyaWRXaWR0aDogNSxcclxuICAgIGdyaWRIZWlnaHQ6IDQsXHJcbiAgICBzaWRlR2VuZXJhdGlvbjogXCJyYW5kb21cIiwvL2JlIG5pY2UgdG8gc3RvcmUgZnVuY3Rpb24gZGlyZWN0bHkgaGVyZSBidXQgZG9lc24ndCBwbGF5IG5pY2Ugd2l0aCBkYXQtZ3VpLFxyXG4gICAgZGFzaEJvYXJkV2lkdGg6IHdpbmRvdy5pbm5lcldpZHRoLzEwLFxyXG4gICAgcHJlc2V0TGV2ZWxzOiBsZXZlbHNcclxufTtcclxuXHJcbmZ1bmN0aW9uIGdsb2JhbFNldHRpbmdzR3VpKHNldHRpbmdzR3VpLCBnYW1lKXtcclxuICAgIGxldCBncmFwaGljc0ZvbGRlciA9IHNldHRpbmdzR3VpLmFkZEZvbGRlcignbWFpbiBncmFwaGljcycpO1xyXG4gICAgZ3JhcGhpY3NGb2xkZXIuYWRkQ29sb3IoZ2FtZS5zdGFnZSwgJ2JhY2tncm91bmRDb2xvcicpO1xyXG4gICAgZ3JhcGhpY3NGb2xkZXIuYWRkKGdsb2JhbFBhcmFtcywgJ3dpZHRoJywgMCwgd2luZG93LmlubmVyV2lkdGgpLm9uRmluaXNoQ2hhbmdlKGZ1bmN0aW9uKG5ld1dpZHRoKXtcclxuICAgICAgICBnYW1lLnNjYWxlLnNldEdhbWVTaXplKG5ld1dpZHRoLCBnYW1lLmhlaWdodCk7XHJcbiAgICAgICAgZ2FtZS5ib2FyZFZpZXcudXBkYXRlU2lkZUxlbmd0aCgpO1xyXG4gICAgfSk7XHJcbiAgICBncmFwaGljc0ZvbGRlci5hZGQoZ2xvYmFsUGFyYW1zLCAnaGVpZ2h0JywgMCwgd2luZG93LmlubmVySGVpZ2h0KS5vbkZpbmlzaENoYW5nZShmdW5jdGlvbihuZXdIZWlnaHQpe1xyXG4gICAgICAgIGdhbWUuc2NhbGUuc2V0R2FtZVNpemUoZ2FtZS53aWR0aCwgbmV3SGVpZ2h0KTtcclxuICAgICAgICBnYW1lLmJvYXJkVmlldy51cGRhdGVTaWRlTGVuZ3RoKCk7XHJcbiAgICB9KTtcclxuICAgIGxldCBtYXBGb2xkZXIgPSBzZXR0aW5nc0d1aS5hZGRGb2xkZXIoJ21hcCBzZXR1cCcpO1xyXG4gICAgbWFwRm9sZGVyLmFkZChnbG9iYWxQYXJhbXMsICdncmlkV2lkdGgnLCAwKS5zdGVwKDEpO1xyXG4gICAgbWFwRm9sZGVyLmFkZChnbG9iYWxQYXJhbXMsICdncmlkSGVpZ2h0JywgMCkuc3RlcCgxKTtcclxuICAgIG1hcEZvbGRlci5hZGQoZ2xvYmFsUGFyYW1zLCAnc2lkZUdlbmVyYXRpb24nLCBbXCJyYW5kb21cIiwgXCJldmVuXCIsIFwiZXZlblJhbmRvbVwiLCBcImRhdGFTdHJpbmdcIl0pLmxpc3RlbigpLm9uRmluaXNoQ2hhbmdlKGZ1bmN0aW9uKGdlbk1ldGhvZCl7XHJcbiAgICAgICAgZ2FtZS5ib2FyZFZpZXcuZGVzdHJveSgpO1xyXG4gICAgICAgIGNyZWF0ZUJvYXJkKGdhbWUpO1xyXG4gICAgfSk7XHJcbiAgICBtYXBGb2xkZXIuYWRkKGdsb2JhbFBhcmFtcywgJ3ByZXNldExldmVscycsIGxldmVscykubGlzdGVuKCkub25GaW5pc2hDaGFuZ2UoZnVuY3Rpb24obmV3RGF0YVN0cmluZyl7XHJcbiAgICAgICAgZ2FtZS5ib2FyZFZpZXcuZGVzdHJveSgpO1xyXG4gICAgICAgIGNyZWF0ZUJvYXJkKGdhbWUsIG5ld0RhdGFTdHJpbmcpO1xyXG4gICAgfSk7XHJcbiAgICAvL3RoaXMgY2FudCBwb2ludCB0byBib2FyZC5kYXRhU3RyaW5nIGJlY2F1c2UgZGF0LWd1aSBkb2Vzbid0IHdvcmsgd2l0aCBnZXR0ZXJzL3NldHRlcnNcclxuICAgIG1hcEZvbGRlci5hZGQoZ2xvYmFsUGFyYW1zLCAnZGF0YVN0cmluZycpLmxpc3RlbigpLm9uRmluaXNoQ2hhbmdlKGZ1bmN0aW9uKG5ld0RhdGFTdHJpbmcpe1xyXG4gICAgICAgIGdhbWUuYm9hcmRWaWV3LmRlc3Ryb3koKTtcclxuICAgICAgICBjcmVhdGVCb2FyZChnYW1lLCBuZXdEYXRhU3RyaW5nKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBvbkNyZWF0ZShnYW1lKSB7XHJcbiAgICBnYW1lLnN0YWdlLmJhY2tncm91bmRDb2xvciA9IFwiIzY2NjY2NlwiOy8vY29uc2lkZXIgZ3JleSBiZWNhdXNlIGxlc3MgY29udHJhc3RcclxuICAgIGxldCBzZXR0aW5nc0d1aSA9IG5ldyBkYXQuR1VJKCk7XHJcbiAgICBnYW1lLnNldHRpbmdzR3VpID0gc2V0dGluZ3NHdWk7XHJcbiAgICBjcmVhdGVCb2FyZChnYW1lLCBsZXZlbHNbMF0pO1xyXG4gICAgY29tYmluZWRTaWRlR2FtZVNldHRpbmdzR3VpKHNldHRpbmdzR3VpKTtcclxuICAgIGdsb2JhbFNldHRpbmdzR3VpKHNldHRpbmdzR3VpLCBnYW1lKTtcclxuICAgIGJvYXJkU2V0dGluZ3NHdWkoc2V0dGluZ3NHdWksIGdhbWUpO1xyXG4gICAgaGV4YWdvblNldHRpbmdzR3VpKHNldHRpbmdzR3VpKTtcclxuICAgIGNvbWJpbmVkU2lkZVNldHRpbmdzR3VpKHNldHRpbmdzR3VpKTtcclxuICAgIHRlYW1JbmZvLnRlYW1JbmZvU2V0dGluZ3NHdWkoc2V0dGluZ3NHdWkpO1xyXG4gICAgc2luZ2xlU2lkZVNldHRpbmdzR3VpKHNldHRpbmdzR3VpKTtcclxuICAgIHNjb3JlU2V0dGluZ3NHdWkoc2V0dGluZ3NHdWkpO1xyXG4gICAgYm9hcmRNb2RlbFNldHRpbmdzR3VpKHNldHRpbmdzR3VpKTtcclxufVxyXG5mdW5jdGlvbiB1cGRhdGUoZ2FtZSl7fVxyXG53aW5kb3cub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcblx0bGV0IGdhbWUgPSBuZXcgUGhhc2VyLkdhbWUoZ2xvYmFsUGFyYW1zLndpZHRoLCBnbG9iYWxQYXJhbXMuaGVpZ2h0LCBQaGFzZXIuQ0FOVkFTLCBcInBoYXNlcl9wYXJlbnRcIiwge2NyZWF0ZTogb25DcmVhdGUsIHVwZGF0ZTogdXBkYXRlfSk7XHJcbn07XHJcbiIsImltcG9ydCAqIGFzIGdyaWROYXZpZ2F0aW9uIGZyb20gXCIuLi9ncmlkTmF2aWdhdGlvbi5qc1wiO1xyXG5cclxuZXhwb3J0IGNsYXNzIENoYXJhY3RlcntcclxuICAgIGNvbnN0cnVjdG9yKGJvYXJkLCBjb3JkcywgdGVhbSl7XHJcbiAgICAgICAgdGhpcy5jb3JkcyA9IGNvcmRzO1xyXG4gICAgICAgIHRoaXMuYm9hcmQgPSBib2FyZDtcclxuICAgICAgICB0aGlzLnRlYW0gPSB0ZWFtO1xyXG4gICAgICAgIGJvYXJkLmdldEhleChjb3Jkcy54LCBjb3Jkcy55KS5hZGRMaXN0ZW5lcih0aGlzKTtcclxuICAgICAgICBsZXQgb3RoZXJIZXggPSBncmlkTmF2aWdhdGlvbi5nZXRBZGphY2VudEhleGFnb25Db3JkKHRoaXMuY29yZHMpO1xyXG4gICAgICAgIGlmKGJvYXJkLmdldEhleChvdGhlckhleC54LCBvdGhlckhleC55KSAhPT0gdW5kZWZpbmVkKXtcclxuICAgICAgICAgICAgYm9hcmQuZ2V0SGV4KG90aGVySGV4LngsIG90aGVySGV4LnkpLmFkZExpc3RlbmVyKHRoaXMpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBnZXQgeCgpe1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNvcmRzLng7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IHkoKXtcclxuICAgICAgICByZXR1cm4gdGhpcy5jb3Jkcy55O1xyXG4gICAgfVxyXG5cclxuICAgIGdldCBzaWRlKCl7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY29yZHMuc2lkZTtcclxuICAgIH1cclxuXHJcbiAgICByb3RhdGUoZ3JpZENvcmRzLCBhbW91bnQpe1xyXG4gICAgICAgIHRoaXMubGFzdFJvdGF0aW9uID0gYW1vdW50Oy8vaGFjayBmb3IgY2hhcmFjdGVyIGFuaW1hdGlvblxyXG4gICAgICAgIGxldCBzaWRlO1xyXG4gICAgICAgIGlmKGdyaWRDb3Jkcy54ICE9IHRoaXMueCB8fCBncmlkQ29yZHMueSAhPSB0aGlzLnkpe1xyXG4gICAgICAgICAgICBzaWRlID0gKHRoaXMuc2lkZSArIDMpJTY7XHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIHNpZGUgPSB0aGlzLnNpZGU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGxldCBzaWRlVGVhbSA9IHRoaXMuYm9hcmQuZ2V0SGV4KGdyaWRDb3Jkcy54LCBncmlkQ29yZHMueSkuc2lkZShzaWRlKS50ZWFtO1xyXG4gICAgICAgIGlmKHNpZGVUZWFtICE9PSB0aGlzLnRlYW0pe1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKGdyaWRDb3Jkcy54ICE9IHRoaXMueCB8fCBncmlkQ29yZHMueSAhPSB0aGlzLnkpe1xyXG4gICAgICAgICAgICB0aGlzLmJvYXJkLmdldEhleCh0aGlzLngsIHRoaXMueSkucmVtb3ZlTGlzdGVuZXIodGhpcyk7XHJcbiAgICAgICAgICAgIHRoaXMuY29yZHMgPSB7eDogZ3JpZENvcmRzLngsIHk6IGdyaWRDb3Jkcy55LCBzaWRlOiAodGhpcy5jb3Jkcy5zaWRlICsgMyklNn07XHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIGxldCBvdGhlckhleENvcmQgPSBncmlkTmF2aWdhdGlvbi5nZXRBZGphY2VudEhleGFnb25Db3JkKHRoaXMpO1xyXG4gICAgICAgICAgICBsZXQgb3RoZXJIZXggPSB0aGlzLmJvYXJkLmdldEhleChvdGhlckhleENvcmQueCwgb3RoZXJIZXhDb3JkLnkpO1xyXG4gICAgICAgICAgICBpZihvdGhlckhleCAhPT0gdW5kZWZpbmVkKXtcclxuICAgICAgICAgICAgICAgIG90aGVySGV4LnJlbW92ZUxpc3RlbmVyKHRoaXMpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuY29yZHMuc2lkZSA9ICh0aGlzLmNvcmRzLnNpZGUgKyBhbW91bnQpJTY7XHJcbiAgICAgICAgbGV0IG90aGVySGV4Q29yZCA9IGdyaWROYXZpZ2F0aW9uLmdldEFkamFjZW50SGV4YWdvbkNvcmQodGhpcyk7XHJcbiAgICAgICAgbGV0IG90aGVySGV4ID0gdGhpcy5ib2FyZC5nZXRIZXgob3RoZXJIZXhDb3JkLngsIG90aGVySGV4Q29yZC55KTtcclxuICAgICAgICBpZihvdGhlckhleCAhPT0gdW5kZWZpbmVkKXtcclxuICAgICAgICAgICAgb3RoZXJIZXguYWRkTGlzdGVuZXIodGhpcyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIG9wcG9zaXRlU2lkZU1hdGNoZXMoKXtcclxuICAgICAgICBsZXQgb3RoZXJIZXhDb3JkID0gZ3JpZE5hdmlnYXRpb24uZ2V0QWRqYWNlbnRIZXhhZ29uQ29yZCh0aGlzKTtcclxuICAgICAgICBsZXQgb3RoZXJIZXggPSB0aGlzLmJvYXJkLmdldEhleChvdGhlckhleENvcmQueCwgb3RoZXJIZXhDb3JkLnkpO1xyXG4gICAgICAgIGlmKG90aGVySGV4ICE9PSB1bmRlZmluZWQpe1xyXG4gICAgICAgICAgICBsZXQgc2lkZVRlYW0gPSBvdGhlckhleC5zaWRlKCh0aGlzLnNpZGUgKyAzKSU2KS50ZWFtO1xyXG4gICAgICAgICAgICBpZihzaWRlVGVhbSA9PSB0aGlzLnRlYW0pe1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG59XHJcbiIsImV4cG9ydCBjbGFzcyBTaW5nbGVTaWRle1xyXG4gICAgY29uc3RydWN0b3IodGVhbSwgaGV4LCBib2FyZCl7XHJcbiAgICAgICAgdGhpcy50ZWFtID0gdGVhbTtcclxuICAgICAgICB0aGlzLmhleCA9IGhleDtcclxuICAgICAgICB0aGlzLmJvYXJkID0gYm9hcmQ7XHJcbiAgICB9XHJcblxyXG4gICAgb25JbnB1dE92ZXIoY29tYmluZWRTaWRlVmlldywgcG9pbnRlcil7XHJcbiAgICAgICAgdGhpcy5ib2FyZC5zZWxlY3RTZWN0aW9uKHRoaXMpO1xyXG4gICAgICAgIHRoaXMuc2VsZWN0ZWQgPSB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIG9uSW5wdXRPdXQoY29tYmluZWRTaWRlVmlldywgcG9pbnRlcil7XHJcbiAgICAgICAgdGhpcy5zZWxlY3RlZCA9IGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIGdldCB4KCl7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuaGV4LmdyaWRDb3Jkcy54O1xyXG4gICAgfVxyXG5cclxuICAgIGdldCB5KCl7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuaGV4LmdyaWRDb3Jkcy55O1xyXG4gICAgfVxyXG5cclxuICAgIGdldCBzaWRlKCl7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuaGV4LnNpZGVOdW1iZXIodGhpcyk7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IGNvcmRzKCl7XHJcbiAgICAgICAgcmV0dXJuIHt4OiB0aGlzLngsIHk6IHRoaXMueSwgc2lkZTogdGhpcy5zaWRlfTtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgYXNTdHJpbmcoKXtcclxuICAgICAgICByZXR1cm4gdGhpcy50ZWFtLm51bWJlcjtcclxuICAgIH1cclxufVxyXG4iLCJpbXBvcnQge0hleGFnb259IGZyb20gXCIuL2hleGFnb24uanNcIjtcclxuaW1wb3J0IHtDb21iaW5lZFNpZGV9IGZyb20gXCIuL2NvbWJpbmVkU2lkZS5qc1wiO1xyXG5pbXBvcnQgKiBhcyB0ZWFtSW5mbyBmcm9tIFwiLi4vdGVhbUluZm8uanNcIjtcclxuaW1wb3J0ICogYXMgZ3JpZE5hdmlnYXRpb24gZnJvbSBcIi4uL2dyaWROYXZpZ2F0aW9uLmpzXCI7XHJcbmltcG9ydCAqIGFzIHNjb3JlIGZyb20gJy4uL3Njb3JlLmpzJztcclxuaW1wb3J0IHtDaGFyYWN0ZXJ9IGZyb20gXCIuL0NoYXJhY3Rlci5qc1wiO1xyXG5cclxubGV0IHNldHRpbmdzID0ge1xyXG4gICAgbW9kZTogJ2hvbWUnLFxyXG4gICAgbWFwRWRpdDogZmFsc2VcclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBib2FyZE1vZGVsU2V0dGluZ3NHdWkoZ3VpKXtcclxuICAgIGd1aS5hZGQoc2V0dGluZ3MsICdtb2RlJywgWydob21lJywgJ25vcm1hbCddKTtcclxuICAgIGd1aS5hZGQoc2V0dGluZ3MsICdtYXBFZGl0Jyk7XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBCb2FyZHtcclxuICAgIC8vcGFzc2luZyBpbiB4IGlzIGV2ZW4gbW9yZSByZWFzb24gdG8gbWFrZSB0aGlzIGEgcGhhc2VyIG9iamVjdFxyXG4gICAgY29uc3RydWN0b3IoZGF0YVN0cmluZywgbW9kZSwgZ3VpKXtcclxuICAgICAgICB0aGlzLmhleGFnb25zID0gdGhpcy5wYXJzZURhdGFTdHJpbmcoZGF0YVN0cmluZyk7XHJcbiAgICAgICAgdGhpcy5jcmVhdGVDb21iaW5lZExpbmVzKHRoaXMuaGV4QXJyYXkpO1xyXG4gICAgICAgIC8vc2V0dGluZ3MubW9kZSBpbnN0ZWFkIG9mIHRoaXMubW9kZSBpcyBhIGhvcmlibGUgaGFja1xyXG4gICAgICAgIHNldHRpbmdzLm1vZGUgPSBtb2RlO1xyXG4gICAgfVxyXG5cclxuICAgIGdldEhleCh4LCB5KXtcclxuICAgICAgICBpZih0aGlzLmhleGFnb25zLmdldCh4KSAhPT0gdW5kZWZpbmVkKXtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuaGV4YWdvbnMuZ2V0KHgpLmdldCh5KTtcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IGdyaWRXaWR0aCgpe1xyXG4gICAgICAgIGlmKHRoaXMuaGV4YWdvbnMuc2l6ZSA9PT0gMCl7XHJcbiAgICAgICAgICAgIHJldHVybiAwO1xyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICByZXR1cm4gTWF0aC5tYXgoLi4udGhpcy5oZXhhZ29ucy5rZXlzKCkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBnZXQgZ3JpZEhlaWdodCgpe1xyXG4gICAgICAgIGxldCBjdXJyZW50TWF4ID0gMDtcclxuICAgICAgICBmb3IobGV0IHJvdyBvZiB0aGlzLmhleGFnb25zLnZhbHVlcygpKXtcclxuICAgICAgICAgICAgY3VycmVudE1heCA9IE1hdGgubWF4KGN1cnJlbnRNYXgsIC4uLnJvdy5rZXlzKCkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gY3VycmVudE1heDtcclxuICAgIH1cclxuXHJcbiAgICBkZXN0cm95SGV4KHgsIHkpe1xyXG4gICAgICAgIHRoaXMuaGV4YWdvbnMuZ2V0KHgpLmRlbGV0ZSh5KTtcclxuICAgICAgICBmb3IobGV0IHNpZGU9MDsgc2lkZTw2OyBzaWRlKyspe1xyXG4gICAgICAgICAgICBsZXQgY29tYmluZWRTaWRlID0gdGhpcy5nZXRDb21iaW5lZFNpZGUoe3g6IHgsIHk6IHksIHNpZGU6IHNpZGV9KTtcclxuICAgICAgICAgICAgbGV0IGFsdGVybmF0aXZlQ29yZHMgPSBjb21iaW5lZFNpZGUuYWx0ZXJuYXRpdmVDb3JkcztcclxuICAgICAgICAgICAgaWYoIXRoaXMuaGV4YWdvbkV4aXN0cyh4LCB5KSAmJiAhdGhpcy5oZXhhZ29uRXhpc3RzKGFsdGVybmF0aXZlQ29yZHMueCwgYWx0ZXJuYXRpdmVDb3Jkcy55KSl7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNvbWJpbmVkU2lkZXMuZ2V0KGNvbWJpbmVkU2lkZUNvcmQueCkuZ2V0KGNvbWJpbmVkU2lkZUNvcmQueSkuZGVsZXRlKGNvbWJpbmVkU2lkZUNvcmQuc2lkZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZGVzdHJveUNvbWJpbmVkU2lkZShjb21iaW5lZFNpZGVDb3JkKXtcclxuICAgICAgICB0aGlzLmNvbWJpbmVkU2lkZXMuZ2V0KGNvbWJpbmVkU2lkZUNvcmQueCkuZ2V0KGNvbWJpbmVkU2lkZUNvcmQueSkuZGVsZXRlKGNvbWJpbmVkU2lkZUNvcmQuc2lkZSk7XHJcbiAgICB9XHJcblxyXG4gICAgc2VsZWN0U2VjdGlvbihzaW5nbGVTaWRlKXtcclxuICAgICAgICBsZXQgY29ubmVjdGlvblNldCA9IHNjb3JlLmdldENvbm5lY3Rpb25TZXQoc2luZ2xlU2lkZSwgc2luZ2xlU2lkZS50ZWFtLCB0aGlzKTtcclxuICAgICAgICB0aGlzLnNlbGVjdGVkID0gY29ubmVjdGlvblNldDtcclxuICAgIH1cclxuXHJcbiAgICBjdXJyZW50U3RhdGVTY29yZSh0ZWFtKXtcclxuICAgICAgICBpZihzZXR0aW5ncy5tb2RlID09IFwiaG9tZVwiKXtcclxuICAgICAgICAgICAgcmV0dXJuIHNjb3JlLmFsbFRlYW1Ib21lTW9kZSh0aGlzLCB0ZWFtKS5zY29yZTtcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgcmV0dXJuIHNjb3JlLmFsbFRlYW1TY29yZSh0aGlzLCB0ZWFtKS5zY29yZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgdGVhbUhpZ2hsaWdodCh0ZWFtKXtcclxuICAgICAgICBpZihzZXR0aW5ncy5tb2RlID09IFwiaG9tZVwiKXtcclxuICAgICAgICAgICAgdGhpcy5zZWxlY3RlZCA9IHNjb3JlLmFsbFRlYW1Ib21lTW9kZSh0aGlzLCB0ZWFtKTtcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgdGhpcy5zZWxlY3RlZCA9IHNjb3JlLmFsbFRlYW1TY29yZSh0aGlzLCB0ZWFtKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0Q29tYmluZWRTaWRlKGNvbWJpbmVkU2lkZUNvcmQpe1xyXG4gICAgICAgIC8vYW55IGNvbWJpbmVkU2lkZSBoYXMgMiB2YWxpZCBjb3Jkcywgb25lIGZvciBlYWNoICh4LHksc2lkZSkgdGhhdCBtYWtlIGl0IHVwXHJcbiAgICAgICAgLy9yZWFsbHkgd2Ugd2FudCBhIE1hcCBjbGFzcyB3aXRoIGN1c3RvbSBlcXVhbGl0eSBvcGVyYXRvciBmcm9tIGNvbWJpbmVkU2lkZUNvcmRcclxuICAgICAgICBsZXQgb3RoZXJDb3JkID0gZ3JpZE5hdmlnYXRpb24uZ2V0QWRqYWNlbnRIZXhhZ29uQ29yZChjb21iaW5lZFNpZGVDb3JkKTtcclxuICAgICAgICBmb3IobGV0IHBvdGVudGlhbENvcmQgb2YgW2NvbWJpbmVkU2lkZUNvcmQsIG90aGVyQ29yZF0pe1xyXG4gICAgICAgICAgICBsZXQgcm93ID0gdGhpcy5jb21iaW5lZFNpZGVzLmdldChwb3RlbnRpYWxDb3JkLngpO1xyXG4gICAgICAgICAgICBpZihyb3cgIT09IHVuZGVmaW5lZCl7XHJcbiAgICAgICAgICAgICAgICBsZXQgaGV4ID0gcm93LmdldChwb3RlbnRpYWxDb3JkLnkpO1xyXG4gICAgICAgICAgICAgICAgaWYoaGV4ICE9PSB1bmRlZmluZWQpe1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBjb21iaW5lZFNpZGUgPSBoZXguZ2V0KHBvdGVudGlhbENvcmQuc2lkZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYoY29tYmluZWRTaWRlICE9PSB1bmRlZmluZWQpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY29tYmluZWRTaWRlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgfVxyXG5cclxuICAgIGdldCBoZXhBcnJheSgpe1xyXG4gICAgICAgIGxldCBoZXhBcnJheSA9IFtdO1xyXG4gICAgICAgIGZvcihjb25zdCBoZXhSb3cgb2YgdGhpcy5oZXhhZ29ucy52YWx1ZXMoKSl7XHJcbiAgICAgICAgICAgIGhleEFycmF5ID0gaGV4QXJyYXkuY29uY2F0KEFycmF5LmZyb20oaGV4Um93LnZhbHVlcygpKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBoZXhBcnJheTtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgY2hhcmFjdGVyQXJyYXkoKXtcclxuICAgICAgICBsZXQgY2hhcmFjdGVyQXJyYXkgPSBbXTtcclxuICAgICAgICBmb3IoY29uc3QgY2hhcmFjdGVyUm93IG9mIHRoaXMuY2hhcmFjdGVycy52YWx1ZXMoKSl7XHJcbiAgICAgICAgICAgIGZvcihjb25zdCBjaGFyYWN0ZXJIZXggb2YgY2hhcmFjdGVyUm93LnZhbHVlcygpKXtcclxuICAgICAgICAgICAgICAgIGNoYXJhY3RlckFycmF5ID0gY2hhcmFjdGVyQXJyYXkuY29uY2F0KEFycmF5LmZyb20oY2hhcmFjdGVySGV4LnZhbHVlcygpKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGNoYXJhY3RlckFycmF5O1xyXG4gICAgfVxyXG5cclxuICAgIGdldCBjb21iaW5lZFNpZGVzQXJyYXkoKXtcclxuICAgICAgICBsZXQgYXJyYXkgPSBbXTtcclxuICAgICAgICBmb3IoY29uc3Qgcm93IG9mIHRoaXMuY29tYmluZWRTaWRlcy52YWx1ZXMoKSl7XHJcbiAgICAgICAgICAgIGZvcihjb25zdCB4eSBvZiByb3cudmFsdWVzKCkpe1xyXG4gICAgICAgICAgICAgICAgZm9yKGNvbnN0IGNvbWJpbmVkU2lkZSBvZiB4eS52YWx1ZXMoKSl7XHJcbiAgICAgICAgICAgICAgICAgICAgYXJyYXkucHVzaChjb21iaW5lZFNpZGUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBhcnJheTtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgZGF0YVN0cmluZygpe1xyXG4gICAgICAgIGxldCBoZXhhZ29ucyA9IFtdO1xyXG4gICAgICAgIGZvcihsZXQgeCBvZiBBcnJheS5mcm9tKHRoaXMuaGV4YWdvbnMua2V5cygpKS5zb3J0KCkpe1xyXG4gICAgICAgICAgICBmb3IobGV0IHkgb2YgQXJyYXkuZnJvbSh0aGlzLmhleGFnb25zLmdldCh4KS5rZXlzKCkpLnNvcnQoKSl7XHJcbiAgICAgICAgICAgICAgICBoZXhhZ29ucy5wdXNoKFwiKFwiICsgeCArIFwiLFwiICsgeSArIFwiKVwiICsgdGhpcy5nZXRIZXgoeCx5KS5zaWRlc0FzU3RyaW5nKCkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGxldCBjaGFyYWN0ZXJzID0gW107XHJcbiAgICAgICAgZm9yKGxldCB4IG9mIEFycmF5LmZyb20odGhpcy5jaGFyYWN0ZXJzLmtleXMoKSkuc29ydCgpKXtcclxuICAgICAgICAgICAgZm9yKGxldCB5IG9mIEFycmF5LmZyb20odGhpcy5jaGFyYWN0ZXJzLmdldCh4KS5rZXlzKCkpLnNvcnQoKSl7XHJcbiAgICAgICAgICAgICAgICBmb3IobGV0IHNpZGUgb2YgQXJyYXkuZnJvbSh0aGlzLmNoYXJhY3RlcnMuZ2V0KHgpLmdldCh5KS5rZXlzKCkpLnNvcnQoKSl7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGNoYXJhY3RlciA9IHRoaXMuY2hhcmFjdGVycy5nZXQoeCkuZ2V0KHkpLmdldChzaWRlKTtcclxuICAgICAgICAgICAgICAgICAgICBjaGFyYWN0ZXJzLnB1c2goW2NoYXJhY3Rlci54LCBjaGFyYWN0ZXIueSwgY2hhcmFjdGVyLnNpZGUsIGNoYXJhY3Rlci50ZWFtLm51bWJlcl0uam9pbihcIixcIikpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBoZXhhZ29ucy5qb2luKFwifFwiKSArIFwiLVwiICsgY2hhcmFjdGVycy5qb2luKFwiOlwiKTtcclxuICAgIH1cclxuXHJcbiAgICBoZXhhZ29uRXhpc3RzKHgseSl7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0SGV4KHgsIHkpID09PSB1bmRlZmluZWQ7XHJcbiAgICB9XHJcblxyXG4gICAgbW92ZVRvQWRqYWNlbnRDb21iaW5lZFNpZGUoY29tYmluZWRTaWRlQ29yZCwgZGlyZWN0aW9uKXtcclxuICAgICAgICAvKnJldHVybnMgY28tb3JkaW5hdGVzIG9mIGFuIGFkamFjZW50IGNvbWJpbmVkU2lkZVxyXG4gICAgICAgIHRoaXMgd29ya3MgYnkgbG9va2luZyBhdCBhIGNvbWJpbmVkIHNpZGUgYXMgaGF2aW5nIDQgbmVpZ2hib3VyaW5nIGNvbWJpbmVkU2lkZXNcclxuICAgICAgICB0aGVzZSBsb29rIGxpa2UgYSBib3d0aWU6XHJcbiAgICAgICAgIFxcLTEgICAgICAgICAgICAgKzEgIC9cclxuICAgICAgICAgIFxcICAgICAgICAgICAgICAgICAvXHJcbiAgICAgICAgICAgXFwgICAgICAgICAgICAgICAvXHJcbiAgICAgICAgICAgIC0tLS0tLS0tLS0tLS0tLVxyXG4gICAgICAgICAgIC8gIFtzdXBwbGllZCAgICAgXFxcclxuICAgICAgICAgIC8gICAgaGV4YWdvbiAgICAgICBcXFxyXG4gICAgICAgICAvIC0yICAgc2lkZV0gICAgICArMiBcXFxyXG4gICAgICAgICBUaGlzIGV4YW1wbGUgd291bGQgYmUgaWYgc2lkZT0wIHdhcyBzdXBwbGllZC5cclxuICAgICAgICAgRGlyZWN0aW9uIGRlbm90ZXMgd2hpY2ggc3Bva2UgKC0yLC0xLCsxLCsyKSB5b3UncmUgYXNraW5nIGFib3V0LlxyXG4gICAgICAgICB0aGUgbnVtYmVyaW5nIGlzIHJlbGF0aXZlLCBzbyBzcG9rZXMgLTIgYW5kICsyIGFyZSBhbHdheXMgc2lkZXMgb2YgdGhlIGNlbnRyYWwgaGV4YWdvblxyXG4gICAgICAgICBldmVuIGFzIHNpZGUgbnVtYmVyIGNoYW5nZXMuXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgIGxldCBuZXdDb3JkO1xyXG4gICAgICAgICBpZihkaXJlY3Rpb24gPT09IC0yKXtcclxuICAgICAgICAgICAgbmV3Q29yZCA9IHtcclxuICAgICAgICAgICAgICAgICB4OiBjb21iaW5lZFNpZGVDb3JkLngsXHJcbiAgICAgICAgICAgICAgICAgeTogY29tYmluZWRTaWRlQ29yZC55LFxyXG4gICAgICAgICAgICAgICAgIHNpZGU6IChjb21iaW5lZFNpZGVDb3JkLnNpZGUgLSAxICsgNiklNiAvLys2IHRvIHN0b3AgbmVnYWF0aXZlc1xyXG4gICAgICAgICAgICAgfTtcclxuICAgICAgICAgfWVsc2UgaWYoZGlyZWN0aW9uID09PSArMil7XHJcbiAgICAgICAgICAgICBuZXdDb3JkID0ge1xyXG4gICAgICAgICAgICAgICAgIHg6IGNvbWJpbmVkU2lkZUNvcmQueCxcclxuICAgICAgICAgICAgICAgICB5OiBjb21iaW5lZFNpZGVDb3JkLnksXHJcbiAgICAgICAgICAgICAgICAgc2lkZTogKGNvbWJpbmVkU2lkZUNvcmQuc2lkZSArIDEpJTZcclxuICAgICAgICAgICAgIH07XHJcbiAgICAgICAgIH1lbHNlIGlmKGRpcmVjdGlvbiA9PT0gLTEpe1xyXG4gICAgICAgICAgICAgbmV3Q29yZCA9IGdyaWROYXZpZ2F0aW9uLmdldEFkamFjZW50SGV4YWdvbkNvcmQoY29tYmluZWRTaWRlQ29yZCk7XHJcbiAgICAgICAgICAgICBuZXdDb3JkLnNpZGUgPSAobmV3Q29yZC5zaWRlICsgMSklNjtcclxuICAgICAgICAgfWVsc2UgaWYoZGlyZWN0aW9uID09PSArMSl7XHJcbiAgICAgICAgICAgICAgbmV3Q29yZCA9IGdyaWROYXZpZ2F0aW9uLmdldEFkamFjZW50SGV4YWdvbkNvcmQoY29tYmluZWRTaWRlQ29yZCk7XHJcbiAgICAgICAgICAgICAgbmV3Q29yZC5zaWRlID0gKG5ld0NvcmQuc2lkZSAtIDEgKyA2KSU2OyAvLys2IHRvIHN0b3AgbmVnYWF0aXZlc1xyXG4gICAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiaW52YWxpZCBkaXJlY3Rpb24gc3VwcGxpZWQgXCIgKyBkaXJlY3Rpb24pO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHJldHVybiB0aGlzLmdldENvbWJpbmVkU2lkZShuZXdDb3JkKTtcclxuICAgIH1cclxuXHJcbiAgICAvL2NvdWxkIHRoaXMgYmUgc2ltcGxpZmllZCBpZiB3ZSBzdHVjayBhbiBleHRyYSBib2FyZGVyIG9mIFwibm9uLW1vdmVcIiBoZXhhZ29ucyByb3VuZCB0aGUgZWRnZT9cclxuICAgIC8vdG8gbWFrZSBzaWRlIGNhbGNzIHNpbXBsaWZlclxyXG4gICAgY3JlYXRlQ29tYmluZWRMaW5lcyhoZXhhZ29ucyl7XHJcbiAgICAgICAgdGhpcy5jb21iaW5lZFNpZGVzID0gbmV3IE1hcCgpO1xyXG4gICAgICAgIGZvcihsZXQgY2VudGVySGV4YWdvbiBvZiBoZXhhZ29ucyl7XHJcbiAgICAgICAgICAgIGZvcihsZXQgc2lkZSBvZiBjZW50ZXJIZXhhZ29uLnNpZGVzKXtcclxuICAgICAgICAgICAgICAgIC8vc28gd2UgZG9uJ3QgY3JlYXRlIGV2ZXJ5IGNvbWJpbmUgdHdpY2UpXHJcbiAgICAgICAgICAgICAgICBpZih0aGlzLmdldENvbWJpbmVkU2lkZShzaWRlKSA9PT0gdW5kZWZpbmVkKXtcclxuICAgICAgICAgICAgICAgICAgICBpZih0aGlzLmNvbWJpbmVkU2lkZXMuZ2V0KHNpZGUueCkgPT09IHVuZGVmaW5lZCl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY29tYmluZWRTaWRlcy5zZXQoc2lkZS54LCBuZXcgTWFwKCkpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBsZXQgcm93ID0gdGhpcy5jb21iaW5lZFNpZGVzLmdldChzaWRlLngpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmKHJvdy5nZXQoc2lkZS55KSA9PT0gdW5kZWZpbmVkKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcm93LnNldChzaWRlLnksIG5ldyBNYXAoKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGxldCByb3dDb2x1bW4gPSByb3cuZ2V0KHNpZGUueSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcm93Q29sdW1uLnNldChzaWRlLnNpZGUsIG5ldyBDb21iaW5lZFNpZGUoc2lkZSwgdGhpcykpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vaXMgdGhpcyBiZXR0ZXIgZGVmaW5lZCBhcyBoZXhhZ29uIGNsYXNzIG1ldGhvZD9cclxuICAgIGhleGFnb25JbnB1dChjbGlja2VkSGV4YWdvbiwgcG9pbnRlcil7XHJcbiAgICAgICAgaWYoc2V0dGluZ3MubWFwRWRpdCl7XHJcbiAgICAgICAgICAgIHRoaXMuZGVzdHJveUhleChjbGlja2VkSGV4YWdvbi5kYXRhLm1vZGVsLngsIGNsaWNrZWRIZXhhZ29uLmRhdGEubW9kZWwueSk7XHJcbiAgICAgICAgICAgIC8vY2xpY2tlZEhleGFnb24uZ2FtZS53b3JsZC5yZW1vdmUoY2xpY2tlZEhleGFnb24pO1xyXG4gICAgICAgICAgICBjbGlja2VkSGV4YWdvbi5raWxsKCk7XHJcbiAgICAgICAgICAgIC8vY2xpY2tlZEhleGFnb24uZGVzdHJveSgpO1xyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICB0ZWFtSW5mby5tYWtlTW92ZSgpO1xyXG4gICAgICAgICAgICBsZXQgcm90YXRpb25BbXQgPSAxO1xyXG4gICAgICAgICAgICAvL3VzaW5nIGN0cmxLZXkgaW5zdGVhZCBoYXMgYSBidWcgaW4gcGhhc2VyIDIuNi4yIGh0dHBzOi8vZ2l0aHViLmNvbS9waG90b25zdG9ybS9waGFzZXIvaXNzdWVzLzIxNjdcclxuICAgICAgICAgICAgaWYocG9pbnRlci5sZWZ0QnV0dG9uLmFsdEtleSl7XHJcbiAgICAgICAgICAgICAgICByb3RhdGlvbkFtdCAqPSAtMTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjbGlja2VkSGV4YWdvbi5kYXRhLm1vZGVsLnJvdGF0ZShyb3RhdGlvbkFtdCk7XHJcbiAgICAgICAgICAgIGlmKHRlYW1JbmZvLmVuZE9mUm91bmQoKSl7XHJcbiAgICAgICAgICAgICAgICBmb3IobGV0IHRlYW0gb2YgdGVhbUluZm8udGVhbXMpe1xyXG4gICAgICAgICAgICAgICAgICAgIGlmKHNldHRpbmdzLm1vZGUgPT0gXCJob21lXCIpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZWFtLnNjb3JlICs9IHNjb3JlLmFsbFRlYW1Ib21lTW9kZSh0aGlzLCB0ZWFtKS5zY29yZTtcclxuICAgICAgICAgICAgICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGVhbS5zY29yZSArPSBzY29yZS5hbGxUZWFtU2NvcmUodGhpcywgdGVhbSkuc2NvcmU7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuY2hlY2tXaW5Db25kaXRpb24oKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgY2hlY2tXaW5Db25kaXRpb24oKXtcclxuICAgICAgICBsZXQgdGVhbUNvcmRzID0gbmV3IE1hcCgpO1xyXG4gICAgICAgIGZvcihsZXQgY2hhcmFjdGVyIG9mIHRoaXMuY2hhcmFjdGVyQXJyYXkpe1xyXG4gICAgICAgICAgICBpZighdGVhbUNvcmRzLmhhcyhjaGFyYWN0ZXIudGVhbSkpe1xyXG4gICAgICAgICAgICAgICAgdGVhbUNvcmRzLnNldChjaGFyYWN0ZXIudGVhbSwgY2hhcmFjdGVyLmNvcmRzKTtcclxuICAgICAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgICAgICBsZXQgYWxyZWFkeVNlZW5Db3JkcyA9IHRlYW1Db3Jkcy5nZXQoY2hhcmFjdGVyLnRlYW0pO1xyXG4gICAgICAgICAgICAgICAgaWYoIXRoaXMuZ2V0Q29tYmluZWRTaWRlKGFscmVhZHlTZWVuQ29yZHMpLmVxdWFscyhjaGFyYWN0ZXIuY29yZHMpKXtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgYWxlcnQoXCJ5b3Ugd29uIVwiKTtcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICBjaGFyYWN0ZXJJbnB1dChjbGlja2VkQ2hhcmFjdGVyLCBwb2ludGVyKXtcclxuICAgICAgICBpZihzZXR0aW5ncy5tYXBFZGl0KXtcclxuICAgICAgICAgICAgLy90aGlzLmNoYXJhY3RlcnMuZ2V0KHgpLmRlbGV0ZSh5KTtcclxuICAgICAgICAgICAgLy90aGlzLmRlc3Ryb3lIZXgoY2xpY2tlZEhleGFnb24uZGF0YS5tb2RlbC54LCBjbGlja2VkSGV4YWdvbi5kYXRhLm1vZGVsLnkpO1xyXG4gICAgICAgICAgICBjbGlja2VkQ2hhcmFjdGVyLmtpbGwoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcGFyc2VHcmlkQ29yZHMoY29yZERhdGEpe1xyXG4gICAgICAgIGxldCB3aXRob3V0QnJhY2tldHMgPSBjb3JkRGF0YS5zdWJzdHJpbmcoMSxjb3JkRGF0YS5sZW5ndGgtMSk7XHJcbiAgICAgICAgbGV0IFt4LHldID0gd2l0aG91dEJyYWNrZXRzLnNwbGl0KFwiLFwiKTtcclxuICAgICAgICByZXR1cm4ge3g6IHBhcnNlSW50KHgpLCB5OiBwYXJzZUludCh5KX07XHJcbiAgICB9XHJcblxyXG4gICAgcGFyc2VEYXRhU3RyaW5nKGRhdGFTdHJpbmcpe1xyXG4gICAgICAgIGxldCBbaGV4YWdvbnNEYXRhLCBjaGFyYWN0ZXJEYXRhXSA9IGRhdGFTdHJpbmcuc3BsaXQoXCItXCIpO1xyXG4gICAgICAgIGxldCBoZXhhZ29ucyA9IG5ldyBNYXAoKTtcclxuICAgICAgICBmb3IobGV0IGhleGFnb25EYXRhIG9mIGhleGFnb25zRGF0YS5zcGxpdChcInxcIikpe1xyXG4gICAgICAgICAgICBpZihoZXhhZ29uRGF0YSA9PSBcIkVcIil7XHJcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBsZXQgW2NvcmREYXRhLCBzaWRlRGF0YSwgLi4ucmVzdF0gPSBoZXhhZ29uRGF0YS5zcGxpdChcIilcIik7XHJcbiAgICAgICAgICAgIGxldCBjb3JkcyA9IHRoaXMucGFyc2VHcmlkQ29yZHMoY29yZERhdGEgKyBcIilcIik7XHJcbiAgICAgICAgICAgIGlmKGhleGFnb25zLmdldChjb3Jkcy54KSA9PT0gdW5kZWZpbmVkKXtcclxuICAgICAgICAgICAgICAgIGhleGFnb25zLnNldChjb3Jkcy54LCBuZXcgTWFwKCkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGhleGFnb25zLmdldChjb3Jkcy54KS5zZXQoY29yZHMueSwgbmV3IEhleGFnb24oc2lkZURhdGEsIGNvcmRzLCB0aGlzKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuaGV4YWdvbnMgPSBoZXhhZ29ucztcclxuICAgICAgICB0aGlzLmNoYXJhY3RlcnMgPSB0aGlzLnBhcnNlQ2hhcmFjdGVycyhjaGFyYWN0ZXJEYXRhKTtcclxuICAgICAgICByZXR1cm4gaGV4YWdvbnM7XHJcbiAgICB9XHJcblxyXG4gICAgcGFyc2VDaGFyYWN0ZXJzKGNoYXJhY3RlckRhdGEpe1xyXG4gICAgICAgIGxldCBjaGFyYWN0ZXJzID0gbmV3IE1hcCgpO1xyXG4gICAgICAgIGlmKGNoYXJhY3RlckRhdGEgPT09IFwiXCIpe1xyXG4gICAgICAgICAgICByZXR1cm4gY2hhcmFjdGVycztcclxuICAgICAgICB9XHJcbiAgICAgICAgZm9yKGxldCBjaGFyYWN0ZXJDb3JkIG9mIGNoYXJhY3RlckRhdGEuc3BsaXQoXCI6XCIpKXtcclxuICAgICAgICAgICAgbGV0IFt4LCB5LCBzaWRlLCB0ZWFtXSA9IGNoYXJhY3RlckNvcmQuc3BsaXQoXCIsXCIpLm1hcChOdW1iZXIpO1xyXG4gICAgICAgICAgICBpZihjaGFyYWN0ZXJzLmdldCh4KSA9PT0gdW5kZWZpbmVkKXtcclxuICAgICAgICAgICAgICAgIGNoYXJhY3RlcnMuc2V0KHgsIG5ldyBNYXAoKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgbGV0IGNoYXJhY3RlckNvbHVtbiA9IGNoYXJhY3RlcnMuZ2V0KHgpO1xyXG4gICAgICAgICAgICBpZihjaGFyYWN0ZXJDb2x1bW4uZ2V0KHkpID09PSB1bmRlZmluZWQpe1xyXG4gICAgICAgICAgICAgICAgY2hhcmFjdGVyQ29sdW1uLnNldCh5LCBuZXcgTWFwKCkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGxldCBjaGFyYWN0ZXJIZXggPSBjaGFyYWN0ZXJDb2x1bW4uZ2V0KHkpO1xyXG4gICAgICAgICAgICBsZXQgY2hhcmFjdGVyID0gbmV3IENoYXJhY3Rlcih0aGlzLCB7eDogeCwgeTogeSwgc2lkZTogc2lkZX0sIHRlYW1JbmZvLnRlYW1zW3RlYW1dKTtcclxuICAgICAgICAgICAgY2hhcmFjdGVySGV4LnNldChzaWRlLCBjaGFyYWN0ZXIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gY2hhcmFjdGVycztcclxuICAgIH1cclxuXHJcbn1cclxuIiwiaW1wb3J0ICogYXMgZ3JpZE5hdmlnYXRpb24gZnJvbSAnLi4vZ3JpZE5hdmlnYXRpb24uanMnO1xyXG5cclxubGV0IHNjb3JpbmcgPSB7XHJcbiAgICBzaW5nbGVDb2xvcjogMSxcclxuICAgIGRvdWJsZUNvbG9yOiAyXHJcbn07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY29tYmluZWRTaWRlR2FtZVNldHRpbmdzR3VpKGd1aSl7XHJcbiAgICBsZXQgZm9sZGVyID0gZ3VpLmFkZEZvbGRlcignY29tYmluZWQgc2lkZSBnYW1lIHNldHRpbmdzJyk7XHJcbiAgICBmb2xkZXIuYWRkKHNjb3JpbmcsICdzaW5nbGVDb2xvcicsIDAsNTApLnN0ZXAoMSk7XHJcbiAgICBmb2xkZXIuYWRkKHNjb3JpbmcsICdkb3VibGVDb2xvcicsIDAsIDUwKS5zdGVwKDEpO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgQ29tYmluZWRTaWRle1xyXG4gICAgY29uc3RydWN0b3IoY29yZHMsIGJvYXJkKXtcclxuICAgICAgICBpZihib2FyZC5nZXRIZXgoY29yZHMueCwgY29yZHMueSkgPT09IHVuZGVmaW5lZCl7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcImNvbWJpbmVkIHNpZGUncyBkZWZhdWx0IHgseSBtdXN0IGJlIGEgaGV4IG9uIHRoZSBtYXBcIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMueCA9IGNvcmRzLng7XHJcbiAgICAgICAgdGhpcy55ID0gY29yZHMueTtcclxuICAgICAgICB0aGlzLnNpZGUgPSBjb3Jkcy5zaWRlO1xyXG4gICAgICAgIHRoaXMuYm9hcmQgPSBib2FyZDtcclxuICAgIH1cclxuXHJcbiAgICBvbklucHV0T3Zlcihjb21iaW5lZFNpZGVWaWV3LCBwb2ludGVyKXtcclxuICAgICAgICAvL3RoaXMuYm9hcmQuc2VsZWN0U2VjdGlvbih0aGlzKTtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgc2VsZWN0ZWQoKXtcclxuICAgICAgICBpZih0aGlzLmJvYXJkLnNlbGVjdGVkICE9PSB1bmRlZmluZWQpe1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5ib2FyZC5zZWxlY3RlZC5jb21iaW5lZFNpZGVzU2NvcmVzLmhhcyh0aGlzKTtcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgcmV0dXJuIDA7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGdldCBzY29yZSgpe1xyXG4gICAgICAgIGlmKCF0aGlzLnNlbGVjdGVkKXtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiZG9uJ3QgYXNrIGEgY29tYmluZWQgc2lkZSBmb3IgaXQncyBzY29yZSB3aGVuIG5vdCBoaWdobGlnaHRlZCwgb25seSBmb3IgdXNlIGJ5IHNpZGUgdmlld1wiKTtcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuYm9hcmQuc2VsZWN0ZWQuc2lkZVNjb3JlKHRoaXMpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBlcXVhbHMoY29tYmluZWRTaWRlQ29yZCl7XHJcbiAgICAgICAgIGZ1bmN0aW9uIGNvcmRFcXVhbGl0eShjb3JkMSwgY29yZDIpe1xyXG4gICAgICAgICAgICAgcmV0dXJuIGNvcmQxLnggPT09IGNvcmQyLnggJiYgY29yZDEueSA9PT0gY29yZDIueSAmJiBjb3JkMS5zaWRlID09PSBjb3JkMi5zaWRlO1xyXG4gICAgICAgICB9XHJcbiAgICAgICAgIHJldHVybiBjb3JkRXF1YWxpdHkoY29tYmluZWRTaWRlQ29yZCwgdGhpcy5jb3JkcykgfHwgY29yZEVxdWFsaXR5KGNvbWJpbmVkU2lkZUNvcmQsIHRoaXMuYWx0ZXJuYXRpdmVDb3Jkcyk7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IGFsdGVybmF0aXZlQ29yZHMoKXtcclxuICAgICAgICByZXR1cm4gZ3JpZE5hdmlnYXRpb24uZ2V0QWRqYWNlbnRIZXhhZ29uQ29yZCh0aGlzKTtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgY29yZHMoKXtcclxuICAgICAgICByZXR1cm4ge3g6IHRoaXMueCwgeTogdGhpcy55LCBzaWRlOiB0aGlzLnNpZGV9O1xyXG4gICAgfVxyXG5cclxuICAgIGdldCBoZXhTaWRlVGVhbXMoKXtcclxuICAgICAgICBsZXQgdGVhbUluZm8gPSBbXTtcclxuICAgICAgICBmb3IobGV0IGNvcmRzIG9mIFt0aGlzLmNvcmRzLCB0aGlzLmFsdGVybmF0aXZlQ29yZHNdKXtcclxuICAgICAgICAgICAgbGV0IGhleCA9IHRoaXMuYm9hcmQuZ2V0SGV4KGNvcmRzLngsIGNvcmRzLnkpO1xyXG4gICAgICAgICAgICBpZihoZXggIT09IHVuZGVmaW5lZCl7XHJcbiAgICAgICAgICAgICAgICB0ZWFtSW5mby5wdXNoKGhleC5zaWRlKGNvcmRzLnNpZGUpLnRlYW0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0ZWFtSW5mbztcclxuICAgIH1cclxuXHJcbn1cclxuIiwiaW1wb3J0IHt0ZWFtc30gZnJvbSBcIi4uL3RlYW1JbmZvLmpzXCI7XHJcbmltcG9ydCB7U2luZ2xlU2lkZX0gZnJvbSBcIi4vU2luZ2xlU2lkZS5qc1wiO1xyXG5cclxuZXhwb3J0IGNsYXNzIEhleGFnb257XHJcbiAgICBjb25zdHJ1Y3RvcihzaWRlSW5mbywgZ3JpZENvcmRzLCBib2FyZCl7XHJcbiAgICAgICAgdGhpcy5zaWRlcyA9IFtdO1xyXG4gICAgICAgIHRoaXMuZ3JpZENvcmRzID0gZ3JpZENvcmRzO1xyXG4gICAgICAgIGlmKHNpZGVJbmZvWzBdID09IFwiIVwiKXtcclxuICAgICAgICAgICAgdGhpcy5pc0hvbWUgPSB0cnVlO1xyXG4gICAgICAgICAgICB0aGlzLnRlYW0gPSB0ZWFtc1tzaWRlSW5mb1sxXV07XHJcbiAgICAgICAgICAgIGZvcihsZXQgc2lkZUNvdW50ID0gMDsgc2lkZUNvdW50IDwgNjsgc2lkZUNvdW50Kyspe1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zaWRlcy5wdXNoKG5ldyBTaW5nbGVTaWRlKHRoaXMudGVhbSwgdGhpcywgYm9hcmQpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICBmb3IobGV0IHNpZGUgb2Ygc2lkZUluZm8uc3BsaXQoXCI6XCIpKXtcclxuICAgICAgICAgICAgICAgIGxldCB0ZWFtID0gdGVhbXNbc2lkZV07XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNpZGVzLnB1c2gobmV3IFNpbmdsZVNpZGUodGVhbSwgdGhpcywgYm9hcmQpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZih0aGlzLnNpZGVzLmxlbmd0aCAhPSA2KXtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiaW5jb3JyZWN0IG51bWJlciBvZiBzaWRlczogXCIgKyBzaWRlcy5sZW5ndGgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmNvbWJpbmVkU2lkZXMgPSBuZXcgTWFwKCk7XHJcbiAgICAgICAgdGhpcy5saXN0ZW5lcnMgPSBuZXcgU2V0KCk7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IHgoKXtcclxuICAgICAgICByZXR1cm4gdGhpcy5ncmlkQ29yZHMueDtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgeSgpe1xyXG4gICAgICAgIHJldHVybiB0aGlzLmdyaWRDb3Jkcy55O1xyXG4gICAgfVxyXG5cclxuICAgIHNpZGVOdW1iZXIoc2lkZSl7XHJcbiAgICAgICAgZm9yKGxldCBbc2lkZU51bWJlciwgcG90ZW50aWFsTWF0Y2hdIG9mIHRoaXMuc2lkZXMuZW50cmllcygpKXtcclxuICAgICAgICAgICAgaWYoc2lkZSA9PT0gcG90ZW50aWFsTWF0Y2gpe1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHNpZGVOdW1iZXI7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgIH1cclxuXHJcbiAgICBzaWRlKG51bWJlcil7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc2lkZXNbbnVtYmVyXTtcclxuICAgIH1cclxuXHJcbiAgICBzaWRlc0FzU3RyaW5nKCl7XHJcbiAgICAgICAgaWYodGhpcy5pc0hvbWUpe1xyXG4gICAgICAgICAgICByZXR1cm4gXCIhXCIgKyB0aGlzLnRlYW0ubnVtYmVyO1xyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICBsZXQgc2lkZXMgPSBbXTtcclxuICAgICAgICAgICAgZm9yKGxldCBzaWRlIG9mIHRoaXMuc2lkZXMpe1xyXG4gICAgICAgICAgICAgICAgc2lkZXMucHVzaChzaWRlLmFzU3RyaW5nKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gc2lkZXMuam9pbihcIjpcIik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJvdGF0ZShhbW91bnQpe1xyXG4gICAgICAgIGFtb3VudCA9IGFtb3VudCAlIDY7XHJcbiAgICAgICAgLy9mb3IgYW50aS1jbG9ja3dpc2VcclxuICAgICAgICBpZihhbW91bnQgPCAwKXtcclxuICAgICAgICAgICAgbGV0IGFic29sdXRlQW1vdW50ID0gYW1vdW50Ki0xO1xyXG4gICAgICAgICAgICBhbW91bnQgPSA2LWFic29sdXRlQW1vdW50O1xyXG4gICAgICAgIH1cclxuICAgICAgICBsZXQgcm90YXRpb25BbGxvd2VkID0gZmFsc2U7XHJcbiAgICAgICAgZm9yKGxldCBsaXN0ZW5lciBvZiB0aGlzLmxpc3RlbmVycyl7XHJcbiAgICAgICAgICAgIHJvdGF0aW9uQWxsb3dlZCB8PSBsaXN0ZW5lci5yb3RhdGUodGhpcy5ncmlkQ29yZHMsIGFtb3VudCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKHJvdGF0aW9uQWxsb3dlZCl7XHJcbiAgICAgICAgICAgIGZvcihsZXQgaT0wO2k8YW1vdW50O2krKyl7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNpZGVzLnVuc2hpZnQodGhpcy5zaWRlcy5wb3AoKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgYWRkTGlzdGVuZXIobGlzdGVuZXIpe1xyXG4gICAgICAgIHRoaXMubGlzdGVuZXJzLmFkZChsaXN0ZW5lcik7XHJcbiAgICB9XHJcblxyXG4gICAgcmVtb3ZlTGlzdGVuZXIobGlzdGVuZXIpe1xyXG4gICAgICAgIHRoaXMubGlzdGVuZXJzLmRlbGV0ZShsaXN0ZW5lcik7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IGNhblJvdGF0ZSgpe1xyXG4gICAgICAgIGZvcihsZXQgbGlzdGVuZXIgb2YgdGhpcy5saXN0ZW5lcnMpe1xyXG4gICAgICAgICAgICBpZih0aGlzLnNpZGUobGlzdGVuZXIuc2lkZSkudGVhbSA9PT0gbGlzdGVuZXIudGVhbSAmJiB0aGlzLnggPT0gbGlzdGVuZXIueCAmJiB0aGlzLnkgPT0gbGlzdGVuZXIueSl7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfWVsc2UgaWYodGhpcy5zaWRlKChsaXN0ZW5lci5zaWRlICsgMyklNikudGVhbSA9PT0gbGlzdGVuZXIudGVhbSl7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbn1cclxuIiwiaW1wb3J0ICogYXMgZ3JpZE5hdmlnYXRpb24gZnJvbSBcIi4vZ3JpZE5hdmlnYXRpb24uanNcIjtcclxuaW1wb3J0ICogYXMgdGVhbUluZm8gZnJvbSBcIi4vdGVhbUluZm8uanNcIjtcclxuXHJcbmxldCBzY29yZVNldHRpbmdzID0ge1xyXG4gICAgcGVyU2lkZUluY3JlYXNlOiAxXHJcbn07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc2NvcmVTZXR0aW5nc0d1aShndWkpe1xyXG4gICAgZ3VpLmFkZChzY29yZVNldHRpbmdzLCAncGVyU2lkZUluY3JlYXNlJywgMCwgMjApLnN0ZXAoMSk7XHJcbn1cclxuXHJcbmNsYXNzIENvbm5lY3Rpb25TZXR7XHJcbiAgICBjb25zdHJ1Y3Rvcihjb21iaW5lZFNpZGVzU2NvcmVzKXtcclxuICAgICAgICB0aGlzLmNvbWJpbmVkU2lkZXNTY29yZXMgPSBjb21iaW5lZFNpZGVzU2NvcmVzO1xyXG4gICAgfVxyXG5cclxuICAgIHNpZGVTY29yZShjb21iaW5lZFNpZGUpe1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNvbWJpbmVkU2lkZXNTY29yZXMuZ2V0KGNvbWJpbmVkU2lkZSkgKiBzY29yZVNldHRpbmdzLnBlclNpZGVJbmNyZWFzZTtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgc2NvcmUoKXtcclxuICAgICAgICBsZXQgc2NvcmUgPSAwO1xyXG4gICAgICAgIGZvcihsZXQgc2V0UG9zaXRpb24gb2YgdGhpcy5jb21iaW5lZFNpZGVzU2NvcmVzLnZhbHVlcygpKXtcclxuICAgICAgICAgICAgc2NvcmUgKz0gc2V0UG9zaXRpb24gKiBzY29yZVNldHRpbmdzLnBlclNpZGVJbmNyZWFzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHNjb3JlO1xyXG4gICAgfVxyXG59XHJcblxyXG5jbGFzcyBDb25uZWN0aW9uU2V0R3JvdXB7XHJcbiAgICBjb25zdHJ1Y3Rvcihjb25uZWN0aW9uU2V0cyl7XHJcbiAgICAgICAgdGhpcy5jb25uZWN0aW9uU2V0cyA9IGNvbm5lY3Rpb25TZXRzO1xyXG4gICAgfVxyXG5cclxuICAgIC8vdGhpcyBvbmx5IHdvcmtzIGlmIGFsbCBjb25uZWN0aW9uIHNldHMgYXJlIG11dGFseSBleGNsdXNpdmVcclxuICAgIGdldCBjb21iaW5lZFNpZGVzU2NvcmVzKCl7XHJcbiAgICAgICAgbGV0IGFsbCA9IG5ldyBNYXAoKTtcclxuICAgICAgICBmb3IobGV0IGNvbm5lY3Rpb25TZXQgb2YgdGhpcy5jb25uZWN0aW9uU2V0cyl7XHJcbiAgICAgICAgICAgIGZvcihsZXQgW2NvbWJpbmVkU2lkZSwgc2NvcmVdIG9mIGNvbm5lY3Rpb25TZXQuY29tYmluZWRTaWRlc1Njb3Jlcy5lbnRyaWVzKCkpe1xyXG4gICAgICAgICAgICAgICAgYWxsLnNldChjb21iaW5lZFNpZGUsIHNjb3JlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gYWxsO1xyXG4gICAgfVxyXG5cclxuICAgIHNpZGVTY29yZShjb21iaW5lZFNpZGUpe1xyXG4gICAgICAgIGZvcihsZXQgY29ubmVjdGlvblNldCBvZiB0aGlzLmNvbm5lY3Rpb25TZXRzKXtcclxuICAgICAgICAgICAgaWYoY29ubmVjdGlvblNldC5jb21iaW5lZFNpZGVzU2NvcmVzLmhhcyhjb21iaW5lZFNpZGUpKXtcclxuICAgICAgICAgICAgICAgIHJldHVybiBjb25uZWN0aW9uU2V0LnNpZGVTY29yZShjb21iaW5lZFNpZGUpICogc2NvcmVTZXR0aW5ncy5wZXJTaWRlSW5jcmVhc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IHNjb3JlKCl7XHJcbiAgICAgICAgbGV0IHRvdGFsU2NvcmUgPSAwO1xyXG4gICAgICAgIGZvcihsZXQgY29ubmVjdGlvblNldCBvZiB0aGlzLmNvbm5lY3Rpb25TZXRzKXtcclxuICAgICAgICAgICAgdG90YWxTY29yZSArPSBjb25uZWN0aW9uU2V0LnNjb3JlO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdG90YWxTY29yZTtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGFsbFRlYW1Ib21lTW9kZShib2FyZCwgdGVhbSl7XHJcbiAgICBsZXQgY29ubmVjdGlvblNldHMgPSBbXTtcclxuICAgIGxldCBhbGxTZWFyY2hlZFNpZGVzID0gbmV3IFNldCgpO1xyXG4gICAgZm9yKGxldCBoZXggb2YgYm9hcmQuaGV4QXJyYXkpe1xyXG4gICAgICAgIGlmKGhleC5pc0hvbWUgJiYgaGV4LnRlYW0gPT09IHRlYW0pe1xyXG4gICAgICAgICAgICAvL2FsbCBzaWRlcyBvZiBhIGhvbWUgYmVsb25nIHRvIHRoZSBzYW1lIHRlYW1cclxuICAgICAgICAgICAgbGV0IHN0YXJ0aW5nQ29tYmluZWRTaWRlID0gYm9hcmQuZ2V0Q29tYmluZWRTaWRlKGhleC5zaWRlKDApKTtcclxuICAgICAgICAgICAgaWYoIWFsbFNlYXJjaGVkU2lkZXMuaGFzKHN0YXJ0aW5nQ29tYmluZWRTaWRlKSl7XHJcbiAgICAgICAgICAgICAgICBsZXQgbmV3Q29ubmVjdGlvblNldCA9IGdldENvbm5lY3Rpb25TZXQoc3RhcnRpbmdDb21iaW5lZFNpZGUsIHRlYW0sIGJvYXJkKTtcclxuICAgICAgICAgICAgICAgIGNvbm5lY3Rpb25TZXRzLnB1c2gobmV3Q29ubmVjdGlvblNldCk7XHJcbiAgICAgICAgICAgICAgICBhbGxTZWFyY2hlZFNpZGVzID0gbmV3IFNldChbLi4uYWxsU2VhcmNoZWRTaWRlcywgLi4ubmV3Q29ubmVjdGlvblNldC5jb21iaW5lZFNpZGVzU2NvcmVzLmtleXMoKV0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIG5ldyBDb25uZWN0aW9uU2V0R3JvdXAoY29ubmVjdGlvblNldHMpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gYWxsVGVhbVNjb3JlKGJvYXJkLCB0ZWFtKXtcclxuICAgIGxldCBjb25uZWN0aW9uU2V0cyA9IFtdO1xyXG4gICAgbGV0IGFsbFNlYXJjaGVkU2lkZXMgPSBuZXcgU2V0KCk7XHJcbiAgICBmb3IobGV0IGhleCBvZiBib2FyZC5oZXhBcnJheSl7XHJcbiAgICAgICAgZm9yKGxldCBzaWRlIG9mIGhleC5zaWRlcyl7XHJcbiAgICAgICAgICAgIGxldCBzdGFydGluZ0NvbWJpbmVkU2lkZSA9IGJvYXJkLmdldENvbWJpbmVkU2lkZShzaWRlKTtcclxuICAgICAgICAgICAgaWYoIWFsbFNlYXJjaGVkU2lkZXMuaGFzKHN0YXJ0aW5nQ29tYmluZWRTaWRlKSl7XHJcbiAgICAgICAgICAgICAgICBsZXQgbmV3Q29ubmVjdGlvblNldCA9IGdldENvbm5lY3Rpb25TZXQoc3RhcnRpbmdDb21iaW5lZFNpZGUsIHRlYW0sIGJvYXJkKTtcclxuICAgICAgICAgICAgICAgIGNvbm5lY3Rpb25TZXRzLnB1c2gobmV3Q29ubmVjdGlvblNldCk7XHJcbiAgICAgICAgICAgICAgICBhbGxTZWFyY2hlZFNpZGVzID0gbmV3IFNldChbLi4uYWxsU2VhcmNoZWRTaWRlcywgLi4ubmV3Q29ubmVjdGlvblNldC5jb21iaW5lZFNpZGVzU2NvcmVzLmtleXMoKV0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIG5ldyBDb25uZWN0aW9uU2V0R3JvdXAoY29ubmVjdGlvblNldHMpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBhbHJlYWR5VXNlZChjb25uZWN0cywgY29tYmluZWRTaWRlLCBib2FyZCl7XHJcbiAgICBmb3IobGV0IGNvcmQgb2YgW2NvbWJpbmVkU2lkZSwgYm9hcmQuZ2V0Q29tYmluZWRTaWRlKGNvbWJpbmVkU2lkZS5hbHRlcm5hdGl2ZUNvcmRzKV0pe1xyXG4gICAgICAgIGZvcihsZXQgY29ubmVjdCBvZiBjb25uZWN0cyl7XHJcbiAgICAgICAgICAgIGlmKGNvbm5lY3QuZ2V0KGNvbWJpbmVkU2lkZSkgIT09IHVuZGVmaW5lZCl7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBmYWxzZTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldENvbm5lY3Rpb25TZXQoc3RhcnRDb3JkLCB0ZWFtLCBib2FyZCl7XHJcbiAgICBsZXQgc3RhcnRDb21iaW5lZFNpZGUgPSBib2FyZC5nZXRDb21iaW5lZFNpZGUoc3RhcnRDb3JkKTtcclxuICAgIGxldCBjb25uZWN0aW9uID0gbmV3IE1hcCgpO1xyXG4gICAgZm9yKGxldCBuZXh0VGVhbSBvZiBzdGFydENvbWJpbmVkU2lkZS5oZXhTaWRlVGVhbXMpe1xyXG4gICAgICAgIGlmKHRlYW0gPT09IG5leHRUZWFtKXtcclxuICAgICAgICAgICAgZ3Jvd0Nvbm5lY3QoYm9hcmQsIHN0YXJ0Q29tYmluZWRTaWRlLCBjb25uZWN0aW9uLCBuZXh0VGVhbSk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBuZXcgQ29ubmVjdGlvblNldChjb25uZWN0aW9uKTtcclxufVxyXG5cclxuLy93YXJuaW5nOiBleGlzdGluZyBub2RlcyBpcyBzaGl0dGlseSB1cGRhdGUgaW4gZnVuY3Rpb24sIG5vdCByZXV0cm5lZFxyXG5mdW5jdGlvbiBncm93Q29ubmVjdChib2FyZCwgY3VycmVudENvbWJpbmVkU2lkZSwgZXhpc3RpbmdOb2RlcywgdGVhbSl7XHJcbiAgICBleGlzdGluZ05vZGVzLnNldChjdXJyZW50Q29tYmluZWRTaWRlLCBleGlzdGluZ05vZGVzLnNpemUpO1xyXG4gICAgZm9yKGxldCBkaXJlY3Rpb24gb2YgWy0yLC0xLDEsMl0pe1xyXG4gICAgICAgIGxldCBuZXh0Q29tYmluZWQgPSBib2FyZC5tb3ZlVG9BZGphY2VudENvbWJpbmVkU2lkZShjdXJyZW50Q29tYmluZWRTaWRlLCBkaXJlY3Rpb24pO1xyXG4gICAgICAgIGlmKG5leHRDb21iaW5lZCAhPT0gdW5kZWZpbmVkICYmICFleGlzdGluZ05vZGVzLmhhcyhuZXh0Q29tYmluZWQpKXtcclxuICAgICAgICAgICAgZm9yKGxldCBuZXh0VGVhbSBvZiBuZXh0Q29tYmluZWQuaGV4U2lkZVRlYW1zKXtcclxuICAgICAgICAgICAgICAgIGlmKHRlYW0gPT09IG5leHRUZWFtKXtcclxuICAgICAgICAgICAgICAgICAgICBncm93Q29ubmVjdChib2FyZCwgbmV4dENvbWJpbmVkLCBleGlzdGluZ05vZGVzLCB0ZWFtKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG4iLCJleHBvcnQgbGV0IG1hcHBpbmdGb3JEYXRHdWkgPSBuZXcgTWFwKFtcclxuICAgIFtcInJhbmRvbVwiLCByYW5kb21dLFxyXG4gICAgW1wiZXZlblwiLCBldmVuXSxcclxuICAgIFtcImV2ZW5SYW5kb21cIiwgZXZlblJhbmRvbV1cclxuXSk7XHJcblxyXG5mdW5jdGlvbiBnZW5lcmF0ZUNoYXJhY3RlcnMoZ3JpZFdpZHRoLCBncmlkSGVpZ2h0KXtcclxuICAgIGxldCBjaGFyYWN0ZXJzID0gW107XHJcbiAgICAvL3dlIG5lZWQgYXQgbGVhc3QgMiBmb3IgaXQgdG8gYmUgcGxheWFibGVcclxuICAgIGZvcihsZXQgaT0wOyBpPDI7aSsrKXtcclxuICAgICAgICBsZXQgeCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSpncmlkV2lkdGgpO1xyXG4gICAgICAgIGxldCB5ID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpKmdyaWRIZWlnaHQpO1xyXG4gICAgICAgIGxldCBzaWRlID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpKjYpO1xyXG4gICAgICAgIGNoYXJhY3RlcnMucHVzaChbeCwgeSwgc2lkZSwgMF0uam9pbihcIixcIikpO1xyXG4gICAgfVxyXG4gICAgZm9yKGxldCBjaGFyYWN0ZXJfbnVtYmVyPTA7IGNoYXJhY3Rlcl9udW1iZXIgPCAxNTsgY2hhcmFjdGVyX251bWJlcisrKXtcclxuICAgICAgICBpZihNYXRoLnJhbmRvbSgpID4gMC41KXtcclxuICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGxldCB4ID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpKmdyaWRXaWR0aCk7XHJcbiAgICAgICAgbGV0IHkgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkqZ3JpZEhlaWdodCk7XHJcbiAgICAgICAgbGV0IHNpZGUgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkqNik7XHJcbiAgICAgICAgbGV0IHRlYW0gPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkqMik7XHJcbiAgICAgICAgY2hhcmFjdGVycy5wdXNoKFt4LCB5LCBzaWRlLCB0ZWFtXS5qb2luKFwiLFwiKSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gY2hhcmFjdGVycy5qb2luKFwiOlwiKTtcclxufVxyXG5cclxuZnVuY3Rpb24gYnVpbGRCb2FyZChzaWRlR2VuZXJhdG9yLCBncmlkV2lkdGgsIGdyaWRIZWlnaHQpe1xyXG4gICAgbGV0IGhleGFnb25zID0gW107XHJcbiAgICBmb3IobGV0IHg9MDsgeDxncmlkV2lkdGg7IHgrKyl7XHJcbiAgICAgICAgZm9yKGxldCB5PTA7IHk8Z3JpZEhlaWdodDsgeSsrKXtcclxuICAgICAgICAgICAgbGV0IHNpZGVzID0gW107XHJcbiAgICAgICAgICAgIGZvcihsZXQgc2lkZSBvZiBzaWRlR2VuZXJhdG9yKCkpe1xyXG4gICAgICAgICAgICAgICAgc2lkZXMucHVzaChzaWRlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBoZXhhZ29ucy5wdXNoKFwiKFwiICsgeCArIFwiLFwiICsgeSArIFwiKVwiICsgc2lkZXMuam9pbihcIjpcIikpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBoZXhhZ29ucy5qb2luKFwifFwiKSArIFwiLVwiICsgZ2VuZXJhdGVDaGFyYWN0ZXJzKGdyaWRXaWR0aCwgZ3JpZEhlaWdodCk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBldmVuUmFuZG9tV2l0aEhvbWVzKHRlYW1zLCBncmlkV2lkdGgsIGdyaWRIZWlnaHQpe1xyXG4gICAgZnVuY3Rpb24gc2lkZUdlbmVyYXRvcigpe1xyXG4gICAgICAgIGxldCBzaWRlU2VsZWN0aW9uID0gWzAsMCwxLDEsMiwyXTtcclxuICAgICAgICBsZXQgc2lkZXMgPSBbXTtcclxuICAgICAgICBmb3IobGV0IHNpZGVOdW1iZXIgPSAwOyBzaWRlTnVtYmVyIDwgNjsgc2lkZU51bWJlcisrKXtcclxuICAgICAgICAgICAgc2lkZXMucHVzaChzaWRlU2VsZWN0aW9uW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSklNl0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gc2lkZXM7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gYnVpbGRCb2FyZChzaWRlR2VuZXJhdG9yLCBncmlkV2lkdGgsIGdyaWRIZWlnaHQpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZXZlblJhbmRvbSh0ZWFtcywgZ3JpZFdpZHRoLCBncmlkSGVpZ2h0KXtcclxuICAgIGZ1bmN0aW9uIHNpZGVHZW5lcmF0b3IoKXtcclxuICAgICAgICBsZXQgc2lkZVNlbGVjdGlvbiA9IFswLDAsMSwxLDIsMl07XHJcbiAgICAgICAgbGV0IHNpZGVzID0gW107XHJcbiAgICAgICAgZm9yKGxldCBzaWRlTnVtYmVyID0gMDsgc2lkZU51bWJlciA8IDY7IHNpZGVOdW1iZXIrKyl7XHJcbiAgICAgICAgICAgIGxldCBuZXh0U2lkZSA9IHNpZGVTZWxlY3Rpb24uc3BsaWNlKE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSpzaWRlU2VsZWN0aW9uLmxlbmd0aCklc2lkZVNlbGVjdGlvbi5sZW5ndGgsIDEpO1xyXG4gICAgICAgICAgICBzaWRlcy5wdXNoKG5leHRTaWRlWzBdKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHNpZGVzO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGJ1aWxkQm9hcmQoc2lkZUdlbmVyYXRvciwgZ3JpZFdpZHRoLCBncmlkSGVpZ2h0KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHJhbmRvbSh0ZWFtcywgZ3JpZFdpZHRoLCBncmlkSGVpZ2h0KXtcclxuICAgIGZ1bmN0aW9uIHNpZGVHZW5lcmF0b3IoKXtcclxuICAgICAgICBsZXQgc2lkZXMgPSBbMF07XHJcbiAgICAgICAgZm9yKGxldCBzaWRlTnVtYmVyID0gMDsgc2lkZU51bWJlciA8IDU7IHNpZGVOdW1iZXIrKyl7XHJcbiAgICAgICAgICAgIGlmKE1hdGgucmFuZG9tKCkgPiAwLjUpe1xyXG4gICAgICAgICAgICAgICAgc2lkZXMucHVzaChNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkqdGVhbXMubGVuZ3RoKSk7XHJcbiAgICAgICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICAgICAgc2lkZXMudW5zaGlmdChNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkqdGVhbXMubGVuZ3RoKSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBzaWRlcztcclxuICAgIH1cclxuICAgIHJldHVybiBidWlsZEJvYXJkKHNpZGVHZW5lcmF0b3IsIGdyaWRXaWR0aCwgZ3JpZEhlaWdodCk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBldmVuKHRlYW1zLCBncmlkV2lkdGgsIGdyaWRIZWlnaHQpe1xyXG4gICAgZnVuY3Rpb24gc2lkZUdlbmVyYXRvcigpe1xyXG4gICAgICAgIGxldCBzaWRlcyA9IFtdO1xyXG4gICAgICAgIGZvcihsZXQgc2lkZU51bWJlciA9IDA7IHNpZGVOdW1iZXIgPCA2OyBzaWRlTnVtYmVyKyspe1xyXG4gICAgICAgICAgICBzaWRlcy5wdXNoKHNpZGVOdW1iZXIldGVhbXMubGVuZ3RoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHNpZGVzO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGJ1aWxkQm9hcmQoc2lkZUdlbmVyYXRvciwgZ3JpZFdpZHRoLCBncmlkSGVpZ2h0KTtcclxufVxyXG4iLCJleHBvcnQgbGV0IHNldHRpbmdzID0ge1xyXG4gICAgc3RhbmRhcmRNb3ZlTGltaXQ6IDRcclxufTtcclxuXHJcbmV4cG9ydCBsZXQgdGVhbXMgPSBbXHJcbiAgICB7XHJcbiAgICAgICAgbnVtYmVyOiAwLFxyXG4gICAgICAgIGNvbG91cjogMHhmZjAwMDAsXHJcbiAgICAgICAgbW92ZXNMZWZ0OiBzZXR0aW5ncy5zdGFuZGFyZE1vdmVMaW1pdCxcclxuICAgICAgICBzY29yZTogMFxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBudW1iZXI6IDEsXHJcbiAgICAgICAgY29sb3VyOiAweGViZmYwMCxcclxuICAgICAgICBtb3Zlc0xlZnQ6IHNldHRpbmdzLnN0YW5kYXJkTW92ZUxpbWl0LFxyXG4gICAgICAgIHNjb3JlOiAwXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIG51bWJlcjogMixcclxuICAgICAgICBjb2xvdXI6IDB4NjY2NjY2LC8vMHgwMDAwZmYsXHJcbiAgICAgICAgbW92ZXNMZWZ0OiBzZXR0aW5ncy5zdGFuZGFyZE1vdmVMaW1pdCxcclxuICAgICAgICBzY29yZTogMFxyXG4gICAgfVxyXG5dO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHRlYW1JbmZvU2V0dGluZ3NHdWkoZ3VpKXtcclxuICAgIGxldCBmb2xkZXIgPSBndWkuYWRkRm9sZGVyKCd0ZWFtIHNldHRpbnMnKTtcclxuICAgIGZvbGRlci5hZGRDb2xvcih0ZWFtc1swXSwgJ2NvbG91cicpO1xyXG4gICAgZm9sZGVyLmFkZENvbG9yKHRlYW1zWzFdLCAnY29sb3VyJyk7XHJcbiAgICBmb2xkZXIuYWRkQ29sb3IodGVhbXNbMl0sICdjb2xvdXInKTtcclxuICAgIGZvbGRlci5hZGQoc2V0dGluZ3MsICdzdGFuZGFyZE1vdmVMaW1pdCcsIDEsIDEwKS5zdGVwKDEpO1xyXG59XHJcblxyXG5leHBvcnQgbGV0IGN1cnJlbnRUZWFtID0gdGVhbXNbMF07XHJcbmV4cG9ydCBsZXQgY3VycmVudFJvdW5kID0gMDtcclxuZXhwb3J0IGZ1bmN0aW9uIGVuZE9mUm91bmQoKXtcclxuICAgIHJldHVybiBjdXJyZW50VGVhbS5udW1iZXIgPT09IDAgJiYgY3VycmVudFRlYW0ubW92ZXNMZWZ0ID09PSBzZXR0aW5ncy5zdGFuZGFyZE1vdmVMaW1pdDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIG1ha2VNb3ZlKCl7XHJcbiAgICBjdXJyZW50VGVhbS5tb3Zlc0xlZnQgLT0gMTtcclxuICAgIGlmKGN1cnJlbnRUZWFtLm1vdmVzTGVmdCA9PT0gMCl7XHJcbiAgICAgICAgY3VycmVudFRlYW0gPSB0ZWFtc1soY3VycmVudFRlYW0ubnVtYmVyICsgMSkldGVhbXMubGVuZ3RoXTtcclxuICAgICAgICBjdXJyZW50VGVhbS5tb3Zlc0xlZnQgPSBzZXR0aW5ncy5zdGFuZGFyZE1vdmVMaW1pdDtcclxuICAgIH1cclxufVxyXG4iLCJpbXBvcnQgKiBhcyBnZW9tZXRyeSBmcm9tIFwiLi4vZ2VvbWV0cnkuanNcIjtcclxuXHJcbmxldCBsaW5lU3R5bGUgPSB7XHJcbiAgICB0aGlja25lc3M6IDUsXHJcbiAgICBhbHBoYTogMVxyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHNpbmdsZVNpZGVTZXR0aW5nc0d1aShndWkpe1xyXG4gICAgbGV0IGZvbGRlciA9IGd1aS5hZGRGb2xkZXIoJ3NpbmdsZSBzaWRlIGdyYXBoaWNzJyk7XHJcbiAgICBmb2xkZXIuYWRkKGxpbmVTdHlsZSwgJ3RoaWNrbmVzcycsIDAsMjApO1xyXG4gICAgZm9sZGVyLmFkZChsaW5lU3R5bGUsICdhbHBoYScsIDAsIDEpO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgU2luZ2xlU2lkZSBleHRlbmRzIFBoYXNlci5TcHJpdGV7XHJcblxyXG4gICAgY29uc3RydWN0b3IoZ2FtZSwgeCwgeSwgYm9hcmRWaWV3LCBtb2RlbCl7XHJcbiAgICAgICAgc3VwZXIoZ2FtZSwgeCwgeSk7XHJcbiAgICAgICAgdGhpcy5kYXRhLmJvYXJkVmlldyA9IGJvYXJkVmlldztcclxuICAgICAgICB0aGlzLmRhdGEubW9kZWwgPSBtb2RlbDtcclxuICAgICAgICBsZXQgaGV4UG9pbnRzID0gZ2VvbWV0cnkucmVsYXRpdmVTY2FsZWRIZXhQb2ludHModGhpcy5kYXRhLmJvYXJkVmlldy5pbm5lclNpZGVMZW5ndGgpO1xyXG4gICAgICAgIGxldCBzdGFydCA9IGhleFBvaW50c1t0aGlzLmRhdGEubW9kZWwuY29yZHMuc2lkZV07XHJcbiAgICAgICAgdGhpcy5kYXRhLmdyYXBoaWNzID0gbmV3IFBoYXNlci5HcmFwaGljcyhnYW1lLCBzdGFydC54LCBzdGFydC55KTtcclxuICAgICAgICB0aGlzLmFkZENoaWxkKHRoaXMuZGF0YS5ncmFwaGljcyk7XHJcbiAgICAgICAgdGhpcy5kYXRhLmdyYXBoaWNzLmlucHV0RW5hYmxlZCA9IHRydWU7XHJcbiAgICAgICAgdGhpcy5kYXRhLmdyYXBoaWNzLmV2ZW50cy5vbklucHV0T3Zlci5hZGQodGhpcy5kYXRhLm1vZGVsLm9uSW5wdXRPdmVyLCB0aGlzLmRhdGEubW9kZWwpO1xyXG4gICAgICAgIHRoaXMuZGF0YS5ncmFwaGljcy5ldmVudHMub25JbnB1dE91dC5hZGQodGhpcy5kYXRhLm1vZGVsLm9uSW5wdXRPdXQsIHRoaXMuZGF0YS5tb2RlbCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmVmcmVzaFBvc2l0aW9uKCl7XHJcbiAgICAgICAgbGV0IGhleFBvaW50cyA9IGdlb21ldHJ5LnJlbGF0aXZlU2NhbGVkSGV4UG9pbnRzKHRoaXMuZGF0YS5ib2FyZFZpZXcuaW5uZXJTaWRlTGVuZ3RoKTtcclxuICAgICAgICBsZXQgc3RhcnQgPSBoZXhQb2ludHNbdGhpcy5kYXRhLm1vZGVsLmNvcmRzLnNpZGVdO1xyXG4gICAgICAgIHRoaXMuZGF0YS5ncmFwaGljcy54ID0gc3RhcnQueDtcclxuICAgICAgICB0aGlzLmRhdGEuZ3JhcGhpY3MueSA9IHN0YXJ0Lnk7XHJcbiAgICB9XHJcblxyXG4gICAgdXBkYXRlKCl7XHJcbiAgICAgICAgdGhpcy5yZWZyZXNoUG9zaXRpb24oKTtcclxuICAgICAgICBsZXQgZXh0ZXJuYWxUYW5nZW50QW5nbGUgPSA2MDtcclxuICAgICAgICB0aGlzLmRhdGEuZ3JhcGhpY3MuYW5nbGUgPSBleHRlcm5hbFRhbmdlbnRBbmdsZSp0aGlzLmRhdGEubW9kZWwuY29yZHMuc2lkZTtcclxuICAgICAgICB0aGlzLmRhdGEuZ3JhcGhpY3MuY2xlYXIoKTtcclxuICAgICAgICAvL3RoaXMgcmVjdCB1c2VkIGZybyBoaXQgYm94IG9ubHlcclxuICAgICAgICB0aGlzLmRhdGEuZ3JhcGhpY3MuYmVnaW5GaWxsKDAsIDApO1xyXG4gICAgICAgIHRoaXMuZGF0YS5ncmFwaGljcy5kcmF3UmVjdCgwLCAwLCB0aGlzLmRhdGEuYm9hcmRWaWV3LmlubmVyU2lkZUxlbmd0aCxsaW5lU3R5bGUudGhpY2tuZXNzICogMik7XHJcbiAgICAgICAgdGhpcy5kYXRhLmdyYXBoaWNzLmVuZEZpbGwoKTtcclxuICAgICAgICAvL25vdyBkcmF3aW5nXHJcbiAgICAgICAgdGhpcy5kYXRhLmdyYXBoaWNzLmxpbmVTdHlsZShsaW5lU3R5bGUudGhpY2tuZXNzLCB0aGlzLmRhdGEubW9kZWwudGVhbS5jb2xvdXIsIGxpbmVTdHlsZS5hbHBoYSk7XHJcbiAgICAgICAgdGhpcy5kYXRhLmdyYXBoaWNzLm1vdmVUbygwLCAwKTtcclxuICAgICAgICB0aGlzLmRhdGEuZ3JhcGhpY3MubGluZVRvKHRoaXMuZGF0YS5ib2FyZFZpZXcuaW5uZXJTaWRlTGVuZ3RoLCAwKTtcclxuXHJcbiAgICAgICAgaWYodGhpcy5kYXRhLm1vZGVsLnNlbGVjdGVkICYmIGZhbHNlKXtcclxuICAgICAgICAgICAgLy90aGlzIGlzIGdvbm5hIGJlIGEgcmVhbCByZXNvdXJjZSBkcmFpblxyXG4gICAgICAgICAgICAvL3Nob3VsZCBpbnN0ZWFkIHJlbmRlciB0byB0ZXh0dXJlICg2IGRpZmZlcmVudCBvbmVzKSwgdGhlbiByZWFwcGx5XHJcbiAgICAgICAgICAgIGxldCBzdGVwcyA9IDEwO1xyXG4gICAgICAgICAgICBsZXQgbWF4VGhpY2tuZXNzID0gbGluZVN0eWxlLnRoaWNrbmVzcyAqIDU7XHJcbiAgICAgICAgICAgIGxldCB0aGlja25lc3NTdGVwID0gKG1heFRoaWNrbmVzcyAtIGxpbmVTdHlsZS50aGlja25lc3MpL3N0ZXBzO1xyXG4gICAgICAgICAgICBsZXQgYWxwaGEgPSAxL3N0ZXBzOy8vdGhlc2UgbmF0dXJhbHkgc3RhY2ssIHNvIHNjYWxpbmcgd2l0aCBzdGVwIGlzIG5vdCBuZWVkZWRcclxuICAgICAgICAgICAgZm9yKGxldCBzdGVwID0gMDsgc3RlcCA8IHN0ZXBzOyBzdGVwKyspe1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kYXRhLmdyYXBoaWNzLmxpbmVTdHlsZShsaW5lU3R5bGUudGhpY2tuZXNzICsgKHRoaWNrbmVzc1N0ZXAqc3RlcCksIDB4ZmZmZmZmLCBhbHBoYSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRhdGEuZ3JhcGhpY3MubW92ZVRvKDAsIDApO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kYXRhLmdyYXBoaWNzLmxpbmVUbyh0aGlzLmRhdGEuYm9hcmRWaWV3LmlubmVyU2lkZUxlbmd0aCwgMCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuIiwiaW1wb3J0IHtIZXhhZ29ufSBmcm9tIFwiLi9oZXhhZ29uLmpzXCI7XHJcbmltcG9ydCB7Q29tYmluZWRTaWRlfSBmcm9tIFwiLi9jb21iaW5lZFNpZGUuanNcIjtcclxuaW1wb3J0IHtEYXNoYm9hcmR9IGZyb20gXCIuL2Rhc2hib2FyZC5qc1wiO1xyXG5pbXBvcnQgKiBhcyB0ZWFtSW5mbyBmcm9tIFwiLi4vdGVhbUluZm8uanNcIjtcclxuaW1wb3J0IHtDaGFyYWN0ZXJ9IGZyb20gXCIuL2NoYXJhY3Rlci5qc1wiO1xyXG5cclxubGV0IGJvYXJkU2V0dGluZ3MgPSB7XHJcbiAgICBzcGFjZUZhY3RvcjogMC42LFxyXG4gICAgc2lkZUxlbmd0aDogMTBcclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBib2FyZFNldHRpbmdzR3VpKGd1aSwgZ2FtZSl7XHJcbiAgICBsZXQgYm9hcmRWaWV3ID0gZ3VpLmFkZEZvbGRlcignYm9hcmQgdmlldycpO1xyXG4gICAgYm9hcmRWaWV3LmFkZChib2FyZFNldHRpbmdzLCAnc3BhY2VGYWN0b3InLCAwLCAyKTtcclxufVxyXG5cclxuLy90aGlzIGRvZXNudCB3b3JrIHByb3Blcmx5XHJcbmZ1bmN0aW9uIGNhbGN1bGF0ZVNpZGVMZW5ndGgod2lkdGgsIGhlaWdodCwgZ3JpZFdpZHRoLCBncmlkSGVpZ2h0KXtcclxuICAgIGxldCBib2FyZFdpZHRoID0gKDEuNSpncmlkV2lkdGgpKzE7XHJcbiAgICBsZXQgYm9hcmRIZWlnaHQgPSAoMipNYXRoLnNpbihNYXRoLlBJLzMpKmdyaWRIZWlnaHQpKygxLjUqTWF0aC5zaW4oTWF0aC5QSS8zKSk7XHJcbiAgICBpZihib2FyZFdpZHRoID4gYm9hcmRIZWlnaHQpe1xyXG4gICAgICAgIHJldHVybiB3aWR0aC8oMS41KmdyaWRXaWR0aCsxKS8yO1xyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgcmV0dXJuIGhlaWdodC8oKDIqTWF0aC5zaW4oTWF0aC5QSS8zKSpncmlkSGVpZ2h0KSsoMS41Kk1hdGguc2luKE1hdGguUEkvMykpKS8yO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgQm9hcmQgZXh0ZW5kcyBQaGFzZXIuU3ByaXRle1xyXG4gICAgLy9wYXNzaW5nIGluIHggaXMgZXZlbiBtb3JlIHJlYXNvbiB0byBtYWtlIHRoaXMgYSBwaGFzZXIgb2JqZWN0XHJcbiAgICBjb25zdHJ1Y3RvcihnYW1lLCB4LCB5LCBtb2RlbCwgZ3VpLCBzaWRlTGVuZ3RoKXtcclxuICAgICAgICBzdXBlcihnYW1lLCB4LCB5KTtcclxuICAgICAgICB0aGlzLmRhdGEubW9kZWwgPSBtb2RlbDtcclxuICAgICAgICB0aGlzLmRhdGEuZGFzaGJvYXJkID0gbmV3IERhc2hib2FyZChnYW1lLCAwLCAwLCAyMDAsIHRlYW1JbmZvLCB0aGlzLmRhdGEubW9kZWwpO1xyXG4gICAgICAgIHRoaXMuYWRkQ2hpbGQodGhpcy5kYXRhLmRhc2hib2FyZCk7XHJcbiAgICAgICAgaWYoc2lkZUxlbmd0aCA9PT0gdW5kZWZpbmVkKXtcclxuICAgICAgICAgICAgc2lkZUxlbmd0aCA9IHRoaXMuZGVmYXVsdFNpZGVMZW5ndGg7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuZGF0YS5zaWRlTGVuZ3RoID0gc2lkZUxlbmd0aDtcclxuICAgICAgICB0aGlzLmRhdGEuZ3VpID0gZ3VpO1xyXG4gICAgICAgIHRoaXMuZGF0YS5zaWRlTGVuZ3RoR3VpID0gZ3VpLmFkZCh0aGlzLmRhdGEsICdzaWRlTGVuZ3RoJywgc2lkZUxlbmd0aCowLjUsIHNpZGVMZW5ndGgqMik7XHJcbiAgICAgICAgdGhpcy5oZXhhZ29ucyA9IFtdO1xyXG4gICAgICAgIHRoaXMuZGF0YS5nYW1lQm9hcmRHcm91cCA9IG5ldyBQaGFzZXIuR3JvdXAoZ2FtZSwgdGhpcyk7XHJcbiAgICAgICAgdGhpcy5kYXRhLmdhbWVCb2FyZEdyb3VwLnggPSB0aGlzLmRhdGEuZGFzaGJvYXJkLmRhdGEud2lkdGg7XHJcbiAgICAgICAgLy9zaG91bGQgcHV0IGhleCB2ZWl3cyBpbiB0aGVpciBvd24gZ3JvdXBcclxuICAgICAgICBmb3IoY29uc3QgaGV4TW9kZWwgb2YgbW9kZWwuaGV4QXJyYXkpe1xyXG4gICAgICAgICAgICBsZXQgd29ybGRDb3JkcyA9IHRoaXMuY2FsY3VsYXRlV29ybGRDb3JkcyhoZXhNb2RlbC5ncmlkQ29yZHMpO1xyXG4gICAgICAgICAgICBsZXQgaGV4YWdvbiA9IG5ldyBIZXhhZ29uKGdhbWUsIHdvcmxkQ29yZHMueCwgd29ybGRDb3Jkcy55LCB0aGlzLCBtb2RlbC5oZXhhZ29uSW5wdXQsIGhleE1vZGVsKTtcclxuICAgICAgICAgICAgdGhpcy5kYXRhLmdhbWVCb2FyZEdyb3VwLmFkZENoaWxkKGhleGFnb24pO1xyXG4gICAgICAgICAgICB0aGlzLmhleGFnb25zLnB1c2goaGV4YWdvbik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuY29tYmluZWRTaWRlcyA9IFtdO1xyXG4gICAgICAgIGZvcihsZXQgY29tYk1vZGVsIG9mIG1vZGVsLmNvbWJpbmVkU2lkZXNBcnJheSl7XHJcbiAgICAgICAgICAgIGxldCB3b3JsZENvcmRzID0gdGhpcy5jYWxjdWxhdGVXb3JsZENvcmRzKGNvbWJNb2RlbC5jb3Jkcyk7XHJcbiAgICAgICAgICAgIGxldCBjb21iaW5lZFNpZGUgPSBuZXcgQ29tYmluZWRTaWRlKGdhbWUsIHdvcmxkQ29yZHMueCwgd29ybGRDb3Jkcy55LCB0aGlzLCBjb21iTW9kZWwpO1xyXG4gICAgICAgICAgICB0aGlzLmRhdGEuZ2FtZUJvYXJkR3JvdXAuYWRkQ2hpbGQoY29tYmluZWRTaWRlKTtcclxuICAgICAgICAgICAgdGhpcy5jb21iaW5lZFNpZGVzLnB1c2goY29tYmluZWRTaWRlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5jaGFyYWN0ZXJzID0gW107XHJcbiAgICAgICAgZm9yKGxldCBjaGFyYWN0ZXJNb2RlbCBvZiBtb2RlbC5jaGFyYWN0ZXJBcnJheSl7XHJcbiAgICAgICAgICAgIGxldCBjaGFyYWN0ZXIgPSBuZXcgQ2hhcmFjdGVyKGdhbWUsIHRoaXMsIGNoYXJhY3Rlck1vZGVsLCBtb2RlbC5jaGFyYWN0ZXJJbnB1dCk7XHJcbiAgICAgICAgICAgIHRoaXMuZGF0YS5nYW1lQm9hcmRHcm91cC5hZGRDaGlsZChjaGFyYWN0ZXIpO1xyXG4gICAgICAgICAgICB0aGlzLmNoYXJhY3RlcnMucHVzaChjaGFyYWN0ZXIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBkZXN0cm95KGRlc3Ryb3lDaGlsZHJlbiwgZGVzdHJveVRleHR1cmUpe1xyXG4gICAgICAgIHRoaXMuZGF0YS5ndWkucmVtb3ZlKHRoaXMuZGF0YS5zaWRlTGVuZ3RoR3VpKTtcclxuICAgICAgICBzdXBlci5kZXN0cm95KGRlc3Ryb3lDaGlsZHJlbiwgZGVzdHJveVRleHR1cmUpO1xyXG4gICAgfVxyXG5cclxuICAgIGdldCBkZWZhdWx0U2lkZUxlbmd0aCgpe1xyXG4gICAgICAgIHJldHVybiBjYWxjdWxhdGVTaWRlTGVuZ3RoKHRoaXMuZ2FtZS53aWR0aC10aGlzLmRhdGEuZGFzaGJvYXJkLndpZHRoLCB0aGlzLmdhbWUuaGVpZ2h0LCB0aGlzLmRhdGEubW9kZWwuZ3JpZFdpZHRoLCB0aGlzLmRhdGEubW9kZWwuZ3JpZEhlaWdodCk7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IGlubmVyU2lkZUxlbmd0aCgpe1xyXG4gICAgICAgIHJldHVybiBib2FyZFNldHRpbmdzLnNwYWNlRmFjdG9yKnRoaXMuZGF0YS5zaWRlTGVuZ3RoO1xyXG4gICAgfVxyXG5cclxuICAgIGdldCBvdXRlclNpZGVMZW5ndGgoKXtcclxuICAgICAgICByZXR1cm4gdGhpcy5kYXRhLnNpZGVMZW5ndGg7XHJcbiAgICB9XHJcblxyXG4gICAgdXBkYXRlKCl7XHJcbiAgICAgICAgZm9yKGxldCBoZXhhZ29uIG9mIHRoaXMuaGV4YWdvbnMpe1xyXG4gICAgICAgICAgICBoZXhhZ29uLnVwZGF0ZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmb3IobGV0IGNvbWJpbmVkU2lkZSBvZiB0aGlzLmNvbWJpbmVkU2lkZXMpe1xyXG4gICAgICAgICAgICBjb21iaW5lZFNpZGUudXBkYXRlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZvcihsZXQgY2hhcmFjdGVyIG9mIHRoaXMuY2hhcmFjdGVycyl7XHJcbiAgICAgICAgICAgIGNoYXJhY3Rlci51cGRhdGUoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5kYXRhLmRhc2hib2FyZC51cGRhdGUoKTtcclxuICAgIH1cclxuXHJcbiAgICB1cGRhdGVTaWRlTGVuZ3RoKHNpZGVMZW5ndGgpe1xyXG4gICAgICAgIGlmKHNpZGVMZW5ndGggPT09IHVuZGVmaW5lZCl7XHJcbiAgICAgICAgICAgIHNpZGVMZW5ndGggPSB0aGlzLmRlZmF1bHRTaWRlTGVuZ3RoO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmRhdGEuc2lkZUxlbmd0aCA9IHNpZGVMZW5ndGg7XHJcbiAgICB9XHJcblxyXG4gICAgY2FsY3VsYXRlV29ybGRDb3JkcyhncmlkQ29yZHMpe1xyXG4gICAgICAgIGxldCBzcGFjaW5nU2lkZUxlbmd0aCA9IHRoaXMuZGF0YS5zaWRlTGVuZ3RoO1xyXG4gICAgICAgIGxldCB5U3BhY2luZyA9IDIqTWF0aC5zaW4oTWF0aC5QSS8zKSpzcGFjaW5nU2lkZUxlbmd0aDtcclxuICAgICAgICBsZXQgeFNwYWNpbmcgPSBzcGFjaW5nU2lkZUxlbmd0aCoxLjU7XHJcbiAgICAgICAgLy9wbHVzIG9uZXMgc28gd2UgZG9uJ3QgZ2V0IGN1dCBvZmYgYnkgZWRnZSBvZiBtYXBcclxuICAgICAgICBsZXQgcG9zaXRpb24gPSAge1xyXG4gICAgICAgICAgICB4OiAoeFNwYWNpbmcqZ3JpZENvcmRzLngpK3NwYWNpbmdTaWRlTGVuZ3RoLFxyXG4gICAgICAgICAgICB5OiAoeVNwYWNpbmcqZ3JpZENvcmRzLnkpKygyKk1hdGguc2luKE1hdGguUEkvMykqc3BhY2luZ1NpZGVMZW5ndGgpXHJcbiAgICAgICAgfTtcclxuICAgICAgICBsZXQgaXNPZGRDb2x1bW4gPSBncmlkQ29yZHMueCUyPT0xO1xyXG4gICAgICAgIGlmKGlzT2RkQ29sdW1uKXtcclxuICAgICAgICAgICAgcG9zaXRpb24ueSAtPSB5U3BhY2luZy8yO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcG9zaXRpb247XHJcbiAgICB9XHJcbn1cclxuIiwiaW1wb3J0ICogYXMgZ2VvbWV0cnkgZnJvbSBcIi4uL2dlb21ldHJ5LmpzXCI7XHJcblxyXG5sZXQgbGluZVN0eWxlID0ge1xyXG4gICAgdGhpY2tuZXNzOiA1LFxyXG4gICAgYWxwaGE6IDFcclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBzaW5nbGVTaWRlU2V0dGluZ3NHdWkoZ3VpKXtcclxuICAgIGxldCBmb2xkZXIgPSBndWkuYWRkRm9sZGVyKCdzaW5nbGUgc2lkZSBncmFwaGljcycpO1xyXG4gICAgZm9sZGVyLmFkZChsaW5lU3R5bGUsICd0aGlja25lc3MnLCAwLDIwKTtcclxuICAgIGZvbGRlci5hZGQobGluZVN0eWxlLCAnYWxwaGEnLCAwLCAxKTtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIENoYXJhY3RlciBleHRlbmRzIFBoYXNlci5TcHJpdGV7XHJcblxyXG4gICAgY29uc3RydWN0b3IoZ2FtZSwgYm9hcmRWaWV3LCBtb2RlbCwgaW5wdXREb3duQ2FsbGJhY2spe1xyXG4gICAgICAgIHN1cGVyKGdhbWUsIDAsIDApO1xyXG4gICAgICAgIHRoaXMuZGF0YS5ib2FyZFZpZXcgPSBib2FyZFZpZXc7XHJcbiAgICAgICAgdGhpcy5kYXRhLm1vZGVsID0gbW9kZWw7XHJcbiAgICAgICAgbGV0IHdvcmxkQ29yZHMgPSBib2FyZFZpZXcuY2FsY3VsYXRlV29ybGRDb3Jkcyh0aGlzLmRhdGEubW9kZWwuY29yZHMpO1xyXG4gICAgICAgIHRoaXMueCA9IHdvcmxkQ29yZHMueDtcclxuICAgICAgICB0aGlzLnkgPSB3b3JsZENvcmRzLnk7XHJcbiAgICAgICAgdGhpcy5pbnRlcnBvbGF0aW9uID0gMDtcclxuICAgICAgICB0aGlzLmRhdGEuZ3JhcGhpY3MgPSBuZXcgUGhhc2VyLkdyYXBoaWNzKGdhbWUsIDAsIDApO1xyXG4gICAgICAgIHRoaXMuYWRkQ2hpbGQodGhpcy5kYXRhLmdyYXBoaWNzKTtcclxuICAgICAgICB0aGlzLmRhdGEub2xkU2lkZSA9IHRoaXMuZGF0YS5tb2RlbC5jb3Jkcy5zaWRlO1xyXG4gICAgICAgIHRoaXMuZXZlbnRzLm9uSW5wdXREb3duLmFkZChpbnB1dERvd25DYWxsYmFjaywgdGhpcy5kYXRhLmJvYXJkVmlldy5kYXRhLm1vZGVsKTtcclxuICAgIH1cclxuXHJcbiAgICBpbnRlcnBvbGF0aW9uQW1vdW50KG1pZFBvaW50KXtcclxuICAgICAgICBpZih0aGlzLmRhdGEub2xkU2lkZSAhPSB0aGlzLmRhdGEubW9kZWwuY29yZHMuc2lkZSl7XHJcbiAgICAgICAgICAgIHRoaXMuYW5pbWF0ZSA9IHRydWU7XHJcbiAgICAgICAgICAgIHRoaXMuZGF0YS5vbGRTaWRlID0gdGhpcy5kYXRhLm1vZGVsLmNvcmRzLnNpZGU7XHJcbiAgICAgICAgfWVsc2UgaWYoIXRoaXMuYW5pbWF0ZSl7XHJcbiAgICAgICAgICAgIHJldHVybiBtaWRQb2ludDtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5tYXhJbnRlcnBvbGF0aW9uID0gNTA7XHJcbiAgICAgICAgaWYodGhpcy5pbnRlcnBvbGF0aW9uID49IHRoaXMubWF4SW50ZXJwb2xhdGlvbil7XHJcbiAgICAgICAgICAgIHRoaXMuaW50ZXJwb2xhdGlvbiA9IDA7XHJcbiAgICAgICAgICAgIHRoaXMuYW5pbWF0ZSA9IGZhbHNlO1xyXG4gICAgICAgIH1lbHNlIGlmKHRoaXMuYW5pbWF0ZSA9PT0gdHJ1ZSl7XHJcbiAgICAgICAgICAgIHRoaXMuaW50ZXJwb2xhdGlvbisrO1xyXG4gICAgICAgIH1cclxuICAgICAgICBsZXQgaGV4UG9pbnRzID0gZ2VvbWV0cnkucmVsYXRpdmVTY2FsZWRIZXhQb2ludHModGhpcy5kYXRhLmJvYXJkVmlldy5vdXRlclNpZGVMZW5ndGgpO1xyXG4gICAgICAgIGxldCBzdGFydDtcclxuICAgICAgICBsZXQgZW5kO1xyXG4gICAgICAgIGlmKHRoaXMuZGF0YS5tb2RlbC5sYXN0Um90YXRpb24gPT0gNSl7Ly8xIGxlc3MgdGhlbiBtYXggaXMgc2FtZSBhcyAtMVxyXG4gICAgICAgICAgICBzdGFydCA9IGhleFBvaW50c1sodGhpcy5kYXRhLm1vZGVsLmNvcmRzLnNpZGUrMiklNl07XHJcbiAgICAgICAgICAgIGVuZCA9IGhleFBvaW50c1sodGhpcy5kYXRhLm1vZGVsLmNvcmRzLnNpZGUrMSklNl07XHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIHN0YXJ0ID0gaGV4UG9pbnRzWyh0aGlzLmRhdGEubW9kZWwuY29yZHMuc2lkZSs1KSU2XTtcclxuICAgICAgICAgICAgZW5kID0gaGV4UG9pbnRzWyh0aGlzLmRhdGEubW9kZWwuY29yZHMuc2lkZSs2KSU2XTtcclxuICAgICAgICB9XHJcbiAgICAgICAgbGV0IG1pZFBvaW50MiA9IHt4OiAoc3RhcnQueCArIGVuZC54KS8yLCB5OiAoc3RhcnQueSArIGVuZC55KS8yfTtcclxuICAgICAgICBsZXQgaW50ZXJwb2xhdGlvblBlcmNlbnQgPSAodGhpcy5pbnRlcnBvbGF0aW9uL3RoaXMubWF4SW50ZXJwb2xhdGlvbik7XHJcbiAgICAgICAgbGV0IGludFggPSAobWlkUG9pbnQueCAtIG1pZFBvaW50Mi54KSppbnRlcnBvbGF0aW9uUGVyY2VudDtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICB4OiBtaWRQb2ludDIueCArIChtaWRQb2ludC54IC0gbWlkUG9pbnQyLngpKihpbnRlcnBvbGF0aW9uUGVyY2VudCksXHJcbiAgICAgICAgICAgIHk6IG1pZFBvaW50Mi55ICsgKG1pZFBvaW50LnkgLSBtaWRQb2ludDIueSkqKGludGVycG9sYXRpb25QZXJjZW50KVxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgcmVmcmVzaFBvc2l0aW9uKCl7XHJcbiAgICAgICAgbGV0IHdvcmxkQ29yZHMgPSB0aGlzLmRhdGEuYm9hcmRWaWV3LmNhbGN1bGF0ZVdvcmxkQ29yZHModGhpcy5kYXRhLm1vZGVsLmNvcmRzKTtcclxuICAgICAgICB0aGlzLnggPSB3b3JsZENvcmRzLng7XHJcbiAgICAgICAgdGhpcy55ID0gd29ybGRDb3Jkcy55O1xyXG4gICAgICAgIGxldCBoZXhQb2ludHMgPSBnZW9tZXRyeS5yZWxhdGl2ZVNjYWxlZEhleFBvaW50cyh0aGlzLmRhdGEuYm9hcmRWaWV3Lm91dGVyU2lkZUxlbmd0aCk7XHJcbiAgICAgICAgbGV0IHN0YXJ0ID0gaGV4UG9pbnRzW3RoaXMuZGF0YS5tb2RlbC5jb3Jkcy5zaWRlXTtcclxuICAgICAgICBsZXQgZW5kID0gaGV4UG9pbnRzWyh0aGlzLmRhdGEubW9kZWwuY29yZHMuc2lkZSArIDEpJTZdO1xyXG4gICAgICAgIGxldCBtaWRQb2ludCA9IHt4OiAoc3RhcnQueCArIGVuZC54KS8yLCB5OiAoc3RhcnQueSArIGVuZC55KS8yfTtcclxuICAgICAgICAvL2xldCBpbnRlcnBvbGF0aW9uQW1vdW50ID0gdGhpcy5pbnRlcnBvbGF0aW9uQW1vdW50KCk7XHJcbiAgICAgICAgLy9taWRQb2ludC54ICs9IHRoaXMuaW50ZXJwb2xhdGlvbkFtb3VudC54O1xyXG4gICAgICAgIC8vbWlkUG9pbnQueSArPSB0aGlzLmludGVycG9sYXRpb25BbW91bnQueTtcclxuICAgICAgICBsZXQgd2l0aEludGVycG9sYXRpb24gPSB0aGlzLmludGVycG9sYXRpb25BbW91bnQobWlkUG9pbnQpO1xyXG4gICAgICAgIHRoaXMuZGF0YS5ncmFwaGljcy54ID0gd2l0aEludGVycG9sYXRpb24ueDtcclxuICAgICAgICB0aGlzLmRhdGEuZ3JhcGhpY3MueSA9IHdpdGhJbnRlcnBvbGF0aW9uLnk7XHJcbiAgICAgICAgLy90aGlzLmRhdGEuZ3JhcGhpY3MueCA9IG1pZFBvaW50Lng7XHJcbiAgICAgICAgLy90aGlzLmRhdGEuZ3JhcGhpY3MueSA9IG1pZFBvaW50Lnk7XHJcbiAgICB9XHJcblxyXG4gICAgdXBkYXRlKCl7XHJcbiAgICAgICAgdGhpcy5yZWZyZXNoUG9zaXRpb24oKTtcclxuICAgICAgICB0aGlzLmRhdGEuZ3JhcGhpY3MuY2xlYXIoKTtcclxuICAgICAgICAvL25vdyBkcmF3aW5nXHJcbiAgICAgICAgLy9jYXVzZSB0aGlzIGRvZXNudCBjaGFuZ2UsIHdlIHNob3VsZCBjYWNoZSBicm9cclxuICAgICAgICB0aGlzLmRhdGEuZ3JhcGhpY3MubGluZVN0eWxlKDIsICcjZmZmZmZmJyk7XHJcbiAgICAgICAgdGhpcy5kYXRhLmdyYXBoaWNzLmJlZ2luRmlsbCh0aGlzLmRhdGEubW9kZWwudGVhbS5jb2xvdXIsIDAuNSk7XHJcbiAgICAgICAgLy90aGlzIGFuZCBhbHBoYSBhcmUgdGVtcCBoYWNrcyB0byBzaG93IG92ZXJsYXBpbmcgY2hhcmFjdGVycyBvZiBkaWZmZXJlbnQgY29sb3Vyc1xyXG4gICAgICAgIGxldCB0ZWFtU2NhbGUgPSAxICsgMC41KnRoaXMuZGF0YS5tb2RlbC50ZWFtLm51bWJlcjtcclxuICAgICAgICB0aGlzLmRhdGEuZ3JhcGhpY3MuZHJhd0NpcmNsZSgwLCAwLCB0aGlzLmRhdGEuYm9hcmRWaWV3Lm91dGVyU2lkZUxlbmd0aCp0ZWFtU2NhbGUvMTApO1xyXG4gICAgICAgIHRoaXMuZGF0YS5ncmFwaGljcy5lbmRGaWxsKCk7XHJcbiAgICAgICAgdGhpcy5kYXRhLmdyYXBoaWNzLmxpbmVTdHlsZSg1LCAweDAwMDAwKTtcclxuICAgICAgICAvL2Fsd2F5cyBwb2ludCBpbndhcmRzIGJlY2F1c2UgaW5uZXIgaGV4IGFsd2F5cyBoYXMgYSBtYXRjaGluZyBzaWRlXHJcbiAgICAgICAgLyp0aGlzLmRhdGEuZ3JhcGhpY3MubW92ZVRvKDAsIHRoaXMuZGF0YS5ib2FyZFZpZXcub3V0ZXJTaWRlTGVuZ3RoLzEwKTtcclxuICAgICAgICB0aGlzLmRhdGEuZ3JhcGhpY3MubGluZVRvKDAsIHRoaXMuZGF0YS5ib2FyZFZpZXcub3V0ZXJTaWRlTGVuZ3RoLzEwICsgMjApO1xyXG4gICAgICAgIGlmKHRoaXMuZGF0YS5tb2RlbC5vcHBvc2l0ZVNpZGVNYXRjaGVzKCkpe1xyXG4gICAgICAgICAgICB0aGlzLmRhdGEuZ3JhcGhpY3MubW92ZVRvKDAsIC0gdGhpcy5kYXRhLmJvYXJkVmlldy5vdXRlclNpZGVMZW5ndGgvMTApO1xyXG4gICAgICAgICAgICB0aGlzLmRhdGEuZ3JhcGhpY3MubGluZVRvKDAsIC0gdGhpcy5kYXRhLmJvYXJkVmlldy5vdXRlclNpZGVMZW5ndGgvMTAgLSAyMCk7XHJcbiAgICAgICAgfSovXHJcbiAgICB9XHJcbn1cclxuIiwiaW1wb3J0ICogYXMgZ2VvbWV0cnkgZnJvbSBcIi4uL2dlb21ldHJ5LmpzXCI7XHJcblxyXG5sZXQgbGluZVN0eWxlID0ge1xyXG4gICAgdGhpY2tuZXNzOiAwLFxyXG4gICAgYWxwaGE6IDFcclxufTtcclxuXHJcbmxldCBjb21iaW5lZENvbG91cnMgPSB7XHJcbiAgICB0ZWFtXzBfMTogMHhmZjAwMDAsLy8weGZmYjAwMCxcclxuICAgIHRlYW1fMV8yOiAweDY2NjY2NiwvLzB4MDBmZjAwLFxyXG4gICAgdGVhbV8yXzA6IDB4ZmYwMDAwLC8vMHhhZjAwZmZcclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBjb21iaW5lZFNpZGVTZXR0aW5nc0d1aShndWkpe1xyXG4gICAgbGV0IGZvbGRlciA9IGd1aS5hZGRGb2xkZXIoJ2NvbWJpbmVkIHNpZGUgZ3JhcGhpY3MnKTtcclxuICAgIGZvbGRlci5hZGQobGluZVN0eWxlLCAndGhpY2tuZXNzJywgMCwyMCk7XHJcbiAgICBmb2xkZXIuYWRkKGxpbmVTdHlsZSwgJ2FscGhhJywgMCwgMSk7XHJcbiAgICBmb2xkZXIuYWRkQ29sb3IoY29tYmluZWRDb2xvdXJzLCAndGVhbV8wXzEnKTtcclxuICAgIGZvbGRlci5hZGRDb2xvcihjb21iaW5lZENvbG91cnMsICd0ZWFtXzFfMicpO1xyXG4gICAgZm9sZGVyLmFkZENvbG9yKGNvbWJpbmVkQ29sb3VycywgJ3RlYW1fMl8wJyk7XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBDb21iaW5lZFNpZGUgZXh0ZW5kcyBQaGFzZXIuU3ByaXRle1xyXG4gICAgLypcclxuICAgIG1vZGVsIEFQSTpcclxuICAgICAgICBwcm9wZXJ0eSBoZXhTaWRlVGVhbXMgLT4gYXJyYXkgb2YgdGVhbU51bWJlcnMgb2YgYWRqYWNlbnQgaGV4IHNpZGVzXHJcbiAgICAgICAgcHJvZXJ0eSBjb3JkcyAtPiB7eCx5LCBzaWRlfSBzdGFuZGFyZCBjb3JvZGluYXRlIGZvciBhZGRyZXNzaW5nIGNvbWJpbmVkIHNpZGVzXHJcbiAgICAqL1xyXG4gICAgY29uc3RydWN0b3IoZ2FtZSwgeCwgeSwgYm9hcmRWaWV3LCBtb2RlbCl7XHJcbiAgICAgICAgc3VwZXIoZ2FtZSwgeCwgeSk7XHJcbiAgICAgICAgdGhpcy5kYXRhLmJvYXJkVmlldyA9IGJvYXJkVmlldztcclxuICAgICAgICB0aGlzLmRhdGEubW9kZWwgPSBtb2RlbDtcclxuICAgICAgICBsZXQgaGV4UG9pbnRzID0gZ2VvbWV0cnkucmVsYXRpdmVTY2FsZWRIZXhQb2ludHModGhpcy5kYXRhLmJvYXJkVmlldy5vdXRlclNpZGVMZW5ndGgpO1xyXG4gICAgICAgIGxldCBzdGFydCA9IGhleFBvaW50c1t0aGlzLmRhdGEubW9kZWwuY29yZHMuc2lkZV07XHJcbiAgICAgICAgbGV0IGVuZCA9IGhleFBvaW50c1sodGhpcy5kYXRhLm1vZGVsLmNvcmRzLnNpZGUgKyAxKSAlIDZdO1xyXG4gICAgICAgIHRoaXMuZGF0YS5ncmFwaGljcyA9IG5ldyBQaGFzZXIuR3JhcGhpY3MoZ2FtZSwgc3RhcnQueCwgc3RhcnQueSk7XHJcbiAgICAgICAgdGhpcy5hZGRDaGlsZCh0aGlzLmRhdGEuZ3JhcGhpY3MpO1xyXG4gICAgICAgIGxldCB0ZXh0UG9zaXRpb24gPSB7eDogKHN0YXJ0LnggKyBlbmQueCkvMiwgeTogKHN0YXJ0LnkgKyBlbmQueSkvMn07XHJcbiAgICAgICAgdGhpcy5kYXRhLnRleHQgPSBuZXcgUGhhc2VyLlRleHQoZ2FtZSwgdGV4dFBvc2l0aW9uLngsIHRleHRQb3NpdGlvbi55LCBcIlwiKTtcclxuICAgICAgICB0aGlzLmFkZENoaWxkKHRoaXMuZGF0YS50ZXh0KTtcclxuICAgICAgICB0aGlzLmRhdGEudGV4dC52aXNpYmxlID0gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgcmVmcmVzaFBvc2l0aW9uKCl7XHJcbiAgICAgICAgbGV0IHdvcmxkQ29yZHMgPSB0aGlzLmRhdGEuYm9hcmRWaWV3LmNhbGN1bGF0ZVdvcmxkQ29yZHModGhpcy5kYXRhLm1vZGVsLmNvcmRzKTtcclxuICAgICAgICB0aGlzLnggPSB3b3JsZENvcmRzLng7XHJcbiAgICAgICAgdGhpcy55ID0gd29ybGRDb3Jkcy55O1xyXG4gICAgICAgIGxldCBoZXhQb2ludHMgPSBnZW9tZXRyeS5yZWxhdGl2ZVNjYWxlZEhleFBvaW50cyh0aGlzLmRhdGEuYm9hcmRWaWV3Lm91dGVyU2lkZUxlbmd0aCk7XHJcbiAgICAgICAgbGV0IHN0YXJ0ID0gaGV4UG9pbnRzW3RoaXMuZGF0YS5tb2RlbC5jb3Jkcy5zaWRlXTtcclxuICAgICAgICBsZXQgZW5kID0gaGV4UG9pbnRzWyh0aGlzLmRhdGEubW9kZWwuY29yZHMuc2lkZSArIDEpICUgNl07XHJcbiAgICAgICAgdGhpcy5kYXRhLmdyYXBoaWNzLnggPSBzdGFydC54O1xyXG4gICAgICAgIHRoaXMuZGF0YS5ncmFwaGljcy55ID0gc3RhcnQueTtcclxuICAgICAgICB0aGlzLmRhdGEudGV4dC54ID0gKHN0YXJ0LnggKyBlbmQueCkvMjtcclxuICAgICAgICB0aGlzLmRhdGEudGV4dC55ID0gKHN0YXJ0LnkgKyBlbmQueSkvMjtcclxuICAgIH1cclxuXHJcbiAgICB1cGRhdGUoKXtcclxuICAgICAgICB0aGlzLnJlZnJlc2hQb3NpdGlvbigpO1xyXG4gICAgICAgIGxldCBleHRlcm5hbFRhbmdlbnRBbmdsZSA9IDYwO1xyXG4gICAgICAgIHRoaXMuZGF0YS5ncmFwaGljcy5hbmdsZSA9IGV4dGVybmFsVGFuZ2VudEFuZ2xlKnRoaXMuZGF0YS5tb2RlbC5jb3Jkcy5zaWRlO1xyXG4gICAgICAgIHRoaXMuZGF0YS5ncmFwaGljcy5jbGVhcigpO1xyXG4gICAgICAgIGxldCBoZXhTaWRlVGVhbXMgPSB0aGlzLmRhdGEubW9kZWwuaGV4U2lkZVRlYW1zO1xyXG4gICAgICAgIGlmKGhleFNpZGVUZWFtcy5sZW5ndGggPT09IDApe1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGxldCBmaXJzdFRlYW0gPSBoZXhTaWRlVGVhbXNbMF07XHJcbiAgICAgICAgbGV0IGNvbG91cjtcclxuICAgICAgICBpZihoZXhTaWRlVGVhbXMubGVuZ3RoID09PSAyKXtcclxuICAgICAgICAgICAgbGV0IHNlY29uZFRlYW0gPSBoZXhTaWRlVGVhbXNbMV07XHJcbiAgICAgICAgICAgIGNvbG91ciA9IHRoaXMubWFudWFsQ29tYmluZShmaXJzdFRlYW0sIHNlY29uZFRlYW0pO1xyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICBjb2xvdXIgPSBmaXJzdFRlYW0uY29sb3VyO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZih0aGlzLmRhdGEubW9kZWwuc2VsZWN0ZWQgJiYgZmFsc2Upe1xyXG4gICAgICAgICAgICAvL3RoaXMgaXMgZ29ubmEgYmUgYSByZWFsIHJlc291cmNlIGRyYWluXHJcbiAgICAgICAgICAgIC8vc2hvdWxkIGluc3RlYWQgcmVuZGVyIHRvIHRleHR1cmUgKDYgZGlmZmVyZW50IG9uZXMpLCB0aGVuIHJlYXBwbHlcclxuICAgICAgICAgICAgbGV0IHN0ZXBzID0gMTA7XHJcbiAgICAgICAgICAgIGxldCBtYXhUaGlja25lc3MgPSBsaW5lU3R5bGUudGhpY2tuZXNzICogNTtcclxuICAgICAgICAgICAgbGV0IHRoaWNrbmVzc1N0ZXAgPSAobWF4VGhpY2tuZXNzIC0gbGluZVN0eWxlLnRoaWNrbmVzcykvc3RlcHM7XHJcbiAgICAgICAgICAgIGxldCBhbHBoYSA9IDEvc3RlcHM7Ly90aGVzZSBuYXR1cmFseSBzdGFjaywgc28gc2NhbGluZyB3aXRoIHN0ZXAgaXMgbm90IG5lZWRlZFxyXG4gICAgICAgICAgICBmb3IobGV0IHN0ZXAgPSAwOyBzdGVwIDwgc3RlcHM7IHN0ZXArKyl7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRhdGEuZ3JhcGhpY3MubGluZVN0eWxlKGxpbmVTdHlsZS50aGlja25lc3MgKyAodGhpY2tuZXNzU3RlcCpzdGVwKSwgMHhmZmZmZmYsIGFscGhhKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuZGF0YS5ncmFwaGljcy5tb3ZlVG8oMCwgMCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRhdGEuZ3JhcGhpY3MubGluZVRvKHRoaXMuZGF0YS5ib2FyZFZpZXcub3V0ZXJTaWRlTGVuZ3RoLCAwKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmRhdGEudGV4dC50ZXh0ID0gdGhpcy5kYXRhLm1vZGVsLnNjb3JlO1xyXG4gICAgICAgICAgICB0aGlzLmRhdGEudGV4dC52aXNpYmxlID0gdHJ1ZTtcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgdGhpcy5kYXRhLnRleHQudmlzaWJsZSA9IGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvL3RlbXAgZGlzYWJsZSBzY29yZSBkaXNwbGF5XHJcbiAgICAgICAgdGhpcy5kYXRhLnRleHQudmlzaWJsZSA9IGZhbHNlO1xyXG4gICAgICAgIC8vZG9pbmcgdGhpcyBsYXN0IG1lYW5zIGl0IHNpdHMgb24gdG9wIG9mIHRoZSBoaWdodGxpZ2hcclxuICAgICAgICB0aGlzLmRhdGEuZ3JhcGhpY3MubGluZVN0eWxlKGxpbmVTdHlsZS50aGlja25lc3MsIGNvbG91ciwgbGluZVN0eWxlLmFscGhhKTtcclxuICAgICAgICB0aGlzLmRhdGEuZ3JhcGhpY3MubW92ZVRvKDAsIDApO1xyXG4gICAgICAgIHRoaXMuZGF0YS5ncmFwaGljcy5saW5lVG8odGhpcy5kYXRhLmJvYXJkVmlldy5vdXRlclNpZGVMZW5ndGgsIDApO1xyXG4gICAgfVxyXG5cclxuICAgIC8vdGhpcyBmZWVscyBsaWtlIGl0cyBsZWFraW5nIHRoZSBtb2RlbCBhIGJpdD9cclxuICAgIG1hbnVhbENvbWJpbmUoZmlyc3RfdGVhbSwgc2Vjb25kX3RlYW0pe1xyXG4gICAgICAgIGZ1bmN0aW9uIGxvZ0Vycm9yKCl7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiZXJycm9yLCBpbnZhbGlkIHRlYW1zIGZvciBjb21iaW5pbmcgc2lkZXNcIik7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGZpcnN0X3RlYW0pO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhzZWNvbmRfdGVhbSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKGZpcnN0X3RlYW0ubnVtYmVyID4gc2Vjb25kX3RlYW0ubnVtYmVyKXtcclxuICAgICAgICAgICAgbGV0IHRlbXAgPSBmaXJzdF90ZWFtO1xyXG4gICAgICAgICAgICBmaXJzdF90ZWFtID0gc2Vjb25kX3RlYW07XHJcbiAgICAgICAgICAgIHNlY29uZF90ZWFtID0gdGVtcDtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYoZmlyc3RfdGVhbS5udW1iZXIgPT09IHNlY29uZF90ZWFtLm51bWJlcil7XHJcbiAgICAgICAgICAgIHJldHVybiBmaXJzdF90ZWFtLmNvbG91cjtcclxuICAgICAgICB9ZWxzZSBpZihmaXJzdF90ZWFtLm51bWJlciA9PT0gMCAmJiBzZWNvbmRfdGVhbS5udW1iZXIgPT09IDEpe1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbWJpbmVkQ29sb3Vycy50ZWFtXzBfMTtcclxuICAgICAgICB9ZWxzZSBpZihmaXJzdF90ZWFtLm51bWJlciA9PT0gMSAmJiBzZWNvbmRfdGVhbS5udW1iZXIgPT09IDIpe1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbWJpbmVkQ29sb3Vycy50ZWFtXzFfMjtcclxuICAgICAgICB9ZWxzZSBpZihmaXJzdF90ZWFtLm51bWJlciA9PT0gMCAmJiBzZWNvbmRfdGVhbS5udW1iZXIgPT09IDIpe1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbWJpbmVkQ29sb3Vycy50ZWFtXzJfMDtcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgbG9nRXJyb3IoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuIiwiaW1wb3J0IHtIZXhhZ29ufSBmcm9tIFwiLi9oZXhhZ29uLmpzXCI7XHJcbmltcG9ydCB7Q29tYmluZWRTaWRlfSBmcm9tIFwiLi9jb21iaW5lZFNpZGUuanNcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBEYXNoYm9hcmQgZXh0ZW5kcyBQaGFzZXIuU3ByaXRle1xyXG4gICAgLy9kZXBlbmRpbmcgb24gd2hhdCB0aGVlIGNvbnRyb2xzIGxvb2sgbGlrZVxyXG4gICAgLy9taWdodCBiZSBiZXR0ZXIgdG8gbWFrZSB0aGlzIHdpdGggbm9ybWFsIGh0bWwvY3NzXHJcbiAgICBjb25zdHJ1Y3RvcihnYW1lLCB4LCB5LCB3aWR0aCwgdGVhbUluZm8sIGJvYXJkTW9kZWwpe1xyXG4gICAgICAgIHN1cGVyKGdhbWUsIHgsIHkpO1xyXG4gICAgICAgIHRoaXMuZGF0YS50ZWFtSW5mbyA9IHRlYW1JbmZvO1xyXG4gICAgICAgIHRoaXMuZGF0YS53aWR0aCA9IHdpZHRoO1xyXG4gICAgICAgIHRoaXMuZGF0YS5oZWlnaHQgPSBnYW1lLmhlaWdodDtcclxuICAgICAgICB0aGlzLm91dGxpbmUoKTtcclxuICAgICAgICB0aGlzLmRhdGEudGVhbXNEaXNwbGF5ID0gW107XHJcbiAgICAgICAgdGhpcy5kYXRhLmN1cnJlbnRTdGF0ZVRlYW1EaXNwbGF5ID0gW107XHJcbiAgICAgICAgdGhpcy5hZGRDaGlsZChuZXcgUGhhc2VyLlRleHQodGhpcy5nYW1lLCAwLCA3MCwgXCJUb3RhbCBTY29yZXM6XCIpKTtcclxuICAgICAgICB0aGlzLmFkZENoaWxkKG5ldyBQaGFzZXIuVGV4dCh0aGlzLmdhbWUsIDAsIDE1MCwgXCJDdXJyZW50IFJvdW5kOlwiKSk7XHJcbiAgICAgICAgdGhpcy5kYXRhLmJvYXJkTW9kZWwgPSBib2FyZE1vZGVsO1xyXG4gICAgICAgIGZvcihsZXQgW2luZGV4LCB0ZWFtXSBvZiB0ZWFtSW5mby50ZWFtcy5lbnRyaWVzKCkpe1xyXG4gICAgICAgICAgICBsZXQgdGVhbURpc3BsYXlHcm91cCA9IHRoaXMudGVhbUhpZ2hsaWdodHModGVhbSwgaW5kZXgqNTAsIDExMCwgMzAsIDMwKTtcclxuICAgICAgICAgICAgdGhpcy5kYXRhLnRlYW1zRGlzcGxheS5wdXNoKHRlYW1EaXNwbGF5R3JvdXApO1xyXG4gICAgICAgICAgICB0aGlzLmFkZENoaWxkKHRlYW1EaXNwbGF5R3JvdXApO1xyXG4gICAgICAgICAgICBsZXQgY3VycmVudFN0YXRlVGVhbURpc3BsYXlHcm91cCA9IHRoaXMuY3VycmVudFN0YXRlVGVhbUhpZ2hsaWdodHModGVhbSwgaW5kZXgqNTAsIDE5MCwgMzAsIDMwKTtcclxuICAgICAgICAgICAgdGhpcy5kYXRhLmN1cnJlbnRTdGF0ZVRlYW1EaXNwbGF5LnB1c2goY3VycmVudFN0YXRlVGVhbURpc3BsYXlHcm91cCk7XHJcbiAgICAgICAgICAgIHRoaXMuYWRkQ2hpbGQoY3VycmVudFN0YXRlVGVhbURpc3BsYXlHcm91cCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMubW92ZUNvdW50ZXIgPSBuZXcgUGhhc2VyLkdyYXBoaWNzKGdhbWUsIDAsIHRoaXMuZGF0YS5oZWlnaHQvMik7XHJcbiAgICAgICAgdGhpcy5hZGRDaGlsZCh0aGlzLm1vdmVDb3VudGVyKTtcclxuICAgICAgICB0aGlzLmRhdGEuaGlnaGxpZ2h0ZWRTZWN0aW9uU2NvcmUgPSBuZXcgUGhhc2VyLlRleHQoZ2FtZSwgMCwgMTAsIFwiXCIsIHt3b3JkV3JhcDogdHJ1ZSwgd29yZFdyYXBXaWR0aDogd2lkdGgsIGZvbnRTaXplOiAxNX0pO1xyXG4gICAgICAgIHRoaXMuYWRkQ2hpbGQodGhpcy5kYXRhLmhpZ2hsaWdodGVkU2VjdGlvblNjb3JlKTtcclxuICAgICAgICB0aGlzLmRhdGEuaGlnaGxpZ2h0ZWRTZWN0aW9uU2NvcmVCb251cyA9IG5ldyBQaGFzZXIuVGV4dChnYW1lLCAwLCA0MCwgXCJcIiwge3dvcmRXcmFwOiB0cnVlLCB3b3JkV3JhcFdpZHRoOiB3aWR0aCwgZm9udFNpemU6IDE1fSk7XHJcbiAgICAgICAgdGhpcy5hZGRDaGlsZCh0aGlzLmRhdGEuaGlnaGxpZ2h0ZWRTZWN0aW9uU2NvcmVCb251cyk7XHJcbiAgICB9XHJcblxyXG4gICAgY3VycmVudFN0YXRlVGVhbUhpZ2hsaWdodHModGVhbSwgeCwgeSwgd2lkdGgsIGhlaWdodCl7XHJcbiAgICAgICAgbGV0IGdyb3VwID0gbmV3IFBoYXNlci5Hcm91cCh0aGlzLmdhbWUsIHRoaXMpO1xyXG4gICAgICAgIGxldCB0ZWFtSGlnaGxpZ2h0ID0gbmV3IFBoYXNlci5HcmFwaGljcyh0aGlzLmdhbWUsIHgsIHkpO1xyXG4gICAgICAgIHRlYW1IaWdobGlnaHQuYmVnaW5GaWxsKHRlYW0uY29sb3VyKTtcclxuICAgICAgICB0ZWFtSGlnaGxpZ2h0LmRyYXdSZWN0KDAsMCwgd2lkdGgsIGhlaWdodCk7XHJcbiAgICAgICAgdGVhbUhpZ2hsaWdodC5lbmRGaWxsKCk7XHJcbiAgICAgICAgdGVhbUhpZ2hsaWdodC5pbnB1dEVuYWJsZWQgPSB0cnVlO1xyXG4gICAgICAgIHRlYW1IaWdobGlnaHQuZXZlbnRzLm9uSW5wdXRPdmVyLmFkZChmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICB0aGlzLmRhdGEuYm9hcmRNb2RlbC50ZWFtSGlnaGxpZ2h0KHRlYW0pO1xyXG4gICAgICAgIH0sIHRoaXMpO1xyXG4gICAgICAgIGdyb3VwLmFkZENoaWxkKHRlYW1IaWdobGlnaHQpO1xyXG4gICAgICAgIGxldCBzY29yZVRleHQgPSBuZXcgUGhhc2VyLlRleHQodGhpcy5nYW1lLCB4LCB5LCBcIlwiKTtcclxuICAgICAgICBncm91cC5hZGRDaGlsZChzY29yZVRleHQpO1xyXG4gICAgICAgIHRoaXMuZGF0YS5ib2FyZE1vZGVsLnRlYW1IaWdobGlnaHQodGVhbSk7XHJcbiAgICAgICAgdGhpcy5kYXRhLmJvYXJkTW9kZWwuY3VycmVudFN0YXRlU2NvcmUodGVhbSk7XHJcbiAgICAgICAgbGV0IGJvYXJkTW9kZWwgPSB0aGlzLmRhdGEuYm9hcmRNb2RlbDtcclxuICAgICAgICBzY29yZVRleHQudXBkYXRlID0gZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgdGhpcy50ZXh0ID0gYm9hcmRNb2RlbC5jdXJyZW50U3RhdGVTY29yZSh0ZWFtKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHJldHVybiBncm91cDtcclxuICAgIH1cclxuXHJcbiAgICB0ZWFtSGlnaGxpZ2h0cyh0ZWFtLCB4LCB5LCB3aWR0aCwgaGVpZ2h0KXtcclxuICAgICAgICBsZXQgZ3JvdXAgPSBuZXcgUGhhc2VyLkdyb3VwKHRoaXMuZ2FtZSwgdGhpcyk7XHJcbiAgICAgICAgbGV0IHRlYW1IaWdobGlnaHQgPSBuZXcgUGhhc2VyLkdyYXBoaWNzKHRoaXMuZ2FtZSwgeCwgeSk7XHJcbiAgICAgICAgdGVhbUhpZ2hsaWdodC5iZWdpbkZpbGwodGVhbS5jb2xvdXIpO1xyXG4gICAgICAgIHRlYW1IaWdobGlnaHQuZHJhd1JlY3QoMCwwLCB3aWR0aCwgaGVpZ2h0KTtcclxuICAgICAgICB0ZWFtSGlnaGxpZ2h0LmVuZEZpbGwoKTtcclxuICAgICAgICBncm91cC5hZGRDaGlsZCh0ZWFtSGlnaGxpZ2h0KTtcclxuICAgICAgICBsZXQgc2NvcmVUZXh0ID0gbmV3IFBoYXNlci5UZXh0KHRoaXMuZ2FtZSwgeCwgeSwgXCJcIik7XHJcbiAgICAgICAgZ3JvdXAuYWRkQ2hpbGQoc2NvcmVUZXh0KTtcclxuICAgICAgICBzY29yZVRleHQudXBkYXRlID0gZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgdGhpcy50ZXh0ID0gdGVhbS5zY29yZTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHJldHVybiBncm91cDtcclxuICAgIH1cclxuXHJcbiAgICBvdXRsaW5lKCl7XHJcbiAgICAgICAgdGhpcy5kYXRhLm91dGxpbmUgPSBuZXcgUGhhc2VyLkdyYXBoaWNzKHRoaXMuZ2FtZSwgMCwgMCk7XHJcbiAgICAgICAgdGhpcy5kYXRhLm91dGxpbmUuYmVnaW5GaWxsKCcweGZmNjYwMCcpO1xyXG4gICAgICAgIHRoaXMuZGF0YS5vdXRsaW5lLmRyYXdSZWN0KDAsMCwgdGhpcy5kYXRhLndpZHRoLCB0aGlzLmRhdGEuaGVpZ2h0KTtcclxuICAgICAgICB0aGlzLmRhdGEub3V0bGluZS5lbmRGaWxsKCk7XHJcbiAgICAgICAgdGhpcy5hZGRDaGlsZCh0aGlzLmRhdGEub3V0bGluZSk7XHJcbiAgICB9XHJcblxyXG4gICAgdXBkYXRlKCl7XHJcbiAgICAgICAgLypmb3IobGV0IHRlYW1EaXNwbGF5R3JvdXAgb2YgdGhpcy5kYXRhLnRlYW1zRGlzcGxheSl7XHJcbiAgICAgICAgICAgIHRlYW1EaXNwbGF5R3JvdXAudXBkYXRlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZvcihsZXQgY3VycmVudFN0YXRlVGVhbURpc3BsYXlHcm91cCBvZiB0aGlzLmRhdGEuY3VycmVudFN0YXRlVGVhbURpc3BsYXkpe1xyXG4gICAgICAgICAgICBjdXJyZW50U3RhdGVUZWFtRGlzcGxheUdyb3VwLnVwZGF0ZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLm1vdmVDb3VudGVyLmNsZWFyKCk7XHJcbiAgICAgICAgbGV0IHNjb3JlO1xyXG4gICAgICAgIGxldCBib251cztcclxuICAgICAgICBpZih0aGlzLmRhdGEuYm9hcmRNb2RlbC5zZWxlY3RlZCA9PT0gdW5kZWZpbmVkKXtcclxuICAgICAgICAgICAgc2NvcmUgPSAwO1xyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICBzY29yZSA9IHRoaXMuZGF0YS5ib2FyZE1vZGVsLnNlbGVjdGVkLnNjb3JlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBib251cyA9IDA7XHJcbiAgICAgICAgdGhpcy5kYXRhLmhpZ2hsaWdodGVkU2VjdGlvblNjb3JlLnRleHQgPSBcIkhpZ2hsaWdodGVkIFNjb3JlOiBcIiArIHNjb3JlO1xyXG4gICAgICAgIHRoaXMuZGF0YS5oaWdobGlnaHRlZFNlY3Rpb25TY29yZUJvbnVzLnRleHQgPSBcIlNpemUgQm9udXM6IFwiICsgYm9udXM7XHJcbiAgICAgICAgY29uc3QgY3VycmVudFRlYW0gPSB0aGlzLmRhdGEudGVhbUluZm8uY3VycmVudFRlYW07XHJcbiAgICAgICAgY29uc3QgbW92ZUxpbWl0ID0gdGhpcy5kYXRhLnRlYW1JbmZvLnNldHRpbmdzLnN0YW5kYXJkTW92ZUxpbWl0O1xyXG4gICAgICAgIC8qdGhpcy5tb3ZlQ291bnRlci5iZWdpbkZpbGwoY3VycmVudFRlYW0uY29sb3VyKTtcclxuICAgICAgICBsZXQgcmFkaXVzID0gTWF0aC5taW4odGhpcy5kYXRhLndpZHRoLCB0aGlzLmRhdGEuaGVpZ2h0KS8yO1xyXG4gICAgICAgIGxldCBjZW50ZXIgPSB7eDogdGhpcy5kYXRhLndpZHRoLzIsIHk6IDB9O1xyXG4gICAgICAgIGlmKGN1cnJlbnRUZWFtLm1vdmVzTGVmdCA9PSBtb3ZlTGltaXQpe1xyXG4gICAgICAgICAgICAvL2FyYyBkcmF3cyBpbiBkaXNjcmVhdCBzZWdtZW50cywgc28gbGVhdmVzIGEgZ2FwIGZvciBmdWxsIGNpcmNsZXNcclxuICAgICAgICAgICAgdGhpcy5tb3ZlQ291bnRlci5kcmF3Q2lyY2xlKGNlbnRlci54LCBjZW50ZXIueSwgcmFkaXVzKjIpO1xyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICBsZXQgcGVyY2VudE9mQ2lyY2xlID0gY3VycmVudFRlYW0ubW92ZXNMZWZ0L21vdmVMaW1pdDtcclxuICAgICAgICAgICAgbGV0IGVuZEFuZ2xlUmFkaWFucyA9IC1NYXRoLlBJKjIqcGVyY2VudE9mQ2lyY2xlO1xyXG4gICAgICAgICAgICBsZXQgdG9wT2Zmc2V0ID0gLU1hdGguUEkvMjtcclxuICAgICAgICAgICAgdGhpcy5tb3ZlQ291bnRlci5hcmMoY2VudGVyLngsIGNlbnRlci55LCByYWRpdXMsIHRvcE9mZnNldCwgdG9wT2Zmc2V0K2VuZEFuZ2xlUmFkaWFucywgdHJ1ZSwgMTI4KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5tb3ZlQ291bnRlci5lbmRGaWxsKCk7Ki9cclxuICAgIH1cclxufVxyXG4iLCJpbXBvcnQge3RlYW1zfSBmcm9tIFwiLi4vdGVhbUluZm8uanNcIjtcclxuaW1wb3J0ICogYXMgZ2VvbWV0cnkgZnJvbSBcIi4uL2dlb21ldHJ5LmpzXCI7XHJcbmltcG9ydCB7U2luZ2xlU2lkZX0gZnJvbSBcIi4vU2luZ2xlU2lkZS5qc1wiO1xyXG5cclxubGV0IGxpbmVTdHlsZSA9IHtcclxuICAgIHRoaWNrbmVzczogNSxcclxuICAgIGFscGhhOiAxXHJcbn07XHJcblxyXG5sZXQgaGV4U3R5bGUgPSB7XHJcbiAgICBjb2xvdXI6IDB4RkYzM2ZmXHJcbn07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gaGV4YWdvblNldHRpbmdzR3VpKGd1aSl7XHJcbiAgICBsZXQgZm9sZGVyID0gZ3VpLmFkZEZvbGRlcignaGV4YWdvbiBncmFwaGljcycpO1xyXG4gICAgZm9sZGVyLmFkZChsaW5lU3R5bGUsICd0aGlja25lc3MnLCAwLDIwKTtcclxuICAgIGZvbGRlci5hZGQobGluZVN0eWxlLCAnYWxwaGEnLCAwLCAxKTtcclxuICAgIGZvbGRlci5hZGRDb2xvcihoZXhTdHlsZSwgJ2NvbG91cicpO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgSGV4YWdvbiBleHRlbmRzIFBoYXNlci5TcHJpdGV7XHJcbiAgICAvKlxyXG4gICAgSGV4bW9kZWwgaXMgYW4gaW50ZXJmYWNlIHRoYXQgc3VwcGxpZXMgaW5mbyBvbiBob3cgdG8gcmVuZGVyXHJcbiAgICBJdCdzIEFQSSBpczpcclxuICAgICAgICBwcm9wZXJ0eTogZ3JpZENvcmRzIC0+IHJldHVybnMge3gsIHl9IG9iamVjdFxyXG4gICAgICAgIHByb3BvZXJ0eUwgc2lkZXMgLT4gcmV0dXJucyBbXSBvZiB0ZWFtIG51bWJlcnMsIHN0YXJ0aW5nIGZyb20gdG9wIHNpZGUsIGdvaW5nIGNsb2Nrd2lzZVxyXG4gICAgKi9cclxuICAgIGNvbnN0cnVjdG9yKGdhbWUsIHgsIHksIGJvYXJkVmlldywgaW5wdXREb3duQ2FsbGJhY2ssIG1vZGVsKXtcclxuICAgICAgICBzdXBlcihnYW1lLCB4LCB5KTtcclxuICAgICAgICB0aGlzLmRhdGEubW9kZWwgPSBtb2RlbDtcclxuICAgICAgICB0aGlzLmRhdGEuYm9hcmRWaWV3ID0gYm9hcmRWaWV3O1xyXG4gICAgICAgIHRoaXMuaW5wdXRFbmFibGVkID0gdHJ1ZTtcclxuICAgICAgICAvL3RoaXMgaXNuJ3QgcGl4bGUgcGVyZmVjdCwgc28gdXNlIGluIGNvbmp1Y3Rpb24gd2l0aCBwb2x5Z29uIGhpdCB0ZXN0P1xyXG4gICAgICAgIC8vYXNzdW1pbmcgYm94IGZvciB0aGlzIHRlc3RpIGlzIHRvbyBiaWcsIG5vdCB0b28gc21hbGxcclxuICAgICAgICB0aGlzLmV2ZW50cy5vbklucHV0RG93bi5hZGQoaW5wdXREb3duQ2FsbGJhY2ssIHRoaXMuZGF0YS5ib2FyZFZpZXcuZGF0YS5tb2RlbCk7XHJcblxyXG4gICAgICAgIHRoaXMuZGF0YS5ib2R5ID0gbmV3IFBoYXNlci5HcmFwaGljcyhnYW1lLCAwLCAwKTtcclxuICAgICAgICB0aGlzLmFkZENoaWxkKHRoaXMuZGF0YS5ib2R5KTtcclxuXHJcbiAgICAgICAgdGhpcy5kYXRhLnNpZGVzID0gW107XHJcblxyXG4gICAgICAgIGZvcihsZXQgc2lkZU1vZGVsIG9mIHRoaXMuZGF0YS5tb2RlbC5zaWRlcyl7XHJcbiAgICAgICAgICAgIGxldCBzaWRlVmlldyA9IG5ldyBTaW5nbGVTaWRlKGdhbWUsIDAsIDAsIGJvYXJkVmlldywgc2lkZU1vZGVsKTtcclxuICAgICAgICAgICAgdGhpcy5hZGRDaGlsZChzaWRlVmlldyk7XHJcbiAgICAgICAgICAgIHRoaXMuZGF0YS5zaWRlcy5wdXNoKHNpZGVWaWV3KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5kYXRhLnRleHQgPSBuZXcgUGhhc2VyLlRleHQoZ2FtZSwgLTEwLCAtMTAsIHRoaXMuZGF0YS5tb2RlbC5ncmlkQ29yZHMueCArIFwiLFwiICsgdGhpcy5kYXRhLm1vZGVsLmdyaWRDb3Jkcy55KTtcclxuICAgICAgICB0aGlzLmRhdGEudGV4dC5mb250ID0gXCJhcmlhbFwiO1xyXG4gICAgICAgIHRoaXMuZGF0YS50ZXh0LmZvbnRTaXplID0gODtcclxuICAgICAgICAvL2xvb2sgYXQgYWRkaW5nIHRoaXMgdG8gYSBncm91cC9pbWFnZSBjbGFzcyB3aXRoIHRoZSBncmFwaGljcyBvYmplY3RcclxuICAgICAgICB0aGlzLmFkZENoaWxkKHRoaXMuZGF0YS50ZXh0KTtcclxuICAgIH1cclxuXHJcbiAgICAvKmRlc3Ryb3koKXtcclxuICAgICAgICBsZXQgYm9hcmRNb2RlbCA9IHRoaXMuZGF0YS5ib2FyZFZpZXcuZGF0YS5tb2RlbDtcclxuICAgICAgICBsZXQgaGV4TW9kZWwgPSB0aGlzLmRhdGEubW9kZWw7XHJcbiAgICAgICAgLy9zdXBlci5kZXN0cm95KCk7XHJcbiAgICAgICAgYm9hcmRNb2RlbC5oZXhhZ29ucy5nZXQoaGV4TW9kZWwueCkuZGVsZXRlKGhleE1vZGVsLnkpO1xyXG4gICAgfSovXHJcblxyXG4gICAgcmVmcmVzaFBvc2l0b24oKXtcclxuICAgICAgICBsZXQgd29ybGRDb3JkcyA9IHRoaXMuZGF0YS5ib2FyZFZpZXcuY2FsY3VsYXRlV29ybGRDb3Jkcyh0aGlzLmRhdGEubW9kZWwuZ3JpZENvcmRzKTtcclxuICAgICAgICB0aGlzLnggPSB3b3JsZENvcmRzLng7XHJcbiAgICAgICAgdGhpcy55ID0gd29ybGRDb3Jkcy55O1xyXG4gICAgfVxyXG5cclxuICAgIHVwZGF0ZSgpe1xyXG4gICAgICAgIHRoaXMucmVmcmVzaFBvc2l0b24oKTtcclxuICAgICAgICAvL3RoaXMuZHJhd1NpZGVzKCk7XHJcbiAgICAgICAgdGhpcy5kcmF3SGV4YWdvbigpO1xyXG4gICAgICAgIGZvcihsZXQgc2lkZVZpZXcgb2YgdGhpcy5kYXRhLnNpZGVzKXtcclxuICAgICAgICAgICAgc2lkZVZpZXcudXBkYXRlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGRyYXdTaWRlcygpe1xyXG4gICAgICAgIHRoaXMuZGF0YS5zaWRlcy5jbGVhcigpO1xyXG4gICAgICAgIGxldCBoZXhQb2ludHMgPSBnZW9tZXRyeS5yZWxhdGl2ZVNjYWxlZEhleFBvaW50cyh0aGlzLmRhdGEuYm9hcmRWaWV3LmlubmVyU2lkZUxlbmd0aCk7XHJcbiAgICAgICAgZm9yKGxldCBbc2lkZU51bWJlcix0ZWFtXSBvZiB0aGlzLmRhdGEubW9kZWwuc2lkZXMuZW50cmllcygpKXtcclxuICAgICAgICAgICAgdGhpcy5kYXRhLnNpZGVzLmxpbmVTdHlsZShsaW5lU3R5bGUudGhpY2tuZXNzLCB0ZWFtLmNvbG91ciwgbGluZVN0eWxlLmFscGhhKTtcclxuICAgICAgICAgICAgbGV0IHN0YXJ0ID0gaGV4UG9pbnRzW3NpZGVOdW1iZXJdO1xyXG4gICAgICAgICAgICB0aGlzLmRhdGEuc2lkZXMubW92ZVRvKHN0YXJ0LngsIHN0YXJ0LnkpO1xyXG4gICAgICAgICAgICBsZXQgZW5kID0gaGV4UG9pbnRzWyhzaWRlTnVtYmVyKzEpJTZdO1xyXG4gICAgICAgICAgICB0aGlzLmRhdGEuc2lkZXMubGluZVRvKGVuZC54LCBlbmQueSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGRyYXdIZXhhZ29uKCl7XHJcbiAgICAgICAgdGhpcy5kYXRhLmJvZHkuY2xlYXIoKTtcclxuICAgICAgICBpZih0aGlzLmRhdGEubW9kZWwuY2FuUm90YXRlKXtcclxuICAgICAgICAgICAgdGhpcy5kYXRhLmJvZHkuYmVnaW5GaWxsKGhleFN0eWxlLmNvbG91cik7XHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIHRoaXMuZGF0YS5ib2R5LmJlZ2luRmlsbChoZXhTdHlsZS5jb2xvdXIsIDAuMjUpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5kYXRhLmJvZHkuZHJhd1BvbHlnb24oZ2VvbWV0cnkucmVsYXRpdmVTY2FsZWRIZXhQb2ludHModGhpcy5kYXRhLmJvYXJkVmlldy5pbm5lclNpZGVMZW5ndGgpKTtcclxuICAgICAgICB0aGlzLmRhdGEuYm9keS5lbmRGaWxsKCk7XHJcbiAgICAgICAgaWYodGhpcy5kYXRhLm1vZGVsLmlzSG9tZSl7XHJcbiAgICAgICAgICAgIHRoaXMuZGF0YS5ib2R5LmJlZ2luRmlsbCgnMHgwMDY2ZmYnKTtcclxuICAgICAgICAgICAgdGhpcy5kYXRhLmJvZHkuZHJhd0NpcmNsZSgwLDAsIDIwKTtcclxuICAgICAgICAgICAgdGhpcy5kYXRhLmJvZHkuZW5kRmlsbCgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG4iXX0=
