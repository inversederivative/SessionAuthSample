# Session Authentication Sample

---

### Introduction

This is a simple project, which details how to authenticate a user, using session cookies.

It builds upon my Simple Login page I created recently.

---

### Node Initialiation

Run:

	npm install

To ensure all the required libraries are installed.

---

### Config

You will have to setup a MongoDB database, which has the following login credentials:

	username
	password
	host
	port
	database


Create a file called config.json, and give it the proper credentials to login to your server.
You will also want to have a property which is:

	secret

This will serve as your secret key for the cookie.

---
