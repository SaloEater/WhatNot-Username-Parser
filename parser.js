// ==UserScript==
// @name         WhatNot Username Parser
// @namespace    http://tampermonkey.net/
// @version      2024-03-24.011
// @description  Parse sold events and send them to the system
// @author       You
// @match        https://www.whatnot.com/live/*
// @match        http://localhost:3000/break/*
// @match        https://whatnot-frontend.vercel.app/break/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_addStyle
// @run-at document-idle
// ==/UserScript==

GM_addStyle(`
.mob-chat {
 max-height: 90% !important;
 top: 10% !important;
}
.mob-price {
 position: absolute;
 z-index: 999;
 right: 0.5%;
 top: 0.5%;
 height: '';
}
.mob-price-child {
 background-color: black;
}
.bottom-container {
 background-color: rgba(0, 0, 0, 0);
 height: 100% !important;
}
.mob-chat-parent:first-child {
 height: 100%;
 background: '';
}
.mob-last-buyer {
 position: absolute !important;
 right: 1% !important;
 top: 1% !important;
 width: 90% !important;
}
.mob-last-buyer > :first-child {
 background-color: black;
}
.mob-chat-parent {
 justify-content: end !important;
}
.mob-online {
 position: absolute;
 left: 0;
 top: 0;
}
`);

