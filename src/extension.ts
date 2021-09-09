import * as vscode from 'vscode';

type Settings = {
	active: boolean;
	borderWidth: string;
	borderStyle: string;
	borderColor: string;
	trimWhiteSpace: boolean;
	ignoreCase: boolean;
	minLineLength: number;
	minDuplicateCount: number;
	ignoreList: Array<string>;
	ignoreCaseForIgnoreList: boolean;
};

type CountedLines = {
	[index: string]: Array<number>;
};

export function activate(context: vscode.ExtensionContext) {
	let settings: Settings = getSettings();
	let activeDecorations: Array<vscode.TextEditorDecorationType> = [];
	let firstActive: boolean = true;

	//Adds commands
	context.subscriptions.push(
		vscode.commands.registerCommand('highlight-duplicates.toggleHighlightDuplicates', () => {
			if (firstActive) {
				firstActive = false;
				vscode.workspace.getConfiguration('highlightDuplicates').update('active', true, true);
			} else {
				vscode.workspace.getConfiguration('highlightDuplicates').update('active', !settings.active, true);
			}
			highlightLines();
		}),
		vscode.commands.registerCommand('highlight-duplicates.selectDuplicates', () => {
			firstActive = false;
			selectLines();
		}),
		vscode.commands.registerCommand('highlight-duplicates.removeDuplicates', () => {
			firstActive = false;
			removeDuplicates();
		})
	);

	//Settings change event listener
	vscode.workspace.onDidChangeConfiguration(() => {
		settings = getSettings();
		highlightLines(true);
	});

	//Editor change listeners
	vscode.window.onDidChangeActiveTextEditor(() => {
		try {
			highlightLines();
		} catch (error) {
			console.error("Error from 'window.onDidChangeActiveTextEditor' -->", error);
		}
	});
	vscode.workspace.onDidChangeTextDocument(() => {
		try {
			highlightLines();
		} catch (error) {
			console.error("Error from 'window.onDidChangeTextDocument' -->", error);
		}
	});
	vscode.window.onDidChangeTextEditorSelection(() => {
		try {
			highlightLines();
		} catch (error) {
			console.error("Error from 'window.onDidChangeTextDocument' -->", error);
		}
	});

	//Command: toggleHighlightDuplicates
	function highlightLines(updateAllVisibleEditors = false) {
		try {
			//First remove old decorations
			unHighlightLines();

			if (!settings.active) {
				return;
			}

			if (updateAllVisibleEditors) {
				vscode.window.visibleTextEditors.forEach((editor) => {
					if (editor) {
						setDecorations(editor, countLines(editor.document.getText().split("\n")));
					}
				});
			} else {
				vscode.window.visibleTextEditors.forEach((editor) => {
					if (editor !== vscode.window.activeTextEditor) {
						return;
					}
					setDecorations(editor, countLines(editor.document.getText().split("\n")));
				});
			}
		}
		catch (error) {
			console.error("Error from 'highlightLines' -->", error);
		}
	}

	function unHighlightLines() {
		for (var d in activeDecorations) {
			activeDecorations[d].dispose();
		}
	}

	function setDecorations(editor: vscode.TextEditor, countedLines: CountedLines) {
		for (var i in countedLines) {
			for (var line in countedLines[i]) {
				var lineRange = editor.document.lineAt(countedLines[i][line]).range;
				var newDecoration = { range: new vscode.Range(lineRange.start, lineRange.end) };
				var decoration = getDecoration();
				editor.setDecorations(decoration, [newDecoration]);
				activeDecorations.push(decoration);
			}
		}
	}


	//Command: selectDuplicates
	function selectLines() {
		try {
			var editor = vscode.window.activeTextEditor;

			if (editor?.document && editor?.selections) {
				var countedLines: CountedLines = countLines(editor.document.getText().split("\n"));
				var newSelections = [];

				for (var i in countedLines) {
					for (var line in countedLines[i]) {
						var lineRange = editor.document.lineAt(countedLines[i][line]).range;
						newSelections.push(new vscode.Selection(lineRange.start, lineRange.end));
					}
				}
				editor.selections = newSelections;
			}

		} catch (error) {
			console.error("Error from 'selectLines' -->", error);
		}
	}


	//Command: removeDuplicates
	function removeDuplicates() {
		try {
			var editor = vscode.window.activeTextEditor;

			if (editor?.document && editor?.selections) {
				var countedLines: CountedLines = removeFirst(countLines(editor.document.getText().split("\n")));

				editor.edit(builder => {
					for (var i in countedLines) {
						for (var l in countedLines[i]) {
							if (editor) {
								var lineRange = editor.document.lineAt(countedLines[i][l]).rangeIncludingLineBreak;
								builder.delete(lineRange);
							}
						}
					}
				});
			}
		} catch (error) {
			console.error("Error from 'removeDuplicates' -->", error);
		}
	}

	function removeFirst(countedLines: CountedLines) {
		for (var i in countedLines) {
			countedLines[i].shift();
		}
		return countedLines;
	}

	//

	function countLines(lines: Array<string>): CountedLines {
		var results: CountedLines = {};

		for (var i in lines) {
			var line: string = lines[i];

			if (line.trim().length < settings.minLineLength) {
				continue;
			}
			if (settings.ignoreList.indexOf(settings.ignoreCaseForIgnoreList ? line.trim().toLocaleLowerCase() : line.trim()) !== -1) {
				continue;
			}

			if (settings.trimWhiteSpace) {
				line = line.trim();
			}
			if (settings.ignoreCase) {
				line = line.toLocaleLowerCase();
			}
			if (line in results) {
				results[line].push(parseInt(i));
			} else {
				results[line] = [parseInt(i)];
			}
		}

		for (var l in results) {
			if (results[l].length <= settings.minDuplicateCount) {
				delete results[l];
			}
		}

		return results;
	}

	function getSettings() {
		const config = vscode.workspace.getConfiguration("highlightDuplicates");

		const active: boolean = config.get("active", false);
		const borderWidth: string = config.get("borderWidth", "1px");
		const borderStyle: string = config.get("borderStyle", "solid");
		const borderColor: string = config.get("borderColor", "red");
		const trimWhiteSpace: boolean = config.get("trimWhiteSpace", true);
		const ignoreCase: boolean = config.get("ignoreCase", false);
		const minLineLength: number = config.get("minLineLength", 1);
		const minDuplicateCount: number = config.get("minDuplicateCount", 1);
		const ignoreList: Array<string> = config.get("ignoreList", []);
		const ignoreCaseForIgnoreList: boolean = config.get("ignoreCaseForIgnoreList", true);

		if (ignoreCaseForIgnoreList) {
			for (var i in ignoreList) {
				ignoreList[i] = ignoreList[i].toLocaleLowerCase();
			}
		}

		const settings: Settings = {
			active,
			borderWidth,
			borderStyle,
			borderColor,
			trimWhiteSpace,
			ignoreCase,
			minLineLength,
			minDuplicateCount,
			ignoreList,
			ignoreCaseForIgnoreList
		};

		return settings;
	}

	function getDecoration(): vscode.TextEditorDecorationType {
		const decorationType = vscode.window.createTextEditorDecorationType({
			isWholeLine: false,
			borderWidth: `${settings.borderWidth}`,
			borderStyle: `${settings.borderStyle}`,
			borderColor: `${settings.borderColor}`,
		});

		return decorationType;
	}
}

// this method is called when your extension is deactivated
export function deactivate() {}
