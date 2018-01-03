/**
 * Copyright 2016 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {assert} from 'chai';
import td from 'testdouble';

import {verifyDefaultAdapter} from '../helpers/foundation';
import MDCTextFieldFoundation from '../../../packages/mdc-textfield/foundation';
import MDCTextFieldBottomLineFoundation from '../../../packages/mdc-textfield/bottom-line/foundation';

const {cssClasses, numbers} = MDCTextFieldFoundation;

suite('MDCTextFieldFoundation');

test('exports strings', () => {
  assert.isOk('strings' in MDCTextFieldFoundation);
});

test('exports cssClasses', () => {
  assert.isOk('cssClasses' in MDCTextFieldFoundation);
});

test('exports numbers', () => {
  assert.isOk('numbers' in MDCTextFieldFoundation);
});

test('defaultAdapter returns a complete adapter implementation', () => {
  verifyDefaultAdapter(MDCTextFieldFoundation, [
    'addClass', 'removeClass', 'hasClass',
    'registerTextFieldInteractionHandler', 'deregisterTextFieldInteractionHandler',
    'registerInputInteractionHandler', 'deregisterInputInteractionHandler',
    'registerBottomLineEventHandler', 'deregisterBottomLineEventHandler',
    'getNativeInput', 'getIdleOutlineStyleValue', 'isFocused', 'isRtl',
  ]);
});

const setupTest = () => {
  const mockAdapter = td.object(MDCTextFieldFoundation.defaultAdapter);
  const bottomLine = td.object({
    activate: () => {},
    deactivate: () => {},
    setTransformOrigin: () => {},
    handleTransitionEnd: () => {},
  });
  const helperText = td.object({
    setContent: () => {},
    showToScreenReader: () => {},
    setValidity: () => {},
  });
  const icon = td.object({
    setDisabled: () => {},
    registerInteractionHandler: () => {},
    deregisterInteractionHandler: () => {},
    handleInteraction: () => {},
  });
  const label = td.object({
    getWidth: () => {},
    floatAbove: () => {},
    deactivateFocus: () => {},
    setValidity: () => {},
    style: () => {},
  });
  const outline = td.object({
    updateSvgPath: () => {},
  });
  const foundationMap = {
    bottomLine: bottomLine,
    helperText: helperText,
    icon: icon,
    label: label,
    outline: outline,
  };
  const foundation = new MDCTextFieldFoundation(mockAdapter, foundationMap);
  return {foundation, mockAdapter, bottomLine, helperText, icon, label, outline};
};

test('#constructor sets disabled to false', () => {
  const {foundation} = setupTest();
  assert.isNotOk(foundation.isDisabled());
});

const setupValueTest = (value, optIsValid, optIsBadInput) => {
  const {foundation, mockAdapter, bottomLine, helperText, label} = setupTest();
  const nativeInput = {
    value: value,
    validity: {
      valid: optIsValid === undefined ? true : !!optIsValid,
      badInput: optIsBadInput === undefined ? false : !!optIsBadInput,
    },
  };
  td.when(mockAdapter.getNativeInput()).thenReturn(nativeInput);
  foundation.init();

  return {foundation, mockAdapter, bottomLine, helperText, label, nativeInput};
};

test('#getValue returns the field\'s value', () => {
  const {foundation, mockAdapter} = setupTest();
  td.when(mockAdapter.getNativeInput()).thenReturn({
    value: 'initValue',
  });
  assert.equal('initValue', foundation.getValue(),
    'getValue does not match input value.');
});

test('#setValue with non-empty value styles the label', () => {
  const value = 'new value';
  const {foundation, nativeInput, label} = setupValueTest('');
  // Initial empty value should not float label.
  td.verify(label.style(undefined));
  nativeInput.value = value;
  foundation.setValue(value);
  td.verify(label.style(value, true, false));
});

test('#setValue with empty value styles the label', () => {
  const {foundation, nativeInput, label} = setupValueTest('old value');
  // Initial value should float the label.
  td.verify(label.style('old value'));
  nativeInput.value = '';
  foundation.setValue('');
  td.verify(label.style('', true, false));
});

test('#setValue valid and invalid input', () => {
  const {foundation, mockAdapter, nativeInput, helperText, label} =
    setupValueTest('', /* isValid */ false);

  foundation.setValue('invalid');
  td.verify(mockAdapter.addClass(cssClasses.INVALID));
  td.verify(label.style('invalid', false, false));
  td.verify(helperText.setValidity(false));

  nativeInput.validity.valid = true;
  foundation.setValue('valid');
  td.verify(mockAdapter.removeClass(cssClasses.INVALID));
  td.verify(label.style('valid', true, false));
  td.verify(helperText.setValidity(true));
});

