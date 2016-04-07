'use strict'

const proxyquire = require('proxyquire')


describe('Parser', () => {
  let Parser, fsMock

  const registerConfFile = contents => {
    Parser = proxyquire('../src/index', {
      fs: {
        readFile: (path, callback) => callback(null, contents)
      }
    })
  }

  describe('#parse', () => {

    it('should handle empty configs', done => {
      registerConfFile('')

      Parser.parse('mock.conf').then(conf => {
        expect(conf).toEqual({devices: []})
        done()
      })
    })

    it('should ignore comments', done => {
      registerConfFile(`
      # I = "AM NOT HERE"
      BUT = "I AM"
      `)

      Parser.parse('mock.conf').then(conf => {
        expect(conf).toEqual({
          BUT: "I AM",
          devices: []
        })
        done()
      })
    })

    it('should ignore respect types', done => {
      registerConfFile(`
      STRING = "string"
      INT    = 12
      FLOAT  = 1.0
      BOOL_F = false
      BOOL_T = True
      NONE   = null
      `)

      Parser.parse('mock.conf').then(conf => {
        expect(conf.STRING).toEqual(jasmine.any(String))
        expect(conf.INT).toEqual(jasmine.any(Number))
        expect(conf.FLOAT).toEqual(jasmine.any(Number))
        expect(conf.BOOL_F).toEqual(jasmine.any(Boolean))
        expect(conf.BOOL_T).toEqual(jasmine.any(Boolean))
        expect(conf.NONE).toEqual(null)
        done()
      })
    })

    it('should add devices to the device array', done => {
      registerConfFile(`
      device {
        A = "B"
      }
      device {
        B = "C"
      }
      `)

      Parser.parse('mock.conf').then(conf => {
        expect(conf).toEqual({
          devices: [{
            A: "B"
          }, {
            B: "C"
          }]
        })
        done()
      })
    })

    it('should add parse parameters in the device block', done => {
      registerConfFile(`
      device {
        A = "B"
        parameters {
          AA = "BB"
        }
      }
      `)

      Parser.parse('mock.conf').then(conf => {
        expect(conf).toEqual({
          devices: [{
            A: "B",
            parameters: {AA: "BB"}
          }]
        })
        done()
      })
    })

    it('should add a controller block when applicable', done => {
      registerConfFile(`
      controller {
        A = "B"
      }
      `)

      Parser.parse('mock.conf').then(conf => {
        expect(conf).toEqual({
          controller: {A: "B"},
          devices: []
        })
        done()
      })
    })
  })
})
