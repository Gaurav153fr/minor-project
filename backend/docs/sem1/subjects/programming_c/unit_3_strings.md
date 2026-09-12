# String (character array)

Here's the unified Markdown transcription of the handwritten notes on "String (character array)" organized into pages:

---

# String (character array)

## Character Array:
It is a sequence of characters that is treated as a single data item. Any group of characters (except “double code”) defined by double quotation marks is a string constant.

### Example:
```cpp
"my name is shreya"
"well done"
```

### Functionality:
- `printf("well done");`
  - `"well done"`
  - `"well done"`

## Operations on Character String:
1. Reading and Writing string.
2. Combining string together.
3. Copying one string to another.
4. Comparing string for equality.
5. Extracting a portion of string.

### Definition:
The string can be defined as an array of characters terminated by a null (`'\0'`).

### Usage:
The character array of string is used to manipulate text such as words or sentences.

### Memory Allocation:
Each character in the array occupies one byte of memory, and the last character must always be zero.

### Importance of Null Character:
The termination (null) character is important in a string since it is the only way to identify where the string ends.

---

## Programming Notes on Character Arrays and Strings

## Declaration and Initialization of Variables

### General Form of Declaration of String Variable
The general form of declaring a string variable in C is:
```c
char stringname[size];
```
Example:
```c
char name[10];
```

### When the Compiler Assigns a Character String to a Character Array
When the compiler assigns a character string to a character array, it automatically supplies null (`\0`) at the end of the string. Therefore, the size should be equal to the maximum number of characters in the string plus one.

### Initialization of Character Array
A character array can be initialized in two forms:

#### Example 1
```c
char city[9] = "NEW YORK";
```
This initializes an array `city` with 9 elements, where "NEW YORK" contains 8 characters and one element for the null terminator.

#### Example 2
```c
char city[9] = {'N', 'E', 'W', ' ', 'Y', 'O', 'R', 'K', '\0'};
```
This explicitly initializes each character in the array.

### Initialization Without Specifying the Number of Elements
C also permits initializing a character array without specifying the number of elements. In such cases, the size of the array will be determined automatically.

---

## Character Arrays and Strings

### Example 1:
```c
char str1[5] = {'G', 'O', 'O', 'D', '\0'};
```
- Defines the array `str1` as a 5-element array.
- We can also declare the size much larger than the string size in the initialized value.

### Example 2:
```c
char str1[10] = "GOOD";
```
- In this case, the computer creates a character array of size 10.
- Places the value `"GOOD"` in it, terminated with the null character (`\0`) and initializes all other elements to null.

### Important Notes:
- The following declaration is illegal:
```c
char str1[3] = "GOOD"; // This will give compile-time error.
```
- We cannot separate initialization from declaration:
```c
char str1[5]; // Incorrect
str1 = "GOOD"; // Incorrect
```

- Similarly, we also do not write these statements given below:
```c
char str1[5]; = "GOOD"; // Incorrect
char str1[5];
str1 = str1; // Incorrect
```

---

## Reading String from Terminal

## Using `scanf` Function
The familiar `input` function `scanf` can be used with `%s` format specification to read in a string of characters.

### Example:
```c
char city[10];
scanf("%s", city);
```

### Problem with `scanf` Function
The problem with the `scanf` function is that it terminates its input on the first white space so finds.

#### White Space Includes:
- Blank (`\n`)
- Tab
- New Line

### Example:
Input: `NEW-YORK`
Output: `NEW.` (before white space/new line)

#### Note:
In case of character array appears, `edge` is not required before the variable name.

### Character Array Example:
```c
char city[10] = "NEW-YORK";
```

---

## Programming Notes

### Character Arrays and Strings

#### Example Code
```c
#include <stdio.h>
#include <conio.h>

void main()
{
    char city1[40], city2[40], city3[40], city4[40];
    printf("Enter City names\n");
    scanf("%s %s", &city1, &city2);
    scanf("%s", &city3);
    scanf("%s", &city4);
    printf("\nCity 1 = %s\nCity 2 = %s\nCity 3 = %s\nCity 4 = %s\n", city1, city2, city3, city4);
    getch();
}
```

#### Explanation
- The code reads four city names from the user using `scanf` function.
- The first two cities are read as a pair using `%s`.
- The third city is read individually using `%s`.
- The fourth city is also read individually using `%s`.
- The `getch()` function is used to keep the console window open after execution.

#### Note
- The `%s` format specifier is used for reading strings.
- The `&` operator is used to pass addresses of variables to `scanf` for reading input.

---

## Gets and Puts Function

### Gets Function
The most convenient method of reading a string of text containing whitespace is to use the library function `gets` available in `<stdio.h>`. This function reads characters into a string variable declared previously until a newline character is encountered and then appends a null character to the string.

#### Example Usage:
```c
char str[100];
gets(str);
```

### Puts Function
The another convenient way of printing string values is to use the function `puts` declared in the header file `<stdio.h>`.

#### Example Usage:
```c
puts(str);
```

