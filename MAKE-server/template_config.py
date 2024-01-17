# Database configuration
DB_NAME = "make"
DB_USER = ""
DB_PASSWORD = ""

# Size of user storage in bytes
# Default is 2GB
USER_STORAGE_LIMIT_BYTES = 2 * 1024 * 1024 * 1024
# Size of user storage in seconds
# Default is 1 week
USER_STORAGE_LIMIT_SECONDS = 60 * 60 * 24 * 7 

# Discord Bot Token
DISCORD_BOT_TOKEN = ""

# Misc Emails
MAKERSPACE_MANAGEMENT_EMAIL = "makerspace-management-l@g.hmc.edu"
MAKERSPACE_MANAGER_EMAIL = "kneal@g.hmc.edu"
WEBMASTER_EMAIL = "evazquez@g.hmc.edu"

# Email passwords and secrets
GMAIL_EMAIL = "EMAIL"
GMAIL_PASS = "PASSWORD"

# Quiz ID dictionary
QUIZ_IDS = {
    "General": "66546920",
    "Laser3D": "1524924728",
    "SprayPaint": "1841312496",
    "Composite": "913890505",
    "Welding": "482685426",
    "Studio": "2079405017",
    "Waterjet": "2100779718",
    "Loom": "1235553349",
}

# Student Storage Structure
STUDENT_STORAGE_STRUCTURE = {
    "A": 16,
    "B": 16,
    "C": 16,
    "D": 16,
    "E": 4,
    "F": 4,
    "G": 4,
}

# Machines with statuses
LOCATIONS = {
    "main": "Main Area & Cage",
    "laser3d": "3D Printer & Laser Cutter Room",
    "electronic": "Electronic Benches",
    "studio": "Studio",
    "welding": "Welding Area",
    "spraypaint": "Spray Paint Booth",
    "composite": "Composite Room",
}

RESERVABLE_AREAS = {
    "loom": {
        "type": "machine",
    },
    "studio": {
        "type": "location",
    },
    "welding": {
        "type": "location",
    },
    "main": {
        "type": "location",
    },

}

MACHINES = {
    "flsun": {
        "name": "FLSUN 3D Printers",
        "location": "laser3d",
        "count": 4,
        "online": 4,
        "note": None,
    },
    "prusa": {
        "name": "Prusa 3D Printers",
        "location": "laser3d",
        "count": 2,
        "online": 2,
        "note": None,
    },
    "fullspectrum": {
        "name": "Full Spectrum Laser Cutter",
        "location": "laser3d",
        "count": 1,
        "online": 1,
        "note": None,
    },
    "epilog": {
        "name": "Epilog Laser Cutter",
        "location": "laser3d",
        "count": 1,
        "online": 1,
        "note": None,
    },
    "glowforge": {
        "name": "Glowforge Laser Cutter",
        "location": "laser3d",
        "count": 1,
        "online": 1,
        "note": None,
    },
    "protomax": {
        "name": "Protomax Waterjet Cutter",
        "location": "laser3d",
        "count": 1,
        "online": 1,
        "note": None,
    },
    "wazer": {
        "name": "Wazer Waterjet Cutter",
        "location": "laser3d",
        "count": 1,
        "online": 1,
        "note": None,
    },
    "markforged": {
        "name": "Markforged 3D Printer",
        "location": "laser3d",
        "count": 2,
        "online": 2,
        "note": None,
    },
    "form2": {
        "name": "Formlabs Form 2 Resin Printer",
        "location": "laser3d",
        "count": 1,
        "online": 1,
        "note": None,
    },
    "fuse1": {
        "name": "Formlabs Fuse 1 SLS Printer",
        "location": "laser3d",
        "count": 1,
        "online": 1,
        "note": None,
    },
    "largeformat": {
        "name": "EPSON P8000 Large Format Printer",
        "location": "main",
        "count": 1,
        "online": 1,
        "note": None,
    },
    "jukisewing": {
        "name": "Juki Leather Sewing Machine",
        "location": "main",
        "count": 1,
        "online": 1,
        "note": None,
    },
    "digitalloom": {
        "name": "Digital Jacquard Loom",
        "location": "main",
        "count": 1,
        "online": 1,
        "note": None,
    },
    "sewingmachines": {
        "name": "Sewing Machines",
        "location": "main",
        "count": 12,
        "online": 12,
        "note": None,
    },
    "embroidery": {
        "name": "Brother PE800 Embroidery Machines",
        "location": "main",
        "count": 4,
        "online": 4,
        "note": None,
    },
    "printingpress": {
        "name": "Printing Press",
        "location": "main",
        "count": 1,
        "online": 1,
        "note": None,
    },
    "cricut": {
        "name": "Cricut Explore Air 2 ",
        "location": "main",
        "count": 1,
        "online": 1,
        "note": None,
    },
}