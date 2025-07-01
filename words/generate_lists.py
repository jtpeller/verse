"""
generate_lists.py
- Description   : Generates the word lists from words.txt
- Author        : jtpeller
- Date          : 2025.01.03
"""


def read_file(file: str) -> list[str]:
    """ Reads the file at $file """
    with open(file, encoding="utf-8") as f:
        s = f.read()
        words = s.splitlines()
    return words


def write_file(filename: str, word_list: list[str]):
    """ Writes $word_list to $filename"""
    with open(filename, 'w', encoding='utf-8') as f:
        for word in word_list:
            f.write("".join(word) + "\n")


def filter_words(words: list[str]) -> list[str]:
    """ Removes words w/ uppercase, words < 3 and > 12 chars, and duplicates """
    copy = words.copy()
    for idx, word in enumerate(words):
        if word[0] == word[0].upper() or len(word) < 3 or len(word) > 12 or word == words[idx-1]:
            copy.remove(word)
    return copy


def splitter(words: list[str]):
    """ this splits the larger text file (output.txt) by word length """
    # create a mapping of the words by length
    mapping: dict[int, list[str]] = {}
    for word in words:
        letters = len(word)
        try:
            mapping[letters].append(word)
        except KeyError:
            mapping[letters] = [word]

    # write to file
    for k, v in mapping.items():
        write_file(f"words-{k}.txt", v)


def main():
    """ main function """
    words = read_file("words.txt")
    words.sort()
    removed = filter_words(words)
    splitter(removed)


main()
