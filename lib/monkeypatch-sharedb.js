/* eslint-disable  */
const Promise = require('bluebird')
const { Query, Connection } = require('sharedb/lib/client')
const { type: json } = require('ot-json0')

let Vue
if (process.browser)
  Vue = require('vue').default


Connection.prototype.createFetchQueryAsync = async function (collection, q, options = null, shouldDestroy = true) {
  const { results, query } = await Promise.fromCallback((cb) => {
    const query = this.createFetchQuery(
      collection, q, options, (err, results) => cb(err, { results, query }),
    )
  })

  // There is only one ShareDB connection for the whole Node app and it
  // caches all docs that were retrieved through it. This causes several problems:
  // 1. Memory usage growth
  // 2. If we delete ops from DB we get old (cached) version of document
  // So here we need to destroy all documents returned by the query to
  // delete them from cache
  if (shouldDestroy) {
    results.forEach(r => r.destroy())
    query.destroy()
  }

  return { results, query }
}

Connection.prototype.createSubscribeQueryAsync = async function (collection, q, options = null) {
  const { results, query } = await Promise.fromCallback((cb) => {
    const query = this.createSubscribeQuery(
      collection, q, options, (err, results) => cb(err, { results, query }),
    )
  })
  return { results, query }
}

Query.prototype._handleDiff = function (diff) {
  // We need to go through the list twice. First, we'll ingest all the new
  // documents. After that we'll emit events and actually update our list.
  // This avoids race conditions around setting documents to be subscribed &
  // unsubscribing documents in event callbacks.
  for (let i = 0; i < diff.length; i++) {
    let d = diff[i]
    if (d.type === 'insert') d.values = this._ingestSnapshots(d.values)
  }

  for (let i = 0; i < diff.length; i++) {
    let d = diff[i]
    switch (d.type) {
      case 'insert': {
        let newDocs = d.values
        this.results.splice(d.index, 0, ...newDocs)
        this.emit('insert', newDocs, d.index)
        break
      }
      case 'remove': {
        let howMany = d.howMany || 1
        let removed = this.results.splice(d.index, howMany)
        this.emit('remove', removed, d.index)
        break
      }
      case 'move': {
        let howMany = d.howMany || 1
        let docs = this.results.splice(d.from, howMany)
        Array.prototype.splice.apply(this.results, [d.to, 0].concat(docs))
        this.emit('move', docs, d.from, d.to)
        break
      }
    }
  }
  this.emit('changed', this.results)
}

let clone = function (o) {
  return JSON.parse(JSON.stringify(o))
}

function convertFromText(c) {
  c.t = 'text0'
  let o = { p: c.p.pop() }
  if (c.si !== null) o.i = c.si
  if (c.sd !== null) o.d = c.sd
  c.o = [o]
}

var subtypes = {}

json.apply = function (snapshot, op) {
  json.checkValidOp(op)

  op = clone(op)

  var container = {
    data: snapshot,
  }

  for (var i = 0; i < op.length; i++) {
    var c = op[i]

    // convert old string ops to use subtype for backwards compatibility
    if (c.si != null || c.sd != null)
      convertFromText(c)

    var parent = null
    var elem = container
    var key = 'data'

    for (var j = 0; j < c.p.length; j++) {
      var p = c.p[j]

      parent = elem
      elem = elem[key]
      key = p

      if (parent == null)
        throw new Error('Path invalid')
    }

    // handle subtype ops
    if (c.t && c.o !== void 0 && subtypes[c.t]) {
      elem[key] = subtypes[c.t].apply(elem[key], c.o)

      // Number add
    } else if (c.na !== void 0) {
      if (typeof elem[key] != 'number')
        throw new Error('Referenced element not a number')

      elem[key] += c.na
    }

    // List replace
    else if (c.li !== void 0 && c.ld !== void 0) {
      json.checkList(elem)
      // Should check the list element matches c.ld
      elem[key] = c.li
    }

    // List insert
    else if (c.li !== void 0) {
      json.checkList(elem)
      elem.splice(key, 0, c.li)
    }

    // List delete
    else if (c.ld !== void 0) {
      json.checkList(elem)
      // Should check the list element matches c.ld here too.
      elem.splice(key, 1)
    }

    // List move
    else if (c.lm !== void 0) {
      json.checkList(elem)
      if (c.lm != key) {
        var e = elem[key]
        // Remove it...
        elem.splice(key, 1)
        // And insert it back.
        elem.splice(c.lm, 0, e)
      }
    }

    // Object insert / replace
    else if (c.oi !== void 0) {
      json.checkObj(elem)

      // Should check that elem[key] == c.od
      if (process.browser)
        Vue.set(elem, key, c.oi)
      else
        elem[key] = c.oi
    }

    // Object delete
    else if (c.od !== void 0) {
      json.checkObj(elem)

      // Should check that elem[key] == c.od
      if (process.browser)
        Vue.delete(elem, key)
      else
        delete elem[key]
    }

    else {
      throw new Error('invalid / missing instruction in op')
    }
  }

  return container.data
}

