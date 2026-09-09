export type UltaValue =
    | number
    | string
    | boolean
    | null;

type Scope = Map<string, UltaValue>;

type SimpleStatement = {
    type: "simple";
    code: string;
    line: number;
};

type BlockStatement = {
    type: "block";
    header: string;
    code: string;
    line: number;
};

type Statement = SimpleStatement | BlockStatement;

type UltaFunction = {
    name: string;
    params: string[];
    body: Statement[];
    line: number;
};

export class UltaError extends Error {
    public readonly code: string;
    public readonly line?: number;
    public readonly sourceLine?: string;
    public readonly hint?: string;

    constructor(
        code: string,
        message: string,
        options: {
            line?: number;
            sourceLine?: string;
            hint?: string;
        } = {}
    ) {
        super(message);

        this.name = "UltaError";
        this.code = code;
        this.line = options.line;
        this.sourceLine = options.sourceLine;
        this.hint = options.hint;
    }

    public toString(): string {
        const lineInfo = this.line
            ? `Line ${this.line}: `
            : "";

        const sourceInfo = this.sourceLine
            ? `\n  Code: ${this.sourceLine.trim()}`
            : "";

        const hintInfo = this.hint
            ? `\n  Hint: ${this.hint}`
            : "";

        return `[${this.code}] ${lineInfo}${this.message}${sourceInfo}${hintInfo}`;
    }
}

export class UltaInterpreter {
    private variables: Scope = new Map();

    private functions: Map<string, UltaFunction> = new Map();

    private output: string[] = [];

    private sourceLines: string[] = [];

    private readonly maxLoopIterations = 1000;

    private readonly maxCallDepth = 100;

    private callDepth = 0;

    public interpret(code: string): string[] {
        this.variables.clear();
        this.functions.clear();
        this.output = [];
        this.sourceLines = code.split(/\r?\n/);
        this.callDepth = 0;

        const statements = this.parseCode(code);

        this.executeStatements(
            statements,
            this.variables
        );

        return [...this.output];
    }

    public getVariables(): Record<string, UltaValue> {
        return Object.fromEntries(
            this.variables.entries()
        );
    }

    public getFunctions(): string[] {
        return [...this.functions.keys()];
    }

    private error(
        code: string,
        message: string,
        line?: number,
        hint?: string
    ): never {
        throw new UltaError(code, message, {
            line,
            sourceLine: line
                ? this.sourceLines[line - 1]
                : undefined,
            hint,
        });
    }

