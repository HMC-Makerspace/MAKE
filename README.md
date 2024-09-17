# MAKE - Unified managment application for HMC's Makerspace 

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
`./MAKE-server` contains the server files for MAKE, written in Python with FastAPI as a framework.

`./MAKE-website` contains the website files for MAKE. These are served by the MAKE server as static resource files.

## Development setup
To get started developing MAKE, you'll need git, python3, and a local MongoDB installation.

- Git can be downloaded from [this page](https://git-scm.com/downloads) or by using brew for MacOS.
- Python can be downloaded from [this page](https://www.python.org/downloads/) or by using brew for MacOS.
- MongoDB Community can be downloaded from [this page](https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-os-x/#std-label-install-mdb-community-macos), but make sure *NOT* to install mongodb-atlas, which is their cloud version of mongodb.
- MongoDB Compass is the GUI for MongoDB, and can be downloaded from [this page](https://www.mongodb.com/try/download/compass).

Once you've installed these tools, clone this repo by running 

`git clone https://github.com/HMC-Makerspace/MAKE.git`

Navigate into the server by running 

```cd MAKE/MAKE-server```

Then install the requirements by running

`pip install -r requirements.txt` or `pip3 install -r requirements.txt`

Copy over the template config file

`cp template_config.py config.py`

Nothing needs to be filled out in the config file unless you're testing emailing or the Discord bot.

Finally, start the server by running

`python main.py` or `python3 main.py`

and navigate to http://127.0.0.1:8080. If you're deploying this in production, make sure to use the `--prod` flag.

## Tips and Tricks
### Backing Up
Before any large change, make sure to use `mongoduump` to backup the database. This can be done by running
`mongodump --uri="mongodb://127.0.0.1:27017" --db make --out make_backup`

### Pushing Changes to Server
After committing your changes to the repo, you can push them to production by first SSHing into the server using
`ssh ethan@make.hmc.edu`
and navigating to the MAKE directory. The password should be known by the Head Steward team. After logging in, run `git pull` to pull the changes from the repo. 

If you've made changes to any Python files, you'll need to restart the server by running `screen -r make` to reattach to the server screen. Run  `python3 main.py --prod` to start the server again, then press `CTRL + A`, let go, and then press `D`, to leave the screen running in the background. If no changes were made to Python files, the server will automatically restart with the new changes, and this step can be skipped.
