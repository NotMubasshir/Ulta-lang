import * as fs from 'fs';
import { UltaInterpreter } from './main.js';

const args = process.argv.slice(2);
if (args.length === 0) {
    console.log("Error: Kono .ulta file dewa hoy nai, bhai!");
    console.log("Usage: npx tsx src/cli.ts <filename.ulta>");
    process.exit(1);
}

const filePath = args[0]!;
if (!fs.existsSync(filePath)) {
    console.log(`Error: File paoya gelo na: ${filePath}`);
    process.exit(1);
}

const code = fs.readFileSync(filePath, 'utf-8');
const engine = new UltaInterpreter();

try {
    engine.interpret(code);
} catch (err: any) {
    console.error(err.message);
}