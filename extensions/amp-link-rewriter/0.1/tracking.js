/**
 * Copyright 2020 The AMP HTML Authors. All Rights Reserved.
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
import {CustomEventReporterBuilder} from '../../../src/extension-analytics.js';
import {dict} from '../../../src/utils/object';

/**
 *@typedef {{output: string, attribute: Object, vars: Object, reportLinks: Object, linkers: Object }}
 */
let oneTagOptsDef;

export class Tracking {
  /**
   * @param {string} referrer
   * @param {!oneTagOptsDef} configOpts
   * @param {!AmpElement} ampElement
   * @param {!Array<!Element>} listElements
   * @param {!../../../src/service/ampdoc-impl.AmpDoc} ampDoc
   * @param transitId
   */
  constructor(
    referrer,
    configOpts,
    ampElement,
    listElements,
    ampDoc,
    transitId
  ) {
    /** @private {string} */
    this.referrer_ = referrer;

    /**@private {Object} */
    this.configOpts_ = configOpts;

    /** @private {Array<!Element>} */
    this.listElements_ = listElements;

    /** @private {!AmpElement}*/
    this.ampElement_ = ampElement;

    /** @private {!Object} */
    this.analytics_ = null;

    /** @private {?../../../src/service/ampdoc-impl.AmpDoc} */
    this.ampDoc_ = ampDoc;

    /**@private {string} */
    this.transitId_ = transitId;

    /** @private {number} */
    this.slotNum = -1;
  }

  // setups Analyitcs to make pixel calls
  /**
   * @private
   */
  setUpAnalytics() {
    const analyticsBuilder = new CustomEventReporterBuilder(this.ampElement_);
    analyticsBuilder.track(
      'page-tracker',
      this.configOpts_['reportlinks']['url']
    );
    analyticsBuilder.track(
      'link-tracker',
      this.configOpts_['reportlinks']['url']
    );
    analyticsBuilder.setTransportConfig(
      dict({
        'beacon': false,
        'image': {'suppressWarnings': true},
        'xhrpost': false,
      })
    );
    const _this = this;
    return new Promise(function (resolve) {
      _this.analytics_ = analyticsBuilder.build();
      resolve();
      return;
    });
  }

  // pixel call for page
  /**
   * @private
   */
  sendPageImpression() {
    const pageImpression = dict(this.configOpts_['reportlinks']['pageload']);
    if (this.configOpts_['reportlinks']['referrer'] === true) {
      pageImpression['refUrl'] = this.referrer_;
    }
    if (this.configOpts_['linkers']['enabled'] === true) {
      pageImpression['assocPayloadId'] = this.transitId_;
    } else {
      pageImpression['assocPayloadId'] =
        this.configOpts_['vars']['impressionToken'] +
        '-' +
        this.configOpts_['vars']['impressionId'];
    }
    if (this.configOpts_['reportlinks']['pageTitle'] === true) {
      pageImpression['pageTitle'] = this.ampDoc_.getRootNode().title;
    }
    const pageConfig = dict({
      'impressionId': this.configOpts_['vars']['impressionId'],
      'assoc_payload': JSON.stringify(pageImpression),
    });
    this.analytics_.trigger('page-tracker', pageConfig);
  }

  // pixel call for each link matching the regex
  /**
   * @private
   */
  sendLinkImpression() {
    for (let i = 0; i < this.listElements_.length; i++) {
      const linkImpression = dict(this.configOpts_['reportlinks']['linkload']);
      if (this.configOpts_['reportlinks']['referrer'] === true) {
        linkImpression['refUrl'] = this.referrer_;
      }
      if (this.configOpts_['linkers']['enabled'] === true) {
        linkImpression['assocPayloadId'] = this.transitId_;
      } else {
        linkImpression['assocPayloadId'] =
          this.configOpts_['vars']['impressionToken'] +
          '-' +
          this.configOpts_['vars']['impressionId'];
      }
      if (this.configOpts_['reportlinks']['pageTitle'] === true) {
        linkImpression['pageTitle'] = this.ampDoc_.getRootNode().title;
      }
      linkImpression['destinationUrl'] = this.listElements_[i].href;
      if (this.configOpts_['reportlinks']['slotNum'] === true) {
        linkImpression['slotNum'] = this.listElements_[i].getAttribute(
          'data-slot-num'
        );
      }
      this.analytics_.trigger(
        'link-tracker',
        dict({
          'impressionId': this.configOpts_['vars']['impressionId'],
          'assoc_payload': JSON.stringify(linkImpression),
        })
      );
    }
    this.slotNum = this.listElements_.length;
  }

  // pixel call for matching every link
  // added dynamically
  /**
   * @private
   * @param element
   * @param
   */
  fireCalls(element) {
    const linkImpression = dict(this.configOpts_['reportlinks']['linkload']);
    if (this.configOpts_['reportlinks']['referrer'] === true) {
      linkImpression['refUrl'] = this.referrer_;
    }
    if (this.configOpts_['linkers']['enabled'] === true) {
      linkImpression['assocPayloadId'] = this.transitId_;
    } else {
      linkImpression['assocPayloadId'] =
        this.configOpts_['vars']['impressionToken'] +
        '-' +
        this.configOpts_['vars']['impressionId'];
    }
    if (this.configOpts_['reportlinks']['pageTitle'] === true) {
      linkImpression['pageTitle'] = this.ampDoc_.getRootNode().title;
    }
    linkImpression['destinationUrl'] = element.href;
    if (this.configOpts_['reportlinks']['slotNum'] === true) {
      element.setAttribute('data-slot-num', this.slotNum);
      linkImpression['slotNum'] = this.slotNum;
      this.slotNum = this.slotNum + 1;
    }
    this.analytics_.trigger(
      'link-tracker',
      dict({
        'impressionId': this.configOpts_['vars']['impressionId'],
        'assoc_payload': JSON.stringify(linkImpression),
      })
    );
  }
}
