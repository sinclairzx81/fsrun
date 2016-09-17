/*--------------------------------------------------------------------------

fsrun - run and restart OS processes on file system watch events.

The MIT License (MIT)

Copyright (c) 2016 Haydn Paterson (sinclair) <haydn.developer@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

---------------------------------------------------------------------------*/

/** fstart argument. */
export interface Argument {
  paths     : string [],
  commands  : string []
  timeout   : number
}

/*
 * for the given process.argv array, extract the arguments
 * as a string value.
 * @param {string[]} the value from process.argv
 * @returns {Result<string>}
 */
function extract_input(argv: string[]) : string {
  let process = argv.shift()
  let script  = argv.shift()
  let line    = argv.join(' ')
  return line
}

/*
 * verifies the input string does not contain errors.
 * @param {string} the input string.
 * @returns {Result<string>}
 */
function validate_input(input: string): boolean {
  let l = 0;
  for(let n = 0; n < input.length; n++) {
    let ch = input.charAt(n)
    switch(ch) {
      case '[': l += 1; break;
      case ']': l -= 1; break;
    }
  } return (l === 0)
}

/**
 * resolves the paths from the given input string. If 
 * no paths is given, then resolve to cwd (denoted by ./)
 * @param {string} the input line.
 * @returns {Result<string>} 
 */
function extract_paths(input: string) : string[] {
  let buf  = []
  for(let n = 0; n < input.length; n++) {
    let ch = input.charAt(n)
    if(ch == '[') {
      break;
    } else {
      buf.push(input.charAt(n))
    }
  }
  let paths = buf.join('').trim()
  paths = paths.length > 0 ? paths : "./"
  return paths.split('+').map(seg => seg.trim())
}

/**
 * resolves the commands from the given input line.
 * @param {string} the input line.
 * @returns {Result<string[]}
 */
function extract_commands(input: string) : string[] {
  let buf  = []
  let cur  = []
  let l    = 0
  for(let n = 0; n < input.length; n++) {
    let ch = input.charAt(n)
    switch(ch) {
      case '[': {
        if(l > 0) cur.push(ch)
        l += 1
        break;
      }
      case ']': {
        l -= 1
        if(l > 0) cur.push(ch)
        if(l == 0) {
          buf.push(cur.join(''))
          cur = []
        }
        break;
      }
      default: {
        if(l > 0) cur.push(ch)
        break;
      }
    }
  } return buf
}

/**
 * parses the given process.argv array into argument.
 * @param {string[]} the process.argv array.
 * @returns {Result<Argument>}
 */
export function parse_argument(argv: string[]) : Argument {
  let input = extract_input(argv)
  if(validate_input(input) === false) throw Error("invalid argument")
  return {
    paths    : extract_paths(input),
    commands : extract_commands(input), 
    timeout  : 2000
  }
}