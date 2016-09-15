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

/// <reference path="typings/node/node.d.ts" />
import {parse_argument} from "./parser/parse"
import {resolve_path}   from "./cwd/resolve"
import {create_process} from "./process/process"
import {create_watcher} from "./watcher/watcher" 
import {create_runtime} from "./runtime/runtime" 

(function() {
  try {
    let argument = parse_argument(process.argv)
    argument.path = resolve_path (argument.path)
    process.stdout.write(`\x1b[33m[w: ${argument.path}]\x1b[0m\n`)
    if(argument.commands.length === 0)
      throw Error("nothing to run.")
    let runtime   = create_runtime(argument, process.stdout)
    runtime.start()
  } catch(e) {
    process.stdout.write(e.message) 
  }
})()




  
  