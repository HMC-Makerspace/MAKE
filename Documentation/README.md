# MAKE Server Eternity Guide

## Introduction
### 1. Overview
Hello! This is a guide on how to keep the MAKE server running (hopefully) forever (or as long as needed).
This project was originally created by [Ethan Vazquez](https://github.com/IonImpulse) during the summer of 2022.

The base server URL is `https://make.hmc.edu/`. The IP address is `134.173.47.116`.

### 2. If nothing changes...
If nothing changes, the server will keep running forever. This is a good thing.
However, there still are a few things that need to be done.

- Every year before the semester starts, the server will need to be restarted.
SSL certificates are automatically renewed every year by the CertBot installation, 
but the server needs to be stopped and started to reload the certificates.

- The gmail account used to send emails is in Google's low-security mode. 
If Google detects inactivity, or if Google ever stops allowing this mode, you wil need to change the account.
This can be done by editing the `api_keys.json` file to a new email and password. 
Any email service with SMTP support is fine, not just gmail.

### 3. If something changes IRL...
- If the Makerspace Manager changes, the string `MAKERSPACE_MANAGER_EMAIL` needs to be updated in `main.rs`.

- If more 3D printers are added, their IDs will need to be added to the list in `printers.toml`.
Additionally, follow the `Add a 3D Printer` guide in the `How to...` section below.

- If student storage changes, edit `student_storage.toml` to reflect the new storage.
Each key is the row letter, and the value assigned is the number of slots in that row.
EX: `A = 2` means there are 2 slots in row A.

### 4. If you want to change something...

### 5. If you want to change the API...
Please use the standard API version practices of supporting multiple versions of the API.
When this was built, the API version was 1.0, so the base URL was `https://make.hmc.edu/api/v1/`.
Any further API versions should follow this pattern.

## How to...
### 1. Add a 3D Printer
The basic steps to adding a 3D printer to the server are:

1) Add the printer id to the `printers.toml` file. This can be whatever you want, but it needs to be unique.

2) Setup Octoprint on a device. We currently are using oDroid XU4s, but Raspberry Pis are also available.
 
3) Install the webhook plugin. This is a plugin that allows Octoprint to send a POST request to a URL when events happen.

4) Configure the webhook with the following settings: //TODO: ADD WEBHOOK SETTINGS
