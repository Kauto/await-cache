const AwaitLock = require('await-lock')

module.exports = function (callbackFunction, maxAgeInMSOrOptions = 0) {
  const defaultOptions = {
    maxAge: false,
    maxSize: false,
    serialize: a => {
      if (a.length === 0) {
        return undefined
      }
      if (a.length === 1 && (a[0] == null || (typeof a[0] !== 'function' && typeof a[0] !== 'object'))) {
        return a[0]
      }
      return JSON.stringify(a)
    }
  }
  const givenOptions = typeof maxAgeInMSOrOptions === 'object' ? maxAgeInMSOrOptions : {
    maxAge: maxAgeInMSOrOptions - 0
  }
  let options = Object.assign(defaultOptions, givenOptions)
  let cache = {
    timer: new Map(),
    lock: new Map(),
    data: new Map(),
    lru: []
  }
  let cacheFunction = async function (...args) {
    const serializedArgs = options.serialize(args)

    if (!cache.lock.has(serializedArgs)) {
      cache.lock.set(serializedArgs, new AwaitLock())
    }
    const lock = cache.lock.get(serializedArgs)
    await lock.acquireAsync()

    const cacheInvalid = !cache.data.has(serializedArgs)
    if (cacheInvalid) {
      try {
        cache.data.set(serializedArgs, await callbackFunction.apply(this, args))
        if (options.maxAge) {
          cache.timer.set(serializedArgs, setTimeout(() => {
            cacheFunction.deleteSerialized(serializedArgs)
          }, options.maxAge))
        }
        if (options.maxSize) {
          cache.lru.push(serializedArgs)
          while (cache.lru.length > options.maxSize) {
            let toDeleteCacheEntry = cache.lru.shift()
            cacheFunction.deleteSerialized(toDeleteCacheEntry)
          }
        }
      } catch (e) {
        throw e
      } finally {
        lock.release()
      }
    } else {
      if (options.maxSize) {
        let pos = cache.lru.indexOf(serializedArgs)
        if (pos >= 0) {
          cache.lru.splice(pos, 1)
        }
        cache.lru.push(serializedArgs)
      }
      lock.release()
    }

    return cache.data.get(serializedArgs)
  }

  cacheFunction.clear = function () {
    cache.timer.forEach(timer => clearTimeout(timer))
    cache.timer.clear()
    cache.lock.clear()
    cache.data.clear()
    cache.lru = []
  }
  cacheFunction.delete = function (...args) {
    const serializedArgs = options.serialize(args)
    cacheFunction.deleteSerialized(serializedArgs)
  }
  cacheFunction.deleteSerialized = function (serializedArgs) {
    if (cache.timer.has(serializedArgs)) {
      clearTimeout(cache.timer.get(serializedArgs))
      cache.timer.delete(serializedArgs)
    }
    cache.lock.delete(serializedArgs)
    cache.data.delete(serializedArgs)
    let pos = cache.lru.indexOf(serializedArgs)
    if (pos >= 0) {
      cache.lru.splice(pos, 1)
    }
  }

  return cacheFunction.bind(null)
}