    private parseCode(
        code: string,
        startingLine = 1
    ): Statement[] {
        const statements: Statement[] = [];

        let i = 0;
        let line = startingLine;

        while (i < code.length) {
            while (
                i < code.length &&
                /\s/.test(code[i])
            ) {
                if (code[i] === "\n") {
                    line++;
                }

                i++;
            }

            while (
                i < code.length &&
                code[i] === ";"
            ) {
                i++;
            }

            if (i >= code.length) {
                break;
            }

            const statementLine = line;
            const start = i;

            let quote: "'" | '"' | null = null;
            let escaped = false;

            while (i < code.length) {
                const char = code[i];

                if (char === "\n") {
                    line++;
                }

                if (escaped) {
                    escaped = false;
                    i++;
                    continue;
                }

                if (char === "\\") {
                    escaped = true;
                    i++;
                    continue;
                }

                if (quote) {
                    if (char === quote) {
                        quote = null;
                    }

                    i++;
                    continue;
                }

                if (char === "'" || char === '"') {
                    quote = char;
                    i++;
                    continue;
                }

                if (
                    char === ";" ||
                    char === "{" ||
                    char === "}"
                ) {
                    break;
                }

                i++;
            }

            const header = code
                .slice(start, i)
                .trim();

            if (!header) {
                if (code[i] === "}") {
                    this.error(
                        "E004",
                        "Unexpected closing brace '}'.",
                        statementLine,
                        "Check koro prottekta block-er jonno matching '{' ache kina."
                    );
                }

                i++;
                continue;
            }

            const isBlock =
                header.startsWith("jodi ") ||
                header === "nahole" ||
                header.startsWith("jotokhon ") ||
                header.startsWith("kaaj ");

            if (isBlock) {
                if (code[i] !== "{") {
                    this.error(
                        "E005",
                        `Block '${header}' er pore '{' pawa jayni.`,
                        statementLine,
                        "Block header-er pore opening brace '{' dao."
                    );
                }

                i++;

                const blockStart = i;
                const bodyStartLine = line;

                let depth = 1;

                quote = null;
                escaped = false;

                while (
                    i < code.length &&
                    depth > 0
                ) {
                    const char = code[i];

                    if (escaped) {
                        escaped = false;
                        i++;
                        continue;
                    }

                    if (char === "\\") {
                        escaped = true;
                        i++;
                        continue;
                    }

                    if (quote) {
                        if (char === quote) {
                            quote = null;
                        }

                        i++;
                        continue;
                    }

                    if (
                        char === "'" ||
                        char === '"'
                    ) {
                        quote = char;
                        i++;
                        continue;
                    }

                    if (char === "{") {
                        depth++;
                    }

                    if (char === "}") {
                        depth--;
                    }

                    if (char === "\n") {
                        line++;
                    }

                    i++;
                }

                if (depth !== 0) {
                    this.error(
                        "E006",
                        `Block '${header}' er closing '}' pawa jayni.`,
                        statementLine,
                        "Prottekta opening '{' er jonno matching closing '}' dao."
                    );
                }

                const blockCode = code.slice(
                    blockStart,
                    i - 1
                );

                if (header.startsWith("kaaj ")) {
                    const signature = header
                        .slice(5)
                        .trim();

                    const match = signature.match(
                        /^([a-zA-Z_][a-zA-Z0-9_]*)\s*\((.*?)\)$/
                    );

                    if (!match) {
                        this.error(
                            "E007",
                            "Function declaration-er syntax vul.",
                            statementLine,
                            "Correct format: kaaj functionName(x, y) { ... }"
                        );
                    }

                    const name = match[1];

                    const rawParams = match[2].trim();

                    const params = rawParams
                        ? rawParams
                              .split(",")
                              .map((param) => param.trim())
                        : [];

                    if (name === "dekhao") {
                        this.error(
                            "E034",
                            "'dekhao' name hisebe function banano jabe na.",
                            statementLine,
                            "'dekhao' Ulta-r reserved keyword."
                        );
                    }

                    if (name === "banao") {
                        this.error(
                            "E034",
                            "'banao' name hisebe function banano jabe na.",
                            statementLine,
                            "'banao' Ulta-r reserved keyword."
                        );
                    }

                    if (params.length > 20) {
                        this.error(
                            "E033",
                            "Ekta function-e 20 tar beshi parameter deya jabe na.",
                            statementLine,
                            "Function-ta choto choto function-e vag koro."
                        );
                    }

                    for (const param of params) {
                        if (
                            !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(
                                param
                            )
                        ) {
                            this.error(
                                "E008",
                                `Function parameter '${param}' valid na.`,
                                statementLine,
                                "Parameter-er name letter ba underscore diye shuru hote hobe."
                            );
                        }
                    }

                    if (
                        new Set(params).size !==
                        params.length
                    ) {
                        this.error(
                            "E009",
                            `Function '${name}' e duplicate parameter ache.`,
                            statementLine,
                            "Prottekta parameter-er alada name dao."
                        );
                    }

                    this.functions.set(name, {
                        name,
                        params,
                        body: this.parseCode(
                            blockCode,
                            bodyStartLine
                        ),
                        line: statementLine,
                    });

                    continue;
                }

                statements.push({
                    type: "block",
                    header,
                    code: blockCode,
                    line: statementLine,
                });

                continue;
            }

            statements.push({
                type: "simple",
                code: header,
                line: statementLine,
            });

            if (code[i] === ";") {
                i++;
            }
        }

        return statements;
    }