test('#setValue does not affect focused state', () => {
  const {foundation, mockAdapter} = setupValueTest('');
  foundation.setValue('');
  td.verify(mockAdapter.addClass(cssClasses.FOCUSED), {times: 0});
  td.verify(mockAdapter.removeClass(cssClasses.FOCUSED), {times: 0});
});

test('#setValue does not affect disabled state', () => {
  const {foundation, mockAdapter} = setupValueTest('');
  foundation.setValue('');
  td.verify(mockAdapter.addClass(cssClasses.DISABLED), {times: 0});
  td.verify(mockAdapter.removeClass(cssClasses.DISABLED), {times: 0});
  // Called once initially because the field is valid, should not be called twice.
  td.verify(mockAdapter.removeClass(cssClasses.INVALID), {times: 1});
});

test('#isValid for native validation', () => {
  const {foundation, nativeInput} = setupValueTest('', /* isValid */ true);
  assert.isOk(foundation.isValid());

  nativeInput.validity.valid = false;
  assert.isNotOk(foundation.isValid());
});

test('#setValid overrides native validation', () => {
  const {foundation, nativeInput} = setupValueTest('', /* isValid */ false);
  foundation.setValid(true);
  assert.isOk(foundation.isValid());

  nativeInput.validity.valid = true;
  foundation.setValid(false);
  assert.isNotOk(foundation.isValid());
});

test('#setValid updates classes', () => {
  const {foundation, mockAdapter, helperText, label} = setupTest();

  foundation.setValid(false);
  td.verify(mockAdapter.addClass(cssClasses.INVALID));
  td.verify(helperText.setValidity(false));
  td.verify(label.style(undefined, false));

  foundation.setValid(true);
  td.verify(mockAdapter.removeClass(cssClasses.INVALID));
  td.verify(helperText.setValidity(true));
  td.verify(label.style(undefined, true));

  // None of these is affected by setValid.
  td.verify(mockAdapter.addClass(cssClasses.FOCUSED), {times: 0});
  td.verify(mockAdapter.removeClass(cssClasses.FOCUSED), {times: 0});
  td.verify(mockAdapter.addClass(cssClasses.DISABLED), {times: 0});
  td.verify(mockAdapter.removeClass(cssClasses.DISABLED), {times: 0});
});

test('#setRequired updates CSS classes', () => {
  // Native validity checking does not apply in unittests, so manually mark as valid or invalid.
  const {foundation, mockAdapter, nativeInput, helperText} =
    setupValueTest('', /* isValid */ false);

  foundation.setRequired(true);
  td.verify(mockAdapter.addClass(cssClasses.INVALID));
  td.verify(helperText.setValidity(false));

  nativeInput.validity.valid = true;
  foundation.setRequired(false);
  td.verify(mockAdapter.removeClass(cssClasses.INVALID));
  td.verify(helperText.setValidity(true));

  // None of these is affected by setRequired.
  td.verify(mockAdapter.addClass(cssClasses.FOCUSED), {times: 0});
  td.verify(mockAdapter.removeClass(cssClasses.FOCUSED), {times: 0});
  td.verify(mockAdapter.addClass(cssClasses.DISABLED), {times: 0});
  td.verify(mockAdapter.removeClass(cssClasses.DISABLED), {times: 0});
});

