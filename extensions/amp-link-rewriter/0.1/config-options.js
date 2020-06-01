/**
 * Copyright 2019 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import {childElementsByTag} from '../../../src/dom';
import {getChildJsonConfig} from '../../../src/json';
import {hasOwn} from '../../../src/utils/object';
import {user, userAssert} from '../../../src/log';

/**
 * @typedef {{output: string, section:Array, attribute:Object, vars:Object}}
 */
let ConfigOptsDef;

/**
 *@typedef {{output: string, attribute: Object, vars: Object, reportLinks: Object, linkers: Object }}
 */
let oneTagOptsDef;

/**
 * @param {!AmpElement} element
 * @return {!ConfigOptsDef|oneTagOptsDef}
 */
export function getConfigOpts(element) {
  const config = getConfigJson(element);
  let configOpts;
  if (hasOwn(config, 'remoteConfig')) {
    const text =
      '{' +
      '"localConfig": {' +
      '"output": "https://visit.foo.net/${impressionId}/?pid=110&url=${href}&customerId=${customerId}&impressionToken=${impressionToken}&tagValue=${tagValue}",' +
      '"attribute": {' +
      '"href": "(https|http)://([^ ])*amazon.(com|de|fr|in|ca|cn|co.uk|co.jp)*/?[^ ]*/?"' +
      '},' +
      '"vars": {' +
      '"customerId": "12345",' +
      '"impressionToken": "123456",' +
      '"impressionId": "987654321",' +
      '"tagValue": "abc-20"' +
      '},' +
      '"reportlinks": {' +
      '"url": "https://assoc-na.associates-amazon.com/onetag/${impressionId}/pixel?assoc_payload=${assoc_payload}",' +
      '"pageload": {' +
      '"trackingId": "apartmentth0a20",' +
      '"logType": "Onetag_pageload",' +
      '"linkCode": "w49"' +
      '},' +
      '"linkload": {' +
      '"trackingId": "apartmentth0a20",' +
      '"logType": "Onetag_textlink",' +
      '"linkCode": "w50"' +
      '},' +
      '"slotNum": true,' +
      '"referrer": true,' +
      '"pageTitle": true' +
      '}, ' +
      '"linkers": {' +
      '"enabled": true' +
      '}' +
      '}' +
      '}';
    const scripts = childElementsByTag(element, 'script');
    const remoteConfig = JSON.parse(scripts[0].innerHTML);
    const aesConfig = JSON.parse(text);
    const finalConfig = Object.assign(remoteConfig, aesConfig);
    scripts[0].innerHTML = JSON.stringify(finalConfig);
    configOpts = {
      remoteConfig: aesConfig['remoteConfig'],
      output: aesConfig['localConfig']['output'].toString(),
      section: hasOwn(aesConfig['localConfig'], 'section')
        ? aesConfig['localConfig']['section']
        : [],

      attribute: hasOwn(aesConfig['localConfig'], 'attribute')
        ? parseAttribute(aesConfig['localConfig']['attribute'])
        : {},
      vars: hasOwn(aesConfig['localConfig'], 'vars')
        ? aesConfig['localConfig']['vars']
        : {},
      reportlinks: hasOwn(aesConfig['localConfig'], 'reportlinks')
        ? aesConfig['localConfig']['reportlinks']
        : {},
      linkers: hasOwn(aesConfig['localConfig'], 'linkers')
        ? aesConfig['localConfig']['linkers']
        : {},
    };
  } else {
    userAssert(
      config['output'],
      'amp-link-rewriter: output config property is required'
    );
    configOpts = {
      output: config['output'].toString(),
      section: hasOwn(config, 'section') ? config['section'] : [],

      attribute: hasOwn(config, 'attribute')
        ? parseAttribute(config['attribute'])
        : {},

      vars: hasOwn(config, 'vars') ? config['vars'] : {},
    };
  }
  return configOpts;
}

/**
 * @param {!AmpElement} element
 * @return {JsonObject}
 */
function getConfigJson(element) {
  const TAG = 'amp-link-rewriter';

  try {
    return getChildJsonConfig(element);
  } catch (e) {
    throw user(element).createError('%s: %s', TAG, e);
  }
}

/**
 * @param {!Object} attribute
 * @return {Object}
 */
function parseAttribute(attribute) {
  const newAttr = {};

  Object.keys(attribute).forEach((key) => {
    newAttr[key] = '^' + attribute[key] + '$';
  });

  return newAttr;
}
