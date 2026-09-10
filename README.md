# Ulta

Ulta is a Banglish-inspired esoteric programming language built around the idea of doing things a little ulta.

It is an experimental interpreted language with:

* Banglish keywords
* Variables
* Arithmetic operations
* Conditions
* Loops
* Functions
* Reverse block execution
* Banglish-style error messages
* A browser playground
* A TypeScript interpreter

The main language gimmick is that statements inside blocks execute from the bottom to the top.

For example:

```
jodi x > 5 {
    dekhao "First";
    dekhao "Second";
}
```

The output will be:

```
Second
First
```

This behavior is intentional and is part of Ulta's language design.

## Repository

GitHub repository:

https://github.com/notmubasshir/Ulta-lang

## Project Status

Ulta is currently an experimental language project.

The interpreter is suitable for:

* Learning how interpreters work
* Experimenting with programming-language syntax
* Building small scripts
* Understanding parsing and execution
* Creating unusual programming-language behavior

The language is not intended for production software yet.

## Requirements

Before installing Ulta, install the following tools:

* Git
* Node.js
* npm
* Visual Studio Code

Node.js version 18 or newer is recommended.

You can check whether Node.js and npm are installed by opening a terminal and running:

```
node --version

npm --version
```

You can check Git with:

```
git --version
```

If any command is not recognized, install the missing tool first.

## Installation

### 1. Clone the repository

Open a terminal and run:

```
git clone https://github.com/notmubasshir/Ulta-lang.git
```

Then enter the project directory:

```
cd Ulta-lang
```

### 2. Install dependencies

Run:

```
npm install
```

This installs the packages required by the project.

### 3. Open the project in Visual Studio Code

Run:

```
code .
```

If the code command is not available, open Visual Studio Code manually and select:

```
File → Open Folder
```

Then select the Ulta-lang folder.

## Project Structure

The project may contain files similar to these:

```
Ulta-lang/
├── src/
│   └── cli.ts
│   └── main.ts
├── LICENSE
├── index.html
├── package.json
├── tsconfig.json
├── logo.svg
├── README.md
├── package-lock.json
└──.gitignore
```

The exact structure may change as the project develops.

The main.ts contains the language logic.

The web playground provides:

* Code editing
* Example programs
* Run button
* Output panel
* Error display
* Theme switching
* Language documentation

## Running the Interpreter

If the project contains a development script, run:

```
npm run dev
```

Then open the local address shown in the terminal.

If the project contains a build script, run:

```
npm run build
```

To start a production build, run:

```
npm run start
```

The available commands are defined inside package.json.

You can inspect them with:

```
npm run
```

## Running the Web Playground

The web playground is designed to let users write and execute Ulta code directly in the browser.

Typical steps:

1. Install the project dependencies.
2. Start the development server.
3. Open the local URL shown in the terminal.
4. Write Ulta code in the editor.
5. Press the Run script button.
6. Read the result in the output panel.

The playground also supports:

* Loading example programs
* Resetting the editor
* Clearing output
* Running code with Ctrl + Enter
* Switching between dark and light themes

## Ulta Syntax

### Printing Values

Use dekhao to print a value.

```
dekhao "Hello, Bangladesh";
```

Output:

```
Hello, Bangladesh
```

You can also print numbers:

```
dekhao 123;
```

### Variables

Use banao to create a variable.

```
banao x = 10;
```

Print the variable:

```
dekhao x;
```

Output:

```
10
```

### Updating Variables

Variables can be updated using assignment.

```
banao score = 10;

score = score + 5;

dekhao score;
```

Output:

```
15
```

### Arithmetic

Ulta supports these arithmetic operators:

* Addition: +
* Subtraction: -
* Multiplication: *
* Division: /
* Remainder: %

Example:

```
banao a = 8;
banao b = 3;

dekhao a + b;
dekhao a - b;
dekhao a * b;
dekhao a / b;
dekhao a % b;
```

Expected output:

```
11
5
24
2.6666666666666665
2
```

### String Values

Strings can be written inside double quotes or single quotes.

```
dekhao "Hello";
dekhao 'World';
```

Strings can be combined with the plus operator.

```
banao name = "Bangladesh";

dekhao "Hello, " + name;
```

Output:

```
Hello, Bangladesh
```

### Conditions

Use jodi to create a condition.

```
banao x = 10;

jodi x > 5 {
    dekhao "x is greater than 5";
}
```

The supported comparison operators are:

* Equal: ==
* Not equal: !=
* Greater than: >
* Less than: <
* Greater than or equal: >=
* Less than or equal: <=

### Jodi and Nahole

Use nahole for the alternative branch.

```
banao x = 3;

jodi x > 5 {
    dekhao "Large number";
}

nahole {
    dekhao "Small number";
}
```

Because block statements execute in reverse order, the statements inside each block run from bottom to top.

### Loops

Use jotokhon to create a while-style loop.

```
banao x = 0;

jotokhon x < 3 {
    dekhao x;
    x = x + 1;
}
```

Because the block executes backwards, the assignment may execute before the print statement.

