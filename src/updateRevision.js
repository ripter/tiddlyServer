
module.exports = function updateRevision(tiddler) {
  let { revision } = tiddler;

  if (!revision) {
    revision = 1;
  }
  else {
    revision = parseInt(revision, 10) + 1;
  }

  tiddler.revision = revision;
  return tiddler;
}
