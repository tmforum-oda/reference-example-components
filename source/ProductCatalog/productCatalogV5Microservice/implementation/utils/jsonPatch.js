'use strict';

// RFC 6902 JSON Patch (application/json-patch+json). Returns {doc} or {error, status}:
// 400 for a patch that cannot be applied (the v5.0.0 OAS has no 422), 409 when a
// "test" operation fails.

function unescape(seg) { return seg.replace(/~1/g, '/').replace(/~0/g, '~'); }

function parsePointer(pointer) {
  if (pointer === '') return [];
  if (typeof pointer !== 'string' || pointer.charAt(0) !== '/') throw new Error(`"${pointer}" is not a JSON pointer`);
  return pointer.slice(1).split('/').map(unescape);
}

function same(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

function parentOf(doc, segs, pointer) {
  let node = doc;
  for (let i = 0; i < segs.length - 1; i++) {
    const s = segs[i];
    if (node === null || typeof node !== 'object' || !(s in node)) throw new Error(`path ${pointer} does not exist`);
    node = node[Array.isArray(node) ? Number(s) : s];
  }
  if (node === null || typeof node !== 'object') throw new Error(`path ${pointer} does not exist`);
  return node;
}

function get(doc, pointer) {
  const segs = parsePointer(pointer);
  if (!segs.length) return doc;
  const parent = parentOf(doc, segs, pointer);
  const last = segs[segs.length - 1];
  if (Array.isArray(parent) ? !(Number(last) < parent.length) : !(last in parent)) throw new Error(`path ${pointer} does not exist`);
  return parent[Array.isArray(parent) ? Number(last) : last];
}

function add(doc, pointer, value) {
  const segs = parsePointer(pointer);
  if (!segs.length) return value;
  const parent = parentOf(doc, segs, pointer);
  const last = segs[segs.length - 1];
  if (Array.isArray(parent)) {
    const i = last === '-' ? parent.length : Number(last);
    if (!Number.isInteger(i) || i < 0 || i > parent.length) throw new Error(`index ${last} is out of range at ${pointer}`);
    parent.splice(i, 0, value);
  } else {
    parent[last] = value;
  }
  return doc;
}

function remove(doc, pointer) {
  const segs = parsePointer(pointer);
  if (!segs.length) throw new Error('cannot remove the whole document');
  get(doc, pointer);
  const parent = parentOf(doc, segs, pointer);
  const last = segs[segs.length - 1];
  if (Array.isArray(parent)) parent.splice(Number(last), 1); else delete parent[last];
  return doc;
}

function applyJsonPatch(target, ops) {
  let doc = JSON.parse(JSON.stringify(target));
  for (let i = 0; i < ops.length; i++) {
    const op = ops[i];
    try {
      switch (op.op) {
        case 'add': doc = add(doc, op.path, op.value); break;
        case 'remove': doc = remove(doc, op.path); break;
        case 'replace': get(doc, op.path); doc = remove(doc, op.path); doc = add(doc, op.path, op.value); break;
        case 'move': { const v = get(doc, op.from); doc = remove(doc, op.from); doc = add(doc, op.path, v); break; }
        case 'copy': doc = add(doc, op.path, JSON.parse(JSON.stringify(get(doc, op.from)))); break;
        case 'test':
          if (!same(get(doc, op.path), op.value)) return { status: 409, error: `operation ${i} (test ${op.path}) failed: the value is different` };
          break;
        default: return { status: 400, error: `operation ${i}: unknown op "${op.op}"` };
      }
    } catch (e) {
      return { status: 400, error: `operation ${i} (${op.op} ${op.path}): ${e.message}` };
    }
  }
  return { doc };
}

module.exports = { applyJsonPatch };
