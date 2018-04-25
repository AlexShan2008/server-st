# server-st: a command-line static server

## 1. Installing Globally
```sh
$ npm i server-st -g
```
## 2. Usage:  server-st [options]: 
```sh
 $ cd TargetFolder 
 $ server-st -p 3000 --open 
```
> `-p 3000` port number default: 8080 
>  `--open` auto open browser

## 3.  *Then you can visit `TargetFolder contents`  in your browser*

## 4. Available Options:
```
 --version       Show version number                                   [boolean]
  -p, --port      server port                                    [default: 8080]
  -o, --hostname  host                                    [default: "localhost"]
  -d, --dir       exec directory                   [default: "C:\Users\ShanGuo"]
  -h, --help      Show help                                            [boolean]

```

#  Development

Checkout this repository locally, then:
```sh
$ npm i
$ node bin/server-st
```

*Then you can visit http://localhost:8080 to view your static server*