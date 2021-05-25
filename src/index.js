
/**
 * An implementation of Promise/A+
 * https://promisesaplus.com/
 */

 const STATE = {
  PENDING: 1,
  FULFILLED: 2,
  REJECTED: 3
}

class Promise {
  constructor(executor) {
    if (typeof executor !== 'function') {
      throw TypeError('executor is not a function')
    }

    this.state = STATE.PENDING
    this.value = undefined
    this.reason = undefined

    this.onFulfilledCallbacks = []
    this.onRejectedCallbacks = []

    this._resolve = this._resolve.bind(this)
    this._reject = this._reject.bind(this)

    try {
      executor(this._resolve, this._reject)
    } catch (err) {
      this._reject(err)
    }
  }

  _resolve(value) {
    if (this.state === STATE.PENDING) {
      this.state = STATE.FULFILLED
      this.value = value

      setTimeout(() => {
        this.onFulfilledCallbacks.forEach(fn => {
          fn(value)
        })
      })
    }
  }

  _reject(reason) {
    if (this.state === STATE.PENDING) {
      this.state = STATE.REJECTED
      this.reason = reason

      setTimeout(() => {
        this.onRejectedCallbacks.forEach(fn => {
          fn(reason)
        })
      })
    }
  }

  _resolvePromise(p, x, resolve, reject) {
    if (p === x) {
      reject(new TypeError('circle reference!'))
      return
    }

    let hasCalled = false
    if ((x !== null && typeof x === 'object') || typeof x === 'function') {
      try {
        const then = x.then
        if (typeof then === 'function') {

          const resolvePromise = (y) => {
            if (!hasCalled) {
              hasCalled = true
              p._resolvePromise(p, y, resolve, reject)
            }
          }

          const rejectPromise = (e) => {
            if (!hasCalled) {
              hasCalled = true
              reject(e)
            }
          }

          then.call(x, resolvePromise, rejectPromise)
        } else {
          resolve(x)
        }
      } catch (err) {
        if (!hasCalled) {
          hasCalled = true
          reject(err)
        }
      }
    } else {
      resolve(x)
    }
  }

  then(onFulfilled, onRejected) {
    if (typeof onFulfilled !== 'function') onFulfilled = (value) => value
    if (typeof onRejected !== 'function') onRejected = (reason) => { throw reason }

    let p2
    if (this.state === STATE.PENDING) {
      return p2 = new Promise((resolve, reject) => {
        this.onFulfilledCallbacks.push(() => {
          try {
            const x = onFulfilled(this.value)
            this._resolvePromise(p2, x, resolve, reject)
          } catch (err) {
            reject(err)
          }
        })

        this.onRejectedCallbacks.push(() => {
          try {
            const x = onRejected(this.reason)
            this._resolvePromise(p2, x, resolve, reject)
          } catch (err) {
            reject(err)
          }
        })
      })
    }

    if (this.state === STATE.FULFILLED) {
      return p2 = new Promise((resolve, reject) => {
        setTimeout(() => {
          try {
            const x = onFulfilled(this.value)
            this._resolvePromise(p2, x, resolve, reject)
          } catch (err) {
            reject(err)
          }
        })
      })
    }

    if (this.state === STATE.REJECTED) {
      return p2 = new Promise((resolve, reject) => {
        setTimeout(() => {
          try {
            const x = onRejected(this.reason)
            this._resolvePromise(p2, x, resolve, reject)
          } catch (err) {
            reject(err)
          }
        })
      })
    }
  }

  static resolve(value) {
    return new Promise((resolve, reject) => {
      resolve(value)
    })
  }

  static reject(reason) {
    return new Promise((resolve, reject) => {
      reject(reason)
    })
  }

  static all(list) {
    let counter = 0
    return new Promise((resolve, reject) => {
      list.forEach(p => {
        Promise.reject(p).then(() => {
          if (++counter === list.length) {
            resolve()
          }
        }, reject)
      })
    })
  }
}

module.exports = Promise