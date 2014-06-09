var http = require('http'),
    https = require('https'),
    util = require('util'),
    nodeUrl = require('url'),
    nodeQs = require('querystring');

var helper = {
    resolveUrl: function(base, target) {
        return base.replace(/\/+$/, '') + '/' + target.replace(/^\/+/, '');
    },
    parseUrl: function(url, data) {
        return url.replace(/\:(\w+)/g, function(matcher, key) {
            var ret = '';
            if (data && data[key]) {
                ret = data[key];
            }
            return ret;
        });
    }
};

var RestClient = function(config) {
    config = config || {};
    this.config = config;
    this.api = config.api;
    this.dataType = config.dataType || 'json';
    this.beforeRequest = config.beforeRequest || null;
    this.afterRequest = config.afterRequest || null;
};

RestClient.prototype.register = function(resourcePath, name) {
    if (!name) {
        // TODO 
    }
    if (!!this.constructor.prototype[name]) {
        throw Error('resource "' + name + '" is reserved word, please use another name');
    }
    if (this[name]) {
        if (this[name].resourcePath !== resourcePath) {
            throw Error('resource "' + name + '" has been registered');
        } else {
            return this[name];
        }
    }
    this[name] = new Resource(this.client || this, this);
    this[name].resourcePath = resourcePath;
    return this[name];
};

RestClient.prototype.request = function(options, callback) {
    var _self = this,
        req,
        httplib,
        matcher,
        params,
        url;
    url = helper.parseUrl(options.url || '', options.data);
    url = nodeUrl.parse(url);
    matcher = url.protocol.match(/^http[s]?/i);
    params = {
        host: url.hostname || url.host || 'localhost',
        port: url.port || 80,
        path: url.path || '/',
        method: options.method || 'GET',
        headers: options.headers || {},
        data: options.content || options.data
    };

    var auth = options.auth || url.auth;
    if (auth) {
        options.auth = auth;
    }

    if (matcher && matcher[0] === 'http') {
        httplib = http;
    } else if (matcher && matcher[0] === 'https') {
        params.port = url.port || 443;
        httplib = https;
    } else {
        throw new Error('Protocol ' + url.protocol + ' is not supported');
    }

    if ((options.dataType || this.dataType) === 'json') {
        params.headers.Accept = 'application/json';
    }

    var beforeRequest = options.beforeRequest || this.config.beforeRequest;

    if (typeof beforeRequest === 'function') {
        beforeRequest(params);
    }

    var body = params.data;
    var isReadAction = (params.method === 'GET' || params.method === 'HEAD');

    if (body && !(typeof body === 'string' || Buffer.isBuffer(body))) {
        if (isReadAction) {
            body = nodeQs.stringify(body);
            params.path += (url.query ? '&' : '?') + body;
            body = null;
        } else {
            params.headers['Content-Type'] = params.headers['Content-Type'] || params.headers['content-type'] || 'application/json';
            body = JSON.stringify(body);
        }
    }

    if (body) {
        var length = body.length;
        if (!Buffer.isBuffer(body)) {
            length = Buffer.byteLength(body);
        }
        params.headers['Content-Length'] = length;
    }

    delete params.data;

    req = httplib.request(params, function(res) {
        var data = '';
        res.setEncoding('utf8');
        res.on('data', function(chunk) {
            data += chunk;
        });

        res.on('end', function() {
            var afterRequest = options.afterRequest || _self.config.afterRequest,
                args = [data, res];
            if (typeof afterRequest === 'function') {
                args = afterRequest() || [data, res];
            }
            if (typeof callback === 'function') {
                callback.apply(_self, args);
            }
        });
    });

    req.on('error', function(e) {
        console.log('problem with request: ' + e.message);
    });

    if (body) {
        req.write(body);
    }

    req.end();
    return req;
};

var Resource = function(client, parent) {
    this.client = client;
    this._parent = parent;
};

Resource.prototype.register = function(resourcePath, name) {
    return this._parent.register.call(this, resourcePath, name);
};

Resource.prototype.read = function(data, callback) {
    this._request('GET', data, callback);
};

Resource.prototype.update = function(data, callback) {
    this._request('PUT', data, callback);
};

Resource.prototype.create = function(data, callback) {
    this._request('POST', data, callback);
};

Resource.prototype.remove = function(data, callback) {
    this._request('DELETE', data, callback);
};

Resource.prototype._request = function(method, data, callback) {
    if (typeof data === 'function') {
        callback = data;
        data = '';
    }
    this.client.request({
        url: helper.resolveUrl(this.client.api, this.resourcePath),
        data: data || '',
        method: method || 'GET'
    }, callback);
};

module.exports = RestClient;