test('#setDisabled flips disabled when a native input is given', () => {
  const {foundation, mockAdapter} = setupTest();
  const nativeInput = {disabled: false};
  td.when(mockAdapter.getNativeInput()).thenReturn(nativeInput);
  foundation.setDisabled(true);
  assert.isOk(foundation.isDisabled());
});

test('#setDisabled has no effect when no native input is provided', () => {
  const {foundation} = setupTest();
  foundation.setDisabled(true);
  assert.isNotOk(foundation.isDisabled());
});

test('#setDisabled set the disabled property on the native input when there is one', () => {
  const {foundation, mockAdapter} = setupTest();
  const nativeInput = {disabled: false};
  td.when(mockAdapter.getNativeInput()).thenReturn(nativeInput);
  foundation.setDisabled(true);
  assert.isOk(nativeInput.disabled);
});

test('#setDisabled handles no native input being returned gracefully', () => {
  const {foundation, mockAdapter} = setupTest();
  td.when(mockAdapter.getNativeInput()).thenReturn(null);
  assert.doesNotThrow(() => foundation.setDisabled(true));
});

test('#setDisabled adds mdc-text-field--disabled when set to true', () => {
  const {foundation, mockAdapter} = setupTest();
  foundation.setDisabled(true);
  td.verify(mockAdapter.addClass(cssClasses.DISABLED));
});

test('#setDisabled removes mdc-text-field--invalid when set to true', () => {
  const {foundation, mockAdapter} = setupTest();
  foundation.setDisabled(true);
  td.verify(mockAdapter.removeClass(cssClasses.INVALID));
});

test('#setDisabled removes mdc-text-field--disabled when set to false', () => {
  const {foundation, mockAdapter} = setupTest();
  foundation.setDisabled(false);
  td.verify(mockAdapter.removeClass(cssClasses.DISABLED));
});

test('#setDisabled sets disabled on icon', () => {
  const {foundation, icon} = setupTest();
  foundation.setDisabled(true);
  td.verify(icon.setDisabled(true));
});

test('#setValid adds mdc-textfied--invalid when set to false', () => {
  const {foundation, mockAdapter} = setupTest();
  foundation.setValid(false);
  td.verify(mockAdapter.addClass(cssClasses.INVALID));
});

test('#setValid removes mdc-textfied--invalid when set to true', () => {
  const {foundation, mockAdapter} = setupTest();
  foundation.setValid(true);
  td.verify(mockAdapter.removeClass(cssClasses.INVALID));
});

test('#init adds mdc-text-field--upgraded class', () => {
  const {foundation, mockAdapter} = setupTest();
  foundation.init();
  td.verify(mockAdapter.addClass(cssClasses.UPGRADED));
});

test('#init focuses on input if adapter.isFocused is true', () => {
  const {foundation, mockAdapter} = setupTest();
  td.when(mockAdapter.isFocused()).thenReturn(true);
  foundation.init();
  td.verify(foundation.inputFocusHandler_());
});

test('#init does not focus if adapter.isFocused is false', () => {
  const {foundation, mockAdapter} = setupTest();
  td.when(mockAdapter.isFocused()).thenReturn(false);
  foundation.init();
  td.verify(foundation.inputFocusHandler_(), {times: 0});
});

test('#init adds event listeners', () => {
  const {foundation, mockAdapter} = setupTest();
  foundation.init();

  td.verify(mockAdapter.registerInputInteractionHandler('focus', td.matchers.isA(Function)));
  td.verify(mockAdapter.registerInputInteractionHandler('blur', td.matchers.isA(Function)));
  td.verify(mockAdapter.registerInputInteractionHandler('input', td.matchers.isA(Function)));
  td.verify(mockAdapter.registerInputInteractionHandler('mousedown', td.matchers.isA(Function)));
  td.verify(mockAdapter.registerInputInteractionHandler('touchstart', td.matchers.isA(Function)));
  td.verify(mockAdapter.registerTextFieldInteractionHandler('click', td.matchers.isA(Function)));
  td.verify(mockAdapter.registerTextFieldInteractionHandler('keydown', td.matchers.isA(Function)));
  td.verify(mockAdapter.registerBottomLineEventHandler(
    MDCTextFieldBottomLineFoundation.strings.ANIMATION_END_EVENT, td.matchers.isA(Function)));
});

