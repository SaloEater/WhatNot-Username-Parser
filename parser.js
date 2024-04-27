// ==UserScript==
// @name         WhatNot Username Parser
// @namespace    http://tampermonkey.net/
// @version      2024-03-24
// @description  Parse sold events and send them to the system
// @author       You
// @match        https://www.whatnot.com/live/*
// @match        http://localhost:3000/break/*
// @match        https://whatnot-frontend.vercel.app/break/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant       GM_getValue
// @grant       GM_setValue
// @run-at document-idle
// ==/UserScript==

(function() {
    'use strict';

    const currentURL = document.URL.toString()
    console.log(currentURL)

    function getElementByXpath(path) {
        return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    }

    if (currentURL.indexOf('live') !== -1) {
        var element = null;
        var usernameList = []

        function waitForElm (selector) {
            return new Promise(resolve => {
                if (document.querySelector(selector)) {
                    return resolve(document.querySelector(selector));
                }

                const observer = new MutationObserver(mutations => {
                    if (document.querySelector(selector)) {
                        console.log('looking for sold category')
                        element = document.querySelector(selector);
                        try {
                            let buttons = Array.from(document.querySelectorAll('h5'))
                            let optionsButtons = buttons.filter(i => i.textContent == 'Sold')
                            let soldCategory = optionsButtons.length > 0 ? optionsButtons[0] : null
                            if (soldCategory === null) {
                                console.log("didn't find sold category")
                                return;
                            }
                            console.log('found sold category', soldCategory)
                            observer.disconnect();
                            resolve(soldCategory)
                        } catch (e) {
                            console.log('not found')
                        }
                    }
                });

                // If you get "parameter 1 is not of type 'Node'" error, see https://stackoverflow.com/a/77855838/492336
                observer.observe(document.body, {
                    childList: true,
                    subtree: true
                });
            });
        }

        const Teams = [
            "Arizona Cardinals",
            "Atlanta Falcons",
            "Baltimore Ravens",
            "Buffalo Bills",
            "Carolina Panthers",
            "Chicago Bears",
            "Cincinnati Bengals",
            "Cleveland Browns",
            "Dallas Cowboys",
            "Denver Broncos",
            "Detroit Lions",
            "Green Bay Packers",
            "Houston Texans",
            "Indianapolis Colts",
            "Jacksonville Jaguars",
            "Kansas City Chiefs",
            "Las Vegas Raiders",
            "Los Angeles Chargers",
            "Los Angeles Rams",
            "Miami Dolphins",
            "Minnesota Vikings",
            "New England Patriots",
            "New Orleans Saints",
            "New York Giants",
            "New York Jets",
            "Philadelphia Eagles",
            "Pittsburgh Steelers",
            "San Francisco 49ers",
            "Seattle Seahawks",
            "Tampa Bay Buccaneers",
            "Tennessee Titans",
            "Washington Commanders"
        ]
        function isATeamGiveaway(value) {
            return Teams.filter(i => value.indexOf(i) !== -1).length > 0
        }

        waitForElm('#notification-wrapper').then((soldCategory) => {
            console.log(soldCategory)
            console.log("Username parser is init")

            function mouseHandler() {
                const observer = new MutationObserver(mutationsList => {
                    // Loop through each mutation in the mutationsList
                    for (let mutation of mutationsList) {
                        // Check if nodes were added
                        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                            // Process the added nodes
                            mutation.addedNodes.forEach(addedNode => {
                                try {
                                    let divItem = addedNode
                                    let attributes = divItem.attributes
                                    let index = attributes.getNamedItem('data-index')
                                    console.log(['new added node', addedNode, index])
                                    if (index.value !== '0') {
                                        return
                                    }
                                    console.log('adding')
                                    setTimeout(() => {
                                        let divListingItem = divItem.childNodes[0]
                                        let flexParent = divListingItem.childNodes[0]
                                        let flex = flexParent.childNodes[0]
                                        let divColumn = flex.childNodes[4]
                                        let p = divColumn.childNodes[2]
                                        let span = p.childNodes[2]
                                        let username = span.childNodes[0].wholeText

                                        let productNameContainer = flex.childNodes[0]
                                        let isGiveaway = false
                                        if (productNameContainer.innerText.indexOf('Giveaway') !== -1 && !isATeamGiveaway(productNameContainer.innerText)) {
                                            isGiveaway = true
                                        }

                                        let priceParent = flex.childNodes[6]
                                        let priceValue = priceParent.childNodes[0]
                                        let price = parseInt(priceValue.wholeText.split('$')[1])
                                        let entity = {customer: username, is_giveaway: isGiveaway, price: price}
                                        console.log('setting entity to ', entity)
                                        GM_setValue('newEvent', entity)
                                    }, 2000)
                                } catch(e) {
                                    console.log('an error occured: ', e)
                                }
                            });
                        }
                    }
                });


                setTimeout(() => {
                    let eventLog = document.querySelector('[data-test-id=virtuoso-item-list]');
                    console.log(eventLog)
                    if (!eventLog) {
                        console.log('event log is not found')
                        return
                    }
                    observer.observe(eventLog, {
                        childList: true,
                    });
                    console.log("New event observer is started")
                }, 5000)
                console.log("New event observer is init")
            }
            soldCategory.addEventListener('click', mouseHandler)


        });
        console.log("Username sender is started")
    } else {
        function setReactInput(node, value) {
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                window.HTMLInputElement.prototype,
                'value').set;
            nativeInputValueSetter.call(node, value);
            const event = new Event('input', { bubbles: true });
            node.dispatchEvent(event);
        }

        const newEventEvent = 'new_event_event'
        let price = 1
        setInterval(() => {
            let event = GM_getValue('newEvent', null)
            if (!event) {
                console.log('new event not found yet')
                return
            }
            console.log('got event', event)
            GM_setValue("newEvent", null)
            window.dispatchEvent(new CustomEvent(newEventEvent, { detail: {event: event} }));
        }, 1500)
        console.log("Username receiver is started")
    }
})();