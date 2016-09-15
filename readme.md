# fsrun

start and restart os processes on file system watch events.

```
fsrun ./ [node app.js]

fsrun ./ [cargo run --example app]

fsrun ./ [dotnet build]
```
## install
```
npm install fsrun -g
```

## overview

fsrun is a simple command line tool to start and restart OS
processes from file system watch events. fsrun works in a similar 
fashion to nodejs tools like nodemon and node-supervisor, 
but focuses on being able to restart any type of process.

fsrun was primiarly written as a quick / easy to install developer aid for "compile/restart 
on save" scenarios.

## running processes

unless stated otherwise, fsrun will recursively watch the current working directory.
```
fsrun [echo one]
```
which is the same as:
```
fsrun ./ [echo one]
```
users can override the directory / file to watch by specifying a path. The path given
should be absolute or pathed relative to the current working directory.
```
fsrun ../relative/path [echo one]

fsrun c:/absolute/path/index.js [echo one]
```
fsrun can run multiple processes on watch events by grouping shell commands inside [  ].
```
fnrun ./ [echo one] [echo two] [echo three]
```
each process is run and rerun concurrently.