test('#destroy removes event listeners', () => {
  const {foundation, mockAdapter} = setupTest();
  foundation.destroy();

  td.verify(mockAdapter.deregisterInputInteractionHandler('focus', td.matchers.isA(Function)));
  td.verify(mockAdapter.deregisterInputInteractionHandler('blur', td.matchers.isA(Function)));
  td.verify(mockAdapter.deregisterInputInteractionHandler('input', td.matchers.isA(Function)));
  td.verify(mockAdapter.deregisterInputInteractionHandler('mousedown', td.matchers.isA(Function)));
  td.verify(mockAdapter.deregisterInputInteractionHandler('touchstart', td.matchers.isA(Function)));
  td.verify(mockAdapter.deregisterTextFieldInteractionHandler('click', td.matchers.isA(Function)));
  td.verify(mockAdapter.deregisterTextFieldInteractionHandler('keydown', td.matchers.isA(Function)));
  td.verify(mockAdapter.deregisterBottomLineEventHandler(
    MDCTextFieldBottomLineFoundation.strings.ANIMATION_END_EVENT, td.matchers.isA(Function)));
});

test('#init floats label if the input contains a value', () => {
  const {foundation, mockAdapter, label} = setupTest();
  td.when(mockAdapter.getNativeInput()).thenReturn({
    value: 'Pre-filled value',
    disabled: false,
    checkValidity: () => true,
  });
  foundation.init();
  td.verify(label.style('Pre-filled value'));
});

test('#init does not float label if the input does not contain a value', () => {
  const {foundation, mockAdapter, label} = setupTest();
  td.when(mockAdapter.getNativeInput()).thenReturn({
    value: '',
    disabled: false,
    checkValidity: () => true,
  });
  foundation.init();
  td.verify(label.style(), {times: 0});
});

test('#setHelperTextContent sets the content of the helper text element', () => {
  const {foundation, helperText} = setupTest();
  foundation.setHelperTextContent('foo');
  td.verify(helperText.setContent('foo'));
});

test('#updateOutline updates the SVG path of the outline element', () => {
  const {foundation, mockAdapter, label, outline} = setupTest();
  td.when(label.getWidth()).thenReturn(30);
  td.when(mockAdapter.hasClass(cssClasses.DENSE)).thenReturn(false);
  td.when(mockAdapter.getIdleOutlineStyleValue('border-radius')).thenReturn('8px');
  td.when(mockAdapter.isRtl()).thenReturn(false);

  foundation.updateOutline();
  td.verify(outline.updateSvgPath(30 * numbers.LABEL_SCALE, 8, false));
});

test('#updateOutline updates the SVG path of the outline element when dense', () => {
  const {foundation, mockAdapter, label, outline} = setupTest();
  td.when(label.getWidth()).thenReturn(30);
  td.when(mockAdapter.hasClass(cssClasses.DENSE)).thenReturn(true);
  td.when(mockAdapter.getIdleOutlineStyleValue('border-radius')).thenReturn('8px');
  td.when(mockAdapter.isRtl()).thenReturn(false);

  foundation.updateOutline();
  td.verify(outline.updateSvgPath(30 * numbers.DENSE_LABEL_SCALE, 8, false));
});

test('on input styles label if input event occurs without any other events', () => {
  const {foundation, mockAdapter, label} = setupTest();
  let input;

  td.when(mockAdapter.registerInputInteractionHandler('input', td.matchers.isA(Function)))
    .thenDo((evtType, handler) => {
      input = handler;
    });
  foundation.init();
  td.verify(label.style(undefined));
  input();
  td.verify(label.style(undefined, undefined, undefined, true));
});

