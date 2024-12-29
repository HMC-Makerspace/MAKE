# MAKE v3 - Unified management application for HMC's Makerspace 

**Live at [make.hmc.edu](https://make.hmc.edu)**

## What does MAKE handle?
- Inventory management and discovery
- Workshop scheduling and registration
- Tool checkout system
- Shift scheduling and management
- Steward proficiency program
- Student grant applications
- Restock requests and fulfillment

## What is in each folder?
`./server` contains the server files for MAKE, which uses an [ExpressJS](https://expressjs.com/) backend with a [MongoDB](https://www.mongodb.com/) database, [Pino](https://github.com/pinojs/pino) for logging, [Jest](https://jestjs.io/) for testing, and [Bun] as a package manager. The server is broken up into several sections:
- `./server/core`, which contains information relevant to the setup of the server itself
- `./server/models`, which contains the data models for the MongoDB database
- `./server/routes`, which contains the API routes for communicating with the database
- `./server/controllers`, which contains the logic for the API routes
- `./server/email_templates`, which contains email templates that can be quickly reused

`./common` contains data types for all the various information stored in the MongoDB database. These types are shared across the server and website.

`./website` contains the website files for MAKE. These are served by the MAKE server as static resource files. The frontend website is built using [React](https://react.dev/), [TailwindCSS](https://tailwindcss.com/), [NextUI](https://nextui.org/), and [Redux](https://redux.js.org/). The website is also broken up into several sections:
- `./website/components`, which contains the React components for the website
- `./website/build`, which contains the build files for the website

## Development setup
To get started developing MAKE, you'll need git, Bun, and a local MongoDB installation.

- Git can be downloaded from [this page](https://git-scm.com/downloads) or by using brew for MacOS.
- Bun can be downloaded from [this page](https://bun.sh/).
- MongoDB Community can be downloaded from [this page](https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-os-x/#std-label-install-mdb-community-macos) or [this page](https://www.mongodb.com/try/download/community), but make sure *NOT* to install mongodb-atlas, which is their cloud version of mongodb.
- MongoDB Compass is the GUI for MongoDB, and can be downloaded from [this page](https://www.mongodb.com/try/download/compass).

Once you've installed these tools, clone this repo by running 

```
git clone https://github.com/HMC-Makerspace/MAKE.git
```

Navigate into the folder by running 

```
cd MAKE
```

Then install the requirements by running

```
bun install
```

Copy over the `template.env` file to create your own local `.env` configuration file by running

```
cp template.env .env
```

Filled out in the config file as needed for your installation.

Finally, build the frontend code by running

```
bun dev
```

and start the server by running

```
bun start
```

and navigate to http://127.0.0.1:3000. If you're deploying this in production, make sure to change the `NODE_ENV` variable in the `.env` file to `production`.

## Tips and Tricks
### Backing Up
Before any large change, make sure to use `mongoduump` to backup the database. This can be done by running
```
mongodump --uri="mongodb://127.0.0.1:27017" --db make --out make_backup
```

### Pushing Changes to Server
After committing your changes to the repo, you can push them to production by first SSHing into the server using
```
ssh ethan@make.hmc.edu
```
and navigating to the MAKE directory. The password should be known by the Head Steward team. After logging in, run `git pull` to pull the changes from the repo. 

If you've made changes to any Python files, you'll need to restart the server by running ```screen -r make``` to reattach to the server screen. Run the build and start commands to reboot the server, then press `CTRL + A`, let go, and then press `D`, to leave the screen running in the background. In the future, `nodemon` should be used to automatically restart the server when changes are made.