    private executeStatements(
        statements: Statement[],
        scope: Scope
    ): void {
        let i = 0;

        while (i < statements.length) {
            const statement = statements[i];

            if (statement.type === "simple") {
                this.executeLine(
                    statement.code,
                    scope,
                    statement.line
                );

                i++;
                continue;
            }

            if (statement.header.startsWith("jodi ")) {
                const condition = statement.header
                    .slice(5)
                    .trim();

                const next = statements[i + 1];

                const conditionMet =
                    this.evaluateCondition(
                        condition,
                        scope,
                        statement.line
                    );

                if (conditionMet) {
                    this.executeReversedBlock(
                        statement.code,
                        scope
                    );

                    if (
                        next &&
                        next.type === "block" &&
                        next.header === "nahole"
                    ) {
                        i++;
                    }
                } else {
                    if (
                        next &&
                        next.type === "block" &&
                        next.header === "nahole"
                    ) {
                        this.executeReversedBlock(
                            next.code,
                            scope
                        );

                        i++;
                    }
                }

                i++;
                continue;
            }

            if (statement.header === "nahole") {
                i++;
                continue;
            }

            if (
                statement.header.startsWith(
                    "jotokhon "
                )
            ) {
                this.executeLoop(
                    statement,
                    scope
                );

                i++;
                continue;
            }

            this.error(
                "E010",
                `Unknown block '${statement.header}'.`,
                statement.line,
                "Supported block holo jodi, nahole, jotokhon, ebong kaaj."
            );
        }
    }

    private executeReversedBlock(
        code: string,
        scope: Scope
    ): void {
        const statements = this.parseCode(code);

        const reversedStatements = [
            ...statements,
        ].reverse();

        this.executeStatements(
            reversedStatements,
            scope
        );
    }

    private executeLoop(
        statement: BlockStatement,
        scope: Scope
    ): void {
        const condition = statement.header
            .slice("jotokhon ".length)
            .trim();

        if (!condition) {
            this.error(
                "E035",
                "jotokhon loop-er condition khali.",
                statement.line,
                "Example: jotokhon x < 10 { ... }"
            );
        }

        let iterations = 0;

        while (
            this.evaluateCondition(
                condition,
                scope,
                statement.line
            )
        ) {
            if (
                iterations >=
                this.maxLoopIterations
            ) {
                this.error(
                    "E011",
                    "Loop 1000 bar-er beshi cholche. Loop stop kora hoyeche.",
                    statement.line,
                    "Loop-er condition kokhon false hobe seta check koro."
                );
            }

            const previousState = new Map(scope);

            this.executeReversedBlock(
                statement.code,
                scope
            );

            iterations++;

            const stillTrue =
                this.evaluateCondition(
                    condition,
                    scope,
                    statement.line
                );

            if (
                stillTrue &&
                this.scopeIsUnchanged(
                    previousState,
                    scope
                )
            ) {
                this.error(
                    "E036",
                    "Loop-er vitore variable-er kono poriborton hocche na.",
                    statement.line,
                    `Condition '${condition}' sobsomoy true thakte pare.`
                );
            }
        }
    }

