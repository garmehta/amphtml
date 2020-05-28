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

import {CommonSignals} from '../../../src/common-signals';
import {Layout} from '../../../src/layout';
import {LinkRewriter} from './link-rewriter';
import {Priority} from '../../../src/service/navigation';
import {Services} from '../../../src/services';
import {Tracking} from './tracking';
import {hasOwn} from '../../../src/utils/object';

export class AmpLinkRewriter extends AMP.BaseElement {
  /** @param {!AmpElement} element */
  constructor(element) {
    super(element);

    /** @private {?./link-rewriter.LinkRewriter} */
    this.rewriter_ = null;

    /** @private {string} */
    this.referrer_ = '';

    /**@private {Object} */
    this.configOpts_ = null;

    /** @private {?../../../src/service/ampdoc-impl.AmpDoc} */
    this.ampDoc_ = null;

    /** @private {?./tracking.Tracking} */
    this.tracking_ = null;

    /** @private {Object} */
    this.analytics_ = null;

    /**@private {string} */
    this.transitId_ = '';
  }

  /** @override */
  buildCallback() {
    this.ampDoc_ = this.getAmpDoc();

    const viewer = Services.viewerForDoc(this.ampDoc_);

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
    this.configOpts_ = this.rewriter_.configOpts_;
    this.listElements_ = this.rewriter_.listElements_;
    this.attachClickEvent_();
    if (hasOwn(this.configOpts_, 'linkers')) {
      this.amznTransitRecorder();
    }

    this.analyticsCall_();
    this.dynamicLinkHandler();
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

  /**
   *
   * @param {*} layout
   */
  analyticsCall_() {
    if (hasOwn(this.configOpts_, 'reportlinks')) {
      this.ampDoc_.waitForBodyOpen().then(() => {
        this.signals().signal(CommonSignals.LOAD_START);
        this.tracking = new Tracking(
          this.referrer_,
          this.configOpts_,
          this.element,
          this.listElements_,
          this.ampDoc_,
          this.transitId_
        );
        this.tracking.sendPageImpression();
        this.tracking.sendLinkImpressions();
        //we'll use fireCalls to make analytics calls
        //  in case we any anchor tag is added dynamically
        // this.tracking.firecalls(element);
      });
    }
  }

  /**
   * @param {*} layout
   * @return
   */
  amznTransitRecorder() {
    const configObject = this.configOpts_;
    const that = '';
    const TRANSIT_ID_KEY = 'assocPayloadId';
    const trackingEnabled = configObject['linkers']['enabled'];
    const TRANSIT_ID_VALUE =
      configObject['vars']['impressionToken'] +
      '-' +
      configObject['vars']['impressionId'];

    if (trackingEnabled === false) {
      return that;
    }

    if (trackingEnabled === true && !getTransitId()) {
      sessionStorage.setItem(TRANSIT_ID_KEY, TRANSIT_ID_VALUE);
    }

    //To check if the 'assocPayloadId' is already present

    /**
     *
     * @return {string}
     */
    function getTransitId() {
      const existingTransitId = sessionStorage.getItem(TRANSIT_ID_KEY);
      return existingTransitId;
    }

    this.transitId_ = sessionStorage.getItem(TRANSIT_ID_KEY);
  }

  /**
   *
   * @param {*} TRACKING
   */
  dynamicLinkHandler(TRACKING) {
    const tracking2 = new Tracking(
      this.referrer_,
      this.configOpts_,
      this.element,
      this.listElements_,
      this.ampDoc_,
      this.transitId_
    );

    /**
     *
     * @param {*} mutationList
     */
    function linkHandler(mutationList) {
      // eslint-disable-next-line local/no-for-of-statement
      for (const mutation of mutationList) {
        // eslint-disable-next-line local/no-for-of-statement
        for (const node of mutation.addedNodes) {
          if (node.nodeType === 1 && node.tagName === 'A') {
            tracking2.fireCalls(node);
          }
        }
      }
    }

    /**
     * @param mutationList
     * @return
     */
    function handleDynamicContent(mutationList) {
      currentTime = Date.now();
      lastRunTime = currentTime;
      linkHandler(mutationList);
      updateBetweenTimeStep = false;
    }

    /**
     * @param {*} mutationList
     */
    function mutationCallBack(mutationList) {
      currentTime = Date.now();
      if (currentTime - lastRunTime > timeStep) {
        lastRunTime = currentTime;
        linkHandler(mutationList);
      } else if (!updateBetweenTimeStep) {
        updateBetweenTimeStep = true;
        setTimeout(handleDynamicContent(mutationList), timeStep);
      }
    }

    const timeStep = 3000;

    const config = {
      childList: true,
      subtree: true,
      characterData: true,
    };

    const target = this.ampDoc_.getRootNode().body;
    let currentTime = Date.now();
    let lastRunTime = Date.now();
    let updateBetweenTimeStep = false;

    const observer = new MutationObserver(mutationCallBack);

    observer.observe(target, config);
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
