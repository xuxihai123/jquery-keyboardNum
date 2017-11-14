# jquery-keyboardNum
keyboardNum

jquery Number keyboard  (类似微信金额输入键盘)

### usage:

```js

$(selector).keyboardNum({
   intLength: 12, //整数位数
    dotLength: 2, //小数位数
    cursorTick: 800, //光标闪烁频率
    onChangeAfter: function(value) {
       console.log(this);
      console.log(value);
    }, //渲染值后的一个回调
    validateHook: function(value) {
             console.log(this);
           if(/\d/.test(value)){
               return true;
           }
    }, //校验成功后才会渲染值
    mode: undefined //like 8.2 ==> intLength:8,dotLength:2
})
```
