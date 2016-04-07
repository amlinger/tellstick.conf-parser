'use strict'

const fs = require('fs')

/**
 * A very simple parser of tellstick.conf files.
 *
 * This has no opionion about the order of definitions, and will output an
 * object when it is done. Parsing is done asynchronously, as `fs` is used
 * for reading the file (async).
 */
const Parser = {

  /**
   * Parses an asignment pair, e.g. a line that looks something like
   * KEY = "VAL"
   *
   * We are assuming that we have similar type definitions as with JSON.
   * The valid types are:
   * - "hey"              // String value
   * - 12                 // Integer value
   * - 12.2               // Float value
   * - true, false, null  // Literals being any of these, ignoring case.
   *
   * TODO: Make sure that this does not eat the rest of the line, as it
   * currently does. The following two cases are not covered:
   * - A="B" }      // Where '}' will be eaten
   * - A="B" C="D"  // Where the second assignment will be eaten.
   * This is prepared for by using a regex determening the pisition of a
   * string, but is not finalized yet.
   *
   * @param  {Number} ptr   The current line we are at
   * @param  {Array} lines  All lines.
   * @return {object}       An object that contains the new position of the
   *                        pointer, as well as the parsed pair.
   */
  _handlePair: (ptr, lines) => {
    const pair = lines[ptr].split('=').map(v => v.trim()),
      isString = /"(.*?)"/g.exec(pair[1])

    if (isString != null)
      pair[1] = isString[1]
    else if (pair[1].toLowerCase() === 'false')
      pair[1] = false
    else if (pair[1].toLowerCase() === 'true')
      pair[1] = true
    else if (pair[1].toLowerCase() === 'null')
      pair[1] = null
    else if (Number(pair[1], 10) != NaN)
      pair[1] = Number(pair[1], 10)
    else throw  `Unknown type: ${pair[1]}`

    return {ptr: ptr, json:pair}
  },

  /**
   * Parses a block. The possible block definitions are:
   * - device
   * - controller
   * - parameters
   * of which only the last can be wrapped inside an other block.
   *
   * @param  {Number} ptr       The current line we are at
   * @param  {string} blockName The name of the block that we are currently
   *                            parsing, as `parameters` in
   *                            ```
   *                            parameters {
   *                              A = "B"
   *                            }
   *                            ```
   * @param  {Array}  lines     All lines.
   * @return {object}       An object that contains the new position of the
   *                        pointer, as well as the parsed block.
   */
  _handleBlock: (ptr, blockName, lines) => {
    const blockJSON = {}

    lines[ptr] = lines[ptr].slice(blockName.length).trim()

    if (lines[ptr][0] !== '{')
      ptr++

    if (lines[ptr][0] !== '{')
      throw `Expected {, but found "${lines[ptr]}"`

    lines[ptr] = lines[ptr].slice(1).trim()

    if (lines[ptr] === '')
      ptr++

    for (;ptr < lines.length; ptr++) {
      const line = lines[ptr]

      if (lines[ptr].startsWith('}')) {
        lines[ptr] = lines[ptr].slice(1)
        return {ptr: --ptr, json: blockJSON}
      } else if (lines[ptr].startsWith('parameters')) {
        const res = Parser._handleBlock(ptr, 'parameters', lines)
        ptr = res.ptr
        blockJSON.parameters = res.json
      } else if (line !== '' ){
        const res = Parser._handlePair(ptr, lines)
        ptr = res.ptr
        blockJSON[res.json[0]] = res.json[1]
      }
    }

    throw 'Unexpected end of config in device'
  },

  /**
   * Parses a configuration file, based on assumptions about how said conf
   * file should look like. Has no opinion about the ordering of things.
   * This does a three time pass of the file:
   * 1. Trim the white-spaces from each line (fetching the lines could also
   *    be considered a pass, though).
   * 2. Removing the comments.
   * 3. Parsing the remaining content.
   *
   * @param   {String} path The path to the configuration file
   * @returns {Promise}     The resulting promise, that will resolve when the
   *                        file is parsed
   */
  parse: path => new Promise((resolve, reject) => {
    fs.readFile(path, (err, buffer) =>  {
      // Fetch the lines of the file, and trim white-spaces from lines as well
      // as remove commented lines
      const lines = buffer.toString().split('\n')
        .map(l => l.trim())
        .filter(l => l !== '' && !l.startsWith('#'))

      const confJSON = {devices: []}
      let ptr = 0
      for (;ptr < lines.length; ptr++) {
        const line = lines[ptr]

        if (line.startsWith('device') && !line.startsWith('deviceNode')) {
          const res = Parser._handleBlock(ptr, 'device', lines)
          ptr = res.ptr
          confJSON.devices.push(res.json)
        } else if (line.startsWith('controller')) {
          const res = Parser._handleBlock(ptr, 'controller', lines)
          ptr = res.ptr
          confJSON.controller = res.json
        } else if (line !== '' ) {
          const res = Parser._handlePair(ptr, lines)
          ptr = res.ptr
          confJSON[res.json[0]] = res.json[1]
        }
      }

      resolve(confJSON)
    })
  })
}

module.exports = Parser
