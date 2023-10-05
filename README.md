# MAKE - Unified managment application for HMC's Makerspace 

**Live at [make.hmc.edu](https://make.hmc.edu)**

## What does MAKE handle?
- Inventory management and discovery
- Workshop scheduling and registration
- Tool checkout system
- Shift scheduling and management
- Steward proficiency program
- Student grant applications

## What is in each folder?
`./MAKE-server` contains the server files for MAKE, written in Python with FastAPI as a framework.

`./MAKE-website` contains the website files for MAKE. These are served by the MAKE server as static resource files.

## Development setup
To get started developing MAKE, you'll need git, python3, and a local MongoDB installation.

- Git can be downloaded from [this page](https://git-scm.com/downloads) or by using brew for MacOS.
- Python can be downloaded from [this page](https://www.python.org/downloads/) or by using brew for MacOS.
- MongoDB can be downloaded from [this page](https://www.mongodb.com/try/download/community), but make sure *NOT* to install mongodb-atlas, which is their cloud version of mongodb.

Once you've installed these tools, clone this repo by running 

`git clone https://github.com/HMC-Makerspace/MAKE.git`

Navigate into the server by running 

`cd MAKE/MAKE-server`

Then install the requirements by running

`pip install -r requirements.txt` or `pip3 install -r requirements.txt`

Copy over the template config file

`cp template_config.py config.py`

Nothing needs to be filled out in the config file unless you're testing emailing or the Discord bot.

Finally, start the server by running

`python main.py` or `python3 main.py`

and navigate to http://127.0.0.1:8080. If you're deploying this in production, make sure to use the `--prod` flag.
