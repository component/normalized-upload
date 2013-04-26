
/**
 * Expose `normalize()`.
 */

module.exports = normalize;

/**
 * Normalize `e` adding the `e.items` array and invoke `fn()`.
 *
 * @param {Event} e
 * @param {Function} fn
 * @api public
 */

function normalize(e, fn) {
  e.items = [];

  var items = e.clipboardData
    ? e.clipboardData.items
    : e.dataTransfer.items;

  if (!items) return fn(e);
  normalizeItems(e, items, function(){ fn(e) });
}

/**
 * Process `items`.
 *
 * @param {Event} e
 * @param {Array} items
 * @param {Function} fn
 * @return {Type}
 * @api private
 */

function normalizeItems(e, items, fn){
  var pending = items.length;

  for (var i = 0; i < items.length; i++) {
    var item = items[i];

    // directories
    if ('file' == item.kind && item.webkitGetAsEntry) {
      var entry = item.webkitGetAsEntry();
      if (entry.isDirectory) {
        walk(e, entry, function(){
          --pending || fn(e);
        });
        continue;
      }
    }

    // files
    if ('file' == item.kind) {
      var file = item.getAsFile();
      file.kind = 'file';
      e.items.push(file);
      --pending || fn(e);
      continue;
    }

    // others
    (function(){
      var type = item.type;
      var kind = item.kind;
      item.getAsString(function(str){
        e.items.push({
          kind: kind,
          type: type,
          string: str
        });

        --pending || fn(e);
      })
    })()
  }
};

/**
 * Walk `entry`.
 *
 * @param {Event} e
 * @param {FileEntry} entry
 * @param {Function} fn
 * @api private
 */

function walk(e, entry, fn){
  if (entry.isFile) {
    return entry.file(function(file){
      file.entry = entry;
      file.kind = 'file';
      e.items.push(file);
      fn();
    })
  }

  if (entry.isDirectory) {
    var dir = entry.createReader();
    dir.readEntries(function(entries){
      entries = filterHidden(entries);
      var pending = entries.length;

      for (var i = 0; i < entries.length; i++) {
        walk(e, entries[i], function(){
          --pending || fn();
        });
      }
    })
  }
}

/**
 * Filter hidden entries.
 *
 * @param {Array} entries
 * @return {Array}
 * @api private
 */

function filterHidden(entries) {
  var arr = [];

  for (var i = 0; i < entries.length; i++) {
    if ('.' == entries[i].name[0]) continue;
    arr.push(entries[i]);
  }

  return arr;
}
