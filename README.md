# await-cache

A cache for async-functions. It also works for non-async functions. It's even possible to enable a LRU-algorithm.

## How to install

```bash
npm i await-cache
```

## How to use

Simply surround the async function you want to cache. In this example `fetch` is a function that loads a file.
```js
const cachify = require('await-cache');

const cachedFetch = cachify(/* function to cache: */fetch, /* cache-time in milliseconds: */ 1000 * 60 * 60)

async function test() {
  try {
    const data1 = await cachedFetch('foo.bar') // will do the real fetch and cache it for an hour
    const data2 = await cachedFetch('foo.bar') // will instantly return the cached value
    const data3 = await cachedFetch('foo2.bar') // will fetch a different result and cache it for an hour
  } catch(e) {
    // fetch throw an error
    console.error(e)
  }
}
```

Second argument can be the cache-time in milliseconds or an object of options. With setting the maxSize-option you enable the LRU-Cache:
```js
const cachify = require('await-cache');

const cachedFunc = cachify(async (filename) => {
  let data = await fetch(filename)
  return JSON.parse(data)
}, {
  maxAge: 60 * 60 * 1000, // cache for an hour
  maxSize: 2, // enable LRU-cache. Only cache the last 2 used files. The cache will never save more that the result of 2 different arguments. 
  serialize: (args) => JSON.stringify(args) // use a special argument-serialize-function
})
```

The default serialisation for the arguments uses `JSON.stringify`. So you will have to write a custom serialisation if you want to use functions or complex objects as arguments.

## License

[MIT](https://github.com/Kauto/await-cache/blob/master/LICENSE)