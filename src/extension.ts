'use strict';

import {
  window,
  commands,
  Selection,
  Position,
  TextEditor,
  ExtensionContext
} from 'vscode';
const linter = require('@fuge/standard');
const prettierESLint = require('prettier-eslint');

const eslintConfigFugeStandard = linter.eslintConfig;

export function activate(context: ExtensionContext) {
  console.log('Success');

  const prettierDocument = commands.registerCommand(
    'extension.prettierDocument',
    () => {
      const activeTextEditor = window.activeTextEditor;
      if (!activeTextEditor) return;

      const document = activeTextEditor.document;
      const lineCount = document.lineCount;
      const lastLine = document.lineAt(lineCount - 1);
      let start = new Position(0, 0);
      let end = new Position(
        activeTextEditor.document.lineCount,
        lastLine.text.length
      );
      let isFormatWholeDocument = true;

      // 'prettier-eslint' can't recognize this is `.vue` file
      // so do it myself here
      // but only support to format `script` now
      if (document.languageId === 'vue') {
        isFormatWholeDocument = false;
        // find <script>...</script> selection
        for (let i = 0; i < lineCount; i++) {
          const text = document.lineAt(i).text;
          if (/^\<script\>\s*$/.test(text)) {
            start = new Position(i + 1, 0);
          }
          if (/^\<\/script\>\s*$/.test(text)) {
            end = new Position(i - 1, document.lineAt(i - 1).text.length);
          }
        }
      }

      const selection = new Selection(start, end);
      prettier(selection, activeTextEditor, isFormatWholeDocument);
    }
  );

  const prettierSelection = commands.registerCommand(
    'extension.prettierSelection',
    () => {
      const activeTextEditor = window.activeTextEditor;
      if (!activeTextEditor) return;
      const selection = activeTextEditor.selection;
      prettier(selection, activeTextEditor, false);
    }
  );

  context.subscriptions.push(prettierDocument);
  context.subscriptions.push(prettierSelection);
}

function prettier(
  selection: Selection,
  textEditor: TextEditor,
  isFormatWholeDocument: Boolean
) {
  const text = textEditor.document.getText(selection);
  try {
    let formattedText = prettierESLint({
      text,
      eslintConfig: eslintConfigFugeStandard
    });

    textEditor.edit(editor => {
      // if not isFormatWholeDocument, we need remove newline end of file
      if (!isFormatWholeDocument) {
        formattedText = formattedText.slice(0, formattedText.length - 1);
      }
      editor.replace(selection, formattedText);
    });
  } catch (err) {
    window.showErrorMessage(err.message);
  }
}
