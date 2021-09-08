// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	let activeEditor = vscode.window.activeTextEditor;


	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "highlight-duplicates" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	context.subscriptions.push(vscode.commands.registerCommand('highlight-duplicates.toggleHighlightDuplicates', () => {
		vscode.window.showInformationMessage('Hello World from Highlight Duplicates! toggleHighlightDuplicates');
	}),
	vscode.commands.registerCommand('highlight-duplicates.toggleSelectDuplicates', () => {
		vscode.window.showInformationMessage('Hello World from Highlight Duplicates! toggleSelectDuplicates');
	}),
	vscode.commands.registerCommand('highlight-duplicates.removeDuplicates', () => {
		vscode.window.showInformationMessage('Hello World from Highlight Duplicates! removeDuplicates');
	}));

	vscode.window.onDidChangeActiveTextEditor(() => {
		//console.log(vscode.window.activeTextEditor?.getText());

		try {

			activeEditor = vscode.window.activeTextEditor;
		} catch (error) {
			console.error("Error from ' window.onDidChangeActiveTextEditor' -->", error);
		}
	});

	vscode.workspace.onDidChangeTextDocument((e: vscode.TextDocumentChangeEvent) => {
		try {
			const settings = getSettings();

			const countedLines = countLines(e.document.getText().split("\n"), settings);

			for (var i in countedLines) {

				if (countedLines[i].count <= settings['minDuplicateCount']) {
					continue;
				}

				for (var p in countedLines[i].lines) {

					var lineRange = vscode.window.activeTextEditor.document.lineAt(parseInt(countedLines[i].lines[p])).range;
					var newDecoration = { range: new vscode.Range(lineRange.start, lineRange.end) };
					vscode.window.activeTextEditor.setDecorations(getDecoration(), [newDecoration]);

				}

			}


			//vscode.window.visibleTextEditors.forEach((editor) => {
			//	if (editor !== vscode.window.activeTextEditor) {
			//		return;
			//	}

			//	const currentPosition = editor.selection.active;
			//	const isNewEditor = activeEditor.document.lineCount === 1;
			//	const newDecoration = { range: new vscode.Range(currentPosition, currentPosition) };

			//	if (isNewEditor) {
			//		editor.setDecorations(getDecoration(), [newDecoration]);
			//	}
			//});


			//activeEditor = vscode.window.activeTextEditor;
		} catch (error) {
			console.error("Error from ' window.onDidChangeActiveTextEditor' -->", error);
		}
	});

}

function countLines(lines: Array<String>, settings = getSettings() ) {
	var results = {};

	for (var i in lines) {
		var line = lines[i];

		if (line.length < settings['minLineLength']) {
			continue;
		}
		if (settings['ignoreList'].indexOf(line) !== -1) {
			continue;
		}
		if (settings['trimWhiteSpace']){
			line = line.trim();
		}
		if (settings['ignoreCase']){
			line = line.toLocaleLowerCase();
		}
		if (line in results) {
			results[line].count++;
			results[line].lines.push(i);
		} else {
			results[line] = {
				count: 1,
				lines: [i]
			};
		}
	}

	return results;
}

function getSettings() {
	const config = vscode.workspace.getConfiguration("highlightDuplicates");

	const highlightDuplicatesColor   = config.get("highlight_duplicates_color");
	const highlightDuplicatesEnabled = config.get("highlight_duplicates_enabled");
	const trimWhiteSpace             = config.get("trim_white_space");
	const ignoreCase                 = config.get("ignore_case");
	const minLineLength              = config.get("min_line_length");
	const minDuplicateCount          = config.get("min_duplicate_count");
	const ignoreList                 = config.get("ignore_list");

	return {
		highlightDuplicatesColor,
		highlightDuplicatesEnabled,
		trimWhiteSpace,
		ignoreCase,
		minLineLength,
		minDuplicateCount,
		ignoreList
	};
}

function getDecoration() {
	const decorationType = vscode.window.createTextEditorDecorationType({
		isWholeLine: true,
		borderWidth: `1px`,
		borderStyle: `solid`,
		borderColor: `red`
	});
	return decorationType;
}

// this method is called when your extension is deactivated
export function deactivate() {}



//    private onDidChangeActiveTextEditor(e: vscode.TextEditor | undefined) {
//	if (this.codeCounter_) {
//		// log(`onDidChangeActiveTextEditor(${!e ? 'undefined' : e.document.uri})`);
//		this.countLinesInEditor(e);
//	}
//}
//    private onDidChangeTextEditorSelection(e: vscode.TextEditorSelectionChangeEvent) {
//	if (this.codeCounter_) {
//		// log(`onDidChangeTextEditorSelection(${e.selections.length}selections, ${e.selections[0].isEmpty} )`, e.selections[0]);
//		this.countLinesInEditor(e.textEditor);
//	}
//}
//    private onDidChangeTextDocument(e: vscode.TextDocumentChangeEvent) {
//	if (this.codeCounter_) {
//		// log(`onDidChangeTextDocument(${e.document.uri})`);
//		this.countLinesOfFile(e.document);
//	}
//}
