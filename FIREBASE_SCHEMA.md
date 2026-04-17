# Firestore Schema

users

* id
* email
* role

products

* id
* name
* slug
* price
* description
* images

orders

* id
* userId
* productId
* paymentStatus
* projectStatus
* assignedDevId
* createdAt

orderDetails

* id
* orderId
* businessName
* content
* references

projectUpdates

* id
* orderId
* status
* note
* createdAt