    private executeLine(
        rawLine: string,
        scope: Scope,
        lineNumber?: number
    ): void {
        const line = rawLine.trim();

        if (!line) {
            return;
        }

        if (line.startsWith("//")) {
            return;
        }

        if (line.startsWith("dekhao ")) {
            const expression = line
                .slice(7)
                .trim();

            if (!expression) {
                this.error(
                    "E012",
                    "dekhao-er pore kono value nei.",
                    lineNumber,
                    "Example: dekhao \"Hello Ulta\""
                );
            }

            const value = this.evaluateExpression(
                expression,
                scope,
                lineNumber
            );

            const output = this.stringify(value);

            this.output.push(output);

            console.log(output);

            return;
        }

        if (line === "dekhao") {
            this.error(
                "E012",
                "dekhao command-er pore value dite hobe.",
                lineNumber,
                "Example: dekhao 10"
            );
        }

        if (line.startsWith("banao ")) {
            const declaration = line
                .slice(6)
                .trim();

            const equalIndex =
                this.findOperatorOutsideQuotes(
                    declaration,
                    "="
                );

            if (equalIndex === -1) {
                this.error(
                    "E013",
                    "Variable declaration-e '=' nei.",
                    lineNumber,
                    "Example: banao x = 10"
                );
            }

            const name = declaration
                .slice(0, equalIndex)
                .trim();

            const expression = declaration
                .slice(equalIndex + 1)
                .trim();

            this.validateVariableName(
                name,
                lineNumber
            );

            if (!expression) {
                this.error(
                    "E014",
                    `Variable '${name}' er value khali.`,
                    lineNumber,
                    "Variable-er pore ekta number, string, ba onno variable dao."
                );
            }

            if (scope.has(name)) {
                this.error(
                    "E043",
                    `Variable '${name}' agei declare kora hoyeche.`,
                    lineNumber,
                    "Same variable abar banao diye declare koro na. Sudhu assignment koro."
                );
            }

            scope.set(
                name,
                this.evaluateExpression(
                    expression,
                    scope,
                    lineNumber
                )
            );

            return;
        }

        const assignmentIndex =
            this.findOperatorOutsideQuotes(
                line,
                "="
            );

        if (assignmentIndex !== -1) {
            const name = line
                .slice(0, assignmentIndex)
                .trim();

            const expression = line
                .slice(assignmentIndex + 1)
                .trim();

            this.validateVariableName(
                name,
                lineNumber
            );

            if (!scope.has(name)) {
                this.error(
                    "E015",
                    `Variable '${name}' age declare kora hoyni.`,
                    lineNumber,
                    `Age likho: banao ${name} = value`
                );
            }

            if (!expression) {
                this.error(
                    "E016",
                    `Variable '${name}' er value khali.`,
                    lineNumber,
                    "Equals sign-er pore ekta value dao."
                );
            }

            scope.set(
                name,
                this.evaluateExpression(
                    expression,
                    scope,
                    lineNumber
                )
            );

            return;
        }

        const functionCall =
            this.parseFunctionCall(line);

        if (functionCall) {
            this.executeFunctionCall(
                functionCall.name,
                functionCall.arguments,
                scope,
                lineNumber
            );

            return;
        }

        this.error(
            "E017",
            `Ei line-ta bujha jacche na: '${line}'.`,
            lineNumber,
            "dekhao, banao, assignment, ba function call use koro."
        );
    }

    private parseFunctionCall(
        line: string
    ): {
        name: string;
        arguments: string[];
    } | null {
        const match = line.match(
            /^([a-zA-Z_][a-zA-Z0-9_]*)\s*\((.*)\)$/
        );

        if (!match) {
            return null;
        }

        return {
            name: match[1],
            arguments: this.splitArguments(
                match[2]
            ),
        };
    }

    private executeFunctionCall(
        name: string,
        rawArguments: string[],
        callerScope: Scope,
        lineNumber?: number
    ): void {
        const functionData =
            this.functions.get(name);

        if (!functionData) {
            this.error(
                "E018",
                `Ei name-er kono function nei: '${name}'.`,
                lineNumber,
                `Age function banao: kaaj ${name}() { ... }`
            );
        }

        if (
            rawArguments.length !==
            functionData.params.length
        ) {
            this.error(
                "E019",
                `Function '${name}' ${functionData.params.length} ta argument chay, kintu ${rawArguments.length} ta deya hoyeche.`,
                lineNumber,
                functionData.params.length === 0
                    ? "Ei function-e kono argument deya jabe na."
                    : `Dorkar holo: ${functionData.params.join(", ")}`
            );
        }

        if (
            this.callDepth >=
            this.maxCallDepth
        ) {
            this.error(
                "E020",
                "Function call-er maximum depth cross koreche.",
                lineNumber,
                "Function nijeke bar bar call korche kina check koro."
            );
        }

        const localScope: Scope = new Map(
            callerScope
        );

        for (
            let i = 0;
            i < functionData.params.length;
            i++
        ) {
            const argumentText =
                rawArguments[i].trim();

            if (!argumentText) {
                this.error(
                    "E032",
                    `Function '${name}' er ${i + 1} number argument khali.`,
                    lineNumber,
                    "Argument hisebe number, string, value, ba variable dao."
                );
            }

            const value =
                this.evaluateExpression(
                    argumentText,
                    callerScope,
                    lineNumber
                );

            localScope.set(
                functionData.params[i],
                value
            );
        }

        this.callDepth++;

        try {
            this.executeStatements(
                [...functionData.body].reverse(),
                localScope
            );
        } finally {
            this.callDepth--;
        }
    }

