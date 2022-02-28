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