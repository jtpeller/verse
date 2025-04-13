# =================================================================
# = generate_lists.py
# =  Description   : Generates the word lists from words.txt
# =  Author        : jtpeller
# =  Date          : 2025.01.03
# =================================================================

def remove_uppercase():
    """ 
    Removes all uppercase words from words.txt
    Don't want proper names in the final word lists.
    """

    print("Removing uppercase words from list.")
    with open("words.txt", encoding="utf-8") as f:
        s = f.read()

        if "\r\n" in s:
            print("CRLF detected")
            words = s.split("\r\n")
        else:
            print("LF detected")
            words = s.split("\n")

        copy = words.copy()

        for word in words:
            if word[0] == word[0].upper():
                copy.remove(word)

        with open('output.txt', 'w', encoding="utf-8") as output:
            for line in copy:
                output.write("".join(line) + "\n")    # default to LF

def splitter():
    """ this splits the larger text file (output.txt) by word length """
    with open("output.txt", encoding="utf-8") as f:
        s = f.read()
        
        # denote whether CRLF or LF.
        if "\r\n" in s:
            print("CRLF detected")
            words = s.split("\r\n")
        else:
            print("LF detected")
            words = s.split("\n")

        # loop over each of the applicable word lengths
        for length in range(3, 13):
            working_list = []
            print("Length =", length)

            for word in words:
                if len(word) == length:
                    working_list.append(word)

            filename = 'words-'+str(length)+'.txt'

            with open(filename, 'w', encoding="utf-8") as output:
                for line in working_list:
                    output.write("".join(line) + "\n")    # default to CRLF

def main():
    """ main function """
    remove_uppercase()
    splitter()

main()