    private evaluateCondition(
        expression: string,
        scope: Scope,
        lineNumber?: number
    ): boolean {
        const expr = expression.trim();

        if (!expr) {
            this.error(
                "E021",
                "Condition khali rakha jabe na.",
                lineNumber,
                "Example: jodi x > 5 { ... }"
            );
        }

        if (
            expr.startsWith("&&") ||
            expr.endsWith("&&") ||
            expr.includes("&& &&")
        ) {
            this.error(
                "E037",
                "Condition-e && vulvabe use kora hoyeche.",
                lineNumber,
                "Duita complete condition-er majhe && use koro."
            );
        }

        if (
            expr.startsWith("||") ||
            expr.endsWith("||") ||
            expr.includes("|| ||")
        ) {
            this.error(
                "E038",
                "Condition-e || vulvabe use kora hoyeche.",
                lineNumber,
                "Duita complete condition-er majhe || use koro."
            );
        }

        const orParts =
            this.splitOutsideQuotes(
                expr,
                "||"
            );

        if (orParts.length > 1) {
            return orParts.some((part) =>
                this.evaluateCondition(
                    part,
                    scope,
                    lineNumber
                )
            );
        }

        const andParts =
            this.splitOutsideQuotes(
                expr,
                "&&"
            );

        if (andParts.length > 1) {
            return andParts.every((part) =>
                this.evaluateCondition(
                    part,
                    scope,
                    lineNumber
                )
            );
        }

        if (expr.startsWith("!")) {
            return !this.evaluateCondition(
                expr.slice(1),
                scope,
                lineNumber
            );
        }

        const operators = [
            "==",
            "!=",
            ">=",
            "<=",
            ">",
            "<",
        ];

        for (const operator of operators) {
            const index =
                this.findOperatorOutsideQuotes(
                    expr,
                    operator
                );

            if (index === -1) {
                continue;
            }

            const leftText = expr
                .slice(0, index)
                .trim();

            const rightText = expr
                .slice(index + operator.length)
                .trim();

            if (!leftText || !rightText) {
                this.error(
                    "E022",
                    `Condition '${expr}' incomplete.`,
                    lineNumber,
                    `'${operator}' er dui pashei value dite hobe.`
                );
            }

            const left =
                this.evaluateExpression(
                    leftText,
                    scope,
                    lineNumber
                );

            const right =
                this.evaluateExpression(
                    rightText,
                    scope,
                    lineNumber
                );

            switch (operator) {
                case "==":
                    return left === right;

                case "!=":
                    return left !== right;

                case ">":
                    return (
                        this.compareNumbers(
                            left,
                            right,
                            expr,
                            lineNumber
                        ) > 0
                    );

                case "<":
                    return (
                        this.compareNumbers(
                            left,
                            right,
                            expr,
                            lineNumber
                        ) < 0
                    );

                case ">=":
                    return (
                        this.compareNumbers(
                            left,
                            right,
                            expr,
                            lineNumber
                        ) >= 0
                    );

                case "<=":
                    return (
                        this.compareNumbers(
                            left,
                            right,
                            expr,
                            lineNumber
                        ) <= 0
                    );
            }
        }

        const value =
            this.evaluateExpression(
                expr,
                scope,
                lineNumber
            );

        if (typeof value !== "boolean") {
            this.error(
                "E023",
                `Condition '${expr}' theke true ba false pawa jacche na.`,
                lineNumber,
                "Condition-e ==, !=, >, <, >=, ba <= use koro."
            );
        }

        return value;
    }

