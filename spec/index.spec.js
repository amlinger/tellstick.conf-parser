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

  describe('#write', () => {
    let fsWriteMock

    beforeEach(() => {
      fsWriteMock = jasmine.createSpy()
      Parser = proxyquire('../src/index', {
        fs: {
          writeFile: (path, contents, cb) => {
            fsWriteMock(path, contents)
            cb()
          }
        }
      })
    })

    it('should write an empty string when passed an empty object', done => {
      Parser.write('test.conf', {}).then(() => {
        expect(fsWriteMock).toHaveBeenCalledWith('test.conf', '')
        done()
      })
    })

    it('should add string quotes to strings', done => {
      Parser.write('test.conf', {A: 'B'}).then(() => {
        expect(fsWriteMock).toHaveBeenCalledWith('test.conf',
          'A = "B"')
        done()
      })
    })

    it('should write integers', done => {
      Parser.write('test.conf', {ANSWER: 42}).then(() => {
        expect(fsWriteMock).toHaveBeenCalledWith('test.conf',
          'ANSWER = 42')
        done()
      })
    })

    it('should write floats', done => {
      Parser.write('test.conf', {ANSWERISH: 42.2}).then(() => {
        expect(fsWriteMock).toHaveBeenCalledWith('test.conf',
          'ANSWERISH = 42.2')
        done()
      })
    })

    it('should write boolean false', done => {
      Parser.write('test.conf', {NAH: false}).then(() => {
        expect(fsWriteMock).toHaveBeenCalledWith('test.conf',
          'NAH = false')
        done()
      })
    })

    it('should write boolean true', done => {
      Parser.write('test.conf', {YUP: true}).then(() => {
        expect(fsWriteMock).toHaveBeenCalledWith('test.conf',
          'YUP = true')
        done()
      })
    })

    it('should write blocks', done => {
      Parser.write('test.conf', {
        controller: {id: 1}
      }).then(() => {
        expect(fsWriteMock).toHaveBeenCalledWith('test.conf',
          'controller {\n' +
          '  id = 1\n' +
          '}'
        )
        done()
      })
    })

    it('should write multiple blocks of the same type', done => {
      Parser.write('test.conf', {
        devices: [{id: 1}, {id: 2}]
      }).then(() => {
        expect(fsWriteMock).toHaveBeenCalledWith('test.conf',
          'device {\n' +
          '  id = 1\n' +
          '}\n' +
          'device {\n' +
          '  id = 2\n' +
          '}'
        )
        done()
      })
    })

    it('should write nested objects', done => {
      Parser.write('test.conf', {
        controller: {parameters: {id: 1}}
      }).then(() => {
        expect(fsWriteMock).toHaveBeenCalledWith('test.conf',
          'controller {\n' +
          '  parameters {\n' +
          '    id = 1\n' +
          '  }\n' +
          '}'
        )
        done()
      })
    })

    it('should write nested objects in arrays', done => {
      Parser.write('test.conf', {
        devices: [{parameters: {id: 1}}]
      }).then(() => {
        expect(fsWriteMock).toHaveBeenCalledWith('test.conf',
          'device {\n' +
          '  parameters {\n' +
          '    id = 1\n' +
          '  }\n' +
          '}'
        )
        done()
      })
    })
  })
})
