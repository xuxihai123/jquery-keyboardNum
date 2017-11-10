;(function (window, $) {
    var MODE_REGEXP = /^(\d+)(\.(\d+))?$/;
    var NUMBER_REGEXP = /^\d+(\.\d*)?$/;
    var isTouch = ("ontouchstart" in document.documentElement) ? true : false;

    var defaults = {
        intLength: 12, //整数位数
        dotLength: 2, //小数位数
        cursorTick:800, //光标闪烁频率
        onChangeAfter:$.noop, //渲染值后的一个回调
        validateHook:undefined, //校验成功后才会渲染值
        mode:undefined //like 8.2 ==> intLength:8,dotLength:2
    };

    function KeybordInput(element, options) {
        var self = this;
        self.$input = element; //输入框  DOM Object
        self.$inputBox = {};//input输入盒子模型
        var option = self.$options = $.extend({}, defaults, options);

        if (option.mode && MODE_REGEXP.test(option.mode)) {
            self.$options.intLength = parseInt(RegExp.$1, 10);
            self.$options.dotLength = RegExp.$2 && parseInt(RegExp.$3, 10);
        }
        //模拟光标
        this.$cursor = $('<div class="keyboard-cursor"></div>'); //jquery Object
        this.$cursorPosition = 0;
        //键盘
        this.$keyboardDiv = $('' +  //jquery Object
            '<div class="keyboard-container">' +
            '   <div class="keyboard-arrow"><i class="bottom-arrow1"></i><i class="bottom-arrow2"></i></div>' +
            '   <table class="keyboard-table">' +
            '       <tbody>' +
            '           <tr><td>1</td><td>2</td><td>3</td></tr>' +
            '           <tr><td>4</td><td>5</td><td>6</td></tr>' +
            '           <tr><td>7</td><td>8</td><td>9</td></tr>' +
            '           <tr><td class="special">.</td><td>0</td><td class="special">删除</td></tr>' +
            '       </tbody>' +
            '   </table>' +
            '</div>');

        $(element).attr('readonly', 'true');
        document.activeElement.blur();
        $(document.body).append(this.$cursor);
        $(document.body).append(this.$keyboardDiv);

        this.resetPos();
        this._bindEvent();
    }

    KeybordInput.prototype.resetPos = function () { //重新定位输入框左上角原点的位置
        var $inputEl = $(this.$input);
        var offset = $inputEl.offset();
        this.$inputBox.left = offset.left;
        this.$inputBox.borderLeft = parseFloat($inputEl.css('border-left'));
        this.$inputBox.paddingLeft = parseFloat($inputEl.css('padding-left'));
        this.$inputBox.top = offset.top;
        this.$inputBox.borderTop = parseFloat($inputEl.css('border-top'));
        this.$inputBox.paddingTop = parseFloat($inputEl.css('padding-top'));
        var textSize = this.getTextSize('1234567890');
        var inputContentHeight = $inputEl[0].clientHeight;
        var offsetY = (inputContentHeight- textSize.height)/2;
        console.log(offsetY);
        this.$cursor.css({
            height: textSize.height  + 'px',
            top: (this.$inputBox.top  + this.$inputBox.borderTop + this.$inputBox.paddingTop+offsetY) + 'px'
        });
    };
    KeybordInput.prototype.setCursorPos = function () {
        var cursorPos = this.$cursorPosition;
        var inputEl = this.$input;
        var offset = 0, viewValue = inputEl.value, leftString,textSize;
        var $inputBox = this.$inputBox;
        document.activeElement.blur();
        inputEl.setSelectionRange(cursorPos, cursorPos);
        if (cursorPos == 0) {
            offset = 0;
        } else {
            leftString = viewValue.slice(0, cursorPos);
            textSize = this.getTextSize(leftString);
            offset = textSize.width;
        }
        console.log('setCurPos-->x: left:' + $inputBox.left + ',border-left:' + $inputBox.borderLeft + ',padding-left:' + $inputBox.paddingLeft + ',offset:' + offset);
        this.$cursor.css('left', ($inputBox.left  + $inputBox.borderLeft + $inputBox.paddingLeft + offset) + 'px');
    };
    KeybordInput.prototype.getCursorPos = function () {//获得input光标位置
        var oTxt1 = this.$input;
        var cursurPosition = 0;
        if (oTxt1.selectionStart) {
            cursurPosition = oTxt1.selectionStart;
        }
        return cursurPosition;
    };
    KeybordInput.prototype.enableCursor = function () {
        var tick = this.$options.cursorTick;
        var $cursor = this.$cursor;
        if(this.$clearInterval){
            this.disableCursor();
        }
        this.$clearInterval = setInterval(function flicker() {
            if ($cursor.css('display') == "block") {
                $cursor.hide();
            } else {
                $cursor.show();
            }
        }, tick);
    };
    KeybordInput.prototype.disableCursor = function () {
        clearInterval(this.$clearInterval);
        this.$clearInterval = null;
    };
    KeybordInput.prototype.getTextSize = function (str) {
        var $inputEl = $(this.$input);
        if (!this.$baseTextSpan) {
            var fontSize = $inputEl.css('font-size');
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
            width:this.$baseTextSpan[0].offsetWidth,
            height:this.$baseTextSpan[0].offsetHeight
        };
    };
    KeybordInput.prototype.enable = function () {
        this.$cursor.show();
        this.$keyboardDiv.show();
        this.$keyboardDiv.enable = true;
    };
    KeybordInput.prototype.disable = function () {
        this.$cursor.hide();
        this.$keyboardDiv.hide();
        this.$keyboardDiv.enable = false;
    };
    KeybordInput.prototype._render = function (viewValue) {
        this.$viewValue = viewValue;
        this.$input.value = viewValue;
        var onchangeCall = this.$options.onChangeAfter;
        onchangeCall.apply(this, [viewValue]);
    };
    KeybordInput.prototype._destory = function () {
        var $inputEl = $(this.$input);
        $inputEl.unbind('click.keyboard');
        $(document.body).unbind('disable.keyboard');
        this.$keyboardDiv.unbind('.keyboard-table td',isTouch ? "touchstart" : "mousedown");
        this.$keyboardDiv.unbind('.keyboard-table td',isTouch ? "touchend" : "mouseup");
        this.$cursor.remove();
        this.$keyboardDiv.remove();
    };
    KeybordInput.prototype._validate = function (inputValue) {
        var options = this.$options, result = true;
        if(typeof options.validateHook=='function'){ //使用自定义的校验规则
            return options.validateHook.apply(this, [inputValue]);
        }
        if(inputValue==''){
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
        }else{
            result = false;
        }
        return result;
    };
    KeybordInput.prototype._handleKeyValue = function (keyValue) {
        var inputValue = this.$input.value, newValue;
        if (keyValue === '删除'&&this.$cursorPosition>0) {
            if (inputValue && inputValue.length > 0) {
                newValue = inputValue.substr(0, this.$cursorPosition - 1) + inputValue.substr(this.$cursorPosition, inputValue.length);
                if (this._validate(newValue)) {
                    this._render(newValue);
                    this.$cursorPosition--;//光标前移
                    this.setCursorPos();
                }
            }
        } else {
            if (inputValue && inputValue.length > 0) {
                newValue = inputValue.substr(0, this.$cursorPosition) + keyValue + inputValue.substr(this.$cursorPosition, inputValue.length);
            } else {
                newValue = keyValue;
            }
            if (this._validate(newValue)) {
                this._render(newValue);
                this.$cursorPosition++;//光标后移
                this.setCursorPos();
            }
        }
    };
    KeybordInput.prototype._bindEvent = function () {
        var self = this;
        var $inputEl = $(this.$input);
        var keyboard = this.$keyboardDiv;
        $inputEl.bind('click.keyboard', function (event) {
            if (!self.$keyboardDiv.enable) {
                $(document.body).trigger('disable.keyboard');
                self.enable();
            }
            self.$cursorPosition = self.getCursorPos();
            self.setCursorPos();
            self.enableCursor();
        });
        $(document.body).bind('disable.keyboard', function (event) {
            self.disable();
            self.disableCursor();
        });
        keyboard.delegate('.keyboard-arrow', 'click', function (event) { //关闭键盘
            self.$cursor.hide();
            self.$keyboardDiv.hide();
            self.$keyboardDiv.enable = false;
            self.disableCursor();
        });
        keyboard.delegate('.keyboard-table td', isTouch ? "touchstart" : "mousedown", function (event) {
            $(this).addClass('pressed');
        });
        keyboard.delegate('.keyboard-table td', isTouch ? "touchend" : "mouseup", function () {
            $(this).removeClass('pressed');
            var keyValue = $(this).text();
            self._handleKeyValue(keyValue);
        });
    };

    $.fn.keyboardNum = function (options) {
        var dataKey = '_keyboard_input';
        return this.each(function () {
            var inputElement = $(this),
                instance = inputElement.data(dataKey);
            if (instance && instance._destory) {
                instance._destory();
                inputElement.removeData(dataKey);
            }
            instance = new KeybordInput(this, options);
            inputElement.data(dataKey, instance);
        });
    }


})(window, window.jQuery);