    private evaluateExpression(
        expression: string,
        scope: Scope,
        lineNumber?: number
    ): UltaValue {
        const expr = expression.trim();

        if (!expr) {
            this.error(
                "E024",
                "Expression khali rakha jabe na.",
                lineNumber,
                "Ekta number, string, variable, ba calculation dao."
            );
        }

        if (
            expr === "+" ||
            expr === "-" ||
            expr === "*" ||
            expr === "/" ||
            expr === "%"
        ) {
            this.error(
                "E041",
                `Incomplete arithmetic expression: '${expr}'.`,
                lineNumber,
                "Example: banao total = 10 + 5"
            );
        }

        if (
            (expr.startsWith('"') &&
                expr.endsWith('"')) ||
            (expr.startsWith("'") &&
                expr.endsWith("'"))
        ) {
            return this.unescapeString(
                expr.slice(1, -1)
            );
        }

        if (
            expr.startsWith('"') !==
                expr.endsWith('"') ||
            expr.startsWith("'") !==
                expr.endsWith("'")
        ) {
            this.error(
                "E044",
                "String-er quotation complete na.",
                lineNumber,
                "String-er dui pashe matching quote dao."
            );
        }

        if (
            expr === "sotti" ||
            expr === "true"
        ) {
            return true;
        }

        if (
            expr === "bhul" ||
            expr === "false"
        ) {
            return false;
        }

        if (expr === "null") {
            return null;
        }

        if (
            /^-?(?:\d+(?:\.\d*)?|\.\d+)$/.test(
                expr
            )
        ) {
            return Number(expr);
        }

        const plusParts =
            this.splitOutsideQuotes(
                expr,
                "+"
            );

        if (plusParts.length > 1) {
            const values = plusParts.map(
                (part) =>
                    this.evaluateExpression(
                        part,
                        scope,
                        lineNumber
                    )
            );

            if (
                values.some(
                    (value) =>
                        typeof value === "string"
                )
            ) {
                return values
                    .map((value) =>
                        this.stringify(value)
                    )
                    .join("");
            }

            return values.reduce(
                (total, value) =>
                    Number(total) + Number(value),
                0
            );
        }

        for (const operator of [
            "-",
            "*",
            "/",
            "%",
        ]) {
            const parts =
                this.splitOutsideQuotes(
                    expr,
                    operator
                );

            if (parts.length <= 1) {
                continue;
            }

            const values = parts.map(
                (part) =>
                    this.evaluateExpression(
                        part,
                        scope,
                        lineNumber
                    )
            );

            if (
                values.some(
                    (value) =>
                        typeof value === "string" ||
                        typeof value === "boolean" ||
                        value === null
                )
            ) {
                this.error(
                    "E025",
                    `Operator '${operator}' sudhu number-er sathe use kora jabe.`,
                    lineNumber,
                    "Arithmetic-er jonno numeric value use koro."
                );
            }

            let result = Number(values[0]);

            for (
                let i = 1;
                i < values.length;
                i++
            ) {
                const current = Number(
                    values[i]
                );

                if (
                    operator === "/" &&
                    current === 0
                ) {
                    this.error(
                        "E026",
                        "Shunno diye vag kora jabe na.",
                        lineNumber,
                        "Divisor shunno kina check koro."
                    );
                }

                if (
                    operator === "%" &&
                    current === 0
                ) {
                    this.error(
                        "E042",
                        "Shunno diye remainder ber kora jabe na.",
                        lineNumber,
                        "Remainder-er second value shunno hote parbe na."
                    );
                }

                if (operator === "-") {
                    result -= current;
                }

                if (operator === "*") {
                    result *= current;
                }

                if (operator === "/") {
                    result /= current;
                }

                if (operator === "%") {
                    result %= current;
                }
            }

            return result;
        }

        const functionCall =
            this.parseFunctionCall(expr);

        if (functionCall) {
            this.error(
                "E027",
                `Function '${functionCall.name}' expression-er vitore use kora jabe na.`,
                lineNumber,
                "Function ekhon output dite pare, kintu value return kore na."
            );
        }

        if (scope.has(expr)) {
            return scope.get(expr)!;
        }

        this.error(
            "E028",
            `Variable ba value pawa jayni: '${expr}'.`,
            lineNumber,
            "Variable-er spelling check koro ba age variable declare koro."
        );
    }

    private compareNumbers(
        left: UltaValue,
        right: UltaValue,
        expression: string,
        lineNumber?: number
    ): number {
        if (
            typeof left !== "number" ||
            typeof right !== "number"
        ) {
            this.error(
                "E029",
                `Numeric comparison-er jonno dui pashei number lagbe: '${expression}'.`,
                lineNumber,
                "String ba boolean-er sathe >, <, >=, <= use koro na."
            );
        }

        return left - right;
    }

