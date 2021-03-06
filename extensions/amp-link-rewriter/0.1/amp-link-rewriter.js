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

import 'regenerator-runtime/runtime';
import {CommonSignals} from '../../../src/common-signals';
import {Layout} from '../../../src/layout';
import {LinkRewriter} from './link-rewriter';
import {Priority} from '../../../src/service/navigation';
import {Services} from '../../../src/services';
import {Tracking} from './tracking';
import {amznTransitRecorder, dynamicLinkHandler} from './dynamic-handler';

import {getChildJsonConfig} from '../../../src/json';
import {getConfigOpts, oneTagConfig} from './config-options';
import {hasOwn} from '../../../src/utils/object';

export class AmpLinkRewriter extends AMP.BaseElement {
  /** @param {!AmpElement} element */
  constructor(element) {
    super(element);

    this.element_ = element;

    /** @private {?./link-rewriter.LinkRewriter} */
    this.rewriter_ = null;

    /** @private {string} */
    this.referrer_ = '';

    /**@private {Object} */
    this.configOpts_ = null;

    /** @private {?../../../src/service/ampdoc-impl.AmpDoc} */
    this.ampDoc_ = null;

    /** @private {?./tracking.Tracking} */
    this.tracking = null;

    /** @private {string} */
    this.transitId = '';

    /** @private {object} */
    this.config = null;

    /** @private {Array<!Element>} */
    this.listElements_ = null;

    /** @private {object} */
    this.remoteConfig = null;
  }

  /** @override */
  buildCallback() {
    this.ampDoc_ = this.getAmpDoc();

    const viewer = Services.viewerForDoc(this.ampDoc_);

    this.config = getChildJsonConfig(this.element_);

    if (hasOwn(this.config, 'remoteConfig')) {
      return this.getAmpDoc()
        .whenReady()
        .then(() => viewer.getReferrerUrl())
        .then((referrer) => (this.referrer_ = referrer))
        .then(() =>
          fetch(
            'https://cgungobkk2.execute-api.us-east-1.amazonaws.com/live/confignumber'
          )
        )
        .then((response) => response.json())
        .then((data) => (this.remoteConfig = data))
        .then(this.amazonOneTag_.bind(this));
    }

    /**
     * We had to get referrerUrl here because when we use expandUrlSync()
     * inside LinkRewriter it doesn't retrieve the referrerUrl
     */
    return this.getAmpDoc()
      .whenReady()
      .then(() => viewer.getReferrerUrl())
      .then((referrer) => (this.referrer_ = referrer))
      .then(this.letsRockIt_.bind(this));
  }

  /**
   * @private
   */
  letsRockIt_() {
    this.rewriter_ = new LinkRewriter(
      this.referrer_,
      this.element,
      this.getAmpDoc()
    );
    this.configOpts_ = getConfigOpts(this.element_);
    this.rewriter_.configOpts_ = this.configOpts_;
    this.rewriter_.setListElements();
    this.attachClickEvent_();
  }

  /**
   * @private
   */
  amazonOneTag_() {
    this.rewriter_ = new LinkRewriter(
      this.referrer_,
      this.element,
      this.getAmpDoc()
    );
    this.configOpts_ = oneTagConfig(this.element_, this.remoteConfig);
    this.rewriter_.configOpts_ = this.configOpts_;
    this.rewriter_.setListElements();
    this.listElements_ = this.rewriter_.listElements_;
    if (hasOwn(this.configOpts_, 'linkers')) {
      this.transitId = amznTransitRecorder(this.configOpts_);
    }
    this.attachClickEvent_();
    if (hasOwn(this.configOpts_, 'reportlinks')) {
      this.analyticsCall_();
    }
  }

  /**
   * @private
   * @return {*} TODO(#23582): Specify return type
   */
  attachClickEvent_() {
    const nav = Services.navigationForDoc(this.getAmpDoc());
    nav.registerAnchorMutator((anchor) => {
      this.rewriter_.handleClick(anchor);
    }, Priority.LINK_REWRITER_MANAGER);

    return true;
  }

  // setups analytics for firing
  // pixel calls
  analyticsCall_() {
    if (hasOwn(this.configOpts_['reportlinks'], 'url')) {
      this.ampDoc_.waitForBodyOpen().then(() => {
        this.signals().signal(CommonSignals.LOAD_START);
        this.tracking = new Tracking(
          this.referrer_,
          this.configOpts_,
          this.element,
          this.listElements_,
          this.ampDoc_,
          this.transitId
        );
        this.tracking.setUpAnalytics().then(() => {
          this.tracking.sendPageImpression();
          this.tracking.sendLinkImpression();
          dynamicLinkHandler(
            this.tracking,
            this.ampDoc_,
            this.configOpts_,
            this.rewriter_
          );
        });
      });
    } else {
      // in this case dynamicLinkHandler only re-writes the dynamic
      // links which are added and match the Amazon Regex
      dynamicLinkHandler(
        this.tracking,
        this.ampDoc_,
        this.configOpts_,
        this.rewriter_
      );
    }
  }

  /** @override */
  isLayoutSupported(layout) {
    return layout === Layout.NODISPLAY;
  }
}

AMP.extension('amp-link-rewriter', '0.1', (AMP) => {
  AMP.registerElement('amp-link-rewriter', AmpLinkRewriter);
  AMP.registerElement('amp-amazon-onetag', AmpLinkRewriter);
});