(function() {
    'use strict';

    const currentURL = document.URL.toString()
    console.log(currentURL)

    function getElementByXpath(path) {
        return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    }

    function createToolsNode() {
        var parentNode = document.createElement('div');
        parentNode.style.position = 'fixed';
        parentNode.style.top = '50%';
        parentNode.style.right = '0';
        parentNode.style.transform = 'translateY(-50%)';
        parentNode.style.backgroundColor = 'green';
        parentNode.style.padding = '10px';
        parentNode.style.fontSize = '2em'; // 2 times bigger font size
        parentNode.style.zIndex = '9000'; // Set a high z-index
        document.body.appendChild(parentNode);
        return parentNode
    }

    let toolsNode = createToolsNode()

    // Add a dropdown list for selecting tools
    function createToolSelector(parentNode) {
        var toolSelector = document.createElement('select');
        toolSelector.style.marginBottom = '10px'; // Add some margin for spacing
        parentNode.appendChild(toolSelector);

        var button = document.createElement('button')
        button.textContent = 'X'
        parentNode.appendChild(button);

        button.addEventListener('click', function () {
            document.body.removeChild(toolsNode)
        })

        var toolContainer = document.createElement('div')
        parentNode.appendChild(toolContainer);

        // Define tool options
        var toolOptions = [
            { name: 'Username Parser', tool: createUsernameParserTool },
            { name: 'Chat Only', tool: createChatOnlyTool },
            { name: 'Notes', tool: createNotesTool},
        ];

        // Populate dropdown options
        toolOptions.forEach(function(option) {
            var optionElement = document.createElement('option');
            optionElement.value = option.name;
            optionElement.textContent = option.name;
            toolSelector.appendChild(optionElement);
        });

        // Function to hide all tool interfaces
        function hideAllToolInterfaces() {
            // Remove all child nodes from the parent node
            while (toolContainer.firstChild) {
                toolContainer.removeChild(toolContainer.firstChild);
            }
        }

        toolSelector.addEventListener('change', function() {
            var selectedTool = toolOptions.find(option => option.name === toolSelector.value);
            hideAllToolInterfaces()
            selectedTool.tool(toolContainer);
        });
        toolOptions[0].tool(toolContainer);
    }

    // Call createToolSelector to add the dropdown list
    createToolSelector(toolsNode);

    function createUsernameParserTool(parentNode) {
        function start() {
            if (currentURL.indexOf('live') !== -1) {
                var element = null;
                var usernameList = []

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

                let prev = null
                let id = setInterval(() => {
                    let buttons = Array.from(document.querySelectorAll('h5'))
                    let optionsButtons = buttons.filter(i => i.textContent == 'Sold')
                    let soldCategory = optionsButtons.length > 0 ? optionsButtons[0] : null
                    if (soldCategory === null) {
                        console.log("didn't find sold category")
                        return;
                    }
                    console.log('found sold category', soldCategory)
                    console.log(soldCategory)
                    soldCategory.style.backgroundColor = 'green';
                    console.log("Username parser is init")

                    function mouseHandler() {
                        clearInterval(id)
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
                                            //console.log(['new added node', addedNode, index])
                                            if (index.value !== '0') {
                                                return
                                            }
                                            console.log('adding')
                                            setTimeout(() => {
                                                try {
                                                    const sentElement = document.createElement('div');
                                                    let divListingItem = divItem.childNodes[0]
                                                    let divDisplayFlex = divListingItem.childNodes[0]
                                                    let divFlex = divDisplayFlex.childNodes[0]

                                                    let entity = {customer: '?', price: 0, name: ''}

                                                    if (divFlex.childNodes.length > 7) {
                                                        let divColumn = divFlex.childNodes[4]
                                                        let p = divColumn.childNodes[2]
                                                        let span = p.childNodes[2]
                                                        let username = span.childNodes[0].wholeText

                                                        let productNameContainer = divFlex.childNodes[0]

                                                        let priceParent = divFlex.childNodes[6]
                                                        let priceValue = priceParent.childNodes[0]
                                                        let price = parseInt(priceValue.wholeText.split('$')[1])
                                                        entity = {customer: username, price: price, name: productNameContainer.innerText}
                                                    } else {
                                                        let divDirColumn = divFlex.childNodes[2]
                                                        let p = divDirColumn.childNodes[2]
                                                        let span = p.childNodes[2]
                                                        let username = span.childNodes[0].wholeText

                                                        let productNameContainer = divFlex.childNodes[0]

                                                        entity = {customer: username, price: 0, name: productNameContainer.innerText}
                                                    }

                                                    // Set the text content
                                                    sentElement.textContent = 'Sent';

                                                    // Set the styles
                                                    sentElement.style.backgroundColor = 'green';
                                                    sentElement.style.color = 'white';
                                                    sentElement.style.padding = '5px'; // Optional: Add padding for better appearance
                                                    sentElement.style.borderRadius = '5px'; // Optional: Add rounded corners for better appearance

                                                    // Append the new element to the existing element
                                                    divListingItem.appendChild(sentElement);
                                                    console.log('setting entity to ', entity)
                                                    GM_setValue('newEvent', entity)
                                                } catch (e) {
                                                    console.log('element is preparing: ', e)
                                                }
                                            }, 2000)
                                        } catch(e) {
                                            console.log('an error occured: ', e)
                                        }
                                    });
                                }
                            }
                        });


                        setTimeout(() => {
                            let eventLog = document.querySelector('[data-testid=virtuoso-item-list]');
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
                        soldCategory.style.backgroundColor = 'red';
                        console.log("New event observer is init")
                    }
                    if (prev != null) {
                        prev.removeEventListener('click', mouseHandler)
                        prev.style.backgroundColor = '';
                    }
                    prev = soldCategory
                    soldCategory.addEventListener('click', mouseHandler)
                }, 10000)
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
                parentNode.removeChild(parentDiv)
            }
        }

        // Create a new div for the quantity tool
        var parentDiv = document.createElement('div');
        parentDiv.style.border = '1px solid black'; // Add border
        parentDiv.style.padding = '10px'; // Add padding for spacing

        // Create a button
        const dButton = document.createElement('button');
        dButton.textContent = 'Turn On';
        parentDiv.appendChild(dButton);

        dButton.addEventListener('click', async () => {
            dButton.disabled = true
            dButton.textContent = 'Is active';
            start()
        })

        parentNode.appendChild(parentDiv)
    }

    function createChatOnlyTool(parentNode) {
        function removeNonRelatedNodes(rootElement, targetElements) {
            const queue = [rootElement]; // Queue to traverse the DOM tree
            let targetHit = false;

            while (queue.length > 0) {
                const currentElement = queue.shift(); // Dequeue current element
                if (!targetHit) {
                    currentElement.style.height = '100%';
                    currentElement.style.width = '100%';
                }
                if (targetElements.includes(currentElement)) {
                    targetHit = true;
                }
                // Check if the current element is not related to any target elements
                if (!targetElements.some(targetElement => currentElement && targetElement && (currentElement === targetElement || currentElement.contains(targetElement) || targetElement.contains(currentElement)))) {
                    // Remove the current element
                    currentElement.parentNode.removeChild(currentElement);
                } else {
                    // Add the children of the current element to the queue for further traversal
                    Array.from(currentElement.children).forEach(child => queue.push(child));
                }
            }
        }

        // Create a new div for the quantity tool
        var parentDiv = document.createElement('div');
        parentDiv.style.border = '1px solid black'; // Add border
        parentDiv.style.padding = '10px'; // Add padding for spacing

        // Create a button
        const dButton = document.createElement('button');
        dButton.textContent = 'Clean page';
        parentDiv.appendChild(dButton);

        dButton.addEventListener('click', async () => {
            const rootElement = document.body;
            const chatWindow = document.querySelector('#bottom-section-stream-container > div > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(3)')
            let bottomContainer = document.querySelector('#bottom-section-stream-container')
            chatWindow.classList.add('mob-chat')
            let chatWindowParent = chatWindow.parentNode
            chatWindowParent.classList.add('mob-chat-parent')
            bottomContainer.classList.add('bottom-container')
            const targetElements = [
                chatWindow,
                document.querySelector('#app > div > div.fresnel-container.fresnel-lessThan-lg.Z9_Zr > div:nth-child(2) > div:nth-child(1) > div > div > video'),
                document.querySelector('#bottom-section-stream-container > div > div:nth-child(1) > div:nth-child(2) > div:nth-child(2)'),
                document.querySelector('#bottom-section-stream-container > div > div:nth-child(1) > div:nth-child(1) > div:nth-child(3) > div:nth-child(1)'),
                document.querySelector('#top-section-stream-container > div:nth-child(1) > div:nth-child(2) > div > div > div:nth-child(1)')
                // Add other target elements here
            ];
            console.log(targetElements);
            removeNonRelatedNodes(rootElement, targetElements); // Call the function to remove non-related nodes

            var styleElement = document.createElement('style');
            styleElement.type = 'text/css';
            styleElement.innerHTML = '#bottom-section-stream-container > div > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) * { background-color: rgba(0, 0, 0, 0.1) !important; }';
            document.head.appendChild(styleElement);


            function updateNestedStyles(element, property, value) {
                // Apply the style to the current element
                element.style[property] = value

                // Recursively apply the style to all child elements
                Array.from(element.children).forEach(child => {
                    updateNestedStyles(child, property, value);
                });
            }

            const price = targetElements[2]
            if (price) {
                price.classList.add('mob-price')

                price.childNodes.forEach(i => {
                    i.classList.add('mob-price-child')
                })
                // Call the function to update styles for all nested children
                updateNestedStyles(price, 'font-size', '35px');
                updateNestedStyles(price, 'line-height', '');
            }

            const lastBuyer = targetElements[3]
            if (lastBuyer) {
                lastBuyer.classList.add('mob-last-buyer')
            }


            parentNode.removeChild(parentDiv);
        });


        parentNode.appendChild(parentDiv);
    }


    function createNotesTool(parentNode) {
        // Create a new div for the quantity tool
        const parentDiv = document.createElement('div');
        parentDiv.style.border = '1px solid black'; // Add border
        parentDiv.style.padding = '10px'; // Add padding for spacing

        // Create a textarea
        const textarea = document.createElement('textarea');
        textarea.placeholder = 'Notes';
        textarea.style.width = '150px'; // Adjust width as necessary
        textarea.rows = 4; // Set number of visible rows
        parentDiv.appendChild(textarea);

        // Create a button
        const setNotesButton = document.createElement('button');
        setNotesButton.textContent = 'Set notes';
        parentDiv.appendChild(setNotesButton);

        setNotesButton.addEventListener('click', () => {
            // Replace line breaks with "\n" character
            const text = textarea.value

            // Assuming you have a specific textarea to update
            const textAreaToUpdate = document.querySelector('body > div.ReactModalPortal > div > div > div.B7Gw0 > div:nth-child(7) > textarea');

            // Set the value of the specific textarea
            const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(
                window.HTMLTextAreaElement.prototype,
                'value'
            ).set;
            nativeTextAreaValueSetter.call(textAreaToUpdate, text);

            // Dispatch input event to notify any listeners
            const event = new Event('input', { bubbles: true });
            textAreaToUpdate.dispatchEvent(event);
        });

        parentNode.appendChild(parentDiv);
    }

})();