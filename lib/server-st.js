'use strict';

const path = require('path');
const fs = require('fs');
const mime = require('mime');
const chalk = require('chalk');
const util = require('util');
const url = require('url');
const http = require('http');

// let stat = util.promisify(fs.lstatSync);
let stat = util.promisify(fs.stat);

let zlib = require('zlib');
let debug = require('debug')('static:app');
let ejs = require('ejs');

let config = require('./config');
let tmpl = fs.readFileSync(path.join(__dirname, 'tmpl.ejs'), 'utf8');
let readdir = util.promisify(fs.readdir);
let localPath = __dirname.slice(0, -3);
let localurl = '';
let filesCounts = 0;

class Server {
  constructor(args) {
    this.confg = { ...config, ...args };
    this.tmpl = tmpl;
  }
  handleRequest() {
    return async (req, res) => {

      let { pathname } = url.parse(req.url, true);
      
      pathname = decodeURI(pathname);

      // ignore favicon.ico
      if (pathname === '/favicon.ico') return res.end();
      let p = path.join(this.confg.dir, '.' + pathname);
      debug(p)
      let statObj = await stat(p);  //%E5%8C%97%E4%BA%AC

      try {

        if (statObj.isDirectory()) {
          // Directory
          let dirs = await readdir(p); // read directory path
          filesCounts = dirs.length;

          dirs = dirs.map(dir => ({
            path: path.join(pathname, dir),
            name: dir
          }));

          let content = ejs.render(this.tmpl, { localPath, dirs, localurl, filesCounts });

          res.setHeader('Content-Type', 'text/html;charset=utf8');
          res.end(content);
        } else {
          // File
          this.sendFile(req, res, p, statObj);
        }
      } catch (e) {
        this.sendError(req, res, e)
      }
    }
  }
  cache(req, res, statObj) {
    // common md5 ctime-size
    let ifNoneMatch = req.headers['if-none-match'];
    // the lastest modified time
    let ifModifiedSince = req.headers['if-modified-since'];
    // server: the lastest modified time
    let since = statObj.ctime.toUTCString();
    // describe
    let etag = new Date(since).getTime() + '-' + statObj.size;
    res.setHeader('ETag', etag);
    res.setHeader('Last-Modified', since);
    res.setHeader('Cache-Control', 'max-age=10');
    if (ifNoneMatch !== etag) {
      return false;
    }
    if (ifModifiedSince != since) {
      return false;
    }
    res.statusCode = 304;
    res.end();
    return true;
  }
  compress(req, res, p, statObj) {
    let header = req.headers["accept-encoding"];
    if (header) {
      if (header.match(/\bgzip\b/)) {
        res.setHeader('Content-Encoding', 'gzip')
        return zlib.createGzip();
      } else if (header.match(/\bdeflate\b/)) {
        res.setHeader('Content-Encoding', 'deflate')
        return zlib.createDeflate();
      } else {
        return false;
      }
    } else {
      return false;
    }
  }
  range(req, res, p, statObj) {
    let range = req.headers['range'];
    let start = 0;
    let end = statObj.size;
    if (range) {
      let [, s, e] = range.match(/bytes=(\d*)-(\d*)/);
      start = s ? parseInt(s) : start;
      end = e ? parseInt(e) : end;
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Content-Range', `bytes ${start}-${end}/${statObj.size}`)
    }
    return { start, end: end - 1 }
  }
  sendFile(req, res, p, statObj) {
    // 缓存的功能 对比 强制
    if (this.cache(req, res, statObj)) return;
    // complie Accept-Encoding: gzip,deflate,br
    // Content-Encoding:gzip
    res.setHeader('Content-Type', mime.getType(p) + ';charset=utf8');
    let s = this.compress(req, res, p, statObj);
    // range request
    let { start, end } = this.range(req, res, p, statObj);
    let rs = fs.createReadStream(p, { start, end })
    if (s) {
      rs.pipe(s).pipe(res);
    } else {
      rs.pipe(res);
    }
  }
  sendError(req, res, e) {
    debug(util.inspect(e).toString());
    res.statusCode = 404;
    res.end();
  }
  start() {
    let { port, hostname } = this.confg;
    let server = http.createServer(this.handleRequest());
    localurl = `http://${hostname}:${port}`;

    console.log(`${chalk.blue('Starting up server-st success!')}`);
    console.log(`Now you can visit ${chalk.green(localurl)} to view your static server`);
    console.log(`Hit CTRL - C to stop the server`);

    debug(localurl);
    server.listen(port, hostname);
  }
}
module.exports = Server