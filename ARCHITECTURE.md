# Architecture

## Pages

Public:

* Home
* Products
* Product detail

Auth:

* Login

Customer:

* Orders list
* Order detail

Admin:

* Orders management
* Project assignment

## Main Flows

### Purchase

User → Product → Login → Stripe → Order created

### Customer

Login → Orders → Track status

### Admin

View orders → Assign dev → Update status

## Status

* pending_payment
* paid
* queued
* assigned
* in_progress
* review
* delivered
* completed