    private validateVariableName(
        name: string,
        lineNumber?: number
    ): void {
        if (!name) {
            this.error(
                "E039",
                "Variable-er name khali.",
                lineNumber,
                "Example: banao boyos = 16"
            );
        }

        if (
            !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(
                name
            )
        ) {
            this.error(
                "E030",
                `Variable-er name valid na: '${name}'.`,
                lineNumber,
                "Name letter ba underscore diye shuru hote hobe."
            );
        }

        if (/^\d/.test(name)) {
            this.error(
                "E040",
                `Variable-er name number diye shuru kora jabe na: '${name}'.`,
                lineNumber,
                "Example: banao number1 = 10"
            );
        }

        const reservedWords = [
            "jodi",
            "nahole",
            "jotokhon",
            "kaaj",
            "dekhao",
            "banao",
            "sotti",
            "bhul",
            "true",
            "false",
            "null",
        ];

        if (reservedWords.includes(name)) {
            this.error(
                "E031",
                `'${name}' ekta reserved keyword.`,
                lineNumber,
                "Ei name-er bodole onno variable name use koro."
            );
        }
    }

    private splitArguments(
        text: string
    ): string[] {
        const trimmed = text.trim();

        if (!trimmed) {
            return [];
        }

        return this.splitOutsideQuotes(
            trimmed,
            ","
        );
    }

    private splitOutsideQuotes(
        text: string,
        separator: string
    ): string[] {
        const result: string[] = [];

        let start = 0;
        let quote: "'" | '"' | null = null;
        let depth = 0;

        for (
            let i = 0;
            i < text.length;
            i++
        ) {
            const char = text[i];

            if (
                char === '"' ||
                char === "'"
            ) {
                if (!quote) {
                    quote = char;
                } else if (quote === char) {
                    quote = null;
                }

                continue;
            }

            if (quote) {
                continue;
            }

            if (char === "(") {
                depth++;
            }

            if (char === ")") {
                depth--;
            }

            if (
                depth === 0 &&
                text.slice(
                    i,
                    i + separator.length
                ) === separator
            ) {
                result.push(
                    text
                        .slice(start, i)
                        .trim()
                );

                start = i + separator.length;

                i += separator.length - 1;
            }
        }

        result.push(
            text.slice(start).trim()
        );

        return result;
    }

    private findOperatorOutsideQuotes(
        text: string,
        operator: string
    ): number {
        let quote: "'" | '"' | null = null;
        let depth = 0;

        for (
            let i = 0;
            i <= text.length - operator.length;
            i++
        ) {
            const char = text[i];

            if (
                char === '"' ||
                char === "'"
            ) {
                if (!quote) {
                    quote = char;
                } else if (quote === char) {
                    quote = null;
                }

                continue;
            }

            if (quote) {
                continue;
            }

            if (char === "(") {
                depth++;
            }

            if (char === ")") {
                depth--;
            }

            if (
                depth === 0 &&
                text.slice(
                    i,
                    i + operator.length
                ) === operator
            ) {
                return i;
            }
        }

        return -1;
    }

    private unescapeString(
        value: string
    ): string {
        return value
            .replace(/\\n/g, "\n")
            .replace(/\\t/g, "\t")
            .replace(/\\"/g, '"')
            .replace(/\\'/g, "'")
            .replace(/\\\\/g, "\\");
    }

    private stringify(
        value: UltaValue
    ): string {
        if (value === null) {
            return "null";
        }

        if (value === true) {
            return "sotti";
        }

        if (value === false) {
            return "bhul";
        }

        return String(value);
    }

    private scopeIsUnchanged(
        previous: Scope,
        current: Scope
    ): boolean {
        if (previous.size !== current.size) {
            return false;
        }

        for (
            const [key, oldValue]
            of previous.entries()
        ) {
            if (!current.has(key)) {
                return false;
            }

            if (
                current.get(key) !== oldValue
            ) {
                return false;
            }
        }

        return true;
    }
}

export function runUltaCode(
    code: string
): {
    success: boolean;
    output: string[];
    error?: string;
} {
    const interpreter = new UltaInterpreter();

    try {
        const output =
            interpreter.interpret(code);

        return {
            success: true,
            output,
        };
    } catch (error) {
        if (error instanceof UltaError) {
            return {
                success: false,
                output: [],
                error: error.toString(),
            };
        }

        return {
            success: false,
            output: [],
            error:
                `Unknown error: ${
                    error instanceof Error
                        ? error.message
                        : String(error)
                }`,
        };
    }
}