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

fsrun will run shell commands written within the [] brackets. 

```
fsrun [echo hello world]
```
By default, fsrun will watch the current working directory.
```
fsrun [echo hello world]
```
is the same as 
```
fsrun ./ [echo hello world]
```

users can explicity state which path to watch. The path given should be absolute or 
pathed relative to the current working directory. The path should also preceed any commands.

```
fsrun ../relative/path [echo hello]

fsrun c:/absolute/path/index.js [echo world]
```

### running multiple processes

fsrun can run multiple processes. Each process is run concurrently and will be 
started / restarted as a group on file system changes. 

```
fnrun ./ [echo one] [echo two] [echo three]
```

### watching multiple paths

It is possible to watch multiple paths by using the + modifier, The following watches the current working directory 
and some 'c:/some/path' path.

```
fsrun ./ + c:/some/path [echo one]
```


