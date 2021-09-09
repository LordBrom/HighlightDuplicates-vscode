// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

type Settings = {
	highlightDuplicatesColor: any;
	highlightDuplicatesEnabled: any;
	trimWhiteSpace: any;
	ignoreCase: any;
	minLineLength: any;
	minDuplicateCount: any;
	ignoreList: any;
};

type CountedLine = {
	count: number;
	lines: Array<number>;
};
type CountedLines = {
	[index: string]: CountedLine;
};

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	let activeDecorations: Array<vscode.TextEditorDecorationType> = [];


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

	vscode.workspace.onDidChangeConfiguration(() => {
		highlightLines(true);
	});

	vscode.window.onDidChangeActiveTextEditor(() => {
		try {
			highlightLines();
		} catch (error) {
			console.error("Error from ' window.onDidChangeActiveTextEditor' -->", error);
		}
	});
	vscode.workspace.onDidChangeTextDocument((e: vscode.TextDocumentChangeEvent) => {
		try {
			highlightLines();
		} catch (error) {
			console.error("Error from ' window.onDidChangeTextDocument' -->", error);
		}
	});
	vscode.window.onDidChangeTextEditorSelection(() => {
		try {
			highlightLines();
		} catch (error) {
			console.error("Error from ' window.onDidChangeTextDocument' -->", error);
		}
	});


	function highlightLines(updateAllVisibleEditors = false) {

		for (var d in activeDecorations){
			activeDecorations[d].dispose();
		}

		try {
			const settings = getSettings();

			if (updateAllVisibleEditors) {
				vscode.window.visibleTextEditors.forEach((editor) => {
					setDecorations(editor, settings);
				});
			}

			//edit only currently active editor
			else {
				vscode.window.visibleTextEditors.forEach((editor) => {
					if (editor !== vscode.window.activeTextEditor) {
						return;
					}
					setDecorations(editor, settings);
				});
			}
		}
		catch (error) {
			console.error("Error from ' highlightLines' -->", error);
		}
	}

	function setDecorations(editor: vscode.TextEditor, settings: Settings) {
		const countedLines: CountedLines = countLines(editor.document.getText().split("\n"), settings);

		for (var i in countedLines) {
			if (countedLines[i].count <= settings['minDuplicateCount']) {
				continue;
			}

			for (var p in countedLines[i].lines) {
				if (vscode.window.activeTextEditor) {
					var lineRange = vscode.window.activeTextEditor.document.lineAt(countedLines[i].lines[p]).range;
					var newDecoration = { range: new vscode.Range(lineRange.start, lineRange.end) };
					var decoration = getDecoration();
					vscode.window.activeTextEditor.setDecorations(decoration, [newDecoration]);
					activeDecorations.push(decoration);
				}
			}
		}
	}

}

function countLines(lines: Array<string>, settings: Settings = getSettings() ): CountedLines {
	var results: CountedLines = {};

	for (var i in lines) {
		var line: string = lines[i];

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
			results[line].lines.push(parseInt(i));
		} else {
			results[line] = {
				count: 1,
				lines: [parseInt(i)]
			};
		}
	}

	return results;
}

function getSettings() {
	const config = vscode.workspace.getConfiguration("highlightDuplicates");

	const highlightDuplicatesColor   = config.get("highlightDuplicatesColor");
	const highlightDuplicatesEnabled = config.get("highlightDuplicatesEnabled");
	const trimWhiteSpace             = config.get("trimWhiteSpace");
	const ignoreCase                 = config.get("ignoreCase");
	const minLineLength              = config.get("minLineLength");
	const minDuplicateCount          = config.get("minDuplicateCount");
	const ignoreList                 = config.get("ignoreList");

	const settings: Settings = {
		highlightDuplicatesColor,
		highlightDuplicatesEnabled,
		trimWhiteSpace,
		ignoreCase,
		minLineLength,
		minDuplicateCount,
		ignoreList
	};

	return settings;
}

function getDecoration() {
	const config = vscode.workspace.getConfiguration("highlightDuplicates");

	const borderWidth = config.get("borderWidth");
	const borderStyle = config.get("borderStyle");
	const borderColor = config.get("borderColor");

	const decorationType = vscode.window.createTextEditorDecorationType({
		isWholeLine: false,
		borderWidth: `${borderWidth}`,
		borderStyle: `${borderStyle}`,
		borderColor: `${borderColor}`,
	});

	return decorationType;
}

// this method is called when your extension is deactivated
export function deactivate() {}
