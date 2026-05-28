import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';

const routesFilePath = path.resolve(__dirname, '../../src/services/api/routes.ts');
const sourceCode = fs.readFileSync(routesFilePath, 'utf-8');
const sourceFile = ts.createSourceFile(
  routesFilePath,
  sourceCode,
  ts.ScriptTarget.Latest,
  true
);

function findMethod(node: ts.Node, methodName: string): ts.MethodDeclaration | undefined {
  if (ts.isMethodDeclaration(node) && node.name.getText() === methodName) {
    return node;
  }
  
  let found: ts.MethodDeclaration | undefined;
  ts.forEachChild(node, child => {
    if (!found) {
      found = findMethod(child, methodName);
    }
  });
  
  return found;
}

const method = findMethod(sourceFile, 'getAmodiataireDetailsUrl');

if (method && method.body) {
  console.log('Method body:');
  console.log(method.body.getText());
  console.log('\n\nAST structure:');
  
  function printNode(node: ts.Node, indent = 0) {
    const spaces = ' '.repeat(indent);
    console.log(`${spaces}${ts.SyntaxKind[node.kind]}: ${node.getText().substring(0, 50)}`);
    ts.forEachChild(node, child => printNode(child, indent + 2));
  }
  
  printNode(method.body);
}