test('on input does nothing if input event preceded by keydown event', () => {
  const {foundation, mockAdapter, label} = setupTest();
  const mockEvt = {
    type: 'keydown',
    key: 'Enter',
  };
  const mockInput = {
    disabled: false,
  };
  let keydown;
  let input;

  td.when(mockAdapter.getNativeInput()).thenReturn(mockInput);
  td.when(mockAdapter.registerTextFieldInteractionHandler('keydown', td.matchers.isA(Function)))
    .thenDo((evtType, handler) => {
      keydown = handler;
    });
  td.when(mockAdapter.registerInputInteractionHandler('input', td.matchers.isA(Function)))
    .thenDo((evtType, handler) => {
      input = handler;
    });
  foundation.init();
  keydown(mockEvt);
  input();
  td.verify(label.style(), {times: 0});
});

test('on focus adds mdc-text-field--focused class', () => {
  const {foundation, mockAdapter} = setupTest();
  let focus;
  td.when(mockAdapter.registerInputInteractionHandler('focus', td.matchers.isA(Function)))
    .thenDo((evtType, handler) => {
      focus = handler;
    });
  foundation.init();
  focus();
  td.verify(mockAdapter.addClass(cssClasses.FOCUSED));
});

test('on focus activates bottom line', () => {
  const {foundation, mockAdapter, bottomLine} = setupTest();
  let focus;
  td.when(mockAdapter.registerInputInteractionHandler('focus', td.matchers.isA(Function)))
    .thenDo((evtType, handler) => {
      focus = handler;
    });
  foundation.init();
  focus();
  td.verify(bottomLine.activate());
});

test('on focus styles label', () => {
  const {foundation, mockAdapter, label} = setupTest();
  let focus;
  td.when(mockAdapter.registerInputInteractionHandler('focus', td.matchers.isA(Function)))
    .thenDo((evtType, handler) => {
      focus = handler;
    });
  foundation.init();
  td.verify(label.style(undefined));
  focus();
  td.verify(label.style(undefined, undefined, undefined, true));
});

test('on focus makes helper text visible to the screen reader', () => {
  const {foundation, mockAdapter, helperText} = setupTest();
  let focus;
  td.when(mockAdapter.registerInputInteractionHandler('focus', td.matchers.isA(Function)))
    .thenDo((evtType, handler) => {
      focus = handler;
    });
  foundation.init();
  focus();
  td.verify(helperText.showToScreenReader());
});

const setupBlurTest = () => {
  const {foundation, mockAdapter, helperText, label} = setupTest();
  let blur;
  td.when(mockAdapter.registerInputInteractionHandler('blur', td.matchers.isA(Function))).thenDo((evtType, handler) => {
    blur = handler;
  });
  const nativeInput = {
    value: '',
    validity: {
      valid: true,
    },
  };
  td.when(mockAdapter.getNativeInput()).thenReturn(nativeInput);
  foundation.init();

  return {foundation, mockAdapter, blur, nativeInput, helperText, label};
};

test('on blur removes mdc-text-field--focused class', () => {
  const {mockAdapter, blur} = setupBlurTest();
  blur();
  td.verify(mockAdapter.removeClass(cssClasses.FOCUSED));
});

test('on blur styles label when no input value present and validity checks pass', () => {
  const {blur, label} = setupBlurTest();
  td.verify(label.style(undefined));
  blur();
  td.verify(label.style('', true, undefined, false));
});

test('on blur styles label if input has a value', () => {
  const {blur, nativeInput, label} = setupBlurTest();
  td.verify(label.style(undefined));
  nativeInput.value = 'non-empty value';
  blur();
  td.verify(label.style('non-empty value', true, undefined, false));
});

test('on blur removes mdc-text-field--invalid if custom validity is false and' +
     'input.checkValidity() returns true', () => {
  const {mockAdapter, blur} = setupBlurTest();
  blur();
  td.verify(mockAdapter.removeClass(cssClasses.INVALID));
});

