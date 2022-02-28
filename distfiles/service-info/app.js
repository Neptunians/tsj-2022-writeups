const http = require('http')
const si = require('systeminformation')
const fs = require('fs')

function readkey() {
    try {
        const key = fs.readFileSync('/keyfile', 'utf8');
        return key
    } catch (err) {
        console.error(err);
    }
}

function get_services(service) {
    return new Promise((res, reject) => {
        si.services(service)
        .then(data => {
            console.log(data);
            if (data != null) res(data.toString());
            else res("Failed");
        }).catch(error => {
            console.error("Error: " + error);
            reject("There is an error when fetching services.");
        })
    });
}

const KEY = readkey();

http.createServer((request, response) => {
    let body = [];
    request.on('error', (err) => {
        response.end("Error while parsing request: " + err)
    }).on('data', (chunk) => {
        if(request.method == "POST") body.push(chunk);
    }).on('end', async () => {
        response.on('error', (err) => {
            response.end("Error while sending response: " + err)
        });
        
        if (request.url == "/admin") {
            if (request.method == "POST") {
                if(body) {
                    try {
                        var jsonData = JSON.parse(body);
                        var service = jsonData.service;
                        var client_key = jsonData.key;
                    } catch (e) {
                        response.end("ERROR");
                        return 1;
                    }
                }
                
                if (client_key == KEY) {
                    let return_data = await get_services(service);
                    response.end(return_data);
                } else {
                    console.log("Key does not match.\n");
                    response.end("Only local users with the key can access the function.\n");
                }
            }
            else {
                response.end("This is the admin page.\n");
            }
        } else if (request.url == "/forbidden") {
            response.end("Only local user can access it.\n");
        } else if (request.url == "/") {
            response.end("This is the index page.\n");
        } else {
            response.end("404 Not Found\n");
        }
    });
}).listen(5000);
