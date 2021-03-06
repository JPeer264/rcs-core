import merge from 'lodash.merge';
import selectorsLibrary, { SelectorsLibrary } from '../selectorsLibrary';
import { AttributeLibrary } from '../attributeLibrary';
import regexp from './regex';
import { ClassSelectorLibrary } from '../classSelectorLibrary';
import { IdSelectorLibrary } from '../idSelectorLibrary';
import { BaseLibraryOptions } from '../baseLibrary';

export interface ReplaceStringOptions extends BaseLibraryOptions {
  classOnly?: boolean;
  isJSX?: boolean;
  addSelectorType?: boolean;
  forceReplace?: boolean;
}

const replaceString = (
  string: string,
  regex?: RegExp,
  options: ReplaceStringOptions = {},
): string => {
  let result;
  let tempString = string;

  // save the string characters
  const beginChar = string.charAt(0);
  const endChar = string.charAt(string.length - 1);

  // remove the string characters
  tempString = tempString.slice(1, tempString.length - 1);

  let selectorLib: SelectorsLibrary | ClassSelectorLibrary | IdSelectorLibrary = selectorsLibrary;
  // detect if it's a selector
  let surelySelector = tempString.match(regexp.likelySelector) !== null;

  if (options.isJSX) {
    // with JSX, you can have code in JS that contains HTML's attribute directly so we
    // can't say if it is a selector in case like 'if (something) return <div class="a b">;'
    surelySelector = false;
  }

  if (options.classOnly !== undefined) {
    surelySelector = false;
    // if we know that it's a class or an id, let's only search those
    selectorLib = options.classOnly
      ? selectorsLibrary.getClassSelector()
      : selectorsLibrary.getIdSelector();
  }

  const bastardSplitChars = ' =,()"\'\\]';

  let stringArray = tempString.split(new RegExp(`(?=[#.${bastardSplitChars}])`));
  let previousEqual = false;
  let previousAttr = '';

  // replace every single entry
  stringArray = stringArray.map((element) => {
    // because we are using non-capturing split, the split char is kept as the first char
    const interestingValue = element.replace(new RegExp(`[${bastardSplitChars}]`, 'g'), '');

    if (interestingValue.length === 0) {
      // remember that's we've seen a = just before, so for example 'div[ class = "test"]'
      // will be split as 'div[ ', ' class', ' ', '=', ' ', '"test', ']'
      // when we reach the space after the equal sign, we'll get here
      // we should not change anything to the previousEqual state in that case
      if (element === '=') {
        previousEqual = true;
      }

      return element;
    }

    // remember last iteration state before it's overwritten
    let prevEqual = previousEqual;

    previousEqual = element === '=';

    const startSplitChar = bastardSplitChars.indexOf(element.charAt(0)) === -1
      ? ''
      : element.charAt(0);

    const tempElement = element.slice(startSplitChar.length, element.length);
    const startWithSelector = AttributeLibrary.isSelector(tempElement);

    prevEqual = prevEqual || startSplitChar === '=';

    // if we had "div[attr=something", react only if attr is a class, id or for
    // element will contain "div[attr" or " attr", we only care about the attribute name
    const match = (!startWithSelector && prevEqual)
      ? previousAttr.match(/[^a-zA-Z]+([a-zA-Z]+)/)
      : null;

    const previousAttributeName = match !== null
      ? match[1]
      : null;

    const isAttributeInteresting = (
      previousAttributeName === 'class'
      || previousAttributeName === 'id'
      || previousAttributeName === 'for'
    );

    previousAttr = interestingValue;

    if (
      !options.forceReplace
      && surelySelector
      && !startWithSelector
      && (!prevEqual || !isAttributeInteresting)
    ) {
      // expecting a selector, but got a tag name, let's return it unmodified
      // except for "class=" or "id=" or "for="
      return startSplitChar + tempElement;
    }

    return (
      startSplitChar
      + selectorLib.get(
        tempElement,
        merge({ addSelectorType: startWithSelector }, options),
      )
    );
  });

  result = stringArray.join('');

  // add the string characters
  result = beginChar + result + endChar;

  return result;
};

export default replaceString;
