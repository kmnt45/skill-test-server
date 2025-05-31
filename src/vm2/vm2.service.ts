import { Injectable } from '@nestjs/common';
import { NodeVM } from 'vm2';
import ts from 'typescript';

@Injectable()
export class Vm2Service {
  languageMap = {
    javascript: 'javascript',
    typescript: 'typescript',
  } as const;

  async runCode(
    sourceCode: string,
    language: keyof typeof this.languageMap,
    testCallExpression: string,
  ): Promise<{ stdout: string; error?: string }> {
    let jsCode = sourceCode;

    if (language === 'typescript') {
      const transpiled = ts.transpileModule(sourceCode, {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2018,
        },
      });
      jsCode = transpiled.outputText;
    }

    const fullCode = `
      ${jsCode}
      console.log(${testCallExpression});
    `;

    const vm = new NodeVM({
      console: 'off',
      timeout: 3000,
      eval: false,
      wasm: false,
    });

    try {
      let output = '';
      const sandboxConsole = {
        log: (...args: any[]) => {
          output += args.join(' ') + '\n';
        },
      };

      vm.freeze(sandboxConsole, 'console');

      vm.run(fullCode, 'userCode.vm.js');

      return { stdout: output.trim() };
    } catch (error: any) {
      return { stdout: '', error: error.message || String(error) };
    }
  }
}
