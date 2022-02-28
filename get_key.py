import requests

data = { "host": "http://localhost/?" }

r = requests.post("http://172.23.0.2:8080/hello-from-the-world/get_hello", data=data)

print(r.text)