// require in libs
var request = require('request');

module.exports = function(RED) {

    function httpSendMultipart(n) {
        // Setup node
        RED.nodes.createNode(this, n);
        var node = this;
        var nodeUrl = n.url;

        this.ret = n.ret || "txt"; // default return type is text
        if (RED.settings.httpRequestTimeout) {
            this.reqTimeout = parseInt(RED.settings.httpRequestTimeout) || 60000;
        } else {
            this.reqTimeout = 60000;
        }

        // 1) Process inputs to Node
        this.on("input", function(msg) {

            // Look for value - // TODO improve logic

            if (!n.formdata) {
                // throw an error if no value
                node.warn(RED._("Error: no formdata found to send file."));
                msg.error = "formdata was not defined";
                msg.statusCode = 400;
                node.send(msg); // TODO: make sure this escapes entirely; need better error-handling here
            } else {

                node.status({
                    fill: "blue",
                    shape: "dot",
                    text: "Sending multipart request..."
                });
                var url = nodeUrl;
                if (!url) {
                    node.error(RED._("httpSendMultipart.errors.no-url"), msg);
                    node.status({
                        fill: "red",
                        shape: "ring",
                        text: (RED._("httpSendMultipart.errors.no-url"))
                    });
                    return;
                }

                // Add auth if it exists
                if (this.credentials && this.credentials.user) {
                    var urlTail = url.substring(url.indexOf('://') + 3); // hacky but it works. don't judge me
                    var username = this.credentials.user,
                        password = this.credentials.password;
                    if (url.indexOf("https") >= 0) {
                        url = 'https://' + username + ':' + password + '@' + urlTail;
                    } else {
                        url = 'http://' + username + ':' + password + '@' + urlTail;
                    }

                }

                var headers = {
                    'Content-Type': 'multipart/form-data'
                };
                if (n.headers) {
                    headers = Object.assign(
                        {},
                        headers,
                        n.headers.reduce(function(obj, item) {
                            obj[item.name] = item.value
                            return obj
                        }, {})
                    );
                }
                msg['request-headers'] = headers;

                var formdata = n.formdata.reduce(function(obj, item) {
                    obj[item.name] = eval(item.value)
                    return obj
                }, {})

                var options = {
                    method: 'POST',
                    url: url,
                    headers: headers,
                    formData: formdata
                };

                var thisReq = request(options, function(err, resp, body) {
                    // remove sending status
                    node.status({});

                    //Handle error
                    if (err || !resp) {
                        // node.error(RED._("httpSendMultipart.errors.no-url"), msg);
                        var statusText = "Unexpected error";
                        if (err) {
                            statusText = err;
                        } else if (!resp) {
                            statusText = "No response object";
                        }
                        node.status({
                            fill: "red",
                            shape: "ring",
                            text: statusText
                        });
                    }
                    msg.payload = body;
                    msg.statusCode = resp.statusCode || resp.status;
                    msg['http-send-multipart-headers'] = resp.headers;
                    msg['http-send-multipart-options'] = options;

                    if (node.ret !== "bin") {
                        msg.payload = body.toString('utf8'); // txt

                        if (node.ret === "obj") {
                            try {
                                msg.payload = JSON.parse(body);
                            } catch (e) {
                                node.warn(RED._("httpSendMultipart.errors.json-error"));
                            }
                        }
                    }
                    node.send(msg);
                });

            }

        }); // end of on.input

    } // end of httpSendMultipart fxn

    // Register the Node
    RED.nodes.registerType("http-send-multipart-formdata", httpSendMultipart, {
        credentials: {
            user: {
                type: "text"
            },
            password: {
                type: "password"
            }
        }
    });

};
