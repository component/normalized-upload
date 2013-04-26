
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

  var files = e.dataTransfer && e.dataTransfer.files;

  var items = e.clipboardData
    ? e.clipboardData.items
    : e.dataTransfer.items;

  items = items || [];
  files = files || [];

  normalizeItems(e, items, function(){
    normalizeFiles(e, files, function(){
      fn(e)
    });
  });
}

/**
 * Process `files`.
 *
 * Some browsers (chrome) populate both .items and .files
 * with the same things, so we need to check that the `File`
 * is not already present.
 *
 * @param {Event} e
 * @param {FileList} files
 * @param {Function} fn
 * @api private
 */

function normalizeFiles(e, files, fn) {
  var pending = files.length;

  if (!pending) return fn();

  for (var i = 0; i < files.length; i++) {
    if (~e.items.indexOf(files[i])) continue;
    e.items.push(files[i]);
  }

  fn();
}

/**
 * Process `items`.
 *
 * @param {Event} e
 * @param {ItemList} items
 * @param {Function} fn
 * @return {Type}
 * @api private
 */

function normalizeItems(e, items, fn){
  var pending = items.length;

  if (!pending) return fn();

  for (var i = 0; i < items.length; i++) {
    var item = items[i];

    // directories
    if ('file' == item.kind && item.webkitGetAsEntry) {
      var entry = item.webkitGetAsEntry();
      if (entry && entry.isDirectory) {
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
