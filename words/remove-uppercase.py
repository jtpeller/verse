#!/usr/bin/python

# script to remove all uppercase words from words.txt
print("running remove-uppercase.py")
with open("words.txt") as f:
    s = f.read()

    if "\r\n" in s:
        words = s.split("\r\n")
    else:
        words = s.split("\n")
    
    copy = words.copy()

    for word in words:
        if word[0] == word[0].upper():
            copy.remove(word)
    
    with open('output.txt', 'w') as output:
        for line in copy:
            output.write("".join(line) + "\r\n")    # default to CRLF
