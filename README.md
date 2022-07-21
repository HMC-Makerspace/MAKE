# MAKE - Unified managment application for HMC's Makerspace 

[![Rust](https://github.com/IonImpulse/MAKE/actions/workflows/rust.yml/badge.svg)](https://github.com/IonImpulse/MAKE/actions/workflows/rust.yml)

# Live at [make.hmc.edu](https://make.hmc.edu)

## What does MAKE handle?
- Inventory management and discovery
- Student storage reservation and renewal system
- Tool checkout system
- 3D printer status & livestreaming system

## What is in each folder?
`./Documentation` contains in-depth documentation about MAKE, such as how to maintain and add to the system, required maintainence, and API documentation.

`./General Assets` contains various source & production files for commonly used assets.

`./MAKE-server` contains the server files for MAKE, written in Rust.

`./MAKE-website` contains the website files for MAKE. These are served by the MAKE server as static resource files.
