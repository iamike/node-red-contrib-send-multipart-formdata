# node-red-contrib-send-multipart-formdata
Simple POST with multiform/formdata content to URLs. Done as a favor for a friend.
Based on node-red-contrib-send-multipart

## Installation
run npm -g install node-red-contrib-send-multipart-formdata

## Usage
Required inputs: url (this is specified on the node) & formdata. Optionally allows to add HTTP Headers.

## add eval to form item iteration
```
obj[item.name] = item.value.startsWith('msg')? eval(item.value):item.value
```
 
