# Highlight Duplicates

**Highlight duplicated lines.**
This is a vsCode plugin that is the same as the Sublime Text plugin by the same name.

## Commands

### Toggle Highlighting

Using this command will turn the plugin on and off. This allows you to see the highlighted only when you want without having to disable/enable to plugin via the Package Control.


### Select Duplicates

Using this command will select the rows that would be highlighted when Highlight Duplicates is toggled on. The duplicate rows do not need to be highlighted in order for this command to work.


### Remove Duplicates

Using this command will remove all duplicate lines, after the first instance, from the file.

For example...
``` html
1: <someTag></someTag>
2: Content
3: <someTag></someTag>
4:
```
Would result in
``` html
1: <someTag></someTag>
2: Content
3:
```

## Options

### Border Width
`borderWidth: 1px`

The thickness of the outline, along with which side it actually shows can be adjusted with this setting. To make the outline just appear as an underline, change this to `0px 0px 1px 0px`

### Border Style
`borderStyle: solid`
### Border Style
`borderColor: red`
### Trim White Space
`trimWhiteSpace: true`

If this setting is true, the leading and trailing white space will be removed before being compared to other lines. This setting also affects which lines are selected when using the 'Select Duplicates' command.

For example, if `"trim_white_space" : true` the following 2 lines will be counted as duplicates.
``` html
1: <someTag></someTag>
2:      <someTag></someTag>
```
However, the following lines would not be counted as duplicates. The reason for this is because there is white space in line 1 that is not leading or trailing, which does not appear in line 2.
``` html
1: <someTag>      </someTag>
2:      <someTag></someTag>
```


### Ignore Case
`ignoreCase: false`

If this setting is true, upper and lower case letters will be considered the same. This setting also affects which lines are selected when using the 'Select Duplicates' command.

For example, if `"ignore_case" : true` the following 2 lines will be counted as duplicates.
``` html
1: <SomeTag></sOMeTag>
2: <sometag></someTag>
```


### Min Line Length
`minLineLength: 1`

Lines with fewer characters than specified in this setting, will be ignored for all functions. Keeping this to 1 will cause all non empty lines to be possible duplicates.

For example, if set to 4, only lines 7 and 8 will be selected when using the "select duplicate" command. If this setting is set to 2, all the lines except lines 1 and 2 will be selected when using the "select duplicate" command.
``` html
1: 1
2: 1
3: 12
4: 12
5: 123
6: 123
7: 1234
8: 1234
```



### Min Duplicate Count
`minDuplicateCount: 1`

The number of matching lines, beyond the first, that need to be found in order to be counted as duplicates.

For example, setting this option to `2`, will make it so only lines 3-5 are highlighted below.

``` html
1: not this
2: not this
3: this
4: this
5: this
```



### Ignore List
`ignoreList: []`

Lines matching entires in this list, will be ignored for all functions. Leading and trailing white space, as well as letter case, will be ignored when checking lines against the ignore list.

`
	"ignore_list": ["This line will be ignored"]
`
``` html
1: This line will be ignored
2: This line will be ignored
3: This line will not be ignored
4: This line will not be ignored
```



### Ignore Case for Ignore List
`ignoreCaseForIgnoreList: true`

Similar to "Ignore Case" except only applies when matching lines to the "Ignore List" setting.
