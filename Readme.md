
# normalized-upload

  Normalized DataTransfer items for less pain.

## Installation

    $ component install component/normalized-upload

## Example

```js
var normalize = require('normalized-upload');

document.onpaste = function(e){
  console.log(e);
  normalize(e, function(){
    e.items.forEach(function(item){
      console.log(item);
    });
  });
};
```

## License

  MIT