json.transformComponent = function (dest, c, otherC, type) {
  c = clone(c)

  var common = json.commonLengthForOps(otherC, c)
  var common2 = json.commonLengthForOps(c, otherC)
  var cplength = c.p.length
  var otherCplength = otherC.p.length

  if (c.na != null || c.t)
    cplength++

  if (otherC.na != null || otherC.t)
    otherCplength++

  // if c is deleting something, and that thing is changed by otherC, we need to
  // update c to reflect that change for invertibility.
  if (common2 != null && otherCplength > cplength && c.p[common2] == otherC.p[common2]) {
    if (c.ld !== void 0) {
      var oc = clone(otherC)
      oc.p = oc.p.slice(cplength)
      c.ld = json.apply(clone(c.ld), [oc])
    } else if (c.od !== void 0) {
      var oc = clone(otherC)
      oc.p = oc.p.slice(cplength)
      c.od = json.apply(clone(c.od), [oc])
    }
  }

  if (common != null) {
    var commonOperand = cplength == otherCplength

    // backward compatibility for old string ops
    var oc = otherC
    if ((c.si != null || c.sd != null) && (otherC.si != null || otherC.sd != null)) {
      convertFromText(c)
      oc = clone(otherC)
      convertFromText(oc)
    }

    // handle subtype ops
    if (oc.t && subtypes[oc.t]) {
      if (c.t && c.t === oc.t) {
        var res = subtypes[c.t].transform(c.o, oc.o, type)

        if (res.length > 0) {
          // convert back to old string ops
          if (c.si != null || c.sd != null) {
            var p = c.p
            for (var i = 0; i < res.length; i++) {
              c.o = [res[i]]
              c.p = p.slice()
              convertToText(c)
              json.append(dest, c)
            }
          } else {
            c.o = res
            json.append(dest, c)
          }
        }

        return dest
      }
    }

    // transform based on otherC
    else if (otherC.na !== void 0) {
      // this case is handled below
    } else if (otherC.li !== void 0 && otherC.ld !== void 0) {
      if (otherC.p[common] === c.p[common]) {
        // noop

        if (!commonOperand) {
          return dest
        } else if (c.ld !== void 0) {
          // we're trying to delete the same element, -> noop
          if (c.li !== void 0 && type === 'left') {
            // we're both replacing one element with another. only one can survive
            c.ld = clone(otherC.li)
          } else {
            return dest
          }
        }
      }
    } else if (otherC.li !== void 0) {
      if (c.li !== void 0 && c.ld === undefined && commonOperand && c.p[common] === otherC.p[common]) {
        // in li vs. li, left wins.
        if (type === 'right')
          c.p[common]++
      } else if (otherC.p[common] <= c.p[common]) {
        c.p[common]++
      }

      if (c.lm !== void 0) {
        if (commonOperand) {
          // otherC edits the same list we edit
          if (otherC.p[common] <= c.lm)
            c.lm++
          // changing c.from is handled above.
        }
      }
    } else if (otherC.ld !== void 0) {
      if (c.lm !== void 0) {
        if (commonOperand) {
          if (otherC.p[common] === c.p[common]) {
            // they deleted the thing we're trying to move
            return dest
          }
          // otherC edits the same list we edit
          var p = otherC.p[common]
          var from = c.p[common]
          var to = c.lm
          if (p < to || (p === to && from < to))
            c.lm--

        }
      }

      if (otherC.p[common] < c.p[common]) {
        c.p[common]--
      } else if (otherC.p[common] === c.p[common]) {
        if (otherCplength < cplength) {
          // we're below the deleted element, so -> noop
          return dest
        } else if (c.ld !== void 0) {
          if (c.li !== void 0) {
            // we're replacing, they're deleting. we become an insert.
            delete c.ld
          } else {
            // we're trying to delete the same element, -> noop
            return dest
          }
        }
      }

    } else if (otherC.lm !== void 0) {
      if (c.lm !== void 0 && cplength === otherCplength) {
        // lm vs lm, here we go!
        var from = c.p[common]
        var to = c.lm
        var otherFrom = otherC.p[common]
        var otherTo = otherC.lm
        if (otherFrom !== otherTo) {
          // if otherFrom == otherTo, we don't need to change our op.

          // where did my thing go?
          if (from === otherFrom) {
            // they moved it! tie break.
            if (type === 'left') {
              c.p[common] = otherTo
              if (from === to) // ugh
                c.lm = otherTo
            } else {
              return dest
            }
          } else {
            // they moved around it
            if (from > otherFrom) c.p[common]--
            if (from > otherTo) c.p[common]++
            else if (from === otherTo) {
              if (otherFrom > otherTo) {
                c.p[common]++
                if (from === to) // ugh, again
                  c.lm++
              }
            }

            // step 2: where am i going to put it?
            if (to > otherFrom) {
              c.lm--
            } else if (to === otherFrom) {
              if (to > from)
                c.lm--
            }
            if (to > otherTo) {
              c.lm++
            } else if (to === otherTo) {
              // if we're both moving in the same direction, tie break
              if ((otherTo > otherFrom && to > from) ||
                (otherTo < otherFrom && to < from)) {
                if (type === 'right') c.lm++
              } else {
                if (to > from) c.lm++
                else if (to === otherFrom) c.lm--
              }
            }
          }
        }
      } else if (c.li !== void 0 && c.ld === undefined && commonOperand) {
        // li
        var from = otherC.p[common]
        var to = otherC.lm
        p = c.p[common]
        if (p > from) c.p[common]--
        if (p > to) c.p[common]++
        // else if (p === to && from > to) c.p[common]++;
      } else {
        // ld, ld+li, si, sd, na, oi, od, oi+od, any li on an element beneath
        // the lm
        //
        // i.e. things care about where their item is after the move.
        var from = otherC.p[common]
        var to = otherC.lm
        p = c.p[common]
        if (p === from) {
          c.p[common] = to
        } else {
          if (p > from) c.p[common]--
          if (p > to) c.p[common]++
          else if (p === to && from > to) c.p[common]++
        }
      }
    }
    else if (otherC.oi !== void 0 && otherC.od !== void 0) {
      if (c.p[common] === otherC.p[common]) {
        if (c.oi !== void 0 && commonOperand) {
          // we inserted where someone else replaced
          if (type === 'right') {
            // left wins
            return dest
          } else {
            // we win, make our op replace what they inserted
            c.od = otherC.oi
          }
        } else {
          // -> noop if the other component is deleting the same object (or any parent)
          return dest
        }
      }
    } else if (otherC.oi !== void 0) {
      if (c.oi !== void 0 && c.p[common] === otherC.p[common]) {
        // left wins if we try to insert at the same place
        if (type === 'left') {
          json.append(dest, { p: c.p, od: otherC.oi })
        } else {
          return dest
        }
      }
    } else if (otherC.od !== void 0) {
      if (c.p[common] == otherC.p[common]) {
        if (!commonOperand)
          return dest
        if (c.oi !== void 0) {
          delete c.od
        } else {
          return dest
        }
      }
    }
  }

  json.append(dest, c)
  return dest
}

require('ot-json0/lib/bootstrapTransform')(json, json.transformComponent, json.checkValidOp, json.append)
