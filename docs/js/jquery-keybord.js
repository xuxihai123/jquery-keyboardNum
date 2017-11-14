/**
 * jquery-keybord 
 * version: v0.0.1 
 * repo: https://github.com/x373241884y/jquery-keyboardNum 
 * build: 2017-11-14 14:17:21
 */
;(function (window, $) {
    var MODE_REGEXP = /^(\d+)(\.(\d+))?$/;
    var NUMBER_REGEXP = /^\d+(\.\d*)?$/;
    var isTouch = ("ontouchstart" in document.documentElement) ? true : false;

    var defaults = {
        intLength: 12, //整数位数
        dotLength: 2, //小数位数
        cursorTick: 800, //光标闪烁频率
        onChangeAfter: $.noop, //渲染值后的一个回调
        validateHook: undefined, //校验成功后才会渲染值
        mode: undefined //like 8.2 ==> intLength:8,dotLength:2
    };
    var keybordEnv = {
        $intervalId: undefined,
        $keybord: undefined,
        $cursor: undefined,
        $enable: false,
        setPubKeybord:function () {
            keybordEnv.$keybord = $('' +  //jquery Object
                '<div class="keyboard-container" style="display: none">' +
                '   <div class="keyboard-arrow"><i class="bottom-arrow1"></i><i class="bottom-arrow2"></i></div>' +
                '   <table class="keyboard-table">' +
                '       <tbody>' +
                '           <tr><td key="1">1</td><td key="2">2</td><td key="3">3</td></tr>' +
                '           <tr><td key="4">4</td><td key="5">5</td><td key="6">6</td></tr>' +
                '           <tr><td key="7">7</td><td key="8">8</td><td key="9">9</td></tr>' +
                '           <tr><td key="." class="special">.</td><td key="0">0</td><td key="delete" class="special">删除</td></tr>' +
                '       </tbody>' +
                '   </table>' +
                '</div>');
            $(document.body).append(keybordEnv.$keybord);
        },
        setPubCursor:function () {
            keybordEnv.$cursor = $('<div class="keyboard-cursor" style="display: none"></div>');
            $(document.body).append(keybordEnv.$cursor);
        },
        refreshCursor:function (tickTime) {
            keybordEnv.$intervalId && clearInterval(keybordEnv.$intervalId);
            keybordEnv.$intervalId = setInterval(function () {
                if (keybordEnv.$cursor.css('display') == "block") {
                    keybordEnv.$cursor.hide();
                } else {
                    keybordEnv.$cursor.show();
                }
            }, tickTime);
        },
        setCursorPos:function (cssStyle) {
            keybordEnv.$cursor.css(cssStyle);
        },
        bindPbEvent:function () {
            var $keybord = keybordEnv.$keybord;
            $keybord.delegate('.keyboard-arrow', 'click', function (event) { //关闭键盘
                keybordEnv.switchKbStatus(false);
            });
            $keybord.delegate('.keyboard-table [key]', isTouch ? "touchstart" : "mousedown", function (event) {
                $(this).addClass('pressed');
                event.preventDefault(); //resolve IOS click闪烁
            });
            $keybord.delegate('.keyboard-table [key]', isTouch ? "touchend" : "mouseup", function (event) {
                $(this).removeClass('pressed');
                var keyValue = $(this).attr('key');
                keybordEnv.$instance && $(keybordEnv.$instance.$input).trigger('keypress.keyboard', keyValue);
            });
        },
        switchKbStatus:function (flag) {
            keybordEnv.$keybord[flag ? 'show' : 'hide']();
            keybordEnv.$keybord.enable = !!flag;
            keybordEnv.$instance && $(keybordEnv.$instance.$input).trigger((flag ? 'open' : 'close') + '.keyboard');
        },
        switchCurStatus:function (flag) {
            if(flag){
                keybordEnv.$cursor.show();
                keybordEnv.$cursor.enable=true;
            }else{
                keybordEnv.$cursor.hide();
                keybordEnv.$cursor.enable=false;
                clearInterval(keybordEnv.$intervalId);
            }
        }
    };

    function KeybordInput(element, options) {
        var self = this;
        self.$input = element; //输入框  DOM Object
        self.$cursorPosition = 0;
        var option = self.$options = $.extend({}, defaults, options);

        if (option.mode && MODE_REGEXP.test(option.mode)) {
            self.$options.intLength = parseInt(RegExp.$1, 10);
            self.$options.dotLength = RegExp.$2 && parseInt(RegExp.$3, 10);
        }

        if (!keybordEnv.$enable) {
            keybordEnv.setPubKeybord(); //一个键盘
            keybordEnv.setPubCursor(); //一个光标
            keybordEnv.bindPbEvent();
            keybordEnv.$enable = true;
        }
        $(element).attr('readonly', 'true');
        this.$bindEvent();
    }
    KeybordInput.prototype.$setCursorPos = function () {
        var $inputEl = $(this.$input), cursorPos = this.$cursorPosition;
        var offset = $inputEl.offset(), textWidth = 0;
        var viewValue = $inputEl.val(), leftString, textSize;
        if (cursorPos != 0) {
            leftString = viewValue.slice(0, cursorPos);
            textSize = this.$getTextSize(leftString);
            textWidth = textSize.width;
        } else {
            textSize = this.$getTextSize('1234567890');
            textWidth = 0;
        }
        var borderLeft = parseFloat($inputEl.css('border-left'));
        var paddingLeft = parseFloat($inputEl.css('padding-left'));
        var borderTop = parseFloat($inputEl.css('border-top'));
        var paddingTop = parseFloat($inputEl.css('padding-top'));
        var inputContentHeight = $inputEl[0].clientHeight;
        var offsetY = (inputContentHeight - textSize.fontSize) / 2;

        document.activeElement.blur(); //IOS..
        $inputEl[0].setSelectionRange(cursorPos, cursorPos);
        console.log('setCurPos-->top: (input)[top:' + offset.top + ' +border-top:' + borderTop + ' +padding-top:' + paddingTop + ',offsetY:' + offsetY);
        console.log('setCurPos-->left:(input)[left:' + offset.left + ' +border-left:' + borderLeft + ' +padding-left:' + paddingLeft + '] +textWidth:' + textWidth);
        console.log(textSize.height);
        keybordEnv.setCursorPos({
            top: (offset.top + borderTop + paddingTop + offsetY) + 'px',
            left: (offset.left + borderLeft + paddingLeft + textWidth) + 'px',
            height: textSize.fontSize + 'px'
        });
    };
    KeybordInput.prototype.$getCursorPos = function () {//获得input光标位置
        return this.$input.selectionStart || 0;
    };
    KeybordInput.prototype.$getTextSize = function (str) {
        var $inputEl = $(this.$input);
        var fontSize = $inputEl.css('font-size');
        if (!this.$baseTextSpan) {
            var fontFamily = $inputEl.css('font-family');
            this.$baseTextSpan = $('<span></span>');
            $inputEl.parent().append(this.$baseTextSpan);
            this.$baseTextSpan.css({
                position: "absolute",
                visibility: "hidden",
                whiteSpace: "nowrap",
                fontFamily: fontFamily,
                fontSize: fontSize,
            });
        }
        this.$baseTextSpan.text(str);
        return {
            width: this.$baseTextSpan[0].offsetWidth,
            height: this.$baseTextSpan[0].offsetHeight,
            fontSize:parseFloat(fontSize)
        };
    };
    KeybordInput.prototype.$render = function (viewValue) {
        this.$viewValue = viewValue;
        this.$input.value = viewValue;
        var onchangeCall = this.$options.onChangeAfter;
        onchangeCall.apply(this, [viewValue]);
    };
    KeybordInput.prototype.$destory = function () {
        var $inputEl = $(this.$input);
        $inputEl.unbind('click.keyboard');
        $inputEl.unbind('close.keyboard');
        $inputEl.unbind('keypress.keyboard');
    };
    KeybordInput.prototype.$validate = function (inputValue) {
        var options = this.$options, result = true;
        if (typeof options.validateHook == 'function') { //使用自定义的校验规则
            return options.validateHook.apply(this, [inputValue]);
        }
        if (inputValue == '') {
            return result;
        }
        var index = inputValue.indexOf('.');
        if (NUMBER_REGEXP.test(inputValue)) { //正则校验后不可能有2个以上的点
            if (index > 0) {
                var intString = inputValue.substring(0, index);
                var dotString = inputValue.substring(index + 1, inputValue.length);
                if (dotString.length > options.dotLength) {// Render the last valid input in the field
                    result = false;
                } else if (intString.length > options.intLength) {
                    result = false;
                }
            } else if (inputValue.length > options.intLength) {// Render the last valid input in the field
                result = false;
            }
        } else {
            result = false;
        }
        return result;
    };
    KeybordInput.prototype.$handleKeyValue = function (keyValue) {
        var inputValue = this.$input.value, newValue;
        if (keyValue === 'delete' && this.$cursorPosition > 0) {
            if (inputValue && inputValue.length > 0) {
                newValue = inputValue.substr(0, this.$cursorPosition - 1) + inputValue.substr(this.$cursorPosition, inputValue.length);
                if (this.$validate(newValue)) {
                    this.$render(newValue);
                    this.$cursorPosition--;//光标前移
                    this.$setCursorPos();
                }
            }
        } else {
            if (inputValue && inputValue.length > 0) {
                newValue = inputValue.substr(0, this.$cursorPosition) + keyValue + inputValue.substr(this.$cursorPosition, inputValue.length);
            } else {
                newValue = keyValue;
            }
            if (this.$validate(newValue)) {
                this.$render(newValue);
                this.$cursorPosition++;//光标后移
                this.$setCursorPos();
            }
        }
    };
    KeybordInput.prototype.$bindEvent = function () {
        var self = this;
        var $inputEl = $(this.$input);
        $inputEl.bind('click.keyboard', function (event) {
            keybordEnv.$instance = self;//这样可以知道只会激活一个KeybordInput对象
            keybordEnv.switchKbStatus(true);
            keybordEnv.switchCurStatus(true);
            keybordEnv.refreshCursor(self.$options.cursorTick);
            self.$cursorPosition = self.$getCursorPos();
            self.$setCursorPos();
        });
        $inputEl.bind('keypress.keyboard', function (event, keyValue) {
            self.$handleKeyValue(keyValue);
        });
        $inputEl.bind('close.keyboard', function (event) {
            keybordEnv.switchCurStatus(false);
        });
    };

    $.fn.keyboardNum = function (options) {
        var dataKey = 'keyboard_input_num';
        return this.each(function () {
            var inputElement = $(this),
                instance = inputElement.data(dataKey);
            if (instance && instance.$destory) {
                instance.$destory();
                inputElement.removeData(dataKey);
            }
            instance = new KeybordInput(this, options);
            inputElement.data(dataKey, instance);
        });
    }


})(window, window.jQuery);