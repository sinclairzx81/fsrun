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

import * as events        from "events"
import * as cp            from "child_process"

export interface IProcess {
  on      (event: string,  func: Function)                         : IProcess 
  on      (event: "data",  func: (data: [number, string]) => void) : IProcess 
  on      (event: "error", func: (data: string) => void)           : IProcess  
  on      (event: "end",   func: () => void)                       : IProcess 
  shell   (): string
  start   (): void
  write   (data: string): void
  dispose (): void
}
class Process extends  events.EventEmitter implements IProcess {
  private state    : "pending" | "started" | "stopped"
  private encoding : string
  private child    : cp.ChildProcess
  private windows  : boolean

  /**
   * creates a new process with the given command.
   * @param {string} the shell command.
   * @returns {Process} 
   */
  constructor(private id: number, private command: string) {
    super()
    this.state    = "pending"
    this.encoding = "utf8"
    this.child    = undefined
    this.windows  = /^win/.test(process.platform) as boolean
  }
  
  /**
   * returns the shell command associated with this process.
   * @returns {string}
   */
  public shell() : string {
    return this.command
  }

  /**
   * sends this buffer to the process on stdin.
   * @param {string} data the buffer to send.
   * @returns {void}
   */
  public write(data: string): void {
    switch(this.state){
      case "started":
        // is there a better way to flush 
        // this buffer other than \n?
        this.child.stdin.write(data + "\n");
        break;
      default:
        break;
    }
  }

  /**
   * starts this process. A process may be started once.
   * @returns {Promise<any>}
   */
  public start() : void {
    let emit_data = (data: NodeBuffer) => {
      if(this.state === "started"){
        this.emit("data", [this.id, data])
      }
    }
    switch(this.state) {
      case "pending":
        this.state = "started"
        this.child = cp.spawn (
          this.windows ? 'cmd' : 'sh', 
          [ this.windows ? '/c':'-c', this.command ]
        )
        this.child.stdout.setEncoding(this.encoding)
        this.child.stderr.setEncoding(this.encoding)
        this.child.stdout.on("data", data => emit_data(data as Buffer))
        this.child.stderr.on("data", data => emit_data(data as Buffer))
        this.child.on("close", () => this.dispose())
        break;
      default:
        this.emit("error", "cannot start a process more than once.")
        this.dispose()
        break;
    }
  }

  /**
   * terminates and disposes this process.
   * @returns {void}
   */
  public dispose() : void {
    switch(this.state) {
      case "pending":
        this.state = "stopped"
        this.emit("end")
        break;
      case "started":
          this.state = "stopped"
          if(this.windows === true) {
            this.child.stdout.removeAllListeners()
            this.child.stderr.removeAllListeners()
            this.child.removeAllListeners()
            cp.exec('taskkill /pid ' + this.child.pid + ' /T /F')
          } else {
            this.child.stdout.removeAllListeners()
            this.child.stderr.removeAllListeners()
            this.child.removeAllListeners()
            this.child.stdout.pause()
            this.child.stderr.pause()
            this.child.stdin.end()
            this.child.kill("SIGINT")
          } this.emit("end")
        break;
        case "stopped":
          break;
    }
  }
}

/** 
 * creates a new OS process.
 * @param {number} a numeric identifier for this process.
 * @param {string} the shell command to execute.
 * @returns {IProcess}
 */
export function create_process(id: number, shell: string) : IProcess {
  return new Process(id, shell)
}