test('on blur adds mdc-textfied--invalid if custom validity is false and' +
     'input.checkValidity() returns false', () => {
  const {mockAdapter, blur, nativeInput} = setupBlurTest();
  nativeInput.validity.valid = false;
  blur();
  td.verify(mockAdapter.addClass(cssClasses.INVALID));
});

test('on blur does not remove mdc-text-field--invalid if custom validity is true and' +
     'input.checkValidity() returns true', () => {
  const {foundation, mockAdapter, blur} = setupBlurTest();
  foundation.setValid(false);
  blur();
  td.verify(mockAdapter.removeClass(cssClasses.INVALID), {times: 0});
});

test('on blur does not add mdc-textfied--invalid if custom validity is true and' +
     'input.checkValidity() returns false', () => {
  const {foundation, mockAdapter, blur, nativeInput} = setupBlurTest();
  nativeInput.checkValidity = () => false;
  foundation.setValid(true);
  blur();
  td.verify(mockAdapter.addClass(cssClasses.INVALID), {times: 0});
});

test('on blur set validity of helper text', () => {
  const {blur, nativeInput, helperText} = setupBlurTest();
  nativeInput.validity.valid = false;
  blur();
  td.verify(helperText.setValidity(false));
});

test('on blur handles getNativeInput() not returning anything gracefully', () => {
  const {mockAdapter, blur} = setupBlurTest();
  td.when(mockAdapter.getNativeInput()).thenReturn(null);
  assert.doesNotThrow(blur);
});

test('on keydown sets receivedUserInput to true when input is enabled', () => {
  const {foundation, mockAdapter} = setupTest();
  let keydown;
  td.when(mockAdapter.registerTextFieldInteractionHandler('keydown', td.matchers.isA(Function)))
    .thenDo((evtType, handler) => {
      keydown = handler;
    });
  td.when(mockAdapter.getNativeInput()).thenReturn({
    disabled: false,
  });
  foundation.init();
  assert.equal(foundation.receivedUserInput_, false);
  keydown();
  assert.equal(foundation.receivedUserInput_, true);
});

test('on transition end deactivates the bottom line if this.isFocused_ is false', () => {
  const {foundation, mockAdapter, bottomLine} = setupTest();
  const mockEvt = {
    propertyName: 'opacity',
  };
  let transitionEnd;

  td.when(mockAdapter.registerBottomLineEventHandler(td.matchers.isA(String), td.matchers.isA(Function)))
    .thenDo((evtType, handler) => {
      transitionEnd = handler;
    });

  foundation.init();
  transitionEnd(mockEvt);

  td.verify(bottomLine.deactivate());
});

test('mousedown on the input sets the bottom line origin', () => {
  const {foundation, mockAdapter, bottomLine} = setupTest();
  const mockEvt = {
    target: {
      getBoundingClientRect: () => {
        return {};
      },
    },
    clientX: 200,
    clientY: 200,
  };

  let clickHandler;

  td.when(mockAdapter.registerInputInteractionHandler('mousedown', td.matchers.isA(Function)))
    .thenDo((evtType, handler) => {
      clickHandler = handler;
    });

  foundation.init();
  clickHandler(mockEvt);

  td.verify(bottomLine.setTransformOrigin(mockEvt));
});

test('touchstart on the input sets the bottom line origin', () => {
  const {foundation, mockAdapter, bottomLine} = setupTest();
  const mockEvt = {
    target: {
      getBoundingClientRect: () => {
        return {};
      },
    },
    clientX: 200,
    clientY: 200,
  };

  let clickHandler;

  td.when(mockAdapter.registerInputInteractionHandler('touchstart', td.matchers.isA(Function)))
    .thenDo((evtType, handler) => {
      clickHandler = handler;
    });

  foundation.init();
  clickHandler(mockEvt);

  td.verify(bottomLine.setTransformOrigin(mockEvt));
});
