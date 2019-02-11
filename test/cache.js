const { describe, it } = require('mocha')
const { expect } = require('chai')
const cache = require('../src/cache')

describe('await-cache', function () {
  it('should cache a async function', async function () {
    let timesRunning = 0
    let testFunc = cache(function () {
      return new Promise((resolve) => setTimeout(() => resolve(++timesRunning), 50))
    }, 1000)
    expect(await testFunc()).to.equal(1)
    expect(await testFunc()).to.equal(1)
  })

  it('should running only once', async function () {
    let timesRunning = 0
    let testFunc = cache(function () {
      return new Promise((resolve) => setTimeout(() => resolve(++timesRunning), 50))
    }, 1000)
    expect(await Promise.all([testFunc(), testFunc()])).to.deep.equal([1, 1])
  })

  it('should call and cache a async function with the given parameter', async function () {
    let timesRunning = 0
    let testFunc = cache(function (i, j) {
      return new Promise((resolve) => setTimeout(() => resolve([i, j, ++timesRunning]), 20))
    }, 1000)
    expect(await testFunc(1, 1)).to.deep.equal([1, 1, 1])
    expect(await testFunc(1, { a: 1 })).to.deep.equal([1, { a: 1 }, 2])
    expect(await testFunc(1337, ['x', 'y'])).to.deep.equal([1337, ['x', 'y'], 3])
    expect(await testFunc(1, 1)).to.deep.equal([1, 1, 1])
  })

  it('should running only one time each with different arguments and at the same time', async function () {
    let timesRunning = 0
    let testFunc = cache(function (i) {
      return new Promise((resolve) => setTimeout(() => resolve([i, ++timesRunning]), 50))
    }, 1000)
    const startTime = Date.now()
    expect(await Promise.all([testFunc(1), testFunc(1), testFunc(2), testFunc(2)])).to.deep.equal([[1, 1], [1, 1], [2, 2], [2, 2]])
    expect(Date.now() - startTime).to.be.lessThan(100)
  })

  it('should respect cache size', async function () {
    let timesRunning = 0
    let testFunc = cache(function (i) {
      return new Promise((resolve) => setTimeout(() => resolve([i, ++timesRunning]), 5))
    }, {
      maxSize: 2
    })
    expect(await testFunc(1)).to.deep.equal([1, 1])
    expect(await testFunc(2)).to.deep.equal([2, 2])
    expect(await testFunc(3)).to.deep.equal([3, 3])
    expect(await testFunc(1)).to.deep.equal([1, 4])
    expect(await testFunc(3)).to.deep.equal([3, 3])
    expect(await testFunc(2)).to.deep.equal([2, 5])
    expect(await testFunc(3)).to.deep.equal([3, 3])
  })
})
