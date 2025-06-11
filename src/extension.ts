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
	useSelection: boolean;
};

type CountedLines = {
	[index: string]: Array<number>;
};

export function activate(context: vscode.ExtensionContext) {
	let settings: Settings = getSettings();
	let activeDecorations = new Map<vscode.Uri, Array<vscode.TextEditorDecorationType>>();
	let firstActive: boolean = true;
	let timeoutHandler: any;

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

	//Document change listener, only listens for changes in active editor
	vscode.workspace.onDidChangeTextDocument((changeEvent) => {
		try {
			if (changeEvent.document !== vscode.window.activeTextEditor?.document) {
				return;
			}

			clearTimeout(timeoutHandler);
			timeoutHandler = setTimeout(() => highlightLines(), 100);
		} catch (error) {
			console.error("Error from 'workspace.onDidChangeTextDocument' -->", error);
		}
	});

	//Active window change listener
	vscode.window.onDidChangeActiveTextEditor(() => {
		try {
			highlightLines();
		} catch (error) {
			console.error("Error from 'window.onDidChangeActiveTextEditor' -->", error);
		}
	});

	//Command: toggleHighlightDuplicates
	function highlightLines(updateAllVisibleEditors = false) {
		vscode.window.visibleTextEditors.forEach((editor: vscode.TextEditor) => {
			try {

				if (!editor) {
					return;
				}
				if (!updateAllVisibleEditors && editor !== vscode.window.activeTextEditor) {
					return;
				}

				unHighlightLines(editor.document.uri);

				if (!settings.active) {
					return;
				}

				setDecorations(editor, countLines(editor, false));
			}
			catch (error) {
				console.error("Error from 'highlightLines' -->", error);
			}
		});
	}

	function unHighlightLines(documentUri: vscode.Uri) {
		if (!activeDecorations.has(documentUri)) {
			return;
		}
		activeDecorations.get(documentUri)?.forEach((decoration: vscode.TextEditorDecorationType) => {
			decoration.dispose();
		});
		activeDecorations.delete(documentUri);
	}

	function setDecorations(editor: vscode.TextEditor, countedLines: CountedLines) {
		var newDecorations = [];
		for (var i in countedLines) {
			for (var line in countedLines[i]) {
				var lineRange = editor.document.lineAt(countedLines[i][line]).range;
				var newDecoration = { range: new vscode.Range(lineRange.start, lineRange.end) };
				var decoration = getDecoration();
				editor.setDecorations(decoration, [newDecoration]);
				newDecorations.push(decoration);
			}
		}
		activeDecorations.set(editor.document.uri, newDecorations);
	}

	//Command: selectDuplicates
	function selectLines() {
		try {
			var editor = vscode.window.activeTextEditor;

			if (editor?.document && editor?.selections) {
				var countedLines: CountedLines = countLines(editor);
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
				var countedLines: CountedLines = removeFirst(countLines(editor));

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

	function range(size: number, startAt: number = 0) {
		return [...Array(size).keys()].map(i => i + startAt);
	}

	function countLines(editor: vscode.TextEditor, useSelection: boolean = settings.useSelection): CountedLines {
		var results: CountedLines = {};
		var document = editor.document.getText().split("\n");

		var lines: number[] = [];
		if (useSelection) {
			editor.selections.forEach((selection) => {
				lines = lines.concat(range((selection.end.line - selection.start.line) + 1, selection.start.line));
			});
		}
		if (!useSelection || lines.length < 2) {
			lines = [...Array(document.length).keys()];
		}

		lines.forEach((lineNumber) => {
			var line: string = document[lineNumber];

			if (line.trim().length < settings.minLineLength) {
				return;
			}
			if (settings.ignoreList.indexOf(settings.ignoreCaseForIgnoreList ? line.trim().toLocaleLowerCase() : line.trim()) !== -1) {
				return;
			}

			if (settings.trimWhiteSpace) {
				line = line.trim();
			}
			if (settings.ignoreCase) {
				line = line.toLocaleLowerCase();
			}
			if (line in results) {
				results[line].push(lineNumber);
			} else {
				results[line] = [lineNumber];
			}
		});

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
		const ignoreList: Array<string> = config.get("ignoreList", []).filter(value => typeof value === 'string');
		const ignoreCaseForIgnoreList: boolean = config.get("ignoreCaseForIgnoreList", true);
		const useSelection: boolean = config.get("useSelection", false);

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
			ignoreCaseForIgnoreList,
			useSelection
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
export function deactivate() { }