The current interpreter also includes a safety limit for loops to prevent accidental infinite execution.

### Functions

Use kaaj to declare a function.

```
kaaj greet(name) {
    dekhao "Hello, " + name;
}
```

Call the function by using its name and passing an argument.

```
greet("Bangladesh");
```

Output:

```
Hello, Bangladesh
```

Functions can accept multiple parameters.

```
kaaj add(a, b) {
    dekhao a + b;
}

add(5, 7);
```

Output:

```
12
```

Function bodies also follow the reverse-execution rule.

## The Reverse-Execution Rule

The defining feature of Ulta is reverse execution inside blocks.

Consider this code:

```
banao x = 0;

jotokhon x < 3 {
    dekhao x;
    x = x + 1;
}
```

The block contains two statements:

1. Print x
2. Increase x

Ulta executes them in reverse order:

1. Increase x
2. Print x

Therefore, the output is:

```
1
2
3
```

This is different from ordinary programming languages and is intentional.

## Error Messages

Ulta uses Banglish-style error messages.

Examples include:

```
bhul: ei variable ba value pawa jay nai (score).

bhul: ei function pawa jay nai (greet).

bhul: function er argument sankha milche na.

bhul: condition thik moto lekha hoyni.

bhul: loop sesh hocche na, infinite loop!

bhul: ei line bujha gelo na.
```

These messages are intended to be understandable while keeping the language's Banglish identity.

## Example Program

```
banao name = "Ulta";
banao version = 1;

dekhao "Language: " + name;
dekhao "Version: " + version;

jodi version == 1 {
    dekhao "Experimental release";
}

kaaj greet(person) {
    dekhao "Welcome, " + person;
}

greet("Bangladesh");
```

## Browser Playground

The playground is a visual interface for testing Ulta programs.

It includes:

### Code Editor

The code editor is used to write Ulta source code.

### Example Selector

The example selector loads sample programs such as:

* Reverse loop
* Arithmetic
* Jodi and nahole
* Functions
* Text output

### Output Panel

The output panel displays:

* Program output
* Successful execution status
* Error messages
* Empty execution results

### Keyboard Shortcut

Press Ctrl + Enter while focused on the editor to run the program.

On macOS, use Command + Enter.

## Development

To modify the interpreter:

1. Open the source directory.
2. Find the interpreter file.
3. Make the required changes.
4. Save the file.
5. Run the project again.
6. Test the changes using the playground.

When changing the parser or execution logic, test:

* Simple statements
* Nested blocks
* Conditions
* Else branches
* Loops
* Functions
* Function arguments
* String values
* Invalid variables
* Invalid function calls
* Missing braces
* Infinite loops

## Testing Examples

### Variable Test

```
banao x = 5;
dekhao x;
```

Expected output:

```
5
```

### Arithmetic Test

```
banao x = 4;
banao y = 2;

dekhao x + y;
dekhao x * y;
```

Expected output:

```
6
8
```

### Function Test

```
kaaj sayHello() {
    dekhao "Hello";
}

sayHello();
```

Expected output:

```
Hello
```

### Condition Test

```
banao x = 10;

jodi x == 10 {
    dekhao "Correct";
}
```

Expected output:

```
Correct
```

## Common Installation Problems

### Node.js is not recognized

Install Node.js and restart Visual Studio Code.

Then run:

```
node --version
```

### npm install fails

Try the following:

```
npm cache clean --force
```

Then run:

```
npm install
```

If the problem continues, delete the node_modules folder and package-lock.json file, then run npm install again.

### The development server does not start

Check that:

* You are inside the Ulta-lang directory.
* Node.js is installed.
* Dependencies were installed.
* package.json exists.
* The terminal does not show another error.

Run:

```
npm run
```

This shows the scripts available in the project.

### The browser playground shows an error

Check:

* Whether the Ulta syntax is correct
* Whether every statement ends with a semicolon
* Whether every block has a closing brace
* Whether variable names are spelled correctly
* Whether function arguments match the declared parameters
* Whether a loop changes its condition value

## Contributing

Contributions are welcome.

You can contribute by:

* Reporting bugs
* Suggesting new keywords
* Improving the parser
* Improving error messages
* Adding example programs
* Improving the playground
* Improving the documentation
* Adding tests
* Suggesting new reverse-execution features

Before submitting changes:

1. Test the interpreter.
2. Test the playground.
3. Check that existing syntax still works.
4. Keep the language design consistent.
5. Explain the purpose of the change.

## Design Philosophy

Ulta is built around controlled absurdity.

The language takes familiar programming concepts and changes their behavior slightly:

* Blocks execute backwards.
* Keywords are written in Banglish.
* Error messages use Banglish wording.
* Functions and loops behave according to the reverse-execution rule.
* The language is intentionally unusual but still understandable.

The goal is not to make programming impossible.

The goal is to make programming feel different.

## License

Check the repository for the current license information.

If no license has been added yet, the project should add one before being used or distributed as a public open-source package.

## Author

Created by notmubasshir.

## Links

Repository:

https://github.com/notmubasshir/Ulta-lang
