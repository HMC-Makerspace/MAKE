from sys import argv
from os import getcwd
from glob import glob
import re

print("Running auto_update_cache.py")

directory = getcwd()

script_files = (
    glob("MAKE-website\\*.html", recursive=True) + 
    glob("MAKE-website\\kiosks\\*.html", recursive=True)
)

updated_file_names = map(
    lambda name: name
        .replace("MAKE-server\\","")
        .replace("MAKE-website\\", "")
        .replace("MAKE-server/","")
        .replace("MAKE-website/", ""),
    argv[1:]
)

for file in script_files:
    with open(file, "r") as fr:
        contents = fr.read()
        for updated_file_name in updated_file_names:
            pattern = rf'<script src="{updated_file_name}\?v=([\d\.]+)"><\/script>'
            if m := re.search(pattern, contents):
                print(f"Matched {updated_file_name} in {file}!")
                version_string = m.group(1)
                version, subversion = map(int, version_string.split("."))
                subversion += 1
                replacement = rf'<script src="{updated_file_name}?v={version}.{subversion}"></script>'
                contents = re.sub(pattern, replacement, contents)
                with open(file, "w") as fw:
                    print(f"Wrote new contents to {file}.")
                    fw.write(contents)