## Program to Find the Length of a String

### Program Code
```c
void main()
{
    char str[100];
    int i, length = 0;
    printf("Enter the string\n");
    gets(str);
    for(i=0; str[i] != '\0'; i++)
    {
        length++;
    }
}
```

This program prompts the user to enter a string, reads it using `gets`, and calculates its length by iterating through the string until a null character (`'\0'`) is encountered.

---

## Programming Notes

### Character Arrays and Strings

#### Example 1:
```c
printf("The string is=%s and length of string is=%d", str, length);
getch();
```
Output: Enter the string.
"my name is shreyas"
The string is="my name is shreyas" and the length is=20.

#### Example 2:
Write a program to find/count number of vowels in the string.

```c
void main()
{
    char str[100];
    int i, count=0;
    printf("Enter the string\n");
    gets(str);
    for(i=0; str[i]!='\0'; i++)
    {
        if(str[i]=='a' || str[i]=='e' || str[i]=='i' || str[i]=='o' || str[i]=='u')
            count++;
    }
    printf("The no of vowels in the string is=%d", count);
    getch();
}
```

---

## Programming (Character Arrays and Strings)

### Example Code

```c
#include <stdio.h>

int main() {
    char str1[100], str2[100];
    int i; count = 0;

    printf("Enter the string1\n");
    gets(str1);

    for (i = 0; str1[i] != '\0', i++) {
        if ((str1[i] == 'A' || str1[i] == 'a') ||
            (str1[i] == 'E' || str1[i] == 'e') ||
            (str1[i] == 'T' || str1[i] == 't') ||
            (str1[i] == 'O' || str1[i] == 'o') ||
            (str1[i] == 'U' || str1[i] == 'u')) {
            count++;
        }
    }

    printf("The string is %s and no. of vowels is %d", str1, count);
    return 0;
}
```

### Output
Enter the string.
"My name is ABHISHEK."
The string is "My name is ABHISHEK" and no. of vowels is 3.

### Problem Statement
Write a program to copy one string into another string and count the number of characters copied.

### Code
```c
#include <stdio.h>

int main() {
    char str1[100], str2[100];
    int i; count = 0;

    printf("Enter the string1\n");
    gets(str1);

    for (i = 0; str1[i] != '\0', i++) {
        str2[i] = str1[i];
    }

    printf("The string is %s and no. of vowels is %d", str2, count);
    return 0;
}
```

---

## Programming (Character Arrays and Strings)

### Example Program

#### Code Snippet:
```c
#include <stdio.h>

int main() {
    char str1[100], str2[100];
    int i;

    printf("Enter the string1\n");
    gets(str1);
    printf("Enter the string2\n");
    gets(str2);

    for(i = 0; str1[i] == str2[i]; i++);
    if(str1[i] == '\0' && str2[i] == '\0') {
        printf("Strings are equal\n");
    } else {
        printf("Strings are not equal\n");
    }

    return 0;
}
```

#### Output:
```
Enter the string1
ABHI
Enter the string2
ABHI
Strings are equal
```

#### Explanation:
The program compares two strings entered by the user. It uses a `for` loop to iterate through each character of both strings until it finds a mismatch or reaches the end of one of the strings. The condition `str1[i] == '\0' && str2[i] == '\0'` checks if both strings have reached their end (`'\0'` is the null terminator). If they do, the strings are considered equal.

#### Note:
- The `gets()` function is deprecated in modern C programming due to security issues. It should be replaced with `fgets()` for better handling of input.

---

## String Function

## Every C compiler uses a set of string library functions available in the C library file.

### To use string functions, we can include a header file `<string.h>` as `#include <string.h>`.

#### The string functions are:
1. `strlen()`
2. `strcpy()`
3. `strcmp()`
4. `strcat()`
5. `strncat()`
6. `strncpy()`
7. `strupr()`
8. `strtolower()`

### `strlen()` method/function
- **strlen** stands for string length.
- This function is used when we need to find the length of any string.

#### For example, if we have a char array `name[10]` and store the value `"SHREYA"`.
- Size of the array is 10, meaning we can store maximum 10 bytes of data for 10 characters.

#### Syntax:
```c
n = strlen(string_name);
```
Example:
```c
n = strlen(name);
```
- It returns an integer number which receives the value of the length of the string.

---

## Page 12 Handwritten Notes Transcription

#### Section 1: `strcpy()` Function
- **Description**: The `strcpy()` function is used to copy one string into another string.
- **Syntax**: `strcpy(string1, string2);`
- **Explanation**: Here, `string1` contains the contents that are copied to `string2`.
- **Example**:
  ```c
  strcpy(city, "Delhi");
  strcpy(city1, city2);
  ```

#### Section 2: `strcat()` Function
- **Description**: The `strcat()` function joins two strings together.
- **Syntax**: `strcat(string1, string2);`
- **Explanation**: When the `strcat()` function is executed, `string2` is appended to `string1`. It does so by overwriting the null character at the end of `string1` and placing `string2`
