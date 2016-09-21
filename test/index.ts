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

import {parse_argument} from "../src/parser/parse"
import {resolve_path}   from "../src/sys/sys"
import {create_process} from "../src/process/process"
import {create_watcher} from "../src/watcher/watcher" 
import {create_runtime} from "../src/runtime/runtime" 
import * as _           from "../src/index" 
import * as runner      from "./runner"

let argv = (input: string) => 
  [].concat(['nodepath', 'scriptpath'], 
  input.split(' '))

runner.test("arguments: pattern 0", context => {
  try {
    let arg = parse_argument(argv("[input a] [input b]"))
    context.assert(arg.paths.length    === 1)
    context.assert(arg.paths[0]        === "./")
    context.assert(arg.commands.length === 2)
    context.assert(arg.commands[0]     === "input a")
    context.assert(arg.commands[1]     === "input b")
    context.ok()
  } catch(e) {
    context.assert(e.message, false)
  }
})
runner.test("arguments: pattern 1", context => {
  try{
    let arg = parse_argument(argv("./src/test [input a] [input b]"))
    context.assert(arg.paths.length    === 1)
    context.assert(arg.paths[0]        === "./src/test")
    context.assert(arg.commands.length === 2)
    context.assert(arg.commands[0]     === "input a")
    context.assert(arg.commands[1]     === "input b")
    context.ok()
  } catch(e) {
    context.assert(e.message, false)
  }
})

runner.test("arguments: pattern 2", context => {
  try{
    let arg = parse_argument(argv("./src/test [input a][input b]"))
    context.assert(arg.paths.length    === 1)
    context.assert(arg.paths[0]        === "./src/test")
    context.assert(arg.commands.length === 2)
    context.assert(arg.commands[0]     === "input a")
    context.assert(arg.commands[1]     === "input b")
    context.ok()
  } catch(e) {
    context.assert(e.message, false)
  }
})

runner.test("arguments: pattern 3", context => {
  try{
    let arg = parse_argument(argv("./src/test [input [a]][input [b]]"))
    context.assert(arg.paths.length    === 1)
    context.assert(arg.paths[0]        === "./src/test")
    context.assert(arg.commands.length === 2)
    context.assert(arg.commands[0]     === "input [a]")
    context.assert(arg.commands[1]     === "input [b]")
    context.ok()
  } catch(e) {
    context.assert(e.message, false)
  }
})

runner.test("arguments: pattern 4", context => {
  try{
    let arg = parse_argument(argv("[input a]"))
    context.assert(arg.paths.length    === 1)
    context.assert(arg.paths[0]        === "./")
    context.assert(arg.commands.length === 1)
    context.assert(arg.commands[0]     === "input a")
    context.ok()
  } catch(e) {
    context.assert(e.message, false)
  }
})

runner.test("arguments: pattern 5", context => {
  try{
    let arg = parse_argument(argv("[input [] a]"))
    context.assert(arg.paths.length    === 1)
    context.assert(arg.paths[0]        === "./")
    context.assert(arg.commands.length === 1)
    context.assert(arg.commands[0]     === "input [] a")
    context.ok()
  } catch(e) {
    context.assert(e.message, false)
  } 
})
runner.test("arguments: pattern 6", context => {
  try{
    let arg = parse_argument(argv("./src/test [echo one && echo two]"))
    context.assert(arg.paths.length    === 1)
    context.assert(arg.paths[0]        === "./src/test")
    context.assert(arg.commands.length === 1)
    context.assert(arg.commands[0]     === "echo one && echo two")
    context.ok()
  } catch(e) {
    context.assert(e.message, false)
  }
})
runner.test("arguments: pattern 7 (expect error)", context => {
  try {
    let arg = parse_argument(argv("[input ] a]"))
    context.assert("expected error", false)
  } catch(e) {
    context.ok()
  }
})
runner.test("arguments: pattern 8 (expect error)", context => {
  try {
    let arg = parse_argument(argv("[input [ a]"))
    context.assert("expected error", false)
  } catch(e) {
    context.ok()
  }
})
runner.test("arguments: pattern 9 (multiple path)", context => {
  try {
    let arg = parse_argument(argv("./path1 ./path2 [input a] [input b]"))
    context.assert(arg.paths.length    === 2)
    context.assert(arg.paths[0]        === "./path1")
    context.assert(arg.paths[1]        === "./path2")
    context.assert(arg.commands.length === 2)
    context.assert(arg.commands[0]     === "input a")
    context.assert(arg.commands[1]     === "input b")
    context.ok()
  } catch(e) {
    context.assert(e.message, false)
  }
})

runner.test("process: ping google.com and wait.", context => {
  let process = create_process(1, "ping google.com -n 2")
  let hasdata = false
  setTimeout(() => {
    context.assert("process didn't exit within 5 seconds", false)
    process.dispose()
  }, 5000)
  process.on("data", data => { hasdata = true })
  process.on("end",  ()   => {
    if(hasdata) context.ok()
    else context.assert("process emitted no data", false)
  })
  process.start()
})

runner.test("process: ping google.com and terminate.", context => {
  let process = create_process(1, "ping -n 10000")
  let hasdata = false
  let hasend  = false
  setTimeout(() => process.dispose(), 1000)
  setTimeout(() => {
    if(hasdata === false) context.assert("did not receive data signal", false)
    if(hasend  === false) context.assert("did not receive end signal", false)
    context.ok()
  }, 2000)
  process.on("data", data => { hasdata = true })
  process.on("end",  ()   => { hasend  = true })
  process.start()
})


runner.run()




