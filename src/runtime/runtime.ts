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

/// <reference path="../typings/node/node.d.ts" />

import * as events                from "events"
import {Argument}                 from "../parser/parse"
import {create_watcher, IWatcher} from "../watcher/watcher"
import {create_process, IProcess} from "../process/process"

export interface IRuntime {
  on      (event: string,  func: Function)                         : IRuntime 
  on      (event: "data",  func: (data: [number, string]) => void) : IRuntime 
  on      (event: "error", func: (data: string) => void)           : IRuntime  
  on      (event: "end",   func: () => void)                       : IRuntime   
  start   () : void
  dispose () : void
}
class Runtime extends events.EventEmitter implements IRuntime {
  private state     : "pending" | "started" | "stopped"
  private watcher   : IWatcher
  private processes : Array<IProcess>
  
  /**
   * creates a new runtime.
   * @param {Argument} the command line argument.
   * @param {WritableStream} the output stream to pipe any process stdout / stderr.
   * @returns {IRuntime}
   */
  constructor(private argument: Argument, private writer: NodeJS.WritableStream) {
    super()
    this.state     = "pending"
    this.watcher   = undefined
    this.processes = []
  }

  /**
   * writes a process begin message on stdout.
   * @param {number} the index number for the process.
   * @returns {void}
   */
  private begin (index:number, shell: string) : void {
      this.writer.write(`\x1b[33m[${index}: ${shell}]\x1b[0m\n`)
  }

  /**
   * writes the process stdout / stderr out on stdout.
   * @param {number} the index number for this process.
   * @param {string} the data received on stdout / stderr. 
   * @returns {void}
   */
  private log(index:number, data: string) : void {
    this.writer.write(data)
  }
  /**
   * writes a process end message on stdout.
   * @param {number} the index number for the process.
   * @returns {void}
   */
  private end (index:number) : void {
    this.writer.write(`\x1b[33m[${index}: end]\x1b[0m\n`);
  }
  /**
   * restarts all processes managed by this runtime.
   * @returns {void}
   */
  private restart() : void {
      this.processes.forEach(process => process.dispose()) 
      this.processes = this.argument.commands.map((command, index) => 
        create_process(index, command))
      this.processes.forEach((proc, index) => {
        this.begin(index, proc.shell())
        proc.on("data", data => this.log(data[0], data[1]))
        proc.on("end",  ()   => this.end(index))
        proc.start()
      })
  }

  /** 
   * starts this runtime.
   * @returns {void}
   */
  public start() : void {
    switch(this.state) {
      case "pending":
        this.state   = "started"
        this.restart()
        this.watcher = create_watcher (
          this.argument.path, 
          this.argument.timeout
        )
        this.watcher.on("data",   () => this.restart())
        this.watcher.on("error",  () => {})
        this.watcher.on("end",    () => {})
        this.watcher.start()
        break;
      default:
        this.emit("error", "a runtime can only be started once.")
        this.dispose()
        break;
    }
  }
  /** 
   * disposes this runtime and any processes.
   * @returns {void}
   */
  public dispose(): void {
    switch(this.state) {
      case "pending":
        this.state = "stopped"
        this.emit("end")
        break;
      case "started":
        this.state = "stopped"
        this.processes.forEach(process => process.dispose())
        this.watcher.dispose()
        this.emit("end")
        break;
      case "stopped":
        break;
    }
  }
}

/**
 * creates a new runtime.
 * @param {Argument} the command line argument.
 * @param {WritableStream} the output stream to pipe any process stdout / stderr.
 * @returns {IRuntime}
 */
export function create_runtime(argument: Argument, writer: NodeJS.WritableStream) : IRuntime {
  return new Runtime(argument, writer)
}