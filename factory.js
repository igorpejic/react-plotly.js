'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.default = plotComponentFactory;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

var _fastIsnumeric = require('fast-isnumeric');

var _fastIsnumeric2 = _interopRequireDefault(_fastIsnumeric);

var _objectAssign = require('object-assign');

var _objectAssign2 = _interopRequireDefault(_objectAssign);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

// The naming convention is:
//   - events are attached as `'plotly_' + eventName.toLowerCase()`
//   - react props are `'on' + eventName`
var eventNames = ['AfterExport', 'AfterPlot', 'Animated', 'AnimatingFrame', 'AnimationInterrupted', 'AutoSize', 'BeforeExport', 'ButtonClicked', 'Click', 'ClickAnnotation', 'Deselect', 'DoubleClick', 'Framework', 'Hover', 'Relayout', 'Restyle', 'Redraw', 'Selected', 'Selecting', 'SliderChange', 'SliderEnd', 'SliderStart', 'Transitioning', 'TransitionInterrupted', 'Unhover'];

var updateEvents = ['plotly_restyle', 'plotly_redraw', 'plotly_relayout', 'plotly_doubleclick', 'plotly_animated'];

// Check if a window is available since SSR (server-side rendering)
// breaks unnecessarily if you try to use it server-side.
var isBrowser = typeof window !== 'undefined';

