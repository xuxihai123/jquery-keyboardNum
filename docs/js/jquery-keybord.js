;(function (window, $) {
    var MODE_REGEXP = /^(\d+)(\.(\d+))?$/;
    var NUMBER_REGEXP = /^\d+(\.\d*)?$/;

    var defaults = {
        intLength: 12,
        dotLength: 2,
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
            '       <tbody><tr><td>1</td><td>2</td><td>3</td></tr><tr><td>4</td><td>5</td><td>6</td></tr><tr><td>7</td><td>8</td><td>9</td></tr><tr><td class="special">.</td><td>0</td><td class="special">删除</td></tr></tbody>' +
            '   </table>' +
            '</div>');

        $(element).attr('readonly', 'true');
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
        this.$inputBox.marginLeft = parseFloat($inputEl.css('margin-left'));
        this.$inputBox.paddingLeft = parseFloat($inputEl.css('padding-left'));
        this.$inputBox.top = offset.top;
        this.$inputBox.borderTop = parseFloat($inputEl.css('border-top'));
        this.$inputBox.marginTop = parseFloat($inputEl.css('margin-top'));
        this.$inputBox.paddingTop = parseFloat($inputEl.css('padding-top'));
        var borderBottom = parseFloat($inputEl.css('border-bottom'));
        var marginBottom = parseFloat($inputEl.css('margin-bottom'));
        var paddingBottom = parseFloat($inputEl.css('padding-bottom'));
        this.$cursor.css({
            height: ($inputEl[0].offsetHeight - borderBottom - paddingBottom - marginBottom - (this.$inputBox.marginTop + this.$inputBox.borderTop + this.$inputBox.paddingTop)) + 'px',
            top: (this.$inputBox.top + this.$inputBox.marginTop + this.$inputBox.borderTop + this.$inputBox.paddingTop) + 'px'
        });
    };
    KeybordInput.prototype.getInputCursorPos = function (locale) {//获得input光标位置
        var oTxt1 = this.$input;
        var cursurPosition = 0;
        if (oTxt1.selectionStart || oTxt1.selectionEnd) {
            if (locale == "start") {
                cursurPosition = oTxt1.selectionStart;
            } else if (locale == "end") {
                cursurPosition = oTxt1.selectionEnd;
            }
        }
        return cursurPosition;
    };
    KeybordInput.prototype.getTextWidth = function (str) {
        var $inputEl = $(this.$input);
        if (!this.$baseTextSpan) {
            var fontSize = $inputEl.css('font-size');
            var fontFamily = $inputEl.css('font-family');
            this.$baseTextSpan = $('<span></span>');
            $inputEl.parent().append(this.$baseTextSpan);
            this.$baseTextSpan.css({
                visibility: "hidden",
                whiteSpace: "nowrap",
                fontFamily: fontFamily,
                fontSize: fontSize,
            });
        }
        this.$baseTextSpan.text(str);
        return this.$baseTextSpan[0].offsetWidth;
    };
    KeybordInput.prototype.render = function (viewValue) {
        this.$viewValue = viewValue;
        this.$input.value = viewValue;
    };
    KeybordInput.prototype.setCursorPos = function () {
        var cursorPos = this.$cursorPosition;
        var inputEl = this.$input;
        var offset = 0, viewValue = inputEl.value, leftString;
        var $inputBox = this.$inputBox;

        inputEl.setSelectionRange(cursorPos, cursorPos);
        if (cursorPos == 0) {
            offset = 0;
        } else {
            leftString = viewValue.slice(0, cursorPos);
            offset = this.getTextWidth(leftString);
        }
        console.log('setCurPos-->x: left:' + $inputBox.left + ',margin-left:' + $inputBox.marginLeft + ',border-left:' + $inputBox.borderLeft + ',padding-left:' + $inputBox.paddingLeft + ',offset:' + offset);
        this.$cursor.css('left', ($inputBox.left + $inputBox.marginLeft + $inputBox.borderLeft + $inputBox.paddingLeft + offset) + 'px');
    };
    KeybordInput.prototype._destory = function () {
        console.log('destory...');
    };
    KeybordInput.prototype.validateValue = function (inputValue) {
        var options = this.$options, result = true;
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
        }
        return result;
    };
    KeybordInput.prototype._bindEvent = function () {
        var mobile = typeof orientation !== 'undefined';
        var self = this;
        var $inputEl = $(this.$input);
        var keyboard = this.$keyboardDiv;
        $inputEl.bind('click.keyboard', function (event) {
            if (!self.$keyboardDiv.enable) {
                self.$cursor.show();
                self.$keyboardDiv.show();
                self.$keyboardDiv.enable = true;
            }
            self.$cursorPosition = self.getInputCursorPos('start');
            self.setCursorPos();
        });
        if (mobile) {

        } else {
            keyboard.delegate('.keyboard-arrow', 'click', function (event) { //关闭键盘
                self.$cursor.hide();
                self.$keyboardDiv.hide();
                self.$keyboardDiv.enable = false;
            });
            keyboard.delegate('.keyboard-table td', 'click', function (event) {//功能和数字键
                var value = $(this).text(), inputValue = $inputEl.val(), newValue;
                if (value === '删除') {
                    if (inputValue && inputValue.length > 0) {
                        newValue = inputValue.substr(0, self.$cursorPosition - 1) + inputValue.substr(self.$cursorPosition, inputValue.length);
                        if (self.validateValue(newValue)) {
                            self.render(newValue);
                            self.$cursorPosition--;//光标前移
                            self.setCursorPos();
                        }
                    }
                } else {
                    if (inputValue && inputValue.length > 0) {
                        newValue = inputValue.substr(0, self.$cursorPosition) + value + inputValue.substr(self.$cursorPosition, inputValue.length);
                    } else {
                        newValue = value;
                    }
                    if (self.validateValue(newValue)) {
                        self.render(newValue);
                        self.$cursorPosition++;//光标后移
                        self.setCursorPos();
                    }
                }
            });
        }
        // // 监听 orientation changes
        // window.addEventListener("orientationchange", function (event) {
        //     console.log('resetPost...');
        //     textSize = getTextSize(self);
        //     letterSpace = textSize.width;
        //     dotSpace = letterSpace / 2;
        //     resetPos(self);
        // }, false);
    };
    KeybordInput.prototype._removeEvent = function () {

    };

    $.fn.keyboardNum = function (options) {
        var dataKey = '_keyboard_input';
        return this.each(function () {
            var inputElement = $(this),
                instance = inputElement.data(dataKey);
            if (instance && instance._destory) {
                instance._destory();
            }
            instance = new KeybordInput(this, options);
            inputElement.data(dataKey, instance);
        });
    }


})(window, window.jQuery);