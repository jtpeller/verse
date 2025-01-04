#!/usr/bin/python
import sys

n = len(sys.argv)
length = int(sys.argv[1])
print("running splitter")

# this splits the larger text file (output.txt) 
# by word length.
with open("output.txt") as f:
    s = f.read()

    if "\r\n" in s:
        words = s.split("\r\n")
    else:
        words = s.split("\n")
    
    copy = words.copy()

    for word in words:
        if len(word) != length:
            copy.remove(word)
    
    filename = 'words-'+str(length)+'.txt'

    with open(filename, 'w') as output:
        for line in copy:
            output.write("".join(line) + "\r\n")    # default to CRLF