function plotComponentFactory(Plotly) {
  var hasReactAPIMethod = !!Plotly.react;

  var PlotlyComponent = function (_Component) {
    _inherits(PlotlyComponent, _Component);

    function PlotlyComponent(props) {
      _classCallCheck(this, PlotlyComponent);

      var _this = _possibleConstructorReturn(this, (PlotlyComponent.__proto__ || Object.getPrototypeOf(PlotlyComponent)).call(this, props));

      _this.p = Promise.resolve();
      _this.fitHandler = null;
      _this.resizeHandler = null;
      _this.handlers = {};
      _this.datarevision = null;

      _this.syncWindowResize = _this.syncWindowResize.bind(_this);
      _this.syncEventHandlers = _this.syncEventHandlers.bind(_this);
      _this.attachUpdateEvents = _this.attachUpdateEvents.bind(_this);
      _this.getRef = _this.getRef.bind(_this);
      _this.handleUpdate = _this.handleUpdate.bind(_this);
      _this.handleUpdateWithProps = _this.handleUpdateWithProps.bind(_this);
      return _this;
    }

    _createClass(PlotlyComponent, [{
      key: 'shouldComponentUpdate',
      value: function shouldComponentUpdate(nextProps) {
        return nextProps.revision === void 0 || nextProps.revision !== this.props.revision;
      }
    }, {
      key: 'componentDidMount',
      value: function componentDidMount() {
        var _this2 = this;

        this.p = this.p.then(function () {
          _this2.datarevision = _this2.props.layout ? _this2.props.layout.datarevision : null;
          return Plotly.newPlot(_this2.el, {
            data: _this2.props.data,
            layout: _this2.resizedLayoutIfFit(_this2.props.layout),
            config: _this2.props.config,
            frames: _this2.props.frames
          });
        }).then(function () {
          return _this2.syncWindowResize(null, false);
        }).then(this.syncEventHandlers).then(this.attachUpdateEvents).then(function () {
          return _this2.props.onInitialized && _this2.props.onInitialized(_this2.el);
        }).catch(function (e) {
          console.error('Error while plotting:', e);
          return _this2.props.onError && _this2.props.onError();
        });
      }
    }, {
      key: 'componentWillUpdate',
      value: function componentWillUpdate(nextProps) {
        var _this3 = this;

        this.p = this.p.then(function () {
          if (hasReactAPIMethod && nextProps.layout.datarevision === _this3.datarevision) {
            return Plotly.react(_this3.el, {
              data: nextProps.data,
              layout: _this3.resizedLayoutIfFit(nextProps.layout),
              config: nextProps.config,
              frames: nextProps.frames
            });
          } else {
            _this3.handlers = {};
            return Plotly.newPlot(_this3.el, {
              data: nextProps.data,
              layout: _this3.resizedLayoutIfFit(nextProps.layout),
              config: nextProps.config,
              frames: nextProps.frames
            });
          }
        }).then(function () {
          return _this3.syncEventHandlers(nextProps);
        }).then(function () {
          return _this3.syncWindowResize(nextProps);
        }).then(function () {
          if (!hasReactAPIMethod) _this3.attachUpdateEvents();
        }).then(function () {
          return _this3.handleUpdateWithProps(nextProps);
        }).catch(function (err) {
          console.error('Error while plotting:', err);
          _this3.props.onError && _this3.props.onError(err);
        });
      }
    }, {
      key: 'componentWillUnmount',
      value: function componentWillUnmount() {
        if (this.props.onPurge) {
          this.props.onPurge(this.el);
        }
        if (this.fitHandler && isBrowser) {
          window.removeEventListener('resize', this.fitHandler);
          this.fitHandler = null;
        }
        if (this.resizeHandler && isBrowser) {
          window.removeEventListener('resize', this.resizeHandler);
          this.resizeHandler = null;
        }

        this.removeUpdateEvents();

        Plotly.purge(this.el);
      }
    }, {
      key: 'attachUpdateEvents',
      value: function attachUpdateEvents() {
        if (!this.el || !this.el.removeListener) return;

        for (var i = 0; i < updateEvents.length; i++) {
          this.el.on(updateEvents[i], this.handleUpdate);
        }
      }
    }, {
      key: 'removeUpdateEvents',
      value: function removeUpdateEvents() {
        if (!this.el || !this.el.removeListener) return;

        for (var i = 0; i < updateEvents.length; i++) {
          this.el.removeListener(updateEvents[i], this.handleUpdate);
        }
      }
    }, {
      key: 'handleUpdate',
      value: function handleUpdate() {
        this.handleUpdateWithProps(this.props);
      }
    }, {
      key: 'handleUpdateWithProps',
      value: function handleUpdateWithProps(props) {
        if (props.onUpdate && typeof props.onUpdate === 'function') {
          props.onUpdate(this.el);
        }
      }
    }, {
      key: 'syncWindowResize',
      value: function syncWindowResize(props, invoke) {
        var _this4 = this;

        props = props || this.props;
        if (!isBrowser) return;

        if (props.fit && !this.fitHandler) {
          this.fitHandler = function () {
            return Plotly.relayout(_this4.el, _this4.getSize());
          };
          window.addEventListener('resize', this.fitHandler);

          if (invoke) return this.fitHandler();
        } else if (!props.fit && this.fitHandler) {
          window.removeEventListener('resize', this.fitHandler);
          this.fitHandler = null;
        }

        if (props.useResizeHandler && !this.resizeHandler) {
          this.resizeHandler = function () {
            return Plotly.Plots.resize(_this4.el);
          };
          window.addEventListener('resize', this.resizeHandler);
        } else if (!props.useResizeHandler && this.resizeHandler) {
          window.removeEventListener('resize', this.resizeHandler);
          this.resizeHandler = null;
        }
      }
    }, {
      key: 'getRef',
      value: function getRef(el) {
        this.el = el;

        if (this.props.debug && isBrowser) {
          window.gd = this.el;
        }
      }

      // Attach and remove event handlers as they're added or removed from props:

    }, {
      key: 'syncEventHandlers',
      value: function syncEventHandlers(props) {
        // Allow use of nextProps if passed explicitly:
        props = props || this.props;

        for (var i = 0; i < eventNames.length; i++) {
          var eventName = eventNames[i];
          var prop = props['on' + eventName];
          var hasHandler = !!this.handlers[eventName];

          if (prop && !hasHandler) {
            this.handlers[eventName] = prop;
            this.el.on('plotly_' + eventName.toLowerCase(), this.handlers[eventName]);
          } else if (!prop && hasHandler) {
            // Needs to be removed:
            this.el.removeListener('plotly_' + eventName.toLowerCase(), this.handlers[eventName]);
            delete this.handlers[eventName];
          }
        }
      }
    }, {
      key: 'resizedLayoutIfFit',
      value: function resizedLayoutIfFit(layout) {
        if (!this.props.fit) {
          return layout;
        }
        return (0, _objectAssign2.default)({}, layout, this.getSize(layout));
      }
    }, {
      key: 'getSize',
      value: function getSize(layout) {
        var rect = void 0;
        layout = layout || this.props.layout;
        var layoutWidth = layout ? layout.width : null;
        var layoutHeight = layout ? layout.height : null;
        var hasWidth = (0, _fastIsnumeric2.default)(layoutWidth);
        var hasHeight = (0, _fastIsnumeric2.default)(layoutHeight);

        if (!hasWidth || !hasHeight) {
          rect = this.el.parentElement.getBoundingClientRect();
        }

        return {
          width: hasWidth ? parseInt(layoutWidth) : rect.width,
          height: hasHeight ? parseInt(layoutHeight) : rect.height
        };
      }
    }, {
      key: 'render',
      value: function render() {
        return _react2.default.createElement('div', {
          style: this.props.style,
          ref: this.getRef,
          className: this.props.className
        });
      }
    }]);

    return PlotlyComponent;
  }(_react.Component);

  PlotlyComponent.propTypes = {
    fit: _propTypes2.default.bool,
    data: _propTypes2.default.arrayOf(_propTypes2.default.object),
    config: _propTypes2.default.object,
    layout: _propTypes2.default.object,
    frames: _propTypes2.default.arrayOf(_propTypes2.default.object),
    revision: _propTypes2.default.number,
    onInitialized: _propTypes2.default.func,
    onPurge: _propTypes2.default.func,
    onError: _propTypes2.default.func,
    onUpdate: _propTypes2.default.func,
    debug: _propTypes2.default.bool,
    style: _propTypes2.default.object,
    className: _propTypes2.default.string,
    useResizeHandler: _propTypes2.default.bool
  };

  for (var i = 0; i < eventNames.length; i++) {
    PlotlyComponent.propTypes['on' + eventNames[i]] = _propTypes2.default.func;
  }

  PlotlyComponent.defaultProps = {
    debug: false,
    fit: false,
    useResizeHandler: false,
    data: [],
    style: { position: 'relative', display: 'inline-block' }
  };

  return PlotlyComponent;
}
module.exports = exports['default'];
//# sourceMappingURL=factory.js.map